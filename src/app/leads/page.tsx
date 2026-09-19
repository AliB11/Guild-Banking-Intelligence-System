"use client";

import { RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { LeadKanban } from "@/components/leads/lead-kanban";
import { resetLeadStageOverrides } from "@/lib/gbi/client-data";

export default function LeadsPage() {
  const queryClient = useQueryClient();

  const handleReset = () => {
    resetLeadStageOverrides();
    void queryClient.invalidateQueries({ queryKey: ["leads"] });
  };

  return (
    <>
      <PageHeader
        kicker="BRANCH LEAD PIPELINE"
        title="مدیریت سرنخ‌های شعب"
        description="قیف بازاریابی پذیرندگان بر اساس موتور امتیازدهی GBI؛ اقدام بعدی، دلیل پیشنهاد و SLA هر سرنخ را ببینید، کارت‌ها را جابه‌جا کنید و وضعیت را به‌صورت آنی ثبت کنید."
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
      <LeadKanban />
    </>
  );
}
