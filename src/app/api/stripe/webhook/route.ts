import { NextResponse } from "next/server";

import {
  eq,
  or,
  sql,
} from "drizzle-orm";

import type Stripe from "stripe";

import { database } from "@/lib/database/Database";

import {
  creditLedger,
  stripeWebhookEvent,
  studioCreditLedger,
  user,
} from "@/lib/database/schema";

import { getStripeClient } from "@/lib/stripe/StripeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductFamily =
  | "beacon_plus"
  | "business"
  | "studio";

type BeaconPlusPlan =
  | "monthly"
  | "annual";

type BusinessPlan =
  | "business"
  | "business_pro";

type StudioPlan =
  | "pro"
  | "business"
  | "enterprise";

type ResolvedSubscriptionProduct =
  | {
      family: "beacon_plus";
      plan: BeaconPlusPlan;
      allowance: 300;
    }
  | {
      family: "business";
      plan: BusinessPlan;
      allowance: 50 | 150;
    }
  | {
      family: "studio";
      plan: StudioPlan;
      allowance: 300 | 800 | 2500;
    };

type WebhookClaim =
  | {
      process: true;
    }
  | {
      process: false;
      reason: "completed" | "processing";
    };

const ACTIVE_SUBSCRIPTION_STATUSES =
  new Set<Stripe.Subscription.Status>([
    "active",
    "trialing",
  ]);

const STUDIO_CREDIT_PACKS =
  new Map<string, number>([
    ["credits_100", 100],
    ["credits_300", 300],
    ["credits_750", 750],
    ["credits_1500", 1500],
    ["credits_3000", 3000],
  ]);

const BEACON_CREDIT_PACKS =
  new Set([5, 15, 25]);

