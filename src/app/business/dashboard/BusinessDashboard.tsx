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

type DashboardModule = {
  title: string;
  description: string;
  icon: string;
  status: "available" | "coming_soon";
  href?: string;
  proOnly?: boolean;
};

const BRIEF_STORAGE_KEY = "beacon-business-website-brief";
const MEMBERSHIP_STORAGE_KEY = "beacon-business-membership";

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
    title: "Websites",
    description:
      "Create, review and manage your business website from one workspace.",
    icon: "🌐",
    status: "available",
    href: "/business/website",
  },
  {
    title: "Quotes",
    description:
      "Create professional quotations with labour, materials, discounts and VAT.",
    icon: "📋",
    status: "available",
    href: "/business/quotes",
  },
  {
    title: "Invoices",
    description:
      "Create invoices, manage due dates and track payment status.",
    icon: "🧾",
    status: "coming_soon",
  },
  {
    title: "Customers",
    description:
      "Keep customer details, notes, quotes and invoices connected.",
    icon: "👥",
    status: "coming_soon",
  },
  {
    title: "Templates",
    description:
      "Use practical templates for contracts, policies, emails and documents.",
    icon: "📄",
    status: "coming_soon",
  },
  {
    title: "Brand Kit",
    description:
      "Store your logo, colours and company details for consistent branding.",
    icon: "🎨",
    status: "coming_soon",
  },
  {
    title: "AI Assistant",
    description:
      "Draft replies, improve content and create business documents faster.",
    icon: "🤖",
    status: "coming_soon",
  },
  {
    title: "Analytics",
    description:
      "Understand website performance and business activity in one view.",
    icon: "📊",
    status: "coming_soon",
    proOnly: true,
  },
];

const progressSteps = [
  {
    title: "Website brief completed",
    description:
      "Your business details, design direction and package selection are ready.",
  },
  {
    title: "Preview generation",
    description:
      "Beacon prepares an interactive website preview from your completed brief.",
  },
  {
    title: "Customer review",
    description:
      "Explore the preview and request any changes before approval.",
  },
  {
    title: "Awaiting approval",
    description:
      "Confirm that you are happy with the design direction and final scope.",
  },
  {
    title: "Payment received",
    description:
      "Secure payment confirms the order and starts the professional build.",
  },
  {
    title: "Professional build",
    description:
      "Your approved preview is refined into the final production website.",
  },
  {
    title: "Quality assurance",
    description:
      "Beacon tests layout, content, forms, links and mobile responsiveness.",
  },
  {
    title: "Website live",
    description:
      "Your domain is connected and the finished website is published.",
  },
];

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

