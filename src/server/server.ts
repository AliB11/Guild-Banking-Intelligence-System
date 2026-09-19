/**
 * GBI Node server — optional full-stack profile.
 *
 * Serves the static export (`out/`) produced by `npm run build` and, in the
 * same process, the JSON API that the static web app never needs but that a
 * PostgreSQL-backed deployment uses:
 *
 *   DATABASE_URL set   → API reads/writes PostgreSQL (drizzle, audit + outbox)
 *   DATABASE_URL unset → API answers from the in-memory demo corpus
 *
 * No framework, no runtime dependencies beyond what the app already ships.
 * Run: npm start   (or: node --import tsx src/server/server.ts)
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { allowDemoMode, db, hasDatabaseConfig } from "../db";
import {
  getDashboardSummary,
  getGuildCompare,
  getGuildsOverview,
  getLeads,
  updateLeadStage,
} from "../lib/gbi/service";
import { calculatorInputSchema, runCalculator } from "../lib/gbi/engine";
import { pipelineStageEnum } from "../db/schema";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const host = process.env.BIND_HOST ?? "0.0.0.0";
const outDir = resolve(process.cwd(), "out");

/**
 * When the export was built for a deployment sub-path (GitHub Pages bakes
 * NEXT_BASE_PATH=/<repo-name> in), strip it so the same files can be served
 * locally either way.
 */
const basePath = (process.env.NEXT_BASE_PATH ?? "").replace(/\/+$/, "");

if (!existsSync(join(outDir, "index.html"))) {
  throw new Error(
    "Static export not found: run `npm run build` first (expects ./out/index.html).",
  );
}

const MAX_BODY_BYTES = 100 * 1024;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...SECURITY_HEADERS,
  });
  res.end(body);
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolvePromise, rejectPromise) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        rejectPromise(new Error("بدنه درخواست نامعتبر است"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolvePromise(null);
        return;
      }
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        rejectPromise(new Error("بدنه درخواست نامعتبر است"));
      }
    });
    req.on("error", rejectPromise);
  });
}

/** Same origin rule as the former Next.js route handler. */
function originAllowed(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const requestOrigin = new URL(origin).host;
    const requestHost = req.headers.host;
    if (requestHost && requestOrigin !== requestHost) return false;
    return true;
  } catch {
    return false;
  }
}

const patchLeadSchema = z.object({
  pipeline_stage: z.enum(pipelineStageEnum.enumValues),
});

const compareQuerySchema = z
  .object({
    a: z.string().uuid("شناسه رسته اول معتبر نیست"),
    b: z.string().uuid("شناسه رسته دوم معتبر نیست"),
  })
  .refine((value) => value.a !== value.b, {
    message: "برای مقایسه، دو رسته متفاوت انتخاب کنید",
    path: ["b"],
  });

/* ------------------------------------------------------------------ */
/* API handlers (same JSON contracts as the former Next.js routes)     */
/* ------------------------------------------------------------------ */

async function handleHealth(res: ServerResponse): Promise<void> {
  if (!hasDatabaseConfig) {
    if (allowDemoMode) {
      sendJson(res, 200, { ok: true, mode: "demo", database: "not-configured" });
    } else {
      sendJson(res, 503, { ok: false, mode: "unconfigured", database: "DATABASE_URL-required" });
    }
    return;
  }
  try {
    const result = await db.execute(sql`select to_regclass('public.guild_categories') as table_name`);
    const row = Array.isArray(result) ? (result as Array<{ table_name?: string }>)[0] : undefined;
    if (!row?.table_name) {
      sendJson(res, 503, { ok: false, mode: "postgres", database: "schema-not-migrated" });
    } else {
      sendJson(res, 200, { ok: true, mode: "postgres", database: "reachable" });
    }
  } catch (error) {
    console.error("[api/health]", error);
    sendJson(res, 503, { ok: false, mode: "postgres", database: "unreachable" });
  }
}

