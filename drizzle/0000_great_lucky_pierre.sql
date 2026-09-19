CREATE TYPE "public"."pipeline_stage" AS ENUM('NEW', 'CONTACTED', 'FINANCIAL_EVALUATION', 'CONVERTED', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."recommended_product" AS ENUM('POS_EXPANSION', 'WORKING_CAPITAL_LOAN', 'LC_DOMESTIC', 'SCF_GAM', 'BILL_DISCOUNTING');--> statement-breakpoint
CREATE TYPE "public"."risk_status" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TABLE "decision_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" uuid,
	"action" varchar(80) NOT NULL,
	"model_version" varchar(40) NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"explanation" text NOT NULL,
	"actor_id" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"isic_code_prefix" varchar(12) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guild_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "marketing_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"branch_code" varchar(16) NOT NULL,
	"recommended_product" "recommended_product" NOT NULL,
	"lead_score" double precision NOT NULL,
	"pipeline_stage" "pipeline_stage" DEFAULT 'NEW' NOT NULL,
	"last_interaction_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant_businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_guild_id" uuid NOT NULL,
	"business_license_number" varchar(40) NOT NULL,
	"national_id" varchar(20) NOT NULL,
	"business_name" varchar(200) NOT NULL,
	"owner_name" varchar(160) NOT NULL,
	"province" varchar(60) NOT NULL,
	"city" varchar(60) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"assigned_branch_code" varchar(16) NOT NULL,
	"is_tax_compliant" boolean DEFAULT false NOT NULL,
	"risk_status" "risk_status" DEFAULT 'MEDIUM' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_businesses_business_license_number_unique" UNIQUE("business_license_number"),
	CONSTRAINT "merchant_businesses_national_id_unique" UNIQUE("national_id")
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_type" varchar(40) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_guilds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"isic_code" varchar(16) NOT NULL,
	"inta_code" varchar(16) NOT NULL,
	"inta_profit_ratio" double precision NOT NULL,
	"default_mcc" varchar(8) NOT NULL,
	"avg_gross_margin" double precision NOT NULL,
	"cash_conversion_cycle_days" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terminal_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"reporting_period" varchar(7) NOT NULL,
	"pos_terminal_count" integer NOT NULL,
	"monthly_tx_count" integer NOT NULL,
	"monthly_tx_volume" bigint NOT NULL,
	"avg_daily_float_balance" bigint NOT NULL,
	"acquiring_fee_earned" bigint NOT NULL,
	"operating_support_cost" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_merchant_id_merchant_businesses_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_businesses" ADD CONSTRAINT "merchant_businesses_sub_guild_id_sub_guilds_id_fk" FOREIGN KEY ("sub_guild_id") REFERENCES "public"."sub_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_guilds" ADD CONSTRAINT "sub_guilds_category_id_guild_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."guild_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_metrics" ADD CONSTRAINT "terminal_metrics_merchant_id_merchant_businesses_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "decision_audit_entity_idx" ON "decision_audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "decision_audit_created_idx" ON "decision_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "marketing_leads_merchant_idx" ON "marketing_leads" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "marketing_leads_stage_idx" ON "marketing_leads" USING btree ("pipeline_stage");--> statement-breakpoint
CREATE INDEX "marketing_leads_branch_idx" ON "marketing_leads" USING btree ("branch_code");--> statement-breakpoint
CREATE INDEX "merchant_businesses_sub_guild_idx" ON "merchant_businesses" USING btree ("sub_guild_id");--> statement-breakpoint
CREATE INDEX "merchant_businesses_province_idx" ON "merchant_businesses" USING btree ("province");--> statement-breakpoint
CREATE INDEX "merchant_businesses_branch_idx" ON "merchant_businesses" USING btree ("assigned_branch_code");--> statement-breakpoint
CREATE INDEX "outbox_unpublished_idx" ON "outbox_events" USING btree ("published_at","created_at");--> statement-breakpoint
CREATE INDEX "outbox_aggregate_idx" ON "outbox_events" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "sub_guilds_category_idx" ON "sub_guilds" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "terminal_metrics_merchant_idx" ON "terminal_metrics" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "terminal_metrics_period_idx" ON "terminal_metrics" USING btree ("reporting_period");--> statement-breakpoint
CREATE UNIQUE INDEX "terminal_metrics_merchant_period_unique" ON "terminal_metrics" USING btree ("merchant_id","reporting_period");