import "server-only";

import {
  getAwinPublisherId,
  AwinApiError,
} from "@/services/affiliate/awin/AwinClient";

export type AwinProductFeedLocale =
  | "en_GB"
  | "en_US"
  | "en_IE"
  | "fr_FR"
  | "de_DE"
  | "en_DE"
  | "en_NL"
  | "nl_NL"
  | string;

export type AwinFeedPrice = {
  amount: number;
  currency: string;
  display: string;
};

export type AwinFeedProduct = {
  advertiserId: number;
  advertiserName?: string;

  id: string;
  title: string;
  description: string;

  destinationUrl: string;
  imageUrl?: string;
  additionalImageUrls: string[];

  brand?: string;
  gtin?: string;
  mpn?: string;

  productType?: string;
  googleProductCategory?: string;

  availability?: string;
  condition?: string;

  price?: AwinFeedPrice;
  salePrice?: AwinFeedPrice;

  colour?: string;
  size?: string;
  gender?: string;
  ageGroup?: string;

  highlights: string[];

  raw: Record<string, unknown>;
};

export type SearchAwinProductFeedOptions = {
  advertiserId: number;
  query: string;

  locale?: AwinProductFeedLocale;
  limit?: number;

  signal?: AbortSignal;
};

type AwinEnhancedFeedRecord = {
  meta?: {
    advertiser_id?: number;
    advertiser_name?: string;
  };

  product_basic?: Record<
    string,
    unknown
  >;

  product_category?: Record<
    string,
    unknown
  >;

  product_identifiers?: Record<
    string,
    unknown
  >;

  product_detailed_description?: Record<
    string,
    unknown
  >;

  delivery?: Record<
    string,
    unknown
  >;

  error?: number | string;
  message?: string;

  [key: string]: unknown;
};

const AWIN_API_BASE_URL =
  "https://api.awin.com";

const DEFAULT_LIMIT = 30;
const MAXIMUM_LIMIT = 100;

function getAwinApiToken(): string {
  const token =
    process.env.AWIN_API_TOKEN?.trim();

  if (!token) {
    throw new AwinApiError(
      "AWIN_API_TOKEN is missing.",
      {
        code:
          "missing_configuration",
      }
    );
  }

  return token;
}

function clampLimit(
  value: number | undefined
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_LIMIT;
  }

  return Math.max(
    1,
    Math.min(
      MAXIMUM_LIMIT,
      Math.floor(value)
    )
  );
}

function isValidAdvertiserId(
  value: number
): boolean {
  return (
    Number.isInteger(value) &&
    value > 0
  );
}

function normaliseText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(
      /[^\p{L}\p{N}.\s'-]/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(
  value: unknown,
  maximumLength = 5_000
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const cleaned =
    value
      .replace(/\s+/g, " ")
      .trim();

  return cleaned
    ? cleaned.slice(
        0,
        maximumLength
      )
    : undefined;
}

function readRecordValue(
  record: AwinEnhancedFeedRecord,
  keys: string[]
): unknown {
  for (const key of keys) {
    if (
      key in record &&
      record[key] !== undefined
    ) {
      return record[key];
    }

    const sections = [
      record.product_basic,
      record.product_category,
      record.product_identifiers,
      record.product_detailed_description,
      record.delivery,
    ];

    for (const section of sections) {
      if (
        section &&
        key in section &&
        section[key] !== undefined
      ) {
        return section[key];
      }
    }
  }

  return undefined;
}

function readString(
  record: AwinEnhancedFeedRecord,
  keys: string[],
  maximumLength?: number
): string | undefined {
  return cleanText(
    readRecordValue(
      record,
      keys
    ),
    maximumLength
  );
}

function readStringArray(
  record: AwinEnhancedFeedRecord,
  keys: string[]
): string[] {
  const value =
    readRecordValue(
      record,
      keys
    );

  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) =>
            cleanText(item, 2_000)
          )
          .filter(
            (
              item
            ): item is string =>
              Boolean(item)
          )
      )
    );
  }

  const singleValue =
    cleanText(
      value,
      2_000
    );

  return singleValue
    ? [singleValue]
    : [];
}

