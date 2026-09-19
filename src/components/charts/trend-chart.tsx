"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartMoneyTick, formatCount, formatToman } from "@/lib/gbi/format";
import type { MarketTrendPoint } from "@/lib/gbi/market-view";

function chartCountTick(n: number): string {
  return formatCount(n, 1);
}

export function TrendChart({ data }: { data: MarketTrendPoint[] }) {
  if (data.length === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-slate-500">داده‌ای برای روند وجود ندارد.</div>;
  }
  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="gVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5c860" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f5c860" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,178,255,0.06)" vertical={false} />
          <XAxis dataKey="short" tickLine={false} axisLine={false} dy={6} />
          <YAxis
            yAxisId="vol"
            tickFormatter={chartMoneyTick}
            tickLine={false}
            axisLine={false}
            width={56}
            orientation="right"
            tick={{ fill: "#d9b45a", fontSize: 10 }}
          />
          <YAxis
            yAxisId="count"
            tickFormatter={chartCountTick}
            tickLine={false}
            axisLine={false}
            width={56}
            orientation="left"
            tick={{ fill: "#54cfc4", fontSize: 10 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as MarketTrendPoint | undefined;
              if (!point) return null;
              return (
                <div dir="rtl" className="min-w-44 rounded-xl border border-white/10 bg-night-900/95 p-3 shadow-2xl backdrop-blur-xl">
                  <p className="mb-2 border-b border-white/[0.07] pb-1.5 text-[11px] font-extrabold text-slate-200">
                    {point.label ?? String(label ?? "")}
                  </p>
                  <p className="flex justify-between gap-4 text-[11px] text-slate-400">
                    <span>گردش</span>
                    <span className="num font-bold text-gold-200">{formatToman(point.volume, { decimals: 1 })}</span>
                  </p>
                  <p className="mt-1 flex justify-between gap-4 text-[11px] text-slate-400">
                    <span>تعداد</span>
                    <span className="num font-bold text-persian-200">{formatCount(point.txCount)}</span>
                  </p>
                </div>
              );
            }}
          />
          <Legend
            formatter={(v: string) => (
              <span className="text-[11px] font-bold text-slate-300">{v}</span>
            )}
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ paddingTop: 8 }}
          />
          <Area
            yAxisId="vol"
            type="monotone"
            dataKey="volume"
            name="گردش تراکنش"
            stroke="#f5c860"
            strokeWidth={2.4}
            fill="url(#gVolume)"
            dot={{ r: 3, fill: "#f5c860", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            animationDuration={1400}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="txCount"
            name="تعداد تراکنش"
            stroke="#3bd6c8"
            strokeWidth={2.2}
            dot={{ r: 3, fill: "#3bd6c8", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            animationDuration={1600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
