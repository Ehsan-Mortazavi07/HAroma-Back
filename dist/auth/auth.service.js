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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateUser(identifier, pass) {
        const user = await this.usersService.findByUsernameOrEmail(identifier);
        if (!user) {
            return null;
        }
        const isMatch = await bcrypt.compare(pass, user.password);
        if (isMatch) {
            const userObj = user.toObject();
            delete userObj.password;
            return userObj;
        }
        return null;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.identifier, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('نام کاربری/ایمیل یا رمز عبور اشتباه است.');
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
    async register(registerDto) {
        if (registerDto.password !== registerDto.confirmPassword) {
            throw new common_1.BadRequestException('رمز عبور با تکرار آن مطابقت ندارد.');
        }
        const createdUser = await this.usersService.create({
            fullName: registerDto.fullName,
            username: registerDto.username,
            email: registerDto.email,
            password: registerDto.password,
        });
        const userObj = createdUser.toObject();
        delete userObj.password;
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
    async forgotPassword(identifier) {
        const user = await this.usersService.findByUsernameOrEmail(identifier);
        if (!user) {
            throw new common_1.BadRequestException('کاربری با این مشخصات در سیستم یافت نشد.');
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
    async resetPassword(identifier, code, newPassword) {
        const user = await this.usersService.findByUsernameOrEmail(identifier);
        if (!user) {
            throw new common_1.BadRequestException('کاربری با این مشخصات در سیستم یافت نشد.');
        }
        if (!code || code.trim().length < 4) {
            throw new common_1.BadRequestException('کد تایید وارد شده نامعتبر است.');
        }
        if (!newPassword || newPassword.length < 6) {
            throw new common_1.BadRequestException('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        return {
            success: true,
            message: 'رمز عبور با موفقیت تغییر یافت. اکنون می‌توانید با رمز جدید وارد شوید.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map