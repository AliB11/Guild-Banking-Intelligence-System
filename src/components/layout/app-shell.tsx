"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Network,
  KanbanSquare,
  Calculator,
  Landmark,
  Menu,
  X,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { faDigits, formatJalaliDate } from "@/lib/gbi/format";

const NAV = [
  { href: "/", label: "میز کار مدیریتی", latin: "Executive Desk", icon: LayoutDashboard },
  { href: "/guilds", label: "کاوشگر ماتریس اصناف", latin: "Guild Matrix", icon: Network },
  { href: "/leads", label: "مدیریت سرنخ‌های شعب", latin: "Lead Pipeline", icon: KanbanSquare },
  { href: "/calculator", label: "ماشین‌حساب سودآوری", latin: "Profitability Lab", icon: Calculator },
];

function LiveClock() {
  // Lazy initialisation avoids the setState-in-effect lint violation. The
  // hydration warning is intentional: a live clock cannot have one fixed SSR
  // value and still be accurate on the client.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span suppressHydrationWarning className="num text-slate-300">
      {formatJalaliDate(now)}
      <span className="mx-2 text-slate-600">|</span>
      {faDigits(
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      )}
    </span>
  );
}

function Sidebar({
  open,
  onClose,
  demoMode,
}: {
  open: boolean;
  onClose: () => void;
  demoMode: boolean;
}) {
  const pathname = usePathname();
  return (
    <>
      {/* Mobile scrim */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-white/[0.06] bg-night-900/95 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="px-6 pb-7 pt-7">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-[0_10px_30px_-8px_rgba(224,171,58,0.55)]">
              <Landmark className="h-6 w-6 text-night-950" strokeWidth={2.2} />
              <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full border-2 border-night-900 bg-persian-400 animate-pulse-soft" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-white">
                GBI <span className="gold-text">اصناف</span>
              </p>
              <p className="text-[11px] font-medium text-slate-400">
                سامانه هوش بانکداری اصناف
              </p>
            </div>
          </div>
          <div className="ring-line mt-6" />
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            ماژول‌های عملیاتی
          </p>
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-300",
                  active
                    ? "bg-gradient-to-l from-gold-500/[0.16] to-transparent text-gold-300"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                )}
              >
                <span
                  className={cn(
                    "absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full transition-all duration-300",
                    active ? "bg-gold-400 shadow-[0_0_12px_rgba(245,200,96,0.8)]" : "bg-transparent",
                  )}
                />
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110",
                    active ? "text-gold-400" : "text-slate-500 group-hover:text-slate-300",
                  )}
                  strokeWidth={2}
                />
                <span className="flex-1">{item.label}</span>
                <span
                  className={cn(
                    "text-[9px] font-medium tracking-wide transition-opacity",
                    active ? "text-gold-500/70" : "text-slate-600 opacity-0 group-hover:opacity-100",
                  )}
                >
                  {item.latin}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Compliance footer */}
        <div className={cn(
          "m-4 rounded-xl border p-4",
          demoMode ? "border-gold-500/20 bg-gold-500/[0.06]" : "border-persian-500/20 bg-persian-500/[0.06]",
        )}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className={cn("h-5 w-5", demoMode ? "text-gold-400" : "text-persian-400")} />
            <p className={cn("text-xs font-bold", demoMode ? "text-gold-300" : "text-persian-300")}>
              {demoMode ? "حالت نمایشی فعال" : "اتصال به سامانه مؤدیان"}
            </p>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
            {demoMode
              ? "DATABASE_URL تنظیم نشده است؛ داده‌های نمونه برای بررسی رابط کاربری نمایش داده می‌شود."
              : "پایش لحظه‌ای انطباق مالیاتی پایانه‌ها و ضرایب اینتاکد فعال است."}
          </p>
        </div>
      </aside>
    </>
  );
}

export function AppShell({ children, demoMode }: { children: ReactNode; demoMode: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} demoMode={demoMode} />

      <div className="lg:mr-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-night-950/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-4 px-5 sm:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 lg:hidden"
              aria-label="باز کردن منو"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className={cn("flex h-2 w-2 animate-pulse-soft rounded-full", demoMode ? "bg-gold-400" : "bg-persian-400")} />
              {demoMode ? "حالت نمایشی — اتصال پایگاه‌داده برقرار نیست" : "شبکه شاپرک متصل — داده‌های پذیرندگان به‌روز"}
            </div>
            <div className="flex-1" />
            <div className="text-xs">
              <LiveClock />
            </div>
            <span className="hidden h-5 w-px bg-white/10 sm:block" />
            <button className="relative rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/5" aria-label="اعلان‌ها">
              <Bell className="h-4 w-4" />
              <span className="absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/40 bg-gradient-to-br from-night-700 to-night-800 text-[13px] font-bold text-gold-300">
                ب‌ت
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold text-slate-200">مدیریت بازاریابی اصناف</p>
                <p className="text-[10px] text-slate-500">ستاد بانکداری خرد</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">{children}</main>
      </div>
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed left-4 top-4 z-[60] rounded-lg border border-white/10 bg-night-900 p-2 text-slate-300 lg:hidden"
          aria-label="بستن منو"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
