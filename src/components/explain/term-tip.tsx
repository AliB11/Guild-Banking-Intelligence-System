import { GLOSSARY_BY_ID } from "@/lib/gbi/glossary";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function TermTip({
  id,
  children,
  className,
}: {
  id: string;
  children?: ReactNode;
  className?: string;
}) {
  const term = GLOSSARY_BY_ID[id];
  if (!term) return <>{children}</>;
  return (
    <abbr
      title={`${term.plain}${term.example ? ` مثال: ${term.example}` : ""}`}
      className={cn(
        "cursor-help border-b border-dotted border-gold-500/45 font-semibold not-italic decoration-transparent",
        className,
      )}
    >
      {children ?? term.term}
    </abbr>
  );
}
