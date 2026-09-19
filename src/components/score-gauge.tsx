"use client";

import { faDigits, formatDecimal } from "@/lib/gbi/format";
import { cn } from "@/lib/utils";

export function ScoreGauge({
  score,
  size = 132,
  label = "امتیاز سرنخ",
  className,
}: {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const tone =
    clamped >= 75 ? "#f5c860" : clamped >= 55 ? "#3bd6c8" : clamped >= 35 ? "#a78bfa" : "#fb7185";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 110 110" width={size} height={size} className="-rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(148,178,255,0.1)" strokeWidth="9" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1), stroke 0.4s" }}
        />
        <circle cx="55" cy="55" r="37.5" fill="none" stroke="rgba(148,178,255,0.05)" strokeWidth="1" strokeDasharray="3 4" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-2xl font-black" style={{ color: tone }}>
          {formatDecimal(clamped, 0)}
        </span>
        <span className="mt-0.5 text-[9.5px] font-bold text-slate-500">{label}</span>
        <span className="text-[8.5px] text-slate-600">از {faDigits(100)}</span>
      </div>
    </div>
  );
}
