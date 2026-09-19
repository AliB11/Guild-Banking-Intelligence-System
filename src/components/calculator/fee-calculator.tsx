"use client";

import { useState } from "react";
import { BadgePercent, Info, Wallet, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { faDigits, formatDecimal, formatNum, formatToman } from "@/lib/gbi/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AnimatedNumber } from "@/components/animated-number";
import { useCalculatorStore, type CalculatorInputs } from "@/lib/store";
import {
  CBI_POS_FEE_CAP_RIALS,
  CBI_POS_FEE_RATE,
  CBI_POS_FEE_SMALL_TX_RIALS,
  CBI_POS_FEE_SMALL_TX_THRESHOLD_RIALS,
  MODEL_VERSION,
  TERMINAL_MONTHLY_COST_RIALS,
  cbiPosFee,
} from "@/lib/gbi/engine";
import { CALCULATOR_PRESETS } from "@/lib/gbi/published-market";
import { getMarketDashboard } from "@/lib/gbi/market-view";

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

function scenario(inputs: CalculatorInputs, volumeMul = 1, basketMul = 1) {
  const basket = Math.max(10_000, Math.round(inputs.avgBasketRials * basketMul));
  const daily = Math.max(0, Math.round(inputs.dailyTxCount * volumeMul));
  const monthlyTxCount = daily * 30;
  const monthlyTxVolume = monthlyTxCount * basket;
  const feePerTx = cbiPosFee(basket);
  const ladderFees = Math.round(feePerTx * monthlyTxCount);
  const merchantPays = inputs.feeExempt ? 0 : ladderFees;
  const bankPays = inputs.feeExempt ? ladderFees : 0;
  const support = inputs.posUnits * TERMINAL_MONTHLY_COST_RIALS;
  const bankNet = merchantPays - bankPays - support;
  return {
    basket,
    monthlyTxCount,
    monthlyTxVolume,
    feePerTx,
    ladderFees,
    merchantPays,
    bankPays,
    support,
    bankNet,
  };
}

export function FeeCalculator() {
  const inputs = useCalculatorStore();
  const [presetId, setPresetId] = useState("");
  const [shockVolume, setShockVolume] = useState(0);
  const [shockBasket, setShockBasket] = useState(0);

  const base = scenario(inputs);
  const stressed = scenario(inputs, 1 + shockVolume / 100, 1 + shockBasket / 100);

  const applyPreset = (id: string) => {
    setPresetId(id);
    const preset = CALCULATOR_PRESETS.find((row) => row.id === id);
    if (!preset) return;
    inputs.applyPreset({
      avgBasketRials: preset.avgBasket,
      feeExempt: preset.feeExempt,
      dailyTxCount: preset.avgDailyTx > 0 ? preset.avgDailyTx : inputs.dailyTxCount,
    });
  };

  const updateInputs = (patch: Partial<CalculatorInputs>) => {
    setPresetId("");
    inputs.set(patch);
  };

  const selected = CALCULATOR_PRESETS.find((row) => row.id === presetId);
  const smallTx = inputs.avgBasketRials <= CBI_POS_FEE_SMALL_TX_THRESHOLD_RIALS;
  const publishedBaskets = getMarketDashboard().instruments;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <Card className="xl:col-span-2 animate-fade-up">
        <CardHeader>
          <div>
            <CardTitle>ورودی سناریوی کارتخوان</CardTitle>
            <CardDescription>تعداد روزانه فرض شعبه است، نه آمار یک فروشگاه حقیقی</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-persian-500/20 bg-persian-500/[0.05] p-4">
            <label className="mb-2 block text-[11px] font-extrabold text-persian-300">پیش‌تنظیم منتشرشده</label>
            <select
              value={presetId}
              onChange={(event) => applyPreset(event.target.value)}
              className="w-full appearance-none rounded-lg border border-white/10 bg-night-800 px-3 py-2.5 text-[12px] font-bold text-slate-100 focus:border-persian-500/50 focus:outline-none focus:ring-2 focus:ring-persian-500/20"
            >
              <option value="">— سناریوی دستی —</option>
              {CALCULATOR_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.title}
                </option>
              ))}
            </select>
            {selected && <p className="mt-2 text-[10px] leading-5 text-slate-400">{selected.note}</p>}
          </div>

          <ControlSlider
            label="تعداد تراکنش روزانه"
            hint="فرض شعبه برای یک پایانه؛ از شاپرک برای یک فروشگاه نیامده"
            value={inputs.dailyTxCount}
            display={`${formatNum(inputs.dailyTxCount)} تراکنش`}
            min={5}
            max={1200}
            step={5}
            onChange={(dailyTxCount) => updateInputs({ dailyTxCount })}
          />
          <ControlSlider
            label="مبلغ میانگین خرید (سبد)"
            hint="پیش‌فرض: سبد اعلامی کارتخوان مرداد ۱۴۰۵"
            value={inputs.avgBasketRials / 10}
            display={formatToman(inputs.avgBasketRials, { decimals: 1 })}
            min={100_000}
            max={50_000_000}
            step={10_000}
            onChange={(v) => updateInputs({ avgBasketRials: v * 10 })}
          />
          <ControlSlider
            label="تعداد دستگاه کارتخوان"
            hint="هزینه پشتیبانی مدل: ۱۵۰ هزار تومان در ماه برای هر دستگاه"
            value={inputs.posUnits}
            display={`${formatNum(inputs.posUnits)} دستگاه`}
            min={1}
            max={12}
            step={1}
            onChange={(posUnits) => updateInputs({ posUnits })}
          />

          <button
            type="button"
            onClick={() => updateInputs({ feeExempt: !inputs.feeExempt })}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border p-3.5 text-right transition-all",
              inputs.feeExempt
                ? "border-persian-500/35 bg-persian-500/[0.08]"
                : "border-white/[0.08] bg-white/[0.02]",
            )}
          >
            <span>
              <span className="block text-[11px] font-extrabold text-slate-200">معافیت کارمزد پذیرنده</span>
              <span className={cn("mt-0.5 block text-[9.5px]", inputs.feeExempt ? "text-persian-300" : "text-slate-500")}>
                {inputs.feeExempt
                  ? "نانوایی / سوپرمارکت — بانک کارمزد را می‌پردازد"
                  : "پلکان عمومی: پذیرنده می‌پردازد"}
              </span>
            </span>
            <Badge variant={inputs.feeExempt ? "persian" : "slate"}>
              {inputs.feeExempt ? "معاف" : "مشمول"}
            </Badge>
          </button>
        </CardContent>
      </Card>

      <div className="space-y-5 xl:col-span-3">
        <Card className="relative overflow-hidden animate-fade-up">
          <CardContent className="pt-6">
            <p className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <Wallet className="h-4 w-4 text-gold-400" />
              نتیجه ماهانه سناریو برای بانک پذیرنده
            </p>
            <p className="mt-2">
              <AnimatedNumber
                value={base.bankNet}
                format={(n) => formatToman(n, { decimals: 1 })}
                className={cn(
                  "num text-3xl font-black tracking-tight sm:text-4xl",
                  base.bankNet >= 0 ? "gold-text" : "text-rose-300",
                )}
              />
            </p>
            <p className="num mt-2 text-[11px] text-slate-500">
              گردش {formatToman(base.monthlyTxVolume, { decimals: 1 })}
              <span className="mx-2 text-slate-700">·</span>
              {formatNum(base.monthlyTxCount)} تراکنش
              <span className="mx-2 text-slate-700">·</span>
              کارمزد هر تراکنش {formatToman(base.feePerTx, { decimals: 0 })}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="animate-fade-up">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BadgePercent className="h-4 w-4 text-gold-400" />
                  پلکان بانک مرکزی
                </CardTitle>
                <CardDescription>فرض مدل روی کارتخوان؛ شاپرک این رقم را برای یک فروشگاه منتشر نکرده</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-[12px] leading-6 text-slate-400">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <p className="flex items-center gap-2 text-[11px] font-extrabold text-slate-200">
                  <Info className="h-3.5 w-3.5 text-sky-300" />
                  {smallTx
                    ? `سبد ≤ ${formatToman(CBI_POS_FEE_SMALL_TX_THRESHOLD_RIALS)} ← کارمزد ثابت ${formatToman(CBI_POS_FEE_SMALL_TX_RIALS, { decimals: 0 })}`
                    : `سبد بالاتر از آستانه ← ${formatDecimal(CBI_POS_FEE_RATE * 100, 2)}٪ تا سقف ${formatToman(CBI_POS_FEE_CAP_RIALS, { decimals: 0 })}`}
                </p>
              </div>
              <p>
                کارمزد پلکان ماهانه:{" "}
                <b className="text-gold-200">{formatToman(base.ladderFees, { decimals: 1 })}</b>
              </p>
              <p>
                سهم پذیرنده:{" "}
                <b className="text-slate-100">{formatToman(base.merchantPays, { decimals: 1 })}</b>
              </p>
              <p>
                سهم بانک (معافیت):{" "}
                <b className="text-rose-200">{formatToman(base.bankPays, { decimals: 1 })}</b>
              </p>
              <p>
                هزینه پشتیبانی پایانه:{" "}
                <b className="text-rose-200">−{formatToman(base.support, { decimals: 1 })}</b>
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: "0.06s" }}>
            <CardHeader>
              <div>
                <CardTitle>آزمایش شوک فروش</CardTitle>
                <CardDescription>فقط روی تعداد و سبد همین سناریو؛ رسوب و اعتبار اینجا نیست</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ControlSlider
                label="تغییر تعداد تراکنش"
                hint="درصد نسبت به سناریوی پایه"
                value={shockVolume}
                display={`${shockVolume >= 0 ? "+" : ""}${faDigits(shockVolume)}٪`}
                min={-50}
                max={50}
                step={5}
                onChange={setShockVolume}
              />
              <ControlSlider
                label="تغییر سبد"
                hint="درصد نسبت به سبد فعلی"
                value={shockBasket}
                display={`${shockBasket >= 0 ? "+" : ""}${faDigits(shockBasket)}٪`}
                min={-50}
                max={50}
                step={5}
                onChange={setShockBasket}
              />
              <p className="num text-[12px] text-slate-400">
                نتیجه شوک:{" "}
                <b className={stressed.bankNet >= 0 ? "text-gold-200" : "text-rose-300"}>
                  {formatToman(stressed.bankNet, { decimals: 1 })}
                </b>
                <span className="mx-2 text-slate-700">·</span>
                اختلاف {formatToman(stressed.bankNet - base.bankNet, { decimals: 1 })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-up">
          <CardContent className="flex items-start gap-3 pt-5">
            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="num text-[10.5px] leading-6 text-slate-500" dir="rtl">
              مدل {MODEL_VERSION}: کارمزد فقط پلکان کارتخوان بانک مرکزی است و به اینترنت/موبایل اعمال نمی‌شود. هزینه پایانه{" "}
              {formatToman(TERMINAL_MONTHLY_COST_RIALS, { decimals: 0 })} در ماه برای هر دستگاه، فرض داخلی است نه ابلاغ شاپرک.
              رسوب CASA و سقف تسهیلات در منبع عمومی نیست و در این صفحه حساب نمی‌شود.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
