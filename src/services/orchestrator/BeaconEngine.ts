import "server-only";

import { parseSearchQuery } from "@/lib/search/SearchParser";
import { applyIntentClassification } from "@/lib/search/IntentClassifier";

import {
  answerGeneralRequest,
  GeneralAnswerError,
} from "@/services/openai/GeneralAnswerProvider";

import {
  createGeneralAnswerResponse,
  createRecommendationResponse,
} from "@/services/response/BeaconResponse";

import {
  createBeaconPlan,
  detectSelectedCategory,
  mapSelectedCategory,
  removeCategoryPrefix,
} from "@/services/orchestrator/BeaconPlanner";

import {
  executeAggregator,
} from "@/services/aggregator/Aggregator";

import {
  getAggregatorProvidersForVertical,
} from "@/services/aggregator/ProviderRegistry";

import type {
  AggregatorExecutionResult,
  AggregatorVertical,
} from "@/services/aggregator/AggregatorTypes";

import type {
  BeaconDataProvider,
  BeaconResponse,
  BeaconResponseSource,
} from "@/services/response/BeaconResponse";

import type {
  RecommendationCategory,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

export type BeaconEngineErrorCode =
  | "missing_query"
  | "invalid_search"
  | "validation_failed"
  | "missing_destination"
  | "provider_unavailable"
  | "authentication_failed"
  | "billing_required"
  | "rate_limited"
  | "invalid_response"
  | "internal_error";

export class BeaconEngineError extends Error {
  public readonly code: BeaconEngineErrorCode;
  public readonly status: number;
  public readonly issues?: unknown[];

  constructor(
    message: string,
    options: {
      code: BeaconEngineErrorCode;
      status: number;
      issues?: unknown[];
    }
  ) {
    super(message);

    this.name = "BeaconEngineError";
    this.code = options.code;
    this.status = options.status;
    this.issues = options.issues;
  }
}

type AggregatorResponseConfiguration = {
  vertical: AggregatorVertical;
  source: Exclude<
    BeaconResponseSource,
    "general"
  >;
  dataProvider: BeaconDataProvider;
  affiliateCampaign: string;
  aiSummary: string;
};

function prepareIntent(
  originalQuery: string
): SearchIntent {
  const selectedCategory =
    detectSelectedCategory(
      originalQuery
    );

  const cleanQuery =
    removeCategoryPrefix(
      originalQuery
    );

  let intent =
    parseSearchQuery(
      cleanQuery
    );

  intent =
    applyIntentClassification(
      intent
    );

  const forcedCategory =
    mapSelectedCategory(
      selectedCategory
    );

  if (forcedCategory) {
    intent = {
      ...intent,
      category:
        forcedCategory,
    };
  }

  return intent;
}

function mapGeneralAnswerError(
  error: GeneralAnswerError
): BeaconEngineError {
  if (
    error.code ===
    "authentication_failed"
  ) {
    return new BeaconEngineError(
      error.message,
      {
        code:
          "authentication_failed",
        status: 401,
      }
    );
  }

  if (
    error.code ===
    "rate_limited"
  ) {
    return new BeaconEngineError(
      error.message,
      {
        code:
          "rate_limited",
        status: 429,
      }
    );
  }

  if (
    error.code ===
    "billing_required"
  ) {
    return new BeaconEngineError(
      error.message,
      {
        code:
          "billing_required",
        status: 503,
      }
    );
  }

  if (
    error.code ===
    "invalid_response"
  ) {
    return new BeaconEngineError(
      error.message,
      {
        code:
          "invalid_response",
        status: 502,
      }
    );
  }

  return new BeaconEngineError(
    error.message,
    {
      code:
        "provider_unavailable",
      status: 503,
    }
  );
}

function getDestination(
  intent: SearchIntent
): string | undefined {
  return (
    intent.destination?.trim() ||
    intent.location?.trim() ||
    undefined
  );
}

function ensureHotelDestination(
  intent: SearchIntent
): void {
  if (getDestination(intent)) {
    return;
  }

  throw new BeaconEngineError(
    "Please include the destination or area you would like Beacon to explore.",
    {
      code:
        "missing_destination",
      status: 400,
    }
  );
}

function createAggregatorSummary(
  baseSummary: string,
  result: AggregatorExecutionResult
): string {
  const failureCount =
    result.providerFailures.length;

  if (failureCount === 0) {
    return baseSummary;
  }

  if (
    result.recommendations.length > 0
  ) {
    return (
      `${baseSummary} ` +
      `${failureCount === 1
        ? "One source was temporarily unavailable."
        : `${failureCount} sources were temporarily unavailable.`}`
    );
  }

  return baseSummary;
}

function ensureAggregatorProducedResults(
  result: AggregatorExecutionResult,
  verticalLabel: string
): void {
  if (
    result.recommendations.length > 0
  ) {
    return;
  }

  const providerMessages =
    result.providerFailures
      .map(
        (failure) =>
          failure.message
      )
      .filter(Boolean);

  const message =
    providerMessages[0] ??
    `Beacon could not find suitable ${verticalLabel} results for this request.`;

  throw new BeaconEngineError(
    message,
    {
      code:
        "provider_unavailable",
      status: 503,
    }
  );
}

async function executeRecommendationAggregator(
  query: string,
  intent: SearchIntent,
  configuration: AggregatorResponseConfiguration
): Promise<BeaconResponse> {
  const providers =
    getAggregatorProvidersForVertical(
      configuration.vertical
    );

  if (providers.length === 0) {
    throw new BeaconEngineError(
      `Beacon does not currently have an available ${configuration.vertical} provider.`,
      {
        code:
          "provider_unavailable",
        status: 503,
      }
    );
  }

  const result =
    await executeAggregator({
      query,
      intent,

      vertical:
        configuration.vertical,

      providers,

      affiliateCampaign:
        configuration.affiliateCampaign,

      options: {
        providerLimit: 30,
        finalLimit: 5,
        minimumScore: 35,
        minimumTrustScore: 25,
        timeoutMs: 15_000,
      },
    });

  ensureAggregatorProducedResults(
    result,
    configuration.vertical
  );

  return createRecommendationResponse({
    query,

    source:
      configuration.source,

    dataProvider:
      configuration.dataProvider,

    liveData: true,

    intent,

    summary:
      `${result.recommendations.length} strong options selected from live provider results.`,

    aiSummary:
      createAggregatorSummary(
        configuration.aiSummary,
        result
      ),

    recommendations:
      result.recommendations,
  });
}

async function handleShopping(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  return executeRecommendationAggregator(
    query,
    {
      ...intent,
      category: "product",
    },
    {
      vertical: "shopping",
      source: "shopping",

      dataProvider:
        "serpapi-google-shopping",

      affiliateCampaign:
        "beacon-shopping",

      aiSummary:
        "Beacon searched live shopping providers, normalised and compared the results, removed duplicates, ranked the strongest options and then applied eligible partner tracking links.",
    }
  );
}

async function handleHotelDiscovery(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  ensureHotelDestination(intent);

  return executeRecommendationAggregator(
    query,
    {
      ...intent,
      category: "holiday",
    },
    {
      vertical: "travel",
      source: "hotel",

      dataProvider:
        "serpapi-google-maps",

      affiliateCampaign:
        "beacon-hotel-discovery",

      aiSummary:
        "Beacon searched live accommodation discovery sources and selected real hotel listings using destination, suitability, ratings, reviews, amenities and location. Exact travel dates were not required.",
    }
  );
}

async function handleHotelAvailability(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  ensureHotelDestination(intent);

  return executeRecommendationAggregator(
    query,
    {
      ...intent,
      category: "holiday",
    },
    {
      vertical: "travel",
      source: "hotel",

      dataProvider:
        "serpapi-google-hotels",

      affiliateCampaign:
        "beacon-hotel-availability",

      aiSummary:
        "Beacon searched live accommodation providers using the dates supplied, compared availability, prices, ratings, reviews, amenities and location, and selected the strongest hotel listings.",
    }
  );
}

async function handleMerchantFeedRequest(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  return handleShopping(
    query,
    {
      ...intent,
      category: "product",
    }
  );
}

async function handleFlightRequest(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  const providers =
    getAggregatorProvidersForVertical(
      "flights"
    );

  if (providers.length > 0) {
    return executeRecommendationAggregator(
      query,
      intent,
      {
        vertical: "flights",
        source: "flight",

        dataProvider:
          "serpapi-google-flights",

        affiliateCampaign:
          "beacon-flights",

        aiSummary:
          "Beacon searched live flight providers and selected the strongest routes based on relevance, timing, value and source reliability.",
      }
    );
  }

  return handleGeneralRequest(query);
}

async function handleEntertainmentRequest(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  const providers =
    getAggregatorProvidersForVertical(
      "entertainment"
    );

  if (providers.length > 0) {
    return executeRecommendationAggregator(
      query,
      {
        ...intent,
        category:
          "experience",
      },
      {
        vertical:
          "entertainment",

        source:
          "entertainment",

        dataProvider:
          "mixed",

        affiliateCampaign:
          "beacon-entertainment",

        aiSummary:
          "Beacon searched live entertainment and experience providers and selected the strongest matching options.",
      }
    );
  }

  return handleGeneralRequest(query);
}

async function handleGeneralRequest(
  query: string
): Promise<BeaconResponse> {
  try {
    const result =
      await answerGeneralRequest(
        query
      );

    return createGeneralAnswerResponse({
      query,

      answer:
        result.answer,

      usedWebSearch:
        result.usedWebSearch,
    });
  } catch (error) {
    if (
      error instanceof
      GeneralAnswerError
    ) {
      throw mapGeneralAnswerError(
        error
      );
    }

    throw error;
  }
}

function ensureExpectedCategory(
  category: RecommendationCategory
): RecommendationCategory {
  return category;
}

export async function executeBeaconRequest(
  rawQuery: string
): Promise<BeaconResponse> {
  const originalQuery =
    rawQuery.trim();

  if (!originalQuery) {
    throw new BeaconEngineError(
      "Please enter something for Beacon to help with.",
      {
        code:
          "missing_query",
        status: 400,
      }
    );
  }

  const cleanQuery =
    removeCategoryPrefix(
      originalQuery
    );

  if (!cleanQuery) {
    throw new BeaconEngineError(
      "Please enter something for Beacon to help with.",
      {
        code:
          "missing_query",
        status: 400,
      }
    );
  }

  let intent: SearchIntent;

  try {
    intent =
      prepareIntent(
        originalQuery
      );
  } catch (error) {
    throw new BeaconEngineError(
      error instanceof Error
        ? error.message
        : "Beacon could not understand this request.",
      {
        code:
          "invalid_search",
        status: 400,
      }
    );
  }

  ensureExpectedCategory(
    intent.category
  );

  const plan =
    createBeaconPlan({
      query:
        cleanQuery,

      intent,
    });

  switch (plan.capability) {
    case "shopping":
      return handleShopping(
        plan.query,
        plan.intent
      );

    case "merchant_feed":
      return handleMerchantFeedRequest(
        plan.query,
        plan.intent
      );

    case "hotel_discovery":
      return handleHotelDiscovery(
        plan.query,
        plan.intent
      );

    case "hotel_availability":
      return handleHotelAvailability(
        plan.query,
        plan.intent
      );

    case "flights":
      return handleFlightRequest(
        plan.query,
        plan.intent
      );

    case "entertainment":
      return handleEntertainmentRequest(
        plan.query,
        plan.intent
      );

    case "general_ai":
    default:
      return handleGeneralRequest(
        plan.query
      );
  }
}