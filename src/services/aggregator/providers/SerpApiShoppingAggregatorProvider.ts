import "server-only";

import { searchShoppingProducts } from "@/services/shopping/SerpApiShoppingProvider";

import type {
  AggregatorProvider,
  AggregatorProviderContext,
  AggregatorProviderResult,
  AggregatorResult,
  AggregatorResultAttributes,
} from "@/services/aggregator/AggregatorTypes";

import type {
  Recommendation,
} from "@/lib/recommendations/RecommendationTypes";

function cleanText(
  value: string | undefined
): string | undefined {
  const cleaned = value
    ?.replace(/\s+/g, " ")
    .trim();

  return cleaned || undefined;
}

function readMetadataValue(
  recommendation: Recommendation,
  key: string
): unknown {
  return recommendation.metadata?.[key];
}

function readMetadataString(
  recommendation: Recommendation,
  key: string
): string | undefined {
  const value = readMetadataValue(
    recommendation,
    key
  );

  return typeof value === "string"
    ? cleanText(value)
    : undefined;
}

function readMetadataNumber(
  recommendation: Recommendation,
  key: string
): number | undefined {
  const value = readMetadataValue(
    recommendation,
    key
  );

  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : undefined;
}

function readMetadataBoolean(
  recommendation: Recommendation,
  key: string
): boolean | undefined {
  const value = readMetadataValue(
    recommendation,
    key
  );

  return typeof value === "boolean"
    ? value
    : undefined;
}

function createAttributes(
  recommendation: Recommendation
): AggregatorResultAttributes {
  const attributes: AggregatorResultAttributes = {};

  const productId = readMetadataString(
    recommendation,
    "productId"
  );

  const position = readMetadataNumber(
    recommendation,
    "position"
  );

  const delivery = readMetadataString(
    recommendation,
    "delivery"
  );

  const condition = readMetadataString(
    recommendation,
    "condition"
  );

  const sourceName = readMetadataString(
    recommendation,
    "source"
  );

  if (productId) {
    attributes.productId = productId;
  }

  if (position !== undefined) {
    attributes.position = position;
  }

  if (delivery) {
    attributes.delivery = delivery;
  }

  if (condition) {
    attributes.condition = condition;
  }

  if (sourceName) {
    attributes.sourceName = sourceName;
  }

  return attributes;
}

function mapRecommendationToAggregatorResult(
  recommendation: Recommendation
): AggregatorResult {
  const rating =
    readMetadataNumber(
      recommendation,
      "rating"
    );

  const reviewCount =
    readMetadataNumber(
      recommendation,
      "reviews"
    ) ??
    readMetadataNumber(
      recommendation,
      "reviewCount"
    );

  const brand =
    readMetadataString(
      recommendation,
      "brand"
    );

  const sponsored =
    readMetadataBoolean(
      recommendation,
      "sponsored"
    ) ??
    false;

  return {
    id: recommendation.id,

    providerId:
      "serpapi-shopping",

    source:
      "search_api",

    vertical:
      "shopping",

    category:
      recommendation.category,

    title:
      recommendation.title,

    description:
      recommendation.description,

    merchant:
      recommendation.merchant,

    brand,

    destinationUrl:
      recommendation.url,

    imageUrl:
      recommendation.imageUrl,

    price:
      recommendation.price,

    previousPrice:
      undefined,

    rating,

    reviewCount,

    location:
      undefined,

    highlights:
      recommendation.highlights,

    warnings:
      recommendation.warnings ?? [],

    attributes:
      createAttributes(
        recommendation
      ),

    sponsored,

    relevanceScore:
      recommendation.score.relevance,

    valueScore:
      recommendation.score.value,

    qualityScore:
      recommendation.score.quality,

    trustScore:
      recommendation.score.trust,

    overallScore:
      recommendation.score.overall,
  };
}

async function searchProvider(
  context: AggregatorProviderContext
): Promise<AggregatorProviderResult> {
  const startedAt = Date.now();

  const recommendations =
    await searchShoppingProducts(
      context.intent,
      {
        limit: context.limit,
      }
    );

  const results =
    recommendations.map(
      mapRecommendationToAggregatorResult
    );

  return {
    providerId:
      "serpapi-shopping",

    results,

    metadata: {
      searchedAt:
        new Date().toISOString(),

      totalResults:
        results.length,

      durationMs:
        Date.now() - startedAt,
    },

    warnings: [],
  };
}

export const serpApiShoppingAggregatorProvider: AggregatorProvider =
  {
    id: "serpapi-shopping",

    verticals: [
      "shopping",
    ],

    priority: 40,

    isAvailable() {
      return Boolean(
        process.env.SERPAPI_API_KEY
          ?.trim()
      );
    },

    search:
      searchProvider,
  };