import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { AnalyticsSession, AnalyticsSessionDocument } from './schemas/analytics-session.schema';
import { AnalyticsPageView, AnalyticsPageViewDocument } from './schemas/analytics-page-view.schema';
import { AnalyticsEvent, AnalyticsEventDocument } from './schemas/analytics-event.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Subscription, SubscriptionDocument } from '../subscriptions/schemas/subscription.schema';
import { VipPlan, VipPlanDocument } from '../vip-plans/schemas/vip-plan.schema';
import { OrderStatus } from '../common/enums';
import { normalizeSearchQuery } from '../common/utils/search.util';
import { parsePage, parsePageSize } from '../common/utils/pagination.util';
import {
  Bucket,
  Granularity,
  TEHRAN_MONGO_TZ,
  addDays,
  bucketForDay,
  enumerateBuckets,
  startOfJalaliPeriod,
  startOfTehranDay,
} from '../common/utils/jalali.util';
import { ProductReportQueryDto, ReportRangeQueryDto, VisitorReportQueryDto } from './dtos';

const LIVE_WINDOW_MS = 5 * 60 * 1000;
const MAX_RANGE_DAYS = 366 * 6;
const PIPELINE_STATUSES = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED];

export interface ReportRange {
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  granularity: Granularity;
  buckets: Bucket[];
}

type Row = Record<string, any>;

