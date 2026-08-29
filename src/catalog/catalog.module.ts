import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { VipPlansModule } from '../vip-plans/vip-plans.module';
import { PageSectionsModule } from '../page-sections/page-sections.module';

@Module({
  imports: [
    ProductsModule,
    CategoriesModule,
    VipPlansModule,
    PageSectionsModule,
  ],
  controllers: [CatalogController],
})
export class CatalogModule {}
