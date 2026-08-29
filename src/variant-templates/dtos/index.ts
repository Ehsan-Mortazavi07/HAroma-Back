import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateVariantTemplateDto {
  @IsNotEmpty({ message: 'عنوان تنوع الزامی است.' })
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsNotEmpty({ message: 'قیمت پیش‌فرض الزامی است.' })
  @IsNumber()
  @Min(0, { message: 'قیمت باید بزرگتر یا مساوی صفر باشد.' })
  defaultPrice!: number;

  @IsOptional()
  @IsNumber()
  defaultDiscountPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'موجودی پیش‌فرض باید بزرگتر یا مساوی صفر باشد.' })
  defaultStock?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateVariantTemplateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPrice?: number;

  @IsOptional()
  @IsNumber()
  defaultDiscountPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultStock?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}
