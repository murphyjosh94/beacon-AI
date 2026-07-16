import "server-only";

import {
  assessBeaconConfidence,
  type BeaconConfidenceAssessment,
  type BeaconExecutionMode,
} from "@/services/intelligence/Confidence";

import {
  detectBeaconIntent,
  type BeaconAssumption,
  type BeaconCapability,
  type BeaconDetectedDetails,
  type BeaconIntentDecision,
  type BeaconPrimaryIntent,
} from "@/services/intelligence/IntentEngine";

export type BeaconPlanVertical =
  | "shopping"
  | "travel"
  | "flights"
  | "entertainment"
  | "services"
  | "general";

export type BeaconPlanProvider =
  | "shopping_search"
  | "automotive_search"
  | "hotel_discovery"
  | "hotel_availability"
  | "flight_search"
  | "package_holiday_search"
  | "local_discovery"
  | "entertainment_search"
  | "general_ai";

export type BeaconPlanStepType =
  | "interpret"
  | "apply_assumptions"
  | "search"
  | "filter"
  | "rank"
  | "answer"
  | "clarify";

export type BeaconPlanStep = {
  id: string;

  type: BeaconPlanStepType;

  title: string;

  description: string;

  required: boolean;

  provider?: BeaconPlanProvider;

  metadata?: Record<
    string,
    string | number | boolean | null
  >;
};

export type BeaconPlannerSearchStrategy = {
  vertical: BeaconPlanVertical;

  providers: BeaconPlanProvider[];

  resultLimit: number;

  requireLiveData: boolean;

  allowGeneralFallback: boolean;

  prioritisePartnerResults: boolean;

  requireExactDates: boolean;

  requireDestination: boolean;

  requireDepartureLocation: boolean;

  requireVehicleDetails: boolean;
};

export type BeaconExecutionPlan = {
  query: string;

  intent: BeaconIntentDecision;

  confidence: BeaconConfidenceAssessment;

  executionMode: BeaconExecutionMode;

  canExecute: boolean;

  primaryIntent: BeaconPrimaryIntent;

  capability: BeaconCapability;

  vertical: BeaconPlanVertical;

  assumptions: BeaconAssumption[];

  followUpQuestion?: string;

  searchStrategy: BeaconPlannerSearchStrategy;

  steps: BeaconPlanStep[];

  userSummary: string;
};

export type CreateBeaconPlanInput = {
  query: string;

  forcedIntent?: BeaconPrimaryIntent;

  forcedCapability?: BeaconCapability;

  resultLimit?: number;
};

const DEFAULT_RESULT_LIMIT = 5;
const MAXIMUM_RESULT_LIMIT = 10;

function clampResultLimit(
  value: number | undefined
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_RESULT_LIMIT;
  }

  return Math.max(
    1,
    Math.min(
      MAXIMUM_RESULT_LIMIT,
      Math.floor(value)
    )
  );
}

