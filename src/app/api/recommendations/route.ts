import { NextResponse } from "next/server";

import { parseSearchQuery } from "@/lib/search/SearchParser";
import { applyIntentClassification } from "@/lib/search/IntentClassifier";
import { validateSearchIntent } from "@/lib/search/SearchValidator";

import { selectBestRecommendations } from "@/lib/recommendations/RecommendationRanking";
import { buildRecommendationResponse } from "@/lib/recommendations/RecommendationExplainer";

import {
  generateRecommendations,
  RecommendationGenerationError,
} from "@/services/openai/RecommendationGenerator";

import type { RecommendationRequest } from "@/lib/recommendations/RecommendationTypes";

type RecommendationRequestBody = {
  query?: unknown;
};

function readQuery(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    let body: RecommendationRequestBody;

    try {
      body = (await request.json()) as RecommendationRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_request",
            message: "Beacon could not read this search request.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const query = readQuery(body.query);

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "missing_query",
            message: "Please enter something for Beacon to search for.",
          },
        },
        {
          status: 400,
        }
      );
    }

    let intent;

    try {
      intent = parseSearchQuery(query);
      intent = applyIntentClassification(intent);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Beacon could not understand this search.";

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_search",
            message,
          },
        },
        {
          status: 400,
        }
      );
    }

    const validation = validateSearchIntent(intent);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "validation_failed",
            message:
              validation.issues[0]?.message ??
              "Please provide more information for this search.",
            issues: validation.issues,
          },
        },
        {
          status: 400,
        }
      );
    }

    const generated = await generateRecommendations(intent);

    const recommendationRequest: RecommendationRequest = {
      intent,
      limit: 5,
    };

    const selected = selectBestRecommendations(
      generated.recommendations,
      recommendationRequest
    );

    const response = buildRecommendationResponse(intent, selected);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...response,
          aiSummary: generated.summary,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof RecommendationGenerationError) {
      const status =
        error.code === "authentication_failed"
          ? 401
          : error.code === "rate_limited"
            ? 429
            : error.code === "billing_required"
              ? 503
              : error.code === "invalid_response"
                ? 502
                : 503;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        {
          status,
        }
      );
    }

    console.error("Beacon recommendation route failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "internal_error",
          message:
            "Beacon AI could not complete this search. Please try again shortly.",
        },
      },
      {
        status: 500,
      }
    );
  }
}