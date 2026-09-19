import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "GBI | سامانه هوش بانکداری اصناف",
  description:
    "Guild Banking Intelligence — پلتفرم تحلیل، امتیازدهی و هدف‌گیری اصناف برای بانک‌های تجاری ایران. میز کار مدیریتی، ماتریس اصناف، قیف سرنخ‌ها و ماشین‌حساب سودآوری تسهیلات.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className="bg-night-950 text-slate-200 antialiased">
        {/* Ambient glows */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(23,179,166,0.13),transparent_65%)]" />
          <div className="absolute bottom-[-15%] left-[-8%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(224,171,58,0.1),transparent_65%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,178,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(148,178,255,0.025)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
        </div>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