function readBoolean(
  record: AwinEnhancedFeedRecord,
  keys: string[]
): boolean | undefined {
  const value =
    readRecordValue(
      record,
      keys
    );

  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const normalised =
      value.trim().toLowerCase();

    if (
      normalised === "true" ||
      normalised === "yes"
    ) {
      return true;
    }

    if (
      normalised === "false" ||
      normalised === "no"
    ) {
      return false;
    }
  }

  return undefined;
}

function normaliseHttpUrl(
  value: unknown
): string | undefined {
  const cleaned =
    cleanText(value, 2_000);

  if (!cleaned) {
    return undefined;
  }

  try {
    const url =
      new URL(cleaned);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return undefined;
    }

    url.hash = "";

    return url.toString();
  } catch {
    return undefined;
  }
}

function parsePrice(
  value: unknown
): AwinFeedPrice | undefined {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return {
      amount: value,
      currency: "GBP",
      display:
        new Intl.NumberFormat(
          "en-GB",
          {
            style: "currency",
            currency: "GBP",
          }
        ).format(value),
    };
  }

  const cleaned =
    cleanText(value, 100);

  if (!cleaned) {
    return undefined;
  }

  const amountMatch =
    cleaned
      .replace(/,/g, "")
      .match(
        /(\d+(?:\.\d{1,2})?)/
      );

  if (!amountMatch) {
    return undefined;
  }

  const amount =
    Number(amountMatch[1]);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return undefined;
  }

  const currencyMatch =
    cleaned
      .toUpperCase()
      .match(
        /\b(GBP|EUR|USD|CAD|AUD|NZD)\b/
      );

  const currency =
    currencyMatch?.[1] ??
    (
      cleaned.includes("£")
        ? "GBP"
        : cleaned.includes("€")
          ? "EUR"
          : cleaned.includes("$")
            ? "USD"
            : "GBP"
    );

  let display: string;

  try {
    display =
      new Intl.NumberFormat(
        "en-GB",
        {
          style: "currency",
          currency,
        }
      ).format(amount);
  } catch {
    display = cleaned;
  }

  return {
    amount,
    currency,
    display,
  };
}

function createSearchTerms(
  query: string
): string[] {
  const stopWords =
    new Set([
      "a",
      "an",
      "and",
      "for",
      "find",
      "from",
      "in",
      "me",
      "my",
      "of",
      "please",
      "show",
      "the",
      "to",
      "with",
    ]);

  return Array.from(
    new Set(
      normaliseText(query)
        .split(" ")
        .map((term) =>
          term.trim()
        )
        .filter(
          (term) =>
            term.length > 1 &&
            !stopWords.has(term)
        )
    )
  );
}

function calculateQueryMatchScore(
  record: AwinEnhancedFeedRecord,
  terms: string[]
): number {
  if (terms.length === 0) {
    return 100;
  }

  const searchableText =
    normaliseText(
      [
        readString(
          record,
          ["title"]
        ),
        readString(
          record,
          ["description"]
        ),
        readString(
          record,
          ["brand"]
        ),
        readString(
          record,
          [
            "product_type",
            "productType",
          ]
        ),
        readString(
          record,
          [
            "google_product_category",
            "googleProductCategory",
          ]
        ),
        readString(
          record,
          ["mpn"]
        ),
        readString(
          record,
          ["gtin"]
        ),
        ...readStringArray(
          record,
          [
            "product_highlight",
            "product_highlights",
          ]
        ),
      ]
        .filter(Boolean)
        .join(" ")
    );

  const matchedTerms =
    terms.filter((term) =>
      searchableText.includes(term)
    ).length;

  return (
    matchedTerms /
    terms.length
  );
}

function recordMatchesQuery(
  record: AwinEnhancedFeedRecord,
  terms: string[]
): boolean {
  if (terms.length === 0) {
    return true;
  }

  const score =
    calculateQueryMatchScore(
      record,
      terms
    );

  if (terms.length <= 2) {
    return score === 1;
  }

  return score >= 0.6;
}

