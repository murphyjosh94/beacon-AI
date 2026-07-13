import type {
  Recommendation,
  RecommendationRequest,
} from "./RecommendationTypes";
import { rankRecommendations } from "./RecommendationScore";

export type RankingOptions = {
  limit?: number;
  minimumScore?: number;
  minimumTrustScore?: number;
  removeDuplicates?: boolean;
};

const DEFAULT_OPTIONS: Required<RankingOptions> = {
  limit: 5,
  minimumScore: 45,
  minimumTrustScore: 35,
  removeDuplicates: true,
};

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createRecommendationKey(
  recommendation: Recommendation
): string {
  const title = normaliseText(recommendation.title);
  const merchant = normaliseText(recommendation.merchant ?? "");
  const url = recommendation.url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("?")[0]
    .replace(/\/$/, "");

  return `${title}|${merchant}|${url}`;
}

function removeDuplicateRecommendations(
  recommendations: Recommendation[]
): Recommendation[] {
  const seen = new Set<string>();
  const unique: Recommendation[] = [];

  for (const recommendation of recommendations) {
    const key = createRecommendationKey(recommendation);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(recommendation);
  }

  return unique;
}

function isWithinBudget(
  recommendation: Recommendation,
  request: RecommendationRequest
): boolean {
  const price = recommendation.price?.amount;

  if (price === undefined) {
    return true;
  }

  const { budgetMin, budgetMax } = request.intent;

  if (budgetMin !== undefined && price < budgetMin) {
    return false;
  }

  if (budgetMax !== undefined && price > budgetMax) {
    return false;
  }

  return true;
}

function matchesCategory(
  recommendation: Recommendation,
  request: RecommendationRequest
): boolean {
  const requestedCategory = request.intent.category;

  if (requestedCategory === "unknown") {
    return true;
  }

  return recommendation.category === requestedCategory;
}

function passesQualityThresholds(
  recommendation: Recommendation,
  options: Required<RankingOptions>
): boolean {
  return (
    recommendation.score.overall >= options.minimumScore &&
    recommendation.score.trust >= options.minimumTrustScore
  );
}

export function filterRecommendations(
  recommendations: Recommendation[],
  request: RecommendationRequest,
  options: RankingOptions = {}
): Recommendation[] {
  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let filtered = recommendations.filter(
    (recommendation) =>
      matchesCategory(recommendation, request) &&
      isWithinBudget(recommendation, request) &&
      passesQualityThresholds(recommendation, settings)
  );

  if (settings.removeDuplicates) {
    filtered = removeDuplicateRecommendations(filtered);
  }

  return filtered;
}

export function selectBestRecommendations(
  recommendations: Recommendation[],
  request: RecommendationRequest,
  options: RankingOptions = {}
): Recommendation[] {
  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
    limit: options.limit ?? request.limit ?? DEFAULT_OPTIONS.limit,
  };

  const filtered = filterRecommendations(
    recommendations,
    request,
    settings
  );

  return rankRecommendations(filtered).slice(0, settings.limit);
}

export function ensureMaximumRecommendations(
  recommendations: Recommendation[],
  maximum = 5
): Recommendation[] {
  const safeMaximum = Math.max(1, Math.floor(maximum));

  return recommendations.slice(0, safeMaximum);
}