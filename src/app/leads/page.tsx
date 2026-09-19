"use client";

import { RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { LeadKanban } from "@/components/leads/lead-kanban";
import { resetLeadStageOverrides } from "@/lib/gbi/client-data";
import { ReadingGuide } from "@/components/explain/reading-guide";

export default function LeadsPage() {
  const queryClient = useQueryClient();

  const handleReset = () => {
    resetLeadStageOverrides();
    void queryClient.invalidateQueries({ queryKey: ["leads"] });
  };

  return (
    <>
      <PageHeader
        kicker="قیف شعب"
        title="سرنخ‌هایی که باید پیگیری شوند"
        description="لیست واحدهایی که برای کارتخوان، سرمایه در گردش یا اعتبار اسنادی مناسب‌اند. کارت را بکشید تا مرحله عوض شود. امتیاز از رسوب، گردش، تناسب اعتباری و مالیات ساخته می‌شود."
        actions={
          <>
            <Badge variant="gold">امتیازدهی خودکار فعال</Badge>
            <Badge variant="slate">ذخیره‌سازی محلی مرورگر</Badge>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10.5px] font-bold text-slate-300 transition hover:border-gold-500/30 hover:text-gold-300"
            >
              <RotateCcw className="h-3 w-3" />
              بازنشانی داده‌های نمونه
            </button>
          </>
        }
      />
      <ReadingGuide
        items={[
          "هر کارت یک واحد صنفی است که شعبه باید با او کار کند. امتیاز بالاتر یعنی اولویت بیشتر.",
          "روی کارت، اقدام بعدی و مهلت نوشته شده. دلیل پیشنهاد را هم همان‌جا می‌بینید.",
          "کارت را بکشید و در ستون بعد رها کنید. این تغییر فقط در همین مرورگر ذخیره می‌شود.",
          "اگر کارتخوان به سامانه مؤدیان وصل نباشد، مدل اول شفافیت مالیاتی می‌خواهد نه تسهیلات.",
        ]}
      />
      <LeadKanban />
    </>
  );
}
