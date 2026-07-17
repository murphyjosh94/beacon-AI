import type {
  Metadata,
} from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getSearchPagesByCategory,
} from "@/lib/search/SearchPageRepository";

import {
  getPublicCategoryLabel,
  isPublicSearchCategory,
  type PublicSearchCategory,
} from "@/lib/search/SearchSlug";

import {
  absoluteUrl,
  siteConfig,
} from "@/lib/seo/SiteConfig";

type SearchCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

type CategoryContent = {
  heading: string;
  description: string;
  emptyMessage: string;
};

const CATEGORY_CONTENT: Record<
  PublicSearchCategory,
  CategoryContent
> = {
  products: {
    heading:
      "Product recommendations",
    description:
      "Explore personalised product comparisons created by Beacon AI, including transparent scores, practical highlights and pricing where available.",
    emptyMessage:
      "No public product recommendations have been published yet.",
  },

  hotels: {
    heading:
      "Hotel and holiday recommendations",
    description:
      "Explore personalised hotel, getaway and holiday recommendations researched around different budgets, destinations and travel preferences.",
    emptyMessage:
      "No public hotel or holiday recommendations have been published yet.",
  },

  flights: {
    heading:
      "Flight recommendations",
    description:
      "Explore flight searches researched by Beacon AI, with focused recommendations based on routes, preferences and available travel data.",
    emptyMessage:
      "No public flight recommendations have been published yet.",
  },

  entertainment: {
    heading:
      "Entertainment and experience recommendations",
    description:
      "Discover personalised recommendations for entertainment, activities, events and memorable local experiences.",
    emptyMessage:
      "No public entertainment recommendations have been published yet.",
  },

  vehicles: {
    heading:
      "Vehicle and car-part recommendations",
    description:
      "Explore vehicle-related recommendations, including compatible parts and practical options researched around specific makes, models and engines.",
    emptyMessage:
      "No public vehicle recommendations have been published yet.",
  },

  services: {
    heading:
      "Service recommendations",
    description:
      "Explore personalised recommendations for useful services, providers and practical solutions researched by Beacon AI.",
    emptyMessage:
      "No public service recommendations have been published yet.",
  },

  recommendations: {
    heading:
      "Latest Beacon AI recommendations",
    description:
      "Browse personalised recommendations across shopping, travel, entertainment, vehicles and everyday decisions.",
    emptyMessage:
      "No public recommendations have been published yet.",
  },
};

function serialiseJsonLd(
  value: unknown
): string {
  return JSON.stringify(value).replace(
    /</g,
    "\\u003c"
  );
}

function formatDate(
  value: Date
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "long",
    }
  ).format(value);
}

