"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PackageId = "starter" | "business" | "premium";
type ReviewDecision = "changes" | "approved" | null;

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

type ReviewData = {
  decision: ReviewDecision;
  overallFeedback: string;
  contentChanges: string;
  designChanges: string;
  featureChanges: string;
  contactChanges: string;
  approvedAt?: string;
  submittedAt?: string;
};

const BRIEF_STORAGE_KEY = "beacon-business-website-brief";
const REVIEW_STORAGE_KEY = "beacon-business-preview-review";
const SCOPE_STORAGE_KEY = "beacon-business-final-scope";

const packageDetails = {
  starter: {
    name: "Starter Website",
    price: 150,
    description:
      "A focused professional website for a small business that needs a strong online presence.",
    features: [
      "Up to 3 core pages",
      "Mobile-responsive layout",
      "Contact form",
      "Basic search optimisation",
      "Domain connection support",
    ],
  },
  business: {
    name: "Business Website",
    price: 350,
    description:
      "A fuller business website with more room for services, trust content and customer enquiries.",
    features: [
      "Up to 7 core pages",
      "Mobile-responsive layout",
      "Enhanced contact and enquiry forms",
      "Business-focused SEO structure",
      "Analytics setup",
      "Domain connection support",
    ],
  },
  premium: {
    name: "Premium Website",
    price: 600,
    description:
      "A larger tailored website for businesses requiring more content, functionality and design depth.",
    features: [
      "Expanded page structure",
      "Tailored layouts and sections",
      "Advanced enquiry journeys",
      "Enhanced SEO structure",
      "Analytics setup",
      "Priority design planning",
      "Domain connection support",
    ],
  },
} satisfies Record<
  PackageId,
  {
    name: string;
    price: number;
    description: string;
    features: string[];
  }
>;

