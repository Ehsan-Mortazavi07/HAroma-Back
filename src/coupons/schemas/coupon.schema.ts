import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ min: 0, max: 100, default: 0 })
  discountPercent!: number;

  @Prop({ min: 0, default: 0 })
  discountAmount!: number;

  @Prop({ min: 0, default: 0 })
  minPurchase!: number;

  @Prop({ min: 0, default: null })
  maxDiscount?: number | null;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;

  @Prop({ default: 100 })
  usageLimit!: number;

  @Prop({ default: 0 })
  usedCount!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  deleted!: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ deleted: 1 });
