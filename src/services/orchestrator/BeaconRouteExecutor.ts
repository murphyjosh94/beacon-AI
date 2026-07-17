import "server-only";

import {
  handleCapabilityResponse,
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

export type ExecuteBeaconRouteInput = {
  query: string;

  plan: BeaconExecutionPlan;

  intent: SearchIntent;
};

export async function executeBeaconRoute(
  input: ExecuteBeaconRouteInput
): Promise<BeaconResponse> {
  const {
    query,
    plan,
    intent,
  } = input;

  return handleCapabilityResponse(
    query,
    plan.capability,
    intent
  );
}