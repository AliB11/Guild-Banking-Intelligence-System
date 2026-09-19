/**
 * Read models for the static UI — only published Shaparak / CBI / INTA facts.
 * Derived figures are arithmetic on those facts and labeled as such.
 */
import { faDigits, formatCount, formatPercent, formatToman, jalaliPeriodLabel, jalaliPeriodShort } from "./format";
import {
  CBI_FEE_EXEMPT_HINT,
  GUILD_TAXONOMY,
  KHORDAD_SERVICE_MIX,
  LATEST_PUBLISHED_PERIOD,
  MELLAT_MORDAD_ACQUIRER_SHARE,
  MORDAD_CITED_MOM,
  MORDAD_CITED_YOY,
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
  volumeDelta: number;
  volumeDeltaPct: number;
}

export interface InstrumentShare {
  key: string;
  title: string;
  volume: number;
  txCount: number;
  sharePct: number;
  basketRials: number;
  basketKind: "cited" | "quotient";
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
  khordadMix: typeof KHORDAD_SERVICE_MIX;
  mellat: {
    countPct: number;
    valuePct: number;
    citation: string;
    impliedVolume: number;
    impliedCount: number;
  };
  citedMom: typeof MORDAD_CITED_MOM;
  citedYoy: typeof MORDAD_CITED_YOY;
  /** Cited value MoM minus cited count MoM — ticket/mix pressure, not a new source. */
  ticketGapPct: number;
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
    trend: SHAPARAK_MONTHS.map((row, index) => {
      const previous = index > 0 ? SHAPARAK_MONTHS[index - 1] : null;
      return {
        period: row.period,
        label: jalaliPeriodLabel(row.period),
        short: jalaliPeriodShort(row.period),
        volume: row.volumeRials,
        txCount: row.txCount,
        volumeDelta: previous ? row.volumeRials - previous.volumeRials : 0,
        volumeDeltaPct: previous ? deltaPct(row.volumeRials, previous.volumeRials) : 0,
      };
    }),
    instruments: MORDAD_INSTRUMENTS.map((row) => ({
      key: row.key,
      title: row.title,
      volume: row.volumeRials,
      txCount: row.txCount,
      sharePct: totalVolume > 0 ? (row.volumeRials / totalVolume) * 100 : 0,
      basketRials: row.key === "pos" ? MORDAD_POS_BASKET_RIALS : row.txCount > 0 ? row.volumeRials / row.txCount : 0,
      basketKind: row.key === "pos" ? "cited" : "quotient",
      countIsApproximate: row.countIsApproximate,
      citation: row.citation,
    })),
    khordadNotes: khordad?.notes ?? [],
    khordadMix: KHORDAD_SERVICE_MIX,
    mellat: {
      ...MELLAT_MORDAD_ACQUIRER_SHARE,
      impliedVolume: latest.volumeRials * (MELLAT_MORDAD_ACQUIRER_SHARE.valuePct / 100),
      impliedCount: latest.txCount * (MELLAT_MORDAD_ACQUIRER_SHARE.countPct / 100),
    },
    citedMom: MORDAD_CITED_MOM,
    citedYoy: MORDAD_CITED_YOY,
    ticketGapPct: MORDAD_CITED_MOM.valuePct - MORDAD_CITED_MOM.countPct,
    feeExemptHint: CBI_FEE_EXEMPT_HINT,
  };
}

export const GUILD_CATEGORY_LABEL: Record<GuildTaxonomyRow["category"], string> = {
  production: "تولیدی",
  distribution: "توزیعی",
  services: "خدماتی",
  technical: "خدمات فنی",
};

export function getGuildAtlas(): GuildTaxonomyRow[] {
  return GUILD_TAXONOMY;
}

export function getGuildKnowledge() {
  const atlas = getGuildAtlas();
  return {
    exempt: atlas.filter((row) => row.feeExempt),
    citedInta: atlas.filter((row) => row.intaProfitRatio > 0),
    codeOnly: atlas.filter((row) => !row.feeExempt && row.intaProfitRatio === 0),
  };
}

