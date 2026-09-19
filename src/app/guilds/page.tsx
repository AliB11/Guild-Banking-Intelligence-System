"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { GuildAtlas } from "@/components/guilds/guild-atlas";
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
        description="طبقه‌بندی ISIC، MCC و اینتاکد نقل‌شده. گردش ماهانه رسته در گزارش عمومی شاپرک نیست و اینجا ساخته نشده است."
        actions={
          <>
            <Badge variant="gold">{faDigits(atlas.length)} رسته مرجع</Badge>
            <OriginChip origin="official" />
          </>
        }
      />
      <ReadingGuide
        items={[
          "این صفحه فهرست کد است نه سهم بازار. ستون مبلغ رسته وجود ندارد چون منبع ندارد.",
          "ضریب تبصره ۱۰۰ فقط جایی پر است که جدول اینتا نقل شده: سوپرمارکت ۸٫۵٪، رستوران ۱۴٪، اغذیه ۱۵٪ کف.",
          "نانوایی و سوپرمارکت معاف کارمزد پذیرنده‌اند؛ بانک پذیرنده کارمزد را می‌پردازد.",
          "برای سناریوی کارمزد یک پایانه به ماشین‌حساب بروید.",
        ]}
      />
      <GuildAtlas />
    </>
  );
}
