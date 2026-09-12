import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod } from '../../common/enums';

export class OrderItemDto {
  @IsNotEmpty()
  @IsString()
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

  @IsNotEmpty({ message: 'استان الزامی است.' })
  @IsString()
  province!: string;

  @IsNotEmpty({ message: 'شهر الزامی است.' })
  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
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
  trackingCode?: string;
}
