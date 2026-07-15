import "server-only";

import {
  executeProviders,
  selectProvidersForVertical,
  separateProviderOutcomes,
} from "@/services/aggregator/Provider";

import {
  normaliseProviderResults,
} from "@/services/aggregator/Normaliser";

import {
  deduplicateResults,
} from "@/services/aggregator/Deduplicator";

import {
  applyAffiliateLinks,
} from "@/services/affiliate/AffiliateEngine";

import {
  calculateRecommendationScore,
} from "@/lib/recommendations/RecommendationScore";

import type {
  AggregatorExecutionOptions,
  AggregatorExecutionResult,
  AggregatorProvider,
  AggregatorResult,
  AggregatorVertical,
} from "@/services/aggregator/AggregatorTypes";

import type {
  Recommendation,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

export type ExecuteAggregatorInput = {
  query: string;
  intent: SearchIntent;
  vertical: AggregatorVertical;

  providers: AggregatorProvider[];

  options?: AggregatorExecutionOptions;

  affiliateCampaign?: string;
};

const DEFAULT_PROVIDER_RESULT_LIMIT = 30;
const DEFAULT_FINAL_RESULT_LIMIT = 5;
const DEFAULT_MINIMUM_SCORE = 35;
const DEFAULT_MINIMUM_TRUST_SCORE = 25;
const DEFAULT_TIMEOUT_MS = 15_000;

function clampInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      Math.floor(value)
    )
  );
}

function clampScore(
  value: number | undefined,
  fallback: number
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(100, value)
  );
}

function calculateFallbackRelevance(
  result: AggregatorResult,
  intent: SearchIntent
): number {
  const searchableText = [
    result.title,
    result.description,
    result.merchant,
    result.brand,
    result.location,
    ...result.highlights,
    ...Object.values(
      result.attributes
    ).map((value) =>
      value === null
        ? ""
        : String(value)
    ),
  ]
    .join(" ")
    .toLowerCase();

  const keywords = intent.keywords
    .map((keyword) =>
      keyword
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);

  if (keywords.length === 0) {
    return 70;
  }

  const matches = keywords.filter(
    (keyword) =>
      searchableText.includes(
        keyword
      )
  ).length;

  return clampScore(
    45 +
      (matches /
        keywords.length) *
        55,
    65
  );
}

function calculateFallbackValue(
  result: AggregatorResult,
  intent: SearchIntent
): number {
  const price =
    result.price?.amount;

  if (
    typeof price !== "number" ||
    !Number.isFinite(price)
  ) {
    return 58;
  }

  const minimum =
    intent.budgetMin;

  const maximum =
    intent.budgetMax;

  if (
    minimum !== undefined &&
    price < minimum
  ) {
    return 45;
  }

  if (
    maximum !== undefined &&
    maximum > 0
  ) {
    if (price > maximum) {
      return 0;
    }

    const ratio =
      price / maximum;

    if (ratio <= 0.5) {
      return 95;
    }

    if (ratio <= 0.7) {
      return 87;
    }

    if (ratio <= 0.85) {
      return 78;
    }

    return 68;
  }

  if (
    result.previousPrice &&
    result.previousPrice.amount >
      price
  ) {
    return 82;
  }

  return 68;
}

function calculateFallbackQuality(
  result: AggregatorResult
): number {
  const rating =
    result.rating;

  const reviews =
    result.reviewCount ?? 0;

  let score = 55;

  if (
    typeof rating === "number" &&
    Number.isFinite(rating)
  ) {
    score =
      (Math.max(
        0,
        Math.min(5, rating)
      ) /
        5) *
      82;
  }

  if (reviews >= 1000) {
    score += 14;
  } else if (reviews >= 250) {
    score += 10;
  } else if (reviews >= 50) {
    score += 6;
  } else if (reviews > 0) {
    score += 3;
  }

  return clampScore(
    score,
    55
  );
}

function calculateFallbackTrust(
  result: AggregatorResult
): number {
  let score = 42;

  if (
    result.source ===
      "merchant_feed" ||
    result.source ===
      "merchant_api"
  ) {
    score += 25;
  } else if (
    result.source ===
    "affiliate"
  ) {
    score += 20;
  } else if (
    result.source ===
    "search_api"
  ) {
    score += 12;
  } else {
    score += 6;
  }

  if (result.destinationUrl) {
    score += 10;
  }

  if (result.merchant) {
    score += 8;
  }

  if (result.imageUrl) {
    score += 5;
  }

  if (
    typeof result.rating ===
    "number"
  ) {
    score += 5;
  }

  if (
    typeof result.reviewCount ===
      "number" &&
    result.reviewCount > 0
  ) {
    score += 5;
  }

  return clampScore(
    score,
    50
  );
}

