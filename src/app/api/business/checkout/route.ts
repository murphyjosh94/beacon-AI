import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PackageId = "starter" | "business" | "premium";
type ModuleId = "chatbot" | "onlineShop" | "membershipArea";

type CheckoutRequest = {
  businessName?: unknown;
  email?: unknown;
  packageId?: unknown;
  modules?: unknown;
  scopeConfirmed?: unknown;
};

type StripeItem = {
  name: string;
  priceId: string | undefined;
};

const packageCatalog: Record<PackageId, StripeItem> = {
  starter: {
    name: "Starter Website",
    priceId: process.env.STRIPE_PRICE_BUSINESS_STARTER,
  },
  business: {
    name: "Business Website",
    priceId: process.env.STRIPE_PRICE_BUSINESS_STANDARD,
  },
  premium: {
    name: "Premium Website",
    priceId: process.env.STRIPE_PRICE_BUSINESS_PREMIUM,
  },
};

const moduleCatalog: Record<ModuleId, StripeItem> = {
  chatbot: {
    name: "AI Chatbot",
    priceId: process.env.STRIPE_PRICE_BUSINESS_CHATBOT,
  },
  onlineShop: {
    name: "Online Shop",
    priceId: process.env.STRIPE_PRICE_BUSINESS_ONLINE_SHOP,
  },
  membershipArea: {
    name: "Membership Area",
    priceId: process.env.STRIPE_PRICE_BUSINESS_MEMBERSHIP_AREA,
  },
};

function isPackageId(value: unknown): value is PackageId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(packageCatalog, value)
  );
}

function isModuleId(value: unknown): value is ModuleId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(moduleCatalog, value)
  );
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return new Stripe(secretKey);
}

function requirePriceId(item: StripeItem) {
  const priceId = item.priceId?.trim();

  if (!priceId || !priceId.startsWith("price_")) {
    throw new Error(
      `The Stripe Price ID for ${item.name} is missing or invalid.`
    );
  }

  return priceId;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequest;

    const businessName = cleanText(body.businessName, 120);
    const email = cleanText(body.email, 254);

    if (!businessName) {
      return NextResponse.json(
        {
          error: "A business name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isPackageId(body.packageId)) {
      return NextResponse.json(
        {
          error: "The selected website package is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    if (body.scopeConfirmed !== true) {
      return NextResponse.json(
        {
          error: "The final website scope must be confirmed before payment.",
        },
        {
          status: 400,
        }
      );
    }

    const requestedModules = Array.isArray(body.modules) ? body.modules : [];

    if (!requestedModules.every(isModuleId)) {
      return NextResponse.json(
        {
          error: "One or more selected modules are invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const uniqueModules = Array.from(new Set(requestedModules));
    const selectedPackage = packageCatalog[body.packageId];

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: requirePriceId(selectedPackage),
        quantity: 1,
      },
      ...uniqueModules.map((moduleId) => ({
        price: requirePriceId(moduleCatalog[moduleId]),
        quantity: 1,
      })),
    ];

    const stripe = getStripeClient();
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    ).replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: email || undefined,
      billing_address_collection: "auto",
      allow_promotion_codes: false,

      metadata: {
        orderType: "beacon_business_website",
        businessName,
        packageId: body.packageId,
        packageName: selectedPackage.name,
        modules: uniqueModules.join(",") || "none",
      },

      payment_intent_data: {
        metadata: {
          orderType: "beacon_business_website",
          businessName,
          packageId: body.packageId,
          modules: uniqueModules.join(",") || "none",
        },
      },

      success_url: `${siteUrl}/business/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/business/checkout?cancelled=1`,
    });

    if (!session.url) {
      return NextResponse.json(
        {
          error: "Stripe did not return a checkout URL.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Beacon Business checkout error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start secure checkout.",
      },
      {
        status: 500,
      }
    );
  }
}