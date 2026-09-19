/**
 * Pure computation layer — corpus in, DTOs out.
 *
 * This module has NO database, network or Node.js dependency: the exact same
 * functions power the browser data layer (GitHub Pages / static mode) and the
 * optional server profile (PostgreSQL via `service.ts`).
 */
import type {
  GuildCategoryRow,
  MarketingLeadRow,
  MerchantBusinessRow,
  PipelineStage,
  SubGuildRow,
  TerminalMetricRow,
} from "@/db/schema";
import type {
  BcgMatrix,
  DashboardSummary,
  GuildCompareResult,
  GuildsOverview,
  LeadDTO,
  LeadsResponse,
  SubGuildSummary,
} from "./types";
import {
  CBI_POS_FEE_CAP_RIALS,
  CBI_POS_FEE_RATE,
  CBI_POS_FEE_SMALL_TX_RIALS,
  CBI_POS_FEE_SMALL_TX_THRESHOLD_RIALS,
  FLOAT_BENCHMARK_RIALS,
  LENDING_RATE,
  RESERVE_RATIO,
  TERMINAL_MONTHLY_COST_RIALS,
  cbiPosFee,
  clampScore,
  computeLeadScore,
  creditSuitabilityScore,
  floatMarginMonthly,
  marketingTier,
  round1,
} from "./engine";
import { actionNeedsAttention, recommendNextAction } from "./operations";
import { buildBranchOpportunities, buildDataQuality, buildEarlyWarnings, daysSince } from "./service-ops";
import { jalaliPeriodLabel, jalaliPeriodShort } from "./format";

/* Benchmark for radar "fee income" axis: 30M toman monthly fees per unit = 100 */
const FEE_BENCHMARK_RIALS = 300_000_000;

export interface Corpus {
  categories: GuildCategoryRow[];
  subs: SubGuildRow[];
  merchants: MerchantBusinessRow[];
  metrics: TerminalMetricRow[];
  leads: MarketingLeadRow[];
  periods: string[];
  latestPeriod: string;
  prevPeriod: string;
}

