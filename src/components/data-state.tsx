"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

/** Shared skeleton shown while the in-browser data layer computes a page. */
export function DataLoading({ label = "در حال آماده‌سازی داده‌ها…" }: { label?: string }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4" role="status">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-gold-500/25 border-t-gold-400" />
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-52 max-w-[80vw] rounded-full bg-white/[0.07]" />
        <div className="h-8 w-80 max-w-[80vw] rounded-lg bg-white/[0.05]" />
        <div className="h-3 w-64 max-w-[80vw] rounded-full bg-white/[0.04]" />
      </div>
    </div>
  );
}

/** Shared error state with an optional retry action. */
export function DataError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex min-h-[45vh] items-center justify-center">
      <div className="glass max-w-md p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-300" />
        <h2 className="mt-4 text-lg font-black text-white">دریافت داده‌ها ناموفق بود</h2>
        <p className="mt-2 text-[12px] leading-6 text-slate-400">
          محاسبه‌ی داده‌های نمونه خطا داد. یک‌بار دیگر تلاش کنید یا صفحه را بازنشانی کنید.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-[12px] font-bold text-gold-300 transition hover:bg-gold-500/20"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            تلاش مجدد
          </button>
        )}
      </div>
    </div>
  );
}
