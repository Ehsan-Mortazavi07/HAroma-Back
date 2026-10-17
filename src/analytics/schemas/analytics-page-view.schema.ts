import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';

export type AnalyticsPageViewDocument = AnalyticsPageView & Document;

@Schema({ timestamps: false, collection: 'analytics_page_views' })
export class AnalyticsPageView {
  @Prop({ required: true, unique: true })
  viewId!: string;

  @Prop({ required: true })
  sessionId!: string;

  @Prop({ required: true })
  visitorId!: string;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  user?: Types.ObjectId | null;

  @Prop({ required: true })
  path!: string;

  /** home | products | product | cart | checkout | vip | profile | auth | blog | about | consultation | other */
  @Prop({ required: true })
  pageType!: string;

  @Prop({ type: Types.ObjectId, ref: Product.name, default: null })
  product?: Types.ObjectId | null;

  @Prop({ default: '' })
  search!: string;

  @Prop({ type: Date, required: true })
  enteredAt!: Date;

  /** Engaged seconds on this page. */
  @Prop({ default: 0, min: 0 })
  duration!: number;

  /** Deepest scroll position reached, 0-100. */
  @Prop({ default: 0, min: 0, max: 100 })
  scrollDepth!: number;
}

export const AnalyticsPageViewSchema = SchemaFactory.createForClass(AnalyticsPageView);
AnalyticsPageViewSchema.index({ enteredAt: -1 });
AnalyticsPageViewSchema.index({ sessionId: 1, enteredAt: 1 });
AnalyticsPageViewSchema.index({ product: 1, enteredAt: -1 });
AnalyticsPageViewSchema.index({ user: 1, enteredAt: -1 });
AnalyticsPageViewSchema.index({ visitorId: 1, enteredAt: -1 });
