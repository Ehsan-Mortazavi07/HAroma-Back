import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsObject,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PageSectionPriorityDto {
  @IsString()
  @IsNotEmpty()
  sectionKey!: string;

  @IsNumber()
  @IsInt()
  @Min(1)
  order!: number;
}

export class UpdatePageSectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  subtitleEn?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  isVipOnly?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageSectionPriorityDto)
  priorityOrder?: PageSectionPriorityDto[];

  @IsOptional()
  @IsArray()
  banners?: any[];

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
