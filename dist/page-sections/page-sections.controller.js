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
exports.PageSectionsController = void 0;
const common_1 = require("@nestjs/common");
const page_sections_service_1 = require("./page-sections.service");
const dtos_1 = require("./dtos");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enums_1 = require("../common/enums");
let PageSectionsController = class PageSectionsController {
    pageSectionsService;
    constructor(pageSectionsService) {
        this.pageSectionsService = pageSectionsService;
    }
    async getPublicSections() {
        return this.pageSectionsService.findAll(false);
    }
    async adminListSections() {
        return this.pageSectionsService.adminFindAll();
    }
    async updateSection(sectionKey, dto) {
        return this.pageSectionsService.updateByKey(sectionKey, dto);
    }
    async toggleVip(sectionKey, isVipOnly) {
        return this.pageSectionsService.toggleVipOnly(sectionKey, isVipOnly);
    }
    async toggleVisibility(sectionKey, isVisible) {
        return this.pageSectionsService.toggleVisibility(sectionKey, isVisible);
    }
};
exports.PageSectionsController = PageSectionsController;
__decorate([
    (0, common_1.Get)('page-sections'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PageSectionsController.prototype, "getPublicSections", null);
__decorate([
    (0, common_1.Get)('admin/page-sections'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN, enums_1.UserRole.EDITOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PageSectionsController.prototype, "adminListSections", null);
__decorate([
    (0, common_1.Patch)('admin/page-sections/:sectionKey'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN, enums_1.UserRole.EDITOR),
    __param(0, (0, common_1.Param)('sectionKey')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_1.UpdatePageSectionDto]),
    __metadata("design:returntype", Promise)
], PageSectionsController.prototype, "updateSection", null);
__decorate([
    (0, common_1.Patch)('admin/page-sections/:sectionKey/toggle-vip'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('sectionKey')),
    __param(1, (0, common_1.Body)('isVipOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], PageSectionsController.prototype, "toggleVip", null);
__decorate([
    (0, common_1.Patch)('admin/page-sections/:sectionKey/toggle-visibility'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.ADMIN, enums_1.UserRole.EDITOR),
    __param(0, (0, common_1.Param)('sectionKey')),
    __param(1, (0, common_1.Body)('isVisible')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], PageSectionsController.prototype, "toggleVisibility", null);
exports.PageSectionsController = PageSectionsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [page_sections_service_1.PageSectionsService])
], PageSectionsController);
//# sourceMappingURL=page-sections.controller.js.map