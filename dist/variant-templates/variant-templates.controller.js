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
exports.VariantTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const variant_templates_service_1 = require("./variant-templates.service");
const dtos_1 = require("./dtos");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
let VariantTemplatesController = class VariantTemplatesController {
    variantTemplatesService;
    constructor(variantTemplatesService) {
        this.variantTemplatesService = variantTemplatesService;
    }
    async getPublicTemplates() {
        return this.variantTemplatesService.findAll();
    }
    async adminListTemplates() {
        return this.variantTemplatesService.findAll();
    }
    async adminGetTemplate(id) {
        return this.variantTemplatesService.findOne(id);
    }
    async createTemplate(dto) {
        return this.variantTemplatesService.create(dto);
    }
    async updateTemplate(id, dto) {
        return this.variantTemplatesService.update(id, dto);
    }
    async deleteTemplate(id) {
        return this.variantTemplatesService.remove(id);
    }
};
exports.VariantTemplatesController = VariantTemplatesController;
__decorate([
    (0, common_1.Get)('variant-templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VariantTemplatesController.prototype, "getPublicTemplates", null);
__decorate([
    (0, common_1.Get)('admin/variant-templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN, enums_1.UserRole.EDITOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VariantTemplatesController.prototype, "adminListTemplates", null);
__decorate([
    (0, common_1.Get)('admin/variant-templates/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN, enums_1.UserRole.EDITOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VariantTemplatesController.prototype, "adminGetTemplate", null);
__decorate([
    (0, common_1.Post)('admin/variant-templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN, enums_1.UserRole.EDITOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_1.CreateVariantTemplateDto]),
    __metadata("design:returntype", Promise)
], VariantTemplatesController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('admin/variant-templates/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN, enums_1.UserRole.EDITOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_1.UpdateVariantTemplateDto]),
    __metadata("design:returntype", Promise)
], VariantTemplatesController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('admin/variant-templates/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN, enums_1.UserRole.EDITOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VariantTemplatesController.prototype, "deleteTemplate", null);
exports.VariantTemplatesController = VariantTemplatesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [variant_templates_service_1.VariantTemplatesService])
], VariantTemplatesController);
//# sourceMappingURL=variant-templates.controller.js.map