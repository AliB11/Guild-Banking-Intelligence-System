import type { RecommendedProduct, RiskStatus } from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Bank-wide financial constants (تنظیمات خزانه‌داری بانک)               */
/* ------------------------------------------------------------------ */

/** نسخه سیاست‌ها و فرمول‌های تصمیم‌یار؛ در audit trail ذخیره شود. */
export const MODEL_VERSION = "GBI-ΠBank-1.5.0";

/** نرخ تسهیلات سالانه (اعطای منابع) */
export const LENDING_RATE = 0.23;
/** نسبت سپرده قانونی نزد بانک مرکزی */
export const RESERVE_RATIO = 0.13;
/** بنچمارک رسوب: ۱۰۰ میلیون تومان مانده ماهانه CASA = ۱۰۰ امتیاز (ریال) */
export const FLOAT_BENCHMARK_RIALS = 1_000_000_000;
/** بنچمارک گردش: ۵ میلیارد تومان گردش ماهانه = ۱۰۰ امتیاز (ریال) */
export const VOLUME_BENCHMARK_RIALS = 50_000_000_000;
/** هزینه ماهانه نگهداری هر پایانه (رول، سوئیچ، پشتیبانی PSP) — ۱۵۰ هزار تومان */
export const TERMINAL_MONTHLY_COST_RIALS = 1_500_000;
/** حاشیه خالص تسهیلات (Spread) بین نرخ اعطا و نرخ تمام‌شده منابع */
export const FACILITY_SPREAD = 0.04;
/** روزهای مبنای محاسبه ماه */
export const DAYS_IN_MONTH = 30;

/* ------------------------------------------------------------------ */
/* Central Bank POS Fee Logic — منطق کارمزد شاپرک                      */
/* ------------------------------------------------------------------ */

/**
 * کارمزد پایانه طبق بخش‌نامه بانک مرکزی:
 *  تراکنش < 6,000,000 ریال  →  1,200 ریال
 *  در غیر این صورت          →  Min(40,000 ریال , مبلغ × 0.0002)
 */
export function cbiPosFee(amountRials: number): number {
  if (amountRials <= 0) return 0;
  if (amountRials < 6_000_000) return 1_200;
  return Math.min(40_000, Math.round(amountRials * 0.0002));
}

/* ------------------------------------------------------------------ */
/* Net Bank Profitability Engine — موتور سودآوری خالص بانک (Π_Bank)     */
/* ------------------------------------------------------------------ */

export interface ProfitabilityInput {
  avgDailyFloatBalance: number;
  acquiringFeeEarned: number;
  creditFacilityMargin?: number;
  operatingSupportCost: number;
}

/**
 * Annualized Float Margin (monthly accrual) = رسوب × (نرخ تسهیلات − نسبت سپرده قانونی) / ۱۲
 */
export function floatMarginMonthly(avgDailyFloatBalance: number): number {
  return (avgDailyFloatBalance * (LENDING_RATE - RESERVE_RATIO)) / 12;
}

/**
 * Net Merchant Margin = Float Margin + کارمزد پذیرندگی + حاشیه تسهیلات − هزینه پشتیبانی
 */
export function netMerchantMargin(input: ProfitabilityInput): number {
  const floatMargin = floatMarginMonthly(input.avgDailyFloatBalance);
  return (
    floatMargin +
    input.acquiringFeeEarned +
    (input.creditFacilityMargin ?? 0) -
    input.operatingSupportCost
  );
}

/* ------------------------------------------------------------------ */
/* Lead Prioritization Score — امتیازدهی سرنخ (۰ تا ۱۰۰)                */
/* Score = Float×0.35 + Volume×0.25 + Credit×0.20 + Tax×0.20            */
/* ------------------------------------------------------------------ */

export const LEAD_WEIGHTS = {
  float: 0.35,
  volume: 0.25,
  credit: 0.2,
  tax: 0.2,
} as const;

