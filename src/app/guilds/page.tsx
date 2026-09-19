"use client";

import { useQuery } from "@tanstack/react-query";
import { getGuildsOverviewClient } from "@/lib/gbi/client-data";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataError, DataLoading } from "@/components/data-state";
import { faDigits, formatToman } from "@/lib/gbi/format";
import { Factory, Store, ConciergeBell, Wrench, Radio } from "lucide-react";
import { GuildExplorer } from "@/components/guilds/guild-explorer";
import { ReadingGuide } from "@/components/explain/reading-guide";
import { OriginChip } from "@/components/explain/origin-chip";

const CAT_ICONS = [Radio, Factory, Store, ConciergeBell, Wrench];

export default function GuildsPage() {
  const {
    data: overview,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["guilds"],
    queryFn: getGuildsOverviewClient,
  });

  if (isPending) return <DataLoading label="در حال محاسبه ماتریس اصناف…" />;
  if (isError || !overview) return <DataError onRetry={() => void refetch()} />;

  const publishedVolume = overview.categories.reduce((a, c) => a + c.volume, 0);

  return (
    <>
      <PageHeader
        kicker="رسته‌های شغلی"
        title="طبقه‌بندی اصناف و ابزار پرداخت"
        description="گردش فقط برای ابزارهای اعلام‌شده شاپرک در مرداد ۱۴۰۵ است. رسته‌های صنفی با ISIC، MCC و اینتاکد نقل‌شده آمده‌اند؛ مبلغ ماهانه رسته در گزارش عمومی نیست و صفرِ غایب است نه صفرِ اندازه‌گیری."
        actions={
          <>
            <Badge variant="gold">گردش ابزار: {formatToman(publishedVolume)}</Badge>
            <OriginChip origin="official" />
          </>
        }
      />
      <ReadingGuide
        items={[
          "کارت «شبکه پرداخت» جمع کارتخوان و اینترنت مرداد است. بقیه گروه‌ها طبقه‌بندی‌اند بدون گردش ماهانه.",
          "ماتریس بوستون فقط روی ابزارهایی است که مبلغ دارند. ربع رسته صنفی ساخته نشده چون سهم بازار رسته منتشر نشده.",
          "ضریب تبصره ۱۰۰ فقط جایی پر است که جدول اینتا نقل شده: سوپرمارکت ۸٫۵٪، رستوران ۱۴٪، اغذیه ۱۵٪.",
          "نانوایی و سوپرمارکت معاف کارمزد پذیرنده‌اند؛ بانک پذیرنده کارمزد را می‌پردازد.",
        ]}
      />

      <section className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {overview.categories.map((c, i) => {
          const Icon = CAT_ICONS[i % CAT_ICONS.length];
          return (
            <Card key={c.id} className="glass-hover p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-white">{c.name}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/25 bg-gold-500/10 text-gold-300">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="num mt-3 text-lg font-black text-gold-200">
                {c.volume > 0 ? formatToman(c.volume, { decimals: 0 }) : "منتشر نشده"}
              </p>
              <p className="mt-1 text-[10.5px] leading-5 text-slate-500">
                {faDigits(c.subGuildCount)} رسته · ISIC {c.isicCodePrefix}
              </p>
              <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-slate-600">{c.description}</p>
            </Card>
          );
        })}
      </section>

      <GuildExplorer overview={overview} />
    </>
  );
}
