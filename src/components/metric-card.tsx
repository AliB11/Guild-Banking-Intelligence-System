"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  Vault,
  Percent,
  MonitorSmartphone,
  ArrowLeftRight,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { formatCount, formatDecimal, formatNum, formatToman } from "@/lib/gbi/format";

export interface SparkPoint {
  label: string;
  value: number;
}

/** نقشه آیکون‌های قابل‌سریال‌سازی — رفرنس کامپوننت نمی‌تواند از سرور به کلاینت پاس شود */
const ICONS = {
  vault: Vault,
  percent: Percent,
  terminal: MonitorSmartphone,
  exchange: ArrowLeftRight,
  basket: ShoppingBasket,
} satisfies Record<string, LucideIcon>;
export type MetricIcon = keyof typeof ICONS;

/** Format presets — قابل‌سریال‌سازی از کامپوننت سروری */
const FORMATTERS: Record<string, (n: number) => string> = {
  toman: (n) => formatToman(n, { decimals: 1 }),
  toman0: (n) => formatToman(n, { decimals: 0 }),
  num: (n) => formatNum(n),
  count: (n) => formatCount(n),
  decimal: (n) => formatDecimal(n, 1),
};
export type MetricFormat = keyof typeof FORMATTERS;

const TONES = {
  gold: {
    iconWrap: "from-gold-500/25 to-gold-600/5 text-gold-300 border-gold-500/30",
    stroke: "#f5c860",
    glow: "shadow-[0_8px_28px_-12px_rgba(245,200,96,0.45)]",
  },
  persian: {
    iconWrap: "from-persian-500/25 to-persian-500/5 text-persian-300 border-persian-500/30",
    stroke: "#3bd6c8",
    glow: "shadow-[0_8px_28px_-12px_rgba(59,214,200,0.45)]",
  },
  violet: {
    iconWrap: "from-violet-500/25 to-violet-600/5 text-violet-300 border-violet-500/30",
    stroke: "#a78bfa",
    glow: "shadow-[0_8px_28px_-12px_rgba(167,139,250,0.45)]",
  },
  sky: {
    iconWrap: "from-sky-500/25 to-sky-600/5 text-sky-300 border-sky-500/30",
    stroke: "#38bdf8",
    glow: "shadow-[0_8px_28px_-12px_rgba(56,189,248,0.45)]",
  },
  rose: {
    iconWrap: "from-rose-500/25 to-rose-600/5 text-rose-300 border-rose-500/30",
    stroke: "#fb7185",
    glow: "shadow-[0_8px_28px_-12px_rgba(251,113,133,0.45)]",
  },
} as const;

export function MetricCard({
  title,
  subtitle,
  value,
  format = "num",
  icon = "vault",
  tone,
  deltaPct,
  spark,
}: {
  title: string;
  subtitle: string;
  value: number;
  format?: MetricFormat;
  icon?: MetricIcon;
  tone: keyof typeof TONES;
  deltaPct?: number;
  spark: SparkPoint[];
}) {
  const Icon = ICONS[icon] ?? Vault;
  const formatFn = FORMATTERS[format] ?? FORMATTERS.num;
  const t = TONES[tone];
  const positive = (deltaPct ?? 0) >= 0;
  const gid = `spark-${tone}-${title.replace(/\W/g, "")}`;

  return (
    <div className={cn("glass glass-hover relative overflow-hidden p-5", t.glow)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-400">{title}</p>
          <p className="mt-1.5 truncate">
            <AnimatedNumber
              value={value}
              format={formatFn}
              className="num text-xl font-black tracking-tight text-white sm:text-[22px]"
            />
          </p>
          <p className="mt-1 text-[10px] text-slate-500">{subtitle}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br",
            t.iconWrap,
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="h-9 w-24 sm:w-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.stroke} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={t.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={t.stroke}
                strokeWidth={1.8}
                fill={`url(#${gid})`}
                isAnimationActive
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {deltaPct !== undefined && (
          <span
            dir="ltr"
            className={cn(
              "num inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
              positive
                ? "border-persian-500/30 bg-persian-500/10 text-persian-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300",
            )}
          >
            {positive ? (
              <ArrowUpLeft className="h-3 w-3" />
            ) : (
              <ArrowDownLeft className="h-3 w-3" />
            )}
            {formatDecimal(Math.abs(deltaPct), 1)}٪
          </span>
        )}
      </div>
    </div>
  );
}
