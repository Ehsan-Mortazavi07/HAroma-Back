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

  async login(loginDto: LoginDto) {
    const rawId = (loginDto.identifier || '').trim();
    if (!rawId) {
      throw new BadRequestException('نام کاربری، شماره موبایل یا ایمیل الزامی است.');
    }

    // Convert Persian & Arabic digits to English
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let convertedId = rawId;
    for (let i = 0; i < 10; i++) {
      convertedId = convertedId.replace(new RegExp(persianDigits[i], 'g'), i.toString());
      convertedId = convertedId.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    }
    const strippedId = convertedId.replace(/\s|-/g, '');

    // Requirement 1: Check mobile number format if user entered phone-like identifier
    const isPhoneLike =
      /^(\+98|0098|98|09)/.test(strippedId) ||
      (/^\d+$/.test(strippedId) && strippedId.length >= 7);

    let searchPhone: string | null = null;
    if (isPhoneLike) {
      try {
        searchPhone = normalizePhoneNumber(rawId);
      } catch (err: any) {
        throw new BadRequestException(
          'فرمت شماره موبایل نامعتبر است. شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).',
        );
      }
    }

    const cleanId = convertedId.trim().toLowerCase();
    const isEmailLike = cleanId.includes('@');

    let user: UserDocument | null = null;
    if (searchPhone) {
      user = await this.usersService.findByPhone(searchPhone);
    } else if (isEmailLike) {
      user = await this.userModel.findOne({ email: cleanId, deleted: false }).exec();
    } else {
      user = await this.usersService.findByUsernameOrEmail(cleanId);
    }

    // Requirement 4: If user doesn't exist
    if (!user) {
      throw new UnauthorizedException('کاربری با این مشخصات وجود ندارد.');
    }

    // Requirement 2: Login with email requires isEmailVerified
    if (isEmailLike && !user.isEmailVerified) {
      throw new UnauthorizedException(
        'ورود با ایمیل امکان‌پذیر نیست زیرا ایمیل این حساب کاربری هنوز تایید نشده است. لطفاً با نام کاربری یا شماره موبایل وارد شوید.',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'برای این حساب کاربری رمز عبور ثبت نشده است. لطفاً با کد یکبار مصرف وارد شوید.',
      );
    }

    // Requirement 4: If user exists but password is wrong
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('رمز عبور اشتباه است.');
    }

    const userObj = user.toObject();
    userObj.hasPassword = Boolean(user.password && user.password.trim());
    delete (userObj as any).password;

    const payload = {
      sub: userObj._id,
      username: userObj.username,
      email: userObj.email || '',
      phone: userObj.phone || '',
      role: userObj.role,
      isVip: userObj.isVip,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: userObj,
    };
  }

  private async generateUniqueUsername(phone: string): Promise<string> {
    const digits = phone.replace(/\D/g, '');
    const suffix = digits.length >= 7 ? digits.slice(-7) : digits;
    const base = `user_${suffix}`;
    let candidate = base;
    let counter = 1;
    while (await this.usersService.findByUsernameOrEmail(candidate)) {
      candidate = `${base}_${counter}`;
      counter++;
    }
    return candidate;
  }

  async register(registerDto: RegisterDto) {
    if (!registerDto.fullName || !registerDto.fullName.trim()) {
      throw new BadRequestException('نام و نام خانوادگی الزامی است.');
    }

    if (!registerDto.phone || !registerDto.phone.trim()) {
      throw new BadRequestException('وارد کردن شماره موبایل الزامی است.');
    }

    const cleanPhone = normalizePhoneNumber(registerDto.phone);

    // Ensure phone is not already registered
    const existingPhone = await this.usersService.findByPhone(cleanPhone);
    if (existingPhone) {
      throw new ConflictException(
        'حساب کاربری با این شماره موبایل قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.',
      );
    }

    // Verify OTP code
    const rawCode = (registerDto.code || '').trim();
    if (!rawCode) {
      throw new BadRequestException('کد تایید ۵ رقمی الزامی است.');
    }

    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let cleanCode = rawCode;
    for (let i = 0; i < 10; i++) {
      cleanCode = cleanCode.replace(new RegExp(persianDigits[i], 'g'), i.toString());
      cleanCode = cleanCode.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    }

    // Find valid OTP record: verified in Step 2 or matching code
    let otpRecord = await this.otpModel
      .findOne({
        phone: cleanPhone,
        used: false,
        expiresAt: { $gt: new Date() },
        $or: [
          { isVerified: true },
          { code: cleanCode },
        ],
      })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      // Fallback check: any unexpired unused OTP for this phone
      otpRecord = await this.otpModel
        .findOne({
          phone: cleanPhone,
          used: false,
          expiresAt: { $gt: new Date() },
        })
        .sort({ createdAt: -1 });
    }

    if (!otpRecord) {
      // Fallback check 2: any OTP verified within the last 30 minutes for this phone
      otpRecord = await this.otpModel
        .findOne({
          phone: cleanPhone,
          isVerified: true,
          updatedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
        })
        .sort({ updatedAt: -1 });
    }

    if (!otpRecord) {
      throw new BadRequestException('کد تایید منقضی شده یا درخواستی یافت نشد. لطفاً مجدداً درخواست کد دهید.');
    }

    if (!otpRecord.isVerified && otpRecord.code !== cleanCode) {
      if (otpRecord.attempts >= 5) {
        otpRecord.used = true;
        await otpRecord.save();
        throw new BadRequestException('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.');
      }
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new BadRequestException('کد تایید وارد شده نادرست است.');
    }

    // Check optional password
    const rawPassword = registerDto.password?.trim() || '';
    if (rawPassword) {
      if (rawPassword.length < 6) {
        throw new BadRequestException('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      }
      if (registerDto.confirmPassword && rawPassword !== registerDto.confirmPassword.trim()) {
        throw new BadRequestException('رمز عبور با تکرار آن مطابقت ندارد.');
      }
    }

    // Determine username (optional)
    let username = registerDto.username?.trim().toLowerCase();
    if (!username) {
      username = await this.generateUniqueUsername(cleanPhone);
    } else {
      const existingUser = await this.usersService.findByUsernameOrEmail(username);
      if (existingUser) {
        throw new ConflictException('این نام کاربری قبلاً توسط کاربر دیگری ثبت شده است.');
      }
    }

    // Check optional email
    const cleanEmail = registerDto.email?.trim() ? registerDto.email.trim().toLowerCase() : undefined;
    if (cleanEmail) {
      const existingEmail = await this.userModel.findOne({ email: cleanEmail, deleted: false }).exec();
      if (existingEmail) {
        throw new ConflictException('این آدرس ایمیل قبلاً توسط کاربر دیگری ثبت شده است.');
      }
    }

    const createdUser = await this.usersService.create({
      fullName: registerDto.fullName.trim(),
      username,
      email: cleanEmail,
      phone: cleanPhone,
      password: rawPassword || undefined,
      birthDate: registerDto.birthDate,
      isPhoneVerified: true,
    } as any);

    // Mark OTP code as used ONLY after user creation is successful!
    otpRecord.used = true;
    await otpRecord.save();

    const userObj = createdUser.toObject();
    userObj.hasPassword = Boolean(createdUser.password && createdUser.password.trim());
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
      message: 'ثبت‌نام با موفقیت انجام شد.',
      accessToken: this.jwtService.sign(payload),
      user: userObj,
    };
  }

  async forgotPassword(identifier: string, channel: 'sms' | 'email' = 'sms') {
    const cleanId = (identifier || '').trim();
    if (!cleanId) {
      throw new BadRequestException('نام کاربری، شماره موبایل یا ایمیل الزامی است.');
    }

    const user = await this.usersService.findByUsernameOrEmail(cleanId);
    if (!user) {
      throw new NotFoundException('حساب کاربری با این مشخصات در سیستم یافت نشد.');
    }

    const selectedChannel = channel === 'email' ? 'email' : 'sms';
    let targetDestination = '';
    let maskedDestination = '';

    if (selectedChannel === 'email') {
      if (!user.email || !user.email.trim()) {
        throw new BadRequestException('برای این حساب کاربری آدرس ایمیلی ثبت نشده است.');
      }
      targetDestination = user.email.trim().toLowerCase();
      maskedDestination = targetDestination.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(Math.max(3, gp3.length)));
    } else {
      if (!user.phone || !user.phone.trim()) {
        throw new BadRequestException('برای این حساب کاربری شماره موبایلی ثبت نشده است.');
      }
      targetDestination = normalizePhoneNumber(user.phone);
      maskedDestination = targetDestination.replace(/(\d{4})(\d+)(\d{4})/, (m, p1, p2, p3) => `${p1}***${p3}`);
    }

    // Rate-limit & 2-minute expiration check (120 seconds)
    // Check if an active, unexpired OTP already exists
    const queryFilter: any = {
      used: false,
      purpose: 'reset-password',
      expiresAt: { $gt: new Date() },
    };
    if (selectedChannel === 'email') {
      queryFilter.email = targetDestination;
    } else {
      queryFilter.phone = targetDestination;
    }

    const recentOtp = await this.otpModel
      .findOne(queryFilter)
      .sort({ createdAt: -1 });

    if (recentOtp) {
      const elapsedSeconds = Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
      const waitSeconds = Math.max(1, 120 - elapsedSeconds);
      throw new BadRequestException({
        statusCode: 400,
        error: 'RATE_LIMIT',
        message: `کد تایید هنوز معتبر است. لطفاً ${waitSeconds} ثانیه دیگر جهت درخواست مجدد کد صبر کنید.`,
        retryAfter: waitSeconds,
        devCode: recentOtp.code,
      });
    }

    // Invalidate prior unused OTPs for this target & purpose
    const invalidateFilter: any = {
      used: false,
      purpose: 'reset-password',
    };
    if (selectedChannel === 'email') {
      invalidateFilter.email = targetDestination;
    } else {
      invalidateFilter.phone = targetDestination;
    }
    await this.otpModel.updateMany(invalidateFilter, { $set: { used: true } });

    // Generate random 5-digit code
    const generatedCode = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 120 * 1000); // Exactly 2 minutes (120 seconds)

    await this.otpModel.create({
      phone: selectedChannel === 'sms' ? targetDestination : (user.phone || undefined),
      email: selectedChannel === 'email' ? targetDestination : (user.email ? user.email.toLowerCase() : undefined),
      channel: selectedChannel,
      purpose: 'reset-password',
      code: generatedCode,
      expiresAt,
      used: false,
      isVerified: false,
      attempts: 0,
    });

    console.log('\n======================================================');
    console.log(`[HatefAroma Reset Password] User: ${user.username} | Channel: ${selectedChannel} | Destination: ${targetDestination}`);
    console.log(`[HatefAroma Reset Password] 🔑 Code: ${generatedCode} | ⏰ Valid for: 120s (2 minutes)`);
    console.log('======================================================\n');

    return {
      success: true,
      message: selectedChannel === 'sms'
        ? `کد تایید ۲ دقیقه‌ای به شماره ${maskedDestination} پیامک شد.`
        : `کد تایید ۲ دقیقه‌ای برای آدرس ایمیل ${maskedDestination} در سیستم ثبت شد.`,
      channel: selectedChannel,
      target: maskedDestination,
      expiresIn: 120,
      devCode: generatedCode, // Returned for dev testing in UI
    };
  }

  async resetPassword(identifier: string, code: string, newPassword: string, confirmPassword?: string) {
    const cleanId = (identifier || '').trim();
    if (!cleanId) {
      throw new BadRequestException('نام کاربری، شماره موبایل یا ایمیل الزامی است.');
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      throw new BadRequestException('رمز عبور جدید و تکرار آن یکسان نیستند.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
    }

    const user = await this.usersService.findByUsernameOrEmail(cleanId);
    if (!user) {
      throw new NotFoundException('حساب کاربری با این مشخصات در سیستم یافت نشد.');
    }

    // Convert Persian/Arabic digits to English digits
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

    // Match OTP by purpose and user's phone or email
    const matchConditions: any[] = [];
    if (user.phone) matchConditions.push({ phone: user.phone });
    if (user.email) matchConditions.push({ email: user.email.toLowerCase() });

    if (matchConditions.length === 0) {
      throw new BadRequestException('اطلاعات تماس معتبری برای این کاربر یافت نشد.');
    }

    const otpRecord = await this.otpModel
      .findOne({
        used: false,
        purpose: 'reset-password',
        expiresAt: { $gt: new Date() },
        $or: matchConditions,
      })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new BadRequestException(
        'کد تایید منقضی شده یا درخواستی یافت نشد. لطفاً مجدداً درخواست کد دهید.',
      );
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

    // Hash and update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return {
      success: true,
      message: 'رمز عبور با موفقیت تغییر یافت. اکنون می‌توانید با رمز جدید وارد شوید.',
    };
  }

  async sendOtp(phone: string, purpose: 'login' | 'register' | 'verify-phone' = 'login') {
    const cleanPhone = normalizePhoneNumber(phone);

    // Check account status based on purpose
    if (purpose === 'login') {
      const existingUser = await this.usersService.findByPhone(cleanPhone);
      if (!existingUser) {
        throw new NotFoundException(
          'حساب کاربری با این شماره موبایل یافت نشد. لطفاً ابتدا در سایت ثبت‌نام کنید.',
        );
      }
    } else if (purpose === 'register') {
      const existingUser = await this.usersService.findByPhone(cleanPhone);
      if (existingUser) {
        throw new ConflictException(
          'حساب کاربری با این شماره موبایل قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.',
        );
      }
    } else if (purpose === 'verify-phone') {
      const existingUser = await this.usersService.findByPhone(cleanPhone);
      if (existingUser) {
        throw new ConflictException(
          'این شماره موبایل قبلاً توسط حساب کاربری دیگری ثبت و تایید شده است.',
        );
      }
    }

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

    // Generate random 5-digit numeric code (valid for 5 minutes)
    const generatedCode = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes valid

    await this.otpModel.create({
      phone: cleanPhone,
      code: generatedCode,
      expiresAt,
      used: false,
      isVerified: false,
      attempts: 0,
    });

    // Console output for development without SMS gateway
    console.log('\n======================================================');
    console.log(`[HatefAroma OTP Service] 📱 Phone: ${cleanPhone} | 🔑 Code: ${generatedCode} (purpose: ${purpose})`);
    console.log(`[HatefAroma OTP Service] ⏰ Expires in 5 minutes (resend timer: 120s)`);
    console.log('======================================================\n');

    return {
      success: true,
      message: 'کد تایید یکبار مصرف با موفقیت ایجاد شد.',
      phone: cleanPhone,
      expiresIn: 120,
      devCode: generatedCode, // Returned for dev/testing in UI without SMS provider
    };
  }

  async verifyOtp(phone: string, code: string, purpose: 'login' | 'register' | 'verify-phone' = 'login') {
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

    // If purpose is register: Mark verified and extend validity by 30 minutes
    if (purpose === 'register') {
      const existingUser = await this.usersService.findByPhone(cleanPhone);
      if (existingUser) {
        throw new ConflictException(
          'حساب کاربری با این شماره موبایل قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.',
        );
      }

      otpRecord.isVerified = true;
      otpRecord.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes to complete profile
      await otpRecord.save();

      return {
        success: true,
        verified: true,
        message: 'کد تایید با موفقیت تایید شد.',
      };
    }

    // Mark as used
    otpRecord.used = true;
    await otpRecord.save();

    // Requirement 3: Only allow login if account exists - NO auto-creating account!
    const user = await this.usersService.findByPhone(cleanPhone);
    if (!user) {
      throw new NotFoundException(
        'حساب کاربری با این شماره موبایل یافت نشد. لطفاً ابتدا در سایت ثبت‌نام کنید.',
      );
    }

    if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }

    const userObj = user.toObject();
    userObj.hasPassword = Boolean(user.password && user.password.trim());
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
      message: 'ورود با موفقیت انجام شد.',
      accessToken: this.jwtService.sign(payload),
      user: userObj,
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
    userObj.hasPassword = Boolean(user.password && user.password.trim());
    delete (userObj as any).password;

    return {
      success: true,
      message: 'شماره موبایل شما با موفقیت تایید و ثبت شد.',
      user: userObj,
    };
  }
}
