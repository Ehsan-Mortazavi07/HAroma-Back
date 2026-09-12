import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from './dtos';
import { UserRole } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email.toLowerCase() },
        { username: createUserDto.username.toLowerCase() },
      ],
      deleted: false,
    });

    if (existing) {
      throw new ConflictException('کاربری با این ایمیل یا نام کاربری از قبل وجود دارد.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      username: createUserDto.username.toLowerCase(),
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
    return this.userModel
      .findOne({
        $or: [{ email: cleanId }, { username: cleanId }],
        deleted: false,
      })
      .exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findOne({ _id: id, deleted: false });
    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد.');
    }

    // 1. Username uniqueness check
    if (updateUserDto.username) {
      const cleanUsername = updateUserDto.username.trim().toLowerCase();
      if (cleanUsername !== user.username) {
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
    if (updateUserDto.email) {
      const cleanEmail = updateUserDto.email.trim().toLowerCase();
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
    }

    // 3. Full Name & Phone
    if (updateUserDto.fullName !== undefined) {
      user.fullName = updateUserDto.fullName.trim();
    }
    if (updateUserDto.phone !== undefined) {
      user.phone = updateUserDto.phone.trim();
    }
    if (updateUserDto.avatar !== undefined) {
      user.avatar = updateUserDto.avatar;
    }
    if (updateUserDto.birthDate !== undefined) {
      user.birthDate = updateUserDto.birthDate ? updateUserDto.birthDate.trim() : null;
    }
    if (updateUserDto.birthDateShamsi !== undefined) {
      user.birthDateShamsi = updateUserDto.birthDateShamsi ? updateUserDto.birthDateShamsi.trim() : null;
    }
    if (updateUserDto.province !== undefined) {
      user.province = updateUserDto.province ? updateUserDto.province.trim() : undefined;
    }
    if (updateUserDto.city !== undefined) {
      user.city = updateUserDto.city ? updateUserDto.city.trim() : undefined;
    }
    if (updateUserDto.address !== undefined) {
      user.address = updateUserDto.address ? updateUserDto.address.trim() : undefined;
    }
    if (updateUserDto.postalCode !== undefined) {
      user.postalCode = updateUserDto.postalCode ? updateUserDto.postalCode.trim() : undefined;
    }
    if (updateUserDto.buildingNumber !== undefined) {
      user.buildingNumber = updateUserDto.buildingNumber ? updateUserDto.buildingNumber.trim() : undefined;
    }
    if (updateUserDto.unit !== undefined) {
      user.unit = updateUserDto.unit ? updateUserDto.unit.trim() : undefined;
    }
    if (updateUserDto.recipientName !== undefined) {
      user.recipientName = updateUserDto.recipientName ? updateUserDto.recipientName.trim() : undefined;
    }
    if (updateUserDto.recipientPhone !== undefined) {
      user.recipientPhone = updateUserDto.recipientPhone ? updateUserDto.recipientPhone.trim() : undefined;
    }

    // 4. Password change with current password validation
    if (updateUserDto.password) {
      if (!updateUserDto.currentPassword) {
        throw new BadRequestException('برای تغییر رمز عبور، وارد کردن کلمه عبور فعلی الزامی است.');
      }
      const isMatch = await bcrypt.compare(updateUserDto.currentPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('کلمه عبور فعلی وارد شده نادرست است.');
      }
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 5. Admin role or VIP flags (if applicable)
    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }
    if (updateUserDto.isVip !== undefined) {
      user.isVip = updateUserDto.isVip;
    }
    if (updateUserDto.vipExpiresAt !== undefined) {
      user.vipExpiresAt = updateUserDto.vipExpiresAt;
    }

    await user.save();
    return this.findById(id);
  }

  async setRole(id: string, role: UserRole): Promise<UserDocument> {
    const user = await this.findById(id);
    user.role = role;
    if (role === UserRole.VIP) {
      user.isVip = true;
    }
    return user.save();
  }

  async toggleVip(id: string, isVip: boolean, durationDays?: number): Promise<UserDocument> {
    const user = await this.findById(id);
    user.isVip = isVip;
    if (isVip) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));
      user.vipExpiresAt = expiresAt;
      if (user.role === UserRole.USER) {
        user.role = UserRole.VIP;
      }
    } else {
      user.vipExpiresAt = null;
      if (user.role === UserRole.VIP) {
        user.role = UserRole.USER;
      }
    }
    return user.save();
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);
    user.deleted = true;
    await user.save();
    return { success: true, message: 'کاربر با موفقیت حذف شد.' };
  }

  async countTotal() {
    return this.userModel.countDocuments({ deleted: false });
  }

  async countVip() {
    return this.userModel.countDocuments({ isVip: true, deleted: false });
  }
}
