/**
 * GBI Seed — داده‌های واقع‌گرایانه اصناف ایران
 * Run:  npx tsx src/db/seed.ts
 */
import { config } from "dotenv";
config();

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  guildCategories,
  marketingLeads,
  merchantBusinesses,
  subGuilds,
  terminalMetrics,
  type PipelineStage,
  type RiskStatus,
} from "./schema";
import {
  TERMINAL_MONTHLY_COST_RIALS,
  cbiPosFee,
  computeLeadScore,
  recommendProduct,
} from "../lib/gbi/engine";

/* ------------------------------------------------------------------ */
/* Deterministic RNG                                                   */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1403);
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */

const PROVINCES: Array<{ province: string; city: string; branch: string }> = [
  { province: "تهران", city: "تهران", branch: "TH" },
  { province: "تهران", city: "اسلامشهر", branch: "TH" },
  { province: "البرز", city: "کرج", branch: "KJ" },
  { province: "اصفهان", city: "اصفهان", branch: "IS" },
  { province: "اصفهان", city: "کاشان", branch: "IS" },
  { province: "خراسان رضوی", city: "مشهد", branch: "MH" },
  { province: "فارس", city: "شیراز", branch: "SH" },
  { province: "آذربایجان شرقی", city: "تبریز", branch: "TB" },
  { province: "خوزستان", city: "اهواز", branch: "AH" },
  { province: "مازندران", city: "ساری", branch: "SR" },
  { province: "گیلان", city: "رشت", branch: "RS" },
  { province: "قم", city: "قم", branch: "QM" },
  { province: "کرمان", city: "کرمان", branch: "KR" },
  { province: "یزد", city: "یزد", branch: "YZ" },
];

const OWNERS = [
  "محمد رضایی", "علی حسینی", "فاطمه محمدی", "رضا کریمی", "مریم احمدی",
  "حسین موسوی", "زهرا صادقی", "مهدی جعفری", "سارا کاظمی", "حمید نادری",
  "نرگس شریفی", "بهرام عسگری", "لیلا قاسمی", "فرهاد رستمی", "شیرین بهرامی",
  "امین تهرانی", "جواد مرادی", "سمیرا عزیزی", "کامران صالحی", "پریسا یوسفی",
  "سعید اکبری", "هدیه رحیمی", "بابک شیرازی", "الهه کریمیان", "مجتبی فرهادی",
  "نگار اصلانی", "پیمان توکلی", "رویا سلیمانی", "آرش قنبری", "مینا خالقی",
  "بهزاد نصیری", "ترانه ملکی", "کیانوش عبدی", "غزال صمدی", "وحید برومند",
  "دارا شجاعی", "هستی رفیعی", "سینا پورداوود", "یاسمین حیدری", "رادین کیانی",
  "ماندانا طالبی", "کورش ضیایی", "درسا ملایی", "بردیا آقایی", "آوا نیک‌بخت",
  "شهریار کامیاران", "نسیم وفایی", "فراز هوشمند",
];

/* ------------------------------------------------------------------ */
/* Guild taxonomy — رده‌بندی اصناف                                       */
/* ------------------------------------------------------------------ */

interface SubDef {
  key: string;
  title: string;
  isic: string;
  inta: string;
  ratio: number; // ضریب سود اینتاکد (٪)
  mcc: string;
  margin: number; // حاشیه سود ناخالص (٪)
  ccc: number; // چرخه تبدیل نقد (روز)
  // پروفایل عملیاتی پذیرنده
  dailyTx: [number, number];
  basketToman: [number, number]; // میلیون تومان
  retention: [number, number]; // روز ماندگاری
  terminals: [number, number];
  namePattern: string;
}

