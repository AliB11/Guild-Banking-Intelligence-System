import "dotenv/config";
import { resolve } from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for migrations");
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10_000,
});

try {
  const database = drizzle(pool);
  await migrate(database, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  console.log("Database migrations applied.");
} finally {
  await pool.end();
}
