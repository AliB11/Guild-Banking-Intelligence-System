"use client";

import { useQuery } from "@tanstack/react-query";
import { getGuildsOverviewClient } from "@/lib/gbi/client-data";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { DataError, DataLoading } from "@/components/data-state";
import { ProfitCalculator } from "@/components/calculator/profit-calculator";

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
        kicker="PROFITABILITY & CREDIT LAB"
        title="ماشین‌حساب سودآوری و تسهیلات"
        description="شبیه‌سازی آنی حاشیه خالص بانک برای هر پذیرنده: رسوب CASA، کارمزد شاپرکی، سقف تسهیلات طرح‌های پذیرنده ملی / سپهر / امید و امتیاز اولویت سرنخ — همه در یک نمای زنده."
        actions={
          <>
            <Badge variant="gold">موتور Π-Bank نسخه ۱٫۵</Badge>
            <Badge variant="persian">پلکان کارمزد بانک مرکزی</Badge>
          </>
        }
      />
      <ProfitCalculator presets={presets} />
    </>
  );
}
