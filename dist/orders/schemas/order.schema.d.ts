import { Document, Types } from 'mongoose';
import { OrderStatus, PaymentMethod } from '../../common/enums';
export type OrderDocument = Order & Document;
export declare class OrderItem {
    product: Types.ObjectId;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    selectedAttributes?: string;
}
export declare const OrderItemSchema: import("mongoose").Schema<OrderItem, import("mongoose").Model<OrderItem, any, any, any, Document<unknown, any, OrderItem, any, {}> & OrderItem & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OrderItem, Document<unknown, {}, import("mongoose").FlatRecord<OrderItem>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<OrderItem> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class DeliveryAddress {
    fullName: string;
    phone: string;
    province: string;
    city: string;
    postalCode?: string;
    addressDetail: string;
}
export declare const DeliveryAddressSchema: import("mongoose").Schema<DeliveryAddress, import("mongoose").Model<DeliveryAddress, any, any, any, Document<unknown, any, DeliveryAddress, any, {}> & DeliveryAddress & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DeliveryAddress, Document<unknown, {}, import("mongoose").FlatRecord<DeliveryAddress>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<DeliveryAddress> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Order {
    orderNumber: string;
    user: Types.ObjectId;
    items: OrderItem[];
    deliveryAddress: DeliveryAddress;
    paymentMethod: PaymentMethod;
    subtotal: number;
    shippingFee: number;
    couponDiscount: number;
    vipDiscount: number;
    couponCode?: string;
    tax: number;
    total: number;
    status: OrderStatus;
    trackingCode?: string;
    notes?: string;
    deleted: boolean;
}
export declare const OrderSchema: import("mongoose").Schema<Order, import("mongoose").Model<Order, any, any, any, Document<unknown, any, Order, any, {}> & Order & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Order, Document<unknown, {}, import("mongoose").FlatRecord<Order>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Order> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
