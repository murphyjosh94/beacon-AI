import "server-only";

import type {
  AggregatorProviderResult,
  AggregatorResult,
  AggregatorResultAttributeValue,
  AggregatorResultAttributes,
  AggregatorResultSource,
  AggregatorVertical,
} from "@/services/aggregator/AggregatorTypes";

import type {
  RecommendationCategory,
  RecommendationPrice,
} from "@/lib/recommendations/RecommendationTypes";

export type NormalisationWarning = {
  providerId: string;
  resultId?: string;
  message: string;
};

export type NormalisationResult = {
  results: AggregatorResult[];

  warnings: NormalisationWarning[];

  statistics: {
    received: number;
    accepted: number;
    rejected: number;
  };
};

const VALID_VERTICALS = new Set<AggregatorVertical>([
  "shopping",
  "travel",
  "flights",
  "entertainment",
  "services",
]);

const VALID_SOURCES = new Set<AggregatorResultSource>([
  "merchant_feed",
  "merchant_api",
  "search_api",
  "affiliate",
  "public_search",
]);

const VALID_CATEGORIES = new Set<RecommendationCategory>([
  "product",
  "holiday",
  "service",
  "experience",
  "unknown",
]);

function clamp(
  value: number,
  minimum = 0,
  maximum = 100
): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.max(
    minimum,
    Math.min(maximum, value)
  );
}

function cleanText(
  value: string | undefined,
  maximumLength = 500
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return undefined;
  }

  return cleaned.slice(
    0,
    maximumLength
  );
}

function cleanRequiredText(
  value: string | undefined,
  maximumLength: number
): string | null {
  return (
    cleanText(
      value,
      maximumLength
    ) ?? null
  );
}

function normaliseIdentifier(
  value: string | undefined,
  fallback: string
): string {
  const source =
    cleanText(value, 160) ??
    fallback;

  const cleaned = source
    .toLowerCase()
    .replace(
      /[^a-z0-9_-]+/g,
      "-"
    )
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return cleaned || fallback;
}

function normaliseHttpUrl(
  value: string | undefined
): string | undefined {
  const cleaned = cleanText(
    value,
    2_000
  );

  if (!cleaned) {
    return undefined;
  }

  try {
    const url = new URL(cleaned);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return undefined;
    }

    url.hash = "";

    return url.toString();
  } catch {
    return undefined;
  }
}

function normaliseCurrency(
  value: string | undefined
): string {
  const cleaned =
    value
      ?.trim()
      .toUpperCase();

  if (
    cleaned &&
    /^[A-Z]{3}$/.test(cleaned)
  ) {
    return cleaned;
  }

  return "GBP";
}

function createPriceDisplay(
  amount: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "en-GB",
      {
        style: "currency",
        currency,
      }
    ).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

function normalisePrice(
  price: RecommendationPrice | undefined
): RecommendationPrice | undefined {
  if (!price) {
    return undefined;
  }

  const amount =
    Number(price.amount);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return undefined;
  }

  const currency =
    normaliseCurrency(
      price.currency
    );

  return {
    amount,

    currency:
      currency as RecommendationPrice["currency"],

    display:
      cleanText(
        price.display,
        120
      ) ??
      createPriceDisplay(
        amount,
        currency
      ),
  };
}

function normaliseStringList(
  values: string[] | undefined,
  maximumItems: number,
  maximumLength = 180
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const unique =
    new Set<string>();

  for (const value of values) {
    const cleaned =
      cleanText(
        value,
        maximumLength
      );

    if (!cleaned) {
      continue;
    }

    const comparisonKey =
      cleaned.toLowerCase();

    if (
      Array.from(unique).some(
        (existing) =>
          existing.toLowerCase() ===
          comparisonKey
      )
    ) {
      continue;
    }

    unique.add(cleaned);

    if (
      unique.size >=
      maximumItems
    ) {
      break;
    }
  }

  return Array.from(unique);
}

