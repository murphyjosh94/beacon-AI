import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  and,
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

type SavedSearchRequestBody = {
  name?: unknown;
  query?: unknown;
  category?: unknown;
  searchParameters?: unknown;
};

type AuthenticatedAccount = {
  id: string;
};

const MAXIMUM_NAME_LENGTH = 100;
const MAXIMUM_QUERY_LENGTH = 2_000;
const MAXIMUM_SAVED_SEARCHES = 100;

function createErrorResponse(
  code: string,
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,

      error: {
        code,
        message,
      },
    },
    {
      status,
    }
  );
}

function readRequiredString(
  value: unknown,
  maximumLength: number
): string {
  if (typeof value !== "string") {
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
    readRequiredString(
      value,
      maximumLength
    );

  return cleaned || undefined;
}

function readSearchParameters(
  value: unknown
): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as Record<
    string,
    unknown
  >;
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

  return accounts[0] ?? null;
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

    return NextResponse.json(
      {
        success: true,

        data: {
          savedSearches:
            searches,

          total:
            searches.length,
        },
      },
      {
        status: 200,
      }
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

    let body:
      SavedSearchRequestBody;

    try {
      body =
        (await request.json()) as SavedSearchRequestBody;
    } catch {
      return createErrorResponse(
        "invalid_request",
        "Beacon could not read this saved-search request.",
        400
      );
    }

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
        80
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

    const existingSearches =
      await database
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
      existingSearches[0];

    if (existing) {
      const updated =
        await database
          .update(savedSearch)
          .set({
            name,
            category:
              category ?? null,

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

      return NextResponse.json(
        {
          success: true,

          data: {
            savedSearch:
              updated[0],

            created: false,
          },
        },
        {
          status: 200,
        }
      );
    }

    const currentSearches =
      await database
        .select({
          id:
            savedSearch.id,
        })
        .from(savedSearch)
        .where(
          eq(
            savedSearch.userId,
            account.id
          )
        )
        .limit(
          MAXIMUM_SAVED_SEARCHES
        );

    if (
      currentSearches.length >=
      MAXIMUM_SAVED_SEARCHES
    ) {
      return createErrorResponse(
        "saved_search_limit_reached",
        "You have reached the limit of 100 saved searches. Remove one before saving another.",
        409
      );
    }

    const created =
      await database
        .insert(savedSearch)
        .values({
          userId:
            account.id,

          name,

          query,

          category:
            category ?? null,

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

    return NextResponse.json(
      {
        success: true,

        data: {
          savedSearch:
            created[0],

          created: true,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
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
      requestUrl.searchParams
        .get("id")
        ?.trim();

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

    return NextResponse.json(
      {
        success: true,

        data: {
          deleted: true,

          savedSearchId,
        },
      },
      {
        status: 200,
      }
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