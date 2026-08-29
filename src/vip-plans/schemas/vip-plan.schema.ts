import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VipPlanDocument = VipPlan & Document;

@Schema({ timestamps: true })
export class VipPlan {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true, default: '' })
  titleEn?: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ default: '' })
  descriptionEn?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 1, default: 30 })
  durationDays!: number;

  @Prop({ min: 0, max: 100, default: 10 })
  discountPercent!: number;

  @Prop({ type: [String], default: [] })
  perks!: string[];

  @Prop({ type: [String], default: [] })
  perksEn?: string[];

  @Prop({ default: '#d4af37' })
  badgeColor?: string;

  @Prop({ default: false })
  isPopular!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  deleted!: boolean;
}

export const VipPlanSchema = SchemaFactory.createForClass(VipPlan);
VipPlanSchema.index({ isActive: 1 });
VipPlanSchema.index({ deleted: 1 });
