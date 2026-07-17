import "server-only";

import OpenAI from "openai";

import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/services/openai/OpenAIClient";

import type {
  Recommendation,
  RecommendationCategory,
  RecommendationPrice,
  RecommendationScore,
  RecommendationSource,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

import type {
  BeaconCapability,
} from "@/services/intelligence/IntentEngine";

export type GuidedRecommendationResult = {
  summary: string;
  recommendations: Recommendation[];
  usedWebSearch: boolean;
};

export class GuidedRecommendationError extends Error {
  public readonly code:
    | "billing_required"
    | "authentication_failed"
    | "rate_limited"
    | "service_unavailable"
    | "invalid_response"
    | "unknown";

  constructor(
    message: string,
    code: GuidedRecommendationError["code"]
  ) {
    super(message);
    this.name =
      "GuidedRecommendationError";
    this.code = code;
  }
}

type ModelPrice = {
  amount?: unknown;
  display?: unknown;
};

type ModelScore = {
  overall?: unknown;
  relevance?: unknown;
  value?: unknown;
  quality?: unknown;
  trust?: unknown;
};

type ModelRecommendation = {
  title?: unknown;
  description?: unknown;
  reason?: unknown;
  url?: unknown;
  imageUrl?: unknown;
  merchant?: unknown;
  price?: unknown;
  score?: unknown;
  highlights?: unknown;
  warnings?: unknown;
};

type ModelRecommendationResponse = {
  summary?: unknown;
  recommendations?: unknown;
};

function mapOpenAIError(
  error: unknown
): GuidedRecommendationError {
  if (
    error instanceof
    GuidedRecommendationError
  ) {
    return error;
  }

  if (
    error instanceof
    OpenAI.AuthenticationError
  ) {
    return new GuidedRecommendationError(
      "Beacon could not authenticate with its AI service.",
      "authentication_failed"
    );
  }

  if (
    error instanceof
    OpenAI.RateLimitError
  ) {
    const message =
      error.message.toLowerCase();

    if (
      message.includes("quota") ||
      message.includes("billing") ||
      message.includes("credit")
    ) {
      return new GuidedRecommendationError(
        "Beacon AI currently needs additional API credit.",
        "billing_required"
      );
    }

    return new GuidedRecommendationError(
      "Beacon is receiving too many requests. Please try again shortly.",
      "rate_limited"
    );
  }

  if (
    error instanceof
      OpenAI.APIConnectionError ||
    error instanceof
      OpenAI.InternalServerError
  ) {
    return new GuidedRecommendationError(
      "Beacon AI is temporarily unavailable. Please try again shortly.",
      "service_unavailable"
    );
  }

  return new GuidedRecommendationError(
    "Beacon could not complete this recommendation request.",
    "unknown"
  );
}

function readString(
  value: unknown,
  maximumLength: number
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function readOptionalString(
  value: unknown,
  maximumLength: number
): string | undefined {
  const cleaned =
    readString(
      value,
      maximumLength
    );

  return cleaned || undefined;
}

function readStringArray(
  value: unknown,
  maximumItems: number,
  maximumLength: number
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      readString(
        item,
        maximumLength
      )
    )
    .filter(Boolean)
    .slice(0, maximumItems);
}

function readNumber(
  value: unknown
): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return value;
}

function clampScore(
  value: unknown,
  fallback: number
): number {
  const numeric =
    readNumber(value);

  if (
    numeric === undefined
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(numeric)
    )
  );
}

function readPrice(
  value: unknown
): RecommendationPrice | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  const price =
    value as ModelPrice;

  const amount =
    readNumber(price.amount);

  if (
    amount === undefined ||
    amount < 0
  ) {
    return undefined;
  }

  const display =
    readOptionalString(
      price.display,
      80
    ) ??
    new Intl.NumberFormat(
      "en-GB",
      {
        style: "currency",
        currency: "GBP",
      }
    ).format(amount);

  return {
    amount,
    currency: "GBP",
    display,
  };
}

function readScore(
  value: unknown,
  index: number
): RecommendationScore {
  const score =
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
      ? value as ModelScore
      : {};

  const fallbackOverall =
    Math.max(
      58,
      84 - index * 4
    );

  return {
    overall:
      clampScore(
        score.overall,
        fallbackOverall
      ),

    relevance:
      clampScore(
        score.relevance,
        fallbackOverall
      ),

    value:
      clampScore(
        score.value,
        Math.max(
          50,
          fallbackOverall - 5
        )
      ),

    quality:
      clampScore(
        score.quality,
        fallbackOverall
      ),

    trust:
      clampScore(
        score.trust,
        65
      ),
  };
}

