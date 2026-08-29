import { UserRole as Role } from '../common/enums';
import { UserDocument } from './schemas/user.schema';

export function hasPanelAccess(role?: string): boolean {
  return role === Role.ADMIN || role === Role.EDITOR;
}

export function canManageRoles(role?: string): boolean {
  return role === Role.ADMIN;
}

export function canManageUsers(role?: string): boolean {
  return role === Role.ADMIN;
}

export function canManageCoupons(role?: string): boolean {
  return role === Role.ADMIN;
}

export function canManageVipPlans(role?: string): boolean {
  return role === Role.ADMIN;
}

export function isVipActive(user?: UserDocument | any): boolean {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true;
  if (user.isVip) {
    if (!user.vipExpiresAt) return true;
    return new Date(user.vipExpiresAt).getTime() > Date.now();
  }
  return false;
}
