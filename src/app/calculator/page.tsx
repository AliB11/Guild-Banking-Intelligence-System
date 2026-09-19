"use client";

import { useQuery } from "@tanstack/react-query";
import { getGuildsOverviewClient } from "@/lib/gbi/client-data";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { DataError, DataLoading } from "@/components/data-state";
import { ProfitCalculator } from "@/components/calculator/profit-calculator";
import { ReadingGuide } from "@/components/explain/reading-guide";

export default function CalculatorPage() {
  const {
    data: overview,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["guilds"],
    queryFn: getGuildsOverviewClient,
  });

  if (isPending) return <DataLoading label="در حال آماده‌سازی پیش‌تنظیم‌های رسته‌ها…" />;
  if (isError || !overview) return <DataError onRetry={() => void refetch()} />;

  const presets = overview.subGuilds
    .filter((s) => s.merchantCount > 0)
    .map((s) => ({
      id: s.id,
      title: s.title,
      categoryName: s.categoryName,
      cccDays: s.cccDays,
      intaProfitRatio: s.intaProfitRatio,
      avgBasket: s.avgBasket,
      avgDailyTx: s.avgDailyTx,
    }));

  return (
    <>
      <PageHeader
        kicker="شبیه‌ساز"
        title="ماشین‌حساب سودآوری و تسهیلات"
        description="با چند عدد ساده ببینید یک پذیرنده برای بانک چقدر سود می‌سازد و سقف کدام طرح تسهیلاتی را می‌گیرد. کارمزد از پلکان بانک مرکزی است؛ گردش و رسوب را خودتان تنظیم می‌کنید."
        actions={
          <>
            <Badge variant="gold">موتور Π-Bank نسخه ۱٫۶</Badge>
            <Badge variant="persian">پلکان کارمزد بانک مرکزی</Badge>
          </>
        }
      />
      <ReadingGuide
        items={[
          "از فهرست رسته یک شغل آماده انتخاب کنید یا اسلایدرها را دستی حرکت دهید.",
          "عدد بزرگ طلایی سود ماهانه بانک است: کارمزد + ارزش رسوب + حاشیه تسهیلات − هزینه دستگاه.",
          "سه کارت طرح ملی / سپهر / امید سقف پیشنهادی را نشان می‌دهند؛ واجد شرایط نبودن دلیل دارد.",
          "آزمایشگاه شوک پایین صفحه می‌گوید اگر فروش کم شود، سود و سقف اعتبار چقدر تاب می‌آورد.",
        ]}
      />
      <ProfitCalculator presets={presets} />
    </>
  );
}
