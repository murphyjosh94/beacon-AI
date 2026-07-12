"use client";

import { FormEvent, useState } from "react";
import RecommendationResults from "@/components/engine/RecommendationResults";
import type {
  BeaconCategory,
  BeaconSearchResponse,
} from "@/lib/engine/types";

const categories: {
  value: BeaconCategory;
  label: string;
  example: string;
}[] = [
  {
    value: "shopping",
    label: "Shopping",
    example: "Find me the best cordless vacuum for pet hair under £300",
  },
  {
    value: "getaways",
    label: "Getaways",
    example: "Find a family staycation near a sandy beach under £1,200",
  },
  {
    value: "entertainment",
    label: "Entertainment",
    example: "Find a weekend experience for two in Manchester",
  },
];

export default function BeaconSearch() {
  const [category, setCategory] =
    useState<BeaconCategory>("getaways");

  const [query, setQuery] = useState("");
  const [result, setResult] =
    useState<BeaconSearchResponse | null>(null);

  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState("");

  const selectedCategory = categories.find(
    (item) => item.value === category
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = query.trim();

    if (!value || isResearching) {
      return;
    }

    setError("");
    setResult(null);
    setIsResearching(true);

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: value,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Beacon could not complete this search."
        );
      }

      setResult(data as BeaconSearchResponse);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not complete this search."
      );
    } finally {
      setIsResearching(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        {categories.map((item) => {
          const active = category === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setCategory(item.value);
                setQuery(item.example);
                setResult(null);
                setError("");
              }}
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
        <label htmlFor="beacon-search" className="sr-only">
          Tell Beacon what you are looking for
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            id="beacon-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              selectedCategory?.example ??
              "Tell Beacon what you are looking for..."
            }
            rows={2}
            className="min-h-24 flex-1 resize-none rounded-2xl border-2 border-slate-300 bg-white px-5 py-4 text-lg font-medium text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={isResearching}
            className="rounded-2xl bg-blue-900 px-8 py-4 text-lg font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isResearching ? "Researching..." : "Ask Beacon"}
          </button>
        </div>
      </form>

      <p className="mt-4 text-right text-sm font-semibold text-blue-50">
        Five free personalised searches each day.
      </p>

      {isResearching && (
        <div
          aria-live="polite"
          className="mt-8 rounded-3xl border border-white/20 bg-slate-950/70 p-6 text-left shadow-2xl backdrop-blur-xl"
        >
          <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-200">
            Beacon is researching
          </p>

          <div className="mt-5 space-y-3">
            {[
              "Understanding your request",
              "Selecting trusted partner sources",
              "Comparing suitable options",
              "Calculating Beacon Scores",
            ].map((step) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white"
              >
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-300" />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-left font-semibold text-red-800"
        >
          {error}
        </div>
      )}

      {result && !isResearching && (
        <div className="mt-8">
          <RecommendationResults
            query={result.query}
            intent={result.intent}
            recommendations={result.recommendations}
            demo={result.isDemo}
          />
        </div>
      )}
    </div>
  );
}