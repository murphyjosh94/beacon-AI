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
  SMALL: "credits_small",
  MEDIUM: "credits_medium",
  LARGE: "credits_large",
} as const;

export type CreditPackId =
  (typeof CREDIT_PACK_IDS)[keyof typeof CREDIT_PACK_IDS];

export type BeaconPlusSubscriptionPlan = {
  id: BeaconPlusBillingInterval;
  name: string;
  description: string;
  purchaseType: typeof STRIPE_PURCHASE_TYPES.SUBSCRIPTION;
  billingInterval: "month" | "year";
  priceId: string | undefined;
  features: readonly string[];
};

export type BeaconCreditPack = {
  id: CreditPackId;
  name: string;
  description: string;
  purchaseType: typeof STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP;
  priceId: string | undefined;
  credits: number;
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
    purchaseType: STRIPE_PURCHASE_TYPES.SUBSCRIPTION,
    billingInterval: "month",
    priceId:
      process.env.STRIPE_BEACON_PLUS_MONTHLY_PRICE_ID,
    features: beaconPlusFeatures,
  },

  annual: {
    id: BEACON_PLUS_BILLING_INTERVALS.ANNUAL,
    name: "Beacon+ Annual",
    description:
      "Full access to Beacon+ with annual billing.",
    purchaseType: STRIPE_PURCHASE_TYPES.SUBSCRIPTION,
    billingInterval: "year",
    priceId:
      process.env.STRIPE_BEACON_PLUS_ANNUAL_PRICE_ID,
    features: beaconPlusFeatures,
  },
} satisfies Record<
  BeaconPlusBillingInterval,
  BeaconPlusSubscriptionPlan
>;

export const beaconCreditPacks = {
  credits_small: {
    id: CREDIT_PACK_IDS.SMALL,
    name: "Small Credit Top-Up",
    description:
      "Add extra Beacon-AI credits to your account.",
    purchaseType: STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP,
    priceId:
      process.env.STRIPE_CREDITS_SMALL_PRICE_ID,
    credits: readPositiveInteger(
      process.env.STRIPE_CREDITS_SMALL_AMOUNT,
      100
    ),
  },

  credits_medium: {
    id: CREDIT_PACK_IDS.MEDIUM,
    name: "Medium Credit Top-Up",
    description:
      "Add extra Beacon-AI credits to your account.",
    purchaseType: STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP,
    priceId:
      process.env.STRIPE_CREDITS_MEDIUM_PRICE_ID,
    credits: readPositiveInteger(
      process.env.STRIPE_CREDITS_MEDIUM_AMOUNT,
      500
    ),
  },

  credits_large: {
    id: CREDIT_PACK_IDS.LARGE,
    name: "Large Credit Top-Up",
    description:
      "Add extra Beacon-AI credits to your account.",
    purchaseType: STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP,
    priceId:
      process.env.STRIPE_CREDITS_LARGE_PRICE_ID,
    credits: readPositiveInteger(
      process.env.STRIPE_CREDITS_LARGE_AMOUNT,
      1_000
    ),
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
  const plan = getBeaconPlusPlan(interval);

  return requireStripePriceId(
    plan.priceId,
    interval ===
      BEACON_PLUS_BILLING_INTERVALS.MONTHLY
      ? "STRIPE_BEACON_PLUS_MONTHLY_PRICE_ID"
      : "STRIPE_BEACON_PLUS_ANNUAL_PRICE_ID"
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
  const pack = getCreditPack(packId);

  const environmentVariableNames: Record<
    CreditPackId,
    string
  > = {
    credits_small:
      "STRIPE_CREDITS_SMALL_PRICE_ID",
    credits_medium:
      "STRIPE_CREDITS_MEDIUM_PRICE_ID",
    credits_large:
      "STRIPE_CREDITS_LARGE_PRICE_ID",
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
  return Object.values(CREDIT_PACK_IDS).includes(
    value as CreditPackId
  );
}

export function isBeaconPlusPriceId(
  priceId: string | null | undefined
): boolean {
  if (!priceId) {
    return false;
  }

  return Object.values(beaconPlusPlans).some(
    (plan) => plan.priceId === priceId
  );
}

export function findBeaconPlusPlanByPriceId(
  priceId: string
): BeaconPlusSubscriptionPlan | null {
  return (
    Object.values(beaconPlusPlans).find(
      (plan) => plan.priceId === priceId
    ) ?? null
  );
}

export function findCreditPackByPriceId(
  priceId: string
): BeaconCreditPack | null {
  return (
    Object.values(beaconCreditPacks).find(
      (pack) => pack.priceId === priceId
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
    product: "beacon_plus",
    billingInterval: interval,
    userId,
  };
}

export function createCreditTopUpMetadata(
  packId: CreditPackId,
  userId: string
): Record<string, string> {
  const pack = getCreditPack(packId);

  return {
    purchaseType:
      STRIPE_PURCHASE_TYPES.CREDIT_TOP_UP,
    product: "beacon_credits",
    creditPackId: pack.id,
    credits: String(pack.credits),
    userId,
  };
}

function requireStripePriceId(
  priceId: string | undefined,
  environmentVariableName: string
): string {
  if (!priceId) {
    throw new Error(
      `Missing ${environmentVariableName} environment variable.`
    );
  }

  if (!priceId.startsWith("price_")) {
    throw new Error(
      `${environmentVariableName} must contain a valid Stripe Price ID beginning with "price_".`
    );
  }

  return priceId;
}

function readPositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(
    value,
    10
  );

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    return fallback;
  }

  return parsedValue;
}