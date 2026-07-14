import "server-only";

import { calculateRecommendationScore } from "@/lib/recommendations/RecommendationScore";
import { requestSerpApi } from "@/services/shopping/SerpApiClient";

import type {
  Recommendation,
  RecommendationPrice,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type HotelSearchMode =
  | "discovery"
  | "availability";

type HotelRate = {
  lowest?: string;
  extracted_lowest?: number;
};

type HotelImage = {
  thumbnail?: string;
  original_image?: string;
};

type HotelPriceSource = {
  source?: string;
  rate_per_night?: HotelRate;
};

type GoogleHotelsProperty = {
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

type GoogleHotelsResponse = {
  properties?: GoogleHotelsProperty[];
  non_matching_properties?: GoogleHotelsProperty[];
  error?: string;
};

type GoogleMapsCoordinates = {
  latitude?: number;
  longitude?: number;
};

type GoogleMapsHotelResult = {
  position?: number;

  title?: string;
  description?: string;
  address?: string;

  place_id?: string;
  data_id?: string;
  data_cid?: string;

  type?: string;
  types?: string[];

  rating?: number;
  reviews?: number;

  price?: string;
  price_level?: string;

  website?: string;
  link?: string;
  thumbnail?: string;

  phone?: string;
  open_state?: string;

  extensions?: string[];

  gps_coordinates?: GoogleMapsCoordinates;
};

type GoogleMapsResponse = {
  local_results?: GoogleMapsHotelResult[];
  place_results?: GoogleMapsHotelResult;
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

  return Math.max(
    minimum,
    Math.min(maximum, value)
  );
}

function normaliseText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidIsoDate(
  value: string | undefined
): value is string {
  if (!value) {
    return false;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function determineSearchMode(
  checkInDate: string | undefined,
  checkOutDate: string | undefined
): HotelSearchMode {
  if (
    isValidIsoDate(checkInDate) &&
    isValidIsoDate(checkOutDate)
  ) {
    return "availability";
  }

  return "discovery";
}

function createStableId(
  suppliedValue: string | undefined,
  fallback: string
): string {
  const base =
    suppliedValue?.trim() ||
    fallback.trim();

  return normaliseText(base)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function createPrice(
  amount: number | undefined,
  display?: string
): RecommendationPrice | undefined {
  if (
    amount === undefined ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return undefined;
  }

  return {
    amount,
    currency: "GBP",
    display:
      display?.trim() ||
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
      }).format(amount),
  };
}

function uniqueStrings(
  values: Array<string | undefined>,
  limit: number
): string[] {
  const unique = new Set<string>();

  for (const value of values) {
    const cleaned = value?.trim();

    if (cleaned) {
      unique.add(cleaned);
    }

    if (unique.size >= limit) {
      break;
    }
  }

  return Array.from(unique);
}

function calculateKeywordRelevance(
  searchableText: string,
  intent: SearchIntent
): number {
  const keywords = intent.keywords
    .map(normaliseText)
    .filter(Boolean);

  if (keywords.length === 0) {
    return 72;
  }

  const normalised =
    normaliseText(searchableText);

  const matchedKeywords =
    keywords.filter((keyword) =>
      normalised.includes(keyword)
    ).length;

  return clamp(
    48 +
      (matchedKeywords /
        keywords.length) *
        52
  );
}

function calculateRatingScore(
  rating?: number,
  reviews = 0
): number {
  if (
    typeof rating !== "number" ||
    !Number.isFinite(rating)
  ) {
    return reviews > 0 ? 58 : 50;
  }

  let score =
    clamp((rating / 5) * 82);

  if (reviews >= 1000) {
    score += 14;
  } else if (reviews >= 250) {
    score += 10;
  } else if (reviews >= 50) {
    score += 6;
  } else if (reviews > 0) {
    score += 3;
  }

  return clamp(score);
}

function calculateBudgetValue(
  price: number | undefined,
  maximumBudget: number | undefined
): number {
  if (price === undefined) {
    return 55;
  }

  if (
    maximumBudget === undefined ||
    maximumBudget <= 0
  ) {
    return 68;
  }

  if (price > maximumBudget) {
    return 0;
  }

  const ratio =
    price / maximumBudget;

  if (ratio <= 0.5) {
    return 94;
  }

  if (ratio <= 0.7) {
    return 86;
  }

  if (ratio <= 0.85) {
    return 78;
  }

  return 68;
}

function buildRatingHighlight(
  rating?: number,
  reviews?: number
): string | undefined {
  if (
    typeof rating !== "number" ||
    !Number.isFinite(rating)
  ) {
    return undefined;
  }

  const reviewText =
    typeof reviews === "number" &&
    reviews > 0
      ? ` from ${reviews.toLocaleString(
          "en-GB"
        )} reviews`
      : "";

  return `${rating.toFixed(
    1
  )}/5 rating${reviewText}`;
}

function getAvailabilityPrice(
  property: GoogleHotelsProperty
): number | undefined {
  const value =
    property.rate_per_night
      ?.extracted_lowest;

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return undefined;
  }

  return value;
}

function getAvailabilityImage(
  property: GoogleHotelsProperty
): string | undefined {
  const firstImage =
    property.images?.[0];

  return (
    firstImage?.original_image?.trim() ||
    firstImage?.thumbnail?.trim() ||
    property.logo?.trim() ||
    undefined
  );
}

function getAvailabilityMerchant(
  property: GoogleHotelsProperty
): string | undefined {
  return property.prices?.[0]
    ?.source?.trim();
}

function mapAvailabilityResult(
  property: GoogleHotelsProperty,
  intent: SearchIntent,
  index: number
): Recommendation | null {
  const title =
    property.name?.trim();

  if (!title) {
    return null;
  }

  const nightlyPrice =
    getAvailabilityPrice(property);

  const relevance =
    calculateKeywordRelevance(
      [
        title,
        property.description,
        property.hotel_class,
        ...(property.amenities ?? []),
        ...(property.essential_info ?? []),
      ]
        .filter(Boolean)
        .join(" "),
      intent
    );

  const value =
    calculateBudgetValue(
      nightlyPrice,
      intent.budgetMax
    );

  const quality =
    calculateRatingScore(
      property.overall_rating,
      property.reviews ?? 0
    );

  let trust = 48;

  if (property.property_token) {
    trust += 15;
  }

  if (
    getAvailabilityImage(property)
  ) {
    trust += 8;
  }

  if (
    typeof property.overall_rating ===
    "number"
  ) {
    trust += 10;
  }

  if (
    getAvailabilityMerchant(property)
  ) {
    trust += 10;
  }

  if (property.amenities?.length) {
    trust += 7;
  }

  const highlights =
    uniqueStrings(
      [
        buildRatingHighlight(
          property.overall_rating,
          property.reviews
        ),
        property.hotel_class,
        typeof property.location_rating ===
        "number"
          ? `${property.location_rating.toFixed(
              1
            )}/5 location rating`
          : undefined,
        ...(property.amenities ?? []),
      ],
      3
    );

  const warnings: string[] = [];

  if (nightlyPrice === undefined) {
    warnings.push(
      "A date-specific nightly price was not supplied."
    );
  }

  if (
    !getAvailabilityMerchant(property)
  ) {
    warnings.push(
      "A booking provider was not supplied."
    );
  }

  return {
    id: createStableId(
      property.property_token,
      `${title}-${index}`
    ),

    category: "holiday",
    source: "travel",

    title,

    description:
      property.description?.trim() ||
      `${title} appears in live hotel availability results.`,

    reason:
      "Selected from live date-specific hotel results because it matches your destination, preferences and budget.",

    url:
      property
        .serpapi_property_details_link
        ?.trim() || "",

    imageUrl:
      getAvailabilityImage(property),

    merchant:
      getAvailabilityMerchant(property),

    price: createPrice(
      nightlyPrice,
      property.rate_per_night
        ?.lowest
    ),

    score:
      calculateRecommendationScore({
        relevance,
        value,
        quality,
        trust: clamp(trust),
      }),

    highlights,

    warnings:
      warnings.slice(0, 2),

    metadata: {
      provider: "serpapi",
      searchEngine: "google_hotels",
      searchMode: "availability",

      propertyToken:
        property.property_token ?? null,

      hotelClass:
        property.extracted_hotel_class ??
        null,

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

function getDiscoveryUrl(
  result: GoogleMapsHotelResult
): string {
  return (
    result.website?.trim() ||
    result.link?.trim() ||
    ""
  );
}

function mapDiscoveryResult(
  result: GoogleMapsHotelResult,
  intent: SearchIntent,
  index: number
): Recommendation | null {
  const title =
    result.title?.trim();

  if (!title) {
    return null;
  }

  const relevance =
    calculateKeywordRelevance(
      [
        title,
        result.description,
        result.address,
        result.type,
        ...(result.types ?? []),
        result.price,
        result.price_level,
        ...(result.extensions ?? []),
      ]
        .filter(Boolean)
        .join(" "),
      intent
    );

  const quality =
    calculateRatingScore(
      result.rating,
      result.reviews ?? 0
    );

  let trust = 45;

  if (
    result.place_id ||
    result.data_id ||
    result.data_cid
  ) {
    trust += 15;
  }

  if (result.address) {
    trust += 10;
  }

  if (
    typeof result.rating === "number"
  ) {
    trust += 10;
  }

  if (
    typeof result.reviews === "number" &&
    result.reviews > 0
  ) {
    trust += 8;
  }

  if (getDiscoveryUrl(result)) {
    trust += 8;
  }

  if (result.thumbnail) {
    trust += 4;
  }

  const highlights =
    uniqueStrings(
      [
        buildRatingHighlight(
          result.rating,
          result.reviews
        ),
        result.type,
        result.price ||
          result.price_level,
        result.address,
        ...(result.extensions ?? []),
      ],
      3
    );

  const warnings = [
    "Exact availability and date-specific pricing have not been checked because no exact dates were supplied.",
  ];

  if (!getDiscoveryUrl(result)) {
    warnings.push(
      "A direct hotel website was not supplied."
    );
  }

  return {
    id: createStableId(
      result.place_id ||
        result.data_id ||
        result.data_cid,
      `${title}-${index}`
    ),

    category: "holiday",
    source: "travel",

    title,

    description:
      result.description?.trim() ||
      result.address?.trim() ||
      `${title} appears in live hotel discovery results for your chosen destination.`,

    reason:
      "Selected during destination-first hotel discovery because it appears relevant to the location and preferences you described.",

    url: getDiscoveryUrl(result),

    imageUrl:
      result.thumbnail?.trim() ||
      undefined,

    merchant: undefined,
    price: undefined,

    score:
      calculateRecommendationScore({
        relevance,
        value: 62,
        quality,
        trust: clamp(trust),
      }),

    highlights,

    warnings:
      warnings.slice(0, 2),

    metadata: {
      provider: "serpapi",
      searchEngine: "google_maps",
      searchMode: "discovery",

      placeId:
        result.place_id ?? null,

      dataId:
        result.data_id ?? null,

      dataCid:
        result.data_cid ?? null,

      rating:
        result.rating ?? null,

      reviews:
        result.reviews ?? null,

      address:
        result.address ?? null,

      latitude:
        result.gps_coordinates
          ?.latitude ?? null,

      longitude:
        result.gps_coordinates
          ?.longitude ?? null,
    },
  };
}

function removeDuplicates<T>(
  items: T[],
  getKey: (item: T) => string
): T[] {
  const seen =
    new Set<string>();

  const unique: T[] = [];

  for (const item of items) {
    const key =
      normaliseText(
        getKey(item)
      );

    if (
      !key ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}

async function searchHotelAvailability(
  intent: SearchIntent,
  options: HotelSearchOptions,
  destination: string,
  checkInDate: string,
  checkOutDate: string
): Promise<Recommendation[]> {
  const adults =
    options.adults ??
    intent.travellers?.adults ??
    2;

  const children =
    options.children ??
    intent.travellers?.children ??
    0;

  const requestedLimit =
    clamp(
      Math.floor(
        options.limit ??
          DEFAULT_LIMIT
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
    await requestSerpApi<GoogleHotelsResponse>(
      {
        engine: "google_hotels",
        q: destination,

        check_in_date:
          checkInDate,

        check_out_date:
          checkOutDate,

        adults,
        children,

        currency: "GBP",
        gl: "uk",
        hl: "en",
        sort_by: 8,
      }
    );

  const properties =
    removeDuplicates(
      [
        ...(response.properties ?? []),
        ...(response
          .non_matching_properties ??
          []),
      ],
      (property) =>
        [
          property.property_token,
          property.name,
        ]
          .filter(Boolean)
          .join("|")
    )
      .filter((property) => {
        const price =
          getAvailabilityPrice(
            property
          );

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
      })
      .slice(0, requestedLimit);

  return properties
    .map((property, index) =>
      mapAvailabilityResult(
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

async function searchHotelDiscovery(
  intent: SearchIntent,
  options: HotelSearchOptions,
  destination: string
): Promise<Recommendation[]> {
  const requestedLimit =
    clamp(
      Math.floor(
        options.limit ??
          DEFAULT_LIMIT
      ),
      1,
      MAXIMUM_RESULTS
    );

  const query = [
    "hotels",
    `in ${destination}`,
    ...(intent.preferences ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  const response =
    await requestSerpApi<GoogleMapsResponse>(
      {
        engine: "google_maps",
        type: "search",
        q: query,

        gl: "uk",
        hl: "en",

        google_domain:
          "google.co.uk",
      }
    );

  const results = [
    ...(response.local_results ?? []),
    ...(response.place_results
      ? [response.place_results]
      : []),
  ];

  const uniqueResults =
    removeDuplicates(
      results,
      (result) =>
        [
          result.place_id,
          result.data_id,
          result.data_cid,
          result.title,
          result.address,
        ]
          .filter(Boolean)
          .join("|")
    ).slice(0, requestedLimit);

  return uniqueResults
    .map((result, index) =>
      mapDiscoveryResult(
        result,
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

  const possibleCheckInDate =
    options.checkInDate ??
    intent.startDate;

  const possibleCheckOutDate =
    options.checkOutDate ??
    intent.endDate;

  const mode =
    determineSearchMode(
      possibleCheckInDate,
      possibleCheckOutDate
    );

  if (mode === "availability") {
    if (
      !isValidIsoDate(
        possibleCheckInDate
      ) ||
      !isValidIsoDate(
        possibleCheckOutDate
      )
    ) {
      throw new Error(
        "Beacon could not understand the supplied hotel dates."
      );
    }

    return searchHotelAvailability(
      intent,
      options,
      destination,
      possibleCheckInDate,
      possibleCheckOutDate
    );
  }

  return searchHotelDiscovery(
    intent,
    options,
    destination
  );
}