function mapFeedRecord(
  record: AwinEnhancedFeedRecord,
  fallbackAdvertiserId: number
): AwinFeedProduct | null {
  if (
    record.error !== undefined
  ) {
    return null;
  }

  const id =
    readString(
      record,
      ["id"],
      150
    );

  const title =
    readString(
      record,
      ["title"],
      500
    );

  const destinationUrl =
    normaliseHttpUrl(
      readRecordValue(
        record,
        [
          "link",
          "mobile_link",
        ]
      )
    );

  if (
    !id ||
    !title ||
    !destinationUrl
  ) {
    return null;
  }

  const description =
    readString(
      record,
      ["description"],
      5_000
    ) ??
    `${title}.`;

  const availability =
    readString(
      record,
      ["availability"],
      100
    );

  const adult =
    readBoolean(
      record,
      ["adult"]
    );

  if (adult === true) {
    return null;
  }

  return {
    advertiserId:
      record.meta
        ?.advertiser_id ??
      fallbackAdvertiserId,

    advertiserName:
      cleanText(
        record.meta
          ?.advertiser_name,
        200
      ),

    id,
    title,
    description,

    destinationUrl,

    imageUrl:
      normaliseHttpUrl(
        readRecordValue(
          record,
          ["image_link"]
        )
      ),

    additionalImageUrls:
      readStringArray(
        record,
        [
          "additional_image_link",
        ]
      )
        .map(
          normaliseHttpUrl
        )
        .filter(
          (
            value
          ): value is string =>
            Boolean(value)
        )
        .slice(0, 8),

    brand:
      readString(
        record,
        ["brand"],
        200
      ),

    gtin:
      readString(
        record,
        ["gtin"],
        100
      ),

    mpn:
      readString(
        record,
        ["mpn"],
        100
      ),

    productType:
      readString(
        record,
        [
          "product_type",
          "productType",
        ],
        500
      ),

    googleProductCategory:
      readString(
        record,
        [
          "google_product_category",
          "googleProductCategory",
        ],
        500
      ),

    availability,

    condition:
      readString(
        record,
        ["condition"],
        100
      ),

    price:
      parsePrice(
        readRecordValue(
          record,
          ["price"]
        )
      ),

    salePrice:
      parsePrice(
        readRecordValue(
          record,
          [
            "sale_price",
            "salePrice",
          ]
        )
      ),

    colour:
      readString(
        record,
        ["color", "colour"],
        100
      ),

    size:
      readString(
        record,
        ["size"],
        100
      ),

    gender:
      readString(
        record,
        ["gender"],
        100
      ),

    ageGroup:
      readString(
        record,
        [
          "age_group",
          "ageGroup",
        ],
        100
      ),

    highlights:
      readStringArray(
        record,
        [
          "product_highlight",
          "product_highlights",
        ]
      ).slice(0, 6),

    raw:
      record,
  };
}

function createFeedUrl(
  publisherId: number,
  advertiserId: number,
  locale: AwinProductFeedLocale
): URL {
  return new URL(
    `/publishers/${publisherId}/awinfeeds/download/${advertiserId}-retail-${locale}.jsonl`,
    AWIN_API_BASE_URL
  );
}

function readAwinErrorMessage(
  record: AwinEnhancedFeedRecord
): string | undefined {
  if (
    record.error === undefined
  ) {
    return undefined;
  }

  return (
    cleanText(
      record.message,
      1_000
    ) ??
    `Awin feed error ${String(
      record.error
    )}.`
  );
}

