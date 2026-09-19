import { allowDemoMode, db, hasDatabaseConfig } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabaseConfig) {
    return allowDemoMode
      ? Response.json({ ok: true, mode: "demo", database: "not-configured" })
      : Response.json(
          { ok: false, mode: "unconfigured", database: "DATABASE_URL-required" },
          { status: 503 },
        );
  }

  try {
    const result = await db.execute(
      sql`select to_regclass('public.guild_categories') as table_name`,
    );
    if (!result.rows[0]?.table_name) {
      return Response.json(
        { ok: false, mode: "postgres", database: "schema-not-migrated" },
        { status: 503 },
      );
    }
    return Response.json({ ok: true, mode: "postgres", database: "reachable" });
  } catch (error) {
    console.error("[api/health]", error);
    return Response.json({ ok: false, mode: "postgres", database: "unreachable" }, { status: 503 });
  }
}
