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

  @IsNotEmpty({ message: 'نام کاربری الزامی است.' })
  @IsString()
  username!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsNotEmpty({ message: 'رمز عبور الزامی است.' })
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' })
  password!: string;

  @IsNotEmpty({ message: 'تکرار رمز عبور الزامی است.' })
  confirmPassword!: string;

  @IsOptional()
  @IsString()
  birthDate?: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'نام کاربری یا ایمیل الزامی است.' })
  @IsString()
  identifier!: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'نام کاربری یا ایمیل الزامی است.' })
  @IsString()
  identifier!: string;

  @IsNotEmpty({ message: 'کد تایید الزامی است.' })
  @IsString()
  code!: string;

  @IsNotEmpty({ message: 'رمز عبور جدید الزامی است.' })
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' })
  newPassword!: string;
}
