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
        title="کمپین رسته‌ها — نه پرونده مشتری"
        description="فهرست پذیرنده حقیقی در منابع عمومی نیست. کارت‌ها فرصت سیاستی رسته‌اند: معافیت کارمزد نانوایی/سوپرمارکت، ضریب اینتا رستوران و اغذیه. امتیاز اولویت سیاست است نه رسوب حساب یک فروشگاه. مرحله قیف فقط در همین مرورگر ذخیره می‌شود."
        actions={
          <>
            <Badge variant="gold">اولویت سیاستی رسته</Badge>
            <Badge variant="slate">ذخیره‌سازی محلی مرورگر</Badge>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10.5px] font-bold text-slate-300 transition hover:border-gold-500/30 hover:text-gold-300"
            >
              <RotateCcw className="h-3 w-3" />
              بازنشانی مراحل قیف
            </button>
          </>
        }
      />
      <ReadingGuide
        items={[
          "هر کارت یک رسته است نه واحد صنفی با نام. امتیاز از سیاست کارمزد/اینتا آمده نه از CASA ساختگی.",
          "کانبان برای طراحی کمپین ستاد است. جابه‌جایی مرحله فقط روی این مرورگر می‌ماند.",
          "اتصال هسته بانک و پایش پایانه، این صفحه را با سرنخ شعبه واقعی پر می‌کند.",
          "اگر کارتخوان به سامانه مؤدیان وصل نباشد، مدل در ماشین‌حساب اول شفافیت مالیاتی می‌خواهد.",
        ]}
      />
      <LeadKanban />
    </>
  );
}
