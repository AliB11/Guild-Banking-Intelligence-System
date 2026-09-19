"use client";

import {
  TrendingUp,
  PieChart as PieChartIcon,
  Trophy,
  Map,
  Grid3X3,
  GitBranch,
  ShieldAlert,
  Database,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummaryClient } from "@/lib/gbi/client-data";
import { loadCatalogClient } from "@/lib/gbi/sources/load-client";
import { faDigits, formatToman } from "@/lib/gbi/format";
import { PageHeader } from "@/components/page-header";
import { ReadingGuide } from "@/components/explain/reading-guide";
import { TermTip } from "@/components/explain/term-tip";
import { MonthlyBriefingCard } from "@/components/sources/monthly-briefing-card";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataError, DataLoading } from "@/components/data-state";
import { TrendChart } from "@/components/charts/trend-chart";
import { ShareDonut } from "@/components/charts/share-donut";
import { ProfitRankChart } from "@/components/charts/profit-rank-chart";
import { ProvinceHeatmap } from "@/components/charts/province-heatmap";
import { GuildTreemap } from "@/components/charts/guild-treemap";
import { MerchantsTable } from "@/components/dashboard/merchants-table";
import { BranchOpportunityList } from "@/components/dashboard/branch-opportunity-list";
import { EarlyWarningPanel } from "@/components/dashboard/early-warning-panel";
import { DataQualityCard } from "@/components/dashboard/data-quality-card";

