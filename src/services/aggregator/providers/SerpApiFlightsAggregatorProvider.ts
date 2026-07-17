import "server-only";

import {
  searchFlights,
} from "@/services/travel/SerpApiFlightsProvider";

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
  const cleaned =
    value
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
  const value =
    readMetadataValue(
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
  const value =
    readMetadataValue(
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
  const value =
    readMetadataValue(
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
  const value =
    readMetadataValue(
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

  for (
    const [
      attributeKey,
      attributeValue,
    ] of Object.entries(value)
  ) {
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

function createAttributes(
  recommendation: Recommendation,
  context: AggregatorProviderContext
): AggregatorResultAttributes {
  const attributes:
    AggregatorResultAttributes = {
      searchMode:
        "live_flight_search",
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

  const metadataKeys = [
    "provider",
    "searchEngine",
    "resultType",
    "departureAirport",
    "departureAirportName",
    "departureTime",
    "arrivalAirport",
    "arrivalAirportName",
    "arrivalTime",
    "airlines",
    "flightNumbers",
    "bookingToken",
    "departureToken",
  ] as const;

  for (const key of metadataKeys) {
    const value =
      readMetadataString(
        recommendation,
        key
      );

    if (value) {
      attributes[key] =
        value;
    }
  }

  const numericMetadataKeys = [
    "totalDurationMinutes",
    "stopCount",
    "carbonDifferencePercent",
  ] as const;

  for (
    const key of
      numericMetadataKeys
  ) {
    const value =
      readMetadataNumber(
        recommendation,
        key
      );

    if (
      value !== undefined
    ) {
      attributes[key] =
        value;
    }
  }

  const sponsored =
    readMetadataBoolean(
      recommendation,
      "sponsored"
    );

  if (
    sponsored !== undefined
  ) {
    attributes.sponsored =
      sponsored;
  }

  if (
    context.intent.startDate
  ) {
    attributes.outboundDate =
      context.intent.startDate;
  }

  if (
    context.intent.endDate
  ) {
    attributes.returnDate =
      context.intent.endDate;
  }

  if (
    context.intent.destination
  ) {
    attributes.destination =
      context.intent.destination;
  }

  if (
    context.intent.location
  ) {
    attributes.departureLocation =
      context.intent.location;
  }

  const adults =
    context.intent.travellers
      ?.adults;

  const children =
    context.intent.travellers
      ?.children;

  if (
    adults !== undefined
  ) {
    attributes.adults =
      adults;
  }

  if (
    children !== undefined
  ) {
    attributes.children =
      children;
  }

  return attributes;
}

function getLocation(
  recommendation: Recommendation
): string | undefined {
  const departure =
    readMetadataString(
      recommendation,
      "departureAirportName"
    ) ??
    readMetadataString(
      recommendation,
      "departureAirport"
    );

  const arrival =
    readMetadataString(
      recommendation,
      "arrivalAirportName"
    ) ??
    readMetadataString(
      recommendation,
      "arrivalAirport"
    );

  if (
    departure &&
    arrival
  ) {
    return `${departure} to ${arrival}`;
  }

  return (
    arrival ||
    departure ||
    undefined
  );
}

function mapRecommendationToAggregatorResult(
  recommendation: Recommendation,
  context: AggregatorProviderContext
): AggregatorResult {
  const sponsored =
    readMetadataBoolean(
      recommendation,
      "sponsored"
    ) ??
    false;

  return {
    id:
      recommendation.id,

    providerId:
      "serpapi-flights",

    source:
      "search_api",

    vertical:
      "flights",

    category:
      recommendation.category,

    title:
      recommendation.title,

    description:
      recommendation.description,

    merchant:
      recommendation.merchant,

    brand:
      recommendation.merchant,

    destinationUrl:
      recommendation.url,

    imageUrl:
      recommendation.imageUrl,

    price:
      recommendation.price,

    previousPrice:
      undefined,

    rating:
      undefined,

    reviewCount:
      undefined,

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
      recommendation.score
        .value,

    qualityScore:
      recommendation.score
        .quality,

    trustScore:
      recommendation.score
        .trust,

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

  const recommendations =
    await searchFlights(
      context.intent,
      {
        limit:
          context.limit,

        departureLocation:
          context.intent.location,

        destination:
          context.intent.destination,

        outboundDate:
          context.intent.startDate,

        returnDate:
          context.intent.endDate,

        adults:
          context.intent.travellers
            ?.adults,

        children:
          context.intent.travellers
            ?.children,

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
    providerId:
      "serpapi-flights",

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

    warnings:
      results.length === 0
        ? [
            "SerpApi returned no flight itineraries for this request.",
          ]
        : [],
  };
}

export const serpApiFlightsAggregatorProvider:
  AggregatorProvider = {
    id:
      "serpapi-flights",

    verticals: [
      "flights",
    ],

    priority: 55,

    isAvailable() {
      return Boolean(
        process.env
          .SERPAPI_API_KEY
          ?.trim()
      );
    },

    search:
      searchProvider,
  };