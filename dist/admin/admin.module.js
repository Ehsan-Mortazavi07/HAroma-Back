"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const admin_controller_1 = require("./admin.controller");
const users_module_1 = require("../users/users.module");
const products_module_1 = require("../products/products.module");
const categories_module_1 = require("../categories/categories.module");
const attributes_module_1 = require("../attributes/attributes.module");
const orders_module_1 = require("../orders/orders.module");
const coupons_module_1 = require("../coupons/coupons.module");
const vip_plans_module_1 = require("../vip-plans/vip-plans.module");
const page_sections_module_1 = require("../page-sections/page-sections.module");
const uploads_module_1 = require("../uploads/uploads.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            attributes_module_1.AttributesModule,
            orders_module_1.OrdersModule,
            coupons_module_1.CouponsModule,
            vip_plans_module_1.VipPlansModule,
            page_sections_module_1.PageSectionsModule,
            uploads_module_1.UploadsModule,
        ],
        controllers: [admin_controller_1.AdminController],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map