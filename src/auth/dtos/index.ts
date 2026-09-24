import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'ایمیل یا نام کاربری الزامی است.' })
  @IsString()
  identifier!: string;

  @IsNotEmpty({ message: 'رمز عبور الزامی است.' })
  @IsString()
  password!: string;
}

export class RegisterDto {
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است.' })
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsNotEmpty({ message: 'شماره موبایل الزامی است.' })
  @IsString()
  phone!: string;

  @IsNotEmpty({ message: 'کد تایید ۵ رقمی الزامی است.' })
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;
}

export class ForgotPasswordDto {
  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsString()
  channel?: 'sms' | 'email';
}

export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  identifier?: string;

  @IsNotEmpty({ message: 'کد تایید الزامی است.' })
  @IsString()
  code!: string;

  @IsNotEmpty({ message: 'رمز عبور جدید الزامی است.' })
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' })
  newPassword!: string;

  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @IsOptional()
  @IsString()
  channel?: 'sms' | 'email';
}

export class SendOtpDto {
  @IsNotEmpty({ message: 'شماره موبایل الزامی است.' })
  @IsString({ message: 'شماره موبایل باید معتبر باشد.' })
  phone!: string;

  @IsOptional()
  @IsString()
  purpose?: 'login' | 'register' | 'verify-phone';
}

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'شماره موبایل الزامی است.' })
  @IsString({ message: 'شماره موبایل باید معتبر باشد.' })
  phone!: string;

  @IsNotEmpty({ message: 'کد تایید الزامی است.' })
  @IsString({ message: 'کد تایید باید معتبر باشد.' })
  code!: string;

  @IsOptional()
  @IsString()
  purpose?: 'login' | 'register' | 'verify-phone';
}

