import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";
import { user } from "@/lib/database/schema";
import { getStripeClient } from "@/lib/stripe/StripeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudioCheckoutProductId =
  | "studio_pro"
  | "studio_business"
  | "studio_enterprise"
  | "credits_100"
  | "credits_300"
  | "credits_750"
  | "credits_1500"
  | "credits_3000";

type StudioCheckoutRequest = {
  productId?: unknown;
};

type StudioProductKind = "subscription" | "credits";

type StudioProduct = {
  id: StudioCheckoutProductId;
  name: string;
  kind: StudioProductKind;
  priceEnvironmentVariable:
    | "STRIPE_STUDIO_PRO_PRICE_ID"
    | "STRIPE_STUDIO_BUSINESS_PRICE_ID"
    | "STRIPE_STUDIO_ENTERPRISE_PRICE_ID"
    | "STRIPE_STUDIO_100_CREDITS_PRICE_ID"
    | "STRIPE_STUDIO_300_CREDITS_PRICE_ID"
    | "STRIPE_STUDIO_750_CREDITS_PRICE_ID"
    | "STRIPE_STUDIO_1500_CREDITS_PRICE_ID"
    | "STRIPE_STUDIO_3000_CREDITS_PRICE_ID";
  credits: number;
  membershipPlan?: "pro" | "business" | "enterprise";
};

type AuthenticatedStudioAccount = {
  id: string;
  name: string;
  email: string;
  stripeCustomerId: string | null;
};

const STUDIO_PRODUCTS: Record<StudioCheckoutProductId, StudioProduct> = {
  studio_pro: {
    id: "studio_pro",
    name: "Beacon Studio Pro",
    kind: "subscription",
    priceEnvironmentVariable: "STRIPE_STUDIO_PRO_PRICE_ID",
    credits: 300,
    membershipPlan: "pro",
  },
  studio_business: {
    id: "studio_business",
    name: "Beacon Studio Business",
    kind: "subscription",
    priceEnvironmentVariable: "STRIPE_STUDIO_BUSINESS_PRICE_ID",
    credits: 800,
    membershipPlan: "business",
  },
  studio_enterprise: {
    id: "studio_enterprise",
    name: "Beacon Studio Enterprise",
    kind: "subscription",
    priceEnvironmentVariable: "STRIPE_STUDIO_ENTERPRISE_PRICE_ID",
    credits: 2500,
    membershipPlan: "enterprise",
  },
  credits_100: {
    id: "credits_100",
    name: "100 Beacon Studio Credits",
    kind: "credits",
    priceEnvironmentVariable: "STRIPE_STUDIO_100_CREDITS_PRICE_ID",
    credits: 100,
  },
  credits_300: {
    id: "credits_300",
    name: "300 Beacon Studio Credits",
    kind: "credits",
    priceEnvironmentVariable: "STRIPE_STUDIO_300_CREDITS_PRICE_ID",
    credits: 300,
  },
  credits_750: {
    id: "credits_750",
    name: "750 Beacon Studio Credits",
    kind: "credits",
    priceEnvironmentVariable: "STRIPE_STUDIO_750_CREDITS_PRICE_ID",
    credits: 750,
  },
  credits_1500: {
    id: "credits_1500",
    name: "1,500 Beacon Studio Credits",
    kind: "credits",
    priceEnvironmentVariable: "STRIPE_STUDIO_1500_CREDITS_PRICE_ID",
    credits: 1500,
  },
  credits_3000: {
    id: "credits_3000",
    name: "3,000 Beacon Studio Credits",
    kind: "credits",
    priceEnvironmentVariable: "STRIPE_STUDIO_3000_CREDITS_PRICE_ID",
    credits: 3000,
  },
};

function createErrorResponse(
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
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

function isStudioCheckoutProductId(
  value: unknown,
): value is StudioCheckoutProductId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(STUDIO_PRODUCTS, value)
  );
}

function readPriceId(product: StudioProduct): string {
  const priceId = process.env[product.priceEnvironmentVariable]?.trim();

  if (!priceId) {
    throw new Error(
      `${product.priceEnvironmentVariable} is not configured.`,
    );
  }

  if (!priceId.startsWith("price_")) {
    throw new Error(
      `${product.priceEnvironmentVariable} must contain a valid Stripe Price ID.`,
    );
  }

  return priceId;
}

