import type {
  Metadata,
} from "next";

import Link from "next/link";

import AmazonSubscriptionBanner from "@/components/AmazonSubscriptionBanner";
import BeaconFooter from "@/components/BeaconFooter";
import BeaconHero from "@/components/BeaconHero";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";

import {
  absoluteUrl,
  siteConfig,
} from "@/lib/seo/SiteConfig";

export const metadata: Metadata = {
  title:
    "AI Shopping, Travel and Entertainment Recommendations",

  description:
    "Find five personalised recommendations for products, holidays, hotels, flights, entertainment, vehicles and useful services with Beacon AI.",

  alternates: {
    canonical:
      "/",
  },

  openGraph: {
    type:
      "website",

    url:
      siteConfig.url,

    title:
      "Beacon AI | Find Better Products, Trips and Experiences",

    description:
      "Tell Beacon what matters to you and receive five personalised recommendations without searching through hundreds of results.",

    images: [
      {
        url:
          absoluteUrl(
            siteConfig.socialImage
          ),

        width:
          1200,

        height:
          630,

        alt:
          "Beacon AI personalised recommendation platform",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Beacon AI | Find Better Choices with AI",

    description:
      "Five personalised recommendations for shopping, travel, entertainment, vehicles and more.",

    images: [
      absoluteUrl(
        siteConfig.socialImage
      ),
    ],
  },
};

const categories = [
  {
    id:
      "shopping",

    eyebrow:
      "Beacon Shopping",

    title:
      "Find the right product",

    description:
      "Tell Beacon what matters to you and receive five carefully selected products that match your budget, needs and preferences.",

    examples: [
      "Best 55-inch TV under £800",
      "Quiet cordless vacuum for pet hair",
      "Laptop for university and light gaming",
    ],
  },

  {
    id:
      "getaways",

    eyebrow:
      "Beacon Getaways",

    title:
      "Plan the right break",

    description:
      "From UK staycations to holidays abroad, Beacon helps narrow hundreds of options into five clear recommendations.",

    examples: [
      "Family beach holiday under £2,500",
      "Dog-friendly cottage in Cornwall",
      "Weekend break for two in Edinburgh",
    ],
  },

  {
    id:
      "entertainment",

    eyebrow:
      "Beacon Entertainment",

    title:
      "Discover something memorable",

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
    href:
      "/search/products",

    eyebrow:
      "Shopping",

    title:
      "Product recommendations",

    description:
      "Compare products selected around your budget, priorities and practical requirements.",

    icon:
      "🛍️",
  },

  {
    href:
      "/search/hotels",

    eyebrow:
      "Travel",

    title:
      "Hotels and holidays",

    description:
      "Explore hotel, getaway and holiday recommendations for different destinations and budgets.",

    icon:
      "🏨",
  },

  {
    href:
      "/search/flights",

    eyebrow:
      "Flights",

    title:
      "Flight recommendations",

    description:
      "Browse focused flight searches based on routes, dates, budgets and travel preferences.",

    icon:
      "✈️",
  },

  {
    href:
      "/search/entertainment",

    eyebrow:
      "Experiences",

    title:
      "Entertainment and activities",

    description:
      "Discover events, attractions and memorable experiences matched to different interests.",

    icon:
      "🎟️",
  },

  {
    href:
      "/search/vehicles",

    eyebrow:
      "Automotive",

    title:
      "Vehicles and car parts",

    description:
      "Explore vehicle recommendations and compatible parts for specific makes, models and engines.",

    icon:
      "🚘",
  },

  {
    href:
      "/search/services",

    eyebrow:
      "Services",

    title:
      "Useful service recommendations",

    description:
      "Find suitable providers and practical services researched around your individual needs.",

    icon:
      "🧭",
  },
];

const organizationSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "Organization",

  "@id":
    absoluteUrl(
      "/#organization"
    ),

  name:
    siteConfig.officialName,

  alternateName:
    siteConfig.name,

  url:
    siteConfig.url,

  logo: {
    "@type":
      "ImageObject",

    url:
      absoluteUrl(
        siteConfig.socialImage
      ),
  },
};

const websiteSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "WebSite",

  "@id":
    absoluteUrl(
      "/#website"
    ),

  name:
    siteConfig.name,

  alternateName:
    siteConfig.officialName,

  url:
    siteConfig.url,

  description:
    siteConfig.description,

  inLanguage:
    siteConfig.language,

  publisher: {
    "@id":
      absoluteUrl(
        "/#organization"
      ),
  },
};

const homePageSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "WebPage",

  "@id":
    absoluteUrl(
      "/#webpage"
    ),

  url:
    siteConfig.url,

  name:
    "Beacon AI personalised recommendations",

  description:
    siteConfig.description,

  inLanguage:
    siteConfig.language,

  isPartOf: {
    "@id":
      absoluteUrl(
        "/#website"
      ),
  },

  about: {
    "@id":
      absoluteUrl(
        "/#organization"
      ),
  },
};

const categoryListSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "ItemList",

  name:
    "Beacon AI recommendation categories",

  numberOfItems:
    searchCategories.length,

  itemListElement:
    searchCategories.map(
      (
        category,
        index
      ) => ({
        "@type":
          "ListItem",

        position:
          index + 1,

        name:
          category.title,

        url:
          absoluteUrl(
            category.href
          ),
      })
    ),
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

        <BeaconHero />

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
                    <span
                      aria-hidden="true"
                    >
                      📱
                    </span>

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
                    <span
                      aria-hidden="true"
                    >
                      ✓
                    </span>

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
                How Beacon Helps
              </p>

              <h2
                id="how-beacon-helps"
                className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl"
              >
                Five strong choices. Not five hundred results.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                Beacon learns what matters to you, compares suitable options
                and explains why each recommendation deserves your attention.
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {categories.map(
                (
                  category
                ) => (
                  <article
                    key={
                      category.id
                    }
                    id={
                      category.id
                    }
                    className="scroll-mt-32 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl"
                  >
                    <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-900">
                      {
                        category.eyebrow
                      }
                    </p>

                    <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                      {
                        category.title
                      }
                    </h3>

                    <p className="mt-4 leading-7 text-slate-600">
                      {
                        category.description
                      }
                    </p>

                    <div className="mt-6 space-y-3">
                      {category.examples.map(
                        (
                          example
                        ) => (
                          <div
                            key={
                              example
                            }
                            className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-700"
                          >
                            “
                            {
                              example
                            }
                            ”
                          </div>
                        )
                      )}
                    </div>
                  </article>
                )
              )}
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
                  entertainment, vehicles and everyday services.
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
              {searchCategories.map(
                (
                  category
                ) => (
                  <article
                    key={
                      category.href
                    }
                    className="group flex h-full flex-col rounded-[2rem] border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                          {
                            category.eyebrow
                          }
                        </p>

                        <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                          <Link
                            href={
                              category.href
                            }
                            className="transition group-hover:text-blue-800"
                          >
                            {
                              category.title
                            }
                          </Link>
                        </h3>
                      </div>

                      <span
                        aria-hidden="true"
                        className="text-4xl"
                      >
                        {
                          category.icon
                        }
                      </span>
                    </div>

                    <p className="mt-4 flex-1 leading-7 text-slate-600">
                      {
                        category.description
                      }
                    </p>

                    <Link
                      href={
                        category.href
                      }
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
                )
              )}
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
                Recommendations built around you.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                Beacon is not designed to overwhelm you with sponsored
                listings. It is designed to understand your request, compare
                trusted options and explain the five strongest matches in
                plain English.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Personalised recommendations",
                "Clear Beacon Score",
                "Trusted partner links",
                "Transparent sponsored labels",
                "Saved preferences",
                "Price and holiday alerts",
              ].map(
                (
                  item
                ) => (
                  <div
                    key={
                      item
                    }
                    className="rounded-2xl border border-white/15 bg-white/10 p-5 font-bold backdrop-blur"
                  >
                    ✓ {item}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section
          className="px-6 py-20"
          aria-labelledby="beacon-plus"
        >
          <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 text-center shadow-2xl sm:p-12">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
              Beacon+
            </p>

            <h2
              id="beacon-plus"
              className="mt-4 text-4xl font-black tracking-tight text-slate-950"
            >
              Your personal shopper gets better with you.
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