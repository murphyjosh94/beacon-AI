import "server-only";

import Link from "next/link";
import {
  headers,
} from "next/headers";
import {
  redirect,
} from "next/navigation";

import type Stripe from "stripe";

import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";

import { auth } from "@/lib/auth/Auth";

import {
  getStripeClient,
} from "@/lib/stripe/StripeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BillingSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

type PurchaseSummary = {
  heading: string;
  description: string;
  purchaseType:
    | "subscription"
    | "credit_top_up"
    | "unknown";
  paymentStatus: string;
  customerEmail: string | null;
  amountPaid: string | null;
  credits: number | null;
  billingInterval: string | null;
};

async function readSignedInUserId(): Promise<string> {
  const requestHeaders =
    await headers();

  const session =
    await auth.api.getSession({
      headers:
        requestHeaders,
    });

  if (!session?.user?.id) {
    redirect(
      "/signin?next=/account/billing"
    );
  }

  return session.user.id;
}

function readMetadataValue(
  metadata:
    | Stripe.Metadata
    | null
    | undefined,
  key: string
): string | null {
  const value =
    metadata?.[key]?.trim();

  return value || null;
}

function readBeaconUserId(
  checkoutSession:
    Stripe.Checkout.Session
): string | null {
  return (
    readMetadataValue(
      checkoutSession.metadata,
      "beaconUserId"
    ) ||
    readMetadataValue(
      checkoutSession.metadata,
      "userId"
    ) ||
    checkoutSession
      .client_reference_id
      ?.trim() ||
    null
  );
}

function readCredits(
  checkoutSession:
    Stripe.Checkout.Session
): number | null {
  const rawCredits =
    readMetadataValue(
      checkoutSession.metadata,
      "credits"
    );

  if (!rawCredits) {
    return null;
  }

  const credits =
    Number.parseInt(
      rawCredits,
      10
    );

  if (
    !Number.isSafeInteger(
      credits
    ) ||
    credits <= 0
  ) {
    return null;
  }

  return credits;
}

function formatCurrency(
  amountTotal:
    | number
    | null,
  currency:
    | string
    | null
): string | null {
  if (
    amountTotal === null ||
    !currency
  ) {
    return null;
  }

  try {
    return new Intl.NumberFormat(
      "en-GB",
      {
        style:
          "currency",

        currency:
          currency.toUpperCase(),
      }
    ).format(
      amountTotal / 100
    );
  } catch {
    return null;
  }
}

function formatPaymentStatus(
  paymentStatus:
    Stripe.Checkout.Session.PaymentStatus
): string {
  switch (paymentStatus) {
    case "paid":
      return "Paid";

    case "unpaid":
      return "Awaiting payment";

    case "no_payment_required":
      return "No payment required";

    default:
      return "Processing";
  }
}

function formatBillingInterval(
  interval: string | null
): string | null {
  if (
    interval === "monthly"
  ) {
    return "Monthly";
  }

  if (
    interval === "annual"
  ) {
    return "Annual";
  }

  return null;
}

function createPurchaseSummary(
  checkoutSession:
    Stripe.Checkout.Session
): PurchaseSummary {
  const purchaseType =
    readMetadataValue(
      checkoutSession.metadata,
      "purchaseType"
    );

  const customerEmail =
    checkoutSession
      .customer_details
      ?.email ||
    checkoutSession
      .customer_email ||
    null;

  const amountPaid =
    formatCurrency(
      checkoutSession
        .amount_total,
      checkoutSession
        .currency
    );

  if (
    purchaseType ===
      "credit_top_up" ||
    checkoutSession.mode ===
      "payment"
  ) {
    const credits =
      readCredits(
        checkoutSession
      );

    return {
      heading:
        "Your credit purchase was successful.",

      description:
        credits
          ? `${credits.toLocaleString(
              "en-GB"
            )} Beacon credits are being added to your account.`
          : "Your purchased Beacon credits are being added to your account.",

      purchaseType:
        "credit_top_up",

      paymentStatus:
        formatPaymentStatus(
          checkoutSession
            .payment_status
        ),

      customerEmail,

      amountPaid,

      credits,

      billingInterval:
        null,
    };
  }

  if (
    purchaseType ===
      "subscription" ||
    checkoutSession.mode ===
      "subscription"
  ) {
    const billingInterval =
      formatBillingInterval(
        readMetadataValue(
          checkoutSession.metadata,
          "billingInterval"
        )
      );

    return {
      heading:
        "Welcome to Beacon+.",

      description:
        billingInterval
          ? `Your ${billingInterval.toLowerCase()} Beacon+ membership is being activated.`
          : "Your Beacon+ membership is being activated.",

      purchaseType:
        "subscription",

      paymentStatus:
        formatPaymentStatus(
          checkoutSession
            .payment_status
        ),

      customerEmail,

      amountPaid,

      credits:
        null,

      billingInterval,
    };
  }

  return {
    heading:
      "Your Stripe checkout was completed.",

    description:
      "Beacon is processing your purchase and updating your account.",

    purchaseType:
      "unknown",

    paymentStatus:
      formatPaymentStatus(
        checkoutSession
          .payment_status
      ),

    customerEmail,

    amountPaid,

    credits:
      null,

    billingInterval:
      null,
  };
}

