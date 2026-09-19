import type { MerchantBusinessRow, MarketingLeadRow, TerminalMetricRow } from "@/db/schema";
import type { BranchOpportunity, DataQualityCheck, DataQualitySummary, EarlyWarning } from "./types";
import { clampScore, round1 } from "./engine";

const DAY_MS = 86_400_000;

export function daysSince(date: Date): number {
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / DAY_MS));
}

export function buildDataQuality(
  merchants: MerchantBusinessRow[],
  metrics: TerminalMetricRow[],
  leads: MarketingLeadRow[],
  latestPeriod: string,
): DataQualitySummary {
  const merchantIds = new Set(merchants.map((merchant) => merchant.id));
  const leadMerchantIds = new Set(merchants.map((merchant) => merchant.id));
  const orphanMetrics = metrics.filter((metric) => !merchantIds.has(metric.merchantId)).length;
  const orphanLeads = leads.filter((lead) => !leadMerchantIds.has(lead.merchantId)).length;
  const metricKeys = new Map<string, number>();
  for (const metric of metrics) {
    const key = `${metric.merchantId}:${metric.reportingPeriod}`;
    metricKeys.set(key, (metricKeys.get(key) ?? 0) + 1);
  }
  const duplicateMetrics = Array.from(metricKeys.values()).reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );
  const invalidMetrics = metrics.filter(
    (metric) =>
      metric.posTerminalCount <= 0 ||
      metric.monthlyTxCount < 0 ||
      metric.monthlyTxVolume < 0 ||
      metric.avgDailyFloatBalance < 0 ||
      metric.acquiringFeeEarned < 0 ||
      metric.operatingSupportCost < 0,
  ).length;
  const latestMerchantIds = new Set(
    metrics.filter((metric) => metric.reportingPeriod === latestPeriod).map((metric) => metric.merchantId),
  );
  const merchantsWithoutLatest = merchants.filter((merchant) => !latestMerchantIds.has(merchant.id)).length;

  const check = (
    code: string,
    label: string,
    count: number,
    detail: string,
    fail = false,
  ): DataQualityCheck => ({
    code,
    label,
    count,
    detail,
    status: count === 0 ? "PASS" : fail ? "FAIL" : "WARN",
  });
  const checks: DataQualityCheck[] = [
    check("ORPHAN_METRICS", "Metric بدون پذیرنده", orphanMetrics, "هر metric باید به یک واحد صنفی موجود متصل باشد.", true),
    check("ORPHAN_LEADS", "سرنخ بدون پذیرنده", orphanLeads, "سرنخ‌های جداافتاده وارد قیف فروش نشوند.", true),
    check("DUPLICATE_METRICS", "Metric تکراری", duplicateMetrics, "کلید پذیرنده و دوره باید یکتا باشد.", true),
    check("INVALID_METRICS", "مقدار غیرمعتبر", invalidMetrics, "تعداد، مبلغ و هزینه‌ها نباید منفی باشند.", true),
    check("MISSING_LATEST", "بدون داده دوره جاری", merchantsWithoutLatest, "پذیرنده فاقد metric دوره جاری از KPI فعال حذف می‌شود."),
  ];
  const penalty = orphanMetrics * 20 + orphanLeads * 15 + duplicateMetrics * 10 + invalidMetrics * 15 + merchantsWithoutLatest * 2;
  return { score: round1(clampScore(100 - penalty)), checks };
}

