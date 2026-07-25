"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type MembershipPlanId = "business" | "business_pro";

type MembershipPlan = {
  id: MembershipPlanId;
  name: string;
  price: string;
  description: string;
  badge?: string;
  featured?: boolean;
  features: string[];
};

const plans: MembershipPlan[] = [
  {
    id: "business",
    name: "Beacon Business",
    price: "£19.99",
    description:
      "Everything a startup, sole trader or growing small business needs to manage its online presence and day-to-day work.",
    features: [
      "Website Builder",
      "Secure website hosting",
      "SSL certificate management",
      "Beacon Quote",
      "Beacon Invoices",
      "Business Templates",
      "Customer Manager",
      "Brand Kit",
      "Beacon AI Assistant",
      "Business Dashboard",
      "Website maintenance",
      "Email support",
    ],
  },
  {
    id: "business_pro",
    name: "Beacon Business Pro",
    price: "£29.99",
    description:
      "Advanced tools, priority support and growth features for businesses ready to go further.",
    badge: "Most Popular",
    featured: true,
    features: [
      "Everything in Beacon Business",
      "Priority support",
      "Advanced analytics",
      "SEO monitoring",
      "Performance optimisation",
      "Team member access",
      "AI automations",
      "Premium templates",
      "Monthly performance report",
      "Quarterly business review",
      "Personalised growth recommendations",
      "Future Pro modules",
    ],
  },
];

const comparisonRows = [
  ["Website Builder", "Included", "Included"],
  ["Secure hosting", "Included", "Included"],
  ["SSL certificate management", "Included", "Included"],
  ["Website maintenance", "Included", "Included"],
  ["Beacon Quote", "Included", "Included"],
  ["Beacon Invoices", "Included", "Included"],
  ["Business Templates", "Included", "Premium library"],
  ["Customer Manager", "Included", "Included"],
  ["Brand Kit", "Included", "Included"],
  ["Beacon AI Assistant", "Included", "Advanced features"],
  ["Business Dashboard", "Included", "Included"],
  ["Support", "Email support", "Priority support"],
  ["Advanced analytics", "Not included", "Included"],
  ["SEO monitoring", "Not included", "Included"],
  ["Team member access", "Not included", "Included"],
  ["AI automations", "Not included", "Included"],
  ["Growth reports", "Not included", "Included"],
  ["Quarterly business review", "Not included", "Included"],
] as const;

const faqs = [
  {
    question: "When does billing begin?",
    answer:
      "Your first payment is taken after the 14-day free trial ends. You can cancel before the trial finishes and you will not be charged.",
  },
  {
    question: "Is there a setup fee?",
    answer:
      "No. There is no membership setup fee for either Beacon Business plan.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes. You can cancel during the free trial or at any time after your paid membership begins.",
  },
  {
    question: "Can I upgrade to Beacon Business Pro later?",
    answer:
      "Yes. You can upgrade when your business needs priority support, advanced reporting, team access or additional growth features.",
  },
  {
    question: "Does the membership include the Website Builder?",
    answer:
      "Yes. Every Beacon Business membership includes access to the Website Builder and the wider business platform. If you would like Beacon to professionally design and build the website for you, that service is purchased separately.",
  },
  {
    question: "What business tools are included?",
    answer:
      "Beacon Business is designed to include websites, quotes, invoices, business templates, customer records, brand management, an AI assistant and one central dashboard.",
  },
  {
    question: "Can I use Beacon Business without buying a website build?",
    answer:
      "Yes. You can join Beacon Business for its quotes, invoices, templates, customer tools and other modules even if you do not purchase a professionally built website.",
  },
  {
    question: "Can Beacon support a website built elsewhere?",
    answer:
      "Beacon can review an existing website first. Hosting, maintenance or integration support may be available where the website and technology are suitable.",
  },
];

