import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getRequiredEnvironmentVariable(
  name: string
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is missing. Add it to .env.local and to the Vercel environment variables.`
    );
  }

  return value;
}

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  stripeClient =
    new Stripe(
      getRequiredEnvironmentVariable(
        "STRIPE_SECRET_KEY"
      )
    );

  return stripeClient;
}

export function getSiteUrl(): string {
  return (
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export type BeaconPurchaseType =
  | "credits_5"
  | "credits_15"
  | "credits_25"
  | "beacon_plus_monthly"
  | "beacon_plus_annual"
  | "beacon_plus";

export type BeaconBillingInterval =
  | "month"
  | "year"
  | null;

export type BeaconPriceConfiguration = {
  priceId: string;
  mode:
    | "payment"
    | "subscription";
  credits: number | null;
  label: string;
  billingInterval:
    BeaconBillingInterval;
};

export function getBeaconPriceConfiguration(
  purchaseType: BeaconPurchaseType
): BeaconPriceConfiguration {
  const configurations: Record<
    BeaconPurchaseType,
    BeaconPriceConfiguration
  > = {
    credits_5: {
      priceId:
        getRequiredEnvironmentVariable(
          "STRIPE_PRICE_CREDITS_5"
        ),
      mode: "payment",
      credits: 5,
      label:
        "Beacon Starter Credits",
      billingInterval: null,
    },

    credits_15: {
      priceId:
        getRequiredEnvironmentVariable(
          "STRIPE_PRICE_CREDITS_15"
        ),
      mode: "payment",
      credits: 15,
      label:
        "Beacon Popular Credits",
      billingInterval: null,
    },

    credits_25: {
      priceId:
        getRequiredEnvironmentVariable(
          "STRIPE_PRICE_CREDITS_25"
        ),
      mode: "payment",
      credits: 25,
      label:
        "Beacon Best Value Credits",
      billingInterval: null,
    },

    beacon_plus_monthly: {
      priceId:
        getRequiredEnvironmentVariable(
          "STRIPE_PRICE_BEACON_PLUS"
        ),
      mode: "subscription",
      credits: null,
      label:
        "Beacon+ Monthly",
      billingInterval: "month",
    },

    beacon_plus_annual: {
      priceId:
        getRequiredEnvironmentVariable(
          "STRIPE_PRICE_BEACON_PLUS_ANNUAL"
        ),
      mode: "subscription",
      credits: null,
      label:
        "Beacon+ Annual",
      billingInterval: "year",
    },

    /*
     * Legacy support for any existing clients or
     * Stripe Checkout sessions created before the
     * monthly and annual purchase types were split.
     */
    beacon_plus: {
      priceId:
        getRequiredEnvironmentVariable(
          "STRIPE_PRICE_BEACON_PLUS"
        ),
      mode: "subscription",
      credits: null,
      label:
        "Beacon+ Monthly",
      billingInterval: "month",
    },
  };

  return configurations[
    purchaseType
  ];
}

export function isBeaconPurchaseType(
  value: unknown
): value is BeaconPurchaseType {
  return (
    value === "credits_5" ||
    value === "credits_15" ||
    value === "credits_25" ||
    value ===
      "beacon_plus_monthly" ||
    value ===
      "beacon_plus_annual" ||
    value === "beacon_plus"
  );
}