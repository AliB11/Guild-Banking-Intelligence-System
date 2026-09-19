import type {
  GuildCategoryRow,
  MarketingLeadRow,
  MerchantBusinessRow,
  SubGuildRow,
  TerminalMetricRow,
} from "@/db/schema";
import { cbiPosFee } from "./engine";
import {
  GUILD_TAXONOMY,
  LATEST_PUBLISHED_PERIOD,
  MORDAD_INSTRUMENTS,
  POLICY_LEADS,
  PREV_PUBLISHED_PERIOD,
  PUBLISHED_PERIODS,
  SHAPARAK_MONTHS,
} from "./published-market";

/** The shape consumed by the service layer, shared by PostgreSQL and static data. */
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

const CATEGORY_META: Record<
  (typeof GUILD_TAXONOMY)[number]["category"],
  { name: string; isicCodePrefix: string; description: string }
> = {
  network: {
    name: "شبکه پرداخت",
    isicCodePrefix: "PAY",
    description: "ابزار پذیرش شاپرک با ارقام ماهنامه منتشرشده — نه جواز کسب",
  },
  production: {
    name: "تولیدی",
    isicCodePrefix: "C",
    description: "طبقه‌بندی ISIC بخش تولید؛ گردش رسته در گزارش عمومی شاپرک نیست",
  },
  distribution: {
    name: "توزیعی",
    isicCodePrefix: "G",
    description: "خرده‌فروشی و عمده‌فروشی؛ سوپرمارکت با اینتاکد و معافیت کارمزد مستند است",
  },
  services: {
    name: "خدماتی",
    isicCodePrefix: "I",
    description: "خدمات روزمره؛ نانوایی معاف کارمزد، رستوران/اغذیه با ضریب اینتا نقل‌شده",
  },
  technical: {
    name: "خدمات فنی",
    isicCodePrefix: "S",
    description: "خدمات فنی و سوخت؛ فقط کد ISIC/MCC — بدون گردش ماهانه عمومی",
  },
};

const CATEGORY_ORDER: Array<(typeof GUILD_TAXONOMY)[number]["category"]> = [
  "network",
  "production",
  "distribution",
  "services",
  "technical",
];

function uuid(sequence: number): string {
  return `00000000-0000-4000-8000-${sequence.toString(16).padStart(12, "0")}`;
}

