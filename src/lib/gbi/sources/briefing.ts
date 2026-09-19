import { getDashboardFromCorpus, getGuildsOverviewFromCorpus, type Corpus } from "../compute";
import { formatPercent, formatToman, jalaliPeriodLabel } from "../format";
import type { BriefingMover, MonthlyBriefing } from "./types";

function toneForDelta(delta: number): "gold" | "persian" | "rose" | "slate" {
  if (delta <= -5) return "rose";
  if (delta >= 5) return "persian";
  return "gold";
}

/**
 * Auto-generated monthly intelligence brief from the active corpus.
 * This is what the dashboard and sources page show after each Jalali month
 * rolls — even when official PDFs are unreachable from GitHub.
 */
export function buildMonthlyBriefing(
  corpus: Corpus,
  previous: MonthlyBriefing | null = null,
): MonthlyBriefing {
  const dashboard = getDashboardFromCorpus(corpus);
  const guilds = getGuildsOverviewFromCorpus(corpus);
  const period = corpus.latestPeriod;
  const periodLabel = jalaliPeriodLabel(period);
  const volumeDelta = dashboard.totals.volumeDeltaPct;
  const floatDelta = dashboard.totals.floatDeltaPct;

  const movers: BriefingMover[] = [...guilds.bcgMatrix.points]
    .sort((a, b) => Math.abs(b.growthPct) - Math.abs(a.growthPct))
    .slice(0, 5)
    .map((point) => ({
      id: point.id,
      title: point.title,
      volume: point.volume,
      growthPct: point.growthPct,
      quadrant: point.quadrant,
      profitabilityLabel: point.profitabilityLabel,
    }));

  const watchouts = dashboard.alerts
    .filter((alert) => alert.severity !== "info")
    .map((alert) => `${alert.title}: ${alert.detail}`);

  const stars = guilds.bcgMatrix.points.filter((point) => point.quadrant === "STAR").length;
  const dogs = guilds.bcgMatrix.points.filter((point) => point.quadrant === "DOG").length;

  const narrative = [
    `دوره جاری ${periodLabel} است. گردش نمونه شبکه ${formatToman(dashboard.totals.totalTxVolume)} و رسوب جاری ${formatToman(dashboard.totals.totalFloat)} ثبت شده است.`,
    volumeDelta === 0
      ? "برای این دوره هنوز مبنای مقایسه ماه قبل در دسترس نیست یا تغییر گردش صفر است."
      : `گردش نسبت به ${jalaliPeriodLabel(corpus.prevPeriod)} ${volumeDelta >= 0 ? "افزایش" : "کاهش"} ${formatPercent(Math.abs(volumeDelta))} داشته است.`,
    `حاشیه خالص ماهانه بانک در این نمونه ${formatToman(dashboard.totals.netMargin)} است؛ ${stars} رسته در ربع ستاره و ${dogs} رسته در ربع سگ قرار دارند.`,
    "ارقام واحدها نمونه آموزشی‌اند. نرخ کارمزد و تقویم انتشار از منابع رسمی فهرست‌شده در همین صفحه پیروی می‌کند.",
  ];

  const comparedToPreviousBriefing =
    previous && previous.period !== period
      ? `خلاصه قبلی مربوط به ${previous.periodLabel} بود؛ پنجره گزارش یک ماه جلو آمده است.`
      : previous && previous.period === period
        ? "همان دوره قبلی دوباره محاسبه شد؛ پنجره جلالی عوض نشده است."
        : null;

  const headline =
    volumeDelta <= -5
      ? `هشدار ${periodLabel}: افت گردش شبکه اصناف`
      : volumeDelta >= 5
        ? `${periodLabel}: رشد گردش و فرصت توسعه پایانه`
        : `ماهنامه هوش اصناف — ${periodLabel}`;

  return {
    period,
    periodLabel,
    headline,
    narrative,
    highlights: [
      {
        title: "گردش شبکه",
        detail: `${formatToman(dashboard.totals.totalTxVolume)} (${formatPercent(volumeDelta)} نسبت به ماه قبل)`,
        tone: toneForDelta(volumeDelta),
      },
      {
        title: "رسوب جاری",
        detail: `${formatToman(dashboard.totals.totalFloat)} (${formatPercent(floatDelta)} نسبت به ماه قبل)`,
        tone: toneForDelta(floatDelta),
      },
      {
        title: "حاشیه خالص بانک",
        detail: formatToman(dashboard.totals.netMargin),
        tone: dashboard.totals.netMargin >= 0 ? "gold" : "rose",
      },
      {
        title: "کیفیت داده",
        detail: `${dashboard.dataQuality.score} از ۱۰۰`,
        tone: dashboard.dataQuality.score >= 95 ? "persian" : "rose",
      },
    ],
    movers,
    watchouts: watchouts.length ? watchouts : ["در آستانه‌های فعلی هشدار عملیاتی فعالی نیست."],
    comparedToPreviousBriefing,
  };
}
