"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDecimal, formatToman, faDigits } from "@/lib/gbi/format";
import type { BcgMatrix, BcgQuadrant } from "@/lib/gbi/types";
import { cn } from "@/lib/utils";

const QUADRANTS: Record<BcgQuadrant, { label: string; color: string }> = {
  STAR: { label: "ستاره", color: "#f5c860" },
  CASH_COW: { label: "گاو شیرده", color: "#3bd6c8" },
  QUESTION_MARK: { label: "علامت سؤال", color: "#a78bfa" },
  DOG: { label: "سگ", color: "#64748b" },
};

export function BcgMatrix({ data }: { data: BcgMatrix }) {
  const [selectedId, setSelectedId] = useState(data.points[0]?.id ?? "");
  const selected = data.points.find((point) => point.id === selectedId) ?? data.points[0];
  const width = 900;
  const height = 470;
  const left = 82;
  const right = 858;
  const top = 36;
  const bottom = 344;
  const growthValues = data.points.map((point) => point.growthPct);
  const minGrowth = Math.min(data.growthCutoffPct - 8, ...growthValues, -5);
  const maxGrowth = Math.max(data.growthCutoffPct + 8, ...growthValues, 5);
  const xCutoff = left + ((data.shareCutoffPct / 100) * (right - left));
  const yCutoff = bottom - ((data.growthCutoffPct - minGrowth) / Math.max(1, maxGrowth - minGrowth)) * (bottom - top);
  const maxMargin = Math.max(1, ...data.points.map((point) => Math.abs(point.bankNetMargin)));

  const pointPosition = (point: BcgMatrix["points"][number]) => ({
    x: left + (point.relativeSharePct / 100) * (right - left),
    y: bottom - ((point.growthPct - minGrowth) / Math.max(1, maxGrowth - minGrowth)) * (bottom - top),
  });

  const grouped = useMemo(() => {
    return (Object.keys(QUADRANTS) as BcgQuadrant[]).map((quadrant) => ({
      quadrant,
      count: data.points.filter((point) => point.quadrant === quadrant).length,
    }));
  }, [data.points]);

  if (data.points.length === 0) {
    return <div className="flex h-96 items-center justify-center text-sm text-slate-500">داده‌ای برای ماتریس بوستون وجود ندارد.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-night-950/40 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="ماتریس بوستون رسته‌های شغلی" className="min-w-[680px] w-full">
          <rect x={left} y={top} width={xCutoff - left} height={yCutoff - top} fill="#a78bfa" fillOpacity="0.07" />
          <rect x={xCutoff} y={top} width={right - xCutoff} height={yCutoff - top} fill="#f5c860" fillOpacity="0.08" />
          <rect x={left} y={yCutoff} width={xCutoff - left} height={bottom - yCutoff} fill="#64748b" fillOpacity="0.08" />
          <rect x={xCutoff} y={yCutoff} width={right - xCutoff} height={bottom - yCutoff} fill="#3bd6c8" fillOpacity="0.08" />
          <line x1={xCutoff} y1={top} x2={xCutoff} y2={bottom} stroke="rgba(148,178,255,0.25)" strokeDasharray="5 5" />
          <line x1={left} y1={yCutoff} x2={right} y2={yCutoff} stroke="rgba(148,178,255,0.25)" strokeDasharray="5 5" />
          <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="rgba(148,178,255,0.35)" />
          <line x1={left} y1={top} x2={left} y2={bottom} stroke="rgba(148,178,255,0.35)" />

          <text x={left + 12} y={top + 22} fill="#a78bfa" fontSize="15" fontWeight="800">علامت سؤال</text>
          <text x={right - 12} y={top + 22} textAnchor="end" fill="#f5c860" fontSize="15" fontWeight="800">ستاره</text>
          <text x={left + 12} y={bottom - 12} fill="#7c8db0" fontSize="15" fontWeight="800">سگ</text>
          <text x={right - 12} y={bottom - 12} textAnchor="end" fill="#3bd6c8" fontSize="15" fontWeight="800">گاو شیرده</text>

          <text x={(left + right) / 2} y={height - 16} textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="700">سهم نسبی گردش رسته از بزرگ‌ترین رسته داخلی</text>
          <text x={18} y={(top + bottom) / 2} transform={`rotate(-90 18 ${(top + bottom) / 2})`} textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="700">رشد گردش نسبت به دوره قبل</text>
          <text x={left} y={bottom + 20} fill="#64748b" fontSize="10">سهم کم</text>
          <text x={right} y={bottom + 20} textAnchor="end" fill="#64748b" fontSize="10">سهم زیاد</text>
          <text x={left - 8} y={bottom + 4} textAnchor="end" fill="#64748b" fontSize="10">{formatDecimal(minGrowth, 0)}٪</text>
          <text x={left - 8} y={top + 4} textAnchor="end" fill="#64748b" fontSize="10">{formatDecimal(maxGrowth, 0)}٪</text>

          {data.points.map((point) => {
            const position = pointPosition(point);
            const meta = QUADRANTS[point.quadrant];
            const radius = 7 + (Math.abs(point.bankNetMargin) / maxMargin) * 13;
            const active = selected?.id === point.id;
            return (
              <g key={point.id} className="cursor-pointer" onClick={() => setSelectedId(point.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(point.id); }}>
                {active && <circle cx={position.x} cy={position.y} r={radius + 6} fill="none" stroke={meta.color} strokeOpacity="0.35" strokeWidth="2" />}
                <circle cx={position.x} cy={position.y} r={radius} fill={meta.color} fillOpacity={point.isProfitable ? 0.7 : 0.25} stroke={point.isProfitable ? meta.color : "#fb7185"} strokeWidth={active ? 3 : 1.5} />
                {active && <text x={position.x} y={position.y - radius - 8} textAnchor="middle" fill="#e6ecf5" fontSize="11" fontWeight="800">{point.title}</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        {grouped.map(({ quadrant, count }) => {
          const meta = QUADRANTS[quadrant];
          return <Badge key={quadrant} variant="slate" className="gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />{meta.label}: {faDigits(count)}</Badge>;
        })}
        <Badge variant="gold">مرز رشد: {formatDecimal(data.growthCutoffPct, 1)}٪</Badge>
      </div>

      {selected && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gold-500/20 bg-gold-500/[0.04] p-4 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-black text-white">{selected.title}</h4>
              <Badge variant="slate">{selected.categoryName}</Badge>
              <Badge variant={selected.isProfitable ? "persian" : "rose"}>{selected.profitabilityLabel}</Badge>
              <Badge variant="gold">{QUADRANTS[selected.quadrant].label}</Badge>
            </div>
            <p className="mt-2 text-[10px] leading-5 text-slate-400">
              حاشیه خالص بانک: <b className="text-gold-200">{formatToman(selected.bankNetMargin)}</b> · مشارکت مستقیم پذیرندگی: <b className={selected.paymentContribution >= 0 ? "text-persian-200" : "text-rose-200"}>{formatToman(selected.paymentContribution)}</b>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-left text-[10px]">
            <div><p className="text-slate-600">سهم شبکه</p><p className="num mt-1 font-black text-slate-200">{formatDecimal(selected.marketSharePct, 1)}٪</p></div>
            <div><p className="text-slate-600">رشد</p><p className={cn("num mt-1 font-black", selected.growthPct >= 0 ? "text-persian-300" : "text-rose-300")}>{formatDecimal(selected.growthPct, 1)}٪</p></div>
            <div><p className="text-slate-600">حاشیه</p><p className="num mt-1 font-black text-slate-200">{formatDecimal(selected.marginPct, 1)}٪</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-[10.5px] leading-6 text-slate-400 md:grid-cols-2">
        <div>
          <p className="font-black text-slate-200">فرمول سوددهی عملیاتی</p>
          <p className="mt-1">حاشیه خالص = کارمزد خرید کارتی + رسوب × ({formatDecimal(data.assumptions.lendingRate * 100, 1)}٪ − {formatDecimal(data.assumptions.reserveRatio * 100, 1)}٪) ÷ ۱۲ − هزینه پایانه.</p>
          <p className="mt-1 text-slate-500">هزینه پایانه: {formatToman(data.assumptions.terminalMonthlyCostRials)} در ماه برای هر پایانه.</p>
        </div>
        <div>
          <p className="font-black text-slate-200">فرض کارمزد خرید کارتی</p>
          <p className="mt-1">کمتر از {formatDecimal(data.assumptions.smallTransactionThresholdRials, 0)} ریال: {formatDecimal(data.assumptions.smallTransactionFeeRials, 0)} ریال؛ بالاتر: {formatDecimal(data.assumptions.transactionFeeRate * 100, 2)}٪ با سقف {formatDecimal(data.assumptions.transactionFeeCapRials, 0)} ریال.</p>
          <p className="mt-1 text-slate-500">این نرخ‌ها assumption مدل‌اند و باید با ابلاغیه/قرارداد فعال بانک در production تطبیق داده شوند.</p>
        </div>
      </div>
      <p className="text-[10px] leading-6 text-slate-500">{data.methodology} این ماتریس، طبقه‌بندی تصمیم‌یار داخلی است و جایگزین مجوز، بخشنامه یا تصمیم اعتباری بانک نیست.</p>
    </div>
  );
}
