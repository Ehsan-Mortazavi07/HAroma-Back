import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsNumber,
  IsPhoneNumber,
  Matches,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است.' })
  @IsString()
  fullName!: string;

  @IsNotEmpty({ message: 'نام کاربری الزامی است.' })
  @IsString()
  username!: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsEmail({}, { message: 'فرمت ایمیل نامعتبر است.' })
  email?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsString()
  @IsPhoneNumber('IR', { message: 'شماره تلفن باید یک شماره معتبر در ایران باشد.' })
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود.' })
  phone?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  @IsOptional()
  vipExpiresAt?: Date;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  birthDateShamsi?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsString()
  @Matches(/^\d{10}$/, { message: 'کد پستی باید دقیقاً ۱۰ رقم عددی باشد.' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  buildingNumber?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsString()
  @IsPhoneNumber('IR', { message: 'شماره تماس تحویل‌گیرنده باید یک شماره معتبر در ایران باشد.' })
  @Matches(/^09\d{9}$/, { message: 'شماره تماس تحویل‌گیرنده باید ۱۱ رقم بوده و با ۰۹ شروع شود.' })
  recipientPhone?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsEmail({}, { message: 'فرمت ایمیل تحویل‌گیرنده نامعتبر است.' })
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  addressNotes?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsEmail({}, { message: 'فرمت ایمیل نامعتبر است.' })
  email?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsString()
  @IsPhoneNumber('IR', { message: 'شماره تلفن باید یک شماره معتبر در ایران باشد.' })
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود.' })
  phone?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  isVip?: boolean;

  @IsOptional()
  vipExpiresAt?: Date;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  birthDateShamsi?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsString()
  @Matches(/^\d{10}$/, { message: 'کد پستی باید دقیقاً ۱۰ رقم عددی باشد.' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  buildingNumber?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsString()
  @IsPhoneNumber('IR', { message: 'شماره تماس تحویل‌گیرنده باید یک شماره معتبر در ایران باشد.' })
  @Matches(/^09\d{9}$/, { message: 'شماره تماس تحویل‌گیرنده باید ۱۱ رقم بوده و با ۰۹ شروع شود.' })
  recipientPhone?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null && v !== undefined)
  @IsEmail({}, { message: 'فرمت ایمیل تحویل‌گیرنده نامعتبر است.' })
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  addressNotes?: string;
}

export class UpdateUserRoleDto {
  @IsNotEmpty({ message: 'نقش کاربری الزامی است.' })
  @IsEnum(UserRole, { message: 'نقش کاربری نامعتبر است.' })
  role!: UserRole;
}

export class UpdateUserVipDto {
  @IsNotEmpty()
  @IsBoolean()
  isVip!: boolean;

  @IsOptional()
  @IsNumber()
  durationDays?: number;
}
