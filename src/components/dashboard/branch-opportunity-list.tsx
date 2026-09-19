import { ArrowUpLeft, Building2, CircleAlert, HandCoins, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDecimal, formatToman, faDigits } from "@/lib/gbi/format";
import type { BranchOpportunity } from "@/lib/gbi/types";
import { cn } from "@/lib/utils";

const SIGNAL_META: Record<BranchOpportunity["signal"], { label: string; tone: string; icon: typeof Building2 }> = {
  EXPAND_POS: { label: "توسعه POS", tone: "text-sky-300", icon: MonitorSmartphone },
  CREDIT_CAMPAIGN: { label: "کمپین اعتبار", tone: "text-gold-300", icon: HandCoins },
  TAX_CLEANUP: { label: "پاک‌سازی مالیاتی", tone: "text-rose-300", icon: CircleAlert },
  MONITOR: { label: "پایش", tone: "text-persian-300", icon: ShieldCheck },
};

export function BranchOpportunityList({ data }: { data: BranchOpportunity[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">داده‌ای برای اولویت‌بندی شعب وجود ندارد.</p>;
  }
  return (
    <div className="space-y-2.5">
      {data.slice(0, 6).map((branch, index) => {
        const meta = SIGNAL_META[branch.signal];
        const Icon = meta.icon;
        return (
          <div key={branch.branchCode} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-gold-500/25 hover:bg-gold-500/[0.03]">
            <div className="flex items-start gap-2.5">
              <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[11px] font-black text-slate-500 group-hover:text-gold-300">
                {formatDecimal(index + 1, 0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-slate-100">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <span dir="ltr">{branch.branchCode}</span>
                  </p>
                  <span className={cn("inline-flex items-center gap-1 text-[9.5px] font-bold", meta.tone)}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                </div>
                <p className="mt-0.5 text-[9.5px] text-slate-500">{branch.province}، {branch.city} · {faDigits(branch.merchantCount)} واحد · {faDigits(branch.leadCount)} سرنخ</p>
              </div>
              <div className="text-left">
                <p className="num text-[13px] font-black text-gold-200">{formatDecimal(branch.opportunityScore, 0)}</p>
                <p className="text-[8.5px] text-slate-600">امتیاز فرصت</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-l from-gold-400 to-persian-400" style={{ width: `${Math.max(4, branch.opportunityScore)}%` }} />
              </div>
              <span className="num text-[9px] text-slate-500">گردش {formatToman(branch.volume, { decimals: 0 })}</span>
            </div>
            <p className="mt-2 flex items-start gap-1 text-[9.5px] leading-4 text-slate-500">
              <ArrowUpLeft className="mt-0.5 h-3 w-3 shrink-0 text-gold-400" />
              {branch.recommendation}
            </p>
          </div>
        );
      })}
      <Badge variant="ghost" className="w-full justify-center">اولویت بر اساس گردش، رسوب، انطباق و پوشش سرنخ</Badge>
    </div>
  );
}
