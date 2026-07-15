import "server-only";

import { searchHotels } from "@/services/travel/SerpApiHotelsProvider";

import type {
  AggregatorProvider,
  AggregatorProviderContext,
  AggregatorProviderResult,
  AggregatorResult,
  AggregatorResultAttributes,
} from "@/services/aggregator/AggregatorTypes";

import type {
  Recommendation,
  RecommendationMetadataValue,
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
): RecommendationMetadataValue | undefined {
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

function readMetadataAttributes(
  recommendation: Recommendation,
  key: string
): AggregatorResultAttributes | undefined {
  const value = readMetadataValue(
    recommendation,
    key
  );

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  const attributes:
    AggregatorResultAttributes = {};

  for (const [attributeKey, attributeValue] of Object.entries(
    value
  )) {
    if (
      typeof attributeValue === "string" ||
      typeof attributeValue === "number" ||
      typeof attributeValue === "boolean" ||
      attributeValue === null
    ) {
      attributes[attributeKey] =
        attributeValue;
    }
  }

  return attributes;
}

function hasExactDates(
  context: AggregatorProviderContext
): boolean {
  return Boolean(
    context.intent.startDate &&
      context.intent.endDate
  );
}

function getProviderId(
  context: AggregatorProviderContext
): "serpapi-hotels" | "serpapi-maps" {
  return hasExactDates(context)
    ? "serpapi-hotels"
    : "serpapi-maps";
}

function createAttributes(
  recommendation: Recommendation,
  context: AggregatorProviderContext
): AggregatorResultAttributes {
  const attributes:
    AggregatorResultAttributes = {
      searchMode: hasExactDates(context)
        ? "availability"
        : "discovery",
    };

  const existingAttributes =
    readMetadataAttributes(
      recommendation,
      "attributes"
    );

  if (existingAttributes) {
    Object.assign(
      attributes,
      existingAttributes
    );
  }

  const provider =
    readMetadataString(
      recommendation,
      "provider"
    );

  const searchEngine =
    readMetadataString(
      recommendation,
      "searchEngine"
    );

  const propertyToken =
    readMetadataString(
      recommendation,
      "propertyToken"
    );

  const placeId =
    readMetadataString(
      recommendation,
      "placeId"
    );

  const dataId =
    readMetadataString(
      recommendation,
      "dataId"
    );

  const dataCid =
    readMetadataString(
      recommendation,
      "dataCid"
    );

  const hotelClass =
    readMetadataNumber(
      recommendation,
      "hotelClass"
    );

  const locationRating =
    readMetadataNumber(
      recommendation,
      "locationRating"
    );

  const latitude =
    readMetadataNumber(
      recommendation,
      "latitude"
    );

  const longitude =
    readMetadataNumber(
      recommendation,
      "longitude"
    );

  const checkInTime =
    readMetadataString(
      recommendation,
      "checkInTime"
    );

  const checkOutTime =
    readMetadataString(
      recommendation,
      "checkOutTime"
    );

  if (provider) {
    attributes.provider = provider;
  }

  if (searchEngine) {
    attributes.searchEngine =
      searchEngine;
  }

  if (propertyToken) {
    attributes.propertyToken =
      propertyToken;
  }

  if (placeId) {
    attributes.placeId = placeId;
  }

  if (dataId) {
    attributes.dataId = dataId;
  }

  if (dataCid) {
    attributes.dataCid = dataCid;
  }

  if (hotelClass !== undefined) {
    attributes.hotelClass =
      hotelClass;
  }

  if (
    locationRating !== undefined
  ) {
    attributes.locationRating =
      locationRating;
  }

  if (latitude !== undefined) {
    attributes.latitude = latitude;
  }

  if (longitude !== undefined) {
    attributes.longitude =
      longitude;
  }

  if (checkInTime) {
    attributes.checkInTime =
      checkInTime;
  }

  if (checkOutTime) {
    attributes.checkOutTime =
      checkOutTime;
  }

  if (context.intent.startDate) {
    attributes.checkInDate =
      context.intent.startDate;
  }

  if (context.intent.endDate) {
    attributes.checkOutDate =
      context.intent.endDate;
  }

  const adults =
    context.intent.travellers
      ?.adults;

  const children =
    context.intent.travellers
      ?.children;

  if (adults !== undefined) {
    attributes.adults = adults;
  }

  if (children !== undefined) {
    attributes.children =
      children;
  }

  return attributes;
}

function getLocation(
  recommendation: Recommendation
): string | undefined {
  return (
    readMetadataString(
      recommendation,
      "address"
    ) ||
    readMetadataString(
      recommendation,
      "location"
    )
  );
}

function mapRecommendationToAggregatorResult(
  recommendation: Recommendation,
  context: AggregatorProviderContext
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

  const sponsored =
    readMetadataBoolean(
      recommendation,
      "sponsored"
    ) ??
    false;

  const source =
    hasExactDates(context)
      ? "search_api"
      : "public_search";

  return {
    id: recommendation.id,

    providerId:
      getProviderId(context),

    source,

    vertical: "travel",

    category:
      recommendation.category,

    title:
      recommendation.title,

    description:
      recommendation.description,

    merchant:
      recommendation.merchant,

    brand: undefined,

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
      getLocation(
        recommendation
      ),

    highlights:
      recommendation.highlights,

    warnings:
      recommendation.warnings ??
      [],

    attributes:
      createAttributes(
        recommendation,
        context
      ),

    sponsored,

    relevanceScore:
      recommendation.score
        .relevance,

    valueScore:
      recommendation.score.value,

    qualityScore:
      recommendation.score
        .quality,

    trustScore:
      recommendation.score.trust,

    overallScore:
      recommendation.score
        .overall,
  };
}

async function searchProvider(
  context: AggregatorProviderContext
): Promise<AggregatorProviderResult> {
  const startedAt =
    Date.now();

  const providerId =
    getProviderId(context);

  const recommendations =
    await searchHotels(
      context.intent,
      {
        limit: context.limit,

        checkInDate:
          context.intent.startDate,

        checkOutDate:
          context.intent.endDate,

        adults:
          context.intent.travellers
            ?.adults,

        children:
          context.intent.travellers
            ?.children,

        minimumPrice:
          context.intent.budgetMin,

        maximumPrice:
          context.intent.budgetMax,
      }
    );

  const results =
    recommendations.map(
      (recommendation) =>
        mapRecommendationToAggregatorResult(
          recommendation,
          context
        )
    );

  return {
    providerId,

    results,

    metadata: {
      searchedAt:
        new Date().toISOString(),

      totalResults:
        results.length,

      durationMs:
        Date.now() -
        startedAt,
    },

    warnings: [],
  };
}

export const serpApiHotelsAggregatorProvider: AggregatorProvider =
  {
    id: "serpapi-hotels",

    verticals: [
      "travel",
    ],

    priority: 50,

    isAvailable() {
      return Boolean(
        process.env.SERPAPI_API_KEY
          ?.trim()
      );
    },

    search:
      searchProvider,
  };