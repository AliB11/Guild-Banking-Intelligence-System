"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Database, Radio } from "lucide-react";
import { loadCatalogClient } from "@/lib/gbi/sources/load-client";
import { faDigits } from "@/lib/gbi/format";
import { cn } from "@/lib/utils";

export function DataFreshnessBar() {
  const { data } = useQuery({
    queryKey: ["intelligence-catalog"],
    queryFn: loadCatalogClient,
    staleTime: 5 * 60_000,
  });

  if (!data) {
    return (
      <span className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
        <span className="flex h-2 w-2 animate-pulse-soft rounded-full bg-gold-400" />
        در حال خواندن تبار داده…
      </span>
    );
  }

  const reachable = data.sources.filter((source) => source.lastProbe?.status === "ok").length;
  const reviews = data.sources.filter((source) => source.pendingHumanReview).length;
  const tone = reviews > 0 ? "text-gold-300" : "text-slate-400";

  return (
    <Link
      href="/sources/"
      className={cn(
        "hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold transition hover:border-gold-500/30 hover:text-gold-200 sm:flex",
        tone,
      )}
      title="مشاهده منابع اطلاعاتی و تقویم انتشار"
    >
      <Radio className="h-3.5 w-3.5 text-gold-400" />
      <span>دوره {data.reporting.latestPeriodLabel}</span>
      <span className="hidden text-slate-600 sm:inline">|</span>
      <Database className="hidden h-3.5 w-3.5 text-persian-400 sm:inline" />
      <span className="hidden sm:inline">
        {faDigits(reachable)} منبع در دسترس
        {reviews > 0 ? ` · ${faDigits(reviews)} بازبینی` : ""}
      </span>
    </Link>
  );
}
