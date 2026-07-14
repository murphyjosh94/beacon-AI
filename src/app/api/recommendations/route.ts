import { NextResponse } from "next/server";

import { parseSearchQuery } from "@/lib/search/SearchParser";
import { applyIntentClassification } from "@/lib/search/IntentClassifier";
import { validateSearchIntent } from "@/lib/search/SearchValidator";

import { selectBestRecommendations } from "@/lib/recommendations/RecommendationRanking";
import { buildRecommendationResponse } from "@/lib/recommendations/RecommendationExplainer";

import { searchShoppingProducts } from "@/services/shopping/SerpApiShoppingProvider";
import { searchHotels } from "@/services/travel/SerpApiHotelsProvider";

import {
  answerGeneralRequest,
  GeneralAnswerError,
} from "@/services/openai/GeneralAnswerProvider";

import type {
  RecommendationCategory,
  RecommendationRequest,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type RecommendationRequestBody = {
  query?: unknown;
};

function readQuery(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function detectSelectedCategory(
  query: string
): RecommendationCategory | null {
  const normalised = query.toLowerCase();

  if (
    normalised.startsWith(
      "shopping request:"
    )
  ) {
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

function removeCategoryPrefix(
  query: string
): string {
  return query
    .replace(
      /^shopping request:\s*/i,
      ""
    )
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

  let intent =
    parseSearchQuery(cleanQuery);

  intent =
    applyIntentClassification(intent);

  if (selectedCategory) {
    intent = {
      ...intent,
      category: selectedCategory,
    };
  }

  return intent;
}

function createRecommendationRequest(
  intent: SearchIntent
): RecommendationRequest {
  return {
    intent,
    limit: 5,
  };
}

function getGeneralAnswerStatus(
  error: GeneralAnswerError
): number {
  if (
    error.code ===
    "authentication_failed"
  ) {
    return 401;
  }

  if (
    error.code === "rate_limited"
  ) {
    return 429;
  }

  if (
    error.code === "billing_required"
  ) {
    return 503;
  }

  if (
    error.code ===
    "invalid_response"
  ) {
    return 502;
  }

  return 503;
}

function createValidationError(
  intent: SearchIntent
) {
  const validation =
    validateSearchIntent(intent);

  if (validation.valid) {
    return null;
  }

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

export async function POST(
  request: Request
) {
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
              "Beacon could not read this request.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const originalQuery =
      readQuery(body.query);

    if (!originalQuery) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "missing_query",
            message:
              "Please enter something for Beacon to help with.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const cleanQuery =
      removeCategoryPrefix(
        originalQuery
      );

    let intent: SearchIntent;

    try {
      intent =
        prepareIntent(originalQuery);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_search",
            message:
              error instanceof Error
                ? error.message
                : "Beacon could not understand this request.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const recommendationRequest =
      createRecommendationRequest(
        intent
      );

    /*
     * LIVE SHOPPING
     */
    if (
      intent.category === "product"
    ) {
      const validationError =
        createValidationError(intent);

      if (validationError) {
        return validationError;
      }

      const liveProducts =
        await searchShoppingProducts(
          intent,
          {
            limit: 30,
          }
        );

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
            responseType:
              "recommendations",
            ...response,
            aiSummary:
              "Beacon searched live shopping data and selected the strongest matching products.",
            dataSource:
              "serpapi-google-shopping",
            liveData: true,
          },
        },
        {
          status: 200,
        }
      );
    }

    /*
     * LIVE HOTELS
     */
    if (
      intent.category === "holiday"
    ) {
      if (!intent.destination) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code:
                "missing_destination",
              message:
                "Please include the destination you would like Beacon to search.",
            },
          },
          {
            status: 400,
          }
        );
      }

      if (
        !intent.startDate ||
        !intent.endDate
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code:
                "missing_travel_dates",
              message:
                "Please include exact check-in and check-out dates, for example: 12 August 2026 to 19 August 2026.",
            },
          },
          {
            status: 400,
          }
        );
      }

      const validationError =
        createValidationError(intent);

      if (validationError) {
        return validationError;
      }

      const liveHotels =
        await searchHotels(
          intent,
          {
            limit: 30,
          }
        );

      const selected =
        selectBestRecommendations(
          liveHotels,
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
            responseType:
              "recommendations",
            ...response,
            aiSummary:
              "Beacon searched live hotel data and selected the strongest matches for your trip.",
            dataSource:
              "serpapi-google-hotels",
            liveData: true,
          },
        },
        {
          status: 200,
        }
      );
    }

    /*
     * GENERAL BEACON ANSWER
     *
     * Handles advice, explanations,
     * planning, entertainment, services,
     * comparisons and general questions.
     */
    const generalResult =
      await answerGeneralRequest(
        cleanQuery
      );

    return NextResponse.json(
      {
        success: true,
        data: {
          responseType:
            "general_answer",
          query: cleanQuery,
          generalAnswer:
            generalResult.answer,
          usedWebSearch:
            generalResult.usedWebSearch,
          dataSource:
            generalResult.usedWebSearch
              ? "openai-web-search"
              : "openai",
          liveData:
            generalResult.usedWebSearch,
          generatedAt:
            new Date().toISOString(),
          recommendations: [],
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (
      error instanceof
      GeneralAnswerError
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
          status:
            getGeneralAnswerStatus(
              error
            ),
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
              : "Beacon could not complete this request. Please try again shortly.",
        },
      },
      {
        status: 500,
      }
    );
  }
}