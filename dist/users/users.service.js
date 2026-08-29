"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcryptjs");
const user_schema_1 = require("./schemas/user.schema");
const enums_1 = require("../common/enums");
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(createUserDto) {
        const existing = await this.userModel.findOne({
            $or: [
                { email: createUserDto.email.toLowerCase() },
                { username: createUserDto.username.toLowerCase() },
            ],
            deleted: false,
        });
        if (existing) {
            throw new common_1.ConflictException('کاربری با این ایمیل یا نام کاربری از قبل وجود دارد.');
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
    async findAll(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const pageSize = Math.max(1, Number(query.pageSize) || 20);
        const skip = (page - 1) * pageSize;
        const filter = { deleted: false };
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
    async findById(id) {
        const user = await this.userModel.findOne({ _id: id, deleted: false }).select('-password').exec();
        if (!user) {
            throw new common_1.NotFoundException('کاربر مورد نظر یافت نشد.');
        }
        return user;
    }
    async findByUsernameOrEmail(identifier) {
        const cleanId = identifier.trim().toLowerCase();
        return this.userModel
            .findOne({
            $or: [{ email: cleanId }, { username: cleanId }],
            deleted: false,
        })
            .exec();
    }
    async update(id, updateUserDto) {
        const user = await this.userModel.findOne({ _id: id, deleted: false });
        if (!user) {
            throw new common_1.NotFoundException('کاربر مورد نظر یافت نشد.');
        }
        if (updateUserDto.username) {
            const cleanUsername = updateUserDto.username.trim().toLowerCase();
            if (cleanUsername !== user.username) {
                const existingUser = await this.userModel.findOne({
                    _id: { $ne: id },
                    username: cleanUsername,
                    deleted: false,
                });
                if (existingUser) {
                    throw new common_1.ConflictException('این نام کاربری قبلاً توسط کاربر دیگری انتخاب شده است.');
                }
                user.username = cleanUsername;
            }
        }
        if (updateUserDto.email) {
            const cleanEmail = updateUserDto.email.trim().toLowerCase();
            if (cleanEmail !== user.email) {
                const existingEmail = await this.userModel.findOne({
                    _id: { $ne: id },
                    email: cleanEmail,
                    deleted: false,
                });
                if (existingEmail) {
                    throw new common_1.ConflictException('این آدرس ایمیل قبلاً توسط کاربر دیگری ثبت شده است.');
                }
                user.email = cleanEmail;
            }
        }
        if (updateUserDto.fullName !== undefined) {
            user.fullName = updateUserDto.fullName.trim();
        }
        if (updateUserDto.phone !== undefined) {
            user.phone = updateUserDto.phone.trim();
        }
        if (updateUserDto.avatar !== undefined) {
            user.avatar = updateUserDto.avatar;
        }
        if (updateUserDto.password) {
            if (!updateUserDto.currentPassword) {
                throw new common_1.BadRequestException('برای تغییر رمز عبور، وارد کردن کلمه عبور فعلی الزامی است.');
            }
            const isMatch = await bcrypt.compare(updateUserDto.currentPassword, user.password);
            if (!isMatch) {
                throw new common_1.BadRequestException('کلمه عبور فعلی وارد شده نادرست است.');
            }
            user.password = await bcrypt.hash(updateUserDto.password, 10);
        }
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
    async setRole(id, role) {
        const user = await this.findById(id);
        user.role = role;
        if (role === enums_1.UserRole.VIP) {
            user.isVip = true;
        }
        return user.save();
    }
    async toggleVip(id, isVip, durationDays) {
        const user = await this.findById(id);
        user.isVip = isVip;
        if (isVip) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));
            user.vipExpiresAt = expiresAt;
            if (user.role === enums_1.UserRole.USER) {
                user.role = enums_1.UserRole.VIP;
            }
        }
        else {
            user.vipExpiresAt = null;
            if (user.role === enums_1.UserRole.VIP) {
                user.role = enums_1.UserRole.USER;
            }
        }
        return user.save();
    }
    async softDelete(id) {
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map