function readApplicationUrl(request: Request): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim();

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      throw new Error(
        "NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL or BETTER_AUTH_URL is invalid.",
      );
    }
  }

  return new URL(request.url).origin;
}

async function readRequestBody(
  request: Request,
): Promise<StudioCheckoutRequest | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return (await request.json()) as StudioCheckoutRequest;
  } catch {
    return null;
  }
}

async function getAuthenticatedAccount(): Promise<AuthenticatedStudioAccount | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const accounts = await database
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const account = accounts[0];

  if (!account?.id || !account.email) {
    return null;
  }

  return {
    id: account.id,
    name: account.name?.trim() || "Beacon Studio customer",
    email: account.email,
    stripeCustomerId: account.stripeCustomerId ?? null,
  };
}

async function getOrCreateStripeCustomer(
  account: AuthenticatedStudioAccount,
): Promise<string> {
  const stripe = getStripeClient();

  if (account.stripeCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(
        account.stripeCustomerId,
      );

      if (!existingCustomer.deleted) {
        return existingCustomer.id;
      }
    } catch (error) {
      console.warn(
        "Beacon Studio could not retrieve the stored Stripe customer:",
        error,
      );
    }
  }

  const customer = await stripe.customers.create({
    email: account.email,
    name: account.name,
    metadata: {
      beaconUserId: account.id,
      source: "beacon_studio",
    },
  });

  await database
    .update(user)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(user.id, account.id));

  return customer.id;
}

function createSharedMetadata(
  account: AuthenticatedStudioAccount,
  product: StudioProduct,
): Stripe.MetadataParam {
  return {
    beaconUserId: account.id,
    source: "beacon_studio",
    studioProductId: product.id,
    studioProductName: product.name,
    studioPurchaseKind: product.kind,
    studioCredits: String(product.credits),
    studioMembershipPlan: product.membershipPlan ?? "none",
  };
}

function createCheckoutParameters(input: {
  account: AuthenticatedStudioAccount;
  customerId: string;
  product: StudioProduct;
  priceId: string;
  applicationUrl: string;
}): Stripe.Checkout.SessionCreateParams {
  const metadata = createSharedMetadata(input.account, input.product);
  const isSubscription = input.product.kind === "subscription";

  const parameters: Stripe.Checkout.SessionCreateParams = {
    mode: isSubscription ? "subscription" : "payment",
    customer: input.customerId,
    client_reference_id: input.account.id,
    line_items: [
      {
        price: input.priceId,
        quantity: 1,
      },
    ],
    billing_address_collection: "auto",
    allow_promotion_codes: false,
    metadata,
    success_url: `${input.applicationUrl}/studio/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.applicationUrl}/studio/pricing?checkout=cancelled`,
  };

  if (isSubscription) {
    parameters.subscription_data = {
      metadata,
    };
  } else {
    parameters.payment_intent_data = {
      metadata,
    };
  }

  return parameters;
}

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);

    if (!body) {
      return createErrorResponse(
        "invalid_request",
        "Beacon Studio could not read this checkout request.",
        400,
      );
    }

    if (!isStudioCheckoutProductId(body.productId)) {
      return createErrorResponse(
        "invalid_product",
        "Please choose a valid Beacon Studio membership or credit pack.",
        400,
      );
    }

    const account = await getAuthenticatedAccount();

    if (!account) {
      return createErrorResponse(
        "authentication_required",
        "You must be signed in before purchasing Beacon Studio products.",
        401,
      );
    }

    const product = STUDIO_PRODUCTS[body.productId];
    const priceId = readPriceId(product);
    const customerId = await getOrCreateStripeCustomer(account);
    const applicationUrl = readApplicationUrl(request);
    const stripe = getStripeClient();

    const checkoutSession = await stripe.checkout.sessions.create(
      createCheckoutParameters({
        account,
        customerId,
        product,
        priceId,
        applicationUrl,
      }),
    );

    if (!checkoutSession.url) {
      return createErrorResponse(
        "checkout_url_missing",
        "Stripe did not return a secure checkout URL.",
        502,
      );
    }

    return NextResponse.json(
      {
        success: true,
        url: checkoutSession.url,
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
        productId: product.id,
        mode: product.kind === "subscription" ? "subscription" : "payment",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Beacon Studio checkout error:", error);

    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Beacon Studio could not start secure checkout. Please try again.";

    return createErrorResponse(
      "checkout_unavailable",
      message,
      500,
    );
  }
}