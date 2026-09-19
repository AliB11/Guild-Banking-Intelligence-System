/**
 * Published Iranian payment-market facts used by the static corpus.
 *
 * Rules:
 *  - Every KPI that appears on the dashboard must be cited here.
 *  - No named پذیرنده, no CASA balance, no guild-level Shaparak volume.
 *  - شهریور ۱۴۰۵ is the calendar month, not a published Shaparak month.
 *  - INTA ratios are included only when a public table cites them.
 */

/** ۱ همت = ۱٬۰۰۰ میلیارد تومان = ۱۰^۱۲ تومان = ۱۰^۱۳ ریال */
export const HEMAT_TO_RIALS = 10_000_000_000_000;

export function hematToRials(hemat: number): number {
  return hemat * HEMAT_TO_RIALS;
}

/** Calendar month while this cutover was built — report not published. */
export const CALENDAR_PERIOD = "1405-06";

/** Latest Shaparak economic monthly that reprints actually quote (report #134). */
export const LATEST_PUBLISHED_PERIOD = "1405-05";
export const PREV_PUBLISHED_PERIOD = "1405-04";
export const PUBLISHED_PERIODS = ["1405-03", "1405-04", "1405-05"] as const;

export interface PublishedMonth {
  period: string;
  reportNo: number | null;
  txCount: number;
  volumeRials: number;
  citation: string;
  notes: string[];
}

/**
 * Absolute monthly network totals.
 * خرداد: banker.ir reprint of Shaparak #132 (۱۴۰۵/۰۴/۲۱).
 * تیر: value 3406 همت from Avash/Fararu; count from Mordad MoM +2.97% (matches >4.5B).
 * مرداد: EcoIran 2026-09-13 reprint of Shaparak #134 — 4.65B tx, 3654 همت.
 */
export const SHAPARAK_MONTHS: PublishedMonth[] = [
  {
    period: "1405-03",
    reportNo: 132,
    txCount: 4_688_000_000,
    volumeRials: hematToRials(3367),
    citation: "بازتاب گزارش اقتصادی خرداد ۱۴۰۵ شاپرک (#۱۳۲) — banker.ir",
    notes: [
      "خرید ۹۸٫۸۲٪ تعداد / ۹۰٫۳۳٪ مبلغ",
      "قبوض و شارژ ۱٫۱۸٪ تعداد / ۴٫۶۵٪ مبلغ",
      "مانده‌گیری ۵٫۰۲٪ از تعداد",
      "دسترس‌پذیری شبکه ۹۹٫۹۸٪",
    ],
  },
  {
    period: "1405-04",
    reportNo: 133,
    txCount: 4_516_000_000,
    volumeRials: hematToRials(3406),
    citation: "بازتاب تیر ۱۴۰۵ — ارزش ۳۴۰۶ همت؛ تعداد از MoM مرداد ۲٫۹۷٪ (هم‌خوان با «بیش از ۴٫۵ میلیارد»)",
    notes: ["تعداد به نزدیک‌ترین میلیون گرد شده است"],
  },
  {
    period: "1405-05",
    reportNo: 134,
    txCount: 4_650_000_000,
    volumeRials: hematToRials(3654),
    citation: "بازتاب گزارش مرداد ۱۴۰۵ شاپرک (#۱۳۴) — EcoIran ۱۳ سپتامبر ۲۰۲۶",
    notes: [
      "رشد ماهانه تعداد ۲٫۹۷٪ و مبلغ ۷٫۲۶٪",
      "رشد سالانه تعداد ۳٫۸۵٪ و مبلغ اسمی ۹۳٫۷۲٪ (واقعی حدود ۲٫۵٪)",
    ],
  },
];

export interface InstrumentSplit {
  key: "pos" | "internet" | "other";
  title: string;
  txCount: number;
  volumeRials: number;
  countIsApproximate: boolean;
  citation: string;
}

