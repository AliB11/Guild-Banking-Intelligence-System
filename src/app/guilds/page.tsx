"use client";

import { useQuery } from "@tanstack/react-query";
import { getGuildsOverviewClient } from "@/lib/gbi/client-data";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataError, DataLoading } from "@/components/data-state";
import { faDigits, formatToman } from "@/lib/gbi/format";
import { Factory, Store, ConciergeBell, Wrench } from "lucide-react";
import { GuildExplorer } from "@/components/guilds/guild-explorer";

const CAT_ICONS = [Factory, Store, ConciergeBell, Wrench];

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

  const totalVolume = overview.categories.reduce((a, c) => a + c.volume, 0);

  return (
    <>
      <PageHeader
        kicker="GUILD ANALYTICAL MATRIX"
        title="کاوشگر ماتریس اصناف"
        description="کالبدشکافی ۱۷ رسته شغلی طبق رده‌بندی اتاق اصناف؛ ضرایب اینتاکد سازمان امور مالیاتی، چرخه تبدیل نقد، کدهای ISIC و MCC شاپرک در کنار شاخص‌های تراکنشی زنده."
        actions={<Badge variant="gold">گردش کل شبکه: {formatToman(totalVolume)}</Badge>}
      />

      <section className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              <p className="num mt-3 text-lg font-black text-gold-200">{formatToman(c.volume, { decimals: 0 })}</p>
              <p className="mt-1 text-[10.5px] leading-5 text-slate-500">
                {faDigits(c.subGuildCount)} رسته · {faDigits(c.merchantCount)} واحد · ISIC {c.isicCodePrefix}
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
