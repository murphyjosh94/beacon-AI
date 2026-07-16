import "server-only";

import {
  answerGeneralRequest,
  GeneralAnswerError,
} from "@/services/openai/GeneralAnswerProvider";

import {
  createGeneralAnswerResponse,
} from "@/services/response/BeaconResponse";

import type {
  BeaconResponse,
} from "@/services/response/BeaconResponse";

import {
  mapGeneralAnswerError,
} from "@/services/orchestrator/BeaconEngineErrors";

import type {
  BeaconCapability,
} from "@/services/intelligence/IntentEngine";

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

function buildSharedInstructions(
  query: string
): string {
  return [
    `The user asked: "${query}".`,
    "Answer the request immediately.",
    "Never refuse because optional details are missing.",
    "Use current web research whenever live information is beneficial.",
    "State reasonable assumptions briefly.",
    "Give concrete recommendations.",
    "Finish with one optional refinement question after providing value.",
  ].join(" ");
}

export function createGuidedDiscoveryPrompt(
  query: string,
  capability: BeaconCapability
): string {
  const shared =
    buildSharedInstructions(
      query
    );

  switch (capability) {
    case "weekend_plan":
      return [
        shared,
        "Create a complete weekend itinerary.",
        "Include accommodation, food, attractions, evening ideas and one premium option.",
      ].join(" ");

    case "travel_ideas":
      return [
        shared,
        "Recommend five destinations.",
        "Explain who each destination suits.",
      ].join(" ");

    case "hotel_discovery":
      return [
        shared,
        "Recommend hotels without requiring exact travel dates.",
      ].join(" ");

    case "package_holiday":
      return [
        shared,
        "Recommend package holiday options and explain likely price ranges.",
      ].join(" ");

    case "flight_and_hotel":
      return [
        shared,
        "Recommend flight and hotel combinations.",
      ].join(" ");

    case "flights":
      return [
        shared,
        "Recommend suitable airlines, routes and booking strategies.",
      ].join(" ");

    case "restaurants":
      return [
        shared,
        "Recommend five restaurants including cuisine, atmosphere and price.",
      ].join(" ");

    case "activities":
    case "places":
      return [
        shared,
        "Recommend five attractions or activities.",
      ].join(" ");

    case "local_services":
      return [
        shared,
        "Recommend suitable local service providers and explain how to compare them.",
      ].join(" ");

    case "tickets":
    case "events":
    case "experiences":
    case "sports_travel":
      return [
        shared,
        "Recommend five current entertainment or experience options.",
      ].join(" ");

    default:
      return shared;
  }
}

export async function handleGuidedDiscovery(
  query: string,
  capability: BeaconCapability
): Promise<BeaconResponse> {
  return handleGeneralAnswer(
    createGuidedDiscoveryPrompt(
      query,
      capability
    )
  );
}