"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PackageId = "starter" | "business" | "premium";
type MembershipPlanId = "business" | "business_pro";
type MembershipStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

type BriefData = {
  businessName: string;
  businessType: string;
  businessDescription: string;
  yearsTrading: string;
  serviceArea: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  primaryColour: string;
  secondaryColour: string;
  styleDirection: string;
  services: string;
  idealCustomer: string;
  keyMessage: string;
  callToAction: string;
  socialLinks: string;
  packageId: PackageId;
  chatbot: boolean;
  onlineShop: boolean;
  membershipArea: boolean;
  notes: string;
  submittedAt?: string;
};

type StoredMembership = {
  planId: MembershipPlanId;
  planName: string;
  customerId: string;
  customerEmail?: string | null;
  subscriptionId?: string;
  status: MembershipStatus;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  checkoutSessionId?: string;
  updatedAt?: string;
};

type WebsiteStatus = "not_started" | "draft" | "ready" | "published";

type WebsiteProject = {
  status?: WebsiteStatus;
  completion?: number;
  seoScore?: number;
  pagesGenerated?: number;
  suggestions?: number;
  lastUpdated?: string;
  lastPublished?: string;
  domain?: string;
};

type BrandKit = {
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
};

type QuoteRecord = {
  id?: string;
  status?: "draft" | "sent" | "accepted" | "rejected" | "expired";
  total?: number;
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
};

type DashboardModule = {
  title: string;
  description: string;
  icon: string;
  href: string;
  badge?: string;
};

const BRIEF_STORAGE_KEY = "beacon-business-website-brief";
const MEMBERSHIP_STORAGE_KEY = "beacon-business-membership";
const WEBSITE_STORAGE_KEY = "beacon-business-website-project";
const BRAND_KIT_STORAGE_KEY = "beacon-business-brand-kit";
const QUOTES_STORAGE_KEYS = [
  "beacon-business-quotes",
  "beacon-ai-quotes",
  "beacon-quote-builder-quotes",
];

const packages = {
  starter: {
    name: "Starter Website",
    price: 150,
  },
  business: {
    name: "Business Website",
    price: 350,
  },
  premium: {
    name: "Premium Website",
    price: 600,
  },
} satisfies Record<
  PackageId,
  {
    name: string;
    price: number;
  }
>;

const websiteModules = [
  {
    key: "chatbot" as const,
    name: "AI Chatbot",
    price: 50,
  },
  {
    key: "onlineShop" as const,
    name: "Online Shop",
    price: 50,
  },
  {
    key: "membershipArea" as const,
    name: "Membership Area",
    price: 37.5,
  },
];

const dashboardModules: DashboardModule[] = [
  {
    title: "Website Builder",
    description:
      "Create, review and manage your business website from one workspace.",
    icon: "🌐",
    href: "/business/website",
  },
  {
    title: "AI Quote Builder",
    description:
      "Create professional quotations and prepare them for customer approval.",
    icon: "📋",
    href: "/business/quotes",
  },
  {
    title: "Invoices",
    description:
      "Create invoices, manage due dates and track payment status.",
    icon: "🧾",
    href: "/business/invoices",
  },
  {
    title: "Customers",
    description:
      "Keep customer details, notes, quotes, jobs and invoices connected.",
    icon: "👥",
    href: "/business/customers",
  },
  {
    title: "Jobs",
    description:
      "Schedule work, manage progress and turn completed jobs into invoices.",
    icon: "🛠️",
    href: "/business/jobs",
  },
  {
    title: "Templates",
    description:
      "Create policies, customer messages, HR documents and business paperwork.",
    icon: "📄",
    href: "/business/templates",
    badge: "Live",
  },
  {
    title: "Brand Kit",
    description:
      "Store your business details, colours, logo and reusable brand identity.",
    icon: "🎨",
    href: "/business/brand-kit",
    badge: "Live",
  },
  {
    title: "Analytics",
    description:
      "Track website readiness, quote performance and overall business health.",
    icon: "📊",
    href: "/business/analytics",
    badge: "Live",
  },
];

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function formatDate(value?: string | null, includeTime = false) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit" as const,
          minute: "2-digit" as const,
        }
      : {}),
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return "Not yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not yet";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readQuotes(): QuoteRecord[] {
  if (typeof window === "undefined") return [];

  for (const key of QUOTES_STORAGE_KEYS) {
    const parsed = safeParse<unknown>(
      window.localStorage.getItem(key),
      [],
    );

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is QuoteRecord =>
          typeof item === "object" && item !== null,
      );
    }
  }

  return [];
}

