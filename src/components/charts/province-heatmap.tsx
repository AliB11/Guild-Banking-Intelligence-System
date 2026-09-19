"use client";

import { faDigits, formatToman } from "@/lib/gbi/format";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/gbi/types";

export function ProvinceHeatmap({ data }: { data: DashboardSummary["provinces"] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {data.map((p) => {
        const hot = p.intensity;
        return (
          <div
            key={p.province}
            className={cn(
              "group relative overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5",
              "border-white/[0.06]",
            )}
            style={{
              background: `linear-gradient(140deg, rgba(245,200,96,${0.02 + hot * 0.2}), rgba(59,214,200,${0.015 + hot * 0.08}))`,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-extrabold text-slate-100">{p.province}</p>
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: hot > 0.66 ? "#f5c860" : hot > 0.33 ? "#3bd6c8" : "#4b5b7d",
                  boxShadow: hot > 0.33 ? `0 0 10px ${hot > 0.66 ? "#f5c860" : "#3bd6c8"}` : "none",
                }}
              />
            </div>
            <p className="num mt-1.5 text-[13px] font-black text-gold-200">
              {formatToman(p.volume, { decimals: 0 })}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              {faDigits(p.merchants)} واحد صنفی · {faDigits(p.terminals)} پایانه
            </p>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-l from-gold-400 to-persian-400 transition-all duration-1000"
                style={{ width: `${Math.max(6, hot * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
