import "server-only";

import Link from "next/link";
import {
  headers,
} from "next/headers";
import {
  redirect,
} from "next/navigation";

import {
  eq,
} from "drizzle-orm";

import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";
import { user } from "@/lib/database/schema";

import {
  getStripeClient,
} from "@/lib/stripe/StripeClient";

import {
  BEACON_PLUS_BILLING_INTERVALS,
  CREDIT_PACK_IDS,
  STRIPE_PURCHASE_TYPES,
  createCreditTopUpMetadata,
  createSubscriptionMetadata,
  getBeaconPlusPriceId,
  getCreditPack,
  getCreditPackPriceId,
  type BeaconPlusBillingInterval,
  type CreditPackId,
} from "@/lib/stripe/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BillingAccount = {
  id: string;
  email: string;
  stripeCustomerId:
    | string
    | null;
  stripeSubscriptionId:
    | string
    | null;
  stripeSubscriptionStatus:
    | string
    | null;
  beaconPlusActive: boolean;
  beaconPlusCurrentPeriodEnd:
    | Date
    | null;
  purchasedCredits: number;
};

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

async function readBillingAccount(
  userId: string
): Promise<BillingAccount> {
  const accounts =
    await database
      .select({
        id:
          user.id,

        email:
          user.email,

        stripeCustomerId:
          user.stripeCustomerId,

        stripeSubscriptionId:
          user.stripeSubscriptionId,

        stripeSubscriptionStatus:
          user.stripeSubscriptionStatus,

        beaconPlusActive:
          user.beaconPlusActive,

        beaconPlusCurrentPeriodEnd:
          user.beaconPlusCurrentPeriodEnd,

        purchasedCredits:
          user.purchasedCredits,
      })
      .from(user)
      .where(
        eq(
          user.id,
          userId
        )
      )
      .limit(1);

  const account =
    accounts[0];

  if (!account) {
    throw new Error(
      "The signed-in Beacon account could not be found."
    );
  }

  return {
    ...account,
    beaconPlusActive:
      account.beaconPlusActive ??
      false,
    purchasedCredits:
      account.purchasedCredits ??
      0,
  };
}

function formatDate(
  value:
    | Date
    | null
): string {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(value);
}

function formatSubscriptionStatus(
  status:
    | string
    | null
): string {
  if (!status) {
    return "No subscription";
  }

  return status
    .split("_")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function readBillingInterval(
  value: FormDataEntryValue | null
): BeaconPlusBillingInterval | null {
  if (
    value ===
      BEACON_PLUS_BILLING_INTERVALS.MONTHLY ||
    value ===
      BEACON_PLUS_BILLING_INTERVALS.ANNUAL
  ) {
    return value;
  }

  return null;
}

function readCreditPackId(
  value: FormDataEntryValue | null
): CreditPackId | null {
  if (
    value ===
      CREDIT_PACK_IDS.SMALL ||
    value ===
      CREDIT_PACK_IDS.MEDIUM ||
    value ===
      CREDIT_PACK_IDS.LARGE
  ) {
    return value;
  }

  return null;
}

async function openCustomerPortal() {
  "use server";

  const userId =
    await readSignedInUserId();

  const account =
    await readBillingAccount(
      userId
    );

  const customerId =
    account.stripeCustomerId
      ?.trim();

  if (!customerId) {
    redirect(
      "/account/billing?error=no-billing-account"
    );
  }

  const stripe =
    getStripeClient();

  try {
    const customer =
      await stripe.customers.retrieve(
        customerId
      );

    if (customer.deleted) {
      redirect(
        "/account/billing?error=billing-account-unavailable"
      );
    }

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer:
          customerId,

        return_url:
          `${readApplicationUrl()}/account/billing`,
      });

    redirect(
      portalSession.url
    );
  } catch (error) {
    console.error(
      "Beacon could not open the Stripe Customer Portal:",
      error
    );

    redirect(
      "/account/billing?error=portal-unavailable"
    );
  }
}

async function startSubscriptionCheckout(
  formData: FormData
) {
  "use server";

  const userId =
    await readSignedInUserId();

  const account =
    await readBillingAccount(
      userId
    );

  const billingInterval =
    readBillingInterval(
      formData.get(
        "billingInterval"
      )
    );

  if (!billingInterval) {
    redirect(
      "/account/billing?error=invalid-plan"
    );
  }

  const stripe =
    getStripeClient();

  const metadata = {
    ...createSubscriptionMetadata(
      billingInterval,
      userId
    ),

    beaconUserId:
      userId,
  };

  try {
    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode:
          STRIPE_PURCHASE_TYPES.SUBSCRIPTION,

        customer:
          account.stripeCustomerId ??
          undefined,

        customer_email:
          account.stripeCustomerId
            ? undefined
            : account.email,

        client_reference_id:
          userId,

        line_items: [
          {
            price:
              getBeaconPlusPriceId(
                billingInterval
              ),

            quantity: 1,
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
          `${readApplicationUrl()}/account/billing/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${readApplicationUrl()}/account/billing?checkout=cancelled`,
      });

    if (!checkoutSession.url) {
      throw new Error(
        "Stripe did not return a Checkout URL."
      );
    }

    redirect(
      checkoutSession.url
    );
  } catch (error) {
    console.error(
      "Beacon could not start subscription checkout:",
      error
    );

    redirect(
      "/account/billing?error=checkout-unavailable"
    );
  }
}

