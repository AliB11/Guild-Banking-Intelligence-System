/**
 * Monthly intelligence refresh — probes official guild/payment sources after
 * their typical publication lag, rebuilds the catalog JSON, and exits 0 even
 * when Iranian sites are unreachable from GitHub-hosted runners.
 *
 *   npx tsx scripts/monthly-refresh.ts
 *   npx tsx scripts/monthly-refresh.ts --offline
 *   npx tsx scripts/monthly-refresh.ts --check
 *   npx tsx scripts/monthly-refresh.ts --force
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getDemoCorpus } from "../src/lib/gbi/demo-data";
import { assembleCatalog, skippedProbe } from "../src/lib/gbi/sources/catalog";
import { SOURCE_REGISTRY } from "../src/lib/gbi/sources/registry";
import type { IntelligenceCatalog, ProbeResult } from "../src/lib/gbi/sources/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = resolve(root, "public/data/intelligence-catalog.json");

const args = new Set(process.argv.slice(2));
const offline = args.has("--offline");
const checkOnly = args.has("--check");
const force = args.has("--force");

const USER_AGENT =
  "GBI-CatalogRefresh/1.6 (+https://github.com/AliB11/Guild-Banking-Intelligence-System)";
const TIMEOUT_MS = 12_000;
const MAX_BYTES = 512 * 1024;

const PUBLICATION_SIGNALS = [
  "گزارش اقتصادی",
  "شاپرک",
  "اینتاکد",
  "کارمزد",
  "اتاق اصناف",
  "بخشنامه",
];

function readPrevious(): IntelligenceCatalog | null {
  if (!existsSync(catalogPath)) return null;
  try {
    const parsed: unknown = JSON.parse(readFileSync(catalogPath, "utf8"));
    if (typeof parsed === "object" && parsed && (parsed as IntelligenceCatalog).schemaVersion === 1) {
      return parsed as IntelligenceCatalog;
    }
  } catch {
    return null;
  }
  return null;
}

function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 16);
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  if (!match) return null;
  return match[1].replace(/\s+/g, " ").trim() || null;
}

function detectSignals(text: string): string[] {
  return PUBLICATION_SIGNALS.filter((needle) => text.includes(needle));
}

async function probeUrl(url: string): Promise<ProbeResult> {
  if (url.startsWith("internal://")) {
    return skippedProbe(url, "منبع داخلی بانک است و از GitHub واکشی نمی‌شود.");
  }
  const started = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/pdf,application/json;q=0.9,*/*;q=0.8",
      },
    });
    const contentType = response.headers.get("content-type");
    const etag = response.headers.get("etag");
    const lastModified = response.headers.get("last-modified");
    const raw = Buffer.from(await response.arrayBuffer());
    const clipped = raw.subarray(0, MAX_BYTES);
    const asText = clipped.toString("utf8");
    const title = contentType && contentType.includes("html") ? extractTitle(asText) : null;
    return {
      url,
      at: started,
      status: response.ok ? "ok" : "unreachable",
      httpStatus: response.status,
      contentType,
      etag,
      lastModified,
      hash: hashBuffer(clipped),
      title,
      bytes: raw.length,
      signals: detectSignals(asText),
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      url,
      at: started,
      status: "unreachable",
      httpStatus: null,
      contentType: null,
      etag: null,
      lastModified: null,
      hash: null,
      title: null,
      bytes: null,
      signals: [],
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeSource(
  sourceId: string,
  primary: string,
  mirrors: string[] = [],
): Promise<ProbeResult> {
  const urls = [primary, ...mirrors];
  let last: ProbeResult | null = null;
  for (const url of urls) {
    const result = await probeUrl(url);
    last = result;
    if (result.status === "ok" || result.status === "skipped") return result;
  }
  return last ?? skippedProbe(primary, "no url");
}

function writeGithubOutput(changed: boolean, fingerprint: string): void {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  writeFileSync(output, `changed=${changed}\nfingerprint=${fingerprint}\n`, { flag: "a" });
}

async function main(): Promise<void> {
  const previous = readPrevious();
  const probes = new Map<string, ProbeResult>();

  if (offline) {
    for (const source of SOURCE_REGISTRY) {
      const reused = previous?.sources.find((row) => row.id === source.id)?.lastProbe;
      probes.set(
        source.id,
        reused ?? skippedProbe(source.urls.primary, "offline: probe skipped"),
      );
    }
    console.log("[catalog] offline mode — reusing previous probes");
  } else {
    for (const source of SOURCE_REGISTRY) {
      process.stdout.write(`[catalog] probing ${source.id} … `);
      const result = await probeSource(source.id, source.urls.primary, source.urls.mirrors);
      probes.set(source.id, result);
      console.log(`${result.status}${result.httpStatus ? ` ${result.httpStatus}` : ""}${result.hash ? ` ${result.hash}` : ""}`);
    }
  }

  const catalog = assembleCatalog({
    corpus: getDemoCorpus(),
    probes,
    previous,
  });

  if (checkOnly) {
    if (catalog.schemaVersion !== 1 || catalog.sources.length !== SOURCE_REGISTRY.length) {
      throw new Error("catalog self-check failed");
    }
    console.log(`[catalog] check ok — ${catalog.sources.length} sources, period ${catalog.reporting.latestPeriod}`);
    return;
  }

  const previousFingerprint = previous?.contentFingerprint;
  const changed = force || previousFingerprint !== catalog.contentFingerprint;

  mkdirSync(dirname(catalogPath), { recursive: true });
  if (changed || !previous) {
    writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    console.log(`[catalog] wrote ${catalogPath}`);
    console.log(`[catalog] fingerprint ${catalog.contentFingerprint} (was ${previousFingerprint ?? "none"})`);
  } else {
    console.log(`[catalog] no meaningful change (${catalog.contentFingerprint}); file left untouched`);
  }

  writeGithubOutput(changed || !previous, catalog.contentFingerprint);
}

main().catch((error) => {
  console.error("[catalog] FAIL", error);
  process.exit(1);
});