function isMembershipPlanId(value: unknown): value is MembershipPlanId {
  return value === "business" || value === "business_pro";
}

function isMembershipStatus(value: unknown): value is MembershipStatus {
  return (
    value === "trialing" ||
    value === "active" ||
    value === "past_due" ||
    value === "canceled" ||
    value === "incomplete" ||
    value === "incomplete_expired" ||
    value === "unpaid" ||
    value === "paused"
  );
}

function parseStoredMembership(value: string | null): StoredMembership | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredMembership>;

    if (
      !isMembershipPlanId(parsed.planId) ||
      typeof parsed.planName !== "string" ||
      typeof parsed.customerId !== "string" ||
      !parsed.customerId.startsWith("cus_") ||
      !isMembershipStatus(parsed.status)
    ) {
      return null;
    }

    return {
      planId: parsed.planId,
      planName: parsed.planName,
      customerId: parsed.customerId,
      customerEmail:
        typeof parsed.customerEmail === "string"
          ? parsed.customerEmail
          : null,
      subscriptionId:
        typeof parsed.subscriptionId === "string"
          ? parsed.subscriptionId
          : undefined,
      status: parsed.status,
      trialEndsAt:
        typeof parsed.trialEndsAt === "string" ? parsed.trialEndsAt : null,
      currentPeriodEnd:
        typeof parsed.currentPeriodEnd === "string"
          ? parsed.currentPeriodEnd
          : null,
      cancelAtPeriodEnd: Boolean(parsed.cancelAtPeriodEnd),
      checkoutSessionId:
        typeof parsed.checkoutSessionId === "string"
          ? parsed.checkoutSessionId
          : undefined,
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : undefined,
    };
  } catch {
    return null;
  }
}

function membershipStatusLabel(status: MembershipStatus) {
  switch (status) {
    case "trialing":
      return "Free trial";
    case "active":
      return "Active";
    case "past_due":
      return "Payment overdue";
    case "canceled":
      return "Cancelled";
    case "incomplete":
      return "Payment incomplete";
    case "incomplete_expired":
      return "Expired";
    case "unpaid":
      return "Unpaid";
    case "paused":
      return "Paused";
  }
}

function membershipStatusClasses(status: MembershipStatus) {
  switch (status) {
    case "trialing":
      return "bg-blue-100 text-blue-900";
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "bg-amber-100 text-amber-900";
    case "canceled":
    case "incomplete_expired":
      return "bg-rose-100 text-rose-800";
    case "paused":
      return "bg-slate-200 text-slate-700";
  }
}

function membershipPrice(planId: MembershipPlanId) {
  return planId === "business_pro" ? "£29.99/month" : "£19.99/month";
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link
      className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
      href={module.href}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl"
        >
          {module.icon}
        </span>

        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">
          {module.badge || "Available"}
        </span>
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-950">
        {module.title}
      </h3>

      <p className="mt-3 leading-7 text-slate-600">{module.description}</p>

      <div className="mt-5 font-black text-blue-950">Open module →</div>
    </Link>
  );
}