async function startCreditCheckout(
  formData: FormData
) {
  "use server";

  const userId =
    await readSignedInUserId();

  const account =
    await readBillingAccount(
      userId
    );

  const creditPackId =
    readCreditPackId(
      formData.get(
        "creditPackId"
      )
    );

  if (!creditPackId) {
    redirect(
      "/account/billing?error=invalid-credit-pack"
    );
  }

  const pack =
    getCreditPack(
      creditPackId
    );

  const stripe =
    getStripeClient();

  const metadata = {
    ...createCreditTopUpMetadata(
      creditPackId,
      userId
    ),

    beaconUserId:
      userId,

    purchaseLabel:
      pack.name,
  };

  try {
    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode: "payment",

        customer:
          account.stripeCustomerId ??
          undefined,

        customer_email:
          account.stripeCustomerId
            ? undefined
            : account.email,

        customer_creation:
          account.stripeCustomerId
            ? undefined
            : "always",

        client_reference_id:
          userId,

        line_items: [
          {
            price:
              getCreditPackPriceId(
                creditPackId
              ),

            quantity: 1,
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
          `${readApplicationUrl()}/account/billing/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${readApplicationUrl()}/account/billing?checkout=cancelled`,
      });

    if (!checkoutSession.url) {
      throw new Error(
        "Stripe did not return a Checkout URL."
      );
    }

    redirect(
      checkoutSession.url
    );
  } catch (error) {
    console.error(
      "Beacon could not start credit checkout:",
      error
    );

    redirect(
      "/account/billing?error=checkout-unavailable"
    );
  }
}

type BillingPageProps = {
  searchParams: Promise<{
    checkout?: string;
    error?: string;
  }>;
};

function readErrorMessage(
  errorCode:
    | string
    | undefined
): string | null {
  switch (errorCode) {
    case "no-billing-account":
      return "No Stripe billing account is linked to your Beacon account yet.";

    case "billing-account-unavailable":
      return "Your linked Stripe billing account is no longer available.";

    case "portal-unavailable":
      return "The billing portal could not be opened. Please try again.";

    case "invalid-plan":
      return "The selected Beacon+ plan is invalid.";

    case "invalid-credit-pack":
      return "The selected credit pack is invalid.";

    case "checkout-unavailable":
      return "Checkout could not be started. Please try again.";

    default:
      return null;
  }
}

