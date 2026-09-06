import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { AttributesModule } from './attributes/attributes.module';
import { ProductsModule } from './products/products.module';
import { CouponsModule } from './coupons/coupons.module';
import { VipPlansModule } from './vip-plans/vip-plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { OrdersModule } from './orders/orders.module';
import { PageSectionsModule } from './page-sections/page-sections.module';
import { VariantTemplatesModule } from './variant-templates/variant-templates.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminModule } from './admin/admin.module';
import { CatalogModule } from './catalog/catalog.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://127.0.0.1:27017/hatefaroma',
      }),
    }),
    UsersModule,
    AuthModule,
    BrandsModule,
    CategoriesModule,
    AttributesModule,
    ProductsModule,
    CouponsModule,
    VipPlansModule,
    SubscriptionsModule,
    OrdersModule,
    PageSectionsModule,
    VariantTemplatesModule,
    UploadsModule,
    AdminModule,
    CatalogModule,
    SeedModule,
  ],
})
export class AppModule {}
