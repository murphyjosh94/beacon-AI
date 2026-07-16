import { NextResponse } from "next/server";

import {
  eq,
  sql,
} from "drizzle-orm";

import type Stripe from "stripe";

import { database } from "@/lib/database/Database";

import {
  creditLedger,
  stripeWebhookEvent,
  user,
} from "@/lib/database/schema";

import {
  getStripeClient,
  isBeaconPurchaseType,
} from "@/lib/stripe/StripeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookClaim =
  | {
      process: true;
    }
  | {
      process: false;
      reason:
        | "completed"
        | "processing";
    };

function readWebhookSecret(): string {
  const secret =
    process.env
      .STRIPE_WEBHOOK_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured."
    );
  }

  return secret;
}

function readMetadataValue(
  metadata:
    | Stripe.Metadata
    | null
    | undefined,
  key: string
): string | undefined {
  const value =
    metadata?.[key]?.trim();

  return value || undefined;
}

function readBeaconUserId(
  metadata:
    | Stripe.Metadata
    | null
    | undefined,
  fallback?: string | null
): string | undefined {
  return (
    readMetadataValue(
      metadata,
      "beaconUserId"
    ) ||
    fallback?.trim() ||
    undefined
  );
}

/*
 * Stripe expandable fields can contain:
 *
 * - a string resource ID;
 * - an expanded Stripe object containing an ID;
 * - null or undefined.
 *
 * This works for Customer, Subscription,
 * PaymentIntent and other expandable objects.
 */
function readExpandableId(
  value:
    | string
    | {
        id: string;
      }
    | null
    | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (
    typeof value === "string"
  ) {
    const cleaned =
      value.trim();

    return cleaned || undefined;
  }

  const cleaned =
    value.id?.trim();

  return cleaned || undefined;
}

function readCredits(
  metadata:
    | Stripe.Metadata
    | null
    | undefined
): number | null {
  const value =
    readMetadataValue(
      metadata,
      "credits"
    );

  if (
    !value ||
    value === "unlimited"
  ) {
    return null;
  }

  const credits =
    Number(value);

  if (
    !Number.isInteger(
      credits
    ) ||
    credits <= 0
  ) {
    return null;
  }

  return credits;
}

function isActiveSubscriptionStatus(
  status: Stripe.Subscription.Status
): boolean {
  return (
    status === "active" ||
    status === "trialing"
  );
}

function readSubscriptionPeriodEnd(
  subscription: Stripe.Subscription
): Date | null {
  const itemPeriodEnds =
    subscription.items.data
      .map(
        (item) =>
          item.current_period_end
      )
      .filter(
        (
          value
        ): value is number =>
          typeof value ===
            "number" &&
          Number.isFinite(value)
      );

  if (
    itemPeriodEnds.length === 0
  ) {
    return null;
  }

  const timestamp =
    Math.max(
      ...itemPeriodEnds
    );

  return new Date(
    timestamp * 1000
  );
}

async function claimWebhookEvent(
  event: Stripe.Event
): Promise<WebhookClaim> {
  const inserted =
    await database
      .insert(
        stripeWebhookEvent
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
        stripeWebhookEvent
      )
      .where(
        eq(
          stripeWebhookEvent
            .stripeEventId,
          event.id
        )
      )
      .limit(1);

  const status =
    existing[0]?.status;

  if (
    status === "completed"
  ) {
    return {
      process: false,
      reason: "completed",
    };
  }

  if (
    status === "processing"
  ) {
    return {
      process: false,
      reason: "processing",
    };
  }

  await database
    .update(
      stripeWebhookEvent
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
        event.id
      )
    );

  return {
    process: true,
  };
}

async function markWebhookCompleted(
  event: Stripe.Event,
  userId?: string
): Promise<void> {
  await database
    .update(
      stripeWebhookEvent
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
        event.id
      )
    );
}

async function markWebhookFailed(
  event: Stripe.Event,
  error: unknown
): Promise<void> {
  await database
    .update(
      stripeWebhookEvent
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
        event.id
      )
    );
}

