import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  and,
  count,
  eq,
  gt,
  gte,
  lt,
  sql,
} from "drizzle-orm";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";

import {
  creditLedger,
  searchHistory,
  user,
} from "@/lib/database/schema";

import {
  BeaconEngineError,
  executeBeaconRequest,
} from "@/services/orchestrator/BeaconEngine";

import {
  publishSearchPage,
} from "@/lib/search/SearchPageRepository";

import type {
  BeaconResponse,
} from "@/services/response/BeaconResponse";

type RecommendationRequestBody = {
  query?: unknown;
  displayQuery?: unknown;
};

type AuthenticatedAccount = {
  id: string;
  purchasedCredits: number;
  beaconPlusActive: boolean;
};

type SearchChargeReservation = {
  charged: boolean;
  balanceAfter?: number;
};

const FREE_DAILY_SEARCH_LIMIT = 5;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readQuery(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function createErrorResponse(
  code: string,
  message: string,
  status: number,
  issues?: unknown[]
) {
  return NextResponse.json(
    {
      success: false,

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

function getUtcDayRange(): {
  start: Date;
  end: Date;
} {
  const now =
    new Date();

  const start =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );

  const end =
    new Date(start);

  end.setUTCDate(
    end.getUTCDate() + 1
  );

  return {
    start,
    end,
  };
}

async function getAuthenticatedAccount(): Promise<
  AuthenticatedAccount | null
> {
  const session =
    await auth.api.getSession({
      headers:
        await headers(),
    });

  if (!session?.user) {
    return null;
  }

  const accountRows =
    await database
      .select({
        id:
          user.id,

        purchasedCredits:
          user.purchasedCredits,

        beaconPlusActive:
          user.beaconPlusActive,
      })
      .from(user)
      .where(
        eq(
          user.id,
          session.user.id
        )
      )
      .limit(1);

  return (
    accountRows[0] ??
    null
  );
}

async function countCompletedSearchesToday(
  userId: string
): Promise<number> {
  const {
    start,
    end,
  } =
    getUtcDayRange();

  const rows =
    await database
      .select({
        total:
          count(),
      })
      .from(
        searchHistory
      )
      .where(
        and(
          eq(
            searchHistory.userId,
            userId
          ),

          eq(
            searchHistory.status,
            "completed"
          ),

          gte(
            searchHistory.createdAt,
            start
          ),

          lt(
            searchHistory.createdAt,
            end
          )
        )
      );

  return Number(
    rows[0]?.total ??
      0
  );
}

async function createStartedSearch(
  userId: string,
  query: string
): Promise<string> {
  const rows =
    await database
      .insert(
        searchHistory
      )
      .values({
        userId,

        query,

        status:
          "started",

        resultCount: 0,

        creditCharged:
          false,
      })
      .returning({
        id:
          searchHistory.id,
      });

  const searchId =
    rows[0]?.id;

  if (!searchId) {
    throw new Error(
      "Beacon could not create the search-history record."
    );
  }

  return searchId;
}

async function reservePurchasedCredit(
  account: AuthenticatedAccount,
  searchHistoryId: string
): Promise<SearchChargeReservation> {
  if (
    account.beaconPlusActive
  ) {
    return {
      charged: false,
    };
  }

  const completedToday =
    await countCompletedSearchesToday(
      account.id
    );

  if (
    completedToday <
    FREE_DAILY_SEARCH_LIMIT
  ) {
    return {
      charged: false,
    };
  }

  const updatedAccounts =
    await database
      .update(user)
      .set({
        purchasedCredits:
          sql`${user.purchasedCredits} - 1`,

        updatedAt:
          new Date(),
      })
      .where(
        and(
          eq(
            user.id,
            account.id
          ),

          gt(
            user.purchasedCredits,
            0
          )
        )
      )
      .returning({
        purchasedCredits:
          user.purchasedCredits,
      });

  const updatedAccount =
    updatedAccounts[0];

  if (!updatedAccount) {
    throw new BeaconEngineError(
      "You have used today's five free searches. Please add search credits or join Beacon+ to continue.",
      {
        code:
          "billing_required",

        status: 402,
      }
    );
  }

  try {
    await database
      .insert(
        creditLedger
      )
      .values({
        userId:
          account.id,

        type:
          "search",

        amount: -1,

        balanceAfter:
          updatedAccount
            .purchasedCredits,

        description:
          "One purchased credit reserved for a Beacon search.",

        searchHistoryId,

        metadata: {
          source:
            "beacon_search",

          freeDailyLimit:
            FREE_DAILY_SEARCH_LIMIT,
        },
      });
  } catch (error) {
    await database
      .update(user)
      .set({
        purchasedCredits:
          sql`${user.purchasedCredits} + 1`,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          user.id,
          account.id
        )
      );

    throw error;
  }

  return {
    charged: true,

    balanceAfter:
      updatedAccount
        .purchasedCredits,
  };
}

async function refundReservedCredit(
  userId: string,
  searchHistoryId: string
): Promise<void> {
  const updatedAccounts =
    await database
      .update(user)
      .set({
        purchasedCredits:
          sql`${user.purchasedCredits} + 1`,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          user.id,
          userId
        )
      )
      .returning({
        purchasedCredits:
          user.purchasedCredits,
      });

  const updatedAccount =
    updatedAccounts[0];

  if (!updatedAccount) {
    console.error(
      `Beacon could not refund the reserved credit for search ${searchHistoryId}.`
    );

    return;
  }

  try {
    await database
      .insert(
        creditLedger
      )
      .values({
        userId,

        type:
          "refund",

        amount: 1,

        balanceAfter:
          updatedAccount
            .purchasedCredits,

        description:
          "Reserved search credit returned because the Beacon search failed.",

        searchHistoryId,

        metadata: {
          source:
            "failed_beacon_search",
        },
      });
  } catch (error) {
    console.error(
      `Beacon restored the account balance but could not record the refund ledger for search ${searchHistoryId}:`,
      error
    );
  }
}

function getResultCount(
  result: BeaconResponse
): number {
  if (
    result.responseType ===
    "recommendations"
  ) {
    return (
      result.recommendations
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
      result.intent.category ??
      null
    );
  }

  return "general";
}

async function markSearchCompleted(
  searchHistoryId: string,
  result: BeaconResponse,
  creditCharged: boolean
): Promise<void> {
  await database
    .update(
      searchHistory
    )
    .set({
      status:
        "completed",

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

      creditCharged,

      responseData:
        result,

      errorCode:
        null,

      errorMessage:
        null,

      completedAt:
        new Date(),
    })
    .where(
      eq(
        searchHistory.id,
        searchHistoryId
      )
    );
}

async function markSearchFailed(
  searchHistoryId: string,
  error: unknown
): Promise<void> {
  const errorCode =
    error instanceof
    BeaconEngineError
      ? error.code
      : "internal_error";

  const errorMessage =
    error instanceof Error
      ? error.message
      : "Beacon could not complete this request.";

  await database
    .update(
      searchHistory
    )
    .set({
      status:
        "failed",

      creditCharged:
        false,

      errorCode,

      errorMessage,

      completedAt:
        new Date(),
    })
    .where(
      eq(
        searchHistory.id,
        searchHistoryId
      )
    );
}

export async function POST(
  request: Request
) {
  let searchHistoryId:
    | string
    | null = null;

  let authenticatedAccount:
    | AuthenticatedAccount
    | null = null;

  let creditReservation:
    SearchChargeReservation = {
      charged: false,
    };

  try {
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

    authenticatedAccount =
      await getAuthenticatedAccount();

    if (!authenticatedAccount) {
      return createErrorResponse(
        "authentication_required",
        "Please sign in or create a free Beacon account before starting a search.",
        401
      );
    }

    searchHistoryId =
      await createStartedSearch(
        authenticatedAccount.id,
        query
      );

    creditReservation =
      await reservePurchasedCredit(
        authenticatedAccount,
        searchHistoryId
      );

    const result =
      await executeBeaconRequest(
        query
      );

    await markSearchCompleted(
      searchHistoryId,
      result,
      creditReservation.charged
    );

    let publicPath: string | undefined;

    if (
      result.responseType ===
        "recommendations" &&
      result.recommendations.length > 0
    ) {
      try {
        const publishedPage =
          await publishSearchPage({
            displayQuery,
            response: result,
            generatedByUserId:
              authenticatedAccount.id,
          });

        publicPath = publishedPage.path;
      } catch (publicationError) {
        console.error(
          "Beacon completed the search but could not publish its public page:",
          publicationError
        );
      }
    }

    return NextResponse.json(
      {
        success: true,

        data:
          result,

        ...(publicPath
          ? {
              publicPath,
            }
          : {}),

        account: {
          freeDailyLimit:
            FREE_DAILY_SEARCH_LIMIT,

          creditCharged:
            creditReservation.charged,

          purchasedCreditsRemaining:
            creditReservation
              .balanceAfter ??
            authenticatedAccount
              .purchasedCredits,

          beaconPlusActive:
            authenticatedAccount
              .beaconPlusActive,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (
      searchHistoryId &&
      authenticatedAccount
    ) {
      if (
        creditReservation.charged
      ) {
        await refundReservedCredit(
          authenticatedAccount.id,
          searchHistoryId
        );
      }

      try {
        await markSearchFailed(
          searchHistoryId,
          error
        );
      } catch (
        historyError
      ) {
        console.error(
          "Beacon could not update the failed search-history record:",
          historyError
        );
      }
    }

    if (
      error instanceof
      BeaconEngineError
    ) {
      return createErrorResponse(
        error.code,
        error.message,
        error.status,
        error.issues
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