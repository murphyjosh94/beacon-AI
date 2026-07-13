import type {
  BeaconCategory,
  BeaconIntent,
} from "@/lib/types";

const getawayKeywords = [
  "holiday",
  "holidays",
  "hotel",
  "staycation",
  "cottage",
  "break",
  "trip",
  "travel",
  "flight",
  "flights",
  "beach",
  "resort",
  "caravan",
  "camping",
];

const entertainmentKeywords = [
  "event",
  "events",
  "ticket",
  "tickets",
  "experience",
  "experiences",
  "show",
  "theatre",
  "concert",
  "festival",
  "attraction",
  "day out",
  "spa",
  "cinema",
];

const knownBrands = [
  "Samsung",
  "Apple",
  "Sony",
  "LG",
  "Dyson",
  "Bosch",
  "Shark",
  "Nike",
  "Adidas",
  "Jet2",
  "TUI",
  "Haven",
  "Sykes",
];

const preferenceKeywords: Record<string, string> = {
  beach: "Beach nearby",
  "sandy beach": "Sandy beach",
  pool: "Swimming pool",
  swimming: "Swimming facilities",
  entertainment: "Entertainment",
  "kids club": "Kids club",
  family: "Family friendly",
  child: "Child friendly",
  children: "Child friendly",
  quiet: "Quiet location",
  luxury: "Luxury",
  premium: "Premium quality",
  cheap: "Lowest possible price",
  budget: "Strong value",
  flexible: "Flexible booking",
  refundable: "Refundable",
  cancellation: "Flexible cancellation",
  luggage: "Luggage included",
  transfers: "Transfers included",
  parking: "Parking",
  accessible: "Accessibility support",
  accessibility: "Accessibility support",
  pet: "Pet friendly",
  dog: "Dog friendly",
  wifi: "Wi-Fi",
  breakfast: "Breakfast included",
  "all inclusive": "All inclusive",
  "full board": "Full board",
  "half board": "Half board",
  oled: "OLED display",
  gaming: "Gaming suitable",
  warranty: "Strong warranty",
  lightweight: "Lightweight",
  cordless: "Cordless",
};

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function detectCategory(
  query: string,
  categoryHint?: BeaconCategory
): BeaconCategory {
  if (categoryHint) {
    return categoryHint;
  }

  const normalisedQuery = query.toLowerCase();

  if (
    getawayKeywords.some((keyword) =>
      normalisedQuery.includes(keyword)
    )
  ) {
    return "getaways";
  }

  if (
    entertainmentKeywords.some((keyword) =>
      normalisedQuery.includes(keyword)
    )
  ) {
    return "entertainment";
  }

  return "shopping";
}

function extractBudget(query: string): number | undefined {
  const patterns = [
    /(?:under|below|less than|up to|maximum|max|budget(?: of)?)\s*£?\s*([\d,]+)/i,
    /£\s*([\d,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const value = Number(match[1].replaceAll(",", ""));

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return undefined;
}

function extractPeopleCount(
  query: string,
  personType: "adult" | "child"
): number | undefined {
  const pattern =
    personType === "adult"
      ? /(\d+)\s*adults?/i
      : /(\d+)\s*(?:children|child|kids?)/i;

  const match = query.match(pattern);

  if (!match?.[1]) {
    return undefined;
  }

  const value = Number(match[1]);

  return Number.isFinite(value) ? value : undefined;
}

function extractDestination(query: string): string | undefined {
  const patterns = [
    /(?:holiday|break|trip|stay|hotel|cottage)\s+(?:in|to|near)\s+([a-z][a-z\s-]{2,30})/i,
    /(?:in|to|near)\s+([a-z][a-z\s-]{2,30})(?:\s+for|\s+under|\s+with|\s+during|,|$)/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    return match[1]
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  return undefined;
}

function extractDepartureAirport(
  query: string
): string | undefined {
  const match = query.match(
    /(?:departing|flying|leaving)\s+(?:from\s+)?([a-z][a-z\s-]{2,30})(?:\s+airport|\s+during|\s+in|\s+under|,|$)/i
  );

  if (!match?.[1]) {
    return undefined;
  }

  return match[1]
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function extractDates(query: string): string[] {
  const normalisedQuery = query.toLowerCase();

  return monthNames
    .filter((month) => normalisedQuery.includes(month))
    .map(
      (month) =>
        month.charAt(0).toUpperCase() + month.slice(1)
    );
}

function extractBrands(query: string): string[] {
  const normalisedQuery = query.toLowerCase();

  return knownBrands.filter((brand) =>
    normalisedQuery.includes(brand.toLowerCase())
  );
}

function extractPreferences(query: string): string[] {
  const normalisedQuery = query.toLowerCase();

  return Object.entries(preferenceKeywords)
    .filter(([keyword]) => normalisedQuery.includes(keyword))
    .map(([, preference]) => preference)
    .filter(
      (preference, index, allPreferences) =>
        allPreferences.indexOf(preference) === index
    );
}

export function extractIntent(
  query: string,
  categoryHint?: BeaconCategory
): BeaconIntent {
  const cleanQuery = query.trim();

  return {
    originalQuery: cleanQuery,
    category: detectCategory(cleanQuery, categoryHint),
    budget: extractBudget(cleanQuery),
    destination: extractDestination(cleanQuery),
    departingFrom: extractDepartureAirport(cleanQuery),
    adults: extractPeopleCount(cleanQuery, "adult"),
    children: extractPeopleCount(cleanQuery, "child"),
    dates: extractDates(cleanQuery),
    brands: extractBrands(cleanQuery),
    preferences: extractPreferences(cleanQuery),
  };
}