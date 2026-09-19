"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MonitorSmartphone,
  HandCoins,
  ScrollText,
  Network,
  ReceiptText,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Building2,
  CalendarDays,
  Flame,
  ChevronLeft,
  GripVertical,
  Sparkles,
  Clock3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDecimal, formatJalaliDate } from "@/lib/gbi/format";
import { getLeadsClient, updateLeadStageClient } from "@/lib/gbi/client-data";
import { DataLoading } from "@/components/data-state";
import {
  PRODUCT_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  type LeadDTO,
  type LeadsResponse,
} from "@/lib/gbi/types";
import type { PipelineStage, RecommendedProduct } from "@/db/schema";

const PRODUCT_ICONS: Record<RecommendedProduct, typeof MonitorSmartphone> = {
  POS_EXPANSION: MonitorSmartphone,
  WORKING_CAPITAL_LOAN: HandCoins,
  LC_DOMESTIC: ScrollText,
  SCF_GAM: Network,
  BILL_DISCOUNTING: ReceiptText,
};

const PRODUCT_TONE: Record<RecommendedProduct, string> = {
  POS_EXPANSION: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  WORKING_CAPITAL_LOAN: "border-gold-500/35 bg-gold-500/10 text-gold-300",
  LC_DOMESTIC: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  SCF_GAM: "border-persian-500/30 bg-persian-500/10 text-persian-300",
  BILL_DISCOUNTING: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

const STAGE_META: Record<PipelineStage, { dot: string; rail: string; text: string }> = {
  NEW: { dot: "bg-sky-400", rail: "border-sky-500/20", text: "text-sky-300" },
  CONTACTED: { dot: "bg-violet-400", rail: "border-violet-500/20", text: "text-violet-300" },
  FINANCIAL_EVALUATION: { dot: "bg-gold-400", rail: "border-gold-500/25", text: "text-gold-300" },
  CONVERTED: { dot: "bg-persian-400", rail: "border-persian-500/25", text: "text-persian-300" },
  LOST: { dot: "bg-rose-400", rail: "border-rose-500/20", text: "text-rose-300" },
};

const ACTION_TONE = {
  critical: "border-rose-500/30 bg-rose-500/[0.08] text-rose-200",
  high: "border-gold-500/30 bg-gold-500/[0.08] text-gold-200",
  normal: "border-persian-500/20 bg-persian-500/[0.06] text-persian-200",
  low: "border-white/[0.08] bg-white/[0.03] text-slate-300",
} as const;

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 75 ? "#f5c860" : score >= 55 ? "#3bd6c8" : score >= 40 ? "#a78bfa" : "#64748b";
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-9 w-9 shrink-0">
      <svg viewBox="0 0 32 32" className="h-9 w-9 -rotate-90">
        <circle cx="16" cy="16" r={r} fill="none" stroke="rgba(148,178,255,0.12)" strokeWidth="3.5" />
        <circle
          cx="16" cy="16" r={r} fill="none" stroke={tone} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (Math.min(100, score) / 100) * c}
        />
      </svg>
      <span className="num absolute inset-0 flex items-center justify-center text-[9.5px] font-black" style={{ color: tone }}>
        {formatDecimal(score, 0)}
      </span>
    </div>
  );
}

