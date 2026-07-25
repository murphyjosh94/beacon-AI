import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MembershipPlanId = "business" | "business_pro";

type CheckoutRequestBody = {
  planId?: unknown;
};

type MembershipPlan = {
  id: MembershipPlanId;
  name: string;
  priceEnvironmentVariable:
    | "STRIPE_PRICE_BEACON_BUSINESS"
    | "STRIPE_PRICE_BEACON_BUSINESS_PRO";
};

const MEMBERSHIP_PLANS: Record<MembershipPlanId, MembershipPlan> = {
  business: {
    id: "business",
    name: "Beacon Business",
    priceEnvironmentVariable: "STRIPE_PRICE_BEACON_BUSINESS",
  },
  business_pro: {
    id: "business_pro",
    name: "Beacon Business Pro",
    priceEnvironmentVariable: "STRIPE_PRICE_BEACON_BUSINESS_PRO",
  },
};

function isMembershipPlanId(value: unknown): value is MembershipPlanId {
  return value === "business" || value === "business_pro";
}

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey);
}

function getSiteUrl(request: Request): string {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (configuredSiteUrl) {
    const normalisedUrl = configuredSiteUrl.startsWith("http")
      ? configuredSiteUrl
      : `https://${configuredSiteUrl}`;

    return normalisedUrl.replace(/\/+$/, "");
  }

  const requestUrl = new URL(request.url);
  return requestUrl.origin.replace(/\/+$/, "");
}

function getPriceId(plan: MembershipPlan): string {
  const priceId = process.env[plan.priceEnvironmentVariable];

  if (!priceId) {
    throw new Error(
      `Missing ${plan.priceEnvironmentVariable} for ${plan.name}.`,
    );
  }

  return priceId;
}

function getCustomerEmail(request: Request): string | undefined {
  const emailHeader =
    request.headers.get("x-user-email") ??
    request.headers.get("x-customer-email");

  if (!emailHeader) {
    return undefined;
  }

  const trimmedEmail = emailHeader.trim();

  return trimmedEmail.length > 0 ? trimmedEmail : undefined;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | CheckoutRequestBody
      | null;

    if (!body || !isMembershipPlanId(body.planId)) {
      return NextResponse.json(
        {
          error:
            "Please select either Beacon Business or Beacon Business Pro.",
        },
        { status: 400 },
      );
    }

    const plan = MEMBERSHIP_PLANS[body.planId];
    const priceId = getPriceId(plan);
    const stripe = getStripeClient();
    const siteUrl = getSiteUrl(request);
    const customerEmail = getCustomerEmail(request);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_email: customerEmail,
      success_url: `${siteUrl}/business/memberships/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/business/memberships?checkout=cancelled`,
      metadata: {
        membershipPlanId: plan.id,
        membershipPlanName: plan.name,
        source: "beacon_business_memberships",
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          membershipPlanId: plan.id,
          membershipPlanName: plan.name,
          source: "beacon_business_memberships",
        },
      },
      consent_collection: {
        terms_of_service: "required",
      },
      custom_text: {
        submit: {
          message:
            "Your 14-day free trial starts today. Monthly billing begins automatically after the trial unless you cancel.",
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        {
          error: "Stripe did not return a secure checkout URL.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Membership checkout error:", error);

    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "We could not start your membership checkout. Please try again.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}