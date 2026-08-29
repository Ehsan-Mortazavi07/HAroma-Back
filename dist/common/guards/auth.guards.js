"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminOnlyGuard = exports.AdminGuard = exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const error_messages_1 = require("../constants/error-messages");
const user_role_util_1 = require("../../users/user-role.util");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new common_1.UnauthorizedException(error_messages_1.ErrorMessages.UNAUTHORIZED);
        }
        return user;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);
let AdminGuard = class AdminGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException(error_messages_1.ErrorMessages.UNAUTHORIZED);
        }
        if (!(0, user_role_util_1.hasPanelAccess)(user.role)) {
            throw new common_1.ForbiddenException(error_messages_1.ErrorMessages.FORBIDDEN);
        }
        return true;
    }
};
exports.AdminGuard = AdminGuard;
exports.AdminGuard = AdminGuard = __decorate([
    (0, common_1.Injectable)()
], AdminGuard);
let SuperAdminOnlyGuard = class SuperAdminOnlyGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException(error_messages_1.ErrorMessages.UNAUTHORIZED);
        }
        if (user.role !== 'admin') {
            throw new common_1.ForbiddenException('این بخش منحصراً برای مدیر کل (Admin) مجاز می‌باشد.');
        }
        return true;
    }
};
exports.SuperAdminOnlyGuard = SuperAdminOnlyGuard;
exports.SuperAdminOnlyGuard = SuperAdminOnlyGuard = __decorate([
    (0, common_1.Injectable)()
], SuperAdminOnlyGuard);
//# sourceMappingURL=auth.guards.js.map