async function findUserIdByCustomerId(
  customerId: string
): Promise<string | undefined> {
  const matches =
    await database
      .select({
        id:
          user.id,
      })
      .from(user)
      .where(
        eq(
          user.stripeCustomerId,
          customerId
        )
      )
      .limit(1);

  return matches[0]?.id;
}

async function findUserIdBySubscriptionId(
  subscriptionId: string
): Promise<string | undefined> {
  const matches =
    await database
      .select({
        id:
          user.id,
      })
      .from(user)
      .where(
        eq(
          user.stripeSubscriptionId,
          subscriptionId
        )
      )
      .limit(1);

  return matches[0]?.id;
}

async function addPurchasedCredits(
  input: {
    userId: string;
    credits: number;
    checkoutSessionId: string;
    paymentIntentId?: string;
    purchaseLabel?: string;
  }
): Promise<void> {
  const existingLedger =
    await database
      .select({
        id:
          creditLedger.id,
      })
      .from(
        creditLedger
      )
      .where(
        eq(
          creditLedger
            .stripeCheckoutSessionId,
          input.checkoutSessionId
        )
      )
      .limit(1);

  if (
    existingLedger.length > 0
  ) {
    return;
  }

  const updatedUsers =
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
          input.userId
        )
      )
      .returning({
        purchasedCredits:
          user.purchasedCredits,
      });

  const updatedAccount =
    updatedUsers[0];

  if (!updatedAccount) {
    throw new Error(
      "The Beacon account linked to this payment could not be found."
    );
  }

  await database
    .insert(
      creditLedger
    )
    .values({
      userId:
        input.userId,

      type:
        "purchase",

      amount:
        input.credits,

      balanceAfter:
        updatedAccount
          .purchasedCredits,

      description:
        input.purchaseLabel
          ? `${input.purchaseLabel} purchased through Stripe.`
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

async function resolveSubscriptionUserId(
  subscription: Stripe.Subscription,
  fallbackUserId?: string
): Promise<string | undefined> {
  const metadataUserId =
    readBeaconUserId(
      subscription.metadata,
      fallbackUserId
    );

  if (metadataUserId) {
    return metadataUserId;
  }

  const customerId =
    readExpandableId(
      subscription.customer
    );

  if (customerId) {
    const customerUserId =
      await findUserIdByCustomerId(
        customerId
      );

    if (customerUserId) {
      return customerUserId;
    }
  }

  return findUserIdBySubscriptionId(
    subscription.id
  );
}

async function updateBeaconPlusSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string
): Promise<string | undefined> {
  const userId =
    await resolveSubscriptionUserId(
      subscription,
      fallbackUserId
    );

  if (!userId) {
    throw new Error(
      `No Beacon account could be matched to Stripe subscription ${subscription.id}.`
    );
  }

  const customerId =
    readExpandableId(
      subscription.customer
    );

  const currentPeriodEnd =
    readSubscriptionPeriodEnd(
      subscription
    );

  const beaconPlusActive =
    isActiveSubscriptionStatus(
      subscription.status
    );

  await database
    .update(user)
    .set({
      stripeCustomerId:
        customerId,

      stripeSubscriptionId:
        subscription.id,

      stripeSubscriptionStatus:
        subscription.status,

      beaconPlusActive,

      beaconPlusCurrentPeriodEnd:
        currentPeriodEnd,

      updatedAt:
        new Date(),
    })
    .where(
      eq(
        user.id,
        userId
      )
    );

  return userId;
}

async function deactivateDeletedSubscription(
  subscription: Stripe.Subscription
): Promise<string | undefined> {
  const userId =
    await resolveSubscriptionUserId(
      subscription
    );

  if (!userId) {
    throw new Error(
      `No Beacon account could be matched to deleted Stripe subscription ${subscription.id}.`
    );
  }

  await database
    .update(user)
    .set({
      stripeSubscriptionId:
        subscription.id,

      stripeSubscriptionStatus:
        subscription.status,

      beaconPlusActive:
        false,

      beaconPlusCurrentPeriodEnd:
        readSubscriptionPeriodEnd(
          subscription
        ),

      updatedAt:
        new Date(),
    })
    .where(
      eq(
        user.id,
        userId
      )
    );

  return userId;
}

async function processCompletedCheckout(
  session: Stripe.Checkout.Session
): Promise<string | undefined> {
  const userId =
    readBeaconUserId(
      session.metadata,
      session.client_reference_id
    );

  if (!userId) {
    throw new Error(
      `Stripe Checkout Session ${session.id} does not contain a Beacon user ID.`
    );
  }

  const purchaseType =
    readMetadataValue(
      session.metadata,
      "purchaseType"
    );

  if (
    !purchaseType ||
    !isBeaconPurchaseType(
      purchaseType
    )
  ) {
    throw new Error(
      `Stripe Checkout Session ${session.id} has an invalid purchase type.`
    );
  }

  const customerId =
    readExpandableId(
      session.customer
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
          userId
        )
      );
  }

  if (
    session.mode ===
    "payment"
  ) {
    if (
      session.payment_status !==
      "paid"
    ) {
      throw new Error(
        `Stripe Checkout Session ${session.id} has not been paid.`
      );
    }

    const credits =
      readCredits(
        session.metadata
      );

    if (!credits) {
      throw new Error(
        `Stripe Checkout Session ${session.id} does not contain a valid credit amount.`
      );
    }

    await addPurchasedCredits({
      userId,

      credits,

      checkoutSessionId:
        session.id,

      paymentIntentId:
        readExpandableId(
          session.payment_intent
        ),

      purchaseLabel:
        readMetadataValue(
          session.metadata,
          "purchaseLabel"
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
        session.subscription
      );

    if (!subscriptionId) {
      throw new Error(
        `Stripe Checkout Session ${session.id} does not contain a subscription ID.`
      );
    }

    const stripe =
      getStripeClient();

    const subscription =
      await stripe.subscriptions.retrieve(
        subscriptionId
      );

    return updateBeaconPlusSubscription(
      subscription,
      userId
    );
  }

  return userId;
}

async function processStripeEvent(
  event: Stripe.Event
): Promise<string | undefined> {
  switch (event.type) {
    case "checkout.session.completed":
      return processCompletedCheckout(
        event.data
          .object as Stripe.Checkout.Session
      );

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      return updateBeaconPlusSubscription(
        event.data
          .object as Stripe.Subscription
      );

    case "customer.subscription.deleted":
      return deactivateDeletedSubscription(
        event.data
          .object as Stripe.Subscription
      );

    default:
      return undefined;
  }
}

function createErrorResponse(
  code: string,
  message: string,
  status: number
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
    }
  );
}

