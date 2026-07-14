"use client";

import {
  FormEvent,
  useState,
} from "react";

import GeneralAnswerCard from "@/components/engine/GeneralAnswerCard";

import type {
  BeaconApiResponse,
  BeaconResponse,
} from "@/services/response/BeaconResponse";

type SearchCategory =
  | "shopping"
  | "getaways"
  | "entertainment";

type SearchCategoryDefinition = {
  value: SearchCategory;
  label: string;
  example: string;
  placeholder: string;
};

const categories: SearchCategoryDefinition[] = [
  {
    value: "shopping",
    label: "Shopping",
    example:
      "Find me a smart navy suit for a man with a 34-inch waist and 38-inch chest under £80",
    placeholder:
      "Describe the product, budget, size, colour or features you need...",
  },
  {
    value: "getaways",
    label: "Getaways",
    example:
      "Find me highly rated beachfront hotels in Tenerife for two adults under £150 per night",
    placeholder:
      "Describe the destination, hotel style, budget or facilities you want. Dates are optional...",
  },
  {
    value: "entertainment",
    label: "Ask Beacon",
    example:
      "Help me plan a memorable weekend for two in Manchester",
    placeholder:
      "Ask Beacon for advice, ideas, explanations, research or recommendations...",
  },
];

function getScoreLabel(
  score: number
): string {
  if (score >= 90) {
    return "Exceptional";
  }

  if (score >= 80) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Very Good";
  }

  if (score >= 60) {
    return "Good";
  }

  if (score >= 50) {
    return "Fair";
  }

  return "Limited Match";
}

function getCategoryPrefix(
  category: SearchCategory
): string {
  if (category === "shopping") {
    return "Shopping request";
  }

  if (category === "getaways") {
    return "Holiday and getaway request";
  }

  return "Entertainment and experience request";
}

function getLoadingSteps(
  category: SearchCategory
): string[] {
  if (category === "shopping") {
    return [
      "Understanding your shopping request",
      "Searching live product data",
      "Checking prices and retailers",
      "Calculating Beacon Scores",
      "Preparing the strongest recommendations",
    ];
  }

  if (category === "getaways") {
    return [
      "Understanding your travel preferences",
      "Exploring suitable destinations and accommodation",
      "Comparing locations, ratings and amenities",
      "Checking live availability when dates are supplied",
      "Preparing the strongest matches",
    ];
  }

  return [
    "Understanding your request",
    "Selecting the best Beacon capability",
    "Researching current information where needed",
    "Preparing a clear answer",
  ];
}

function readApiError(
  response: BeaconApiResponse
): string {
  if (!response.success) {
    return response.error.message;
  }

  return "Beacon could not complete this request.";
}

function getEmptyResultsMessage(
  source: BeaconResponse["source"]
): string {
  if (source === "hotel") {
    return (
      "Try broadening the destination, budget, preferred area, " +
      "hotel style or amenities. Dates are optional and can be " +
      "added later when you want date-specific availability."
    );
  }

  if (source === "shopping") {
    return (
      "Try broadening the budget, brand, size, colour, retailer " +
      "or features you are willing to consider."
    );
  }

  return (
    "Try broadening your request or adding more detail about " +
    "the result you are hoping to find."
  );
}

function getResultIcon(
  category: string
): string {
  if (category === "holiday") {
    return "🏨";
  }

  if (category === "experience") {
    return "🎟️";
  }

  if (category === "service") {
    return "🧭";
  }

  return "🛍️";
}

