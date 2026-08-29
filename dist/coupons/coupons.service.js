"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const coupon_schema_1 = require("./schemas/coupon.schema");
let CouponsService = class CouponsService {
    couponModel;
    constructor(couponModel) {
        this.couponModel = couponModel;
    }
    async create(createCouponDto) {
        const code = createCouponDto.code.toUpperCase().trim();
        const existing = await this.couponModel.findOne({ code, deleted: false });
        if (existing) {
            throw new common_1.ConflictException('کد تخفیف با این عبارت از قبل وجود دارد.');
        }
        const coupon = new this.couponModel({
            ...createCouponDto,
            code,
        });
        return coupon.save();
    }
    async findAll(query) {
        const filter = { deleted: false };
        if (query?.q) {
            filter.code = { $regex: query.q, $options: 'i' };
        }
        return this.couponModel.find(filter).sort({ createdAt: -1 }).exec();
    }
    async findById(id) {
        const coupon = await this.couponModel.findOne({ _id: id, deleted: false }).exec();
        if (!coupon) {
            throw new common_1.NotFoundException('کد تخفیف مورد نظر یافت نشد.');
        }
        return coupon;
    }
    async validateCoupon(dto) {
        const code = dto.code.toUpperCase().trim();
        const coupon = await this.couponModel.findOne({ code, deleted: false }).exec();
        if (!coupon || !coupon.isActive) {
            throw new common_1.BadRequestException('کد تخفیف وارد شده نامعتبر یا غیرفعال است.');
        }
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            throw new common_1.BadRequestException('مهلت استفاده از این کد تخفیف به پایان رسیده است.');
        }
        if (coupon.usedCount >= coupon.usageLimit) {
            throw new common_1.BadRequestException('ظرفیت استفاده از این کد تخفیف تکمیل شده است.');
        }
        if (coupon.minPurchase > 0 && dto.cartAmount < coupon.minPurchase) {
            throw new common_1.BadRequestException(`حداقل مبلغ سفارش برای استفاده از این کد تخفیف ${coupon.minPurchase.toLocaleString('fa-IR')} تومان است.`);
        }
        let calculatedDiscount = 0;
        if (coupon.discountPercent > 0) {
            calculatedDiscount = Math.round((dto.cartAmount * coupon.discountPercent) / 100);
            if (coupon.maxDiscount && coupon.maxDiscount > 0) {
                calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscount);
            }
        }
        else if (coupon.discountAmount > 0) {
            calculatedDiscount = coupon.discountAmount;
        }
        calculatedDiscount = Math.min(calculatedDiscount, dto.cartAmount);
        return {
            valid: true,
            code: coupon.code,
            discountAmount: calculatedDiscount,
            discountPercent: coupon.discountPercent,
            message: 'کد تخفیف با موفقیت اعمال شد.',
        };
    }
    async incrementUsage(code) {
        await this.couponModel.updateOne({ code: code.toUpperCase().trim(), deleted: false }, { $inc: { usedCount: 1 } });
    }
    async update(id, updateCouponDto) {
        const coupon = await this.findById(id);
        if (updateCouponDto.code) {
            updateCouponDto.code = updateCouponDto.code.toUpperCase().trim();
        }
        Object.assign(coupon, updateCouponDto);
        return coupon.save();
    }
    async softDelete(id) {
        const coupon = await this.findById(id);
        coupon.deleted = true;
        await coupon.save();
        return { success: true, message: 'کد تخفیف با موفقیت حذف شد.' };
    }
};
exports.CouponsService = CouponsService;
exports.CouponsService = CouponsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(coupon_schema_1.Coupon.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CouponsService);
//# sourceMappingURL=coupons.service.js.map