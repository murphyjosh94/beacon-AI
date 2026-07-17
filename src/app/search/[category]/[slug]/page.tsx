import type {
  Metadata,
} from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getSearchPage,
} from "@/lib/search/SearchPageRepository";
import {
  getPublicCategoryLabel,
  isPublicSearchCategory,
} from "@/lib/search/SearchSlug";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://beacon-ai.co.uk"
).replace(/\/$/, "");

type SearchPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

function getScoreLabel(
  score: number
): string {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 50) return "Fair";
  return "Limited Match";
}

function getResultIcon(
  category: string
): string {
  if (category === "holiday") return "🏨";
  if (category === "experience") return "🎟️";
  if (category === "service") return "🧭";
  if (
    category === "vehicle_parts" ||
    category === "automotive"
  ) {
    return "🚘";
  }

  return "🛍️";
}

function serialiseJsonLd(
  value: unknown
): string {
  return JSON.stringify(value).replace(
    /</g,
    "\\u003c"
  );
}

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { category, slug } = await params;

  if (!isPublicSearchCategory(category)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const page = await getSearchPage(
    category,
    slug
  );

  if (!page) {
    return {
      title: "Search not found | Beacon AI",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = `${SITE_URL}${page.path}`;

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: `${page.title} | Beacon AI`,
      description: page.description,
      siteName: "Beacon-AI",
      images: [
        {
          url: `${SITE_URL}/images/beacon-logo.png`,
          width: 1200,
          height: 630,
          alt: "Beacon AI",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | Beacon AI`,
      description: page.description,
      images: [
        `${SITE_URL}/images/beacon-logo.png`,
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SearchPage({
  params,
}: SearchPageProps) {
  const { category, slug } = await params;

  if (!isPublicSearchCategory(category)) {
    notFound();
  }

  const page = await getSearchPage(
    category,
    slug
  );

  if (!page) {
    notFound();
  }

  const categoryLabel =
    getPublicCategoryLabel(page.category);

  const canonicalUrl = `${SITE_URL}${page.path}`;
  const recommendations =
    page.response.recommendations;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: page.title,
        description: page.description,
        datePublished:
          page.generatedAt.toISOString(),
        dateModified:
          page.updatedAt.toISOString(),
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryLabel,
            item: `${SITE_URL}/search/${page.category}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: page.title,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: page.title,
        numberOfItems:
          recommendations.length,
        itemListElement:
          recommendations.map(
            (recommendation, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: recommendation.title,
              url:
                recommendation.url ??
                canonicalUrl,
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
          __html: serialiseJsonLd(jsonLd),
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
            <span aria-hidden="true">/</span>
            <span>{categoryLabel}</span>
            <span aria-hidden="true">/</span>
            <span className="text-white">
              {page.title}
            </span>
          </nav>

          <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-200">
            Beacon AI Recommendations
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            {page.title}
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-blue-50">
            {page.response.aiSummary ||
              page.response.summary}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              {recommendations.length} personalised recommendations
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              {page.response.liveData
                ? "Live data used"
                : "Beacon research"}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              Transparent Beacon Scores
            </span>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                Beacon Results
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Carefully selected options
              </h2>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              Generated {new Intl.DateTimeFormat(
                "en-GB",
                {
                  dateStyle: "long",
                }
              ).format(page.generatedAt)}
            </p>
          </div>

          <div className="grid gap-7">
            {recommendations.map(
              (recommendation, index) => (
                <article
                  key={recommendation.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
                >
                  <div className="grid md:grid-cols-[240px_1fr]">
                    <div className="flex min-h-56 items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-6">
                      {recommendation.imageUrl ? (
                        <img
                          src={recommendation.imageUrl}
                          alt={recommendation.title}
                          className="max-h-52 w-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-6xl">
                            {getResultIcon(
                              recommendation.category
                            )}
                          </div>
                          <p className="mt-3 text-sm font-bold text-slate-500">
                            Beacon recommendation
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-6 sm:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="max-w-3xl">
                          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                            Option {index + 1}
                          </p>
                          <h3 className="mt-2 text-2xl font-black text-slate-950">
                            {recommendation.title}
                          </h3>
                          {recommendation.merchant && (
                            <p className="mt-2 font-semibold text-slate-500">
                              {recommendation.merchant}
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl bg-blue-950 px-5 py-4 text-center text-white">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                            Beacon Score
                          </p>
                          <p className="mt-1 text-3xl font-black">
                            {Math.round(
                              recommendation.score.overall
                            )}
                          </p>
                          <p className="text-xs font-bold text-blue-100">
                            {getScoreLabel(
                              recommendation.score.overall
                            )}
                          </p>
                        </div>
                      </div>

                      {recommendation.price && (
                        <p className="mt-5 text-2xl font-black text-blue-900">
                          {recommendation.price.display}
                        </p>
                      )}

                      <p className="mt-5 leading-7 text-slate-600">
                        {recommendation.description}
                      </p>

                      <div className="mt-5 rounded-2xl bg-blue-50 p-5">
                        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                          Why Beacon selected it
                        </p>
                        <p className="mt-2 leading-7 text-slate-700">
                          {recommendation.reason}
                        </p>
                      </div>

                      {recommendation.highlights.length > 0 && (
                        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                          {recommendation.highlights.map(
                            (highlight) => (
                              <li
                                key={highlight}
                                className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                              >
                                ✓ {highlight}
                              </li>
                            )
                          )}
                        </ul>
                      )}

                      {recommendation.warnings &&
                        recommendation.warnings.length > 0 && (
                          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <p className="font-extrabold text-amber-900">
                              Check before deciding
                            </p>
                            <ul className="mt-2 space-y-2 text-sm text-amber-900">
                              {recommendation.warnings.map(
                                (warning) => (
                                  <li key={warning}>
                                    • {warning}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {recommendation.url ? (
                        <a
                          href={recommendation.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="mt-6 inline-flex rounded-xl bg-blue-900 px-6 py-3 font-extrabold text-white transition hover:bg-blue-800"
                        >
                          View Option
                        </a>
                      ) : (
                        <p className="mt-6 text-sm font-semibold text-slate-500">
                          A direct destination link was not supplied for this result.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black text-slate-950">
            Find recommendations built around you
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Tell Beacon what matters, including your budget, preferences and priorities, and receive five focused recommendations.
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