/**
 * GBI Seed — published Shaparak/CBI/INTA corpus (no fake shops).
 * Run:  npx tsx src/db/seed.ts
 */
import { config } from "dotenv";
config();

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  guildCategories,
  marketingLeads,
  merchantBusinesses,
  subGuilds,
  terminalMetrics,
} from "./schema";
import { getDemoCorpus } from "../lib/gbi/demo-data";

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env first.");
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    throw new Error("Refusing destructive seed in production. Set ALLOW_DESTRUCTIVE_SEED=true only for an explicit reset.");
  }

  const corpus = getDemoCorpus();
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await db.transaction(async (tx) => {
      console.log("→ پاکسازی داده‌های قبلی...");
      await tx.delete(marketingLeads);
      await tx.delete(terminalMetrics);
      await tx.delete(merchantBusinesses);
      await tx.delete(subGuilds);
      await tx.delete(guildCategories);

      console.log("→ درج corpus منتشرشده شاپرک/اینتا/ISIC...");
      if (corpus.categories.length) await tx.insert(guildCategories).values(corpus.categories);
      if (corpus.subs.length) await tx.insert(subGuilds).values(corpus.subs);
      if (corpus.merchants.length) await tx.insert(merchantBusinesses).values(corpus.merchants);
      if (corpus.metrics.length) await tx.insert(terminalMetrics).values(corpus.metrics);
      if (corpus.leads.length) await tx.insert(marketingLeads).values(corpus.leads);

      console.log("✓ Seed کامل شد:");
      console.log(`   دوره: ${corpus.latestPeriod} | گروه‌ها: ${corpus.categories.length} | رسته‌ها: ${corpus.subs.length}`);
      console.log(`   واحدهای گزارش: ${corpus.merchants.length} | شاخص‌ها: ${corpus.metrics.length} | کمپین رسته: ${corpus.leads.length}`);
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
