import { Database, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDecimal } from "@/lib/gbi/format";
import type { DataQualitySummary } from "@/lib/gbi/types";
import { cn } from "@/lib/utils";

export function DataQualityCard({ data }: { data: DataQualitySummary }) {
  const healthy = data.score >= 95;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-persian-300" />
          <span className="text-[11px] font-extrabold text-slate-200">کیفیت داده</span>
        </div>
        <Badge variant={healthy ? "persian" : data.score >= 80 ? "gold" : "rose"}>
          {formatDecimal(data.score, 0)} از ۱۰۰
        </Badge>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full transition-all duration-700", healthy ? "bg-persian-400" : data.score >= 80 ? "bg-gold-400" : "bg-rose-400")} style={{ width: `${Math.max(2, data.score)}%` }} />
      </div>
      <div className="mt-4 space-y-2">
        {data.checks.map((check) => (
          <div key={check.code} className="flex items-center gap-2 text-[9.5px]">
            <ShieldCheck className={cn("h-3.5 w-3.5", check.status === "PASS" ? "text-persian-400" : check.status === "WARN" ? "text-gold-400" : "text-rose-400")} />
            <span className="flex-1 text-slate-400">{check.label}</span>
            <span className={cn("num font-black", check.status === "PASS" ? "text-persian-300" : check.status === "WARN" ? "text-gold-300" : "text-rose-300")}>
              {check.count === 0 ? "پاک" : formatDecimal(check.count, 0)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[9px] leading-5 text-slate-600">کنترل کیفیت قبل از KPI؛ رکوردهای مسئله‌دار باید در محیط عملیاتی قرنطینه شوند.</p>
    </div>
  );
}
