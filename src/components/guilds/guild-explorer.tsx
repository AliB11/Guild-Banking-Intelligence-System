"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Scale, ArrowUpDown, CalendarClock, Landmark, ScanBarcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { faDigits, formatDecimal, formatToman } from "@/lib/gbi/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuildRadar } from "@/components/charts/guild-radar";
import { BcgMatrix } from "@/components/charts/bcg-matrix";
import { useCompareStore } from "@/lib/store";
import type { GuildCompareResult, GuildsOverview, SubGuildSummary } from "@/lib/gbi/types";

const TIER_STYLE: Record<string, string> = {
  S: "border-gold-500/40 bg-gold-500/15 text-gold-300 shadow-[0_0_16px_rgba(245,200,96,0.25)]",
  A: "border-persian-500/35 bg-persian-500/10 text-persian-300",
  B: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  C: "border-white/10 bg-white/[0.04] text-slate-400",
};

function cccTone(ccc: number) {
  if (ccc < 0) return "text-persian-300";
  if (ccc <= 30) return "text-sky-300";
  if (ccc <= 60) return "text-gold-300";
  return "text-rose-300";
}

function GuildRow({ s, rank }: { s: SubGuildSummary; rank: number }) {
  return (
    <tr className="group border-b border-white/[0.04] transition-colors last:border-0 hover:bg-gold-500/[0.03]">
      <td className="whitespace-nowrap px-3 py-3.5">
        <div className="flex items-center gap-3">
          <span className="num w-6 text-center text-[11px] font-black text-slate-600 group-hover:text-gold-400">
            {formatDecimal(rank, 0)}
          </span>
          <div>
            <p className="text-[12.5px] font-extrabold text-slate-100">{s.title}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{s.categoryName}</p>
          </div>
        </div>
      </td>
      <td className="num px-3 py-3.5 text-center text-[11px] text-slate-400" dir="ltr">{s.isicCode}</td>
      <td className="num px-3 py-3.5 text-center text-[11px] text-slate-400" dir="ltr">{s.intaCode}</td>
      <td className="px-3 py-3.5 text-center">
        <span className="num text-[11.5px] font-bold text-violet-300">{formatDecimal(s.intaProfitRatio, 0)}٪</span>
      </td>
      <td className="px-3 py-3.5 text-center">
        <span className="num text-[11.5px] font-bold text-slate-200">{formatDecimal(s.avgGrossMargin, 0)}٪</span>
      </td>
      <td className="px-3 py-3.5 text-center">
        <span className={cn("num inline-flex items-center gap-1 text-[11.5px] font-black", cccTone(s.cccDays))}>
          <CalendarClock className="h-3.5 w-3.5 opacity-70" />
          {s.cccDays < 0 ? `${formatDecimal(Math.abs(s.cccDays), 0)}−` : formatDecimal(s.cccDays, 0)}
          <span className="text-[9px] font-medium text-slate-500">روز</span>
        </span>
      </td>
      <td className="px-3 py-3.5 text-center">
        <span className="num rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-bold text-slate-300" dir="ltr">
          {s.defaultMcc}
        </span>
      </td>
      <td className="num px-3 py-3.5 text-center text-[11.5px] font-bold text-slate-300">{faDigits(s.merchantCount)}</td>
      <td className="num whitespace-nowrap px-3 py-3.5 text-left text-[11.5px] font-bold text-gold-200">
        {s.volume > 0 ? formatToman(s.volume, { decimals: 0 }) : "—"}
      </td>
      <td className="num whitespace-nowrap px-3 py-3.5 text-left text-[11.5px] font-bold text-persian-300">
        {s.float > 0 ? formatToman(s.float, { decimals: 0 }) : "—"}
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center justify-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold-400 to-persian-400"
              style={{ width: `${Math.max(4, s.avgScore)}%` }}
            />
          </div>
          <span className="num text-[11px] font-black text-slate-200">{formatDecimal(s.avgScore, 0)}</span>
        </div>
      </td>
      <td className="px-3 py-3.5 text-center">
        <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg border text-[12px] font-black", TIER_STYLE[s.tier])}>
          {s.tier}
        </span>
      </td>
    </tr>
  );
}