export default function DashboardPage() {
  const {
    data: d,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardSummaryClient,
  });
  const catalogQuery = useQuery({
    queryKey: ["intelligence-catalog"],
    queryFn: loadCatalogClient,
  });

  if (isPending) return <DataLoading />;
  if (isError || !d) return <DataError onRetry={() => void refetch()} />;

  const sparkVolume = d.trend.map((t) => ({ label: t.short, value: t.volume }));
  const sparkFloat = d.trend.map((t) => ({ label: t.short, value: t.float }));
  const sparkFees = d.trend.map((t) => ({ label: t.short, value: t.fees }));

  return (
    <>
      <PageHeader
        kicker="میز کار"
        title="نمای کلی شبکه اصناف"
        description={`در ${d.latestPeriodLabel} ببینید واحدهای صنفی چقدر خرید کارتی داشته‌اند، چقدر پول در حساب جاری مانده، و این شبکه برای بانک چقدر سود ساخته است. ارقام واحدها نمونه‌اند؛ نرخ کارمزد از مدل رسمی می‌آید.`}
        actions={
          <>
            <Badge variant="persian">دوره جاری: {d.latestPeriodLabel}</Badge>
            <Badge variant="gold">{faDigits(d.totals.merchantCount)} واحد نمونه</Badge>
          </>
        }
      />
      <ReadingGuide
        items={[
          "پنج کارت بالا خلاصه ماه است: رسوب یعنی پول مانده در حساب، گردش یعنی مجموع خرید کارتی.",
          "اتاق هشدار می‌گوید کجا باید سریع اقدام شود؛ گیت کیفیت داده قبل از اعتماد به عدد کنترل می‌شود.",
          "نمودار شش‌ماهه روند را نشان می‌دهد نه یک عکس ثابت. نقشه استان برای تخصیص پایانه و کارشناس شعبه است.",
          "برای دیدن اینکه هر عدد از کدام نهاد می‌آید، صفحه «منابع و به‌روزرسانی» را باز کنید.",
        ]}
      />
      {catalogQuery.data && (
        <section className="mb-5">
          <MonthlyBriefingCard briefing={catalogQuery.data.briefing} />
        </section>
      )}

      {/* KPI cards */}
      <section className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="رسوب تجمیعی اصناف"
          subtitle="پولی که از فروش در حساب جاری بانک مانده — داده نمونه"
          value={d.totals.totalFloat}
          format="toman"
          icon="vault"
          tone="gold"
          deltaPct={d.totals.floatDeltaPct}
          spark={sparkFloat}
        />
        <MetricCard
          title="بازده ماهانه رسوب"
          subtitle="سود بانک از همان مانده، بعد از کسر سپرده قانونی — فرض مدل"
          value={d.totals.monthlyFloatYield}
          format="toman"
          icon="percent"
          tone="persian"
          deltaPct={d.totals.floatDeltaPct}
          spark={sparkFloat}
        />
        <MetricCard
          title="پایانه‌های فعال"
          subtitle="تعداد دستگاه کارتخوان در این نمونه"
          value={d.totals.activeTerminals}
          format="num"
          icon="terminal"
          tone="violet"
          spark={sparkVolume}
        />
        <MetricCard
          title="گردش ماهانه تراکنش"
          subtitle={`${faDigits(d.totals.totalTxCount)} خرید کارتی در ${d.latestPeriodLabel} — داده نمونه`}
          value={d.totals.totalTxVolume}
          format="toman"
          icon="exchange"
          tone="sky"
          deltaPct={d.totals.volumeDeltaPct}
          spark={sparkVolume}
        />
        <MetricCard
          title="میانگین سبد خرید"
          subtitle="متوسط مبلغ هر کشیدن کارت"
          value={d.totals.avgBasket}
          format="toman"
          icon="basket"
          tone="rose"
          spark={sparkFees}
        />
      </section>

      {/* Operational signals */}
      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-300" />
                اتاق هشدار زودهنگام
              </CardTitle>
              <CardDescription>کجا گردش افتاده، ریسک بالا رفته، مالیات ناقص است یا سرنخ بی‌پاسخ مانده</CardDescription>
            </div>
            <Badge variant={d.alerts.some((alert) => alert.severity === "critical") ? "rose" : "slate"}>
              {faDigits(d.alerts.length)} سیگنال
            </Badge>
          </CardHeader>
          <CardContent>
            <EarlyWarningPanel alerts={d.alerts} />
          </CardContent>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4 text-persian-300" />
                گیت کیفیت داده
              </CardTitle>
              <CardDescription>کنترل پیش از انتشار KPIهای مدیریتی</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DataQualityCard data={d.dataQuality} />
          </CardContent>
        </Card>
      </section>

      {/* Trend + composition */}
      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold-400" />
                روند شش‌ماهه گردش و رسوب
              </CardTitle>
              <CardDescription>
                خط طلایی گردش خرید است؛ خط فیروزه‌ای <TermTip id="float">رسوب حساب جاری</TermTip> است
              </CardDescription>
            </div>
            <Badge variant="gold">{faDigits(d.trend.length)} دوره</Badge>
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
                سهم گروه‌های اصلی از گردش
              </CardTitle>
              <CardDescription>توزیع گردش ماهانه میان چهار گروه اصلی صنفی</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ShareDonut data={d.categoryProfit} />
          </CardContent>
        </Card>
      </section>

      {/* Profitability + treemap */}
      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold-400" />
                رتبه‌بندی سودآوری گروه‌ها
              </CardTitle>
              <CardDescription>حاشیه خالص ماهانه بانک = حاشیه رسوب + کارمزد − هزینه پشتیبانی</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ProfitRankChart data={d.categoryProfit} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-persian-400" />
                نقشه رسته‌های شغلی بر اساس گردش
              </CardTitle>
              <CardDescription>سهم نسبی هر رسته شغلی از گردش کارتخوان شبکه — {formatToman(d.totals.totalTxVolume)}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <GuildTreemap data={d.topSubGuilds} />
          </CardContent>
        </Card>
      </section>

      {/* Geography + leaderboard */}
      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-4 w-4 text-gold-400" />
                نقشه حرارتی استانی و شعب
              </CardTitle>
              <CardDescription>شدت گردش پذیرندگان به تفکیک استان — مبنای تخصیص تجهیزات و سرنخ به شعب</CardDescription>
            </div>
            <Badge variant="slate">{faDigits(d.provinces.length)} استان</Badge>
          </CardHeader>
          <CardContent>
            <ProvinceHeatmap data={d.provinces} />
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <CardHeader>
            <div>
              <CardTitle>تالار افتخار پذیرندگان</CardTitle>
              <CardDescription>بالاترین حاشیه خالص ماهانه برای بانک</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <MerchantsTable merchants={d.topMerchants} />
          </CardContent>
        </Card>
      </section>

      {/* Branch opportunity map */}
      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-gold-400" />
                نقشه فرصت شعب
              </CardTitle>
              <CardDescription>اولویت اقدام شعب بر اساس گردش، رسوب، انطباق و پوشش سرنخ‌ها</CardDescription>
            </div>
            <Badge variant="gold">{faDigits(d.branchOpportunities.length)} شعبه برتر</Badge>
          </CardHeader>
          <CardContent>
            <BranchOpportunityList data={d.branchOpportunities} />
          </CardContent>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <CardHeader>
            <div>
              <CardTitle>راهنمای اقدام عملیاتی</CardTitle>
              <CardDescription>ترجمه سیگنال به برنامه شعبه</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-[10.5px] leading-6 text-slate-400">
            <p><b className="text-sky-300">توسعه POS:</b> ظرفیت تراکنش وجود دارد اما پوشش پایانه پایین است.</p>
            <p><b className="text-gold-300">کمپین اعتبار:</b> سرنخ کافی نیست؛ کارشناس شعبه باید اقدام کند.</p>
            <p><b className="text-rose-300">پاک‌سازی مالیاتی:</b> ابتدا شفافیت مالیاتی، سپس پیشنهاد اعتبار.</p>
            <p className="border-t border-white/[0.06] pt-3 text-slate-600">امتیاز فرصت، تصمیم اعتباری نهایی نیست؛ فقط اولویت تخصیص ظرفیت فروش است.</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
