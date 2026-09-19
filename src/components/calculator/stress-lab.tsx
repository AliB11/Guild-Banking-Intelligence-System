"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/animated-number";
import { formatDecimal, formatToman } from "@/lib/gbi/format";
import { runStressScenario } from "@/lib/gbi/engine";
import type { CalculatorInputs } from "@/lib/store";
import { cn } from "@/lib/utils";

function StressSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-slate-400">{label}</span>
        <span className="num rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-black text-slate-200">
          {display}
        </span>
      </div>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} className="mt-2" />
    </div>
  );
}

export function StressLab({ inputs }: { inputs: CalculatorInputs }) {
  const [volumeShockPct, setVolumeShockPct] = useState(-20);
  const [basketShockPct, setBasketShockPct] = useState(0);
  const [retentionDeltaDays, setRetentionDeltaDays] = useState(0);
  const [cccDeltaDays, setCccDeltaDays] = useState(10);
  const [supportCostShockPct, setSupportCostShockPct] = useState(10);

  const scenario = useMemo(
    () =>
      runStressScenario({
        calculator: inputs,
        volumeShockPct,
        basketShockPct,
        retentionDeltaDays,
        cccDeltaDays,
        supportCostShockPct,
      }),
    [inputs, volumeShockPct, basketShockPct, retentionDeltaDays, cccDeltaDays, supportCostShockPct],
  );

  const resilient = scenario.resilienceScore >= 70;
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-orange-300" />
            آزمایشگاه شوک نقدینگی
          </CardTitle>
          <CardDescription>
            اثر هم‌زمان افت گردش، تغییر رسوب، افزایش CCC و هزینه پشتیبانی را بدون تغییر داده پایه بسنجید.
          </CardDescription>
        </div>
        <Badge variant={resilient ? "persian" : "rose"}>
          {resilient ? "تاب‌آوری مناسب" : "نیازمند اقدام"} · {formatDecimal(scenario.resilienceScore, 0)}٪
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StressSlider label="شوک گردش" value={volumeShockPct} min={-60} max={30} step={5} display={`${formatDecimal(volumeShockPct, 0)}٪`} onChange={setVolumeShockPct} />
          <StressSlider label="شوک سبد خرید" value={basketShockPct} min={-40} max={30} step={5} display={`${formatDecimal(basketShockPct, 0)}٪`} onChange={setBasketShockPct} />
          <StressSlider label="تغییر مدت رسوب" value={retentionDeltaDays} min={-3} max={8} step={0.5} display={`${formatDecimal(retentionDeltaDays, 1)} روز`} onChange={setRetentionDeltaDays} />
          <StressSlider label="تغییر CCC" value={cccDeltaDays} min={-20} max={45} step={1} display={`${formatDecimal(cccDeltaDays, 0)} روز`} onChange={setCccDeltaDays} />
          <StressSlider label="شوک هزینه پشتیبانی" value={supportCostShockPct} min={0} max={50} step={5} display={`${formatDecimal(supportCostShockPct, 0)}٪`} onChange={setSupportCostShockPct} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-[10px] font-bold text-slate-500">حاشیه پایه</p>
            <AnimatedNumber value={scenario.base.netBankMargin} format={(value) => formatToman(value, { decimals: 1 })} className="num mt-1 block text-sm font-black text-slate-100" />
          </div>
          <div className={cn("rounded-xl border p-3", scenario.stressed.netBankMargin >= 0 ? "border-orange-500/25 bg-orange-500/[0.05]" : "border-rose-500/30 bg-rose-500/[0.08]")}>
            <p className="text-[10px] font-bold text-slate-500">حاشیه تحت تنش</p>
            <AnimatedNumber value={scenario.stressed.netBankMargin} format={(value) => formatToman(value, { decimals: 1 })} className={cn("num mt-1 block text-sm font-black", scenario.stressed.netBankMargin >= 0 ? "text-orange-200" : "text-rose-200")} />
          </div>
          <div className="rounded-xl border border-persian-500/20 bg-persian-500/[0.05] p-3">
            <p className="text-[10px] font-bold text-slate-500">تغییر سقف اعتبار</p>
            <p className={cn("num mt-1 text-sm font-black", scenario.delta.creditLimitRials >= 0 ? "text-persian-200" : "text-rose-200")}>
              {scenario.delta.creditLimitRials >= 0 ? "+" : ""}{formatToman(scenario.delta.creditLimitRials, { decimals: 1 })}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 font-bold text-slate-400"><Activity className="h-3.5 w-3.5 text-orange-300" />تغییر حاشیه</span>
              <span className={cn("num font-black", scenario.delta.marginPct >= 0 ? "text-persian-300" : "text-rose-300")}>
                {scenario.delta.marginPct >= 0 ? "+" : ""}{formatDecimal(scenario.delta.marginPct, 1)}٪
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className={cn("h-full rounded-full transition-all duration-500", scenario.delta.marginPct >= 0 ? "bg-persian-400" : "bg-rose-400")} style={{ width: `${Math.max(4, Math.min(100, Math.abs(scenario.delta.marginPct)))}%` }} />
            </div>
            <p className="mt-2 text-[9.5px] leading-5 text-slate-500">تغییر گردش: {formatDecimal(scenario.delta.volumePct, 1)}٪ · امتیاز تاب‌آوری: {formatDecimal(scenario.resilienceScore, 0)} از ۱۰۰</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              {resilient ? <ShieldCheck className="h-3.5 w-3.5 text-persian-300" /> : <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />}
              محرک‌های سناریو و اقدام پیشنهادی
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {scenario.drivers.map((driver) => <span key={driver} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-slate-300">{driver}</span>)}
            </div>
            <p className="mt-2 text-[9.5px] leading-5 text-slate-500">
              {resilient ? "پیشنهاد: سناریو را به‌عنوان حد کنترل عملیاتی ثبت و ماهانه بازبینی کنید." : "پیشنهاد: سقف اعتبار، هزینه پایانه و برنامه پیگیری شعب را پیش از تخصیص منابع بازبینی کنید."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
