import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/lib/auth/Auth";
import { getStripeClient } from "@/lib/stripe/StripeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MembershipPlanId =
  | "business"
  | "business_pro";

type CheckoutRequestBody = {
  planId?: unknown;
};

type MembershipPlan = {
  id: MembershipPlanId;
  name: string;
  studioCredits: 50 | 150;
  priceEnvironmentVariable:
    | "STRIPE_PRICE_BEACON_BUSINESS"
    | "STRIPE_PRICE_BEACON_BUSINESS_PRO";
};

type CheckoutSuccessResponse = {
  url: string;
};

type CheckoutErrorResponse = {
  error: string;
};

const MEMBERSHIP_PLANS: Record<
  MembershipPlanId,
  MembershipPlan
> = {
  business: {
    id: "business",
    name: "Beacon Business",
    studioCredits: 50,
    priceEnvironmentVariable:
      "STRIPE_PRICE_BEACON_BUSINESS",
  },

  business_pro: {
    id: "business_pro",
    name: "Beacon Business Pro",
    studioCredits: 150,
    priceEnvironmentVariable:
      "STRIPE_PRICE_BEACON_BUSINESS_PRO",
  },
};

function isMembershipPlanId(
  value: unknown,
): value is MembershipPlanId {
  return (
    value === "business" ||
    value === "business_pro"
  );
}

function getSiteUrl(
  request: NextRequest,
): string {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (configuredSiteUrl) {
    const normalisedUrl =
      configuredSiteUrl.startsWith("http://") ||
      configuredSiteUrl.startsWith("https://")
        ? configuredSiteUrl
        : `https://${configuredSiteUrl}`;

    try {
      return new URL(
        normalisedUrl,
      ).origin;
    } catch {
      throw new Error(
        "The configured Beacon site URL is invalid.",
      );
    }
  }

  return new URL(
    request.url,
  ).origin;
}

function getPriceId(
  plan: MembershipPlan,
): string {
  const priceId =
    process.env[
      plan.priceEnvironmentVariable
    ]?.trim();

  if (!priceId) {
    throw new Error(
      `Missing ${plan.priceEnvironmentVariable} for ${plan.name}.`,
    );
  }

  return priceId;
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

function createMembershipMetadata(
  plan: MembershipPlan,
  userId: string,
): Record<string, string> {
  return {
    source:
      "beacon_business_memberships",

    purchaseType:
      "subscription",

    productFamily:
      "business",

    membershipPlan:
      plan.id,

    businessMembershipPlan:
      plan.id,

    membershipPlanId:
      plan.id,

    membershipPlanName:
      plan.name,

    studioCredits:
      String(
        plan.studioCredits,
      ),

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
        "You must be signed in before starting a Beacon Business membership.",
        401,
      );
    }

    const body =
      await readRequestBody(
        request,
      );

    if (
      !body ||
      !isMembershipPlanId(
        body.planId,
      )
    ) {
      return jsonError(
        "Please select either Beacon Business or Beacon Business Pro.",
        400,
      );
    }

    const plan =
      MEMBERSHIP_PLANS[
        body.planId
      ];

    const siteUrl =
      getSiteUrl(
        request,
      );

    const metadata =
      createMembershipMetadata(
        plan,
        session.user.id,
      );

    const checkoutSession =
      await getStripeClient()
        .checkout.sessions.create({
          mode:
            "subscription",

          customer_email:
            session.user.email,

          client_reference_id:
            session.user.id,

          line_items: [
            {
              price:
                getPriceId(
                  plan,
                ),
              quantity:
                1,
            },
          ],

          allow_promotion_codes:
            true,

          billing_address_collection:
            "auto",

          success_url:
            `${siteUrl}/business/memberships/success` +
            "?session_id={CHECKOUT_SESSION_ID}",

          cancel_url:
            `${siteUrl}/business/memberships` +
            "?checkout=cancelled",

          metadata,

          subscription_data: {
            trial_period_days:
              14,

            metadata,
          },

          consent_collection: {
            terms_of_service:
              "required",
          },

          custom_text: {
            submit: {
              message:
                "Your 14-day free trial starts today. Monthly billing begins automatically after the trial unless you cancel.",
            },
          },
        });

    if (!checkoutSession.url) {
      return jsonError(
        "Stripe did not return a secure checkout URL.",
        502,
      );
    }

    return NextResponse.json(
      {
        url:
          checkoutSession.url,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Beacon Business membership checkout failed:",
      error,
    );

    const message =
      process.env.NODE_ENV ===
        "development" &&
      error instanceof Error
        ? error.message
        : "We could not start your membership checkout. Please try again.";

    return jsonError(
      message,
      500,
    );
  }
}