async function parseJsonLinesResponse(
  response: Response,
  options: {
    advertiserId: number;
    terms: string[];
    limit: number;
  }
): Promise<AwinFeedProduct[]> {
  if (!response.body) {
    throw new AwinApiError(
      "Awin returned an empty product feed.",
      {
        status:
          response.status,
        code:
          "empty_feed_response",
      }
    );
  }

  const reader =
    response.body
      .pipeThrough(
        new TextDecoderStream()
      )
      .getReader();

  const products:
    AwinFeedProduct[] = [];

  let buffer = "";

  try {
    while (true) {
      const {
        value,
        done,
      } =
        await reader.read();

      if (done) {
        break;
      }

      buffer += value;

      const lines =
        buffer.split(/\r?\n/);

      buffer =
        lines.pop() ?? "";

      for (const line of lines) {
        const cleanedLine =
          line.trim();

        if (!cleanedLine) {
          continue;
        }

        let record:
          AwinEnhancedFeedRecord;

        try {
          record =
            JSON.parse(
              cleanedLine
            ) as AwinEnhancedFeedRecord;
        } catch {
          continue;
        }

        const feedError =
          readAwinErrorMessage(
            record
          );

        if (feedError) {
          throw new AwinApiError(
            feedError,
            {
              status:
                response.status,
              code:
                "feed_error",
              responseBody:
                record,
            }
          );
        }

        if (
          !recordMatchesQuery(
            record,
            options.terms
          )
        ) {
          continue;
        }

        const product =
          mapFeedRecord(
            record,
            options.advertiserId
          );

        if (!product) {
          continue;
        }

        products.push(product);

        if (
          products.length >=
          options.limit
        ) {
          await reader.cancel();
          return products;
        }
      }
    }

    const finalLine =
      buffer.trim();

    if (finalLine) {
      try {
        const record =
          JSON.parse(
            finalLine
          ) as AwinEnhancedFeedRecord;

        const feedError =
          readAwinErrorMessage(
            record
          );

        if (feedError) {
          throw new AwinApiError(
            feedError,
            {
              status:
                response.status,
              code:
                "feed_error",
              responseBody:
                record,
            }
          );
        }

        if (
          recordMatchesQuery(
            record,
            options.terms
          )
        ) {
          const product =
            mapFeedRecord(
              record,
              options.advertiserId
            );

          if (product) {
            products.push(
              product
            );
          }
        }
      } catch (error) {
        if (
          error instanceof
          AwinApiError
        ) {
          throw error;
        }
      }
    }

    return products.slice(
      0,
      options.limit
    );
  } finally {
    reader.releaseLock();
  }
}

export async function searchAwinProductFeed(
  options: SearchAwinProductFeedOptions
): Promise<AwinFeedProduct[]> {
  if (
    !isValidAdvertiserId(
      options.advertiserId
    )
  ) {
    throw new AwinApiError(
      "A valid Awin advertiser ID is required.",
      {
        code:
          "invalid_advertiser_id",
      }
    );
  }

  const query =
    options.query.trim();

  if (!query) {
    throw new AwinApiError(
      "An Awin product-feed search query is required.",
      {
        code:
          "missing_query",
      }
    );
  }

  const publisherId =
    getAwinPublisherId();

  const locale =
    options.locale ??
    "en_GB";

  const limit =
    clampLimit(
      options.limit
    );

  const url =
    createFeedUrl(
      publisherId,
      options.advertiserId,
      locale
    );

  let response: Response;

  try {
    response =
      await fetch(url, {
        method: "GET",

        headers: {
          Accept:
            "application/jsonl, application/json, text/plain",

          Authorization:
            `Bearer ${getAwinApiToken()}`,
        },

        cache:
          "no-store",

        signal:
          options.signal,
      });
  } catch (error) {
    throw new AwinApiError(
      error instanceof Error
        ? `Beacon could not download the Awin product feed: ${error.message}`
        : "Beacon could not download the Awin product feed.",
      {
        code:
          "network_error",
      }
    );
  }

  if (!response.ok) {
    const responseText =
      await response
        .text()
        .catch(() => "");

    throw new AwinApiError(
      responseText.trim() ||
        `Awin returned HTTP ${response.status} for the product feed.`,
      {
        status:
          response.status,

        code:
          response.status === 401
            ? "authentication_failed"
            : response.status === 403
              ? "access_denied"
              : response.status === 404
                ? "feed_not_available"
                : response.status === 429
                  ? "rate_limited"
                  : "feed_request_failed",

        responseBody:
          responseText ||
          null,
      }
    );
  }

  return parseJsonLinesResponse(
    response,
    {
      advertiserId:
        options.advertiserId,

      terms:
        createSearchTerms(
          query
        ),

      limit,
    }
  );
}