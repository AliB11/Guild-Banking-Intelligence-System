"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AsnafLandscape() {
  return (
    <Card className="mb-5">
      <CardHeader>
        <div>
          <CardTitle>آیا می‌توان رسته‌ها را از داده عمومی سودآور رتبه‌بندی کرد؟</CardTitle>
          <CardDescription>بررسی منابع ایران — نه حدس شعبه</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-[12.5px] leading-7 text-slate-400">
        <p>
          <b className="text-rose-200">خیر — با منبع عمومی فعلی نمی‌شود.</b> ماهنامه شاپرک گردش را به تفکیک رسته جواز یا MCC
          منتشر نمی‌کند. بدون آن ستون، ماتریس سودآوری اصناف ساخته نمی‌شود و اینجا هم ساخته نشده.
        </p>
        <p>
          <b className="text-gold-200">چه چیزی هست:</b> پلکان کارمزد بانک مرکزی (با معافیت نانوایی و سوپرمارکت)، ضریب اینتا فقط جایی که
          جدول مالیاتی نقل شده، و کد ISIC/MCC. این‌ها «طبقه‌بندی سیاست پذیرندگی» است نه سود بانک از رسته.
        </p>
        <p>
          <b className="text-slate-200">چه چیزی متناقض یا کهنه است و KPI نمی‌شود:</b> شمار واحد صنفی در نقل‌ها از حدود ۲٫۴ میلیون فعال
          (صمت، بهمن ۱۴۰۰) تا حدود ۳٫۵ میلیون مجوزدار (نقل اتاق در ۱۴۰۵) و ارقام سازمان مالیاتی فرق دارد. این اختلاف را به‌عنوان موجودی
          جاری نمایش نمی‌دهیم.
        </p>
        <p>
          رتبه‌بندی ارزشمندی وقتی ممکن است که سوئیچ بانک گردش MCC، مانده CASA و هزینه پشتیبانی پایانه را بدهد — یا شاپرک جدول رسته را
          علنی کند.
        </p>
      </CardContent>
    </Card>
  );
}
