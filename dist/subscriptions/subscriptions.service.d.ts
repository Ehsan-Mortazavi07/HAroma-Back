import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { VipPlansService } from '../vip-plans/vip-plans.service';
import { UsersService } from '../users/users.service';
export declare class SubscriptionsService {
    private subscriptionModel;
    private vipPlansService;
    private usersService;
    constructor(subscriptionModel: Model<SubscriptionDocument>, vipPlansService: VipPlansService, usersService: UsersService);
    subscribe(userId: string, planId: string): Promise<SubscriptionDocument>;
    getUserActiveSubscription(userId: string): Promise<import("mongoose").Document<unknown, {}, SubscriptionDocument, {}, {}> & Subscription & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getUserSubscriptions(userId: string): Promise<(import("mongoose").Document<unknown, {}, SubscriptionDocument, {}, {}> & Subscription & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminListSubscriptions(query?: {
        page?: number;
        pageSize?: number;
    }): Promise<{
        items: (import("mongoose").Document<unknown, {}, SubscriptionDocument, {}, {}> & Subscription & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
}
