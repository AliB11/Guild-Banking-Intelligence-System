import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/gbi/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[api/dashboard]", error);
    return NextResponse.json(
      { error: "خطا در بازیابی شاخص‌های مدیریتی" },
      { status: 500 },
    );
  }
}
