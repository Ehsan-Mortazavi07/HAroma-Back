import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { VipPlan } from '../../vip-plans/schemas/vip-plan.schema';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: VipPlan.name, required: true })
  plan!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amountPaid!: number;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ default: 'active', enum: ['active', 'expired', 'cancelled'] })
  status!: string;

  @Prop({ default: '' })
  paymentRef?: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });
