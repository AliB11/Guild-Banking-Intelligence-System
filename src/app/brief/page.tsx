import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { StaffLetter } from "@/components/brief/staff-letter";
import { ReadingGuide } from "@/components/explain/reading-guide";
import { OriginChip } from "@/components/explain/origin-chip";
import { getStaffLetter } from "@/lib/gbi/market-view";

export const metadata: Metadata = {
  title: "نامه ستاد | GBI",
  description: "نامه یک‌صفحه‌ای از روی ماهنامه شاپرک برای ستاد بانکداری خرد — فقط ارقام منتشرشده.",
};

export default function BriefPage() {
  const letter = getStaffLetter();

  return (
    <>
      <div className="print-hide">
        <PageHeader
          kicker="ستاد"
          title="نامه یک‌صفحه‌ای"
          description="همان ارقام میز کار، فشرده برای رئیس ستاد. شهریور گزارش ندارد؛ این نامه مرداد ۱۴۰۵ است."
          actions={
            <>
              <Badge variant="gold">{letter.periodLabel}</Badge>
              <OriginChip origin="official" />
            </>
          }
        />
        <ReadingGuide
          items={[
            "سه اقدام از روی فاصله مبلغ/تعداد، سبد اینترنت و معافیت کارمزد آمده — نه از پرونده شعبه.",
            "چاپ، نوار کناری را حذف می‌کند تا یک صفحه بماند.",
            "رتبه‌بندی سود رسته در این نامه نیست چون شاپرک گردش رسته را نداده.",
          ]}
        />
      </div>
      <StaffLetter />
    </>
  );
}
