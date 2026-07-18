import "server-only";

import {
  eq,
} from "drizzle-orm";

import { database } from "@/lib/database/Database";

import {
  searchHistory,
} from "@/lib/database/schema";

import {
  isCreditUsageError,
  useCredits as chargeCredits,
  type CreditMetadata,
  type UseCreditsResult,
} from "@/lib/credits/useCredits";

import {
  refundCredits,
} from "@/lib/credits/refundCredits";

export const SEARCH_EXECUTION_ERROR_CODES = {
  INVALID_USER_ID:
    "invalid_search_user_id",

  INVALID_QUERY:
    "invalid_search_query",

  INVALID_CREDIT_COST:
    "invalid_search_credit_cost",

  SEARCH_HISTORY_CREATION_FAILED:
    "search_history_creation_failed",

  CREDIT_RESERVATION_FAILED:
    "credit_reservation_failed",

  PROVIDER_FAILED:
    "search_provider_failed",

  SEARCH_HISTORY_UPDATE_FAILED:
    "search_history_update_failed",

  CREDIT_REFUND_FAILED:
    "credit_refund_failed",
} as const;

export type SearchExecutionErrorCode =
  (typeof SEARCH_EXECUTION_ERROR_CODES)[keyof typeof SEARCH_EXECUTION_ERROR_CODES];

export type SearchProviderContext = {
  userId: string;

  searchHistoryId: string;

  query: string;

  category:
    | string
    | null;
};

export type SearchProvider<
  TResult,
> = (
  context:
    SearchProviderContext
) => Promise<TResult>;

export type ExecuteSearchInput<
  TResult,
> = {
  /*
   * Pass the authenticated Better Auth user ID from the
   * route or server action calling executeSearch().
   */
  userId: string;

  query: string;

  category?: string | null;

  responseType?: string | null;

  creditCost?: number;

  creditDescription?: string;

  creditMetadata?:
    CreditMetadata;

  /*
   * The actual AI, product-search or external-provider call.
   *
   * Keeping the provider as a callback means this billing and
   * history pipeline can be reused by every Beacon category.
   */
  provider:
    SearchProvider<TResult>;

  /*
   * Optional transformer for values that cannot be safely
   * stored directly as JSON.
   */
  serializeResult?: (
    result: TResult
  ) => unknown;

  /*
   * Optional way to calculate the number of results recorded
   * in search_history.
   */
  getResultCount?: (
    result: TResult
  ) => number;
};

export type ExecuteSearchResult<
  TResult,
> = {
  searchHistoryId: string;

  result: TResult;

  credits:
    UseCreditsResult;
};

export class SearchExecutionError extends Error {
  readonly code:
    SearchExecutionErrorCode;

  readonly status:
    number;

  readonly searchHistoryId:
    string | null;

  readonly cause:
    unknown;

  constructor(
    input: {
      code:
        SearchExecutionErrorCode;

      message: string;

      status: number;

      searchHistoryId?:
        string | null;

      cause?: unknown;
    }
  ) {
    super(
      input.message
    );

    this.name =
      "SearchExecutionError";

    this.code =
      input.code;

    this.status =
      input.status;

    this.searchHistoryId =
      input.searchHistoryId ??
      null;

    this.cause =
      input.cause;
  }
}

function validateUserId(
  userId: string
): string {
  const cleanedUserId =
    userId.trim();

  if (!cleanedUserId) {
    throw new SearchExecutionError({
      code:
        SEARCH_EXECUTION_ERROR_CODES.INVALID_USER_ID,

      message:
        "An authenticated Beacon user is required to run a search.",

      status:
        401,
    });
  }

  return cleanedUserId;
}

function validateQuery(
  query: string
): string {
  const cleanedQuery =
    query.trim();

  if (!cleanedQuery) {
    throw new SearchExecutionError({
      code:
        SEARCH_EXECUTION_ERROR_CODES.INVALID_QUERY,

      message:
        "A search query is required.",

      status:
        400,
    });
  }

  return cleanedQuery;
}

function validateCreditCost(
  creditCost: number
): number {
  if (
    !Number.isSafeInteger(
      creditCost
    ) ||
    creditCost <= 0
  ) {
    throw new SearchExecutionError({
      code:
        SEARCH_EXECUTION_ERROR_CODES.INVALID_CREDIT_COST,

      message:
        "The search credit cost must be a positive whole number.",

      status:
        500,
    });
  }

  return creditCost;
}

function cleanOptionalText(
  value:
    | string
    | null
    | undefined
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const cleanedValue =
    value.trim();

  return (
    cleanedValue ||
    null
  );
}

function defaultCreditDescription(
  query: string,
  category:
    | string
    | null
): string {
  if (category) {
    return (
      `Beacon ${category} search: ${query}`
    );
  }

  return (
    `Beacon search: ${query}`
  );
}

