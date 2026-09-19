import {
  currentJalaliPeriod,
  jalaliPeriodLabel,
  jalaliYmd,
  shiftJalaliPeriod,
} from "../format";
import type { PublicationState, SourceCadence, SourceDefinition } from "./types";

export interface Coverage {
  expectedPeriod: string;
  expectedPeriodLabel: string;
  state: PublicationState;
  note: string;
}

function daysInJalaliMonth(month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return 29;
}

/**
 * For a monthly source, the report covering month M typically appears
 * `lagDays` after M ends — i.e. on day `lagDays` of month M+1.
 */
export function coverageForSource(source: SourceDefinition, now: Date = new Date()): Coverage {
  const { year, month, day } = jalaliYmd(now);
  const current = currentJalaliPeriod(now);

  if (source.cadence === "annual") {
    const publishMonth = source.annualMonth ?? 2;
    const lag = source.lagDaysAfterMonthEnd;
    const yearCovered =
      month > publishMonth || (month === publishMonth && day >= lag) ? year : year - 1;
    const period = String(yearCovered);
    const due = month === publishMonth && day >= lag;
    return {
      expectedPeriod: period,
      expectedPeriodLabel: `سال ${period}`,
      state: due ? "due" : "current",
      note:
        source.cadence === "annual"
          ? `جدول سالانه معمولاً از ماه ${publishMonth} سال بعد قابل مشاهده است.`
          : "",
    };
  }

  if (source.cadence === "on-change" || source.cadence === "continuous") {
    return {
      expectedPeriod: current,
      expectedPeriodLabel: jalaliPeriodLabel(current),
      state: "current",
      note:
        source.cadence === "continuous"
          ? "منبع پیوسته است؛ جاب فقط در دسترس‌بودن را ثبت می‌کند."
          : "منبع رویدادی است؛ فقط وقتی صفحه عوض شود هشدار بازبینی می‌آید.",
    };
  }

  const lag = Math.max(1, source.lagDaysAfterMonthEnd);
  const previous = shiftJalaliPeriod(current, -1);
  const older = shiftJalaliPeriod(current, -2);

  if (day < lag) {
    return {
      expectedPeriod: older,
      expectedPeriodLabel: jalaliPeriodLabel(older),
      state: "waiting",
      note: `گزارش ${jalaliPeriodLabel(previous)} معمولاً از روز ${lag} این ماه منتشر می‌شود.`,
    };
  }

  const monthLength = daysInJalaliMonth(month);
  const overdueFrom = Math.min(monthLength, lag + 10);
  if (day >= overdueFrom) {
    return {
      expectedPeriod: previous,
      expectedPeriodLabel: jalaliPeriodLabel(previous),
      state: source.kind === "internal" ? "current" : "due",
      note: `موعد گزارش ${jalaliPeriodLabel(previous)} گذشته است؛ اگر اثرانگشت صفحه عوض نشده باشد منبع را دستی بررسی کنید.`,
    };
  }

  return {
    expectedPeriod: previous,
    expectedPeriodLabel: jalaliPeriodLabel(previous),
    state: "due",
    note: `پنجره واکشی گزارش ${jalaliPeriodLabel(previous)} باز است.`,
  };
}

export function nextWatchDate(now: Date = new Date()): Date {
  const { day } = jalaliYmd(now);
  const watchDays = [3, 8, 12, 18, 25];
  const nextDay = watchDays.find((candidate) => candidate > day);
  const result = new Date(now.getTime());
  if (nextDay) {
    const delta = nextDay - day;
    result.setDate(result.getDate() + delta);
  } else {
    result.setDate(result.getDate() + (32 - day));
  }
  result.setUTCHours(5, 30, 0, 0);
  return result;
}

export function cadenceNote(cadence: SourceCadence): string {
  switch (cadence) {
    case "monthly":
      return "هر ماه پس از انتشار گزارش دوره قبل واکشی می‌شود.";
    case "annual":
      return "معمولاً یک‌بار در سال (اوایل سال جلالی) بازبینی می‌شود.";
    case "on-change":
      return "فقط وقتی سند یا بخشنامه عوض شود.";
    case "continuous":
      return "وضعیت پیوسته؛ جاب سلامت منبع را می‌سنجد.";
  }
}
