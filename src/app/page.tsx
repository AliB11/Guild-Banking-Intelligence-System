"use client";

import { Landmark, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadCatalogClient } from "@/lib/gbi/sources/load-client";
import { faDigits, formatCount, formatPercent, formatToman } from "@/lib/gbi/format";
import { getMarketDashboard } from "@/lib/gbi/market-view";
import { PageHeader } from "@/components/page-header";
import { ReadingGuide } from "@/components/explain/reading-guide";
import { OriginChip } from "@/components/explain/origin-chip";
import { MonthlyBriefingCard } from "@/components/sources/monthly-briefing-card";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendChart } from "@/components/charts/trend-chart";
import { ShareDonut } from "@/components/charts/share-donut";
import { InsightBoard } from "@/components/dashboard/insight-board";

export default function DashboardPage() {
  const d = getMarketDashboard();
  const catalogQuery = useQuery({
    queryKey: ["intelligence-catalog"],
    queryFn: loadCatalogClient,
  });

  const sparkVolume = d.trend.map((t) => ({ label: t.short, value: t.volume }));
  const sparkCount = d.trend.map((t) => ({ label: t.short, value: t.txCount }));
  const instrumentShare = d.instruments.map((row) => ({
    id: row.key,
    name: row.title,
    volume: row.volume,
    sharePct: row.sharePct,
  }));

  return (
    <>
      <PageHeader
        kicker="میز کار"
        title="نمای شبکه پرداخت شاپرک"
        description={`آخرین ماهنامه منتشرشده ${d.latestPeriodLabel} است (گزارش ${faDigits(d.reportNo ?? 0)}). شهریور در تقویم است اما رقم شاپرک ندارد. ارقام این صفحه فقط از بازتاب گزارش رسمی آمده‌اند.`}
        actions={
          <>
            <Badge variant="persian">دوره منتشرشده: {d.latestPeriodLabel}</Badge>
            <OriginChip origin="official" />
          </>
        }
      />
      <ReadingGuide
        items={[
          "پنج کارت بالا جمع شبکه شاپرک است، نه پرونده شعبه یا پذیرنده.",
          "خوانش‌ها (فاصله مبلغ/تعداد، سبد اینترنت، ملت×شبکه) حاصل تقسیم و ضرب همان ارقام‌اند و منبع تازه‌ای نیستند.",
          "ترکیب ابزار فقط برای مرداد است؛ ترکیب خدمت برای خرداد. این دو را با هم جمع نکنید.",
          "کارمزد فقط در ماشین‌حساب سناریو است و به اینترنت اعمال نمی‌شود.",
        ]}
      />
      {catalogQuery.data && (
        <section className="mb-5 print-brief">
          <MonthlyBriefingCard briefing={catalogQuery.data.briefing} />
        </section>
      )}

      <section className="mb-5">
        <InsightBoard market={d} />
      </section>

      <section className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="گردش شبکه شاپرک"
          subtitle={`بازتاب گزارش ${d.latestPeriodLabel} — منبع رسمی`}
          value={d.totals.volume}
          format="toman"
          icon="exchange"
          tone="sky"
          deltaPct={d.totals.volumeDeltaPct}
          spark={sparkVolume}
        />
        <MetricCard
          title="تعداد تراکنش"
          subtitle={`${formatCount(d.totals.txCount)} تراکنش در ${d.latestPeriodLabel}`}
          value={d.totals.txCount}
          format="count"
          icon="terminal"
          tone="violet"
          deltaPct={d.totals.countDeltaPct}
          spark={sparkCount}
        />
        <MetricCard
          title="گردش کارتخوان فروشگاهی"
          subtitle={`${formatCount(d.totals.posTxCount, 0)} تراکنش — رقم اعلامی کارتخوان`}
          value={d.totals.posVolume}
          format="toman"
          icon="vault"
          tone="gold"
          spark={sparkVolume}
        />
        <MetricCard
          title="گردش پذیرش اینترنتی"
          subtitle={`${formatCount(d.totals.internetTxCount, 0)} تراکنش اعلام‌شده`}
          value={d.totals.internetVolume}
          format="toman"
          icon="percent"
          tone="persian"
          spark={sparkVolume}
        />
        <MetricCard
          title="سبد اعلامی کارتخوان"
          subtitle="رقم نقل‌شده مرداد؛ میانگین کل شبکه جداگانه از مبلغ÷تعداد است"
          value={d.totals.posBasket}
          format="toman"
          icon="basket"
          tone="rose"
          spark={sparkVolume}
        />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold-400" />
                روند ماه‌های منتشرشده
              </CardTitle>
              <CardDescription>
                خرداد، تیر و مرداد ۱۴۰۵. مبلغ و تعداد هر دو از بازتاب ماهنامه است.
              </CardDescription>
            </div>
            <Badge variant="gold">{faDigits(d.trend.length)} ماه نقل‌شده</Badge>
          </CardHeader>
          <CardContent>
            <TrendChart data={d.trend} />
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-persian-400" />
                سهم ابزار از گردش مرداد
              </CardTitle>
              <CardDescription>کارتخوان، اینترنت، مانده سایر ابزار</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ShareDonut data={instrumentShare} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle>تفکیک ابزار پذیرش — مرداد ۱۴۰۵</CardTitle>
              <CardDescription>تعداد کارتخوان و سایر ابزار تقریبی نقل شده؛ اینترنت رقم دقیق است</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-right">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10.5px] font-bold text-slate-500">
                    <th className="px-3 py-2">ابزار</th>
                    <th className="px-3 py-2">گردش</th>
                    <th className="px-3 py-2">تعداد</th>
                    <th className="px-3 py-2">سبد</th>
                    <th className="px-3 py-2">سهم مبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {d.instruments.map((row) => (
                    <tr key={row.key} className="border-b border-white/[0.04] text-[12px] last:border-0">
                      <td className="px-3 py-2.5 font-extrabold text-slate-100">{row.title}</td>
                      <td className="num px-3 py-2.5 text-gold-200">{formatToman(row.volume)}</td>
                      <td className="num px-3 py-2.5 text-slate-300">
                        {formatCount(row.txCount, 0)}
                        {row.countIsApproximate ? " ≈" : ""}
                      </td>
                      <td className="num px-3 py-2.5 text-slate-200">
                        {formatToman(row.basketRials)}
                        <span className="mr-1 text-[10px] text-slate-600">
                          {row.basketKind === "cited" ? "اعلامی" : "تقسیم"}
                        </span>
                      </td>
                      <td className="num px-3 py-2.5 text-persian-200">{formatPercent(row.sharePct, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] leading-6 text-slate-500">
              میانگین سبد کل شبکه (مبلغ ÷ تعداد همه ابزار): {formatToman(d.totals.avgBasket)}. سبد اعلامی کارتخوان{" "}
              {formatToman(d.totals.posBasket)} است.
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-gold-400" />
                سهم بانک ملت و ترکیب خدمات خرداد
              </CardTitle>
              <CardDescription>ارقام نقل‌شده؛ سهم استانی مبلغ منتشر نشده</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-[12px] leading-6 text-slate-400">
            <p>
              بانک ملت به‌عنوان بانک پذیرنده در مرداد ۱۴۰۵: {formatPercent(d.mellat.countPct, 2)} تعداد و{" "}
              {formatPercent(d.mellat.valuePct, 2)} مبلغ — حاصل‌ضرب در جمع شبکه حدود {formatToman(d.mellat.impliedVolume)}.
            </p>
            <p className="text-[11.5px] text-slate-500">
              رشد اسمی سالانه مبلغ {formatPercent(d.citedYoy.valueNominalPct)} در برابر رشد واقعی حدود{" "}
              {formatPercent(d.citedYoy.valueRealApproxPct)}.
            </p>
            <p className="border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">{d.feeExemptHint}</p>
            <p className="text-[10.5px] text-slate-600">{d.citation}</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
