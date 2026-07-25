"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type TemplateStatus = "available" | "coming-soon";

type TemplateItem = {
  slug: string;
  title: string;
  description: string;
  time: string;
  status: TemplateStatus;
};

type TemplateCategory = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  templates: TemplateItem[];
};

const categories: TemplateCategory[] = [
  {
    id: "legal",
    eyebrow: "Legal",
    title: "Policies and legal documents",
    description:
      "Create practical starting points for the policies and terms your business may need.",
    icon: "⚖️",
    accent: "from-indigo-500/15 to-blue-500/5",
    templates: [
      {
        slug: "privacy-policy",
        title: "Privacy Policy",
        description:
          "Generate a UK-focused privacy policy using your saved business information and website details.",
        time: "About 3 minutes",
        status: "available",
      },
      {
        slug: "cookie-policy",
        title: "Cookie Policy",
        description:
          "Explain how your website uses cookies and similar technologies in clear language.",
        time: "About 3 minutes",
        status: "available",
      },
      {
        slug: "terms-and-conditions",
        title: "Terms & Conditions",
        description:
          "Create clear customer-facing terms based on how your business provides products or services.",
        time: "About 5 minutes",
        status: "available",
      },
      {
        slug: "refund-policy",
        title: "Refund Policy",
        description:
          "Set out your refund, cancellation and return approach in a professional format.",
        time: "About 3 minutes",
        status: "available",
      },
      {
        slug: "website-disclaimer",
        title: "Website Disclaimer",
        description:
          "Create a practical disclaimer tailored around your website content and business activity.",
        time: "About 3 minutes",
        status: "available",
      },
    ],
  },
  {
    id: "trade",
    eyebrow: "Trade",
    title: "Trade and site documents",
    description:
      "Prepare professional documents for site work, project safety and job completion.",
    icon: "🦺",
    accent: "from-amber-500/20 to-orange-500/5",
    templates: [
      {
        slug: "risk-assessment",
        title: "Risk Assessment",
        description:
          "Identify hazards, record controls and create a clear risk assessment for a job or site.",
        time: "About 5 minutes",
        status: "available",
      },
      {
        slug: "method-statement",
        title: "Method Statement",
        description:
          "Describe how work will be completed safely, clearly and in the correct sequence.",
        time: "About 5 minutes",
        status: "available",
      },
      {
        slug: "rams",
        title: "RAMS",
        description:
          "Combine a risk assessment and method statement into one professional document.",
        time: "About 7 minutes",
        status: "available",
      },
      {
        slug: "completion-certificate",
        title: "Job Completion Certificate",
        description:
          "Confirm that agreed work has been completed and record customer sign-off details.",
        time: "About 3 minutes",
        status: "available",
      },
      {
        slug: "site-visit-report",
        title: "Site Visit Report",
        description:
          "Record site observations, measurements, actions and supporting notes in one document.",
        time: "About 4 minutes",
        status: "available",
      },
    ],
  },
  {
    id: "customer",
    eyebrow: "Customer",
    title: "Customer communication",
    description:
      "Create consistent customer messages for each stage of a job or enquiry.",
    icon: "✉️",
    accent: "from-cyan-500/15 to-blue-500/5",
    templates: [
      {
        slug: "welcome-email",
        title: "Welcome Email",
        description:
          "Introduce your business, explain what happens next and create a professional first impression.",
        time: "About 2 minutes",
        status: "available",
      },
      {
        slug: "quote-follow-up",
        title: "Quote Follow-up",
        description:
          "Follow up on an existing Beacon Quote without sounding pushy or impersonal.",
        time: "About 2 minutes",
        status: "available",
      },
      {
        slug: "appointment-reminder",
        title: "Appointment Reminder",
        description:
          "Confirm the date, time, location and anything the customer should prepare.",
        time: "About 2 minutes",
        status: "available",
      },
      {
        slug: "invoice-reminder",
        title: "Invoice Reminder",
        description:
          "Create a polite payment reminder that can become firmer when an invoice is overdue.",
        time: "About 2 minutes",
        status: "available",
      },
      {
        slug: "thank-you-email",
        title: "Thank You Email",
        description:
          "Thank a customer after completed work and invite feedback or a future booking.",
        time: "About 2 minutes",
        status: "available",
      },
    ],
  },
  {
    id: "marketing",
    eyebrow: "Marketing",
    title: "Marketing content",
    description:
      "Create useful promotional content that stays consistent with your business and brand.",
    icon: "📣",
    accent: "from-pink-500/15 to-rose-500/5",
    templates: [
      {
        slug: "facebook-post",
        title: "Facebook Post",
        description:
          "Create a clear social post for an offer, update, completed job or business announcement.",
        time: "About 2 minutes",
        status: "available",
      },
      {
        slug: "instagram-post",
        title: "Instagram Post",
        description:
          "Create concise post copy, a useful call to action and relevant hashtag suggestions.",
        time: "About 2 minutes",
        status: "available",
      },
      {
        slug: "google-business-update",
        title: "Google Business Update",
        description:
          "Prepare an update for your Google Business Profile using clear local-business language.",
        time: "About 2 minutes",
        status: "available",
      },
      {
        slug: "promotional-email",
        title: "Promotional Email",
        description:
          "Create a branded offer email with a strong subject line and clear customer action.",
        time: "About 3 minutes",
        status: "available",
      },
      {
        slug: "seasonal-campaign",
        title: "Seasonal Campaign",
        description:
          "Plan coordinated seasonal messaging for social media, email and your website.",
        time: "About 5 minutes",
        status: "available",
      },
    ],
  },
  {
    id: "hr",
    eyebrow: "HR",
    title: "People and workplace documents",
    description:
      "Prepare consistent documents for recruitment, staff requests and workplace processes.",
    icon: "👥",
    accent: "from-emerald-500/15 to-teal-500/5",
    templates: [
      {
        slug: "offer-letter",
        title: "Offer Letter",
        description:
          "Create a professional offer letter with role, pay, start date and key conditions.",
        time: "About 4 minutes",
        status: "available",
      },
      {
        slug: "employment-contract",
        title: "Employment Contract",
        description:
          "Build a structured employment agreement using the details you provide.",
        time: "About 8 minutes",
        status: "available",
      },
      {
        slug: "holiday-request",
        title: "Holiday Request Form",
        description:
          "Create a simple and consistent process for requesting and approving annual leave.",
        time: "About 3 minutes",
        status: "available",
      },
      {
        slug: "staff-handbook",
        title: "Staff Handbook",
        description:
          "Create a practical starting structure for your main workplace policies and expectations.",
        time: "About 10 minutes",
        status: "available",
      },
      {
        slug: "disciplinary-letter",
        title: "Disciplinary Letter",
        description:
          "Prepare a clear letter for a formal workplace process using the facts you provide.",
        time: "About 4 minutes",
        status: "available",
      },
    ],
  },
  {
    id: "branding",
    eyebrow: "Branding",
    title: "Branded business assets",
    description:
      "Apply your saved Brand Kit to documents and everyday customer-facing materials.",
    icon: "🎨",
    accent: "from-violet-500/15 to-purple-500/5",
    templates: [
      {
        slug: "letterhead",
        title: "Business Letterhead",
        description:
          "Create a clean letterhead using your logo, colours, contact details and company information.",
        time: "About 3 minutes",
        status: "available",
      },
      {
        slug: "email-signature",
        title: "Email Signature",
        description:
          "Generate a consistent email signature using your contact details and brand identity.",
        time: "About 3 minutes",
        status: "available",
      },
      {
        slug: "business-card",
        title: "Business Card",
        description:
          "Prepare a branded business card layout using the information stored in your Brand Kit.",
        time: "About 4 minutes",
        status: "available",
      },
      {
        slug: "compliment-slip",
        title: "Compliment Slip",
        description:
          "Create a simple branded slip for customer orders, documents and deliveries.",
        time: "About 3 minutes",
        status: "available",
      },
    ],
  },
];

const totalTemplates = categories.reduce(
  (total, category) => total + category.templates.length,
  0,
);

function normalise(value: string) {
  return value.trim().toLowerCase();
}

export default function TemplatesClient() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredCategories = useMemo(() => {
    const normalisedQuery = normalise(query);

    return categories
      .filter(
        (category) =>
          activeCategory === "all" || category.id === activeCategory,
      )
      .map((category) => ({
        ...category,
        templates: category.templates.filter((template) => {
          if (!normalisedQuery) {
            return true;
          }

          const haystack = normalise(
            `${category.title} ${category.eyebrow} ${template.title} ${template.description}`,
          );

          return haystack.includes(normalisedQuery);
        }),
      }))
      .filter((category) => category.templates.length > 0);
  }, [activeCategory, query]);

  const visibleTemplateCount = filteredCategories.reduce(
    (total, category) => total + category.templates.length,
    0,
  );

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-20 text-white sm:py-24">
        <div
          aria-hidden="true"
          className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-36 left-1/4 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-white/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-200 backdrop-blur">
              <span aria-hidden="true">📄</span>
              Beacon Documents
            </div>

            <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Professional business documents in minutes.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-blue-100">
              Choose a document, answer a few practical questions and let Beacon
              prepare a professional first draft using your saved business
              information.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Uses your Brand Kit",
                "Improved with Beacon AI",
                "Built for UK businesses",
                "No quote-builder duplication",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100 backdrop-blur"
                >
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur sm:p-6">
            <label
              htmlFor="template-search"
              className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-100"
            >
              Search Beacon Documents
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl"
                >
                  🔎
                </span>
                <input
                  id="template-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search privacy policy, RAMS, follow-up email..."
                  className="w-full rounded-2xl border border-white/20 bg-white py-4 pl-14 pr-5 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-300/20"
                />
              </div>

              {(query || activeCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("all");
                  }}
                  className="rounded-2xl border border-white/25 bg-white/10 px-6 py-4 font-extrabold text-white transition hover:bg-white/20"
                >
                  Clear filters
                </button>
              )}
            </div>

            <p className="mt-3 text-sm font-semibold text-blue-100">
              Showing {visibleTemplateCount} of {totalTemplates} documents
            </p>
          </div>
        </div>
      </section>

      <section
        className="border-b border-slate-200 bg-white px-6 py-6"
        aria-label="Document categories"
      >
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 rounded-full px-5 py-3 text-sm font-extrabold transition ${
              activeCategory === "all"
                ? "bg-blue-950 text-white"
                : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
            }`}
          >
            All documents
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`shrink-0 rounded-full px-5 py-3 text-sm font-extrabold transition ${
                activeCategory === category.id
                  ? "bg-blue-950 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
              }`}
            >
              {category.icon} {category.eyebrow}
            </button>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          {filteredCategories.length > 0 ? (
            <div className="space-y-16">
              {filteredCategories.map((category) => (
                <section
                  key={category.id}
                  id={category.id}
                  className="scroll-mt-32"
                  aria-labelledby={`${category.id}-heading`}
                >
                  <div
                    className={`overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br ${category.accent} p-7 sm:p-9`}
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-4">
                          <span
                            aria-hidden="true"
                            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm"
                          >
                            {category.icon}
                          </span>
                          <div>
                            <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-900">
                              {category.eyebrow}
                            </p>
                            <h2
                              id={`${category.id}-heading`}
                              className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
                            >
                              {category.title}
                            </h2>
                          </div>
                        </div>
                        <p className="mt-5 text-lg leading-8 text-slate-600">
                          {category.description}
                        </p>
                      </div>

                      <div className="w-fit rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm">
                        {category.templates.length}{" "}
                        {category.templates.length === 1
                          ? "document"
                          : "documents"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {category.templates.map((template) => (
                      <article
                        key={template.slug}
                        className="group flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-7 shadow-lg transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-blue-900">
                            AI assisted
                          </span>
                          <span className="text-sm font-bold text-slate-500">
                            {template.time}
                          </span>
                        </div>

                        <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                          {template.title}
                        </h3>

                        <p className="mt-4 flex-1 leading-7 text-slate-600">
                          {template.description}
                        </p>

                        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-extrabold text-slate-800">
                            Included with your document
                          </p>
                          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
                            <span>✓ Brand Kit details</span>
                            <span>✓ Beacon AI improvements</span>
                            <span>✓ Editable first draft</span>
                          </div>
                        </div>

                        {template.status === "available" ? (
                          <Link
                            href={`/business/templates/${template.slug}`}
                            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition group-hover:bg-blue-900"
                          >
                            Create document
                            <span aria-hidden="true" className="ml-2">
                              →
                            </span>
                          </Link>
                        ) : (
                          <span className="mt-6 inline-flex cursor-not-allowed items-center justify-center rounded-2xl bg-slate-200 px-6 py-4 font-extrabold text-slate-500">
                            Coming soon
                          </span>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
              <span aria-hidden="true" className="text-5xl">
                🔎
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                No matching documents found
              </h2>
              <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
                Try a different search term or clear the current category
                filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
                className="mt-7 rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900"
              >
                Show all documents
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
              Connected to Beacon Business
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              One document engine across your whole business.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Beacon Documents is designed to work with your existing AI Quote
              Builder, Brand Kit, Website Builder and future invoice tools
              rather than replacing or duplicating them.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Quote follow-up from AI Quote Builder",
              "Legal pages for Website Builder",
              "Brand details inserted automatically",
              "Future invoice and customer actions",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-bold leading-7 text-slate-800"
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-8 text-center text-white shadow-2xl sm:p-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-amber-200">
            Beacon Documents
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Choose a document and let Beacon prepare the first draft.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
            Your universal document editor will keep every document editable,
            branded and ready for practical AI improvements.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setQuery("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mt-8 rounded-2xl bg-amber-300 px-8 py-4 text-lg font-extrabold text-blue-950 transition hover:bg-amber-200"
          >
            Browse all documents
          </button>
        </div>
      </section>
    </>
  );
}