export function GuildExplorer({ overview }: { overview: GuildsOverview }) {
  const [cat, setCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "volume" | "ccc">("score");

  const filtered = useMemo(() => {
    let list = overview.subGuilds;
    if (cat !== "all") list = list.filter((s) => s.categoryId === cat);
    if (query.trim()) {
      const q = query.trim();
      list = list.filter((s) => s.title.includes(q) || s.categoryName.includes(q));
    }
    return [...list].sort((a, b) =>
      sortBy === "score" ? b.avgScore - a.avgScore : sortBy === "volume" ? b.volume - a.volume : a.cccDays - b.cccDays,
    );
  }, [overview.subGuilds, cat, query, sortBy]);

  return (
    <div className="space-y-5">
      <Card className="animate-fade-up">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              ماتریس بوستون سوددهی رسته‌ها
              <Badge variant="violet">BCG تصمیم‌یار</Badge>
            </CardTitle>
            <CardDescription>
              محور افقی سهم نسبی گردش، محور عمودی رشد تراکنش و اندازه حباب حاشیه خالص بانک را نشان می‌دهد.
            </CardDescription>
          </div>
          <Badge variant="rose">استاندارد رسمی BCG شاپرک نیست</Badge>
        </CardHeader>
        <CardContent>
          <BcgMatrix data={overview.bcgMatrix} />
        </CardContent>
      </Card>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 animate-fade-up">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
          <button
            onClick={() => setCat("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
              cat === "all" ? "bg-gold-500/15 text-gold-300" : "text-slate-400 hover:text-slate-200",
            )}
          >
            همه گروه‌ها
          </button>
          {overview.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
                cat === c.id ? "bg-gold-500/15 text-gold-300" : "text-slate-400 hover:text-slate-200",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="relative min-w-52 flex-1 sm:max-w-72">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی رسته شغلی…"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-3 pr-9 text-[12px] text-slate-200 placeholder:text-slate-600 focus:border-gold-500/40 focus:outline-none focus:ring-2 focus:ring-gold-500/15"
          />
        </div>
        <button
          onClick={() => setSortBy((s) => (s === "score" ? "volume" : s === "volume" ? "ccc" : "score"))}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:border-gold-500/30 hover:text-gold-300"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          مرتب‌سازی: {sortBy === "score" ? "امتیاز جذابیت" : sortBy === "volume" ? "گردش ماهانه" : "چرخه نقد"}
        </button>
        <Badge variant="slate" className="mr-auto">{faDigits(filtered.length)} رسته شغلی</Badge>
      </div>

      {/* Table */}
      <Card className="overflow-hidden animate-fade-up">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-right">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10.5px] font-bold text-slate-500">
                <th className="px-3 py-3">رسته شغلی</th>
                <th className="px-3 py-3 text-center">ISIC</th>
                <th className="px-3 py-3 text-center">اینتاکد</th>
                <th className="px-3 py-3 text-center">ضریب سود تبصره ۱۰۰</th>
                <th className="px-3 py-3 text-center">حاشیه ناخالص</th>
                <th className="px-3 py-3 text-center">چرخه تبدیل نقد</th>
                <th className="px-3 py-3 text-center">MCC شاپرک</th>
                <th className="px-3 py-3 text-center">واحدها</th>
                <th className="px-3 py-3 text-left">گردش ماهانه</th>
                <th className="px-3 py-3 text-left">رسوب میانگین</th>
                <th className="px-3 py-3 text-center">امتیاز جذابیت</th>
                <th className="px-3 py-3 text-center">رتبه</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <GuildRow key={s.id} s={s} rank={i + 1} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">رسته‌ای با این شرایط یافت نشد.</p>
          )}
        </div>
      </Card>

      <ComparePanel overview={overview} />
    </div>
  );
}

/* --------------------------------------------------------------------- */

