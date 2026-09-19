"use client";

import { useQuery } from "@tanstack/react-query";
import { loadCatalogClient } from "@/lib/gbi/sources/load-client";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { DataError, DataLoading } from "@/components/data-state";
import { ReadingGuide } from "@/components/explain/reading-guide";
import { SourcesExplorer } from "@/components/sources/sources-explorer";
import { faDigits } from "@/lib/gbi/format";

export default function SourcesPage() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["intelligence-catalog"],
    queryFn: loadCatalogClient,
  });

  if (isPending) return <DataLoading label="در حال خواندن دفترچه منابع…" />;
  if (isError || !data) return <DataError onRetry={() => void refetch()} />;

  return (
    <>
      <PageHeader
        kicker="DATA PROVENANCE"
        title="منابع اطلاعاتی و به‌روزرسانی ماهانه"
        description="این صفحه می‌گوید هر عدد از کجا می‌آید: ماهنامه شاپرک، پلکان بانک مرکزی، اینتاکد نقل‌شده. صفحه‌هایی که منبع عمومی ندارند از محصول حذف شده‌اند."
        actions={
          <>
            <Badge variant="gold">{data.reporting.latestPeriodLabel}</Badge>
            <Badge variant="persian">{faDigits(data.sources.length)} منبع ثبت‌شده</Badge>
          </>
        }
      />
      <ReadingGuide
        items={[
          "فیروزه‌ای منبع رسمی است؛ طلایی فرض مدل (فقط ماشین‌حساب کارمزد).",
          "تقویم انتشار نشان می‌دهد گزارش ماه قبل شاپرک معمولاً از چه روزی قابل واکشی است.",
          "جاب GitHub صفحه منبع را می‌خواند و اثرانگشت را ذخیره می‌کند؛ ضریب اینتاکد را سرخود عوض نمی‌کند.",
          "ماهنامه همان سه ماه نقل‌شده خرداد تا مرداد ۱۴۰۵ است که روی میز کار می‌بینید.",
        ]}
      />
      <SourcesExplorer catalog={data} />
    </>
  );
}
