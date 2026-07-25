import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PortalRequestBody = {
  customerId?: unknown;
  returnPath?: unknown;
};

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

  return new URL(request.url).origin.replace(/\/+$/, "");
}

function isValidCustomerId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().startsWith("cus_") &&
    value.trim().length > 4
  );
}

function normaliseReturnPath(value: unknown): string {
  if (typeof value !== "string") {
    return "/business/dashboard";
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/business/dashboard";
  }

  return trimmed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | PortalRequestBody
      | null;

    if (!body || !isValidCustomerId(body.customerId)) {
      return NextResponse.json(
        {
          error: "A valid Stripe customer ID is required.",
        },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const siteUrl = getSiteUrl(request);
    const returnPath = normaliseReturnPath(body.returnPath);
    const customerId = body.customerId.trim();

    let customer: Stripe.Customer | Stripe.DeletedCustomer;

    try {
      customer = await stripe.customers.retrieve(customerId);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeInvalidRequestError &&
        error.code === "resource_missing"
      ) {
        return NextResponse.json(
          {
            error: "The Stripe customer account could not be found.",
          },
          { status: 404 },
        );
      }

      throw error;
    }

    if (customer.deleted) {
      return NextResponse.json(
        {
          error: "This Stripe customer account is no longer available.",
        },
        { status: 410 },
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}${returnPath}`,
    });

    return NextResponse.json(
      {
        url: portalSession.url,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Stripe customer portal error:", error);

    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "We could not open the billing portal. Please try again.";

    return NextResponse.json(
      {
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