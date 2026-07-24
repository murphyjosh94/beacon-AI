"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

const STORAGE_KEY = "beacon-business-website-brief";

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

const modules = [
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

function formatDate(value?: string) {
  if (!value) {
    return "Not submitted yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not submitted yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function BusinessDashboard() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedBrief = window.localStorage.getItem(STORAGE_KEY);

    if (!savedBrief) {
      setLoaded(true);
      return;
    }

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
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  const selectedModules = useMemo(() => {
    if (!brief) {
      return [];
    }

    return modules.filter((module) => brief[module.key]);
  }, [brief]);

  const estimatedTotal = useMemo(() => {
    if (!brief) {
      return 0;
    }

    const packagePrice = packages[brief.packageId].price;
    const modulePrice = selectedModules.reduce(
      (sum, module) => sum + module.price,
      0
    );

    return packagePrice + modulePrice;
  }, [brief, selectedModules]);

  if (!loaded) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-5 h-12 max-w-2xl rounded bg-slate-200" />
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="h-36 rounded-3xl bg-slate-100" />
              <div className="h-36 rounded-3xl bg-slate-100" />
              <div className="h-36 rounded-3xl bg-slate-100" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!brief) {
    return (
      <section className="relative overflow-hidden px-6 py-24">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-2xl sm:p-12">
          <span
            aria-hidden="true"
            className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 text-3xl"
          >
            🏢
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
            Beacon Business Dashboard
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Start by creating your website brief.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Your dashboard will show your selected package, website modules,
            business details and progress once the guided brief is complete.
          </p>

          <Link
            href="/business/website"
            className="mt-8 inline-flex rounded-2xl bg-blue-950 px-8 py-4 text-lg font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-900"
          >
            Create my website brief
          </Link>
        </div>
      </section>
    );
  }

  const hasBeenSubmitted = Boolean(brief.submittedAt);
  const currentProgressIndex = hasBeenSubmitted ? 1 : 0;

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
                Welcome, {brief.businessName}.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                Review your website brief, package, selected modules and current
                project progress from one clear workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/business/website"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-extrabold text-blue-950 transition hover:bg-blue-50"
              >
                Edit website brief
              </Link>

              <Link
                href="/business"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                Explore Beacon Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
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
              Optional Modules
            </p>

            <p className="mt-4 text-3xl font-black text-slate-950">
              {selectedModules.length}
            </p>

            <p className="mt-2 leading-6 text-slate-600">
              {selectedModules.length === 0
                ? "No additional modules selected."
                : selectedModules.map((module) => module.name).join(", ")}
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Estimated Configuration
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
                  : "Return to the website builder to review and complete the remaining information."}
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-sm font-bold text-slate-500">
                  Last completed
                </p>

                <p className="mt-1 font-black text-slate-950">
                  {formatDate(brief.submittedAt)}
                </p>
              </div>

              <Link
                href="/business/website"
                className="mt-6 inline-flex rounded-2xl bg-blue-950 px-6 py-3 font-extrabold text-white transition hover:bg-blue-900"
              >
                {hasBeenSubmitted ? "Review my brief" : "Continue my brief"}
              </Link>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                Business Details
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Information powering your website.
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
                  <dt className="text-sm font-bold text-slate-500">Phone</dt>
                  <dd className="mt-2 font-black text-slate-950">
                    {brief.phone || "Not provided"}
                  </dd>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <dt className="text-sm font-bold text-slate-500">Email</dt>
                  <dd className="mt-2 break-all font-black text-slate-950">
                    {brief.email || "Not provided"}
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

              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-200 p-5">
                <span
                  className="h-12 w-12 rounded-2xl border border-slate-200"
                  style={{ backgroundColor: brief.primaryColour }}
                  title={brief.primaryColour}
                />

                <span
                  className="h-12 w-12 rounded-2xl border border-slate-200"
                  style={{ backgroundColor: brief.secondaryColour }}
                  title={brief.secondaryColour}
                />

                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Design direction
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    {brief.styleDirection}
                  </p>
                </div>
              </div>
            </article>
          </div>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-8 lg:sticky lg:top-6">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Project Progress
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
  );
}