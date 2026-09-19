import {
  CBI_POS_FEE_CAP_RIALS,
  CBI_POS_FEE_RATE,
  CBI_POS_FEE_SMALL_TX_RIALS,
  CBI_POS_FEE_SMALL_TX_THRESHOLD_RIALS,
  FACILITY_SPREAD,
  LENDING_RATE,
  MODEL_VERSION,
  RESERVE_RATIO,
  TERMINAL_MONTHLY_COST_RIALS,
} from "../engine";
import { formatJalaliDate, jalaliPeriodLabel } from "../format";
import type { Corpus } from "../compute";
import { getGuildAtlas, GUILD_CATEGORY_LABEL } from "../market-view";
import { buildMonthlyBriefing } from "./briefing";
import { coverageForSource, nextWatchDate } from "./calendar";
import { FIELD_LINEAGE, SOURCE_REGISTRY } from "./registry";
import type {
  CatalogAlert,
  ChangelogEntry,
  IntelligenceCatalog,
  ProbeResult,
  SourceSnapshot,
  TaxonomyRow,
} from "./types";

const SCHEMA_VERSION = 1 as const;

function fingerprintPayload(
  catalog: Omit<IntelligenceCatalog, "contentFingerprint" | "generatedAt" | "jalaliGenerated">,
): string {
  const sourceKey = catalog.sources
    .map((source) => `${source.id}:${source.lastProbe?.hash ?? source.lastProbe?.status ?? ""}:${source.publicationState}`)
    .join("|");
  return [
    catalog.modelVersion,
    catalog.reporting.latestPeriod,
    catalog.policy.lendingRate,
    catalog.policy.transactionFeeRate,
    sourceKey,
    catalog.briefing.headline,
  ].join("::");
}

function taxonomyFromAtlas(): TaxonomyRow[] {
  return getGuildAtlas().map((row, index) => ({
    id: `guild-${index + 1}`,
    title: row.title,
    categoryName: GUILD_CATEGORY_LABEL[row.category],
    isicCode: row.isicCode,
    intaCode: row.intaCode,
    intaProfitRatio: row.intaProfitRatio,
    defaultMcc: row.defaultMcc,
    sourceIds: ["isic-amar", "inta-coefficients", "shaparak-mcc", "chamber-guilds"],
  }));
}

function policySnapshot() {
  return {
    modelVersion: MODEL_VERSION,
    lendingRate: LENDING_RATE,
    reserveRatio: RESERVE_RATIO,
    facilitySpread: FACILITY_SPREAD,
    smallTransactionFeeRials: CBI_POS_FEE_SMALL_TX_RIALS,
    smallTransactionThresholdRials: CBI_POS_FEE_SMALL_TX_THRESHOLD_RIALS,
    transactionFeeRate: CBI_POS_FEE_RATE,
    transactionFeeCapRials: CBI_POS_FEE_CAP_RIALS,
    terminalMonthlyCostRials: TERMINAL_MONTHLY_COST_RIALS,
  };
}

function buildAlerts(sources: SourceSnapshot[], periodRolled: boolean): CatalogAlert[] {
  const alerts: CatalogAlert[] = [];
  const unreachableOfficial = sources.filter(
    (source) => source.kind === "official" && source.lastProbe?.status === "unreachable",
  );
  if (unreachableOfficial.length >= 3) {
    alerts.push({
      code: "OFFICIAL_SOURCES_UNREACHABLE",
      severity: "warning",
      title: "چند منبع رسمی از این محیط در دسترس نیستند",
      detail: `${unreachableOfficial.map((source) => source.name).join("، ")}. رانرهای GitHub معمولاً بیرون ایران هستند؛ این به معنی نبود گزارش نیست.`,
    });
  }
  const reviews = sources.filter((source) => source.pendingHumanReview);
  for (const source of reviews) {
    alerts.push({
      code: `REVIEW_${source.id}`,
      severity: "warning",
      title: `بازبینی انسانی: ${source.name}`,
      detail: source.reviewReason ?? "اثرانگشت صفحه نسبت به اجرای قبل عوض شده است.",
    });
  }
  if (periodRolled) {
    alerts.push({
      code: "PERIOD_ROLLED",
      severity: "info",
      title: "پنجره گزارش جلالی یک ماه جلو آمد",
      detail: "ماهنامه هوش اصناف با دوره جاری بازتولید شد.",
    });
  }
  const due = sources.filter((source) => source.publicationState === "due" || source.publicationState === "overdue");
  if (due.length) {
    alerts.push({
      code: "PUBLICATION_WINDOW_OPEN",
      severity: "info",
      title: "پنجره واکشی ماهانه باز است",
      detail: due.map((source) => `${source.name} (${source.expectedPeriodLabel})`).join("؛ "),
    });
  }
  return alerts;
}