export default function BeaconSearch() {
  const [category, setCategory] =
    useState<SearchCategory>("shopping");

  const [query, setQuery] =
    useState("");

  const [result, setResult] =
    useState<BeaconResponse | null>(
      null
    );

  const [isResearching, setIsResearching] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedCategory =
    categories.find(
      (item) =>
        item.value === category
    ) ?? categories[0];

  const loadingSteps =
    getLoadingSteps(category);

  function chooseCategory(
    nextCategory: SearchCategory
  ) {
    const selected =
      categories.find(
        (item) =>
          item.value === nextCategory
      );

    setCategory(nextCategory);
    setQuery(
      selected?.example ?? ""
    );
    setResult(null);
    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const value = query.trim();

    if (
      !value ||
      isResearching
    ) {
      return;
    }

    setError("");
    setResult(null);
    setIsResearching(true);

    try {
      const response = await fetch(
        "/api/recommendations",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            query: `${getCategoryPrefix(
              category
            )}: ${value}`,
          }),
        }
      );

      const data =
        (await response.json()) as BeaconApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          readApiError(data)
        );
      }

      setResult(data.data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not complete this request."
      );
    } finally {
      setIsResearching(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        {categories.map((item) => {
          const active =
            category === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                chooseCategory(
                  item.value
                )
              }
              className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                active
                  ? "bg-white text-blue-950 shadow-lg"
                  : "border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-white/30 bg-white/95 p-3 shadow-2xl backdrop-blur-xl"
      >
        <label
          htmlFor="beacon-search"
          className="sr-only"
        >
          Tell Beacon what you need
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            id="beacon-search"
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder={
              selectedCategory.placeholder
            }
            rows={2}
            className="min-h-24 flex-1 resize-none rounded-2xl border-2 border-slate-300 bg-white px-5 py-4 text-lg font-medium text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={
              isResearching ||
              query.trim().length === 0
            }
            className="rounded-2xl bg-blue-900 px-8 py-4 text-lg font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResearching
              ? "Researching..."
              : "Ask Beacon"}
          </button>
        </div>
      </form>

      <p className="mt-4 text-right text-sm font-semibold text-blue-50">
        Five free personalised searches each day.
      </p>

      {category === "getaways" && (
        <div className="mt-4 rounded-2xl border border-white/15 bg-slate-950/55 px-5 py-4 text-left text-sm leading-6 text-blue-50 backdrop-blur">
          <span className="font-extrabold">
            Plan your trip your way.
          </span>{" "}
          Explore destinations and hotels without dates.
          Add exact dates only when you want Beacon to check
          date-specific availability and prices.
        </div>
      )}

      {isResearching && (
        <div
          aria-live="polite"
          className="mt-8 rounded-3xl border border-white/20 bg-slate-950/75 p-6 text-left shadow-2xl backdrop-blur-xl"
        >
          <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-200">
            Beacon is researching
          </p>

          <div className="mt-5 space-y-3">
            {loadingSteps.map(
              (step) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white"
                >
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-300" />

                  {step}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-left shadow-xl"
        >
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-amber-800">
            Beacon AI
          </p>

          <p className="mt-3 text-lg font-bold text-slate-900">
            {error}
          </p>

          <p className="mt-3 leading-7 text-slate-600">
            Try adding more detail about what you need,
            such as your destination, budget, preferred
            area, hotel style, product features or other
            priorities. Travel dates are always optional.
          </p>
        </div>
      )}

      {result &&
        !isResearching &&
        result.responseType ===
          "general_answer" && (
          <GeneralAnswerCard
            query={result.query}
            answer={result.answer}
            usedWebSearch={
              result.usedWebSearch
            }
            generatedAt={
              result.generatedAt
            }
          />
        )}

      {result &&
        !isResearching &&
        result.responseType ===
          "recommendations" && (
          <section className="mt-10 text-left">
            <div className="rounded-3xl border border-white/20 bg-slate-950/80 p-6 text-white shadow-2xl backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-200">
                    Beacon Results
                  </p>

                  <h2 className="mt-3 text-2xl font-extrabold">
                    {result.recommendations.length ===
                    1
                      ? "One carefully selected option"
                      : `${result.recommendations.length} carefully selected options`}
                  </h2>
                </div>

                <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-100">
                  {result.liveData
                    ? "Live data"
                    : "Beacon research"}
                </div>
              </div>

              <p className="mt-4 leading-7 text-blue-50">
                {result.aiSummary ||
                  result.summary}
              </p>
            </div>

            {result.recommendations.length ===
            0 ? (
              <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-xl">
                <h3 className="text-2xl font-extrabold text-slate-900">
                  No suitable options found
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {getEmptyResultsMessage(
                    result.source
                  )}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-6">
                {result.recommendations.map(
                  (
                    recommendation,
                    index
                  ) => (
                    <article
                      key={
                        recommendation.id
                      }
                      className="overflow-hidden rounded-3xl bg-white shadow-2xl"
                    >
                      <div className="grid md:grid-cols-[220px_1fr]">
                        <div className="flex min-h-52 items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-6">
                          {recommendation.imageUrl ? (
                            <img
                              src={
                                recommendation.imageUrl
                              }
                              alt={
                                recommendation.title
                              }
                              className="max-h-48 w-full object-contain"
                            />
                          ) : (
                            <div className="text-center">
                              <div className="text-5xl">
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
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                                Option {index + 1}
                              </p>

                              <h3 className="mt-2 text-2xl font-extrabold text-slate-950">
                                {
                                  recommendation.title
                                }
                              </h3>

                              {recommendation.merchant && (
                                <p className="mt-2 font-semibold text-slate-500">
                                  {
                                    recommendation.merchant
                                  }
                                </p>
                              )}
                            </div>

                            <div className="rounded-2xl bg-blue-950 px-5 py-4 text-center text-white">
                              <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                                Beacon Score
                              </p>

                              <p className="mt-1 text-3xl font-black">
                                {Math.round(
                                  recommendation
                                    .score
                                    .overall
                                )}
                              </p>

                              <p className="text-xs font-bold text-blue-100">
                                {getScoreLabel(
                                  recommendation
                                    .score
                                    .overall
                                )}
                              </p>
                            </div>
                          </div>

                          {recommendation.price && (
                            <p className="mt-5 text-2xl font-extrabold text-blue-900">
                              {
                                recommendation
                                  .price
                                  .display
                              }
                            </p>
                          )}

                          <p className="mt-5 leading-7 text-slate-600">
                            {
                              recommendation.description
                            }
                          </p>

                          <div className="mt-5 rounded-2xl bg-blue-50 p-5">
                            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                              Why Beacon selected it
                            </p>

                            <p className="mt-2 leading-7 text-slate-700">
                              {
                                recommendation.reason
                              }
                            </p>
                          </div>

                          {recommendation.highlights
                            .length > 0 && (
                            <div className="mt-5">
                              <p className="font-extrabold text-slate-900">
                                Highlights
                              </p>

                              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                {recommendation.highlights.map(
                                  (
                                    highlight
                                  ) => (
                                    <li
                                      key={
                                        highlight
                                      }
                                      className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                                    >
                                      ✓ {highlight}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {recommendation.warnings &&
                            recommendation.warnings
                              .length > 0 && (
                              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <p className="font-extrabold text-amber-900">
                                  Check before deciding
                                </p>

                                <ul className="mt-2 space-y-2 text-sm text-amber-900">
                                  {recommendation.warnings.map(
                                    (
                                      warning
                                    ) => (
                                      <li
                                        key={
                                          warning
                                        }
                                      >
                                        • {warning}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {recommendation.url ? (
                            <a
                              href={
                                recommendation.url
                              }
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="mt-6 inline-flex rounded-xl bg-blue-900 px-6 py-3 font-extrabold text-white transition hover:bg-blue-800"
                            >
                              View Option
                            </a>
                          ) : (
                            <p className="mt-6 text-sm font-semibold text-slate-500">
                              A direct destination link was
                              not supplied for this result.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        )}
    </div>
  );
}