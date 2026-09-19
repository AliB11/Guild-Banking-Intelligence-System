import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold leading-5 transition-colors",
  {
    variants: {
      variant: {
        gold: "border-gold-500/35 bg-gold-500/10 text-gold-300",
        persian: "border-persian-500/35 bg-persian-500/10 text-persian-300",
        slate: "border-white/10 bg-white/[0.04] text-slate-300",
        rose: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
        blue: "border-sky-500/30 bg-sky-500/10 text-sky-300",
        ghost: "border-transparent bg-transparent text-slate-400",
      },
    },
    defaultVariants: { variant: "slate" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
