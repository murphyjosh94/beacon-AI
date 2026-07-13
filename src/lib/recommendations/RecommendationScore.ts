import type {
  Recommendation,
  RecommendationScore,
} from "./RecommendationTypes";

export type ScoreWeights = {
  relevance: number;
  value: number;
  quality: number;
  trust: number;
};

export type CandidateScoreInput = {
  relevance: number;
  value: number;
  quality: number;
  trust: number;
};

const DEFAULT_WEIGHTS: ScoreWeights = {
  relevance: 0.4,
  value: 0.25,
  quality: 0.2,
  trust: 0.15,
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function normaliseWeights(weights: ScoreWeights): ScoreWeights {
  const total =
    weights.relevance +
    weights.value +
    weights.quality +
    weights.trust;

  if (total <= 0) {
    return DEFAULT_WEIGHTS;
  }

  return {
    relevance: weights.relevance / total,
    value: weights.value / total,
    quality: weights.quality / total,
    trust: weights.trust / total,
  };
}

export function calculateRecommendationScore(
  input: CandidateScoreInput,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): RecommendationScore {
  const safeWeights = normaliseWeights(weights);

  const relevance = clampScore(input.relevance);
  const value = clampScore(input.value);
  const quality = clampScore(input.quality);
  const trust = clampScore(input.trust);

  const overall =
    relevance * safeWeights.relevance +
    value * safeWeights.value +
    quality * safeWeights.quality +
    trust * safeWeights.trust;

  return {
    overall: Number(overall.toFixed(1)),
    relevance,
    value,
    quality,
    trust,
  };
}

export function scoreRecommendation(
  recommendation: Recommendation,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): Recommendation {
  return {
    ...recommendation,
    score: calculateRecommendationScore(recommendation.score, weights),
  };
}

export function scoreRecommendations(
  recommendations: Recommendation[],
  weights: ScoreWeights = DEFAULT_WEIGHTS
): Recommendation[] {
  return recommendations.map((recommendation) =>
    scoreRecommendation(recommendation, weights)
  );
}

export function compareRecommendationScores(
  a: Recommendation,
  b: Recommendation
): number {
  if (b.score.overall !== a.score.overall) {
    return b.score.overall - a.score.overall;
  }

  if (b.score.relevance !== a.score.relevance) {
    return b.score.relevance - a.score.relevance;
  }

  if (b.score.trust !== a.score.trust) {
    return b.score.trust - a.score.trust;
  }

  if (b.score.quality !== a.score.quality) {
    return b.score.quality - a.score.quality;
  }

  return b.score.value - a.score.value;
}

export function rankRecommendations(
  recommendations: Recommendation[],
  weights: ScoreWeights = DEFAULT_WEIGHTS
): Recommendation[] {
  return scoreRecommendations(recommendations, weights).sort(
    compareRecommendationScores
  );
}

export function getScoreLabel(score: number): string {
  const safeScore = clampScore(score);

  if (safeScore >= 90) {
    return "Exceptional";
  }

  if (safeScore >= 80) {
    return "Excellent";
  }

  if (safeScore >= 70) {
    return "Very Good";
  }

  if (safeScore >= 60) {
    return "Good";
  }

  if (safeScore >= 50) {
    return "Fair";
  }

  return "Limited Match";
}