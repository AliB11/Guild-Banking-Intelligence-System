import { db, hasDatabaseConfig } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabaseConfig) {
    return Response.json({ ok: true, mode: "demo", database: "not-configured" });
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, mode: "postgres", database: "reachable" });
  } catch (error) {
    console.error("[api/health]", error);
    return Response.json({ ok: false, mode: "postgres", database: "unreachable" }, { status: 503 });
  }
}
