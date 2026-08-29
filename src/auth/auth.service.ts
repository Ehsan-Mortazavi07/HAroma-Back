import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsernameOrEmail(identifier);
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const userObj = user.toObject();
      delete (userObj as any).password;
      return userObj;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.identifier, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('نام کاربری/ایمیل یا رمز عبور اشتباه است.');
    }

    const payload = {
      sub: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVip: user.isVip,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('رمز عبور با تکرار آن مطابقت ندارد.');
    }

    const createdUser = await this.usersService.create({
      fullName: registerDto.fullName,
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
    });

    const userObj = createdUser.toObject();
    delete (userObj as any).password;

    const payload = {
      sub: userObj._id,
      username: userObj.username,
      email: userObj.email,
      role: userObj.role,
      isVip: userObj.isVip,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: userObj,
    };
  }

  async forgotPassword(identifier: string) {
    const user = await this.usersService.findByUsernameOrEmail(identifier);
    if (!user) {
      throw new BadRequestException('کاربری با این مشخصات در سیستم یافت نشد.');
    }

    const email = user.email;
    const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(Math.max(3, gp3.length)));

    return {
      success: true,
      message: 'کد تایید ۶ رقمی بازیابی رمز عبور به ایمیل شما ارسال شد.',
      email: maskedEmail,
      demoCode: '123456',
    };
  }

  async resetPassword(identifier: string, code: string, newPassword: string) {
    const user = await this.usersService.findByUsernameOrEmail(identifier);
    if (!user) {
      throw new BadRequestException('کاربری با این مشخصات در سیستم یافت نشد.');
    }
    if (!code || code.trim().length < 4) {
      throw new BadRequestException('کد تایید وارد شده نامعتبر است.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return {
      success: true,
      message: 'رمز عبور با موفقیت تغییر یافت. اکنون می‌توانید با رمز جدید وارد شوید.',
    };
  }
}
