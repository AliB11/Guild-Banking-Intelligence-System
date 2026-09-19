"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { FeeCalculator } from "@/components/calculator/fee-calculator";
import { ReadingGuide } from "@/components/explain/reading-guide";

export default function CalculatorPage() {
  return (
    <>
      <PageHeader
        kicker="شبیه‌ساز"
        title="ماشین‌حساب کارمزد کارتخوان"
        description="سناریوی شعبه است نه پرونده یک فروشگاه. سبد پیش‌فرض همان میانگین کارتخوان مرداد ۱۴۰۵ (۶۹۴ هزار تومان) است. کارمزد از پلکان بانک مرکزی می‌آید."
        actions={
          <>
            <Badge variant="gold">موتور Π-Bank نسخه ۱٫۸</Badge>
            <Badge variant="persian">پلکان کارمزد بانک مرکزی</Badge>
          </>
        }
      />
      <ReadingGuide
        items={[
          "تعداد تراکنش روزانه را خودتان می‌گذارید؛ شاپرک رقم یک فروشگاه را نمی‌دهد.",
          "اگر رسته معاف باشد (نانوایی/سوپرمارکت) کارمزد پذیرنده صفر است و بانک می‌پردازد.",
          "هزینه پشتیبانی پایانه فرض مدل است، نه رقم اعلامی شاپرک.",
          "سقف تسهیلات و رسوب حساب اینجا نیست چون داده عمومی ندارد.",
        ]}
      />
      <FeeCalculator />
    </>
  );
}
