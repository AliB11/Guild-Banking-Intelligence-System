import type {
  MerchantBusinessRow,
  PipelineStage,
  RecommendedProduct,
  RiskStatus,
} from "@/db/schema";
import type { NextBestAction } from "./operations";

/* Shared DTOs between server services, API routes and client UI */

export interface BranchOpportunity {
  branchCode: string;
  province: string;
  city: string;
  merchantCount: number;
  terminals: number;
  volume: number;
  float: number;
  leadCount: number;
  taxCompliancePct: number;
  opportunityScore: number;
  recommendation: string;
  signal: "EXPAND_POS" | "CREDIT_CAMPAIGN" | "TAX_CLEANUP" | "MONITOR";
}

export type AlertSeverity = "critical" | "warning" | "info";

export interface EarlyWarning {
  code: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  value?: number;
}

export interface DataQualityCheck {
  code: string;
  label: string;
  status: "PASS" | "WARN" | "FAIL";
  count: number;
  detail: string;
}

export interface DataQualitySummary {
  score: number;
  checks: DataQualityCheck[];
}

export interface DashboardSummary {
  latestPeriod: string;
  latestPeriodLabel: string;
  prevPeriod: string;
  totals: {
    merchantCount: number;
    activeTerminals: number;
    totalTxCount: number;
    totalTxVolume: number;
    totalFloat: number;
    monthlyFloatYield: number;
    totalFees: number;
    totalSupportCost: number;
    netMargin: number;
    avgBasket: number;
    volumeDeltaPct: number;
    floatDeltaPct: number;
  };
  trend: Array<{
    period: string;
    label: string;
    short: string;
    volume: number;
    float: number;
    fees: number;
  }>;
  categoryProfit: Array<{
    categoryId: string;
    name: string;
    merchants: number;
    terminals: number;
    volume: number;
    float: number;
    fees: number;
    margin: number;
    sharePct: number;
  }>;
  provinces: Array<{
    province: string;
    merchants: number;
    terminals: number;
    volume: number;
    float: number;
    intensity: number; // 0..1
  }>;
  branchOpportunities: BranchOpportunity[];
  alerts: EarlyWarning[];
  dataQuality: DataQualitySummary;
  topSubGuilds: Array<{
    id: string;
    title: string;
    categoryName: string;
    merchants: number;
    volume: number;
    float: number;
  }>;
  topMerchants: Array<{
    id: string;
    businessName: string;
    ownerName: string;
    subGuildTitle: string;
    province: string;
    branchCode: string;
    volume: number;
    float: number;
    margin: number;
    score: number;
    isTaxCompliant: boolean;
  }>;
}

export interface SubGuildSummary {
  id: string;
  title: string;
  isicCode: string;
  intaCode: string;
  intaProfitRatio: number;
  defaultMcc: string;
  avgGrossMargin: number;
  cccDays: number;
  categoryId: string;
  categoryName: string;
  merchantCount: number;
  volume: number;
  float: number;
  fees: number;
  terminals: number;
  avgScore: number;
  /** میانگین سبد خرید هر واحد (ریال) */
  avgBasket: number;
  /** میانگین تراکنش روزانه هر واحد */
  avgDailyTx: number;
  tier: "S" | "A" | "B" | "C";
}

export interface GuildsOverview {
  categories: Array<{
    id: string;
    name: string;
    isicCodePrefix: string;
    description: string | null;
    subGuildCount: number;
    merchantCount: number;
    volume: number;
    float: number;
  }>;
  subGuilds: SubGuildSummary[];
  latestPeriod: string;
}

export interface GuildCompareAxis {
  axis: string;
  a: number;
  b: number;
}

export interface GuildCompareResult {
  a: SubGuildSummary;
  b: SubGuildSummary;
  axes: GuildCompareAxis[];
}

export interface LeadDTO {
  id: string;
  merchantId: string;
  branchCode: string;
  recommendedProduct: RecommendedProduct;
  leadScore: number;
  pipelineStage: PipelineStage;
  lastInteractionDate: string;
  staleDays: number;
  nextAction: NextBestAction;
  merchant: Pick<
    MerchantBusinessRow,
    | "businessName"
    | "ownerName"
    | "province"
    | "city"
    | "isTaxCompliant"
    | "riskStatus"
  > & {
    subGuildTitle: string;
    categoryName: string;
  };
}

export interface LeadsResponse {
  leads: LeadDTO[];
  stats: {
    total: number;
    byStage: Record<PipelineStage, number>;
    avgScore: number;
    hotCount: number;
    actionRequiredCount: number;
  };
}

export const PRODUCT_LABELS: Record<RecommendedProduct, string> = {
  POS_EXPANSION: "توسعه پایانه کارتخوان",
  WORKING_CAPITAL_LOAN: "سرمایه در گردش (طرح پوز)",
  LC_DOMESTIC: "اعتبار اسنادی ریالی",
  SCF_GAM: "زنجیره تأمین (گام)",
  BILL_DISCOUNTING: "تنزیل اسناد / اوراق",
};

export const STAGE_LABELS: Record<PipelineStage, string> = {
  NEW: "سرنخ جدید",
  CONTACTED: "تماس گرفته‌شده",
  FINANCIAL_EVALUATION: "ارزیابی اعتباری",
  CONVERTED: "تبدیل‌شده",
  LOST: "ازدست‌رفته",
};

export const RISK_LABELS: Record<RiskStatus, string> = {
  LOW: "کم‌ریسک",
  MEDIUM: "ریسک متوسط",
  HIGH: "پرریسک",
};

export const STAGE_ORDER: PipelineStage[] = [
  "NEW",
  "CONTACTED",
  "FINANCIAL_EVALUATION",
  "CONVERTED",
  "LOST",
];
