import "server-only";

import {
  getAwinPublisherId,
  requestAwin,
} from "@/services/affiliate/awin/AwinClient";

type AwinDomain = {
  domain?: string;
};

type AwinPrimaryRegion = {
  countryCode?: string;
  name?: string;
};

type AwinProgrammeApiRecord = {
  id?: number;
  name?: string;

  description?: string;
  displayUrl?: string;
  clickThroughUrl?: string;
  logoUrl?: string;

  currencyCode?: string;
  primarySector?: string;

  status?: string;
  linkStatus?: string;

  primaryRegion?: AwinPrimaryRegion;
  validDomains?: AwinDomain[];
};

export type AwinProgramme = {
  advertiserId: number;
  name: string;

  description?: string;
  displayUrl?: string;
  clickThroughUrl?: string;
  logoUrl?: string;

  currencyCode?: string;
  primarySector?: string;

  programmeStatus?: string;
  linkStatus?: string;

  countryCode?: string;
  regionName?: string;

  domains: string[];
};

export type AwinProgrammeRelationship =
  | "joined"
  | "pending"
  | "suspended"
  | "rejected"
  | "notjoined";

export type GetAwinProgrammesOptions = {
  relationship?: AwinProgrammeRelationship;
  countryCode?: string;
  signal?: AbortSignal;
};

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
    const url = cleaned.includes("://")
      ? new URL(cleaned)
      : new URL(`https://${cleaned}`);

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

function extractDisplayUrlDomain(
  displayUrl?: string
): string | undefined {
  if (!displayUrl?.trim()) {
    return undefined;
  }

  const domain = normaliseDomain(
    displayUrl
  );

  return domain || undefined;
}

function uniqueDomains(
  values: Array<
    string | undefined
  >
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) =>
          value
            ? normaliseDomain(value)
            : ""
        )
        .filter(Boolean)
    )
  );
}

function mapProgramme(
  record: AwinProgrammeApiRecord
): AwinProgramme | null {
  if (
    typeof record.id !== "number" ||
    !Number.isInteger(record.id) ||
    record.id <= 0
  ) {
    return null;
  }

  const name =
    record.name?.trim();

  if (!name) {
    return null;
  }

  const apiDomains =
    record.validDomains?.map(
      (item) =>
        item.domain
    ) ?? [];

  const domains =
    uniqueDomains([
      ...apiDomains,
      extractDisplayUrlDomain(
        record.displayUrl
      ),
    ]);

  return {
    advertiserId: record.id,
    name,

    description:
      record.description?.trim() ||
      undefined,

    displayUrl:
      record.displayUrl?.trim() ||
      undefined,

    clickThroughUrl:
      record.clickThroughUrl?.trim() ||
      undefined,

    logoUrl:
      record.logoUrl?.trim() ||
      undefined,

    currencyCode:
      record.currencyCode?.trim() ||
      undefined,

    primarySector:
      record.primarySector?.trim() ||
      undefined,

    programmeStatus:
      record.status?.trim() ||
      undefined,

    linkStatus:
      record.linkStatus?.trim() ||
      undefined,

    countryCode:
      record.primaryRegion
        ?.countryCode
        ?.trim()
        ?.toUpperCase() ||
      undefined,

    regionName:
      record.primaryRegion
        ?.name
        ?.trim() ||
      undefined,

    domains,
  };
}

function normaliseCountryCode(
  countryCode?: string
): string | undefined {
  const cleaned =
    countryCode
      ?.trim()
      .toUpperCase();

  if (!cleaned) {
    return undefined;
  }

  if (
    !/^[A-Z]{2}$/.test(
      cleaned
    )
  ) {
    throw new Error(
      "Awin countryCode must be a two-letter ISO country code."
    );
  }

  return cleaned;
}

export async function getAwinProgrammes(
  options: GetAwinProgrammesOptions = {}
): Promise<AwinProgramme[]> {
  const publisherId =
    getAwinPublisherId();

  const relationship =
    options.relationship ??
    "joined";

  const countryCode =
    normaliseCountryCode(
      options.countryCode
    );

  const records =
    await requestAwin<
      AwinProgrammeApiRecord[]
    >(
      `/publishers/${publisherId}/programmes`,
      {
        method: "GET",
        query: {
          relationship,
          countryCode,
        },
        signal:
          options.signal,
      }
    );

  if (!Array.isArray(records)) {
    throw new Error(
      "Awin returned an invalid programme response."
    );
  }

  return records
    .map(mapProgramme)
    .filter(
      (
        programme
      ): programme is AwinProgramme =>
        programme !== null
    )
    .sort((left, right) =>
      left.name.localeCompare(
        right.name,
        "en-GB"
      )
    );
}

export async function getJoinedAwinProgrammes(
  countryCode?: string
): Promise<AwinProgramme[]> {
  return getAwinProgrammes({
    relationship: "joined",
    countryCode,
  });
}

export async function findAwinProgrammeByAdvertiserId(
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
    await getJoinedAwinProgrammes();

  return (
    programmes.find(
      (programme) =>
        programme.advertiserId ===
        advertiserId
    ) ?? null
  );
}