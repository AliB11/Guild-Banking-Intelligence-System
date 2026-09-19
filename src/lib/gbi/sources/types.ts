/** Provenance, publication calendar and monthly intelligence catalog. */

export type SourceKind = "official" | "internal" | "model" | "sample" | "mirror";
export type SourceCadence = "monthly" | "annual" | "on-change" | "continuous";
export type ProbeStatus = "ok" | "changed" | "unreachable" | "skipped" | "not-probed";
export type PublicationState = "waiting" | "due" | "overdue" | "current";
export type NumberOrigin = "sample" | "official" | "model" | "internal";

export interface SourceUrls {
  primary: string;
  mirrors?: string[];
}

export interface SourceDefinition {
  id: string;
  name: string;
  owner: string;
  kind: SourceKind;
  cadence: SourceCadence;
  /** Days after Jalali month-end when a monthly artifact is typically public. */
  lagDaysAfterMonthEnd: number;
  /** Jalali month (1-12) when an annual table is typically refreshed. */
  annualMonth?: number;
  urls: SourceUrls;
  fields: string[];
  usedFor: string[];
  screens: string[];
  licenseNote: string;
  howWeUse: string;
  limitation: string;
}

export interface ProbeResult {
  url: string;
  at: string;
  status: ProbeStatus;
  httpStatus: number | null;
  contentType: string | null;
  etag: string | null;
  lastModified: string | null;
  hash: string | null;
  title: string | null;
  bytes: number | null;
  signals: string[];
  error: string | null;
}

export interface SourceSnapshot extends SourceDefinition {
  expectedPeriod: string;
  expectedPeriodLabel: string;
  publicationState: PublicationState;
  lastProbe: ProbeResult | null;
  previousHash: string | null;
  pendingHumanReview: boolean;
  reviewReason: string | null;
}

export interface PublicationWindow {
  sourceId: string;
  name: string;
  cadence: SourceCadence;
  expectedPeriod: string;
  expectedPeriodLabel: string;
  state: PublicationState;
  lagDays: number;
  note: string;
}

export interface TaxonomyRow {
  id: string;
  title: string;
  categoryName: string;
  isicCode: string;
  intaCode: string;
  intaProfitRatio: number;
  defaultMcc: string;
  sourceIds: string[];
}

export interface LineageRow {
  field: string;
  label: string;
  screens: string[];
  origin: NumberOrigin;
  sourceIds: string[];
  note: string;
}

export interface BriefingHighlight {
  title: string;
  detail: string;
  tone: "gold" | "persian" | "rose" | "slate";
}

export interface BriefingMover {
  id: string;
  title: string;
  volume: number;
  growthPct: number;
  quadrant: string;
  profitabilityLabel: string;
}

export interface MonthlyBriefing {
  period: string;
  periodLabel: string;
  headline: string;
  narrative: string[];
  highlights: BriefingHighlight[];
  movers: BriefingMover[];
  watchouts: string[];
  comparedToPreviousBriefing: string | null;
}

export interface ChangelogEntry {
  at: string;
  jalali: string;
  kind: "period-roll" | "source-change" | "policy" | "probe" | "review";
  title: string;
  detail: string;
}

export interface CatalogAlert {
  code: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
}

export interface PolicySnapshot {
  modelVersion: string;
  lendingRate: number;
  reserveRatio: number;
  facilitySpread: number;
  smallTransactionFeeRials: number;
  smallTransactionThresholdRials: number;
  transactionFeeRate: number;
  transactionFeeCapRials: number;
  terminalMonthlyCostRials: number;
}

export interface IntelligenceCatalog {
  schemaVersion: 1;
  modelVersion: string;
  generatedAt: string;
  jalaliGenerated: string;
  contentFingerprint: string;
  reporting: {
    latestPeriod: string;
    latestPeriodLabel: string;
    prevPeriod: string;
    window: string[];
  };
  policy: PolicySnapshot;
  publication: {
    asOfPeriod: string;
    nextWatchIso: string;
    windows: PublicationWindow[];
  };
  sources: SourceSnapshot[];
  taxonomy: TaxonomyRow[];
  lineage: LineageRow[];
  briefing: MonthlyBriefing;
  changelog: ChangelogEntry[];
  alerts: CatalogAlert[];
}

export const ORIGIN_LABELS: Record<NumberOrigin, { label: string; hint: string }> = {
  sample: {
    label: "داده نمونه",
    hint: "رقم نمایشی درون‌برنامه‌ای است؛ آمار رسمی شبکه پرداخت نیست.",
  },
  official: {
    label: "منبع رسمی",
    hint: "از سند یا گزارش نهاد ناظر خوانده یا با آن تطبیق داده می‌شود.",
  },
  model: {
    label: "فرض مدل",
    hint: "سیاست محاسباتی GBI؛ در محیط بانک باید با بخشنامه جاری جایگزین شود.",
  },
  internal: {
    label: "داده داخلی بانک",
    hint: "از پایش پایانه، حساب جاری و قیف شعب بانک می‌آید.",
  },
};

export const KIND_LABELS: Record<SourceKind, string> = {
  official: "رسمی",
  internal: "داخلی بانک",
  model: "مدل تصمیم‌یار",
  sample: "نمونه نمایشی",
  mirror: "آینه کشف انتشار",
};

export const CADENCE_LABELS: Record<SourceCadence, string> = {
  monthly: "ماهانه",
  annual: "سالانه",
  "on-change": "پس از ابلاغ",
  continuous: "پیوسته",
};

export const PUBLICATION_STATE_LABELS: Record<PublicationState, string> = {
  waiting: "در انتظار انتشار",
  due: "موعد واکشی",
  overdue: "تأخیر در مشاهده منبع",
  current: "پوشش به‌روز",
};
