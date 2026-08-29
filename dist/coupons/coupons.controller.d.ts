import { CouponsService } from './coupons.service';
import { CreateCouponDto, ValidateCouponDto } from './dtos';
export declare class CouponsController {
    private readonly couponsService;
    constructor(couponsService: CouponsService);
    validateCoupon(dto: ValidateCouponDto): Promise<{
        valid: boolean;
        code: string;
        discountAmount: number;
        discountPercent: number;
        message: string;
    }>;
    adminListCoupons(q?: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/coupon.schema").CouponDocument, {}, {}> & import("./schemas/coupon.schema").Coupon & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminGetCoupon(id: string): Promise<import("./schemas/coupon.schema").CouponDocument>;
    adminCreateCoupon(dto: CreateCouponDto): Promise<import("./schemas/coupon.schema").CouponDocument>;
    adminUpdateCoupon(id: string, dto: Partial<CreateCouponDto>): Promise<import("./schemas/coupon.schema").CouponDocument>;
    adminDeleteCoupon(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
