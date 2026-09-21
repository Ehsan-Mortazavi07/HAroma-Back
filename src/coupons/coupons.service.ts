import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument } from './schemas/coupon.schema';
import { CreateCouponDto, ValidateCouponDto } from './dtos';

@Injectable()
export class CouponsService implements OnModuleInit {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async onModuleInit() {
    // Purge legacy soft-deleted documents from database
    await this.couponModel.deleteMany({ deleted: true }).catch(() => {});
  }

  async create(createCouponDto: CreateCouponDto): Promise<CouponDocument> {
    const code = createCouponDto.code.toUpperCase().trim();
    const existing = await this.couponModel.findOne({ code, deleted: false });
    if (existing) {
      throw new ConflictException('کد تخفیف با این عبارت از قبل وجود دارد.');
    }

    const coupon = new this.couponModel({
      ...createCouponDto,
      code,
    });
    return coupon.save();
  }

  async findAll(query?: { q?: string }) {
    const filter: any = { deleted: false };
    if (query?.q) {
      filter.code = { $regex: query.q, $options: 'i' };
    }
    return this.couponModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findOne({ _id: id, deleted: false }).exec();
    if (!coupon) {
      throw new NotFoundException('کد تخفیف مورد نظر یافت نشد.');
    }
    return coupon;
  }

  async validateCoupon(dto: ValidateCouponDto) {
    const code = dto.code.toUpperCase().trim();
    const coupon = await this.couponModel.findOne({ code, deleted: false }).exec();

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('کد تخفیف وارد شده نامعتبر یا غیرفعال است.');
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new BadRequestException('مهلت استفاده از این کد تخفیف به پایان رسیده است.');
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('ظرفیت استفاده از این کد تخفیف تکمیل شده است.');
    }

    if (coupon.minPurchase > 0 && dto.cartAmount < coupon.minPurchase) {
      throw new BadRequestException(
        `حداقل مبلغ سفارش برای استفاده از این کد تخفیف ${coupon.minPurchase.toLocaleString(
          'fa-IR',
        )} تومان است.`,
      );
    }

    let calculatedDiscount = 0;
    if (coupon.discountPercent > 0) {
      calculatedDiscount = Math.round((dto.cartAmount * coupon.discountPercent) / 100);
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscount);
      }
    } else if (coupon.discountAmount > 0) {
      calculatedDiscount = coupon.discountAmount;
    }

    // Discount cannot exceed cart amount
    calculatedDiscount = Math.min(calculatedDiscount, dto.cartAmount);

    return {
      valid: true,
      code: coupon.code,
      discountAmount: calculatedDiscount,
      discountPercent: coupon.discountPercent,
      message: 'کد تخفیف با موفقیت اعمال شد.',
    };
  }

  async incrementUsage(code: string) {
    await this.couponModel.updateOne(
      { code: code.toUpperCase().trim(), deleted: false },
      { $inc: { usedCount: 1 } },
    );
  }

  async update(id: string, updateCouponDto: Partial<CreateCouponDto>): Promise<CouponDocument> {
    if (updateCouponDto.code) {
      updateCouponDto.code = updateCouponDto.code.toUpperCase().trim();
    }
    const coupon = await this.couponModel
      .findOneAndUpdate(
        { _id: id, deleted: false },
        { $set: updateCouponDto },
        { new: true, runValidators: false },
      )
      .exec();
    if (!coupon) {
      throw new NotFoundException('کد تخفیف مورد نظر یافت نشد.');
    }
    return coupon;
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const coupon = await this.findById(id);
    await this.couponModel.deleteOne({ _id: coupon._id });
    return { success: true, message: 'کد تخفیف با موفقیت حذف شد.' };
  }

  async bulkUpdateStatus(
    ids: string[],
    isActive: boolean,
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.couponModel.updateMany(
      { _id: { $in: validIds }, deleted: false },
      { $set: { isActive } },
    );
    return { success: true, modifiedCount: result.modifiedCount };
  }

  async bulkSoftDelete(ids: string[]): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.couponModel.deleteMany({
      _id: { $in: validIds },
    });
    return { success: true, modifiedCount: result.deletedCount || 0 };
  }
}
