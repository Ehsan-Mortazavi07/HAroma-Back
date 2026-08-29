import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    subscribe(user: any, planId: string): Promise<import("./schemas/subscription.schema").SubscriptionDocument>;
    getMySubscriptions(user: any): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/subscription.schema").SubscriptionDocument, {}, {}> & import("./schemas/subscription.schema").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getMyActiveSubscription(user: any): Promise<import("mongoose").Document<unknown, {}, import("./schemas/subscription.schema").SubscriptionDocument, {}, {}> & import("./schemas/subscription.schema").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    adminListSubscriptions(page?: number, pageSize?: number): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("./schemas/subscription.schema").SubscriptionDocument, {}, {}> & import("./schemas/subscription.schema").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
}
