import type { BeaconIntent } from "@/lib/engine/types";
import type { PartnerOffer } from "@/lib/partners/types";

export type BeaconScoreBreakdown = {
  total: number;
  budgetScore: number;
  preferenceScore: number;
  completenessScore: number;
  trustScore: number;
  reasons: string[];
};

function normaliseText(values: string[]): string {
  return values.join(" ").toLowerCase();
}

function calculateBudgetScore(
  offer: PartnerOffer,
  intent: BeaconIntent
): {
  score: number;
  reason?: string;
} {
  if (!intent.budget || typeof offer.price !== "number") {
    return {
      score: 18,
      reason: "Price can be considered once live pricing is available.",
    };
  }

  if (offer.price <= intent.budget) {
    const remainingBudget = intent.budget - offer.price;
    const percentageRemaining =
      remainingBudget / Math.max(intent.budget, 1);

    if (percentageRemaining >= 0.2) {
      return {
        score: 30,
        reason: "Comfortably within your stated budget.",
      };
    }

    return {
      score: 27,
      reason: "Within your stated budget.",
    };
  }

  const amountOver = offer.price - intent.budget;
  const percentageOver = amountOver / Math.max(intent.budget, 1);

  if (percentageOver <= 0.05) {
    return {
      score: 19,
      reason: "Slightly above your stated budget.",
    };
  }

  if (percentageOver <= 0.15) {
    return {
      score: 10,
      reason: "Above your stated budget.",
    };
  }

  return {
    score: 2,
    reason: "Significantly above your stated budget.",
  };
}

function calculatePreferenceScore(
  offer: PartnerOffer,
  intent: BeaconIntent
): {
  score: number;
  matchedPreferences: string[];
} {
  if (intent.preferences.length === 0) {
    return {
      score: 25,
      matchedPreferences: [],
    };
  }

  const offerText = normaliseText([
    offer.title,
    offer.description,
    ...offer.features,
  ]);

  const matchedPreferences = intent.preferences.filter((preference) => {
    const words = preference
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2);

    return words.some((word) => offerText.includes(word));
  });

  const matchRatio =
    matchedPreferences.length / Math.max(intent.preferences.length, 1);

  return {
    score: Math.round(35 * matchRatio),
    matchedPreferences,
  };
}

function calculateCompletenessScore(offer: PartnerOffer): number {
  let score = 0;

  if (offer.title.trim()) {
    score += 4;
  }

  if (offer.description.trim()) {
    score += 4;
  }

  if (offer.features.length >= 3) {
    score += 5;
  }

  if (typeof offer.price === "number") {
    score += 4;
  }

  if (offer.destinationUrl.trim()) {
    score += 3;
  }

  return score;
}

export function calculateBeaconScore(
  offer: PartnerOffer,
  intent: BeaconIntent
): BeaconScoreBreakdown {
  const budget = calculateBudgetScore(offer, intent);
  const preferences = calculatePreferenceScore(offer, intent);
  const completenessScore = calculateCompletenessScore(offer);

  // Demo partners begin with a neutral trust score.
  // Later this will use refund policy, reviews, feed freshness,
  // customer service and verified partner data.
  const trustScore = 15;

  const rawTotal =
    budget.score +
    preferences.score +
    completenessScore +
    trustScore;

  const total = Math.max(0, Math.min(100, rawTotal));

  const reasons: string[] = [];

  if (budget.reason) {
    reasons.push(budget.reason);
  }

  if (preferences.matchedPreferences.length > 0) {
    reasons.push(
      `Matches: ${preferences.matchedPreferences.join(", ")}.`
    );
  }

  if (offer.features.length >= 3) {
    reasons.push("Provides clear information about its main benefits.");
  }

  if (offer.sponsored) {
    reasons.push(
      "This is a sponsored option, but sponsorship did not increase its Beacon Score."
    );
  }

  return {
    total,
    budgetScore: budget.score,
    preferenceScore: preferences.score,
    completenessScore,
    trustScore,
    reasons,
  };
}