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
exports.VipPlansController = void 0;
const common_1 = require("@nestjs/common");
const vip_plans_service_1 = require("./vip-plans.service");
const dtos_1 = require("./dtos");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
let VipPlansController = class VipPlansController {
    vipPlansService;
    constructor(vipPlansService) {
        this.vipPlansService = vipPlansService;
    }
    async getPublicVipPlans() {
        return this.vipPlansService.findAll(true);
    }
    async adminListVipPlans() {
        return this.vipPlansService.findAll(false);
    }
    async adminGetVipPlan(id) {
        return this.vipPlansService.findById(id);
    }
    async adminCreateVipPlan(dto) {
        return this.vipPlansService.create(dto);
    }
    async adminUpdateVipPlan(id, dto) {
        return this.vipPlansService.update(id, dto);
    }
    async adminDeleteVipPlan(id) {
        return this.vipPlansService.softDelete(id);
    }
};
exports.VipPlansController = VipPlansController;
__decorate([
    (0, common_1.Get)('vip-plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VipPlansController.prototype, "getPublicVipPlans", null);
__decorate([
    (0, common_1.Get)('admin/vip-plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VipPlansController.prototype, "adminListVipPlans", null);
__decorate([
    (0, common_1.Get)('admin/vip-plans/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VipPlansController.prototype, "adminGetVipPlan", null);
__decorate([
    (0, common_1.Post)('admin/vip-plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_1.CreateVipPlanDto]),
    __metadata("design:returntype", Promise)
], VipPlansController.prototype, "adminCreateVipPlan", null);
__decorate([
    (0, common_1.Patch)('admin/vip-plans/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_1.UpdateVipPlanDto]),
    __metadata("design:returntype", Promise)
], VipPlansController.prototype, "adminUpdateVipPlan", null);
__decorate([
    (0, common_1.Delete)('admin/vip-plans/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VipPlansController.prototype, "adminDeleteVipPlan", null);
exports.VipPlansController = VipPlansController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [vip_plans_service_1.VipPlansService])
], VipPlansController);
//# sourceMappingURL=vip-plans.controller.js.map