import "server-only";

export const STRIPE_PURCHASE_TYPES = {
  SUBSCRIPTION: "subscription",
  CREDIT_TOP_UP: "credit_top_up",
} as const;

export type StripePurchaseType =
  (typeof STRIPE_PURCHASE_TYPES)[keyof typeof STRIPE_PURCHASE_TYPES];

export const BEACON_PLUS_BILLING_INTERVALS = {
  MONTHLY: "monthly",
  ANNUAL: "annual",
} as const;

export type BeaconPlusBillingInterval =
  (typeof BEACON_PLUS_BILLING_INTERVALS)[keyof typeof BEACON_PLUS_BILLING_INTERVALS];

export const CREDIT_PACK_IDS = {
  CREDITS_5: "credits_5",
  CREDITS_15: "credits_15",
  CREDITS_25: "credits_25",
} as const;

export type CreditPackId =
  (typeof CREDIT_PACK_IDS)[keyof typeof CREDIT_PACK_IDS];

export type BeaconPlusSubscriptionPlan = {
  id: BeaconPlusBillingInterval;
  name: string;
  description: string;
  purchaseType:
    typeof STRIPE_PURCHASE_TYPES.SUBSCRIPTION;
  billingInterval: "month" | "year";
  priceId: string | undefined;
  features: readonly string[];
};

export type BeaconCreditPack = {
  id: CreditPackId;
  name: string;
  description: string;
  purchaseType:
    typeof STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP;
  priceId: string | undefined;
  credits: number;
  priceInPence: number;
  displayPrice: string;
};

const beaconPlusFeatures = [
  "Enhanced AI recommendations",
  "Higher monthly usage limits",
  "Access to premium Beacon-AI features",
  "Faster access to new features",
  "Priority support",
  "Cancel at any time",
] as const;

export const beaconPlusPlans = {
  monthly: {
    id: BEACON_PLUS_BILLING_INTERVALS.MONTHLY,
    name: "Beacon+ Monthly",
    description:
      "Full access to Beacon+ with flexible monthly billing.",
    purchaseType:
      STRIPE_PURCHASE_TYPES.SUBSCRIPTION,
    billingInterval: "month",
    priceId:
      process.env.STRIPE_PRICE_BEACON_PLUS,
    features: beaconPlusFeatures,
  },

  annual: {
    id: BEACON_PLUS_BILLING_INTERVALS.ANNUAL,
    name: "Beacon+ Annual",
    description:
      "Full access to Beacon+ with annual billing.",
    purchaseType:
      STRIPE_PURCHASE_TYPES.SUBSCRIPTION,
    billingInterval: "year",
    priceId:
      process.env.STRIPE_PRICE_BEACON_PLUS_ANNUAL,
    features: beaconPlusFeatures,
  },
} satisfies Record<
  BeaconPlusBillingInterval,
  BeaconPlusSubscriptionPlan
>;

export const beaconCreditPacks = {
  credits_5: {
    id: CREDIT_PACK_IDS.CREDITS_5,
    name: "5 Beacon Credits",
    description:
      "Add 5 extra Beacon-AI credits to your account.",
    purchaseType:
      STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP,
    priceId:
      process.env.STRIPE_PRICE_CREDITS_5,
    credits: 5,
    priceInPence: 500,
    displayPrice: "£5",
  },

  credits_15: {
    id: CREDIT_PACK_IDS.CREDITS_15,
    name: "15 Beacon Credits",
    description:
      "Add 15 extra Beacon-AI credits to your account.",
    purchaseType:
      STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP,
    priceId:
      process.env.STRIPE_PRICE_CREDITS_15,
    credits: 15,
    priceInPence: 1_000,
    displayPrice: "£10",
  },

  credits_25: {
    id: CREDIT_PACK_IDS.CREDITS_25,
    name: "25 Beacon Credits",
    description:
      "Add 25 extra Beacon-AI credits to your account.",
    purchaseType:
      STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP,
    priceId:
      process.env.STRIPE_PRICE_CREDITS_25,
    credits: 25,
    priceInPence: 1_500,
    displayPrice: "£15",
  },
} satisfies Record<
  CreditPackId,
  BeaconCreditPack
