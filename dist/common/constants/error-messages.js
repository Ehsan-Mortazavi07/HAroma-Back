"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessages = void 0;
exports.ErrorMessages = {
    UNAUTHORIZED: 'لطفاً ابتدا وارد حساب کاربری خود شوید.',
    FORBIDDEN: 'شما سطح دسترسی لازم برای انجام این عملیات را ندارید.',
    USER_NOT_FOUND: 'کاربر مورد نظر یافت نشد.',
    INVALID_CREDENTIALS: 'نام کاربری/ایمیل یا رمز عبور اشتباه است.',
    EMAIL_OR_USERNAME_EXISTS: 'نام کاربری یا ایمیل وارد شده قبلاً در سیستم ثبت شده است.',
    PASSWORDS_DO_NOT_MATCH: 'رمز عبور با تکرار آن یکسان نمی‌باشد.',
    PRODUCT_NOT_FOUND: 'محصول مورد نظر یافت نشد.',
    CATEGORY_NOT_FOUND: 'دسته‌بندی مورد نظر یافت نشد.',
    ATTRIBUTE_NOT_FOUND: 'ویژگی مورد نظر یافت نشد.',
    COUPON_NOT_FOUND: 'کد تخفیف معتبر نمی‌باشد.',
    COUPON_EXPIRED_OR_INACTIVE: 'این کد تخفیف منقضی شده یا غیرفعال است.',
    COUPON_LIMIT_REACHED: 'سقف استفاده از این کد تخفیف به پایان رسیده است.',
    COUPON_MIN_PURCHASE: (min) => `حداقل مبلغ خرید برای استفاده از این کد تخفیف ${min.toLocaleString('fa-IR')} تومان است.`,
    VIP_PLAN_NOT_FOUND: 'پلن اشتراک VIP یافت نشد.',
    ORDER_NOT_FOUND: 'سفارش مورد نظر یافت نشد.',
    EMPTY_CART: 'سبد خرید شما خالی می‌باشد.',
    INVALID_OBJECT_ID: 'شناسه وارد شده معتبر نمی‌باشد.',
    PAGE_SECTION_NOT_FOUND: 'بخش مورد نظر از صفحه یافت نشد.',
};
//# sourceMappingURL=error-messages.js.map