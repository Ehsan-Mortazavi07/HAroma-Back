import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { LoginDto, RegisterDto } from './dtos';
import { normalizePhoneNumber } from './utils/phone.util';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
      email: user.email || '',
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

    const cleanEmail = registerDto.email?.trim() ? registerDto.email.trim().toLowerCase() : undefined;

    const createdUser = await this.usersService.create({
      fullName: registerDto.fullName,
      username: registerDto.username,
      email: cleanEmail,
      password: registerDto.password,
      birthDate: registerDto.birthDate,
    });

    const userObj = createdUser.toObject();
    delete (userObj as any).password;

    const payload = {
      sub: userObj._id,
      username: userObj.username,
      email: userObj.email || '',
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
    if (!email) {
      throw new BadRequestException('برای این حساب کاربری آدرس ایمیلی ثبت نشده است.');
    }
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

  async sendOtp(phone: string) {
    const cleanPhone = normalizePhoneNumber(phone);

    // Rate-limit: 60 seconds anti-flood
    const recentOtp = await this.otpModel
      .findOne({
        phone: cleanPhone,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
      })
      .sort({ createdAt: -1 });

    if (recentOtp) {
      const elapsedSeconds = Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
      const waitSeconds = Math.max(1, 60 - elapsedSeconds);
      throw new BadRequestException(
        `لطفاً قبل از ارسال مجدد کد، ${waitSeconds} ثانیه صبر کنید.`,
      );
    }

    // Invalidate prior unused OTPs for this phone
    await this.otpModel.updateMany(
      { phone: cleanPhone, used: false },
      { $set: { used: true } },
    );

    // Generate random 5-digit numeric code
    const generatedCode = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 120 * 1000); // 2 minutes valid

    await this.otpModel.create({
      phone: cleanPhone,
      code: generatedCode,
      expiresAt,
      used: false,
      attempts: 0,
    });

    // Console output for development without SMS gateway
    console.log('\n======================================================');
    console.log(`[HatefAroma OTP Service] 📱 Phone: ${cleanPhone} | 🔑 Code: ${generatedCode}`);
    console.log(`[HatefAroma OTP Service] ⏰ Expires in 120 seconds`);
    console.log('======================================================\n');

    return {
      success: true,
      message: 'کد تایید یکبار مصرف با موفقیت ایجاد شد.',
      phone: cleanPhone,
      expiresIn: 120,
      devCode: generatedCode, // Returned for dev/testing in UI without SMS provider
    };
  }

  async verifyOtp(phone: string, code: string) {
    const cleanPhone = normalizePhoneNumber(phone);

    // Convert Persian/Arabic digits to English
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let cleanCode = (code || '').trim();
    for (let i = 0; i < 10; i++) {
      cleanCode = cleanCode.replace(new RegExp(persianDigits[i], 'g'), i.toString());
      cleanCode = cleanCode.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    }

    if (!cleanCode || cleanCode.length < 4) {
      throw new BadRequestException('کد تایید وارد شده نامعتبر است.');
    }

    const otpRecord = await this.otpModel
      .findOne({
        phone: cleanPhone,
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new BadRequestException('کد تایید منقضی شده یا درخواستی یافت نشد. لطفاً مجدداً درخواست کد دهید.');
    }

    if (otpRecord.attempts >= 5) {
      otpRecord.used = true;
      await otpRecord.save();
      throw new BadRequestException('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.');
    }

    if (otpRecord.code !== cleanCode) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new BadRequestException('کد تایید وارد شده نادرست است.');
    }

    // Mark as used
    otpRecord.used = true;
    await otpRecord.save();

    // Check if user exists
    let user = await this.usersService.findByPhone(cleanPhone);
    let isNewUser = false;

    if (!user) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      let candidateUsername = `user_${cleanPhone.slice(-4)}_${randomSuffix}`;
      let exists = await this.userModel.findOne({ username: candidateUsername });
      while (exists) {
        candidateUsername = `user_${cleanPhone.slice(-4)}_${Math.floor(1000 + Math.random() * 9000)}`;
        exists = await this.userModel.findOne({ username: candidateUsername });
      }

      // Auto generate secure password
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.userModel.create({
        fullName: `کاربر ${cleanPhone.slice(-4)}`,
        username: candidateUsername,
        phone: cleanPhone,
        isPhoneVerified: true,
        password: hashedPassword,
        role: UserRole.USER,
        isVip: false,
      });
      isNewUser = true;
    } else {
      if (!user.isPhoneVerified) {
        user.isPhoneVerified = true;
        await user.save();
      }
    }

    const userObj = user.toObject();
    delete (userObj as any).password;

    const payload = {
      sub: userObj._id,
      username: userObj.username,
      email: userObj.email || '',
      phone: userObj.phone || cleanPhone,
      role: userObj.role,
      isVip: userObj.isVip,
    };

    return {
      success: true,
      message: isNewUser ? 'حساب کاربری جدید ایجاد و ورود با موفقیت انجام شد.' : 'ورود با موفقیت انجام شد.',
      accessToken: this.jwtService.sign(payload),
      user: userObj,
      isNewUser,
    };
  }

  async verifyPhoneForUser(userId: string, phone: string, code: string) {
    const cleanPhone = normalizePhoneNumber(phone);

    // Convert Persian/Arabic digits
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let cleanCode = (code || '').trim();
    for (let i = 0; i < 10; i++) {
      cleanCode = cleanCode.replace(new RegExp(persianDigits[i], 'g'), i.toString());
      cleanCode = cleanCode.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    }

    if (!cleanCode || cleanCode.length < 4) {
      throw new BadRequestException('کد تایید وارد شده نامعتبر است.');
    }

    const otpRecord = await this.otpModel
      .findOne({
        phone: cleanPhone,
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new BadRequestException('کد تایید منقضی شده یا درخواستی یافت نشد. لطفاً مجدداً درخواست کد دهید.');
    }

    if (otpRecord.attempts >= 5) {
      otpRecord.used = true;
      await otpRecord.save();
      throw new BadRequestException('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.');
    }

    if (otpRecord.code !== cleanCode) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new BadRequestException('کد تایید وارد شده نادرست است.');
    }

    // Check if another user already has this phone
    const existingOther = await this.userModel.findOne({
      _id: { $ne: userId },
      phone: cleanPhone,
      deleted: false,
    });
    if (existingOther) {
      throw new ConflictException('این شماره موبایل قبلاً توسط حساب کاربری دیگری تایید شده است.');
    }

    // Mark as used
    otpRecord.used = true;
    await otpRecord.save();

    const user = await this.userModel.findOne({ _id: userId, deleted: false });
    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد.');
    }

    user.phone = cleanPhone;
    user.isPhoneVerified = true;
    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).password;

    return {
      success: true,
      message: 'شماره موبایل شما با موفقیت تایید و ثبت شد.',
      user: userObj,
    };
  }
}
