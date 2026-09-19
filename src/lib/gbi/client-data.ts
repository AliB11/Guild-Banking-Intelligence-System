/**
 * Client-side data layer — the heart of the database-less (static) profile.
 *
 * The app ships a published-market corpus (see `demo-data.ts` / `published-market.ts`) and runs
 * the exact same pure computation functions as the server (`compute.ts`,
 * `engine.ts`). Lead pipeline moves are persisted in localStorage so the
 * kanban survives reloads in the browser; nothing leaves the device.
 *
 * This module must stay isomorphic-safe (guard `window`) and must NOT import
 * values from `@/db` (no drizzle/pg in the browser bundle).
 */
import type { MarketingLeadRow, PipelineStage } from "@/db/schema";
import { getDemoCorpus } from "./demo-data";
import { calculatorInputSchema, runCalculator, type CalculatorInput, type CalculatorResult } from "./engine";
import {
  getDashboardFromCorpus,
  getGuildCompareFromCorpus,
  getGuildsOverviewFromCorpus,
  getLeadsFromCorpus,
  type Corpus,
} from "./compute";
import { STAGE_ORDER } from "./types";
import type {
  DashboardSummary,
  GuildCompareResult,
  GuildsOverview,
  LeadsResponse,
} from "./types";

const OVERRIDE_KEY = "gbi.lead-stage-overrides.v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAGE_VALUES: ReadonlySet<string> = new Set(STAGE_ORDER);

interface LeadOverride {
  stage: PipelineStage;
  lastInteractionIso: string;
}

type LeadOverrides = Record<string, LeadOverride>;

function readOverrides(): LeadOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const clean: LeadOverrides = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      const entry = value as { stage?: unknown; lastInteractionIso?: unknown } | null;
      if (
        entry &&
        typeof entry.stage === "string" &&
        STAGE_VALUES.has(entry.stage) &&
        typeof entry.lastInteractionIso === "string" &&
        !Number.isNaN(Date.parse(entry.lastInteractionIso))
      ) {
        clean[id] = { stage: entry.stage as PipelineStage, lastInteractionIso: entry.lastInteractionIso };
      }
    }
    return clean;
  } catch {
    return {};
  }
}

function writeOverrides(overrides: LeadOverrides): void {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(overrides).length === 0) {
      window.localStorage.removeItem(OVERRIDE_KEY);
    } else {
      window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
    }
  } catch {
    // Private mode / quota errors: the in-memory copy still works for the session.
  }
}

/**
 * Published corpus with the user's local pipeline moves applied. Reading through
 * this helper guarantees dashboard warnings/SLA and the kanban always agree.
 */
function activeCorpus(): Corpus {
  const base = getDemoCorpus();
  const overrides = readOverrides();
  if (Object.keys(overrides).length === 0) return base;
  const leads = base.leads.map((lead) => {
    const override = overrides[lead.id];
    if (!override) return lead;
    return {
      ...lead,
      pipelineStage: override.stage,
      lastInteractionDate: new Date(override.lastInteractionIso),
    };
  });
  return { ...base, leads };
}

/* ------------------------------------------------------------------ */
/* Read APIs (same DTO shapes as the JSON API)                         */
/* ------------------------------------------------------------------ */

export async function getDashboardSummaryClient(): Promise<DashboardSummary> {
  return getDashboardFromCorpus(activeCorpus());
}

export async function getGuildsOverviewClient(): Promise<GuildsOverview> {
  return getGuildsOverviewFromCorpus(activeCorpus());
}

export async function getGuildCompareClient(aId: string, bId: string): Promise<GuildCompareResult | null> {
  return getGuildCompareFromCorpus(activeCorpus(), aId, bId);
}

export async function getLeadsClient(): Promise<LeadsResponse> {
  return getLeadsFromCorpus(activeCorpus());
}

/* ------------------------------------------------------------------ */
/* Mutations (persisted in localStorage)                               */
/* ------------------------------------------------------------------ */

export function updateLeadStageClient(id: string, stage: PipelineStage): MarketingLeadRow {
  if (!UUID_RE.test(id)) {
    throw new Error("شناسه سرنخ نامعتبر است");
  }
  if (!STAGE_VALUES.has(stage)) {
    throw new Error("مرحله قیف بازاریابی نامعتبر است");
  }

  const overrides = readOverrides();
  const lead = getDemoCorpus().leads.find((candidate) => candidate.id === id);
  if (!lead) {
    throw new Error("سرنخ یافت نشد");
  }

  const updated: MarketingLeadRow = {
    ...lead,
    pipelineStage: stage,
    lastInteractionDate: new Date(),
  };
  overrides[id] = { stage, lastInteractionIso: updated.lastInteractionDate.toISOString() };
  writeOverrides(overrides);
  return updated;
}

export function resetLeadStageOverrides(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    // Ignore storage failures; nothing else to reset.
  }
}

/* ------------------------------------------------------------------ */
/* Calculator (pure engine, validated like the JSON API)               */
/* ------------------------------------------------------------------ */

export function runCalculatorClient(input: CalculatorInput): CalculatorResult {
  const parsed = calculatorInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("ورودی‌های محاسبه‌گر نامعتبر است");
  }
  return runCalculator(parsed.data);
}
