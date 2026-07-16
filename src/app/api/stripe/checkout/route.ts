import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";
import { user } from "@/lib/database/schema";

import {
  getBeaconPriceConfiguration,
  getSiteUrl,
  getStripeClient,
  isBeaconPurchaseType,
} from "@/lib/stripe/StripeClient";

type CheckoutRequestBody = {
  purchaseType?: unknown;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function getAuthenticatedAccount() {
  const session =
    await auth.api.getSession({
      headers: await headers(),
    });

  if (!session?.user) {
    return null;
  }

  const [account] =
    await database
      .select()
      .from(user)
      .where(
        eq(
          user.id,
          session.user.id
        )
      )
      .limit(1);

  if (!account) {
    return null;
  }

  return {
    session,
    account,
  };
}

async function getOrCreateStripeCustomer(input: {
  userId: string;
  email: string;
  name: string;
  existingCustomerId: string | null;
}): Promise<string> {
  const stripe =
    getStripeClient();

  if (input.existingCustomerId) {
    try {
      const existingCustomer =
        await stripe.customers.retrieve(
          input.existingCustomerId
        );

      if (
        !existingCustomer.deleted
      ) {
        return existingCustomer.id;
      }
    } catch (error) {
      console.warn(
        "Beacon could not retrieve the stored Stripe customer:",
        error
      );
    }
  }

  const customer =
    await stripe.customers.create({
      email:
        input.email,

      name:
        input.name,

      metadata: {
        beaconUserId:
          input.userId,
      },
    });

  await database
    .update(user)
    .set({
      stripeCustomerId:
        customer.id,

      updatedAt:
        new Date(),
    })
    .where(
      eq(
        user.id,
        input.userId
      )
    );

  return customer.id;
}

export async function POST(
  request: Request
) {
  try {
    let body:
      CheckoutRequestBody;

    try {
      body =
        (await request.json()) as CheckoutRequestBody;
    } catch {
      return createErrorResponse(
        "invalid_request",
        "Beacon could not read this checkout request.",
        400
      );
    }

    if (
      !isBeaconPurchaseType(
        body.purchaseType
      )
    ) {
      return createErrorResponse(
        "invalid_purchase_type",
        "Please choose a valid Beacon purchase option.",
        400
      );
    }

    const authenticatedAccount =
      await getAuthenticatedAccount();

    if (!authenticatedAccount) {
      return createErrorResponse(
        "authentication_required",
        "Please sign in before purchasing Beacon credits or Beacon+.",
        401
      );
    }

    const {
      account,
    } =
      authenticatedAccount;

    const stripe =
      getStripeClient();

    const siteUrl =
      getSiteUrl();

    const price =
      getBeaconPriceConfiguration(
        body.purchaseType
      );

    const stripeCustomerId =
      await getOrCreateStripeCustomer({
        userId:
          account.id,

        email:
          account.email,

        name:
          account.name,

        existingCustomerId:
          account.stripeCustomerId,
      });

    const metadata:
      Record<string, string> = {
        beaconUserId:
          account.id,

        purchaseType:
          body.purchaseType,

        purchaseLabel:
          price.label,

        credits:
          price.credits === null
            ? "unlimited"
            : String(
                price.credits
              ),
      };

    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode:
          price.mode,

        customer:
          stripeCustomerId,

        client_reference_id:
          account.id,

        line_items: [
          {
            price:
              price.priceId,

            quantity: 1,
          },
        ],

        success_url:
          `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${siteUrl}/pricing?cancelled=true`,

        metadata,

        allow_promotion_codes:
          true,

        billing_address_collection:
          "auto",

        ...(price.mode ===
        "payment"
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

    if (!checkoutSession.url) {
      return createErrorResponse(
        "checkout_unavailable",
        "Stripe did not return a checkout page. Please try again.",
        502
      );
    }

    return NextResponse.json(
      {
        success: true,

        data: {
          checkoutUrl:
            checkoutSession.url,

          sessionId:
            checkoutSession.id,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Beacon Stripe checkout failed:",
      error
    );

    return createErrorResponse(
      "checkout_failed",
      error instanceof Error
        ? error.message
        : "Beacon could not start Stripe Checkout.",
      500
    );
  }
}