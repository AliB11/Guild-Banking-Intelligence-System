"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { GuildAtlas } from "@/components/guilds/guild-atlas";
import { GuildKnowledgeMap } from "@/components/guilds/knowledge-map";
import { AsnafLandscape } from "@/components/guilds/asnaf-landscape";
import { ReadingGuide } from "@/components/explain/reading-guide";
import { OriginChip } from "@/components/explain/origin-chip";
import { faDigits } from "@/lib/gbi/format";
import { getGuildAtlas } from "@/lib/gbi/market-view";

export default function GuildsPage() {
  const atlas = getGuildAtlas();

  return (
    <>
      <PageHeader
        kicker="رسته‌های شغلی"
        title="اطلس رسته‌ها"
        description="طبقه‌بندی سیاست کارمزد و اینتا — نه رتبه‌بندی سود شاپرک. گردش ماهانه رسته در گزارش عمومی نیست و ساخته نشده است."
        actions={
          <>
            <Badge variant="gold">{faDigits(atlas.length)} رسته مرجع</Badge>
            <OriginChip origin="official" />
          </>
        }
      />
      <ReadingGuide
        items={[
          "سه ستون بالا نقشه سیاست است نه سهم بازار: معاف کارمزد، اینتا نقل‌شده، فقط کد.",
          "ضریب تبصره ۱۰۰ سود مالیاتی است نه حاشیه بانک. فقط جایی پر است که جدول اینتا نقل شده.",
          "نانوایی و سوپرمارکت معاف کارمزد پذیرنده‌اند؛ بانک می‌پردازد.",
          "شمار واحد صنفی در منابع عمومی متناقض است و به‌عنوان KPI جاری نشان داده نمی‌شود.",
        ]}
      />
      <AsnafLandscape />
      <GuildKnowledgeMap />
      <GuildAtlas />
    </>
  );
}
