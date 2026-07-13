import { NextResponse } from "next/server";

import { parseSearchQuery } from "@/lib/search/SearchParser";
import { applyIntentClassification } from "@/lib/search/IntentClassifier";
import { validateSearchIntent } from "@/lib/search/SearchValidator";

import { selectBestRecommendations } from "@/lib/recommendations/RecommendationRanking";
import { buildRecommendationResponse } from "@/lib/recommendations/RecommendationExplainer";

import { searchShoppingProducts } from "@/services/shopping/SerpApiShoppingProvider";

import {
  generateRecommendations,
  RecommendationGenerationError,
} from "@/services/openai/RecommendationGenerator";

import type {
  RecommendationCategory,
  RecommendationRequest,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type RecommendationRequestBody = {
  query?: unknown;
};

function readQuery(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function detectSelectedCategory(
  query: string
): RecommendationCategory | null {
  const normalised = query.toLowerCase();

  if (normalised.startsWith("shopping request:")) {
    return "product";
  }

  if (
    normalised.startsWith(
      "holiday and getaway request:"
    )
  ) {
    return "holiday";
  }

  if (
    normalised.startsWith(
      "entertainment and experience request:"
    )
  ) {
    return "experience";
  }

  return null;
}

function removeCategoryPrefix(query: string): string {
  return query
    .replace(/^shopping request:\s*/i, "")
    .replace(
      /^holiday and getaway request:\s*/i,
      ""
    )
    .replace(
      /^entertainment and experience request:\s*/i,
      ""
    )
    .trim();
}

function prepareIntent(
  originalQuery: string
): SearchIntent {
  const selectedCategory =
    detectSelectedCategory(originalQuery);

  const cleanQuery =
    removeCategoryPrefix(originalQuery);

  let intent = parseSearchQuery(cleanQuery);

  intent = applyIntentClassification(intent);

  if (selectedCategory) {
    intent = {
      ...intent,
      category: selectedCategory,
    };
  }

  return intent;
}

function getErrorStatus(
  error: RecommendationGenerationError
): number {
  if (error.code === "authentication_failed") {
    return 401;
  }

  if (error.code === "rate_limited") {
    return 429;
  }

  if (error.code === "billing_required") {
    return 503;
  }

  if (error.code === "invalid_response") {
    return 502;
  }

  return 503;
}

export async function POST(request: Request) {
  try {
    let body: RecommendationRequestBody;

    try {
      body =
        (await request.json()) as RecommendationRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_request",
            message:
              "Beacon could not read this search request.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const originalQuery = readQuery(body.query);

    if (!originalQuery) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "missing_query",
            message:
              "Please enter something for Beacon to search for.",
          },
        },
        {
          status: 400,
        }
      );
    }

    let intent: SearchIntent;

    try {
      intent = prepareIntent(originalQuery);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_search",
            message:
              error instanceof Error
                ? error.message
                : "Beacon could not understand this search.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const validation =
      validateSearchIntent(intent);

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

    const recommendationRequest: RecommendationRequest =
      {
        intent,
        limit: 5,
      };

    /*
     * SHOPPING
     *
     * SerpApi supplies the real products, prices,
     * retailers, images and links.
     */
    if (intent.category === "product") {
      const liveProducts =
        await searchShoppingProducts(intent, {
          limit: 30,
        });

      const selected =
        selectBestRecommendations(
          liveProducts,
          recommendationRequest,
          {
            limit: 5,
            minimumScore: 35,
            minimumTrustScore: 30,
          }
        );

      const response =
        buildRecommendationResponse(
          intent,
          selected
        );

      return NextResponse.json(
        {
          success: true,
          data: {
            ...response,
            aiSummary:
              "Beacon searched live shopping data, compared suitable products and selected the strongest matches for your request.",
            dataSource: "serpapi-google-shopping",
            liveData: true,
          },
        },
        {
          status: 200,
        }
      );
    }

    /*
     * HOLIDAYS AND ENTERTAINMENT
     *
     * These temporarily use OpenAI until the live
     * hotel, flight and entertainment providers are
     * connected.
     */
    const generated =
      await generateRecommendations(intent);

    const selected =
      selectBestRecommendations(
        generated.recommendations,
        recommendationRequest
      );

    const response =
      buildRecommendationResponse(
        intent,
        selected
      );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...response,
          aiSummary: generated.summary,
          dataSource: "openai",
          liveData: false,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (
      error instanceof
      RecommendationGenerationError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        {
          status: getErrorStatus(error),
        }
      );
    }

    console.error(
      "Beacon recommendation route failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "internal_error",
          message:
            error instanceof Error
              ? error.message
              : "Beacon AI could not complete this search. Please try again shortly.",
        },
      },
      {
        status: 500,
      }
    );
  }
}