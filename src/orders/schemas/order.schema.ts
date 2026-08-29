import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';
import { OrderStatus, PaymentMethod } from '../../common/enums';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 1, default: 1 })
  quantity!: number;

  @Prop({ default: '' })
  image?: string;

  @Prop({ default: '' })
  selectedAttributes?: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class DeliveryAddress {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, trim: true })
  province!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ default: '', trim: true })
  postalCode?: string;

  @Prop({ required: true, trim: true })
  addressDetail!: string;
}

export const DeliveryAddressSchema = SchemaFactory.createForClass(DeliveryAddress);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber!: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user!: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ type: DeliveryAddressSchema, required: true })
  deliveryAddress!: DeliveryAddress;

  @Prop({
    type: String,
    enum: PaymentMethod,
    default: PaymentMethod.ONLINE,
  })
  paymentMethod!: PaymentMethod;

  @Prop({ required: true, min: 0 })
  subtotal!: number;

  @Prop({ default: 0, min: 0 })
  shippingFee!: number;

  @Prop({ default: 0, min: 0 })
  couponDiscount!: number;

  @Prop({ default: 0, min: 0 })
  vipDiscount!: number;

  @Prop({ default: '' })
  couponCode?: string;

  @Prop({ default: 0, min: 0 })
  tax!: number;

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Prop({ default: '' })
  trackingCode?: string;

  @Prop({ default: '' })
  notes?: string;

  @Prop({ default: false })
  deleted!: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ deleted: 1 });
OrderSchema.index({ createdAt: -1 });
