import IntentSummary from "@/components/engine/IntentSummary";
import RecommendationCard from "@/components/engine/RecommendationCard";
import type {
  BeaconIntent,
  BeaconRecommendation,
} from "@/lib/types";

type RecommendationResultsProps = {
  query: string;
  intent: BeaconIntent;
  recommendations: BeaconRecommendation[];
  demo?: boolean;
};

export default function RecommendationResults({
  query,
  intent,
  recommendations,
  demo = false,
}: RecommendationResultsProps) {
  return (
    <div className="space-y-6">
      <IntentSummary intent={intent} />

      <div className="rounded-[2rem] border border-white/30 bg-white p-6 text-left shadow-2xl sm:p-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-800">
          Beacon Recommendations
        </p>

        <h2 className="mt-3 text-2xl font-black text-slate-950">
          Five strong options for:
        </h2>

        <p className="mt-2 text-lg font-semibold text-slate-600">
          “{query}”
        </p>

        <div className="mt-7 grid gap-5">
          {recommendations.map((recommendation, index) => (
            <RecommendationCard
              key={recommendation.id}
              index={index + 1}
              title={recommendation.title}
              provider={recommendation.provider}
              description={recommendation.description}
              score={recommendation.score}
              scoreDetails={recommendation.scoreDetails}
              reasons={recommendation.reasons}
              price={recommendation.price}
              priceLabel={recommendation.priceLabel}
              destinationUrl={recommendation.destinationUrl}
              features={recommendation.features}
              sponsored={recommendation.sponsored}
            />
          ))}
        </div>

        {demo && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm leading-6 text-blue-950">
              These are demonstration offers. Live availability, pricing and
              tracked partner links will replace them as Beacon&apos;s approved
              partner feeds are connected.
            </p>
          </div>
        )}

        <p className="mt-5 text-sm leading-6 text-slate-500">
          Beacon may earn commission when you choose a partner recommendation.
          Commission does not automatically increase a recommendation&apos;s
          Beacon Score.
        </p>
      </div>
    </div>
  );
}