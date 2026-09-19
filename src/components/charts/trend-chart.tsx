"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartMoneyTick } from "@/lib/gbi/format";
import { ChartTooltip } from "./chart-tooltip";
import type { DashboardSummary } from "@/lib/gbi/types";

export function TrendChart({ data }: { data: DashboardSummary["trend"] }) {
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
            <linearGradient id="gFloat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3bd6c8" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3bd6c8" stopOpacity={0} />
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
            yAxisId="float"
            tickFormatter={chartMoneyTick}
            tickLine={false}
            axisLine={false}
            width={56}
            orientation="left"
            tick={{ fill: "#54cfc4", fontSize: 10 }}
          />
          <Tooltip content={<ChartTooltip />} />
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
            name="گردش تراکنش (تومان)"
            stroke="#f5c860"
            strokeWidth={2.4}
            fill="url(#gVolume)"
            dot={{ r: 3, fill: "#f5c860", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            animationDuration={1400}
          />
          <Area
            yAxisId="float"
            type="monotone"
            dataKey="float"
            name="رسوب روزانه CASA"
            stroke="#3bd6c8"
            strokeWidth={2.2}
            fill="url(#gFloat)"
            dot={{ r: 3, fill: "#3bd6c8", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            animationDuration={1600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
