import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminSearchController } from './admin-search.controller';
import { AdminSearchService } from './admin-search.service';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Brand, BrandSchema } from '../brands/schemas/brand.schema';
import { Attribute, AttributeSchema } from '../attributes/schemas/attribute.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Coupon, CouponSchema } from '../coupons/schemas/coupon.schema';
import { VipPlan, VipPlanSchema } from '../vip-plans/schemas/vip-plan.schema';
import {
  ConsultationConversation,
  ConsultationConversationSchema,
} from '../consultation-chat/schemas/consultation-chat.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    ThrottlerModule.forRoot([{ name: 'default', limit: 300, ttl: 60_000 }]),
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Attribute.name, schema: AttributeSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: VipPlan.name, schema: VipPlanSchema },
      { name: ConsultationConversation.name, schema: ConsultationConversationSchema },
    ]),
  ],
  controllers: [AdminSearchController],
  providers: [AdminSearchService, ThrottlerGuard],
})
export class AdminSearchModule {}
