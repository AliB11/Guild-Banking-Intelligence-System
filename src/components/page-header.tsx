import type { ReactNode } from "react";

export function PageHeader({
  title,
  kicker,
  description,
  actions,
}: {
  title: string;
  kicker: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold-500/90">
          <span className="h-px w-7 bg-gradient-to-l from-gold-500 to-transparent" />
          {kicker}
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-[28px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-400">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
