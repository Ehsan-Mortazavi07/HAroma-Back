export declare class CreateCouponDto {
    code: string;
    discountPercent?: number;
    discountAmount?: number;
    minPurchase?: number;
    maxDiscount?: number;
    expiresAt?: Date;
    usageLimit?: number;
    isActive?: boolean;
}
export declare class ValidateCouponDto {
    code: string;
    cartAmount: number;
}
