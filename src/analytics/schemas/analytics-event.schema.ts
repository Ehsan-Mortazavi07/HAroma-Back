import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';

export type AnalyticsEventDocument = AnalyticsEvent & Document;

export const ANALYTICS_EVENT_NAMES = ['add_to_cart', 'begin_checkout', 'purchase'] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

@Schema({ timestamps: false, collection: 'analytics_events' })
export class AnalyticsEvent {
  @Prop({ type: String, required: true, enum: ANALYTICS_EVENT_NAMES })
  name!: AnalyticsEventName;

  @Prop({ required: true })
  sessionId!: string;

  @Prop({ required: true })
  visitorId!: string;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  user?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Product.name, default: null })
  product?: Types.ObjectId | null;

  @Prop({ default: 0, min: 0 })
  quantity!: number;

  @Prop({ default: 0, min: 0 })
  value!: number;

  @Prop({ type: Date, required: true })
  at!: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);
AnalyticsEventSchema.index({ at: -1, name: 1 });
AnalyticsEventSchema.index({ product: 1, name: 1, at: -1 });
AnalyticsEventSchema.index({ sessionId: 1 });
