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
  public readonly code:
    BeaconEngineErrorCode;

  public readonly status: number;
  public readonly issues?: unknown[];

  constructor(
    message: string,
    options: {
      code:
        BeaconEngineErrorCode;
      status: number;
      issues?: unknown[];
    }
  ) {
    super(message);

    this.name =
      "BeaconEngineError";

    this.code =
      options.code;

    this.status =
      options.status;

    this.issues =
      options.issues;
  }
}

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

function createRecommendationRequest(
  intent: SearchIntent
): RecommendationRequest {
  return {
    intent,
    limit: 5,
  };
}

function validateLiveRecommendationIntent(
  intent: SearchIntent
): void {
  const validation =
    validateSearchIntent(
      intent
    );

  if (validation.valid) {
    return;
  }

  throw new BeaconEngineError(
    validation.issues[0]
      ?.message ??
      "Please provide more information for this search.",
    {
      code:
        "validation_failed",
      status: 400,
      issues:
        validation.issues,
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

async function runRecommendationProvider(
  input: {
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
    aiSummary: string;
  }
): Promise<BeaconResponse> {
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
    liveData: true,
    intent: input.intent,
    summary:
      explained.summary,
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
  validateLiveRecommendationIntent(
    intent
  );

  const products =
    await searchShoppingProducts(
      intent,
      {
        limit: 30,
      }
    );

  return runRecommendationProvider({
    query,
    intent,
    source: "shopping",
    dataProvider:
      "serpapi-google-shopping",
    recommendations:
      products,
    aiSummary:
      "Beacon searched live shopping data, compared suitable products and selected the strongest matches.",
  });
}

async function handleHotelAvailability(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  if (!intent.destination) {
    throw new BeaconEngineError(
      "Please include a destination for this hotel availability search.",
      {
        code:
          "missing_destination",
        status: 400,
      }
    );
  }

  validateLiveRecommendationIntent(
    intent
  );

  const hotels =
    await searchHotels(
      intent,
      {
        limit: 30,
      }
    );

  return runRecommendationProvider({
    query,
    intent,
    source: "hotel",
    dataProvider:
      "serpapi-google-hotels",
    recommendations:
      hotels,
    aiSummary:
      "Beacon checked live hotel availability for the dates supplied and selected the strongest matches.",
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

async function handleHotelDiscovery(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  const destination =
    intent.destination?.trim() ||
    intent.location?.trim();

  const discoveryQuery =
    destination
      ? [
          `Help me discover the best hotels and areas to stay in ${destination}.`,
          `My original request was: ${query}.`,
          "Do not require exact travel dates.",
          "Focus on location, hotel character, typical price level, amenities, suitability and important trade-offs.",
          "Explain that exact availability and date-specific prices can be checked later when dates are chosen.",
        ].join(" ")
      : [
          `Help me explore suitable holiday destinations and accommodation options for this request: ${query}.`,
          "Do not require exact travel dates.",
          "Help me decide on the destination or type of stay first.",
        ].join(" ");

  return handleGeneralRequest(
    discoveryQuery
  );
}

async function handleFlightPlanning(
  query: string
): Promise<BeaconResponse> {
  const planningQuery = [
    `Help with this flight or air-travel request: ${query}.`,
    "If exact dates are not supplied, provide useful route, airport, airline, timing and planning guidance without demanding dates.",
    "Do not claim to have checked live fares unless live web information supports it.",
  ].join(" ");

  return handleGeneralRequest(
    planningQuery
  );
}

async function handleEntertainment(
  query: string
): Promise<BeaconResponse> {
  const entertainmentQuery = [
    `Help with this entertainment, event or experience request: ${query}.`,
    "Suggest useful options and use current web information where appropriate.",
    "Do not invent ticket availability or current prices.",
  ].join(" ");

  return handleGeneralRequest(
    entertainmentQuery
  );
}

async function handleMerchantFeedRequest(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  /*
   * Until the CJS and GSF feed providers are connected,
   * merchant-feed requests use the live shopping provider.
   *
   * The planner already separates this capability so the
   * dedicated providers can be inserted without changing
   * the API route or frontend.
   */
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

  const plan =
    createBeaconPlan({
      query: cleanQuery,
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

    case "hotel_availability":
      return handleHotelAvailability(
        plan.query,
        plan.intent
      );

    case "hotel_discovery":
      return handleHotelDiscovery(
        plan.query,
        plan.intent
      );

    case "flights":
      return handleFlightPlanning(
        plan.query
      );

    case "entertainment":
      return handleEntertainment(
        plan.query
      );

    case "general_ai":
    default:
      return handleGeneralRequest(
        plan.query
      );
  }
}