import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsEmail,
  ValidateIf,
  Matches,
  MaxLength,
  IsUrl,
  IsDateString,
  ArrayMinSize,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod } from '../../common/enums';

export class OrderItemDto {
  @IsNotEmpty()
  @IsMongoId()
  product!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  selectedAttributes?: string;
}

export class DeliveryAddressDto {
  @IsNotEmpty({ message: 'نام تحویل‌گیرنده الزامی است.' })
  @IsString()
  fullName!: string;

  @IsNotEmpty({ message: 'شماره تماس الزامی است.' })
  @IsString()
  phone!: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsEmail({}, { message: 'فرمت ایمیل نامعتبر است.' })
  email?: string;

  @IsNotEmpty({ message: 'استان الزامی است.' })
  @IsString()
  province!: string;

  @IsNotEmpty({ message: 'شهر الزامی است.' })
  @IsString()
  city!: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsString()
  @Matches(/^\d{10}$/, { message: 'کد پستی باید دقیقاً ۱۰ رقم باشد.' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  buildingNumber?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNotEmpty({ message: 'آدرس پستی کامل الزامی است.' })
  @IsString()
  addressDetail!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress!: DeliveryAddressDto;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  trackingCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  shippingProvider?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  trackingUrl?: string;
}

export class UpdateAdminOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  orderNumber?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'سفارش باید حداقل یک قلم کالا داشته باشد.' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress!: DeliveryAddressDto;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsNumber()
  @Min(0)
  shippingFee!: number;

  @IsNumber()
  @Min(0)
  couponDiscount!: number;

  @IsNumber()
  @Min(0)
  vipDiscount!: number;

  @IsNumber()
  @Min(0)
  tax!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  couponCode?: string;

  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsString()
  @MaxLength(80)
  shippingMethod!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  shippingProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  trackingCode?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value !== null)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  trackingUrl?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  shippedAt?: string | null;

  @IsOptional()
  @IsDateString()
  deliveredAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  statusNote?: string;
}
