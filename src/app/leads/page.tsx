import { getLeads } from "@/lib/gbi/service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { LeadKanban } from "@/components/leads/lead-kanban";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const initial = await getLeads();

  return (
    <>
      <PageHeader
        kicker="BRANCH LEAD PIPELINE"
        title="مدیریت سرنخ‌های شعب"
        description="قیف بازاریابی پذیرندگان بر اساس موتور امتیازدهی GBI؛ کارت‌ها را بین مراحل بکشید و رها کنید — وضعیت به‌صورت آنی در سامانه ثبت و آخرین تعامل به‌روز می‌شود."
        actions={
          <>
            <Badge variant="gold">امتیازدهی خودکار فعال</Badge>
            <Badge variant="slate">همگام با شعب</Badge>
          </>
        }
      />
      <LeadKanban initial={initial} />
    </>
  );
}
