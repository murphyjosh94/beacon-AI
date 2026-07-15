import "server-only";

import type {
  AggregatorResult,
} from "@/services/aggregator/AggregatorTypes";

export type DeduplicationStatistics = {
  received: number;
  removed: number;
  remaining: number;
};

export type DeduplicationResult = {
  results: AggregatorResult[];
  statistics: DeduplicationStatistics;
};

function normaliseText(
  value: string | undefined
): string {
  return (
    value
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim() ?? ""
  );
}

function normaliseMerchant(
  merchant: string | undefined
): string {
  return normaliseText(merchant);
}

function normaliseTitle(
  title: string
): string {
  return normaliseText(title);
}

function normaliseLocation(
  location: string | undefined
): string {
  return normaliseText(location);
}

function buildFingerprint(
  result: AggregatorResult
): string {
  return [
    result.category,
    normaliseTitle(result.title),
    normaliseMerchant(result.merchant),
    normaliseLocation(result.location),
  ].join("|");
}

function scoreResult(
  result: AggregatorResult
): number {
  let score = 0;

  score += result.overallScore ?? 0;
  score += result.trustScore ?? 0;
  score += result.qualityScore ?? 0;

  if (result.destinationUrl) {
    score += 25;
  }

  if (result.imageUrl) {
    score += 10;
  }

  if (result.price) {
    score += 5;
  }

  if (result.rating) {
    score += result.rating * 2;
  }

  if (result.reviewCount) {
    score += Math.min(
      result.reviewCount / 100,
      20
    );
  }

  return score;
}

function mergeLists(
  first: string[],
  second: string[]
): string[] {
  return Array.from(
    new Set([
      ...first,
      ...second,
    ])
  );
}

function mergeAttributes(
  left: AggregatorResult["attributes"],
  right: AggregatorResult["attributes"]
) {
  return {
    ...left,
    ...right,
  };
}

function mergeResult(
  existing: AggregatorResult,
  incoming: AggregatorResult
): AggregatorResult {
  const existingScore =
    scoreResult(existing);

  const incomingScore =
    scoreResult(incoming);

  const winner =
    incomingScore >
    existingScore
      ? incoming
      : existing;

  const loser =
    winner === existing
      ? incoming
      : existing;

  return {
    ...winner,

    description:
      winner.description.length >=
      loser.description.length
        ? winner.description
        : loser.description,

    destinationUrl:
      winner.destinationUrl ||
      loser.destinationUrl,

    imageUrl:
      winner.imageUrl ||
      loser.imageUrl,

    merchant:
      winner.merchant ||
      loser.merchant,

    brand:
      winner.brand ||
      loser.brand,

    price:
      winner.price ||
      loser.price,

    previousPrice:
      winner.previousPrice ||
      loser.previousPrice,

    location:
      winner.location ||
      loser.location,

    rating:
      Math.max(
        winner.rating ?? 0,
        loser.rating ?? 0
      ) || undefined,

    reviewCount:
      Math.max(
        winner.reviewCount ?? 0,
        loser.reviewCount ?? 0
      ) || undefined,

    highlights:
      mergeLists(
        winner.highlights,
        loser.highlights
      ),

    warnings:
      mergeLists(
        winner.warnings,
        loser.warnings
      ),

    attributes:
      mergeAttributes(
        winner.attributes,
        loser.attributes
      ),

    relevanceScore:
      Math.max(
        winner.relevanceScore ?? 0,
        loser.relevanceScore ?? 0
      ),

    valueScore:
      Math.max(
        winner.valueScore ?? 0,
        loser.valueScore ?? 0
      ),

    qualityScore:
      Math.max(
        winner.qualityScore ?? 0,
        loser.qualityScore ?? 0
      ),

    trustScore:
      Math.max(
        winner.trustScore ?? 0,
        loser.trustScore ?? 0
      ),

    overallScore:
      Math.max(
        winner.overallScore ?? 0,
        loser.overallScore ?? 0
      ),
  };
}

export function deduplicateResults(
  results: AggregatorResult[]
): DeduplicationResult {
  const map =
    new Map<
      string,
      AggregatorResult
    >();

  let removed = 0;

  for (const result of results) {
    const fingerprint =
      buildFingerprint(
        result
      );

    const existing =
      map.get(
        fingerprint
      );

    if (!existing) {
      map.set(
        fingerprint,
        result
      );
      continue;
    }

    removed++;

    map.set(
      fingerprint,
      mergeResult(
        existing,
        result
      )
    );
  }

  const deduplicated =
    Array.from(
      map.values()
    );

  deduplicated.sort(
    (a, b) =>
      (b.overallScore ?? 0) -
      (a.overallScore ?? 0)
  );

  return {
    results:
      deduplicated,

    statistics: {
      received:
        results.length,

      removed,

      remaining:
        deduplicated.length,
    },
  };
}