import { CircleHelp } from "lucide-react";

export function ReadingGuide({
  items,
  title = "چطور این صفحه را بخوانیم؟",
}: {
  items: string[];
  title?: string;
}) {
  return (
    <details className="group mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 animate-fade-up">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[12.5px] font-extrabold text-slate-200">
        <CircleHelp className="h-4 w-4 text-gold-400" />
        {title}
        <span className="mr-auto text-[10px] font-bold text-slate-500 group-open:hidden">باز کردن</span>
        <span className="mr-auto hidden text-[10px] font-bold text-slate-500 group-open:inline">بستن</span>
      </summary>
      <ol className="mt-3 space-y-2 pr-1 text-[12.5px] leading-7 text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500/80" />
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
