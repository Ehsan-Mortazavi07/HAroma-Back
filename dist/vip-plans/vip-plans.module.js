"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VipPlansModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const vip_plan_schema_1 = require("./schemas/vip-plan.schema");
const vip_plans_service_1 = require("./vip-plans.service");
const vip_plans_controller_1 = require("./vip-plans.controller");
let VipPlansModule = class VipPlansModule {
};
exports.VipPlansModule = VipPlansModule;
exports.VipPlansModule = VipPlansModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: vip_plan_schema_1.VipPlan.name, schema: vip_plan_schema_1.VipPlanSchema }]),
        ],
        controllers: [vip_plans_controller_1.VipPlansController],
        providers: [vip_plans_service_1.VipPlansService],
        exports: [vip_plans_service_1.VipPlansService, mongoose_1.MongooseModule],
    })
], VipPlansModule);
//# sourceMappingURL=vip-plans.module.js.map