"use client";

import { formatNum, formatToman } from "@/lib/gbi/format";

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  money = true,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  money?: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div dir="rtl" className="min-w-44 rounded-xl border border-white/10 bg-night-900/95 p-3 shadow-2xl backdrop-blur-xl">
      {label !== undefined && (
        <p className="mb-2 border-b border-white/[0.07] pb-1.5 text-[11px] font-extrabold text-slate-200">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: item.color ?? "#f5c860" }}
              />
              {item.name}
            </span>
            <span className="num font-bold text-slate-100">
              {money
                ? formatToman(Number(item.value ?? 0), { decimals: 1 })
                : formatNum(Number(item.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
