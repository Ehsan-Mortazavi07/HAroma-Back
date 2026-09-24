import { BadRequestException } from '@nestjs/common';

/**
 * Normalizes an Iranian mobile phone number into 11 digits format (e.g., 09123456789)
 * Supports Persian and Arabic digits, +98, 0098, 98, or leading 9.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new BadRequestException('شماره موبایل الزامی است.');
  }

  // Convert Persian and Arabic digits to English
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let cleaned = rawPhone.trim();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    cleaned = cleaned.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }

  // Remove non-digit characters (+, spaces, dashes)
  cleaned = cleaned.replace(/\D/g, '');

  // Handle +98 or 0098 prefixes
  if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '0' + cleaned;
  }

  // Validate Iranian mobile standard: 11 digits, starts with 09
  if (!/^09\d{9}$/.test(cleaned)) {
    throw new BadRequestException(
      'شماره موبایل وارد شده نامعتبر است. شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).',
    );
  }

  return cleaned;
}
