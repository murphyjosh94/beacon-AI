"use client";

import Link from "next/link";
import {
  useState,
} from "react";

import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";

type BillingInterval =
  | "monthly"
  | "annual";

type CheckoutRequest =
  | {
      purchaseType:
        "subscription";
      billingInterval:
        BillingInterval;
    }
  | {
      purchaseType:
        "credit_top_up";
      creditPackId:
        "credits_small"
        | "credits_medium"
        | "credits_large";
    };

type CheckoutResponse = {
  checkoutUrl?: string;
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
};

type ActiveCheckout =
  | BillingInterval
  | "credits_small"
  | "credits_medium"
  | "credits_large"
  | null;

const creditPacks = [
  {
    id:
      "credits_small" as const,
    name:
      "Small credit pack",
    description:
      "A useful top-up for occasional extra Beacon activity.",
    creditsLabel:
      "Small top-up",
  },
  {
    id:
      "credits_medium" as const,
    name:
      "Medium credit pack",
    description:
      "A larger balance for regular use across Beacon tools.",
    creditsLabel:
      "Popular top-up",
  },
  {
    id:
      "credits_large" as const,
    name:
      "Large credit pack",
    description:
      "The largest one-off credit option for frequent Beacon use.",
    creditsLabel:
      "Maximum top-up",
  },
];

function readCheckoutError(
  response: CheckoutResponse
): string {
  return (
    response.error?.message ||
    "Checkout could not be started. Please try again."
  );
}