function ComparePanel({ overview }: { overview: GuildsOverview }) {
  const { aId, bId, setA, setB } = useCompareStore();
  const ranked = overview.subGuilds;
  const defaultA = ranked[0]?.id ?? "";
  const defaultB = ranked.find((s) => s.id !== defaultA)?.id ?? "";
  const validIds = new Set(ranked.map((s) => s.id));
  const selA = aId && validIds.has(aId) ? aId : defaultA;
  const selB = bId && validIds.has(bId) && bId !== selA ? bId : defaultB;

  // Initialise global comparison state after render, not during render. The
  // previous implementation could trigger a render loop in React strict mode.
  useEffect(() => {
    if (selA && aId !== selA) setA(selA);
    if (selB && bId !== selB) setB(selB);
  }, [aId, bId, selA, selB, setA, setB]);

  const { data, isFetching, isError } = useQuery<GuildCompareResult>({
    queryKey: ["guild-compare", selA, selB],
    queryFn: async () => {
      const res = await fetch(`/api/guilds/compare?a=${selA}&b=${selB}`);
      if (!res.ok) throw new Error("compare failed");
      return res.json();
    },
    enabled: Boolean(selA && selB && selA !== selB),
  });

  const options = overview.categories.map((c) => ({
    label: c.name,
    items: overview.subGuilds.filter((s) => s.categoryId === c.id),
  }));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2 animate-fade-up">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-gold-400" />
              مقایسه راداری دو رسته شغلی
            </CardTitle>
            <CardDescription>
              سنجه‌های شش‌گانه عملکرد بانکی — پایداری رسوب، درآمد کارمزدی، اشتهای اعتباری، انطباق، رشد و سهم بازار
            </CardDescription>
          </div>
          {isFetching && <Badge variant="gold">در حال محاسبه…</Badge>}
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: "رسته نخست", value: selA, onChange: setA, ring: "focus:ring-gold-500/20 focus:border-gold-500/50" },
              { label: "رسته دوم", value: selB, onChange: setB, ring: "focus:ring-persian-500/20 focus:border-persian-500/50" },
            ].map((sel) => (
              <label key={sel.label} className="block">
                <span className="mb-1.5 block text-[10.5px] font-bold text-slate-500">{sel.label}</span>
                <select
                  value={sel.value}
                  onChange={(e) => sel.onChange(e.target.value)}
                  className={cn(
                    "w-full appearance-none rounded-xl border border-white/10 bg-night-800 px-3 py-2.5 text-[12px] font-bold text-slate-100 focus:outline-none focus:ring-2",
                    sel.ring,
                  )}
                >
                  {options.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.items.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={sel.label === "رسته نخست" ? s.id === selB : s.id === selA}
                        >
                          {s.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {data ? (
            <GuildRadar compare={data} nameA={data.a.title} nameB={data.b.title} />
          ) : (
            <div className="flex h-[340px] items-center justify-center text-sm text-slate-500">
              {isError
                ? "دریافت داده‌های مقایسه ناموفق بود؛ دوباره تلاش کنید."
                : "در حال آماده‌سازی رادار مقایسه…"}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
        <CardHeader>
          <div>
            <CardTitle>داده‌کارت رگولاتوری</CardTitle>
            <CardDescription>کدهای مرجع دو رسته منتخب</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data && (
            <>
              {[
                { s: data.a, tone: "gold" as const },
                { s: data.b, tone: "persian" as const },
              ].map(({ s, tone }) => (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-xl border p-4",
                    tone === "gold" ? "border-gold-500/25 bg-gold-500/[0.05]" : "border-persian-500/25 bg-persian-500/[0.05]",
                  )}
                >
                  <p className={cn("text-[13px] font-extrabold", tone === "gold" ? "text-gold-300" : "text-persian-300")}>
                    {s.title}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-y-2.5 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Landmark className="h-3.5 w-3.5" /> ISIC
                    </span>
                    <span className="num text-left font-bold text-slate-200" dir="ltr">{s.isicCode}</span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <ScanBarcode className="h-3.5 w-3.5" /> اینتاکد
                    </span>
                    <span className="num text-left font-bold text-slate-200" dir="ltr">{s.intaCode}</span>
                    <span className="text-slate-500">ضریب سود</span>
                    <span className="num text-left font-bold text-slate-200">{formatDecimal(s.intaProfitRatio, 0)}٪</span>
                    <span className="text-slate-500">چرخه نقد (CCC)</span>
                    <span className={cn("num text-left font-bold", cccTone(s.cccDays))}>
                      {s.cccDays < 0 ? `${formatDecimal(Math.abs(s.cccDays), 0)}−` : formatDecimal(s.cccDays, 0)} روز
                    </span>
                    <span className="text-slate-500">امتیاز جذابیت</span>
                    <span className="num text-left font-black text-gold-200">{formatDecimal(s.avgScore, 1)}</span>
                  </div>
                </div>
              ))}
              <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[10.5px] leading-5 text-slate-500">
                رسته‌های با CCC منفی، نقدینگی را پیش از پرداخت به تأمین‌کننده دریافت می‌کنند و بهترین کاندیدای
                تسهیلات پذیرنده (طرح پوز) هستند؛ CCC بلند نشان‌دهنده نیاز به ابزارهای اسنادی و زنجیره تأمین است.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
