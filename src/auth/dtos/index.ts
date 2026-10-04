import { IsNotEmpty, IsString, MinLength, IsOptional, MaxLength, Matches, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'ایمیل یا نام کاربری الزامی است.' })
  @IsString()
  @MaxLength(254)
  identifier!: string;

  @IsNotEmpty({ message: 'رمز عبور الزامی است.' })
  @IsString()
  @MaxLength(128)
  password!: string;
}

export class RegisterDto {
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است.' })
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  email?: string;

  @ValidateIf((_object, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  @Matches(/^[\d۰-۹٠-٩+()\-\s]{7,24}$/)
  phone?: string;

  // Accepted for compatibility with older clients; registration no longer uses OTP.
  @IsOptional()
  @IsString()
  @Matches(/^[\d۰-۹٠-٩]{5}$/)
  code?: string;

  @IsNotEmpty({ message: 'رمز عبور الزامی است.' })
  @IsString()
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' })
  @MaxLength(128)
  password!: string;

  @IsNotEmpty({ message: 'تکرار رمز عبور الزامی است.' })
  @IsString()
  @MaxLength(128)
  confirmPassword!: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  birthDate?: string;
}

export class ForgotPasswordDto {
  @IsOptional()
  @IsString()
  @MaxLength(254)
  identifier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  channel?: 'sms' | 'email';
}

export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  @MaxLength(254)
  identifier?: string;

  @IsNotEmpty({ message: 'کد تایید الزامی است.' })
  @IsString()
  @Matches(/^[\d۰-۹٠-٩]{5}$/)
  code!: string;

  @IsNotEmpty({ message: 'رمز عبور جدید الزامی است.' })
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' })
  @MaxLength(128)
  newPassword!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  confirmPassword?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(sms|email)$/)
  channel?: 'sms' | 'email';
}

export class SendOtpDto {
  @IsNotEmpty({ message: 'شماره موبایل الزامی است.' })
  @IsString({ message: 'شماره موبایل باید معتبر باشد.' })
  @Matches(/^[\d۰-۹٠-٩+()\-\s]{7,24}$/)
  phone!: string;

  @IsOptional()
  @IsString()
  @Matches(/^(login|register|verify-phone)$/)
  purpose?: 'login' | 'register' | 'verify-phone';
}

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'شماره موبایل الزامی است.' })
  @IsString({ message: 'شماره موبایل باید معتبر باشد.' })
  @Matches(/^[\d۰-۹٠-٩+()\-\s]{7,24}$/)
  phone!: string;

  @IsNotEmpty({ message: 'کد تایید الزامی است.' })
  @IsString({ message: 'کد تایید باید معتبر باشد.' })
  @Matches(/^[\d۰-۹٠-٩]{5}$/)
  code!: string;

  @IsOptional()
  @IsString()
  @Matches(/^(login|register|verify-phone)$/)
  purpose?: 'login' | 'register' | 'verify-phone';
}