>;

export const stripeProducts = {
  subscriptions: beaconPlusPlans,
  creditPacks: beaconCreditPacks,
} as const;

export function getBeaconPlusPlan(
  interval: BeaconPlusBillingInterval
): BeaconPlusSubscriptionPlan {
  return beaconPlusPlans[interval];
}

export function getBeaconPlusPriceId(
  interval: BeaconPlusBillingInterval
): string {
  const plan =
    getBeaconPlusPlan(interval);

  const environmentVariableName =
    interval ===
    BEACON_PLUS_BILLING_INTERVALS.MONTHLY
      ? "STRIPE_PRICE_BEACON_PLUS"
      : "STRIPE_PRICE_BEACON_PLUS_ANNUAL";

  return requireStripePriceId(
    plan.priceId,
    environmentVariableName
  );
}

export function getCreditPack(
  packId: CreditPackId
): BeaconCreditPack {
  return beaconCreditPacks[packId];
}

export function getCreditPackPriceId(
  packId: CreditPackId
): string {
  const pack =
    getCreditPack(packId);

  const environmentVariableNames: Record<
    CreditPackId,
    string
  > = {
    credits_5:
      "STRIPE_PRICE_CREDITS_5",

    credits_15:
      "STRIPE_PRICE_CREDITS_15",

    credits_25:
      "STRIPE_PRICE_CREDITS_25",
  };

  return requireStripePriceId(
    pack.priceId,
    environmentVariableNames[packId]
  );
}

export function isBeaconPlusBillingInterval(
  value: unknown
): value is BeaconPlusBillingInterval {
  return (
    value ===
      BEACON_PLUS_BILLING_INTERVALS.MONTHLY ||
    value ===
      BEACON_PLUS_BILLING_INTERVALS.ANNUAL
  );
}

export function isCreditPackId(
  value: unknown
): value is CreditPackId {
  return Object.values(
    CREDIT_PACK_IDS
  ).includes(
    value as CreditPackId
  );
}

export function isBeaconPlusPriceId(
  priceId: string | null | undefined
): boolean {
  if (!priceId) {
    return false;
  }

  return Object.values(
    beaconPlusPlans
  ).some(
    (plan) =>
      plan.priceId === priceId
  );
}

export function findBeaconPlusPlanByPriceId(
  priceId: string
): BeaconPlusSubscriptionPlan | null {
  return (
    Object.values(
      beaconPlusPlans
    ).find(
      (plan) =>
        plan.priceId === priceId
    ) ?? null
  );
}

export function findCreditPackByPriceId(
  priceId: string
): BeaconCreditPack | null {
  return (
    Object.values(
      beaconCreditPacks
    ).find(
      (pack) =>
        pack.priceId === priceId
    ) ?? null
  );
}

export function createSubscriptionMetadata(
  interval: BeaconPlusBillingInterval,
  userId: string
): Record<string, string> {
  return {
    purchaseType:
      STRIPE_PURCHASE_TYPES.SUBSCRIPTION,

    product:
      "beacon_plus",

    billingInterval:
      interval,

    userId,

    beaconUserId:
      userId,
  };
}

export function createCreditTopUpMetadata(
  packId: CreditPackId,
  userId: string
): Record<string, string> {
  const pack =
    getCreditPack(packId);

  return {
    purchaseType:
      STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP,

    product:
      "beacon_credits",

    creditPackId:
      pack.id,

    credits:
      String(pack.credits),

    userId,

    beaconUserId:
      userId,
  };
}

function requireStripePriceId(
  priceId: string | undefined,
  environmentVariableName: string
): string {
  const normalisedPriceId =
    priceId?.trim();

  if (!normalisedPriceId) {
    throw new Error(
      `Missing ${environmentVariableName} environment variable.`
    );
  }

  if (
    !normalisedPriceId.startsWith(
      "price_"
    )
  ) {
    throw new Error(
      `${environmentVariableName} must contain a valid Stripe Price ID beginning with "price_".`
    );
  }

  return normalisedPriceId;
}