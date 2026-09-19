import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export default function LeadsRemovedPage() {
  return (
    <>
      <PageHeader
        kicker="حذف‌شده"
        title="قیف سرنخ در این محصول نیست"
        description="فهرست پذیرنده حقیقی، رسوب حساب و گردش رسته در منابع عمومی نیست. این صفحه حذف شد تا پرونده ساختگی نمایش داده نشود."
        actions={<Badge variant="slate">بدون داده عمومی</Badge>}
      />
      <p className="max-w-xl text-[13px] leading-7 text-slate-400">
        به‌جای کانبان ساختگی، طبقه‌بندی رسته‌ها با کد ISIC و اینتاکد نقل‌شده در اطلس آمده است. کارمزد کارتخوان را در ماشین‌حساب سناریو کنید.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/guilds/"
          className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-[12px] font-extrabold text-gold-200"
        >
          اطلس رسته‌ها
        </Link>
        <Link
          href="/calculator/"
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-extrabold text-slate-300"
        >
          ماشین‌حساب کارمزد
        </Link>
      </div>
    </>
  );
}
