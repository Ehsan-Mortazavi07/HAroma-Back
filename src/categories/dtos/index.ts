import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'نام دسته‌بندی الزامی است.' })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsNotEmpty({ message: 'اسلاگ دسته‌بندی الزامی است.' })
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
