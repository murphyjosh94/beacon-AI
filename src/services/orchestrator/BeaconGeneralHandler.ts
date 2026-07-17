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

import type {
  BeaconResponse,
  BeaconResponseSource,
} from "@/services/response/BeaconResponse";

import {
  mapGeneralAnswerError,
} from "@/services/orchestrator/BeaconEngineErrors";

import type {
  BeaconCapability,
} from "@/services/intelligence/IntentEngine";

import type {
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

function mapCapabilitySource(
  capability: BeaconCapability
): Exclude<
  BeaconResponseSource,
  "general"
> {
  switch (capability) {
    case "flights":
      return "flight";

    case "tickets":
    case "events":
    case "experiences":
      return "entertainment";

    case "product_search":
    case "vehicle_parts":
    case "vehicle_accessories":
    case "vehicle_search":
      return "shopping";

    default:
      return "hotel";
  }
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
  return [
    query.trim(),
    `Beacon capability: ${capability}.`,
    "Return distinct structured recommendation cards rather than a prose essay.",
  ].join(" ");
}

function createFallbackIntent(
  query: string,
  capability: BeaconCapability
): SearchIntent {
  const category =
    capability === "product_search" ||
    capability === "vehicle_parts" ||
    capability === "vehicle_accessories" ||
    capability === "vehicle_search"
      ? "product"
      : capability === "tickets" ||
          capability === "events" ||
          capability === "experiences" ||
          capability === "activities"
        ? "experience"
        : capability === "restaurants" ||
            capability === "local_services" ||
            capability === "places"
          ? "service"
          : "holiday";

  return {
    rawQuery:
      query.trim(),

    category,

    keywords: [],

    preferences: [],

    exclusions: [],
  };
}

export async function handleGuidedDiscovery(
  query: string,
  capability: BeaconCapability,
  intent?: SearchIntent
): Promise<BeaconResponse> {
  const resolvedIntent =
    intent ??
    createFallbackIntent(
      query,
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
        mapCapabilitySource(
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
        new GeneralAnswerError(
          error.message,
          error.code
        )
      );
    }

    throw error;
  }
}