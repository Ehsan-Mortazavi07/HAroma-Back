"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPanelAccess = hasPanelAccess;
exports.canManageRoles = canManageRoles;
exports.canManageUsers = canManageUsers;
exports.canManageCoupons = canManageCoupons;
exports.canManageVipPlans = canManageVipPlans;
exports.isVipActive = isVipActive;
const enums_1 = require("../common/enums");
function hasPanelAccess(role) {
    return role === enums_1.UserRole.ADMIN || role === enums_1.UserRole.EDITOR;
}
function canManageRoles(role) {
    return role === enums_1.UserRole.ADMIN;
}
function canManageUsers(role) {
    return role === enums_1.UserRole.ADMIN;
}
function canManageCoupons(role) {
    return role === enums_1.UserRole.ADMIN;
}
function canManageVipPlans(role) {
    return role === enums_1.UserRole.ADMIN;
}
function isVipActive(user) {
    if (!user)
        return false;
    if (user.role === enums_1.UserRole.ADMIN)
        return true;
    if (user.isVip) {
        if (!user.vipExpiresAt)
            return true;
        return new Date(user.vipExpiresAt).getTime() > Date.now();
    }
    return false;
}
//# sourceMappingURL=user-role.util.js.map