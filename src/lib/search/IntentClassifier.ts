import type {
  RecommendationCategory,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

export type IntentClassification = {
  category: RecommendationCategory;
  confidence: number;
  reasons: string[];
};

type CategoryRule = {
  category: RecommendationCategory;
  keywords: string[];
  phrases: string[];
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "holiday",
    keywords: [
      "holiday",
      "hotel",
      "flight",
      "flights",
      "resort",
      "cruise",
      "travel",
      "villa",
      "apartment",
      "destination",
      "airport",
    ],
    phrases: [
      "all inclusive",
      "city break",
      "package holiday",
      "weekend away",
      "family holiday",
      "beach holiday",
      "summer holiday",
      "winter sun",
    ],
  },
  {
    category: "product",
    keywords: [
      "tv",
      "television",
      "phone",
      "mobile",
      "laptop",
      "computer",
      "tablet",
      "vacuum",
      "fridge",
      "freezer",
      "sofa",
      "mattress",
      "headphones",
      "camera",
      "console",
      "playstation",
      "xbox",
      "drill",
      "tool",
      "appliance",
      "product",
    ],
    phrases: [
      "washing machine",
      "air fryer",
      "coffee machine",
      "gaming laptop",
      "mobile phone",
      "smart tv",
      "cordless vacuum",
      "power tool",
    ],
  },
  {
    category: "experience",
    keywords: [
      "experience",
      "activity",
      "concert",
      "event",
      "tickets",
      "spa",
      "restaurant",
      "attraction",
      "themepark",
    ],
    phrases: [
      "day out",
      "theme park",
      "spa day",
      "afternoon tea",
      "driving experience",
      "family activity",
      "gift experience",
    ],
  },
  {
    category: "service",
    keywords: [
      "broadband",
      "insurance",
      "energy",
      "subscription",
      "provider",
      "contract",
      "tariff",
      "mortgage",
      "loan",
    ],
    phrases: [
      "mobile contract",
      "car insurance",
      "home insurance",
      "travel insurance",
      "energy supplier",
      "broadband deal",
      "streaming service",
    ],
  },
];

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreRule(
  query: string,
  rule: CategoryRule
): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  for (const phrase of rule.phrases) {
    if (query.includes(phrase)) {
      score += 4;
      reasons.push(`Matched phrase: "${phrase}"`);
    }
  }

  const queryWords = new Set(query.split(" "));

  for (const keyword of rule.keywords) {
    if (queryWords.has(keyword)) {
      score += 2;
      reasons.push(`Matched keyword: "${keyword}"`);
    }
  }

  return {
    score,
    reasons,
  };
}

function calculateConfidence(
  winningScore: number,
  totalScore: number
): number {
  if (winningScore <= 0 || totalScore <= 0) {
    return 0;
  }

  const rawConfidence = winningScore / totalScore;

  return Number(Math.min(1, rawConfidence).toFixed(2));
}

export function classifySearchIntent(
  intent: SearchIntent
): IntentClassification {
  const query = normalise(
    [
      intent.rawQuery,
      intent.keywords.join(" "),
      intent.preferences.join(" "),
    ].join(" ")
  );

  const scoredCategories = CATEGORY_RULES.map((rule) => {
    const result = scoreRule(query, rule);

    return {
      category: rule.category,
      score: result.score,
      reasons: result.reasons,
    };
  });

  scoredCategories.sort((a, b) => b.score - a.score);

  const winner = scoredCategories[0];

  const totalScore = scoredCategories.reduce(
    (total, result) => total + result.score,
    0
  );

  if (!winner || winner.score === 0) {
    return {
      category: intent.category,
      confidence: intent.category === "unknown" ? 0 : 0.5,
      reasons:
        intent.category === "unknown"
          ? ["No strong category match was found."]
          : ["Using the category detected by the search parser."],
    };
  }

  return {
    category: winner.category,
    confidence: calculateConfidence(
      winner.score,
      totalScore
    ),
    reasons: winner.reasons,
  };
}

export function applyIntentClassification(
  intent: SearchIntent
): SearchIntent {
  const classification = classifySearchIntent(intent);

  return {
    ...intent,
    category: classification.category,
  };
}