function scoreAggregatorResult(
  result: AggregatorResult,
  intent: SearchIntent
): AggregatorResult {
  const relevanceScore =
    clampScore(
      result.relevanceScore,
      calculateFallbackRelevance(
        result,
        intent
      )
    );

  const valueScore =
    clampScore(
      result.valueScore,
      calculateFallbackValue(
        result,
        intent
      )
    );

  const qualityScore =
    clampScore(
      result.qualityScore,
      calculateFallbackQuality(
        result
      )
    );

  const trustScore =
    clampScore(
      result.trustScore,
      calculateFallbackTrust(
        result
      )
    );

  const overallScore =
    clampScore(
      result.overallScore,
      calculateRecommendationScore({
        relevance:
          relevanceScore,

        value:
          valueScore,

        quality:
          qualityScore,

        trust:
          trustScore,
      }).overall
    );

  return {
    ...result,

    relevanceScore,
    valueScore,
    qualityScore,
    trustScore,
    overallScore,
  };
}

function resultMatchesBudget(
  result: AggregatorResult,
  intent: SearchIntent
): boolean {
  const amount =
    result.price?.amount;

  if (
    typeof amount !== "number"
  ) {
    return true;
  }

  if (
    intent.budgetMin !== undefined &&
    amount < intent.budgetMin
  ) {
    return false;
  }

  if (
    intent.budgetMax !== undefined &&
    amount > intent.budgetMax
  ) {
    return false;
  }

  return true;
}

function selectRankedResults(
  results: AggregatorResult[],
  intent: SearchIntent,
  options: AggregatorExecutionOptions
): AggregatorResult[] {
  const finalLimit =
    clampInteger(
      options.finalLimit,
      DEFAULT_FINAL_RESULT_LIMIT,
      1,
      20
    );

  const minimumScore =
    clampScore(
      options.minimumScore,
      DEFAULT_MINIMUM_SCORE
    );

  const minimumTrustScore =
    clampScore(
      options.minimumTrustScore,
      DEFAULT_MINIMUM_TRUST_SCORE
    );

  return results
    .map((result) =>
      scoreAggregatorResult(
        result,
        intent
      )
    )
    .filter((result) =>
      resultMatchesBudget(
        result,
        intent
      )
    )
    .filter(
      (result) =>
        (
          result.overallScore ??
          0
        ) >= minimumScore
    )
    .filter(
      (result) =>
        (
          result.trustScore ??
          0
        ) >=
        minimumTrustScore
    )
    .sort(
      (left, right) => {
        const overallDifference =
          (right.overallScore ??
            0) -
          (left.overallScore ??
            0);

        if (
          overallDifference !== 0
        ) {
          return overallDifference;
        }

        const trustDifference =
          (right.trustScore ??
            0) -
          (left.trustScore ??
            0);

        if (
          trustDifference !== 0
        ) {
          return trustDifference;
        }

        return (
          (right.qualityScore ??
            0) -
          (left.qualityScore ??
            0)
        );
      }
    )
    .slice(0, finalLimit);
}

function mapRecommendationSource(
  result: AggregatorResult
): Recommendation["source"] {
  if (
    result.source ===
      "merchant_feed" ||
    result.source ===
      "merchant_api"
  ) {
    return "merchant";
  }

  if (
    result.source ===
    "affiliate"
  ) {
    return "affiliate";
  }

  if (
    result.vertical ===
      "travel" ||
    result.vertical ===
      "flights"
  ) {
    return "travel";
  }

  return "search";
}

function createSelectionReason(
  result: AggregatorResult
): string {
  const reasons: string[] =
    [];

  if (
    result.relevanceScore !==
      undefined &&
    result.relevanceScore >= 75
  ) {
    reasons.push(
      "it closely matches your request"
    );
  }

  if (
    result.valueScore !==
      undefined &&
    result.valueScore >= 75
  ) {
    reasons.push(
      "it offers strong value"
    );
  }

  if (
    result.qualityScore !==
      undefined &&
    result.qualityScore >= 75
  ) {
    reasons.push(
      "it has strong quality signals"
    );
  }

  if (
    result.trustScore !==
      undefined &&
    result.trustScore >= 75
  ) {
    reasons.push(
      "it comes from a well-supported source"
    );
  }

  if (
    reasons.length === 0
  ) {
    return (
      "Beacon selected this option after comparing its relevance, " +
      "value, quality and source reliability with the other results."
    );
  }

  const finalReason =
    reasons.length === 1
      ? reasons[0]
      : `${reasons
          .slice(0, -1)
          .join(", ")} and ${
          reasons[
            reasons.length - 1
          ]
        }`;

  return `Beacon selected this option because ${finalReason}.`;
}

