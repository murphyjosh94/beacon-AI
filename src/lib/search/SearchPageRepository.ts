import "server-only";

import {
  and,
  desc,
  eq,
  sql,
} from "drizzle-orm";

import { database } from "@/lib/database/Database";
import {
  searchPage,
} from "@/lib/database/schema";

import {
  buildSearchPath,
  createSearchPageDescription,
  createSearchPageTitle,
  normalisePublicCategory,
  normaliseSearchQuery,
  slugifySearch,
  type PublicSearchCategory,
} from "@/lib/search/SearchSlug";

import type {
  BeaconRecommendationResponse,
} from "@/services/response/BeaconResponse";

export type PublicSearchPageRecord = {
  id: string;
  category: PublicSearchCategory;
  slug: string;
  path: string;
  query: string;
  title: string;
  description: string;
  response: BeaconRecommendationResponse;
  generatedAt: Date;
  updatedAt: Date;
  viewCount: number;
};

function toRecord(
  row: typeof searchPage.$inferSelect
): PublicSearchPageRecord {
  return {
    id: row.id,
    category:
      row.category as PublicSearchCategory,
    slug: row.slug,
    path: row.path,
    query: row.query,
    title: row.title,
    description: row.description,
    response:
      row.responseData as BeaconRecommendationResponse,
    generatedAt: row.generatedAt,
    updatedAt: row.updatedAt,
    viewCount: row.viewCount,
  };
}

export async function publishSearchPage(input: {
  displayQuery: string;
  response: BeaconRecommendationResponse;
  generatedByUserId?: string | null;
}): Promise<PublicSearchPageRecord> {
  const query = normaliseSearchQuery(
    input.displayQuery
  );

  const category = normalisePublicCategory(
    input.response.intent.category ??
      input.response.source
  );

  const slug = slugifySearch(query);

  const path = buildSearchPath(
    category,
    slug
  );

  const title =
    createSearchPageTitle(query);

  const description =
    createSearchPageDescription(query);

  const now = new Date();

  const rows = await database
    .insert(searchPage)
    .values({
      category,
      slug,
      path,
      query,
      title,
      description,
      responseData: input.response,
      responseType:
        input.response.responseType,
      source:
        input.response.source,
      dataProvider:
        input.response.dataProvider,
      liveData:
        input.response.liveData,
      resultCount:
        input.response.recommendations.length,
      generatedByUserId:
        input.generatedByUserId ?? null,
      generatedAt: now,
      updatedAt: now,
      isIndexable:
        input.response.recommendations.length > 0,
    })
    .onConflictDoUpdate({
      target: [
        searchPage.category,
        searchPage.slug,
      ],
      set: {
        path,
        query,
        title,
        description,
        responseData: input.response,
        responseType:
          input.response.responseType,
        source:
          input.response.source,
        dataProvider:
          input.response.dataProvider,
        liveData:
          input.response.liveData,
        resultCount:
          input.response.recommendations.length,
        generatedByUserId:
          input.generatedByUserId ?? null,
        generatedAt: now,
        updatedAt: now,
        isIndexable:
          input.response.recommendations.length > 0,
      },
    })
    .returning();

  const row = rows[0];

  if (!row) {
    throw new Error(
      "Beacon could not publish the search page."
    );
  }

  return toRecord(row);
}

export async function getSearchPage(
  category: string,
  slug: string
): Promise<PublicSearchPageRecord | null> {
  const rows = await database
    .select()
    .from(searchPage)
    .where(
      and(
        eq(
          searchPage.category,
          category
        ),
        eq(
          searchPage.slug,
          slug
        ),
        eq(
          searchPage.isIndexable,
          true
        )
      )
    )
    .limit(1);

  const row = rows[0];

  return row
    ? toRecord(row)
    : null;
}

export async function getSearchPagesByCategory(
  category: PublicSearchCategory,
  limit = 25
): Promise<PublicSearchPageRecord[]> {
  const safeLimit = Math.min(
    Math.max(
      Math.trunc(limit),
      1
    ),
    100
  );

  const rows = await database
    .select()
    .from(searchPage)
    .where(
      and(
        eq(
          searchPage.category,
          category
        ),
        eq(
          searchPage.isIndexable,
          true
        )
      )
    )
    .orderBy(
      desc(
        searchPage.updatedAt
      )
    )
    .limit(safeLimit);

  return rows.map(toRecord);
}

export async function incrementSearchPageViews(
  id: string
): Promise<void> {
  await database
    .update(searchPage)
    .set({
      viewCount:
        sql`${searchPage.viewCount} + 1`,
      lastViewedAt:
        new Date(),
    })
    .where(
      eq(
        searchPage.id,
        id
      )
    );
}