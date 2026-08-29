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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const subscription_schema_1 = require("./schemas/subscription.schema");
const vip_plans_service_1 = require("../vip-plans/vip-plans.service");
const users_service_1 = require("../users/users.service");
let SubscriptionsService = class SubscriptionsService {
    subscriptionModel;
    vipPlansService;
    usersService;
    constructor(subscriptionModel, vipPlansService, usersService) {
        this.subscriptionModel = subscriptionModel;
        this.vipPlansService = vipPlansService;
        this.usersService = usersService;
    }
    async subscribe(userId, planId) {
        const plan = await this.vipPlansService.findById(planId);
        if (!plan.isActive) {
            throw new common_1.BadRequestException('این پلن اشتراک در حال حاضر فعال نیست.');
        }
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);
        const paymentRef = `VIP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const subscription = new this.subscriptionModel({
            user: new mongoose_2.Types.ObjectId(userId),
            plan: plan._id,
            amountPaid: plan.price,
            startDate,
            endDate,
            status: 'active',
            paymentRef,
        });
        await subscription.save();
        await this.usersService.toggleVip(userId, true, plan.durationDays);
        return subscription;
    }
    async getUserActiveSubscription(userId) {
        const sub = await this.subscriptionModel
            .findOne({
            user: new mongoose_2.Types.ObjectId(userId),
            status: 'active',
            endDate: { $gte: new Date() },
        })
            .populate('plan')
            .sort({ createdAt: -1 })
            .exec();
        return sub;
    }
    async getUserSubscriptions(userId) {
        return this.subscriptionModel
            .find({ user: new mongoose_2.Types.ObjectId(userId) })
            .populate('plan')
            .sort({ createdAt: -1 })
            .exec();
    }
    async adminListSubscriptions(query) {
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
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(subscription_schema_1.Subscription.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        vip_plans_service_1.VipPlansService,
        users_service_1.UsersService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map