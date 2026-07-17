import "server-only";

import {
  executeAggregator,
} from "@/services/aggregator/Aggregator";

import {
  getAggregatorProvidersForVertical,
} from "@/services/aggregator/ProviderRegistry";

import {
  createRecommendationResponse,
} from "@/services/response/BeaconResponse";

import {
  handleGuidedDiscovery,
} from "@/services/orchestrator/BeaconGeneralHandler";

import {
  createMissingDestinationError,
  createProviderUnavailableError,
  isProviderUnavailableError,
} from "@/services/orchestrator/BeaconEngineErrors";

import type {
  AggregatorExecutionResult,
  AggregatorVertical,
} from "@/services/aggregator/AggregatorTypes";

import type {
  BeaconCapability,
} from "@/services/intelligence/IntentEngine";

import type {
  BeaconDataProvider,
  BeaconResponse,
  BeaconResponseSource,
} from "@/services/response/BeaconResponse";

import type {
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type AggregatorResponseConfiguration = {
  vertical: AggregatorVertical;

  source: Exclude<
    BeaconResponseSource,
    "general"
  >;

  dataProvider:
    BeaconDataProvider;

  affiliateCampaign:
    string;

  aiSummary: string;
};

type LocalDiscoveryCapability =
  | "travel_ideas"
  | "restaurants"
  | "activities"
  | "local_services"
  | "places"
  | "weekend_plan";

type EntertainmentCapability =
  | "tickets"
  | "events"
  | "experiences"
  | "sports_travel";

type CombinedTravelCapability =
  | "package_holiday"
  | "flight_and_hotel";

function getDestination(
  intent: SearchIntent
): string | undefined {
  return (
    intent.destination?.trim() ||
    intent.location?.trim() ||
    undefined
  );
}

function ensureDestination(
  intent: SearchIntent,
  question =
    "Which destination or area would you like Beacon to search?"
): string {
  const destination =
    getDestination(intent);

  if (!destination) {
    throw createMissingDestinationError(
      question
    );
  }

  return destination;
}

function createAggregatorSummary(
  baseSummary: string,
  result: AggregatorExecutionResult
): string {
  const failureCount =
    result.providerFailures.length;

  if (
    failureCount === 0 ||
    result.recommendations.length ===
      0
  ) {
    return baseSummary;
  }

  const unavailableMessage =
    failureCount === 1
      ? "One source was temporarily unavailable."
      : `${failureCount} sources were temporarily unavailable.`;

  return `${baseSummary} ${unavailableMessage}`;
}

function ensureAggregatorProducedResults(
  result: AggregatorExecutionResult,
  verticalLabel: string
): void {
  if (
    result.recommendations.length >
    0
  ) {
    return;
  }

  const providerMessage =
    result.providerFailures
      .map(
        (failure) =>
          failure.message
      )
      .find(Boolean);

  throw createProviderUnavailableError(
    providerMessage ??
      `Beacon could not find suitable ${verticalLabel} results for this request.`
  );
}

async function executeRecommendationAggregator(
  query: string,
  intent: SearchIntent,
  configuration:
    AggregatorResponseConfiguration
): Promise<BeaconResponse> {
  const providers =
    getAggregatorProvidersForVertical(
      configuration.vertical
    );

  if (
    providers.length === 0
  ) {
    throw createProviderUnavailableError(
      `Beacon does not currently have an available ${configuration.vertical} provider.`
    );
  }

  const result =
    await executeAggregator({
      query,

      intent,

      vertical:
        configuration.vertical,

      providers,

      affiliateCampaign:
        configuration.affiliateCampaign,

      options: {
        providerLimit: 30,
        finalLimit: 5,
        minimumScore: 35,
        minimumTrustScore: 25,
        timeoutMs: 15_000,
      },
    });

  ensureAggregatorProducedResults(
    result,
    configuration.vertical
  );

  return createRecommendationResponse({
    query,

    source:
      configuration.source,

    dataProvider:
      configuration.dataProvider,

    liveData: true,

    intent,

    summary:
      `${result.recommendations.length} strong options selected from live provider results.`,

    aiSummary:
      createAggregatorSummary(
        configuration.aiSummary,
        result
      ),

    recommendations:
      result.recommendations,
  });
}

function isAutomotiveCapability(
  capability: BeaconCapability
): boolean {
  return (
    capability ===
      "vehicle_parts" ||
    capability ===
      "vehicle_accessories" ||
    capability ===
      "vehicle_search"
  );
}

export async function handleShoppingRecommendation(
  query: string,
  intent: SearchIntent,
  capability: BeaconCapability
): Promise<BeaconResponse> {
  const automotive =
    isAutomotiveCapability(
      capability
    );

  const aiSummary =
    automotive
      ? [
          "Beacon searched live shopping and automotive sources.",
          "It checked the supplied vehicle information, removed conflicting or unsuitable listings and selected the strongest matches.",
          "Confirm final vehicle compatibility with the retailer before purchasing.",
        ].join(" ")
      : [
          "Beacon searched live shopping providers for concrete product listings.",
          "It removed weak or duplicate matches and compared relevance, value, quality and trust.",
        ].join(" ");

  return executeRecommendationAggregator(
    query,
    {
      ...intent,
      category: "product",
    },
    {
      vertical:
        "shopping",

      source:
        "shopping",

      dataProvider:
        "serpapi-google-shopping",

      affiliateCampaign:
        automotive
          ? "beacon-automotive"
          : "beacon-shopping",

      aiSummary,
    }
  );
}

export async function handleHotelDiscoveryRecommendation(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  ensureDestination(intent);

  try {
    return await executeRecommendationAggregator(
      query,
      {
        ...intent,
        category: "holiday",
      },
      {
        vertical:
          "travel",

        source:
          "hotel",

        dataProvider:
          "serpapi-google-maps",

        affiliateCampaign:
          "beacon-hotel-discovery",

        aiSummary:
          [
            "Beacon searched live accommodation discovery sources and selected real hotel listings.",
            "Results were compared using destination, suitability, ratings, reviews, amenities and location.",
          ].join(" "),
      }
    );
  } catch (error) {
    if (
      !isProviderUnavailableError(
        error
      )
    ) {
      throw error;
    }

    return handleGuidedDiscovery(
      query,
      "hotel_discovery",
      intent
    );
  }
}

export async function handleHotelAvailabilityRecommendation(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  ensureDestination(intent);

  return executeRecommendationAggregator(
    query,
    {
      ...intent,
      category: "holiday",
    },
    {
      vertical:
        "travel",

      source:
        "hotel",

      dataProvider:
        "serpapi-google-hotels",

      affiliateCampaign:
        "beacon-hotel-availability",

      aiSummary:
        [
          "Beacon searched live accommodation providers using the dates supplied.",
          "It compared availability, prices, ratings, reviews, amenities and location before selecting the strongest hotel listings.",
        ].join(" "),
    }
  );
}

export async function handleFlightRecommendation(
  query: string,
  intent: SearchIntent
): Promise<BeaconResponse> {
  ensureDestination(
    intent,
    "Where would you like to fly to?"
  );

  const providers =
    getAggregatorProvidersForVertical(
      "flights"
    );

  if (
    providers.length === 0
  ) {
    return handleGuidedDiscovery(
      query,
      "flights",
      intent
    );
  }

  try {
    return await executeRecommendationAggregator(
      query,
      {
        ...intent,
        category: "holiday",
      },
      {
        vertical:
          "flights",

        source:
          "flight",

        dataProvider:
          "serpapi-google-flights",

        affiliateCampaign:
          "beacon-flights",

        aiSummary:
          [
            "Beacon searched live flight providers.",
            "It compared routes using relevance, timings, value and source reliability before selecting the strongest options.",
          ].join(" "),
      }
    );
  } catch (error) {
    if (
      !isProviderUnavailableError(
        error
      )
    ) {
      throw error;
    }

    return handleGuidedDiscovery(
      query,
      "flights",
      intent
    );
  }
}

export async function handleCombinedTravelRecommendation(
  query: string,
  intent: SearchIntent,
  capability:
    CombinedTravelCapability
): Promise<BeaconResponse> {
  ensureDestination(intent);

  return handleGuidedDiscovery(
    query,
    capability,
    {
      ...intent,
      category: "holiday",
    }
  );
}

export async function handleEntertainmentRecommendation(
  query: string,
  intent: SearchIntent,
  capability:
    EntertainmentCapability
): Promise<BeaconResponse> {
  const providers =
    getAggregatorProvidersForVertical(
      "entertainment"
    );

  if (
    providers.length === 0
  ) {
    return handleGuidedDiscovery(
      query,
      capability,
      {
        ...intent,
        category: "experience",
      }
    );
  }

  try {
    return await executeRecommendationAggregator(
      query,
      {
        ...intent,
        category: "experience",
      },
      {
        vertical:
          "entertainment",

        source:
          "entertainment",

        dataProvider:
          "mixed",

        affiliateCampaign:
          "beacon-entertainment",

        aiSummary:
          [
            "Beacon searched live entertainment, event, ticket and experience sources.",
            "It compared relevance, suitability, value and source trust before selecting the strongest options.",
          ].join(" "),
      }
    );
  } catch (error) {
    if (
      !isProviderUnavailableError(
        error
      )
    ) {
      throw error;
    }

    return handleGuidedDiscovery(
      query,
      capability,
      {
        ...intent,
        category: "experience",
      }
    );
  }
}

export async function handleLocalDiscoveryRecommendation(
  query: string,
  capability:
    LocalDiscoveryCapability,
  intent?: SearchIntent
): Promise<BeaconResponse> {
  return handleGuidedDiscovery(
    query,
    capability,
    intent
  );
}