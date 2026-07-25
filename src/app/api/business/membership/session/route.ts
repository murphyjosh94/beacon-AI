import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MembershipPlanId = "business" | "business_pro";

type MembershipPlan = {
  id: MembershipPlanId;
  name: string;
};

const MEMBERSHIP_PLANS: Record<MembershipPlanId, MembershipPlan> = {
  business: {
    id: "business",
    name: "Beacon Business",
  },
  business_pro: {
    id: "business_pro",
    name: "Beacon Business Pro",
  },
};

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey);
}

function isMembershipPlanId(value: unknown): value is MembershipPlanId {
  return value === "business" || value === "business_pro";
}

function normalisePlanId(
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription | null,
): MembershipPlanId | null {
  const planId =
    subscription?.metadata.membershipPlanId ??
    session.metadata?.membershipPlanId;

  return isMembershipPlanId(planId) ? planId : null;
}

function getCustomerEmail(
  session: Stripe.Checkout.Session,
): string | null {
  if (session.customer_details?.email) {
    return session.customer_details.email;
  }

  if (session.customer_email) {
    return session.customer_email;
  }

  if (
    session.customer &&
    typeof session.customer !== "string" &&
    !session.customer.deleted &&
    session.customer.email
  ) {
    return session.customer.email;
  }

  return null;
}

function unixTimestampToIso(
  timestamp: number | null | undefined,
): string | null {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const sessionId = requestUrl.searchParams.get("session_id")?.trim();

    if (!sessionId) {
      return NextResponse.json(
        {
          verified: false,
          error: "Missing Stripe checkout session ID.",
        },
        { status: 400 },
      );
    }

    if (!sessionId.startsWith("cs_")) {
      return NextResponse.json(
        {
          verified: false,
          error: "Invalid Stripe checkout session ID.",
        },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();

    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
      });
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeInvalidRequestError &&
        error.code === "resource_missing"
      ) {
        return NextResponse.json(
          {
            verified: false,
            error: "The Stripe checkout session could not be found.",
          },
          { status: 404 },
        );
      }

      throw error;
    }

    if (session.mode !== "subscription") {
      return NextResponse.json(
        {
          verified: false,
          error: "This checkout session is not a membership subscription.",
        },
        { status: 400 },
      );
    }

    if (session.status !== "complete") {
      return NextResponse.json(
        {
          verified: false,
          status: session.status,
          error: "The Stripe checkout session has not been completed.",
        },
        { status: 409 },
      );
    }

    const subscription =
      session.subscription &&
      typeof session.subscription !== "string"
        ? session.subscription
        : null;

    if (!subscription) {
      return NextResponse.json(
        {
          verified: false,
          error: "The membership subscription could not be confirmed.",
        },
        { status: 409 },
      );
    }

    const planId = normalisePlanId(session, subscription);

    if (!planId) {
      return NextResponse.json(
        {
          verified: false,
          error: "The selected Beacon Business membership could not be identified.",
        },
        { status: 422 },
      );
    }

    const plan = MEMBERSHIP_PLANS[planId];
    const acceptableStatuses: Stripe.Subscription.Status[] = [
      "trialing",
      "active",
      "past_due",
    ];

    if (!acceptableStatuses.includes(subscription.status)) {
      return NextResponse.json(
        {
          verified: false,
          planId,
          planName: plan.name,
          status: subscription.status,
          error: "The membership subscription is not currently active.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        verified: true,
        planId,
        planName: plan.name,
        customerEmail: getCustomerEmail(session),
        trialEndsAt: unixTimestampToIso(subscription.trial_end),
        status: subscription.status,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Membership session verification error:", error);

    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "We could not verify your membership checkout. Please try again.";

    return NextResponse.json(
      {
        verified: false,
        error: message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}