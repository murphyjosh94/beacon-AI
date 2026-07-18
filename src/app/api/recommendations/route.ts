import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/Auth";

import {
  CreditUsageError,
  isCreditUsageError,
} from "@/lib/credits/useCredits";

import {
  executeSearch,
  isSearchExecutionError,
  SearchExecutionError,
} from "@/lib/search/executeSearch";

import {
  publishSearchPage,
} from "@/lib/search/SearchPageRepository";

import {
  BeaconEngineError,
  executeBeaconRequest,
} from "@/services/orchestrator/BeaconEngine";

import type {
  BeaconResponse,
} from "@/services/response/BeaconResponse";

type RecommendationRequestBody = {
  query?: unknown;
  displayQuery?: unknown;
};

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

function readQuery(
  value: unknown
): string {
  return (
    typeof value ===
      "string"
      ? value.trim()
      : ""
  );
}

function createErrorResponse(
  code: string,
  message: string,
  status: number,
  issues?: unknown[]
) {
  return NextResponse.json(
    {
      success:
        false,

      error: {
        code,
        message,

        ...(issues
          ? {
              issues,
            }
          : {}),
      },
    },
    {
      status,
    }
  );
}

function getResultCount(
  result: BeaconResponse
): number {
  if (
    result.responseType ===
    "recommendations"
  ) {
    return (
      result
        .recommendations
        .length
    );
  }

  return 0;
}

function getResultCategory(
  result: BeaconResponse
): string | null {
  if (
    result.responseType ===
    "recommendations"
  ) {
    return (
      result.intent
        .category ??
      null
    );
  }

  return "general";
}

function findBeaconEngineError(
  error: unknown
): BeaconEngineError | null {
  if (
    error instanceof
      BeaconEngineError
  ) {
    return error;
  }

  if (
    error instanceof
      SearchExecutionError &&
    error.cause instanceof
      BeaconEngineError
  ) {
    return error.cause;
  }

  return null;
}

function createCreditErrorResponse(
  error: CreditUsageError
) {
  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          error.code,

        message:
          error.message,
      },

      account: {
        requiredCredits:
          error.requiredCredits,

        availableCredits:
          error.availableCredits,

        dailyAllowanceRemaining:
          error
            .dailyAllowanceRemaining,

        purchasedCreditsRemaining:
          error
            .purchasedCreditsRemaining,
      },
    },
    {
      status:
        error.status,
    }
  );
}

export async function POST(
  request: Request
) {
  let body:
    RecommendationRequestBody;

  try {
    body =
      (await request.json()) as RecommendationRequestBody;
  } catch {
    return createErrorResponse(
      "invalid_request",
      "Beacon could not read this request.",
      400
    );
  }

  const query =
    readQuery(
      body.query
    );

  const displayQuery =
    readQuery(
      body.displayQuery
    ) || query;

  if (!query) {
    return createErrorResponse(
      "missing_query",
      "Please enter something for Beacon to help with.",
      400
    );
  }

  const session =
    await auth.api.getSession({
      headers:
        await headers(),
    });

  if (!session?.user?.id) {
    return createErrorResponse(
      "authentication_required",
      "Please sign in or create a free Beacon account before starting a search.",
      401
    );
  }

  try {
    const execution =
      await executeSearch<
        BeaconResponse
      >({
        userId:
          session.user.id,

        query,

        creditCost:
          1,

        creditDescription:
          `Beacon search: ${displayQuery}`,

        creditMetadata: {
          source:
            "beacon_recommendation_route",

          displayQuery,
        },

        provider:
          async ({
            query:
              providerQuery,
          }) => {
            return executeBeaconRequest(
              providerQuery
            );
          },

        serializeResult:
          (
            result
          ) => result,

        getResultCount,
      });

    const result =
      execution.result;

    let publicPath:
      string | undefined;

    if (
      result.responseType ===
        "recommendations" &&
      result.recommendations
        .length > 0
    ) {
      try {
        const publishedPage =
          await publishSearchPage({
            displayQuery,

            response:
              result,

            generatedByUserId:
              session.user.id,
          });

        publicPath =
          publishedPage.path;
      } catch (
        publicationError
      ) {
        /*
         * Publishing an SEO page is secondary to returning
         * the completed Beacon response. A publication
         * failure must not fail or refund the search.
         */
        console.error(
          "Beacon completed the search but could not publish its public page:",
          publicationError
        );
      }
    }

    const credits =
      execution.credits;

    return NextResponse.json(
      {
        success:
          true,

        data:
          result,

        searchHistoryId:
          execution
            .searchHistoryId,

        ...(publicPath
          ? {
              publicPath,
            }
          : {}),

        account: {
          allowanceTier:
            credits
              .allowanceTier,

          dailyAllowanceLimit:
            credits
              .dailyAllowanceLimit,

          dailyAllowanceUsed:
            credits
              .dailyAllowanceUsed,

          dailyAllowanceRemaining:
            credits
              .dailyAllowanceRemaining,

          purchasedCreditsUsed:
            credits
              .purchasedCreditsUsed,

          purchasedCreditsRemaining:
            credits
              .purchasedCreditsRemaining,

          creditSource:
            credits.source,

          creditCharged:
            credits
              .purchasedCreditsUsed >
            0,

          beaconPlusActive:
            credits
              .beaconPlusActive,
        },

        search: {
          category:
            getResultCategory(
              result
            ),

          responseType:
            result.responseType,

          resultCount:
            getResultCount(
              result
            ),
        },
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    if (
      isCreditUsageError(
        error
      )
    ) {
      return createCreditErrorResponse(
        error
      );
    }

    const beaconError =
      findBeaconEngineError(
        error
      );

    if (beaconError) {
      return createErrorResponse(
        beaconError.code,
        beaconError.message,
        beaconError.status,
        beaconError.issues
      );
    }

    if (
      isSearchExecutionError(
        error
      )
    ) {
      console.error(
        "Beacon search execution failed:",
        {
          code:
            error.code,

          searchHistoryId:
            error
              .searchHistoryId,

          cause:
            error.cause,
        }
      );

      return createErrorResponse(
        error.code,
        error.message,
        error.status
      );
    }

    console.error(
      "Beacon recommendation route failed:",
      error
    );

    return createErrorResponse(
      "internal_error",
      "Beacon could not complete this request. Please try again shortly.",
      500
    );
  }
}