"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="glass max-w-lg p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-300" />
        <h1 className="mt-4 text-xl font-black text-white">بارگذاری داده‌ها ناموفق بود</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          اتصال سامانه یا داده‌های این بخش در دسترس نیست. تنظیم DATABASE_URL و وضعیت PostgreSQL را بررسی کنید و دوباره تلاش کنید.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2.5 text-sm font-bold text-gold-200 transition hover:bg-gold-500/20"
        >
          <RotateCcw className="h-4 w-4" />
          تلاش دوباره
        </button>
      </div>
    </main>
  );
}
