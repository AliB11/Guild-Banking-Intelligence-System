import { withBasePath } from "@/lib/utils";
import { getDemoCorpus } from "../demo-data";
import { assembleCatalog } from "./catalog";
import type { IntelligenceCatalog } from "./types";

function looksLikeCatalog(value: unknown): value is IntelligenceCatalog {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.schemaVersion === 1 && Array.isArray(record.sources) && Array.isArray(record.lineage);
}

/**
 * Load the committed intelligence catalog (written by the monthly GitHub
 * Action). If the static JSON is missing — first paint, stale host, blocked
 * fetch — assemble the same shape from the in-memory corpus so the sources
 * page never goes blank.
 */
export async function loadCatalogClient(): Promise<IntelligenceCatalog> {
  try {
    const response = await fetch(withBasePath("/data/intelligence-catalog.json"), { cache: "no-store" });
    if (response.ok) {
      const payload: unknown = await response.json();
      if (looksLikeCatalog(payload)) return payload;
    }
  } catch {
    // Fall through to the in-memory assembly.
  }
  return assembleCatalog({ corpus: getDemoCorpus(), probes: new Map() });
}