function cleanQuery(
  value: string
): string {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function createStepId(
  index: number,
  type: BeaconPlanStepType
): string {
  return [
    String(index + 1).padStart(
      2,
      "0"
    ),
    type,
  ].join("-");
}

function mapIntentToVertical(
  primaryIntent: BeaconPrimaryIntent,
  capability: BeaconCapability
): BeaconPlanVertical {
  if (
    capability === "flights" ||
    capability === "flight_and_hotel"
  ) {
    return "flights";
  }

  if (
    primaryIntent === "travel"
  ) {
    return "travel";
  }

  if (
    primaryIntent === "shopping" ||
    primaryIntent === "automotive"
  ) {
    return "shopping";
  }

  if (
    primaryIntent === "entertainment"
  ) {
    return "entertainment";
  }

  if (
    primaryIntent === "local"
  ) {
    return "services";
  }

  return "general";
}

function getProvidersForCapability(
  capability: BeaconCapability
): BeaconPlanProvider[] {
  switch (capability) {
    case "product_search":
    case "vehicle_accessories":
    case "vehicle_search":
      return [
        "shopping_search",
      ];

    case "vehicle_parts":
      return [
        "automotive_search",
        "shopping_search",
      ];

    case "hotel_discovery":
      return [
        "hotel_discovery",
      ];

    case "hotel_availability":
      return [
        "hotel_availability",
      ];

    case "flights":
      return [
        "flight_search",
      ];

    case "flight_and_hotel":
      return [
        "flight_search",
        "hotel_discovery",
      ];

    case "package_holiday":
      return [
        "package_holiday_search",
        "flight_search",
        "hotel_discovery",
      ];

    case "travel_ideas":
    case "weekend_plan":
      return [
        "local_discovery",
        "hotel_discovery",
        "entertainment_search",
      ];

    case "restaurants":
    case "activities":
    case "local_services":
    case "places":
      return [
        "local_discovery",
      ];

    case "tickets":
    case "events":
    case "experiences":
    case "sports_travel":
      return [
        "entertainment_search",
      ];

    case "general_answer":
      return [
        "general_ai",
      ];

    default:
      return [
        "general_ai",
      ];
  }
}

function capabilityRequiresLiveData(
  capability: BeaconCapability
): boolean {
  return capability !==
    "general_answer";
}

function capabilityAllowsGeneralFallback(
  capability: BeaconCapability
): boolean {
  return (
    capability === "travel_ideas" ||
    capability === "weekend_plan" ||
    capability === "activities" ||
    capability === "places" ||
    capability === "experiences" ||
    capability === "general_answer"
  );
}

function capabilityRequiresDestination(
  capability: BeaconCapability
): boolean {
  return (
    capability === "hotel_discovery" ||
    capability === "hotel_availability" ||
    capability === "flights" ||
    capability === "flight_and_hotel" ||
    capability === "package_holiday"
  );
}

function capabilityRequiresDepartureLocation(
  capability: BeaconCapability
): boolean {
  /*
   * Departure is helpful but not a hard requirement at
   * planning time. Beacon may search common UK airports
   * when the user has not supplied one.
   */
  return false;
}

function capabilityRequiresVehicleDetails(
  capability: BeaconCapability
): boolean {
  return capability ===
    "vehicle_parts";
}

function createSearchStrategy(
  intent: BeaconIntentDecision,
  resultLimit: number
): BeaconPlannerSearchStrategy {
  return {
    vertical:
      mapIntentToVertical(
        intent.primaryIntent,
        intent.capability
      ),

    providers:
      getProvidersForCapability(
        intent.capability
      ),

    resultLimit,

    requireLiveData:
      capabilityRequiresLiveData(
        intent.capability
      ),

    allowGeneralFallback:
      capabilityAllowsGeneralFallback(
        intent.capability
      ),

    prioritisePartnerResults:
      intent.capability !==
      "general_answer",

    /*
     * Dates remain optional for discovery.
     * Exact dates are only relevant to availability
     * and price-specific searches.
     */
    requireExactDates:
      intent.capability ===
        "hotel_availability" &&
      intent.detected
        .exactDatesProvided,

    requireDestination:
      capabilityRequiresDestination(
        intent.capability
      ),

    requireDepartureLocation:
      capabilityRequiresDepartureLocation(
        intent.capability
      ),

    requireVehicleDetails:
      capabilityRequiresVehicleDetails(
        intent.capability
      ),
  };
}

function createInterpretStep(
  intent: BeaconIntentDecision
): BeaconPlanStep {
  return {
    id: "",

    type: "interpret",

    title:
      "Understand the request",

    description:
      `Beacon identified this as ${intent.primaryIntent} and selected the ${intent.capability} capability.`,

    required: true,

    metadata: {
      primaryIntent:
        intent.primaryIntent,

      secondaryIntent:
        intent.secondaryIntent ??
        null,

      capability:
        intent.capability,

      confidence:
        intent.confidence,
    },
  };
}

function createAssumptionStep(
  assumptions: BeaconAssumption[]
): BeaconPlanStep | null {
  if (
    assumptions.length === 0
  ) {
    return null;
  }

  return {
    id: "",

    type:
      "apply_assumptions",

    title:
      "Apply sensible defaults",

    description:
      assumptions
        .map(
          (assumption) =>
            `${assumption.key}: ${assumption.value}`
        )
        .join(" • "),

    required: false,

    metadata: {
      assumptionCount:
        assumptions.length,
    },
  };
}

function getSearchTitle(
  capability: BeaconCapability
): string {
  switch (capability) {
    case "product_search":
      return "Search relevant products";

    case "vehicle_parts":
      return "Search compatible vehicle parts";

    case "vehicle_accessories":
      return "Search vehicle accessories";

    case "vehicle_search":
      return "Search suitable vehicles";

    case "hotel_discovery":
      return "Discover suitable hotels and areas";

    case "hotel_availability":
      return "Check hotel availability";

    case "package_holiday":
      return "Search package holidays";

    case "flights":
      return "Search flight options";

    case "flight_and_hotel":
      return "Search flights and hotels";

    case "travel_ideas":
      return "Research suitable trip ideas";

    case "restaurants":
      return "Search suitable places to eat";

    case "activities":
      return "Search activities and attractions";

    case "local_services":
      return "Search local service providers";

    case "places":
      return "Search relevant local places";

    case "weekend_plan":
      return "Build a balanced weekend plan";

    case "tickets":
      return "Search ticket options";

    case "events":
      return "Search current events";

    case "experiences":
      return "Search suitable experiences";

    case "sports_travel":
      return "Search sports tickets and travel";

    case "general_answer":
      return "Prepare a clear answer";

    default:
      return "Research the request";
  }
}

function createSearchSteps(
  capability: BeaconCapability,
  providers: BeaconPlanProvider[]
): BeaconPlanStep[] {
  if (
    capability ===
    "general_answer"
  ) {
    return [
      {
        id: "",

        type: "answer",

        title:
          getSearchTitle(
            capability
          ),

        description:
          "Use Beacon AI to answer the question clearly and use current web research when the subject requires live information.",

        required: true,

        provider:
          "general_ai",
      },
    ];
  }

  return providers.map(
    (
      provider,
      index
    ) => ({
      id: "",

      type: "search",

      title:
        index === 0
          ? getSearchTitle(
              capability
            )
          : `Search additional ${provider.replace(
              /_/g,
              " "
            )} sources`,

      description:
        getProviderDescription(
          provider,
          capability
        ),

      required:
        index === 0,

      provider,

      metadata: {
        providerOrder:
          index + 1,
      },
    })
  );
}

function getProviderDescription(
  provider: BeaconPlanProvider,
  capability: BeaconCapability
): string {
  switch (provider) {
    case "shopping_search":
      return "Search live shopping and merchant sources for concrete product listings.";

    case "automotive_search":
      return "Search automotive sources and reject products with conflicting vehicle or engine fitment.";

    case "hotel_discovery":
      return capability ===
        "hotel_availability"
        ? "Search hotel listings using the supplied destination and dates."
        : "Search hotel listings using the destination, preferred location and stay requirements without forcing exact dates.";

    case "hotel_availability":
      return "Check date-specific hotel prices and availability.";

    case "flight_search":
      return "Search available flight routes and fare options using supplied details and reasonable UK departure assumptions where needed.";

    case "package_holiday_search":
      return "Search package holiday options that combine suitable accommodation and transport.";

    case "local_discovery":
      return "Research useful local places, activities and services relevant to the request.";

    case "entertainment_search":
      return "Search current events, tickets, attractions and experiences.";

    case "general_ai":
      return "Prepare a direct and useful answer without unnecessary clarification.";

    default:
      return "Search relevant live sources.";
  }
}

function createFilterStep(
  intent: BeaconIntentDecision
): BeaconPlanStep | null {
  if (
    intent.capability ===
    "general_answer"
  ) {
    return null;
  }

  if (
    intent.capability ===
    "vehicle_parts"
  ) {
    return {
      id: "",

      type: "filter",

      title:
        "Verify vehicle compatibility",

      description:
        "Reject listings that conflict with the requested model, engine or part type before ranking.",

      required: true,

      metadata: {
        strictCompatibility:
          true,
      },
    };
  }

  if (
    intent.primaryIntent ===
      "shopping" ||
    intent.primaryIntent ===
      "automotive"
  ) {
    return {
      id: "",

      type: "filter",

      title:
        "Remove unsuitable products",

      description:
        "Remove weak matches, duplicate listings and products outside explicit requirements.",

      required: true,
    };
  }

  if (
    intent.primaryIntent ===
      "travel" ||
    intent.primaryIntent ===
      "local" ||
    intent.primaryIntent ===
      "entertainment"
  ) {
    return {
      id: "",

      type: "filter",

      title:
        "Remove unsuitable options",

      description:
        "Remove duplicate, irrelevant or poorly supported results while preserving useful options across sensible price levels.",

      required: true,
    };
  }

  return null;
}

function createRankStep(
  resultLimit: number
): BeaconPlanStep {
  return {
    id: "",

    type: "rank",

    title:
      "Rank the strongest matches",

    description:
      `Compare relevance, value, quality and trust, then return up to ${resultLimit} useful results.`,

    required: true,

    metadata: {
      resultLimit,
    },
  };
}

function createClarificationStep(
  question: string
): BeaconPlanStep {
  return {
    id: "",

    type: "clarify",

    title:
      "Ask one essential question",

    description:
      question,

    required: true,
  };
}

function assignStepIds(
  steps: BeaconPlanStep[]
): BeaconPlanStep[] {
  return steps.map(
    (
      step,
      index
    ) => ({
      ...step,

      id:
        createStepId(
          index,
          step.type
        ),
    })
  );
}

function createPlanSteps(
  intent: BeaconIntentDecision,
  confidence: BeaconConfidenceAssessment,
  strategy: BeaconPlannerSearchStrategy
): BeaconPlanStep[] {
  const steps:
    BeaconPlanStep[] = [
      createInterpretStep(
        intent
      ),
    ];

  if (
    confidence.executionMode ===
      "ask_one_question" &&
    confidence.followUpQuestion
  ) {
    steps.push(
      createClarificationStep(
        confidence.followUpQuestion
      )
    );

    return assignStepIds(
      steps
    );
  }

  const assumptionStep =
    createAssumptionStep(
      intent.assumptions
    );

  if (assumptionStep) {
    steps.push(
      assumptionStep
    );
  }

  steps.push(
    ...createSearchSteps(
      intent.capability,
      strategy.providers
    )
  );

  const filterStep =
    createFilterStep(
      intent
    );

  if (filterStep) {
    steps.push(
      filterStep
    );
  }

  if (
    intent.capability !==
    "general_answer"
  ) {
    steps.push(
      createRankStep(
        strategy.resultLimit
      )
    );
  }

  return assignStepIds(
    steps
  );
}

function createUserSummary(
  intent: BeaconIntentDecision,
  confidence: BeaconConfidenceAssessment
): string {
  if (
    confidence.executionMode ===
      "ask_one_question"
  ) {
    return (
      confidence.followUpQuestion ??
      "Beacon needs one essential detail before continuing."
    );
  }

  switch (
    intent.capability
  ) {
    case "weekend_plan":
      return "Beacon will build a useful weekend plan using sensible assumptions and can refine it later for budget, family, couples or nightlife.";

    case "hotel_discovery":
      return "Beacon will find suitable hotel and area options now. Exact dates remain optional until you want live availability and date-specific prices.";

    case "hotel_availability":
      return "Beacon will search date-specific hotel availability and compare the strongest options.";

    case "flights":
      return "Beacon will search suitable flight options and use broad UK departure assumptions when an airport has not been specified.";

    case "flight_and_hotel":
      return "Beacon will compare both flight and hotel options rather than forcing the user into separate searches.";

    case "package_holiday":
      return "Beacon will search package holiday options, including flights and accommodation where supported.";

    case "vehicle_parts":
      return "Beacon will search for the requested part and reject conflicting vehicle or engine listings before showing results.";

    case "product_search":
      return "Beacon will search live product listings now and use sensible defaults for any optional details that were not supplied.";

    case "general_answer":
      return "Beacon will answer the question directly and use current research where needed.";

    default:
      return "Beacon will proceed now, return useful results first and allow optional refinement afterwards.";
  }
}

function overrideIntentDecision(
  decision: BeaconIntentDecision,
  input: CreateBeaconPlanInput
): BeaconIntentDecision {
  const primaryIntent =
    input.forcedIntent ??
    decision.primaryIntent;

  const capability =
    input.forcedCapability ??
    decision.capability;

  if (
    primaryIntent ===
      decision.primaryIntent &&
    capability ===
      decision.capability
  ) {
    return decision;
  }

  return {
    ...decision,

    primaryIntent,
    capability,

    shouldSearchImmediately:
      true,

    shouldAskFollowUp:
      false,

    followUpQuestion:
      undefined,
  };
}

export function createBeaconPlan(
  input: CreateBeaconPlanInput
): BeaconExecutionPlan {
  const query =
    cleanQuery(
      input.query
    );

  const detectedIntent =
    detectBeaconIntent(
      query
    );

  const intent =
    overrideIntentDecision(
      detectedIntent,
      input
    );

  const confidence =
    assessBeaconConfidence(
      intent
    );

  const resultLimit =
    clampResultLimit(
      input.resultLimit
    );

  const searchStrategy =
    createSearchStrategy(
      intent,
      resultLimit
    );

  const steps =
    createPlanSteps(
      intent,
      confidence,
      searchStrategy
    );

  return {
    query,

    intent,

    confidence,

    executionMode:
      confidence.executionMode,

    canExecute:
      confidence.canProceed,

    primaryIntent:
      intent.primaryIntent,

    capability:
      intent.capability,

    vertical:
      searchStrategy.vertical,

    assumptions: [
      ...intent.assumptions,
    ],

    followUpQuestion:
      confidence.followUpQuestion,

    searchStrategy,

    steps,

    userSummary:
      createUserSummary(
        intent,
        confidence
      ),
  };
}

export function createBeaconPlanFromQuery(
  query: string
): BeaconExecutionPlan {
  return createBeaconPlan({
    query,
  });
}

export function canExecuteBeaconPlan(
  plan: BeaconExecutionPlan
): boolean {
  return plan.canExecute;
}

export function getBeaconPlanFollowUp(
  plan: BeaconExecutionPlan
): string | undefined {
  return plan.followUpQuestion;
}

export function getBeaconPlanProviders(
  plan: BeaconExecutionPlan
): BeaconPlanProvider[] {
  return [
    ...plan.searchStrategy.providers,
  ];
}

export function getBeaconPlanDetectedDetails(
  plan: BeaconExecutionPlan
): BeaconDetectedDetails {
  return {
    ...plan.intent.detected,
  };
}