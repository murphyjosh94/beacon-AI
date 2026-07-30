-- Beacon unified billing foundation
-- Adds separate subscription state for Beacon+, Beacon Business and Beacon Studio.
-- Adds dedicated Beacon Studio credit balances and an auditable Studio credit ledger.
--
-- Apply this migration once to the same PostgreSQL database used by Beacon.
-- Review against your current production schema before deployment.

DO $$
BEGIN
  CREATE TYPE "beacon_plus_billing_plan" AS ENUM ('monthly', 'annual');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "business_membership_plan" AS ENUM ('business', 'business_pro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "studio_membership_plan" AS ENUM ('pro', 'business', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "studio_credit_ledger_type" AS ENUM (
    'purchase',
    'membership_reset',
    'business_membership_reset',
    'generation',
    'refund',
    'adjustment',
    'promotion',
    'complimentary'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "beacon_plus_plan" "beacon_plus_billing_plan",
  ADD COLUMN IF NOT EXISTS "beacon_plus_stripe_subscription_id" text,
  ADD COLUMN IF NOT EXISTS "beacon_plus_subscription_status" text,
  ADD COLUMN IF NOT EXISTS "beacon_plus_current_period_start" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "beacon_plus_searches_used_this_period" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "beacon_plus_search_limit" integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS "business_membership_plan" "business_membership_plan",
  ADD COLUMN IF NOT EXISTS "business_membership_active" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "business_stripe_subscription_id" text,
  ADD COLUMN IF NOT EXISTS "business_subscription_status" text,
  ADD COLUMN IF NOT EXISTS "business_current_period_start" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "business_current_period_end" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "business_studio_credits_allowance" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "business_studio_credits_renewed_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "studio_membership_plan" "studio_membership_plan",
  ADD COLUMN IF NOT EXISTS "studio_membership_active" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "studio_stripe_subscription_id" text,
  ADD COLUMN IF NOT EXISTS "studio_subscription_status" text,
  ADD COLUMN IF NOT EXISTS "studio_current_period_start" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "studio_current_period_end" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "studio_membership_credits_allowance" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "studio_membership_credits_renewed_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "studio_purchased_credits" integer NOT NULL DEFAULT 0;

-- Preserve existing Beacon+ subscription data while the application migrates
-- from the legacy shared subscription columns to product-specific columns.
UPDATE "user"
SET
  "beacon_plus_stripe_subscription_id" = COALESCE(
    "beacon_plus_stripe_subscription_id",
    "stripe_subscription_id"
  ),
  "beacon_plus_subscription_status" = COALESCE(
    "beacon_plus_subscription_status",
    "stripe_subscription_status"
  )
WHERE
  "beacon_plus_active" = true
  OR "stripe_subscription_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "user_beacon_plus_subscription_unique"
  ON "user" ("beacon_plus_stripe_subscription_id")
  WHERE "beacon_plus_stripe_subscription_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "user_business_subscription_unique"
  ON "user" ("business_stripe_subscription_id")
  WHERE "business_stripe_subscription_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "user_studio_subscription_unique"
  ON "user" ("studio_stripe_subscription_id")
  WHERE "studio_stripe_subscription_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "user_beacon_plus_active_idx"
  ON "user" ("beacon_plus_active");

CREATE INDEX IF NOT EXISTS "user_business_membership_active_idx"
  ON "user" ("business_membership_active");

CREATE INDEX IF NOT EXISTS "user_studio_membership_active_idx"
  ON "user" ("studio_membership_active");

CREATE TABLE IF NOT EXISTS "studio_credit_ledger" (
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
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "studio_credit_ledger_user_id_user_id_fk"
    FOREIGN KEY ("user_id")
    REFERENCES "public"."user"("id")
    ON DELETE cascade
    ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "studio_credit_ledger_user_id_idx"
  ON "studio_credit_ledger" ("user_id");

CREATE INDEX IF NOT EXISTS "studio_credit_ledger_created_at_idx"
  ON "studio_credit_ledger" ("created_at");

CREATE INDEX IF NOT EXISTS "studio_credit_ledger_subscription_idx"
  ON "studio_credit_ledger" ("stripe_subscription_id");

CREATE UNIQUE INDEX IF NOT EXISTS "studio_credit_ledger_checkout_session_unique"
  ON "studio_credit_ledger" ("stripe_checkout_session_id")
  WHERE "stripe_checkout_session_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "studio_credit_ledger_invoice_unique"
  ON "studio_credit_ledger" ("stripe_invoice_id")
  WHERE "stripe_invoice_id" IS NOT NULL;

-- Protect balances and fair-use counters from accidental negative values.
DO $$
BEGIN
  ALTER TABLE "user"
    ADD CONSTRAINT "user_beacon_plus_searches_nonnegative"
    CHECK ("beacon_plus_searches_used_this_period" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "user"
    ADD CONSTRAINT "user_beacon_plus_search_limit_positive"
    CHECK ("beacon_plus_search_limit" > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "user"
    ADD CONSTRAINT "user_business_studio_credits_nonnegative"
    CHECK ("business_studio_credits_allowance" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "user"
    ADD CONSTRAINT "user_studio_membership_credits_nonnegative"
    CHECK ("studio_membership_credits_allowance" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "user"
    ADD CONSTRAINT "user_studio_purchased_credits_nonnegative"
    CHECK ("studio_purchased_credits" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "studio_credit_ledger"
    ADD CONSTRAINT "studio_credit_ledger_purchased_balance_nonnegative"
    CHECK ("purchased_balance_after" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "studio_credit_ledger"
    ADD CONSTRAINT "studio_credit_ledger_membership_balance_nonnegative"
    CHECK ("studio_membership_allowance_after" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "studio_credit_ledger"
    ADD CONSTRAINT "studio_credit_ledger_business_balance_nonnegative"
    CHECK ("business_allowance_after" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "studio_credit_ledger"
    ADD CONSTRAINT "studio_credit_ledger_total_balance_nonnegative"
    CHECK ("total_available_after" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;