import type {
  GuildCategoryRow,
  MarketingLeadRow,
  MerchantBusinessRow,
  SubGuildRow,
  TerminalMetricRow,
} from "@/db/schema";
import { cbiPosFee } from "./engine";
import { getGuildAtlas, GUILD_CATEGORY_LABEL } from "./market-view";
import {
  LATEST_PUBLISHED_PERIOD,
  MORDAD_INSTRUMENTS,
  PREV_PUBLISHED_PERIOD,
  PUBLISHED_PERIODS,
  SHAPARAK_MONTHS,
} from "./published-market";

/** Optional PostgreSQL / JSON API corpus. The static UI reads `published-market` directly. */
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

function uuid(sequence: number): string {
  return `00000000-0000-4000-8000-${sequence.toString(16).padStart(12, "0")}`;
}

function buildPublishedCorpus(): DemoCorpus {
  const createdAt = new Date(Date.UTC(2026, 8, 13));
  const networkCategory: GuildCategoryRow = {
    id: uuid(100),
    name: "شبکه پرداخت",
    isicCodePrefix: "PAY",
    description: "ابزار پذیرش شاپرک با ارقام ماهنامه منتشرشده",
    createdAt,
  };
  const atlas = getGuildAtlas();
  const categoryKeys = Array.from(new Set(atlas.map((row) => row.category)));
  const guildCategories: GuildCategoryRow[] = categoryKeys.map((key, index) => ({
    id: uuid(101 + index),
    name: GUILD_CATEGORY_LABEL[key],
    isicCodePrefix: key.slice(0, 1).toUpperCase(),
    description: null,
    createdAt,
  }));
  const categoryIdByKey = new Map(categoryKeys.map((key, index) => [key, guildCategories[index].id]));
  const categories = [networkCategory, ...guildCategories];

  const networkSubs: SubGuildRow[] = [
    {
      id: uuid(200),
      categoryId: networkCategory.id,
      title: "کل شبکه شاپرک",
      isicCode: "—",
      intaCode: "—",
      intaProfitRatio: 0,
      defaultMcc: "—",
      avgGrossMargin: 0,
      cashConversionCycleDays: 0,
      createdAt,
    },
    ...MORDAD_INSTRUMENTS.map((instrument, index) => ({
      id: uuid(201 + index),
      categoryId: networkCategory.id,
      title: instrument.title,
      isicCode: "—",
      intaCode: "—",
      intaProfitRatio: 0,
      defaultMcc: "—",
      avgGrossMargin: 0,
      cashConversionCycleDays: 0,
      createdAt,
    })),
  ];
  const guildSubs: SubGuildRow[] = atlas.map((row, index) => ({
    id: uuid(220 + index),
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
  const subs = [...networkSubs, ...guildSubs];
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
    const fee = instrument.key === "pos" ? Math.round(cbiPosFee(avgBasket) * instrument.txCount) : 0;
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

  return {
    categories,
    subs,
    merchants,
    metrics,
    leads: [],
    periods: [...PUBLISHED_PERIODS],
    latestPeriod: LATEST_PUBLISHED_PERIOD,
    prevPeriod: PREV_PUBLISHED_PERIOD,
  };
}

let cachedPublishedCorpus: DemoCorpus | null = null;

export function getDemoCorpus(): DemoCorpus {
  cachedPublishedCorpus ??= buildPublishedCorpus();
  return cachedPublishedCorpus;
}
