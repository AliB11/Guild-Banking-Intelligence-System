"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Vault,
  BadgePercent,
  Landmark,
  Wallet,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Info,
  ChevronLeft,
  CircleCheckBig,
  CircleX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { faDigits, formatDecimal, formatNum, formatToman } from "@/lib/gbi/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScoreGauge } from "@/components/score-gauge";
import { AnimatedNumber } from "@/components/animated-number";
import { useCalculatorStore, type CalculatorInputs } from "@/lib/store";
import { runCalculatorClient } from "@/lib/gbi/client-data";
import { StressLab } from "./stress-lab";
import { PRODUCT_LABELS, RISK_LABELS } from "@/lib/gbi/types";
import type { CalculatorInput, CalculatorResult } from "@/lib/gbi/engine";
import type { RiskStatus } from "@/db/schema";

export interface GuildPreset {
  id: string;
  title: string;
  categoryName: string;
  cccDays: number;
  intaProfitRatio: number;
  avgBasket: number;
  avgDailyTx: number;
  note?: string;
}

/* --------------------------------------------------------------------- */

function ControlSlider({
  label,
  hint,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-extrabold text-slate-200">{label}</p>
          <p className="mt-0.5 text-[9.5px] text-slate-600">{hint}</p>
        </div>
        <span className="num rounded-lg border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-[12px] font-black text-gold-300">
          {display}
        </span>
      </div>
      <Slider value={value} onChange={onChange} min={min} max={max} step={step} className="mt-3" />
      <div className="num mt-1.5 flex justify-between text-[9px] text-slate-600">
        <span>{faDigits(max.toLocaleString("en-US"))}</span>
        <span>{faDigits(min.toLocaleString("en-US"))}</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */

function BreakdownBar({ r }: { r: CalculatorResult }) {
  const positives = [
    { key: "float", label: "حاشیه رسوب", value: r.floatMargin, color: "#3bd6c8" },
    { key: "fees", label: "کارمزد پذیرندگی", value: r.monthlyAcquiringFees, color: "#f5c860" },
    { key: "credit", label: "حاشیه تسهیلات", value: r.creditFacilityMargin, color: "#a78bfa" },
  ];
  const totalPos = positives.reduce((a, p) => a + p.value, 0);
  const maxAmt = Math.max(1, ...positives.map((p) => p.value), r.operatingSupportCost);
  return (
    <div className="space-y-3">
      {positives.map((p) => (
        <div key={p.key}>
          <div className="mb-1 flex items-center justify-between text-[10.5px]">
            <span className="font-bold text-slate-400">{p.label}</span>
            <span className="num font-black text-slate-100">{formatToman(p.value, { decimals: 1 })}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(p.value / maxAmt) * 100}%`,
                background: `linear-gradient(90deg, ${p.color}66, ${p.color})`,
                boxShadow: `0 0 12px ${p.color}55`,
              }}
            />
          </div>
        </div>
      ))}
      <div>
        <div className="mb-1 flex items-center justify-between text-[10.5px]">
          <span className="font-bold text-rose-300">هزینه پشتیبانی پایانه (کسری)</span>
          <span className="num font-black text-rose-300">−{formatToman(r.operatingSupportCost, { decimals: 1 })}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className="h-full rounded-full bg-rose-500/70 transition-all duration-700"
            style={{ width: `${(r.operatingSupportCost / maxAmt) * 100}%` }}
          />
        </div>
      </div>
      <div className="num flex justify-between border-t border-white/[0.07] pt-2.5 text-[10px] text-slate-500">
        <span>مجموع درآمد ناخالص: {formatToman(totalPos, { decimals: 1 })}</span>
        <span>بازده عملیاتی: {formatDecimal(r.roiPercent, 0)}٪</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */

export function ProfitCalculator({ presets }: { presets: GuildPreset[] }) {
  const inputs = useCalculatorStore();
  const [guildId, setGuildId] = useState<string>("");
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSequence = useRef(0);

  const mutation = useMutation<CalculatorResult, Error, CalculatorInput>({
    mutationFn: async (payload) => {
      try {
        return runCalculatorClient(payload);
      } catch {
        throw new Error("محاسبه سودآوری ناموفق بود");
      }
    },
  });

  const payload = useMemo(
    () => ({
      dailyTxCount: inputs.dailyTxCount,
      avgBasketRials: inputs.avgBasketRials,
      retentionDays: inputs.retentionDays,
      posUnits: inputs.posUnits,
      cccDays: inputs.cccDays,
      isTaxCompliant: inputs.isTaxCompliant,
      riskStatus: inputs.riskStatus,
    }),
    [
      inputs.dailyTxCount,
      inputs.avgBasketRials,
      inputs.retentionDays,
      inputs.posUnits,
      inputs.cccDays,
      inputs.isTaxCompliant,
      inputs.riskStatus,
    ],
  );

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const requestId = ++requestSequence.current;
    timer.current = setTimeout(() => {
      mutation.mutate(payload, {
        onSuccess: (nextResult) => {
          // Slider changes can overlap on a slow network. Never let an older
          // response overwrite the currently visible scenario.
          if (requestId !== requestSequence.current) return;
          setResult(nextResult);
          setCalculationError(null);
        },
        onError: () => {
          if (requestId === requestSequence.current) {
            setCalculationError("ارتباط با موتور محاسبه برقرار نشد؛ دوباره تلاش کنید.");
          }
        },
      });
    }, 240);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // mutation is a stable React Query action; payload is the only input that
    // should schedule a recalculation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  const applyPreset = (id: string) => {
    setGuildId(id);
    const g = presets.find((p) => p.id === id);
    if (g && g.avgBasket > 0) {
      const basketToman = Math.min(50_000_000, Math.max(100_000, Math.round(g.avgBasket / 10)));
      inputs.applyGuildPreset(
        g.cccDays,
        basketToman * 10,
        g.avgDailyTx > 0 ? Math.min(1200, Math.max(5, g.avgDailyTx)) : inputs.dailyTxCount,
      );
    }
  };

  const updateInputs = (patch: Partial<CalculatorInputs>) => {
    setGuildId("");
    inputs.set(patch);
  };
  const selectedGuild = presets.find((p) => p.id === guildId);
  const feeTier = inputs.avgBasketRials < 6_000_000;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      {/* -------------------- Controls -------------------- */}
      <Card className="xl:col-span-2 animate-fade-up">
        <CardHeader>
          <div>
            <CardTitle>ورودی‌های سناریو</CardTitle>
            <CardDescription>پروفایل عملیاتی پذیرنده را تنظیم کنید تا موتور سودآوری به‌صورت آنی محاسبه کند</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Guild preset */}
          <div className="rounded-xl border border-persian-500/20 bg-persian-500/[0.05] p-4">
            <label className="mb-2 block text-[11px] font-extrabold text-persian-300">
              پروفایل آماده رسته شغلی
            </label>
            <select
              value={guildId}
              onChange={(e) => applyPreset(e.target.value)}
              className="w-full appearance-none rounded-lg border border-white/10 bg-night-800 px-3 py-2.5 text-[12px] font-bold text-slate-100 focus:border-persian-500/50 focus:outline-none focus:ring-2 focus:ring-persian-500/20"
            >
              <option value="">— سناریوی دستی —</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.categoryName})
                </option>
              ))}
            </select>
            {selectedGuild && (
              <p className="num mt-2 text-[10px] leading-5 text-slate-400">
                {selectedGuild.note ??
                  `ضریب اینتاکد: ${selectedGuild.intaProfitRatio > 0 ? `${formatDecimal(selectedGuild.intaProfitRatio, 1)}٪` : "نقل نشده"} · سبد: ${formatToman(selectedGuild.avgBasket, { decimals: 1 })}`}
              </p>
            )}
          </div>

          <ControlSlider
            label="تعداد تراکنش روزانه"
            hint="میانگین تراکنش موفق کارتخوان در روز"
            value={inputs.dailyTxCount}
            display={`${formatNum(inputs.dailyTxCount)} تراکنش`}
            min={5}
            max={1200}
            step={5}
            onChange={(dailyTxCount) => updateInputs({ dailyTxCount })}
          />
          <ControlSlider
            label="مبلغ میانگین خرید (سبد)"
            hint="متوسط مبلغ هر تراکنش"
            value={inputs.avgBasketRials / 10}
            display={formatToman(inputs.avgBasketRials, { decimals: 1 })}
            min={100_000}
            max={50_000_000}
            step={10_000}
            onChange={(v) => updateInputs({ avgBasketRials: v * 10 })}
          />
          <ControlSlider
            label="مدت رسوب وجوه"
            hint="روزهایی که وجوه فروش در حساب جاری می‌ماند"
            value={inputs.retentionDays}
            display={`${formatDecimal(inputs.retentionDays, 1)} روز`}
            min={0}
            max={30}
            step={0.5}
            onChange={(retentionDays) => updateInputs({ retentionDays })}
          />
          <ControlSlider
            label="تعداد دستگاه کارتخوان"
            hint="پایانه‌های فعال تحت پوشش بانک"
            value={inputs.posUnits}
            display={`${formatNum(inputs.posUnits)} دستگاه`}
            min={1}
            max={12}
            step={1}
            onChange={(posUnits) => updateInputs({ posUnits })}
          />
          <ControlSlider
            label="چرخه تبدیل نقد (CCC)"
            hint="DIO + DSO − DPO بر اساس رسته شغلی"
            value={inputs.cccDays}
            display={`${formatDecimal(inputs.cccDays, 0)} روز`}
            min={-15}
            max={120}
            step={1}
            onChange={(cccDays) => updateInputs({ cccDays })}
          />

          {/* Toggles */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => updateInputs({ isTaxCompliant: !inputs.isTaxCompliant })}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3.5 text-right transition-all",
                inputs.isTaxCompliant
                  ? "border-persian-500/35 bg-persian-500/[0.08]"
                  : "border-rose-500/30 bg-rose-500/[0.06]",
              )}
            >
              <span>
                <span className="block text-[11px] font-extrabold text-slate-200">سامانه مؤدیان</span>
                <span className={cn("mt-0.5 block text-[9.5px]", inputs.isTaxCompliant ? "text-persian-300" : "text-rose-300")}>
                  {inputs.isTaxCompliant ? "متصل — مالیات پایانه‌ای فعال" : "غیرمتصل — جریمه امتیاز ۳۰"}
                </span>
              </span>
              {inputs.isTaxCompliant ? (
                <ShieldCheck className="h-5 w-5 text-persian-400" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-rose-400" />
              )}
            </button>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <p className="mb-2 text-[11px] font-extrabold text-slate-200">وضعیت ریسک بانکی</p>
              <div className="flex gap-1.5">
                {(["LOW", "MEDIUM", "HIGH"] as RiskStatus[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => updateInputs({ riskStatus: r })}
                    className={cn(
                      "flex-1 rounded-lg border px-1 py-1.5 text-[9.5px] font-bold transition-all",
                      inputs.riskStatus === r
                        ? r === "LOW"
                          ? "border-persian-500/40 bg-persian-500/15 text-persian-300"
                          : r === "MEDIUM"
                            ? "border-gold-500/40 bg-gold-500/15 text-gold-300"
                            : "border-rose-500/40 bg-rose-500/15 text-rose-300"
                        : "border-white/10 text-slate-500 hover:text-slate-300",
                    )}
                  >
                    {RISK_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* -------------------- Results -------------------- */}
      <div className="space-y-5 xl:col-span-3">
        {calculationError && (
          <div role="alert" className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-[11px] font-bold text-rose-300">
            {calculationError}
          </div>
        )}
        {/* Hero margin */}
        <Card className="relative overflow-hidden animate-fade-up">
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(245,200,96,0.14),transparent_65%)]" />
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                  <Wallet className="h-4 w-4 text-gold-400" />
                  حاشیه خالص ماهانه بانک (Π<sub>Bank</sub>)
                  {mutation.isPending && <Badge variant="gold">در حال محاسبه…</Badge>}
                </p>
                <p className="mt-2">
                  <AnimatedNumber
                    value={result?.netBankMargin ?? 0}
                    format={(n) => formatToman(n, { decimals: 1 })}
                    className={cn(
                      "num text-3xl font-black tracking-tight sm:text-4xl",
                      (result?.netBankMargin ?? 0) >= 0 ? "gold-text" : "text-rose-300",
                    )}
                  />
                </p>
                <p className="num mt-2 text-[11px] text-slate-500">
                  گردش ماهانه {result ? formatToman(result.monthlyTxVolume, { decimals: 1 }) : "…"}
                  <span className="mx-2 text-slate-700">·</span>
                  {result ? `${formatNum(result.monthlyTxCount)} تراکنش` : "…"}
                  <span className="mx-2 text-slate-700">·</span>
                  رسوب برآوردی {result ? formatToman(result.avgDailyFloat, { decimals: 1 }) : "…"}
                </p>
              </div>
              <ScoreGauge score={result?.leadScore.total ?? 0} label="امتیاز اولویت سرنخ" />
            </div>
          </CardContent>
        </Card>

        <StressLab inputs={payload} />

        {/* Breakdown + score mix */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="animate-fade-up">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Vault className="h-4 w-4 text-persian-400" />
                  شکست اجزای حاشیه
                </CardTitle>
                <CardDescription>رسوب + کارمزد + تسهیلات − هزینه پشتیبانی</CardDescription>
              </div>
            </CardHeader>
            <CardContent>{result ? <BreakdownBar r={result} /> : <SkeletonRows />}</CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: "0.06s" }}>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BadgePercent className="h-4 w-4 text-gold-400" />
                  کارمزد شاپرک و وزن امتیاز
                </CardTitle>
                <CardDescription>منطق پلکانی بانک مرکزی + ترکیب امتیاز سرنخ</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <p className="flex items-center gap-2 text-[11px] font-extrabold text-slate-200">
                  <Info className="h-3.5 w-3.5 text-sky-300" />
                  نرخ کارمزد هر تراکنش طبق بخش‌نامه
                </p>
                <p className="num mt-1.5 text-[11px] leading-6 text-slate-400">
                  {feeTier
                    ? "سبد زیر ۶۰۰ هزار تومان ← کارمزد ثابت ۱۲۰ تومان"
                    : "سبد بالای ۶۰۰ هزار تومان ← ۰/۰۲٪ مبلغ، سقف ۴ هزار تومان"}
                </p>
                <p className="num mt-1 text-[12px] font-black text-gold-300">
                  کارمزد فعلی هر تراکنش: {result ? faDigits(formatNum(result.feePerTx / 10)) : "…"} تومان
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { label: "رسوب (۳۵٪)", value: result?.leadScore.floatScore ?? 0, color: "#3bd6c8" },
                  { label: "گردش (۲۵٪)", value: result?.leadScore.volumeScore ?? 0, color: "#f5c860" },
                  { label: "تناسب اعتباری (۲۰٪)", value: result?.leadScore.creditScore ?? 0, color: "#a78bfa" },
                  { label: "انطباق مالیاتی (۲۰٪)", value: result?.leadScore.taxScore ?? 0, color: "#fb7185" },
                ].map((w) => (
                  <div key={w.label} className="flex items-center gap-2.5">
                    <span className="w-28 text-[9.5px] font-bold text-slate-500">{w.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w.value}%`, background: w.color }} />
                    </div>
                    <span className="num w-9 text-left text-[10px] font-black text-slate-300">{formatDecimal(w.value, 0)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credit plans */}
        <Card className="animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-gold-400" />
                سقف تسهیلات پیشنهادی — طرح‌های پذیرنده
              </CardTitle>
              <CardDescription>بر اساس گردش کارتخوان، رسوب پایدار، امتیاز سرنخ و وضعیت ریسک</CardDescription>
            </div>
            {result && (
              <Badge variant="violet" className="whitespace-nowrap">
                <Sparkles className="h-3 w-3" />
                {PRODUCT_LABELS[result.recommendedProduct]}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(result?.creditQuotes ?? []).map((q) => (
                <div
                  key={q.plan.code}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
                    q.eligible
                      ? "border-gold-500/30 bg-gradient-to-b from-gold-500/[0.08] to-transparent"
                      : "border-white/[0.07] bg-white/[0.02] opacity-70",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-extrabold text-slate-100">{q.plan.name}</p>
                    {q.eligible ? (
                      <CircleCheckBig className="h-4 w-4 text-persian-400" />
                    ) : (
                      <CircleX className="h-4 w-4 text-rose-400/70" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-slate-600" dir="ltr">
                    {q.plan.nameLatin}
                  </p>
                  <p className={cn("num mt-3 text-lg font-black", q.eligible ? "text-gold-300" : "text-slate-500")}>
                    {q.eligible ? formatToman(q.proposedLimitRials, { decimals: 1 }) : "غیرواجد شرایط"}
                  </p>
                  <p className="num mt-1 text-[9.5px] text-slate-500">
                    سقف طرح: {formatToman(q.plan.ceilingRials, { decimals: 0 })} · ضریب {formatDecimal(q.plan.volumeFactor * 100, 0)}٪ گردش
                  </p>
                  <p className="mt-2 flex items-start gap-1 border-t border-white/[0.06] pt-2 text-[9.5px] leading-4 text-slate-500">
                    <ChevronLeft className="mt-0.5 h-3 w-3 shrink-0" />
                    {q.eligible ? q.plan.description : q.reason}
                  </p>
                </div>
              ))}
              {!result && [0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-white/[0.03]" />)}
            </div>
            {result && result.bestCreditLimit > 0 && (
              <div className="num mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-persian-500/25 bg-persian-500/[0.06] px-4 py-3 text-[11px]">
                <span className="font-bold text-persian-200">
                  بهترین سقف قابل پیشنهاد: {formatToman(result.bestCreditLimit, { decimals: 1 })}
                </span>
                <span className="text-slate-400">
                  حاشیه ماهانه تسهیلات برای بانک:{" "}
                  <b className="text-persian-300">{formatToman(result.creditFacilityMargin, { decimals: 1 })}</b>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formula note */}
        <Card className="animate-fade-up">
          <CardContent className="flex items-start gap-3 pt-5">
            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="num text-[10.5px] leading-6 text-slate-500" dir="rtl">
              مدل محاسباتی: حاشیه رسوب = میانگین مانده روزانه × (نرخ تسهیلات {formatDecimal(23, 0)}٪ − سپرده قانونی {formatDecimal(13, 0)}٪) ÷ ۱۲ ·
              کارمزد پذیرندگی طبق پلکان بانک مرکزی · حاشیه تسهیلات = سقف اعتبار × اسپرد ۴٪ ÷ ۱۲ · هزینه پایانه = {formatNum(150_000)} تومان
              ماهانه برای هر دستگاه. نسخه مدل: {result?.modelVersion ?? "GBI-ΠBank-1.7.0"} · ارقام سناریوی شعبه است نه پرونده یک پذیرنده حقیقی.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.03]" />
      ))}
    </div>
  );
}
