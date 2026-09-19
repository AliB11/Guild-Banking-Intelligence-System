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
import { faDigits, formatCount, formatPercent, formatToman } from "@/lib/gbi/format";
import { CBI_FEE_EXEMPT_HINT, MELLAT_MORDAD_ACQUIRER_SHARE } from "@/lib/gbi/published-market";
import { PageHeader } from "@/components/page-header";
import { ReadingGuide } from "@/components/explain/reading-guide";
import { TermTip } from "@/components/explain/term-tip";
import { OriginChip } from "@/components/explain/origin-chip";
import { MonthlyBriefingCard } from "@/components/sources/monthly-briefing-card";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataError, DataLoading } from "@/components/data-state";
import { TrendChart } from "@/components/charts/trend-chart";
import { ShareDonut } from "@/components/charts/share-donut";
import { ProfitRankChart } from "@/components/charts/profit-rank-chart";
import { GuildTreemap } from "@/components/charts/guild-treemap";
import { MerchantsTable } from "@/components/dashboard/merchants-table";
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
  const sparkFees = d.trend.map((t) => ({ label: t.short, value: t.fees }));
  const instrumentShare = d.topSubGuilds.map((row) => ({
    categoryId: row.id,
    name: row.title,
    merchants: row.merchants,
    terminals: 0,
    volume: row.volume,
    float: row.float,
    fees: 0,
    margin: row.volume,
    sharePct: d.totals.totalTxVolume > 0 ? (row.volume / d.totals.totalTxVolume) * 100 : 0,
  }));
  const posRow = d.topSubGuilds.find((row) => row.title.includes("کارتخوان"));
  const geoPublished = d.provinces.some((row) => row.province !== "کل کشور");

  return (
    <>
      <PageHeader
        kicker="میز کار"
        title="نمای شبکه پرداخت شاپرک"
        description={`آخرین ماهنامه منتشرشده ${d.latestPeriodLabel} است (گزارش ۱۳۴). شهریور در تقویم است اما رقم شاپرک ندارد. گردش و تعداد از بازتاب گزارش رسمی است؛ رسوب CASA و نام پذیرنده در منبع عمومی نیست.`}
        actions={
          <>
            <Badge variant="persian">دوره منتشرشده: {d.latestPeriodLabel}</Badge>
            <OriginChip origin="official" />
          </>
        }
      />
      <ReadingGuide
        items={[
          "پنج کارت بالا جمع شبکه شاپرک است نه پرونده شعبه. رسوب حساب جاری اینجا نیست چون منتشر نشده.",
          "کارمزد نمایش‌داده‌شده برآورد پلکان بانک مرکزی روی سبد کارتخوان است، نه رقم اعلامی شاپرک.",
          "نمودار روند فقط ماه‌هایی را دارد که مبلغ مطلق‌شان نقل شده: خرداد، تیر، مرداد ۱۴۰۵.",
          "نانوایی و سوپرمارکت معاف کارمزد پذیرنده‌اند؛ بانک پذیرنده می‌پردازد.",
        ]}
      />
      {catalogQuery.data && (
        <section className="mb-5">
          <MonthlyBriefingCard briefing={catalogQuery.data.briefing} />
        </section>
      )}

      <section className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="گردش شبکه شاپرک"
          subtitle={`بازتاب گزارش ${d.latestPeriodLabel} — منبع رسمی`}
          value={d.totals.totalTxVolume}
          format="toman"
          icon="exchange"
          tone="sky"
          deltaPct={d.totals.volumeDeltaPct}
          spark={sparkVolume}
        />
        <MetricCard
          title="تعداد تراکنش"
          subtitle={`${formatCount(d.totals.totalTxCount)} تراکنش در ${d.latestPeriodLabel}`}
          value={d.totals.totalTxCount}
          format="count"
          icon="terminal"
          tone="violet"
          spark={sparkVolume}
        />
        <MetricCard
          title="گردش کارتخوان فروشگاهی"
          subtitle={posRow ? "حدود ۴ میلیارد تراکنش — رقم اعلامی کارتخوان" : "در این دوره تفکیک ابزار نیست"}
          value={posRow?.volume ?? 0}
          format="toman"
          icon="vault"
          tone="gold"
          spark={sparkVolume}
        />
        <MetricCard
          title="میانگین سبد شبکه"
          subtitle="جمع مبلغ ÷ جمع تعداد همه ابزار؛ سبد اعلامی کارتخوان حدود ۶۹۴ هزار تومان است"
          value={d.totals.avgBasket}
          format="toman"
          icon="basket"
          tone="rose"
          spark={sparkFees}
        />
        <MetricCard
          title="برآورد کارمزد کارتخوان"
          subtitle="فرض مدل: پلکان بانک مرکزی × سبد کارتخوان مرداد — شاپرک این رقم را منتشر نکرده"
          value={d.totals.totalFees}
          format="toman"
          icon="percent"
          tone="persian"
          spark={sparkFees}
        />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-300" />
                اتاق هشدار و شکاف داده
              </CardTitle>
              <CardDescription>سیگنال عملیاتی به‌علاوه چیزهایی که عمداً ساخته نشده‌اند</CardDescription>
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

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold-400" />
                روند ماه‌های منتشرشده
              </CardTitle>
              <CardDescription>
                فقط خرداد، تیر و مرداد ۱۴۰۵ مبلغ مطلق دارند. خط فیروزه‌ای <TermTip id="float">رسوب CASA</TermTip> خالی
                است چون در گزارش عمومی نیست.
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
                سهم ابزار پذیرش از گردش
              </CardTitle>
              <CardDescription>تفکیک مرداد ۱۴۰۵ — کارتخوان، اینترنت، مانده سایر ابزار</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ShareDonut data={instrumentShare} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold-400" />
                ترکیب مبلغ ابزارها
              </CardTitle>
              <CardDescription>حاشیه نمایشی = برآورد کارمزد مدل؛ رسوب صفرِ غایب است</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ProfitRankChart data={instrumentShare} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-persian-400" />
                نقشه ابزارهای اعلام‌شده
              </CardTitle>
              <CardDescription>
                سهم نسبی ابزار از گردش شبکه — {formatToman(d.totals.totalTxVolume)}. گردش رسته صنفی در ماهنامه عمومی نیست.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <GuildTreemap data={d.topSubGuilds} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-4 w-4 text-gold-400" />
                جغرافیا و شعبه
              </CardTitle>
              <CardDescription>
                سهم استانی مبلغ در گزارش عمومی مرداد به‌صورت رقم منتشر نشده است
              </CardDescription>
            </div>
            <Badge variant="slate">{geoPublished ? `${faDigits(d.provinces.length)} استان` : "رقم استانی نیست"}</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-[12px] leading-6 text-slate-400">
            <p>
              بازتاب خبری می‌گوید تهران سهم غالب دارد اما درصد مبلغ استان‌ها در منبع قابل نقل نبود؛ بنابراین نقشه حرارتی
              ساختگی رسم نشد.
            </p>
            <p>
              سهم بانک ملت به‌عنوان بانک پذیرنده در مرداد ۱۴۰۵: {formatPercent(MELLAT_MORDAD_ACQUIRER_SHARE.countPct, 2)}{" "}
              تعداد و {formatPercent(MELLAT_MORDAD_ACQUIRER_SHARE.valuePct, 2)} مبلغ. بهپراخت در روایت خبری رتبهٔ اول PSP
              است اما سهم عددی‌اش در همان بازتاب نبود.
            </p>
            <p className="text-[11px] text-slate-500">{CBI_FEE_EXEMPT_HINT}</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <CardHeader>
            <div>
              <CardTitle>ابزارهای اعلام‌شده شبکه</CardTitle>
              <CardDescription>رتبه‌بندی بر اساس برآورد کارمزد مدل — نه تالار افتخار فروشگاه</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <MerchantsTable merchants={d.topMerchants} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-gold-400" />
                فرصت شعب
              </CardTitle>
              <CardDescription>بدون پایش داخلی شعبه، نقشه فرصت شعبه ساخته نمی‌شود</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-[12px] leading-6 text-slate-400">
            <p>
              فهرست شعبه و تخصیص پایانه دادهٔ داخلی بانک است. به‌جای ساختن شعبهٔ ساختگی، کمپین‌های رسته در صفحه سرنخ‌ها
              آمده‌اند: نانوایی و سوپرمارکت (معاف کارمزد)، رستوران و اغذیه (ضریب اینتا).
            </p>
            <p className="border-t border-white/[0.06] pt-3 text-[10.5px] text-slate-600">
              اتصال PostgreSQL با پایش پایانه و CASA این بلوک را با داده شعبه پر می‌کند.
            </p>
          </CardContent>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <CardHeader>
            <div>
              <CardTitle>راهنمای خواندن ارقام</CardTitle>
              <CardDescription>چه چیز رسمی است و چه چیز غایب</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-[10.5px] leading-6 text-slate-400">
            <p>
              <b className="text-persian-300">رسمی:</b> گردش، تعداد، ترکیب ابزار مرداد، سبد کارتخوان، سهم ملت.
            </p>
            <p>
              <b className="text-gold-300">فرض مدل:</b> کارمزد پلکانی بانک مرکزی روی سبد کارتخوان.
            </p>
            <p>
              <b className="text-rose-300">غایب:</b> CASA، نام پذیرنده، گردش رسته، تعداد کارتخوان ۱۴۰۵، سهم استان.
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
