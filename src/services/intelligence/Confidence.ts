import "server-only";

import type {
  BeaconCapability,
  BeaconIntentDecision,
  BeaconPrimaryIntent,
} from "@/services/intelligence/IntentEngine";

export type BeaconConfidenceBand =
  | "very_high"
  | "high"
  | "medium"
  | "low"
  | "very_low";

export type BeaconExecutionMode =
  | "search_now"
  | "search_with_assumptions"
  | "answer_now"
  | "ask_one_question";

export type BeaconConfidenceAssessment = {
  confidence: number;

  band: BeaconConfidenceBand;

  executionMode: BeaconExecutionMode;

  canProceed: boolean;

  shouldAskFollowUp: boolean;

  followUpQuestion?: string;

  assumptionsAllowed: boolean;

  reasons: string[];
};

const SEARCH_CAPABILITIES = new Set<BeaconCapability>([
  "product_search",
  "vehicle_parts",
  "vehicle_accessories",
  "vehicle_search",
  "hotel_discovery",
  "hotel_availability",
  "package_holiday",
  "flights",
  "flight_and_hotel",
  "travel_ideas",
  "restaurants",
  "activities",
  "local_services",
  "places",
  "weekend_plan",
  "tickets",
  "events",
  "experiences",
  "sports_travel",
]);

const DESTINATION_REQUIRED_CAPABILITIES =
  new Set<BeaconCapability>([
    "hotel_discovery",
    "hotel_availability",
    "package_holiday",
    "flights",
    "flight_and_hotel",
  ]);

const VEHICLE_REQUIRED_CAPABILITIES =
  new Set<BeaconCapability>([
    "vehicle_parts",
  ]);

function clampConfidence(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
}

function getConfidenceBand(
  confidence: number
): BeaconConfidenceBand {
  if (confidence >= 90) {
    return "very_high";
  }

  if (confidence >= 75) {
    return "high";
  }

  if (confidence >= 55) {
    return "medium";
  }

  if (confidence >= 35) {
    return "low";
  }

  return "very_low";
}

function isGeneralAnswer(
  capability: BeaconCapability
): boolean {
  return capability ===
    "general_answer";
}

function capabilityNeedsDestination(
  capability: BeaconCapability
): boolean {
  return DESTINATION_REQUIRED_CAPABILITIES.has(
    capability
  );
}

function capabilityNeedsVehicle(
  capability: BeaconCapability
): boolean {
  return VEHICLE_REQUIRED_CAPABILITIES.has(
    capability
  );
}

function createMissingDestinationQuestion(
  capability: BeaconCapability
): string {
  if (capability === "flights") {
    return "Where would you like to fly to?";
  }

  if (
    capability ===
      "package_holiday" ||
    capability ===
      "flight_and_hotel"
  ) {
    return "Which destination would you like Beacon to search?";
  }

  return "Which destination or area would you like Beacon to search?";
}

function createMissingVehicleQuestion(): string {
  return "Which vehicle model and engine is the part for?";
}

function getPrimaryIntentLabel(
  intent: BeaconPrimaryIntent
): string {
  if (intent === "shopping") {
    return "shopping";
  }

  if (intent === "travel") {
    return "travel";
  }

  if (intent === "automotive") {
    return "automotive";
  }

  if (intent === "local") {
    return "local discovery";
  }

  if (intent === "entertainment") {
    return "entertainment";
  }

  return "general assistance";
}

function buildReasons(
  decision: BeaconIntentDecision,
  confidence: number
): string[] {
  const reasons: string[] = [
    `Beacon classified this as ${getPrimaryIntentLabel(
      decision.primaryIntent
    )}.`,
  ];

  const primaryScore =
    decision.scores[0];

  if (
    primaryScore &&
    primaryScore.matchedSignals.length > 0
  ) {
    reasons.push(
      `Matched signals: ${primaryScore.matchedSignals
        .slice(0, 4)
        .join(", ")}.`
    );
  }

  if (
    decision.assumptions.length > 0
  ) {
    reasons.push(
      "Optional details can be handled with reasonable assumptions."
    );
  }

  if (
    confidence >= 75
  ) {
    reasons.push(
      "The request is specific enough to proceed immediately."
    );
  } else if (
    confidence >= 55
  ) {
    reasons.push(
      "The request is usable, but Beacon may apply broad defaults."
    );
  }

  return reasons;
}

function canSearchWithMissingDestination(
  decision: BeaconIntentDecision
): boolean {
  if (
    decision.capability ===
      "travel_ideas"
  ) {
    return true;
  }

  if (
    decision.capability ===
      "weekend_plan"
  ) {
    return Boolean(
      decision.detected.destination
    );
  }

  return false;
}

function determineBlockingQuestion(
  decision: BeaconIntentDecision
): string | undefined {
  if (
    capabilityNeedsDestination(
      decision.capability
    ) &&
    !decision.detected.destination &&
    !canSearchWithMissingDestination(
      decision
    )
  ) {
    return createMissingDestinationQuestion(
      decision.capability
    );
  }

  if (
    capabilityNeedsVehicle(
      decision.capability
    ) &&
    !decision.detected.vehicleDetailsProvided
  ) {
    return createMissingVehicleQuestion();
  }

  return undefined;
}

function determineExecutionMode(
  decision: BeaconIntentDecision,
  confidence: number,
  blockingQuestion?: string
): BeaconExecutionMode {
  if (blockingQuestion) {
    return "ask_one_question";
  }

  if (
    isGeneralAnswer(
      decision.capability
    )
  ) {
    return "answer_now";
  }

  if (
    SEARCH_CAPABILITIES.has(
      decision.capability
    )
  ) {
    if (
      confidence >= 75
    ) {
      return "search_now";
    }

    return "search_with_assumptions";
  }

  return "answer_now";
}

export function assessBeaconConfidence(
  decision: BeaconIntentDecision
): BeaconConfidenceAssessment {
  const confidence =
    clampConfidence(
      decision.confidence
    );

  const blockingQuestion =
    determineBlockingQuestion(
      decision
    );

  const executionMode =
    determineExecutionMode(
      decision,
      confidence,
      blockingQuestion
    );

  return {
    confidence,

    band:
      getConfidenceBand(
        confidence
      ),

    executionMode,

    canProceed:
      executionMode !==
      "ask_one_question",

    shouldAskFollowUp:
      executionMode ===
      "ask_one_question",

    followUpQuestion:
      blockingQuestion,

    assumptionsAllowed:
      executionMode ===
        "search_with_assumptions" ||
      decision.assumptions.length > 0,

    reasons:
      buildReasons(
        decision,
        confidence
      ),
  };
}

export function shouldProceedWithoutClarification(
  decision: BeaconIntentDecision
): boolean {
  return assessBeaconConfidence(
    decision
  ).canProceed;
}

export function getSingleFollowUpQuestion(
  decision: BeaconIntentDecision
): string | undefined {
  return assessBeaconConfidence(
    decision
  ).followUpQuestion;
}