const TAXONOMY: Array<{
  category: string;
  isicPrefix: string;
  description: string;
  subs: SubDef[];
}> = [
  {
    category: "تولیدی",
    isicPrefix: "C",
    description: "واحدهای تولیدی و کارگاهی با مجوز وزارت صمت؛ نیازمند ابزارهای تجهیلاتی و سرمایه در گردش",
    subs: [
      { key: "mfg-apparel", title: "تولید و پخش پوشاک", isic: "1410", inta: "131101", ratio: 34, mcc: "5699", margin: 38, ccc: 75, dailyTx: [8, 22], basketToman: [12, 36], retention: [3, 5], terminals: [1, 2], namePattern: "تولیدی پوشاک" },
      { key: "mfg-food", title: "تولید مواد غذایی و آشامیدنی", isic: "1079", inta: "107901", ratio: 22, mcc: "5499", margin: 24, ccc: 48, dailyTx: [6, 16], basketToman: [20, 58], retention: [2.5, 4.5], terminals: [1, 2], namePattern: "کارخانه مواد غذایی" },
      { key: "mfg-autoparts", title: "تولید قطعات و ملزومات خودرو", isic: "2930", inta: "293001", ratio: 20, mcc: "5533", margin: 26, ccc: 62, dailyTx: [5, 14], basketToman: [25, 64], retention: [3, 5.5], terminals: [1, 1], namePattern: "شرکت قطعه‌سازی" },
    ],
  },
  {
    category: "توزیعی",
    isicPrefix: "G",
    description: "بنکداری‌ها، پخش‌سراسری و عمده‌فروشی‌ها؛ ستون گردش نقدینگی و رسوب‌سازی بانکی",
    subs: [
      { key: "whl-grocery", title: "بنکداری مواد غذایی", isic: "4630", inta: "463001", ratio: 10, mcc: "5399", margin: 11, ccc: 24, dailyTx: [90, 190], basketToman: [1.2, 3.2], retention: [2, 3.5], terminals: [1, 3], namePattern: "بنکداری مواد غذایی" },
      { key: "whl-fmcg", title: "پخش کالای تندمصرف (FMCG)", isic: "4649", inta: "464901", ratio: 11, mcc: "5399", margin: 14, ccc: 31, dailyTx: [26, 64], basketToman: [5, 13], retention: [2, 4], terminals: [1, 2], namePattern: "شرکت پخش کالای مصرفی" },
      { key: "whl-steel", title: "عمده‌فروشی آهن‌آلات", isic: "4663", inta: "466301", ratio: 8, mcc: "5072", margin: 9, ccc: 86, dailyTx: [3, 9], basketToman: [42, 125], retention: [4, 6.5], terminals: [1, 1], namePattern: "آهن‌آلات" },
      { key: "whl-appliance", title: "عمده‌فروشی لوازم خانگی", isic: "4643", inta: "464301", ratio: 14, mcc: "5065", margin: 16, ccc: 58, dailyTx: [9, 28], basketToman: [9, 26], retention: [3.5, 5.5], terminals: [1, 2], namePattern: "بازرگانی لوازم خانگی" },
      { key: "rtl-gold", title: "صنف طلا، جواهر و نقره", isic: "4773", inta: "477301", ratio: 15, mcc: "5944", margin: 19, ccc: 92, dailyTx: [4, 14], basketToman: [26, 74], retention: [5, 8], terminals: [1, 2], namePattern: "گالری طلا و جواهر" },
    ],
  },
  {
    category: "خدماتی",
    isicPrefix: "I",
    description: "خرده‌فروشی و خدمات روزمره با چرخه نقد کوتاه؛ هدف اصلی تسهیلات پذیرنده و POS",
    subs: [
      { key: "svc-restaurant", title: "رستوران و تهیه غذا", isic: "5610", inta: "561001", ratio: 38, mcc: "5812", margin: 45, ccc: -5, dailyTx: [120, 320], basketToman: [0.35, 0.85], retention: [0.8, 1.6], terminals: [1, 3], namePattern: "رستوران" },
      { key: "svc-confection", title: "قنادی و شیرینی‌فروشی", isic: "4724", inta: "472401", ratio: 32, mcc: "5462", margin: 42, ccc: -3, dailyTx: [150, 380], basketToman: [0.15, 0.38], retention: [0.7, 1.4], terminals: [1, 2], namePattern: "قنادی" },
      { key: "svc-greengrocery", title: "میوه و تره‌بار", isic: "4721", inta: "472101", ratio: 18, mcc: "5431", margin: 25, ccc: -7, dailyTx: [180, 420], basketToman: [0.12, 0.3], retention: [0.6, 1.2], terminals: [1, 2], namePattern: "میدان‌بار" },
      { key: "svc-supermarket", title: "سوپرمارکت و هایپرمارکت", isic: "4711", inta: "471101", ratio: 15, mcc: "5411", margin: 18, ccc: -10, dailyTx: [340, 720], basketToman: [0.18, 0.42], retention: [1, 1.8], terminals: [2, 5], namePattern: "هایپرمارکت" },
      { key: "svc-pharmacy", title: "داروخانه", isic: "4773", inta: "477302", ratio: 28, mcc: "5912", margin: 30, ccc: 35, dailyTx: [150, 310], basketToman: [0.26, 0.55], retention: [1.2, 2.2], terminals: [1, 2], namePattern: "داروخانه" },
    ],
  },
  {
    category: "خدمات فنی",
    isicPrefix: "S",
    description: "خدمات فنی، تعمیرات و کالای دیجیتال؛ حاشیه سود بالا و تراکنش متوسط",
    subs: [
      { key: "tech-autorepair", title: "تعمیرگاه تخصصی خودرو", isic: "4520", inta: "452001", ratio: 40, mcc: "7538", margin: 50, ccc: 10, dailyTx: [8, 24], basketToman: [1.6, 4.2], retention: [1.5, 3], terminals: [1, 1], namePattern: "تعمیرگاه تخصصی" },
      { key: "tech-autoparts-retail", title: "فروش قطعات یدکی خودرو", isic: "4530", inta: "453001", ratio: 24, mcc: "5531", margin: 28, ccc: 44, dailyTx: [38, 105], basketToman: [0.9, 2.6], retention: [2.5, 4.5], terminals: [1, 2], namePattern: "یدکی‌فروشی" },
      { key: "tech-mobile", title: "موبایل، تبلت و کالای دیجیتال", isic: "4741", inta: "474101", ratio: 12, mcc: "4812", margin: 15, ccc: 36, dailyTx: [14, 42], basketToman: [9, 27], retention: [3, 5], terminals: [1, 2], namePattern: "موبایل" },
      { key: "tech-print", title: "چاپ، صحافی و تبلیغات", isic: "1812", inta: "181201", ratio: 36, mcc: "2741", margin: 41, ccc: 52, dailyTx: [4, 12], basketToman: [6, 18], retention: [2.5, 4], terminals: [1, 1], namePattern: "چاپ و تبلیغات" },
    ],
  },
];

