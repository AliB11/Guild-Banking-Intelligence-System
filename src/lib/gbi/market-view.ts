/**
 * Read models for the static UI — only published Shaparak / CBI / INTA facts.
 * No merchant corpus, no CASA, no guild volumes.
 */
import { faDigits, formatCount, formatPercent, formatToman, jalaliPeriodLabel, jalaliPeriodShort } from "./format";
import {
  CBI_FEE_EXEMPT_HINT,
  GUILD_TAXONOMY,
  LATEST_PUBLISHED_PERIOD,
  MELLAT_MORDAD_ACQUIRER_SHARE,
  MORDAD_INSTRUMENTS,
  MORDAD_POS_BASKET_RIALS,
  PREV_PUBLISHED_PERIOD,
  SHAPARAK_MONTHS,
  type GuildTaxonomyRow,
} from "./published-market";
import type { BriefingMover, MonthlyBriefing } from "./sources/types";

export interface MarketTrendPoint {
  period: string;
  label: string;
  short: string;
  volume: number;
  txCount: number;
}

export interface InstrumentShare {
  key: string;
  title: string;
  volume: number;
  txCount: number;
  sharePct: number;
  countIsApproximate: boolean;
  citation: string;
}

export interface MarketDashboard {
  latestPeriod: string;
  latestPeriodLabel: string;
  prevPeriod: string;
  reportNo: number | null;
  citation: string;
  totals: {
    volume: number;
    txCount: number;
    volumeDeltaPct: number;
    countDeltaPct: number;
    avgBasket: number;
    posVolume: number;
    posTxCount: number;
    posBasket: number;
    internetVolume: number;
    internetTxCount: number;
  };
  trend: MarketTrendPoint[];
  instruments: InstrumentShare[];
  khordadNotes: string[];
  mellat: { countPct: number; valuePct: number; citation: string };
  feeExemptHint: string;
}

