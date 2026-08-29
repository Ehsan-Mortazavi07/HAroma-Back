"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const seed_service_1 = require("./seed.service");
const user_schema_1 = require("../users/schemas/user.schema");
const category_schema_1 = require("../categories/schemas/category.schema");
const attribute_schema_1 = require("../attributes/schemas/attribute.schema");
const product_schema_1 = require("../products/schemas/product.schema");
const vip_plan_schema_1 = require("../vip-plans/schemas/vip-plan.schema");
const coupon_schema_1 = require("../coupons/schemas/coupon.schema");
const page_section_schema_1 = require("../page-sections/schemas/page-section.schema");
const variant_template_schema_1 = require("../variant-templates/schemas/variant-template.schema");
let SeedModule = class SeedModule {
};
exports.SeedModule = SeedModule;
exports.SeedModule = SeedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: category_schema_1.Category.name, schema: category_schema_1.CategorySchema },
                { name: attribute_schema_1.Attribute.name, schema: attribute_schema_1.AttributeSchema },
                { name: product_schema_1.Product.name, schema: product_schema_1.ProductSchema },
                { name: vip_plan_schema_1.VipPlan.name, schema: vip_plan_schema_1.VipPlanSchema },
                { name: coupon_schema_1.Coupon.name, schema: coupon_schema_1.CouponSchema },
                { name: page_section_schema_1.PageSection.name, schema: page_section_schema_1.PageSectionSchema },
                { name: variant_template_schema_1.VariantTemplate.name, schema: variant_template_schema_1.VariantTemplateSchema },
            ]),
        ],
        providers: [seed_service_1.SeedService],
        exports: [seed_service_1.SeedService],
    })
], SeedModule);
//# sourceMappingURL=seed.module.js.map