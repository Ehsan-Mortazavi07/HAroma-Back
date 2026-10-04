import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, CreateAddressDto, UpdateAddressDto } from './dtos';
import { UserRole } from '../common/enums';
import { normalizePhoneNumber } from '../auth/utils/phone.util';
import { addressTitleKey, ensureUniqueAddressTitles, normalizeAddressTitle } from './address-title.util';
import { normalizeSearchQuery } from '../common/utils/search.util';
import { parsePage, parsePageSize } from '../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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

    const hashedPassword = createUserDto.password?.trim()
      ? await bcrypt.hash(createUserDto.password.trim(), 12)
      : '';
    const user = new this.userModel({
      ...createUserDto,
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword,
    });
    return user.save();
  }

  async findAll(query: { page?: number; pageSize?: number; q?: string; role?: string }) {
    const page = parsePage(query.page);
    const pageSize = parsePageSize(query.pageSize);
    const skip = (page - 1) * pageSize;

    const filter: any = { deleted: false };
    const searchQuery = normalizeSearchQuery(query.q, 100);
    if (searchQuery) {
      filter.$or = [
        { fullName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { username: { $regex: searchQuery, $options: 'i' } },
        { phone: { $regex: searchQuery, $options: 'i' } },
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
    const user = await this.userModel.findOne({ _id: id, deleted: false }).exec();
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
          user.isEmailVerified = false;
        }
      } else {
        user.email = undefined;
        user.isEmailVerified = false;
      }
    }

    // 3. Full Name & Phone
    if (updateUserDto.fullName !== undefined) {
      user.fullName = (updateUserDto.fullName || '').trim();
    }
    if (updateUserDto.phone !== undefined) {
      const cleanPhone = (updateUserDto.phone || '').trim();
      if (!isAdmin && cleanPhone !== (user.phone || '')) {
        throw new BadRequestException(
          'تغییر یا ثبت شماره موبایل تنها از طریق بخش تایید شماره با کد یکبار مصرف (OTP) امکان‌پذیر است.',
        );
      }
      if (isAdmin) {
        if (cleanPhone && cleanPhone !== user.phone) {
          const existingPhone = await this.userModel.findOne({
            _id: { $ne: id },
            phone: cleanPhone,
            deleted: false,
          });
          if (existingPhone) {
            throw new ConflictException('این شماره تماس قبلاً توسط حساب کاربری دیگری ثبت شده است.');
          }
        }
        user.phone = cleanPhone;
      }
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

    // 4. Password change: Admin can update without currentPassword, regular users must provide it if they already have a password
    if (updateUserDto.password) {
      const hasExistingPassword = Boolean(user.password && user.password.trim());
      if (!isAdmin && hasExistingPassword) {
        if (!updateUserDto.currentPassword) {
          throw new BadRequestException('برای تغییر رمز عبور، وارد کردن کلمه عبور فعلی الزامی است.');
        }
        const isMatch = await bcrypt.compare(updateUserDto.currentPassword, user.password);
        if (!isMatch) {
          throw new BadRequestException('کلمه عبور فعلی وارد شده نادرست است.');
        }
      }
      user.password = await bcrypt.hash(updateUserDto.password, 12);
      user.tokenVersion = (user.tokenVersion || 0) + 1;
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

    this.ensureAddressTitles(user);
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
    this.ensureAddressTitles(user);
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
    this.ensureAddressTitles(user);
    return user.save();
  }

  async softDelete(id: string, currentUserId?: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);
    const targetIdStr = user._id.toString();
    const currentIdStr = currentUserId?.toString();

    if (currentIdStr && (id === currentIdStr || targetIdStr === currentIdStr)) {
      throw new BadRequestException('امکان حذف حساب کاربری جاری خودتان وجود ندارد.');
    }

    await this.userModel.updateOne({ _id: user._id }, { $set: { deleted: true } });
    return { success: true, message: 'کاربر با موفقیت حذف شد.' };
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

    const result = await this.userModel.updateMany(
      { _id: { $in: validIds }, deleted: false },
      { $set: { deleted: true } },
    );
    return { success: true, modifiedCount: result.modifiedCount };
  }

  async countTotal() {
    return this.userModel.countDocuments({ deleted: false });
  }

  async countVip() {
    return this.userModel.countDocuments({ isVip: true, deleted: false });
  }

  // ==========================================
  // MULTIPLE ADDRESSES MANAGEMENT
  // ==========================================

  private ensureAddressTitles(user: UserDocument) {
    return ensureUniqueAddressTitles(user.addresses || []);
  }

  private syncUserTopLevelAddress(user: UserDocument, addr: any) {
    if (addr) {
      user.province = (addr.province || '').trim();
      user.city = (addr.city || '').trim();
      user.address = (addr.address || '').trim();
      user.postalCode = (addr.postalCode || '').trim();
      user.buildingNumber = (addr.buildingNumber || '').trim();
      user.unit = (addr.unit || '').trim();
      user.recipientName = (addr.recipientName || '').trim();
      user.recipientPhone = (addr.recipientPhone || '').trim();
      user.recipientEmail = (addr.recipientEmail || '').trim();
      user.addressNotes = (addr.addressNotes || '').trim();
    } else {
      user.province = '';
      user.city = '';
      user.address = '';
      user.postalCode = '';
      user.buildingNumber = '';
      user.unit = '';
      user.recipientName = '';
      user.recipientPhone = '';
      user.recipientEmail = '';
      user.addressNotes = '';
    }
  }

  async getAddresses(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد.');

    let addresses = user.addresses || [];
    let shouldSave = this.ensureAddressTitles(user);

    // Auto-migrate legacy top-level address if addresses array is empty
    if (addresses.length === 0 && user.address && user.city) {
      const legacyAddress: any = {
        _id: new Types.ObjectId().toString(),
        title: 'نشانی پیش‌فرض',
        province: user.province || '',
        city: user.city || '',
        address: user.address || '',
        postalCode: user.postalCode || '',
        buildingNumber: user.buildingNumber || '',
        unit: user.unit || '',
        recipientName: user.recipientName || user.fullName || '',
        recipientPhone: user.recipientPhone || user.phone || '',
        recipientEmail: user.recipientEmail || user.email || '',
        addressNotes: user.addressNotes || '',
        isDefault: true,
      };
      user.addresses = [legacyAddress];
      addresses = user.addresses;
      shouldSave = true;
    }

    // Ensure at least one address is default if addresses exist
    const hasDefault = addresses.some((a) => a.isDefault);
    if (!hasDefault && addresses.length > 0) {
      addresses[0].isDefault = true;
      this.syncUserTopLevelAddress(user, addresses[0]);
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save();
    }

    return [...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد.');

    if (!user.addresses) user.addresses = [];
    this.ensureAddressTitles(user);

    // Auto-migrate legacy top-level address if addresses array is empty before adding new one
    if (user.addresses.length === 0 && user.address && user.city) {
      const legacyAddress: any = {
        _id: new Types.ObjectId().toString(),
        title: 'نشانی ۱',
        province: user.province || '',
        city: user.city || '',
        address: user.address || '',
        postalCode: user.postalCode || '',
        buildingNumber: user.buildingNumber || '',
        unit: user.unit || '',
        recipientName: user.recipientName || user.fullName || '',
        recipientPhone: user.recipientPhone || user.phone || '',
        recipientEmail: user.recipientEmail || user.email || '',
        addressNotes: user.addressNotes || '',
        isDefault: true,
      };
      user.addresses.push(legacyAddress);
    }

    // If it's the only address or dto asks for default, set it as default
    const shouldBeDefault = user.addresses.length === 0 || Boolean(dto.isDefault);

    const title = normalizeAddressTitle(dto.title);
    if (!title) {
      throw new BadRequestException('عنوان نشانی الزامی است.');
    }
    const titleKey = addressTitleKey(title);
    if (user.addresses.some((address) => addressTitleKey(address.title) === titleKey)) {
      throw new ConflictException('این عنوان نشانی قبلاً برای این کاربر ثبت شده است.');
    }

    if (shouldBeDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    const newAddress: any = {
      _id: new Types.ObjectId().toString(),
      title,
      province: (dto.province || '').trim(),
      city: (dto.city || '').trim(),
      address: (dto.address || '').trim(),
      postalCode: (dto.postalCode || '').trim(),
      buildingNumber: (dto.buildingNumber || '').trim(),
      unit: (dto.unit || '').trim(),
      recipientName: (dto.recipientName || '').trim() || user.fullName,
      recipientPhone: (dto.recipientPhone || '').trim() || user.phone || '',
      recipientEmail: (dto.recipientEmail || '').trim() || user.email || '',
      addressNotes: (dto.addressNotes || '').trim(),
      isDefault: shouldBeDefault,
    };

    user.addresses.push(newAddress);

    if (shouldBeDefault) {
      this.syncUserTopLevelAddress(user, newAddress);
    }

    await user.save();

    return {
      success: true,
      message: 'نشانی جدید با موفقیت ثبت شد.',
      address: newAddress,
      addresses: [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)),
    };
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد.');

    const targetAddress = user.addresses?.find((a) => a._id?.toString() === addressId?.toString());
    if (!targetAddress) throw new NotFoundException('نشانی مورد نظر یافت نشد.');

    if (dto.isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      targetAddress.isDefault = true;
    }

    if (dto.title !== undefined) {
      const title = normalizeAddressTitle(dto.title);
      if (!title) {
        throw new BadRequestException('عنوان نشانی نمی‌تواند خالی باشد.');
      }
      const titleKey = addressTitleKey(title);
      if (
        user.addresses.some(
          (address) =>
            address._id?.toString() !== targetAddress._id?.toString() &&
            addressTitleKey(address.title) === titleKey,
        )
      ) {
        throw new ConflictException('این عنوان نشانی قبلاً برای این کاربر ثبت شده است.');
      }
      targetAddress.title = title;
    }
    if (dto.province !== undefined) targetAddress.province = (dto.province || '').trim();
    if (dto.city !== undefined) targetAddress.city = (dto.city || '').trim();
    if (dto.address !== undefined) targetAddress.address = (dto.address || '').trim();
    if (dto.postalCode !== undefined) targetAddress.postalCode = (dto.postalCode || '').trim();
    if (dto.buildingNumber !== undefined) targetAddress.buildingNumber = (dto.buildingNumber || '').trim();
    if (dto.unit !== undefined) targetAddress.unit = (dto.unit || '').trim();
    if (dto.recipientName !== undefined) targetAddress.recipientName = (dto.recipientName || '').trim();
    if (dto.recipientPhone !== undefined) targetAddress.recipientPhone = (dto.recipientPhone || '').trim();
    if (dto.recipientEmail !== undefined) targetAddress.recipientEmail = (dto.recipientEmail || '').trim();
    if (dto.addressNotes !== undefined) targetAddress.addressNotes = (dto.addressNotes || '').trim();

    if (targetAddress.isDefault) {
      this.syncUserTopLevelAddress(user, targetAddress);
    }

    this.ensureAddressTitles(user);
    await user.save();

    return {
      success: true,
      message: 'نشانی با موفقیت ویرایش شد.',
      address: targetAddress,
      addresses: [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)),
    };
  }

  async deleteAddress(userId: string, addressId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد.');

    const index = user.addresses?.findIndex((a) => a._id?.toString() === addressId?.toString());
    if (index === -1 || index === undefined) throw new NotFoundException('نشانی مورد نظر یافت نشد.');

    const wasDefault = user.addresses[index].isDefault;
    user.addresses.splice(index, 1);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
      this.syncUserTopLevelAddress(user, user.addresses[0]);
    } else if (user.addresses.length === 0) {
      this.syncUserTopLevelAddress(user, null);
    }

    this.ensureAddressTitles(user);
    await user.save();

    return {
      success: true,
      message: 'نشانی با موفقیت حذف شد.',
      addresses: [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)),
    };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد.');

    const target = user.addresses?.find((a) => a._id?.toString() === addressId?.toString());
    if (!target) throw new NotFoundException('نشانی مورد نظر یافت نشد.');

    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    target.isDefault = true;

    this.syncUserTopLevelAddress(user, target);

    this.ensureAddressTitles(user);
    await user.save();

    return {
      success: true,
      message: 'نشانی پیش‌فرض با موفقیت تعیین شد.',
      addresses: [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)),
    };
  }
}
