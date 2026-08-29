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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("../products/products.service");
const categories_service_1 = require("../categories/categories.service");
const vip_plans_service_1 = require("../vip-plans/vip-plans.service");
const page_sections_service_1 = require("../page-sections/page-sections.service");
const dtos_1 = require("../products/dtos");
const catalog_mapper_1 = require("./catalog.mapper");
let CatalogController = class CatalogController {
    productsService;
    categoriesService;
    vipPlansService;
    pageSectionsService;
    constructor(productsService, categoriesService, vipPlansService, pageSectionsService) {
        this.productsService = productsService;
        this.categoriesService = categoriesService;
        this.vipPlansService = vipPlansService;
        this.pageSectionsService = pageSectionsService;
    }
    async getProducts(query) {
        const result = await this.productsService.findAll(query);
        return {
            items: result.items.map(catalog_mapper_1.mapProductSummary),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            totalPages: result.totalPages,
        };
    }
    async getProductBySlug(slug) {
        const product = await this.productsService.findBySlug(slug);
        return (0, catalog_mapper_1.mapProductDetail)(product);
    }
    async getCategories() {
        const categories = await this.categoriesService.findAll();
        return categories.map(catalog_mapper_1.mapCategory);
    }
    async getVipPlans() {
        const plans = await this.vipPlansService.findAll(true);
        return plans.map(catalog_mapper_1.mapVipPlan);
    }
    async getPageSections() {
        const sections = await this.pageSectionsService.findAll();
        return sections.map(catalog_mapper_1.mapPageSection);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_1.ProductQueryDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)('products/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getProductBySlug", null);
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('vip-plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getVipPlans", null);
__decorate([
    (0, common_1.Get)('page-sections'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getPageSections", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)({ version: '1', path: 'catalog' }),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        categories_service_1.CategoriesService,
        vip_plans_service_1.VipPlansService,
        page_sections_service_1.PageSectionsService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map