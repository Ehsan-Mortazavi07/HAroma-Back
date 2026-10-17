import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Brand, BrandDocument } from '../brands/schemas/brand.schema';
import { Attribute, AttributeDocument } from '../attributes/schemas/attribute.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Coupon, CouponDocument } from '../coupons/schemas/coupon.schema';
import { VipPlan, VipPlanDocument } from '../vip-plans/schemas/vip-plan.schema';
import {
  ConsultationConversation,
  ConsultationConversationDocument,
} from '../consultation-chat/schemas/consultation-chat.schema';
import { escapeRegex } from '../common/utils/search.util';
import { UserRole } from '../common/enums';

export type SearchGroup =
  | 'products'
  | 'orders'
  | 'users'
  | 'categories'
  | 'brands'
  | 'attributes'
  | 'coupons'
  | 'vipPlans'
  | 'chats';

export interface SearchHit {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  image?: string;
}

const PER_GROUP = 6;
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Admins type Persian digits and Arabic ی/ک freely; stored data may use either form. */
function normalizeQuery(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim()
    .slice(0, 80);
}

/** Matches ی/ي and ک/ك interchangeably so either spelling finds the record. */
function fuzzyRegex(query: string): RegExp {
  const pattern = escapeRegex(query).replace(/ی/g, '[یي]').replace(/ک/g, '[کك]');
  return new RegExp(pattern, 'i');
}

@Injectable()
export class AdminSearchService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Attribute.name) private attributeModel: Model<AttributeDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(VipPlan.name) private vipPlanModel: Model<VipPlanDocument>,
    @InjectModel(ConsultationConversation.name)
    private conversationModel: Model<ConsultationConversationDocument>,
  ) {}

  async search(rawQuery: string, role: string) {
    const query = normalizeQuery(rawQuery || '');
    const empty = { query, groups: {} as Partial<Record<SearchGroup, SearchHit[]>> };
    if (query.length < 2) return empty;

    const rx = fuzzyRegex(query);
    const isAdmin = role === UserRole.ADMIN;
    const live = { deleted: { $ne: true } };

    const jobs: [SearchGroup, Promise<SearchHit[]>][] = [
      [
        'products',
        this.productModel
          .find({ ...live, $or: [{ title: rx }, { titleEn: rx }, { slug: rx }, { shortDescription: rx }] })
          .select('title titleEn slug images price isPublished')
          .sort({ createdAt: -1 })
          .limit(PER_GROUP)
          .lean()
          .then((rows: any[]) =>
            rows.map((row) => ({
              id: String(row._id),
              title: row.title,
              subtitle: row.titleEn || row.slug,
              meta: row.isPublished === false ? 'پیش‌نویس' : undefined,
              image: row.images?.[0],
            })),
          ),
      ],
      [
        'orders',
        this.orderModel
          .find({
            ...live,
            $or: [
              { orderNumber: rx },
              { trackingCode: rx },
              { 'deliveryAddress.fullName': rx },
              { 'deliveryAddress.phone': rx },
              { 'items.title': rx },
            ],
          })
          .select('orderNumber total status deliveryAddress.fullName deliveryAddress.phone createdAt')
          .sort({ createdAt: -1 })
          .limit(PER_GROUP)
          .lean()
          .then((rows: any[]) =>
            rows.map((row) => ({
              id: String(row._id),
              title: row.orderNumber,
              subtitle: [row.deliveryAddress?.fullName, row.deliveryAddress?.phone].filter(Boolean).join(' · '),
              meta: row.status,
            })),
          ),
      ],
      [
        'categories',
        this.categoryModel
          .find({ ...live, $or: [{ name: rx }, { nameEn: rx }, { slug: rx }] })
          .select('name nameEn slug')
          .limit(PER_GROUP)
          .lean()
          .then((rows: any[]) => rows.map((row) => ({ id: String(row._id), title: row.name, subtitle: row.nameEn || row.slug }))),
      ],
      [
        'brands',
        this.brandModel
          .find({ ...live, $or: [{ name: rx }, { nameEn: rx }, { slug: rx }] })
          .select('name nameEn slug logo')
          .limit(PER_GROUP)
          .lean()
          .then((rows: any[]) =>
            rows.map((row) => ({ id: String(row._id), title: row.name, subtitle: row.nameEn || row.slug, image: row.logo })),
          ),
      ],
      [
        'attributes',
        this.attributeModel
          .find({ ...live, $or: [{ name: rx }, { nameEn: rx }, { key: rx }, { possibleValues: rx }] })
          .select('name nameEn key')
          .limit(PER_GROUP)
          .lean()
          .then((rows: any[]) => rows.map((row) => ({ id: String(row._id), title: row.name, subtitle: row.nameEn || row.key }))),
      ],
      [
        'chats',
        this.conversationModel
          .find({
            $or: [
              { guestName: rx },
              { guestPhone: rx },
              { guestEmail: rx },
              { guestUsername: rx },
              { subject: rx },
              { lastMessageText: rx },
            ],
          })
          .select('guestName subject status lastMessageText guestPhone')
          .sort({ lastMessageAt: -1 })
          .limit(PER_GROUP)
          .lean()
          .then((rows: any[]) =>
            rows.map((row) => ({
              id: String(row._id),
              title: row.guestName || 'مشتری',
              subtitle: row.subject ? `موضوع: ${row.subject}` : row.lastMessageText,
              meta: row.status,
            })),
          ),
      ],
    ];

    // Customer records, coupons and VIP plans are admin-only elsewhere in the panel.
    if (isAdmin) {
      jobs.push(
        [
          'users',
          this.userModel
            .find({ ...live, $or: [{ fullName: rx }, { username: rx }, { email: rx }, { phone: rx }] })
            .select('fullName username email phone role isVip avatar')
            .sort({ createdAt: -1 })
            .limit(PER_GROUP)
            .lean()
            .then((rows: any[]) =>
              rows.map((row) => ({
                id: String(row._id),
                title: row.fullName || row.username,
                subtitle: [row.phone, row.email, row.username ? `@${row.username}` : ''].filter(Boolean).join(' · '),
                meta: row.role === 'user' ? (row.isVip ? 'vip' : undefined) : row.role,
                image: row.avatar || undefined,
              })),
            ),
        ],
        [
          'coupons',
          this.couponModel
            .find({ ...live, code: rx })
            .select('code discountPercent isActive')
            .limit(PER_GROUP)
            .lean()
            .then((rows: any[]) =>
              rows.map((row) => ({
                id: String(row._id),
                title: row.code,
                subtitle: row.discountPercent ? `${row.discountPercent}٪ تخفیف` : undefined,
                meta: row.isActive === false ? 'غیرفعال' : undefined,
              })),
            ),
        ],
        [
          'vipPlans',
          this.vipPlanModel
            .find({ ...live, $or: [{ title: rx }, { titleEn: rx }, { description: rx }] })
            .select('title titleEn price')
            .limit(PER_GROUP)
            .lean()
            .then((rows: any[]) => rows.map((row) => ({ id: String(row._id), title: row.title, subtitle: row.titleEn }))),
        ],
      );
    }

    const settled = await Promise.allSettled(jobs.map(([, job]) => job));
    const groups: Partial<Record<SearchGroup, SearchHit[]>> = {};
    settled.forEach((result, index) => {
      const hits = result.status === 'fulfilled' ? result.value : [];
      if (hits.length) groups[jobs[index][0]] = hits;
    });
    return { query, groups };
  }
}