function normaliseResultCount(
  resultCount: number
): number {
  if (
    !Number.isFinite(
      resultCount
    ) ||
    resultCount < 0
  ) {
    return 0;
  }

  return Math.floor(
    resultCount
  );
}

function inferResultCount(
  value: unknown
): number {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.length;
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        record.results
      )
    ) {
      return (
        record.results.length
      );
    }

    if (
      Array.isArray(
        record.items
      )
    ) {
      return (
        record.items.length
      );
    }

    if (
      typeof record.resultCount ===
        "number"
    ) {
      return normaliseResultCount(
        record.resultCount
      );
    }

    if (
      typeof record.count ===
        "number"
    ) {
      return normaliseResultCount(
        record.count
      );
    }
  }

  return 0;
}

function serialiseError(
  error: unknown
): {
  code: string;
  message: string;
} {
  if (
    isCreditUsageError(
      error
    )
  ) {
    return {
      code:
        error.code,

      message:
        error.message,
    };
  }

  if (
    error instanceof
      SearchExecutionError
  ) {
    return {
      code:
        error.code,

      message:
        error.message,
    };
  }

  if (
    error instanceof
      Error
  ) {
    return {
      code:
        "unknown_error",

      message:
        error.message ||
        "An unknown search error occurred.",
    };
  }

  if (
    typeof error ===
      "string"
  ) {
    return {
      code:
        "unknown_error",

      message:
        error,
    };
  }

  return {
    code:
      "unknown_error",

    message:
      "An unknown search error occurred.",
  };
}

async function createSearchHistoryEntry(
  input: {
    userId: string;

    query: string;

    category:
      | string
      | null;

    responseType:
      | string
      | null;
  }
): Promise<string> {
  const rows =
    await database
      .insert(
        searchHistory
      )
      .values({
        userId:
          input.userId,

        query:
          input.query,

        category:
          input.category,

        status:
          "started",

        responseType:
          input.responseType,

        resultCount:
          0,

        creditCharged:
          false,
      })
      .returning({
        id:
          searchHistory.id,
      });

  const entry =
    rows[0];

  if (!entry) {
    throw new SearchExecutionError({
      code:
        SEARCH_EXECUTION_ERROR_CODES.SEARCH_HISTORY_CREATION_FAILED,

      message:
        "Beacon could not create the search history record.",

      status:
        500,
    });
  }

  return entry.id;
}

async function markCreditsReserved(
  searchHistoryId: string
): Promise<void> {
  await database
    .update(
      searchHistory
    )
    .set({
      creditCharged:
        true,
    })
    .where(
      eq(
        searchHistory.id,
        searchHistoryId
      )
    );
}

async function markSearchCompleted(
  input: {
    searchHistoryId: string;

    responseData: unknown;

    resultCount: number;
  }
): Promise<void> {
  await database
    .update(
      searchHistory
    )
    .set({
      status:
        "completed",

      responseData:
        input.responseData,

      resultCount:
        input.resultCount,

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
        input.searchHistoryId
      )
    );
}

async function markSearchFailed(
  input: {
    searchHistoryId: string;

    errorCode: string;

    errorMessage: string;

    creditCharged: boolean;
  }
): Promise<void> {
  await database
    .update(
      searchHistory
    )
    .set({
      status:
        "failed",

      resultCount:
        0,

      creditCharged:
        input.creditCharged,

      errorCode:
        input.errorCode,

      errorMessage:
        input.errorMessage,

      completedAt:
        new Date(),
    })
    .where(
      eq(
        searchHistory.id,
        input.searchHistoryId
      )
    );
}

async function safelyMarkSearchFailed(
  input: {
    searchHistoryId: string;

    errorCode: string;

    errorMessage: string;

    creditCharged: boolean;
  }
): Promise<void> {
  try {
    await markSearchFailed(
      input
    );
  } catch (historyError) {
    console.error(
      "Failed to update Beacon search history after a search error.",
      {
        searchHistoryId:
          input.searchHistoryId,

        originalErrorCode:
          input.errorCode,

        historyError,
      }
    );
  }
}

export function isSearchExecutionError(
  error: unknown
): error is SearchExecutionError {
  return (
    error instanceof
      SearchExecutionError
  );
}

/**
 * Executes a credit-controlled Beacon search.
 *
 * Flow:
 *
 * 1. Create a started search_history record.
 * 2. Reserve the required credits.
 * 3. Run the supplied provider callback.
 * 4. Save the completed response.
 * 5. Refund the reserved credits if the provider fails.
 *
 * Authentication remains at the route or server-action
 * boundary. Pass the authenticated Better Auth user ID into
 * this function.
 */
