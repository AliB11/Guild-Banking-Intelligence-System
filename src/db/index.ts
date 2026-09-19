import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Keep module evaluation side-effect free so `next build` can run without a
 * production secret. Requests use demo mode when DATABASE_URL is not set;
 * production deployments should always provide the variable.
 */
export const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
export const hasDatabaseConfig = databaseUrl.length > 0;
/**
 * Demo mode is useful for GitHub/Vercel previews, but production can opt out
 * so a missing database fails closed instead of silently serving in-memory data.
 */
export const allowDemoMode = process.env.ALLOW_DEMO_MODE !== "false";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// pg does not connect until the first query. The fallback keeps imports safe
// during build and is never used by the service layer in demo mode.
const connectionString =
  databaseUrl || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const configuredPoolMax = Number.parseInt(process.env.DB_POOL_MAX ?? "10", 10);
const poolMax = Number.isInteger(configuredPoolMax) && configuredPoolMax > 0 ? configuredPoolMax : 10;

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString,
    max: poolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: process.env.NODE_ENV !== "production",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
