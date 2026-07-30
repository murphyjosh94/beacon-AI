import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/lib/auth/Auth";
import { stripe } from "@/lib/stripe";

import {
  STRIPE_PURCHASE_TYPES,
  createCreditTopUpMetadata,
  createSubscriptionMetadata,
  getBeaconPlusPriceId,
  getCreditPackPriceId,
  isBeaconPlusBillingInterval,
  isCreditPackId,
  type BeaconPlusBillingInterval,
  type CreditPackId,
} from "@/lib/stripe/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutRequestBody = {
  purchaseType?: unknown;
  billingInterval?: unknown;
  creditPackId?: unknown;
};

type CheckoutErrorResponse = {
  error: string;
};

type CheckoutSuccessResponse = {
  checkoutUrl: string;
};

type BeaconCreditAmount =
  | 5
  | 15
  | 25;

function getApplicationUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim();

  if (!configuredUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL or BETTER_AUTH_URL must be configured.",
    );
  }

  try {
    return new URL(
      configuredUrl,
    ).origin;
  } catch {
    throw new Error(
      "The configured application URL is invalid.",
    );
  }
}

function jsonError(
  message: string,
  status: number,
): NextResponse<CheckoutErrorResponse> {
  return NextResponse.json(
    {
      error: message,
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

async function readRequestBody(
  request: NextRequest,
): Promise<CheckoutRequestBody | null> {
  try {
    const body =
      (await request.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return null;
    }

    return body as CheckoutRequestBody;
  } catch {
    return null;
  }
}

function getSubscriptionInterval(
  body: CheckoutRequestBody,
): BeaconPlusBillingInterval | null {
  return isBeaconPlusBillingInterval(
    body.billingInterval,
  )
    ? body.billingInterval
    : null;
}

function getCreditPackId(
  body: CheckoutRequestBody,
): CreditPackId | null {
  return isCreditPackId(
    body.creditPackId,
  )
    ? body.creditPackId
    : null;
}

function getCreditAmount(
  creditPackId: CreditPackId,
): BeaconCreditAmount {
  const match =
    String(
      creditPackId,
    ).match(
      /(?:^|_)(5|15|25)(?:$|_)/,
    );

  const amount =
    match
      ? Number(
          match[1],
        )
      : NaN;

  if (
    amount !== 5 &&
    amount !== 15 &&
    amount !== 25
  ) {
    throw new Error(
      `Unsupported Beacon credit pack: ${String(creditPackId)}.`,
    );
  }

  return amount;
}

function createBeaconPlusMetadata(
  billingInterval: BeaconPlusBillingInterval,
  userId: string,
): Record<string, string> {
  return {
    ...createSubscriptionMetadata(
      billingInterval,
      userId,
    ),
    source:
      "beacon_ai",
    purchaseType:
      "subscription",
    productFamily:
      "beacon_plus",
    billingInterval:
      billingInterval,
    beaconUserId:
      userId,
    userId,
  };
}

function createBeaconCreditMetadata(
  creditPackId: CreditPackId,
  userId: string,
): Record<string, string> {
  const credits =
    getCreditAmount(
      creditPackId,
    );

  return {
    ...createCreditTopUpMetadata(
      creditPackId,
      userId,
    ),
    source:
      "beacon_ai",
    purchaseType:
      "credit_top_up",
    productFamily:
      "beacon_ai_credits",
    creditPackId:
      String(
        creditPackId,
      ),
    credits:
      String(
        credits,
      ),
    purchaseLabel:
      `${credits} Beacon Credits`,
    beaconUserId:
      userId,
    userId,
  };
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<
    | CheckoutSuccessResponse
    | CheckoutErrorResponse
  >
> {
  try {
    const session =
      await auth.api.getSession({
        headers:
          request.headers,
      });

    if (
      !session?.user?.id ||
      !session.user.email
    ) {
      return jsonError(
        "You must be signed in before starting checkout.",
        401,
      );
    }

    const body =
      await readRequestBody(
        request,
      );

    if (!body) {
      return jsonError(
        "The checkout request is invalid.",
        400,
      );
    }

    const applicationUrl =
      getApplicationUrl();

    const successUrl =
      `${applicationUrl}/account/billing/success` +
      "?session_id={CHECKOUT_SESSION_ID}";

    const cancelUrl =
      `${applicationUrl}/pricing?checkout=cancelled`;

    if (
      body.purchaseType ===
      STRIPE_PURCHASE_TYPES.SUBSCRIPTION
    ) {
      const billingInterval =
        getSubscriptionInterval(
          body,
        );

      if (!billingInterval) {
        return jsonError(
          "Select either monthly or annual billing.",
          400,
        );
      }

      const metadata =
        createBeaconPlusMetadata(
          billingInterval,
          session.user.id,
        );

      const checkoutSession =
        await stripe.checkout.sessions.create({
          mode:
            "subscription",

          customer_email:
            session.user.email,

          client_reference_id:
            session.user.id,

          line_items: [
            {
              price:
                getBeaconPlusPriceId(
                  billingInterval,
                ),
              quantity:
                1,
            },
          ],

          metadata,

          subscription_data: {
            metadata,
          },

          allow_promotion_codes:
            true,

          billing_address_collection:
            "auto",

          success_url:
            successUrl,

          cancel_url:
            cancelUrl,
        });

      if (!checkoutSession.url) {
        return jsonError(
          "Stripe did not return a checkout URL.",
          502,
        );
      }

      return NextResponse.json(
        {
          checkoutUrl:
            checkoutSession.url,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        },
      );
    }

    if (
      body.purchaseType ===
      STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP
    ) {
      const creditPackId =
        getCreditPackId(
          body,
        );

      if (!creditPackId) {
        return jsonError(
          "Select a valid credit pack.",
          400,
        );
      }

      const metadata =
        createBeaconCreditMetadata(
          creditPackId,
          session.user.id,
        );

      const checkoutSession =
        await stripe.checkout.sessions.create({
          mode:
            "payment",

          customer_email:
            session.user.email,

          customer_creation:
            "always",

          client_reference_id:
            session.user.id,

          line_items: [
            {
              price:
                getCreditPackPriceId(
                  creditPackId,
                ),
              quantity:
                1,
            },
          ],

          metadata,

          payment_intent_data: {
            metadata,
          },

          allow_promotion_codes:
            true,

          billing_address_collection:
            "auto",

          success_url:
            successUrl,

          cancel_url:
            cancelUrl,
        });

      if (!checkoutSession.url) {
        return jsonError(
          "Stripe did not return a checkout URL.",
          502,
        );
      }

      return NextResponse.json(
        {
          checkoutUrl:
            checkoutSession.url,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        },
      );
    }

    return jsonError(
      "Select a valid checkout purchase type.",
      400,
    );
  } catch (error) {
    console.error(
      "Stripe checkout session creation failed:",
      error,
    );

    return jsonError(
      "Beacon could not start checkout. Please try again.",
      500,
    );
  }
}