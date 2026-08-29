import { OrderStatus, PaymentMethod } from '../../common/enums';
export declare class OrderItemDto {
    product: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    selectedAttributes?: string;
}
export declare class DeliveryAddressDto {
    fullName: string;
    phone: string;
    province: string;
    city: string;
    postalCode?: string;
    addressDetail: string;
}
export declare class CreateOrderDto {
    items: OrderItemDto[];
    deliveryAddress: DeliveryAddressDto;
    paymentMethod?: PaymentMethod;
    couponCode?: string;
    notes?: string;
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    trackingCode?: string;
}
