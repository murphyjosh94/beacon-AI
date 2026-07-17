import type {
  MetadataRoute,
} from "next";

import { database } from "@/lib/database/Database";
import {
  searchPage,
} from "@/lib/database/schema";
import { eq } from "drizzle-orm";

import {
  absoluteUrl,
} from "@/lib/seo/SiteConfig";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/membership"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const publicSearchPages = await database
    .select({
      path: searchPage.path,
      updatedAt: searchPage.updatedAt,
    })
    .from(searchPage)
    .where(eq(searchPage.isIndexable, true));

  const searchEntries: MetadataRoute.Sitemap =
    publicSearchPages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: page.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [
    ...staticPages,
    ...searchEntries,
  ];
}