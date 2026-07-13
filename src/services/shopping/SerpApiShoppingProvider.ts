import "server-only";

import { requestSerpApi } from "@/services/shopping/SerpApiClient";
import { calculateRecommendationScore } from "@/lib/recommendations/RecommendationScore";

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

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createStableId(
  result: SerpApiShoppingResult,
  index: number
): string {
  const suppliedId =
    result.product_id?.trim() ||
    `${result.source ?? "merchant"}-${result.title ?? "product"}-${index}`;

  return normaliseText(suppliedId)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function getResultUrl(
  result: SerpApiShoppingResult
): string {
  return (
    result.direct_link?.trim() ||
    result.product_link?.trim() ||
    result.link?.trim() ||
    ""
  );
}

function getImageUrl(
  result: SerpApiShoppingResult
): string | undefined {
  return (
    result.thumbnail?.trim() ||
    result.serpapi_thumbnail?.trim() ||
    undefined
  );
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

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

function createPrice(
  result: SerpApiShoppingResult
): RecommendationPrice | undefined {
  const amount = getPriceAmount(result);

  if (amount === undefined) {
    return undefined;
  }

  return {
    amount,
    currency: "GBP",
    display:
      result.price?.trim() ||
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
      }).format(amount),
  };
}

function isWithinBudget(
  result: SerpApiShoppingResult,
  minimumPrice?: number,
  maximumPrice?: number
): boolean {
  const price = getPriceAmount(result);

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
  result: SerpApiShoppingResult,
  intent: SearchIntent
): number {
  const searchableText = normaliseText(
    [
      result.title,
      result.snippet,
      result.source,
      result.tag,
      result.badge,
      ...(result.extensions ?? []),
    ]
      .filter(Boolean)
      .join(" ")
  );

  const usefulKeywords = intent.keywords
    .map(normaliseText)
    .filter(Boolean);

  if (usefulKeywords.length === 0) {
    return 65;
  }

  const matches = usefulKeywords.filter(
    (keyword) =>
      searchableText.includes(keyword)
  ).length;

  const ratio = matches / usefulKeywords.length;

  return clamp(45 + ratio * 55);
}

function calculateValueScore(
  result: SerpApiShoppingResult,
  intent: SearchIntent
): number {
  const price = getPriceAmount(result);

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

    const ratio = price / maximum;

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
      (oldPrice - price) / oldPrice;

    return clamp(65 + savingRatio * 100);
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
    return reviews > 0 ? 60 : 50;
  }

  const ratingScore =
    clamp((rating / 5) * 100);

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
  result: SerpApiShoppingResult
): number {
  let score = 45;

  if (result.source?.trim()) {
    score += 15;
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
    score += 8;
  }

  if (
    typeof result.reviews === "number" &&
    result.reviews > 0
  ) {
    score += 7;
  }

  if (
    result.delivery?.trim()
  ) {
    score += 5;
  }

  return clamp(score);
}

function buildHighlights(
  result: SerpApiShoppingResult
): string[] {
  const highlights: string[] = [];

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
  } else if (result.badge?.trim()) {
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
  ).slice(0, 3);
}

function buildWarnings(
  result: SerpApiShoppingResult
): string[] {
  const warnings: string[] = [];

  if (!getResultUrl(result)) {
    warnings.push(
      "A direct retailer link was not supplied for this result."
    );
  }

  if (
    getPriceAmount(result) === undefined
  ) {
    warnings.push(
      "The current price could not be verified from the search result."
    );
  }

  if (
    result.second_hand_condition
  ) {
    warnings.push(
      `Condition: ${result.second_hand_condition}.`
    );
  }

  return warnings.slice(0, 2);
}

function mapShoppingResult(
  result: SerpApiShoppingResult,
  intent: SearchIntent,
  index: number
): Recommendation | null {
  const title = result.title?.trim();

  if (!title) {
    return null;
  }

  const relevance =
    calculateRelevanceScore(
      result,
      intent
    );

  const value =
    calculateValueScore(
      result,
      intent
    );

  const quality =
    calculateQualityScore(result);

  const trust =
    calculateTrustScore(result);

  return {
    id: createStableId(
      result,
      index
    ),

    category: "product",
    source: "merchant",

    title,

    description:
      result.snippet?.trim() ||
      `${title} from ${
        result.source?.trim() ??
        "a listed retailer"
      }.`,

    reason:
      "Selected from live Google Shopping data because it appears relevant to your request and available budget.",

    url: getResultUrl(result),

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
      buildHighlights(result),

    warnings:
      buildWarnings(result),

    metadata: {
      provider: "serpapi",
      searchEngine: "google_shopping",
      position:
        result.position ?? index + 1,
      productId:
        result.product_id ?? null,
      rating:
        result.rating ?? null,
      reviews:
        result.reviews ?? null,
      oldPrice:
        result.extracted_old_price ??
        null,
    },
  };
}

function combineShoppingResults(
  response: SerpApiShoppingResponse
): SerpApiShoppingResult[] {
  return [
    ...(response.shopping_results ?? []),
    ...(response.inline_shopping_results ??
      []),
  ];
}

function removeDuplicateResults(
  results: SerpApiShoppingResult[]
): SerpApiShoppingResult[] {
  const seen = new Set<string>();
  const unique: SerpApiShoppingResult[] = [];

  for (const result of results) {
    const key = normaliseText(
      [
        result.product_id,
        result.title,
        result.source,
        getResultUrl(result),
      ]
        .filter(Boolean)
        .join("|")
    );

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(result);
  }

  return unique;
}

export async function searchShoppingProducts(
  intent: SearchIntent,
  options: ShoppingSearchOptions = {}
): Promise<Recommendation[]> {
  const query =
    intent.rawQuery.trim();

  if (!query) {
    throw new Error(
      "A shopping search query is required."
    );
  }

  const requestedLimit = clamp(
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
        engine: "google_shopping",
        q: query,
        gl: "uk",
        hl: "en",
        google_domain: "google.co.uk",
        direct_link: true,
        num: requestedLimit,
      }
    );

  const results = removeDuplicateResults(
    combineShoppingResults(response)
  )
    .filter((result) =>
      isWithinBudget(
        result,
        minimumPrice,
        maximumPrice
      )
    )
    .slice(0, requestedLimit);

  return results
    .map((result, index) =>
      mapShoppingResult(
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