"use client";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { formatToman } from "@/lib/gbi/format";
import type { DashboardSummary } from "@/lib/gbi/types";

const PALETTE = ["#f5c860", "#3bd6c8", "#a78bfa", "#38bdf8", "#fb7185", "#fbbf24", "#34d399", "#f472b6", "#facc15", "#2dd4bf", "#818cf8", "#f97316"];

interface TreemapNode {
  name?: string;
  size?: number;
  categoryName?: string;
  merchants?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
}

function TreemapContent(props: TreemapNode) {
  const { x = 0, y = 0, width = 0, height = 0, name, index = 0 } = props;
  if (width < 4 || height < 4) return null;
  const color = PALETTE[index % PALETTE.length];
  const showLabel = width > 74 && height > 40;
  return (
    <g>
      <rect
        x={x + 2}
        y={y + 2}
        width={width - 4}
        height={height - 4}
        rx={10}
        fill={color}
        fillOpacity={0.14}
        stroke={color}
        strokeOpacity={0.55}
        strokeWidth={1.2}
      />
      {showLabel && (
        <text
          x={x + width - 12}
          y={y + 22}
          textAnchor="end"
          fill={color}
          fontSize={12}
          fontWeight={800}
        >
          {name}
        </text>
      )}
      {showLabel && props.size !== undefined && (
        <text
          x={x + width - 12}
          y={y + 40}
          textAnchor="end"
          fill="#94a3b8"
          fontSize={10}
          fontWeight={600}
        >
          {formatToman(props.size, { decimals: 0 })}
        </text>
      )}
    </g>
  );
}

export function GuildTreemap({ data }: { data: DashboardSummary["topSubGuilds"] }) {
  const nodes = data.map((s) => ({
    ...s,
    name: s.title,
    size: Math.max(s.volume, 1),
  }));
  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={nodes}
          dataKey="size"
          nameKey="name"
          isAnimationActive
          animationDuration={1300}
          content={<TreemapContent />}
        >
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as TreemapNode & { title?: string; float?: number };
              return (
                <div dir="rtl" className="rounded-xl border border-white/10 bg-night-900/95 p-3 text-[11px] shadow-2xl backdrop-blur-xl">
                  <p className="font-extrabold text-slate-100">{d.title ?? d.name}</p>
                  <p className="mt-1 text-slate-400">
                    گردش ماهانه:{" "}
                    <span className="num font-bold text-gold-300">{formatToman(d.size ?? 0)}</span>
                  </p>
                  <p className="mt-0.5 text-slate-400">
                    گروه: <span className="font-bold text-slate-200">{d.categoryName}</span>
                    <span className="mx-1 text-slate-600">|</span>
                    {d.merchants} واحد فعال
                  </p>
                </div>
              );
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
