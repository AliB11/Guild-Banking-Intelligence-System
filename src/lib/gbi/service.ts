import { db } from "@/db";
import {
  guildCategories,
  marketingLeads,
  merchantBusinesses,
  subGuilds,
  terminalMetrics,
  type GuildCategoryRow,
  type MarketingLeadRow,
  type MerchantBusinessRow,
  type SubGuildRow,
  type TerminalMetricRow,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  VOLUME_BENCHMARK_RIALS,
  FLOAT_BENCHMARK_RIALS,
  clampScore,
  computeLeadScore,
  creditSuitabilityScore,
  floatMarginMonthly,
  marketingTier,
} from "./engine";
import { jalaliPeriodLabel, jalaliPeriodShort } from "./format";
import type {
  DashboardSummary,
  GuildCompareResult,
  GuildsOverview,
  LeadDTO,
  LeadsResponse,
  SubGuildSummary,
} from "./types";

/* Benchmark for radar "fee income" axis: 30M toman monthly fees per unit = 100 */
const FEE_BENCHMARK_RIALS = 300_000_000;

interface Corpus {
  categories: GuildCategoryRow[];
  subs: SubGuildRow[];
  merchants: MerchantBusinessRow[];
  metrics: TerminalMetricRow[];
  leads: MarketingLeadRow[];
  periods: string[];
  latestPeriod: string;
  prevPeriod: string;
}

async function loadCorpus(): Promise<Corpus> {
  const [categories, subs, merchants, metrics, leads] = await Promise.all([
    db.select().from(guildCategories),
    db.select().from(subGuilds),
    db.select().from(merchantBusinesses),
    db.select().from(terminalMetrics),
    db.select().from(marketingLeads).orderBy(desc(marketingLeads.leadScore)),
  ]);
  const periods = Array.from(new Set(metrics.map((m) => m.reportingPeriod))).sort();
  const latestPeriod = periods[periods.length - 1] ?? "";
  const prevPeriod = periods[periods.length - 2] ?? latestPeriod;
  return { categories, subs, merchants, metrics, leads, periods, latestPeriod, prevPeriod };
}

