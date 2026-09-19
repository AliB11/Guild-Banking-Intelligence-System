import { Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { faDigits, formatDecimal, formatToman } from "@/lib/gbi/format";
import type { MonthlyBriefing } from "@/lib/gbi/sources/types";
import { cn } from "@/lib/utils";

const TONE: Record<MonthlyBriefing["highlights"][number]["tone"], string> = {
  gold: "border-gold-500/25 bg-gold-500/[0.06]",
  persian: "border-persian-500/25 bg-persian-500/[0.06]",
  rose: "border-rose-500/25 bg-rose-500/[0.06]",
  slate: "border-white/10 bg-white/[0.03]",
};

export function MonthlyBriefingCard({ briefing }: { briefing: MonthlyBriefing }) {
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-gold-400" />
            {briefing.headline}
          </CardTitle>
          <CardDescription>
            ماهنامه خودکار پس از بستن ماه جلالی — ارقام واحدها نمونه‌اند؛ تقویم انتشار رسمی است.
          </CardDescription>
        </div>
        <Badge variant="gold">{briefing.periodLabel}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {briefing.highlights.map((item) => (
            <div key={item.title} className={cn("rounded-xl border px-3 py-3", TONE[item.tone])}>
              <p className="text-[10px] font-bold text-slate-500">{item.title}</p>
              <p className="num mt-1 text-[12.5px] font-black text-slate-100">{item.detail}</p>
            </div>
          ))}
        </div>
        <ul className="space-y-1.5 text-[12px] leading-6 text-slate-400">
          {briefing.narrative.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {briefing.movers.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-extrabold text-slate-300">رسته‌های پرتحرک این ماه</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {briefing.movers.map((mover) => (
                <div key={mover.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-[11px]">
                  <span className="font-bold text-slate-200">{mover.title}</span>
                  <span className="num text-slate-400">
                    {formatToman(mover.volume, { decimals: 0 })} · {formatDecimal(mover.growthPct, 1)}٪
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[11px] font-extrabold text-slate-300">نکات مراقبت</p>
          <ul className="mt-1 space-y-1 text-[11px] leading-6 text-slate-500">
            {briefing.watchouts.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        {briefing.comparedToPreviousBriefing && (
          <p className="text-[10.5px] text-slate-600">{briefing.comparedToPreviousBriefing}</p>
        )}
        <p className="text-[10px] text-slate-600">نسخه خلاصه {faDigits(briefing.period)}</p>
      </CardContent>
    </Card>
  );
}
