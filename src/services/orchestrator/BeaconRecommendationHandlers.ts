import "server-only";

import {
  answerGeneralRequest,
  GeneralAnswerError,
} from "@/services/openai/GeneralAnswerProvider";

import {
  generateGuidedRecommendations,
  GuidedRecommendationError,
} from "@/services/openai/GuidedRecommendationProvider";

import {
  createGeneralAnswerResponse,
  createRecommendationResponse,
} from "@/services/response/BeaconResponse";

import {
  mapGeneralAnswerError,
} from "@/services/orchestrator/BeaconEngineErrors";

import type {
  BeaconCapability,
} from "@/services/intelligence/IntentEngine";

import type {
  RecommendationCategory,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

import type {
  BeaconResponse,
  BeaconResponseSource,
} from "@/services/response/BeaconResponse";

type RecommendationCapability =
  Exclude<
    BeaconCapability,
    "general_answer"
  >;

function isRecommendationCapability(
  capability: BeaconCapability
): capability is RecommendationCapability {
  return (
    capability !==
    "general_answer"
  );
}

function getRecommendationCategory(
  capability: RecommendationCapability
): RecommendationCategory {
  switch (capability) {
    case "product_search":
    case "vehicle_parts":
    case "vehicle_accessories":
    case "vehicle_search":
      return "product";

    case "tickets":
    case "events":
    case "experiences":
    case "activities":
      return "experience";

    case "restaurants":
    case "local_services":
    case "places":
      return "service";

    case "hotel_discovery":
    case "hotel_availability":
    case "package_holiday":
    case "flights":
    case "flight_and_hotel":
    case "travel_ideas":
    case "weekend_plan":
    case "sports_travel":
      return "holiday";
  }
}

function getRecommendationSource(
  capability: RecommendationCapability
): Exclude<
  BeaconResponseSource,
  "general"
> {
  switch (capability) {
    case "product_search":
    case "vehicle_parts":
    case "vehicle_accessories":
    case "vehicle_search":
      return "shopping";

    case "flights":
      return "flight";

    case "tickets":
    case "events":
    case "experiences":
      return "entertainment";

    case "hotel_discovery":
    case "hotel_availability":
    case "package_holiday":
    case "flight_and_hotel":
    case "travel_ideas":
    case "restaurants":
    case "activities":
    case "local_services":
    case "places":
    case "weekend_plan":
    case "sports_travel":
      return "hotel";
  }
}

function createFallbackIntent(
  query: string,
  capability: RecommendationCapability
): SearchIntent {
  return {
    rawQuery:
      query.trim(),

    category:
      getRecommendationCategory(
        capability
      ),

    keywords: [],

    preferences: [],

    exclusions: [],
  };
}

function ensureRecommendationIntent(
  intent: SearchIntent,
  capability: RecommendationCapability
): SearchIntent {
  return {
    ...intent,

    rawQuery:
      intent.rawQuery.trim(),

    category:
      getRecommendationCategory(
        capability
      ),

    keywords:
      Array.isArray(
        intent.keywords
      )
        ? intent.keywords
        : [],

    preferences:
      Array.isArray(
        intent.preferences
      )
        ? intent.preferences
        : [],

    exclusions:
      Array.isArray(
        intent.exclusions
      )
        ? intent.exclusions
        : [],
  };
}

function mapGuidedRecommendationError(
  error: GuidedRecommendationError
): GeneralAnswerError {
  return new GeneralAnswerError(
    error.message,
    error.code
  );
}

export async function handleGeneralAnswer(
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

export function createGuidedDiscoveryPrompt(
  query: string,
  capability: BeaconCapability
): string {
  const cleanedQuery =
    query.trim();

  if (
    capability ===
    "general_answer"
  ) {
    return cleanedQuery;
  }

  return [
    cleanedQuery,
    `Beacon capability: ${capability}.`,
    "Return separate structured recommendation cards.",
    "Do not return an essay, numbered prose list or markdown table.",
  ].join(" ");
}

export async function handleGuidedDiscovery(
  query: string,
  capability: BeaconCapability,
  intent?: SearchIntent
): Promise<BeaconResponse> {
  if (
    !isRecommendationCapability(
      capability
    )
  ) {
    return handleGeneralAnswer(
      query
    );
  }

  const resolvedIntent =
    ensureRecommendationIntent(
      intent ??
        createFallbackIntent(
          query,
          capability
        ),
      capability
    );

  try {
    const result =
      await generateGuidedRecommendations(
        query,
        capability,
        resolvedIntent
      );

    return createRecommendationResponse({
      query,

      source:
        getRecommendationSource(
          capability
        ),

      dataProvider:
        result.usedWebSearch
          ? "openai-web-search"
          : "openai",

      liveData:
        result.usedWebSearch,

      intent:
        resolvedIntent,

      summary:
        result.summary,

      aiSummary:
        result.summary,

      recommendations:
        result.recommendations,
    });
  } catch (error) {
    if (
      error instanceof
      GuidedRecommendationError
    ) {
      throw mapGeneralAnswerError(
        mapGuidedRecommendationError(
          error
        )
      );
    }

    throw error;
  }
}

export async function handleCapabilityResponse(
  query: string,
  capability: BeaconCapability,
  intent?: SearchIntent
): Promise<BeaconResponse> {
  if (
    capability ===
    "general_answer"
  ) {
    return handleGeneralAnswer(
      query
    );
  }

  return handleGuidedDiscovery(
    query,
    capability,
    intent
  );
}