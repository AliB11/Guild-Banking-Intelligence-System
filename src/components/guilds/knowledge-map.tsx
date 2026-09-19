"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { faDigits, formatDecimal } from "@/lib/gbi/format";
import { getGuildKnowledge, GUILD_CATEGORY_LABEL, GUILD_POLICY_LABEL } from "@/lib/gbi/market-view";
import type { GuildTaxonomyRow } from "@/lib/gbi/published-market";

export function GuildKnowledgeMap() {
  const { exempt, citedInta, codeOnly } = getGuildKnowledge();

  return (
    <section className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <KnowledgeColumn
        title={GUILD_POLICY_LABEL.FEE_EXEMPT.title}
        hint={GUILD_POLICY_LABEL.FEE_EXEMPT.hint}
        tone="persian"
        rows={exempt}
        empty="رسته معافی در این نسخه نیست"
      />
      <KnowledgeColumn
        title={GUILD_POLICY_LABEL.INTA_CITED.title}
        hint={GUILD_POLICY_LABEL.INTA_CITED.hint}
        tone="violet"
        rows={citedInta}
        empty="ضریب نقل‌شده‌ای نیست"
        showInta
      />
      <KnowledgeColumn
        title={GUILD_POLICY_LABEL.CODE_ONLY.title}
        hint={GUILD_POLICY_LABEL.CODE_ONLY.hint}
        tone="slate"
        rows={codeOnly}
        empty="—"
      />
      <Card className="lg:col-span-3">
        <CardHeader>
          <div>
            <CardTitle>سیاست کارمزد و مالیات — نه سود شاپرک</CardTitle>
            <CardDescription>
              {faDigits(exempt.length)} رسته معاف · {faDigits(citedInta.length)} ضریب اینتا · {faDigits(codeOnly.length)} فقط کد.
              هیچ‌کدام گردش شاپرک ندارند. سوپرمارکت در دو ستون اول تکرار می‌شود چون هم معاف است هم اینتا دارد.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-[12px] leading-6 text-slate-400">
          برای ستاد بانک این نقشه سیاست است نه سهم بازار: نانوایی و سوپرمارکت هزینه کارمزد را به بانک منتقل می‌کنند؛ رستوران و اغذیه ضریب مالیاتی
          دارند اما سبد رسته در ماهنامه نیست. بقیه رسته‌ها فقط برای اتصال جواز به MCC نگه داشته شده‌اند.
        </CardContent>
      </Card>
    </section>
  );
}

function KnowledgeColumn({
  title,
  hint,
  tone,
  rows,
  empty,
  showInta,
}: {
  title: string;
  hint: string;
  tone: "persian" | "violet" | "slate";
  rows: GuildTaxonomyRow[];
  empty: string;
  showInta?: boolean;
}) {
  const border =
    tone === "persian"
      ? "border-persian-500/25 bg-persian-500/[0.04]"
      : tone === "violet"
        ? "border-violet-500/25 bg-violet-500/[0.04]"
        : "border-white/[0.07] bg-white/[0.02]";

  return (
    <div className={`rounded-2xl border p-4 ${border}`}>
      <p className="text-[13px] font-black text-white">{title}</p>
      <p className="mt-1 text-[10.5px] leading-5 text-slate-500">{hint}</p>
      <ul className="mt-3 space-y-2">
        {rows.length === 0 && <li className="text-[12px] text-slate-600">{empty}</li>}
        {rows.map((row) => (
          <li key={row.title} className="rounded-xl border border-white/[0.06] bg-night-950/40 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-extrabold text-slate-100">{row.title}</p>
              {showInta && row.intaProfitRatio > 0 && (
                <Badge variant="violet">{formatDecimal(row.intaProfitRatio, 1)}٪</Badge>
              )}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {GUILD_CATEGORY_LABEL[row.category]} · MCC {row.defaultMcc}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
