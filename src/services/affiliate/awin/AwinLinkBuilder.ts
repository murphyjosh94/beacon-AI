import "server-only";

import {
  getAwinPublisherId,
  requestAwin,
  AwinApiError,
} from "@/services/affiliate/awin/AwinClient";

import {
  findAwinMerchantByAdvertiserId,
  findAwinMerchantByUrl,
} from "@/services/affiliate/awin/AwinMerchantRegistry";

export type AwinClickParameters = {
  campaign?: string;
  clickref?: string;
  clickref2?: string;
  clickref3?: string;
  clickref4?: string;
  clickref5?: string;
  clickref6?: string;
};

export type BuildAwinLinkInput = {
  advertiserId: number;
  destinationUrl?: string;
  parameters?: AwinClickParameters;
  shorten?: boolean;
};

export type BuildTrackedLinkInput = {
  destinationUrl: string;
  parameters?: AwinClickParameters;
  shorten?: boolean;
};

export type AwinGeneratedLink = {
  advertiserId: number;
  advertiserName: string;
  destinationUrl: string;
  trackedUrl: string;
  shortUrl?: string;
  matchedDomain?: string;
};

export type AffiliateLinkResult =
  | {
      affiliate: true;
      network: "awin";
      advertiserId: number;
      advertiserName: string;
      originalUrl: string;
      destinationUrl: string;
      trackedUrl: string;
      shortUrl?: string;
      matchedDomain?: string;
    }
  | {
      affiliate: false;
      network: null;
      advertiserId: null;
      advertiserName: null;
      originalUrl: string;
      destinationUrl: string;
      trackedUrl: string;
      reason:
        | "invalid_destination"
        | "merchant_not_joined"
        | "link_builder_unavailable";
    };

type AwinGenerateLinkResponse = {
  url?: string;
  shortUrl?: string;
  description?: string;
};

function isValidAdvertiserId(
  advertiserId: number
): boolean {
  return (
    Number.isInteger(advertiserId) &&
    advertiserId > 0
  );
}

function normaliseDestinationUrl(
  value: string
): string | null {
  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  try {
    const url = new URL(cleaned);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    url.hash = "";

    return url.toString();
  } catch {
    return null;
  }
}

function cleanOptionalValue(
  value?: string
): string | undefined {
  const cleaned = value?.trim();

  return cleaned || undefined;
}

function normaliseClickParameters(
  parameters: AwinClickParameters = {}
): AwinClickParameters | undefined {
  const cleaned: AwinClickParameters = {
    campaign: cleanOptionalValue(
      parameters.campaign
    ),
    clickref: cleanOptionalValue(
      parameters.clickref
    ),
    clickref2: cleanOptionalValue(
      parameters.clickref2
    ),
    clickref3: cleanOptionalValue(
      parameters.clickref3
    ),
    clickref4: cleanOptionalValue(
      parameters.clickref4
    ),
    clickref5: cleanOptionalValue(
      parameters.clickref5
    ),
    clickref6: cleanOptionalValue(
      parameters.clickref6
    ),
  };

  const hasValues = Object.values(
    cleaned
  ).some(Boolean);

  return hasValues
    ? cleaned
    : undefined;
}

function isLinkBuilderUnavailable(
  error: unknown
): boolean {
  if (!(error instanceof AwinApiError)) {
    return false;
  }

  const bodyText =
    typeof error.responseBody === "string"
      ? error.responseBody
      : JSON.stringify(
          error.responseBody ?? ""
        );

  const combined =
    `${error.message} ${bodyText}`.toLowerCase();

  return (
    combined.includes(
      "unknown error"
    ) ||
    combined.includes(
      "link builder"
    ) ||
    combined.includes(
      "not allow"
    ) ||
    error.status === 403
  );
}

