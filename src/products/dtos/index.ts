import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductAttributeInputDto {
  @IsOptional()
  @IsString()
  attributeId?: string;

  @IsNotEmpty()
  @IsString()
  key!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  value!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];

  @IsOptional()
  @IsString()
  unit?: string;
}

export class ProductVariantDto {
  @IsNotEmpty({ message: 'شناسه واریانت الزامی است.' })
  @IsString()
  id!: string;

  @IsNotEmpty({ message: 'عنوان واریانت (مانند حجم) الزامی است.' })
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsNotEmpty({ message: 'قیمت واریانت الزامی است.' })
  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @IsOptional()
  @IsNumber()
  stockCount?: number;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateProductDto {
  @IsNotEmpty({ message: 'عنوان محصول الزامی است.' })
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsNotEmpty({ message: 'اسلاگ محصول الزامی است.' })
  @IsString()
  slug!: string;

  @IsNotEmpty({ message: 'توضیحات محصول الزامی است.' })
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  shortDescriptionEn?: string;

  @IsNotEmpty({ message: 'قیمت محصول الزامی است.' })
  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  brand?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brands?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  attributes?: ProductAttributeInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsNumber()
  stockCount?: number;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsBoolean()
  isVipOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  shortDescriptionEn?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  brand?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brands?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  attributes?: ProductAttributeInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsNumber()
  stockCount?: number;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsBoolean()
  isVipOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class ProductQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;

  @IsOptional()
  q?: string;

  @IsOptional()
  category?: string;

  @IsOptional()
  brand?: string;

  @IsOptional()
  isVipOnly?: string;

  @IsOptional()
  isFeatured?: string;

  @IsOptional()
  isPublished?: string;

  @IsOptional()
  includeUnpublished?: string;

  @IsOptional()
  sort?: 'newest' | 'cheapest' | 'expensive' | 'popular' | 'bestseller' | 'price_asc' | 'price_desc' | 'best_sellers';

  @IsOptional()
  minPrice?: number;

  @IsOptional()
  maxPrice?: number;

  @IsOptional()
  inStockOnly?: string;
}

export class BulkUpdateProductStatusDto {
  @IsNotEmpty({ message: 'شناسه محصولات الزامی است.' })
  @IsArray({ message: 'شناسه‌ها باید به صورت آرایه ارسال شوند.' })
  @IsString({ each: true })
  ids!: string[];

  @IsNotEmpty({ message: 'وضعیت انتشار الزامی است.' })
  @IsBoolean()
  isPublished!: boolean;
}

export class BulkDeleteProductsDto {
  @IsNotEmpty({ message: 'شناسه محصولات الزامی است.' })
  @IsArray({ message: 'شناسه‌ها باید به صورت آرایه ارسال شوند.' })
  @IsString({ each: true })
  ids!: string[];
}
