import { Model } from 'mongoose';
import { Coupon, CouponDocument } from './schemas/coupon.schema';
import { CreateCouponDto, ValidateCouponDto } from './dtos';
export declare class CouponsService {
    private couponModel;
    constructor(couponModel: Model<CouponDocument>);
    create(createCouponDto: CreateCouponDto): Promise<CouponDocument>;
    findAll(query?: {
        q?: string;
    }): Promise<(import("mongoose").Document<unknown, {}, CouponDocument, {}, {}> & Coupon & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findById(id: string): Promise<CouponDocument>;
    validateCoupon(dto: ValidateCouponDto): Promise<{
        valid: boolean;
        code: string;
        discountAmount: number;
        discountPercent: number;
        message: string;
    }>;
    incrementUsage(code: string): Promise<void>;
    update(id: string, updateCouponDto: Partial<CreateCouponDto>): Promise<CouponDocument>;
    softDelete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