function MembershipCard({
  membership,
  portalLoading,
  portalError,
  onOpenBillingPortal,
}: {
  membership: StoredMembership | null;
  portalLoading: boolean;
  portalError: string | null;
  onOpenBillingPortal: () => void;
}) {
  const includedFeatures =
    membership?.planId === "business_pro"
      ? [
          "Website Builder",
          "Quotes and invoices",
          "Customer Manager",
          "Templates and Brand Kit",
          "AI Assistant",
          "Advanced analytics",
          "Priority support",
        ]
      : [
          "Website Builder",
          "Quotes and invoices",
          "Customer Manager",
          "Templates and Brand Kit",
          "AI Assistant",
          "Email support",
        ];

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-white shadow-xl">
      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-blue-800 to-amber-400" />

      <div className="p-7 sm:p-9">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
              Membership
            </p>

            {membership ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {membership.planName}
                  </h2>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-extrabold ${membershipStatusClasses(
                      membership.status,
                    )}`}
                  >
                    {membershipStatusLabel(membership.status)}
                  </span>
                </div>

                <p className="mt-4 text-lg font-black text-blue-950">
                  {membershipPrice(membership.planId)}
                </p>

                <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                  Your membership connects the tools you need to run your
                  business from one organised workspace.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Choose your Beacon Business membership.
                </h2>

                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Unlock your business workspace, website tools, quotes,
                  invoices, templates, customer management and more.
                </p>
              </>
            )}
          </div>

          <div className="flex min-w-64 flex-col gap-3">
            {membership ? (
              <button
                type="button"
                onClick={onOpenBillingPortal}
                disabled={portalLoading}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {portalLoading
                  ? "Opening secure billing..."
                  : "Manage Billing"}
              </button>
            ) : (
              <Link
                href="/business/memberships"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
              >
                Compare Memberships
              </Link>
            )}

            {membership?.planId === "business" ? (
              <Link
                href="/business/memberships"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-amber-400 bg-amber-50 px-6 py-4 font-extrabold text-blue-950 transition hover:bg-amber-100"
              >
                Upgrade to Pro
              </Link>
            ) : null}
          </div>
        </div>

        {portalError ? (
          <p
            className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 font-semibold text-rose-800"
            role="alert"
          >
            {portalError}
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-500">Plan</p>
            <p className="mt-2 font-black text-slate-950">
              {membership?.planName || "No plan selected"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-500">Status</p>
            <p className="mt-2 font-black text-slate-950">
              {membership
                ? membershipStatusLabel(membership.status)
                : "Not subscribed"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-500">
              {membership?.status === "trialing"
                ? "Free trial ends"
                : "Next billing date"}
            </p>
            <p className="mt-2 font-black text-slate-950">
              {membership?.status === "trialing"
                ? formatDate(membership.trialEndsAt)
                : formatDate(membership?.currentPeriodEnd)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-500">Account email</p>
            <p className="mt-2 break-all font-black text-slate-950">
              {membership?.customerEmail || "Not connected"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
            Included in your workspace
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {includedFeatures.map((feature) => (
              <span
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700"
                key={feature}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BusinessDashboard() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [membership, setMembership] = useState<StoredMembership | null>(null);
  const [website, setWebsite] = useState<WebsiteProject>({});
  const [brandKit, setBrandKit] = useState<BrandKit>({});
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    const hydrate = () => {
      const savedBrief = window.localStorage.getItem(BRIEF_STORAGE_KEY);
      const savedMembership = window.localStorage.getItem(
        MEMBERSHIP_STORAGE_KEY,
      );

      if (savedBrief) {
        try {
          const parsed = JSON.parse(savedBrief) as BriefData;

          if (
            parsed &&
            typeof parsed.businessName === "string" &&
            typeof parsed.packageId === "string" &&
            parsed.packageId in packages
          ) {
            setBrief(parsed);
          } else {
            window.localStorage.removeItem(BRIEF_STORAGE_KEY);
          }
        } catch {
          window.localStorage.removeItem(BRIEF_STORAGE_KEY);
        }
      } else {
        setBrief(null);
      }

      const parsedMembership = parseStoredMembership(savedMembership);

      if (parsedMembership) {
        setMembership(parsedMembership);
      } else {
        setMembership(null);

        if (savedMembership) {
          window.localStorage.removeItem(MEMBERSHIP_STORAGE_KEY);
        }
      }

      setWebsite(
        safeParse<WebsiteProject>(
          window.localStorage.getItem(WEBSITE_STORAGE_KEY),
          {},
        ),
      );

      setBrandKit(
        safeParse<BrandKit>(
          window.localStorage.getItem(BRAND_KIT_STORAGE_KEY),
          {},
        ),
      );

      setQuotes(readQuotes());
      setLoaded(true);
    };

    hydrate();

    window.addEventListener("storage", hydrate);
    window.addEventListener("beacon-brand-kit-updated", hydrate);

    return () => {
      window.removeEventListener("storage", hydrate);
      window.removeEventListener("beacon-brand-kit-updated", hydrate);
    };
  }, []);

  const selectedWebsiteModules = useMemo(() => {
    if (!brief) {
      return [];
    }

    return websiteModules.filter((module) => brief[module.key]);
  }, [brief]);

  const estimatedTotal = useMemo(() => {
    if (!brief) {
      return 0;
    }

    const packagePrice = packages[brief.packageId].price;
    const modulePrice = selectedWebsiteModules.reduce(
      (sum, module) => sum + module.price,
      0,
    );

    return packagePrice + modulePrice;
  }, [brief, selectedWebsiteModules]);

  const summary = useMemo(() => {
    const acceptedQuotes = quotes.filter(
      (quote) => quote.status === "accepted",
    );
    const pendingQuotes = quotes.filter(
      (quote) =>
        quote.status === "draft" ||
        quote.status === "sent" ||
        !quote.status,
    );

    const acceptedValue = acceptedQuotes.reduce(
      (sum, quote) =>
        sum + (typeof quote.total === "number" ? quote.total : 0),
      0,
    );

    const brandFields = [
      brandKit.businessName,
      brandKit.email,
      brandKit.phone,
      brandKit.address,
      brandKit.website,
      brandKit.logoUrl,
    ];

    const brandScore = Math.round(
      (brandFields.filter((value) => value?.trim()).length /
        brandFields.length) *
        100,
    );

    const websiteScore = clamp(
      typeof website.completion === "number"
        ? website.completion
        : brief
          ? 30
          : 0,
    );

    const seoScore = clamp(
      typeof website.seoScore === "number" ? website.seoScore : 0,
    );

    const domainScore = website.domain?.trim() ? 100 : 0;
    const quoteScore = quotes.length > 0 ? Math.min(100, 35 + quotes.length * 10) : 10;

    const healthScore = Math.round(
      websiteScore * 0.35 +
        brandScore * 0.2 +
        seoScore * 0.2 +
        domainScore * 0.1 +
        quoteScore * 0.15,
    );

    const timeline = [
      ...(website.lastPublished
        ? [
            {
              id: "website-published",
              title: "Website published",
              detail: website.domain || "Website publication recorded",
              date: website.lastPublished,
              icon: "🚀",
            },
          ]
        : []),
      ...(website.lastUpdated
        ? [
            {
              id: "website-updated",
              title: "Website updated",
              detail: `${websiteScore}% setup completion`,
              date: website.lastUpdated,
              icon: "🖥️",
            },
          ]
        : []),
      ...quotes
        .filter((quote) => quote.updatedAt || quote.createdAt)
        .map((quote, index) => ({
          id: quote.id || `quote-${index}`,
          title:
            quote.status === "accepted"
              ? "Quote accepted"
              : quote.status === "rejected"
                ? "Quote rejected"
                : quote.status === "sent"
                  ? "Quote sent"
                  : "Quote created",
          detail: `${quote.customerName || "Customer"} · ${formatCurrency(
            typeof quote.total === "number" ? quote.total : 0,
          )}`,
          date: quote.updatedAt || quote.createdAt || "",
          icon:
            quote.status === "accepted"
              ? "✅"
              : quote.status === "rejected"
                ? "❌"
                : "📄",
        })),
    ]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 6);

    return {
      acceptedQuotes,
      pendingQuotes,
      acceptedValue,
      brandScore,
      websiteScore,
      seoScore,
      domainScore,
      quoteScore,
      healthScore,
      timeline,
    };
  }, [brandKit, brief, quotes, website]);

  async function openBillingPortal() {
    if (!membership?.customerId || portalLoading) {
      return;
    }

    setPortalLoading(true);
    setPortalError(null);

    try {
      const response = await fetch("/api/business/membership/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: membership.customerId,
          returnPath: "/business/dashboard",
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error ?? "We could not open your secure billing portal.",
        );
      }

      window.location.assign(data.url);
    } catch (error) {
      setPortalError(
        error instanceof Error
          ? error.message
          : "We could not open your secure billing portal.",
      );
      setPortalLoading(false);
    }
  }

  if (!loaded) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-5 h-12 max-w-2xl rounded bg-slate-200" />
            <div className="mt-8 grid gap-5 md:grid-cols-4">
              <div className="h-40 rounded-3xl bg-slate-100" />
              <div className="h-40 rounded-3xl bg-slate-100" />
              <div className="h-40 rounded-3xl bg-slate-100" />
              <div className="h-40 rounded-3xl bg-slate-100" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const hasBeenSubmitted = Boolean(brief?.submittedAt);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-20 text-white">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
                Beacon Business Dashboard
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {brief?.businessName
                  ? `Welcome, ${brief.businessName}.`
                  : brandKit.businessName
                    ? `Welcome, ${brandKit.businessName}.`
                    : "Your business. One workspace."}
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                Manage your website, quotes, customers, documents, branding and
                analytics from one connected business control centre.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/business/analytics"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-extrabold text-blue-950 transition hover:bg-blue-50"
              >
                Open Analytics
              </Link>

              <Link
                href="/business/website"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                Open Website Builder
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/business/analytics"
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Business Health
              </p>
              <p className="mt-3 text-4xl font-black text-slate-950">
                {summary.healthScore}/100
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Combined website, SEO, brand, domain and quote readiness.
              </p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-700"
                  style={{ width: `${summary.healthScore}%` }}
                />
              </div>
            </Link>

            <Link
              href="/business/website"
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Website Progress
              </p>
              <p className="mt-3 text-4xl font-black text-slate-950">
                {summary.websiteScore}%
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {website.pagesGenerated ?? 0} pages generated · SEO{" "}
                {summary.seoScore}/100
              </p>
              <p className="mt-4 font-black text-blue-950">
                Open Website Builder →
              </p>
            </Link>

            <Link
              href="/business/quotes"
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Quote Performance
              </p>
              <p className="mt-3 text-4xl font-black text-slate-950">
                {summary.acceptedQuotes.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Accepted · {formatCurrency(summary.acceptedValue)} value ·{" "}
                {summary.pendingQuotes.length} pending
              </p>
              <p className="mt-4 font-black text-blue-950">
                Open AI Quote Builder →
              </p>
            </Link>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Membership
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {membership
                  ? membershipStatusLabel(membership.status)
                  : "Not active"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {membership?.planName || "Choose a plan to unlock the platform."}
              </p>
              <Link
                href="/business/memberships"
                className="mt-4 inline-flex font-black text-blue-950"
              >
                Manage membership →
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-blue-200 bg-blue-50 p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Quick actions
                </p>
                <h2 className="mt-2 text-2xl font-black text-blue-950">
                  Start the next business task.
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/business/quotes"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900"
                >
                  New Quote
                </Link>
                <Link
                  href="/business/invoices"
                  className="inline-flex items-center justify-center rounded-2xl border border-blue-300 bg-white px-5 py-3 font-extrabold text-blue-950 transition hover:bg-blue-100"
                >
                  New Invoice
                </Link>
                <Link
                  href="/business/brand-kit"
                  className="inline-flex items-center justify-center rounded-2xl border border-blue-300 bg-white px-5 py-3 font-extrabold text-blue-950 transition hover:bg-blue-100"
                >
                  Edit Brand Kit
                </Link>
                <Link
                  href="/business/templates"
                  className="inline-flex items-center justify-center rounded-2xl border border-blue-300 bg-white px-5 py-3 font-extrabold text-blue-950 transition hover:bg-blue-100"
                >
                  Open Templates
                </Link>
                <Link
                  href="/business/website"
                  className="inline-flex items-center justify-center rounded-2xl border border-blue-300 bg-white px-5 py-3 font-extrabold text-blue-950 transition hover:bg-blue-100"
                >
                  Website Builder
                </Link>
                <Link
                  href="/business/analytics"
                  className="inline-flex items-center justify-center rounded-2xl border border-blue-300 bg-white px-5 py-3 font-extrabold text-blue-950 transition hover:bg-blue-100"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
              Business tools
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Run your business from one connected workspace.
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Move naturally between your website, quotes, customers, documents,
              branding, jobs, invoices and analytics.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardModules.map((module) => (
              <ModuleCard key={module.title} module={module} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Recent activity
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Latest business events
                </h2>
              </div>

              <Link
                href="/business/analytics"
                className="font-black text-blue-950"
              >
                View all analytics →
              </Link>
            </div>

            {summary.timeline.length > 0 ? (
              <div className="mt-7 space-y-4">
                {summary.timeline.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-slate-200 p-5"
                  >
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                      {item.icon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-extrabold text-slate-950">
                          {item.title}
                        </p>
                        <p className="text-sm font-semibold text-slate-500">
                          {formatDateTime(item.date)}
                        </p>
                      </div>
                      <p className="mt-1 break-words text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-lg font-black text-slate-900">
                  No activity recorded yet
                </p>
                <p className="mt-2 leading-7 text-slate-600">
                  Website updates and quote activity will appear here
                  automatically.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Platform readiness
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Connected setup status
            </h2>

            <div className="mt-7 space-y-5">
              {[
                ["Website", summary.websiteScore, "/business/website"],
                ["SEO", summary.seoScore, "/business/website"],
                ["Brand Kit", summary.brandScore, "/business/brand-kit"],
                ["Domain", summary.domainScore, "/business/website/domains"],
                ["Quote Activity", summary.quoteScore, "/business/quotes"],
              ].map(([label, score, href]) => (
                <Link
                  key={String(label)}
                  href={String(href)}
                  className="block rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-extrabold text-slate-950">{label}</p>
                    <p className="font-black text-blue-950">{score}/100</p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-700"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-7xl">
          <MembershipCard
            membership={membership}
            onOpenBillingPortal={openBillingPortal}
            portalError={portalError}
            portalLoading={portalLoading}
          />
        </div>
      </section>

      {brief ? (
        <section className="px-6 pb-20">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                Website Package
              </p>

              <p className="mt-4 text-2xl font-black text-slate-950">
                {packages[brief.packageId].name}
              </p>

              <p className="mt-2 text-3xl font-black text-blue-950">
                {brief.packageId === "premium"
                  ? `From ${formatCurrency(packages[brief.packageId].price)}`
                  : formatCurrency(packages[brief.packageId].price)}
              </p>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                Website Add-ons
              </p>

              <p className="mt-4 text-3xl font-black text-slate-950">
                {selectedWebsiteModules.length}
              </p>

              <p className="mt-2 leading-6 text-slate-600">
                {selectedWebsiteModules.length === 0
                  ? "No additional website add-ons selected."
                  : selectedWebsiteModules
                      .map((module) => module.name)
                      .join(", ")}
              </p>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                Estimated Website Total
              </p>

              <p className="mt-4 text-3xl font-black text-blue-950">
                {formatCurrency(estimatedTotal)}
              </p>

              <p className="mt-2 leading-6 text-slate-600">
                Final scope is confirmed before payment.
              </p>
            </article>
          </div>

          <article className="mx-auto mt-8 max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Website project
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {hasBeenSubmitted
                    ? "Your brief is ready for preview generation."
                    : "Your website brief is still in progress."}
                </h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  {hasBeenSubmitted
                    ? "Beacon has the business information needed to prepare your interactive preview."
                    : "Return to the Website Builder to review and complete the remaining information."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/business/website"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-6 py-3 font-extrabold text-white transition hover:bg-blue-900"
                >
                  {hasBeenSubmitted
                    ? "Review website brief"
                    : "Continue website brief"}
                </Link>

                {hasBeenSubmitted ? (
                  <Link
                    href="/business/preview"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-3 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
                  >
                    Open preview
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      ) : (
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-2xl sm:p-12">
            <span
              aria-hidden="true"
              className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 text-3xl"
            >
              🌐
            </span>

            <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
              Websites
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Create your first website project.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Your business workspace is ready. Open Website Builder when you
              are ready to create and manage your online presence.
            </p>

            <Link
              href="/business/website"
              className="mt-8 inline-flex rounded-2xl bg-blue-950 px-8 py-4 text-lg font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-900"
            >
              Open Website Builder
            </Link>
          </div>
        </section>
      )}
    </>
  );
}