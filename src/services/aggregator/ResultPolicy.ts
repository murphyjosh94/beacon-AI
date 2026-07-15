import "server-only";

import type {
  AggregatorResult,
  AggregatorVertical,
} from "@/services/aggregator/AggregatorTypes";

export type ResultPolicyOptions = {
  finalLimit: number;

  maximumPartnerCards?: number;

  minimumConcreteResults?: number;
};

export type ResultPolicyResult = {
  results: AggregatorResult[];

  statistics: {
    received: number;
    concreteResults: number;
    partnerCards: number;
    selected: number;
  };
};

const DEFAULT_MAXIMUM_PARTNER_CARDS = 1;
const DEFAULT_MINIMUM_CONCRETE_RESULTS = 3;

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

function readAttributeString(
  result: AggregatorResult,
  key: string
): string | undefined {
  const value =
    result.attributes[key];

  return typeof value === "string"
    ? value.trim() || undefined
    : undefined;
}

function isAwinPartnerCard(
  result: AggregatorResult
): boolean {
  return (
    result.providerId ===
      "awin-partners" ||
    result.source ===
      "affiliate" ||
    readAttributeString(
      result,
      "network"
    ) === "awin"
  );
}

function hasConcreteProductData(
  result: AggregatorResult
): boolean {
  return Boolean(
    result.price ||
      result.imageUrl ||
      result.rating !== undefined ||
      result.reviewCount !== undefined
  );
}

function hasConcreteTravelData(
  result: AggregatorResult
): boolean {
  const searchMode =
    readAttributeString(
      result,
      "searchMode"
    );

  return Boolean(
    result.location ||
      result.imageUrl ||
      result.rating !== undefined ||
      result.reviewCount !== undefined ||
      result.price ||
      searchMode ===
        "discovery" ||
      searchMode ===
        "availability"
  );
}

function isConcreteResult(
  result: AggregatorResult,
  vertical: AggregatorVertical
): boolean {
  if (isAwinPartnerCard(result)) {
    return false;
  }

  if (vertical === "shopping") {
    return hasConcreteProductData(
      result
    );
  }

  if (
    vertical === "travel" ||
    vertical === "flights"
  ) {
    return hasConcreteTravelData(
      result
    );
  }

  return Boolean(
    result.destinationUrl &&
      (
        result.imageUrl ||
        result.rating !== undefined ||
        result.price
      )
  );
}

function getOverallScore(
  result: AggregatorResult
): number {
  return (
    result.overallScore ??
    result.relevanceScore ??
    0
  );
}

function sortByScore(
  results: AggregatorResult[]
): AggregatorResult[] {
  return [...results].sort(
    (left, right) => {
      const overallDifference =
        getOverallScore(right) -
        getOverallScore(left);

      if (
        overallDifference !== 0
      ) {
        return overallDifference;
      }

      const relevanceDifference =
        (
          right.relevanceScore ??
          0
        ) -
        (
          left.relevanceScore ??
          0
        );

      if (
        relevanceDifference !== 0
      ) {
        return relevanceDifference;
      }

      return (
        (
          right.trustScore ??
          0
        ) -
        (
          left.trustScore ??
          0
        )
      );
    }
  );
}

function selectBestPartnerCards(
  partnerCards: AggregatorResult[],
  limit: number
): AggregatorResult[] {
  if (limit <= 0) {
    return [];
  }

  const seenPartners =
    new Set<string>();

  const selected:
    AggregatorResult[] = [];

  for (
    const result of
    sortByScore(partnerCards)
  ) {
    const partnerKey =
      readAttributeString(
        result,
        "partnerKey"
      ) ??
      result.merchant ??
      result.id;

    const normalisedKey =
      partnerKey
        .toLowerCase()
        .trim();

    if (
      !normalisedKey ||
      seenPartners.has(
        normalisedKey
      )
    ) {
      continue;
    }

    seenPartners.add(
      normalisedKey
    );

    selected.push(result);

    if (
      selected.length >=
      limit
    ) {
      break;
    }
  }

  return selected;
}

function interleavePartnerCard(
  concreteResults: AggregatorResult[],
  partnerCards: AggregatorResult[],
  finalLimit: number,
  minimumConcreteResults: number
): AggregatorResult[] {
  if (
    partnerCards.length === 0
  ) {
    return concreteResults.slice(
      0,
      finalLimit
    );
  }

  if (
    concreteResults.length === 0
  ) {
    return partnerCards.slice(
      0,
      finalLimit
    );
  }

  const concreteBeforePartner =
    Math.min(
      minimumConcreteResults,
      concreteResults.length,
      Math.max(
        finalLimit - 1,
        1
      )
    );

  return [
    ...concreteResults.slice(
      0,
      concreteBeforePartner
    ),

    partnerCards[0],

    ...concreteResults.slice(
      concreteBeforePartner
    ),

    ...partnerCards.slice(1),
  ].slice(0, finalLimit);
}

export function applyResultPolicy(
  results: AggregatorResult[],
  vertical: AggregatorVertical,
  options: ResultPolicyOptions
): ResultPolicyResult {
  const finalLimit =
    clampInteger(
      options.finalLimit,
      5,
      1,
      20
    );

  const maximumPartnerCards =
    clampInteger(
      options.maximumPartnerCards,
      DEFAULT_MAXIMUM_PARTNER_CARDS,
      0,
      finalLimit
    );

  const minimumConcreteResults =
    clampInteger(
      options.minimumConcreteResults,
      DEFAULT_MINIMUM_CONCRETE_RESULTS,
      0,
      finalLimit
    );

  const concreteResults =
    sortByScore(
      results.filter(
        (result) =>
          isConcreteResult(
            result,
            vertical
          )
      )
    );

  const partnerCards =
    selectBestPartnerCards(
      results.filter(
        isAwinPartnerCard
      ),
      maximumPartnerCards
    );

  const selected =
    interleavePartnerCard(
      concreteResults,
      partnerCards,
      finalLimit,
      minimumConcreteResults
    );

  return {
    results: selected,

    statistics: {
      received:
        results.length,

      concreteResults:
        concreteResults.length,

      partnerCards:
        partnerCards.length,

      selected:
        selected.length,
    },
  };
}