export function floatScore(avgDailyFloatBalance: number): number {
  return clampScore(
    (avgDailyFloatBalance / FLOAT_BENCHMARK_RIALS) * 100,
  );
}

export function volumeScore(monthlyTxVolume: number): number {
  return clampScore((monthlyTxVolume / VOLUME_BENCHMARK_RIALS) * 100);
}

/**
 * تناظر چرخه تبدیل نقد (CCC) با ابزار اعتباری:
 *  CCC منفی (چرخه سریع نقدینگی)      → ۱۰۰ (مناسب تسهیلات پوز / سرمایه در گردش)
 *  ۰ تا ۳۰ روز                        → ۸۰
 *  ۳۱ تا ۶۰ روز                       → ۶۰ (مناسب LC ریالی)
 *  بیش از ۶۰ روز                      → ۴۰ (نیازمند GAM / تنخواه زنجیره‌ای)
 */
export function creditSuitabilityScore(cccDays: number): number {
  if (cccDays < 0) return 100;
  if (cccDays <= 30) return 80;
  if (cccDays <= 60) return 60;
  return 40;
}

/** انطباق مالیاتی: ۱۰۰ امتیاز در صورت اتصال به سامانه مؤدیان، در غیر این صورت ۳۰ */
export function taxComplianceScore(isTaxCompliant: boolean): number {
  return isTaxCompliant ? 100 : 30;
}

export interface LeadScoreBreakdown {
  floatScore: number;
  volumeScore: number;
  creditScore: number;
  taxScore: number;
  total: number;
}

export function computeLeadScore(input: {
  avgDailyFloatBalance: number;
  monthlyTxVolume: number;
  cccDays: number;
  isTaxCompliant: boolean;
}): LeadScoreBreakdown {
  const f = floatScore(input.avgDailyFloatBalance);
  const v = volumeScore(input.monthlyTxVolume);
  const c = creditSuitabilityScore(input.cccDays);
  const t = taxComplianceScore(input.isTaxCompliant);
  const total =
    f * LEAD_WEIGHTS.float +
    v * LEAD_WEIGHTS.volume +
    c * LEAD_WEIGHTS.credit +
    t * LEAD_WEIGHTS.tax;
  return {
    floatScore: round1(f),
    volumeScore: round1(v),
    creditScore: c,
    taxScore: t,
    total: round1(total),
  };
}

/* ------------------------------------------------------------------ */
/* Product Recommendation — طبقه‌بندی خودکار محصول اعتباری              */
/* ------------------------------------------------------------------ */

export function recommendProduct(input: {
  cccDays: number;
  avgDailyFloatBalance: number;
  monthlyTxVolume: number;
  isTaxCompliant: boolean;
}): RecommendedProduct {
  const { cccDays, monthlyTxVolume, isTaxCompliant } = input;

  // واحدهای غیرمتصل به سامانه مؤدیان → ابتدا توسعه پایانه تا شفافیت مالیاتی
  if (!isTaxCompliant) return "POS_EXPANSION";

  // چرخه نقد منفی/کوتاه با گردش بالا → تسهیلات پذیرنده (طرح پوز)
  if (cccDays < 15) {
    return monthlyTxVolume >= VOLUME_BENCHMARK_RIALS * 0.6
      ? "WORKING_CAPITAL_LOAN"
      : "POS_EXPANSION";
  }
  // چرخه متوسط → اعتبار سند داخلی ریالی
  if (cccDays <= 60) return "LC_DOMESTIC";
  // چرخه بلند → زنجیره تأمین (گام) و تنزیل اسناد
  return cccDays <= 90 ? "SCF_GAM" : "BILL_DISCOUNTING";
}

/* ------------------------------------------------------------------ */
/* Credit Plans — طرح‌های تسهیلاتی پذیرندگان (ملی / سپهر / امید)         */
/* ------------------------------------------------------------------ */

