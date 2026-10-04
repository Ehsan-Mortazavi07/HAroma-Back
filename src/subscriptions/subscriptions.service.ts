import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { VipPlansService } from '../vip-plans/vip-plans.service';
import { UsersService } from '../users/users.service';
import { parsePage, parsePageSize } from '../common/utils/pagination.util';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private vipPlansService: VipPlansService,
    private usersService: UsersService,
  ) {}

  async subscribe(userId: string, planId: string): Promise<SubscriptionDocument> {
    void userId;
    void planId;
    throw new ServiceUnavailableException(
      'فعال‌سازی اشتراک تا اتصال و تأیید امن درگاه پرداخت غیرفعال است.',
    );
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
    const page = parsePage(query?.page);
    const pageSize = parsePageSize(query?.pageSize);
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