function buildSubGuildSummaries(corpus: Corpus): SubGuildSummary[] {
  const { merchants, metrics, subs, categories, latestPeriod } = corpus;
  const catById = new Map(categories.map((c) => [c.id, c]));
  const merchantsBySub = new Map<string, MerchantBusinessRow[]>();
  for (const m of merchants) {
    const list = merchantsBySub.get(m.subGuildId) ?? [];
    list.push(m);
    merchantsBySub.set(m.subGuildId, list);
  }
  const latestByMerchant = new Map<string, TerminalMetricRow>();
  for (const row of metrics) {
    if (row.reportingPeriod === latestPeriod) latestByMerchant.set(row.merchantId, row);
  }

  return subs.map((s) => {
    const list = merchantsBySub.get(s.id) ?? [];
    let volume = 0;
    let float = 0;
    let fees = 0;
    let terminals = 0;
    let scoreSum = 0;
    let basketSum = 0;
    let txSum = 0;
    let measured = 0;
    for (const m of list) {
      const t = latestByMerchant.get(m.id);
      if (!t) continue;
      measured++;
      volume += t.monthlyTxVolume;
      float += t.avgDailyFloatBalance;
      fees += t.acquiringFeeEarned;
      terminals += t.posTerminalCount;
      txSum += t.monthlyTxCount;
      basketSum += t.monthlyTxCount > 0 ? t.monthlyTxVolume / t.monthlyTxCount : 0;
      scoreSum += computeLeadScore({
        avgDailyFloatBalance: t.avgDailyFloatBalance,
        monthlyTxVolume: t.monthlyTxVolume,
        cccDays: s.cashConversionCycleDays,
        isTaxCompliant: m.isTaxCompliant,
      }).total;
    }
    const avgScore = list.length > 0 ? scoreSum / list.length : 0;
    return {
      id: s.id,
      title: s.title,
      isicCode: s.isicCode,
      intaCode: s.intaCode,
      intaProfitRatio: s.intaProfitRatio,
      defaultMcc: s.defaultMcc,
      avgGrossMargin: s.avgGrossMargin,
      cccDays: s.cashConversionCycleDays,
      categoryId: s.categoryId,
      categoryName: catById.get(s.categoryId)?.name ?? "—",
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

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const corpus = await loadCorpus();
  const { categories, subs, merchants, metrics, latestPeriod, prevPeriod, periods } = corpus;

  const merchantById = new Map(merchants.map((m) => [m.id, m]));
  const subById = new Map(subs.map((s) => [s.id, s]));

  const periodRows = metrics.filter((r) => r.reportingPeriod === latestPeriod);
  const prevRows = metrics.filter((r) => r.reportingPeriod === prevPeriod);

  const sum = (rows: TerminalMetricRow[], fn: (r: TerminalMetricRow) => number) =>
    rows.reduce((a, r) => a + fn(r), 0);

  const totalTxVolume = sum(periodRows, (r) => r.monthlyTxVolume);
  const totalTxCount = sum(periodRows, (r) => r.monthlyTxCount);
  const totalFloat = sum(periodRows, (r) => r.avgDailyFloatBalance);
  const totalFees = sum(periodRows, (r) => r.acquiringFeeEarned);
  const totalSupportCost = sum(periodRows, (r) => r.operatingSupportCost);
  const monthlyFloatYield = floatMarginMonthly(totalFloat);
  const netMargin = monthlyFloatYield + totalFees - totalSupportCost;

  const prevVolume = sum(prevRows, (r) => r.monthlyTxVolume) || 1;
  const prevFloat = sum(prevRows, (r) => r.avgDailyFloatBalance) || 1;

  /* ---- 6-month trend ------------------------------------------------ */
  const trend = periods.map((p) => {
    const rows = metrics.filter((r) => r.reportingPeriod === p);
    return {
      period: p,
      label: jalaliPeriodLabel(p),
      short: jalaliPeriodShort(p),
      volume: sum(rows, (r) => r.monthlyTxVolume),
      float: sum(rows, (r) => r.avgDailyFloatBalance),
      fees: sum(rows, (r) => r.acquiringFeeEarned),
    };
  });

  /* ---- profitability per category ------------------------------------ */
  const catAgg = new Map<
    string,
    { merchants: Set<string>; terminals: number; volume: number; float: number; fees: number; support: number }
  >();
  for (const row of periodRows) {
    const m = merchantById.get(row.merchantId);
    if (!m) continue;
    const s = subById.get(m.subGuildId);
    if (!s) continue;
    const agg =
      catAgg.get(s.categoryId) ??
      { merchants: new Set<string>(), terminals: 0, volume: 0, float: 0, fees: 0, support: 0 };
    agg.merchants.add(m.id);
    agg.terminals += row.posTerminalCount;
    agg.volume += row.monthlyTxVolume;
    agg.float += row.avgDailyFloatBalance;
    agg.fees += row.acquiringFeeEarned;
    agg.support += row.operatingSupportCost;
    catAgg.set(s.categoryId, agg);
  }
  const categoryProfit = categories.map((c) => {
    const agg = catAgg.get(c.id);
    const volume = agg?.volume ?? 0;
    const float = agg?.float ?? 0;
    const fees = agg?.fees ?? 0;
    const margin = floatMarginMonthly(float) + fees - (agg?.support ?? 0);
    return {
      categoryId: c.id,
      name: c.name,
      merchants: agg?.merchants.size ?? 0,
      terminals: agg?.terminals ?? 0,
      volume,
      float,
      fees,
      margin,
      sharePct: totalTxVolume > 0 ? (volume / totalTxVolume) * 100 : 0,
    };
  });

  /* ---- provincial heatmap -------------------------------------------- */
  const provAgg = new Map<string, { merchants: Set<string>; terminals: number; volume: number; float: number }>();
  for (const row of periodRows) {
    const m = merchantById.get(row.merchantId);
    if (!m) continue;
    const agg = provAgg.get(m.province) ?? { merchants: new Set<string>(), terminals: 0, volume: 0, float: 0 };
    agg.merchants.add(m.id);
    agg.terminals += row.posTerminalCount;
    agg.volume += row.monthlyTxVolume;
    agg.float += row.avgDailyFloatBalance;
    provAgg.set(m.province, agg);
  }
  const maxProvVolume = Math.max(1, ...Array.from(provAgg.values()).map((a) => a.volume));
  const provinces = Array.from(provAgg.entries())
    .map(([province, a]) => ({
      province,
      merchants: a.merchants.size,
      terminals: a.terminals,
      volume: a.volume,
      float: a.float,
      intensity: a.volume / maxProvVolume,
    }))
    .sort((x, y) => y.volume - x.volume);

  /* ---- sub guilds + merchants leaderboard ----------------------------- */
  const subSummaries = buildSubGuildSummaries(corpus);
  const topSubGuilds = subSummaries
    .filter((s) => s.merchantCount > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 12)
    .map((s) => ({
      id: s.id,
      title: s.title,
      categoryName: s.categoryName,
      merchants: s.merchantCount,
      volume: s.volume,
      float: s.float,
    }));

  const latestByMerchant = new Map(periodRows.map((r) => [r.merchantId, r]));
  const topMerchants = merchants
    .map((m) => {
      const t = latestByMerchant.get(m.id);
      if (!t) return null;
      const s = subById.get(m.subGuildId)!;
      const margin =
        floatMarginMonthly(t.avgDailyFloatBalance) +
        t.acquiringFeeEarned -
        t.operatingSupportCost;
      const score = computeLeadScore({
        avgDailyFloatBalance: t.avgDailyFloatBalance,
        monthlyTxVolume: t.monthlyTxVolume,
        cccDays: s.cashConversionCycleDays,
        isTaxCompliant: m.isTaxCompliant,
      }).total;
      return {
        id: m.id,
        businessName: m.businessName,
        ownerName: m.ownerName,
        subGuildTitle: s.title,
        province: m.province,
        branchCode: m.assignedBranchCode,
        volume: t.monthlyTxVolume,
        float: t.avgDailyFloatBalance,
        margin,
        score,
        isTaxCompliant: m.isTaxCompliant,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 7);

  return {
    latestPeriod,
    latestPeriodLabel: jalaliPeriodLabel(latestPeriod),
    prevPeriod,
    totals: {
      merchantCount: merchants.length,
      activeTerminals: sum(periodRows, (r) => r.posTerminalCount),
      totalTxCount,
      totalTxVolume,
      totalFloat,
      monthlyFloatYield,
      totalFees,
      totalSupportCost,
      netMargin,
      avgBasket: totalTxCount > 0 ? totalTxVolume / totalTxCount : 0,
      volumeDeltaPct: (totalTxVolume - prevVolume) / prevVolume * 100,
      floatDeltaPct: (totalFloat - prevFloat) / prevFloat * 100,
    },
    trend,
    categoryProfit,
    provinces,
    topSubGuilds,
    topMerchants,
  };
}

export async function getGuildsOverview(): Promise<GuildsOverview> {
  const corpus = await loadCorpus();
  const subSummaries = buildSubGuildSummaries(corpus);
  const byCat = new Map<string, SubGuildSummary[]>();
  for (const s of subSummaries) {
    const list = byCat.get(s.categoryId) ?? [];
    list.push(s);
    byCat.set(s.categoryId, list);
  }
  const categories = corpus.categories.map((c) => {
    const list = byCat.get(c.id) ?? [];
    return {
      id: c.id,
      name: c.name,
      isicCodePrefix: c.isicCodePrefix,
      description: c.description,
      subGuildCount: list.length,
      merchantCount: list.reduce((a, s) => a + s.merchantCount, 0),
      volume: list.reduce((a, s) => a + s.volume, 0),
      float: list.reduce((a, s) => a + s.float, 0),
    };
  });
  return {
    categories,
    subGuilds: subSummaries.sort((a, b) => b.avgScore - a.avgScore),
    latestPeriod: corpus.latestPeriod,
  };
}

export async function getGuildCompare(aId: string, bId: string): Promise<GuildCompareResult | null> {
  const corpus = await loadCorpus();
  const summaries = buildSubGuildSummaries(corpus);
  const a = summaries.find((s) => s.id === aId);
  const b = summaries.find((s) => s.id === bId);
  if (!a || !b) return null;

  const firstPeriod = corpus.periods[0] ?? corpus.latestPeriod;
  const merchantsBySub = new Map<string, MerchantBusinessRow[]>();
  for (const m of corpus.merchants) {
    const list = merchantsBySub.get(m.subGuildId) ?? [];
    list.push(m);
    merchantsBySub.set(m.subGuildId, list);
  }

  const maxVolume = Math.max(1, ...summaries.map((s) => s.volume));

  const perSub = (subId: string) => {
    const list = merchantsBySub.get(subId) ?? [];
    const sub = summaries.find((s) => s.id === subId)!;
    const n = Math.max(1, list.length);
    const avgFloat = sub.float / n;
    const avgFees = sub.fees / n;

    let compliant = 0;
    let lowRisk = 0;
    for (const m of list) {
      if (m.isTaxCompliant) compliant++;
      if (m.riskStatus === "LOW") lowRisk++;
    }
    const regulatory = list.length
      ? (compliant / list.length) * 70 + (lowRisk / list.length) * 30
      : 0;

    // growth: first vs latest period volume for merchants of this sub
    let firstVol = 0;
    let lastVol = 0;
    for (const row of corpus.metrics) {
      const m = list.find((x) => x.id === row.merchantId);
      if (!m) continue;
      if (row.reportingPeriod === firstPeriod) firstVol += row.monthlyTxVolume;
      if (row.reportingPeriod === corpus.latestPeriod) lastVol += row.monthlyTxVolume;
    }
    const growthPct = firstVol > 0 ? ((lastVol - firstVol) / firstVol) * 100 : 0;

    return {
      floatStability: clampScore((avgFloat / FLOAT_BENCHMARK_RIALS) * 100),
      feeIncome: clampScore((avgFees / FEE_BENCHMARK_RIALS) * 100),
      creditAppetite: creditSuitabilityScore(sub.cccDays),
      regulatory: clampScore(regulatory),
      growth: clampScore(50 + growthPct * 2.5),
      share: clampScore((sub.volume / maxVolume) * 100),
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

export async function getLeads(): Promise<LeadsResponse> {
  const rows = await db
    .select({
      lead: marketingLeads,
      merchant: merchantBusinesses,
      subGuildTitle: subGuilds.title,
      categoryName: guildCategories.name,
    })
    .from(marketingLeads)
    .innerJoin(merchantBusinesses, eq(marketingLeads.merchantId, merchantBusinesses.id))
    .innerJoin(subGuilds, eq(merchantBusinesses.subGuildId, subGuilds.id))
    .innerJoin(guildCategories, eq(subGuilds.categoryId, guildCategories.id))
    .orderBy(desc(marketingLeads.leadScore));

  const leads: LeadDTO[] = rows.map((r) => ({
    id: r.lead.id,
    merchantId: r.lead.merchantId,
    branchCode: r.lead.branchCode,
    recommendedProduct: r.lead.recommendedProduct,
    leadScore: r.lead.leadScore,
    pipelineStage: r.lead.pipelineStage,
    lastInteractionDate: r.lead.lastInteractionDate.toISOString(),
    merchant: {
      businessName: r.merchant.businessName,
      ownerName: r.merchant.ownerName,
      province: r.merchant.province,
      city: r.merchant.city,
      isTaxCompliant: r.merchant.isTaxCompliant,
      riskStatus: r.merchant.riskStatus,
      subGuildTitle: r.subGuildTitle,
      categoryName: r.categoryName,
    },
  }));

  const byStage = leads.reduce(
    (acc, l) => {
      acc[l.pipelineStage] = (acc[l.pipelineStage] ?? 0) + 1;
      return acc;
    },
    { NEW: 0, CONTACTED: 0, FINANCIAL_EVALUATION: 0, CONVERTED: 0, LOST: 0 } as Record<
      LeadDTO["pipelineStage"],
      number
    >,
  );

  return {
    leads,
    stats: {
      total: leads.length,
      byStage,
      avgScore:
        leads.length > 0
          ? Math.round((leads.reduce((a, l) => a + l.leadScore, 0) / leads.length) * 10) / 10
          : 0,
      hotCount: leads.filter((l) => l.leadScore >= 75).length,
    },
  };
}

export async function updateLeadStage(id: string, stage: LeadDTO["pipelineStage"]) {
  const [updated] = await db
    .update(marketingLeads)
    .set({ pipelineStage: stage, lastInteractionDate: new Date() })
    .where(eq(marketingLeads.id, id))
    .returning();
  return updated ?? null;
}