export interface CreditPlan {
  code: string;
  name: string;
  nameLatin: string;
  /** سقف تسهیلات (ریال) */
  ceilingRials: number;
  /** ضریب نسبت سقف تسهیلات به گردش ماهانه کارتخوان */
  volumeFactor: number;
  /** حداقل امتیاز سرنخ برای واجد شرایط بودن */
  minScore: number;
  description: string;
}

export const CREDIT_PLANS: CreditPlan[] = [
  {
    code: "MELI",
    name: "طرح پذیرنده ملی",
    nameLatin: "MELI",
    ceilingRials: 100_000_000_000, // ۱۰ میلیارد تومان
    volumeFactor: 0.35,
    minScore: 55,
    description: "تسهیلات کلان پذیرندگان برتر با گردش بالا و انطباق کامل مالیاتی",
  },
  {
    code: "SEPEHR",
    name: "طرح سپهر",
    nameLatin: "SEPEHR",
    ceilingRials: 50_000_000_000, // ۵ میلیارد تومان
    volumeFactor: 0.3,
    minScore: 45,
    description: "سرمایه در گردش میان‌بر اساس عملکرد تراکنشی و رسوب پایدار",
  },
  {
    code: "OMID",
    name: "طرح امید",
    nameLatin: "OMID",
    ceilingRials: 10_000_000_000, // ۱ میلیارد تومان
    volumeFactor: 0.25,
    minScore: 30,
    description: "اعتبار خُرد جهت حمایت از اصناف در حال رشد و نوسازی پایانه",
  },
];

export interface CreditPlanQuote {
  plan: CreditPlan;
  eligible: boolean;
  proposedLimitRials: number;
  reason: string;
}

export function quoteCreditPlans(input: {
  monthlyTxVolume: number;
  avgDailyFloatBalance: number;
  leadScore: number;
  isTaxCompliant: boolean;
  riskStatus: RiskStatus;
}): CreditPlanQuote[] {
  const taxMultiplier = input.isTaxCompliant ? 1 : 0.5;
  const riskBlocked = input.riskStatus === "HIGH";

  return CREDIT_PLANS.map((plan) => {
    const raw =
      Math.min(
        input.monthlyTxVolume * plan.volumeFactor,
        input.avgDailyFloatBalance * 6,
        plan.ceilingRials,
      ) * taxMultiplier;
    const proposed = riskBlocked ? 0 : Math.max(0, Math.floor(raw / 10_000_000) * 10_000_000);

    let eligible = true;
    let reason = "واجد شرایط بر اساس گردش و رسوب";
    if (riskBlocked) {
      eligible = false;
      reason = "ریسک بالا — ارجاع به کمیته اعتباری";
    } else if (input.leadScore < plan.minScore) {
      eligible = false;
      reason = `حداقل امتیاز موردنیاز ${plan.minScore}`;
    } else if (proposed < plan.ceilingRials * 0.02) {
      eligible = false;
      reason = "گردش ماهانه کفایت طرح را ندارد";
    }
    return {
      plan,
      eligible: eligible && proposed > 0,
      proposedLimitRials: eligible ? proposed : 0,
      reason,
    };
  });
}

/** حاشیه ماهانه تسهیلات = سقف اعتبار × اسپرد / ۱۲ */
export function creditFacilityMarginMonthly(limitRials: number): number {
  return (limitRials * FACILITY_SPREAD) / 12;
}

/* ------------------------------------------------------------------ */
/* Calculator — ماشین‌حساب سودآوری و تسهیلات                             */
/* ------------------------------------------------------------------ */

export interface CalculatorInput {
  dailyTxCount: number;
  avgBasketRials: number;
  retentionDays: number;
  posUnits: number;
  cccDays: number;
  isTaxCompliant: boolean;
  riskStatus: RiskStatus;
}

