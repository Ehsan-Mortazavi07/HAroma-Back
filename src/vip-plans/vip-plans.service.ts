import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VipPlan, VipPlanDocument } from './schemas/vip-plan.schema';
import { CreateVipPlanDto, UpdateVipPlanDto } from './dtos';

@Injectable()
export class VipPlansService {
  constructor(
    @InjectModel(VipPlan.name) private vipPlanModel: Model<VipPlanDocument>,
  ) {}

  async create(dto: CreateVipPlanDto): Promise<VipPlanDocument> {
    const plan = new this.vipPlanModel(dto);
    return plan.save();
  }

  async findAll(onlyActive = false) {
    const filter: any = { deleted: false };
    if (onlyActive) {
      filter.isActive = true;
    }
    return this.vipPlanModel.find(filter).sort({ durationDays: 1 }).exec();
  }

  async findById(id: string): Promise<VipPlanDocument> {
    const plan = await this.vipPlanModel.findOne({ _id: id, deleted: false }).exec();
    if (!plan) {
      throw new NotFoundException('پلن اشتراک VIP مورد نظر یافت نشد.');
    }
    return plan;
  }

  async update(id: string, dto: UpdateVipPlanDto): Promise<VipPlanDocument> {
    const plan = await this.vipPlanModel
      .findOneAndUpdate(
        { _id: id, deleted: false },
        { $set: dto },
        { new: true, runValidators: false },
      )
      .exec();
    if (!plan) {
      throw new NotFoundException('پلن اشتراک VIP مورد نظر یافت نشد.');
    }
    return plan;
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const plan = await this.findById(id);
    await this.vipPlanModel.deleteOne({ _id: plan._id }).exec();
    return { success: true, message: 'پلن VIP با موفقیت حذف شد.' };
  }

  async bulkUpdateStatus(
    ids: string[],
    isActive: boolean,
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.vipPlanModel.updateMany(
      { _id: { $in: validIds }, deleted: false },
      { $set: { isActive } },
    );
    return { success: true, modifiedCount: result.modifiedCount };
  }

  async bulkSoftDelete(ids: string[]): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.vipPlanModel.deleteMany({ _id: { $in: validIds } }).exec();
    return { success: true, modifiedCount: result.deletedCount };
  }
}
