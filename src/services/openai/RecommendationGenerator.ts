import "server-only";

import OpenAI from "openai";
import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/services/openai/OpenAIClient";
import { buildRecommendationPrompt } from "@/lib/ai/PromptBuilder";
import { calculateRecommendationScore } from "@/lib/recommendations/RecommendationScore";
import type {
  Recommendation,
  RecommendationCategory,
  RecommendationPrice,
  RecommendationSource,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type GeneratedScoreFields = {
  relevance?: unknown;
  value?: unknown;
  quality?: unknown;
  trust?: unknown;
};

type GeneratedRecommendation = {
  id?: unknown;
  category?: unknown;
  source?: unknown;
  title?: unknown;
  description?: unknown;
  reason?: unknown;
  url?: unknown;
  imageUrl?: unknown;
  merchant?: unknown;
  price?: unknown;
  scores?: GeneratedScoreFields;
  highlights?: unknown;
  warnings?: unknown;
  metadata?: unknown;
};

type GeneratedResponse = {
  summary?: unknown;
  recommendations?: unknown;
};

export type RecommendationGenerationResult = {
  summary: string;
  recommendations: Recommendation[];
};

export class RecommendationGenerationError extends Error {
  public readonly code:
    | "billing_required"
    | "rate_limited"
    | "authentication_failed"
    | "invalid_response"
    | "service_unavailable"
    | "unknown";

  constructor(
    message: string,
    code: RecommendationGenerationError["code"]
  ) {
    super(message);
    this.name = "RecommendationGenerationError";
    this.code = code;
  }
}

const ALLOWED_CATEGORIES: RecommendationCategory[] = [
  "product",
  "holiday",
  "service",
  "experience",
  "unknown",
];

const ALLOWED_SOURCES: RecommendationSource[] = [
  "affiliate",
  "merchant",
  "travel",
  "search",
  "manual",
];

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function asString(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string"
    ? value.trim()
    : fallback;
}

function asOptionalString(
  value: unknown
): string | undefined {
  const text = asString(value);

  return text || undefined;
}

function asNumber(
  value: unknown,
  fallback = 0
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }

  return fallback;
}

function asStringArray(
  value: unknown,
  maximum: number
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter(Boolean)
    .slice(0, maximum);
}

function asCategory(
  value: unknown,
  fallback: RecommendationCategory
): RecommendationCategory {
  const category = asString(value) as RecommendationCategory;

  return ALLOWED_CATEGORIES.includes(category)
    ? category
    : fallback;
}

function asSource(
  value: unknown
): RecommendationSource {
  const source = asString(value) as RecommendationSource;

  return ALLOWED_SOURCES.includes(source)
    ? source
    : "search";
}

function createStableId(
  value: unknown,
  title: string,
  index: number
): string {
  const supplied = asString(value);

  const base = supplied || title || `recommendation-${index + 1}`;

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parsePrice(
  value: unknown
): RecommendationPrice | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const amount = asNumber(value.amount, Number.NaN);

  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  return {
    amount,
    currency: "GBP",
    display:
      asString(value.display) ||
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
      }).format(amount),
  };
}

function parseMetadata(
  value: unknown
): Record<string, string | number | boolean | null> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const metadata: Record<
    string,
    string | number | boolean | null
  > = {};

  for (const [key, item] of Object.entries(value)) {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null
    ) {
      metadata[key] = item;
    }
  }

  return Object.keys(metadata).length > 0
    ? metadata
    : undefined;
}

