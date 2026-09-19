import { ShieldCheck, ShieldAlert } from "lucide-react";
import { formatDecimal, formatToman } from "@/lib/gbi/format";
import type { DashboardSummary } from "@/lib/gbi/types";

export function MerchantsTable({
  merchants,
}: {
  merchants: DashboardSummary["topMerchants"];
}) {
  if (merchants.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">پذیرنده‌ای برای رتبه‌بندی وجود ندارد.</p>;
  }

  return (
    <div className="space-y-2">
      {merchants.map((m, i) => (
        <div
          key={m.id}
          className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition-all duration-300 hover:border-gold-500/25 hover:bg-gold-500/[0.04]"
        >
          <span className="num w-6 text-center text-[11px] font-black text-slate-600 group-hover:text-gold-400">
            {formatDecimal(i + 1, 0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-[12px] font-extrabold text-slate-100">
              {m.businessName}
              {m.branchCode !== "SHAPARAK" && m.branchCode !== "POLICY" ? (
                m.isTaxCompliant ? (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-persian-400" aria-label="متصل به سامانه مؤدیان" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-label="غیرمتصل به سامانه مؤدیان" />
                )
              ) : null}
            </p>
            <p className="truncate text-[10px] text-slate-500">
              {m.subGuildTitle} · {m.province}
              {m.branchCode === "SHAPARAK" || m.branchCode === "POLICY" ? "" : ` · شعبه ${m.branchCode}`}
            </p>
          </div>
          <div className="text-left">
            <p className="num text-[12px] font-black text-gold-300">{formatToman(m.margin, { decimals: 0 })}</p>
            <p className="num text-[9.5px] text-slate-500">
              امتیاز {formatDecimal(m.score, 0)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