function buildPublishedCorpus(): DemoCorpus {
  const createdAt = new Date(Date.UTC(2026, 8, 13));
  const categories: GuildCategoryRow[] = CATEGORY_ORDER.map((key, index) => ({
    id: uuid(100 + index),
    name: CATEGORY_META[key].name,
    isicCodePrefix: CATEGORY_META[key].isicCodePrefix,
    description: CATEGORY_META[key].description,
    createdAt,
  }));
  const categoryIdByKey = new Map(CATEGORY_ORDER.map((key, index) => [key, categories[index].id]));

  const subs: SubGuildRow[] = GUILD_TAXONOMY.map((row, index) => ({
    id: uuid(200 + index),
    categoryId: categoryIdByKey.get(row.category)!,
    title: row.title,
    isicCode: row.isicCode,
    intaCode: row.intaCode,
    intaProfitRatio: row.intaProfitRatio,
    defaultMcc: row.defaultMcc,
    avgGrossMargin: 0,
    cashConversionCycleDays: 0,
    createdAt,
  }));
  const subByTitle = new Map(subs.map((sub) => [sub.title, sub]));

  const merchants: MerchantBusinessRow[] = [];
  const metrics: TerminalMetricRow[] = [];

  const networkMerchant: MerchantBusinessRow = {
    id: uuid(1000),
    subGuildId: subByTitle.get("کل شبکه شاپرک")!.id,
    businessLicenseNumber: "SHAPARAK/NET",
    nationalId: "SHAPARAK-NET",
    businessName: "کل شبکه شاپرک",
    ownerName: "گزارش اقتصادی ماهانه شاپرک",
    province: "کل کشور",
    city: "شبکه ملی پرداخت",
    postalCode: "0000000000",
    assignedBranchCode: "SHAPARAK",
    isTaxCompliant: true,
    riskStatus: "LOW",
    createdAt,
  };
  merchants.push(networkMerchant);

  for (const month of SHAPARAK_MONTHS) {
    if (month.period === LATEST_PUBLISHED_PERIOD) continue;
    metrics.push({
      id: uuid(5000 + metrics.length),
      merchantId: networkMerchant.id,
      reportingPeriod: month.period,
      posTerminalCount: 1,
      monthlyTxCount: month.txCount,
      monthlyTxVolume: month.volumeRials,
      avgDailyFloatBalance: 0,
      acquiringFeeEarned: 0,
      operatingSupportCost: 0,
    });
  }

  for (const instrument of MORDAD_INSTRUMENTS) {
    const sub = subByTitle.get(instrument.title);
    if (!sub) continue;
    const merchant: MerchantBusinessRow = {
      id: uuid(1100 + merchants.length),
      subGuildId: sub.id,
      businessLicenseNumber: `SHAPARAK/${instrument.key.toUpperCase()}`,
      nationalId: `SHAPARAK-${instrument.key.toUpperCase()}`.slice(0, 20),
      businessName: `${instrument.title} — شبکه شاپرک`,
      ownerName: instrument.citation,
      province: "کل کشور",
      city: "شبکه ملی پرداخت",
      postalCode: "0000000000",
      assignedBranchCode: "SHAPARAK",
      isTaxCompliant: true,
      riskStatus: "LOW",
      createdAt,
    };
    merchants.push(merchant);
    const avgBasket = instrument.txCount > 0 ? instrument.volumeRials / instrument.txCount : 0;
    const fee =
      instrument.key === "pos" ? Math.round(cbiPosFee(avgBasket) * instrument.txCount) : 0;
    metrics.push({
      id: uuid(5000 + metrics.length),
      merchantId: merchant.id,
      reportingPeriod: LATEST_PUBLISHED_PERIOD,
      posTerminalCount: 1,
      monthlyTxCount: instrument.txCount,
      monthlyTxVolume: instrument.volumeRials,
      avgDailyFloatBalance: 0,
      acquiringFeeEarned: fee,
      operatingSupportCost: 0,
    });
  }

  const leads: MarketingLeadRow[] = [];
  for (const [index, lead] of POLICY_LEADS.entries()) {
    const sub = subByTitle.get(lead.title);
    if (!sub) continue;
    const merchant: MerchantBusinessRow = {
      id: uuid(2000 + index),
      subGuildId: sub.id,
      businessLicenseNumber: `POLICY/${index + 1}`,
      nationalId: `POLICY-${String(index + 1).padStart(4, "0")}`,
      businessName: `کمپین رسته: ${lead.title}`,
      ownerName: "فرصت سیاستی — بدون پرونده پذیرنده عمومی",
      province: "کل کشور",
      city: "طراحی کمپین ستاد",
      postalCode: "0000000000",
      assignedBranchCode: "POLICY",
      isTaxCompliant: true,
      riskStatus: "LOW",
      createdAt,
    };
    merchants.push(merchant);
    leads.push({
      id: uuid(3000 + index),
      merchantId: merchant.id,
      branchCode: "POLICY",
      recommendedProduct: lead.product,
      leadScore: lead.score,
      pipelineStage: "NEW",
      lastInteractionDate: createdAt,
      createdAt,
    });
  }

  return {
    categories,
    subs,
    merchants,
    metrics,
    leads,
    periods: [...PUBLISHED_PERIODS],
    latestPeriod: LATEST_PUBLISHED_PERIOD,
    prevPeriod: PREV_PUBLISHED_PERIOD,
  };
}

let cachedPublishedCorpus: DemoCorpus | null = null;

/** Static corpus built only from published Shaparak/CBI/INTA/ISIC facts. */
export function getDemoCorpus(): DemoCorpus {
  cachedPublishedCorpus ??= buildPublishedCorpus();
  return cachedPublishedCorpus;
}


