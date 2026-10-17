/**
 * Tehran-local calendar helpers for reports. Iran has used a fixed UTC+03:30
 * offset since 2022, so day boundaries are computed without a tz database.
 */
export const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
export const TEHRAN_MONGO_TZ = '+03:30';
const DAY_MS = 86_400_000;

export const JALALI_MONTHS_FA = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const gDaysBeforeMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    gDaysBeforeMonth[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const monthDays = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= monthDays[gm]) {
    days -= monthDays[gm];
    gm++;
  }
  return [gy, gm, days + 1];
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Gregorian `YYYY-MM-DD` of the Tehran-local calendar day containing `date`. */
export function tehranDayKey(date: Date): string {
  return new Date(date.getTime() + TEHRAN_OFFSET_MS).toISOString().slice(0, 10);
}

/** UTC instant of Tehran-local midnight at the start of the day containing `date`. */
export function startOfTehranDay(date: Date): Date {
  const local = new Date(date.getTime() + TEHRAN_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - TEHRAN_OFFSET_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** UTC instant of Tehran midnight on the first day of the Jalali month/year containing `date`. */
export function startOfJalaliPeriod(date: Date, period: 'month' | 'year'): Date {
  const [gy, gm, gd] = tehranDayKey(date).split('-').map(Number);
  const [jy, jm] = gregorianToJalali(gy, gm, gd);
  const [sy, sm, sd] = jalaliToGregorian(jy, period === 'year' ? 1 : jm, 1);
  return new Date(Date.UTC(sy, sm - 1, sd) - TEHRAN_OFFSET_MS);
}

export type Granularity = 'day' | 'month' | 'year';

export interface Bucket {
  key: string;
  label: string;
}

/** Maps a Tehran gregorian day key (`YYYY-MM-DD`) to its Jalali reporting bucket. */
export function bucketForDay(dayKey: string, granularity: Granularity): Bucket {
  const [gy, gm, gd] = dayKey.split('-').map(Number);
  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  if (granularity === 'year') return { key: `${jy}`, label: `${jy}` };
  if (granularity === 'month') return { key: `${jy}-${pad(jm)}`, label: `${JALALI_MONTHS_FA[jm - 1]} ${jy}` };
  return { key: `${jy}-${pad(jm)}-${pad(jd)}`, label: `${jy}/${pad(jm)}/${pad(jd)}` };
}

/** Ordered, gap-free list of buckets covering [from, to). */
export function enumerateBuckets(from: Date, to: Date, granularity: Granularity): Bucket[] {
  const buckets: Bucket[] = [];
  const seen = new Set<string>();
  for (let cursor = startOfTehranDay(from); cursor < to; cursor = addDays(cursor, 1)) {
    const bucket = bucketForDay(tehranDayKey(cursor), granularity);
    if (!seen.has(bucket.key)) {
      seen.add(bucket.key);
      buckets.push(bucket);
    }
  }
  return buckets;
}
