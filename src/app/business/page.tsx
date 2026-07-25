import type { Metadata } from "next";

import Link from "next/link";

import JsonLd from "@/components/seo/JsonLd";

import { absoluteUrl, siteConfig } from "@/lib/seo/SiteConfig";

export const metadata: Metadata = {
  title: "Beacon Business | Websites, Quotes, Invoices and Business Tools",
  description:
    "Run your business from one trusted platform with professional websites, Beacon Quote, invoicing, templates, customers, branding and practical AI support.",
  alternates: {
    canonical: "/business",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/business"),
    title: "Beacon Business | Your Business Operating Platform",
    description:
      "Professional websites, quotes, invoices, templates, branding and business tools brought together in one secure Beacon dashboard.",
    images: [
      {
        url: absoluteUrl(siteConfig.socialImage),
        width: 1200,
        height: 630,
        alt: "Beacon Business platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beacon Business | Your Business Operating Platform",
    description:
      "Build your online presence and manage day-to-day business tasks from one trusted platform.",
    images: [absoluteUrl(siteConfig.socialImage)],
  },
};

const coreModules = [
  {
    icon: "🌐",
    title: "Website Builder",
    description:
      "Create a professional business website, review an interactive preview before payment and manage future improvements from the same dashboard.",
    features: [
      "Interactive preview before payment",
      "Professional business websites",
      "Online shops and membership areas",
      "Hosting, SSL and maintenance",
    ],
  },
  {
    icon: "📋",
    title: "Beacon Quote",
    description:
      "Create clear, professional quotations with customer details, labour, materials, discounts, VAT and branded documents.",
    features: [
      "Editable line items",
      "Labour and material breakdowns",
      "PDF-ready quotations",
      "Convert accepted quotes into invoices",
    ],
  },
  {
    icon: "🧾",
    title: "Beacon Invoices",
    description:
      "Create professional invoices, manage due dates and keep track of what has been paid, is outstanding or has become overdue.",
    features: [
      "Automatic invoice numbering",
      "Paid, unpaid and overdue status",
      "VAT and discount support",
      "Professional PDF documents",
    ],
  },
  {
    icon: "👥",
    title: "Customer Manager",
    description:
      "Store customer information once and connect each customer to their quotes, invoices, documents and future work.",
    features: [
      "Customer contact records",
      "Quote and invoice history",
      "Job notes and business records",
      "Designed for future CRM features",
    ],
  },
  {
    icon: "🎨",
    title: "Brand Kit",
    description:
      "Keep your logo, colours, fonts, business details and contact information consistent across every Beacon Business module.",
    features: [
      "Logo and business identity",
      "Brand colours and fonts",
      "Company and VAT information",
      "Reusable details across documents",
    ],
  },
  {
    icon: "🤖",
    title: "Beacon AI Assistant",
    description:
      "Use practical business-focused AI to help write customer messages, improve content and create professional documents faster.",
    features: [
      "Write customer replies",
      "Create marketing content",
      "Improve website copy",
      "Assist with quotes and documents",
    ],
  },
  {
    icon: "📊",
    title: "Business Dashboard",
    description:
      "See your website, quotes, invoices, customers, membership and recent activity from one organised business control centre.",
    features: [
      "Business overview",
      "Outstanding invoice visibility",
      "Quote progress",
      "Website and membership status",
    ],
  },
];

const templateCategories = [
  {
    icon: "📋",
    title: "Quotes and estimates",
    description:
      "Create polished, branded quote and estimate documents without starting from scratch.",
  },
  {
    icon: "🧾",
    title: "Invoices and credit notes",
    description:
      "Prepare professional payment documents using your saved business details.",
  },
  {
    icon: "⚖️",
    title: "Policies and terms",
    description:
      "Build practical starting points for privacy, cookies, refunds and terms.",
  },
  {
    icon: "🦺",
    title: "Trade documents",
    description:
      "Create risk assessments, method statements, RAMS and completion certificates.",
  },
  {
    icon: "✉️",
    title: "Customer messages",
    description:
      "Generate professional welcome emails, reminders, follow-ups and confirmations.",
  },
  {
    icon: "📣",
    title: "Marketing content",
    description:
      "Prepare social posts, Google Business updates and promotional campaigns.",
  },
];

const includedFeatures = [
  "Website Builder",
  "Beacon Quote",
  "Beacon Invoices",
  "Business Templates",
  "Customer Manager",
  "Brand Kit",
  "Beacon AI Assistant",
  "Business Dashboard",
  "Secure website hosting",
  "SSL certificate",
  "Website maintenance",
  "Email support",
];

const proFeatures = [
  "Everything in Beacon Business",
  "Priority support",
  "Advanced analytics",
  "SEO monitoring",
  "Team member access",
  "AI automations",
  "Growth reports",
  "Premium templates",
  "Future Pro modules",
];

const futureModules = [
  "Appointment booking",
  "Job scheduling",
  "Recurring invoices",
  "Expense tracking",
  "Stock management",
  "Staff management",
  "Vehicle management",
  "Customer reminders",
  "AI receptionist",
  "Business analytics",
];

const businessPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": absoluteUrl("/business#webpage"),
  url: absoluteUrl("/business"),
  name: "Beacon Business operating platform",
  description:
    "Beacon Business combines websites, quotes, invoices, templates, customer management, branding and practical AI support.",
  inLanguage: siteConfig.language,
  isPartOf: {
    "@id": absoluteUrl("/#website"),
  },
  about: {
    "@id": absoluteUrl("/#organization"),
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Beacon Business",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: absoluteUrl("/business"),
  description:
    "A business operating platform for websites, quotes, invoicing, templates, customers, branding and AI support.",
  offers: [
    {
      "@type": "Offer",
      name: "Beacon Business",
      price: "19.99",
      priceCurrency: "GBP",
      category: "subscription",
    },
    {
      "@type": "Offer",
      name: "Beacon Business Pro",
      price: "29.99",
      priceCurrency: "GBP",
      category: "subscription",
    },
  ],
};

export default function BusinessPage() {
  return (
    <>
      <JsonLd data={[businessPageSchema, softwareSchema]} />

      <main className="min-h-screen bg-slate-50">
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-20 text-white sm:py-24 lg:py-28">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-amber-200/30 bg-white/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-200 backdrop-blur">
                Beacon Business
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Your business operating platform.
              </h1>

              <p className="mt-6 max-w-3xl text-xl leading-9 text-blue-100">
                Build your online presence, create professional quotes and
                invoices, manage customers, use practical templates and keep
                your business organised from one trusted dashboard.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/business/memberships"
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-300 px-8 py-4 text-lg font-extrabold text-blue-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-amber-200"
                >
                  Start Beacon Business
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </Link>

                <Link
                  href="/business/website"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-lg font-extrabold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Preview Your Website
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  "14-day free trial",
                  "Built for UK businesses",
                  "Secure billing",
                  "Cancel anytime",
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

            <div className="rounded-[2.25rem] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur sm:p-8">
              <div className="rounded-[1.75rem] bg-white p-6 text-slate-950 shadow-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                      Business overview
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      Everything in one place
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl"
                  >
                    🏢
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    ["Quotes", "Create and manage"],
                    ["Invoices", "Track payments"],
                    ["Website", "Build and maintain"],
                    ["Customers", "Keep records"],
                  ].map(([title, detail]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="font-black text-slate-950">{title}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-blue-950 p-5 text-white">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-amber-200">
                    Beacon AI Assistant
                  </p>
                  <p className="mt-2 font-bold">
                    “Create a professional quote, reply to a customer or improve
                    my website.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-b border-slate-200 bg-white px-6 py-10"
          aria-label="Beacon Business platform summary"
        >
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["One dashboard", "Manage your day-to-day business tools"],
              ["Consistent branding", "Use the same details across documents"],
              ["Practical AI", "Support focused on real business tasks"],
              ["Built to grow", "New modules can be added over time"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-5">
                <p className="font-black text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="px-6 py-20 sm:py-24"
          aria-labelledby="business-modules"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                Core modules
              </p>
              <h2
                id="business-modules"
                className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
              >
                More than a website membership.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Beacon Business supports the work that happens before, during
                and after every customer job—from your first quote through to
                invoicing, records and future growth.
              </p>
            </div>

            <div className="mt-14 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
              {coreModules.map((module) => (
                <article
                  key={module.title}
                  className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl transition hover:-translate-y-1 hover:border-blue-200"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl"
                  >
                    {module.icon}
                  </span>

                  <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
                    {module.title}
                  </h3>

                  <p className="mt-4 leading-7 text-slate-600">
                    {module.description}
                  </p>

                  <div className="mt-6 space-y-3">
                    {module.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800"
                        >
                          ✓
                        </span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                  Professional templates
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Create business documents without starting from a blank page.
                </h2>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Beacon Business Templates use your saved brand details to
                  create consistent, professional documents for everyday work.
                  Each template can be edited and improved with practical AI.
                </p>
                <Link
                  href="/business/templates"
                  className="mt-8 inline-flex rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900"
                >
                  Explore Templates
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {templateCategories.map((category) => (
                  <article
                    key={category.title}
                    className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl"
                  >
                    <span aria-hidden="true" className="text-3xl">
                      {category.icon}
                    </span>
                    <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                      {category.title}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-600">
                      {category.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-6 py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-amber-300">
                One connected system
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Enter your business details once. Use them everywhere.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Your brand kit, contact details and customer records are
                designed to connect across quotes, invoices, templates and your
                website. That means less repeated work and a more consistent
                business identity.
              </p>

              <Link
                href="/business/dashboard"
                className="mt-8 inline-flex rounded-2xl bg-white px-7 py-4 font-extrabold text-blue-950 transition hover:bg-blue-50"
              >
                Open Business Dashboard
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["1", "Store your brand and business details"],
                ["2", "Create or select a customer"],
                ["3", "Build a quote using products and services"],
                ["4", "Convert approved work into an invoice"],
                ["5", "Track progress from the dashboard"],
                ["6", "Reuse templates across future jobs"],
              ].map(([number, text]) => (
                <div
                  key={number}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300 font-black text-blue-950">
                    {number}
                  </span>
                  <p className="mt-4 font-bold leading-7 text-white">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="px-6 py-20 sm:py-24"
          aria-labelledby="business-memberships"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                Memberships
              </p>
              <h2
                id="business-memberships"
                className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
              >
                Choose the support your business needs.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Both plans are designed around the complete Beacon Business
                platform—not only website maintenance.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-2">
              <article className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
                <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-900">
                  Beacon Business
                </p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight text-slate-950">
                    £19.99
                  </span>
                  <span className="pb-1 font-bold text-slate-500">/month</span>
                </div>
                <p className="mt-5 text-lg leading-8 text-slate-600">
                  Practical tools for startups, sole traders and growing small
                  businesses.
                </p>

                <div className="mt-8 space-y-3">
                  {includedFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 font-semibold leading-7 text-slate-700"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800"
                      >
                        ✓
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/business/memberships"
                  className="mt-10 inline-flex justify-center rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900"
                >
                  Start Beacon Business
                </Link>
                <p className="mt-3 text-center text-sm font-bold text-slate-500">
                  14-day free trial included
                </p>
              </article>

              <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-amber-300 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-8 text-white shadow-2xl sm:p-10">
                <div
                  aria-hidden="true"
                  className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl"
                />

                <div className="relative">
                  <span className="inline-flex rounded-full bg-amber-300 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-950">
                    Advanced growth
                  </span>

                  <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.25em] text-amber-200">
                    Beacon Business Pro
                  </p>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tight">
                      £29.99
                    </span>
                    <span className="pb-1 font-bold text-blue-200">/month</span>
                  </div>
                  <p className="mt-5 text-lg leading-8 text-blue-100">
                    Advanced tools, priority support and growth features for
                    businesses ready to go further.
                  </p>

                  <div className="mt-8 space-y-3">
                    {proFeatures.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 font-semibold leading-7 text-blue-50"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-black text-blue-950"
                        >
                          ✓
                        </span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/business/memberships"
                    className="mt-10 inline-flex w-full justify-center rounded-2xl bg-amber-300 px-7 py-4 font-extrabold text-blue-950 transition hover:bg-amber-200"
                  >
                    Upgrade to Business Pro
                  </Link>
                  <p className="mt-3 text-center text-sm font-bold text-blue-100">
                    14-day free trial included
                  </p>
                </div>
              </article>
            </div>

            <p className="mx-auto mt-8 max-w-4xl text-center text-sm font-semibold leading-6 text-slate-500">
              Every Beacon Business membership includes a 14-day free trial.
              Secure billing is powered by Stripe, and you can manage or cancel
              your membership through your billing portal.
            </p>

            <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                "14-day free trial",
                "Secure billing with Stripe",
                "Cancel anytime",
                "Built for UK businesses",
                "No hidden fees",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-extrabold text-slate-700 shadow-sm"
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                  Built to keep growing
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Future modules fit into the same platform.
                </h2>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Beacon Business is structured so future tools can be added
                  without turning your account into a collection of unrelated
                  products or separate subscriptions.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {futureModules.map((module) => (
                  <div
                    key={module}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800"
                  >
                    + {module}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-8 text-center text-white shadow-2xl sm:p-12">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-amber-200">
              Start with Beacon Business
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Give your business the tools to look professional and stay
              organised.
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Build your website, prepare quotes, manage invoices and keep your
              business information together in one trusted place.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/business/memberships"
                className="inline-flex items-center justify-center rounded-2xl bg-amber-300 px-8 py-4 text-lg font-extrabold text-blue-950 transition hover:bg-amber-200"
              >
                Start Beacon Business
              </Link>
              <Link
                href="/business/website"
                className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-8 py-4 text-lg font-extrabold text-white transition hover:bg-white/20"
              >
                Preview Your Website
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}