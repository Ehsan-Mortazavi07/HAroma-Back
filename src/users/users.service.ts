import { Injectable, NotFoundException, ConflictException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from './dtos';
import { UserRole } from '../common/enums';
import { normalizePhoneNumber } from '../auth/utils/phone.util';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    // 1. Automatically normalize any legacy records where role was stored as 'vip'
    try {
      await this.userModel.updateMany(
        { role: 'vip' as any },
        { $set: { role: UserRole.USER, isVip: true } },
      );
    } catch {
      // Ignored if DB is still establishing connection
    }

    // 2. Physical purge of any lingering soft-deleted users
    try {
      await this.userModel.deleteMany({ deleted: true });
    } catch {}

    // 3. Drop legacy email_1 index if it does not have partialFilterExpression
    try {
      const indexes = await this.userModel.collection.indexes();
      const emailIndex = indexes.find((idx) => idx.name === 'email_1');
      if (emailIndex && !emailIndex.partialFilterExpression) {
        await this.userModel.collection.dropIndex('email_1');
      }
    } catch {}

    // 4. Ensure admin and editor accounts have isEmailVerified & isPhoneVerified true
    try {
      await this.userModel.updateMany(
        { role: { $in: [UserRole.ADMIN, UserRole.EDITOR] } },
        { $set: { isEmailVerified: true, isPhoneVerified: true } },
      );
    } catch {}
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const cleanUsername = createUserDto.username.trim().toLowerCase();
    const cleanEmail = createUserDto.email?.trim() ? createUserDto.email.trim().toLowerCase() : undefined;
    const cleanPhone = createUserDto.phone?.trim() ? createUserDto.phone.trim() : undefined;

    const orConditions: any[] = [{ username: cleanUsername }];
    if (cleanEmail) {
      orConditions.push({ email: cleanEmail });
    }
    if (cleanPhone) {
      orConditions.push({ phone: cleanPhone });
    }

    const existing = await this.userModel.findOne({
      $or: orConditions,
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        throw new ConflictException('این نام کاربری قبلاً توسط کاربر دیگری ثبت شده است.');
      }
      if (cleanEmail && existing.email === cleanEmail) {
        throw new ConflictException('این آدرس ایمیل قبلاً توسط کاربر دیگری ثبت شده است.');
      }
      if (cleanPhone && existing.phone === cleanPhone) {
        throw new ConflictException('این شماره تماس قبلاً توسط کاربر دیگری ثبت شده است.');
      }
      throw new ConflictException('کاربری با این مشخصات از قبل وجود دارد.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword,
    });
    return user.save();
  }

  async findAll(query: { page?: number; pageSize?: number; q?: string; role?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 20);
    const skip = (page - 1) * pageSize;

    const filter: any = { deleted: false };
    if (query.q) {
      filter.$or = [
        { fullName: { $regex: query.q, $options: 'i' } },
        { email: { $regex: query.q, $options: 'i' } },
        { username: { $regex: query.q, $options: 'i' } },
        { phone: { $regex: query.q, $options: 'i' } },
      ];
    }
    if (query.role) {
      filter.role = query.role;
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ _id: id, deleted: false }).select('-password').exec();
    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد.');
    }
    return user;
  }

  async findByUsernameOrEmail(identifier: string): Promise<UserDocument | null> {
    const cleanId = identifier.trim().toLowerCase();
    const orConditions: any[] = [
      { username: cleanId },
      { email: cleanId },
      { phone: cleanId },
    ];

    try {
      const normalized = normalizePhoneNumber(identifier);
      if (normalized && normalized !== cleanId) {
        orConditions.push({ phone: normalized });
      }
    } catch {}

    return this.userModel
      .findOne({
        $or: orConditions,
        deleted: false,
      })
      .exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    const cleanPhone = phone.trim();
    return this.userModel.findOne({ phone: cleanPhone, deleted: false }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto, isAdmin: boolean = false): Promise<UserDocument> {
    const user = await this.userModel.findOne({ _id: id, deleted: false });
    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد.');
    }

    // 1. Username uniqueness check
    if (updateUserDto.username !== undefined) {
      const cleanUsername = (updateUserDto.username || '').trim().toLowerCase();
      if (cleanUsername && cleanUsername !== user.username) {
        const existingUser = await this.userModel.findOne({
          _id: { $ne: id },
          username: cleanUsername,
          deleted: false,
        });
        if (existingUser) {
          throw new ConflictException('این نام کاربری قبلاً توسط کاربر دیگری انتخاب شده است.');
        }
        user.username = cleanUsername;
      }
    }

    // 2. Email uniqueness check
    if (updateUserDto.email !== undefined) {
      const cleanEmail = (updateUserDto.email || '').trim().toLowerCase();
      if (cleanEmail) {
        if (cleanEmail !== user.email) {
          const existingEmail = await this.userModel.findOne({
            _id: { $ne: id },
            email: cleanEmail,
            deleted: false,
          });
          if (existingEmail) {
            throw new ConflictException('این آدرس ایمیل قبلاً توسط کاربر دیگری ثبت شده است.');
          }
          user.email = cleanEmail;
        }
      } else {
        user.email = undefined;
      }
    }

    // 3. Full Name & Phone
    if (updateUserDto.fullName !== undefined) {
      user.fullName = (updateUserDto.fullName || '').trim();
    }
    if (updateUserDto.phone !== undefined) {
      user.phone = (updateUserDto.phone || '').trim();
    }
    if (updateUserDto.avatar !== undefined) {
      user.avatar = updateUserDto.avatar || '';
    }
    if (updateUserDto.birthDate !== undefined) {
      user.birthDate = updateUserDto.birthDate ? updateUserDto.birthDate.trim() : null;
    }
    if (updateUserDto.birthDateShamsi !== undefined) {
      user.birthDateShamsi = updateUserDto.birthDateShamsi ? updateUserDto.birthDateShamsi.trim() : null;
    }
    if (updateUserDto.province !== undefined) {
      user.province = (updateUserDto.province || '').trim();
    }
    if (updateUserDto.city !== undefined) {
      user.city = (updateUserDto.city || '').trim();
    }
    if (updateUserDto.address !== undefined) {
      user.address = (updateUserDto.address || '').trim();
    }
    if (updateUserDto.postalCode !== undefined) {
      user.postalCode = (updateUserDto.postalCode || '').trim();
    }
    if (updateUserDto.buildingNumber !== undefined) {
      user.buildingNumber = (updateUserDto.buildingNumber || '').trim();
    }
    if (updateUserDto.unit !== undefined) {
      user.unit = (updateUserDto.unit || '').trim();
    }
    if (updateUserDto.recipientName !== undefined) {
      user.recipientName = (updateUserDto.recipientName || '').trim();
    }
    if (updateUserDto.recipientPhone !== undefined) {
      user.recipientPhone = (updateUserDto.recipientPhone || '').trim();
    }
    if (updateUserDto.recipientEmail !== undefined) {
      user.recipientEmail = (updateUserDto.recipientEmail || '').trim().toLowerCase();
    }
    if (updateUserDto.addressNotes !== undefined) {
      user.addressNotes = (updateUserDto.addressNotes || '').trim();
    }

    // 4. Password change: Admin can update without currentPassword, regular users must provide it
    if (updateUserDto.password) {
      if (!isAdmin) {
        if (!updateUserDto.currentPassword) {
          throw new BadRequestException('برای تغییر رمز عبور، وارد کردن کلمه عبور فعلی الزامی است.');
        }
        const isMatch = await bcrypt.compare(updateUserDto.currentPassword, user.password);
        if (!isMatch) {
          throw new BadRequestException('کلمه عبور فعلی وارد شده نادرست است.');
        }
      }
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 5. Admin-only role and VIP flags
    if (isAdmin) {
      if (updateUserDto.role !== undefined) {
        user.role = updateUserDto.role;
      }
      if (updateUserDto.isVip !== undefined) {
        user.isVip = updateUserDto.isVip;
        if (!user.isVip) {
          user.vipExpiresAt = null;
        }
      }
      if (updateUserDto.vipExpiresAt !== undefined) {
        user.vipExpiresAt = updateUserDto.vipExpiresAt;
      }
    }

    await user.save();
    return this.findById(id);
  }

  async setRole(id: string, role: UserRole, currentUserId?: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (
      currentUserId &&
      (id === currentUserId || user._id.toString() === currentUserId) &&
      role !== UserRole.ADMIN
    ) {
      throw new BadRequestException('شما نمی‌توانید سطح دسترسی حساب کاربری جاری خود را تنزل دهید.');
    }
    user.role = role;
    return user.save();
  }

  async toggleVip(id: string, isVip: boolean, durationDays?: number): Promise<UserDocument> {
    const user = await this.findById(id);
    user.isVip = isVip;
    if (isVip) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));
      user.vipExpiresAt = expiresAt;
    } else {
      user.vipExpiresAt = null;
    }
    // Normalize any legacy 'vip' role to standard 'user'
    if ((user.role as string) === 'vip') {
      user.role = UserRole.USER;
    }
    return user.save();
  }

  async softDelete(id: string, currentUserId?: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);
    const targetIdStr = user._id.toString();
    const currentIdStr = currentUserId?.toString();

    if (currentIdStr && (id === currentIdStr || targetIdStr === currentIdStr)) {
      throw new BadRequestException('امکان حذف حساب کاربری جاری خودتان وجود ندارد.');
    }

    // Physical hard delete directly from database
    await this.userModel.deleteOne({ _id: user._id });
    return { success: true, message: 'کاربر با موفقیت از پایگاه داده حذف شد.' };
  }

  async bulkUpdateVip(
    ids: string[],
    isVip: boolean,
    durationDays?: number,
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const expiresAt = isVip ? new Date() : null;
    if (isVip && expiresAt) {
      expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));
    }
    const result = await this.userModel.updateMany(
      { _id: { $in: validIds }, deleted: false },
      { $set: { isVip, vipExpiresAt: expiresAt } },
    );
    return { success: true, modifiedCount: result.modifiedCount };
  }

  async bulkSoftDelete(ids: string[], currentUserId?: string): Promise<{ success: boolean; modifiedCount: number }> {
    const currentIdStr = currentUserId?.toString();
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .filter((id) => !currentIdStr || id.toString() !== currentIdStr)
      .map((id) => new Types.ObjectId(id));

    if (validIds.length === 0) {
      if (currentIdStr && ids.some((id) => id.toString() === currentIdStr)) {
        throw new BadRequestException('امکان حذف حساب کاربری جاری خودتان وجود ندارد.');
      }
      return { success: true, modifiedCount: 0 };
    }

    // Physical hard delete directly from database
    const result = await this.userModel.deleteMany({ _id: { $in: validIds } });
    return { success: true, modifiedCount: result.deletedCount };
  }

  async countTotal() {
    return this.userModel.countDocuments({ deleted: false });
  }

  async countVip() {
    return this.userModel.countDocuments({ isVip: true, deleted: false });
  }
}