const platformModules = [
  {
    title: "Websites",
    icon: "🌐",
    description:
      "Build and maintain your professional online presence from the same business workspace.",
  },
  {
    title: "Quotes",
    icon: "📋",
    description:
      "Create clear, professional quotations with labour, materials, discounts and VAT.",
  },
  {
    title: "Invoices",
    icon: "🧾",
    description:
      "Create invoices, manage due dates and track paid, unpaid and overdue work.",
  },
  {
    title: "Customers",
    icon: "👥",
    description:
      "Keep customer details, notes, quotes, invoices and future work connected.",
  },
  {
    title: "Templates",
    icon: "📄",
    description:
      "Start with practical documents for contracts, policies, emails and business operations.",
  },
  {
    title: "Brand Kit",
    icon: "🎨",
    description:
      "Store your logo, colours, contact details and company information once.",
  },
  {
    title: "AI Assistant",
    icon: "🤖",
    description:
      "Draft customer replies, improve content and create business documents faster.",
  },
  {
    title: "Dashboard",
    icon: "📊",
    description:
      "See quotes, invoices, customers, website status and membership in one place.",
  },
];

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function BusinessMembershipsPage() {
  const [loadingPlan, setLoadingPlan] =
    useState<MembershipPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = useMemo(() => loadingPlan !== null, [loadingPlan]);

  async function startTrial(planId: MembershipPlanId) {
    if (isLoading) return;

    setLoadingPlan(planId);
    setError(null);

    try {
      const response = await fetch("/api/business/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.error ?? "We could not start your membership checkout.",
        );
      }

      if (!data?.url) {
        throw new Error(
          "Stripe checkout did not return a valid payment link.",
        );
      }

      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Something went wrong while starting checkout.",
      );
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.18),transparent_32%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              14-day free trial on both plans
            </div>

            <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Run your business from one trusted platform.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Build your website, create professional quotes and invoices,
              manage customers, organise your branding and use practical AI to
              help your business grow.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-7 py-4 text-base font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={isLoading}
                onClick={() => startTrial("business_pro")}
                type="button"
              >
                Start 14-Day Free Trial
                <ArrowIcon />
              </button>

              <a
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-7 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/10 sm:w-auto"
                href="#compare"
              >
                Compare Plans
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm font-semibold text-slate-300">
              {[
                "No membership setup fee",
                "Cancel any time",
                "Automatic billing after trial",
                "Secure Stripe checkout",
              ].map((item) => (
                <span className="inline-flex items-center gap-2" key={item}>
                  <span className="text-emerald-400">
                    <CheckIcon />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-slate-950 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              One connected platform
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              More than a website membership
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Beacon Business brings the tools you use every day into one
              organised workspace.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {platformModules.map((module) => (
              <article
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                key={module.title}
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl"
                >
                  {module.icon}
                </span>

                <h3 className="mt-5 text-xl font-black">{module.title}</h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {module.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 text-slate-950 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              Beacon Business Memberships
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Choose the support your business needs
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Both plans include the Beacon Business platform and begin with a
              14-day free trial.
            </p>
          </div>

          {error ? (
            <div
              className="mx-auto mt-10 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center font-semibold text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {plans.map((plan) => (
              <article
                className={`relative flex h-full flex-col rounded-3xl border bg-white p-7 shadow-sm sm:p-9 ${
                  plan.featured
                    ? "border-blue-600 shadow-xl shadow-blue-950/10"
                    : "border-slate-200"
                }`}
                key={plan.id}
              >
                {plan.badge ? (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-700 px-5 py-2 text-sm font-black text-white shadow-lg">
                    {plan.badge}
                  </div>
                ) : null}

                <div>
                  <h3 className="text-2xl font-black">{plan.name}</h3>
                  <p className="mt-4 min-h-14 leading-7 text-slate-600">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-8 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight">
                    {plan.price}
                  </span>
                  <span className="pb-1.5 font-bold text-slate-500">
                    /month
                  </span>
                </div>

                <div className="mt-3 text-sm font-bold text-emerald-700">
                  14 days free, then billed monthly
                </div>

                <div className="mt-8 h-px bg-slate-200" />

                <ul className="mt-8 flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      className="flex items-start gap-3 font-semibold text-slate-700"
                      key={feature}
                    >
                      <span className="mt-0.5 text-blue-700">
                        <CheckIcon />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-9 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    plan.featured
                      ? "bg-blue-700 text-white hover:bg-blue-800"
                      : "border-2 border-slate-950 bg-white text-slate-950 hover:bg-slate-950 hover:text-white"
                  }`}
                  disabled={isLoading}
                  onClick={() => startTrial(plan.id)}
                  type="button"
                >
                  {loadingPlan === plan.id
                    ? "Opening secure checkout..."
                    : "Start Free Trial"}
                  {loadingPlan !== plan.id ? <ArrowIcon /> : null}
                </button>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-slate-500">
            Both plans include access to Beacon Business tools. A bespoke
            website designed and built by Beacon is a separate professional
            service.
          </p>
        </div>
      </section>

      <section
        className="border-y border-slate-200 bg-white px-6 py-20 text-slate-950 lg:px-8"
        id="compare"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              Compare Plans
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              See exactly what is included
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Choose the core platform or unlock additional support, analytics
              and growth tools with Beacon Business Pro.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-6 py-5 text-sm font-black uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-5 text-sm font-black uppercase tracking-wider">
                      Beacon Business
                    </th>
                    <th className="px-6 py-5 text-sm font-black uppercase tracking-wider">
                      Beacon Business Pro
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {comparisonRows.map(
                    ([feature, business, pro], index) => (
                      <tr
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-slate-50"
                        }
                        key={feature}
                      >
                        <th className="border-t border-slate-200 px-6 py-5 font-black text-slate-900">
                          {feature}
                        </th>
                        <td className="border-t border-slate-200 px-6 py-5 font-semibold text-slate-600">
                          {business}
                        </td>
                        <td className="border-t border-slate-200 px-6 py-5 font-semibold text-slate-700">
                          {pro}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 text-slate-950 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              How It Works
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Start building your business workspace
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "01",
                "Choose your plan",
                "Select Beacon Business or Beacon Business Pro.",
              ],
              [
                "02",
                "Start free",
                "Your 14-day free trial begins when you subscribe.",
              ],
              [
                "03",
                "Set up your workspace",
                "Add your business details, branding and customers.",
              ],
              [
                "04",
                "Run your business",
                "Create quotes, invoices, templates and manage your website.",
              ],
            ].map(([number, title, text]) => (
              <article
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
                key={number}
              >
                <div className="text-sm font-black tracking-[0.2em] text-blue-700">
                  {number}
                </div>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-slate-950 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              Frequently Asked Questions
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Clear answers before you subscribe
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <details
                className="group rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5"
                key={faq.question}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-slate-950">
                  <span>{faq.question}</span>
                  <span className="text-2xl leading-none text-blue-700 transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-blue-800 px-6 py-20 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(245,158,11,0.18),transparent_32%)]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-100">
            Built with trust. Guided by purpose.
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Everything your business needs. One trusted platform.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">
            Build your online presence, create professional documents and
            manage your business with Beacon Business.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              onClick={() => startTrial("business")}
              type="button"
            >
              Start Beacon Business
              <ArrowIcon />
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-7 py-4 font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              onClick={() => startTrial("business_pro")}
              type="button"
            >
              Start Beacon Business Pro
              <ArrowIcon />
            </button>
          </div>

          <div className="mt-8">
            <Link
              className="font-bold text-blue-100 underline decoration-blue-300/60 underline-offset-4 transition hover:text-white"
              href="/business"
            >
              Return to Beacon Business
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}