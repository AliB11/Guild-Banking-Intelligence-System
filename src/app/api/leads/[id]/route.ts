import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateLeadStage } from "@/lib/gbi/service";
import { pipelineStageEnum } from "@/db/schema";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  pipeline_stage: z.enum(pipelineStageEnum.enumValues),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const requestOrigin = new URL(origin).host;
      const requestHost = req.headers.get("host");
      if (requestHost && requestOrigin !== requestHost) {
        return NextResponse.json({ error: "مبدأ درخواست مجاز نیست" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "مبدأ درخواست نامعتبر است" }, { status: 403 });
    }
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "شناسه سرنخ نامعتبر است" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "مرحله قیف بازاریابی نامعتبر است", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  try {
    const updated = await updateLeadStage(id, parsed.data.pipeline_stage);
    if (!updated) {
      return NextResponse.json({ error: "سرنخ یافت نشد" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, lead: updated });
  } catch (error) {
    console.error("[api/leads/[id]]", error);
    return NextResponse.json({ error: "خطا در به‌روزرسانی سرنخ" }, { status: 500 });
  }
}
