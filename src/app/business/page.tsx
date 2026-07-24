import type { Metadata } from "next";

import Link from "next/link";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";

import {
  absoluteUrl,
  siteConfig,
} from "@/lib/seo/SiteConfig";

export const metadata: Metadata = {
  title: "Beacon Business | Websites and Business Growth Tools",

  description:
    "Build and grow your business with professional websites, intelligent quoting, branding, templates, analytics, SEO and practical business tools from Beacon.",

  alternates: {
    canonical: "/business",
  },

  openGraph: {
    type: "website",
    url: absoluteUrl("/business"),
    title: "Beacon Business | See Your Website Before You Pay",
    description:
      "Create an interactive business website preview, request changes and only pay once you are ready to move forward.",
    images: [
      {
        url: absoluteUrl(siteConfig.socialImage),
        width: 1200,
        height: 630,
        alt: "Beacon Business website and business growth tools",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Beacon Business | Websites Built Around Your Business",
    description:
      "Preview your new business website before paying, then grow with practical Beacon Business tools.",
    images: [absoluteUrl(siteConfig.socialImage)],
  },
};

const businessTools = [
  {
    title: "Website Preview & Build",
    description:
      "Tell Beacon about your business and receive an interactive website preview before committing to a purchase.",
    icon: "🖥️",
    status: "Available first",
  },
  {
    title: "Beacon Quote",
    description:
      "Create clear, professional customer quotes faster and keep your pricing consistent.",
    icon: "🧾",
    status: "Coming next",
  },
  {
    title: "Business Templates",
    description:
      "Use professional templates for invoices, estimates, customer messages and everyday business documents.",
    icon: "📄",
    status: "Planned",
  },
  {
    title: "Branding",
    description:
      "Build a consistent identity with practical guidance for colours, messaging and visual presentation.",
    icon: "🎨",
    status: "Planned",
  },
  {
    title: "AI Chatbot",
    description:
      "Add a helpful website assistant that can answer common questions and guide potential customers.",
    icon: "💬",
    status: "Planned",
  },
  {
    title: "Analytics",
    description:
      "Understand how visitors find and use your website without being overwhelmed by unnecessary data.",
    icon: "📊",
    status: "Planned",
  },
  {
    title: "SEO",
    description:
      "Improve how your business appears in search with clear, practical optimisation recommendations.",
    icon: "🔎",
    status: "Planned",
  },
  {
    title: "Business Dashboard",
    description:
      "Manage your website, tools, progress, upgrades and business activity from one clear workspace.",
    icon: "📌",
    status: "Core feature",
  },
];

const websiteProcess = [
  {
    step: "01",
    title: "Tell us about your business",
    description:
      "Share your services, location, colours, contact information and any photographs you want to use.",
  },
  {
    step: "02",
    title: "Beacon creates your preview",
    description:
      "Beacon turns your information into an interactive website preview you can explore within minutes.",
  },
  {
    step: "03",
    title: "Review and request changes",
    description:
      "Browse the preview, check each section and tell us what you would like adjusted.",
  },
  {
    step: "04",
    title: "Approve your design",
    description:
      "Confirm that the direction is right before making any payment.",
  },
  {
    step: "05",
    title: "Pay securely",
    description:
      "Choose the website package that matches your business and complete your order securely.",
  },
  {
    step: "06",
    title: "Professional build and launch",
    description:
      "We refine, test and publish your website with an estimated completion time of 2–4 weeks.",
  },
];

const websitePackages = [
  {
    name: "Starter Website",
    price: "£150",
    description: "A professional starting point for new and local businesses.",
    features: [
      "Up to 5 core pages",
      "Mobile-responsive design",
      "Contact form",
      "Business details and services",
      "Basic search optimisation",
      "Powered by Beacon Business footer",
    ],
    featured: false,
  },
  {
    name: "Business Website",
    price: "£350",
    description:
      "A stronger website for established businesses ready to grow.",
    features: [
      "Everything in Starter",
      "Additional business pages",
      "Gallery and testimonials",
      "Service-area content",
      "Enhanced search optimisation",
      "Analytics setup",
      "Expanded conversion features",
    ],
    featured: true,
  },
  {
    name: "Premium Website",
    price: "From £600",
    description:
      "A more advanced website with bespoke functionality and integrations.",
    features: [
      "Everything in Business",
      "Advanced website modules",
      "Booking or customer tools",
      "Bespoke functionality",
      "Priority build support",
      "Premium design refinements",
      "Beacon branding removal",
    ],
    featured: false,
  },
];

const modules = [
  {
    name: "AI Chatbot",
    price: "£50",
    description:
      "A helpful website assistant for common customer questions and enquiries.",
  },
  {
    name: "Online Shop",
    price: "£50",
    description:
      "Add a simple product catalogue and online selling capability.",
  },
  {
    name: "Membership Area",
    price: "£37.50",
    description:
      "Create protected content or account access for registered members.",
  },
];

const progressSteps = [
  "Preview Generated",
  "Customer Review",
  "Awaiting Approval",
  "Payment Received",
  "Professional Build",
  "Quality Assurance",
  "Domain Connected",
  "Website Live",
];

const businessPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": absoluteUrl("/business#webpage"),
  url: absoluteUrl("/business"),
  name: "Beacon Business",
  description:
    "Professional websites and practical business growth tools powered by Beacon.",
  inLanguage: siteConfig.language,
  isPartOf: {
    "@id": absoluteUrl("/#website"),
  },
  about: {
    "@id": absoluteUrl("/#organization"),
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Beacon Business Website Design and Business Tools",
  provider: {
    "@id": absoluteUrl("/#organization"),
  },
  areaServed: {
    "@type": "Country",
    name: "United Kingdom",
  },
  url: absoluteUrl("/business"),
  description:
    "Interactive website previews, professional website builds and practical business tools for UK businesses.",
};

export default function BusinessPage() {
  return (
    <>
      <JsonLd data={[businessPageSchema, serviceSchema]} />

      <main className="min-h-screen bg-slate-50">
        <Navbar />

        <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-24 text-white sm:py-28">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
                Beacon Business
              </p>

              <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Grow your business with confidence.
              </h1>

              <p className="mt-6 max-w-3xl text-xl leading-9 text-blue-100">
                Professional websites, intelligent business tools and practical
                support designed to help small businesses start strong and grow
                naturally.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/business/website"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-lg font-extrabold text-blue-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Build my website
                </Link>

                <a
                  href="#business-tools"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-lg font-extrabold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Explore business tools
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-blue-100">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                  See your website before paying
                </span>

                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                  Clear package pricing
                </span>

                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                  Built for UK businesses
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/20 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
              <div className="rounded-3xl bg-slate-100 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />

                  <div className="ml-2 flex-1 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-500">
                    your-business-preview.co.uk
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Interactive website preview
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  See your new website before you pay.
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  Explore your design, request changes and only move forward
                  when you are happy with the direction.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Your colours",
                    "Your services",
                    "Your photographs",
                    "Your contact details",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl bg-white px-4 py-3 font-bold text-slate-700 shadow-sm"
                    >
                      ✓ {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-blue-950 px-5 py-4 text-sm leading-6 text-blue-100">
                <strong className="block text-white">
                  Preview generated by Beacon AI
                </strong>
                You are viewing an interactive preview based on the
                information you provided. Final refinements, content updates
                and publishing begin once your order is confirmed.
              </div>
            </div>
          </div>
        </section>

        <section
          className="px-6 py-20"
          aria-labelledby="website-process"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                Website Preview & Build
              </p>

              <h2
                id="website-process"
                className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
              >
                From business details to a professional website.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                Beacon makes the early design process faster and clearer while
                keeping the final build personal, professional and carefully
                reviewed.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {websiteProcess.map((item) => (
                <article
                  key={item.step}
                  className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-lg"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-950 font-black text-white">
                    {item.step}
                  </span>

                  <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="business-tools"
          className="border-y border-slate-200 bg-white px-6 py-20"
          aria-labelledby="business-tools-title"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                One Business Platform
              </p>

              <h2
                id="business-tools-title"
                className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
              >
                Practical tools built around real business needs.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                Start with your website, then add the tools that help you save
                time, look more professional and understand your growth.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {businessTools.map((tool) => (
                <article
                  key={tool.title}
                  className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span aria-hidden="true" className="text-4xl">
                      {tool.icon}
                    </span>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-900">
                      {tool.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">
                    {tool.title}
                  </h3>

                  <p className="mt-3 flex-1 leading-7 text-slate-600">
                    {tool.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="px-6 py-20"
          aria-labelledby="website-packages"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                Website Packages
              </p>

              <h2
                id="website-packages"
                className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
              >
                Start at the right level and grow when you are ready.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                Every package gives your business a professional foundation.
                Higher packages add more content, tools and functionality
                without forcing you to rebuild from the beginning.
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {websitePackages.map((websitePackage) => (
                <article
                  key={websitePackage.name}
                  className={`relative flex h-full flex-col rounded-[2rem] border p-8 shadow-xl ${
                    websitePackage.featured
                      ? "border-blue-900 bg-blue-950 text-white"
                      : "border-slate-200 bg-white text-slate-950"
                  }`}
                >
                  {websitePackage.featured ? (
                    <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-950">
                      Best value
                    </span>
                  ) : null}

                  <p
                    className={`text-sm font-extrabold uppercase tracking-[0.22em] ${
                      websitePackage.featured
                        ? "text-blue-200"
                        : "text-blue-900"
                    }`}
                  >
                    {websitePackage.name}
                  </p>

                  <p className="mt-4 text-4xl font-black tracking-tight">
                    {websitePackage.price}
                  </p>

                  <p
                    className={`mt-4 leading-7 ${
                      websitePackage.featured
                        ? "text-blue-100"
                        : "text-slate-600"
                    }`}
                  >
                    {websitePackage.description}
                  </p>

                  <div className="mt-7 space-y-3">
                    {websitePackage.features.map((feature) => (
                      <div
                        key={feature}
                        className={`rounded-2xl px-4 py-3 font-semibold ${
                          websitePackage.featured
                            ? "bg-white/10 text-white"
                            : "bg-slate-50 text-slate-700"
                        }`}
                      >
                        ✓ {feature}
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/business/website"
                    className={`mt-8 inline-flex items-center justify-center rounded-2xl px-6 py-4 font-extrabold transition ${
                      websitePackage.featured
                        ? "bg-white text-blue-950 hover:bg-blue-50"
                        : "bg-blue-950 text-white hover:bg-blue-900"
                    }`}
                  >
                    Start my website
                  </Link>
                </article>
              ))}
            </div>

            <p className="mt-8 text-center text-sm leading-6 text-slate-500">
              Final scope is confirmed before payment. Advanced or bespoke
              requirements may affect the final price.
            </p>
          </div>
        </section>

        <section
          className="bg-blue-950 px-6 py-20 text-white"
          aria-labelledby="website-upgrades"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
                Fair Upgrade Pricing
              </p>

              <h2
                id="website-upgrades"
                className="mt-4 text-4xl font-black tracking-tight sm:text-5xl"
              >
                You never pay for the same website twice.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                Upgrading adds the elements of the higher package to your
                existing Beacon website. It is not treated as a redesign or a
                completely new build.
              </p>

              <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
                <p className="font-extrabold text-white">
                  Starter to Business example
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-blue-200">Starter Website</p>
                    <p className="mt-1 text-2xl font-black">£150</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-blue-200">Business Website</p>
                    <p className="mt-1 text-2xl font-black">£350</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-blue-100">
                  <p>Package difference: £200</p>
                  <p>Existing-customer discount: £20</p>
                  <p className="pt-2 text-2xl font-black text-white">
                    Upgrade price: £180
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-[2rem] bg-white p-8 text-slate-950 shadow-2xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                  Flexible Modules
                </p>

                <h3 className="mt-4 text-3xl font-black tracking-tight">
                  Add one feature without changing package.
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  Individual modules give businesses flexibility. Buying
                  several modules separately will cost slightly more than the
                  equivalent full package upgrade, keeping the package the best
                  overall value.
                </p>

                <div className="mt-7 space-y-4">
                  {modules.map((module) => (
                    <div
                      key={module.name}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-black text-slate-950">
                            {module.name}
                          </h4>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {module.description}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 font-extrabold text-blue-900">
                          {module.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-6 rounded-2xl bg-blue-50 px-5 py-4 text-sm font-semibold leading-6 text-blue-950">
                  Need several modules? Beacon will show when a package upgrade
                  offers better value.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="px-6 py-20"
          aria-labelledby="project-progress"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                Clear Progress
              </p>

              <h2
                id="project-progress"
                className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
              >
                Follow your website from preview to launch.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                Every customer can see what has been completed, what is
                happening now and what comes next.
              </p>

              <p className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 font-bold text-blue-950">
                Estimated completion after payment: 2–4 weeks.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl sm:p-9">
              <div className="space-y-4">
                {progressSteps.map((step, index) => {
                  const completed = index < 2;
                  const current = index === 2;

                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${
                        completed
                          ? "border-emerald-200 bg-emerald-50"
                          : current
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black ${
                          completed
                            ? "bg-emerald-600 text-white"
                            : current
                              ? "bg-blue-900 text-white"
                              : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {completed ? "✓" : index + 1}
                      </span>

                      <div>
                        <p className="font-black text-slate-950">{step}</p>

                        {current ? (
                          <p className="mt-1 text-sm font-semibold text-blue-800">
                            Current stage
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl rounded-[2rem] bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-7 py-14 text-center text-white shadow-2xl sm:px-12">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
              Start with confidence
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Show us your business. We will show you its potential.
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-blue-100">
              Create your website brief and let Beacon turn it into an
              interactive preview before you decide to move forward.
            </p>

            <Link
              href="/business/website"
              className="mt-8 inline-flex rounded-2xl bg-white px-8 py-4 text-lg font-extrabold text-blue-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Create my website preview
            </Link>

            <p className="mt-6 text-sm leading-6 text-blue-200">
              Powered by Beacon Business
            </p>
          </div>
        </section>

        <BeaconFooter />
      </main>
    </>
  );
}