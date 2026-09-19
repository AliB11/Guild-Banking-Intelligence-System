import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="glass max-w-md p-10 text-center">
        <Compass className="mx-auto h-12 w-12 text-gold-400" />
        <p className="num mt-4 text-5xl font-black text-white" dir="ltr">404</p>
        <h1 className="mt-3 text-xl font-black text-white">صفحه یافت نشد</h1>
        <p className="mt-2 text-[12.5px] leading-6 text-slate-400">
          نشانی‌ای که درخواست کردید در سامانه هوش بانکداری اصناف وجود ندارد.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 text-[12.5px] font-bold text-gold-300 transition hover:bg-gold-500/20"
        >
          بازگشت به میز کار مدیریتی
        </Link>
      </div>
    </main>
  );
}