async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method ?? "GET";

  try {
    if (method === "GET" && pathname === "/api/health") {
      await handleHealth(res);
      return;
    }

    if (method === "GET" && pathname === "/api/dashboard") {
      sendJson(res, 200, await getDashboardSummary());
      return;
    }

    if (method === "GET" && pathname === "/api/guilds") {
      sendJson(res, 200, await getGuildsOverview());
      return;
    }

    if (method === "GET" && pathname === "/api/guilds/compare") {
      const parsed = compareQuerySchema.safeParse({
        a: url.searchParams.get("a") ?? undefined,
        b: url.searchParams.get("b") ?? undefined,
      });
      if (!parsed.success) {
        sendJson(res, 400, { error: "پارامترهای مقایسه نامعتبر است", issues: parsed.error.flatten() });
        return;
      }
      const result = await getGuildCompare(parsed.data.a, parsed.data.b);
      if (!result) {
        sendJson(res, 404, { error: "رسته شغلی یافت نشد" });
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (method === "GET" && pathname === "/api/leads") {
      sendJson(res, 200, await getLeads());
      return;
    }

    const leadMatch = pathname.match(/^\/api\/leads\/([^/]+)$/);
    if (method === "PATCH" && leadMatch) {
      const id = leadMatch[1];
      if (!originAllowed(req)) {
        sendJson(res, 403, { error: "مبدأ درخواست مجاز نیست" });
        return;
      }
      if (!z.string().uuid().safeParse(id).success) {
        sendJson(res, 400, { error: "شناسه سرنخ نامعتبر است" });
        return;
      }
      let body: unknown;
      try {
        body = await readJsonBody(req);
      } catch {
        sendJson(res, 400, { error: "بدنه درخواست نامعتبر است" });
        return;
      }
      const parsed = patchLeadSchema.safeParse(body);
      if (!parsed.success) {
        sendJson(res, 422, { error: "مرحله قیف بازاریابی نامعتبر است", issues: parsed.error.flatten() });
        return;
      }
      const updated = await updateLeadStage(id, parsed.data.pipeline_stage);
      if (!updated) {
        sendJson(res, 404, { error: "سرنخ یافت نشد" });
        return;
      }
      sendJson(res, 200, { ok: true, lead: updated });
      return;
    }

    if (method === "POST" && pathname === "/api/calculator") {
      let body: unknown;
      try {
        body = await readJsonBody(req);
      } catch {
        sendJson(res, 400, { error: "بدنه درخواست نامعتبر است" });
        return;
      }
      const parsed = calculatorInputSchema.safeParse(body);
      if (!parsed.success) {
        sendJson(res, 422, { error: "ورودی‌های محاسبه‌گر نامعتبر است", issues: parsed.error.flatten() });
        return;
      }
      sendJson(res, 200, runCalculator(parsed.data));
      return;
    }

    sendJson(res, 404, { error: "not found" });
  } catch (error) {
    console.error(`[api] ${method} ${pathname}`, error);
    sendJson(res, 500, { error: "خطا در اجرای درخواست" });
  }
}

/* ------------------------------------------------------------------ */
/* Static files (out/)                                                 */
/* ------------------------------------------------------------------ */

function serveStatic(res: ServerResponse, url: URL, method: string): void {
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    sendJson(res, 400, { error: "not found" });
    return;
  }

  // With trailingSlash export, every route is a directory with index.html.
  if (pathname.endsWith("/")) pathname += "index.html";

  const filePath = resolve(join(outDir, normalize(pathname)));
  if (!filePath.startsWith(outDir + "/") && filePath !== outDir) {
    sendJson(res, 403, { error: "forbidden" });
    return;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    // Fall back to the built 404 page (app/not-found.tsx) when present.
    const notFound = join(outDir, "404.html");
    if (existsSync(notFound)) {
      streamFile(res, 404, notFound, method);
    } else {
      sendJson(res, 404, { error: "not found" });
    }
    return;
  }

  streamFile(res, 200, filePath, method);
}

function streamFile(res: ServerResponse, status: number, filePath: string, method: string): void {
  const type = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  const headers: Record<string, string | number> = {
    "Content-Type": type,
    ...SECURITY_HEADERS,
  };
  // Exported assets are content-hashed; HTML must stay cacheable through the app itself.
  if (filePath.includes(`${outDir}/_next/static/`) && !filePath.endsWith(".html")) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else {
    headers["Cache-Control"] = "no-cache";
  }
  const stat = statSync(filePath);
  headers["Content-Length"] = stat.size;
  res.writeHead(status, headers);
  if (method === "HEAD") {
    res.end();
    return;
  }
  const stream = createReadStream(filePath);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}

/* ------------------------------------------------------------------ */
/* Server                                                              */
/* ------------------------------------------------------------------ */

const server = createServer((req, res) => {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname.startsWith("/api/")) {
    void handleApi(req, res, url);
    return;
  }
  if (basePath && (url.pathname === basePath || url.pathname.startsWith(`${basePath}/`))) {
    url.pathname = url.pathname.slice(basePath.length) || "/";
  }
  serveStatic(res, url, method);
});

server.listen(port, host, () => {
  const mode = hasDatabaseConfig ? "postgres" : allowDemoMode ? "demo" : "unconfigured";
  console.log(`[gbi] static export: ${outDir}`);
  console.log(`[gbi] data mode: ${mode}${hasDatabaseConfig ? "" : " (no DATABASE_URL)"}`);
  console.log(`[gbi] listening on http://${host}:${port}`);
});

const forwardSignal = (signal: NodeJS.Signals) => server.close(() => process.exit(0));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));
process.on("SIGINT", () => forwardSignal("SIGINT"));
