import "server-only";

import type {
  RecommendationCategory,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

export type BeaconCapability =
  | "shopping"
  | "hotel_discovery"
  | "hotel_availability"
  | "flights"
  | "entertainment"
  | "merchant_feed"
  | "general_ai";

export type BeaconPlan = {
  capability: BeaconCapability;
  query: string;
  intent: SearchIntent;
  reason: string;
  requiresLiveProvider: boolean;
};

type SelectedBeaconCategory =
  | "shopping"
  | "getaways"
  | "entertainment"
  | null;

const FLIGHT_TERMS = [
  "flight",
  "flights",
  "fly",
  "airline",
  "airport",
  "return flight",
  "one way",
  "one-way",
  "departing",
  "departure",
];

const HOTEL_TERMS = [
  "hotel",
  "hotels",
  "accommodation",
  "resort",
  "villa",
  "apartment",
  "hostel",
  "bed and breakfast",
  "b&b",
  "stay",
  "staycation",
  "places to stay",
];

const ENTERTAINMENT_TERMS = [
  "concert",
  "event",
  "tickets",
  "hospitality",
  "football package",
  "sports package",
  "theatre",
  "show",
  "festival",
  "experience",
  "day out",
];

const CJS_TERMS = [
  "cd key",
  "cd keys",
  "game key",
  "steam key",
  "windows key",
  "office key",
  "software licence",
  "software license",
  "cjs",
];

const GSF_TERMS = [
  "car part",
  "car parts",
  "brake pads",
  "brake discs",
  "car battery",
  "engine oil",
  "wiper blades",
  "gsf",
];

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(
  query: string,
  terms: string[]
): boolean {
  return terms.some((term) =>
    query.includes(term)
  );
}

export function detectSelectedCategory(
  query: string
): SelectedBeaconCategory {
  const normalised = normalise(query);

  if (
    normalised.startsWith(
      "shopping request:"
    )
  ) {
    return "shopping";
  }

  if (
    normalised.startsWith(
      "holiday and getaway request:"
    )
  ) {
    return "getaways";
  }

  if (
    normalised.startsWith(
      "entertainment and experience request:"
    )
  ) {
    return "entertainment";
  }

  return null;
}

export function removeCategoryPrefix(
  query: string
): string {
  return query
    .replace(
      /^shopping request:\s*/i,
      ""
    )
    .replace(
      /^holiday and getaway request:\s*/i,
      ""
    )
    .replace(
      /^entertainment and experience request:\s*/i,
      ""
    )
    .trim();
}

export function mapSelectedCategory(
  category: SelectedBeaconCategory
): RecommendationCategory | null {
  if (category === "shopping") {
    return "product";
  }

  if (category === "getaways") {
    return "holiday";
  }

  if (category === "entertainment") {
    return "experience";
  }

  return null;
}

function hasExactTravelDates(
  intent: SearchIntent
): boolean {
  return Boolean(
    intent.startDate &&
      intent.endDate
  );
}

function looksLikeFlightSearch(
  query: string
): boolean {
  return includesAny(
    normalise(query),
    FLIGHT_TERMS
  );
}

function looksLikeHotelSearch(
  query: string,
  intent: SearchIntent
): boolean {
  const normalised = normalise(query);

  return (
    includesAny(
      normalised,
      HOTEL_TERMS
    ) ||
    Boolean(intent.destination)
  );
}

function looksLikeEntertainmentSearch(
  query: string,
  intent: SearchIntent
): boolean {
  return (
    intent.category ===
      "experience" ||
    includesAny(
      normalise(query),
      ENTERTAINMENT_TERMS
    )
  );
}

function looksLikeMerchantFeedSearch(
  query: string
): boolean {
  const normalised = normalise(query);

  return (
    includesAny(
      normalised,
      CJS_TERMS
    ) ||
    includesAny(
      normalised,
      GSF_TERMS
    )
  );
}

export function createBeaconPlan(input: {
  query: string;
  intent: SearchIntent;
}): BeaconPlan {
  const query = input.query.trim();
  const { intent } = input;

  if (
    looksLikeMerchantFeedSearch(
      query
    )
  ) {
    return {
      capability: "merchant_feed",
      query,
      intent,
      reason:
        "The request matches a category covered by an approved merchant feed.",
      requiresLiveProvider: true,
    };
  }

  if (
    looksLikeFlightSearch(query)
  ) {
    return {
      capability: "flights",
      query,
      intent,
      reason:
        "The request is specifically about flights or air travel.",
      requiresLiveProvider: true,
    };
  }

  if (
    intent.category === "product"
  ) {
    return {
      capability: "shopping",
      query,
      intent,
      reason:
        "The request is for a product or shopping recommendation.",
      requiresLiveProvider: true,
    };
  }

  if (
    intent.category === "holiday" ||
    looksLikeHotelSearch(
      query,
      intent
    )
  ) {
    if (
      intent.destination &&
      hasExactTravelDates(intent)
    ) {
      return {
        capability:
          "hotel_availability",
        query,
        intent,
        reason:
          "The request includes a destination and exact dates, so Beacon can check live hotel availability.",
        requiresLiveProvider: true,
      };
    }

    return {
      capability:
        "hotel_discovery",
      query,
      intent,
      reason:
        "The user is exploring destinations or accommodation and has not committed to exact travel dates.",
      requiresLiveProvider: false,
    };
  }

  if (
    looksLikeEntertainmentSearch(
      query,
      intent
    )
  ) {
    return {
      capability:
        "entertainment",
      query,
      intent,
      reason:
        "The request concerns events, experiences, tickets or entertainment.",
      requiresLiveProvider: false,
    };
  }

  return {
    capability: "general_ai",
    query,
    intent,
    reason:
      "The request does not require a specialist shopping or travel provider.",
    requiresLiveProvider: false,
  };
}