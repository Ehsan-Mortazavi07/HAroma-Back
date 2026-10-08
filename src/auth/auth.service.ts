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
import { ensureUniqueAddressTitles } from '../users/address-title.util';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private normalizeOtpCode(code: string): string {
    return code
      .trim()
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  }

  private hashOtp(code: string, purpose: string, recipient: string): string {
    return createHmac('sha256', this.configService.getOrThrow<string>('JWT_SECRET'))
      .update(`${purpose}:${recipient}:${code}`)
      .digest('hex');
  }

  private otpMatches(storedHash: string | undefined, code: string, purpose: string, recipient: string): boolean {
    if (!storedHash || !/^[a-f\d]{64}$/i.test(storedHash)) return false;
    const expectedHash = Buffer.from(this.hashOtp(code, purpose, recipient), 'hex');
    const candidateHash = Buffer.from(storedHash, 'hex');
    return candidateHash.length === expectedHash.length && timingSafeEqual(candidateHash, expectedHash);
  }

  private ensureOtpDeliveryIsAvailable(): void {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ServiceUnavailableException(
        'ارسال کد یکبارمصرف تا پیکربندی ارائه‌دهنده پیامک و ایمیل در محیط production فعال نیست.',
      );
    }
  }

  private async recordOtpFailure(otpId: unknown, attempts: number): Promise<void> {
    const update: Record<string, unknown> = { $inc: { attempts: 1 } };
    if (attempts >= 4) update.$set = { used: true };
    await this.otpModel.findOneAndUpdate(
      { _id: otpId, used: false, attempts: { $lt: 5 } },
      update,
    ).exec();
  }

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
      throw new UnauthorizedException('نام کاربری یا رمز عبور نادرست است.');
    }

    // Requirement 2: Login with email requires isEmailVerified
    if (isEmailLike && !user.isEmailVerified) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور نادرست است.');
    }

    if (!user.password) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور نادرست است.');
    }

    // Requirement 4: If user exists but password is wrong
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور نادرست است.');
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
      tokenVersion: user.tokenVersion || 0,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: userObj,
    };
  }

  private async generateUniqueUsername(phone?: string): Promise<string> {
    const digits = (phone || '').replace(/\D/g, '');
    const suffix = digits.length >= 7 ? digits.slice(-7) : digits;
    const base = suffix ? `user_${suffix}` : 'user';

    while (true) {
      const candidate = suffix ? `${base}_${randomBytes(3).toString('hex')}` : `${base}_${randomBytes(5).toString('hex')}`;
      if (!(await this.usersService.findByUsernameOrEmail(candidate))) {
        return candidate;
      }
    }
  }

  async register(registerDto: RegisterDto) {
    if (!registerDto.fullName || !registerDto.fullName.trim()) {
      throw new BadRequestException('نام و نام خانوادگی الزامی است.');
    }

    const cleanPhone = registerDto.phone?.trim() ? normalizePhoneNumber(registerDto.phone) : undefined;

    if (cleanPhone) {
      const existingPhone = await this.usersService.findByPhone(cleanPhone);
      if (existingPhone) {
        throw new ConflictException(
          'حساب کاربری با این شماره موبایل قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.',
        );
      }
    }

    const rawPassword = registerDto.password?.trim() || '';
    if (rawPassword.length < 8) {
      throw new BadRequestException('رمز عبور باید حداقل ۸ کاراکتر باشد.');
    }
    if (rawPassword !== registerDto.confirmPassword?.trim()) {
      throw new BadRequestException('رمز عبور با تکرار آن مطابقت ندارد.');
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
      const existingEmail = await this.userModel.findOne({ email: cleanEmail, deleted: { $ne: true } }).exec();
      if (existingEmail) {
        throw new ConflictException('این آدرس ایمیل قبلاً توسط کاربر دیگری ثبت شده است.');
      }
    }

    const createdUser = await this.usersService.create({
      fullName: registerDto.fullName.trim(),
      username,
      email: cleanEmail,
      phone: cleanPhone || '',
      password: rawPassword,
      birthDate: registerDto.birthDate,
      isPhoneVerified: false,
    } as any);

    const userObj = createdUser.toObject();
    userObj.hasPassword = Boolean(createdUser.password && createdUser.password.trim());
    delete (userObj as any).password;

    const payload = {
      sub: userObj._id,
      username: userObj.username,
      email: userObj.email || '',
      phone: userObj.phone || '',
      role: userObj.role,
      isVip: userObj.isVip,
      tokenVersion: createdUser.tokenVersion || 0,
    };

    return {
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد.',
      accessToken: this.jwtService.sign(payload),
      user: userObj,
    };
  }

  async forgotPassword(identifier?: string, channel: 'sms' | 'email' = 'sms', authHeader?: string) {
    this.ensureOtpDeliveryIsAvailable();
    let user: UserDocument | null = null;

    // 1. If authorization header is present, lock strictly to the logged-in user
    if (authHeader) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token) {
          const payload: any = this.jwtService.verify(token);
          const userId = payload.sub || payload.id || payload._id;
          if (userId) {
            user = await this.userModel.findOne({ _id: userId, deleted: { $ne: true } }).exec();
          }
        }
      } catch (err) {
        // Fall back to identifier if token is invalid or expired
      }
    }

    // 2. If not authenticated, find by identifier
    if (!user) {
      const cleanId = (identifier || '').trim();
      if (!cleanId) {
        throw new BadRequestException('نام کاربری، شماره موبایل یا ایمیل الزامی است.');
      }
      user = await this.usersService.findByUsernameOrEmail(cleanId);
      if (!user) {
        return {
          success: true,
          message: 'اگر حساب کاربری با این مشخصات وجود داشته باشد، راهنمای بازیابی ارسال می‌شود.',
        };
      }
    }

    const selectedChannel = channel === 'email' ? 'email' : 'sms';
    let targetDestination = '';
    let maskedDestination = '';

    if (selectedChannel === 'email') {
      if (!user.email || !user.email.trim() || !user.isEmailVerified) {
        return {
          success: true,
          message: 'اگر حساب کاربری با این مشخصات وجود داشته باشد، راهنمای بازیابی ارسال می‌شود.',
        };
      }
      targetDestination = user.email.trim().toLowerCase();
      maskedDestination = targetDestination.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(Math.max(3, gp3.length)));
    } else {
      if (!user.phone || !user.phone.trim()) {
        return {
          success: true,
          message: 'اگر حساب کاربری با این مشخصات وجود داشته باشد، راهنمای بازیابی ارسال می‌شود.',
        };
      }
      targetDestination = normalizePhoneNumber(user.phone);
      maskedDestination = targetDestination.replace(/(\d{4})(\d+)(\d{4})/, (m, p1, p2, p3) => `${p1}***${p3}`);
    }

    // Rate-limit & 2-minute expiration check (120 seconds) strictly per channel
    const queryFilter: any = {
      used: false,
      channel: selectedChannel,
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
        message: `کد تایید ${selectedChannel === 'sms' ? 'پیامک' : 'ایمیل'} هنوز معتبر است. لطفاً ${waitSeconds} ثانیه دیگر جهت درخواست مجدد صبر کنید.`,
        retryAfter: waitSeconds,
        channel: selectedChannel,
      });
    }

    // Invalidate prior unused OTPs ONLY for this channel & target
    const invalidateFilter: any = {
      used: false,
      channel: selectedChannel,
      purpose: 'reset-password',
    };
    if (selectedChannel === 'email') {
      invalidateFilter.email = targetDestination;
    } else {
      invalidateFilter.phone = targetDestination;
    }
    await this.otpModel.updateMany(invalidateFilter, { $set: { used: true } });

    // Generate random 5-digit code unique to this channel
    const generatedCode = String(randomInt(10000, 100000));
    const expiresAt = new Date(Date.now() + 120 * 1000); // Exactly 2 minutes (120 seconds)

    await this.otpModel.create({
      phone: selectedChannel === 'sms' ? targetDestination : undefined,
      email: selectedChannel === 'email' ? targetDestination : undefined,
      channel: selectedChannel,
      purpose: 'reset-password',
      codeHash: this.hashOtp(generatedCode, 'reset-password', targetDestination),
      expiresAt,
      used: false,
      isVerified: false,
      attempts: 0,
    });

    return {
      success: true,
      message: selectedChannel === 'sms'
        ? `کد تایید ۲ دقیقه‌ای به شماره ${maskedDestination} پیامک شد.`
        : `کد تایید ۲ دقیقه‌ای برای آدرس ایمیل ${maskedDestination} در سیستم ثبت شد.`,
      channel: selectedChannel,
      target: maskedDestination,
      expiresIn: 120,
      ...(this.configService.get<string>('NODE_ENV') === 'production' ? {} : { devCode: generatedCode }),
    };
  }

  async resetPassword(
    identifier?: string,
    code?: string,
    newPassword?: string,
    confirmPassword?: string,
    channel?: 'sms' | 'email',
    authHeader?: string,
  ) {
    let user: UserDocument | null = null;

    // 1. If authorization header is present, lock strictly to the logged-in user
    if (authHeader) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token) {
          const payload: any = this.jwtService.verify(token);
          const userId = payload.sub || payload.id || payload._id;
          if (userId) {
            user = await this.userModel.findOne({ _id: userId, deleted: { $ne: true } }).exec();
          }
        }
      } catch (err) {}
    }

    // 2. If not authenticated, find by identifier
    if (!user) {
      const cleanId = (identifier || '').trim();
      if (!cleanId) {
        throw new BadRequestException('نام کاربری، شماره موبایل یا ایمیل الزامی است.');
      }
      user = await this.usersService.findByUsernameOrEmail(cleanId);
      if (!user) {
        throw new BadRequestException('کد تایید یا مشخصات واردشده معتبر نیست.');
      }
    }

    if (!confirmPassword || newPassword !== confirmPassword) {
      throw new BadRequestException('رمز عبور جدید و تکرار آن یکسان نیستند.');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.');
    }

    const cleanCode = this.normalizeOtpCode(code || '');

    if (!/^\d{5}$/.test(cleanCode)) {
      throw new BadRequestException('کد تایید وارد شده نامعتبر است.');
    }

    // Match OTP by purpose and channel if specified, or by user's phone or email
    const matchConditions: any[] = [];
    if (user.phone && (!channel || channel === 'sms')) {
      matchConditions.push({ phone: normalizePhoneNumber(user.phone), channel: 'sms' });
    }
    if (user.email && user.isEmailVerified && (!channel || channel === 'email')) {
      matchConditions.push({ email: user.email.trim().toLowerCase(), channel: 'email' });
    }

    if (matchConditions.length === 0) {
      throw new BadRequestException('اطلاعات تماس معتبری برای این کاربر یافت نشد.');
    }

    const resetOtpFilter = {
      used: false,
      purpose: 'reset-password',
      expiresAt: { $gt: new Date() },
      $or: matchConditions,
    };
    const otpRecord = await this.otpModel
      .findOne(resetOtpFilter)
      .sort({ createdAt: -1 })
      .select('+codeHash')
      .exec();

    if (!otpRecord) {
      throw new BadRequestException(
        'کد تایید منقضی شده یا درخواستی یافت نشد. لطفاً مجدداً درخواست کد دهید.',
      );
    }

    if (otpRecord.attempts >= 5) {
      throw new BadRequestException('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.');
    }

    const recipient = otpRecord.phone || otpRecord.email || '';
    const codeHash = this.hashOtp(cleanCode, 'reset-password', recipient);
    if (!this.otpMatches(otpRecord.codeHash, cleanCode, 'reset-password', recipient)) {
      await this.recordOtpFailure(otpRecord._id, otpRecord.attempts);
      throw new BadRequestException('کد تایید وارد شده نادرست است.');
    }

    const claimedOtp = await this.otpModel.findOneAndUpdate(
      { ...resetOtpFilter, _id: otpRecord._id, codeHash },
      { $set: { used: true } },
      { new: true },
    ).exec();
    if (!claimedOtp) {
      throw new BadRequestException('کد تایید منقضی یا قبلاً استفاده شده است. لطفاً مجدداً درخواست کد دهید.');
    }

    // Invalidate all other active reset-password OTPs for this user across both channels
    await this.otpModel.updateMany(
      {
        used: false,
        purpose: 'reset-password',
        $or: [
          ...(user.phone ? [{ phone: normalizePhoneNumber(user.phone) }] : []),
          ...(user.email ? [{ email: user.email.trim().toLowerCase() }] : []),
        ],
      },
      { $set: { used: true } },
    );

    // Hash and update password
    user.password = await bcrypt.hash(newPassword, 12);
    user.hasPassword = true;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    ensureUniqueAddressTitles(user.addresses || []);
    await user.save();

    return {
      success: true,
      message: 'رمز عبور با موفقیت تغییر یافت. اکنون می‌توانید با رمز جدید وارد شوید.',
    };
  }

  async sendOtp(
    phone: string,
    purpose: 'login' | 'register' | 'verify-phone' = 'login',
    currentUserId?: string,
  ) {
    this.ensureOtpDeliveryIsAvailable();
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
      if (!currentUserId) {
        throw new UnauthorizedException('برای تایید شماره موبایل ابتدا وارد حساب کاربری شوید.');
      }
      const existingUser = await this.userModel.findOne({
        _id: { $ne: currentUserId },
        phone: cleanPhone,
        deleted: { $ne: true },
      }).exec();
      if (existingUser) {
        throw new ConflictException(
          'این شماره موبایل قبلاً توسط حساب کاربری دیگری ثبت و تایید شده است.',
        );
      }
    }

    // Rate-limit: 120 seconds (2 minutes) anti-flood
    const recentOtp = await this.otpModel
      .findOne({
        phone: cleanPhone,
        purpose,
        used: false,
        createdAt: { $gte: new Date(Date.now() - 120 * 1000) },
      })
      .sort({ createdAt: -1 });

    if (recentOtp) {
      const elapsedSeconds = Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
      const waitSeconds = Math.max(1, 120 - elapsedSeconds);
      throw new BadRequestException({
        statusCode: 400,
        error: 'RATE_LIMIT',
        message: `لطفاً قبل از ارسال مجدد کد، ${waitSeconds} ثانیه صبر کنید.`,
        retryAfter: waitSeconds,
      });
    }

    // Invalidate prior unused OTPs for this phone
    await this.otpModel.updateMany(
      { phone: cleanPhone, purpose, used: false },
      { $set: { used: true } },
    );

    const generatedCode = String(randomInt(10000, 100000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes valid

    await this.otpModel.create({
      phone: cleanPhone,
      channel: 'sms',
      purpose,
      codeHash: this.hashOtp(generatedCode, purpose, cleanPhone),
      expiresAt,
      used: false,
      isVerified: false,
      attempts: 0,
    });

    return {
      success: true,
      message: 'کد تایید یکبار مصرف با موفقیت ایجاد شد.',
      phone: cleanPhone.replace(/^(\d{4})\d+(\d{2})$/, '$1***$2'),
      expiresIn: 120,
      ...(this.configService.get<string>('NODE_ENV') === 'production' ? {} : { devCode: generatedCode }),
    };
  }

  async verifyOtp(phone: string, code: string, purpose: 'login' | 'register' | 'verify-phone' = 'login') {
    if (purpose === 'verify-phone') {
      throw new BadRequestException('برای تایید شماره حساب، از مسیر تایید شماره کاربر استفاده کنید.');
    }
    const cleanPhone = normalizePhoneNumber(phone);
    const cleanCode = this.normalizeOtpCode(code || '');
    if (!/^\d{5}$/.test(cleanCode)) {
      throw new BadRequestException('کد تایید وارد شده نامعتبر است.');
    }

    const otpRecord = await this.otpModel
      .findOne({
        phone: cleanPhone,
        purpose,
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .select('+codeHash')
      .exec();

    if (!otpRecord) {
      throw new BadRequestException('کد تایید منقضی شده یا درخواستی یافت نشد. لطفاً مجدداً درخواست کد دهید.');
    }

    if (otpRecord.attempts >= 5) {
      await this.otpModel.updateOne({ _id: otpRecord._id, used: false }, { $set: { used: true } }).exec();
      throw new BadRequestException('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.');
    }

    if (!this.otpMatches(otpRecord.codeHash, cleanCode, purpose, cleanPhone)) {
      await this.recordOtpFailure(otpRecord._id, otpRecord.attempts);
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

      const verifiedOtp = await this.otpModel.findOneAndUpdate(
        { _id: otpRecord._id, purpose: 'register', used: false, codeHash: otpRecord.codeHash },
        { $set: { isVerified: true, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } },
        { new: true },
      ).exec();
      if (!verifiedOtp) {
        throw new BadRequestException('کد تایید منقضی یا قبلاً استفاده شده است. لطفاً مجدداً درخواست کد دهید.');
      }

      return {
        success: true,
        verified: true,
        message: 'کد تایید با موفقیت تایید شد.',
      };
    }

    const user = await this.usersService.findByPhone(cleanPhone);
    if (!user) {
      throw new NotFoundException(
        'حساب کاربری با این شماره موبایل یافت نشد. لطفاً ابتدا در سایت ثبت‌نام کنید.',
      );
    }

    const claimedOtp = await this.otpModel.findOneAndUpdate(
      {
        _id: otpRecord._id,
        phone: cleanPhone,
        purpose: 'login',
        used: false,
        expiresAt: { $gt: new Date() },
        codeHash: otpRecord.codeHash,
      },
      { $set: { used: true } },
      { new: true },
    ).exec();
    if (!claimedOtp) {
      throw new BadRequestException('کد تایید منقضی یا قبلاً استفاده شده است. لطفاً مجدداً درخواست کد دهید.');
    }

    if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      ensureUniqueAddressTitles(user.addresses || []);
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
      tokenVersion: user.tokenVersion || 0,
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
    const cleanCode = this.normalizeOtpCode(code || '');
    if (!/^\d{5}$/.test(cleanCode)) {
      throw new BadRequestException('کد تایید وارد شده نامعتبر است.');
    }

    const otpRecord = await this.otpModel
      .findOne({
        phone: cleanPhone,
        purpose: 'verify-phone',
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .select('+codeHash')
      .exec();

    if (!otpRecord) {
      throw new BadRequestException('کد تایید منقضی شده یا درخواستی یافت نشد. لطفاً مجدداً درخواست کد دهید.');
    }

    if (otpRecord.attempts >= 5) {
      await this.otpModel.updateOne({ _id: otpRecord._id, used: false }, { $set: { used: true } }).exec();
      throw new BadRequestException('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.');
    }

    if (!this.otpMatches(otpRecord.codeHash, cleanCode, 'verify-phone', cleanPhone)) {
      await this.recordOtpFailure(otpRecord._id, otpRecord.attempts);
      throw new BadRequestException('کد تایید وارد شده نادرست است.');
    }

    // Check if another user already has this phone
    const existingOther = await this.userModel.findOne({
      _id: { $ne: userId },
      phone: cleanPhone,
      deleted: { $ne: true },
    });
    if (existingOther) {
      throw new ConflictException('این شماره موبایل قبلاً توسط حساب کاربری دیگری تایید شده است.');
    }

    const user = await this.userModel.findOne({ _id: userId, deleted: false });
    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد.');
    }

    const claimedOtp = await this.otpModel.findOneAndUpdate(
      { _id: otpRecord._id, phone: cleanPhone, purpose: 'verify-phone', used: false, codeHash: otpRecord.codeHash },
      { $set: { used: true } },
      { new: true },
    ).exec();
    if (!claimedOtp) {
      throw new BadRequestException('کد تایید منقضی یا قبلاً استفاده شده است. لطفاً مجدداً درخواست کد دهید.');
    }

    user.phone = cleanPhone;
    user.isPhoneVerified = true;
    ensureUniqueAddressTitles(user.addresses || []);
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