const PERIODS = ["1403-06", "1403-07", "1403-08", "1403-09", "1403-10", "1403-11"];

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("→ پاکسازی داده‌های قبلی...");
  await db.delete(marketingLeads);
  await db.delete(terminalMetrics);
  await db.delete(merchantBusinesses);
  await db.delete(subGuilds);
  await db.delete(guildCategories);

  console.log("→ درج گروه‌های اصلی و رسته‌های شغلی...");
  const subRows: Array<SubDef & { id: string }> = [];
  for (const cat of TAXONOMY) {
    const [catRow] = await db
      .insert(guildCategories)
      .values({
        name: cat.category,
        isicCodePrefix: cat.isicPrefix,
        description: cat.description,
      })
      .returning();
    for (const s of cat.subs) {
      const [subRow] = await db
        .insert(subGuilds)
        .values({
          categoryId: catRow.id,
          title: s.title,
          isicCode: s.isic,
          intaCode: s.inta,
          intaProfitRatio: s.ratio,
          defaultMcc: s.mcc,
          avgGrossMargin: s.margin,
          cashConversionCycleDays: s.ccc,
        })
        .returning();
      subRows.push({ ...s, id: subRow.id });
    }
  }

  console.log("→ درج واحدهای صنفی...");
  const ownerQueue = [...OWNERS];
  interface MerchantSeed {
    id: string;
    sub: SubDef & { id: string };
    isTaxCompliant: boolean;
    riskStatus: RiskStatus;
    assignedBranchCode: string;
    businessName: string;
    ownerName: string;
    province: string;
    // operational anchors
    dailyTxAnchor: number;
    basketRials: number;
    retentionAnchor: number;
    posCount: number;
  }
  const merchantSeeds: MerchantSeed[] = [];
  let licenseSeq = 1000;

  for (const sub of subRows) {
    const count = intBetween(2, 4);
    for (let i = 0; i < count; i++) {
      const geo = pick(PROVINCES);
      const owner = ownerQueue.length
        ? ownerQueue.splice(Math.floor(rand() * ownerQueue.length), 1)[0]
        : `${pick(["وحید", "ناصر", "منصور", "ابوالفضل"])} ${pick(["قادری", "نیازی", "شمس", "فتاحی"])}`;
      const family = owner.split(" ").slice(-1)[0];
      const nationalId = String(intBetween(10, 99)) + String(intBetween(10000000, 99999999)).padStart(8, "0");
      licenseSeq += intBetween(3, 17);

      const [row] = await db
        .insert(merchantBusinesses)
        .values({
          subGuildId: sub.id,
          businessLicenseNumber: `پک/${1403}/${licenseSeq}`,
          nationalId,
          businessName: `${sub.namePattern} ${family}`,
          ownerName: owner,
          province: geo.province,
          city: geo.city,
          postalCode: String(intBetween(1000000000, 1999999999)),
          assignedBranchCode: `${geo.branch}-${intBetween(1000, 9499)}`,
          isTaxCompliant: rand() < 0.66,
          riskStatus: rand() < 0.55 ? "LOW" : rand() < 0.72 ? "MEDIUM" : "HIGH",
          createdAt: new Date(1403 - 621 + rand() * 2, intBetween(0, 11), intBetween(1, 28)),
        })
        .returning();

      merchantSeeds.push({
        id: row.id,
        sub,
        isTaxCompliant: row.isTaxCompliant,
        riskStatus: row.riskStatus,
        assignedBranchCode: row.assignedBranchCode,
        businessName: row.businessName,
        ownerName: row.ownerName,
        province: row.province,
        dailyTxAnchor: between(sub.dailyTx[0], sub.dailyTx[1]),
        basketRials: between(sub.basketToman[0], sub.basketToman[1]) * 10_000_000 * (1 + rand() * 0.2),
        retentionAnchor: between(sub.retention[0], sub.retention[1]),
        posCount: intBetween(sub.terminals[0], sub.terminals[1]),
      });
    }
  }

  console.log(`→ درج شاخص‌های ماهانه ${merchantSeeds.length} پذیرنده (${PERIODS.length} دوره)...`);
  const metricValues: Array<typeof terminalMetrics.$inferInsert> = [];
  const latestByMerchant = new Map<string, { volume: number; float: number; tx: number }>();

  for (const m of merchantSeeds) {
    let growth = 1;
    for (const period of PERIODS) {
      growth *= 1 + between(0.005, 0.028); // رشد ماهانه ۰٫۵ تا ۲٫۸٪
      const seasonality = 1 + Math.sin(PERIODS.indexOf(period) * 1.1) * 0.04;
      const noise = () => between(0.93, 1.07);

      const monthlyTxCount = Math.round(m.dailyTxAnchor * 30 * growth * seasonality * noise());
      const monthlyTxVolume = Math.round(monthlyTxCount * m.basketRials * noise());
      const avgDailyFloat = Math.round(
        m.dailyTxAnchor * m.basketRials * m.retentionAnchor * growth * noise(),
      );
      const avgBasket = monthlyTxCount > 0 ? monthlyTxVolume / monthlyTxCount : 0;
      const acquiringFee = Math.round(cbiPosFee(avgBasket) * monthlyTxCount * noise());
      const supportCost = m.posCount * TERMINAL_MONTHLY_COST_RIALS;

      metricValues.push({
        merchantId: m.id,
        reportingPeriod: period,
        posTerminalCount: m.posCount,
        monthlyTxCount,
        monthlyTxVolume,
        avgDailyFloatBalance: Math.max(5_000_000, avgDailyFloat),
        acquiringFeeEarned: acquiringFee,
        operatingSupportCost: supportCost,
      });

      latestByMerchant.set(m.id, { volume: monthlyTxVolume, float: avgDailyFloat, tx: monthlyTxCount });
    }
  }
  await db.insert(terminalMetrics).values(metricValues);

  console.log("→ تولید سرنخ‌های بازاریابی با موتور امتیازدهی...");
  const leadValues: Array<typeof marketingLeads.$inferInsert> = [];
  const stageForScore = (score: number): PipelineStage => {
    const r = rand();
    if (score >= 80) return r < 0.3 ? "CONVERTED" : r < 0.62 ? "FINANCIAL_EVALUATION" : r < 0.85 ? "CONTACTED" : "NEW";
    if (score >= 65) return r < 0.15 ? "CONVERTED" : r < 0.4 ? "FINANCIAL_EVALUATION" : r < 0.75 ? "CONTACTED" : "NEW";
    if (score >= 45) return r < 0.1 ? "FINANCIAL_EVALUATION" : r < 0.5 ? "CONTACTED" : r < 0.9 ? "NEW" : "LOST";
    return r < 0.4 ? "NEW" : r < 0.72 ? "CONTACTED" : "LOST";
  };

  // انتخاب پذیرندگان شاخص‌تر برای ورود به قیف بازاریابی
  const ranked = merchantSeeds
    .map((m) => {
      const latest = latestByMerchant.get(m.id)!;
      const breakdown = computeLeadScore({
        avgDailyFloatBalance: latest.float,
        monthlyTxVolume: latest.volume,
        cccDays: m.sub.ccc,
        isTaxCompliant: m.isTaxCompliant,
      });
      return { m, latest, breakdown };
    })
    .sort((a, b) => b.breakdown.total - a.breakdown.total);

  const leadCount = Math.min(28, ranked.length);
  for (let i = 0; i < leadCount; i++) {
    const { m, latest, breakdown } = ranked[i];
    const product = recommendProduct({
      cccDays: m.sub.ccc,
      avgDailyFloatBalance: latest.float,
      monthlyTxVolume: latest.volume,
      isTaxCompliant: m.isTaxCompliant,
    });
    const daysAgo = intBetween(0, 44);
    const interaction = new Date(Date.now() - daysAgo * 86_400_000);
    leadValues.push({
      merchantId: m.id,
      branchCode: m.assignedBranchCode,
      recommendedProduct: product,
      leadScore: breakdown.total,
      pipelineStage: stageForScore(breakdown.total),
      lastInteractionDate: interaction,
    });
  }
  await db.insert(marketingLeads).values(leadValues);

  console.log("✓ Seed کامل شد:");
  console.log(`   گروه‌ها: ${TAXONOMY.length} | رسته‌ها: ${subRows.length} | پذیرندگان: ${merchantSeeds.length}`);
  console.log(`   شاخص‌ها: ${metricValues.length} | سرنخ‌ها: ${leadValues.length}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
