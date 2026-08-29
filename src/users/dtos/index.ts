import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean, IsNumber } from 'class-validator';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است.' })
  @IsString()
  fullName!: string;

  @IsNotEmpty({ message: 'نام کاربری الزامی است.' })
  @IsString()
  username!: string;

  @IsNotEmpty({ message: 'ایمیل الزامی است.' })
  @IsEmail({}, { message: 'فرمت ایمیل نامعتبر است.' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: 'رمز عبور الزامی است.' })
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' })
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'فرمت ایمیل نامعتبر است.' })
  email?: string;

  @IsOptional()
  @IsString()
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