export default function PricingPage() {
  const [
    activeCheckout,
    setActiveCheckout,
  ] =
    useState<ActiveCheckout>(
      null
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  async function startCheckout(
    requestBody:
      CheckoutRequest,
    checkoutId:
      ActiveCheckout
  ): Promise<void> {
    if (activeCheckout) {
      return;
    }

    setActiveCheckout(
      checkoutId
    );

    setErrorMessage(
      null
    );

    try {
      const response =
        await fetch(
          "/api/stripe/checkout",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody
              ),
          }
        );

      const data =
        (await response.json()) as CheckoutResponse;

      if (
        response.status === 401
      ) {
        const nextUrl =
          encodeURIComponent(
            "/pricing"
          );

        window.location.assign(
          `/signin?next=${nextUrl}`
        );

        return;
      }

      if (
        !response.ok ||
        !data.checkoutUrl
      ) {
        throw new Error(
          readCheckoutError(
            data
          )
        );
      }

      window.location.assign(
        data.checkoutUrl
      );
    } catch (error) {
      console.error(
        "Beacon could not start Stripe Checkout:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Checkout could not be started. Please try again."
      );

      setActiveCheckout(
        null
      );
    }
  }

  function startSubscription(
    billingInterval:
      BillingInterval
  ): void {
    void startCheckout(
      {
        purchaseType:
          "subscription",

        billingInterval,
      },
      billingInterval
    );
  }

  function startCreditPurchase(
    creditPackId:
      | "credits_small"
      | "credits_medium"
      | "credits_large"
  ): void {
    void startCheckout(
      {
        purchaseType:
          "credit_top_up",

        creditPackId,
      },
      creditPackId
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-16 text-white sm:py-24">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />

          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cyan-400 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
            Beacon pricing
          </p>

          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
            Choose the Beacon
            experience that works
            for you.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
            Use Beacon&apos;s
            core experience, upgrade
            to Beacon+ or purchase
            extra credits whenever
            you need them.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#beacon-plus"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 font-extrabold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 sm:w-auto"
            >
              View Beacon+ plans
            </a>

            <a
              href="#credit-packs"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-4 font-extrabold text-white transition hover:bg-white/20 sm:w-auto"
            >
              View credit packs
            </a>
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

          <section
            id="beacon-plus"
            className="scroll-mt-24"
          >
            <div className="text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-800">
                Beacon+ membership
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                More Beacon. More
                possibilities.
              </h2>

              <p className="mx-auto mt-5 max-w-3xl leading-7 text-slate-600">
                Select flexible
                monthly billing or
                choose the annual
                option for long-term
                access.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <article className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">
                    Core access
                  </p>

                  <h3 className="mt-3 text-3xl font-black text-slate-950">
                    Beacon
                  </h3>

                  <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                    Free
                  </p>

                  <p className="mt-4 leading-7 text-slate-600">
                    Start using
                    Beacon&apos;s
                    essential tools
                    without a recurring
                    subscription.
                  </p>
                </div>

                <ul className="mt-7 flex-1 space-y-4 text-slate-700">
                  <li className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 font-black text-emerald-600"
                    >
                      ✓
                    </span>

                    <span>
                      Access to
                      Beacon&apos;s
                      core experience
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 font-black text-emerald-600"
                    >
                      ✓
                    </span>

                    <span>
                      Secure Beacon
                      account
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 font-black text-emerald-600"
                    >
                      ✓
                    </span>

                    <span>
                      Optional credit
                      top-ups
                    </span>
                  </li>
                </ul>

                <Link
                  href="/signup"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-4 font-extrabold text-slate-950 transition hover:bg-slate-100"
                >
                  Create free account
                </Link>
              </article>

              <article className="flex flex-col rounded-[2rem] border border-blue-200 bg-white p-7 shadow-sm">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                    Flexible billing
                  </p>

                  <h3 className="mt-3 text-3xl font-black text-slate-950">
                    Beacon+ Monthly
                  </h3>

                  <p className="mt-4 text-lg font-bold text-slate-500">
                    Billed every month
                  </p>

                  <p className="mt-4 leading-7 text-slate-600">
                    Full Beacon+
                    access with the
                    freedom of monthly
                    billing.
                  </p>
                </div>

                <ul className="mt-7 flex-1 space-y-4 text-slate-700">
                  <li className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 font-black text-blue-700"
                    >
                      ✓
                    </span>

                    <span>
                      Premium Beacon
                      features
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 font-black text-blue-700"
                    >
                      ✓
                    </span>

                    <span>
                      Enhanced usage
                      allowances
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 font-black text-blue-700"
                    >
                      ✓
                    </span>

                    <span>
                      Manage or cancel
                      through Stripe
                    </span>
                  </li>
                </ul>

                <button
                  type="button"
                  disabled={
                    activeCheckout !==
                    null
                  }
                  onClick={() =>
                    startSubscription(
                      "monthly"
                    )
                  }
                  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activeCheckout ===
                  "monthly"
                    ? "Opening checkout…"
                    : "Choose monthly"}
                </button>
              </article>

              <article className="relative flex flex-col rounded-[2rem] border-2 border-blue-800 bg-white p-7 shadow-xl">
                <span className="absolute right-6 top-6 rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-900">
                  Best value
                </span>

                <div>
                  <p className="pr-28 text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                    Annual billing
                  </p>

                  <h3 className="mt-3 text-3xl font-black text-slate-950">
                    Beacon+ Annual
                  </h3>

                  <p className="mt-4 text-lg font-bold text-slate-500">
                    Billed once a year
                  </p>

                  <p className="mt-4 leading-7 text-slate-600">
                    Full Beacon+
                    access with one
                    convenient annual
                    payment.
                  </p>
                </div>

                <ul className="mt-7 flex-1 space-y-4 text-slate-700">
                  <li className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 font-black text-blue-700"
                    >
                      ✓
                    </span>

                    <span>
                      Everything in
                      monthly Beacon+
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 font-black text-blue-700"
                    >
                      ✓
                    </span>

                    <span>
                      One annual
                      payment
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 font-black text-blue-700"
                    >
                      ✓
                    </span>

                    <span>
                      Manage or cancel
                      through Stripe
                    </span>
                  </li>
                </ul>

                <button
                  type="button"
                  disabled={
                    activeCheckout !==
                    null
                  }
                  onClick={() =>
                    startSubscription(
                      "annual"
                    )
                  }
                  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activeCheckout ===
                  "annual"
                    ? "Opening checkout…"
                    : "Choose annual"}
                </button>
              </article>
            </div>
          </section>

          <section
            id="credit-packs"
            className="mt-20 scroll-mt-24"
          >
            <div className="text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-800">
                One-off purchases
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Add Beacon credits
                whenever you need
                them.
              </h2>

              <p className="mx-auto mt-5 max-w-3xl leading-7 text-slate-600">
                Credit packs are
                separate one-time
                purchases. Buying a
                pack does not start a
                subscription.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {creditPacks.map(
                (pack) => (
                  <article
                    key={
                      pack.id
                    }
                    className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"
                  >
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-800">
                      {
                        pack.creditsLabel
                      }
                    </p>

                    <h3 className="mt-3 text-2xl font-black text-slate-950">
                      {pack.name}
                    </h3>

                    <p className="mt-4 flex-1 leading-7 text-slate-600">
                      {
                        pack.description
                      }
                    </p>

                    <button
                      type="button"
                      disabled={
                        activeCheckout !==
                        null
                      }
                      onClick={() =>
                        startCreditPurchase(
                          pack.id
                        )
                      }
                      className="mt-7 inline-flex w-full items-center justify-center rounded-2xl border border-blue-900 px-5 py-4 font-extrabold text-blue-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activeCheckout ===
                      pack.id
                        ? "Opening checkout…"
                        : "Buy credit pack"}
                    </button>
                  </article>
                )
              )}
            </div>
          </section>

          <section className="mt-20 rounded-[2rem] border border-blue-200 bg-blue-50 p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                  Already subscribed?
                </p>

                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Manage your Beacon
                  billing account.
                </h2>

                <p className="mt-4 max-w-2xl leading-7 text-slate-700">
                  View your membership
                  status, purchased
                  credits and Stripe
                  billing options from
                  your account.
                </p>
              </div>

              <Link
                href="/account/billing"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 font-extrabold text-white transition hover:bg-slate-800 lg:w-auto"
              >
                Open billing
              </Link>
            </div>
          </section>

          <p className="mt-8 text-center text-sm leading-6 text-slate-500">
            Payments are processed
            securely by Stripe.
            Subscription availability,
            prices and included
            features are determined by
            the products configured in
            your Stripe account.
          </p>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}