function parseRecommendation(
  value: unknown,
  intent: SearchIntent,
  index: number
): Recommendation | null {
  if (!isRecord(value)) {
    return null;
  }

  const generated = value as GeneratedRecommendation;
  const title = asString(generated.title);

  if (!title) {
    return null;
  }

  const scoreFields = isRecord(generated.scores)
    ? generated.scores
    : {};

  const score = calculateRecommendationScore({
    relevance: asNumber(scoreFields.relevance),
    value: asNumber(scoreFields.value),
    quality: asNumber(scoreFields.quality),
    trust: asNumber(scoreFields.trust),
  });

  const url = asString(generated.url);

  return {
    id: createStableId(generated.id, title, index),
    category: asCategory(
      generated.category,
      intent.category
    ),
    source: asSource(generated.source),
    title,
    description:
      asString(generated.description) ||
      "Beacon identified this as a potentially suitable option.",
    reason:
      asString(generated.reason) ||
      "Selected because it appears relevant to your request.",
    url,
    imageUrl: asOptionalString(generated.imageUrl),
    merchant: asOptionalString(generated.merchant),
    price: parsePrice(generated.price),
    score,
    highlights: asStringArray(
      generated.highlights,
      3
    ),
    warnings: asStringArray(
      generated.warnings,
      2
    ),
    metadata: parseMetadata(generated.metadata),
  };
}

function removeCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function parseGeneratedResponse(
  outputText: string,
  intent: SearchIntent
): RecommendationGenerationResult {
  const cleaned = removeCodeFence(outputText);

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new RecommendationGenerationError(
      "Beacon received an unreadable response from the AI service.",
      "invalid_response"
    );
  }

  if (!isRecord(parsed)) {
    throw new RecommendationGenerationError(
      "Beacon received an invalid recommendation response.",
      "invalid_response"
    );
  }

  const generated = parsed as GeneratedResponse;
  const rawRecommendations = Array.isArray(
    generated.recommendations
  )
    ? generated.recommendations
    : [];

  const recommendations = rawRecommendations
    .map((item, index) =>
      parseRecommendation(item, intent, index)
    )
    .filter(
      (
        recommendation
      ): recommendation is Recommendation =>
        recommendation !== null
    )
    .slice(0, 5);

  return {
    summary:
      asString(generated.summary) ||
      "Beacon selected these recommendations based on your request.",
    recommendations,
  };
}

function mapOpenAIError(
  error: unknown
): RecommendationGenerationError {
  if (error instanceof RecommendationGenerationError) {
    return error;
  }

  if (error instanceof OpenAI.AuthenticationError) {
    return new RecommendationGenerationError(
      "Beacon AI could not authenticate with its AI service.",
      "authentication_failed"
    );
  }

  if (error instanceof OpenAI.RateLimitError) {
    const message = error.message.toLowerCase();

    if (
      message.includes("quota") ||
      message.includes("billing") ||
      message.includes("credit")
    ) {
      return new RecommendationGenerationError(
        "Beacon AI is not available yet because API billing or credit is required.",
        "billing_required"
      );
    }

    return new RecommendationGenerationError(
      "Beacon AI is receiving too many requests. Please try again shortly.",
      "rate_limited"
    );
  }

  if (
    error instanceof OpenAI.APIConnectionError ||
    error instanceof OpenAI.InternalServerError
  ) {
    return new RecommendationGenerationError(
      "Beacon AI is temporarily unavailable. Please try again shortly.",
      "service_unavailable"
    );
  }

  return new RecommendationGenerationError(
    "Beacon AI could not complete this recommendation request.",
    "unknown"
  );
}

export async function generateRecommendations(
  intent: SearchIntent
): Promise<RecommendationGenerationResult> {
  const client = getOpenAIClient();
  const model = getOpenAIModel();
  const prompt = buildRecommendationPrompt(intent);

  try {
    const response = await client.responses.create({
      model,
      instructions: prompt.system,
      input: prompt.user,
    });

    if (!response.output_text?.trim()) {
      throw new RecommendationGenerationError(
        "Beacon received an empty response from the AI service.",
        "invalid_response"
      );
    }

    return parseGeneratedResponse(
      response.output_text,
      intent
    );
  } catch (error) {
    const mappedError = mapOpenAIError(error);

    console.error("Beacon recommendation generation failed:", {
      code: mappedError.code,
      message: mappedError.message,
    });

    throw mappedError;
  }
}