function extractJsonObject(
  text: string
): ModelRecommendationResponse {
  const trimmed =
    text.trim();

  const withoutCodeFence =
    trimmed
      .replace(
        /^```(?:json)?\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      )
      .trim();

  const firstBrace =
    withoutCodeFence.indexOf(
      "{"
    );

  const lastBrace =
    withoutCodeFence.lastIndexOf(
      "}"
    );

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace < firstBrace
  ) {
    throw new GuidedRecommendationError(
      "Beacon could not read the structured recommendation response.",
      "invalid_response"
    );
  }

  try {
    return JSON.parse(
      withoutCodeFence.slice(
        firstBrace,
        lastBrace + 1
      )
    ) as ModelRecommendationResponse;
  } catch {
    throw new GuidedRecommendationError(
      "Beacon received malformed recommendation data.",
      "invalid_response"
    );
  }
}

function getCategory(
  capability: BeaconCapability
): RecommendationCategory {
  switch (capability) {
    case "product_search":
    case "vehicle_parts":
    case "vehicle_accessories":
    case "vehicle_search":
      return "product";

    case "hotel_discovery":
    case "hotel_availability":
    case "package_holiday":
    case "flights":
    case "flight_and_hotel":
    case "travel_ideas":
    case "weekend_plan":
    case "sports_travel":
      return "holiday";

    case "restaurants":
    case "local_services":
    case "places":
      return "service";

    case "activities":
    case "tickets":
    case "events":
    case "experiences":
      return "experience";

    default:
      return "unknown";
  }
}

function getSource(
  capability: BeaconCapability
): RecommendationSource {
  switch (capability) {
    case "hotel_discovery":
    case "hotel_availability":
    case "package_holiday":
    case "flights":
    case "flight_and_hotel":
    case "travel_ideas":
    case "weekend_plan":
    case "sports_travel":
      return "travel";

    default:
      return "search";
  }
}

function getCapabilityInstructions(
  capability: BeaconCapability
): string {
  switch (capability) {
    case "travel_ideas":
      return "Recommend five distinct destinations. Each destination must be its own recommendation object.";

    case "hotel_discovery":
      return "Recommend up to five real accommodation options or clearly labelled accommodation areas. Each option must be its own recommendation object.";

    case "package_holiday":
      return "Recommend up to five distinct package-holiday options or realistic package styles. Do not claim a package is live or bookable unless current web evidence supports it.";

    case "flight_and_hotel":
      return "Recommend up to five distinct flight-and-hotel approaches or combinations. Do not claim separately sourced items form a single bookable package.";

    case "flights":
      return "Recommend up to five distinct routes, airlines or booking approaches. Each must be its own recommendation object.";

    case "restaurants":
      return "Recommend up to five distinct restaurants. Include cuisine, atmosphere and an honest price indication where available.";

    case "activities":
      return "Recommend up to five distinct attractions or activities.";

    case "local_services":
      return "Recommend up to five distinct service providers or service-selection options. Do not invent businesses.";

    case "places":
      return "Recommend up to five distinct places. Each place must be its own recommendation object.";

    case "weekend_plan":
      return "Create up to five distinct bookable or visitable options that together support the requested weekend. Do not return a prose itinerary.";

    case "tickets":
    case "events":
    case "experiences":
    case "sports_travel":
      return "Recommend up to five distinct current options. Each event, ticket, experience or sports-travel option must be its own recommendation object.";

    default:
      return "Return up to five distinct recommendation objects.";
  }
}

function buildIntentContext(
  intent: SearchIntent
): string {
  return JSON.stringify({
    category:
      intent.category,

    destination:
      intent.destination ??
      null,

    location:
      intent.location ??
      null,

    startDate:
      intent.startDate ??
      null,

    endDate:
      intent.endDate ??
      null,

    budgetMin:
      intent.budgetMin ??
      null,

    budgetMax:
      intent.budgetMax ??
      null,

    travellers:
      intent.travellers ??
      null,

    keywords:
      intent.keywords,

    preferences:
      intent.preferences,

    exclusions:
      intent.exclusions,
  });
}

function createRecommendationId(
  capability: BeaconCapability,
  index: number,
  title: string
): string {
  const slug =
    title
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(0, 50) ||
    `option-${index + 1}`;

  return [
    capability,
    index + 1,
    slug,
  ].join("-");
}

function mapRecommendation(
  value: unknown,
  capability: BeaconCapability,
  index: number
): Recommendation | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const model =
    value as ModelRecommendation;

  const title =
    readString(
      model.title,
      140
    );

  const description =
    readString(
      model.description,
      500
    );

  const reason =
    readString(
      model.reason,
      500
    );

  if (
    !title ||
    !description ||
    !reason
  ) {
    return null;
  }

  const url =
    readString(
      model.url,
      1_000
    );

  const safeUrl =
    /^https?:\/\//i.test(url)
      ? url
      : "";

  const imageUrl =
    readOptionalString(
      model.imageUrl,
      1_000
    );

  const safeImageUrl =
    imageUrl &&
    /^https?:\/\//i.test(
      imageUrl
    )
      ? imageUrl
      : undefined;

  const price =
    readPrice(
      model.price
    );

  const highlights =
    readStringArray(
      model.highlights,
      6,
      160
    );

  const warnings =
    readStringArray(
      model.warnings,
      5,
      200
    );

  return {
    id:
      createRecommendationId(
        capability,
        index,
        title
      ),

    category:
      getCategory(
        capability
      ),

    source:
      getSource(
        capability
      ),

    title,
    description,
    reason,

    url:
      safeUrl,

    imageUrl:
      safeImageUrl,

    merchant:
      readOptionalString(
        model.merchant,
        120
      ),

    price,

    score:
      readScore(
        model.score,
        index
      ),

    highlights:
      highlights.length > 0
        ? highlights
        : [
            "Relevant to the request",
            "Selected as a distinct option",
          ],

    warnings:
      warnings.length > 0
        ? warnings
        : undefined,

    metadata: {
      capability,
      generatedBy:
        "openai_guided_recommendations",
    },
  };
}

export async function generateGuidedRecommendations(
  query: string,
  capability: BeaconCapability,
  intent: SearchIntent
): Promise<GuidedRecommendationResult> {
  const cleanedQuery =
    query.trim();

  if (!cleanedQuery) {
    throw new GuidedRecommendationError(
      "A recommendation request is required.",
      "invalid_response"
    );
  }

  const client =
    getOpenAIClient();

  try {
    const response =
      await client.responses.create({
        model:
          getOpenAIModel(),

        instructions: `
You are Beacon AI's structured recommendation engine.

Use British English and GBP.

The user must receive separate recommendation cards, never an essay.

Return one valid JSON object only. Do not include markdown, headings, commentary or text outside the JSON.

Required JSON shape:

{
  "summary": "A concise overview of no more than 45 words.",
  "recommendations": [
    {
      "title": "Distinct option name",
      "description": "Two or three concise sentences.",
      "reason": "Why this option matches the user's request.",
      "url": "A verified current http or https URL, or an empty string.",
      "imageUrl": "A verified image URL, or an empty string.",
      "merchant": "Provider, venue, airline, hotel or source name, or an empty string.",
      "price": {
        "amount": 0,
        "display": "£0"
      },
      "score": {
        "overall": 0,
        "relevance": 0,
        "value": 0,
        "quality": 0,
        "trust": 0
      },
      "highlights": ["Short highlight"],
      "warnings": ["Important check or limitation"]
    }
  ]
}

Rules:

- Return between 1 and 5 recommendations.
- Every recommendation must be a separate object.
- Never combine all options into one description.
- Never produce a numbered prose list.
- Never include raw markdown links in descriptions, reasons, highlights or warnings.
- Use web search for current destinations, businesses, events, prices, routes, opening information and availability.
- Never invent a URL, business, venue, price, rating, event, hotel, flight, availability or booking status.
- Use an empty URL when no reliable destination page is found.
- Omit price by setting it to null when no reliable price is available.
- Scores must be whole numbers from 0 to 100.
- Keep descriptions and reasons concise enough for cards.
- State uncertainty or checks in warnings.
- Do not claim Beacon booked, contacted or reserved anything.
- ${getCapabilityInstructions(
          capability
        )}

Structured intent:
${buildIntentContext(
          intent
        )}
        `.trim(),

        input:
          cleanedQuery,

        tools: [
          {
            type:
              "web_search",
          },
        ],
      });

    const parsed =
      extractJsonObject(
        response.output_text ??
        ""
      );

    const values =
      Array.isArray(
        parsed.recommendations
      )
        ? parsed.recommendations
        : [];

    const recommendations =
      values
        .map(
          (value, index) =>
            mapRecommendation(
              value,
              capability,
              index
            )
        )
        .filter(
          (
            recommendation
          ): recommendation is Recommendation =>
            Boolean(
              recommendation
            )
        )
        .slice(0, 5);

    if (
      recommendations.length ===
      0
    ) {
      throw new GuidedRecommendationError(
        "Beacon did not receive any usable recommendation cards.",
        "invalid_response"
      );
    }

    const summary =
      readString(
        parsed.summary,
        320
      ) ||
      `${recommendations.length} distinct options selected for this request.`;

    const usedWebSearch =
      response.output.some(
        (item) =>
          item.type ===
          "web_search_call"
      );

    return {
      summary,
      recommendations,
      usedWebSearch,
    };
  } catch (error) {
    throw mapOpenAIError(
      error
    );
  }
}