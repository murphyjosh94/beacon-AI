import type { Metadata } from "next";

import Link from "next/link";

import AmazonSubscriptionBanner from "@/components/AmazonSubscriptionBanner";
import BeaconFooter from "@/components/BeaconFooter";
import BeaconHero from "@/components/BeaconHero";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";

import { absoluteUrl, siteConfig } from "@/lib/seo/SiteConfig";

export const metadata: Metadata = {
  title: "AI Recommendations, Planning and Business Tools",
  description:
    "Ask Beacon for personalised shopping, travel, entertainment, vehicle and local recommendations, or explore Beacon Business tools for websites, quotes, branding and growth.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: "Beacon AI | Personal Guidance and Business Tools",
    description:
      "One trusted platform for personalised recommendations, planning and practical tools that help people and businesses move forward with confidence.",
    images: [
      {
        url: absoluteUrl(siteConfig.socialImage),
        width: 1200,
        height: 630,
        alt: "Beacon AI recommendation, planning and business platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beacon AI | Better Choices for People and Businesses",
    description:
      "Personalised recommendations through Ask Beacon and practical business tools through Beacon Business.",
    images: [absoluteUrl(siteConfig.socialImage)],
  },
};

const personalCategories = [
  {
    id: "shopping",
    eyebrow: "Beacon Shopping",
    title: "Find the right product",
    description:
      "Tell Beacon what matters to you and receive five carefully selected products that match your budget, needs and preferences.",
    examples: [
      "Best 55-inch TV under £800",
      "Quiet cordless vacuum for pet hair",
      "Laptop for university and light gaming",
    ],
  },
  {
    id: "getaways",
    eyebrow: "Beacon Getaways",
    title: "Plan the right break",
    description:
      "From UK staycations to holidays abroad, Beacon helps narrow hundreds of options into five clear recommendations.",
    examples: [
      "Family beach holiday under £2,500",
      "Dog-friendly cottage in Cornwall",
      "Weekend break for two in Edinburgh",
    ],
  },
  {
    id: "entertainment",
    eyebrow: "Beacon Entertainment",
    title: "Discover something memorable",
    description:
      "Find events, attractions and experiences matched to your location, interests, dates and budget.",
    examples: [
      "Family day out near Manchester",
      "West End show and hotel package",
      "Birthday experience for two",
    ],
  },
];

const searchCategories = [
  {
    href: "/search/products",
    eyebrow: "Shopping",
    title: "Product recommendations",
    description:
      "Compare products selected around your budget, priorities and practical requirements.",
    icon: "🛍️",
  },
  {
    href: "/search/hotels",
    eyebrow: "Travel",
    title: "Hotels and holidays",
    description:
      "Explore hotel, getaway and holiday recommendations for different destinations and budgets.",
    icon: "🏨",
  },
  {
    href: "/search/flights",
    eyebrow: "Flights",
    title: "Flight recommendations",
    description:
      "Browse focused flight searches based on routes, dates, budgets and travel preferences.",
    icon: "✈️",
  },
  {
    href: "/search/entertainment",
    eyebrow: "Experiences",
    title: "Entertainment and activities",
    description:
      "Discover events, attractions and memorable experiences matched to different interests.",
    icon: "🎟️",
  },
  {
    href: "/search/vehicles",
    eyebrow: "Automotive",
    title: "Vehicles and car parts",
    description:
      "Explore vehicle recommendations and compatible parts for specific makes, models and engines.",
    icon: "🚘",
  },
  {
    href: "/search/services",
    eyebrow: "Local discovery",
    title: "Services and local recommendations",
    description:
      "Ask Beacon to research suitable providers, places and useful services around your needs and location.",
    icon: "📍",
  },
];

const businessTools = [
  {
    icon: "🌐",
    title: "Website previews and builds",
    description:
      "See an interactive preview of your new business website before you pay, then request changes before the professional build begins.",
  },
  {
    icon: "📋",
    title: "Beacon Quote",
    description:
      "Turn job details, measurements and photos into transparent, editable quotations with labour, materials and cost breakdowns.",
  },
  {
    icon: "📄",
    title: "Business templates",
    description:
      "Create professional documents for everyday business tasks without starting from a blank page.",
  },
  {
    icon: "🎨",
    title: "Branding tools",
    description:
      "Develop a consistent identity across your logo, colours, website and customer communications.",
  },
  {
    icon: "🤖",
    title: "AI chatbot",
    description:
      "Help website visitors find answers and understand your services while keeping your business available beyond working hours.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description:
      "Understand how people find and use your website through clear, practical performance insights.",
  },
  {
    icon: "📈",
    title: "SEO guidance",
    description:
      "Improve how your pages are structured and presented so customers can discover your business more easily.",
  },
  {
    icon: "💼",
    title: "Business dashboard",
    description:
      "Manage your website, tools, progress, upgrades and business information from one organised place.",
  },
];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": absoluteUrl("/#organization"),
  name: siteConfig.officialName,
  alternateName: siteConfig.name,
  url: siteConfig.url,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl(siteConfig.socialImage),
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  name: siteConfig.name,
  alternateName: siteConfig.officialName,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: siteConfig.language,
  publisher: {
    "@id": absoluteUrl("/#organization"),
  },
};

const homePageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": absoluteUrl("/#webpage"),
  url: siteConfig.url,
  name: "Beacon AI recommendations, planning and business tools",
  description:
    "Beacon helps people make confident choices and gives businesses practical tools to build, manage and grow.",
  inLanguage: siteConfig.language,
  isPartOf: {
    "@id": absoluteUrl("/#website"),
  },
  about: {
    "@id": absoluteUrl("/#organization"),
  },
};

const categoryListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Beacon personal recommendation categories",
  numberOfItems: searchCategories.length,
  itemListElement: searchCategories.map((category, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: category.title,
    url: absoluteUrl(category.href),
  })),
};

function AppleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-10 w-10 shrink-0 fill-current"
    >
      <path d="M17.05 12.54c-.03-3.11 2.54-4.62 2.66-4.69a5.72 5.72 0 0 0-4.5-2.43c-1.89-.2-3.72 1.13-4.68 1.13-.98 0-2.46-1.11-4.05-1.08a5.96 5.96 0 0 0-5.02 3.06c-2.18 3.77-.55 9.31 1.53 12.36 1.04 1.49 2.25 3.15 3.84 3.09 1.55-.06 2.13-.99 4-.99 1.86 0 2.4.99 4.02.95 1.67-.03 2.72-1.49 3.72-2.99a12.3 12.3 0 0 0 1.7-3.46 5.36 5.36 0 0 1-3.22-4.95ZM13.98 3.42A5.44 5.44 0 0 0 15.22-.5a5.55 5.55 0 0 0-3.59 1.86 5.18 5.18 0 0 0-1.28 3.77 4.59 4.59 0 0 0 3.63-1.71Z" />
    </svg>
  );
}

function GooglePlayLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-10 w-10 shrink-0"
    >
      <path
        fill="#34A853"
        d="M3.52 2.31a2.1 2.1 0 0 0-.52 1.4v16.58c0 .54.2 1.03.52 1.4l9.18-9.69L3.52 2.31Z"
      />
      <path
        fill="#FBBC04"
        d="m15.76 8.77-3.06 3.23 3.06 3.23 3.73-2.13c1.01-.58 1.01-1.62 0-2.2l-3.73-2.13Z"
      />
      <path
        fill="#4285F4"
        d="M3.52 2.31 12.7 12l3.06-3.23L5.54 2.92a2.04 2.04 0 0 0-2.02-.61Z"
      />
      <path
        fill="#EA4335"
        d="M3.52 21.69a2.04 2.04 0 0 0 2.02-.61l10.22-5.85L12.7 12l-9.18 9.69Z"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema,
          websiteSchema,
          homePageSchema,
          categoryListSchema,
        ]}
      />

      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <AmazonSubscriptionBanner />
        <div id="ask-beacon" className="scroll-mt-28">
          <BeaconHero />
        </div>

        <section
          className="px-6 pb-10 pt-4 sm:pb-14"
          aria-labelledby="choose-your-beacon"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                One Beacon. Two ways to move forward.
              </p>
              <h2
                id="choose-your-beacon"
                className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
              >
                Choose the experience built around you.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Ask Beacon for personal recommendations and planning, or use
                Beacon Business to build, manage and grow your business with
                confidence.
              </p>
            </div>

            <div className="mt-12 grid gap-7 lg:grid-cols-2">
              <article className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-white p-8 shadow-xl sm:p-10">
                <div
                  aria-hidden="true"
                  className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-100 blur-3xl"
                />
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                    👤
                  </div>
                  <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.24em] text-blue-900">
                    Beacon Personal
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Ask once. Let Beacon guide the search.
                  </h3>
                  <p className="mt-5 text-lg leading-8 text-slate-600">
                    Use Beacon AI for shopping recommendations, holidays and
                    getaways, entertainment, vehicle parts and general AI
                    guidance — all from one clear personal experience.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {[
                      "Shopping recommendations",
                      "Holidays and getaways",
                      "Entertainment",
                      "Vehicle parts",
                      "General AI guidance",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl bg-slate-50 px-4 py-3 font-bold text-slate-700"
                      >
                        ✓ {item}
                      </div>
                    ))}
                  </div>

                  <Link
                    href="#ask-beacon"
                    className="mt-8 inline-flex items-center rounded-2xl bg-blue-900 px-7 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
                  >
                    Continue to Personal Beacon
                    <span aria-hidden="true" className="ml-2">
                      →
                    </span>
                  </Link>
                </div>
              </article>

              <article className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-8 text-white shadow-2xl sm:p-10">
                <div
                  aria-hidden="true"
                  className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="absolute -bottom-20 left-1/4 h-52 w-52 rounded-full bg-blue-400/20 blur-3xl"
                />
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl backdrop-blur">
                    🏢
                  </div>
                  <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.24em] text-amber-200">
                    Beacon Business
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                    Build your online presence with confidence.
                  </h3>
                  <p className="mt-5 text-lg leading-8 text-blue-100">
                    Professional website builds, AI-powered business websites,
                    online shops, membership areas and affordable Beacon
                    Business maintenance plans — all from one trusted platform.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {[
                      "Professional website builds",
                      "AI-powered business websites",
                      "Online shops",
                      "Membership areas",
                      "Beacon Business maintenance plans",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-bold text-white backdrop-blur"
                      >
                        ✓ {item}
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/business"
                    className="mt-8 inline-flex items-center rounded-2xl bg-white px-7 py-4 font-extrabold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    Explore Beacon Business
                    <span aria-hidden="true" className="ml-2">
                      →
                    </span>
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          className="px-6 pb-8 pt-4 sm:pb-12"
          aria-labelledby="mobile-apps-coming-soon"
        >
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-10 text-white shadow-2xl sm:px-10 lg:px-14">
              <div
                aria-hidden="true"
                className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl"
              />

              <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.2em] text-blue-100 backdrop-blur">
                    <span aria-hidden="true">📱</span>
                    Beacon on mobile
                  </div>
                  <h2
                    id="mobile-apps-coming-soon"
                    className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl"
                  >
                    The Beacon AI mobile apps are on the way.
                  </h2>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                    Beacon is available today on the web. We are also building
                    dedicated mobile apps so you can take your personal AI
                    recommendation assistant everywhere.
                  </p>
                  <p className="mt-4 max-w-3xl leading-7 text-blue-200">
                    We are here for the long term and are continually improving
                    Beacon with new features, faster searches and a better
                    experience across every device.
                  </p>
                  <div className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 font-extrabold text-blue-950 shadow-lg">
                    <span aria-hidden="true">✓</span>
                    Available now on the web
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex min-h-28 items-center gap-5 rounded-3xl border border-white/20 bg-white p-5 text-slate-950 shadow-xl">
                    <AppleLogo />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Coming soon to the
                      </p>
                      <p className="mt-1 text-2xl font-black tracking-tight">
                        App Store
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-900">
                      In development
                    </span>
                  </div>

                  <div className="flex min-h-28 items-center gap-5 rounded-3xl border border-white/20 bg-white p-5 text-slate-950 shadow-xl">
                    <GooglePlayLogo />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Coming soon to
                      </p>
                      <p className="mt-1 text-2xl font-black tracking-tight">
                        Google Play
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-900">
                      In development
                    </span>
                  </div>

                  <p className="px-2 text-center text-sm leading-6 text-blue-200">
                    Store availability dates will be announced when the apps
                    are ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="px-6 py-20"
          aria-labelledby="how-beacon-helps"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                Beacon Personal
              </p>
              <h2
                id="how-beacon-helps"
                className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
              >
                Five strong choices. Not five hundred results.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Ask Beacon what you need. It identifies the type of request,
                compares suitable options and explains why each recommendation
                deserves your attention.
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {personalCategories.map((category) => (
                <article
                  key={category.id}
                  id={category.id}
                  className="scroll-mt-32 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl"
                >
                  <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-900">
                    {category.eyebrow}
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {category.title}
                  </h3>
                  <p className="mt-4 leading-7 text-slate-600">
                    {category.description}
                  </p>
                  <div className="mt-6 space-y-3">
                    {category.examples.map((example) => (
                      <div
                        key={example}
                        className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-700"
                      >
                        “{example}”
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="border-y border-slate-200 bg-white px-6 py-20"
          aria-labelledby="browse-recommendations"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
                  Browse Beacon Research
                </p>
                <h2
                  id="browse-recommendations"
                  className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
                >
                  Explore personalised recommendation categories
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-600">
                  Browse public Beacon searches across shopping, travel,
                  entertainment, vehicles and useful local services.
                </p>
              </div>

              <Link
                href="/search/recommendations"
                className="inline-flex w-fit rounded-2xl border border-blue-900 px-6 py-3 font-extrabold text-blue-900 transition hover:bg-blue-900 hover:text-white"
              >
                View all recommendations
              </Link>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {searchCategories.map((category) => (
                <article
                  key={category.href}
                  className="group flex h-full flex-col rounded-[2rem] border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                        {category.eyebrow}
                      </p>
                      <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                        <Link
                          href={category.href}
                          className="transition group-hover:text-blue-800"
                        >
                          {category.title}
                        </Link>
                      </h3>
                    </div>
                    <span aria-hidden="true" className="text-4xl">
                      {category.icon}
                    </span>
                  </div>

                  <p className="mt-4 flex-1 leading-7 text-slate-600">
                    {category.description}
                  </p>
                  <Link
                    href={category.href}
                    className="mt-6 inline-flex w-fit items-center font-extrabold text-blue-900 transition group-hover:text-blue-700"
                  >
                    Explore category
                    <span
                      aria-hidden="true"
                      className="ml-2 transition group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="beacon-business"
          className="scroll-mt-28 bg-slate-950 px-6 py-20 text-white"
          aria-labelledby="beacon-business-heading"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-amber-300">
                  Beacon Business
                </p>
                <h2
                  id="beacon-business-heading"
                  className="mt-4 text-4xl font-black tracking-tight sm:text-5xl"
                >
                  Practical tools to build, manage and grow your business.
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                  Beacon Business brings websites, quotations, branding,
                  templates and growth tools together without turning the
                  platform into a complicated collection of disconnected AI
                  features.
                </p>
              </div>

              <div className="rounded-[2rem] border border-amber-300/30 bg-white/10 p-7 backdrop-blur sm:p-8">
                <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-amber-200">
                  Website promise
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-white">
                  See your new business website before you pay.
                </p>
                <p className="mt-4 leading-7 text-slate-300">
                  Beacon creates an interactive preview in minutes from the
                  information a business provides. The customer can approve the
                  direction or request changes before payment and the final
                  professional build.
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {businessTools.map((tool) => (
                <article
                  key={tool.title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/10"
                >
                  <span aria-hidden="true" className="text-3xl">
                    {tool.icon}
                  </span>
                  <h3 className="mt-5 text-xl font-black tracking-tight text-white">
                    {tool.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {tool.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-12 grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-amber-200">
                  Built around trust and guidance
                </p>
                <h3 className="mt-3 text-3xl font-black tracking-tight">
                  Start at the right level. Upgrade as your business grows.
                </h3>
                <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                  Website customers can move from Starter to Business or
                  Premium without paying the full package price again. Package
                  upgrades use the difference between tiers with a loyalty
                  discount, while individual modules remain available for
                  businesses that only need one additional feature.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-300 px-6 py-4 text-center font-black text-blue-950 shadow-xl">
                Beacon Business is next
              </div>
            </div>
          </div>
        </section>

        <section
          className="bg-blue-950 px-6 py-20 text-white"
          aria-labelledby="beacon-difference"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
                The Beacon Difference
              </p>
              <h2
                id="beacon-difference"
                className="mt-4 text-4xl font-black tracking-tight sm:text-5xl"
              >
                Guidance built around real decisions.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                Beacon is not designed to overwhelm people with sponsored
                listings or disconnected tools. It understands the request,
                compares suitable options and helps people or businesses take
                the next step with confidence.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Personalised recommendations",
                "Clear Beacon Score",
                "Trusted partner links",
                "Transparent sponsored labels",
                "Saved preferences",
                "Business growth tools",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 font-bold backdrop-blur"
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20" aria-labelledby="beacon-plus">
          <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 text-center shadow-2xl sm:p-12">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
              Beacon+
            </p>
            <h2
              id="beacon-plus"
              className="mt-4 text-4xl font-black tracking-tight text-slate-950"
            >
              Your personal Beacon gets better with you.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Save preferences, track prices, create family profiles, remember
              your vehicles and pets, and receive personalised alerts when
              better options appear.
            </p>
            <Link
              href="/membership"
              className="mt-8 inline-flex rounded-2xl bg-blue-900 px-8 py-4 text-lg font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-800"
            >
              Explore Beacon+
            </Link>
          </div>
        </section>

        <BeaconFooter />
      </main>
    </>
  );
}