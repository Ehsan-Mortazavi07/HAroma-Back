import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesModule } from '../categories/categories.module';
import { AttributesModule } from '../attributes/attributes.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CategoriesModule,
    AttributesModule,
    BrandsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, MongooseModule],
})
export class ProductsModule {}