function mapAggregatorResultToRecommendation(
  result: AggregatorResult
): Recommendation {
  return {
    id: result.id,

    category:
      result.category,

    source:
      mapRecommendationSource(
        result
      ),

    title:
      result.title,

    description:
      result.description,

    reason:
      createSelectionReason(
        result
      ),

    url:
      result.destinationUrl,

    imageUrl:
      result.imageUrl,

    merchant:
      result.merchant,

    price:
      result.price,

    score: {
      overall:
        result.overallScore ??
        0,

      relevance:
        result.relevanceScore ??
        0,

      value:
        result.valueScore ??
        0,

      quality:
        result.qualityScore ??
        0,

      trust:
        result.trustScore ??
        0,
    },

    highlights:
      result.highlights.slice(
        0,
        6
      ),

    warnings:
      result.warnings.slice(
        0,
        4
      ),

    metadata: {
      providerId:
        result.providerId,

      aggregatorSource:
        result.source,

      vertical:
        result.vertical,

      brand:
        result.brand ?? null,

      rating:
        result.rating ?? null,

      reviewCount:
        result.reviewCount ??
        null,

      location:
        result.location ?? null,

      sponsored:
        result.sponsored,

      previousPrice:
        result.previousPrice ??
        null,

      attributes:
        result.attributes,
    },
  };
}

async function applyAffiliateEnrichment(
  recommendations: Recommendation[],
  input: ExecuteAggregatorInput
): Promise<Recommendation[]> {
  const affiliateResult =
    await applyAffiliateLinks(
      recommendations,
      {
        campaign:
          input.affiliateCampaign ??
          `beacon-${input.vertical}`,

        clickReferencePrefix:
          `beacon-${input.vertical}`,

        shortenLinks: false,

        concurrency: 4,
      }
    );

  return affiliateResult.recommendations;
}

export async function executeAggregator(
  input: ExecuteAggregatorInput
): Promise<AggregatorExecutionResult> {
  const query =
    input.query.trim();

  if (!query) {
    throw new Error(
      "The aggregator requires a search query."
    );
  }

  const options =
    input.options ?? {};

  const providerLimit =
    clampInteger(
      options.providerLimit,
      DEFAULT_PROVIDER_RESULT_LIMIT,
      1,
      100
    );

  const timeoutMs =
    clampInteger(
      options.timeoutMs,
      DEFAULT_TIMEOUT_MS,
      1_000,
      60_000
    );

  const selectedProviders =
    selectProvidersForVertical(
      input.providers,
      input.vertical
    );

  const outcomes =
    await executeProviders(
      selectedProviders,
      {
        query,
        intent:
          input.intent,
        vertical:
          input.vertical,
        limit:
          providerLimit,
        signal:
          options.signal,
      },
      {
        timeoutMs,
        signal:
          options.signal,
      }
    );

  const {
    successful,
    failures,
  } =
    separateProviderOutcomes(
      outcomes
    );

  const normalisation =
    normaliseProviderResults(
      successful
    );

  const deduplication =
    deduplicateResults(
      normalisation.results
    );

  const selectedResults =
    selectRankedResults(
      deduplication.results,
      input.intent,
      options
    );

  const recommendations =
    selectedResults.map(
      mapAggregatorResultToRecommendation
    );

  const enrichedRecommendations =
    await applyAffiliateEnrichment(
      recommendations,
      input
    );

  return {
    vertical:
      input.vertical,

    query,

    intent:
      input.intent,

    recommendations:
      enrichedRecommendations,

    providerResults:
      successful,

    providerFailures:
      failures,

    statistics: {
      providersRequested:
        selectedProviders.length,

      providersCompleted:
        successful.length,

      providersFailed:
        failures.length,

      rawResults:
        successful.reduce(
          (
            total,
            providerResult
          ) =>
            total +
            providerResult.results
              .length,
          0
        ),

      normalisedResults:
        normalisation.statistics
          .accepted,

      deduplicatedResults:
        deduplication.statistics
          .remaining,

      selectedResults:
        enrichedRecommendations
          .length,
    },
  };
}