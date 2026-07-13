import { applyOfferFilters } from "@/lib/engine/filters/applyOfferFilters";
import { rankRecommendations } from "@/lib/engine/ranking/rankRecommendations";
import type {
  BeaconIntent,
  BeaconRecommendation,
} from "@/lib/types";
import { demoOffers } from "@/lib/partners/demoOffers";

export function buildDemoRecommendations(
  intent: BeaconIntent
): BeaconRecommendation[] {
  const categoryOffers = demoOffers.filter(
    (offer) => offer.category === intent.category
  );

  const filteredOffers = applyOfferFilters(
    categoryOffers,
    intent
  );

  if (filteredOffers.length > 0) {
    return rankRecommendations(filteredOffers, intent);
  }

  /*
   * If no offer passes every hard filter, Beacon falls back to the
   * category inventory and clearly ranks the nearest alternatives.
   */
  const fallbackOffers = categoryOffers.map((offer) => ({
    offer,
    filterNotes: [
      "This is the nearest available alternative to your request.",
    ],
  }));

  return rankRecommendations(fallbackOffers, intent);
}