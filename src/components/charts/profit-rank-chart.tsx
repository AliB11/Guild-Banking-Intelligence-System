"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartMoneyTick, formatToman } from "@/lib/gbi/format";
import type { DashboardSummary } from "@/lib/gbi/types";

const COLORS = ["#f5c860", "#3bd6c8", "#a78bfa", "#38bdf8", "#fb7185"];

export function ProfitRankChart({
  data,
}: {
  data: DashboardSummary["categoryProfit"];
}) {
  const sorted = [...data].sort((a, b) => a.margin - b.margin);
  if (sorted.length === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-slate-500">داده‌ای برای رتبه‌بندی سودآوری وجود ندارد.</div>;
  }
  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,178,255,0.06)" horizontal={false} />
          <XAxis type="number" tickFormatter={chartMoneyTick} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={86}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 700 }}
            orientation="right"
          />
          <Tooltip
            cursor={{ fill: "rgba(245,200,96,0.05)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as DashboardSummary["categoryProfit"][number];
              return (
                <div dir="rtl" className="rounded-xl border border-white/10 bg-night-900/95 p-3 text-[11px] shadow-2xl backdrop-blur-xl">
                  <p className="mb-1.5 font-extrabold text-slate-100">{d.name}</p>
                  <p className="text-slate-400">
                    حاشیه خالص ماهانه:{" "}
                    <span className="num font-bold text-gold-300">{formatToman(d.margin)}</span>
                  </p>
                  <p className="mt-1 text-slate-400">
                    گردش: <span className="num font-bold text-slate-200">{formatToman(d.volume)}</span>
                    <span className="mx-1.5 text-slate-600">|</span>
                    کارمزد: <span className="num font-bold text-persian-300">{formatToman(d.fees)}</span>
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="margin" name="حاشیه سود" radius={[4, 4, 4, 4]} barSize={26} animationDuration={1300}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={COLORS[sorted.length - 1 - i] ?? COLORS[0]} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
