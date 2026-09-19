"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarRange,
  GitBranch,
  Radar,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OriginChip } from "@/components/explain/origin-chip";
import { MonthlyBriefingCard } from "@/components/sources/monthly-briefing-card";
import { GLOSSARY } from "@/lib/gbi/glossary";
import { faDigits, formatJalaliDate } from "@/lib/gbi/format";
import {
  CADENCE_LABELS,
  KIND_LABELS,
  ORIGIN_LABELS,
  PUBLICATION_STATE_LABELS,
  type IntelligenceCatalog,
  type SourceKind,
} from "@/lib/gbi/sources/types";
import { cn } from "@/lib/utils";

const KIND_VARIANT: Record<SourceKind, "gold" | "persian" | "violet" | "slate" | "rose"> = {
  official: "persian",
  internal: "violet",
  model: "gold",
  sample: "slate",
  mirror: "rose",
};

const STATE_TONE: Record<string, string> = {
  waiting: "text-slate-400",
  due: "text-gold-300",
  overdue: "text-rose-300",
  current: "text-persian-300",
};

export function SourcesExplorer({ catalog }: { catalog: IntelligenceCatalog }) {
  const [kind, setKind] = useState<"all" | SourceKind>("all");
  const [query, setQuery] = useState("");
  const [glossaryQuery, setGlossaryQuery] = useState("");

  const sources = useMemo(() => {
    return catalog.sources.filter((source) => {
      if (kind !== "all" && source.kind !== kind) return false;
      if (!query.trim()) return true;
      const hay = `${source.name} ${source.owner} ${source.fields.join(" ")} ${source.usedFor.join(" ")}`;
      return hay.includes(query.trim());
    });
  }, [catalog.sources, kind, query]);

  const glossary = useMemo(() => {
    const q = glossaryQuery.trim();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter((term) => `${term.term} ${term.short} ${term.plain}`.includes(q));
  }, [glossaryQuery]);

  const kinds = Array.from(new Set(catalog.sources.map((source) => source.kind)));

  return (
    <div className="space-y-6">
      {catalog.alerts.length > 0 && (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {catalog.alerts.map((alert) => (
            <div
              key={alert.code}
              className={cn(
                "rounded-2xl border px-4 py-3 text-[12px] leading-6",
                alert.severity === "critical"
                  ? "border-rose-500/30 bg-rose-500/[0.07] text-rose-100"
                  : alert.severity === "warning"
                    ? "border-gold-500/25 bg-gold-500/[0.06] text-gold-100"
                    : "border-white/10 bg-white/[0.03] text-slate-300",
              )}
            >
              <p className="flex items-center gap-2 font-extrabold">
                <ShieldAlert className="h-4 w-4" />
                {alert.title}
              </p>
              <p className="mt-1 text-slate-400">{alert.detail}</p>
            </div>
          ))}
        </section>
      )}

      <MonthlyBriefingCard briefing={catalog.briefing} />

      <Card className="animate-fade-up">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-persian-400" />
              مسیر داده از منبع تا صفحه
            </CardTitle>
            <CardDescription>
              هیچ عددی بدون تبار نیست. فیروزه‌ای رسمی است، طلایی فرض مدل، بنفش داخلی بانک (اینجا غایب).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex flex-wrap gap-2 text-[10.5px] text-slate-400">
            {(Object.keys(ORIGIN_LABELS) as Array<keyof typeof ORIGIN_LABELS>).map((origin) => (
              <span key={origin} className="inline-flex items-center gap-2">
                <OriginChip origin={origin} />
                <span>{ORIGIN_LABELS[origin].hint}</span>
              </span>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-right">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10.5px] font-bold text-slate-500">
                  <th className="px-3 py-2">شاخص</th>
                  <th className="px-3 py-2">صفحات</th>
                  <th className="px-3 py-2">تبار</th>
                  <th className="px-3 py-2">منابع</th>
                  <th className="px-3 py-2">توضیح ساده</th>
                </tr>
              </thead>
              <tbody>
                {catalog.lineage.map((row) => (
                  <tr key={row.field} className="border-b border-white/[0.04] text-[11.5px] last:border-0">
                    <td className="px-3 py-3 font-extrabold text-slate-100">{row.label}</td>
                    <td className="px-3 py-3 text-slate-400">{row.screens.join("، ")}</td>
                    <td className="px-3 py-3">
                      <OriginChip origin={row.origin} />
                    </td>
                    <td className="px-3 py-3 text-slate-400">
                      {row.sourceIds
                        .map((id) => catalog.sources.find((source) => source.id === id)?.name ?? id)
                        .join("؛ ")}
                    </td>
                    <td className="px-3 py-3 leading-6 text-slate-500">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-gold-400" />
              تقویم انتشار و واکشی خودکار
            </CardTitle>
            <CardDescription>
              جاب GitHub در روزهای ۳، ۸، ۱۲، ۱۸ و ۲۵ هر ماه میلادی اجرا می‌شود تا بعد از انتشار گزارش اصناف/شاپرک، صفحه منبع را واکشی و کاتالوگ را به‌روز کند.
            </CardDescription>
          </div>
          <Badge variant="slate">
            واکشی بعدی حدود {formatJalaliDate(new Date(catalog.publication.nextWatchIso))}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {catalog.publication.windows.map((window) => (
              <div key={window.sourceId} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[12.5px] font-extrabold text-slate-100">{window.name}</p>
                  <span className={cn("text-[10.5px] font-bold", STATE_TONE[window.state])}>
                    {PUBLICATION_STATE_LABELS[window.state]}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  پوشش مورد انتظار: {window.expectedPeriodLabel}
                  {window.lagDays > 0 ? ` · تأخیر معمول ${faDigits(window.lagDays)} روز` : ""}
                </p>
                <p className="mt-1 text-[10.5px] leading-5 text-slate-600">{window.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
          <button
            type="button"
            onClick={() => setKind("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-bold",
              kind === "all" ? "bg-gold-500/15 text-gold-300" : "text-slate-400 hover:text-slate-200",
            )}
          >
            همه منابع
          </button>
          {kinds.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setKind(item)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[11px] font-bold",
                kind === item ? "bg-gold-500/15 text-gold-300" : "text-slate-400 hover:text-slate-200",
              )}
            >
              {KIND_LABELS[item]}
            </button>
          ))}
        </div>
        <div className="relative min-w-52 flex-1 sm:max-w-80">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو در منابع…"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-3 pr-9 text-[12px] text-slate-200 placeholder:text-slate-600 focus:border-gold-500/40 focus:outline-none focus:ring-2 focus:ring-gold-500/15"
          />
        </div>
        <Badge variant="slate">{faDigits(sources.length)} منبع</Badge>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {sources.map((source) => (
          <article key={source.id} className="glass p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-black text-white">{source.name}</h3>
                <p className="mt-1 text-[11px] text-slate-500">{source.owner}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={KIND_VARIANT[source.kind]}>{KIND_LABELS[source.kind]}</Badge>
                <Badge variant="slate">{CADENCE_LABELS[source.cadence]}</Badge>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-slate-400">{source.howWeUse}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {source.fields.map((field) => (
                <span key={field} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-400">
                  {field}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-6 text-slate-500">
              <b className="text-slate-300">صفحات:</b> {source.screens.join("، ")}
            </p>
            <p className="text-[11px] leading-6 text-slate-500">
              <b className="text-slate-300">محدودیت:</b> {source.limitation}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[10.5px] text-slate-500">
              <span>
                آخرین واکشی:{" "}
                {source.lastProbe
                  ? `${source.lastProbe.status}${source.lastProbe.httpStatus ? ` · HTTP ${faDigits(source.lastProbe.httpStatus)}` : ""}`
                  : "هنوز انجام نشده"}
                {source.lastProbe?.hash ? ` · ${source.lastProbe.hash}` : ""}
              </span>
              {!source.urls.primary.startsWith("internal://") && (
                <a
                  href={source.urls.primary}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-gold-300 hover:text-gold-200"
                >
                  منبع
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
            {source.pendingHumanReview && (
              <p className="mt-2 rounded-lg border border-gold-500/25 bg-gold-500/[0.08] px-3 py-2 text-[11px] text-gold-200">
                {source.reviewReason}
              </p>
            )}
          </article>
        ))}
      </section>

      <Card className="animate-fade-up">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-persian-400" />
              طبقه‌بندی رسته‌ها و کدهای مرجع
            </CardTitle>
            <CardDescription>
              ISIC و MCC از طبقه‌بندی عمومی‌اند. ضریب تبصره ۱۰۰ فقط جایی پر است که جدول اینتا نقل شده؛ بقیه خالی‌اند.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-right">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10.5px] font-bold text-slate-500">
                  <th className="px-3 py-2">رسته</th>
                  <th className="px-3 py-2">گروه</th>
                  <th className="px-3 py-2 text-center">ISIC</th>
                  <th className="px-3 py-2 text-center">اینتاکد</th>
                  <th className="px-3 py-2 text-center">ضریب</th>
                  <th className="px-3 py-2 text-center">MCC</th>
                </tr>
              </thead>
              <tbody>
                {catalog.taxonomy.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.04] text-[12px] last:border-0">
                    <td className="px-3 py-2.5 font-bold text-slate-100">{row.title}</td>
                    <td className="px-3 py-2.5 text-slate-400">{row.categoryName}</td>
                    <td className="num px-3 py-2.5 text-center text-slate-300" dir="ltr">
                      {row.isicCode}
                    </td>
                    <td className="num px-3 py-2.5 text-center text-slate-300" dir="ltr">
                      {row.intaCode}
                    </td>
                    <td className="num px-3 py-2.5 text-center text-violet-300">
                      {row.intaProfitRatio > 0 ? `${faDigits(row.intaProfitRatio)}٪` : "—"}
                    </td>
                    <td className="num px-3 py-2.5 text-center text-slate-300" dir="ltr">
                      {row.defaultMcc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold-400" />
              واژه‌نامه به زبان ساده
            </CardTitle>
            <CardDescription>اصطلاحات بانکی همین سامانه، بدون انگلیسی سنگین.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={glossaryQuery}
              onChange={(event) => setGlossaryQuery(event.target.value)}
              placeholder="جستجوی واژه…"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-3 pr-9 text-[12px] text-slate-200 placeholder:text-slate-600 focus:border-gold-500/40 focus:outline-none focus:ring-2 focus:ring-gold-500/15"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {glossary.map((term) => (
              <div key={term.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[13px] font-black text-white">{term.term}</p>
                <p className="mt-1 text-[11px] font-bold text-gold-400/90">{term.short}</p>
                <p className="mt-2 text-[12px] leading-6 text-slate-400">{term.plain}</p>
                {term.example && <p className="mt-2 text-[11px] leading-5 text-slate-600">مثال: {term.example}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-persian-400" />
              پیشنهادهای خلاقانه بعدی
            </CardTitle>
            <CardDescription>چیزهایی که همین معماری را بدون عوض کردن موتور قوی‌تر می‌کند.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 text-[12px] leading-6 text-slate-400">
          <p>
            <b className="text-slate-200">کارت تغییر ماه:</b> بعد از هر واکشی موفق، فقط شاخص‌های شاپرک که نسبت به ماه قبل عوض شده‌اند روی میز کار بیاید.
          </p>
          <p>
            <b className="text-slate-200">نامه یک‌صفحه‌ای:</b> از روی ماهنامه شاپرک یک خلاصه چاپی برای ستاد ساخته شود.
          </p>
          <p>
            <b className="text-slate-200">اتصال هسته بانک:</b> وقتی پایانه و CASA واقعی برسد، میز کار شعبه جدا از ماهنامه شبکه ساخته می‌شود — نه با داده ساختگی.
          </p>
          <p>
            <b className="text-slate-200">جدول رسته شاپرک:</b> اگر شاپرک گردش MCC را منتشر کند، اطلس رسته ستون مبلغ پیدا می‌کند.
          </p>
        </CardContent>
      </Card>

      {catalog.changelog.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>دفترچه تغییرات کاتالوگ</CardTitle>
              <CardDescription>۱۲ رویداد اخیر واکشی، چرخش ماه و بازبینی انسانی.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {catalog.changelog.map((entry, index) => (
              <div key={`${entry.at}-${index}`} className="flex gap-3 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                <span className="w-28 shrink-0 text-[10.5px] text-slate-600">{entry.jalali}</span>
                <div>
                  <p className="text-[12px] font-bold text-slate-200">{entry.title}</p>
                  <p className="text-[11px] leading-5 text-slate-500">{entry.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-[10.5px] leading-6 text-slate-600">
        مدل {catalog.modelVersion} · اثرانگشت {catalog.contentFingerprint} · تولید {catalog.jalaliGenerated}. این سامانه تصمیم‌یار است و
        جایگزین بخشنامه، قرارداد PSP یا تصمیم کمیته اعتباری نیست.
      </p>
    </div>
  );
}
