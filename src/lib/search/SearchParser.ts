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
  "suit",
  "shirt",
  "trousers",
  "jacket",
  "dress",
  "shoes",
  "clothing",
  "car part",
  "car parts",
  "battery",
  "wiper",
  "engine oil",
  "game key",
  "software key",
  "windows key",
  "office key",
];

const HOLIDAY_KEYWORDS = [
  "holiday",
  "hotel",
  "hotels",
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
  "staycation",
  "accommodation",
  "apartment",
  "villa",
  "cottage",
  "bed and breakfast",
  "b&b",
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
  "tickets",
  "theatre",
  "show",
  "attraction",
];

const SERVICE_KEYWORDS = [
  "broadband",
  "insurance",
  "energy",
  "mobile contract",
  "subscription",
  "service",
];

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const DATE_MONTH_PATTERN =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";

function normaliseQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function detectCategory(
  query: string
): RecommendationCategory {
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

function cleanDestination(
  value: string | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(
      /\b(?:hotel|hotels|accommodation|stay|stays)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .replace(/^[,.\s-]+|[,.\s-]+$/g, "")
    .trim();

  return cleaned || undefined;
}

function extractDestination(
  query: string
): string | undefined {
  /*
   * Supports:
   *
   * hotels near Wales 12 August 2026 to 19 August 2026
   * hotel in Tenerife from 12 August 2026 to 19 August 2026
   * stay in Edinburgh between 4 September 2026 and 8 September 2026
   * accommodation near Manchester under £150
   */

  const beforeNamedDate = new RegExp(
    `\\b(?:to|in|near|around)\\s+([A-Za-z][A-Za-z\\s'-]{1,60}?)(?=\\s+\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${DATE_MONTH_PATTERN})\\b)`,
    "i"
  );

  const namedDateMatch =
    query.match(beforeNamedDate);

  if (namedDateMatch) {
    return cleanDestination(
      namedDateMatch[1]
    );
  }

  const beforeNumericDate = query.match(
    /\b(?:to|in|near|around)\s+([A-Za-z][A-Za-z\s'-]{1,60}?)(?=\s+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b)/i
  );

  if (beforeNumericDate) {
    return cleanDestination(
      beforeNumericDate[1]
    );
  }

  const destinationMatch = query.match(
    /\b(?:to|in|near|around)\s+([A-Za-z][A-Za-z\s'-]{1,60}?)(?=\s+(?:from|between|under|below|over|above|for|with|during|on|all inclusive|half board|full board|bed and breakfast|b&b)\b|[,.!?]|$)/i
  );

  return cleanDestination(
    destinationMatch?.[1]
  );
}

function toIsoDate(
  day: number,
  month: number,
  year: number
): string | undefined {
  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return date.toISOString().slice(0, 10);
}

function parseNamedDate(
  dayText: string,
  monthText: string,
  yearText: string
): string | undefined {
  const day = Number(dayText);
  const month =
    MONTHS[monthText.toLowerCase()];
  const year = Number(yearText);

  if (!month) {
    return undefined;
  }

  return toIsoDate(day, month, year);
}

function parseNumericDate(
  dayText: string,
  monthText: string,
  yearText: string
): string | undefined {
  const day = Number(dayText);
  const month = Number(monthText);

  let year = Number(yearText);

  if (yearText.length === 2) {
    year += 2000;
  }

  return toIsoDate(day, month, year);
}

function extractTravelDates(query: string): {
  startDate?: string;
  endDate?: string;
} {
  const namedRange = query.match(
    /\b(?:from|between)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})\s+(?:to|until|and|-)\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})\b/i
  );

  if (namedRange) {
    return {
      startDate: parseNamedDate(
        namedRange[1],
        namedRange[2],
        namedRange[3]
      ),

      endDate: parseNamedDate(
        namedRange[4],
        namedRange[5],
        namedRange[6]
      ),
    };
  }

  const namedSameMonthRange = query.match(
    /\b(?:from|between)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(?:to|until|and|-)\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})\b/i
  );

  if (namedSameMonthRange) {
    return {
      startDate: parseNamedDate(
        namedSameMonthRange[1],
        namedSameMonthRange[3],
        namedSameMonthRange[4]
      ),

      endDate: parseNamedDate(
        namedSameMonthRange[2],
        namedSameMonthRange[3],
        namedSameMonthRange[4]
      ),
    };
  }

  const numericRange = query.match(
    /\b(?:from|between)?\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(?:to|until|and|-)\s+(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/i
  );

  if (numericRange) {
    return {
      startDate: parseNumericDate(
        numericRange[1],
        numericRange[2],
        numericRange[3]
      ),

      endDate: parseNumericDate(
        numericRange[4],
        numericRange[5],
        numericRange[6]
      ),
    };
  }

  const allNamedDates = Array.from(
    query.matchAll(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})\b/gi
    )
  );

  if (allNamedDates.length >= 2) {
    return {
      startDate: parseNamedDate(
        allNamedDates[0][1],
        allNamedDates[0][2],
        allNamedDates[0][3]
      ),

      endDate: parseNamedDate(
        allNamedDates[1][1],
        allNamedDates[1][2],
        allNamedDates[1][3]
      ),
    };
  }

  const allNumericDates = Array.from(
    query.matchAll(
      /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g
    )
  );

  if (allNumericDates.length >= 2) {
    return {
      startDate: parseNumericDate(
        allNumericDates[0][1],
        allNumericDates[0][2],
        allNumericDates[0][3]
      ),

      endDate: parseNumericDate(
        allNumericDates[1][1],
        allNumericDates[1][2],
        allNumericDates[1][3]
      ),
    };
  }

  return {};
}

