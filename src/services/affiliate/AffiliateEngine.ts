import "server-only";

import {
  resolveAffiliateDestination,
  type AffiliateLinkResult,
} from "@/services/affiliate/awin/AwinLinkBuilder";

import type {
  Recommendation,
} from "@/lib/recommendations/RecommendationTypes";

export type AffiliateResolutionStatus =
  | "converted"
  | "not_joined"
  | "invalid_url"
  | "link_builder_unavailable"
  | "missing_url"
  | "failed";

export type AffiliateResolution = {
  recommendationId: string;
  status: AffiliateResolutionStatus;

  originalUrl: string;
  resolvedUrl: string;

  affiliate: boolean;
  network: "awin" | null;

  advertiserId: number | null;
  advertiserName: string | null;

  reason?: string;
};

export type AffiliateEnrichmentResult = {
  recommendations: Recommendation[];

  resolutions: AffiliateResolution[];

  summary: {
    total: number;
    converted: number;
    unchanged: number;
    failed: number;
  };
};

export type AffiliateEnrichmentOptions = {
  campaign?: string;

  clickReferencePrefix?: string;

  shortenLinks?: boolean;

  concurrency?: number;
};

const DEFAULT_CONCURRENCY = 4;
const MAXIMUM_CONCURRENCY = 8;

function clampConcurrency(
  value: number | undefined
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_CONCURRENCY;
  }

  return Math.max(
    1,
    Math.min(
      MAXIMUM_CONCURRENCY,
      Math.floor(value)
    )
  );
}

function cleanOptionalString(
  value: string | undefined
): string | undefined {
  const cleaned = value?.trim();

  return cleaned || undefined;
}

function createClickReference(
  recommendation: Recommendation,
  index: number,
  prefix?: string
): string {
  const cleanedPrefix =
    cleanOptionalString(prefix) ??
    "beacon";

  const cleanedId =
    recommendation.id
      .trim()
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "-"
      )
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

  return [
    cleanedPrefix,
    cleanedId || `result-${index + 1}`,
  ].join("-");
}

function mapFailureReason(
  result: AffiliateLinkResult
): AffiliateResolutionStatus {
  if (result.affiliate) {
    return "converted";
  }

  if (
    result.reason ===
    "invalid_destination"
  ) {
    return "invalid_url";
  }

  if (
    result.reason ===
    "merchant_not_joined"
  ) {
    return "not_joined";
  }

  return "link_builder_unavailable";
}

function createResolution(
  recommendation: Recommendation,
  result: AffiliateLinkResult
): AffiliateResolution {
  if (result.affiliate) {
    return {
      recommendationId:
        recommendation.id,

      status: "converted",

      originalUrl:
        result.originalUrl,

      resolvedUrl:
        result.trackedUrl,

      affiliate: true,
      network: "awin",

      advertiserId:
        result.advertiserId,

      advertiserName:
        result.advertiserName,
    };
  }

  return {
    recommendationId:
      recommendation.id,

    status:
      mapFailureReason(result),

    originalUrl:
      result.originalUrl,

    resolvedUrl:
      result.trackedUrl,

    affiliate: false,
    network: null,

    advertiserId: null,
    advertiserName: null,

    reason: result.reason,
  };
}

async function enrichRecommendation(
  recommendation: Recommendation,
  index: number,
  options: AffiliateEnrichmentOptions
): Promise<{
  recommendation: Recommendation;
  resolution: AffiliateResolution;
}> {
  const originalUrl =
    recommendation.url?.trim() ??
    "";

  if (!originalUrl) {
    return {
      recommendation,

      resolution: {
        recommendationId:
          recommendation.id,

        status: "missing_url",

        originalUrl: "",
        resolvedUrl: "",

        affiliate: false,
        network: null,

        advertiserId: null,
        advertiserName: null,

        reason:
          "The recommendation did not include a destination URL.",
      },
    };
  }

  try {
    const result =
      await resolveAffiliateDestination(
        originalUrl,
        {
          campaign:
            cleanOptionalString(
              options.campaign
            ),

          clickReference:
            createClickReference(
              recommendation,
              index,
              options.clickReferencePrefix
            ),

          shorten:
            options.shortenLinks ??
            false,
        }
      );

    const resolution =
      createResolution(
        recommendation,
        result
      );

    if (!result.affiliate) {
      return {
        recommendation,
        resolution,
      };
    }

    return {
      recommendation: {
        ...recommendation,
        url: result.trackedUrl,
      },

      resolution,
    };
  } catch (error) {
    return {
      recommendation,

      resolution: {
        recommendationId:
          recommendation.id,

        status: "failed",

        originalUrl,
        resolvedUrl:
          originalUrl,

        affiliate: false,
        network: null,

        advertiserId: null,
        advertiserName: null,

        reason:
          error instanceof Error
            ? error.message
            : "Beacon could not generate an affiliate link.",
      },
    };
  }
}

async function processInBatches(
  recommendations: Recommendation[],
  options: AffiliateEnrichmentOptions
): Promise<
  Array<{
    recommendation: Recommendation;
    resolution: AffiliateResolution;
  }>
> {
  const concurrency =
    clampConcurrency(
      options.concurrency
    );

  const results: Array<{
    recommendation: Recommendation;
    resolution: AffiliateResolution;
  }> = [];

  for (
    let startIndex = 0;
    startIndex <
    recommendations.length;
    startIndex += concurrency
  ) {
    const batch =
      recommendations.slice(
        startIndex,
        startIndex + concurrency
      );

    const batchResults =
      await Promise.all(
        batch.map(
          (
            recommendation,
            batchIndex
          ) =>
            enrichRecommendation(
              recommendation,
              startIndex +
                batchIndex,
              options
            )
        )
      );

    results.push(
      ...batchResults
    );
  }

  return results;
}

export async function applyAffiliateLinks(
  recommendations: Recommendation[],
  options: AffiliateEnrichmentOptions = {}
): Promise<AffiliateEnrichmentResult> {
  if (
    recommendations.length === 0
  ) {
    return {
      recommendations: [],
      resolutions: [],

      summary: {
        total: 0,
        converted: 0,
        unchanged: 0,
        failed: 0,
      },
    };
  }

  const processed =
    await processInBatches(
      recommendations,
      options
    );

  const enrichedRecommendations =
    processed.map(
      (item) =>
        item.recommendation
    );

  const resolutions =
    processed.map(
      (item) =>
        item.resolution
    );

  const converted =
    resolutions.filter(
      (item) =>
        item.status ===
        "converted"
    ).length;

  const failed =
    resolutions.filter(
      (item) =>
        item.status ===
        "failed"
    ).length;

  return {
    recommendations:
      enrichedRecommendations,

    resolutions,

    summary: {
      total:
        recommendations.length,

      converted,

      unchanged:
        recommendations.length -
        converted -
        failed,

      failed,
    },
  };
}

export async function resolveSingleAffiliateLink(
  destinationUrl: string,
  options: {
    campaign?: string;
    clickReference?: string;
    shorten?: boolean;
  } = {}
): Promise<AffiliateLinkResult> {
  return resolveAffiliateDestination(
    destinationUrl,
    {
      campaign:
        cleanOptionalString(
          options.campaign
        ),

      clickReference:
        cleanOptionalString(
          options.clickReference
        ),

      shorten:
        options.shorten ??
        false,
    }
  );
}