import { getDashboardFromCorpus, getGuildsOverviewFromCorpus, type Corpus } from "../compute";
import { formatCount, formatPercent, formatToman, jalaliPeriodLabel } from "../format";
import {
  CBI_FEE_EXEMPT_HINT,
  DATA_GAPS,
  MELLAT_MORDAD_ACQUIRER_SHARE,
  MORDAD_INSTRUMENTS,
} from "../published-market";
import type { BriefingMover, MonthlyBriefing } from "./types";

function toneForDelta(delta: number): "gold" | "persian" | "rose" | "slate" {
  if (delta <= -5) return "rose";
  if (delta >= 5) return "persian";
  return "gold";
}

/**
 * Monthly intelligence brief from the published Shaparak window.
 * CASA and named merchants are gaps, not zeros-as-facts.
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
  const pos = MORDAD_INSTRUMENTS.find((row) => row.key === "pos");
  const internet = MORDAD_INSTRUMENTS.find((row) => row.key === "internet");

  const movers: BriefingMover[] = [...guilds.bcgMatrix.points]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
    .map((point) => ({
      id: point.id,
      title: point.title,
      volume: point.volume,
      growthPct: point.growthPct,
      quadrant: point.quadrant,
      profitabilityLabel: point.profitabilityLabel,
    }));

  const watchouts = [
    ...dashboard.alerts.filter((alert) => alert.severity !== "info").map((alert) => `${alert.title}: ${alert.detail}`),
    ...DATA_GAPS.slice(0, 3),
  ];

  const narrative = [
    `آخرین ماهنامه منتشرشده شاپرک ${periodLabel} (گزارش ۱۳۴) است. گردش شبکه ${formatToman(dashboard.totals.totalTxVolume)} و تعداد تراکنش ${formatCount(dashboard.totals.totalTxCount)} نقل شده است. شهریور در تقویم جاری است اما گزارش آن منتشر نشده.`,
    volumeDelta === 0
      ? "برای این دوره مبنای مقایسه ماه قبل در دسترس نیست."
      : `نسبت به ${jalaliPeriodLabel(corpus.prevPeriod)} مبلغ ${volumeDelta >= 0 ? "افزایش" : "کاهش"} ${formatPercent(Math.abs(volumeDelta))} داشته است (بازتاب MoM مرداد: تعداد ۲٫۹۷٪ و مبلغ ۷٫۲۶٪).`,
    pos && internet
      ? `کارتخوان حدود ${formatCount(pos.txCount, 0)} تراکنش / ${formatToman(pos.volumeRials)} و اینترنت ${formatCount(internet.txCount, 0)} / ${formatToman(internet.volumeRials)} است. سبد اعلامی کارتخوان حدود ۶۹۴ هزار تومان است.`
      : "",
    `سهم بانک ملت به‌عنوان بانک پذیرنده در همین ماه ${formatPercent(MELLAT_MORDAD_ACQUIRER_SHARE.countPct, 2)} تعداد و ${formatPercent(MELLAT_MORDAD_ACQUIRER_SHARE.valuePct, 2)} مبلغ است. ${CBI_FEE_EXEMPT_HINT} رسوب CASA و فهرست پذیرنده حقیقی در منبع عمومی نیست.`,
  ].filter(Boolean);

  const comparedToPreviousBriefing =
    previous && previous.period !== period
      ? `خلاصه قبلی مربوط به ${previous.periodLabel} بود.`
      : previous && previous.period === period
        ? "همان دوره منتشرشده دوباره محاسبه شد."
        : null;

  const headline =
    volumeDelta <= -5
      ? `هشدار ${periodLabel}: افت گردش شبکه شاپرک`
      : volumeDelta >= 5
        ? `${periodLabel}: رشد مبلغ شبکه شاپرک`
        : `ماهنامه هوش اصناف — ${periodLabel}`;

  return {
    period,
    periodLabel,
    headline,
    narrative,
    highlights: [
      {
        title: "گردش شاپرک",
        detail: `${formatToman(dashboard.totals.totalTxVolume)} (${formatPercent(volumeDelta)} نسبت به ماه قبل)`,
        tone: toneForDelta(volumeDelta),
      },
      {
        title: "تعداد تراکنش",
        detail: formatCount(dashboard.totals.totalTxCount),
        tone: "gold",
      },
      {
        title: "برآورد کارمزد کارتخوان",
        detail: `${formatToman(dashboard.totals.totalFees)} — پلکان بانک مرکزی × سبد اعلامی؛ رقم شاپرک نیست`,
        tone: dashboard.totals.totalFees >= 0 ? "gold" : "rose",
      },
      {
        title: "شکاف داده",
        detail: "CASA، نام پذیرنده و گردش رسته در گزارش عمومی نیست",
        tone: "slate",
      },
    ],
    movers,
    watchouts: watchouts.length ? watchouts : ["در آستانه‌های فعلی هشدار عملیاتی فعالی نیست."],
    comparedToPreviousBriefing,
  };
}
