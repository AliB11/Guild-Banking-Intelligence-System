import { NextResponse } from "next/server";
import { getGuildsOverview } from "@/lib/gbi/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await getGuildsOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("[api/guilds]", error);
    return NextResponse.json(
      { error: "خطا در بازیابی ماتریس اصناف" },
      { status: 500 },
    );
  }
}