export function buildBranchOpportunities(
  merchants: MerchantBusinessRow[],
  metrics: TerminalMetricRow[],
  leads: MarketingLeadRow[],
  latestPeriod: string,
): BranchOpportunity[] {
  const merchantById = new Map(merchants.map((merchant) => [merchant.id, merchant]));
  const leadCountByMerchant = new Map<string, number>();
  for (const lead of leads) {
    leadCountByMerchant.set(lead.merchantId, (leadCountByMerchant.get(lead.merchantId) ?? 0) + 1);
  }
  const aggregates = new Map<string, {
    province: string;
    city: string;
    merchants: Set<string>;
    terminals: number;
    volume: number;
    float: number;
    leads: number;
    compliant: number;
  }>();
  for (const metric of metrics.filter((row) => row.reportingPeriod === latestPeriod)) {
    const merchant = merchantById.get(metric.merchantId);
    if (!merchant) continue;
    const aggregate = aggregates.get(merchant.assignedBranchCode) ?? {
      province: merchant.province,
      city: merchant.city,
      merchants: new Set<string>(),
      terminals: 0,
      volume: 0,
      float: 0,
      leads: 0,
      compliant: 0,
    };
    if (!aggregate.merchants.has(merchant.id)) {
      aggregate.merchants.add(merchant.id);
      aggregate.leads += leadCountByMerchant.get(merchant.id) ?? 0;
      aggregate.compliant += merchant.isTaxCompliant ? 1 : 0;
    }
    aggregate.terminals += metric.posTerminalCount;
    aggregate.volume += metric.monthlyTxVolume;
    aggregate.float += metric.avgDailyFloatBalance;
    aggregates.set(merchant.assignedBranchCode, aggregate);
  }

  const maxVolume = Math.max(1, ...Array.from(aggregates.values()).map((aggregate) => aggregate.volume));
  const maxFloat = Math.max(1, ...Array.from(aggregates.values()).map((aggregate) => aggregate.float));
  return Array.from(aggregates.entries())
    .map(([branchCode, aggregate]) => {
      const merchantCount = aggregate.merchants.size;
      const taxCompliancePct = merchantCount ? (aggregate.compliant / merchantCount) * 100 : 0;
      const leadCoverage = merchantCount ? Math.min(1, aggregate.leads / merchantCount) : 0;
      const volumeRatio = aggregate.volume / maxVolume;
      const floatRatio = aggregate.float / maxFloat;
      const opportunityScore = round1(clampScore(
        volumeRatio * 45 + floatRatio * 25 + taxCompliancePct * 0.2 + (1 - leadCoverage) * 10,
      ));
      let signal: BranchOpportunity["signal"] = "MONITOR";
      let recommendation = "پایش ماهانه و حفظ کیفیت خدمت";
      if (taxCompliancePct < 65) {
        signal = "TAX_CLEANUP";
        recommendation = "کمپین اتصال به سامانه مؤدیان پیش از اعتباردهی";
      } else if (aggregate.terminals / Math.max(1, merchantCount) < 1.25 && volumeRatio > 0.4) {
        signal = "EXPAND_POS";
        recommendation = "بررسی توسعه پایانه و پوشش تراکنش‌های ازدست‌رفته";
      } else if (leadCoverage < 0.5 && opportunityScore >= 50) {
        signal = "CREDIT_CAMPAIGN";
        recommendation = "اختصاص کارشناس برای پیشنهاد سرمایه در گردش";
      }
      return {
        branchCode,
        province: aggregate.province,
        city: aggregate.city,
        merchantCount,
        terminals: aggregate.terminals,
        volume: aggregate.volume,
        float: aggregate.float,
        leadCount: aggregate.leads,
        taxCompliancePct: round1(taxCompliancePct),
        opportunityScore,
        recommendation,
        signal,
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 8);
}

export function buildEarlyWarnings(input: {
  merchants: MerchantBusinessRow[];
  latestRows: TerminalMetricRow[];
  previousRows: TerminalMetricRow[];
  leads: MarketingLeadRow[];
  dataQuality: DataQualitySummary;
}): EarlyWarning[] {
  const warnings: EarlyWarning[] = [];
  const currentVolume = input.latestRows.reduce((total, row) => total + row.monthlyTxVolume, 0);
  const previousVolume = input.previousRows.reduce((total, row) => total + row.monthlyTxVolume, 0);
  if (previousVolume > 0) {
    const delta = ((currentVolume - previousVolume) / previousVolume) * 100;
    if (delta <= -5) {
      warnings.push({
        code: "VOLUME_DECLINE",
        severity: delta <= -12 ? "critical" : "warning",
        title: "افت گردش شبکه",
        detail: `گردش دوره جاری ${Math.abs(round1(delta))}٪ کمتر از دوره قبل است؛ علت‌یابی شعب آغاز شود.`,
        value: round1(delta),
      });
    }
  }
  const activeMerchantIds = new Set(input.latestRows.map((row) => row.merchantId));
  const activeMerchants = input.merchants.filter((merchant) => activeMerchantIds.has(merchant.id));
  const highRiskPct = activeMerchants.length
    ? (activeMerchants.filter((merchant) => merchant.riskStatus === "HIGH").length / activeMerchants.length) * 100
    : 0;
  const taxGapPct = activeMerchants.length
    ? (activeMerchants.filter((merchant) => !merchant.isTaxCompliant).length / activeMerchants.length) * 100
    : 0;
  const staleLeads = input.leads.filter((lead) => daysSince(lead.lastInteractionDate) >= 14).length;
  if (highRiskPct >= 25) {
    warnings.push({
      code: "HIGH_RISK_CONCENTRATION",
      severity: highRiskPct >= 40 ? "critical" : "warning",
      title: "تمرکز پذیرندگان پرریسک",
      detail: `${round1(highRiskPct)}٪ از واحدهای فعال در وضعیت ریسک بالا هستند؛ سقف خودکار محدود شود.`,
      value: round1(highRiskPct),
    });
  }
  if (taxGapPct >= 30) {
    warnings.push({
      code: "TAX_GAP",
      severity: taxGapPct >= 50 ? "critical" : "warning",
      title: "شکاف انطباق مالیاتی",
      detail: `${round1(taxGapPct)}٪ از واحدهای فعال به سامانه مؤدیان متصل نیستند.`,
      value: round1(taxGapPct),
    });
  }
  if (staleLeads > 0) {
    warnings.push({
      code: "STALE_LEADS",
      severity: staleLeads >= 10 ? "warning" : "info",
      title: "سرنخ‌های خارج از SLA",
      detail: `${staleLeads} سرنخ بیش از ۱۴ روز بدون تعامل مانده است.`,
      value: staleLeads,
    });
  }
  if (input.dataQuality.score < 95) {
    warnings.push({
      code: "DATA_QUALITY",
      severity: input.dataQuality.score < 80 ? "critical" : "warning",
      title: "افت کیفیت داده",
      detail: `امتیاز کیفیت داده ${input.dataQuality.score} از ۱۰۰ است؛ رکوردهای مسئله‌دار قرنطینه شوند.`,
      value: input.dataQuality.score,
    });
  }
  if (warnings.length === 0) {
    warnings.push({
      code: "NO_ACTIVE_WARNING",
      severity: "info",
      title: "عملیات پایدار است",
      detail: "در آستانه‌های فعلی، هشدار بحرانی یا خارج از SLA ثبت نشده است.",
    });
  }
  const severityRank = { critical: 0, warning: 1, info: 2 } as const;
  return warnings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
