# امکان‌سنجی: اجرای پروژه روی GitHub بدون دیتابیس

تاریخ: ۱۴۰۵/۰۶/۲۸ · نتیجه: ✅ **کاملاً امکان‌پذیر**

## هدف

پروژه GBI به‌طوری تغییر کند که روی GitHub (GitHub Pages) به‌راحتی و با **یک کلیک** قابل اجرا باشد و **هیچ دیتابیس** (PostgreSQL) یا سرور Node در محیط اجرا نیاز نداشته باشد.

## وضعیت موجود (معماری فعلی)

| لایه | وضعیت |
| --- | --- |
| صفحات (dashboard / guilds / leads / calculator) | Server Component که مستقیم `service.ts` را صدا می‌زنند |
| ۷ مسیر API | `NextResponse` + `force-dynamic` (سرور) |
| `src/lib/gbi/service.ts` | دو مسیر: PostgreSQL (Drizzle + pg) **یا** corpus درون‌حافظه‌ای `demo-data.ts` |
| موتور محاسباتی (`engine.ts`، `operations.ts`، `service-ops.ts`، `format.ts`) | **کاملاً Pure TypeScript** — هیچ I/O و هیچ API نودی ندارد |
| داده‌های نمایشی (`demo-data.ts`) | تولید دترمینیستیک درون‌حافظه‌ای، بدون وابستگی به شبکه |
| کامپوننت‌های UI | از قبل همگی `"use client"` (recharts، کانبان، رادار و…) |
| فراخوانی‌های کلاینت به API | فقط ۴ مورد: `GET /api/leads`، `PATCH /api/leads/:id`، `GET /api/guilds/compare`، `POST /api/calculator` |

## مانع‌های GitHub Pages

GitHub Pages فقط **فایل استاتیک** سرو می‌کند: نه Node runtime، نه Route Handler، نه اجرای Server Component در لحظه درخواست.

| مانع | تحلیل | راه‌حل |
| --- | --- | --- |
| `output: "standalone"` + وجود `src/app/api/**` | `next build` با `output: "export"` در حضور Route Handler **خطا می‌دهد** | APIها از درخت `app` خارج می‌شوند؛ به‌جای آن‌ها یک لایه داده‌ی کلاینت‌ساید اضافه می‌شود. حالت full-stack اختیاری با یک Node server کوچک جداگانه حفظ می‌شود |
| فراخوانی `fetch("/api/...")` در ۴ کامپوننت | روی Pages سروری وجود ندارد | تعویض با لایه `client-data.ts` که همان توابع pure محاسباتی را روی corpus درون‌حافظه‌ای اجرا می‌کند |
| تغییر مرحله سرنخ (`PATCH`) | بدون سرور نمی‌تواند در PG ذخیره شود | ذخیره در **حافظه + localStorage مرورگر** (با قابلیت بازنشانی)؛ منطق یکسان، فقط persistence محلی |
| سرو در زیرمسیر `/Guild-Banking-Intelligence-System/` | GitHub Pages هر repo را زیر `/owner/repo/` سرو می‌کند | `trailingSlash: true` → `guilds/index.html` و لینک‌های `/guilds/` روی Pages درست روت می‌شوند |
| متغیرهای محیطی (`DATABASE_URL` و…) | در حالت استاتیک معنایی ندارند | build استاتیک **بدون هیچ env** اجرا می‌شود؛ pg اصلاً وارد باندل نمی‌شود |
| تازگی داده‌ها | بدون دیتابیس داده ثابت است | corpus نمونه دترمینیستیک است؛ «زنده» بودن UI با محاسبه لحظه‌ای در مرورگر حفظ می‌شود و تغییرات قیف در localStorage ماندگار است |

## چرا قابل اجراست (شواهد کلیدی)

1. تمام محاسبات (امتیازدهی، BCG، هشدارها، ماشین‌حساب، شوک نقدینگی) **بدون سرور** اجرا می‌شوند؛ فقط `loadCorpus` و `updateLeadStage` مسیر PG دارند و آن‌ها در حالت استاتیک اصلاً لود نمی‌شوند.
2. corpus نمونه (`demo-data.ts`) فقط **type** از اسکیما می‌خواهد؛ واردات‌های مقداری بی‌استفاده از `@/db/schema` حذف می‌شوند تا هیچ بخشی از Drizzle وارد باندل مرورگر نشود.
3. UI از قبل client-side است؛ فقط منبع داده از fetch شبکه به تابع مستقیم تغییر می‌کند.
4. حجم باندل و زمان build قابل قبول است (۴ صفحه، بدون تصویر ریموت، فونت لوکال Vazirmatn).

## معماری هدف (دو حالت)

### ۱. حالت اصلی — استاتیک / بدون دیتابیس (GitHub Pages)

```
مرورگر
 ├─ صفحات (Client Components + React Query)
 ├─ client-data.ts  ← corpus درون‌حافظه‌ای + localStorage (تغییرات قیف)
 └─ engine.ts / compute.ts / operations.ts / service-ops.ts (pure)
```

- `next build` → `out/` (فایل خالص HTML/JS/CSS)
- Workflow `pages.yml` روی هر push به `main`، `out/` را روی GitHub Pages منتشر می‌کند.
- فعال‌سازی: یک‌بار در Settings → Pages → Source: **GitHub Actions**.

### ۲. حالت اختیاری — full-stack با PostgreSQL (Node server)

- `src/server/server.ts`: سرور HTTP خالص نود (بدون فریم‌ورک) که هم `out/` را سرو می‌کند و هم APIهای JSON قبلی را.
- اگر `DATABASE_URL` تنظیم باشد → Drizzle + pg + audit/outbox (منطق قبلی، بدون تغییر).
- اگر تنظیم نباشد → همان demo mode درون‌حافظه‌ای.
- Docker/compose و مسیر seed/migration دست‌نخورده می‌مانند.

## ریسک‌ها و محدودیت‌ها

| مورد | سطح | توضیح |
| --- | --- | --- |
| ماندگاری تغییرات قیف | پایین | فقط در مرورگر همان کاربر (localStorage)؛ بین کاربران/دستگاه‌ها سینک نمی‌شود — با ماهیت demo سازگار است |
| بدون ورودی داده واقعی | توسط‌طراحی | حالت استاتیک ذاتاً نمونه‌ای است؛ برای داده واقعی باید حالت ۲ (PG) استفاده شود |
| صحت ارقام | بدون تغییر | هیچ فرمولی دست نمی‌خورد؛ فقط محل اجرا از سرور به مرورگر جابه‌جا می‌شود |
| APIهای قدیمی روی Vercel | میانه | با خروج API از `app/`، حالت «Vercel + PG» به‌جای Route Handler از Node server استفاده می‌کند؛ قرارداد JSON APIها حفظ شده است |

## مصوبات پیاده‌سازی

1. `next.config.ts` → `output: "export"` + `trailingSlash: true`
2. جداسازی محاسبات pure به `src/lib/gbi/compute.ts`؛ `service.ts` فقط facade سرور می‌ماند
3. لایه داده کلاینت‌ساید: `src/lib/gbi/client-data.ts` (+ بازنشانی localStorage)
4. تبدیل ۴ صفحه به Client Component با React Query
5. حذف `src/app/api/**` و جابه‌جایی آن‌ها به `src/server/server.ts` (حالت اختیاری PG)
6. `npm start` → سرو `out/` (+API) بدون هیچ پیش‌نیاز
7. Workflow GitHub Pages + بازنویسی بخش استقرار README
