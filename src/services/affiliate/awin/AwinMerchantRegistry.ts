import "server-only";

import {
  getJoinedAwinProgrammes,
  type AwinProgramme,
} from "@/services/affiliate/awin/AwinProgrammeService";

export type AwinMerchantMatch = {
  programme: AwinProgramme;
  matchedDomain: string;
  destinationUrl: string;
};

type RegistryCache = {
  programmes: AwinProgramme[];
  createdAt: number;
};

const CACHE_DURATION_MS =
  15 * 60 * 1000;

let registryCache:
  | RegistryCache
  | null = null;

function normaliseDomain(
  value: string
): string {
  const cleaned = value
    .trim()
    .toLowerCase();

  if (!cleaned) {
    return "";
  }

  try {
    const url = cleaned.includes(
      "://"
    )
      ? new URL(cleaned)
      : new URL(
          `https://${cleaned}`
        );

    return url.hostname
      .replace(/^www\./, "")
      .replace(/\.$/, "");
  } catch {
    return cleaned
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .replace(/\.$/, "");
  }
}

function readDestinationDomain(
  destinationUrl: string
): string | null {
  const cleaned =
    destinationUrl.trim();

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

    const domain =
      normaliseDomain(
        url.hostname
      );

    return domain || null;
  } catch {
    return null;
  }
}

function isCacheValid(
  cache: RegistryCache
): boolean {
  return (
    Date.now() -
      cache.createdAt <
    CACHE_DURATION_MS
  );
}

function domainMatches(
  destinationDomain: string,
  programmeDomain: string
): boolean {
  if (
    destinationDomain ===
    programmeDomain
  ) {
    return true;
  }

  return destinationDomain.endsWith(
    `.${programmeDomain}`
  );
}

function programmeMatchesDomain(
  programme: AwinProgramme,
  destinationDomain: string
): string | null {
  const matchingDomains =
    programme.domains
      .map(normaliseDomain)
      .filter(Boolean)
      .sort(
        (left, right) =>
          right.length -
          left.length
      );

  for (const domain of matchingDomains) {
    if (
      domainMatches(
        destinationDomain,
        domain
      )
    ) {
      return domain;
    }
  }

  return null;
}

export async function getAwinMerchantRegistry(
  options: {
    forceRefresh?: boolean;
  } = {}
): Promise<AwinProgramme[]> {
  if (
    !options.forceRefresh &&
    registryCache &&
    isCacheValid(
      registryCache
    )
  ) {
    return registryCache.programmes;
  }

  const programmes =
    await getJoinedAwinProgrammes();

  registryCache = {
    programmes,
    createdAt: Date.now(),
  };

  return programmes;
}

export async function refreshAwinMerchantRegistry(): Promise<
  AwinProgramme[]
> {
  return getAwinMerchantRegistry({
    forceRefresh: true,
  });
}

export function clearAwinMerchantRegistryCache(): void {
  registryCache = null;
}

export async function findAwinMerchantByUrl(
  destinationUrl: string
): Promise<AwinMerchantMatch | null> {
  const destinationDomain =
    readDestinationDomain(
      destinationUrl
    );

  if (!destinationDomain) {
    return null;
  }

  const programmes =
    await getAwinMerchantRegistry();

  for (const programme of programmes) {
    const matchedDomain =
      programmeMatchesDomain(
        programme,
        destinationDomain
      );

    if (matchedDomain) {
      return {
        programme,
        matchedDomain,
        destinationUrl,
      };
    }
  }

  return null;
}

export async function findAwinMerchantByDomain(
  domain: string
): Promise<AwinProgramme | null> {
  const normalised =
    normaliseDomain(domain);

  if (!normalised) {
    return null;
  }

  const programmes =
    await getAwinMerchantRegistry();

  return (
    programmes.find(
      (programme) =>
        programmeMatchesDomain(
          programme,
          normalised
        ) !== null
    ) ?? null
  );
}

export async function findAwinMerchantByName(
  name: string
): Promise<AwinProgramme | null> {
  const normalisedName =
    name
      .trim()
      .toLowerCase();

  if (!normalisedName) {
    return null;
  }

  const programmes =
    await getAwinMerchantRegistry();

  const exactMatch =
    programmes.find(
      (programme) =>
        programme.name
          .trim()
          .toLowerCase() ===
        normalisedName
    );

  if (exactMatch) {
    return exactMatch;
  }

  return (
    programmes.find(
      (programme) => {
        const programmeName =
          programme.name
            .trim()
            .toLowerCase();

        return (
          programmeName.includes(
            normalisedName
          ) ||
          normalisedName.includes(
            programmeName
          )
        );
      }
    ) ?? null
  );
}

export async function findAwinMerchantByAdvertiserId(
  advertiserId: number
): Promise<AwinProgramme | null> {
  if (
    !Number.isInteger(
      advertiserId
    ) ||
    advertiserId <= 0
  ) {
    return null;
  }

  const programmes =
    await getAwinMerchantRegistry();

  return (
    programmes.find(
      (programme) =>
        programme.advertiserId ===
        advertiserId
    ) ?? null
  );
}