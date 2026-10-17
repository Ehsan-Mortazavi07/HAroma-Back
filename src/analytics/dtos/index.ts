import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { Granularity } from '../../common/utils/jalali.util';

export class ReportRangeQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsIn(['day', 'month', 'year'])
  granularity?: Granularity;
}

export class ProductReportQueryDto extends ReportRangeQueryDto {
  @IsOptional()
  @IsIn(['views', 'revenue', 'quantity', 'addToCart', 'conversion', 'avgTime'])
  sortBy?: string;
}

export class VisitorReportQueryDto extends ReportRangeQueryDto {
  @IsOptional()
  @IsIn(['users', 'guests'])
  type?: 'users' | 'guests';

  @IsOptional()
  @IsIn(['duration', 'sessions', 'pageViews', 'lastSeen', 'spent'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
