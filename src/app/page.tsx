import {
  TrendingUp,
  PieChart as PieChartIcon,
  Trophy,
  Map,
  Grid3X3,
} from "lucide-react";
import { getDashboardSummary } from "@/lib/gbi/service";
import { faDigits, formatToman } from "@/lib/gbi/format";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendChart } from "@/components/charts/trend-chart";
import { ShareDonut } from "@/components/charts/share-donut";
import { ProfitRankChart } from "@/components/charts/profit-rank-chart";
import { ProvinceHeatmap } from "@/components/charts/province-heatmap";
import { GuildTreemap } from "@/components/charts/guild-treemap";
import { MerchantsTable } from "@/components/dashboard/merchants-table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const d = await getDashboardSummary();
  const sparkVolume = d.trend.map((t) => ({ label: t.short, value: t.volume }));
  const sparkFloat = d.trend.map((t) => ({ label: t.short, value: t.float }));
  const sparkFees = d.trend.map((t) => ({ label: t.short, value: t.fees }));

  return (
    <>
      <PageHeader
        kicker="EXECUTIVE COMMAND DECK"
        title="میز کار مدیریتی — نمای کلان اصناف"
        description={`تصویر یکپارچه از رسوب‌سازی، گردش پذیرندگان و سودآوری خالص شبکه اصناف در دوره ${d.latestPeriodLabel}. کلیه ارقام بر مبنای پایش ماهانه پایانه‌ها و حساب‌های جاری است.`}
        actions={
          <>
            <Badge variant="persian">دوره جاری: {d.latestPeriodLabel}</Badge>
            <Badge variant="gold">{faDigits(d.totals.merchantCount)} واحد صنفی فعال</Badge>
          </>
        }
      />

      {/* KPI cards */}
      <section className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="رسوب تجمیعی اصناف (CASA)"
          subtitle="میانگین مانده روزانه حساب‌های جاری"
          value={d.totals.totalFloat}
          format="toman"
          icon="vault"
          tone="gold"
          deltaPct={d.totals.floatDeltaPct}
          spark={sparkFloat}
        />
        <MetricCard
          title="بازده ماهانه رسوب"
          subtitle="حاشیه مالی رسوب پس از کسر سپرده قانونی"
          value={d.totals.monthlyFloatYield}
          format="toman"
          icon="percent"
          tone="persian"
          deltaPct={d.totals.floatDeltaPct}
          spark={sparkFloat}
        />
        <MetricCard
          title="پایانه‌های فعال"
          subtitle="کارتخوان‌های تحت پوشش شبکه پذیرندگی"
          value={d.totals.activeTerminals}
          format="num"
          icon="terminal"
          tone="violet"
          spark={sparkVolume}
        />
        <MetricCard
          title="گردش ماهانه تراکنش"
          subtitle={`${faDigits(d.totals.totalTxCount)} تراکنش در ${d.latestPeriodLabel}`}
          value={d.totals.totalTxVolume}
          format="toman"
          icon="exchange"
          tone="sky"
          deltaPct={d.totals.volumeDeltaPct}
          spark={sparkVolume}
        />
        <MetricCard
          title="میانگین سبد خرید"
          subtitle="متوسط مبلغ هر تراکنش کارتخوان"
          value={d.totals.avgBasket}
          format="toman"
          icon="basket"
          tone="rose"
          spark={sparkFees}
        />
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
              <CardDescription>مقایسه منحنی گردش تراکنش پایانه‌ها با رسوب‌سازی روزانه در دوره‌های جلالی</CardDescription>
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
    </>
  );
}
