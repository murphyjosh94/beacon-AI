"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type PackageId = "starter" | "business" | "premium";

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

type ScopeData = {
  accepted: boolean;
  confirmed: boolean;
  businessName: string;
  packageId: PackageId;
  modules: string[];
  packagePrice: number;
  modulesTotal: number;
  total: number;
  confirmedAt: string;
};

const BRIEF_STORAGE_KEY = "beacon-business-website-brief";
const SCOPE_STORAGE_KEY = "beacon-business-final-scope";

const packageNames: Record<PackageId, string> = {
  starter: "Starter Website",
  business: "Business Website",
  premium: "Premium Website",
};

const moduleNames: Record<string, string> = {
  chatbot: "AI Chatbot",
  onlineShop: "Online Shop",
  membershipArea: "Membership Area",
};

const modulePrices: Record<string, number> = {
  chatbot: 50,
  onlineShop: 50,
  membershipArea: 37.5,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Not confirmed";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not confirmed";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function CheckoutSummary() {
  const searchParams = useSearchParams();

  const [brief, setBrief] = useState<BriefData | null>(null);
  const [scope, setScope] = useState<ScopeData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedStart, setAcceptedStart] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const cancelled = searchParams.get("cancelled") === "1";

  useEffect(() => {
    const savedBrief = window.localStorage.getItem(BRIEF_STORAGE_KEY);
    const savedScope = window.localStorage.getItem(SCOPE_STORAGE_KEY);

    if (savedBrief) {
      try {
        setBrief(JSON.parse(savedBrief) as BriefData);
      } catch {
        window.localStorage.removeItem(BRIEF_STORAGE_KEY);
      }
    }

    if (savedScope) {
      try {
        setScope(JSON.parse(savedScope) as ScopeData);
      } catch {
        window.localStorage.removeItem(SCOPE_STORAGE_KEY);
      }
    }

    setLoaded(true);
  }, []);

  const selectedModules = useMemo(() => {
    if (!scope) {
      return [];
    }

    return scope.modules.map((key) => ({
      key,
      name: moduleNames[key] ?? key,
      price: modulePrices[key] ?? 0,
    }));
  }, [scope]);

  const canContinue =
    Boolean(scope?.confirmed) &&
    Boolean(scope?.accepted) &&
    acceptedTerms &&
    acceptedStart &&
    !checkoutLoading;

  const beginCheckout = async () => {
    if (!brief || !scope || !canContinue) {
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/business/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: brief.businessName,
          email: brief.email,
          packageId: scope.packageId,
          modules: scope.modules,
          scopeConfirmed: scope.confirmed && scope.accepted,
        }),
      });

      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Unable to start secure checkout.");
      }

      window.location.assign(result.url);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Unable to start secure checkout."
      );
      setCheckoutLoading(false);
    }
  };

  if (!loaded) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl animate-pulse rounded-[2rem] bg-white p-10 shadow-xl">
          <div className="h-8 w-52 rounded bg-slate-200" />
          <div className="mt-6 h-80 rounded-[2rem] bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!brief || !scope?.confirmed || !scope.accepted) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-amber-200 bg-white p-10 text-center shadow-2xl">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-3xl font-black text-white">
            !
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-amber-700">
            Confirmed Scope Required
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Confirm your final website scope first.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Checkout remains locked until the approved package, optional
            modules and estimated total have been reviewed and confirmed.
          </p>

          <Link
            href="/business/final-scope"
            className="mt-8 inline-flex rounded-2xl bg-blue-950 px-8 py-4 font-extrabold text-white transition hover:bg-blue-900"
          >
            Review final scope
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
            Secure Checkout
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            One final review before payment.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
            The server will rebuild and validate your order before sending you
            to Stripe. Prices stored in the browser are never trusted.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_390px]">
          <div className="space-y-8">
            {cancelled ? (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
                <p className="font-black text-amber-950">
                  Checkout was cancelled.
                </p>

                <p className="mt-2 leading-7 text-amber-900">
                  No payment was taken. Your confirmed scope is still available
                  and you can return to secure checkout when ready.
                </p>
              </div>
            ) : null}

            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                Customer Details
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {brief.businessName}
              </h2>

              <dl className="mt-7 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <dt className="text-sm font-bold text-slate-500">
                    Contact email
                  </dt>
                  <dd className="mt-2 break-all font-black text-slate-950">
                    {brief.email || "Not provided"}
                  </dd>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <dt className="text-sm font-bold text-slate-500">
                    Telephone
                  </dt>
                  <dd className="mt-2 font-black text-slate-950">
                    {brief.phone || "Not provided"}
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
                    Scope confirmed
                  </dt>
                  <dd className="mt-2 font-black text-slate-950">
                    {formatDate(scope.confirmedAt)}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                Payment Protection
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Your order is validated securely.
              </h2>

              <div className="mt-8 space-y-4">
                {[
                  "The website package price is calculated again on the server.",
                  "Every optional module is checked against Beacon’s approved catalogue.",
                  "Duplicate or unknown modules are rejected.",
                  "Stripe receives the validated server-side order rather than browser totals.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl bg-slate-50 p-5"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                      ✓
                    </span>

                    <p className="font-semibold leading-7 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-blue-200 bg-blue-50 p-7 sm:p-8">
              <p className="font-black text-blue-950">
                Estimated completion: approximately 2–4 weeks
              </p>

              <p className="mt-3 leading-7 text-blue-900">
                The estimated build period begins after successful payment,
                final content availability and confirmation that Beacon has
                everything required to start.
              </p>
            </article>
          </div>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl lg:sticky lg:top-6">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Order Summary
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              {scope.businessName}
            </h2>

            <div className="mt-7 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="font-black text-slate-950">
                    {packageNames[scope.packageId]}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Website package
                  </p>
                </div>

                <p className="font-black text-slate-950">
                  {formatCurrency(scope.packagePrice)}
                </p>
              </div>

              {selectedModules.map((module) => (
                <div
                  key={module.key}
                  className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4"
                >
                  <div>
                    <p className="font-black text-slate-950">{module.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Optional module
                    </p>
                  </div>

                  <p className="font-black text-slate-950">
                    {formatCurrency(module.price)}
                  </p>
                </div>
              ))}

              <div className="flex items-end justify-between gap-4 pt-2">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Total payable
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Recalculated by the server before checkout.
                  </p>
                </div>

                <p className="text-3xl font-black text-blue-950">
                  {formatCurrency(scope.total)}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 accent-blue-950"
                />

                <span className="text-sm font-semibold leading-6 text-slate-700">
                  I confirm that the package, modules and total shown above are
                  correct.
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={acceptedStart}
                  onChange={(event) => setAcceptedStart(event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 accent-blue-950"
                />

                <span className="text-sm font-semibold leading-6 text-slate-700">
                  I understand that the estimated 2–4 week build period starts
                  after successful payment and receipt of required content.
                </span>
              </label>
            </div>

            {checkoutError ? (
              <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-800">
                {checkoutError}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canContinue}
              onClick={beginCheckout}
              className="mt-6 w-full rounded-2xl bg-blue-950 px-6 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {checkoutLoading
                ? "Opening secure checkout..."
                : "Continue to secure payment"}
            </button>

            <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
              Secure payment is completed on Stripe’s hosted checkout page.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/business/final-scope"
                className="text-center text-sm font-bold text-blue-900 underline underline-offset-4"
              >
                Review final scope
              </Link>

              <Link
                href="/business/dashboard"
                className="text-center text-sm font-bold text-slate-600 underline underline-offset-4"
              >
                Return to dashboard
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}