export async function POST(
  request: Request
) {
  const stripe =
    getStripeClient();

  const signature =
    request.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return createErrorResponse(
      "missing_signature",
      "The Stripe signature header is missing.",
      400
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
        readWebhookSecret()
      );
  } catch (error) {
    console.error(
      "Beacon rejected an invalid Stripe webhook:",
      error
    );

    return createErrorResponse(
      "invalid_signature",
      "The Stripe webhook signature could not be verified.",
      400
    );
  }

  const claim =
    await claimWebhookEvent(
      event
    );

  if (!claim.process) {
    return NextResponse.json(
      {
        success: true,

        data: {
          received: true,
          duplicate: true,
          status:
            claim.reason,
        },
      },
      {
        status: 200,
      }
    );
  }

  try {
    const userId =
      await processStripeEvent(
        event
      );

    await markWebhookCompleted(
      event,
      userId
    );

    return NextResponse.json(
      {
        success: true,

        data: {
          received: true,
          processed: true,
          eventType:
            event.type,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      `Beacon failed to process Stripe event ${event.id}:`,
      error
    );

    await markWebhookFailed(
      event,
      error
    );

    return createErrorResponse(
      "webhook_processing_failed",
      error instanceof Error
        ? error.message
        : "Beacon could not process the Stripe event.",
      500
    );
  }
}