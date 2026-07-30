import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import type Stripe from "stripe";

import { auth } from "@/lib/auth/Auth";
import { getStripeClient } from "@/lib/stripe/StripeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MembershipPlanId =
  | "business"
  | "business_pro";

type MembershipPlan = {
  id: MembershipPlanId;
  name: string;
  studioCredits: 50 | 150;
};

type MembershipSessionResponse =
  | {
      verified: true;
      planId: MembershipPlanId;
      planName: string;
      studioCredits: 50 | 150;
      customerEmail: string | null;
      trialEndsAt: string | null;
      status: Stripe.Subscription.Status;
    }
  | {
      verified: false;
      error: string;
      planId?: MembershipPlanId;
      planName?: string;
      status?: string | null;
    };

const MEMBERSHIP_PLANS: Record<
  MembershipPlanId,
  MembershipPlan
> = {
  business: {
    id: "business",
    name: "Beacon Business",
    studioCredits: 50,
  },

  business_pro: {
    id: "business_pro",
    name: "Beacon Business Pro",
    studioCredits: 150,
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

function normalisePlanId(
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription,
): MembershipPlanId | null {
  const planId =
    readMetadataValue(
      subscription.metadata,
      "businessMembershipPlan",
    ) ||
    readMetadataValue(
      subscription.metadata,
      "membershipPlan",
    ) ||
    readMetadataValue(
      subscription.metadata,
      "membershipPlanId",
    ) ||
    readMetadataValue(
      session.metadata,
      "businessMembershipPlan",
    ) ||
    readMetadataValue(
      session.metadata,
      "membershipPlan",
    ) ||
    readMetadataValue(
      session.metadata,
      "membershipPlanId",
    );

  return isMembershipPlanId(
    planId,
  )
    ? planId
    : null;
}

function getLinkedUserId(
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription,
): string | null {
  return (
    readMetadataValue(
      subscription.metadata,
      "beaconUserId",
    ) ||
    readMetadataValue(
      subscription.metadata,
      "userId",
    ) ||
    readMetadataValue(
      session.metadata,
      "beaconUserId",
    ) ||
    readMetadataValue(
      session.metadata,
      "userId",
    ) ||
    session.client_reference_id?.trim() ||
    null
  );
}

function getCustomerEmail(
  session: Stripe.Checkout.Session,
): string | null {
  if (
    session.customer_details?.email
  ) {
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
  timestamp:
    | number
    | null
    | undefined,
): string | null {
  if (
    typeof timestamp !== "number" ||
    !Number.isFinite(timestamp)
  ) {
    return null;
  }

  return new Date(
    timestamp * 1000,
  ).toISOString();
}

function jsonResponse(
  body: MembershipSessionResponse,
  status: number,
): NextResponse<MembershipSessionResponse> {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}

export async function GET(
  request: NextRequest,
): Promise<
  NextResponse<MembershipSessionResponse>
> {
  try {
    const authSession =
      await auth.api.getSession({
        headers:
          request.headers,
      });

    if (
      !authSession?.user?.id
    ) {
      return jsonResponse(
        {
          verified: false,
          error:
            "You must be signed in to verify this membership checkout.",
        },
        401,
      );
    }

    const requestUrl =
      new URL(
        request.url,
      );

    const checkoutSessionId =
      requestUrl.searchParams
        .get(
          "session_id",
        )
        ?.trim();

    if (!checkoutSessionId) {
      return jsonResponse(
        {
          verified: false,
          error:
            "Missing Stripe checkout session ID.",
        },
        400,
      );
    }

    if (
      !checkoutSessionId.startsWith(
        "cs_",
      )
    ) {
      return jsonResponse(
        {
          verified: false,
          error:
            "Invalid Stripe checkout session ID.",
        },
        400,
      );
    }

    const stripe =
      getStripeClient();

    let checkoutSession:
      Stripe.Checkout.Session;

    try {
      checkoutSession =
        await stripe.checkout.sessions.retrieve(
          checkoutSessionId,
          {
            expand: [
              "subscription",
              "customer",
            ],
          },
        );
    } catch (error) {
      if (
        error instanceof
          stripe.errors.StripeInvalidRequestError &&
        error.code ===
          "resource_missing"
      ) {
        return jsonResponse(
          {
            verified: false,
            error:
              "The Stripe checkout session could not be found.",
          },
          404,
        );
      }

      throw error;
    }

    if (
      checkoutSession.mode !==
      "subscription"
    ) {
      return jsonResponse(
        {
          verified: false,
          error:
            "This checkout session is not a membership subscription.",
        },
        400,
      );
    }

    if (
      checkoutSession.status !==
      "complete"
    ) {
      return jsonResponse(
        {
          verified: false,
          status:
            checkoutSession.status,
          error:
            "The Stripe checkout session has not been completed.",
        },
        409,
      );
    }

    const subscription =
      checkoutSession.subscription &&
      typeof checkoutSession.subscription !==
        "string"
        ? checkoutSession.subscription
        : null;

    if (!subscription) {
      return jsonResponse(
        {
          verified: false,
          error:
            "The membership subscription could not be confirmed.",
        },
        409,
      );
    }

    const linkedUserId =
      getLinkedUserId(
        checkoutSession,
        subscription,
      );

    if (
      !linkedUserId ||
      linkedUserId !==
        authSession.user.id
    ) {
      return jsonResponse(
        {
          verified: false,
          error:
            "This Stripe checkout session does not belong to the signed-in Beacon account.",
        },
        403,
      );
    }

    const source =
      readMetadataValue(
        subscription.metadata,
        "source",
      ) ||
      readMetadataValue(
        checkoutSession.metadata,
        "source",
      );

    const productFamily =
      readMetadataValue(
        subscription.metadata,
        "productFamily",
      ) ||
      readMetadataValue(
        checkoutSession.metadata,
        "productFamily",
      );

    if (
      source !==
        "beacon_business_memberships" ||
      productFamily !==
        "business"
    ) {
      return jsonResponse(
        {
          verified: false,
          error:
            "This checkout session is not a Beacon Business membership.",
        },
        422,
      );
    }

    const planId =
      normalisePlanId(
        checkoutSession,
        subscription,
      );

    if (!planId) {
      return jsonResponse(
        {
          verified: false,
          error:
            "The selected Beacon Business membership could not be identified.",
        },
        422,
      );
    }

    const plan =
      MEMBERSHIP_PLANS[
        planId
      ];

    const acceptableStatuses:
      Stripe.Subscription.Status[] = [
        "trialing",
        "active",
        "past_due",
      ];

    if (
      !acceptableStatuses.includes(
        subscription.status,
      )
    ) {
      return jsonResponse(
        {
          verified: false,
          planId,
          planName:
            plan.name,
          status:
            subscription.status,
          error:
            "The membership subscription is not currently active.",
        },
        409,
      );
    }

    return jsonResponse(
      {
        verified: true,
        planId,
        planName:
          plan.name,
        studioCredits:
          plan.studioCredits,
        customerEmail:
          getCustomerEmail(
            checkoutSession,
          ),
        trialEndsAt:
          unixTimestampToIso(
            subscription.trial_end,
          ),
        status:
          subscription.status,
      },
      200,
    );
  } catch (error) {
    console.error(
      "Beacon Business membership session verification failed:",
      error,
    );

    const message =
      process.env.NODE_ENV ===
        "development" &&
      error instanceof Error
        ? error.message
        : "We could not verify your membership checkout. Please try again.";

    return jsonResponse(
      {
        verified: false,
        error:
          message,
      },
      500,
    );
  }
}