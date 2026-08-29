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
exports.VipPlansService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const vip_plan_schema_1 = require("./schemas/vip-plan.schema");
let VipPlansService = class VipPlansService {
    vipPlanModel;
    constructor(vipPlanModel) {
        this.vipPlanModel = vipPlanModel;
    }
    async create(dto) {
        const plan = new this.vipPlanModel(dto);
        return plan.save();
    }
    async findAll(onlyActive = false) {
        const filter = { deleted: false };
        if (onlyActive) {
            filter.isActive = true;
        }
        return this.vipPlanModel.find(filter).sort({ durationDays: 1 }).exec();
    }
    async findById(id) {
        const plan = await this.vipPlanModel.findOne({ _id: id, deleted: false }).exec();
        if (!plan) {
            throw new common_1.NotFoundException('پلن اشتراک VIP مورد نظر یافت نشد.');
        }
        return plan;
    }
    async update(id, dto) {
        const plan = await this.findById(id);
        Object.assign(plan, dto);
        return plan.save();
    }
    async softDelete(id) {
        const plan = await this.findById(id);
        plan.deleted = true;
        await plan.save();
        return { success: true, message: 'پلن VIP با موفقیت حذف شد.' };
    }
};
exports.VipPlansService = VipPlansService;
exports.VipPlansService = VipPlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(vip_plan_schema_1.VipPlan.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], VipPlansService);
//# sourceMappingURL=vip-plans.service.js.map