import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuildCompare } from "@/lib/gbi/service";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  a: z.string().uuid("شناسه رسته اول معتبر نیست"),
  b: z.string().uuid("شناسه رسته دوم معتبر نیست"),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    a: req.nextUrl.searchParams.get("a"),
    b: req.nextUrl.searchParams.get("b"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "پارامترهای مقایسه نامعتبر است", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const result = await getGuildCompare(parsed.data.a, parsed.data.b);
    if (!result) {
      return NextResponse.json({ error: "رسته شغلی یافت نشد" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/guilds/compare]", error);
    return NextResponse.json({ error: "خطا در مقایسه رسته‌ها" }, { status: 500 });
  }
}
