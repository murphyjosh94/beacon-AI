import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  eq,
} from "drizzle-orm";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";
import { user } from "@/lib/database/schema";
import {
  getStripeClient,
} from "@/lib/stripe/StripeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PortalSuccessResponse = {
  success: true;
  portalUrl: string;
};

type PortalErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

function createErrorResponse(
  code: string,
  message: string,
  status: number
): NextResponse<PortalErrorResponse> {
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

function readApplicationUrl(): string {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_APP_URL
      ?.trim() ||
    process.env
      .BETTER_AUTH_URL
      ?.trim();

  if (!configuredUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL or BETTER_AUTH_URL is not configured."
    );
  }

  try {
    return new URL(
      configuredUrl
    ).origin;
  } catch {
    throw new Error(
      "The configured Beacon application URL is invalid."
    );
  }
}

async function findStripeCustomerId(
  userId: string
): Promise<string | undefined> {
  const accounts =
    await database
      .select({
        stripeCustomerId:
          user.stripeCustomerId,
      })
      .from(user)
      .where(
        eq(
          user.id,
          userId
        )
      )
      .limit(1);

  const customerId =
    accounts[0]
      ?.stripeCustomerId
      ?.trim();

  return (
    customerId ||
    undefined
  );
}

async function verifyStripeCustomer(
  customerId: string
): Promise<boolean> {
  const stripe =
    getStripeClient();

  const customer =
    await stripe.customers.retrieve(
      customerId
    );

  return !customer.deleted;
}

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    | PortalSuccessResponse
    | PortalErrorResponse
  >
> {
  try {
    const session =
      await auth.api.getSession({
        headers:
          request.headers,
      });

    if (!session?.user?.id) {
      return createErrorResponse(
        "authentication_required",
        "You must be signed in to manage your billing.",
        401
      );
    }

    const customerId =
      await findStripeCustomerId(
        session.user.id
      );

    if (!customerId) {
      return createErrorResponse(
        "stripe_customer_not_found",
        "No Stripe billing account is linked to your Beacon account yet.",
        404
      );
    }

    const customerExists =
      await verifyStripeCustomer(
        customerId
      );

    if (!customerExists) {
      return createErrorResponse(
        "stripe_customer_deleted",
        "The Stripe billing account linked to your Beacon account is no longer available.",
        409
      );
    }

    const stripe =
      getStripeClient();

    const applicationUrl =
      readApplicationUrl();

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer:
          customerId,

        return_url:
          `${applicationUrl}/account/billing`,
      });

    if (!portalSession.url) {
      return createErrorResponse(
        "portal_url_missing",
        "Stripe did not return a billing portal URL.",
        502
      );
    }

    return NextResponse.json({
      success: true,
      portalUrl:
        portalSession.url,
    });
  } catch (error) {
    console.error(
      "Beacon could not create a Stripe Customer Portal session:",
      error
    );

    return createErrorResponse(
      "portal_creation_failed",
      "Beacon could not open the billing portal. Please try again.",
      500
    );
  }
}