export function comparePeriods(a: string, b: string): number {
  const [ay = 0, am = 0] = a.split("-").map(Number);
  const [by = 0, bm = 0] = b.split("-").map(Number);
  return ay - by || am - bm;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function buildSubGuildSummaries(corpus: Corpus): SubGuildSummary[] {
  const { merchants, metrics, subs, categories, latestPeriod } = corpus;
  const catById = new Map(categories.map((c) => [c.id, c]));
  const merchantsBySub = new Map<string, MerchantBusinessRow[]>();
  for (const merchant of merchants) {
    const list = merchantsBySub.get(merchant.subGuildId) ?? [];
    list.push(merchant);
    merchantsBySub.set(merchant.subGuildId, list);
  }

  const latestByMerchant = new Map<string, TerminalMetricRow>();
  for (const row of metrics) {
    if (row.reportingPeriod === latestPeriod) latestByMerchant.set(row.merchantId, row);
  }

  return subs.map((sub) => {
    const list = merchantsBySub.get(sub.id) ?? [];
    let volume = 0;
    let float = 0;
    let fees = 0;
    let terminals = 0;
    let scoreSum = 0;
    let basketSum = 0;
    let txSum = 0;
    let measured = 0;

    for (const merchant of list) {
      const metric = latestByMerchant.get(merchant.id);
      if (!metric) continue;
      measured++;
      volume += metric.monthlyTxVolume;
      float += metric.avgDailyFloatBalance;
      fees += metric.acquiringFeeEarned;
      terminals += metric.posTerminalCount;
      txSum += metric.monthlyTxCount;
      basketSum += metric.monthlyTxCount > 0 ? metric.monthlyTxVolume / metric.monthlyTxCount : 0;
      scoreSum += computeLeadScore({
        avgDailyFloatBalance: metric.avgDailyFloatBalance,
        monthlyTxVolume: metric.monthlyTxVolume,
        cccDays: sub.cashConversionCycleDays,
        isTaxCompliant: merchant.isTaxCompliant,
      }).total;
    }

    const avgScore = measured > 0 ? scoreSum / measured : 0;
    return {
      id: sub.id,
      title: sub.title,
      isicCode: sub.isicCode,
      intaCode: sub.intaCode,
      intaProfitRatio: sub.intaProfitRatio,
      defaultMcc: sub.defaultMcc,
      avgGrossMargin: sub.avgGrossMargin,
      cccDays: sub.cashConversionCycleDays,
      categoryId: sub.categoryId,
      categoryName: catById.get(sub.categoryId)?.name ?? "—",
      merchantCount: list.length,
      volume,
      float,
      fees,
      terminals,
      avgScore: Math.round(avgScore * 10) / 10,
      avgBasket: measured > 0 ? Math.round(basketSum / measured) : 0,
      avgDailyTx: measured > 0 ? Math.round(txSum / measured / 30) : 0,
      tier: marketingTier(avgScore),
    };
  });
}

export function buildBcgMatrix(corpus: Corpus, summaries: SubGuildSummary[]): BcgMatrix {
  const merchantById = new Map(corpus.merchants.map((merchant) => [merchant.id, merchant]));
  const currentVolumeBySub = new Map<string, number>();
  const currentStandardFeeBySub = new Map<string, number>();
  const currentSupportCostBySub = new Map<string, number>();
  const previousVolumeBySub = new Map<string, number>();
  for (const metric of corpus.metrics) {
    const merchant = merchantById.get(metric.merchantId);
    if (!merchant) continue;
    const subId = merchant.subGuildId;
    if (metric.reportingPeriod === corpus.latestPeriod) {
      currentVolumeBySub.set(subId, (currentVolumeBySub.get(subId) ?? 0) + metric.monthlyTxVolume);
      const averageBasket = metric.monthlyTxCount > 0 ? metric.monthlyTxVolume / metric.monthlyTxCount : 0;
      const standardFee = metric.monthlyTxCount > 0 ? cbiPosFee(averageBasket) * metric.monthlyTxCount : metric.acquiringFeeEarned;
      currentStandardFeeBySub.set(subId, (currentStandardFeeBySub.get(subId) ?? 0) + standardFee);
      currentSupportCostBySub.set(subId, (currentSupportCostBySub.get(subId) ?? 0) + metric.operatingSupportCost);
    }
    if (metric.reportingPeriod === corpus.prevPeriod && corpus.prevPeriod !== corpus.latestPeriod) {
      previousVolumeBySub.set(subId, (previousVolumeBySub.get(subId) ?? 0) + metric.monthlyTxVolume);
    }
  }
  const totalVolume = Math.max(1, summaries.reduce((total, summary) => total + summary.volume, 0));
  const maxVolume = Math.max(1, ...summaries.map((summary) => summary.volume));
  const rawPoints = summaries.map((summary) => {
    const currentVolume = currentVolumeBySub.get(summary.id) ?? summary.volume;
    const previousVolume = previousVolumeBySub.get(summary.id) ?? 0;
    const growthPct = previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0;
    const supportCost = currentSupportCostBySub.get(summary.id) ?? summary.terminals * TERMINAL_MONTHLY_COST_RIALS;
    const standardFee = currentStandardFeeBySub.get(summary.id) ?? summary.fees;
    const paymentContribution = standardFee - supportCost;
    const floatYield = floatMarginMonthly(summary.float);
    const bankNetMargin = paymentContribution + floatYield;
    const revenue = Math.max(1, standardFee + floatYield);
    const marginPct = (bankNetMargin / revenue) * 100;
    return {
      id: summary.id,
      title: summary.title,
      categoryName: summary.categoryName,
      merchantCount: summary.merchantCount,
      volume: currentVolume,
      marketSharePct: (currentVolume / totalVolume) * 100,
      relativeSharePct: (currentVolume / maxVolume) * 100,
      growthPct,
      paymentContribution,
      bankNetMargin,
      marginPct,
      isProfitable: bankNetMargin > 0,
      profitabilityLabel: bankNetMargin > 0 ? "سودده" as const : bankNetMargin > -supportCost ? "مرزی" as const : "زیان‌ده" as const,
    };
  });
  const shareCutoffPct = 50;
  const growthCutoffPct = median(rawPoints.map((point) => point.growthPct));
  const points = rawPoints
    .map((point) => {
      const highShare = point.relativeSharePct >= shareCutoffPct;
      const highGrowth = point.growthPct >= growthCutoffPct;
      const quadrant = highShare
        ? highGrowth ? "STAR" as const : "CASH_COW" as const
        : highGrowth ? "QUESTION_MARK" as const : "DOG" as const;
      return { ...point, quadrant, marginPct: round1(point.marginPct), growthPct: round1(point.growthPct), marketSharePct: round1(point.marketSharePct), relativeSharePct: round1(point.relativeSharePct) };
    })
    .sort((a, b) => b.volume - a.volume);

  return {
    points,
    shareCutoffPct,
    growthCutoffPct: round1(growthCutoffPct),
    latestPeriod: corpus.latestPeriod,
    methodology: "سهم نسبی داخلی = گردش رسته نسبت به بزرگ‌ترین رسته؛ رشد = تغییر گردش نسبت به دوره قبل؛ سوددهی = کارمزد خرید کارتی + ارزش رسوب CASA − هزینه پشتیبانی پایانه. کارمزد خرید کارتی برای تراکنش کمتر از ۶ میلیون ریال ۱٬۲۰۰ ریال و برای مبالغ بالاتر ۰٫۰۲٪ تا سقف ۴۰٬۰۰۰ ریال در نظر گرفته شده است.",
    assumptions: {
      smallTransactionFeeRials: CBI_POS_FEE_SMALL_TX_RIALS,
      smallTransactionThresholdRials: CBI_POS_FEE_SMALL_TX_THRESHOLD_RIALS,
      transactionFeeRate: CBI_POS_FEE_RATE,
      transactionFeeCapRials: CBI_POS_FEE_CAP_RIALS,
      terminalMonthlyCostRials: TERMINAL_MONTHLY_COST_RIALS,
      lendingRate: LENDING_RATE,
      reserveRatio: RESERVE_RATIO,
    },
  };
}

function percentageChange(current: number, previous: number, hasPrevious: boolean): number {
  if (!hasPrevious) return 0;
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function getDashboardFromCorpus(corpus: Corpus): DashboardSummary {
  const { categories, subs, merchants, metrics, latestPeriod, prevPeriod, periods } = corpus;

  const merchantById = new Map(merchants.map((merchant) => [merchant.id, merchant]));
  const subById = new Map(subs.map((sub) => [sub.id, sub]));
  const periodRows = metrics.filter((row) => row.reportingPeriod === latestPeriod);
  const prevRows = metrics.filter((row) => row.reportingPeriod === prevPeriod);
  const hasPrevious = Boolean(prevPeriod && prevPeriod !== latestPeriod && prevRows.length > 0);

  const sum = (rows: TerminalMetricRow[], fn: (row: TerminalMetricRow) => number) =>
    rows.reduce((total, row) => total + fn(row), 0);

  const totalTxVolume = sum(periodRows, (row) => row.monthlyTxVolume);
  const totalTxCount = sum(periodRows, (row) => row.monthlyTxCount);
  const totalFloat = sum(periodRows, (row) => row.avgDailyFloatBalance);
  const totalFees = sum(periodRows, (row) => row.acquiringFeeEarned);
  const totalSupportCost = sum(periodRows, (row) => row.operatingSupportCost);
  const monthlyFloatYield = floatMarginMonthly(totalFloat);
  const netMargin = monthlyFloatYield + totalFees - totalSupportCost;
  const prevVolume = sum(prevRows, (row) => row.monthlyTxVolume);
  const prevFloat = sum(prevRows, (row) => row.avgDailyFloatBalance);

  /* ---- six-month trend ---------------------------------------------- */
  const trend = periods.slice(-6).map((period) => {
    const rows = metrics.filter((row) => row.reportingPeriod === period);
    return {
      period,
      label: jalaliPeriodLabel(period),
      short: jalaliPeriodShort(period),
      volume: sum(rows, (row) => row.monthlyTxVolume),
      float: sum(rows, (row) => row.avgDailyFloatBalance),
      fees: sum(rows, (row) => row.acquiringFeeEarned),
    };
  });

  /* ---- profitability per category ---------------------------------- */
  const catAgg = new Map<
    string,
    { merchants: Set<string>; terminals: number; volume: number; float: number; fees: number; support: number }
  >();
  for (const row of periodRows) {
    const merchant = merchantById.get(row.merchantId);
    const sub = merchant ? subById.get(merchant.subGuildId) : undefined;
    if (!merchant || !sub) continue;
    const aggregate = catAgg.get(sub.categoryId) ?? {
      merchants: new Set<string>(),
      terminals: 0,
      volume: 0,
      float: 0,
      fees: 0,
      support: 0,
    };
    aggregate.merchants.add(merchant.id);
    aggregate.terminals += row.posTerminalCount;
    aggregate.volume += row.monthlyTxVolume;
    aggregate.float += row.avgDailyFloatBalance;
    aggregate.fees += row.acquiringFeeEarned;
    aggregate.support += row.operatingSupportCost;
    catAgg.set(sub.categoryId, aggregate);
  }

  const categoryProfit = categories.map((category) => {
    const aggregate = catAgg.get(category.id);
    const volume = aggregate?.volume ?? 0;
    const float = aggregate?.float ?? 0;
    const fees = aggregate?.fees ?? 0;
    const margin = floatMarginMonthly(float) + fees - (aggregate?.support ?? 0);
    return {
      categoryId: category.id,
      name: category.name,
      merchants: aggregate?.merchants.size ?? 0,
      terminals: aggregate?.terminals ?? 0,
      volume,
      float,
      fees,
      margin,
      sharePct: totalTxVolume > 0 ? (volume / totalTxVolume) * 100 : 0,
    };
  });

  /* ---- provincial heatmap ------------------------------------------ */
  const provAgg = new Map<string, { merchants: Set<string>; terminals: number; volume: number; float: number }>();
  for (const row of periodRows) {
    const merchant = merchantById.get(row.merchantId);
    if (!merchant) continue;
    const aggregate = provAgg.get(merchant.province) ?? {
      merchants: new Set<string>(),
      terminals: 0,
      volume: 0,
      float: 0,
    };
    aggregate.merchants.add(merchant.id);
    aggregate.terminals += row.posTerminalCount;
    aggregate.volume += row.monthlyTxVolume;
    aggregate.float += row.avgDailyFloatBalance;
    provAgg.set(merchant.province, aggregate);
  }
  const maxProvVolume = Math.max(1, ...Array.from(provAgg.values()).map((aggregate) => aggregate.volume));
  const provinces = Array.from(provAgg.entries())
    .map(([province, aggregate]) => ({
      province,
      merchants: aggregate.merchants.size,
      terminals: aggregate.terminals,
      volume: aggregate.volume,
      float: aggregate.float,
      intensity: aggregate.volume / maxProvVolume,
    }))
    .sort((a, b) => b.volume - a.volume);

  /* ---- sub guilds + merchants leaderboard -------------------------- */
  const subSummaries = buildSubGuildSummaries(corpus);
  const topSubGuilds = subSummaries
    .filter((summary) => summary.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 12)
    .map((summary) => ({
      id: summary.id,
      title: summary.title,
      categoryName: summary.categoryName,
      merchants: summary.merchantCount,
      volume: summary.volume,
      float: summary.float,
    }));

  const latestByMerchant = new Map(periodRows.map((row) => [row.merchantId, row]));
  const topMerchants = merchants
    .map((merchant) => {
      const metric = latestByMerchant.get(merchant.id);
      const sub = subById.get(merchant.subGuildId);
      if (!metric || !sub) return null;
      const margin = floatMarginMonthly(metric.avgDailyFloatBalance) + metric.acquiringFeeEarned - metric.operatingSupportCost;
      const score = computeLeadScore({
        avgDailyFloatBalance: metric.avgDailyFloatBalance,
        monthlyTxVolume: metric.monthlyTxVolume,
        cccDays: sub.cashConversionCycleDays,
        isTaxCompliant: merchant.isTaxCompliant,
      }).total;
      return {
        id: merchant.id,
        businessName: merchant.businessName,
        ownerName: merchant.ownerName,
        subGuildTitle: sub.title,
        province: merchant.province,
        branchCode: merchant.assignedBranchCode,
        volume: metric.monthlyTxVolume,
        float: metric.avgDailyFloatBalance,
        margin,
        score,
        isTaxCompliant: merchant.isTaxCompliant,
      };
    })
    .filter((merchant): merchant is NonNullable<typeof merchant> => merchant !== null)
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 7);

  const dataQuality = buildDataQuality(merchants, metrics, corpus.leads, latestPeriod);
  const branchOpportunities = buildBranchOpportunities(merchants, metrics, corpus.leads, latestPeriod);
  const alerts = buildEarlyWarnings({
    merchants,
    latestRows: periodRows,
    previousRows: hasPrevious ? prevRows : [],
    leads: corpus.leads,
    dataQuality,
  });

  return {
    latestPeriod,
    latestPeriodLabel: jalaliPeriodLabel(latestPeriod),
    prevPeriod,
    totals: {
      merchantCount: new Set(periodRows.map((row) => row.merchantId)).size,
      activeTerminals: sum(periodRows, (row) => row.posTerminalCount),
      totalTxCount,
      totalTxVolume,
      totalFloat,
      monthlyFloatYield,
      totalFees,
      totalSupportCost,
      netMargin,
      avgBasket: totalTxCount > 0 ? totalTxVolume / totalTxCount : 0,
      volumeDeltaPct: percentageChange(totalTxVolume, prevVolume, hasPrevious),
      floatDeltaPct: percentageChange(totalFloat, prevFloat, hasPrevious),
    },
    trend,
    categoryProfit,
    provinces,
    branchOpportunities,
    alerts,
    dataQuality,
    topSubGuilds,
    topMerchants,
  };
}

export function getGuildsOverviewFromCorpus(corpus: Corpus): GuildsOverview {
  const subSummaries = buildSubGuildSummaries(corpus);
  const byCategory = new Map<string, SubGuildSummary[]>();
  for (const summary of subSummaries) {
    const list = byCategory.get(summary.categoryId) ?? [];
    list.push(summary);
    byCategory.set(summary.categoryId, list);
  }

  const categories = corpus.categories.map((category) => {
    const list = byCategory.get(category.id) ?? [];
    return {
      id: category.id,
      name: category.name,
      isicCodePrefix: category.isicCodePrefix,
      description: category.description,
      subGuildCount: list.length,
      merchantCount: list.reduce((total, summary) => total + summary.merchantCount, 0),
      volume: list.reduce((total, summary) => total + summary.volume, 0),
      float: list.reduce((total, summary) => total + summary.float, 0),
    };
  });

  return {
    categories,
    subGuilds: subSummaries.sort((a, b) => b.avgScore - a.avgScore),
    bcgMatrix: buildBcgMatrix(corpus, subSummaries),
    latestPeriod: corpus.latestPeriod,
  };
}

export function getGuildCompareFromCorpus(corpus: Corpus, aId: string, bId: string): GuildCompareResult | null {
  if (aId === bId) return null;
  const summaries = buildSubGuildSummaries(corpus);
  const a = summaries.find((summary) => summary.id === aId);
  const b = summaries.find((summary) => summary.id === bId);
  if (!a || !b) return null;

  const merchantsBySub = new Map<string, MerchantBusinessRow[]>();
  for (const merchant of corpus.merchants) {
    const list = merchantsBySub.get(merchant.subGuildId) ?? [];
    list.push(merchant);
    merchantsBySub.set(merchant.subGuildId, list);
  }
  const latestByMerchant = new Map(
    corpus.metrics
      .filter((row) => row.reportingPeriod === corpus.latestPeriod)
      .map((row) => [row.merchantId, row]),
  );
  const totalVolume = Math.max(1, summaries.reduce((total, summary) => total + summary.volume, 0));
  const firstPeriod = corpus.periods[0] ?? corpus.latestPeriod;

  const perSub = (subId: string) => {
    const merchants = merchantsBySub.get(subId) ?? [];
    const sub = summaries.find((summary) => summary.id === subId)!;
    const measured = merchants.filter((merchant) => latestByMerchant.has(merchant.id));
    const denominator = Math.max(1, measured.length);
    const avgFloat = sub.float / denominator;
    const avgFees = sub.fees / denominator;

    const compliant = merchants.filter((merchant) => merchant.isTaxCompliant).length;
    const lowRisk = merchants.filter((merchant) => merchant.riskStatus === "LOW").length;
    const regulatory = merchants.length
      ? (compliant / merchants.length) * 70 + (lowRisk / merchants.length) * 30
      : 0;
    const merchantIds = new Set(merchants.map((merchant) => merchant.id));
    let firstVolume = 0;
    let lastVolume = 0;
    for (const row of corpus.metrics) {
      if (!merchantIds.has(row.merchantId)) continue;
      if (row.reportingPeriod === firstPeriod) firstVolume += row.monthlyTxVolume;
      if (row.reportingPeriod === corpus.latestPeriod) lastVolume += row.monthlyTxVolume;
    }
    const growthPct = firstVolume > 0 ? ((lastVolume - firstVolume) / firstVolume) * 100 : 0;

    return {
      floatStability: clampScore((avgFloat / FLOAT_BENCHMARK_RIALS) * 100),
      feeIncome: clampScore((avgFees / FEE_BENCHMARK_RIALS) * 100),
      creditAppetite: creditSuitabilityScore(sub.cccDays),
      regulatory: clampScore(regulatory),
      growth: clampScore(50 + growthPct * 2.5),
      share: clampScore((sub.volume / totalVolume) * 100),
    };
  };

  const pa = perSub(a.id);
  const pb = perSub(b.id);
  return {
    a,
    b,
    axes: [
      { axis: "پایداری رسوب", a: Math.round(pa.floatStability), b: Math.round(pb.floatStability) },
      { axis: "درآمد کارمزدی", a: Math.round(pa.feeIncome), b: Math.round(pb.feeIncome) },
      { axis: "اشتهای اعتباری", a: pa.creditAppetite, b: pb.creditAppetite },
      { axis: "انطباق رگولاتوری", a: Math.round(pa.regulatory), b: Math.round(pb.regulatory) },
      { axis: "رشد تراکنش", a: Math.round(pa.growth), b: Math.round(pb.growth) },
      { axis: "سهم گردش بازار", a: Math.round(pa.share), b: Math.round(pb.share) },
    ],
  };
}

type LeadJoinRow = {
  lead: MarketingLeadRow;
  merchant: MerchantBusinessRow;
  subGuildTitle: string;
  categoryName: string;
};

function toLeadDTO(row: LeadJoinRow): LeadDTO {
  const staleDays = daysSince(row.lead.lastInteractionDate);
  const nextAction = recommendNextAction({
    stage: row.lead.pipelineStage,
    score: row.lead.leadScore,
    product: row.lead.recommendedProduct,
    isTaxCompliant: row.merchant.isTaxCompliant,
    riskStatus: row.merchant.riskStatus,
    staleDays,
  });
  return {
    id: row.lead.id,
    merchantId: row.lead.merchantId,
    branchCode: row.lead.branchCode,
    recommendedProduct: row.lead.recommendedProduct,
    leadScore: row.lead.leadScore,
    pipelineStage: row.lead.pipelineStage,
    lastInteractionDate: row.lead.lastInteractionDate.toISOString(),
    staleDays,
    nextAction,
    merchant: {
      businessName: row.merchant.businessName,
      ownerName: row.merchant.ownerName,
      province: row.merchant.province,
      city: row.merchant.city,
      isTaxCompliant: row.merchant.isTaxCompliant,
      riskStatus: row.merchant.riskStatus,
      subGuildTitle: row.subGuildTitle,
      categoryName: row.categoryName,
    },
  };
}

function makeLeadsResponse(leads: LeadDTO[]): LeadsResponse {
  const byStage = leads.reduce(
    (accumulator, lead) => {
      accumulator[lead.pipelineStage] = (accumulator[lead.pipelineStage] ?? 0) + 1;
      return accumulator;
    },
    { NEW: 0, CONTACTED: 0, FINANCIAL_EVALUATION: 0, CONVERTED: 0, LOST: 0 } as Record<PipelineStage, number>,
  );
  return {
    leads,
    stats: {
      total: leads.length,
      byStage,
      avgScore: leads.length > 0 ? Math.round((leads.reduce((total, lead) => total + lead.leadScore, 0) / leads.length) * 10) / 10 : 0,
      hotCount: leads.filter((lead) => lead.leadScore >= 75).length,
      actionRequiredCount: leads.filter((lead) => actionNeedsAttention(lead.nextAction)).length,
    },
  };
}

export function getLeadsFromCorpus(corpus: Corpus): LeadsResponse {
  const merchantById = new Map(corpus.merchants.map((merchant) => [merchant.id, merchant]));
  const subById = new Map(corpus.subs.map((sub) => [sub.id, sub]));
  const categoryById = new Map(corpus.categories.map((category) => [category.id, category]));
  const rows: LeadJoinRow[] = corpus.leads.map((lead) => {
    const merchant = merchantById.get(lead.merchantId)!;
    const sub = subById.get(merchant.subGuildId)!;
    return {
      lead,
      merchant,
      subGuildTitle: sub.title,
      categoryName: categoryById.get(sub.categoryId)?.name ?? "—",
    };
  });
  return makeLeadsResponse(rows.map(toLeadDTO).sort((a, b) => b.leadScore - a.leadScore));
}
