"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const categories_module_1 = require("./categories/categories.module");
const attributes_module_1 = require("./attributes/attributes.module");
const products_module_1 = require("./products/products.module");
const coupons_module_1 = require("./coupons/coupons.module");
const vip_plans_module_1 = require("./vip-plans/vip-plans.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const orders_module_1 = require("./orders/orders.module");
const page_sections_module_1 = require("./page-sections/page-sections.module");
const variant_templates_module_1 = require("./variant-templates/variant-templates.module");
const uploads_module_1 = require("./uploads/uploads.module");
const admin_module_1 = require("./admin/admin.module");
const catalog_module_1 = require("./catalog/catalog.module");
const seed_module_1 = require("./seed/seed.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '.env.local'],
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    uri: configService.get('MONGODB_URI') ||
                        'mongodb://127.0.0.1:27017/hatefaroma',
                }),
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            categories_module_1.CategoriesModule,
            attributes_module_1.AttributesModule,
            products_module_1.ProductsModule,
            coupons_module_1.CouponsModule,
            vip_plans_module_1.VipPlansModule,
            subscriptions_module_1.SubscriptionsModule,
            orders_module_1.OrdersModule,
            page_sections_module_1.PageSectionsModule,
            variant_templates_module_1.VariantTemplatesModule,
            uploads_module_1.UploadsModule,
            admin_module_1.AdminModule,
            catalog_module_1.CatalogModule,
            seed_module_1.SeedModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map