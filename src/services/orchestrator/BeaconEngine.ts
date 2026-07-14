import "server-only";

import { parseSearchQuery } from "@/lib/search/SearchParser";
import { applyIntentClassification } from "@/lib/search/IntentClassifier";
import { validateSearchIntent } from "@/lib/search/SearchValidator";

import { selectBestRecommendations } from "@/lib/recommendations/RecommendationRanking";
import { buildRecommendationResponse } from "@/lib/recommendations/RecommendationExplainer";

import { searchShoppingProducts } from "@/services/shopping/SerpApiShoppingProvider";
import { searchHotels } from "@/services/travel/SerpApiHotelsProvider";

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

import type {
  BeaconDataProvider,
  BeaconResponse,
  BeaconResponseSource,
} from "@/services/response/BeaconResponse";

import type {
  Recommendation,
  RecommendationRequest,
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

function prepareIntent(
  originalQuery: string
): SearchIntent {
  const selectedCategory =
    detectSelectedCategory(originalQuery);

  const cleanQuery =
    removeCategoryPrefix(originalQuery);

  let intent =
    parseSearchQuery(cleanQuery);

  intent =
    applyIntentClassification(intent);

  const forcedCategory =
    mapSelectedCategory(
      selectedCategory
    );

  if (forcedCategory) {
    intent = {
      ...intent,
      category: forcedCategory,
    };
  }

  return intent;
}

function createRecommendationRequest(
  intent: SearchIntent
): RecommendationRequest {
  return {
    intent,
    limit: 5,
  };
}

function validateShoppingIntent(
  intent: SearchIntent
): void {
  const validation =
    validateSearchIntent(intent);

  if (validation.valid) {
    return;
  }

  throw new BeaconEngineError(
    validation.issues[0]?.message ??
      "Please provide more information for this shopping search.",
    {
      code: "validation_failed",
      status: 400,
      issues: validation.issues,
    }
  );
}

function validateHotelIntent(
  intent: SearchIntent
): void {
  const destination =
    intent.destination?.trim() ||
    intent.location?.trim();

  if (destination) {
    return;
  }

  throw new BeaconEngineError(
    "Please include the destination or area you would like Beacon to explore.",
    {
      code: "missing_destination",
      status: 400,
    }
  );
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
    error.code === "rate_limited"
  ) {
    return new BeaconEngineError(
      error.message,
      {
        code: "rate_limited",
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
        code: "billing_required",
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
        code: "invalid_response",
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

async function createRankedResponse(input: {
  query: string;
  intent: SearchIntent;

  source: Exclude<
    BeaconResponseSource,
    "general"
  >;

  dataProvider:
    BeaconDataProvider;

  recommendations:
    Recommendation[];

  liveData: boolean;
  aiSummary: string;
}): Promise<BeaconResponse> {
  const request =
    createRecommendationRequest(
      input.intent
    );

  const selected =
    selectBestRecommendations(
      input.recommendations,
      request,
      {
        limit: 5,
        minimumScore: 35,
        minimumTrustScore: 30,
      }
    );

  const explained =
    buildRecommendationResponse(
      input.intent,
      selected
    );

  return createRecommendationResponse({
    query: input.query,
    source: input.source,
    dataProvider:
      input.dataProvider,
    liveData: input.liveData,
    intent: input.intent,
    summary: explained.summary,
    aiSummary:
      input.aiSummary,
    recommendations:
      explained.recommendations,
  });
}

async function handleShopping(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  validateShoppingIntent(intent);

  const products =
    await searchShoppingProducts(
      intent,
      {
        limit: 30,
      }
    );

  return createRankedResponse({
    query,
    intent,
    source: "shopping",
    dataProvider:
      "serpapi-google-shopping",
    recommendations: products,
    liveData: true,
    aiSummary:
      "Beacon searched live shopping data and selected the five strongest product matches.",
  });
}

async function handleHotelDiscovery(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  validateHotelIntent(intent);

  const hotels =
    await searchHotels(
      intent,
      {
        limit: 30,
      }
    );

  return createRankedResponse({
    query,
    intent,
    source: "hotel",
    dataProvider:
      "serpapi-google-maps",
    recommendations: hotels,
    liveData: true,
    aiSummary:
      "Beacon searched live hotel discovery data and selected five strong accommodation options based on location, ratings, reviews, amenities and suitability. Dates were not required.",
  });
}

async function handleHotelAvailability(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  validateHotelIntent(intent);

  const hotels =
    await searchHotels(
      intent,
      {
        limit: 30,
        checkInDate:
          intent.startDate,
        checkOutDate:
          intent.endDate,
      }
    );

  return createRankedResponse({
    query,
    intent,
    source: "hotel",
    dataProvider:
      "serpapi-google-hotels",
    recommendations: hotels,
    liveData: true,
    aiSummary:
      "Beacon checked live hotel availability for the supplied dates and selected the five strongest matches.",
  });
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
      answer: result.answer,
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

async function handleFlightRequest(
  query: string
): Promise<BeaconResponse> {
  return handleGeneralRequest(
    query
  );
}

async function handleEntertainmentRequest(
  query: string
): Promise<BeaconResponse> {
  return handleGeneralRequest(
    query
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

export async function executeBeaconRequest(
  rawQuery: string
): Promise<BeaconResponse> {
  const originalQuery =
    rawQuery.trim();

  if (!originalQuery) {
    throw new BeaconEngineError(
      "Please enter something for Beacon to help with.",
      {
        code: "missing_query",
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
        code: "missing_query",
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
        code: "invalid_search",
        status: 400,
      }
    );
  }

  const plan =
    createBeaconPlan({
      query: cleanQuery,
      intent,
    });

  switch (plan.capability) {
    case "shopping":
      return handleShopping(
        cleanQuery,
        intent
      );

    case "merchant_feed":
      return handleMerchantFeedRequest(
        cleanQuery,
        intent
      );

    case "hotel_discovery":
      return handleHotelDiscovery(
        cleanQuery,
        intent
      );

    case "hotel_availability":
      return handleHotelAvailability(
        cleanQuery,
        intent
      );

    case "flights":
      return handleFlightRequest(
        cleanQuery
      );

    case "entertainment":
      return handleEntertainmentRequest(
        cleanQuery
      );

    case "general_ai":
    default:
      return handleGeneralRequest(
        cleanQuery
      );
  }
}