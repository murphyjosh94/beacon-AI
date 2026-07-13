import "server-only";

import { requestSerpApi } from "@/services/shopping/SerpApiClient";
import { calculateRecommendationScore } from "@/lib/recommendations/RecommendationScore";

import type {
  Recommendation,
  RecommendationPrice,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type HotelRate = {
  lowest?: string;
  extracted_lowest?: number;
  before_taxes_fees?: string;
  extracted_before_taxes_fees?: number;
};

type HotelImage = {
  thumbnail?: string;
  original_image?: string;
};

type HotelPriceSource = {
  source?: string;
  rate_per_night?: HotelRate;
};

type SerpApiHotelProperty = {
  type?: string;
  name?: string;
  description?: string;
  logo?: string;
  sponsored?: boolean;

  check_in_time?: string;
  check_out_time?: string;

  rate_per_night?: HotelRate;
  prices?: HotelPriceSource[];

  hotel_class?: string;
  extracted_hotel_class?: number;

  images?: HotelImage[];

  overall_rating?: number;
  reviews?: number;
  location_rating?: number;

  amenities?: string[];
  excluded_amenities?: string[];
  essential_info?: string[];

  property_token?: string;
  serpapi_property_details_link?: string;
};

type SerpApiHotelsResponse = {
  properties?: SerpApiHotelProperty[];
  non_matching_properties?: SerpApiHotelProperty[];
  error?: string;
};

export type HotelSearchOptions = {
  limit?: number;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  children?: number;
  minimumPrice?: number;
  maximumPrice?: number;
};

const DEFAULT_LIMIT = 20;
const MAXIMUM_RESULTS = 40;

function clamp(
  value: number,
  minimum = 0,
  maximum = 100
): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.max(minimum, Math.min(maximum, value));
}

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidIsoDate(value?: string): value is string {
  if (!value) {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getNightlyPrice(
  property: SerpApiHotelProperty
): number | undefined {
  const amount =
    property.rate_per_night?.extracted_lowest;

  return typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount >= 0
    ? amount
    : undefined;
}

function createPrice(
  property: SerpApiHotelProperty
): RecommendationPrice | undefined {
  const amount = getNightlyPrice(property);

  if (amount === undefined) {
    return undefined;
  }

  return {
    amount,
    currency: "GBP",
    display:
      property.rate_per_night?.lowest?.trim() ||
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
      }).format(amount),
  };
}

function getImageUrl(
  property: SerpApiHotelProperty
): string | undefined {
  const firstImage = property.images?.[0];

  return (
    firstImage?.original_image?.trim() ||
    firstImage?.thumbnail?.trim() ||
    property.logo?.trim() ||
    undefined
  );
}

function getMerchant(
  property: SerpApiHotelProperty
): string | undefined {
  return property.prices?.[0]?.source?.trim();
}

