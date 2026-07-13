import type {
  RecommendationCategory,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

const PRODUCT_KEYWORDS = [
  "tv",
  "television",
  "phone",
  "mobile",
  "laptop",
  "computer",
  "tablet",
  "vacuum",
  "washing machine",
  "fridge",
  "freezer",
  "air fryer",
  "sofa",
  "mattress",
  "headphones",
  "camera",
  "console",
  "playstation",
  "xbox",
  "tool",
  "drill",
  "product",
];

const HOLIDAY_KEYWORDS = [
  "holiday",
  "hotel",
  "flight",
  "flights",
  "resort",
  "cruise",
  "city break",
  "weekend away",
  "package holiday",
  "all inclusive",
  "destination",
  "travel",
];

const EXPERIENCE_KEYWORDS = [
  "experience",
  "day out",
  "spa",
  "restaurant",
  "activity",
  "concert",
  "event",
  "theme park",
];

const SERVICE_KEYWORDS = [
  "broadband",
  "insurance",
  "energy",
  "mobile contract",
  "subscription",
  "service",
];

function normaliseQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function detectCategory(query: string): RecommendationCategory {
  const normalised = query.toLowerCase();

  if (
    HOLIDAY_KEYWORDS.some((keyword) =>
      normalised.includes(keyword)
    )
  ) {
    return "holiday";
  }

  if (
    PRODUCT_KEYWORDS.some((keyword) =>
      normalised.includes(keyword)
    )
  ) {
    return "product";
  }

  if (
    EXPERIENCE_KEYWORDS.some((keyword) =>
      normalised.includes(keyword)
    )
  ) {
    return "experience";
  }

  if (
    SERVICE_KEYWORDS.some((keyword) =>
      normalised.includes(keyword)
    )
  ) {
    return "service";
  }

  return "unknown";
}

function extractBudget(query: string): {
  budgetMin?: number;
  budgetMax?: number;
} {
  const normalised = query
    .toLowerCase()
    .replace(/,/g, "");

  const rangeMatch = normalised.match(
    /(?:between|from)\s*£?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*£?\s*(\d+(?:\.\d+)?)/
  );

  if (rangeMatch) {
    return {
      budgetMin: Number(rangeMatch[1]),
      budgetMax: Number(rangeMatch[2]),
    };
  }

  const maximumMatch = normalised.match(
    /(?:under|below|less than|up to|max(?:imum)?(?: of)?)\s*£?\s*(\d+(?:\.\d+)?)/
  );

  if (maximumMatch) {
    return {
      budgetMax: Number(maximumMatch[1]),
    };
  }

  const minimumMatch = normalised.match(
    /(?:over|above|more than|at least|min(?:imum)?(?: of)?)\s*£?\s*(\d+(?:\.\d+)?)/
  );

  if (minimumMatch) {
    return {
      budgetMin: Number(minimumMatch[1]),
    };
  }

  const poundMatch = normalised.match(
    /£\s*(\d+(?:\.\d+)?)/
  );

  if (poundMatch) {
    return {
      budgetMax: Number(poundMatch[1]),
    };
  }

  return {};
}

function extractTravellerCount(
  query: string
): SearchIntent["travellers"] {
  const normalised = query.toLowerCase();

  const adultsMatch = normalised.match(
    /(\d+)\s*adults?/
  );

  const childrenMatch = normalised.match(
    /(\d+)\s*(?:children|child|kids?)/
  );

  if (!adultsMatch && !childrenMatch) {
    return undefined;
  }

  return {
    adults: adultsMatch
      ? Number(adultsMatch[1])
      : 1,
    children: childrenMatch
      ? Number(childrenMatch[1])
      : 0,
  };
}

function extractDestination(
  query: string
): string | undefined {
  const destinationMatch = query.match(
    /\b(?:to|in)\s+([A-Za-z][A-Za-z\s'-]{2,40}?)(?=\s+(?:under|below|for|with|in|during|from|between|all inclusive|half board|full board)\b|[,.!?]|$)/i
  );

  return destinationMatch?.[1]?.trim();
}

function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "best",
    "can",
    "find",
    "for",
    "i",
    "in",
    "is",
    "me",
    "my",
    "of",
    "on",
    "please",
    "show",
    "that",
    "the",
    "to",
    "under",
    "want",
    "with",
  ]);

  const words = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length > 1 &&
        !stopWords.has(word)
    );

  return Array.from(new Set(words));
}

function extractPreferences(
  query: string
): string[] {
  const normalised = query.toLowerCase();

  const knownPreferences = [
    "all inclusive",
    "family friendly",
    "adults only",
    "beachfront",
    "five star",
    "4k",
    "oled",
    "gaming",
    "wireless",
    "lightweight",
    "pet friendly",
    "eco friendly",
    "free cancellation",
  ];

  return knownPreferences.filter((preference) =>
    normalised.includes(preference)
  );
}

function extractExclusions(
  query: string
): string[] {
  const exclusions: string[] = [];

  const matches = query.matchAll(
    /\b(?:not|without|exclude|excluding|avoid)\s+([A-Za-z0-9\s'-]+?)(?=[,.!?]|$|\s+(?:and|but|with|under|for)\b)/gi
  );

  for (const match of matches) {
    const value = match[1]?.trim();

    if (value) {
      exclusions.push(value.toLowerCase());
    }
  }

  return Array.from(new Set(exclusions));
}

export function parseSearchQuery(
  rawQuery: string
): SearchIntent {
  const query = normaliseQuery(rawQuery);

  if (!query) {
    throw new Error(
      "A search query is required."
    );
  }

  const category = detectCategory(query);
  const budget = extractBudget(query);

  return {
    rawQuery: query,
    category,
    keywords: extractKeywords(query),
    budgetMin: budget.budgetMin,
    budgetMax: budget.budgetMax,
    destination:
      category === "holiday"
        ? extractDestination(query)
        : undefined,
    travellers:
      category === "holiday"
        ? extractTravellerCount(query)
        : undefined,
    preferences: extractPreferences(query),
    exclusions: extractExclusions(query),
  };
}