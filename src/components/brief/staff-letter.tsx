"use client";

import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { faDigits } from "@/lib/gbi/format";
import { getStaffLetter } from "@/lib/gbi/market-view";

export function StaffLetter() {
  const letter = getStaffLetter();

  return (
    <article className="letter-sheet mx-auto max-w-3xl rounded-2xl border border-white/[0.08] bg-night-900/60 p-6 sm:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-gold-500/90">ستاد بانکداری خرد</p>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">{letter.headline}</h2>
          <p className="mt-1 text-[12px] text-slate-400">
            گزارش شاپرک {letter.reportNo ? faDigits(letter.reportNo) : "—"} · فقط ارقام منتشرشده
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="print-hide inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-[11px] font-bold text-gold-200"
        >
          <Printer className="h-3.5 w-3.5" />
          چاپ یک صفحه
        </button>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {letter.kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <p className="text-[10px] font-bold text-slate-500">{kpi.label}</p>
            <p className="num mt-1 text-[14px] font-black text-gold-200">{kpi.value}</p>
            <p className="mt-1 text-[10px] text-slate-500">{kpi.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 space-y-4">
        <p className="text-[12px] font-extrabold text-slate-200">سه اقدام مشخص برای ستاد</p>
        {letter.actions.map((action) => (
          <div key={action.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[13px] font-black text-white">{action.title}</p>
            <p className="mt-2 text-[12.5px] leading-7 text-slate-400">{action.detail}</p>
          </div>
        ))}
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
        <Badge variant="slate">تصمیم‌یار · نه مجوز اعتبار</Badge>
        <p className="max-w-xl text-[11px] leading-6 text-slate-500">{letter.closing}</p>
      </footer>
    </article>
  );
}
