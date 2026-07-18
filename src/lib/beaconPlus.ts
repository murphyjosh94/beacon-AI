import "server-only";

export const beaconPlusPlan = {
  name: "Beacon+",
  description:
    "Enhanced AI recommendations, expanded usage and premium Beacon-AI features.",

  currency: "gbp",

  billingInterval: "month",

  priceId:
    process.env.STRIPE_BEACON_PLUS_PRICE_ID,

  trialDays: 0,

  features: [
    "Enhanced AI recommendations",
    "Higher usage limits",
    "Faster access to new features",
    "Priority support",
    "Cancel at any time",
  ],
} as const;

export type BeaconPlusPlan =
  typeof beaconPlusPlan;

export function getBeaconPlusPriceId(): string {
  const priceId =
    beaconPlusPlan.priceId;

  if (!priceId) {
    throw new Error(
      "Missing STRIPE_BEACON_PLUS_PRICE_ID environment variable."
    );
  }

  if (
    !priceId.startsWith(
      "price_"
    )
  ) {
    throw new Error(
      "STRIPE_BEACON_PLUS_PRICE_ID must be a valid Stripe Price ID."
    );
  }

  return priceId;
}

export function getBeaconPlusTrialDays():
  | number
  | undefined {
  if (
    beaconPlusPlan.trialDays <=
    0
  ) {
    return undefined;
  }

  return beaconPlusPlan.trialDays;
}

export function isBeaconPlusPriceId(
  priceId:
    | string
    | null
    | undefined
): boolean {
  if (!priceId) {
    return false;
  }

  return (
    priceId ===
    getBeaconPlusPriceId()
  );
}