async function readCheckoutSession(
  sessionId: string,
  signedInUserId: string
): Promise<Stripe.Checkout.Session> {
  if (
    !sessionId.startsWith(
      "cs_"
    )
  ) {
    throw new Error(
      "The Stripe Checkout Session ID is invalid."
    );
  }

  const stripe =
    getStripeClient();

  const checkoutSession =
    await stripe.checkout.sessions.retrieve(
      sessionId
    );

  const checkoutUserId =
    readBeaconUserId(
      checkoutSession
    );

  if (
    !checkoutUserId ||
    checkoutUserId !==
      signedInUserId
  ) {
    throw new Error(
      "This checkout session does not belong to the signed-in Beacon account."
    );
  }

  return checkoutSession;
}

export default async function BillingSuccessPage({
  searchParams,
}: BillingSuccessPageProps) {
  const signedInUserId =
    await readSignedInUserId();

  const resolvedSearchParams =
    await searchParams;

  const checkoutSessionId =
    resolvedSearchParams
      .session_id
      ?.trim();

  if (!checkoutSessionId) {
    redirect(
      "/account/billing?error=missing-checkout-session"
    );
  }

  let purchaseSummary:
    | PurchaseSummary
    | null = null;

  let verificationFailed =
    false;

  try {
    const checkoutSession =
      await readCheckoutSession(
        checkoutSessionId,
        signedInUserId
      );

    purchaseSummary =
      createPurchaseSummary(
        checkoutSession
      );
  } catch (error) {
    verificationFailed =
      true;

    console.error(
      "Beacon could not verify the completed Stripe Checkout Session:",
      error
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/15">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-10 w-10 text-emerald-300"
            >
              <path
                d="M5 12.5l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="mt-7 text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
            Checkout complete
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            {purchaseSummary?.heading ??
              "Thank you for your purchase."}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            {purchaseSummary?.description ??
              "Beacon is confirming your payment and updating your account."}
          </p>
        </div>
      </section>

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {verificationFailed ? (
            <div
              role="alert"
              className="rounded-[2rem] border border-amber-200 bg-amber-50 p-7 shadow-sm"
            >
              <h2 className="text-2xl font-black text-slate-950">
                Your payment may still have completed
              </h2>

              <p className="mt-4 leading-7 text-slate-700">
                Beacon could not display the checkout
                details securely. Stripe will still
                notify Beacon through the billing
                webhook, so your account may update
                shortly.
              </p>

              <p className="mt-4 text-sm font-semibold text-slate-600">
                Check your billing page before trying
                the purchase again.
              </p>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
              <div className="flex items-center justify-between gap-5 border-b border-slate-200 pb-6">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                    Purchase summary
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Payment received
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-extrabold text-emerald-800">
                  {
                    purchaseSummary
                      ?.paymentStatus
                  }
                </span>
              </div>

              <dl className="mt-6 space-y-5">
                {purchaseSummary
                  ?.billingInterval && (
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <dt className="font-bold text-slate-500">
                      Beacon+ billing
                    </dt>

                    <dd className="font-extrabold text-slate-950">
                      {
                        purchaseSummary
                          .billingInterval
                      }
                    </dd>
                  </div>
                )}

                {purchaseSummary
                  ?.credits && (
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <dt className="font-bold text-slate-500">
                      Credits purchased
                    </dt>

                    <dd className="font-extrabold text-slate-950">
                      {purchaseSummary.credits.toLocaleString(
                        "en-GB"
                      )}
                    </dd>
                  </div>
                )}

                {purchaseSummary
                  ?.amountPaid && (
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <dt className="font-bold text-slate-500">
                      Amount
                    </dt>

                    <dd className="font-extrabold text-slate-950">
                      {
                        purchaseSummary
                          .amountPaid
                      }
                    </dd>
                  </div>
                )}

                {purchaseSummary
                  ?.customerEmail && (
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <dt className="font-bold text-slate-500">
                      Receipt email
                    </dt>

                    <dd className="break-all font-extrabold text-slate-950">
                      {
                        purchaseSummary
                          .customerEmail
                      }
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="mt-8 rounded-[2rem] border border-blue-200 bg-blue-50 p-7">
            <h2 className="text-xl font-black text-slate-950">
              Your account may take a moment to update
            </h2>

            <p className="mt-3 leading-7 text-slate-700">
              Stripe confirms purchases to Beacon
              through a secure webhook. Your Beacon+
              status or purchased credit balance should
              appear on the billing page shortly.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/account/billing"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-6 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
            >
              View billing account
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 font-extrabold text-slate-900 transition hover:bg-slate-100"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}