import "server-only";

import {
  parseSearchQuery,
} from "@/lib/search/SearchParser";

import {
  applyIntentClassification,
} from "@/lib/search/IntentClassifier";

import {
  createBeaconPlan,
  type BeaconExecutionPlan,
} from "@/services/intelligence/Planner";

import type {
  BeaconCapability,
  BeaconPrimaryIntent,
} from "@/services/intelligence/IntentEngine";

import type {
  RecommendationCategory,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

import {
  createInvalidSearchError,
  createMissingQueryError,
  createValidationError,
} from "@/services/orchestrator/BeaconEngineErrors";

const LEGACY_CATEGORY_PREFIXES = [
  /^shopping request:\s*/i,
  /^holiday and getaway request:\s*/i,
  /^entertainment and experience request:\s*/i,
];

export type PrepareBeaconIntentInput = {
  rawQuery: string;
  resultLimit?: number;
};

export type PreparedBeaconIntent = {
  query: string;
  plan: BeaconExecutionPlan;
  intent: SearchIntent;
};

export function cleanBeaconQuery(
  rawQuery: string
): string {
  let query =
    rawQuery
      .replace(/\s+/g, " ")
      .trim();

  for (
    const prefix of
    LEGACY_CATEGORY_PREFIXES
  ) {
    query =
      query.replace(
        prefix,
        ""
      );
  }

  return query.trim();
}

function mapIntentToRecommendationCategory(
  primaryIntent:
    BeaconPrimaryIntent,
  capability:
    BeaconCapability
): RecommendationCategory {
  if (
    primaryIntent ===
      "shopping" ||
    primaryIntent ===
      "automotive"
  ) {
    return "product";
  }

  if (
    primaryIntent ===
    "travel"
  ) {
    return "holiday";
  }

  if (
    primaryIntent ===
    "local"
  ) {
    return "service";
  }

  if (
    primaryIntent ===
    "entertainment"
  ) {
    return "experience";
  }

  if (
    capability ===
    "general_answer"
  ) {
    return "unknown";
  }

  return "unknown";
}

function mergeDetectedDetailsIntoIntent(
  intent: SearchIntent,
  plan: BeaconExecutionPlan,
  query: string
): SearchIntent {
  const detected =
    plan.intent.detected;

  const destination =
    intent.destination?.trim() ||
    detected.destination?.trim() ||
    undefined;

  const departureLocation =
    detected.departureLocation?.trim() ||
    undefined;

  const location =
    intent.location?.trim() ||
    destination ||
    departureLocation ||
    undefined;

  return {
    ...intent,

    rawQuery:
      query,

    category:
      mapIntentToRecommendationCategory(
        plan.primaryIntent,
        plan.capability
      ),

    destination,

    location,

    startDate:
      intent.startDate,

    endDate:
      intent.endDate,
  };
}

function createLegacySearchIntent(
  query: string,
  plan: BeaconExecutionPlan
): SearchIntent {
  try {
    let intent =
      parseSearchQuery(
        query
      );

    intent =
      applyIntentClassification(
        intent
      );

    return mergeDetectedDetailsIntoIntent(
      intent,
      plan,
      query
    );
  } catch (error) {
    throw createInvalidSearchError(
      error
    );
  }
}

function ensurePlanCanExecute(
  plan: BeaconExecutionPlan
): void {
  if (plan.canExecute) {
    return;
  }

  throw createValidationError(
    plan.followUpQuestion ??
      "Beacon needs one essential detail before continuing.",
    [
      {
        capability:
          plan.capability,

        confidence:
          plan.confidence
            .confidence,

        question:
          plan.followUpQuestion ??
          null,
      },
    ]
  );
}

export function prepareBeaconIntent(
  input: PrepareBeaconIntentInput
): PreparedBeaconIntent {
  const query =
    cleanBeaconQuery(
      input.rawQuery
    );

  if (!query) {
    throw createMissingQueryError();
  }

  let plan:
    BeaconExecutionPlan;

  try {
    plan =
      createBeaconPlan({
        query,

        resultLimit:
          input.resultLimit,
      });
  } catch (error) {
    throw createInvalidSearchError(
      error
    );
  }

  ensurePlanCanExecute(
    plan
  );

  const intent =
    createLegacySearchIntent(
      query,
      plan
    );

  return {
    query,
    plan,
    intent,
  };
}

export function getPreparedDestination(
  prepared:
    PreparedBeaconIntent
): string | undefined {
  return (
    prepared.intent
      .destination
      ?.trim() ||
    prepared.intent
      .location
      ?.trim() ||
    undefined
  );
}

export function isGeneralBeaconPlan(
  plan: BeaconExecutionPlan
): boolean {
  return (
    plan.capability ===
    "general_answer"
  );
}

export function isShoppingBeaconPlan(
  plan: BeaconExecutionPlan
): boolean {
  return (
    plan.primaryIntent ===
      "shopping" ||
    plan.primaryIntent ===
      "automotive"
  );
}

export function isTravelBeaconPlan(
  plan: BeaconExecutionPlan
): boolean {
  return (
    plan.primaryIntent ===
      "travel"
  );
}

export function isEntertainmentBeaconPlan(
  plan: BeaconExecutionPlan
): boolean {
  return (
    plan.primaryIntent ===
      "entertainment"
  );
}

export function isLocalBeaconPlan(
  plan: BeaconExecutionPlan
): boolean {
  return (
    plan.primaryIntent ===
      "local"
  );
}
