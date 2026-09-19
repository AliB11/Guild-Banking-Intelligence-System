/**
 * Server-side data service.
 *
 * All computation lives in `compute.ts` (pure, browser-safe). This module is
 * the Node.js/PostgreSQL facade used by the optional full-stack profile
 * (`src/server/server.ts`). Without `DATABASE_URL` it transparently falls back
 * to the in-memory demo corpus, so the API stays available in dev and in
 * database-less containers.
 */
import { allowDemoMode, db, hasDatabaseConfig } from "@/db";
import {
  decisionAuditEvents,
  guildCategories,
  marketingLeads,
  merchantBusinesses,
  outboxEvents,
  subGuilds,
  terminalMetrics,
  type GuildCategoryRow,
  type MarketingLeadRow,
  type MerchantBusinessRow,
  type PipelineStage,
  type SubGuildRow,
  type TerminalMetricRow,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { MODEL_VERSION } from "./engine";
import { getDemoCorpus } from "./demo-data";
import {
  comparePeriods,
  getDashboardFromCorpus,
  getGuildCompareFromCorpus,
  getGuildsOverviewFromCorpus,
  getLeadsFromCorpus,
  type Corpus,
} from "./compute";
import type {
  DashboardSummary,
  GuildCompareResult,
  GuildsOverview,
  LeadsResponse,
} from "./types";

const CORPUS_CACHE_TTL_MS = 30_000;

let corpusCache: { value: Corpus; expiresAt: number } | null = null;
let corpusPromise: Promise<Corpus> | null = null;

/**
 * Dashboard and guild screens all need the same read model. A short process
 * cache prevents five full-table reads per navigation while keeping newly
 * imported operational data fresh. Lead mutations explicitly invalidate it.
 */
async function loadCorpus(): Promise<Corpus> {
  if (!hasDatabaseConfig) {
    if (allowDemoMode) return getDemoCorpus();
    throw new Error("DATABASE_URL is required when ALLOW_DEMO_MODE=false");
  }

  const now = Date.now();
  if (corpusCache && corpusCache.expiresAt > now) return corpusCache.value;
  if (corpusPromise) return corpusPromise;

  corpusPromise = Promise.all([
    db.select().from(guildCategories),
    db.select().from(subGuilds),
    db.select().from(merchantBusinesses),
    db.select().from(terminalMetrics),
    db.select().from(marketingLeads).orderBy(desc(marketingLeads.leadScore)),
  ])
    .then(([categories, subs, merchants, metrics, leads]) => {
      const periods = Array.from(new Set(metrics.map((m) => m.reportingPeriod))).sort(comparePeriods);
      const latestPeriod = periods.at(-1) ?? "";
      const prevPeriod = periods.at(-2) ?? latestPeriod;
      const value: Corpus = { categories, subs, merchants, metrics, leads, periods, latestPeriod, prevPeriod };
      corpusCache = { value, expiresAt: Date.now() + CORPUS_CACHE_TTL_MS };
      return value;
    })
    .finally(() => {
      corpusPromise = null;
    });

  return corpusPromise;
}

function invalidateCorpusCache() {
  corpusCache = null;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return getDashboardFromCorpus(await loadCorpus());
}

export async function getGuildsOverview(): Promise<GuildsOverview> {
  return getGuildsOverviewFromCorpus(await loadCorpus());
}

export async function getGuildCompare(aId: string, bId: string): Promise<GuildCompareResult | null> {
  return getGuildCompareFromCorpus(await loadCorpus(), aId, bId);
}

export async function getLeads(): Promise<LeadsResponse> {
  return getLeadsFromCorpus(await loadCorpus());
}

export async function updateLeadStage(id: string, stage: PipelineStage): Promise<MarketingLeadRow | null> {
  if (!hasDatabaseConfig) {
    const lead = getDemoCorpus().leads.find((candidate) => candidate.id === id);
    if (!lead) return null;
    lead.pipelineStage = stage;
    lead.lastInteractionDate = new Date();
    return lead;
  }

  const updated = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(marketingLeads)
      .where(eq(marketingLeads.id, id));
    if (!current) return null;

    const interactionDate = new Date();
    const [next] = await tx
      .update(marketingLeads)
      .set({ pipelineStage: stage, lastInteractionDate: interactionDate })
      .where(eq(marketingLeads.id, id))
      .returning();

    if (current.pipelineStage !== stage) {
      const snapshot = {
        leadId: id,
        fromStage: current.pipelineStage,
        toStage: stage,
        interactionDate: interactionDate.toISOString(),
      };
      await tx.insert(decisionAuditEvents).values({
        entityType: "MARKETING_LEAD",
        entityId: id,
        action: "PIPELINE_STAGE_CHANGED",
        modelVersion: MODEL_VERSION,
        inputSnapshot: snapshot,
        explanation: `مرحله سرنخ از ${current.pipelineStage} به ${stage} تغییر کرد.`,
      });
      await tx.insert(outboxEvents).values({
        aggregateType: "MARKETING_LEAD",
        aggregateId: id,
        eventType: "MARKETING_LEAD_STAGE_CHANGED",
        payload: snapshot,
        occurredAt: interactionDate,
      });
    }
    return next ?? null;
  });
  invalidateCorpusCache();
  return updated;
}
