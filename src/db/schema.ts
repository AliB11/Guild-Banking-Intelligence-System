import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  bigint,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const riskStatusEnum = pgEnum("risk_status", ["LOW", "MEDIUM", "HIGH"]);

export const recommendedProductEnum = pgEnum("recommended_product", [
  "POS_EXPANSION",
  "WORKING_CAPITAL_LOAN",
  "LC_DOMESTIC",
  "SCF_GAM",
  "BILL_DISCOUNTING",
]);

export const pipelineStageEnum = pgEnum("pipeline_stage", [
  "NEW",
  "CONTACTED",
  "FINANCIAL_EVALUATION",
  "CONVERTED",
  "LOST",
]);

/* ------------------------------------------------------------------ */
/* GuildCategory — گروه اصلی صنف                                         */
/* ------------------------------------------------------------------ */

export const guildCategories = pgTable("guild_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  isicCodePrefix: varchar("isic_code_prefix", { length: 12 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* SubGuild — رسته شغلی                                                  */
/* ------------------------------------------------------------------ */

export const subGuilds = pgTable(
  "sub_guilds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => guildCategories.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    isicCode: varchar("isic_code", { length: 16 }).notNull(),
    intaCode: varchar("inta_code", { length: 16 }).notNull(),
    /** درصد نسبت سود فعالیت طبق تبصره ماده ۱۰۰ (اینتاکد) */
    intaProfitRatio: doublePrecision("inta_profit_ratio").notNull(),
    /** کد چهاررقمی رسته پذیرنده شاپرک (MCC) */
    defaultMcc: varchar("default_mcc", { length: 8 }).notNull(),
    /** حاشیه سود ناخالص برآوردی (٪) */
    avgGrossMargin: doublePrecision("avg_gross_margin").notNull(),
    /** چرخه تبدیل نقد (روز) = DIO + DSO − DPO */
    cashConversionCycleDays: integer("cash_conversion_cycle_days").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("sub_guilds_category_idx").on(t.categoryId)],
);

/* ------------------------------------------------------------------ */
/* MerchantBusiness — واحد صنفی / مشتری بانکی                             */
/* ------------------------------------------------------------------ */

export const merchantBusinesses = pgTable(
  "merchant_businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subGuildId: uuid("sub_guild_id")
      .notNull()
      .references(() => subGuilds.id, { onDelete: "restrict" }),
    businessLicenseNumber: varchar("business_license_number", { length: 40 })
      .notNull()
      .unique(),
    nationalId: varchar("national_id", { length: 20 }).notNull().unique(),
    businessName: varchar("business_name", { length: 200 }).notNull(),
    ownerName: varchar("owner_name", { length: 160 }).notNull(),
    province: varchar("province", { length: 60 }).notNull(),
    city: varchar("city", { length: 60 }).notNull(),
    postalCode: varchar("postal_code", { length: 20 }).notNull(),
    assignedBranchCode: varchar("assigned_branch_code", { length: 16 }).notNull(),
    isTaxCompliant: boolean("is_tax_compliant").notNull().default(false),
    riskStatus: riskStatusEnum("risk_status").notNull().default("MEDIUM"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("merchant_businesses_sub_guild_idx").on(t.subGuildId),
    index("merchant_businesses_province_idx").on(t.province),
    index("merchant_businesses_branch_idx").on(t.assignedBranchCode),
  ],
);

/* ------------------------------------------------------------------ */
/* TerminalMetric — پایش ماهانه پایانه و حساب                            */
/* (در محیط عملیاتی روی TimescaleDB به‌صورت Hypertable ماهانه پارتیشن می‌شود) */
/* ------------------------------------------------------------------ */

export const terminalMetrics = pgTable(
  "terminal_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchantBusinesses.id, { onDelete: "cascade" }),
    /** دوره گزارش جلالی YYYY-MM — مثل "1403-08" */
    reportingPeriod: varchar("reporting_period", { length: 7 }).notNull(),
    posTerminalCount: integer("pos_terminal_count").notNull(),
    /** تعداد کل تراکنش‌های کارتخوان در ماه */
    monthlyTxCount: integer("monthly_tx_count").notNull(),
    /** مبلغ کل تراکنش‌ها (ریال) */
    monthlyTxVolume: bigint("monthly_tx_volume", { mode: "number" }).notNull(),
    /** میانگین رسوب روزانه مانده حساب جاری — CASA (ریال) */
    avgDailyFloatBalance: bigint("avg_daily_float_balance", {
      mode: "number",
    }).notNull(),
    /** عواید کارمزد شاپرکی سهم بانک (ریال) */
    acquiringFeeEarned: bigint("acquiring_fee_earned", {
      mode: "number",
    }).notNull(),
    /** هزینه نگهداری پایانه، رول و سوئیچ PSP (ریال) */
    operatingSupportCost: bigint("operating_support_cost", {
      mode: "number",
    }).notNull(),
  },
  (t) => [
    index("terminal_metrics_merchant_idx").on(t.merchantId),
    index("terminal_metrics_period_idx").on(t.reportingPeriod),
    index("terminal_metrics_merchant_period_idx").on(
      t.merchantId,
      t.reportingPeriod,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* MarketingLead — سرنخ بازاریابی شعب                                    */
/* ------------------------------------------------------------------ */

export const marketingLeads = pgTable(
  "marketing_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchantBusinesses.id, { onDelete: "cascade" }),
    branchCode: varchar("branch_code", { length: 16 }).notNull(),
    recommendedProduct: recommendedProductEnum("recommended_product").notNull(),
    leadScore: doublePrecision("lead_score").notNull(),
    pipelineStage: pipelineStageEnum("pipeline_stage").notNull().default("NEW"),
    lastInteractionDate: timestamp("last_interaction_date", {
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("marketing_leads_merchant_idx").on(t.merchantId),
    index("marketing_leads_stage_idx").on(t.pipelineStage),
    index("marketing_leads_branch_idx").on(t.branchCode),
  ],
);

/* ------------------------------------------------------------------ */
/* Inferred row types                                                  */
/* ------------------------------------------------------------------ */

export type GuildCategoryRow = typeof guildCategories.$inferSelect;
export type SubGuildRow = typeof subGuilds.$inferSelect;
export type MerchantBusinessRow = typeof merchantBusinesses.$inferSelect;
export type TerminalMetricRow = typeof terminalMetrics.$inferSelect;
export type MarketingLeadRow = typeof marketingLeads.$inferSelect;

export type RiskStatus = (typeof riskStatusEnum.enumValues)[number];
export type RecommendedProduct =
  (typeof recommendedProductEnum.enumValues)[number];
export type PipelineStage = (typeof pipelineStageEnum.enumValues)[number];
