import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { AttributesModule } from '../attributes/attributes.module';
import { OrdersModule } from '../orders/orders.module';
import { CouponsModule } from '../coupons/coupons.module';
import { VipPlansModule } from '../vip-plans/vip-plans.module';
import { PageSectionsModule } from '../page-sections/page-sections.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
    CategoriesModule,
    AttributesModule,
    OrdersModule,
    CouponsModule,
    VipPlansModule,
    PageSectionsModule,
    UploadsModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