function ModuleCard({
  module,
  hasPro,
}: {
  module: DashboardModule;
  hasPro: boolean;
}) {
  const locked = Boolean(module.proOnly && !hasPro);
  const available =
    module.status === "available" &&
    !locked &&
    typeof module.href === "string";

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl"
        >
          {module.icon}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
            locked
              ? "bg-amber-100 text-amber-900"
              : module.status === "available"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-200 text-slate-700"
          }`}
        >
          {locked
            ? "Pro"
            : module.status === "available"
              ? "Available"
              : "Coming soon"}
        </span>
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-950">
        {module.title}
      </h3>

      <p className="mt-3 leading-7 text-slate-600">{module.description}</p>

      <div className="mt-5 font-black text-blue-950">
        {locked
          ? "Upgrade to unlock"
          : module.status === "available"
            ? "Open module →"
            : "In development"}
      </div>
    </>
  );

  if (available && module.href) {
    return (
      <Link
        className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
        href={module.href}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      {content}
    </article>
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
  const [loaded, setLoaded] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
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
    }

    const parsedMembership = parseStoredMembership(savedMembership);

    if (parsedMembership) {
      setMembership(parsedMembership);
    } else if (savedMembership) {
      window.localStorage.removeItem(MEMBERSHIP_STORAGE_KEY);
    }

    setLoaded(true);
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
  const currentProgressIndex = hasBeenSubmitted ? 1 : 0;
  const hasPro = membership?.planId === "business_pro";

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
                  : "Your business. One workspace."}
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                Manage your website, quotes, invoices, customers, documents,
                brand and membership from one clear business control centre.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/business/website"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-extrabold text-blue-950 transition hover:bg-blue-50"
              >
                {brief ? "Manage website" : "Create website"}
              </Link>

              <Link
                href="/business/memberships"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                Membership
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Website
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {brief ? "In progress" : "Not started"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {brief
                  ? packages[brief.packageId].name
                  : "Create your first website brief."}
              </p>
            </article>

            <Link
              href="/business/quotes"
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Quotes
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                Open
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create, save and manage professional quotations.
              </p>
              <p className="mt-4 font-black text-blue-950">
                Open Beacon Quote →
              </p>
            </Link>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Invoices
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">0</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Invoice Builder is coming soon.
              </p>
            </article>

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
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
              Modules
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Everything your business needs in one place.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardModules.map((module) => (
              <ModuleCard hasPro={hasPro} key={module.title} module={module} />
            ))}
          </div>
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
        <>
          <section className="px-6 pb-10">
            <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
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
          </section>

          <section className="px-6 pb-20">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-8">
                <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                        Website Project
                      </p>

                      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                        {hasBeenSubmitted
                          ? "Your brief is ready for preview generation."
                          : "Your website brief is still in progress."}
                      </h2>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-extrabold ${
                        hasBeenSubmitted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {hasBeenSubmitted ? "Brief complete" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-5 leading-7 text-slate-600">
                    {hasBeenSubmitted
                      ? "Beacon has the business information needed to prepare your interactive preview. No payment has been taken."
                      : "Return to the Website Builder to review and complete the remaining information."}
                  </p>

                  <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-4">
                    <p className="text-sm font-bold text-slate-500">
                      Last completed
                    </p>

                    <p className="mt-1 font-black text-slate-950">
                      {formatDate(brief.submittedAt, true)}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
                </article>

                <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-8">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                    Business Details
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Your core business information.
                  </h2>

                  <dl className="mt-7 grid gap-5 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <dt className="text-sm font-bold text-slate-500">
                        Business type
                      </dt>
                      <dd className="mt-2 font-black text-slate-950">
                        {brief.businessType || "Not provided"}
                      </dd>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <dt className="text-sm font-bold text-slate-500">
                        Service area
                      </dt>
                      <dd className="mt-2 font-black text-slate-950">
                        {brief.serviceArea || "Not provided"}
                      </dd>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <dt className="text-sm font-bold text-slate-500">
                        Phone
                      </dt>
                      <dd className="mt-2 font-black text-slate-950">
                        {brief.phone || "Not provided"}
                      </dd>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <dt className="text-sm font-bold text-slate-500">
                        Email
                      </dt>
                      <dd className="mt-2 break-all font-black text-slate-950">
                        {brief.email || "Not provided"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm font-bold text-slate-500">
                      Main business message
                    </p>

                    <p className="mt-2 leading-7 text-slate-800">
                      {brief.keyMessage || "Not provided"}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-200 p-5">
                    <span
                      className="h-12 w-12 rounded-2xl border border-slate-200"
                      style={{
                        backgroundColor: brief.primaryColour || "#0f3d91",
                      }}
                      title={brief.primaryColour}
                    />

                    <span
                      className="h-12 w-12 rounded-2xl border border-slate-200"
                      style={{
                        backgroundColor: brief.secondaryColour || "#d4af37",
                      }}
                      title={brief.secondaryColour}
                    />

                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Brand direction
                      </p>

                      <p className="mt-1 font-black text-slate-950">
                        {brief.styleDirection || "Not provided"}
                      </p>
                    </div>
                  </div>
                </article>
              </div>

              <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-8 lg:sticky lg:top-6">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Website Progress
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  From brief to website live.
                </h2>

                <div className="mt-8 space-y-4">
                  {progressSteps.map((progress, index) => {
                    const complete = index < currentProgressIndex;
                    const current = index === currentProgressIndex;

                    return (
                      <div
                        key={progress.title}
                        className={`rounded-2xl border p-5 ${
                          complete
                            ? "border-emerald-200 bg-emerald-50"
                            : current
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black ${
                              complete
                                ? "bg-emerald-600 text-white"
                                : current
                                  ? "bg-blue-950 text-white"
                                  : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {complete ? "✓" : index + 1}
                          </span>

                          <div>
                            <p className="font-black text-slate-950">
                              {progress.title}
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {progress.description}
                            </p>

                            {current ? (
                              <span className="mt-3 inline-flex rounded-full bg-blue-950 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
                                Current stage
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-6 rounded-2xl bg-blue-950 px-5 py-4 text-sm font-semibold leading-6 text-blue-100">
                  The professional build is expected to take approximately 2–4
                  weeks after payment and final approval.
                </p>
              </aside>
            </div>
          </section>
        </>
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
              Website Module
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Create your first website project.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Your wider business workspace is ready. Start the Website Builder
              when you are ready to create your online presence.
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