function LeadCard({
  lead,
  dragging,
  onDragStart,
  onDragEnd,
  onMoveNext,
  nextStage,
}: {
  lead: LeadDTO;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMoveNext: () => void;
  nextStage: PipelineStage | null;
}) {
  const Icon = PRODUCT_ICONS[lead.recommendedProduct];
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn("kanban-card group rounded-xl border border-white/[0.07] bg-night-800/90 p-3.5", dragging && "dragging")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-slate-100">
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-600 opacity-0 transition group-hover:opacity-100" />
            <span className="truncate">{lead.merchant.businessName}</span>
          </p>
          <p className="mt-0.5 truncate pr-5 text-[10px] text-slate-500">
            {lead.merchant.ownerName} · {lead.merchant.subGuildTitle}
          </p>
        </div>
        <ScoreRing score={lead.leadScore} />
      </div>

      <div className={cn("mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold", PRODUCT_TONE[lead.recommendedProduct])}>
        <Icon className="h-3.5 w-3.5" />
        {PRODUCT_LABELS[lead.recommendedProduct]}
      </div>

      <div className={cn("mt-3 rounded-lg border px-2.5 py-2", ACTION_TONE[lead.nextAction.urgency])}>
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold">
          <Sparkles className="h-3 w-3" />
          اقدام بعدی: {lead.nextAction.label}
          <span className="mr-auto inline-flex items-center gap-1 text-[9px] opacity-80">
            <Clock3 className="h-3 w-3" />
            {lead.nextAction.dueHours}ساعت
          </span>
        </p>
        <p className="mt-1 text-[9px] leading-4 opacity-75">{lead.nextAction.reason}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {lead.merchant.province}، {lead.merchant.city}
        </span>
        <span className="num inline-flex items-center gap-1" dir="ltr">
          <Building2 className="h-3 w-3" />
          {lead.branchCode}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
        <span className="inline-flex items-center gap-1 text-[9.5px] text-slate-500">
          <CalendarDays className="h-3 w-3" />
          {formatJalaliDate(new Date(lead.lastInteractionDate))}
        </span>
        <div className="flex items-center gap-1.5">
          {lead.merchant.isTaxCompliant ? (
            <ShieldCheck className="h-3.5 w-3.5 text-persian-400" aria-label="متصل به سامانه مؤدیان" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" aria-label="غیرمتصل به سامانه مؤدیان" />
          )}
          {nextStage && (
            <button
              onClick={onMoveNext}
              className="flex items-center gap-0.5 rounded-lg border border-white/10 px-1.5 py-1 text-[9px] font-bold text-slate-400 transition hover:border-gold-500/40 hover:text-gold-300"
              title={`انتقال به «${STAGE_LABELS[nextStage]}»`}
            >
              مرحله بعد
              <ChevronLeft className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function calculateLeadStats(leads: LeadDTO[]): LeadsResponse["stats"] {
  const byStage = leads.reduce(
    (accumulator, lead) => {
      accumulator[lead.pipelineStage] = (accumulator[lead.pipelineStage] ?? 0) + 1;
      return accumulator;
    },
    { NEW: 0, CONTACTED: 0, FINANCIAL_EVALUATION: 0, CONVERTED: 0, LOST: 0 } as LeadsResponse["stats"]["byStage"],
  );
  return {
    total: leads.length,
    byStage,
    avgScore: leads.length ? leads.reduce((total, lead) => total + lead.leadScore, 0) / leads.length : 0,
    hotCount: leads.filter((lead) => lead.leadScore >= 75).length,
    actionRequiredCount: leads.filter((lead) => lead.nextAction.urgency === "critical" || lead.nextAction.urgency === "high").length,
  };
}

export function LeadKanban() {
  const queryClient = useQueryClient();
  const { data } = useQuery<LeadsResponse>({
    queryKey: ["leads"],
    queryFn: getLeadsClient,
  });

  // Keep optimistic changes separate from the server snapshot. This avoids a
  // setState-in-effect feedback loop and lets a failed PATCH roll back cleanly.
  const [stageOverrides, setStageOverrides] = useState<Record<string, PipelineStage>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<PipelineStage | null>(null);

  const leads = (data?.leads ?? []).map((lead) => ({
    ...lead,
    pipelineStage: stageOverrides[lead.id] ?? lead.pipelineStage,
  }));

  const mutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: PipelineStage }) => {
      const lead = updateLeadStageClient(id, stage);
      return { ok: true, lead };
    },
    onMutate: ({ id, stage }) => {
      setStageOverrides((current) => ({ ...current, [id]: stage }));
    },
    onError: (_error, { id, stage }) => {
      setStageOverrides((current) => {
        if (current[id] !== stage) return current;
        const next = { ...current };
        delete next[id];
        return next;
      });
    },
    onSettled: async (_result, _error, { id, stage }) => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setStageOverrides((current) => {
        if (current[id] !== stage) return current;
        const next = { ...current };
        delete next[id];
        return next;
      });
    },
  });

  const move = (id: string, stage: PipelineStage) => {
    const current = leads.find((lead) => lead.id === id);
    if (!current || current.pipelineStage === stage || mutation.isPending) return;
    mutation.mutate({ id, stage });
  };

  const stats = calculateLeadStats(leads);

  if (!data) {
    return <DataLoading label="در حال بارگذاری سرنخ‌ها…" />;
  }

  return (
    <div className="space-y-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 animate-fade-up">
        {[
          { label: "کل سرنخ‌ها در قیف", value: formatDecimal(stats.total, 0), tone: "text-slate-100" },
          { label: "میانگین امتیاز", value: formatDecimal(stats.avgScore, 1), tone: "text-gold-300" },
          { label: "سرنخ داغ (۷۵+)", value: formatDecimal(stats.hotCount, 0), tone: "text-rose-300" },
          { label: "اقدام فوری", value: formatDecimal(stats.actionRequiredCount, 0), tone: "text-orange-300" },
          { label: "تبدیل‌شده", value: formatDecimal(stats.byStage.CONVERTED ?? 0, 0), tone: "text-persian-300" },
        ].map((s) => (
          <div key={s.label} className="glass px-4 py-3.5">
            <p className="text-[10px] font-bold text-slate-500">{s.label}</p>
            <p className={cn("num mt-1 text-xl font-black", s.tone)}>{s.value}</p>
          </div>
        ))}
      </div>

      {mutation.isError && (
        <div role="alert" className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-[11px] font-bold text-rose-300">
          تغییر مرحله ذخیره نشد؛ وضعیت قبلی بازیابی شد.
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STAGE_ORDER.map((stage) => {
          const meta = STAGE_META[stage];
          const column = leads.filter((l) => l.pipelineStage === stage);
          const idx = STAGE_ORDER.indexOf(stage);
          const nextStage =
            stage === "CONVERTED" || stage === "LOST" ? null : (STAGE_ORDER[idx + 1] as PipelineStage);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDropTarget(stage);
              }}
              onDragLeave={() => setDropTarget((t) => (t === stage ? null : t))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) move(id, stage);
                setDragId(null);
                setDropTarget(null);
              }}
              className={cn(
                "kanban-col flex min-h-64 flex-col rounded-2xl border bg-white/[0.015] p-3 transition-all duration-300",
                meta.rail,
                dropTarget === stage && "drop-target",
              )}
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-[12px] font-extrabold text-slate-200">
                  <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                  {STAGE_LABELS[stage]}
                </span>
                <span className={cn("num rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-black", meta.text)}>
                  {formatDecimal(column.length, 0)}
                </span>
              </header>
              <div className="flex-1 space-y-3">
                {column.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    dragging={dragId === lead.id}
                    onDragStart={() => setDragId(lead.id)}
                    onDragEnd={() => setDragId(null)}
                    onMoveNext={() => nextStage && move(lead.id, nextStage)}
                    nextStage={nextStage}
                  />
                ))}
                {column.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-[10.5px] text-slate-600">
                    سرنخی را اینجا رها کنید
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="flex items-center gap-2 text-[10.5px] text-slate-600">
        <Flame className="h-3.5 w-3.5 text-rose-400" />
        در حالت استاتیک امتیاز کارت‌ها اولویت سیاستی رسته است (معافیت کارمزد، اینتاکد نقل‌شده). فرمول رسوب‌محور وقتی CASA شعبه وصل شود اعمال می‌شود.
      </p>
    </div>
  );
}
