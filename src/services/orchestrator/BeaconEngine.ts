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

import type {
  BeaconResponse,
  BeaconResponseSource,
  BeaconDataProvider,
} from "@/services/response/BeaconResponse";

import type {
  RecommendationCategory,
  RecommendationRequest,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type SelectedBeaconCategory =
  | "shopping"
  | "getaways"
  | "entertainment"
  | null;

export type BeaconEngineErrorCode =
  | "missing_query"
  | "invalid_search"
  | "validation_failed"
  | "missing_destination"
  | "missing_travel_dates"
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

function readQuery(value: string): string {
  return value.trim();
}

function detectSelectedCategory(
  query: string
): SelectedBeaconCategory {
  const normalised = query.toLowerCase();

  if (
    normalised.startsWith(
      "shopping request:"
    )
  ) {
    return "shopping";
  }

  if (
    normalised.startsWith(
      "holiday and getaway request:"
    )
  ) {
    return "getaways";
  }

  if (
    normalised.startsWith(
      "entertainment and experience request:"
    )
  ) {
    return "entertainment";
  }

  return null;
}

function removeCategoryPrefix(
  query: string
): string {
  return query
    .replace(
      /^shopping request:\s*/i,
      ""
    )
    .replace(
      /^holiday and getaway request:\s*/i,
      ""
    )
    .replace(
      /^entertainment and experience request:\s*/i,
      ""
    )
    .trim();
}

function mapSelectedCategory(
  category: SelectedBeaconCategory
): RecommendationCategory | null {
  if (category === "shopping") {
    return "product";
  }

  if (category === "getaways") {
    return "holiday";
  }

  if (category === "entertainment") {
    return "experience";
  }

  return null;
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

function validateRecommendationIntent(
  intent: SearchIntent
): void {
  const validation =
    validateSearchIntent(intent);

  if (validation.valid) {
    return;
  }

  throw new BeaconEngineError(
    validation.issues[0]?.message ??
      "Please provide more information for this search.",
    {
      code: "validation_failed",
      status: 400,
      issues: validation.issues,
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
        code: "authentication_failed",
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
    error.code === "billing_required"
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
      code: "provider_unavailable",
      status: 503,
    }
  );
}

async function runRecommendationProvider(input: {
  query: string;
  intent: SearchIntent;
  source: Exclude<
    BeaconResponseSource,
    "general"
  >;
  dataProvider: BeaconDataProvider;
  recommendations: Awaited<
    ReturnType<
      typeof searchShoppingProducts
    >
  >;
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
    liveData: true,
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
  validateRecommendationIntent(intent);

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
    recommendations: products,
    aiSummary:
      "Beacon searched live shopping data, compared suitable products and selected the strongest matches.",
  });
}

async function handleHotels(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  if (!intent.destination) {
    throw new BeaconEngineError(
      "Please include the destination you would like Beacon to search.",
      {
        code:
          "missing_destination",
        status: 400,
      }
    );
  }

  if (
    !intent.startDate ||
    !intent.endDate
  ) {
    throw new BeaconEngineError(
      "Please include exact check-in and check-out dates, for example: 12 August 2026 to 19 August 2026.",
      {
        code:
          "missing_travel_dates",
        status: 400,
      }
    );
  }

  validateRecommendationIntent(intent);

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
    recommendations: hotels,
    aiSummary:
      "Beacon searched live hotel data, compared prices, ratings, locations and amenities, and selected the strongest matches.",
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

export async function executeBeaconRequest(
  rawQuery: string
): Promise<BeaconResponse> {
  const originalQuery =
    readQuery(rawQuery);

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

  if (
    intent.category === "product"
  ) {
    return handleShopping(
      cleanQuery,
      intent
    );
  }

  if (
    intent.category === "holiday"
  ) {
    return handleHotels(
      cleanQuery,
      intent
    );
  }

  return handleGeneralRequest(
    cleanQuery
  );
}