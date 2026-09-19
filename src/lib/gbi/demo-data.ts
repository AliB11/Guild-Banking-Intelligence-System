import type {
  GuildCategoryRow,
  MarketingLeadRow,
  MerchantBusinessRow,
  SubGuildRow,
  TerminalMetricRow,
  PipelineStage,
  RiskStatus,
} from "@/db/schema";
import { cbiPosFee, computeLeadScore, recommendProduct } from "./engine";
import { recentJalaliPeriods } from "./format";

/** The shape consumed by the service layer, shared by PostgreSQL and demo data. */
export interface DemoCorpus {
  categories: GuildCategoryRow[];
  subs: SubGuildRow[];
  merchants: MerchantBusinessRow[];
  metrics: TerminalMetricRow[];
  leads: MarketingLeadRow[];
  periods: string[];
  latestPeriod: string;
  prevPeriod: string;
}

/**
 * The reporting window follows the real calendar: the six most recent Jalali
 * months ending with the current one (e.g. "1405-07" شهریور ۱۴۰۵ when the app
 * is opened in Shahrivar 1405), so "دوره جاری" is never a stale snapshot.
 */
const PERIODS = recentJalaliPeriods(6);
const PROVINCES = [
  ["تهران", "تهران", "TH"],
  ["البرز", "کرج", "KJ"],
  ["اصفهان", "اصفهان", "IS"],
  ["خراسان رضوی", "مشهد", "MH"],
  ["فارس", "شیراز", "SH"],
  ["آذربایجان شرقی", "تبریز", "TB"],
  ["خوزستان", "اهواز", "AH"],
  ["مازندران", "ساری", "SR"],
] as const;
const OWNERS = [
  "محمد رضایی",
  "فاطمه محمدی",
  "رضا کریمی",
  "مریم احمدی",
  "حسین موسوی",
  "زهرا صادقی",
  "مهدی جعفری",
  "سارا کاظمی",
  "حمید نادری",
  "نرگس شریفی",
  "بهرام عسگری",
  "لیلا قاسمی",
  "فرهاد رستمی",
  "شیرین بهرامی",
  "امین تهرانی",
  "جواد مرادی",
  "سمیرا عزیزی",
  "کامران صالحی",
  "پریسا یوسفی",
  "سعید اکبری",
];

interface SubDefinition {
  category: number;
  title: string;
  isicCode: string;
  intaCode: string;
  intaProfitRatio: number;
  defaultMcc: string;
  avgGrossMargin: number;
  cccDays: number;
  dailyTx: number;
  basketRials: number;
  retentionDays: number;
  terminals: number;
}