function extractKeywords(
  query: string
): string[] {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "best",
    "can",
    "find",
    "for",
    "from",
    "i",
    "in",
    "is",
    "me",
    "my",
    "near",
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
        !stopWords.has(word) &&
        !/^\d+$/.test(word)
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
    "four star",
    "three star",
    "free breakfast",
    "breakfast included",
    "free cancellation",
    "swimming pool",
    "sea view",
    "city centre",
    "pet friendly",
    "dog friendly",
    "eco friendly",
    "4k",
    "oled",
    "gaming",
    "wireless",
    "lightweight",
  ];

  return knownPreferences.filter(
    (preference) =>
      normalised.includes(preference)
  );
}

function extractExclusions(
  query: string
): string[] {
  const exclusions: string[] = [];

  const matches = query.matchAll(
    /\b(?:not|without|exclude|excluding|avoid)\s+([A-Za-z0-9\s'-]+?)(?=[,.!?]|$|\s+(?:and|but|with|under|for|from)\b)/gi
  );

  for (const match of matches) {
    const value = match[1]?.trim();

    if (value) {
      exclusions.push(
        value.toLowerCase()
      );
    }
  }

  return Array.from(
    new Set(exclusions)
  );
}

export function parseSearchQuery(
  rawQuery: string
): SearchIntent {
  const query =
    normaliseQuery(rawQuery);

  if (!query) {
    throw new Error(
      "A search query is required."
    );
  }

  const category =
    detectCategory(query);

  const budget =
    extractBudget(query);

  const travelDates =
    category === "holiday"
      ? extractTravelDates(query)
      : {};

  return {
    rawQuery: query,
    category,

    keywords:
      extractKeywords(query),

    budgetMin:
      budget.budgetMin,

    budgetMax:
      budget.budgetMax,

    destination:
      category === "holiday"
        ? extractDestination(query)
        : undefined,

    startDate:
      travelDates.startDate,

    endDate:
      travelDates.endDate,

    travellers:
      category === "holiday"
        ? extractTravellerCount(query)
        : undefined,

    preferences:
      extractPreferences(query),

    exclusions:
      extractExclusions(query),
  };
}