"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { faDigits, formatDecimal } from "@/lib/gbi/format";
import { getGuildAtlas, GUILD_CATEGORY_LABEL } from "@/lib/gbi/market-view";
import type { GuildTaxonomyRow } from "@/lib/gbi/published-market";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | keyof typeof GUILD_CATEGORY_LABEL;

export function GuildAtlas() {
  const atlas = useMemo(() => getGuildAtlas(), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const counts = useMemo(() => {
    const next: Record<string, number> = { all: atlas.length };
    for (const row of atlas) {
      next[row.category] = (next[row.category] ?? 0) + 1;
    }
    return next;
  }, [atlas]);

  const rows = useMemo(() => {
    const q = query.trim();
    return atlas.filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (!q) return true;
      return `${row.title} ${row.isicCode} ${row.intaCode} ${row.defaultMcc} ${row.citation}`.includes(q);
    });
  }, [atlas, category, query]);

  const citedInta = atlas.filter((row) => row.intaProfitRatio > 0).length;
  const exempt = atlas.filter((row) => row.feeExempt).length;

  return (
    <div className="space-y-5">
      <section className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(GUILD_CATEGORY_LABEL) as Array<keyof typeof GUILD_CATEGORY_LABEL>).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(category === key ? "all" : key)}
            className={cn(
              "rounded-2xl border p-4 text-right transition",
              category === key
                ? "border-gold-500/40 bg-gold-500/[0.08]"
                : "border-white/[0.07] bg-white/[0.02] hover:border-white/15",
            )}
          >
            <p className="text-[12px] font-extrabold text-white">{GUILD_CATEGORY_LABEL[key]}</p>
            <p className="num mt-2 text-lg font-black text-gold-200">{faDigits(counts[key] ?? 0)}</p>
            <p className="mt-1 text-[10px] text-slate-500">رسته در طبقه‌بندی</p>
          </button>
        ))}
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>جدول مرجع رسته‌ها</CardTitle>
            <CardDescription>
              گردش ماهانه رسته در شاپرک عمومی نیست. {faDigits(citedInta)} رسته ضریب اینتا نقل‌شده دارند و{" "}
              {faDigits(exempt)} رسته معاف کارمزد پذیرنده‌اند.
            </CardDescription>
          </div>
          <Badge variant="slate">{faDigits(rows.length)} رسته</Badge>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1 sm:max-w-80">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجوی رسته، ISIC، اینتاکد، MCC…"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-3 pr-9 text-[12px] text-slate-200 placeholder:text-slate-600 focus:border-gold-500/40 focus:outline-none focus:ring-2 focus:ring-gold-500/15"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                setQuery("");
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-slate-200"
            >
              پاک کردن فیلتر
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-right">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10.5px] font-bold text-slate-500">
                  <th className="px-3 py-2">رسته</th>
                  <th className="px-3 py-2">گروه</th>
                  <th className="px-3 py-2 text-center">ISIC</th>
                  <th className="px-3 py-2 text-center">اینتاکد</th>
                  <th className="px-3 py-2 text-center">ضریب اینتا</th>
                  <th className="px-3 py-2 text-center">MCC</th>
                  <th className="px-3 py-2 text-center">کارمزد پذیرنده</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <AtlasRow key={`${row.category}-${row.title}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <p className="py-8 text-center text-[12px] text-slate-500">رسته‌ای با این جستجو پیدا نشد.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AtlasRow({ row }: { row: GuildTaxonomyRow }) {
  return (
    <tr className="border-b border-white/[0.04] text-[12px] last:border-0">
      <td className="px-3 py-3">
        <p className="font-extrabold text-slate-100">{row.title}</p>
        <p className="mt-1 max-w-sm text-[10.5px] leading-5 text-slate-500">{row.citation}</p>
      </td>
      <td className="px-3 py-3 text-slate-400">{GUILD_CATEGORY_LABEL[row.category]}</td>
      <td className="num px-3 py-3 text-center text-slate-300" dir="ltr">
        {row.isicCode}
      </td>
      <td className="num px-3 py-3 text-center text-slate-300" dir="ltr">
        {row.intaCode}
      </td>
      <td className="num px-3 py-3 text-center">
        {row.intaProfitRatio > 0 ? (
          <span className="font-black text-violet-300">{formatDecimal(row.intaProfitRatio, 1)}٪</span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>
      <td className="num px-3 py-3 text-center text-slate-300" dir="ltr">
        {row.defaultMcc}
      </td>
      <td className="px-3 py-3 text-center">
        {row.feeExempt ? (
          <Badge variant="persian">معاف — بانک می‌پردازد</Badge>
        ) : (
          <span className="text-[11px] text-slate-500">پلکان عمومی</span>
        )}
      </td>
    </tr>
  );
}