export async function generateMetadata({
  params,
}: SearchCategoryPageProps): Promise<Metadata> {
  const {
    category,
  } = await params;

  if (
    !isPublicSearchCategory(
      category
    )
  ) {
    return {
      title:
        "Recommendations not found",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const categoryLabel =
    getPublicCategoryLabel(
      category
    );

  const content =
    CATEGORY_CONTENT[
      category
    ];

  const canonicalPath =
    `/search/${category}`;

  return {
    title:
      content.heading,

    description:
      content.description,

    alternates: {
      canonical:
        canonicalPath,
    },

    openGraph: {
      type:
        "website",

      url:
        absoluteUrl(
          canonicalPath
        ),

      siteName:
        siteConfig.name,

      title:
        `${content.heading} | Beacon AI`,

      description:
        content.description,

      images: [
        {
          url:
            absoluteUrl(
              siteConfig.socialImage
            ),

          width: 1200,
          height: 630,

          alt:
            `${categoryLabel} recommendations from Beacon AI`,
        },
      ],
    },

    twitter: {
      card:
        "summary_large_image",

      title:
        `${content.heading} | Beacon AI`,

      description:
        content.description,

      images: [
        absoluteUrl(
          siteConfig.socialImage
        ),
      ],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SearchCategoryPage({
  params,
}: SearchCategoryPageProps) {
  const {
    category,
  } = await params;

  if (
    !isPublicSearchCategory(
      category
    )
  ) {
    notFound();
  }

  const categoryLabel =
    getPublicCategoryLabel(
      category
    );

  const content =
    CATEGORY_CONTENT[
      category
    ];

  const pages =
    await getSearchPagesByCategory(
      category,
      30
    );

  const canonicalPath =
    `/search/${category}`;

  const canonicalUrl =
    absoluteUrl(
      canonicalPath
    );

  const jsonLd = {
    "@context":
      "https://schema.org",

    "@graph": [
      {
        "@type":
          "CollectionPage",

        "@id":
          `${canonicalUrl}#webpage`,

        url:
          canonicalUrl,

        name:
          content.heading,

        description:
          content.description,

        isPartOf: {
          "@id":
            `${siteConfig.url}/#website`,
        },

        inLanguage:
          siteConfig.language,
      },

      {
        "@type":
          "BreadcrumbList",

        itemListElement: [
          {
            "@type":
              "ListItem",

            position:
              1,

            name:
              "Home",

            item:
              siteConfig.url,
          },

          {
            "@type":
              "ListItem",

            position:
              2,

            name:
              categoryLabel,

            item:
              canonicalUrl,
          },
        ],
      },

      {
        "@type":
          "ItemList",

        name:
          content.heading,

        numberOfItems:
          pages.length,

        itemListElement:
          pages.map(
            (
              page,
              index
            ) => ({
              "@type":
                "ListItem",

              position:
                index + 1,

              name:
                page.title,

              url:
                absoluteUrl(
                  page.path
                ),
            })
          ),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            serialiseJsonLd(
              jsonLd
            ),
        }}
      />

      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm font-semibold text-blue-100"
          >
            <Link
              href="/"
              className="transition hover:text-white"
            >
              Home
            </Link>

            <span
              aria-hidden="true"
            >
              /
            </span>

            <span className="text-white">
              {categoryLabel}
            </span>
          </nav>

          <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-200">
            Beacon AI Discovery
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            {content.heading}
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-blue-50">
            {content.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              {pages.length} published searches
            </span>

            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              Personalised recommendations
            </span>

            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              Transparent Beacon Scores
            </span>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
              Latest searches
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Explore recent {categoryLabel.toLowerCase()}
            </h2>
          </div>

          {pages.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200 sm:p-12">
              <h2 className="text-2xl font-black text-slate-950">
                Nothing published yet
              </h2>

              <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
                {content.emptyMessage}
              </p>

              <Link
                href="/#beacon-search"
                className="mt-7 inline-flex rounded-xl bg-blue-900 px-7 py-4 font-extrabold text-white transition hover:bg-blue-800"
              >
                Start a Beacon search
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {pages.map(
                (page) => (
                  <article
                    key={
                      page.id
                    }
                    className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-2xl sm:p-8"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-900">
                        {categoryLabel}
                      </span>

                      <span className="text-sm font-semibold text-slate-500">
                        {formatDate(
                          page.updatedAt
                        )}
                      </span>
                    </div>

                    <h2 className="mt-5 text-2xl font-black text-slate-950">
                      <Link
                        href={
                          page.path
                        }
                        className="transition hover:text-blue-800"
                      >
                        {page.title}
                      </Link>
                    </h2>

                    <p className="mt-4 flex-1 leading-7 text-slate-600">
                      {page.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold text-slate-600">
                      <span className="rounded-full bg-slate-100 px-3 py-2">
                        {
                          page.response
                            .recommendations
                            .length
                        } options
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-2">
                        {page.response
                          .liveData
                          ? "Live data"
                          : "Beacon research"}
                      </span>
                    </div>

                    <Link
                      href={
                        page.path
                      }
                      className="mt-6 inline-flex w-fit rounded-xl bg-blue-900 px-5 py-3 font-extrabold text-white transition hover:bg-blue-800"
                    >
                      View recommendations
                    </Link>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black text-slate-950">
            Get recommendations built around you
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Tell Beacon your budget, preferences and priorities to receive focused recommendations researched around what matters to you.
          </p>

          <Link
            href="/#beacon-search"
            className="mt-7 inline-flex rounded-xl bg-blue-900 px-7 py-4 font-extrabold text-white transition hover:bg-blue-800"
          >
            Start a new search
          </Link>
        </div>
      </section>
    </main>
  );
}