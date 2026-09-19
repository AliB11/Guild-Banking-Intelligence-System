import type { PipelineStage, RecommendedProduct, RiskStatus } from "@/db/schema";

export type NextActionCode =
  | "CALL_TODAY"
  | "CONNECT_TAX_SYSTEM"
  | "CREDIT_COMMITTEE"
  | "COLLECT_DOCUMENTS"
  | "SEND_PRODUCT_OFFER"
  | "FOLLOW_UP"
  | "ONBOARDING_CHECK"
  | "REACTIVATE_OR_ARCHIVE";

export type ActionUrgency = "critical" | "high" | "normal" | "low";

export interface NextBestAction {
  code: NextActionCode;
  label: string;
  reason: string;
  urgency: ActionUrgency;
  dueHours: number;
}

const PRODUCT_SHORT_LABELS: Record<RecommendedProduct, string> = {
  POS_EXPANSION: "توسعه پایانه",
  WORKING_CAPITAL_LOAN: "طرح پوز",
  LC_DOMESTIC: "اعتبار اسنادی ریالی",
  SCF_GAM: "گام و زنجیره تأمین",
  BILL_DISCOUNTING: "تنزیل اسناد",
};

/**
 * Explainable operational policy for the branch team. This is intentionally
 * rule based: every recommendation has a visible reason and can later be
 * replaced by a governed model without changing the LeadDTO contract.
 */
export function recommendNextAction(input: {
  stage: PipelineStage;
  score: number;
  product: RecommendedProduct;
  isTaxCompliant: boolean;
  riskStatus: RiskStatus;
  staleDays: number;
}): NextBestAction {
  if (input.stage === "CONVERTED") {
    return {
      code: "ONBOARDING_CHECK",
      label: "کنترل فعال‌سازی و رسوب",
      reason: "سرنخ تبدیل شده است؛ فعال‌سازی محصول و تحقق رسوب وعده‌داده‌شده کنترل شود.",
      urgency: "normal",
      dueHours: 72,
    };
  }

  if (input.stage === "LOST") {
    return {
      code: "REACTIVATE_OR_ARCHIVE",
      label: "بازفعال‌سازی یا بایگانی",
      reason: "سرنخ ازدست‌رفته است؛ فقط در صورت وجود سیگنال جدید دوباره فعال شود.",
      urgency: "low",
      dueHours: 168,
    };
  }

  if (input.riskStatus === "HIGH") {
    return {
      code: "CREDIT_COMMITTEE",
      label: "ارجاع به کمیته اعتباری",
      reason: "ریسک بالا اجازه پیشنهاد خودکار نمی‌دهد و بررسی انسانی الزامی است.",
      urgency: "critical",
      dueHours: 24,
    };
  }

  if (!input.isTaxCompliant) {
    return {
      code: "CONNECT_TAX_SYSTEM",
      label: "اتصال به سامانه مؤدیان",
      reason: "پیش از اعتباردهی، شفافیت مالیاتی و اتصال پایانه باید تکمیل شود.",
      urgency: "high",
      dueHours: 24,
    };
  }

  if (input.staleDays >= 14) {
    return {
      code: "FOLLOW_UP",
      label: "پیگیری فوری سرنخ",
      reason: `آخرین تعامل ${input.staleDays} روز قبل بوده و از SLA پیگیری عبور کرده است.`,
      urgency: "high",
      dueHours: 4,
    };
  }

  if (input.stage === "NEW") {
    return {
      code: "CALL_TODAY",
      label: "تماس اولویت‌دار امروز",
      reason: `امتیاز ${Math.round(input.score)} است؛ تناسب اولیه برای ${PRODUCT_SHORT_LABELS[input.product]} بررسی شود.`,
      urgency: input.score >= 75 ? "high" : "normal",
      dueHours: input.score >= 75 ? 4 : 24,
    };
  }

  if (input.stage === "CONTACTED") {
    return {
      code: "SEND_PRODUCT_OFFER",
      label: "ارسال پیشنهاد محصول",
      reason: `تماس اولیه انجام شده؛ پیشنهاد ${PRODUCT_SHORT_LABELS[input.product]} با یک CTA مشخص ارسال شود.`,
      urgency: "normal",
      dueHours: 48,
    };
  }

  return {
    code: "COLLECT_DOCUMENTS",
    label: "تکمیل مدارک اعتباری",
    reason: "سرنخ در ارزیابی مالی است؛ مدارک و داده‌های اعتبارسنجی جمع‌آوری شود.",
    urgency: "normal",
    dueHours: 48,
  };
}

export function actionNeedsAttention(action: NextBestAction): boolean {
  return action.urgency === "critical" || action.urgency === "high";
}