export default async function BillingPage({
  searchParams,
}: BillingPageProps) {
  const userId =
    await readSignedInUserId();

  const account =
    await readBillingAccount(
      userId
    );

  const resolvedSearchParams =
    await searchParams;

  const errorMessage =
    readErrorMessage(
      resolvedSearchParams.error
    );

  const checkoutCancelled =
    resolvedSearchParams.checkout ===
    "cancelled";

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
            Account billing
          </p>

          <div className="mt-5 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
                Manage Beacon+ and your credits.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                Review your membership, purchase
                additional credits and manage payment
                details securely through Stripe.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-extrabold text-white transition hover:bg-white/20"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          {errorMessage && (
            <div
              role="alert"
              className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-800"
            >
              {errorMessage}
            </div>
          )}

          {checkoutCancelled && (
            <div
              role="status"
              className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 font-semibold text-amber-900"
            >
              Checkout was cancelled. No payment was
              taken.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                Beacon+ status
              </p>

              <div className="mt-5 flex items-center gap-3">
                <span
                  className={
                    account.beaconPlusActive
                      ? "h-3 w-3 rounded-full bg-emerald-500"
                      : "h-3 w-3 rounded-full bg-slate-300"
                  }
                />

                <p className="text-2xl font-black text-slate-950">
                  {account.beaconPlusActive
                    ? "Active"
                    : "Inactive"}
                </p>
              </div>

              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="font-bold text-slate-500">
                    Subscription status
                  </dt>

                  <dd className="mt-1 font-extrabold text-slate-900">
                    {formatSubscriptionStatus(
                      account.stripeSubscriptionStatus
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-slate-500">
                    Current period ends
                  </dt>

                  <dd className="mt-1 font-extrabold text-slate-900">
                    {formatDate(
                      account.beaconPlusCurrentPeriodEnd
                    )}
                  </dd>
                </div>
              </dl>

              {account.stripeCustomerId && (
                <form
                  action={
                    openCustomerPortal
                  }
                  className="mt-7"
                >
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 font-extrabold text-white transition hover:bg-slate-800"
                  >
                    Manage billing
                  </button>
                </form>
              )}
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                Purchased credits
              </p>

              <p className="mt-5 text-5xl font-black tracking-tight text-slate-950">
                {account.purchasedCredits.toLocaleString(
                  "en-GB"
                )}
              </p>

              <p className="mt-3 leading-7 text-slate-600">
                Purchased credits remain available in
                addition to any credits included with
                your account or Beacon+ membership.
              </p>

              <a
                href="#credit-packs"
                className="mt-7 inline-flex w-full items-center justify-center rounded-2xl border border-blue-900 px-5 py-3.5 font-extrabold text-blue-900 transition hover:bg-blue-50"
              >
                Buy more credits
              </a>
            </article>

            <article className="rounded-[2rem] border border-blue-200 bg-blue-50 p-7 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                Secure payments
              </p>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                Billing powered by Stripe
              </h2>

              <p className="mt-4 leading-7 text-slate-700">
                Card details, invoices, subscription
                changes and cancellations are handled
                through Stripe&apos;s secure hosted
                pages.
              </p>

              <p className="mt-5 text-sm font-bold text-slate-600">
                Signed in as {account.email}
              </p>
            </article>
          </div>

          {!account.beaconPlusActive && (
            <section className="mt-12">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-800">
                  Beacon+ membership
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Choose monthly or annual billing.
                </h2>

                <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                  Unlock enhanced recommendations,
                  higher usage limits and Beacon&apos;s
                  premium features.
                </p>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                    Flexible
                  </p>

                  <h3 className="mt-3 text-3xl font-black text-slate-950">
                    Beacon+ Monthly
                  </h3>

                  <p className="mt-4 leading-7 text-slate-600">
                    Full Beacon+ access with flexible
                    monthly billing.
                  </p>

                  <form
                    action={
                      startSubscriptionCheckout
                    }
                    className="mt-7"
                  >
                    <input
                      type="hidden"
                      name="billingInterval"
                      value={
                        BEACON_PLUS_BILLING_INTERVALS.MONTHLY
                      }
                    />

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
                    >
                      Choose monthly
                    </button>
                  </form>
                </article>

                <article className="relative rounded-[2rem] border-2 border-blue-800 bg-white p-7 shadow-lg">
                  <span className="absolute right-6 top-6 rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-900">
                    Best value
                  </span>

                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                    Save annually
                  </p>

                  <h3 className="mt-3 text-3xl font-black text-slate-950">
                    Beacon+ Annual
                  </h3>

                  <p className="mt-4 leading-7 text-slate-600">
                    Full Beacon+ access with one annual
                    payment.
                  </p>

                  <form
                    action={
                      startSubscriptionCheckout
                    }
                    className="mt-7"
                  >
                    <input
                      type="hidden"
                      name="billingInterval"
                      value={
                        BEACON_PLUS_BILLING_INTERVALS.ANNUAL
                      }
                    />

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
                    >
                      Choose annual
                    </button>
                  </form>
                </article>
              </div>
            </section>
          )}

          <section
            id="credit-packs"
            className="mt-14 scroll-mt-24"
          >
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-800">
                Credit top-ups
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Add extra Beacon credits.
              </h2>

              <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                Credit packs are one-off purchases and
                do not create a recurring subscription.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {Object.values(
                CREDIT_PACK_IDS
              ).map(
                (creditPackId) => {
                  const pack =
                    getCreditPack(
                      creditPackId
                    );

                  return (
                    <article
                      key={
                        pack.id
                      }
                      className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"
                    >
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-800">
                        One-off purchase
                      </p>

                      <h3 className="mt-3 text-2xl font-black text-slate-950">
                        {pack.name}
                      </h3>

                      <p className="mt-5 text-4xl font-black tracking-tight text-slate-950">
                        {pack.credits.toLocaleString(
                          "en-GB"
                        )}
                      </p>

                      <p className="mt-1 font-bold text-slate-500">
                        Beacon credits
                      </p>

                      <p className="mt-5 leading-7 text-slate-600">
                        {pack.description}
                      </p>

                      <form
                        action={
                          startCreditCheckout
                        }
                        className="mt-7"
                      >
                        <input
                          type="hidden"
                          name="creditPackId"
                          value={
                            pack.id
                          }
                        />

                        <button
                          type="submit"
                          className="w-full rounded-2xl border border-blue-900 px-5 py-3.5 font-extrabold text-blue-900 transition hover:bg-blue-50"
                        >
                          Buy credits
                        </button>
                      </form>
                    </article>
                  );
                }
              )}
            </div>
          </section>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}