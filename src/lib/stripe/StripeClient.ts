import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

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

  stripeClient = new Stripe(
    getRequiredEnvironmentVariable("STRIPE_SECRET_KEY")
  );

  return stripeClient;
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export type BeaconPurchaseType =
  | "credits_5"
  | "credits_15"
  | "credits_25"
  | "beacon_plus";

type BeaconPriceConfiguration = {
  priceId: string;
  mode: "payment" | "subscription";
  credits: number | null;
  label: string;
};

export function getBeaconPriceConfiguration(
  purchaseType: BeaconPurchaseType
): BeaconPriceConfiguration {
  const configurations: Record<
    BeaconPurchaseType,
    BeaconPriceConfiguration
  > = {
    credits_5: {
      priceId: getRequiredEnvironmentVariable(
        "STRIPE_PRICE_CREDITS_5"
      ),
      mode: "payment",
      credits: 5,
      label: "Beacon Starter Credits",
    },

    credits_15: {
      priceId: getRequiredEnvironmentVariable(
        "STRIPE_PRICE_CREDITS_15"
      ),
      mode: "payment",
      credits: 15,
      label: "Beacon Popular Credits",
    },

    credits_25: {
      priceId: getRequiredEnvironmentVariable(
        "STRIPE_PRICE_CREDITS_25"
      ),
      mode: "payment",
      credits: 25,
      label: "Beacon Best Value Credits",
    },

    beacon_plus: {
      priceId: getRequiredEnvironmentVariable(
        "STRIPE_PRICE_BEACON_PLUS"
      ),
      mode: "subscription",
      credits: null,
      label: "Beacon+",
    },
  };

  return configurations[purchaseType];
}

export function isBeaconPurchaseType(
  value: unknown
): value is BeaconPurchaseType {
  return (
    value === "credits_5" ||
    value === "credits_15" ||
    value === "credits_25" ||
    value === "beacon_plus"
  );
}