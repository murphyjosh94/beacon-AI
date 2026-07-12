import Link from "next/link";
import BeaconScore from "@/components/engine/BeaconScore";
import type { BeaconScoreDetails } from "@/lib/engine/types";

type RecommendationCardProps = {
  index: number;
  title: string;
  provider: string;
  description: string;
  score: number;
  scoreDetails: BeaconScoreDetails;
  reasons: string[];
  price?: number;
  priceLabel?: string;
  destinationUrl: string;
  features: string[];
  sponsored?: boolean;
};

export default function RecommendationCard({
  index,
  title,
  provider,
  description,
  score,
  scoreDetails,
  reasons,
  price,
  priceLabel,
  destinationUrl,
  features,
  sponsored = false,
}: RecommendationCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-800">
              Option {index}
            </p>

            {index === 1 && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-900">
                Best overall
              </span>
            )}

            {sponsored && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-900">
                Sponsored
              </span>
            )}
          </div>

          <h3 className="mt-3 text-2xl font-black text-slate-950">
            {title}
          </h3>

          <p className="mt-1 font-extrabold text-blue-900">
            {provider}
          </p>

          <p className="mt-3 leading-7 text-slate-600">
            {description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              >
                ✓ {feature}
              </span>
            ))}
          </div>

          {reasons.length > 0 && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Why Beacon chose this
              </p>

              <ul className="mt-3 space-y-2">
                {reasons.map((reason) => (
                  <li
                    key={reason}
                    className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700"
                  >
                    <span className="mt-1 text-blue-800">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-extrabold text-slate-800">
              See score breakdown
            </summary>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Budget match
                </p>
                <p className="mt-1 text-lg font-black text-slate-950">
                  {scoreDetails.budgetScore} / 30
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Preference match
                </p>
                <p className="mt-1 text-lg font-black text-slate-950">
                  {scoreDetails.preferenceScore} / 35
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Information quality
                </p>
                <p className="mt-1 text-lg font-black text-slate-950">
                  {scoreDetails.completenessScore} / 20
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Partner trust
                </p>
                <p className="mt-1 text-lg font-black text-slate-950">
                  {scoreDetails.trustScore} / 15
                </p>
              </div>
            </div>
          </details>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {typeof price === "number" && (
                <>
                  <p className="text-3xl font-black text-slate-950">
                    £{price.toLocaleString("en-GB")}
                  </p>

                  {priceLabel && (
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {priceLabel}
                    </p>
                  )}
                </>
              )}
            </div>

            <Link
              href={destinationUrl}
              className="inline-flex items-center justify-center rounded-xl bg-blue-900 px-6 py-3 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
            >
              View with {provider}
            </Link>
          </div>
        </div>

        <BeaconScore score={score} />
      </div>
    </article>
  );
}