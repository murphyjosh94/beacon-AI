import { calculateBeaconScore } from "@/lib/engine/scoring/calculateBeaconScore";
import type {
  BeaconIntent,
  BeaconRecommendation,
} from "@/lib/engine/types";
import type { FilteredOffer } from "@/lib/engine/filters/applyOfferFilters";

export function rankRecommendations(
  filteredOffers: FilteredOffer[],
  intent: BeaconIntent
): BeaconRecommendation[] {
  return filteredOffers
    .map(({ offer, filterNotes }) => {
      const score = calculateBeaconScore(offer, intent);

      return {
        id: offer.id,
        title: offer.title,
        provider: offer.provider,
        description: offer.description,
        score: score.total,

        scoreDetails: {
          budgetScore: score.budgetScore,
          preferenceScore: score.preferenceScore,
          completenessScore: score.completenessScore,
          trustScore: score.trustScore,
        },

        reasons: [...filterNotes, ...score.reasons].filter(
          (reason, index, allReasons) =>
            allReasons.indexOf(reason) === index
        ),

        price: offer.price,
        priceLabel: offer.priceLabel,
        destinationUrl: offer.destinationUrl,
        features: offer.features,
        sponsored: offer.sponsored,
      };
    })
    .sort((first, second) => {
      /*
       * Sponsorship never affects ranking.
       * Results are ordered strictly by suitability score.
       */
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      /*
       * If two results have the same score, prefer the lower price.
       */
      const firstPrice =
        typeof first.price === "number"
          ? first.price
          : Number.POSITIVE_INFINITY;

      const secondPrice =
        typeof second.price === "number"
          ? second.price
          : Number.POSITIVE_INFINITY;

      return firstPrice - secondPrice;
    })
    .slice(0, 5);
}