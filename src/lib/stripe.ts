import "server-only";

import Stripe from "stripe";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY;

function getStripeSecretKey(): string {
  if (!stripeSecretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY environment variable."
    );
  }

  if (
    !stripeSecretKey.startsWith(
      "sk_test_"
    ) &&
    !stripeSecretKey.startsWith(
      "sk_live_"
    ) &&
    !stripeSecretKey.startsWith(
      "rk_test_"
    ) &&
    !stripeSecretKey.startsWith(
      "rk_live_"
    )
  ) {
    throw new Error(
      "STRIPE_SECRET_KEY must be a valid Stripe secret or restricted key."
    );
  }

  return stripeSecretKey;
}

const globalForStripe =
  globalThis as typeof globalThis & {
    stripe?: Stripe;
  };

export const stripe =
  globalForStripe.stripe ??
  new Stripe(
    getStripeSecretKey(),
    {
      typescript: true,

      appInfo: {
        name: "Beacon-AI",
        url: "https://beacon-ai.co.uk",
      },

      maxNetworkRetries: 2,

      timeout: 20_000,
    }
  );

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForStripe.stripe =
    stripe;
}

export default stripe;