export async function executeSearch<
  TResult,
>(
  input:
    ExecuteSearchInput<TResult>
): Promise<
  ExecuteSearchResult<TResult>
> {
  const userId =
    validateUserId(
      input.userId
    );

  const query =
    validateQuery(
      input.query
    );

  const category =
    cleanOptionalText(
      input.category
    );

  const responseType =
    cleanOptionalText(
      input.responseType
    );

  const creditCost =
    validateCreditCost(
      input.creditCost ??
      1
    );

  const creditDescription =
    cleanOptionalText(
      input.creditDescription
    ) ??
    defaultCreditDescription(
      query,
      category
    );

  const searchHistoryId =
    await createSearchHistoryEntry({
      userId,

      query,

      category,

      responseType,
    });

  let creditUsage:
    UseCreditsResult;

  try {
    creditUsage =
      await chargeCredits({
        userId,

        amount:
          creditCost,

        description:
          creditDescription,

        searchHistoryId,

        metadata: {
          ...input.creditMetadata,

          category,

          responseType,
        },
      });

    await markCreditsReserved(
      searchHistoryId
    );
  } catch (error) {
    const serialisedError =
      serialiseError(
        error
      );

    await safelyMarkSearchFailed({
      searchHistoryId,

      errorCode:
        serialisedError.code,

      errorMessage:
        serialisedError.message,

      creditCharged:
        false,
    });

    if (
      isCreditUsageError(
        error
      )
    ) {
      throw error;
    }

    throw new SearchExecutionError({
      code:
        SEARCH_EXECUTION_ERROR_CODES.CREDIT_RESERVATION_FAILED,

      message:
        "Beacon could not reserve the credits required for this search.",

      status:
        500,

      searchHistoryId,

      cause:
        error,
    });
  }

  try {
    const result =
      await input.provider({
        userId,

        searchHistoryId,

        query,

        category,
      });

    const responseData =
      input.serializeResult
        ? input.serializeResult(
            result
          )
        : result;

    const resultCount =
      input.getResultCount
        ? normaliseResultCount(
            input.getResultCount(
              result
            )
          )
        : inferResultCount(
            responseData
          );

    try {
      await markSearchCompleted({
        searchHistoryId,

        responseData,

        resultCount,
      });
    } catch (error) {
      throw new SearchExecutionError({
        code:
          SEARCH_EXECUTION_ERROR_CODES.SEARCH_HISTORY_UPDATE_FAILED,

        message:
          "The search completed, but Beacon could not save its result to search history.",

        status:
          500,

        searchHistoryId,

        cause:
          error,
      });
    }

    return {
      searchHistoryId,

      result,

      credits:
        creditUsage,
    };
  } catch (providerError) {
    /*
     * A completed provider result followed by a history-write
     * failure should not be treated as a provider failure.
     * The user received a valid result and the credits should
     * therefore remain charged.
     */
    if (
      providerError instanceof
        SearchExecutionError &&
      providerError.code ===
        SEARCH_EXECUTION_ERROR_CODES.SEARCH_HISTORY_UPDATE_FAILED
    ) {
      throw providerError;
    }

    const serialisedProviderError =
      serialiseError(
        providerError
      );

    try {
      await refundCredits({
        usage:
          creditUsage,

        description:
          `Refund for failed search: ${query}`,

        searchHistoryId,

        metadata: {
          category,

          responseType,

          providerErrorCode:
            serialisedProviderError.code,
        },
      });
    } catch (refundError) {
      const serialisedRefundError =
        serialiseError(
          refundError
        );

      await safelyMarkSearchFailed({
        searchHistoryId,

        errorCode:
          SEARCH_EXECUTION_ERROR_CODES.CREDIT_REFUND_FAILED,

        errorMessage:
          [
            serialisedProviderError.message,
            "The automatic credit refund also failed:",
            serialisedRefundError.message,
          ].join(" "),

        creditCharged:
          true,
      });

      throw new SearchExecutionError({
        code:
          SEARCH_EXECUTION_ERROR_CODES.CREDIT_REFUND_FAILED,

        message:
          "The search failed and Beacon could not automatically refund the reserved credits.",

        status:
          500,

        searchHistoryId,

        cause:
          refundError,
      });
    }

    await safelyMarkSearchFailed({
      searchHistoryId,

      errorCode:
        serialisedProviderError.code,

      errorMessage:
        serialisedProviderError.message,

      creditCharged:
        false,
    });

    throw new SearchExecutionError({
      code:
        SEARCH_EXECUTION_ERROR_CODES.PROVIDER_FAILED,

      message:
        serialisedProviderError.message,

      status:
        502,

      searchHistoryId,

      cause:
        providerError,
    });
  }
}