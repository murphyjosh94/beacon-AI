import "server-only";

import {
  handleGeneralAnswer,
} from "@/services/orchestrator/BeaconGeneralHandler";

import {
  handleCombinedTravelRecommendation,
  handleEntertainmentRecommendation,
  handleFlightRecommendation,
  handleHotelAvailabilityRecommendation,
  handleHotelDiscoveryRecommendation,
  handleLocalDiscoveryRecommendation,
  handleShoppingRecommendation,
} from "@/services/orchestrator/BeaconRecommendationHandlers";

import type {
  BeaconExecutionPlan,
} from "@/services/intelligence/Planner";

import type {
  BeaconResponse,
} from "@/services/response/BeaconResponse";

import type {
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

import {
  createInvalidSearchError,
} from "@/services/orchestrator/BeaconEngineErrors";

export type ExecuteBeaconRouteInput = {
  query: string;

  plan: BeaconExecutionPlan;

  intent: SearchIntent;
};

function assertNever(
  value: never
): never {
  throw createInvalidSearchError(
    new Error(
      `Beacon does not recognise the requested capability: ${String(
        value
      )}`
    )
  );
}

export async function executeBeaconRoute(
  input: ExecuteBeaconRouteInput
): Promise<BeaconResponse> {
  const {
    query,
    plan,
    intent,
  } = input;

  switch (plan.capability) {
    case "product_search":
    case "vehicle_parts":
    case "vehicle_accessories":
    case "vehicle_search":
      return handleShoppingRecommendation(
        query,
        intent,
        plan.capability
      );

    case "hotel_discovery":
      return handleHotelDiscoveryRecommendation(
        query,
        intent
      );

    case "hotel_availability":
      return handleHotelAvailabilityRecommendation(
        query,
        intent
      );

    case "flights":
      return handleFlightRecommendation(
        query,
        intent
      );

    case "package_holiday":
    case "flight_and_hotel":
      return handleCombinedTravelRecommendation(
        query,
        intent,
        plan.capability
      );

    case "tickets":
    case "events":
    case "experiences":
    case "sports_travel":
      return handleEntertainmentRecommendation(
        query,
        intent,
        plan.capability
      );

    case "travel_ideas":
    case "restaurants":
    case "activities":
    case "local_services":
    case "places":
    case "weekend_plan":
      return handleLocalDiscoveryRecommendation(
        query,
        plan.capability
      );

    case "general_answer":
      return handleGeneralAnswer(
        query
      );

    default:
      return assertNever(
        plan.capability
      );
  }
}