// A small but complete corpus keeps the UI useful in a fresh checkout. It is
// deliberately marked as demo mode by the service and is never mixed with a
// configured PostgreSQL corpus.
const SUB_DEFINITIONS: SubDefinition[] = [
  { category: 0, title: "تولید و پخش پوشاک", isicCode: "1410", intaCode: "131101", intaProfitRatio: 34, defaultMcc: "5699", avgGrossMargin: 38, cccDays: 75, dailyTx: 16, basketRials: 240_000_000, retentionDays: 4, terminals: 2 },
  { category: 0, title: "تولید مواد غذایی و آشامیدنی", isicCode: "1079", intaCode: "107901", intaProfitRatio: 22, defaultMcc: "5499", avgGrossMargin: 24, cccDays: 48, dailyTx: 11, basketRials: 390_000_000, retentionDays: 3, terminals: 1 },
  { category: 0, title: "تولید قطعات خودرو", isicCode: "2930", intaCode: "293001", intaProfitRatio: 20, defaultMcc: "5533", avgGrossMargin: 26, cccDays: 62, dailyTx: 9, basketRials: 510_000_000, retentionDays: 4, terminals: 1 },
  { category: 1, title: "بنکداری مواد غذایی", isicCode: "4630", intaCode: "463001", intaProfitRatio: 10, defaultMcc: "5399", avgGrossMargin: 11, cccDays: 24, dailyTx: 140, basketRials: 22_000_000, retentionDays: 2.5, terminals: 2 },
  { category: 1, title: "پخش کالای تندمصرف", isicCode: "4649", intaCode: "464901", intaProfitRatio: 11, defaultMcc: "5399", avgGrossMargin: 14, cccDays: 31, dailyTx: 45, basketRials: 86_000_000, retentionDays: 3, terminals: 1 },
  { category: 1, title: "عمده‌فروشی آهن‌آلات", isicCode: "4663", intaCode: "466301", intaProfitRatio: 8, defaultMcc: "5072", avgGrossMargin: 9, cccDays: 86, dailyTx: 6, basketRials: 790_000_000, retentionDays: 5, terminals: 1 },
  { category: 1, title: "عمده‌فروشی لوازم خانگی", isicCode: "4643", intaCode: "464301", intaProfitRatio: 14, defaultMcc: "5065", avgGrossMargin: 16, cccDays: 58, dailyTx: 19, basketRials: 175_000_000, retentionDays: 4.5, terminals: 1 },
  { category: 1, title: "صنف طلا، جواهر و نقره", isicCode: "4773", intaCode: "477301", intaProfitRatio: 15, defaultMcc: "5944", avgGrossMargin: 19, cccDays: 92, dailyTx: 8, basketRials: 620_000_000, retentionDays: 6, terminals: 1 },
  { category: 2, title: "رستوران و تهیه غذا", isicCode: "5610", intaCode: "561001", intaProfitRatio: 38, defaultMcc: "5812", avgGrossMargin: 45, cccDays: -5, dailyTx: 220, basketRials: 6_000_000, retentionDays: 1.2, terminals: 2 },
  { category: 2, title: "قنادی و شیرینی‌فروشی", isicCode: "4724", intaCode: "472401", intaProfitRatio: 32, defaultMcc: "5462", avgGrossMargin: 42, cccDays: -3, dailyTx: 260, basketRials: 2_700_000, retentionDays: 1, terminals: 1 },
  { category: 2, title: "میوه و تره‌بار", isicCode: "4721", intaCode: "472101", intaProfitRatio: 18, defaultMcc: "5431", avgGrossMargin: 25, cccDays: -7, dailyTx: 290, basketRials: 2_100_000, retentionDays: 0.9, terminals: 1 },
  { category: 2, title: "سوپرمارکت و هایپرمارکت", isicCode: "4711", intaCode: "471101", intaProfitRatio: 15, defaultMcc: "5411", avgGrossMargin: 18, cccDays: -10, dailyTx: 520, basketRials: 2_900_000, retentionDays: 1.4, terminals: 3 },
  { category: 2, title: "داروخانه", isicCode: "4773", intaCode: "477302", intaProfitRatio: 28, defaultMcc: "5912", avgGrossMargin: 30, cccDays: 35, dailyTx: 225, basketRials: 4_100_000, retentionDays: 1.7, terminals: 2 },
  { category: 3, title: "تعمیرگاه تخصصی خودرو", isicCode: "4520", intaCode: "452001", intaProfitRatio: 40, defaultMcc: "7538", avgGrossMargin: 50, cccDays: 10, dailyTx: 16, basketRials: 31_000_000, retentionDays: 2.2, terminals: 1 },
  { category: 3, title: "فروش قطعات یدکی خودرو", isicCode: "4530", intaCode: "453001", intaProfitRatio: 24, defaultMcc: "5531", avgGrossMargin: 28, cccDays: 44, dailyTx: 70, basketRials: 19_000_000, retentionDays: 3.5, terminals: 1 },
  { category: 3, title: "موبایل و کالای دیجیتال", isicCode: "4741", intaCode: "474101", intaProfitRatio: 12, defaultMcc: "4812", avgGrossMargin: 15, cccDays: 36, dailyTx: 28, basketRials: 185_000_000, retentionDays: 4, terminals: 1 },
  { category: 3, title: "چاپ، صحافی و تبلیغات", isicCode: "1812", intaCode: "181201", intaProfitRatio: 36, defaultMcc: "2741", avgGrossMargin: 41, cccDays: 52, dailyTx: 8, basketRials: 120_000_000, retentionDays: 3.2, terminals: 1 },
];

const CATEGORIES: Array<{ name: string; isicCodePrefix: string; description: string }> = [
  { name: "تولیدی", isicCodePrefix: "C", description: "واحدهای تولیدی و کارگاهی؛ نیازمند سرمایه در گردش و ابزارهای اعتباری" },
  { name: "توزیعی", isicCodePrefix: "G", description: "بنکداری و پخش؛ ستون گردش نقدینگی و رسوب‌سازی بانکی" },
  { name: "خدماتی", isicCodePrefix: "I", description: "خدمات روزمره با چرخه نقد کوتاه و ظرفیت بالای پذیرندگی" },
  { name: "خدمات فنی", isicCodePrefix: "S", description: "خدمات فنی و کالای دیجیتال؛ حاشیه سود و تراکنش متوسط" },
];

function uuid(sequence: number): string {
  return `00000000-0000-4000-8000-${sequence.toString(16).padStart(12, "0")}`;
}

