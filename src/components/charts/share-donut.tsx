"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatDecimal, formatToman } from "@/lib/gbi/format";

const COLORS = ["#f5c860", "#3bd6c8", "#a78bfa", "#38bdf8"];

export interface ShareSlice {
  id: string;
  name: string;
  volume: number;
  sharePct: number;
}

export function ShareDonut({ data }: { data: ShareSlice[] }) {
  const total = data.reduce((a, c) => a + c.volume, 0);
  if (data.length === 0 || total === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-slate-500">داده‌ای برای نمایش سهم گردش وجود ندارد.</div>;
  }
  return (
    <div className="flex h-72 flex-col" dir="ltr">
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="volume"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={3}
              strokeWidth={0}
              animationDuration={1400}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.92} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as ShareSlice;
                return (
                  <div dir="rtl" className="rounded-xl border border-white/10 bg-night-900/95 p-3 text-[11px] shadow-2xl backdrop-blur-xl">
                    <p className="font-extrabold text-slate-100">{d.name}</p>
                    <p className="mt-1 text-slate-400">
                      <span className="num font-bold text-gold-300">{formatToman(d.volume)}</span>
                      <span className="mx-1.5 text-slate-600">|</span>
                      سهم {formatDecimal(d.sharePct, 1)}٪
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-bold text-slate-500">گردش کل ماه</p>
          <p className="num mt-0.5 text-sm font-black text-white">{formatToman(total)}</p>
        </div>
      </div>
      <div dir="rtl" className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 px-1">
        {data.map((c, i) => (
          <div key={c.id} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: COLORS[i % COLORS.length] }} />
              {c.name}
            </span>
            <span className="num font-bold text-slate-200">{formatDecimal(c.sharePct, 1)}٪</span>
          </div>
        ))}
      </div>
    </div>
  );
}
