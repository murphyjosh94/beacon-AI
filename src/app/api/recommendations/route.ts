import { NextResponse } from "next/server";

import { validateSearchIntent } from "@/lib/search/SearchValidator";

import { selectBestRecommendations } from "@/lib/recommendations/RecommendationRanking";
import { buildRecommendationResponse } from "@/lib/recommendations/RecommendationExplainer";

import { searchShoppingProducts } from "@/services/shopping/SerpApiShoppingProvider";
import { searchHotels } from "@/services/travel/SerpApiHotelsProvider";

import {
  answerGeneralRequest,
  GeneralAnswerError,
} from "@/services/openai/GeneralAnswerProvider";

import {
  extractSearchIntent,
  type ExtractedSearchIntent,
} from "@/services/openai/SearchIntentExtractor";

import type {
  RecommendationCategory,
  RecommendationRequest,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type RecommendationRequestBody = {
  query?: unknown;
};

type DateRange = {
  startDate: string;
  endDate: string;
  explanation?: string;
};

function readQuery(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function detectCategoryHint(
  query: string
): RecommendationCategory | null {
  const normalised =
    query.toLowerCase();

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

function addDays(
  date: Date,
  days: number
): Date {
  const result = new Date(date);

  result.setUTCDate(
    result.getUTCDate() + days
  );

  return result;
}

function toIsoDate(date: Date): string {
  return date
    .toISOString()
    .slice(0, 10);
}

function createDateRange(
  start: Date,
  nights: number,
  explanation?: string
): DateRange {
  const safeNights =
    Number.isFinite(nights) &&
    nights > 0
      ? Math.min(
          Math.floor(nights),
          30
        )
      : 3;

  return {
    startDate: toIsoDate(start),

    endDate: toIsoDate(
      addDays(start, safeNights)
    ),

    explanation,
  };
}

function resolveFlexibleMonth(
  flexibleMonth: string,
  nights: number
): DateRange | null {
  const match =
    flexibleMonth.match(
      /^(\d{4})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const today = new Date();

  const firstPossibleDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        7
      )
    );

  const start =
    firstPossibleDate > today
      ? firstPossibleDate
      : new Date(
          Date.UTC(
            year,
            month - 1,
            21
          )
        );

  return createDateRange(
    start,
    nights,
    `Beacon used a representative ${nights}-night stay during ${flexibleMonth} because exact dates were not supplied.`
  );
}

function resolveHotelDates(
  extracted: ExtractedSearchIntent
): DateRange {
  const { intent } = extracted;

  if (
    intent.startDate &&
    intent.endDate
  ) {
    return {
      startDate: intent.startDate,
      endDate: intent.endDate,
    };
  }

  const stayLength =
    extracted.stayLengthNights ?? 3;

  if (extracted.flexibleMonth) {
    const monthRange =
      resolveFlexibleMonth(
        extracted.flexibleMonth,
        stayLength
      );

    if (monthRange) {
      return monthRange;
    }
  }

  const start = addDays(
    new Date(),
    14
  );

  return createDateRange(
    start,
    stayLength,
    `Beacon used a representative ${stayLength}-night stay beginning in two weeks because exact travel dates were not supplied.`
  );
}

function createRecommendationRequest(
  intent: SearchIntent
): RecommendationRequest {
  return {
    intent,
    limit: 5,
  };
}

function validateRecommendationIntent(
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
          validation.issues[0]
            ?.message ??
          "Please provide more information for this search.",

        issues:
          validation.issues,
      },
    },
    {
      status: 400,
    }
  );
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
    error.code ===
    "rate_limited"
  ) {
    return 429;
  }

  if (
    error.code ===
    "billing_required"
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

function createAssumptionSummary(
  assumptions: string[],
  dateExplanation?: string
): string | undefined {
  const items = [
    ...assumptions,
    ...(dateExplanation
      ? [dateExplanation]
      : []),
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return undefined;
  }

  return items.join(" ");
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

    const categoryHint =
      detectCategoryHint(
        originalQuery
      );

    const extracted =
      await extractSearchIntent(
        cleanQuery,
        {
          categoryHint,
        }
      );

    /*
     * LIVE SHOPPING
     */
    if (
      extracted.requestType ===
      "shopping"
    ) {
      const intent: SearchIntent = {
        ...extracted.intent,
        category: "product",
      };

      const validationError =
        validateRecommendationIntent(
          intent
        );

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
          createRecommendationRequest(
            intent
          ),
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

      return NextResponse.json({
        success: true,

        data: {
          responseType:
            "recommendations",

          ...response,

          aiSummary:
            "Beacon understood your request, searched live shopping data and selected the strongest matching products.",

          assumptions:
            extracted.assumptions,

          dataSource:
            "serpapi-google-shopping",

          liveData: true,
        },
      });
    }

    /*
     * LIVE HOTELS
     */
    if (
      extracted.requestType ===
      "hotel"
    ) {
      if (
        !extracted.intent.destination
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code:
                "missing_destination",

              message:
                "Please include the destination or area you would like Beacon to search.",
            },
          },
          {
            status: 400,
          }
        );
      }

      const dateRange =
        resolveHotelDates(extracted);

      const intent: SearchIntent = {
        ...extracted.intent,

        category: "holiday",

        startDate:
          dateRange.startDate,

        endDate:
          dateRange.endDate,

        travellers:
          extracted.intent
            .travellers ?? {
            adults: 2,
            children: 0,
          },
      };

      const validationError =
        validateRecommendationIntent(
          intent
        );

      if (validationError) {
        return validationError;
      }

      const liveHotels =
        await searchHotels(
          intent,
          {
            limit: 30,

            checkInDate:
              dateRange.startDate,

            checkOutDate:
              dateRange.endDate,
          }
        );

      const selected =
        selectBestRecommendations(
          liveHotels,
          createRecommendationRequest(
            intent
          ),
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

      const assumptionSummary =
        createAssumptionSummary(
          extracted.assumptions,
          dateRange.explanation
        );

      return NextResponse.json({
        success: true,

        data: {
          responseType:
            "recommendations",

          ...response,

          aiSummary:
            assumptionSummary
              ? `Beacon searched live hotel data and selected the strongest matches. ${assumptionSummary}`
              : "Beacon searched live hotel data and selected the strongest matches for your trip.",

          assumptions: [
            ...extracted.assumptions,

            ...(dateRange.explanation
              ? [
                  dateRange.explanation,
                ]
              : []),
          ],

          searchedDates: {
            checkIn:
              dateRange.startDate,

            checkOut:
              dateRange.endDate,
          },

          dataSource:
            "serpapi-google-hotels",

          liveData: true,
        },
      });
    }

    /*
     * FLIGHTS
     *
     * Until the live flight provider is connected,
     * Beacon gives a useful researched answer.
     */
    if (
      extracted.requestType ===
      "flight"
    ) {
      const flightAnswer =
        await answerGeneralRequest(
          `${cleanQuery}

Explain that live flight comparison is being connected. Still help with suitable airports, likely route options, date flexibility and practical booking considerations. Do not invent live fares or availability.`
        );

      return NextResponse.json({
        success: true,

        data: {
          responseType:
            "general_answer",

          query: cleanQuery,

          generalAnswer:
            flightAnswer.answer,

          usedWebSearch:
            flightAnswer.usedWebSearch,

          generatedAt:
            new Date().toISOString(),

          recommendations: [],

          dataSource:
            flightAnswer.usedWebSearch
              ? "openai-web-search"
              : "openai",

          liveData:
            flightAnswer.usedWebSearch,
        },
      });
    }

    /*
     * GENERAL BEACON ANSWER
     */
    const generalResult =
      await answerGeneralRequest(
        cleanQuery
      );

    return NextResponse.json({
      success: true,

      data: {
        responseType:
          "general_answer",

        query: cleanQuery,

        generalAnswer:
          generalResult.answer,

        usedWebSearch:
          generalResult.usedWebSearch,

        generatedAt:
          new Date().toISOString(),

        recommendations: [],

        dataSource:
          generalResult.usedWebSearch
            ? "openai-web-search"
            : "openai",

        liveData:
          generalResult.usedWebSearch,
      },
    });
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