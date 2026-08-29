import { UserRole } from '../../common/enums';
export declare class CreateUserDto {
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    role?: UserRole;
}
export declare class UpdateUserDto {
    fullName?: string;
    username?: string;
    email?: string;
    phone?: string;
    currentPassword?: string;
    password?: string;
    role?: UserRole;
    isVip?: boolean;
    vipExpiresAt?: Date;
    avatar?: string;
}
export declare class UpdateUserRoleDto {
    role: UserRole;
}
export declare class UpdateUserVipDto {
    isVip: boolean;
    durationDays?: number;
}
