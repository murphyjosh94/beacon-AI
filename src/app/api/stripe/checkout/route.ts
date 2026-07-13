import { NextResponse } from "next/server";

import {
  getBeaconPriceConfiguration,
  getSiteUrl,
  getStripeClient,
  isBeaconPurchaseType,
} from "@/lib/stripe/StripeClient";

type CheckoutRequestBody = {
  purchaseType?: unknown;
  userId?: unknown;
  email?: unknown;
};

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();

  return cleaned || undefined;
}

export async function POST(request: Request) {
  try {
    let body: CheckoutRequestBody;

    try {
      body = (await request.json()) as CheckoutRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_request",
            message: "Beacon could not read this checkout request.",
          },
        },
        {
          status: 400,
        }
      );
    }

    if (!isBeaconPurchaseType(body.purchaseType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_purchase_type",
            message: "Please choose a valid Beacon purchase option.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const stripe = getStripeClient();
    const siteUrl = getSiteUrl();
    const price = getBeaconPriceConfiguration(body.purchaseType);

    const userId = readOptionalString(body.userId);
    const email = readOptionalString(body.email);

    const metadata: Record<string, string> = {
      purchaseType: body.purchaseType,
      purchaseLabel: price.label,
      credits:
        price.credits === null
          ? "unlimited"
          : String(price.credits),
    };

    if (userId) {
      metadata.userId = userId;
    }

    const session = await stripe.checkout.sessions.create({
      mode: price.mode,

      line_items: [
        {
          price: price.priceId,
          quantity: 1,
        },
      ],

      success_url:
        `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${siteUrl}/pricing?cancelled=true`,

      customer_email: email,

      metadata,

      allow_promotion_codes: true,

      billing_address_collection: "auto",

      ...(price.mode === "payment"
        ? {
            payment_intent_data: {
              metadata,
            },
          }
        : {
            subscription_data: {
              metadata,
            },
          }),
    });

    if (!session.url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "checkout_unavailable",
            message:
              "Stripe did not return a checkout page. Please try again.",
          },
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Beacon Stripe checkout failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "checkout_failed",
          message:
            error instanceof Error
              ? error.message
              : "Beacon could not start Stripe Checkout.",
        },
      },
      {
        status: 500,
      }
    );
  }
}