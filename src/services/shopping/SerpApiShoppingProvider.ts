import "server-only";

import { requestSerpApi } from "@/services/shopping/SerpApiClient";

import { calculateRecommendationScore } from "@/lib/recommendations/RecommendationScore";

import {
  checkVehicleCompatibility,
  parseVehiclePartIntent,
  type VehicleCompatibilityResult,
  type VehiclePartIntent,
} from "@/lib/vehicle/VehicleCompatibility";

import type {
  Recommendation,
  RecommendationPrice,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type SerpApiShoppingResult = {
  position?: number;
  title?: string;

  product_id?: string;

  link?: string;
  product_link?: string;
  direct_link?: string;
  serpapi_product_api?: string;

  source?: string;

  price?: string;
  extracted_price?: number;

  old_price?: string;
  extracted_old_price?: number;

  rating?: number;
  reviews?: number;

  delivery?: string;
  snippet?: string;

  thumbnail?: string;
  serpapi_thumbnail?: string;

  tag?: string;
  badge?: string;
  second_hand_condition?: string;

  extensions?: string[];
};

type SerpApiShoppingResponse = {
  search_metadata?: {
    id?: string;
    status?: string;
    created_at?: string;
    processed_at?: string;
    total_time_taken?: number;
  };

  search_parameters?: {
    q?: string;
    engine?: string;
    gl?: string;
    hl?: string;
  };

  shopping_results?: SerpApiShoppingResult[];
  inline_shopping_results?: SerpApiShoppingResult[];

  error?: string;
};

type EvaluatedShoppingResult = {
  result: SerpApiShoppingResult;
  compatibility: VehicleCompatibilityResult | null;
};

export type ShoppingSearchOptions = {
  limit?: number;
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
    .replace(
      /[^\p{L}\p{N}.\s'-]/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function createStableId(
  result: SerpApiShoppingResult,
  index: number
): string {
  const suppliedId =
    result.product_id?.trim() ||
    [
      result.source ?? "merchant",
      result.title ?? "product",
      index,
    ].join("-");

  return normaliseText(suppliedId)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function isHttpUrl(
  value: string
): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function getResultUrl(
  result: SerpApiShoppingResult
): string {
  const candidates = [
    result.direct_link,
    result.product_link,
    result.link,
  ];

  for (const candidate of candidates) {
    const cleaned =
      candidate?.trim();

    if (
      cleaned &&
      isHttpUrl(cleaned)
    ) {
      return cleaned;
    }
  }

  return "";
}

function getImageUrl(
  result: SerpApiShoppingResult
): string | undefined {
  const candidates = [
    result.thumbnail,
    result.serpapi_thumbnail,
  ];

  for (const candidate of candidates) {
    const cleaned =
      candidate?.trim();

    if (
      cleaned &&
      isHttpUrl(cleaned)
    ) {
      return cleaned;
    }
  }

  return undefined;
}

function getPriceAmount(
  result: SerpApiShoppingResult
): number | undefined {
  if (
    typeof result.extracted_price === "number" &&
    Number.isFinite(result.extracted_price) &&
    result.extracted_price >= 0
  ) {
    return result.extracted_price;
  }

  if (!result.price) {
    return undefined;
  }

  const parsed = Number(
    result.price
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "")
  );

  return (
    Number.isFinite(parsed) &&
    parsed >= 0
  )
    ? parsed
    : undefined;
}

function createPrice(
  result: SerpApiShoppingResult
): RecommendationPrice | undefined {
  const amount =
    getPriceAmount(result);

  if (amount === undefined) {
    return undefined;
  }

  return {
    amount,
    currency: "GBP",
    display:
      result.price?.trim() ||
      new Intl.NumberFormat(
        "en-GB",
        {
          style: "currency",
          currency: "GBP",
        }
      ).format(amount),
  };
}

function isWithinBudget(
  result: SerpApiShoppingResult,
  minimumPrice?: number,
  maximumPrice?: number
): boolean {
  const price =
    getPriceAmount(result);

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

function buildSearchableProductText(
  result: SerpApiShoppingResult
): string {
  return [
    result.title,
    result.snippet,
    result.source,
    result.tag,
    result.badge,
    result.second_hand_condition,
    ...(result.extensions ?? []),
  ]
    .filter(
      (
        value
      ): value is string =>
        typeof value === "string" &&
        value.trim().length > 0
    )
    .join(" ");
}

function evaluateVehicleCompatibility(
  result: SerpApiShoppingResult,
  vehicleIntent: VehiclePartIntent
): VehicleCompatibilityResult | null {
  if (!vehicleIntent.automotive) {
    return null;
  }

  return checkVehicleCompatibility(
    buildSearchableProductText(
      result
    ),
    vehicleIntent
  );
}

function evaluateResults(
  results: SerpApiShoppingResult[],
  vehicleIntent: VehiclePartIntent
): EvaluatedShoppingResult[] {
  return results.map((result) => ({
    result,
    compatibility:
      evaluateVehicleCompatibility(
        result,
        vehicleIntent
      ),
  }));
}

function keepCompatibleResults(
  evaluatedResults: EvaluatedShoppingResult[],
  vehicleIntent: VehiclePartIntent
): EvaluatedShoppingResult[] {
  if (!vehicleIntent.automotive) {
    return evaluatedResults;
  }

  return evaluatedResults.filter(
    ({ compatibility }) =>
      compatibility?.status ===
      "compatible"
  );
}

function calculateRelevanceScore(
  result: SerpApiShoppingResult,
  intent: SearchIntent,
  compatibility: VehicleCompatibilityResult | null
): number {
  const searchableText =
    normaliseText(
      buildSearchableProductText(
        result
      )
    );

  const usefulKeywords =
    intent.keywords
      .map(normaliseText)
      .filter(Boolean);

  const keywordScore =
    usefulKeywords.length === 0
      ? 65
      : clamp(
          45 +
            (
              usefulKeywords.filter(
                (keyword) =>
                  searchableText.includes(
                    keyword
                  )
              ).length /
              usefulKeywords.length
            ) *
              55
        );

  if (!compatibility) {
    return keywordScore;
  }

  return clamp(
    keywordScore * 0.35 +
      compatibility.score * 0.65
  );
}

function calculateValueScore(
  result: SerpApiShoppingResult,
  intent: SearchIntent
): number {
  const price =
    getPriceAmount(result);

  if (price === undefined) {
    return 50;
  }

  const maximum =
    intent.budgetMax;

  if (
    maximum !== undefined &&
    maximum > 0
  ) {
    if (price > maximum) {
      return 0;
    }

    const ratio =
      price / maximum;

    if (ratio <= 0.55) {
      return 92;
    }

    if (ratio <= 0.75) {
      return 85;
    }

    if (ratio <= 0.9) {
      return 76;
    }

    return 66;
  }

  const oldPrice =
    result.extracted_old_price;

  if (
    typeof oldPrice === "number" &&
    Number.isFinite(oldPrice) &&
    oldPrice > price
  ) {
    const savingRatio =
      (oldPrice - price) /
      oldPrice;

    return clamp(
      65 +
        savingRatio * 100
    );
  }

  return 65;
}

function calculateQualityScore(
  result: SerpApiShoppingResult
): number {
  const rating =
    typeof result.rating === "number"
      ? result.rating
      : undefined;

  const reviews =
    typeof result.reviews === "number"
      ? result.reviews
      : 0;

  if (rating === undefined) {
    return reviews > 0
      ? 60
      : 50;
  }

  const ratingScore =
    clamp(
      (rating / 5) * 100
    );

  const reviewConfidence =
    reviews >= 1000
      ? 15
      : reviews >= 250
        ? 10
        : reviews >= 50
          ? 6
          : reviews > 0
            ? 3
            : 0;

  return clamp(
    ratingScore * 0.85 +
      reviewConfidence
  );
}

function calculateTrustScore(
  result: SerpApiShoppingResult,
  compatibility: VehicleCompatibilityResult | null
): number {
  let score = 40;

  if (result.source?.trim()) {
    score += 12;
  }

  if (getResultUrl(result)) {
    score += 15;
  }

  if (getImageUrl(result)) {
    score += 5;
  }

  if (
    typeof result.rating === "number"
  ) {
    score += 7;
  }

  if (
    typeof result.reviews === "number" &&
    result.reviews > 0
  ) {
    score += 6;
  }

  if (result.delivery?.trim()) {
    score += 4;
  }

  if (
    compatibility?.status ===
    "compatible"
  ) {
    score += 11;
  }

  return clamp(score);
}

function buildHighlights(
  result: SerpApiShoppingResult,
  compatibility: VehicleCompatibilityResult | null
): string[] {
  const highlights: string[] =
    [];

  if (
    compatibility?.status ===
    "compatible"
  ) {
    highlights.push(
      "Requested vehicle and engine details confirmed in the listing"
    );
  }

  if (
    typeof result.rating === "number"
  ) {
    const reviewText =
      typeof result.reviews === "number"
        ? ` from ${result.reviews.toLocaleString(
            "en-GB"
          )} reviews`
        : "";

    highlights.push(
      `${result.rating.toFixed(
        1
      )}/5 rating${reviewText}`
    );
  }

  if (result.delivery?.trim()) {
    highlights.push(
      result.delivery.trim()
    );
  }

  if (result.tag?.trim()) {
    highlights.push(
      result.tag.trim()
    );
  } else if (
    result.badge?.trim()
  ) {
    highlights.push(
      result.badge.trim()
    );
  }

  if (
    result.second_hand_condition?.trim()
  ) {
    highlights.push(
      result.second_hand_condition.trim()
    );
  }

  return Array.from(
    new Set(highlights)
  ).slice(0, 4);
}

function buildWarnings(
  result: SerpApiShoppingResult,
  compatibility: VehicleCompatibilityResult | null
): string[] {
  const warnings: string[] =
    [];

  if (!getResultUrl(result)) {
    warnings.push(
      "A direct retailer link was not supplied for this result."
    );
  }

  if (
    getPriceAmount(result) ===
    undefined
  ) {
    warnings.push(
      "The current price could not be verified from the search result."
    );
  }

  if (
    result.second_hand_condition
      ?.trim()
  ) {
    warnings.push(
      `Condition: ${result.second_hand_condition.trim()}.`
    );
  }

  if (
    compatibility?.status ===
    "compatible"
  ) {
    warnings.push(
      "Confirm final vehicle compatibility on the retailer's website before purchasing."
    );
  }

  return Array.from(
    new Set(warnings)
  ).slice(0, 3);
}

function createSelectionReason(
  compatibility: VehicleCompatibilityResult | null
): string {
  if (
    compatibility?.status ===
    "compatible"
  ) {
    return (
      "Selected because the listing confirms the requested " +
      "part type, vehicle model and engine details before " +
      "Beacon considered price, quality and retailer signals."
    );
  }

  return (
    "Selected from live shopping data because it matches " +
    "the request, budget and available quality signals."
  );
}

function mapShoppingResult(
  evaluatedResult: EvaluatedShoppingResult,
  intent: SearchIntent,
  index: number
): Recommendation | null {
  const {
    result,
    compatibility,
  } = evaluatedResult;

  const title =
    result.title?.trim();

  if (!title) {
    return null;
  }

  const relevance =
    calculateRelevanceScore(
      result,
      intent,
      compatibility
    );

  const value =
    calculateValueScore(
      result,
      intent
    );

  const quality =
    calculateQualityScore(
      result
    );

  const trust =
    calculateTrustScore(
      result,
      compatibility
    );

  return {
    id: createStableId(
      result,
      index
    ),

    category: "product",
    source: "search",

    title,

    description:
      result.snippet?.trim() ||
      `${title} from ${
        result.source?.trim() ??
        "a listed retailer"
      }.`,

    reason:
      createSelectionReason(
        compatibility
      ),

    url:
      getResultUrl(result),

    imageUrl:
      getImageUrl(result),

    merchant:
      result.source?.trim(),

    price:
      createPrice(result),

    score:
      calculateRecommendationScore({
        relevance,
        value,
        quality,
        trust,
      }),

    highlights:
      buildHighlights(
        result,
        compatibility
      ),

    warnings:
      buildWarnings(
        result,
        compatibility
      ),

    metadata: {
      provider: "serpapi",

      searchEngine:
        "google_shopping",

      position:
        result.position ??
        index + 1,

      productId:
        result.product_id ??
        null,

      rating:
        result.rating ?? null,

      reviews:
        result.reviews ?? null,

      oldPrice:
        result.extracted_old_price ??
        null,

      automotive:
        compatibility !== null,

      compatibilityStatus:
        compatibility?.status ??
        null,

      compatibilityScore:
        compatibility?.score ??
        null,

      compatibilityMatchedTerms:
        compatibility
          ? compatibility.matchedTerms.join(
              ", "
            )
          : null,

      compatibilityMissingTerms:
        compatibility
          ? compatibility.missingTerms.join(
              ", "
            )
          : null,

      compatibilityConflicts:
        compatibility
          ? compatibility.conflictingTerms.join(
              ", "
            )
          : null,
    },
  };
}

function combineShoppingResults(
  response: SerpApiShoppingResponse
): SerpApiShoppingResult[] {
  return [
    ...(response.shopping_results ??
      []),

    ...(response
      .inline_shopping_results ??
      []),
  ];
}

function removeDuplicateResults(
  results: SerpApiShoppingResult[]
): SerpApiShoppingResult[] {
  const seen =
    new Set<string>();

  const unique:
    SerpApiShoppingResult[] =
    [];

  for (const result of results) {
    const key =
      normaliseText(
        [
          result.product_id,
          result.title,
          result.source,
          getResultUrl(result),
        ]
          .filter(Boolean)
          .join("|")
      );

    if (
      !key ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    unique.push(result);
  }

  return unique;
}

function createSearchQuery(
  intent: SearchIntent,
  vehicleIntent: VehiclePartIntent
): string {
  if (!vehicleIntent.automotive) {
    return intent.rawQuery.trim();
  }

  return [
    vehicleIntent.partType,
    vehicleIntent.model,
    vehicleIntent.engine,
    vehicleIntent.year,
  ]
    .filter(
      (
        value
      ): value is string | number =>
        value !== undefined &&
        value !== ""
    )
    .join(" ");
}

export async function searchShoppingProducts(
  intent: SearchIntent,
  options: ShoppingSearchOptions = {}
): Promise<Recommendation[]> {
  const originalQuery =
    intent.rawQuery.trim();

  if (!originalQuery) {
    throw new Error(
      "A shopping search query is required."
    );
  }

  const vehicleIntent =
    parseVehiclePartIntent(
      originalQuery
    );

  const searchQuery =
    createSearchQuery(
      intent,
      vehicleIntent
    );

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
    await requestSerpApi<SerpApiShoppingResponse>(
      {
        engine:
          "google_shopping",

        q: searchQuery,

        gl: "uk",
        hl: "en",

        google_domain:
          "google.co.uk",

        direct_link: true,

        num:
          requestedLimit,
      }
    );

  const uniqueResults =
    removeDuplicateResults(
      combineShoppingResults(
        response
      )
    );

  const budgetFilteredResults =
    uniqueResults.filter(
      (result) =>
        isWithinBudget(
          result,
          minimumPrice,
          maximumPrice
        )
    );

  const evaluatedResults =
    evaluateResults(
      budgetFilteredResults,
      vehicleIntent
    );

  const compatibleResults =
    keepCompatibleResults(
      evaluatedResults,
      vehicleIntent
    ).slice(
      0,
      requestedLimit
    );

  return compatibleResults
    .map(
      (
        evaluatedResult,
        index
      ) =>
        mapShoppingResult(
          evaluatedResult,
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