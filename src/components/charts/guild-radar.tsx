"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { GuildCompareResult } from "@/lib/gbi/types";

export function GuildRadar({
  compare,
  nameA,
  nameB,
}: {
  compare: GuildCompareResult;
  nameA: string;
  nameB: string;
}) {
  return (
    <div className="h-[340px] w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={compare.axes} outerRadius="72%">
          <PolarGrid stroke="rgba(148,178,255,0.12)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#aab8d4", fontSize: 11, fontWeight: 700 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={nameA}
            dataKey="a"
            stroke="#f5c860"
            fill="#f5c860"
            fillOpacity={0.32}
            strokeWidth={2.2}
            animationDuration={1200}
          />
          <Radar
            name={nameB}
            dataKey="b"
            stroke="#3bd6c8"
            fill="#3bd6c8"
            fillOpacity={0.28}
            strokeWidth={2.2}
            animationDuration={1400}
          />
          <Legend
            formatter={(v: string) => (
              <span className="text-[11px] font-bold text-slate-200">{v}</span>
            )}
            iconType="circle"
            iconSize={7}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div dir="rtl" className="rounded-xl border border-white/10 bg-night-900/95 p-3 text-[11px] shadow-2xl backdrop-blur-xl">
                  <p className="mb-1.5 font-extrabold text-slate-100">{label}</p>
                  {payload.map((p, i) => (
                    <p key={i} className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                      {p.name}: <span className="num font-bold text-slate-100">{p.value}</span>
                      <span className="text-slate-600">/۱۰۰</span>
                    </p>
                  ))}
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
