import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { OrderStatus } from '../enums';

export class BulkIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsMongoId({ each: true })
  ids!: string[];
}

export class BulkSetActiveDto extends BulkIdsDto {
  @IsBoolean()
  isActive!: boolean;
}

export class BulkSetOrderStatusDto extends BulkIdsDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class BulkSetVipDto extends BulkIdsDto {
  @IsBoolean()
  isVip!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  durationDays?: number;
}

export class SetVipOnlyDto {
  @IsBoolean()
  isVipOnly!: boolean;
}

export class SetVisibilityDto {
  @IsBoolean()
  isVisible!: boolean;
}

export class SubscribePlanDto {
  @IsMongoId()
  planId!: string;
}