export interface CalculatorResult {
  monthlyTxCount: number;
  monthlyTxVolume: number;
  avgBasketRials: number;
  feePerTx: number;
  monthlyAcquiringFees: number;
  avgDailyFloat: number;
  floatMargin: number;
  operatingSupportCost: number;
  leadScore: LeadScoreBreakdown;
  recommendedProduct: RecommendedProduct;
  creditQuotes: CreditPlanQuote[];
  bestCreditLimit: number;
  creditFacilityMargin: number;
  netBankMargin: number;
  roiPercent: number;
  /** مدل و مفروضات برای explainability و audit trail */
  modelVersion: string;
  assumptions: {
    lendingRate: number;
    reserveRatio: number;
    facilitySpread: number;
    daysInMonth: number;
  };
}

export function runCalculator(input: CalculatorInput): CalculatorResult {
  const monthlyTxCount = input.dailyTxCount * DAYS_IN_MONTH;
  const monthlyTxVolume = monthlyTxCount * input.avgBasketRials;
  const feePerTx = cbiPosFee(input.avgBasketRials);
  const monthlyAcquiringFees = feePerTx * monthlyTxCount;

  // رسوب روزانه = گردش روزانه × روزهای ماندگاری وجوه
  const avgDailyFloat =
    input.dailyTxCount * input.avgBasketRials * input.retentionDays;

  const floatMargin = floatMarginMonthly(avgDailyFloat);
  const operatingSupportCost = input.posUnits * TERMINAL_MONTHLY_COST_RIALS;

  const leadScore = computeLeadScore({
    avgDailyFloatBalance: avgDailyFloat,
    monthlyTxVolume,
    cccDays: input.cccDays,
    isTaxCompliant: input.isTaxCompliant,
  });

  const recommendedProduct = recommendProduct({
    cccDays: input.cccDays,
    avgDailyFloatBalance: avgDailyFloat,
    monthlyTxVolume,
    isTaxCompliant: input.isTaxCompliant,
  });

  const creditQuotes = quoteCreditPlans({
    monthlyTxVolume,
    avgDailyFloatBalance: avgDailyFloat,
    leadScore: leadScore.total,
    isTaxCompliant: input.isTaxCompliant,
    riskStatus: input.riskStatus,
  });

  const bestCreditLimit = Math.max(
    0,
    ...creditQuotes.map((q) => q.proposedLimitRials),
  );
  const creditFacilityMargin = creditFacilityMarginMonthly(bestCreditLimit);

  const netBankMargin =
    floatMargin + monthlyAcquiringFees + creditFacilityMargin - operatingSupportCost;

  // ROI is net return over the bank's support cost. Gross revenue is shown
  // separately in the breakdown so the KPI is not overstated by the cost base.
  const roiPercent =
    operatingSupportCost > 0
      ? (netBankMargin / operatingSupportCost) * 100
      : 0;

  return {
    monthlyTxCount,
    monthlyTxVolume,
    avgBasketRials: input.avgBasketRials,
    feePerTx,
    monthlyAcquiringFees,
    avgDailyFloat,
    floatMargin,
    operatingSupportCost,
    leadScore,
    recommendedProduct,
    creditQuotes,
    bestCreditLimit,
    creditFacilityMargin,
    netBankMargin,
    roiPercent,
    modelVersion: MODEL_VERSION,
    assumptions: {
      lendingRate: LENDING_RATE,
      reserveRatio: RESERVE_RATIO,
      facilitySpread: FACILITY_SPREAD,
      daysInMonth: DAYS_IN_MONTH,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Liquidity stress lab — آزمایشگاه شوک نقدینگی                         */
/* ------------------------------------------------------------------ */

export interface StressScenarioInput {
  calculator: CalculatorInput;
  volumeShockPct: number;
  basketShockPct: number;
  retentionDeltaDays: number;
  cccDeltaDays: number;
  supportCostShockPct: number;
}

export interface StressScenarioResult {
  base: CalculatorResult;
  stressed: CalculatorResult;
  delta: {
    marginRials: number;
    marginPct: number;
    creditLimitRials: number;
    volumePct: number;
  };
  resilienceScore: number;
  drivers: string[];
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Applies bounded shocks to the same governed calculator. Support-cost shock
 * is applied after the common engine so the scenario remains comparable with
 * the operational support-cost assumption.
 */
export function runStressScenario(input: StressScenarioInput): StressScenarioResult {
  const volumeShock = clampNumber(input.volumeShockPct, -80, 100);
  const basketShock = clampNumber(input.basketShockPct, -80, 100);
  const supportShock = clampNumber(input.supportCostShockPct, -100, 300);
  const base = runCalculator(input.calculator);
  const stressedInput: CalculatorInput = {
    ...input.calculator,
    dailyTxCount: Math.max(0, Math.round(input.calculator.dailyTxCount * (1 + volumeShock / 100))),
    avgBasketRials: Math.max(0, Math.round(input.calculator.avgBasketRials * (1 + basketShock / 100))),
    retentionDays: clampNumber(input.calculator.retentionDays + input.retentionDeltaDays, 0, 60),
    cccDays: Math.round(clampNumber(input.calculator.cccDays + input.cccDeltaDays, -30, 180)),
  };
  const rawStressed = runCalculator(stressedInput);
  const stressedSupportCost = rawStressed.operatingSupportCost * (1 + supportShock / 100);
  const stressed: CalculatorResult = {
    ...rawStressed,
    operatingSupportCost: stressedSupportCost,
    netBankMargin: rawStressed.netBankMargin - (stressedSupportCost - rawStressed.operatingSupportCost),
    roiPercent: stressedSupportCost > 0
      ? ((rawStressed.netBankMargin - (stressedSupportCost - rawStressed.operatingSupportCost)) / stressedSupportCost) * 100
      : 0,
  };
  const marginDelta = stressed.netBankMargin - base.netBankMargin;
  const marginPct = base.netBankMargin === 0 ? (marginDelta === 0 ? 0 : 100) : (marginDelta / Math.abs(base.netBankMargin)) * 100;
  const volumePct = base.monthlyTxVolume === 0 ? 0 : ((stressed.monthlyTxVolume - base.monthlyTxVolume) / base.monthlyTxVolume) * 100;
  const impact = clampNumber(Math.abs(marginPct), 0, 100);
  const resilienceScore = round1(clampScore(100 - impact * 0.65 - Math.abs(input.cccDeltaDays) * 0.45 - Math.max(0, supportShock) * 0.25));
  const drivers: string[] = [];
  if (volumeShock !== 0) drivers.push(`شوک گردش ${volumeShock > 0 ? "+" : ""}${round1(volumeShock)}٪`);
  if (basketShock !== 0) drivers.push(`شوک سبد ${basketShock > 0 ? "+" : ""}${round1(basketShock)}٪`);
  if (input.retentionDeltaDays !== 0) drivers.push(`تغییر رسوب ${input.retentionDeltaDays > 0 ? "+" : ""}${round1(input.retentionDeltaDays)} روز`);
  if (input.cccDeltaDays !== 0) drivers.push(`تغییر CCC ${input.cccDeltaDays > 0 ? "+" : ""}${Math.round(input.cccDeltaDays)} روز`);
  if (supportShock !== 0) drivers.push(`شوک هزینه پشتیبانی ${supportShock > 0 ? "+" : ""}${round1(supportShock)}٪`);
  return {
    base,
    stressed,
    delta: {
      marginRials: marginDelta,
      marginPct: round1(marginPct),
      creditLimitRials: stressed.bestCreditLimit - base.bestCreditLimit,
      volumePct: round1(volumePct),
    },
    resilienceScore,
    drivers: drivers.length ? drivers : ["بدون شوک؛ سناریوی پایه"],
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** رتبه بازاریابی بر اساس امتیاز سرنخ */
export function marketingTier(score: number): "S" | "A" | "B" | "C" {
  if (score >= 80) return "S";
  if (score >= 65) return "A";
  if (score >= 45) return "B";
  return "C";
}
