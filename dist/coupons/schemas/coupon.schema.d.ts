import { Document } from 'mongoose';
export type CouponDocument = Coupon & Document;
export declare class Coupon {
    code: string;
    discountPercent: number;
    discountAmount: number;
    minPurchase: number;
    maxDiscount?: number | null;
    expiresAt?: Date | null;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
    deleted: boolean;
}
export declare const CouponSchema: import("mongoose").Schema<Coupon, import("mongoose").Model<Coupon, any, any, any, Document<unknown, any, Coupon, any, {}> & Coupon & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Coupon, Document<unknown, {}, import("mongoose").FlatRecord<Coupon>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Coupon> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