function deltaPct(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function getMarketDashboard(): MarketDashboard {
  const latest = SHAPARAK_MONTHS.find((row) => row.period === LATEST_PUBLISHED_PERIOD)!;
  const prev = SHAPARAK_MONTHS.find((row) => row.period === PREV_PUBLISHED_PERIOD)!;
  const khordad = SHAPARAK_MONTHS.find((row) => row.period === "1405-03");
  const pos = MORDAD_INSTRUMENTS.find((row) => row.key === "pos")!;
  const internet = MORDAD_INSTRUMENTS.find((row) => row.key === "internet")!;
  const totalVolume = latest.volumeRials;

  return {
    latestPeriod: latest.period,
    latestPeriodLabel: jalaliPeriodLabel(latest.period),
    prevPeriod: prev.period,
    reportNo: latest.reportNo,
    citation: latest.citation,
    totals: {
      volume: latest.volumeRials,
      txCount: latest.txCount,
      volumeDeltaPct: deltaPct(latest.volumeRials, prev.volumeRials),
      countDeltaPct: deltaPct(latest.txCount, prev.txCount),
      avgBasket: latest.txCount > 0 ? latest.volumeRials / latest.txCount : 0,
      posVolume: pos.volumeRials,
      posTxCount: pos.txCount,
      posBasket: MORDAD_POS_BASKET_RIALS,
      internetVolume: internet.volumeRials,
      internetTxCount: internet.txCount,
    },
    trend: SHAPARAK_MONTHS.map((row) => ({
      period: row.period,
      label: jalaliPeriodLabel(row.period),
      short: jalaliPeriodShort(row.period),
      volume: row.volumeRials,
      txCount: row.txCount,
    })),
    instruments: MORDAD_INSTRUMENTS.map((row) => ({
      key: row.key,
      title: row.title,
      volume: row.volumeRials,
      txCount: row.txCount,
      sharePct: totalVolume > 0 ? (row.volumeRials / totalVolume) * 100 : 0,
      countIsApproximate: row.countIsApproximate,
      citation: row.citation,
    })),
    khordadNotes: khordad?.notes ?? [],
    mellat: { ...MELLAT_MORDAD_ACQUIRER_SHARE },
    feeExemptHint: CBI_FEE_EXEMPT_HINT,
  };
}

export const GUILD_CATEGORY_LABEL: Record<GuildTaxonomyRow["category"], string> = {
  production: "تولیدی",
  distribution: "توزیعی",
  services: "خدماتی",
  technical: "خدمات فنی",
};

/** Guild atlas: ISIC / MCC / cited INTA only. */
export function getGuildAtlas(): GuildTaxonomyRow[] {
  return GUILD_TAXONOMY;
}

function toneForDelta(delta: number): "gold" | "persian" | "rose" | "slate" {
  if (delta <= -5) return "rose";
  if (delta >= 5) return "persian";
  return "gold";
}

/** Catalog briefing from published months — no merchant corpus. */
export function buildPublishedBriefing(previous: MonthlyBriefing | null = null): MonthlyBriefing {
  const market = getMarketDashboard();
  const pos = market.instruments.find((row) => row.key === "pos");
  const internet = market.instruments.find((row) => row.key === "internet");
  const movers: BriefingMover[] = market.instruments.map((row) => ({
    id: row.key,
    title: row.title,
    volume: row.volume,
    growthPct: 0,
    quadrant: "—",
    profitabilityLabel: row.countIsApproximate ? "تعداد تقریبی" : "رقم اعلامی",
  }));

  const narrative = [
    `آخرین ماهنامه منتشرشده شاپرک ${market.latestPeriodLabel} (گزارش ${faDigits(market.reportNo ?? "—")}) است. گردش شبکه ${formatToman(market.totals.volume)} و تعداد تراکنش ${formatCount(market.totals.txCount)} نقل شده. شهریور در تقویم است اما گزارش ندارد.`,
    `نسبت به ${jalaliPeriodLabel(market.prevPeriod)} مبلغ ${formatPercent(Math.abs(market.totals.volumeDeltaPct))} ${market.totals.volumeDeltaPct >= 0 ? "افزایش" : "کاهش"} و تعداد ${formatPercent(Math.abs(market.totals.countDeltaPct))} ${market.totals.countDeltaPct >= 0 ? "افزایش" : "کاهش"} داشته است.`,
    pos && internet
      ? `کارتخوان ${formatToman(pos.volume)} / حدود ${formatCount(pos.txCount, 0)} تراکنش؛ اینترنت ${formatToman(internet.volume)} / ${formatCount(internet.txCount, 0)}. سبد اعلامی کارتخوان ${formatToman(market.totals.posBasket)} است.`
      : "",
    `سهم بانک ملت به‌عنوان بانک پذیرنده: ${formatPercent(market.mellat.countPct, 2)} تعداد و ${formatPercent(market.mellat.valuePct, 2)} مبلغ. ${market.feeExemptHint}`,
  ].filter(Boolean);

  return {
    period: market.latestPeriod,
    periodLabel: market.latestPeriodLabel,
    headline:
      market.totals.volumeDeltaPct >= 5
        ? `${market.latestPeriodLabel}: رشد مبلغ شبکه شاپرک`
        : `ماهنامه شاپرک — ${market.latestPeriodLabel}`,
    narrative,
    highlights: [
      {
        title: "گردش شاپرک",
        detail: `${formatToman(market.totals.volume)} (${formatPercent(market.totals.volumeDeltaPct)} نسبت به ماه قبل)`,
        tone: toneForDelta(market.totals.volumeDeltaPct),
      },
      {
        title: "تعداد تراکنش",
        detail: formatCount(market.totals.txCount),
        tone: "gold",
      },
      {
        title: "گردش کارتخوان",
        detail: formatToman(market.totals.posVolume),
        tone: "persian",
      },
      {
        title: "سبد کارتخوان",
        detail: formatToman(market.totals.posBasket),
        tone: "gold",
      },
    ],
    movers,
    watchouts: [
      "فهرست پذیرنده، رسوب CASA و گردش رسته در ماهنامه عمومی نیست و در این سامانه نمایش داده نمی‌شود.",
      "تعداد کارتخوان سال ۱۴۰۵ و سهم استانی مبلغ منتشر نشده است.",
    ],
    comparedToPreviousBriefing:
      previous && previous.period !== market.latestPeriod
        ? `خلاصه قبلی مربوط به ${previous.periodLabel} بود.`
        : previous && previous.period === market.latestPeriod
          ? "همان دوره منتشرشده دوباره محاسبه شد."
          : null,
  };
}
