import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runCalculator } from "@/lib/gbi/engine";
import { riskStatusEnum } from "@/db/schema";

export const dynamic = "force-dynamic";

const inputSchema = z.object({
  dailyTxCount: z.number().min(0).max(10_000),
  avgBasketRials: z.number().min(0).max(2_000_000_000),
  retentionDays: z.number().min(0).max(60),
  posUnits: z.number().int().min(1).max(50),
  cccDays: z.number().int().min(-30).max(180),
  isTaxCompliant: z.boolean(),
  riskStatus: z.enum(riskStatusEnum.enumValues),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ورودی‌های محاسبه‌گر نامعتبر است", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const result = runCalculator(parsed.data);
  return NextResponse.json(result);
}
