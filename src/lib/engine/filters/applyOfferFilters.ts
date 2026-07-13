import type { BeaconIntent } from "@/lib/types";
import type { PartnerOffer } from "@/lib/partners/types";

export type FilteredOffer = {
  offer: PartnerOffer;
  filterNotes: string[];
};

function normaliseText(values: string[]): string {
  return values.join(" ").toLowerCase();
}

function matchesBrand(
  offer: PartnerOffer,
  intent: BeaconIntent
): boolean {
  if (!intent.brands || intent.brands.length === 0) {
    return true;
  }

  const offerText = normaliseText([
    offer.provider,
    offer.title,
    offer.description,
    ...offer.features,
  ]);

  return intent.brands.some((brand) =>
    offerText.includes(brand.toLowerCase())
  );
}

function isWithinReasonableBudget(
  offer: PartnerOffer,
  intent: BeaconIntent
): boolean {
  if (!intent.budget || typeof offer.price !== "number") {
    return true;
  }

  /*
   * Beacon permits options up to 20% above the stated budget.
   * This allows a genuinely stronger recommendation to remain visible,
   * while excluding clearly unsuitable results.
   */
  const maximumAllowedPrice = intent.budget * 1.2;

  return offer.price <= maximumAllowedPrice;
}

function buildFilterNotes(
  offer: PartnerOffer,
  intent: BeaconIntent
): string[] {
  const notes: string[] = [];

  if (
    intent.budget &&
    typeof offer.price === "number" &&
    offer.price <= intent.budget
  ) {
    notes.push("Within the stated budget.");
  }

  if (
    intent.budget &&
    typeof offer.price === "number" &&
    offer.price > intent.budget
  ) {
    notes.push("Retained as a near-budget alternative.");
  }

  if (intent.brands && intent.brands.length > 0) {
    notes.push("Matches a requested brand.");
  }

  return notes;
}

export function applyOfferFilters(
  offers: PartnerOffer[],
  intent: BeaconIntent
): FilteredOffer[] {
  return offers
    .filter((offer) => offer.category === intent.category)
    .filter((offer) => matchesBrand(offer, intent))
    .filter((offer) => isWithinReasonableBudget(offer, intent))
    .map((offer) => ({
      offer,
      filterNotes: buildFilterNotes(offer, intent),
    }));
}