/** Instrument mix is published for Mordad 1405 only. Other = remainder after quoted POS + internet. */
export const MORDAD_INSTRUMENTS: InstrumentSplit[] = [
  {
    key: "pos",
    title: "کارتخوان فروشگاهی",
    txCount: 4_000_000_000,
    volumeRials: hematToRials(2776),
    countIsApproximate: true,
    citation: "EcoIran: حدود ۴ میلیارد تراکنش کارتخوان / ۲۷۷۶ همت",
  },
  {
    key: "internet",
    title: "پذیرش اینترنتی",
    txCount: 273_000_000,
    volumeRials: hematToRials(860),
    countIsApproximate: false,
    citation: "EcoIran: ۲۷۳ میلیون تراکنش اینترنتی / ۸۶۰ همت",
  },
  {
    key: "other",
    title: "سایر ابزار (موبایل/USSD)",
    txCount: 377_000_000,
    volumeRials: hematToRials(18),
    countIsApproximate: true,
    citation: "مانده پس از ارقام اعلام‌شده کارتخوان و اینترنت نسبت به کل ۴٫۶۵ میلیارد / ۳۶۵۴ همت",
  },
];

/** Quoted POS ticket for Mordad 1405: ~694 thousand toman = 6.94 million rials. */
export const MORDAD_POS_BASKET_RIALS = 6_940_000;

export const MELLAT_MORDAD_ACQUIRER_SHARE = {
  countPct: 18.79,
  valuePct: 19.95,
  citation: "بازتاب سهم بانک ملت به‌عنوان بانک پذیرنده — مرداد ۱۴۰۵",
} as const;

/**
 * CBI card-acquiring circular (۱۴۰۲/۰۴/۰۴ reprints): cardholder 0;
 * merchant 1,200 rials if tx ≤ 6M rials else 0.02% capped at 40,000 rials;
 * نانوایی and سوپرمارکت exempt — the acquiring bank pays.
 */
export const CBI_FEE_EXEMPT_HINT = "نانوایی و سوپرمارکت: کارمزد پذیرنده صفر است و بانک پذیرنده می‌پردازد (بخشنامه بانک مرکزی ۱۴۰۲/۰۴/۰۴، تا اطلاع ثانوی).";

export interface GuildTaxonomyRow {
  category: "production" | "distribution" | "services" | "technical";
  title: string;
  isicCode: string;
  intaCode: string;
  intaProfitRatio: number;
  defaultMcc: string;
  feeExempt: boolean;
  citation: string;
}

export const GUILD_TAXONOMY: GuildTaxonomyRow[] = [
  {
    category: "distribution",
    title: "سوپرمارکت و مواد غذایی",
    isicCode: "4711",
    intaCode: "2260133",
    intaProfitRatio: 8.5,
    defaultMcc: "5411",
    feeExempt: true,
    citation: "ISIC 4711 · MCC 5411 · اینتاکد ۲۲۶۰۱۳۳ ضریب ۸٫۵٪ (جدول سازمان مالیاتی به نقل از hrs-tax) · معاف کارمزد پذیرنده",
  },
  {
    category: "distribution",
    title: "بنکداری مواد غذایی",
    isicCode: "4630",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5399",
    feeExempt: false,
    citation: "ISIC 4630 · MCC 5399 — ضریب اینتا در این نسخه نقل نشده",
  },
  {
    category: "distribution",
    title: "طلا، جواهر و نقره",
    isicCode: "4777",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5944",
    feeExempt: false,
    citation: "ISIC 4777 · MCC 5944 — ضریب اینتا در این نسخه نقل نشده",
  },
  {
    category: "distribution",
    title: "پوشاک خرده‌فروشی",
    isicCode: "4771",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5699",
    feeExempt: false,
    citation: "ISIC 4771 · MCC 5699 — ضریب اینتا در این نسخه نقل نشده",
  },
  {
    category: "services",
    title: "نانوایی",
    isicCode: "1071",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5462",
    feeExempt: true,
    citation: "ISIC 1071 · MCC 5462 · معاف کارمزد پذیرنده (بخشنامه بانک مرکزی)",
  },
  {
    category: "services",
    title: "رستوران معمولی",
    isicCode: "5610",
    intaCode: "—",
    intaProfitRatio: 14,
    defaultMcc: "5812",
    feeExempt: false,
    citation: "ISIC 5610 · MCC 5812 · ضریب سود رستوران معمولی ۱۴٪ (جدول اینتا به نقل از hrs-tax)",
  },
  {
    category: "services",
    title: "اغذیه فروشی",
    isicCode: "5610",
    intaCode: "—",
    intaProfitRatio: 15,
    defaultMcc: "5814",
    feeExempt: false,
    citation: "ISIC 5610 · MCC 5814 · ضریب اغذیه ۱۵–۲۰٪؛ ۱۵٪ به‌عنوان کف منتشرشده",
  },
  {
    category: "services",
    title: "میوه و تره‌بار",
    isicCode: "4721",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5431",
    feeExempt: false,
    citation: "ISIC 4721 · MCC 5431 — ضریب اینتا در این نسخه نقل نشده",
  },
  {
    category: "services",
    title: "قنادی و شیرینی‌فروشی",
    isicCode: "4724",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5462",
    feeExempt: false,
    citation: "ISIC 4724 · MCC 5462 — ضریب اینتا در این نسخه نقل نشده",
  },
  {
    category: "services",
    title: "داروخانه",
    isicCode: "4772",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5912",
    feeExempt: false,
    citation: "ISIC 4772 · MCC 5912 — ضریب اینتا در این نسخه نقل نشده",
  },
  {
    category: "technical",
    title: "تعمیرگاه خودرو",
    isicCode: "4520",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "7538",
    feeExempt: false,
    citation: "ISIC 4520 · MCC 7538 — ضریب اینتا در این نسخه نقل نشده",
  },
  {
    category: "technical",
    title: "موبایل و کالای دیجیتال",
    isicCode: "4741",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5732",
    feeExempt: false,
    citation: "ISIC 4741 · MCC 5732 — ضریب اینتا در این نسخه نقل نشده",
  },
  {
    category: "technical",
    title: "جایگاه سوخت",
    isicCode: "4730",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5541",
    feeExempt: false,
    citation: "ISIC 4730 · MCC 5541 — ضریب اینتا در این نسخه نقل نشده",
  },
  {
    category: "production",
    title: "تولید نان و فرآورده‌های نانوایی",
    isicCode: "1071",
    intaCode: "—",
    intaProfitRatio: 0,
    defaultMcc: "5462",
    feeExempt: false,
    citation: "ISIC 1071 — رسته تولیدی متناظر نانوایی؛ کارمزد معاف مربوط به فروش حضوری نانوایی است",
  },
];

