CREATE TYPE "public"."beacon_plus_billing_plan" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."business_membership_plan" AS ENUM('business', 'business_pro');--> statement-breakpoint
CREATE TYPE "public"."studio_asset_status" AS ENUM('pending', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."studio_asset_type" AS ENUM('image', 'video', 'audio', 'document', 'other');--> statement-breakpoint
CREATE TYPE "public"."studio_credit_ledger_type" AS ENUM('purchase', 'membership_reset', 'business_membership_reset', 'generation', 'refund', 'adjustment', 'promotion', 'complimentary');--> statement-breakpoint
CREATE TYPE "public"."studio_generation_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."studio_membership_plan" AS ENUM('pro', 'business', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."studio_project_status" AS ENUM('draft', 'generating', 'ready', 'failed', 'archived');--> statement-breakpoint
CREATE TABLE "studio_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"generation_id" uuid,
	"user_id" text NOT NULL,
	"type" "studio_asset_type" NOT NULL,
	"status" "studio_asset_status" DEFAULT 'pending' NOT NULL,
	"name" text NOT NULL,
	"mime_type" text,
	"storage_key" text,
	"url" text,
	"size_bytes" integer,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "studio_credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "studio_credit_ledger_type" NOT NULL,
	"amount" integer NOT NULL,
	"purchased_balance_after" integer NOT NULL,
	"studio_membership_allowance_after" integer NOT NULL,
	"business_allowance_after" integer NOT NULL,
	"total_available_after" integer NOT NULL,
	"description" text NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"stripe_invoice_id" text,
	"stripe_subscription_id" text,
	"studio_project_id" uuid,
	"studio_generation_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_generation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "studio_generation_status" DEFAULT 'queued' NOT NULL,
	"credit_cost" integer DEFAULT 0 NOT NULL,
	"administrator_bypass" boolean DEFAULT false NOT NULL,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"request_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"response_payload" jsonb,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "studio_project_status" DEFAULT 'draft' NOT NULL,
	"brief" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"campaign_plan" jsonb,
	"selected_variant_id" text,
	"thumbnail_url" text,
	"last_opened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "beacon_plus_plan" "beacon_plus_billing_plan";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "beacon_plus_stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "beacon_plus_subscription_status" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "beacon_plus_current_period_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "beacon_plus_searches_used_this_period" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "beacon_plus_search_limit" integer DEFAULT 300 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_membership_plan" "business_membership_plan";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_membership_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_subscription_status" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_current_period_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_current_period_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_studio_credits_allowance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_studio_credits_renewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "studio_membership_plan" "studio_membership_plan";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "studio_membership_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "studio_stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "studio_subscription_status" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "studio_current_period_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "studio_current_period_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "studio_membership_credits_allowance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "studio_membership_credits_renewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "studio_purchased_credits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_asset" ADD CONSTRAINT "studio_asset_project_id_studio_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_asset" ADD CONSTRAINT "studio_asset_generation_id_studio_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."studio_generation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_asset" ADD CONSTRAINT "studio_asset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_credit_ledger" ADD CONSTRAINT "studio_credit_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_credit_ledger" ADD CONSTRAINT "studio_credit_ledger_studio_project_id_studio_project_id_fk" FOREIGN KEY ("studio_project_id") REFERENCES "public"."studio_project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_credit_ledger" ADD CONSTRAINT "studio_credit_ledger_studio_generation_id_studio_generation_id_fk" FOREIGN KEY ("studio_generation_id") REFERENCES "public"."studio_generation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_generation" ADD CONSTRAINT "studio_generation_project_id_studio_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."studio_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_generation" ADD CONSTRAINT "studio_generation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_project" ADD CONSTRAINT "studio_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_asset_project_id_idx" ON "studio_asset" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "studio_asset_generation_id_idx" ON "studio_asset" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "studio_asset_user_id_idx" ON "studio_asset" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "studio_asset_type_idx" ON "studio_asset" USING btree ("type");--> statement-breakpoint
CREATE INDEX "studio_asset_status_idx" ON "studio_asset" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_asset_storage_key_unique" ON "studio_asset" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "studio_credit_ledger_user_id_idx" ON "studio_credit_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "studio_credit_ledger_created_at_idx" ON "studio_credit_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "studio_credit_ledger_subscription_idx" ON "studio_credit_ledger" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "studio_credit_ledger_project_idx" ON "studio_credit_ledger" USING btree ("studio_project_id");--> statement-breakpoint
CREATE INDEX "studio_credit_ledger_generation_idx" ON "studio_credit_ledger" USING btree ("studio_generation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_credit_ledger_checkout_session_unique" ON "studio_credit_ledger" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_credit_ledger_invoice_unique" ON "studio_credit_ledger" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "studio_generation_project_id_idx" ON "studio_generation" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "studio_generation_user_id_idx" ON "studio_generation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "studio_generation_status_idx" ON "studio_generation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "studio_generation_created_at_idx" ON "studio_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "studio_project_user_id_idx" ON "studio_project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "studio_project_status_idx" ON "studio_project" USING btree ("status");--> statement-breakpoint
CREATE INDEX "studio_project_updated_at_idx" ON "studio_project" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "studio_project_user_status_idx" ON "studio_project" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_beacon_plus_subscription_unique" ON "user" USING btree ("beacon_plus_stripe_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_business_subscription_unique" ON "user" USING btree ("business_stripe_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_studio_subscription_unique" ON "user" USING btree ("studio_stripe_subscription_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_beacon_plus_stripe_subscription_id_unique" UNIQUE("beacon_plus_stripe_subscription_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_business_stripe_subscription_id_unique" UNIQUE("business_stripe_subscription_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_studio_stripe_subscription_id_unique" UNIQUE("studio_stripe_subscription_id");