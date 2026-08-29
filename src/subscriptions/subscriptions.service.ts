import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { VipPlansService } from '../vip-plans/vip-plans.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private vipPlansService: VipPlansService,
    private usersService: UsersService,
  ) {}

  async subscribe(userId: string, planId: string): Promise<SubscriptionDocument> {
    const plan = await this.vipPlansService.findById(planId);
    if (!plan.isActive) {
      throw new BadRequestException('این پلن اشتراک در حال حاضر فعال نیست.');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const paymentRef = `VIP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const subscription = new this.subscriptionModel({
      user: new Types.ObjectId(userId),
      plan: plan._id,
      amountPaid: plan.price,
      startDate,
      endDate,
      status: 'active',
      paymentRef,
    });

    await subscription.save();

    // Update user VIP status
    await this.usersService.toggleVip(userId, true, plan.durationDays);

    return subscription;
  }

  async getUserActiveSubscription(userId: string) {
    const sub = await this.subscriptionModel
      .findOne({
        user: new Types.ObjectId(userId),
        status: 'active',
        endDate: { $gte: new Date() },
      })
      .populate('plan')
      .sort({ createdAt: -1 })
      .exec();

    return sub;
  }

  async getUserSubscriptions(userId: string) {
    return this.subscriptionModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('plan')
      .sort({ createdAt: -1 })
      .exec();
  }

  async adminListSubscriptions(query?: { page?: number; pageSize?: number }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.max(1, Number(query?.pageSize) || 20);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.subscriptionModel
        .find()
        .populate('user', 'fullName username email phone')
        .populate('plan')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.subscriptionModel.countDocuments().exec(),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