function buildDemoCorpus(): DemoCorpus {
  const categories: GuildCategoryRow[] = CATEGORIES.map((category, index) => ({
    id: uuid(100 + index),
    name: category.name,
    isicCodePrefix: category.isicCodePrefix,
    description: category.description,
    createdAt: new Date(Date.UTC(2024, 0, 1)),
  }));

  const subs: SubGuildRow[] = SUB_DEFINITIONS.map((definition, index) => ({
    id: uuid(200 + index),
    categoryId: categories[definition.category].id,
    title: definition.title,
    isicCode: definition.isicCode,
    intaCode: definition.intaCode,
    intaProfitRatio: definition.intaProfitRatio,
    defaultMcc: definition.defaultMcc,
    avgGrossMargin: definition.avgGrossMargin,
    cashConversionCycleDays: definition.cccDays,
    createdAt: new Date(Date.UTC(2024, 0, 1)),
  }));

  const merchants: MerchantBusinessRow[] = [];
  const merchantProfiles = new Map<string, SubDefinition>();
  for (let subIndex = 0; subIndex < subs.length; subIndex++) {
    const definition = SUB_DEFINITIONS[subIndex];
    for (let copy = 0; copy < 2; copy++) {
      const index = subIndex * 2 + copy;
      const [province, city, branch] = PROVINCES[index % PROVINCES.length];
      const merchantId = uuid(1000 + index);
      merchants.push({
        id: merchantId,
        subGuildId: subs[subIndex].id,
        businessLicenseNumber: `DEMO/1403/${1000 + index}`,
        nationalId: `990${String(1000000 + index).padStart(7, "0")}`,
        businessName: `${definition.title} ${OWNERS[index % OWNERS.length].split(" ").at(-1)}`,
        ownerName: OWNERS[index % OWNERS.length],
        province,
        city,
        postalCode: `11${String(10000000 + index).padStart(8, "0")}`,
        assignedBranchCode: `${branch}-${String(1000 + index).padStart(4, "0")}`,
        isTaxCompliant: index % 3 !== 0,
        riskStatus: (index % 7 === 0 ? "HIGH" : index % 4 === 0 ? "MEDIUM" : "LOW") as RiskStatus,
        createdAt: new Date(Date.UTC(2024, 4, (index % 27) + 1)),
      });
      merchantProfiles.set(merchantId, definition);
    }
  }

  const metrics: TerminalMetricRow[] = [];
  const latestMetricByMerchant = new Map<string, TerminalMetricRow>();
  for (const merchant of merchants) {
    const definition = merchantProfiles.get(merchant.id)!;
    const copyFactor = merchant.id.endsWith("1") ? 1.08 : 0.94;
    PERIODS.forEach((period, periodIndex) => {
      const growth = 1 + periodIndex * 0.018;
      const seasonality = 1 + Math.sin(periodIndex * 1.1) * 0.035;
      const txCount = Math.max(1, Math.round(definition.dailyTx * 30 * copyFactor * growth * seasonality));
      const volume = Math.round(txCount * definition.basketRials * (1 + periodIndex * 0.006));
      const averageFloat = Math.round(
        definition.dailyTx * definition.basketRials * definition.retentionDays * copyFactor * growth,
      );
      const row: TerminalMetricRow = {
        id: uuid(5000 + metrics.length),
        merchantId: merchant.id,
        reportingPeriod: period,
        posTerminalCount: definition.terminals,
        monthlyTxCount: txCount,
        monthlyTxVolume: volume,
        avgDailyFloatBalance: Math.max(5_000_000, averageFloat),
        acquiringFeeEarned: Math.round(cbiPosFee(definition.basketRials) * txCount),
        operatingSupportCost: definition.terminals * 1_500_000,
      };
      metrics.push(row);
      if (period === PERIODS.at(-1)) latestMetricByMerchant.set(merchant.id, row);
    });
  }

  const ranked = merchants
    .map((merchant) => {
      const metric = latestMetricByMerchant.get(merchant.id)!;
      const definition = merchantProfiles.get(merchant.id)!;
      return {
        merchant,
        metric,
        score: computeLeadScore({
          avgDailyFloatBalance: metric.avgDailyFloatBalance,
          monthlyTxVolume: metric.monthlyTxVolume,
          cccDays: definition.cccDays,
          isTaxCompliant: merchant.isTaxCompliant,
        }),
      };
    })
    .sort((a, b) => b.score.total - a.score.total);

  const leads: MarketingLeadRow[] = ranked.slice(0, 28).map(({ merchant, metric, score }, index) => {
    const definition = merchantProfiles.get(merchant.id)!;
    const stage: PipelineStage = index % 9 === 0 ? "CONVERTED" : index % 5 === 0 ? "FINANCIAL_EVALUATION" : index % 3 === 0 ? "CONTACTED" : "NEW";
    // Demo interactions stay close to the current clock so the SLA panel is
    // useful during a live walkthrough rather than flagging every card as old.
    const interactionDate = new Date(Date.now() - (index % 22) * 86_400_000);
    return {
      id: uuid(2000 + index),
      merchantId: merchant.id,
      branchCode: merchant.assignedBranchCode,
      recommendedProduct: recommendProduct({
        cccDays: definition.cccDays,
        avgDailyFloatBalance: metric.avgDailyFloatBalance,
        monthlyTxVolume: metric.monthlyTxVolume,
        isTaxCompliant: merchant.isTaxCompliant,
      }),
      leadScore: score.total,
      pipelineStage: stage,
      lastInteractionDate: interactionDate,
      createdAt: new Date(Date.UTC(2025, 1, 1)),
    };
  });

  return {
    categories,
    subs,
    merchants,
    metrics,
    leads,
    periods: [...PERIODS],
    latestPeriod: PERIODS.at(-1)!,
    prevPeriod: PERIODS.at(-2)!,
  };
}

let cachedDemoCorpus: DemoCorpus | null = null;

export function getDemoCorpus(): DemoCorpus {
  cachedDemoCorpus ??= buildDemoCorpus();
  return cachedDemoCorpus;
}
