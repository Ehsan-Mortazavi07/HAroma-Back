import { UserDocument } from './schemas/user.schema';
export declare function hasPanelAccess(role?: string): boolean;
export declare function canManageRoles(role?: string): boolean;
export declare function canManageUsers(role?: string): boolean;
export declare function canManageCoupons(role?: string): boolean;
export declare function canManageVipPlans(role?: string): boolean;
export declare function isVipActive(user?: UserDocument | any): boolean;
