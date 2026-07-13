import type {
  Recommendation,
  RecommendationResponse,
  SearchIntent,
} from "./RecommendationTypes";
import { getScoreLabel } from "./RecommendationScore";

const MAX_HIGHLIGHTS = 3;
const MAX_WARNINGS = 2;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function buildBudgetExplanation(
  recommendation: Recommendation,
  intent: SearchIntent
): string | null {
  const price = recommendation.price?.amount;

  if (price === undefined) {
    return null;
  }

  if (
    intent.budgetMin !== undefined &&
    intent.budgetMax !== undefined
  ) {
    return `Priced at ${formatCurrency(
      price
    )}, within your ${formatCurrency(
      intent.budgetMin
    )} to ${formatCurrency(intent.budgetMax)} budget.`;
  }

  if (intent.budgetMax !== undefined) {
    const remaining = intent.budgetMax - price;

    if (remaining >= 0) {
      return `Priced at ${formatCurrency(
        price
      )}, which is ${formatCurrency(
        remaining
      )} below your maximum budget.`;
    }
  }

  if (intent.budgetMin !== undefined) {
    return `Priced at ${formatCurrency(
      price
    )}, meeting your minimum budget of ${formatCurrency(
      intent.budgetMin
    )}.`;
  }

  return `Currently priced at ${formatCurrency(price)}.`;
}

function buildPreferenceExplanation(
  recommendation: Recommendation,
  intent: SearchIntent
): string | null {
  if (intent.preferences.length === 0) {
    return null;
  }

  const searchableText = [
    recommendation.title,
    recommendation.description,
    recommendation.reason,
    ...recommendation.highlights,
  ]
    .join(" ")
    .toLowerCase();

  const matchedPreferences = intent.preferences.filter((preference) =>
    searchableText.includes(preference.toLowerCase())
  );

  if (matchedPreferences.length === 0) {
    return null;
  }

  return `Matches your preference${
    matchedPreferences.length === 1 ? "" : "s"
  } for ${matchedPreferences.join(", ")}.`;
}

function buildDestinationExplanation(
  recommendation: Recommendation,
  intent: SearchIntent
): string | null {
  if (
    intent.category !== "holiday" ||
    !intent.destination
  ) {
    return null;
  }

  const destination = intent.destination.toLowerCase();

  const searchableText = [
    recommendation.title,
    recommendation.description,
    recommendation.reason,
    String(recommendation.metadata?.destination ?? ""),
  ]
    .join(" ")
    .toLowerCase();

  if (!searchableText.includes(destination)) {
    return null;
  }

  return `Matches your requested destination: ${intent.destination}.`;
}

function buildTrustExplanation(
  recommendation: Recommendation
): string | null {
  const trust = recommendation.score.trust;

  if (trust >= 90) {
    return "Strong trust signals from the source, merchant and available information.";
  }

  if (trust >= 75) {
    return "Good trust signals from a recognised source or merchant.";
  }

  if (trust >= 60) {
    return "Acceptable trust signals, although checking the latest terms is recommended.";
  }

  return null;
}

function createFallbackReason(
  recommendation: Recommendation
): string {
  const label = getScoreLabel(recommendation.score.overall);

  return `${label} match with a Beacon Score of ${Math.round(
    recommendation.score.overall
  )}/100.`;
}

export function explainRecommendation(
  recommendation: Recommendation,
  intent: SearchIntent
): Recommendation {
  const explanationParts = [
    buildBudgetExplanation(recommendation, intent),
    buildPreferenceExplanation(recommendation, intent),
    buildDestinationExplanation(recommendation, intent),
    buildTrustExplanation(recommendation),
  ].filter((value): value is string => Boolean(value));

  const reason =
    explanationParts.length > 0
      ? explanationParts.join(" ")
      : recommendation.reason || createFallbackReason(recommendation);

  return {
    ...recommendation,
    reason,
    highlights: recommendation.highlights
      .filter(Boolean)
      .slice(0, MAX_HIGHLIGHTS),
    warnings: recommendation.warnings
      ?.filter(Boolean)
      .slice(0, MAX_WARNINGS),
  };
}

export function explainRecommendations(
  recommendations: Recommendation[],
  intent: SearchIntent
): Recommendation[] {
  return recommendations.map((recommendation) =>
    explainRecommendation(recommendation, intent)
  );
}

export function createRecommendationSummary(
  intent: SearchIntent,
  recommendations: Recommendation[]
): string {
  const count = recommendations.length;

  if (count === 0) {
    return "Beacon could not find enough suitable recommendations for this search. Try changing the budget or adding more detail.";
  }

  const categoryLabel =
    intent.category === "holiday"
      ? "holiday options"
      : intent.category === "product"
        ? "products"
        : intent.category === "service"
          ? "services"
          : intent.category === "experience"
            ? "experiences"
            : "recommendations";

  const budgetText =
    intent.budgetMax !== undefined
      ? ` within a maximum budget of ${formatCurrency(intent.budgetMax)}`
      : "";

  const destinationText =
    intent.destination
      ? ` for ${intent.destination}`
      : "";

  return `Beacon selected ${count} ${categoryLabel}${destinationText}${budgetText}, ranked by relevance, value, quality and trust.`;
}

export function buildRecommendationResponse(
  intent: SearchIntent,
  recommendations: Recommendation[]
): RecommendationResponse {
  const explained = explainRecommendations(recommendations, intent);

  return {
    query: intent.rawQuery,
    summary: createRecommendationSummary(intent, explained),
    recommendations: explained,
    generatedAt: new Date().toISOString(),
  };
}