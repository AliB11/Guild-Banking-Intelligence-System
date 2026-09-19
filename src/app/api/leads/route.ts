import { NextResponse } from "next/server";
import { getLeads } from "@/lib/gbi/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLeads();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/leads]", error);
    return NextResponse.json(
      { error: "خطا در بازیابی سرنخ‌های بازاریابی" },
      { status: 500 },
    );
  }
}
