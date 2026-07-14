import "server-only";

import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/services/openai/OpenAIClient";

import { parseSearchQuery } from "@/lib/search/SearchParser";
import { applyIntentClassification } from "@/lib/search/IntentClassifier";

import type {
  RecommendationCategory,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

export type BeaconRequestType =
  | "shopping"
  | "hotel"
  | "flight"
  | "general";

export type ExtractedSearchIntent = {
  requestType: BeaconRequestType;
  intent: SearchIntent;
  flexibleMonth?: string;
  stayLengthNights?: number;
  objective?: string;
  assumptions: string[];
};

type ExtractorOptions = {
  categoryHint?: RecommendationCategory | null;
};

type ModelIntent = {
  requestType?: unknown;
  category?: unknown;
  destination?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  flexibleMonth?: unknown;
  stayLengthNights?: unknown;
  budgetMin?: unknown;
  budgetMax?: unknown;
  adults?: unknown;
  children?: unknown;
  keywords?: unknown;
  preferences?: unknown;
  exclusions?: unknown;
  objective?: unknown;
  assumptions?: unknown;
};

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();

  return cleaned || undefined;
}

function readNumber(value: unknown): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return value;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function readRequestType(
  value: unknown
): BeaconRequestType {
  if (
    value === "shopping" ||
    value === "hotel" ||
    value === "flight" ||
    value === "general"
  ) {
    return value;
  }

  return "general";
}

function readCategory(
  value: unknown,
  requestType: BeaconRequestType,
  fallback: RecommendationCategory
): RecommendationCategory {
  if (
    value === "product" ||
    value === "holiday" ||
    value === "experience" ||
    value === "service" ||
    value === "unknown"
  ) {
    return value;
  }

  if (requestType === "shopping") {
    return "product";
  }

  if (
    requestType === "hotel" ||
    requestType === "flight"
  ) {
    return "holiday";
  }

  return fallback;
}

function extractJsonObject(
  text: string
): ModelIntent {
  const trimmed = text.trim();

  const withoutCodeFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace =
    withoutCodeFence.indexOf("{");

  const lastBrace =
    withoutCodeFence.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace < firstBrace
  ) {
    throw new Error(
      "Beacon could not read the structured search intent."
    );
  }

  return JSON.parse(
    withoutCodeFence.slice(
      firstBrace,
      lastBrace + 1
    )
  ) as ModelIntent;
}

function createFallbackIntent(
  query: string,
  categoryHint?: RecommendationCategory | null
): SearchIntent {
  let fallback =
    parseSearchQuery(query);

  fallback =
    applyIntentClassification(fallback);

  if (categoryHint) {
    fallback = {
      ...fallback,
      category: categoryHint,
    };
  }

  return fallback;
}

export async function extractSearchIntent(
  query: string,
  options: ExtractorOptions = {}
): Promise<ExtractedSearchIntent> {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) {
    throw new Error(
      "A search request is required."
    );
  }

  const fallback =
    createFallbackIntent(
      cleanedQuery,
      options.categoryHint
    );

  const currentDate =
    new Date().toISOString().slice(0, 10);

  try {
    const client = getOpenAIClient();

    const response =
      await client.responses.create({
        model: getOpenAIModel(),

        instructions: `
You extract structured intent for Beacon AI.

Today's date is ${currentDate}.
The user is in the United Kingdom unless stated otherwise.

Return one valid JSON object only. Do not include markdown.

Required JSON shape:

{
  "requestType": "shopping" | "hotel" | "flight" | "general",
  "category": "product" | "holiday" | "experience" | "service" | "unknown",
  "destination": string | null,
  "startDate": "YYYY-MM-DD" | null,
  "endDate": "YYYY-MM-DD" | null,
  "flexibleMonth": "YYYY-MM" | null,
  "stayLengthNights": number | null,
  "budgetMin": number | null,
  "budgetMax": number | null,
  "adults": number | null,
  "children": number | null,
  "keywords": string[],
  "preferences": string[],
  "exclusions": string[],
  "objective": string | null,
  "assumptions": string[]
}

Rules:

- Product searches use requestType "shopping".
- Hotel, accommodation, cottage, resort and stay searches use "hotel".
- Flight and airline searches use "flight".
- Advice, explanations, planning and ordinary questions use "general".
- Understand natural language, misspellings and missing words.
- "Hotels near Wales 12 August 2026 to 19 August 2026" means Wales with those exact dates.
- "Hotel in Tenerife 12/08/2026 to 19/08/2026" uses UK day/month/year order.
- "Family hotel near Cardiff 12th to 19th August" means the next future August.
- "Hotel in Barcelona in July" should set flexibleMonth to the next future July.
- Do not invent an exact destination.
- If dates are flexible, use flexibleMonth instead of inventing exact dates.
- Prices are GBP unless another currency is clearly stated.
- Return concise assumptions whenever a year, number of guests or stay length has been inferred.
        `.trim(),

        input: cleanedQuery,
      });

    const modelIntent =
      extractJsonObject(
        response.output_text ?? ""
      );

    const requestType =
      readRequestType(
        modelIntent.requestType
      );

    const category = readCategory(
      modelIntent.category,
      requestType,
      fallback.category
    );

    const adults =
      readNumber(modelIntent.adults);

    const children =
      readNumber(modelIntent.children);

    const modelKeywords =
      readStringArray(
        modelIntent.keywords
      );

    const intent: SearchIntent = {
      ...fallback,

      rawQuery: cleanedQuery,
      category,

      destination:
        readString(
          modelIntent.destination
        ) ?? fallback.destination,

      startDate:
        readString(
          modelIntent.startDate
        ) ?? fallback.startDate,

      endDate:
        readString(
          modelIntent.endDate
        ) ?? fallback.endDate,

      budgetMin:
        readNumber(
          modelIntent.budgetMin
        ) ?? fallback.budgetMin,

      budgetMax:
        readNumber(
          modelIntent.budgetMax
        ) ?? fallback.budgetMax,

      travellers:
        adults !== undefined ||
        children !== undefined
          ? {
              adults: adults ?? 2,
              children: children ?? 0,
            }
          : fallback.travellers,

      keywords:
        modelKeywords.length > 0
          ? modelKeywords
          : fallback.keywords,

      preferences: Array.from(
        new Set([
          ...fallback.preferences,
          ...readStringArray(
            modelIntent.preferences
          ),
        ])
      ),

      exclusions: Array.from(
        new Set([
          ...fallback.exclusions,
          ...readStringArray(
            modelIntent.exclusions
          ),
        ])
      ),
    };

    return {
      requestType,
      intent,

      flexibleMonth:
        readString(
          modelIntent.flexibleMonth
        ),

      stayLengthNights:
        readNumber(
          modelIntent.stayLengthNights
        ),

      objective:
        readString(
          modelIntent.objective
        ),

      assumptions:
        readStringArray(
          modelIntent.assumptions
        ),
    };
  } catch (error) {
    console.error(
      "Beacon intent extraction fell back to the local parser:",
      error
    );

    const requestType: BeaconRequestType =
      fallback.category === "product"
        ? "shopping"
        : fallback.category === "holiday"
          ? "hotel"
          : "general";

    return {
      requestType,
      intent: fallback,
      assumptions: [],
    };
  }
}