export interface CalculatorPresetDef {
  id: string;
  title: string;
  categoryName: string;
  intaProfitRatio: number;
  avgBasket: number;
  avgDailyTx: number;
  feeExempt: boolean;
  note: string;
}

/**
 * Calculator is a what-if. Basket defaults to the published POS average.
 * Daily tx is left at 0 so the slider stays a branch scenario, not a fake shop.
 */
export const CALCULATOR_PRESETS: CalculatorPresetDef[] = [
  {
    id: "pos-network-basket",
    title: "سبد میانگین کارتخوان شبکه (مرداد ۱۴۰۵)",
    categoryName: "شاپرک",
    intaProfitRatio: 0,
    avgBasket: MORDAD_POS_BASKET_RIALS,
    avgDailyTx: 0,
    feeExempt: false,
    note: "۶۹۴ هزار تومان — رقم اعلامی سبد کارتخوان مرداد ۱۴۰۵. تعداد تراکنش روزانه سناریوی شعبه است نه آمار یک فروشگاه.",
  },
  {
    id: "supermarket-exempt",
    title: "سوپرمارکت — معاف کارمزد پذیرنده",
    categoryName: "توزیعی",
    intaProfitRatio: 8.5,
    avgBasket: MORDAD_POS_BASKET_RIALS,
    avgDailyTx: 0,
    feeExempt: true,
    note: "اینتا ۸٫۵٪ و معافیت کارمزد بخشنامه ۱۴۰۲. کارمزد پذیرنده صفر است؛ بانک می‌پردازد.",
  },
  {
    id: "restaurant-inta",
    title: "رستوران معمولی — ضریب اینتا ۱۴٪",
    categoryName: "خدماتی",
    intaProfitRatio: 14,
    avgBasket: MORDAD_POS_BASKET_RIALS,
    avgDailyTx: 0,
    feeExempt: false,
    note: "فقط ضریب مالیاتی نقل شده؛ سبد همان میانگین شبکه است چون سبد رستوران در شاپرک عمومی نیست.",
  },
  {
    id: "snack-inta",
    title: "اغذیه فروشی — ضریب اینتا ۱۵٪ (کف)",
    categoryName: "خدماتی",
    intaProfitRatio: 15,
    avgBasket: MORDAD_POS_BASKET_RIALS,
    avgDailyTx: 0,
    feeExempt: false,
    note: "بازه منتشرشده ۱۵–۲۰٪؛ ۱۵٪ کف جدول است.",
  },
];