function readRequiredEnvironmentVariable(
  name: string,
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is not configured.`,
    );
  }

  return value;
}

function readOptionalEnvironmentVariable(
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value =
      process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

function readMetadataValue(
  metadata:
    | Stripe.Metadata
    | null
    | undefined,
  key: string,
): string | undefined {
  const value =
    metadata?.[key]?.trim();

  return value || undefined;
}

function readUserId(
  metadata:
    | Stripe.Metadata
    | null
    | undefined,
  fallback?: string | null,
): string | undefined {
  return (
    readMetadataValue(
      metadata,
      "beaconUserId",
    ) ||
    readMetadataValue(
      metadata,
      "userId",
    ) ||
    fallback?.trim() ||
    undefined
  );
}

function readExpandableId(
  value:
    | string
    | { id: string }
    | null
    | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (
    typeof value === "string"
  ) {
    return (
      value.trim() ||
      undefined
    );
  }

  return (
    value.id?.trim() ||
    undefined
  );
}

function unixDate(
  value:
    | number
    | null
    | undefined,
): Date | null {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? new Date(value * 1000)
    : null;
}

function subscriptionPeriod(
  subscription: Stripe.Subscription,
): {
  start: Date | null;
  end: Date | null;
} {
  const starts =
    subscription.items.data
      .map(
        (item) =>
          item.current_period_start,
      )
      .filter(
        (
          value,
        ): value is number =>
          typeof value ===
            "number" &&
          Number.isFinite(value),
      );

  const ends =
    subscription.items.data
      .map(
        (item) =>
          item.current_period_end,
      )
      .filter(
        (
          value,
        ): value is number =>
          typeof value ===
            "number" &&
          Number.isFinite(value),
      );

  return {
    start:
      starts.length > 0
        ? unixDate(
            Math.min(...starts),
          )
        : null,
    end:
      ends.length > 0
        ? unixDate(
            Math.max(...ends),
          )
        : null,
  };
}

function subscriptionPriceIds(
  subscription: Stripe.Subscription,
): string[] {
  return subscription.items.data
    .map(
      (item) =>
        item.price.id?.trim(),
    )
    .filter(
      (
        value,
      ): value is string =>
        Boolean(value),
    );
}

function matchesPrice(
  priceIds: string[],
  ...environmentVariables: string[]
): boolean {
  const configured =
    environmentVariables
      .map((name) =>
        readOptionalEnvironmentVariable(
          name,
        ),
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      );

  return configured.some(
    (priceId) =>
      priceIds.includes(priceId),
  );
}

function resolveSubscriptionProduct(
  subscription: Stripe.Subscription,
): ResolvedSubscriptionProduct {
  const metadata =
    subscription.metadata;

  const source =
    readMetadataValue(
      metadata,
      "source",
    );

  const studioPlan =
    readMetadataValue(
      metadata,
      "studioMembershipPlan",
    );

  if (
    source === "beacon_studio" ||
    studioPlan
  ) {
    if (
      studioPlan === "pro"
    ) {
      return {
        family: "studio",
        plan: "pro",
        allowance: 300,
      };
    }

    if (
      studioPlan === "business"
    ) {
      return {
        family: "studio",
        plan: "business",
        allowance: 800,
      };
    }

    if (
      studioPlan === "enterprise"
    ) {
      return {
        family: "studio",
        plan: "enterprise",
        allowance: 2500,
      };
    }
  }

  const businessPlan =
    readMetadataValue(
      metadata,
      "membershipPlan",
    ) ||
    readMetadataValue(
      metadata,
      "businessMembershipPlan",
    ) ||
    readMetadataValue(
      metadata,
      "plan",
    );

  if (
    source ===
      "beacon_business_memberships" ||
    source ===
      "beacon_business"
  ) {
    if (
      businessPlan ===
        "business_pro" ||
      businessPlan === "pro"
    ) {
      return {
        family: "business",
        plan: "business_pro",
        allowance: 150,
      };
    }

    return {
      family: "business",
      plan: "business",
      allowance: 50,
    };
  }

  const priceIds =
    subscriptionPriceIds(
      subscription,
    );

  if (
    matchesPrice(
      priceIds,
      "STRIPE_STUDIO_PRO_PRICE_ID",
    )
  ) {
    return {
      family: "studio",
      plan: "pro",
      allowance: 300,
    };
  }

  if (
    matchesPrice(
      priceIds,
      "STRIPE_STUDIO_BUSINESS_PRICE_ID",
    )
  ) {
    return {
      family: "studio",
      plan: "business",
      allowance: 800,
    };
  }

  if (
    matchesPrice(
      priceIds,
      "STRIPE_STUDIO_ENTERPRISE_PRICE_ID",
    )
  ) {
    return {
      family: "studio",
      plan: "enterprise",
      allowance: 2500,
    };
  }

  if (
    matchesPrice(
      priceIds,
      "STRIPE_PRICE_BEACON_BUSINESS_PRO",
    )
  ) {
    return {
      family: "business",
      plan: "business_pro",
      allowance: 150,
    };
  }

  if (
    matchesPrice(
      priceIds,
      "STRIPE_PRICE_BEACON_BUSINESS",
    )
  ) {
    return {
      family: "business",
      plan: "business",
      allowance: 50,
    };
  }

  if (
    matchesPrice(
      priceIds,
      "STRIPE_BEACON_PLUS_ANNUAL_PRICE_ID",
      "STRIPE_BEACON_PLUS_YEARLY_PRICE_ID",
    )
  ) {
    return {
      family: "beacon_plus",
      plan: "annual",
      allowance: 300,
    };
  }

  if (
    matchesPrice(
      priceIds,
      "STRIPE_BEACON_PLUS_PRICE_ID",
      "STRIPE_BEACON_PLUS_MONTHLY_PRICE_ID",
    )
  ) {
    return {
      family: "beacon_plus",
      plan: "monthly",
      allowance: 300,
    };
  }

  const purchaseType =
    readMetadataValue(
      metadata,
      "purchaseType",
    );

  if (
    purchaseType ===
      "beacon_plus" ||
    purchaseType ===
      "subscription"
  ) {
    const billingInterval =
      readMetadataValue(
        metadata,
        "billingInterval",
      );

    return {
      family: "beacon_plus",
      plan:
        billingInterval ===
          "annual" ||
        billingInterval ===
          "year"
          ? "annual"
          : "monthly",
      allowance: 300,
    };
  }

  throw new Error(
    `Stripe subscription ${subscription.id} does not match a configured Beacon product.`,
  );
}

async function claimWebhookEvent(
  event: Stripe.Event,
): Promise<WebhookClaim> {
  const inserted =
    await database
      .insert(
        stripeWebhookEvent,
      )
      .values({
        stripeEventId:
          event.id,
        eventType:
          event.type,
        status:
          "processing",
        payload:
          event,
      })
      .onConflictDoNothing({
        target:
          stripeWebhookEvent
            .stripeEventId,
      })
      .returning({
        id:
          stripeWebhookEvent.id,
      });

  if (
    inserted.length > 0
  ) {
    return {
      process: true,
    };
  }

  const existing =
    await database
      .select({
        status:
          stripeWebhookEvent.status,
      })
      .from(
        stripeWebhookEvent,
      )
      .where(
        eq(
          stripeWebhookEvent
            .stripeEventId,
          event.id,
        ),
      )
      .limit(1);

  if (
    existing[0]?.status ===
    "completed"
  ) {
    return {
      process: false,
      reason: "completed",
    };
  }

  if (
    existing[0]?.status ===
    "processing"
  ) {
    return {
      process: false,
      reason: "processing",
    };
  }

  await database
    .update(
      stripeWebhookEvent,
    )
    .set({
      status:
        "processing",
      errorMessage:
        null,
      payload:
        event,
      processedAt:
        null,
    })
    .where(
      eq(
        stripeWebhookEvent
          .stripeEventId,
        event.id,
      ),
    );

  return {
    process: true,
  };
}

async function markWebhookCompleted(
  event: Stripe.Event,
  userId?: string,
): Promise<void> {
  await database
    .update(
      stripeWebhookEvent,
    )
    .set({
      status:
        "completed",
      userId:
        userId ?? null,
      errorMessage:
        null,
      processedAt:
        new Date(),
    })
    .where(
      eq(
        stripeWebhookEvent
          .stripeEventId,
        event.id,
      ),
    );
}

async function markWebhookFailed(
  event: Stripe.Event,
  error: unknown,
): Promise<void> {
  await database
    .update(
      stripeWebhookEvent,
    )
    .set({
      status:
        "failed",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Unknown Stripe webhook error.",
      processedAt:
        new Date(),
    })
    .where(
      eq(
        stripeWebhookEvent
          .stripeEventId,
        event.id,
      ),
    );
}

async function findUserIdByCustomerId(
  customerId: string,
): Promise<string | undefined> {
  const result =
    await database
      .select({
        id:
          user.id,
      })
      .from(user)
      .where(
        eq(
          user.stripeCustomerId,
          customerId,
        ),
      )
      .limit(1);

  return result[0]?.id;
}

async function findUserIdBySubscriptionId(
  subscriptionId: string,
): Promise<string | undefined> {
  const result =
    await database
      .select({
        id:
          user.id,
      })
      .from(user)
      .where(
        or(
          eq(
            user.beaconPlusStripeSubscriptionId,
            subscriptionId,
          ),
          eq(
            user.businessStripeSubscriptionId,
            subscriptionId,
          ),
          eq(
            user.studioStripeSubscriptionId,
            subscriptionId,
          ),
          eq(
            user.stripeSubscriptionId,
            subscriptionId,
          ),
        ),
      )
      .limit(1);

  return result[0]?.id;
}

async function resolveSubscriptionUserId(
  subscription: Stripe.Subscription,
  fallbackUserId?: string,
): Promise<string | undefined> {
  const metadataUserId =
    readUserId(
      subscription.metadata,
      fallbackUserId,
    );

  if (metadataUserId) {
    return metadataUserId;
  }

  const customerId =
    readExpandableId(
      subscription.customer,
    );

  if (customerId) {
    const customerUserId =
      await findUserIdByCustomerId(
        customerId,
      );

    if (customerUserId) {
      return customerUserId;
    }
  }

  return findUserIdBySubscriptionId(
    subscription.id,
  );
}

async function insertStudioLedger(
  input: {
    userId: string;
    type:
      | "purchase"
      | "membership_reset"
      | "business_membership_reset";
    amount: number;
    description: string;
    checkoutSessionId?: string;
    paymentIntentId?: string;
    invoiceId?: string;
    subscriptionId?: string;
    metadata?: Record<
      string,
      string | number | boolean | null
    >;
  },
): Promise<void> {
  const balances =
    await database
      .select({
        purchased:
          user.studioPurchasedCredits,
        membership:
          user.studioMembershipCreditsAllowance,
        business:
          user.businessStudioCreditsAllowance,
      })
      .from(user)
      .where(
        eq(
          user.id,
          input.userId,
        ),
      )
      .limit(1);

  const balance =
    balances[0];

  if (!balance) {
    throw new Error(
      "The Beacon account linked to this Studio transaction could not be found.",
    );
  }

  await database
    .insert(
      studioCreditLedger,
    )
    .values({
      userId:
        input.userId,
      type:
        input.type,
      amount:
        input.amount,
      purchasedBalanceAfter:
        balance.purchased,
      studioMembershipAllowanceAfter:
        balance.membership,
      businessAllowanceAfter:
        balance.business,
      totalAvailableAfter:
        balance.purchased +
        balance.membership +
        balance.business,
      description:
        input.description,
      stripeCheckoutSessionId:
        input.checkoutSessionId,
      stripePaymentIntentId:
        input.paymentIntentId,
      stripeInvoiceId:
        input.invoiceId,
      stripeSubscriptionId:
        input.subscriptionId,
      metadata:
        input.metadata ?? {},
    })
    .onConflictDoNothing();
}

async function addBeaconCredits(
  input: {
    userId: string;
    credits: number;
    checkoutSessionId: string;
    paymentIntentId?: string;
    label?: string;
  },
): Promise<void> {
  const existing =
    await database
      .select({
        id:
          creditLedger.id,
      })
      .from(
        creditLedger,
      )
      .where(
        eq(
          creditLedger
            .stripeCheckoutSessionId,
          input.checkoutSessionId,
        ),
      )
      .limit(1);

  if (
    existing.length > 0
  ) {
    return;
  }

  const updated =
    await database
      .update(user)
      .set({
        purchasedCredits:
          sql`${user.purchasedCredits} + ${input.credits}`,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          user.id,
          input.userId,
        ),
      )
      .returning({
        balance:
          user.purchasedCredits,
      });

  if (!updated[0]) {
    throw new Error(
      "The Beacon account linked to this credit purchase could not be found.",
    );
  }

  await database
    .insert(
      creditLedger,
    )
    .values({
      userId:
        input.userId,
      type:
        "purchase",
      amount:
        input.credits,
      balanceAfter:
        updated[0].balance,
      description:
        input.label
          ? `${input.label} purchased through Stripe.`
          : `${input.credits} Beacon credits purchased through Stripe.`,
      stripeCheckoutSessionId:
        input.checkoutSessionId,
      stripePaymentIntentId:
        input.paymentIntentId,
      metadata: {
        source:
          "stripe_checkout",
        credits:
          input.credits,
      },
    })
    .onConflictDoNothing({
      target:
        creditLedger
          .stripeCheckoutSessionId,
    });
}

async function addStudioCredits(
  input: {
    userId: string;
    credits: number;
    checkoutSessionId: string;
    paymentIntentId?: string;
    productId?: string;
  },
): Promise<void> {
  const existing =
    await database
      .select({
        id:
          studioCreditLedger.id,
      })
      .from(
        studioCreditLedger,
      )
      .where(
        eq(
          studioCreditLedger
            .stripeCheckoutSessionId,
          input.checkoutSessionId,
        ),
      )
      .limit(1);

  if (
    existing.length > 0
  ) {
    return;
  }

  const updated =
    await database
      .update(user)
      .set({
        studioPurchasedCredits:
          sql`${user.studioPurchasedCredits} + ${input.credits}`,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          user.id,
          input.userId,
        ),
      )
      .returning({
        id:
          user.id,
      });

  if (!updated[0]) {
    throw new Error(
      "The Beacon account linked to this Studio credit purchase could not be found.",
    );
  }

  await insertStudioLedger({
    userId:
      input.userId,
    type:
      "purchase",
    amount:
      input.credits,
    description:
      `${input.credits.toLocaleString("en-GB")} Beacon Studio Credits purchased through Stripe.`,
    checkoutSessionId:
      input.checkoutSessionId,
    paymentIntentId:
      input.paymentIntentId,
    metadata: {
      source:
        "beacon_studio",
      productId:
        input.productId ?? null,
      credits:
        input.credits,
    },
  });
}

async function updateSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string,
  invoiceId?: string,
): Promise<string> {
  const userId =
    await resolveSubscriptionUserId(
      subscription,
      fallbackUserId,
    );

  if (!userId) {
    throw new Error(
      `No Beacon account could be matched to Stripe subscription ${subscription.id}.`,
    );
  }

  const product =
    resolveSubscriptionProduct(
      subscription,
    );

  const active =
    ACTIVE_SUBSCRIPTION_STATUSES.has(
      subscription.status,
    );

  const customerId =
    readExpandableId(
      subscription.customer,
    );

  const period =
    subscriptionPeriod(
      subscription,
    );

  const now =
    new Date();

  if (
    product.family ===
    "beacon_plus"
  ) {
    await database
      .update(user)
      .set({
        stripeCustomerId:
          customerId,
        beaconPlusPlan:
          product.plan,
        beaconPlusActive:
          active,
        beaconPlusStripeSubscriptionId:
          subscription.id,
        beaconPlusSubscriptionStatus:
          subscription.status,
        beaconPlusCurrentPeriodStart:
          period.start,
        beaconPlusCurrentPeriodEnd:
          period.end,
        beaconPlusSearchesUsedThisPeriod:
          active ? 0 : sql`${user.beaconPlusSearchesUsedThisPeriod}`,
        beaconPlusSearchLimit:
          300,
        stripeSubscriptionId:
          subscription.id,
        stripeSubscriptionStatus:
          subscription.status,
        updatedAt:
          now,
      })
      .where(
        eq(
          user.id,
          userId,
        ),
      );

    return userId;
  }

  if (
    product.family ===
    "business"
  ) {
    await database
      .update(user)
      .set({
        stripeCustomerId:
          customerId,
        businessMembershipPlan:
          product.plan,
        businessMembershipActive:
          active,
        businessStripeSubscriptionId:
          subscription.id,
        businessSubscriptionStatus:
          subscription.status,
        businessCurrentPeriodStart:
          period.start,
        businessCurrentPeriodEnd:
          period.end,
        businessStudioCreditsAllowance:
          active
            ? product.allowance
            : 0,
        businessStudioCreditsRenewedAt:
          active
            ? period.start ?? now
            : null,
        updatedAt:
          now,
      })
      .where(
        eq(
          user.id,
          userId,
        ),
      );

    if (active) {
      await insertStudioLedger({
        userId,
        type:
          "business_membership_reset",
        amount:
          product.allowance,
        description:
          `${product.allowance} monthly Studio Credits included with Beacon Business ${product.plan === "business_pro" ? "Pro" : ""}.`.trim(),
        invoiceId,
        subscriptionId:
          subscription.id,
        metadata: {
          family:
            "business",
          plan:
            product.plan,
          periodStart:
            period.start?.toISOString() ??
            null,
        },
      });
    }

    return userId;
  }

  await database
    .update(user)
    .set({
      stripeCustomerId:
        customerId,
      studioMembershipPlan:
        product.plan,
      studioMembershipActive:
        active,
      studioStripeSubscriptionId:
        subscription.id,
      studioSubscriptionStatus:
        subscription.status,
      studioCurrentPeriodStart:
        period.start,
      studioCurrentPeriodEnd:
        period.end,
      studioMembershipCreditsAllowance:
        active
          ? product.allowance
          : 0,
      studioMembershipCreditsRenewedAt:
        active
          ? period.start ?? now
          : null,
      updatedAt:
        now,
    })
    .where(
      eq(
        user.id,
        userId,
      ),
    );

  if (active) {
    await insertStudioLedger({
      userId,
      type:
        "membership_reset",
      amount:
        product.allowance,
      description:
        `${product.allowance.toLocaleString("en-GB")} monthly Studio Credits included with Beacon Studio ${product.plan}.`,
      invoiceId,
      subscriptionId:
        subscription.id,
      metadata: {
        family:
          "studio",
        plan:
          product.plan,
        periodStart:
          period.start?.toISOString() ??
          null,
      },
    });
  }

  return userId;
}

async function processCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<string> {
  const userId =
    readUserId(
      session.metadata,
      session.client_reference_id,
    );

  if (!userId) {
    throw new Error(
      `Stripe Checkout Session ${session.id} does not contain a Beacon user ID.`,
    );
  }

  const customerId =
    readExpandableId(
      session.customer,
    );

  if (customerId) {
    await database
      .update(user)
      .set({
        stripeCustomerId:
          customerId,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          user.id,
          userId,
        ),
      );
  }

  if (
    session.mode === "payment"
  ) {
    if (
      session.payment_status !==
      "paid"
    ) {
      throw new Error(
        `Stripe Checkout Session ${session.id} has not been paid.`,
      );
    }

    const studioProductId =
      readMetadataValue(
        session.metadata,
        "studioProductId",
      );

    const studioKind =
      readMetadataValue(
        session.metadata,
        "studioPurchaseKind",
      );

    const studioCreditsValue =
      readMetadataValue(
        session.metadata,
        "studioCredits",
      );

    const studioCredits =
      studioCreditsValue
        ? Number(studioCreditsValue)
        : studioProductId
          ? STUDIO_CREDIT_PACKS.get(
              studioProductId,
            )
          : undefined;

    if (
      studioKind === "credits" ||
      studioProductId?.startsWith(
        "credits_",
      )
    ) {
      if (
        !studioCredits ||
        !Number.isInteger(
          studioCredits,
        ) ||
        studioCredits <= 0
      ) {
        throw new Error(
          `Stripe Checkout Session ${session.id} does not contain a valid Studio credit amount.`,
        );
      }

      await addStudioCredits({
        userId,
        credits:
          studioCredits,
        checkoutSessionId:
          session.id,
        paymentIntentId:
          readExpandableId(
            session.payment_intent,
          ),
        productId:
          studioProductId,
      });

      return userId;
    }

    const creditsValue =
      readMetadataValue(
        session.metadata,
        "credits",
      );

    const credits =
      creditsValue
        ? Number(creditsValue)
        : NaN;

    if (
      !Number.isInteger(
        credits,
      ) ||
      !BEACON_CREDIT_PACKS.has(
        credits,
      )
    ) {
      throw new Error(
        `Stripe Checkout Session ${session.id} does not contain a valid Beacon credit pack.`,
      );
    }

    await addBeaconCredits({
      userId,
      credits,
      checkoutSessionId:
        session.id,
      paymentIntentId:
        readExpandableId(
          session.payment_intent,
        ),
      label:
        readMetadataValue(
          session.metadata,
          "purchaseLabel",
        ),
    });

    return userId;
  }

  if (
    session.mode ===
    "subscription"
  ) {
    const subscriptionId =
      readExpandableId(
        session.subscription,
      );

    if (!subscriptionId) {
      throw new Error(
        `Stripe Checkout Session ${session.id} does not contain a subscription ID.`,
      );
    }

    const subscription =
      await getStripeClient()
        .subscriptions.retrieve(
          subscriptionId,
        );

    return updateSubscription(
      subscription,
      userId,
    );
  }

  throw new Error(
    `Stripe Checkout Session ${session.id} uses unsupported mode ${session.mode}.`,
  );
}

async function processPaidInvoice(
  invoice: Stripe.Invoice,
): Promise<string | undefined> {
  const subscriptionId =
    readExpandableId(
      invoice.parent
        ?.subscription_details
        ?.subscription,
    );

  if (!subscriptionId) {
    return undefined;
  }

  const subscription =
    await getStripeClient()
      .subscriptions.retrieve(
        subscriptionId,
      );

  return updateSubscription(
    subscription,
    readUserId(
      invoice.metadata,
    ),
    invoice.id,
  );
}

async function processStripeEvent(
  event: Stripe.Event,
): Promise<string | undefined> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return processCheckoutSession(
        event.data
          .object as Stripe.Checkout.Session,
      );

    case "invoice.paid":
      return processPaidInvoice(
        event.data
          .object as Stripe.Invoice,
      );

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
    case "customer.subscription.deleted":
      return updateSubscription(
        event.data
          .object as Stripe.Subscription,
      );

    default:
      return undefined;
  }
}

function errorResponse(
  code: string,
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}

export async function POST(
  request: Request,
) {
  const stripe =
    getStripeClient();

  const signature =
    request.headers.get(
      "stripe-signature",
    );

  if (!signature) {
    return errorResponse(
      "missing_signature",
      "The Stripe signature header is missing.",
      400,
    );
  }

  const rawBody =
    await request.text();

  let event: Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        readRequiredEnvironmentVariable(
          "STRIPE_WEBHOOK_SECRET",
        ),
      );
  } catch (error) {
    console.error(
      "Beacon rejected an invalid Stripe webhook:",
      error,
    );

    return errorResponse(
      "invalid_signature",
      "The Stripe webhook signature could not be verified.",
      400,
    );
  }

  const claim =
    await claimWebhookEvent(
      event,
    );

  if (!claim.process) {
    return NextResponse.json({
      success: true,
      data: {
        received: true,
        duplicate: true,
        status:
          claim.reason,
      },
    });
  }

  try {
    const userId =
      await processStripeEvent(
        event,
      );

    await markWebhookCompleted(
      event,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: {
        received: true,
        processed: true,
        eventType:
          event.type,
      },
    });
  } catch (error) {
    console.error(
      `Beacon failed to process Stripe event ${event.id}:`,
      error,
    );

    await markWebhookFailed(
      event,
      error,
    );

    return errorResponse(
      "webhook_processing_failed",
      error instanceof Error
        ? error.message
        : "Beacon could not process the Stripe event.",
      500,
    );
  }
}