function buildChangelog(input: {
  now: Date;
  previous: IntelligenceCatalog | null;
  periodRolled: boolean;
  sources: SourceSnapshot[];
  policyChanged: boolean;
}): ChangelogEntry[] {
  const jalali = formatJalaliDate(input.now);
  const at = input.now.toISOString();
  const fresh: ChangelogEntry[] = [];
  if (input.periodRolled) {
    fresh.push({
      at,
      jalali,
      kind: "period-roll",
      title: "چرخش دوره گزارش",
      detail: "پنجره شش‌ماهه جلالی با ماه جاری هم‌تراز شد و ماهنامه بازتولید گردید.",
    });
  }
  if (input.policyChanged) {
    fresh.push({
      at,
      jalali,
      kind: "policy",
      title: "تغییر فرض‌های مدل",
      detail: `نسخه مدل ${MODEL_VERSION} با نرخ/کارمزد جدید در کاتالوگ ثبت شد.`,
    });
  }
  for (const source of input.sources) {
    if (source.lastProbe?.status === "changed" || source.pendingHumanReview) {
      fresh.push({
        at,
        jalali,
        kind: source.pendingHumanReview ? "review" : "source-change",
        title: source.name,
        detail: source.reviewReason ?? `وضعیت واکشی: ${source.lastProbe?.status ?? "نامشخص"}`,
      });
    }
  }
  if (fresh.length === 0) {
    fresh.push({
      at,
      jalali,
      kind: "probe",
      title: "واکشی دوره‌ای منابع",
      detail: "پنجره گزارش و اثرانگشت منابع با اجرای جاب همگام شد.",
    });
  }
  const previous = input.previous?.changelog ?? [];
  return [...fresh, ...previous].slice(0, 12);
}

export function assembleCatalog(input: {
  now?: Date;
  corpus: Corpus;
  probes: Map<string, ProbeResult>;
  previous?: IntelligenceCatalog | null;
}): IntelligenceCatalog {
  const now = input.now ?? new Date();
  const previous = input.previous ?? null;
  const policy = policySnapshot();
  const sources: SourceSnapshot[] = SOURCE_REGISTRY.map((definition) => {
    const coverage = coverageForSource(definition, now);
    const probe = input.probes.get(definition.id) ?? previous?.sources.find((row) => row.id === definition.id)?.lastProbe ?? null;
    const previousHash =
      previous?.sources.find((row) => row.id === definition.id)?.lastProbe?.hash ?? null;
    const changed = Boolean(probe?.hash && previousHash && probe.hash !== previousHash);
    const pendingHumanReview = changed && (definition.kind === "official" || definition.kind === "mirror");
    return {
      ...definition,
      expectedPeriod: coverage.expectedPeriod,
      expectedPeriodLabel: coverage.expectedPeriodLabel,
      publicationState: coverage.state,
      lastProbe: probe,
      previousHash,
      pendingHumanReview,
      reviewReason: pendingHumanReview
        ? `اثرانگشت صفحه از ${previousHash} به ${probe?.hash} تغییر کرده است. ارقام مدل خودکار عوض نشد؛ بازبینی کنید.`
        : null,
    };
  });

  const periodRolled = Boolean(previous && previous.reporting.latestPeriod !== input.corpus.latestPeriod);
  const policyChanged = Boolean(previous && previous.policy.modelVersion !== policy.modelVersion);
  const briefing = buildMonthlyBriefing(input.corpus, previous?.briefing ?? null);

  const draft: Omit<IntelligenceCatalog, "contentFingerprint" | "generatedAt" | "jalaliGenerated"> = {
    schemaVersion: SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    reporting: {
      latestPeriod: input.corpus.latestPeriod,
      latestPeriodLabel: jalaliPeriodLabel(input.corpus.latestPeriod),
      prevPeriod: input.corpus.prevPeriod,
      window: input.corpus.periods,
    },
    policy,
    publication: {
      asOfPeriod: input.corpus.latestPeriod,
      nextWatchIso: nextWatchDate(now).toISOString(),
      windows: sources.map((source) => ({
        sourceId: source.id,
        name: source.name,
        cadence: source.cadence,
        expectedPeriod: source.expectedPeriod,
        expectedPeriodLabel: source.expectedPeriodLabel,
        state: source.publicationState,
        lagDays: source.lagDaysAfterMonthEnd,
        note: coverageForSource(source, now).note,
      })),
    },
    sources,
    taxonomy: taxonomyFromAtlas(),
    lineage: FIELD_LINEAGE,
    briefing,
    changelog: buildChangelog({ now, previous, periodRolled, sources, policyChanged }),
    alerts: buildAlerts(sources, periodRolled),
  };

  const generatedAt = now.toISOString();
  const jalaliGenerated = formatJalaliDate(now);
  return {
    ...draft,
    generatedAt,
    jalaliGenerated,
    contentFingerprint: fingerprintPayload(draft),
  };
}

export function skippedProbe(url: string, reason: string): ProbeResult {
  return {
    url,
    at: new Date().toISOString(),
    status: "skipped",
    httpStatus: null,
    contentType: null,
    etag: null,
    lastModified: null,
    hash: null,
    title: null,
    bytes: null,
    signals: [],
    error: reason,
  };
}