function normaliseAttributeValue(
  value: AggregatorResultAttributeValue
): AggregatorResultAttributeValue {
  if (typeof value === "string") {
    return (
      cleanText(
        value,
        500
      ) ?? null
    );
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

function normaliseAttributes(
  attributes:
    | AggregatorResultAttributes
    | undefined
): AggregatorResultAttributes {
  if (
    !attributes ||
    typeof attributes !==
      "object"
  ) {
    return {};
  }

  const output:
    AggregatorResultAttributes =
    {};

  for (const [key, value] of Object.entries(
    attributes
  )) {
    const cleanedKey =
      cleanText(
        key,
        80
      );

    if (!cleanedKey) {
      continue;
    }

    output[cleanedKey] =
      normaliseAttributeValue(
        value
      );
  }

  return output;
}

function normaliseVertical(
  value: AggregatorVertical
): AggregatorVertical {
  return VALID_VERTICALS.has(
    value
  )
    ? value
    : "services";
}

function normaliseSource(
  value: AggregatorResultSource
): AggregatorResultSource {
  return VALID_SOURCES.has(
    value
  )
    ? value
    : "public_search";
}

function normaliseCategory(
  value: RecommendationCategory
): RecommendationCategory {
  return VALID_CATEGORIES.has(
    value
  )
    ? value
    : "unknown";
}

function normaliseOptionalScore(
  value: number | undefined
): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return clamp(value);
}

function createFallbackDescription(
  title: string,
  merchant?: string,
  location?: string
): string {
  if (merchant && location) {
    return `${title} from ${merchant}, available for consideration in ${location}.`;
  }

  if (merchant) {
    return `${title} from ${merchant}.`;
  }

  if (location) {
    return `${title}, available for consideration in ${location}.`;
  }

  return `${title} appears in Beacon's live search results.`;
}

function isClearlyInvalidResult(
  result: AggregatorResult
): string | null {
  if (
    !cleanText(
      result.title,
      300
    )
  ) {
    return "The result did not include a title.";
  }

  if (
    !cleanText(
      result.providerId,
      120
    )
  ) {
    return "The result did not identify its provider.";
  }

  return null;
}

export function normaliseAggregatorResult(
  result: AggregatorResult,
  index: number
): {
  result: AggregatorResult | null;
  warnings: string[];
} {
  const warnings: string[] =
    [];

  const invalidReason =
    isClearlyInvalidResult(
      result
    );

  if (invalidReason) {
    return {
      result: null,
      warnings: [
        invalidReason,
      ],
    };
  }

  const providerId =
    cleanRequiredText(
      result.providerId,
      120
    );

  const title =
    cleanRequiredText(
      result.title,
      300
    );

  if (
    !providerId ||
    !title
  ) {
    return {
      result: null,
      warnings: [
        "The result did not include the required provider and title fields.",
      ],
    };
  }

  const destinationUrl =
    normaliseHttpUrl(
      result.destinationUrl
    );

  if (
    result.destinationUrl &&
    !destinationUrl
  ) {
    warnings.push(
      "The destination URL was invalid and has been removed."
    );
  }

  const imageUrl =
    normaliseHttpUrl(
      result.imageUrl
    );

  if (
    result.imageUrl &&
    !imageUrl
  ) {
    warnings.push(
      "The image URL was invalid and has been removed."
    );
  }

  const merchant =
    cleanText(
      result.merchant,
      180
    );

  const location =
    cleanText(
      result.location,
      250
    );

  const description =
    cleanText(
      result.description,
      1_200
    ) ??
    createFallbackDescription(
      title,
      merchant,
      location
    );

  const price =
    normalisePrice(
      result.price
    );

  const previousPrice =
    normalisePrice(
      result.previousPrice
    );

  if (
    previousPrice &&
    price &&
    previousPrice.amount <
      price.amount
  ) {
    warnings.push(
      "The previous price was lower than the current price and has been removed."
    );
  }

  const rating =
    typeof result.rating ===
      "number" &&
    Number.isFinite(
      result.rating
    )
      ? clamp(
          result.rating,
          0,
          5
        )
      : undefined;

  const reviewCount =
    typeof result.reviewCount ===
      "number" &&
    Number.isFinite(
      result.reviewCount
    ) &&
    result.reviewCount >= 0
      ? Math.floor(
          result.reviewCount
        )
      : undefined;

  const normalisedId =
    normaliseIdentifier(
      result.id,
      `${providerId}-${index + 1}`
    );

  return {
    result: {
      id: normalisedId,

      providerId,

      source:
        normaliseSource(
          result.source
        ),

      vertical:
        normaliseVertical(
          result.vertical
        ),

      category:
        normaliseCategory(
          result.category
        ),

      title,

      description,

      merchant,

      brand:
        cleanText(
          result.brand,
          180
        ),

      destinationUrl:
        destinationUrl ?? "",

      imageUrl,

      price,

      previousPrice:
        previousPrice &&
        (
          !price ||
          previousPrice.amount >=
            price.amount
        )
          ? previousPrice
          : undefined,

      rating,

      reviewCount,

      location,

      highlights:
        normaliseStringList(
          result.highlights,
          8
        ),

      warnings:
        normaliseStringList(
          [
            ...result.warnings,
            ...warnings,
          ],
          6,
          300
        ),

      attributes:
        normaliseAttributes(
          result.attributes
        ),

      sponsored:
        Boolean(
          result.sponsored
        ),

      relevanceScore:
        normaliseOptionalScore(
          result.relevanceScore
        ),

      valueScore:
        normaliseOptionalScore(
          result.valueScore
        ),

      qualityScore:
        normaliseOptionalScore(
          result.qualityScore
        ),

      trustScore:
        normaliseOptionalScore(
          result.trustScore
        ),

      overallScore:
        normaliseOptionalScore(
          result.overallScore
        ),
    },

    warnings,
  };
}

export function normaliseProviderResults(
  providerResults:
    AggregatorProviderResult[]
): NormalisationResult {
  const normalised:
    AggregatorResult[] =
    [];

  const warnings:
    NormalisationWarning[] =
    [];

  let received = 0;
  let rejected = 0;

  for (const providerResult of providerResults) {
    const providerId =
      cleanText(
        providerResult.providerId,
        120
      ) ??
      "unknown-provider";

    for (
      let index = 0;
      index <
      providerResult.results.length;
      index += 1
    ) {
      received += 1;

      const candidate =
        providerResult.results[
          index
        ];

      const outcome =
        normaliseAggregatorResult(
          candidate,
          index
        );

      for (const message of outcome.warnings) {
        warnings.push({
          providerId,

          resultId:
            cleanText(
              candidate.id,
              120
            ),

          message,
        });
      }

      if (!outcome.result) {
        rejected += 1;
        continue;
      }

      normalised.push(
        outcome.result
      );
    }
  }

  return {
    results: normalised,

    warnings,

    statistics: {
      received,

      accepted:
        normalised.length,

      rejected,
    },
  };
}