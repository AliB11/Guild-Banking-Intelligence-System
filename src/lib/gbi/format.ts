/* ------------------------------------------------------------------ */
/* Persian / Jalali formatting utilities                               */
/* ------------------------------------------------------------------ */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** تبدیل ارقام لاتین به فارسی */
export function faDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** جداکننده هزارگان + ارقام فارسی */
export function formatNum(n: number): string {
  return faDigits(new Intl.NumberFormat("fa-IR").format(Math.round(n)));
}

export function formatDecimal(n: number, decimals = 1): string {
  return faDigits(
    new Intl.NumberFormat("fa-IR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(n),
  );
}

/** ریال → تومان */
export function rialToToman(rials: number): number {
  return rials / 10;
}

/** درصد فارسی */
export function formatPercent(n: number, decimals = 1): string {
  return `${formatDecimal(n, decimals)}٪`;
}

/**
 * نمایش فشرده پول به تومان با واحد فارسی
 * مثال: ۱۲٫۴ میلیارد تومان / ۸۵۰ میلیون تومان / ۴۲۰ هزار تومان
 */
export function formatToman(
  rials: number,
  options: { decimals?: number; withUnit?: boolean } = {},
): string {
  const { decimals = 1, withUnit = true } = options;
  const abs = Math.abs(rials);
  const toman = rialToToman(abs);
  const sign = rials < 0 ? "−" : "";

  let value: string;
  let unit: string;
  if (toman >= 1_000_000_000_000) {
    value = formatDecimal(toman / 1_000_000_000_000, decimals);
    unit = "همت";
  } else if (toman >= 1_000_000_000) {
    value = formatDecimal(toman / 1_000_000_000, decimals);
    unit = "میلیارد تومان";
  } else if (toman >= 1_000_000) {
    value = formatDecimal(toman / 1_000_000, decimals);
    unit = "میلیون تومان";
  } else if (toman >= 1_000) {
    value = formatDecimal(toman / 1_000, decimals);
    unit = "هزار تومان";
  } else {
    value = formatNum(toman);
    unit = "تومان";
  }
  return `${sign}${value}${withUnit ? ` ${unit}` : ""}`;
}

/** Compact count for billion-scale Shaparak totals. */
export function formatCount(n: number, decimals = 2): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}${formatDecimal(abs / 1_000_000_000, decimals)} میلیارد`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${formatDecimal(abs / 1_000_000, decimals)} میلیون`;
  }
  return `${sign}${formatNum(abs)}`;
}

/** نمایش فشرده عدد ریال خام (برای تولتیپ‌ها) */
export function formatRial(rials: number): string {
  return `${formatNum(rials)} ریال`;
}

/** برچسب کوتاه برای محور نمودارها (تومان فشرده) */
export function chartMoneyTick(rials: number): string {
  const toman = rialToToman(Math.abs(rials));
  if (toman >= 1_000_000_000_000) return `${formatDecimal(toman / 1_000_000_000_000, 0)} همت`;
  if (toman >= 1_000_000_000) return `${formatDecimal(toman / 1_000_000_000, 0)} م.ت`;
  if (toman >= 1_000_000) return `${formatDecimal(toman / 1_000_000, 0)} م.م`;
  return faDigits(Math.round(toman));
}

/* ------------------------------------------------------------------ */
/* Jalali calendar                                                     */
/* ------------------------------------------------------------------ */

export function gregorianToJalali(
  gy: number,
  gm: number,
  gd: number,
): [number, number, number] {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gdm[gm - 1];
  void gDaysInMonth;

  let jy = -1595 + 33 * Math.floor(days / 12053);
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

export function formatJalaliDate(date: Date): string {
  const [jy, jm, jd] = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  return `${faDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${faDigits(jy)}`;
}

/** "1403-08" → "آبان ۱۴۰۳" */
export function jalaliPeriodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return faDigits(period);
  return `${JALALI_MONTHS[m - 1]} ${faDigits(y)}`;
}

export function jalaliPeriodShort(period: string): string {
  const [, m] = period.split("-").map(Number);
  if (!m || m < 1 || m > 12) return faDigits(period);
  return JALALI_MONTHS[m - 1];
}

export interface JalaliYmd {
  year: number;
  month: number;
  day: number;
}

export function jalaliYmd(date: Date = new Date()): JalaliYmd {
  const [year, month, day] = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  return { year, month, day };
}

export function formatJalaliPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function currentJalaliPeriod(date: Date = new Date()): string {
  const { year, month } = jalaliYmd(date);
  return formatJalaliPeriod(year, month);
}

export function parseJalaliPeriod(period: string): { year: number; month: number } | null {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return null;
  return { year, month };
}

/** Shift a `YYYY-MM` Jalali period by a (possibly negative) number of months. */
export function shiftJalaliPeriod(period: string, deltaMonths: number): string {
  const parsed = parseJalaliPeriod(period);
  if (!parsed) return period;
  const absolute = parsed.year * 12 + (parsed.month - 1) + deltaMonths;
  const year = Math.floor(absolute / 12);
  const month = (absolute % 12) + 1;
  return formatJalaliPeriod(year, month);
}

/**
 * Rolling reporting window — the `count` most recent Jalali months, ending
 * with the month the given date falls in. Keeps "دوره جاری" aligned with the
 * real calendar instead of a hard-coded snapshot, e.g. on ۲۸ شهریور ۱۴۰۵ with
 * count 6 → ["1405-01", "1405-02", "1405-03", "1405-04", "1405-05", "1405-06"].
 */
export function recentJalaliPeriods(count: number, date: Date = new Date()): string[] {
  const latest = currentJalaliPeriod(date);
  const periods: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    periods.push(shiftJalaliPeriod(latest, -i));
  }
  return periods;
}