const moduleDetails = [
  {
    key: "chatbot" as const,
    name: "AI Chatbot",
    price: 50,
    description:
      "An AI-assisted website chat experience configured around your business information.",
  },
  {
    key: "onlineShop" as const,
    name: "Online Shop",
    price: 50,
    description:
      "A structured online shop section for presenting products and supporting customer purchases.",
  },
  {
    key: "membershipArea" as const,
    name: "Membership Area",
    price: 37.5,
    description:
      "A protected area for registered customers or members to access private content.",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Not approved";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not approved";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function FinalScope() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const savedBrief = window.localStorage.getItem(BRIEF_STORAGE_KEY);
    const savedReview = window.localStorage.getItem(REVIEW_STORAGE_KEY);
    const savedScope = window.localStorage.getItem(SCOPE_STORAGE_KEY);

    if (savedBrief) {
      try {
        setBrief(JSON.parse(savedBrief) as BriefData);
      } catch {
        window.localStorage.removeItem(BRIEF_STORAGE_KEY);
      }
    }

    if (savedReview) {
      try {
        setReview(JSON.parse(savedReview) as ReviewData);
      } catch {
        window.localStorage.removeItem(REVIEW_STORAGE_KEY);
      }
    }

    if (savedScope) {
      try {
        const parsed = JSON.parse(savedScope) as {
          accepted?: boolean;
          confirmed?: boolean;
        };

        setAccepted(Boolean(parsed.accepted));
        setConfirmed(Boolean(parsed.confirmed));
      } catch {
        window.localStorage.removeItem(SCOPE_STORAGE_KEY);
      }
    }

    setLoaded(true);
  }, []);

  const selectedModules = useMemo(() => {
    if (!brief) {
      return [];
    }

    return moduleDetails.filter((module) => brief[module.key]);
  }, [brief]);

  const packagePrice = brief ? packageDetails[brief.packageId].price : 0;

  const modulesTotal = useMemo(
    () => selectedModules.reduce((sum, module) => sum + module.price, 0),
    [selectedModules]
  );

  const total = packagePrice + modulesTotal;

  const confirmScope = () => {
    if (!accepted || !brief) {
      return;
    }

    const scope = {
      accepted: true,
      confirmed: true,
      businessName: brief.businessName,
      packageId: brief.packageId,
      modules: selectedModules.map((module) => module.key),
      packagePrice,
      modulesTotal,
      total,
      confirmedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify(scope));
    setConfirmed(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

  if (!brief) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-2xl">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 text-3xl">
            📋
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
            Final Scope
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Complete your website brief first.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Beacon needs your website package, modules and business details
            before a final scope can be prepared.
          </p>

          <Link
            href="/business/website"
            className="mt-8 inline-flex rounded-2xl bg-blue-950 px-8 py-4 font-extrabold text-white transition hover:bg-blue-900"
          >
            Create website brief
          </Link>
        </div>
      </section>
    );
  }

  const approved = review?.decision === "approved" && Boolean(review.approvedAt);

  if (!approved) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-amber-200 bg-white p-10 text-center shadow-2xl">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-3xl text-white">
            !
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-amber-700">
            Approval Required
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Approve the website direction first.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            The final scope only becomes available after the website preview has
            been reviewed and approved.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/business/preview"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-7 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
            >
              View preview
            </Link>

            <Link
              href="/business/preview/review"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900"
            >
              Review and approve
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (confirmed) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-2xl sm:p-12">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-3xl font-black text-white">
            ✓
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-emerald-700">
            Final Scope Confirmed
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Your order is ready for secure checkout.
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            The package, optional modules and estimated total have been
            confirmed. No payment has been taken on this page.
          </p>

          <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-slate-50 p-6 text-left">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <span className="font-bold text-slate-600">Business</span>
              <span className="font-black text-slate-950">
                {brief.businessName}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-4">
              <span className="font-bold text-slate-600">Package</span>
              <span className="font-black text-slate-950">
                {packageDetails[brief.packageId].name}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <span className="font-bold text-slate-600">Total</span>
              <span className="text-3xl font-black text-blue-950">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-left text-sm font-semibold leading-6 text-blue-950">
            The next page will connect this confirmed scope to the secure
            payment flow. Until that payment route is connected, no charge can
            be made.
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900"
            >
              Return to dashboard
            </Link>

            <button
              type="button"
              onClick={() => setConfirmed(false)}
              className="rounded-2xl border border-slate-300 px-7 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
            >
              Review scope again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
            Final Scope
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Review exactly what is included before payment.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
            Your approved website direction has been converted into a clear
            package and module summary. Confirm it only when everything is
            correct.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/business/preview"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-extrabold text-blue-950 transition hover:bg-blue-50"
            >
              View approved preview
            </Link>

            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-extrabold text-white transition hover:bg-white/20"
            >
              Business dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                Website Package
              </p>

              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">
                    {packageDetails[brief.packageId].name}
                  </h2>

                  <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                    {packageDetails[brief.packageId].description}
                  </p>
                </div>

                <p className="shrink-0 text-3xl font-black text-blue-950">
                  {brief.packageId === "premium"
                    ? `From ${formatCurrency(packagePrice)}`
                    : formatCurrency(packagePrice)}
                </p>
              </div>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {packageDetails[brief.packageId].features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4 font-semibold text-slate-800"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                      ✓
                    </span>

                    {feature}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                Optional Modules
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Additional functionality selected.
              </h2>

              {selectedModules.length ? (
                <div className="mt-7 space-y-4">
                  {selectedModules.map((module) => (
                    <div
                      key={module.key}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <h3 className="text-xl font-black text-slate-950">
                          {module.name}
                        </h3>

                        <p className="mt-2 leading-7 text-slate-600">
                          {module.description}
                        </p>
                      </div>

                      <p className="shrink-0 text-xl font-black text-blue-950">
                        {formatCurrency(module.price)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-7 rounded-2xl bg-slate-50 p-6">
                  <p className="font-black text-slate-950">
                    No optional modules selected.
                  </p>

                  <p className="mt-2 leading-7 text-slate-600">
                    Your selected package can proceed without additional
                    modules. Modules can be added later if required.
                  </p>
                </div>
              )}
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                Approved Direction
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Project information confirmed.
              </h2>

              <dl className="mt-7 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <dt className="text-sm font-bold text-slate-500">
                    Business
                  </dt>
                  <dd className="mt-2 font-black text-slate-950">
                    {brief.businessName}
                  </dd>
                </div>

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
                    Approved
                  </dt>
                  <dd className="mt-2 font-black text-slate-950">
                    {formatDate(review?.approvedAt)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-500">
                  Main website message
                </p>

                <p className="mt-2 leading-7 text-slate-800">
                  {brief.keyMessage || "Not provided"}
                </p>
              </div>
            </article>
          </div>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl lg:sticky lg:top-6">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Order Summary
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              {brief.businessName}
            </h2>

            <div className="mt-7 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="font-black text-slate-950">
                    {packageDetails[brief.packageId].name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Website package</p>
                </div>

                <p className="font-black text-slate-950">
                  {formatCurrency(packagePrice)}
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
                    Estimated total
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Final technical scope may affect premium custom work.
                  </p>
                </div>

                <p className="text-3xl font-black text-blue-950">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>

            <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => {
                  setAccepted(event.target.checked);
                  setConfirmed(false);
                }}
                className="mt-1 h-5 w-5 rounded border-slate-300 accent-blue-950"
              />

              <span className="text-sm font-semibold leading-6 text-slate-700">
                I confirm that the package, selected modules and business
                details shown above are correct.
              </span>
            </label>

            <button
              type="button"
              disabled={!accepted}
              onClick={confirmScope}
              className="mt-5 w-full rounded-2xl bg-blue-950 px-6 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              Confirm final scope
            </button>

            <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
              Confirming this scope does not take payment.
            </p>

            <Link
              href="/business/website"
              className="mt-5 block text-center text-sm font-bold text-blue-900 underline underline-offset-4"
            >
              Change package or modules
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}