const dayOf = (field: string) => ({
  $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: TEHRAN_MONGO_TZ },
});
const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};
const ratio = (part: number, whole: number) => (whole > 0 ? round((part / whole) * 100, 1) : 0);

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(AnalyticsSession.name) private sessionModel: Model<AnalyticsSessionDocument>,
    @InjectModel(AnalyticsPageView.name) private pageViewModel: Model<AnalyticsPageViewDocument>,
    @InjectModel(AnalyticsEvent.name) private eventModel: Model<AnalyticsEventDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(VipPlan.name) private vipPlanModel: Model<VipPlanDocument>,
  ) {}

  // --------------------------------------------------------------------------
  // Range helpers
  // --------------------------------------------------------------------------

  resolveRange(query: ReportRangeQueryDto = {}): ReportRange {
    const now = new Date();
    let to = query.to ? new Date(query.to) : now;
    let from = query.from ? new Date(query.from) : startOfTehranDay(addDays(now, -29));
    if (Number.isNaN(to.getTime())) to = now;
    if (Number.isNaN(from.getTime()) || from >= to) from = startOfTehranDay(addDays(to, -29));
    if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 86_400_000) {
      from = addDays(to, -MAX_RANGE_DAYS);
    }

    const days = (to.getTime() - from.getTime()) / 86_400_000;
    const granularity: Granularity =
      query.granularity || (days <= 62 ? 'day' : days <= 750 ? 'month' : 'year');
    const span = to.getTime() - from.getTime();

    return {
      from,
      to,
      prevFrom: new Date(from.getTime() - span),
      prevTo: from,
      granularity,
      buckets: enumerateBuckets(from, to, granularity),
    };
  }

  /** Sums per-day rows (`_id` = Tehran `YYYY-MM-DD`) into the range's Jalali buckets. */
  private rollup(rows: Row[], range: ReportRange, fields: string[], setFields: string[] = []) {
    const byKey = new Map<string, Row>();
    for (const bucket of range.buckets) {
      const entry: Row = { key: bucket.key, label: bucket.label };
      for (const field of fields) entry[field] = 0;
      for (const field of setFields) entry[field] = new Set<string>();
      byKey.set(bucket.key, entry);
    }
    for (const row of rows) {
      const entry = byKey.get(bucketForDay(row._id, range.granularity).key);
      if (!entry) continue;
      for (const field of fields) entry[field] += Number(row[field]) || 0;
      for (const field of setFields) for (const id of row[field] || []) entry[field].add(String(id));
    }
    return [...byKey.values()].map((entry) => {
      for (const field of setFields) entry[field] = entry[field].size;
      return entry;
    });
  }

  private orderMatch(from: Date, to: Date, extra: Row = {}) {
    return { deleted: false, createdAt: { $gte: from, $lt: to }, ...extra };
  }

  private validOrderMatch(from: Date, to: Date) {
    return this.orderMatch(from, to, { status: { $ne: OrderStatus.CANCELLED } });
  }

  private rangeOut(range: ReportRange) {
    return {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      prevFrom: range.prevFrom.toISOString(),
      prevTo: range.prevTo.toISOString(),
      granularity: range.granularity,
    };
  }

  // --------------------------------------------------------------------------
  // Shared aggregates
  // --------------------------------------------------------------------------

  private async salesTotals(from: Date, to: Date) {
    const [orders] = await this.orderModel.aggregate([
      { $match: this.validOrderMatch(from, to) },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          gross: { $sum: '$subtotal' },
          couponDiscounts: { $sum: '$couponDiscount' },
          vipDiscounts: { $sum: '$vipDiscount' },
          shipping: { $sum: '$shippingFee' },
          tax: { $sum: '$tax' },
          net: { $sum: '$total' },
          itemsSold: { $sum: { $sum: '$items.quantity' } },
          buyers: { $addToSet: '$user' },
        },
      },
    ]);
    const [subscriptions] = await this.subscriptionModel.aggregate([
      { $match: { createdAt: { $gte: from, $lt: to }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amountPaid' } } },
    ]);
    const net = orders?.net || 0;
    const count = orders?.orders || 0;
    const subscriptionRevenue = subscriptions?.revenue || 0;
    return {
      orders: count,
      gross: orders?.gross || 0,
      couponDiscounts: orders?.couponDiscounts || 0,
      vipDiscounts: orders?.vipDiscounts || 0,
      discounts: (orders?.couponDiscounts || 0) + (orders?.vipDiscounts || 0),
      shipping: orders?.shipping || 0,
      tax: orders?.tax || 0,
      net,
      itemsSold: orders?.itemsSold || 0,
      buyers: orders?.buyers?.length || 0,
      aov: count ? round(net / count) : 0,
      subscriptions: subscriptions?.count || 0,
      subscriptionRevenue,
      income: net + subscriptionRevenue,
    };
  }

  private async trafficTotals(from: Date, to: Date) {
    const [result] = await this.sessionModel.aggregate([
      { $match: { startedAt: { $gte: from, $lt: to } } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                sessions: { $sum: 1 },
                duration: { $sum: '$duration' },
                pageViews: { $sum: '$pageViews' },
                bounces: { $sum: { $cond: [{ $lte: ['$pageViews', 1] }, 1, 0] } },
              },
            },
          ],
          visitors: [
            { $group: { _id: '$visitorId', isNew: { $max: '$isNewVisitor' } } },
            { $group: { _id: null, visitors: { $sum: 1 }, newVisitors: { $sum: { $cond: ['$isNew', 1, 0] } } } },
          ],
          users: [{ $match: { user: { $ne: null } } }, { $group: { _id: '$user' } }, { $count: 'count' }],
        },
      },
    ]);
    const totals = result?.totals?.[0] || {};
    const visitors = result?.visitors?.[0] || {};
    const sessions = totals.sessions || 0;
    return {
      sessions,
      visitors: visitors.visitors || 0,
      newVisitors: visitors.newVisitors || 0,
      returningVisitors: (visitors.visitors || 0) - (visitors.newVisitors || 0),
      loggedInUsers: result?.users?.[0]?.count || 0,
      pageViews: totals.pageViews || 0,
      totalDuration: totals.duration || 0,
      avgSessionDuration: sessions ? round(totals.duration / sessions) : 0,
      pagesPerSession: sessions ? round(totals.pageViews / sessions, 2) : 0,
      bounceRate: ratio(totals.bounces || 0, sessions),
    };
  }

  private async liveSnapshot() {
    const since = new Date(Date.now() - LIVE_WINDOW_MS);
    const active = await this.sessionModel
      .find({ lastSeenAt: { $gte: since } }, { sessionId: 1, visitorId: 1, user: 1, device: 1 })
      .lean();
    const sessionIds = active.map((session) => session.sessionId);
    const pages = sessionIds.length
      ? await this.pageViewModel.aggregate([
          { $match: { sessionId: { $in: sessionIds } } },
          { $sort: { enteredAt: -1 } },
          { $group: { _id: '$sessionId', path: { $first: '$path' } } },
          { $group: { _id: '$path', visitors: { $sum: 1 } } },
          { $sort: { visitors: -1 } },
          { $limit: 8 },
        ])
      : [];
    return {
      visitors: new Set(active.map((session) => session.visitorId)).size,
      loggedIn: active.filter((session) => session.user).length,
      mobile: active.filter((session) => session.device !== 'desktop').length,
      pages: pages.map((page) => ({ path: page._id, visitors: page.visitors })),
    };
  }

  // --------------------------------------------------------------------------
  // Overview
  // --------------------------------------------------------------------------

  async overview(query: ReportRangeQueryDto, includeFinance: boolean) {
    const range = this.resolveRange(query);
    const [sales, prevSales, traffic, prevTraffic, live, salesByDay, trafficByDay, periods, newCustomers, recentOrders, funnel, prevFunnel] =
      await Promise.all([
        this.salesTotals(range.from, range.to),
        this.salesTotals(range.prevFrom, range.prevTo),
        this.trafficTotals(range.from, range.to),
        this.trafficTotals(range.prevFrom, range.prevTo),
        this.liveSnapshot(),
        this.orderModel.aggregate([
          { $match: this.validOrderMatch(range.from, range.to) },
          { $group: { _id: dayOf('createdAt'), revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        ]),
        this.sessionModel.aggregate([
          { $match: { startedAt: { $gte: range.from, $lt: range.to } } },
          {
            $group: {
              _id: dayOf('startedAt'),
              sessions: { $sum: 1 },
              pageViews: { $sum: '$pageViews' },
              visitors: { $addToSet: '$visitorId' },
            },
          },
        ]),
        includeFinance ? this.periodSummaries() : Promise.resolve(null),
        this.newCustomerCount(range.from, range.to),
        this.orderModel
          .find({ deleted: false })
          .sort({ createdAt: -1 })
          .limit(8)
          .select('orderNumber total status paymentMethod createdAt deliveryAddress.fullName items.quantity')
          .lean(),
        this.funnel(range.from, range.to),
        this.funnel(range.prevFrom, range.prevTo),
      ]);

    const revenueSeries = this.rollup(salesByDay, range, ['revenue', 'orders']);
    const trafficSeries = this.rollup(trafficByDay, range, ['sessions', 'pageViews'], ['visitors']);
    const series = revenueSeries.map((entry, index) => ({
      ...entry,
      ...trafficSeries[index],
      revenue: includeFinance ? entry.revenue : 0,
    }));

    const withPrev = (current: number, previous: number) => ({ value: current, previous });
    return {
      range: this.rangeOut(range),
      live,
      kpis: {
        revenue: includeFinance ? withPrev(sales.income, prevSales.income) : null,
        orders: withPrev(sales.orders, prevSales.orders),
        aov: includeFinance ? withPrev(sales.aov, prevSales.aov) : null,
        itemsSold: withPrev(sales.itemsSold, prevSales.itemsSold),
        buyers: withPrev(sales.buyers, prevSales.buyers),
        newCustomers: withPrev(newCustomers, 0),
        visitors: withPrev(traffic.visitors, prevTraffic.visitors),
        sessions: withPrev(traffic.sessions, prevTraffic.sessions),
        pageViews: withPrev(traffic.pageViews, prevTraffic.pageViews),
        avgSessionDuration: withPrev(traffic.avgSessionDuration, prevTraffic.avgSessionDuration),
        bounceRate: withPrev(traffic.bounceRate, prevTraffic.bounceRate),
        // Sessions that ended in a tracked purchase; orders placed before tracking existed are not attributable.
        conversionRate: withPrev(ratio(funnel.purchased, funnel.sessions), ratio(prevFunnel.purchased, prevFunnel.sessions)),
      },
      series,
      periods,
      recentOrders: recentOrders.map((order: any) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.deliveryAddress?.fullName || '',
        total: includeFinance ? order.total : null,
        status: order.status,
        paymentMethod: order.paymentMethod,
        items: (order.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
        createdAt: order.createdAt,
      })),
    };
  }

  private async newCustomerCount(from: Date, to: Date): Promise<number> {
    const [result] = await this.orderModel.aggregate([
      { $match: { deleted: false, status: { $ne: OrderStatus.CANCELLED }, createdAt: { $lt: to } } },
      { $group: { _id: '$user', firstOrderAt: { $min: '$createdAt' } } },
      { $match: { firstOrderAt: { $gte: from } } },
      { $count: 'count' },
    ]);
    return result?.count || 0;
  }

  /** Fixed calendar periods an accountant checks daily, independent of the selected range. */
  private async periodSummaries() {
    const now = new Date();
    const today = startOfTehranDay(now);
    const monthStart = startOfJalaliPeriod(now, 'month');
    const lastMonthStart = startOfJalaliPeriod(addDays(monthStart, -1), 'month');
    const yearStart = startOfJalaliPeriod(now, 'year');
    const lastYearStart = startOfJalaliPeriod(addDays(yearStart, -1), 'year');
    const periods: [string, Date, Date][] = [
      ['today', today, now],
      ['yesterday', addDays(today, -1), today],
      ['last7Days', addDays(today, -6), now],
      ['thisMonth', monthStart, now],
      ['lastMonth', lastMonthStart, monthStart],
      ['thisYear', yearStart, now],
      ['lastYear', lastYearStart, yearStart],
      ['allTime', new Date(0), now],
    ];
    const results = await Promise.all(periods.map(([, from, to]) => this.salesTotals(from, to)));
    return periods.map(([key, from, to], index) => ({
      key,
      from: from.toISOString(),
      to: to.toISOString(),
      orders: results[index].orders,
      net: results[index].net,
      subscriptionRevenue: results[index].subscriptionRevenue,
      income: results[index].income,
      discounts: results[index].discounts,
      aov: results[index].aov,
    }));
  }

  // --------------------------------------------------------------------------
  // Finance
  // --------------------------------------------------------------------------

  async finance(query: ReportRangeQueryDto) {
    const range = this.resolveRange(query);
    const all = this.orderMatch(range.from, range.to);
    const valid = this.validOrderMatch(range.from, range.to);

    const [summary, previous, periods, facets, subscriptionFacets, categories, inventory, newCustomers] =
      await Promise.all([
        this.salesTotals(range.from, range.to),
        this.salesTotals(range.prevFrom, range.prevTo),
        this.periodSummaries(),
        this.orderModel.aggregate([
          { $match: all },
          {
            $facet: {
              byDay: [
                {
                  $group: {
                    _id: dayOf('createdAt'),
                    orders: { $sum: { $cond: [{ $ne: ['$status', OrderStatus.CANCELLED] }, 1, 0] } },
                    gross: { $sum: { $cond: [{ $ne: ['$status', OrderStatus.CANCELLED] }, '$subtotal', 0] } },
                    discounts: {
                      $sum: {
                        $cond: [
                          { $ne: ['$status', OrderStatus.CANCELLED] },
                          { $add: ['$couponDiscount', '$vipDiscount'] },
                          0,
                        ],
                      },
                    },
                    shipping: { $sum: { $cond: [{ $ne: ['$status', OrderStatus.CANCELLED] }, '$shippingFee', 0] } },
                    tax: { $sum: { $cond: [{ $ne: ['$status', OrderStatus.CANCELLED] }, '$tax', 0] } },
                    net: { $sum: { $cond: [{ $ne: ['$status', OrderStatus.CANCELLED] }, '$total', 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, '$total', 0] } },
                    cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 1, 0] } },
                  },
                },
              ],
              byStatus: [{ $group: { _id: '$status', orders: { $sum: 1 }, amount: { $sum: '$total' } } }],
              byPayment: [
                { $match: { status: { $ne: OrderStatus.CANCELLED } } },
                { $group: { _id: '$paymentMethod', orders: { $sum: 1 }, amount: { $sum: '$total' } } },
                { $sort: { amount: -1 } },
              ],
              byShipping: [
                { $match: { status: { $ne: OrderStatus.CANCELLED } } },
                { $group: { _id: '$shippingMethod', orders: { $sum: 1 }, fees: { $sum: '$shippingFee' } } },
                { $sort: { orders: -1 } },
              ],
              byProvince: [
                { $match: { status: { $ne: OrderStatus.CANCELLED } } },
                { $group: { _id: '$deliveryAddress.province', orders: { $sum: 1 }, amount: { $sum: '$total' } } },
                { $sort: { amount: -1 } },
                { $limit: 31 },
              ],
              coupons: [
                { $match: { status: { $ne: OrderStatus.CANCELLED }, couponCode: { $nin: ['', null] } } },
                {
                  $group: {
                    _id: { $toUpper: '$couponCode' },
                    uses: { $sum: 1 },
                    discount: { $sum: '$couponDiscount' },
                    amount: { $sum: '$total' },
                  },
                },
                { $sort: { uses: -1 } },
                { $limit: 20 },
              ],
              segments: [
                { $match: { status: { $ne: OrderStatus.CANCELLED } } },
                {
                  $group: {
                    _id: { $cond: [{ $gt: ['$vipDiscount', 0] }, 'vip', 'regular'] },
                    orders: { $sum: 1 },
                    amount: { $sum: '$total' },
                  },
                },
              ],
              pipeline: [
                {
                  $group: {
                    _id: null,
                    delivered: { $sum: { $cond: [{ $eq: ['$status', OrderStatus.DELIVERED] }, '$total', 0] } },
                    inProgress: { $sum: { $cond: [{ $in: ['$status', PIPELINE_STATUSES] }, '$total', 0] } },
                    codOutstanding: {
                      $sum: {
                        $cond: [
                          { $and: [{ $eq: ['$paymentMethod', 'cod'] }, { $in: ['$status', PIPELINE_STATUSES] }] },
                          '$total',
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
              topProducts: [
                { $match: { status: { $ne: OrderStatus.CANCELLED } } },
                { $unwind: '$items' },
                {
                  $group: {
                    _id: '$items.product',
                    title: { $first: '$items.title' },
                    image: { $first: '$items.image' },
                    quantity: { $sum: '$items.quantity' },
                    amount: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    orders: { $addToSet: '$_id' },
                  },
                },
                { $addFields: { orders: { $size: '$orders' } } },
                { $sort: { amount: -1 } },
                { $limit: 15 },
              ],
              topCustomers: [
                { $match: { status: { $ne: OrderStatus.CANCELLED } } },
                { $group: { _id: '$user', orders: { $sum: 1 }, amount: { $sum: '$total' }, lastOrderAt: { $max: '$createdAt' } } },
                { $sort: { amount: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                {
                  $project: {
                    orders: 1,
                    amount: 1,
                    lastOrderAt: 1,
                    fullName: '$user.fullName',
                    username: '$user.username',
                    phone: '$user.phone',
                    isVip: '$user.isVip',
                  },
                },
              ],
            },
          },
        ]),
        this.subscriptionModel.aggregate([
          { $match: { createdAt: { $gte: range.from, $lt: range.to }, status: { $ne: 'cancelled' } } },
          {
            $facet: {
              byDay: [{ $group: { _id: dayOf('createdAt'), subscriptions: { $sum: '$amountPaid' } } }],
              byPlan: [
                { $group: { _id: '$plan', count: { $sum: 1 }, amount: { $sum: '$amountPaid' } } },
                { $lookup: { from: 'vipplans', localField: '_id', foreignField: '_id', as: 'plan' } },
                { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
                { $project: { count: 1, amount: 1, title: '$plan.title' } },
                { $sort: { amount: -1 } },
              ],
            },
          },
        ]),
        this.revenueByCategory(valid),
        this.inventoryValuation(),
        this.newCustomerCount(range.from, range.to),
      ]);

    const f = facets[0] || {};
    const s = subscriptionFacets[0] || {};
    const subscriptionByDay = new Map<string, number>((s.byDay || []).map((row: Row) => [row._id, row.subscriptions]));
    const dayRows = [...(f.byDay || [])];
    for (const [day, amount] of subscriptionByDay) {
      const row = dayRows.find((entry) => entry._id === day);
      if (row) row.subscriptions = amount;
      else dayRows.push({ _id: day, subscriptions: amount });
    }
    const series = this.rollup(dayRows, range, [
      'orders', 'gross', 'discounts', 'shipping', 'tax', 'net', 'cancelled', 'cancelledOrders', 'subscriptions',
    ]).map((entry) => ({ ...entry, income: entry.net + entry.subscriptions }));

    const pipeline = f.pipeline?.[0] || {};
    const cancelledTotals = (f.byStatus || []).find((row: Row) => row._id === OrderStatus.CANCELLED) || {};
    const allOrders = (f.byStatus || []).reduce((sum: number, row: Row) => sum + row.orders, 0);
    const best = series.reduce((top, entry) => (entry.income > (top?.income ?? -1) ? entry : top), null as Row | null);

    return {
      range: this.rangeOut(range),
      summary: {
        ...summary,
        newCustomers,
        returningCustomers: Math.max(0, summary.buyers - newCustomers),
        cancelledOrders: cancelledTotals.orders || 0,
        cancelledAmount: cancelledTotals.amount || 0,
        cancellationRate: ratio(cancelledTotals.orders || 0, allOrders),
        discountRate: ratio(summary.discounts, summary.gross),
        deliveredRevenue: pipeline.delivered || 0,
        inProgressRevenue: pipeline.inProgress || 0,
        codOutstanding: pipeline.codOutstanding || 0,
        avgDailyIncome: range.buckets.length && range.granularity === 'day' ? round(summary.income / range.buckets.length) : null,
        bestPeriod: best && best.income > 0 ? { label: best.label, income: best.income } : null,
      },
      previous,
      periods,
      series,
      byStatus: (f.byStatus || []).map((row: Row) => ({ status: row._id, orders: row.orders, amount: row.amount })),
      byPayment: (f.byPayment || []).map((row: Row) => ({ method: row._id, orders: row.orders, amount: row.amount })),
      byShipping: (f.byShipping || []).map((row: Row) => ({ method: row._id || 'standard', orders: row.orders, fees: row.fees })),
      byProvince: (f.byProvince || []).map((row: Row) => ({ province: row._id || '—', orders: row.orders, amount: row.amount })),
      coupons: (f.coupons || []).map((row: Row) => ({ code: row._id, uses: row.uses, discount: row.discount, amount: row.amount })),
      segments: (f.segments || []).map((row: Row) => ({ segment: row._id, orders: row.orders, amount: row.amount })),
      topProducts: (f.topProducts || []).map((row: Row) => ({
        productId: row._id,
        title: row.title,
        image: row.image,
        quantity: row.quantity,
        amount: row.amount,
        orders: row.orders,
      })),
      topCustomers: f.topCustomers || [],
      byCategory: categories,
      vipPlans: (s.byPlan || []).map((row: Row) => ({ planId: row._id, title: row.title || '—', count: row.count, amount: row.amount })),
      inventory,
    };
  }

  /** Attributes each order line to the product's first category so totals are not double counted. */
  private async revenueByCategory(match: Row) {
    const rows = await this.orderModel.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product', pipeline: [{ $project: { categories: 1 } }] } },
      { $addFields: { category: { $first: { $ifNull: [{ $first: '$product.categories' }, []] } } } },
      {
        $group: {
          _id: '$category',
          quantity: { $sum: '$items.quantity' },
          amount: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { quantity: 1, amount: 1, name: '$category.name', nameEn: '$category.nameEn' } },
      { $sort: { amount: -1 } },
    ]);
    return rows.map((row) => ({
      categoryId: row._id,
      name: row.name || 'بدون دسته‌بندی',
      nameEn: row.nameEn || 'Uncategorized',
      quantity: row.quantity,
      amount: row.amount,
    }));
  }

  /** Stock valued at current selling price (cost prices are not recorded yet). */
  private async inventoryValuation() {
    const products = await this.productModel
      .find({ deleted: false }, { title: 1, slug: 1, price: 1, discountPrice: 1, stockCount: 1, inStock: 1, variants: 1, images: 1 })
      .lean();
    let units = 0;
    let retailValue = 0;
    let outOfStock = 0;
    const lowStock: Row[] = [];
    for (const product of products as any[]) {
      const lines = product.variants?.length
        ? product.variants.map((variant: any) => ({ price: variant.discountPrice || variant.price, stock: variant.stockCount || 0, label: variant.title }))
        : [{ price: product.discountPrice || product.price, stock: product.stockCount || 0, label: '' }];
      const stock = lines.reduce((sum: number, line: Row) => sum + line.stock, 0);
      units += stock;
      retailValue += lines.reduce((sum: number, line: Row) => sum + line.price * line.stock, 0);
      if (stock <= 0 || product.inStock === false) outOfStock++;
      else if (stock <= 3) lowStock.push({ productId: product._id, title: product.title, slug: product.slug, stock });
    }
    return {
      products: products.length,
      units,
      retailValue,
      outOfStock,
      lowStock: lowStock.sort((a, b) => a.stock - b.stock).slice(0, 12),
    };
  }

  // --------------------------------------------------------------------------
  // Traffic & behaviour
  // --------------------------------------------------------------------------

  async traffic(query: ReportRangeQueryDto) {
    const range = this.resolveRange(query);
    const sessionMatch = { startedAt: { $gte: range.from, $lt: range.to } };
    const viewMatch = { enteredAt: { $gte: range.from, $lt: range.to } };
    const topBy = (field: string, limit = 10): PipelineStage.FacetPipelineStage[] => [
      { $group: { _id: `$${field}`, sessions: { $sum: 1 }, duration: { $sum: '$duration' } } },
      { $sort: { sessions: -1 } },
      { $limit: limit },
    ];

    const [summary, previous, live, sessionFacets, viewFacets, funnel] = await Promise.all([
      this.trafficTotals(range.from, range.to),
      this.trafficTotals(range.prevFrom, range.prevTo),
      this.liveSnapshot(),
      this.sessionModel.aggregate([
        { $match: sessionMatch },
        {
          $facet: {
            byDay: [
              {
                $group: {
                  _id: dayOf('startedAt'),
                  sessions: { $sum: 1 },
                  pageViews: { $sum: '$pageViews' },
                  duration: { $sum: '$duration' },
                  bounces: { $sum: { $cond: [{ $lte: ['$pageViews', 1] }, 1, 0] } },
                  visitors: { $addToSet: '$visitorId' },
                  newVisitors: { $addToSet: { $cond: ['$isNewVisitor', '$visitorId', '$$REMOVE'] } },
                },
              },
            ],
            referrers: topBy('referrer', 12),
            utm: [{ $match: { utmSource: { $ne: '' } } }, ...topBy('utmSource', 10)],
            devices: topBy('device', 5),
            browsers: topBy('browser', 8),
            os: topBy('os', 8),
            landing: [{ $match: { landingPath: { $ne: '' } } }, ...topBy('landingPath', 10)],
            exits: [{ $match: { exitPath: { $ne: '' } } }, ...topBy('exitPath', 10)],
            heatmap: [
              {
                $group: {
                  _id: {
                    day: { $dayOfWeek: { date: '$startedAt', timezone: TEHRAN_MONGO_TZ } },
                    hour: { $hour: { date: '$startedAt', timezone: TEHRAN_MONGO_TZ } },
                  },
                  sessions: { $sum: 1 },
                },
              },
            ],
            durations: [
              {
                $bucket: {
                  groupBy: '$duration',
                  boundaries: [0, 10, 30, 60, 180, 600, 1800],
                  default: '1800+',
                  output: { sessions: { $sum: 1 } },
                },
              },
            ],
            depth: [
              {
                $bucket: {
                  groupBy: '$pageViews',
                  boundaries: [0, 2, 3, 5, 10],
                  default: '10+',
                  output: { sessions: { $sum: 1 } },
                },
              },
            ],
          },
        },
      ]),
      this.pageViewModel.aggregate([
        { $match: viewMatch },
        {
          $facet: {
            pages: [
              {
                $group: {
                  _id: '$path',
                  pageType: { $first: '$pageType' },
                  product: { $first: '$product' },
                  views: { $sum: 1 },
                  visitors: { $addToSet: '$visitorId' },
                  duration: { $sum: '$duration' },
                  scroll: { $avg: '$scrollDepth' },
                },
              },
              { $sort: { views: -1 } },
              { $limit: 25 },
              { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productDoc', pipeline: [{ $project: { title: 1 } }] } },
            ],
            pageTypes: [
              { $group: { _id: '$pageType', views: { $sum: 1 }, duration: { $sum: '$duration' } } },
              { $sort: { views: -1 } },
            ],
            searches: [
              { $match: { search: { $ne: '' } } },
              { $group: { _id: { $toLower: '$search' }, count: { $sum: 1 }, visitors: { $addToSet: '$visitorId' } } },
              { $sort: { count: -1 } },
              { $limit: 20 },
            ],
          },
        },
      ]),
      this.funnel(range.from, range.to),
    ]);

    const sf = sessionFacets[0] || {};
    const vf = viewFacets[0] || {};
    const series = this.rollup(sf.byDay || [], range, ['sessions', 'pageViews', 'duration', 'bounces'], ['visitors', 'newVisitors']).map(
      (entry) => ({
        ...entry,
        avgDuration: entry.sessions ? round(entry.duration / entry.sessions) : 0,
        bounceRate: ratio(entry.bounces, entry.sessions),
      }),
    );

    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const cell of sf.heatmap || []) {
      // Mongo: 1 = Sunday … 7 = Saturday. Re-index so 0 = Saturday (Iranian week start).
      heatmap[cell._id.day % 7][cell._id.hour] = cell.sessions;
    }
    const mapTop = (rows: Row[] = []) =>
      rows.map((row) => ({ name: row._id || '—', sessions: row.sessions, avgDuration: row.sessions ? round(row.duration / row.sessions) : 0 }));

    return {
      range: this.rangeOut(range),
      summary,
      previous,
      live,
      series,
      referrers: mapTop(sf.referrers),
      utmSources: mapTop(sf.utm),
      devices: mapTop(sf.devices),
      browsers: mapTop(sf.browsers),
      os: mapTop(sf.os),
      landingPages: mapTop(sf.landing),
      exitPages: mapTop(sf.exits),
      heatmap,
      durationBuckets: (sf.durations || []).map((row: Row) => ({ bucket: String(row._id), sessions: row.sessions })),
      depthBuckets: (sf.depth || []).map((row: Row) => ({ bucket: String(row._id), sessions: row.sessions })),
      topPages: (vf.pages || []).map((row: Row) => ({
        path: row._id,
        pageType: row.pageType,
        title: row.productDoc?.[0]?.title || '',
        views: row.views,
        visitors: row.visitors.length,
        avgTime: row.views ? round(row.duration / row.views) : 0,
        avgScroll: round(row.scroll),
      })),
      pageTypes: (vf.pageTypes || []).map((row: Row) => ({
        type: row._id,
        views: row.views,
        avgTime: row.views ? round(row.duration / row.views) : 0,
      })),
      searches: (vf.searches || []).map((row: Row) => ({ term: row._id, count: row.count, visitors: row.visitors.length })),
      funnel,
    };
  }

  private async funnel(from: Date, to: Date) {
    const sessionsInRange = { startedAt: { $gte: from, $lt: to } };
    const sessionIds = (await this.sessionModel.find(sessionsInRange, { sessionId: 1 }).lean()).map((row) => row.sessionId);
    if (!sessionIds.length) {
      return { sessions: 0, viewedProduct: 0, addedToCart: 0, beganCheckout: 0, purchased: 0 };
    }
    const [viewedProduct, cartView, checkoutView, addedToCart, beganCheckoutEvent, purchased] = await Promise.all([
      this.pageViewModel.distinct('sessionId', { sessionId: { $in: sessionIds }, pageType: 'product' }),
      this.pageViewModel.distinct('sessionId', { sessionId: { $in: sessionIds }, pageType: 'cart' }),
      this.pageViewModel.distinct('sessionId', { sessionId: { $in: sessionIds }, pageType: 'checkout' }),
      this.eventModel.distinct('sessionId', { sessionId: { $in: sessionIds }, name: 'add_to_cart' }),
      this.eventModel.distinct('sessionId', { sessionId: { $in: sessionIds }, name: 'begin_checkout' }),
      this.eventModel.distinct('sessionId', { sessionId: { $in: sessionIds }, name: 'purchase' }),
    ]);
    return {
      sessions: sessionIds.length,
      viewedProduct: viewedProduct.length,
      addedToCart: new Set([...addedToCart, ...cartView]).size,
      beganCheckout: new Set([...checkoutView, ...beganCheckoutEvent]).size,
      purchased: purchased.length,
    };
  }

  // --------------------------------------------------------------------------
  // Products
  // --------------------------------------------------------------------------

  async products(query: ProductReportQueryDto, includeFinance: boolean) {
    const range = this.resolveRange(query);
    const [views, carts, sales, products] = await Promise.all([
      this.pageViewModel.aggregate([
        { $match: { enteredAt: { $gte: range.from, $lt: range.to }, product: { $ne: null } } },
        {
          $group: {
            _id: '$product',
            views: { $sum: 1 },
            visitors: { $addToSet: '$visitorId' },
            duration: { $sum: '$duration' },
            scroll: { $avg: '$scrollDepth' },
          },
        },
      ]),
      this.eventModel.aggregate([
        { $match: { at: { $gte: range.from, $lt: range.to }, name: 'add_to_cart', product: { $ne: null } } },
        { $group: { _id: '$product', addToCart: { $sum: 1 }, cartQuantity: { $sum: '$quantity' } } },
      ]),
      this.orderModel.aggregate([
        { $match: this.validOrderMatch(range.from, range.to) },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            quantity: { $sum: '$items.quantity' },
            amount: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $addToSet: '$_id' },
          },
        },
      ]),
      this.productModel
        .find({ deleted: false }, { title: 1, titleEn: 1, slug: 1, images: 1, price: 1, discountPrice: 1, stockCount: 1, inStock: 1, isPublished: 1, isVipOnly: 1, variants: 1 })
        .lean(),
    ]);

    const index = new Map<string, Row>();
    const entry = (id: unknown) => {
      const key = String(id);
      if (!index.has(key)) {
        index.set(key, { productId: key, views: 0, visitors: 0, totalTime: 0, avgTime: 0, avgScroll: 0, addToCart: 0, quantity: 0, amount: 0, orders: 0 });
      }
      return index.get(key)!;
    };
    for (const row of views) {
      Object.assign(entry(row._id), {
        views: row.views,
        visitors: row.visitors.length,
        totalTime: row.duration,
        avgTime: row.views ? round(row.duration / row.views) : 0,
        avgScroll: round(row.scroll),
      });
    }
    for (const row of carts) Object.assign(entry(row._id), { addToCart: row.addToCart });
    for (const row of sales) Object.assign(entry(row._id), { quantity: row.quantity, amount: row.amount, orders: row.orders.length });

    const known = new Map((products as any[]).map((product) => [String(product._id), product]));
    for (const product of products as any[]) entry(product._id);

    const rows = [...index.values()]
      .filter((row) => known.has(row.productId) || row.amount > 0)
      .map((row): Row => {
        const product: any = known.get(row.productId) || {};
        const stock = product.variants?.length
          ? product.variants.reduce((sum: number, variant: any) => sum + (variant.stockCount || 0), 0)
          : product.stockCount || 0;
        return {
          ...row,
          title: product.title || '(محصول حذف‌شده)',
          titleEn: product.titleEn || '',
          slug: product.slug || '',
          image: product.images?.[0] || '',
          price: product.discountPrice || product.price || 0,
          stock,
          isPublished: product.isPublished !== false,
          isVipOnly: !!product.isVipOnly,
          cartRate: ratio(row.addToCart, row.views),
          conversion: ratio(row.orders, row.visitors || row.views),
          amount: includeFinance ? row.amount : null,
        };
      });

    const sortKey = ({ views: 'views', revenue: 'amount', quantity: 'quantity', addToCart: 'addToCart', conversion: 'conversion', avgTime: 'avgTime' } as Row)[
      query.sortBy || 'views'
    ] || 'views';
    rows.sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0));

    const totals = rows.reduce(
      (sum, row) => ({
        views: sum.views + row.views,
        addToCart: sum.addToCart + row.addToCart,
        quantity: sum.quantity + row.quantity,
        amount: sum.amount + (row.amount || 0),
        neverViewed: sum.neverViewed + (row.views === 0 ? 1 : 0),
        neverSold: sum.neverSold + (row.quantity === 0 ? 1 : 0),
      }),
      { views: 0, addToCart: 0, quantity: 0, amount: 0, neverViewed: 0, neverSold: 0 },
    );

    return { range: this.rangeOut(range), totals: { ...totals, amount: includeFinance ? totals.amount : null }, items: rows.slice(0, 300) };
  }

  async productDetail(productId: string, query: ReportRangeQueryDto, includeFinance: boolean) {
    if (!Types.ObjectId.isValid(productId)) throw new NotFoundException('محصول یافت نشد.');
    const range = this.resolveRange(query);
    const id = new Types.ObjectId(productId);
    const product = await this.productModel.findById(id, { title: 1, titleEn: 1, slug: 1, images: 1 }).lean();
    if (!product) throw new NotFoundException('محصول یافت نشد.');

    const [views, carts, sales, referrers] = await Promise.all([
      this.pageViewModel.aggregate([
        { $match: { product: id, enteredAt: { $gte: range.from, $lt: range.to } } },
        { $group: { _id: dayOf('enteredAt'), views: { $sum: 1 }, duration: { $sum: '$duration' }, visitors: { $addToSet: '$visitorId' } } },
      ]),
      this.eventModel.aggregate([
        { $match: { product: id, name: 'add_to_cart', at: { $gte: range.from, $lt: range.to } } },
        { $group: { _id: dayOf('at'), addToCart: { $sum: 1 } } },
      ]),
      this.orderModel.aggregate([
        { $match: this.validOrderMatch(range.from, range.to) },
        { $unwind: '$items' },
        { $match: { 'items.product': id } },
        {
          $group: {
            _id: dayOf('createdAt'),
            quantity: { $sum: '$items.quantity' },
            amount: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
      ]),
      this.pageViewModel.aggregate([
        { $match: { product: id, enteredAt: { $gte: range.from, $lt: range.to } } },
        { $lookup: { from: 'analytics_sessions', localField: 'sessionId', foreignField: 'sessionId', as: 'session', pipeline: [{ $project: { referrer: 1, device: 1 } }] } },
        { $unwind: '$session' },
        { $group: { _id: '$session.referrer', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const merged = new Map<string, Row>();
    for (const row of [...views, ...carts, ...sales]) merged.set(row._id, { ...(merged.get(row._id) || { _id: row._id }), ...row });
    const series = this.rollup([...merged.values()], range, ['views', 'duration', 'addToCart', 'quantity', 'amount'], ['visitors']).map(
      (entry) => ({ ...entry, amount: includeFinance ? entry.amount : 0, avgTime: entry.views ? round(entry.duration / entry.views) : 0 }),
    );
    return {
      range: this.rangeOut(range),
      product,
      series,
      referrers: referrers.map((row) => ({ name: row._id, views: row.views })),
    };
  }

  // --------------------------------------------------------------------------
  // Visitors & users
  // --------------------------------------------------------------------------

  async visitors(query: VisitorReportQueryDto, includeFinance: boolean) {
    const range = this.resolveRange(query);
    const page = parsePage(query.page);
    const pageSize = parsePageSize(query.pageSize, 20, 100);
    const type = query.type || 'users';
    const search = normalizeSearchQuery(query.q, 100);
    const sortField = ({ duration: 'duration', sessions: 'sessions', pageViews: 'pageViews', lastSeen: 'lastSeenAt', spent: 'spent' } as Row)[
      query.sortBy || 'lastSeen'
    ] || 'lastSeenAt';

    const base: PipelineStage[] = [
      { $match: { startedAt: { $gte: range.from, $lt: range.to }, user: type === 'users' ? { $ne: null } : null } },
      {
        $group: {
          _id: type === 'users' ? '$user' : '$visitorId',
          sessions: { $sum: 1 },
          duration: { $sum: '$duration' },
          pageViews: { $sum: '$pageViews' },
          firstSeenAt: { $min: '$startedAt' },
          lastSeenAt: { $max: '$lastSeenAt' },
          devices: { $addToSet: '$device' },
          referrers: { $addToSet: '$referrer' },
          landingPath: { $first: '$landingPath' },
        },
      },
    ];

    if (type === 'users') {
      base.push(
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user', pipeline: [{ $project: { fullName: 1, username: 1, phone: 1, email: 1, isVip: 1, role: 1, avatar: 1, createdAt: 1 } }] } },
        { $unwind: '$user' },
      );
      if (search) {
        base.push({
          $match: {
            $or: [
              { 'user.fullName': { $regex: search, $options: 'i' } },
              { 'user.username': { $regex: search, $options: 'i' } },
              { 'user.phone': { $regex: search, $options: 'i' } },
              { 'user.email': { $regex: search, $options: 'i' } },
            ],
          },
        });
      }
      base.push(
        {
          $lookup: {
            from: 'orders',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$user', '$$userId'] },
                  deleted: false,
                  status: { $ne: OrderStatus.CANCELLED },
                  createdAt: { $gte: range.from, $lt: range.to },
                },
              },
              { $group: { _id: null, orders: { $sum: 1 }, spent: { $sum: '$total' } } },
            ],
            as: 'orderStats',
          },
        },
        {
          $addFields: {
            orders: { $ifNull: [{ $first: '$orderStats.orders' }, 0] },
            spent: { $ifNull: [{ $first: '$orderStats.spent' }, 0] },
          },
        },
        { $project: { orderStats: 0 } },
      );
    } else if (search) {
      base.push({ $match: { $or: [{ _id: { $regex: search, $options: 'i' } }, { landingPath: { $regex: search, $options: 'i' } }] } });
    }

    const [result] = await this.sessionModel.aggregate([
      ...base,
      {
        $facet: {
          items: [{ $sort: { [type === 'guests' && sortField === 'spent' ? 'lastSeenAt' : sortField]: -1 } }, { $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const total = result?.total?.[0]?.count || 0;
    return {
      range: this.rangeOut(range),
      type,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items: (result?.items || []).map((row: Row) => ({
        key: String(row._id),
        user: row.user || null,
        sessions: row.sessions,
        duration: row.duration,
        avgSessionDuration: row.sessions ? round(row.duration / row.sessions) : 0,
        pageViews: row.pageViews,
        firstSeenAt: row.firstSeenAt,
        lastSeenAt: row.lastSeenAt,
        devices: row.devices,
        referrers: row.referrers.filter((referrer: string) => referrer !== '(direct)').slice(0, 3),
        landingPath: row.landingPath,
        orders: row.orders ?? 0,
        spent: includeFinance ? row.spent ?? 0 : null,
      })),
    };
  }

  /** Full activity profile for a registered user (24-char id) or an anonymous visitor id. */
  async visitorDetail(key: string, query: ReportRangeQueryDto, includeFinance: boolean) {
    const range = this.resolveRange(query);
    const isUser = /^[a-f0-9]{24}$/i.test(key);
    const owner = isUser ? { user: new Types.ObjectId(key) } : { visitorId: key };

    const user = isUser
      ? await this.userModel
          .findById(key, { fullName: 1, username: 1, phone: 1, email: 1, isVip: 1, vipExpiresAt: 1, role: 1, avatar: 1, province: 1, city: 1, createdAt: 1 })
          .lean()
      : null;
    if (isUser && !user) throw new NotFoundException('کاربر یافت نشد.');

    const [lifetime, sessions, byDay, products, pageTypes, orders, cartEvents] = await Promise.all([
      this.sessionModel.aggregate([
        { $match: owner },
        {
          $group: {
            _id: null,
            sessions: { $sum: 1 },
            duration: { $sum: '$duration' },
            pageViews: { $sum: '$pageViews' },
            firstSeenAt: { $min: '$startedAt' },
            lastSeenAt: { $max: '$lastSeenAt' },
            visitorIds: { $addToSet: '$visitorId' },
            devices: { $addToSet: '$device' },
            browsers: { $addToSet: '$browser' },
            os: { $addToSet: '$os' },
          },
        },
      ]),
      this.sessionModel.find({ ...owner, startedAt: { $gte: range.from, $lt: range.to } }).sort({ startedAt: -1 }).limit(40).lean(),
      this.sessionModel.aggregate([
        { $match: { ...owner, startedAt: { $gte: range.from, $lt: range.to } } },
        { $group: { _id: dayOf('startedAt'), sessions: { $sum: 1 }, duration: { $sum: '$duration' }, pageViews: { $sum: '$pageViews' } } },
      ]),
      this.pageViewModel.aggregate([
        { $match: { ...owner, product: { $ne: null }, enteredAt: { $gte: range.from, $lt: range.to } } },
        { $group: { _id: '$product', views: { $sum: 1 }, duration: { $sum: '$duration' }, lastViewedAt: { $max: '$enteredAt' } } },
        { $sort: { duration: -1 } },
        { $limit: 20 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product', pipeline: [{ $project: { title: 1, slug: 1, images: 1 } }] } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      ]),
      this.pageViewModel.aggregate([
        { $match: { ...owner, enteredAt: { $gte: range.from, $lt: range.to } } },
        { $group: { _id: '$pageType', views: { $sum: 1 }, duration: { $sum: '$duration' } } },
        { $sort: { duration: -1 } },
      ]),
      isUser
        ? this.orderModel
            .find({ user: new Types.ObjectId(key), deleted: false })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('orderNumber total status paymentMethod createdAt items.title items.quantity')
            .lean()
        : Promise.resolve([]),
      this.eventModel.countDocuments({ ...owner, name: 'add_to_cart', at: { $gte: range.from, $lt: range.to } }),
    ]);

    const sessionIds = sessions.map((session) => session.sessionId);
    const views = sessionIds.length
      ? await this.pageViewModel
          .find({ sessionId: { $in: sessionIds } }, { sessionId: 1, path: 1, pageType: 1, duration: 1, scrollDepth: 1, enteredAt: 1, product: 1 })
          .sort({ enteredAt: 1 })
          .populate('product', 'title')
          .lean()
      : [];
    const viewsBySession = new Map<string, Row[]>();
    for (const view of views as Row[]) {
      const list = viewsBySession.get(view.sessionId) || [];
      if (list.length < 60) list.push({ path: view.path, pageType: view.pageType, title: view.product?.title || '', duration: view.duration, scrollDepth: view.scrollDepth, enteredAt: view.enteredAt });
      viewsBySession.set(view.sessionId, list);
    }

    const life = lifetime[0] || {};
    const validOrders = (orders as Row[]).filter((order) => order.status !== OrderStatus.CANCELLED);
    return {
      range: this.rangeOut(range),
      key,
      isUser,
      user,
      lifetime: {
        sessions: life.sessions || 0,
        duration: life.duration || 0,
        pageViews: life.pageViews || 0,
        avgSessionDuration: life.sessions ? round(life.duration / life.sessions) : 0,
        firstSeenAt: life.firstSeenAt || null,
        lastSeenAt: life.lastSeenAt || null,
        devicesCount: life.visitorIds?.length || 0,
        devices: life.devices || [],
        browsers: life.browsers || [],
        os: life.os || [],
        orders: validOrders.length,
        spent: includeFinance ? validOrders.reduce((sum, order) => sum + (order.total || 0), 0) : null,
      },
      addToCart: cartEvents,
      series: this.rollup(byDay, range, ['sessions', 'duration', 'pageViews']),
      pageTypes: pageTypes.map((row) => ({ type: row._id, views: row.views, duration: row.duration })),
      products: products.map((row) => ({
        productId: row._id,
        title: row.product?.title || '—',
        slug: row.product?.slug || '',
        image: row.product?.images?.[0] || '',
        views: row.views,
        duration: row.duration,
        lastViewedAt: row.lastViewedAt,
      })),
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        startedAt: session.startedAt,
        lastSeenAt: session.lastSeenAt,
        duration: session.duration,
        pageViews: session.pageViews,
        device: session.device,
        browser: session.browser,
        os: session.os,
        referrer: session.referrer,
        landingPath: session.landingPath,
        exitPath: session.exitPath,
        pages: viewsBySession.get(session.sessionId) || [],
      })),
      orders: (orders as Row[]).map((order) => ({ ...order, total: includeFinance ? order.total : null })),
    };
  }
}