function createStableId(
  property: SerpApiHotelProperty,
  index: number
): string {
  const base =
    property.property_token?.trim() ||
    property.name?.trim() ||
    `hotel-${index + 1}`;

  return normaliseText(base)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function isWithinBudget(
  property: SerpApiHotelProperty,
  minimumPrice?: number,
  maximumPrice?: number
): boolean {
  const price = getNightlyPrice(property);

  if (price === undefined) {
    return true;
  }

  if (
    minimumPrice !== undefined &&
    price < minimumPrice
  ) {
    return false;
  }

  if (
    maximumPrice !== undefined &&
    price > maximumPrice
  ) {
    return false;
  }

  return true;
}

function calculateRelevanceScore(
  property: SerpApiHotelProperty,
  intent: SearchIntent
): number {
  const searchableText = normaliseText(
    [
      property.name,
      property.description,
      property.hotel_class,
      ...(property.amenities ?? []),
      ...(property.essential_info ?? []),
    ]
      .filter(Boolean)
      .join(" ")
  );

  const usefulKeywords = intent.keywords
    .map(normaliseText)
    .filter(Boolean);

  if (usefulKeywords.length === 0) {
    return 70;
  }

  const matches = usefulKeywords.filter(
    (keyword) =>
      searchableText.includes(keyword)
  ).length;

  const ratio =
    matches / usefulKeywords.length;

  return clamp(50 + ratio * 50);
}

function calculateValueScore(
  property: SerpApiHotelProperty,
  intent: SearchIntent
): number {
  const price = getNightlyPrice(property);

  if (price === undefined) {
    return 50;
  }

  const maximum = intent.budgetMax;

  if (
    maximum !== undefined &&
    maximum > 0
  ) {
    if (price > maximum) {
      return 0;
    }

    const ratio = price / maximum;

    if (ratio <= 0.5) return 94;
    if (ratio <= 0.7) return 86;
    if (ratio <= 0.85) return 78;
    return 68;
  }

  return 65;
}

function calculateQualityScore(
  property: SerpApiHotelProperty
): number {
  const rating =
    typeof property.overall_rating === "number"
      ? property.overall_rating
      : undefined;

  const reviews =
    typeof property.reviews === "number"
      ? property.reviews
      : 0;

  const hotelClass =
    typeof property.extracted_hotel_class === "number"
      ? property.extracted_hotel_class
      : 0;

  let score = 50;

  if (rating !== undefined) {
    score = (rating / 5) * 80;
  }

  if (reviews >= 1000) {
    score += 12;
  } else if (reviews >= 250) {
    score += 8;
  } else if (reviews >= 50) {
    score += 5;
  }

  if (hotelClass >= 5) {
    score += 8;
  } else if (hotelClass >= 4) {
    score += 5;
  } else if (hotelClass >= 3) {
    score += 2;
  }

  return clamp(score);
}

function calculateTrustScore(
  property: SerpApiHotelProperty
): number {
  let score = 45;

  if (property.property_token) {
    score += 15;
  }

  if (getImageUrl(property)) {
    score += 8;
  }

  if (
    typeof property.overall_rating === "number"
  ) {
    score += 10;
  }

  if (
    typeof property.reviews === "number" &&
    property.reviews > 0
  ) {
    score += 8;
  }

  if (getMerchant(property)) {
    score += 8;
  }

  if (property.amenities?.length) {
    score += 6;
  }

  return clamp(score);
}

function buildHighlights(
  property: SerpApiHotelProperty
): string[] {
  const highlights: string[] = [];

  if (
    typeof property.overall_rating === "number"
  ) {
    const reviews =
      typeof property.reviews === "number"
        ? ` from ${property.reviews.toLocaleString(
            "en-GB"
          )} reviews`
        : "";

    highlights.push(
      `${property.overall_rating.toFixed(
        1
      )}/5 rating${reviews}`
    );
  }

  if (property.hotel_class?.trim()) {
    highlights.push(
      property.hotel_class.trim()
    );
  }

  if (
    typeof property.location_rating === "number"
  ) {
    highlights.push(
      `${property.location_rating.toFixed(
        1
      )}/5 location rating`
    );
  }

  for (const amenity of property.amenities ?? []) {
    if (highlights.length >= 3) {
      break;
    }

    if (amenity.trim()) {
      highlights.push(amenity.trim());
    }
  }

  return Array.from(
    new Set(highlights)
  ).slice(0, 3);
}

function buildWarnings(
  property: SerpApiHotelProperty
): string[] {
  const warnings: string[] = [];

  if (getNightlyPrice(property) === undefined) {
    warnings.push(
      "A live nightly price was not supplied for this hotel."
    );
  }

  if (!getMerchant(property)) {
    warnings.push(
      "A booking provider was not supplied in this result."
    );
  }

  for (
    const excluded of property.excluded_amenities ?? []
  ) {
    if (warnings.length >= 2) {
      break;
    }

    if (excluded.trim()) {
      warnings.push(excluded.trim());
    }
  }

  return warnings.slice(0, 2);
}

function mapHotelProperty(
  property: SerpApiHotelProperty,
  intent: SearchIntent,
  index: number
): Recommendation | null {
  const name = property.name?.trim();

  if (!name) {
    return null;
  }

  const relevance =
    calculateRelevanceScore(property, intent);

  const value =
    calculateValueScore(property, intent);

  const quality =
    calculateQualityScore(property);

  const trust =
    calculateTrustScore(property);

  return {
    id: createStableId(property, index),

    category: "holiday",
    source: "travel",

    title: name,

    description:
      property.description?.trim() ||
      `${name} appears in live Google Hotels results.`,

    reason:
      "Selected from live Google Hotels data because it appears relevant to your destination, budget and preferences.",

    url:
      property.serpapi_property_details_link?.trim() ||
      "",

    imageUrl: getImageUrl(property),

    merchant: getMerchant(property),

    price: createPrice(property),

    score:
      calculateRecommendationScore({
        relevance,
        value,
        quality,
        trust,
      }),

    highlights: buildHighlights(property),

    warnings: buildWarnings(property),

    metadata: {
      provider: "serpapi",
      searchEngine: "google_hotels",
      propertyToken:
        property.property_token ?? null,
      hotelClass:
        property.extracted_hotel_class ?? null,
      rating:
        property.overall_rating ?? null,
      reviews:
        property.reviews ?? null,
      locationRating:
        property.location_rating ?? null,
      sponsored:
        property.sponsored ?? false,
      checkInTime:
        property.check_in_time ?? null,
      checkOutTime:
        property.check_out_time ?? null,
    },
  };
}

function combineProperties(
  response: SerpApiHotelsResponse
): SerpApiHotelProperty[] {
  return [
    ...(response.properties ?? []),
    ...(response.non_matching_properties ?? []),
  ];
}

function removeDuplicateProperties(
  properties: SerpApiHotelProperty[]
): SerpApiHotelProperty[] {
  const seen = new Set<string>();
  const unique: SerpApiHotelProperty[] = [];

  for (const property of properties) {
    const key = normaliseText(
      [
        property.property_token,
        property.name,
      ]
        .filter(Boolean)
        .join("|")
    );

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(property);
  }

  return unique;
}

export async function searchHotels(
  intent: SearchIntent,
  options: HotelSearchOptions = {}
): Promise<Recommendation[]> {
  const destination =
    intent.destination?.trim() ||
    intent.location?.trim();

  if (!destination) {
    throw new Error(
      "Please include a destination for your hotel search."
    );
  }

  const checkInDate =
    options.checkInDate ??
    intent.startDate;

  const checkOutDate =
    options.checkOutDate ??
    intent.endDate;

  if (
    !isValidIsoDate(checkInDate) ||
    !isValidIsoDate(checkOutDate)
  ) {
    throw new Error(
      "Please include exact check-in and check-out dates for your hotel search."
    );
  }

  const adults =
    options.adults ??
    intent.travellers?.adults ??
    2;

  const children =
    options.children ??
    intent.travellers?.children ??
    0;

  const requestedLimit = clamp(
    Math.floor(
      options.limit ?? DEFAULT_LIMIT
    ),
    1,
    MAXIMUM_RESULTS
  );

  const minimumPrice =
    options.minimumPrice ??
    intent.budgetMin;

  const maximumPrice =
    options.maximumPrice ??
    intent.budgetMax;

  const response =
    await requestSerpApi<SerpApiHotelsResponse>(
      {
        engine: "google_hotels",
        q: destination,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        adults,
        children,
        currency: "GBP",
        gl: "uk",
        hl: "en",
        sort_by: 8,
      }
    );

  const properties =
    removeDuplicateProperties(
      combineProperties(response)
    )
      .filter((property) =>
        isWithinBudget(
          property,
          minimumPrice,
          maximumPrice
        )
      )
      .slice(0, requestedLimit);

  return properties
    .map((property, index) =>
      mapHotelProperty(
        property,
        intent,
        index
      )
    )
    .filter(
      (
        recommendation
      ): recommendation is Recommendation =>
        recommendation !== null
    );
}