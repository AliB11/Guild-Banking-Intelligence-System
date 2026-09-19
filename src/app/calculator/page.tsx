"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ProfitCalculator } from "@/components/calculator/profit-calculator";
import { ReadingGuide } from "@/components/explain/reading-guide";
import { CALCULATOR_PRESETS } from "@/lib/gbi/published-market";

export default function CalculatorPage() {
  const presets = CALCULATOR_PRESETS.map((preset) => ({
    id: preset.id,
    title: preset.title,
    categoryName: preset.categoryName,
    cccDays: preset.cccDays,
    intaProfitRatio: preset.intaProfitRatio,
    avgBasket: preset.avgBasket,
    avgDailyTx: preset.avgDailyTx,
    note: preset.note,
  }));

  return (
    <>
      <PageHeader
        kicker="شبیه‌ساز"
        title="ماشین‌حساب سودآوری و تسهیلات"
        description="این صفحه سناریوی شعبه است نه پرونده یک فروشگاه. سبد پیش‌فرض همان میانگین کارتخوان مرداد ۱۴۰۵ (۶۹۴ هزار تومان) است. تعداد تراکنش روزانه را خودتان می‌گذارید. کارمزد از پلکان بانک مرکزی است."
        actions={
          <>
            <Badge variant="gold">موتور Π-Bank نسخه ۱٫۷</Badge>
            <Badge variant="persian">پلکان کارمزد بانک مرکزی</Badge>
          </>
        }
      />
      <ReadingGuide
        items={[
          "پیش‌تنظیم‌ها از سبد اعلامی شاپرک و ضرایب اینتا نقل‌شده می‌آیند؛ تعداد روزانه فروشگاه جعلی نیست.",
          "عدد بزرگ طلایی سود ماهانه بانک در سناریوی شماست: کارمزد + ارزش رسوب فرضی + حاشیه تسهیلات − هزینه دستگاه.",
          "نانوایی و سوپرمارکت در بخشنامه معاف‌اند؛ ماشین‌حساب همچنان پلکان عمومی را نشان می‌دهد مگر خودتان سناریو را صفر کنید.",
          "آزمایشگاه شوک می‌گوید اگر فروش کم شود، سود و سقف اعتبار چقدر تاب می‌آورد.",
        ]}
      />
      <ProfitCalculator presets={presets} />
    </>
  );
}
