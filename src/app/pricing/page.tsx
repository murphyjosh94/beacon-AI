"use client";

import { useState } from "react";

import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";

type PurchaseType =
  | "credits_5"
  | "credits_15"
  | "credits_25"
  | "beacon_plus";

type PricingPlan = {
  purchaseType: PurchaseType;
  name: string;
  price: string;
  billingLabel: string;
  searches: string;
  description: string;
  features: string[];
  badge?: string;
  featured?: boolean;
  buttonLabel: string;
};

type CheckoutSuccessResponse = {
  success: true;
  data: {
    checkoutUrl: string;
    sessionId: string;
  };
};

type CheckoutErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

type CheckoutResponse =
  | CheckoutSuccessResponse
  | CheckoutErrorResponse;

const plans: PricingPlan[] = [
  {
    purchaseType: "credits_5",
    name: "Starter",
    price: "£5",
    billingLabel: "one-time payment",
    searches: "5 searches",
    description:
      "A simple credit pack for occasional Beacon research.",
    features: [
      "Five full Beacon searches",
      "Live shopping and hotel results",
      "Beacon Scores and explanations",
      "Credits do not renew automatically",
    ],
    buttonLabel: "Buy 5 Searches",
  },
  {
    purchaseType: "credits_15",
    name: "Popular",
    price: "£10",
    billingLabel: "one-time payment",
    searches: "15 searches",
    description:
      "More searches for regular shopping, travel and research.",
    features: [
      "Fifteen full Beacon searches",
      "Five bonus searches included",
      "Live product and hotel data",
      "Credits do not renew automatically",
    ],
    badge: "Most Popular",
    featured: true,
    buttonLabel: "Buy 15 Searches",
  },
  {
    purchaseType: "credits_25",
    name: "Best Value",
    price: "£15",
    billingLabel: "one-time payment",
    searches: "25 searches",
    description:
      "The strongest one-off value for frequent Beacon users.",
    features: [
      "Twenty-five full Beacon searches",
      "Ten bonus searches included",
      "Live recommendations and comparisons",
      "Credits do not renew automatically",
    ],
    badge: "Best Value",
    buttonLabel: "Buy 25 Searches",
  },
  {
    purchaseType: "beacon_plus",
    name: "Beacon+",
    price: "£20",
    billingLabel: "per month",
    searches: "Unlimited searches",
    description:
      "The complete Beacon experience for regular users.",
    features: [
      "Unlimited searches, subject to fair use",
      "Live shopping and travel research",
      "Saved preferences and search history",
      "Future price and holiday alerts",
      "Cancel through your account",
    ],
    badge: "Beacon+",
    buttonLabel: "Join Beacon+",
  },
];

function getCheckoutErrorMessage(
  data: unknown
): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data
  ) {
    const error = data.error;

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }
  }

  return "Beacon could not start checkout. Please try again.";
}

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] =
    useState<PurchaseType | null>(null);

  const [error, setError] = useState("");

  async function startCheckout(
    purchaseType: PurchaseType
  ) {
    if (loadingPlan) {
      return;
    }

    setLoadingPlan(purchaseType);
    setError("");

    try {
      const response = await fetch(
        "/api/stripe/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            purchaseType,
          }),
        }
      );

      const data =
        (await response.json()) as CheckoutResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          getCheckoutErrorMessage(data)
        );
      }

      if (!data.data.checkoutUrl) {
        throw new Error(
          "Stripe did not return a checkout page."
        );
      }

      window.location.assign(
        data.data.checkoutUrl
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not start checkout."
      );

      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-20 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.32em] text-blue-200">
            Beacon Pricing
          </p>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            Search your way.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
            Buy searches when you need them or
            join Beacon+ for unlimited research,
            subject to fair use.
          </p>

          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur">
            <p className="font-extrabold">
              Five free personalised searches each
              day
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-100">
              Paid credits give you additional
              searches after your free daily
              allowance has been used.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          {error && (
            <div
              role="alert"
              className="mx-auto mb-8 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-5 text-center font-semibold text-red-800"
            >
              {error}
            </div>
          )}

          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const isLoading =
                loadingPlan ===
                plan.purchaseType;

              const anotherPlanIsLoading =
                loadingPlan !== null &&
                !isLoading;

              return (
                <article
                  key={plan.purchaseType}
                  className={`relative flex h-full flex-col rounded-[2rem] border p-7 shadow-xl ${
                    plan.featured
                      ? "border-blue-700 bg-blue-950 text-white ring-4 ring-blue-100"
                      : "border-slate-200 bg-white text-slate-950"
                  }`}
                >
                  {plan.badge && (
                    <div
                      className={`absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] shadow-lg ${
                        plan.featured
                          ? "bg-white text-blue-950"
                          : "bg-blue-900 text-white"
                      }`}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div className="pt-3">
                    <p
                      className={`text-sm font-extrabold uppercase tracking-[0.22em] ${
                        plan.featured
                          ? "text-blue-200"
                          : "text-blue-900"
                      }`}
                    >
                      {plan.name}
                    </p>

                    <div className="mt-5">
                      <span className="text-5xl font-black">
                        {plan.price}
                      </span>

                      <span
                        className={`ml-2 text-sm font-semibold ${
                          plan.featured
                            ? "text-blue-200"
                            : "text-slate-500"
                        }`}
                      >
                        {plan.billingLabel}
                      </span>
                    </div>

                    <p className="mt-4 text-2xl font-black">
                      {plan.searches}
                    </p>

                    <p
                      className={`mt-4 min-h-20 leading-7 ${
                        plan.featured
                          ? "text-blue-100"
                          : "text-slate-600"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  <ul className="mt-7 flex-1 space-y-3">
                    {plan.features.map(
                      (feature) => (
                        <li
                          key={feature}
                          className={`flex gap-3 text-sm font-semibold leading-6 ${
                            plan.featured
                              ? "text-blue-50"
                              : "text-slate-700"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={
                              plan.featured
                                ? "text-blue-300"
                                : "text-blue-800"
                            }
                          >
                            ✓
                          </span>

                          <span>{feature}</span>
                        </li>
                      )
                    )}
                  </ul>

                  <button
                    type="button"
                    onClick={() =>
                      startCheckout(
                        plan.purchaseType
                      )
                    }
                    disabled={
                      isLoading ||
                      anotherPlanIsLoading
                    }
                    className={`mt-8 w-full rounded-2xl px-5 py-4 font-extrabold shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                      plan.featured
                        ? "bg-white text-blue-950 hover:bg-blue-50"
                        : "bg-blue-900 text-white hover:bg-blue-800"
                    }`}
                  >
                    {isLoading
                      ? "Opening Checkout..."
                      : plan.buttonLabel}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="mx-auto mt-12 max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="text-2xl font-black text-slate-950">
              Before purchasing
            </h2>

            <div className="mt-5 grid gap-5 text-sm leading-7 text-slate-600 sm:grid-cols-2">
              <p>
                Search credits should only be added
                after Stripe confirms successful
                payment through Beacon&apos;s secure
                webhook.
              </p>

              <p>
                Beacon+ renews monthly until
                cancelled. Unlimited use remains
                subject to reasonable fair-use and
                misuse protections.
              </p>
            </div>
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}