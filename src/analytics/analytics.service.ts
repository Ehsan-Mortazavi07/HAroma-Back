import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnalyticsSession, AnalyticsSessionDocument } from './schemas/analytics-session.schema';
import { AnalyticsPageView, AnalyticsPageViewDocument } from './schemas/analytics-page-view.schema';
import {
  ANALYTICS_EVENT_NAMES,
  AnalyticsEvent,
  AnalyticsEventDocument,
  AnalyticsEventName,
} from './schemas/analytics-event.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { hasPanelAccess } from '../users/user-role.util';

const ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
const MAX_EVENTS_PER_BATCH = 40;
const MAX_VIEW_SECONDS = 6 * 60 * 60;
const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|facebookexternalhit|curl|wget|python|axios|node-fetch/i;

interface ClientContext {
  userAgent: string;
  user?: { _id: Types.ObjectId; role?: string } | null;
}

type RawEvent = Record<string, unknown>;

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly productSlugCache = new Map<string, Types.ObjectId | null>();

  constructor(
    @InjectModel(AnalyticsSession.name) private sessionModel: Model<AnalyticsSessionDocument>,
    @InjectModel(AnalyticsPageView.name) private pageViewModel: Model<AnalyticsPageViewDocument>,
    @InjectModel(AnalyticsEvent.name) private eventModel: Model<AnalyticsEventDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  /**
   * Ingests a beacon batch. Malformed input is dropped silently: the endpoint
   * is public and the browser never reads the response.
   */
  async collect(rawBody: unknown, context: ClientContext): Promise<void> {
    const body = this.parseBody(rawBody);
    if (!body) return;
    if (BOT_PATTERN.test(context.userAgent || '')) return;
    // Staff browsing the storefront would skew customer metrics.
    if (context.user && hasPanelAccess(context.user.role)) return;

    const visitorId = typeof body.v === 'string' && ID_PATTERN.test(body.v) ? body.v : null;
    const sessionId = typeof body.s === 'string' && ID_PATTERN.test(body.s) ? body.s : null;
    const events = Array.isArray(body.e) ? (body.e as RawEvent[]).slice(0, MAX_EVENTS_PER_BATCH) : [];
    if (!visitorId || !sessionId || events.length === 0) return;

    const userId = context.user?._id ? new Types.ObjectId(String(context.user._id)) : null;
    const firstView = events.find((event) => event?.t === 'view');
    const session = await this.ensureSession(sessionId, visitorId, userId, context.userAgent, firstView);
    if (!session) return;

    for (const event of events) {
      if (!event || typeof event !== 'object') continue;
      try {
        if (event.t === 'view') await this.recordView(event, session, userId);
        else if (event.t === 'ping') await this.recordPing(event, sessionId);
        else if (event.t === 'event') await this.recordEvent(event, sessionId, visitorId, userId);
      } catch (error) {
        this.logger.warn(`Dropped analytics event: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  private parseBody(rawBody: unknown): Record<string, unknown> | null {
    if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) {
      return rawBody as Record<string, unknown>;
    }
    if (typeof rawBody !== 'string' || rawBody.length > 32_000) return null;
    try {
      const parsed = JSON.parse(rawBody);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private async ensureSession(
    sessionId: string,
    visitorId: string,
    userId: Types.ObjectId | null,
    userAgent: string,
    firstView?: RawEvent,
  ): Promise<AnalyticsSessionDocument | null> {
    const now = new Date();
    const existing = await this.sessionModel.findOne({ sessionId });
    if (existing) {
      // A session id belongs to exactly one browser; ignore spoofed reuse.
      if (existing.visitorId !== visitorId) return null;
      existing.lastSeenAt = now;
      if (userId && !existing.user) existing.user = userId;
      await existing.save();
      return existing;
    }

    const landing = firstView ? this.parsePath(firstView.p) : null;
    const utm = firstView?.utm && typeof firstView.utm === 'object' ? (firstView.utm as RawEvent) : {};
    const hasPreviousVisit = await this.sessionModel.exists({ visitorId });
    try {
      return await this.sessionModel.create({
        sessionId,
        visitorId,
        user: userId,
        startedAt: now,
        lastSeenAt: now,
        landingPath: landing?.path || '',
        referrer: this.parseReferrer(firstView?.r),
        utmSource: this.cleanText(utm.source, 60),
        utmCampaign: this.cleanText(utm.campaign, 80),
        isNewVisitor: !hasPreviousVisit,
        ...this.parseUserAgent(userAgent),
      });
    } catch (error: any) {
      // Two concurrent beacons for a brand-new session: the other one won.
      if (error?.code === 11000) return this.sessionModel.findOne({ sessionId, visitorId });
      throw error;
    }
  }

  private async recordView(event: RawEvent, session: AnalyticsSessionDocument, userId: Types.ObjectId | null) {
    const viewId = typeof event.id === 'string' && ID_PATTERN.test(event.id) ? event.id : null;
    const parsed = this.parsePath(event.p);
    if (!viewId || !parsed) return;

    const product = parsed.productSlug ? await this.resolveProductSlug(parsed.productSlug) : null;
    try {
      await this.pageViewModel.create({
        viewId,
        sessionId: session.sessionId,
        visitorId: session.visitorId,
        user: userId || session.user || null,
        path: parsed.path,
        pageType: parsed.pageType,
        product,
        search: parsed.search,
        enteredAt: new Date(),
      });
    } catch (error: any) {
      if (error?.code === 11000) return; // Retried beacon.
      throw error;
    }

    await this.sessionModel.updateOne(
      { sessionId: session.sessionId },
      {
        $inc: { pageViews: 1 },
        $set: { exitPath: parsed.path, ...(session.landingPath ? {} : { landingPath: parsed.path }) },
      },
    );
  }

  private async recordPing(event: RawEvent, sessionId: string) {
    const viewId = typeof event.id === 'string' && ID_PATTERN.test(event.id) ? event.id : null;
    const seconds = Math.min(MAX_VIEW_SECONDS, Math.max(0, Math.round(Number(event.a) || 0)));
    const depth = Math.min(100, Math.max(0, Math.round(Number(event.d) || 0)));
    if (!viewId) return;

    const previous = await this.pageViewModel.findOneAndUpdate(
      { viewId, sessionId },
      { $max: { duration: seconds, scrollDepth: depth } },
      { new: false, projection: { duration: 1 } },
    );
    if (!previous) return;

    const delta = seconds - (previous.duration || 0);
    if (delta > 0) {
      await this.sessionModel.updateOne({ sessionId }, { $inc: { duration: delta } });
    }
  }

  private async recordEvent(
    event: RawEvent,
    sessionId: string,
    visitorId: string,
    userId: Types.ObjectId | null,
  ) {
    const name = event.n as AnalyticsEventName;
    if (!ANALYTICS_EVENT_NAMES.includes(name)) return;
    const productRef = typeof event.pid === 'string' ? event.pid : '';
    const product = Types.ObjectId.isValid(productRef) && productRef.length === 24
      ? new Types.ObjectId(productRef)
      : productRef
        ? await this.resolveProductSlug(productRef)
        : null;

    await this.eventModel.create({
      name,
      sessionId,
      visitorId,
      user: userId,
      product,
      quantity: Math.min(1000, Math.max(0, Math.round(Number(event.q) || 0))),
      value: Math.min(1e12, Math.max(0, Math.round(Number(event.val) || 0))),
      at: new Date(),
    });
  }

  private parsePath(value: unknown): { path: string; pageType: string; productSlug: string; search: string } | null {
    if (typeof value !== 'string' || !value.startsWith('/') || value.length > 500) return null;
    let url: URL;
    try {
      url = new URL(value, 'http://local');
    } catch {
      return null;
    }
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
    if (path.startsWith('/admin')) return null;

    const segments = path.split('/').filter(Boolean);
    const productSlug = segments[0] === 'products' && segments[1] ? segments[1].slice(0, 200) : '';
    const knownTypes = ['cart', 'checkout', 'vip', 'profile', 'auth', 'blog', 'about', 'consultation'];
    const pageType = path === '/'
      ? 'home'
      : productSlug
        ? 'product'
        : segments[0] === 'products'
          ? 'products'
          : knownTypes.includes(segments[0])
            ? segments[0]
            : 'other';

    return {
      path: path.slice(0, 300),
      pageType,
      productSlug,
      search: this.cleanText(url.searchParams.get('q'), 100),
    };
  }

  private parseReferrer(value: unknown): string {
    if (typeof value !== 'string' || !value) return '(direct)';
    try {
      const host = new URL(value).hostname.replace(/^www\./, '').toLowerCase();
      return host.slice(0, 120) || '(direct)';
    } catch {
      return '(direct)';
    }
  }

  private parseUserAgent(userAgent: string): { device: string; browser: string; os: string } {
    const ua = userAgent || '';
    const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua)
      ? 'tablet'
      : /mobi|iphone|ipod|android/i.test(ua)
        ? 'mobile'
        : 'desktop';
    const browser = /edg\//i.test(ua)
      ? 'Edge'
      : /opr\/|opera/i.test(ua)
        ? 'Opera'
        : /samsungbrowser/i.test(ua)
          ? 'Samsung Internet'
          : /firefox|fxios/i.test(ua)
            ? 'Firefox'
            : /chrome|crios/i.test(ua)
              ? 'Chrome'
              : /safari/i.test(ua)
                ? 'Safari'
                : 'other';
    const os = /iphone|ipad|ipod/i.test(ua)
      ? 'iOS'
      : /android/i.test(ua)
        ? 'Android'
        : /windows/i.test(ua)
          ? 'Windows'
          : /mac os x|macintosh/i.test(ua)
            ? 'macOS'
            : /linux/i.test(ua)
              ? 'Linux'
              : 'other';
    return { device, browser, os };
  }

  private cleanText(value: unknown, maxLength: number): string {
    return typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, '').trim().slice(0, maxLength) : '';
  }

  private async resolveProductSlug(slug: string): Promise<Types.ObjectId | null> {
    const key = slug.toLowerCase();
    if (this.productSlugCache.has(key)) return this.productSlugCache.get(key) ?? null;
    const product = await this.productModel.findOne({ slug: key }, { _id: 1 }).lean();
    const id = product ? (product._id as Types.ObjectId) : null;
    if (this.productSlugCache.size > 5_000) this.productSlugCache.clear();
    this.productSlugCache.set(key, id);
    return id;
  }
}
