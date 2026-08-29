import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateCouponDto {
  @IsNotEmpty({ message: 'کد تخفیف الزامی است.' })
  @IsString()
  code!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  expiresAt?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @IsNotEmpty({ message: 'کد تخفیف الزامی است.' })
  @IsString()
  code!: string;

  @IsNotEmpty({ message: 'مبلغ سبد خرید الزامی است.' })
  @IsNumber()
  cartAmount!: number;
}
