import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  and,
  count,
  desc,
  eq,
} from "drizzle-orm";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";

import {
  savedSearch,
  user,
} from "@/lib/database/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAXIMUM_NAME_LENGTH = 100;
const MAXIMUM_QUERY_LENGTH = 2_000;
const MAXIMUM_CATEGORY_LENGTH = 80;
const MAXIMUM_SAVED_SEARCHES = 100;
const MAXIMUM_SEARCH_PARAMETERS_BYTES =
  20_000;
const MAXIMUM_SAVED_SEARCH_ID_LENGTH =
  255;

type SavedSearchRequestBody = {
  name?: unknown;
  query?: unknown;
  category?: unknown;
  searchParameters?: unknown;
};

type AuthenticatedAccount = {
  id: string;
};

type JsonObject = Record<
  string,
  unknown
>;

class SavedSearchValidationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      "SavedSearchValidationError";

    this.code = code;
    this.status = status;
  }
}

function createJsonResponse(
  body: unknown,
  status: number
) {
  return NextResponse.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
}

function createErrorResponse(
  code: string,
  message: string,
  status: number
) {
  return createJsonResponse(
    {
      success: false,

      error: {
        code,
        message,
      },
    },
    status
  );
}

function normaliseWhitespace(
  value: string
): string {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function readRequiredString(
  value: unknown,
  maximumLength: number
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return normaliseWhitespace(
    value
  ).slice(
    0,
    maximumLength
  );
}

function readOptionalString(
  value: unknown,
  maximumLength: number
): string | undefined {
  const cleaned =
    readRequiredString(
      value,
      maximumLength
    );

  return cleaned || undefined;
}

function isPlainObject(
  value: unknown
): value is JsonObject {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(
      value
    );

  return (
    prototype ===
      Object.prototype ||
    prototype === null
  );
}

function readSearchParameters(
  value: unknown
): JsonObject {
  if (
    value === undefined ||
    value === null
  ) {
    return {};
  }

  if (!isPlainObject(value)) {
    throw new SavedSearchValidationError(
      "invalid_search_parameters",
      "Search parameters must be a JSON object.",
      400
    );
  }

  let serialised: string;

  try {
    serialised =
      JSON.stringify(value);
  } catch {
    throw new SavedSearchValidationError(
      "invalid_search_parameters",
      "Search parameters must contain valid JSON values.",
      400
    );
  }

  const size =
    Buffer.byteLength(
      serialised,
      "utf8"
    );

  if (
    size >
    MAXIMUM_SEARCH_PARAMETERS_BYTES
  ) {
    throw new SavedSearchValidationError(
      "search_parameters_too_large",
      "The saved-search parameters are too large.",
      413
    );
  }

  return JSON.parse(
    serialised
  ) as JsonObject;
}

async function readRequestBody(
  request: Request
): Promise<SavedSearchRequestBody> {
  const contentType =
    request.headers.get(
      "content-type"
    );

  if (
    !contentType
      ?.toLowerCase()
      .includes(
        "application/json"
      )
  ) {
    throw new SavedSearchValidationError(
      "invalid_content_type",
      "This endpoint requires a JSON request body.",
      415
    );
  }

  try {
    return (
      await request.json()
    ) as SavedSearchRequestBody;
  } catch {
    throw new SavedSearchValidationError(
      "invalid_request",
      "Beacon could not read this saved-search request.",
      400
    );
  }
}

async function getAuthenticatedAccount(): Promise<
  AuthenticatedAccount | null
> {
  const session =
    await auth.api.getSession({
      headers:
        await headers(),
    });

  if (
    !session?.user?.id
  ) {
    return null;
  }

  const accounts =
    await database
      .select({
        id:
          user.id,
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
    accounts[0] ?? null
  );
}

function handleKnownError(
  error: unknown
): NextResponse | null {
  if (
    error instanceof
    SavedSearchValidationError
  ) {
    return createErrorResponse(
      error.code,
      error.message,
      error.status
    );
  }

  return null;
}

export async function GET() {
  try {
    const account =
      await getAuthenticatedAccount();

    if (!account) {
      return createErrorResponse(
        "authentication_required",
        "Please sign in to view your saved searches.",
        401
      );
    }

    const searches =
      await database
        .select({
          id:
            savedSearch.id,

          name:
            savedSearch.name,

          query:
            savedSearch.query,

          category:
            savedSearch.category,

          searchParameters:
            savedSearch.searchParameters,

          createdAt:
            savedSearch.createdAt,

          updatedAt:
            savedSearch.updatedAt,
        })
        .from(savedSearch)
        .where(
          eq(
            savedSearch.userId,
            account.id
          )
        )
        .orderBy(
          desc(
            savedSearch.updatedAt
          )
        )
        .limit(
          MAXIMUM_SAVED_SEARCHES
        );

    return createJsonResponse(
      {
        success: true,

        data: {
          savedSearches:
            searches,

          total:
            searches.length,

          limit:
            MAXIMUM_SAVED_SEARCHES,
        },
      },
      200
    );
  } catch (error) {
    console.error(
      "Beacon could not load saved searches:",
      error
    );

    return createErrorResponse(
      "saved_searches_unavailable",
      "Beacon could not load your saved searches.",
      500
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const account =
      await getAuthenticatedAccount();

    if (!account) {
      return createErrorResponse(
        "authentication_required",
        "Please sign in before saving a search.",
        401
      );
    }

    const body =
      await readRequestBody(
        request
      );

    const query =
      readRequiredString(
        body.query,
        MAXIMUM_QUERY_LENGTH
      );

    if (!query) {
      return createErrorResponse(
        "missing_query",
        "A search query is required.",
        400
      );
    }

    const requestedName =
      readOptionalString(
        body.name,
        MAXIMUM_NAME_LENGTH
      );

    const category =
      readOptionalString(
        body.category,
        MAXIMUM_CATEGORY_LENGTH
      );

    const name =
      requestedName ??
      query.slice(
        0,
        MAXIMUM_NAME_LENGTH
      );

    const searchParameters =
      readSearchParameters(
        body.searchParameters
      );

    const result =
      await database.transaction(
        async (transaction) => {
          const existingRows =
            await transaction
              .select({
                id:
                  savedSearch.id,
              })
              .from(savedSearch)
              .where(
                and(
                  eq(
                    savedSearch.userId,
                    account.id
                  ),

                  eq(
                    savedSearch.query,
                    query
                  )
                )
              )
              .limit(1);

          const existing =
            existingRows[0];

          if (existing) {
            const updated =
              await transaction
                .update(
                  savedSearch
                )
                .set({
                  name,

                  category:
                    category ??
                    null,

                  searchParameters,

                  updatedAt:
                    new Date(),
                })
                .where(
                  and(
                    eq(
                      savedSearch.id,
                      existing.id
                    ),

                    eq(
                      savedSearch.userId,
                      account.id
                    )
                  )
                )
                .returning({
                  id:
                    savedSearch.id,

                  name:
                    savedSearch.name,

                  query:
                    savedSearch.query,

                  category:
                    savedSearch.category,

                  searchParameters:
                    savedSearch.searchParameters,

                  createdAt:
                    savedSearch.createdAt,

                  updatedAt:
                    savedSearch.updatedAt,
                });

            const saved =
              updated[0];

            if (!saved) {
              throw new Error(
                "The saved search disappeared while it was being updated."
              );
            }

            return {
              savedSearch:
                saved,

              created:
                false,
            };
          }

          const countRows =
            await transaction
              .select({
                total:
                  count(),
              })
              .from(savedSearch)
              .where(
                eq(
                  savedSearch.userId,
                  account.id
                )
              );

          const currentTotal =
            Number(
              countRows[0]
                ?.total ?? 0
            );

          if (
            currentTotal >=
            MAXIMUM_SAVED_SEARCHES
          ) {
            throw new SavedSearchValidationError(
              "saved_search_limit_reached",
              `You have reached the limit of ${MAXIMUM_SAVED_SEARCHES} saved searches. Remove one before saving another.`,
              409
            );
          }

          const created =
            await transaction
              .insert(
                savedSearch
              )
              .values({
                userId:
                  account.id,

                name,

                query,

                category:
                  category ??
                  null,

                searchParameters,
              })
              .returning({
                id:
                  savedSearch.id,

                name:
                  savedSearch.name,

                query:
                  savedSearch.query,

                category:
                  savedSearch.category,

                searchParameters:
                  savedSearch.searchParameters,

                createdAt:
                  savedSearch.createdAt,

                updatedAt:
                  savedSearch.updatedAt,
              });

          const saved =
            created[0];

          if (!saved) {
            throw new Error(
              "The saved search was not returned after creation."
            );
          }

          return {
            savedSearch:
              saved,

            created:
              true,
          };
        }
      );

    return createJsonResponse(
      {
        success: true,

        data: result,
      },
      result.created
        ? 201
        : 200
    );
  } catch (error) {
    const knownResponse =
      handleKnownError(
        error
      );

    if (knownResponse) {
      return knownResponse;
    }

    console.error(
      "Beacon could not save the search:",
      error
    );

    return createErrorResponse(
      "save_search_failed",
      "Beacon could not save this search. Please try again.",
      500
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const account =
      await getAuthenticatedAccount();

    if (!account) {
      return createErrorResponse(
        "authentication_required",
        "Please sign in before removing a saved search.",
        401
      );
    }

    const requestUrl =
      new URL(
        request.url
      );

    const savedSearchId =
      readRequiredString(
        requestUrl.searchParams.get(
          "id"
        ),
        MAXIMUM_SAVED_SEARCH_ID_LENGTH
      );

    if (!savedSearchId) {
      return createErrorResponse(
        "missing_saved_search_id",
        "A saved-search ID is required.",
        400
      );
    }

    const deleted =
      await database
        .delete(savedSearch)
        .where(
          and(
            eq(
              savedSearch.id,
              savedSearchId
            ),

            eq(
              savedSearch.userId,
              account.id
            )
          )
        )
        .returning({
          id:
            savedSearch.id,
        });

    if (
      deleted.length === 0
    ) {
      return createErrorResponse(
        "saved_search_not_found",
        "That saved search could not be found.",
        404
      );
    }

    return createJsonResponse(
      {
        success: true,

        data: {
          deleted: true,

          savedSearchId,
        },
      },
      200
    );
  } catch (error) {
    console.error(
      "Beacon could not remove the saved search:",
      error
    );

    return createErrorResponse(
      "delete_saved_search_failed",
      "Beacon could not remove this saved search.",
      500
    );
  }
}