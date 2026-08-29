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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const auth_guards_1 = require("../common/guards/auth.guards");
const users_service_1 = require("../users/users.service");
const products_service_1 = require("../products/products.service");
const categories_service_1 = require("../categories/categories.service");
const attributes_service_1 = require("../attributes/attributes.service");
const orders_service_1 = require("../orders/orders.service");
const coupons_service_1 = require("../coupons/coupons.service");
const vip_plans_service_1 = require("../vip-plans/vip-plans.service");
const page_sections_service_1 = require("../page-sections/page-sections.service");
const uploads_service_1 = require("../uploads/uploads.service");
const dtos_1 = require("../products/dtos");
const dtos_2 = require("../categories/dtos");
const dtos_3 = require("../attributes/dtos");
const dtos_4 = require("../coupons/dtos");
const dtos_5 = require("../vip-plans/dtos");
const dtos_6 = require("../page-sections/dtos");
const dtos_7 = require("../users/dtos");
const enums_1 = require("../common/enums");
let AdminController = class AdminController {
    usersService;
    productsService;
    categoriesService;
    attributesService;
    ordersService;
    couponsService;
    vipPlansService;
    pageSectionsService;
    uploadsService;
    constructor(usersService, productsService, categoriesService, attributesService, ordersService, couponsService, vipPlansService, pageSectionsService, uploadsService) {
        this.usersService = usersService;
        this.productsService = productsService;
        this.categoriesService = categoriesService;
        this.attributesService = attributesService;
        this.ordersService = ordersService;
        this.couponsService = couponsService;
        this.vipPlansService = vipPlansService;
        this.pageSectionsService = pageSectionsService;
        this.uploadsService = uploadsService;
    }
    async getDashboardStats() {
        return this.ordersService.getDashboardStats();
    }
    async getProducts(query) {
        return this.productsService.findAll(query);
    }
    async getProduct(id) {
        return this.productsService.findById(id);
    }
    async createProduct(dto) {
        return this.productsService.create(dto);
    }
    async updateProduct(id, dto) {
        return this.productsService.update(id, dto);
    }
    async deleteProduct(id) {
        return this.productsService.softDelete(id);
    }
    async getCategories() {
        return this.categoriesService.findAll();
    }
    async getCategory(id) {
        return this.categoriesService.findById(id);
    }
    async createCategory(dto) {
        return this.categoriesService.create(dto);
    }
    async updateCategory(id, dto) {
        return this.categoriesService.update(id, dto);
    }
    async deleteCategory(id) {
        return this.categoriesService.softDelete(id);
    }
    async getAttributes() {
        return this.attributesService.findAll();
    }
    async getAttribute(id) {
        return this.attributesService.findById(id);
    }
    async createAttribute(dto) {
        return this.attributesService.create(dto);
    }
    async quickCreateAttribute(dto) {
        return this.attributesService.quickCreate(dto);
    }
    async updateAttribute(id, dto) {
        return this.attributesService.update(id, dto);
    }
    async deleteAttribute(id) {
        return this.attributesService.softDelete(id);
    }
    async getOrders(page, pageSize, status, q) {
        return this.ordersService.findAll({
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 20,
            status,
            q,
        });
    }
    async getOrder(id) {
        return this.ordersService.findById(id);
    }
    async updateOrderStatus(id, status, trackingCode) {
        return this.ordersService.updateStatus(id, { status, trackingCode });
    }
    async getCoupons() {
        return this.couponsService.findAll();
    }
    async createCoupon(dto) {
        return this.couponsService.create(dto);
    }
    async updateCoupon(id, dto) {
        return this.couponsService.update(id, dto);
    }
    async deleteCoupon(id) {
        return this.couponsService.softDelete(id);
    }
    async getVipPlans() {
        return this.vipPlansService.findAll();
    }
    async createVipPlan(dto) {
        return this.vipPlansService.create(dto);
    }
    async updateVipPlan(id, dto) {
        return this.vipPlansService.update(id, dto);
    }
    async deleteVipPlan(id) {
        return this.vipPlansService.softDelete(id);
    }
    async getUsers(page, pageSize, q, role) {
        return this.usersService.findAll({
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 20,
            q,
            role,
        });
    }
    async getUser(id) {
        return this.usersService.findById(id);
    }
    async createUser(dto) {
        return this.usersService.create(dto);
    }
    async updateUser(id, dto) {
        return this.usersService.update(id, dto);
    }
    async updateUserRole(id, dto) {
        return this.usersService.setRole(id, dto.role);
    }
    async updateUserVip(id, dto) {
        return this.usersService.toggleVip(id, dto.isVip, dto.durationDays);
    }
    async deleteUser(id) {
        return this.usersService.softDelete(id);
    }
    async getPageSections() {
        return this.pageSectionsService.adminFindAll();
    }
    async updatePageSection(key, dto) {
        return this.pageSectionsService.updateByKey(key, dto);
    }
    async toggleSectionVip(key, isVipOnly) {
        return this.pageSectionsService.toggleVipOnly(key, isVipOnly);
    }
    async toggleSectionVisibility(key, isVisible) {
        return this.pageSectionsService.toggleVisibility(key, isVisible);
    }
    async uploadImage(file) {
        if (!file) {
            throw new common_1.BadRequestException('فایل تصویری ارسال نشده است.');
        }
        return this.uploadsService.processAndSaveImage(file);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.Get)('orders/dashboard-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_1.ProductQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)('products'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Patch)('products/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)('products/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCategory", null);
__decorate([
    (0, common_1.Post)('categories'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_2.CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_2.UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Get)('attributes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAttributes", null);
__decorate([
    (0, common_1.Get)('attributes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAttribute", null);
__decorate([
    (0, common_1.Post)('attributes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_3.CreateAttributeDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAttribute", null);
__decorate([
    (0, common_1.Post)('attributes/quick-create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_3.QuickCreateAttributeDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "quickCreateAttribute", null);
__decorate([
    (0, common_1.Patch)('attributes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_3.UpdateAttributeDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAttribute", null);
__decorate([
    (0, common_1.Delete)('attributes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteAttribute", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Patch)('orders/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('trackingCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Get)('coupons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCoupons", null);
__decorate([
    (0, common_1.Post)('coupons'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_4.CreateCouponDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCoupon", null);
__decorate([
    (0, common_1.Patch)('coupons/:id'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCoupon", null);
__decorate([
    (0, common_1.Delete)('coupons/:id'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCoupon", null);
__decorate([
    (0, common_1.Get)('vip-plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getVipPlans", null);
__decorate([
    (0, common_1.Post)('vip-plans'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_5.CreateVipPlanDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createVipPlan", null);
__decorate([
    (0, common_1.Patch)('vip-plans/:id'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_5.UpdateVipPlanDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateVipPlan", null);
__decorate([
    (0, common_1.Delete)('vip-plans/:id'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteVipPlan", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_7.CreateUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_7.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_7.UpdateUserRoleDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Patch)('users/:id/vip'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_7.UpdateUserVipDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserVip", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, common_1.UseGuards)(auth_guards_1.SuperAdminOnlyGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('page-sections'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPageSections", null);
__decorate([
    (0, common_1.Patch)('page-sections/:key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_6.UpdatePageSectionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePageSection", null);
__decorate([
    (0, common_1.Patch)('page-sections/:key/toggle-vip'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)('isVipOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleSectionVip", null);
__decorate([
    (0, common_1.Patch)('page-sections/:key/toggle-visibility'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)('isVisible')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleSectionVisibility", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "uploadImage", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)({ version: '1', path: 'admin' }),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.AdminGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        products_service_1.ProductsService,
        categories_service_1.CategoriesService,
        attributes_service_1.AttributesService,
        orders_service_1.OrdersService,
        coupons_service_1.CouponsService,
        vip_plans_service_1.VipPlansService,
        page_sections_service_1.PageSectionsService,
        uploads_service_1.UploadsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map