function toneForDelta(delta: number): "gold" | "persian" | "rose" | "slate" {
  if (delta <= -5) return "rose";
  if (delta >= 5) return "persian";
  return "gold";
}

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
    profitabilityLabel:
      row.basketKind === "cited" ? "سبد اعلامی" : row.countIsApproximate ? "سبد از تقسیم؛ تعداد تقریبی" : "سبد از تقسیم مبلغ÷تعداد",
  }));

  const narrative = [
    `آخرین ماهنامه منتشرشده شاپرک ${market.latestPeriodLabel} (گزارش ${faDigits(market.reportNo ?? "—")}) است. گردش شبکه ${formatToman(market.totals.volume)} و تعداد تراکنش ${formatCount(market.totals.txCount)} نقل شده. شهریور در تقویم است اما گزارش ندارد.`,
    `بازتاب MoM مرداد: مبلغ ${formatPercent(market.citedMom.valuePct)} و تعداد ${formatPercent(market.citedMom.countPct)}. فاصله ${formatPercent(market.ticketGapPct)} یعنی سبد شبکه سنگین‌تر شده، نه لزوماً اینکه فروشگاه بیشتری آمده.`,
    pos && internet
      ? `کارتخوان ${formatToman(pos.volume)} با سبد اعلامی ${formatToman(pos.basketRials)}؛ اینترنت ${formatToman(internet.volume)} با سبد حاصل‌تقسیم ${formatToman(internet.basketRials)}. سبد اینترنت چند برابر کارتخوان است.`
      : "",
    `سهم ملت ${formatPercent(market.mellat.countPct, 2)} تعداد و ${formatPercent(market.mellat.valuePct, 2)} مبلغ است؛ حاصل‌ضرب در جمع شبکه حدود ${formatToman(market.mellat.impliedVolume)} می‌شود — شاپرک رقم مطلق ملت را جدا نداده. رشد اسمی سالانه مبلغ ${formatPercent(market.citedYoy.valueNominalPct)} و رشد واقعی حدود ${formatPercent(market.citedYoy.valueRealApproxPct)} نقل شده.`,
  ].filter(Boolean);

  return {
    period: market.latestPeriod,
    periodLabel: market.latestPeriodLabel,
    headline:
      market.citedMom.valuePct >= 5
        ? `${market.latestPeriodLabel}: رشد مبلغ شبکه شاپرک`
        : `ماهنامه شاپرک — ${market.latestPeriodLabel}`,
    narrative,
    highlights: [
      {
        title: "گردش شاپرک",
        detail: `${formatToman(market.totals.volume)} (${formatPercent(market.citedMom.valuePct)} MoM نقل‌شده)`,
        tone: toneForDelta(market.citedMom.valuePct),
      },
      {
        title: "فاصله مبلغ و تعداد",
        detail: `${formatPercent(market.ticketGapPct)} — سبد شبکه سنگین‌تر شده`,
        tone: "gold",
      },
      {
        title: "سبد اینترنت",
        detail: internet ? formatToman(internet.basketRials) : "—",
        tone: "persian",
      },
      {
        title: "سهم ملت × شبکه",
        detail: formatToman(market.mellat.impliedVolume),
        tone: "gold",
      },
    ],
    movers,
    watchouts: [
      "فهرست پذیرنده، رسوب CASA و گردش رسته در ماهنامه عمومی نیست و در این سامانه نمایش داده نمی‌شود.",
      "کارمزد پلکان بانک مرکزی فقط برای کارتخوان است؛ به سبد اینترنت اعمال نمی‌شود.",
      "رشد واقعی حدود ۲٫۵٪ نقل شده؛ ۹۳٫۷۲٪ اسمی تورم قیمت است نه انفجار تراکنش.",
    ],
    comparedToPreviousBriefing:
      previous && previous.period !== market.latestPeriod
        ? `خلاصه قبلی مربوط به ${previous.periodLabel} بود.`
        : previous && previous.period === market.latestPeriod
          ? "همان دوره منتشرشده دوباره محاسبه شد."
          : null,
  };
}
