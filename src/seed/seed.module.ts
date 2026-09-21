import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Attribute, AttributeSchema } from '../attributes/schemas/attribute.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { VipPlan, VipPlanSchema } from '../vip-plans/schemas/vip-plan.schema';
import { Coupon, CouponSchema } from '../coupons/schemas/coupon.schema';
import { PageSection, PageSectionSchema } from '../page-sections/schemas/page-section.schema';
import { VariantTemplate, VariantTemplateSchema } from '../variant-templates/schemas/variant-template.schema';
import { Brand, BrandSchema } from '../brands/schemas/brand.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Attribute.name, schema: AttributeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: VipPlan.name, schema: VipPlanSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: PageSection.name, schema: PageSectionSchema },
      { name: VariantTemplate.name, schema: VariantTemplateSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
