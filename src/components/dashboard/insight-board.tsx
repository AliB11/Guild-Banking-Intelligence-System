"use client";

import Link from "next/link";
import { Printer, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { faDigits, formatCount, formatDecimal, formatPercent, formatToman } from "@/lib/gbi/format";
import type { MarketDashboard } from "@/lib/gbi/market-view";
import { OriginChip } from "@/components/explain/origin-chip";

export function InsightBoard({ market }: { market: MarketDashboard }) {
  const maxBasket = Math.max(...market.instruments.map((row) => row.basketRials), 1);
  const maxVolume = Math.max(...market.trend.map((row) => row.volume), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print-hide">
        <p className="text-[12px] font-extrabold text-slate-300">خوانش از روی همان ارقام — بدون پرونده جدید</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/brief/"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-[11px] font-bold text-gold-200 transition hover:border-gold-400/50"
          >
            <ScrollText className="h-3.5 w-3.5" />
            نامه ستاد
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:border-gold-500/30 hover:text-gold-200"
          >
            <Printer className="h-3.5 w-3.5" />
            چاپ میز کار
          </button>
        </div>
      </div>

      <section className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="glass p-5">
          <p className="text-[10.5px] font-bold text-slate-500">فاصله رشد مبلغ و تعداد</p>
          <p className="num mt-2 text-2xl font-black text-gold-200">{formatPercent(market.ticketGapPct)}</p>
          <p className="mt-2 text-[11.5px] leading-6 text-slate-400">
            MoM نقل‌شده: مبلغ {formatPercent(market.citedMom.valuePct)} در برابر تعداد {formatPercent(market.citedMom.countPct)}.
            سبد شبکه سنگین‌تر شده؛ این به معنی ورود فروشگاه جدید نیست.
          </p>
        </article>
        <article className="glass p-5">
          <p className="text-[10.5px] font-bold text-slate-500">اسمی در برابر واقعی</p>
          <p className="num mt-2 text-2xl font-black text-rose-200">{formatPercent(market.citedYoy.valueNominalPct)}</p>
          <p className="mt-2 text-[11.5px] leading-6 text-slate-400">
            رشد سالانه مبلغ اسمی مرداد. رشد واقعی حدود {formatPercent(market.citedYoy.valueRealApproxPct)} و تعداد{" "}
            {formatPercent(market.citedYoy.countPct)} نقل شده — تورم قیمت، نه انفجار تراکنش.
          </p>
        </article>
        <article className="glass p-5">
          <p className="text-[10.5px] font-bold text-slate-500">ملت × جمع شبکه</p>
          <p className="num mt-2 text-2xl font-black text-persian-200">{formatToman(market.mellat.impliedVolume)}</p>
          <p className="mt-2 text-[11.5px] leading-6 text-slate-400">
            {formatPercent(market.mellat.valuePct, 2)} مبلغ × {formatToman(market.totals.volume)}. حدود{" "}
            {formatCount(market.mellat.impliedCount, 0)} تراکنش. شاپرک رقم مطلق ملت را جدا نداده.
          </p>
        </article>
        <article className="glass p-5">
          <p className="text-[10.5px] font-bold text-slate-500">سبد اینترنت نسبت به کارتخوان</p>
          <p className="num mt-2 text-2xl font-black text-violet-200">
            {formatDecimal(
              (market.instruments.find((row) => row.key === "internet")?.basketRials ?? 0) / Math.max(market.totals.posBasket, 1),
              1,
            )}
            ×
          </p>
          <p className="mt-2 text-[11.5px] leading-6 text-slate-400">
            سبد اینترنت حاصل تقسیم مبلغ÷تعداد اعلامی است. کارمزد پلکان کارتخوان به اینترنت اعمال نمی‌شود.
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>داستان سه ماه منتشرشده</CardTitle>
              <CardDescription>هر پله اختلاف مبلغ نسبت به ماه قبل از همین سری مطلق است</CardDescription>
            </div>
            <OriginChip origin="official" />
          </CardHeader>
          <CardContent>
            <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {market.trend.map((step) => (
                <li key={step.period} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="text-[11px] font-extrabold text-slate-300">{step.label}</p>
                  <p className="num mt-2 text-lg font-black text-white">{formatToman(step.volume, { decimals: 0 })}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-gold-400 to-gold-600"
                      style={{ width: `${(step.volume / maxVolume) * 100}%` }}
                    />
                  </div>
                  <p className="num mt-2 text-[11px] text-slate-500">
                    {formatCount(step.txCount)} تراکنش
                    {step.volumeDelta !== 0
                      ? ` · ${step.volumeDelta > 0 ? "+" : ""}${formatToman(step.volumeDelta, { decimals: 0 })}`
                      : " · مبدأ سری"}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>سبد سه ابزار مرداد</CardTitle>
              <CardDescription>کارتخوان رقم اعلامی؛ بقیه حاصل تقسیم مبلغ÷تعداد</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {market.instruments.map((row) => (
              <div key={row.key}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-bold text-slate-300">{row.title}</span>
                  <span className="num font-black text-gold-200">{formatToman(row.basketRials)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-persian-400/80"
                    style={{ width: `${(row.basketRials / maxBasket) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-600">
                  {row.basketKind === "cited" ? "رقم اعلامی گزارش" : "تقسیم مبلغ بر تعداد"}
                  {row.countIsApproximate ? " · تعداد تقریبی" : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>برش خدمات خرداد — جدا از ابزار مرداد</CardTitle>
            <CardDescription>
              گزارش ۱۳۲ ترکیب خدمت را داده؛ گزارش ۱۳۴ ترکیب ابزار را. این دو برش را با هم جمع نکنید.
            </CardDescription>
          </div>
          <Badge variant="slate">خرداد ۱۴۰۵</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MixRow label="خرید" count={market.khordadMix.purchaseCountPct} value={market.khordadMix.purchaseValuePct} />
            <MixRow label="قبوض و شارژ" count={market.khordadMix.billCountPct} value={market.khordadMix.billValuePct} />
          </div>
          <p className="mt-4 text-[11.5px] leading-6 text-slate-500">
            مانده‌گیری {faDigits(formatDecimal(market.khordadMix.balanceInquiryCountPct, 2))}٪ از تعداد نقل شده و با خرید+قبوض در یک کیک جمع
            نمی‌شود. دسترس‌پذیری شبکه {faDigits(formatDecimal(market.khordadMix.uptimePct, 2))}٪.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MixRow({ label, count, value }: { label: string; count: number; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="mb-2 text-[12px] font-extrabold text-slate-200">{label}</p>
      <p className="text-[10px] text-slate-500">تعداد</p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gold-400/80" style={{ width: `${Math.min(100, count)}%` }} />
      </div>
      <p className="num mt-1 text-[11px] text-gold-200">{formatPercent(count, 2)}</p>
      <p className="mt-2 text-[10px] text-slate-500">مبلغ</p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-persian-400/80" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <p className="num mt-1 text-[11px] text-persian-200">{formatPercent(value, 2)}</p>
    </div>
  );
}