export async function generateAwinLink(
  input: BuildAwinLinkInput
): Promise<AwinGeneratedLink> {
  if (
    !isValidAdvertiserId(
      input.advertiserId
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

  const destinationUrl =
    input.destinationUrl
      ? normaliseDestinationUrl(
          input.destinationUrl
        )
      : undefined;

  if (
    input.destinationUrl &&
    !destinationUrl
  ) {
    throw new AwinApiError(
      "The Awin destination URL must be a valid HTTP or HTTPS URL.",
      {
        code:
          "invalid_destination_url",
      }
    );
  }

  const programme =
    await findAwinMerchantByAdvertiserId(
      input.advertiserId
    );

  if (!programme) {
    throw new AwinApiError(
      "Beacon does not currently have an active Awin relationship with this advertiser.",
      {
        code:
          "advertiser_not_joined",
      }
    );
  }

  const publisherId =
    getAwinPublisherId();

  const response =
    await requestAwin<AwinGenerateLinkResponse>(
      `/publishers/${publisherId}/linkbuilder/generate`,
      {
        method: "POST",
        body: {
          advertiserId:
            input.advertiserId,

          ...(destinationUrl
            ? {
                destinationUrl,
              }
            : {}),

          ...(normaliseClickParameters(
            input.parameters
          )
            ? {
                parameters:
                  normaliseClickParameters(
                    input.parameters
                  ),
              }
            : {}),

          shorten:
            input.shorten ??
            false,
        },
      }
    );

  const trackedUrl =
    response.url?.trim();

  if (!trackedUrl) {
    throw new AwinApiError(
      response.description?.trim() ||
        "Awin did not return a tracking URL.",
      {
        code:
          "invalid_link_response",
        responseBody: response,
      }
    );
  }

  return {
    advertiserId:
      programme.advertiserId,

    advertiserName:
      programme.name,

    destinationUrl:
      destinationUrl ||
      programme.clickThroughUrl ||
      programme.displayUrl ||
      trackedUrl,

    trackedUrl,

    shortUrl:
      response.shortUrl?.trim() ||
      undefined,
  };
}

export async function buildTrackedAwinLink(
  input: BuildTrackedLinkInput
): Promise<AffiliateLinkResult> {
  const destinationUrl =
    normaliseDestinationUrl(
      input.destinationUrl
    );

  if (!destinationUrl) {
    return {
      affiliate: false,
      network: null,
      advertiserId: null,
      advertiserName: null,
      originalUrl:
        input.destinationUrl,
      destinationUrl:
        input.destinationUrl,
      trackedUrl:
        input.destinationUrl,
      reason:
        "invalid_destination",
    };
  }

  const merchantMatch =
    await findAwinMerchantByUrl(
      destinationUrl
    );

  if (!merchantMatch) {
    return {
      affiliate: false,
      network: null,
      advertiserId: null,
      advertiserName: null,
      originalUrl:
        destinationUrl,
      destinationUrl,
      trackedUrl:
        destinationUrl,
      reason:
        "merchant_not_joined",
    };
  }

  try {
    const generated =
      await generateAwinLink({
        advertiserId:
          merchantMatch.programme
            .advertiserId,

        destinationUrl,

        parameters:
          input.parameters,

        shorten:
          input.shorten,
      });

    return {
      affiliate: true,
      network: "awin",

      advertiserId:
        generated.advertiserId,

      advertiserName:
        generated.advertiserName,

      originalUrl:
        destinationUrl,

      destinationUrl:
        generated.destinationUrl,

      trackedUrl:
        generated.trackedUrl,

      shortUrl:
        generated.shortUrl,

      matchedDomain:
        merchantMatch.matchedDomain,
    };
  } catch (error) {
    if (
      isLinkBuilderUnavailable(
        error
      )
    ) {
      return {
        affiliate: false,
        network: null,
        advertiserId: null,
        advertiserName: null,
        originalUrl:
          destinationUrl,
        destinationUrl,
        trackedUrl:
          destinationUrl,
        reason:
          "link_builder_unavailable",
      };
    }

    throw error;
  }
}

export async function resolveAffiliateDestination(
  destinationUrl: string,
  options: {
    campaign?: string;
    clickReference?: string;
    shorten?: boolean;
  } = {}
): Promise<AffiliateLinkResult> {
  return buildTrackedAwinLink({
    destinationUrl,

    parameters: {
      campaign:
        options.campaign,

      clickref:
        options.clickReference,
    },

    shorten:
      options.shorten,
  });
}