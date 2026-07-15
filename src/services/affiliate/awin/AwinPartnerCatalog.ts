import "server-only";

import {
  getAwinMerchantRegistry,
  type AwinMerchantMatch,
} from "@/services/affiliate/awin/AwinMerchantRegistry";

import type {
  AwinProgramme,
} from "@/services/affiliate/awin/AwinProgrammeService";

import type {
  AggregatorVertical,
} from "@/services/aggregator/AggregatorTypes";

export type AwinPartnerCapability =
  | "hotels"
  | "sports_travel"
  | "airport_parking"
  | "airport_hotels"
  | "airport_lounges"
  | "airport_transfers"
  | "travel_insurance"
  | "car_parts"
  | "ev_charging"
  | "gaming"
  | "software"
  | "general_shopping";

export type AwinPartnerKey =
  | "champions-travel"
  | "laterooms"
  | "gsf-car-parts"
  | "ev-king"
  | "compare-parking-prices"
  | "holiday-extras"
  | "cjs-cdkeys";

export type AwinPartnerDefinition = {
  key: AwinPartnerKey;

  displayName: string;

  programmeNameAliases: string[];
  domainAliases: string[];

  verticals: AggregatorVertical[];
  capabilities: AwinPartnerCapability[];

  searchTerms: string[];
  countries: string[];

  priority: number;

  observedConversionRate?: number;
};

export type JoinedAwinPartner = {
  definition: AwinPartnerDefinition;
  programme: AwinProgramme;

  advertiserId: number;
  name: string;
  domains: string[];

  active: true;
};

export type AwinPartnerSearchContext = {
  query: string;
  vertical?: AggregatorVertical;
  countryCode?: string;
};

const PARTNER_DEFINITIONS: AwinPartnerDefinition[] = [
  {
    key: "laterooms",

    displayName: "LateRooms.com",

    programmeNameAliases: [
      "laterooms",
      "laterooms.com",
      "late rooms",
    ],

    domainAliases: [
      "laterooms.com",
    ],

    verticals: [
      "travel",
    ],

    capabilities: [
      "hotels",
    ],

    searchTerms: [
      "hotel",
      "hotels",
      "accommodation",
      "room",
      "rooms",
      "stay",
      "stays",
      "city break",
      "weekend break",
      "uk hotel",
      "uk hotels",
    ],

    countries: [
      "GB",
    ],

    priority: 95,

    observedConversionRate: 3.07,
  },

  {
    key: "champions-travel",

    displayName: "Champions Travel",

    programmeNameAliases: [
      "champions travel",
      "champion travel",
    ],

    domainAliases: [
      "champions-travel.com",
      "championstravel.com",
    ],

    verticals: [
      "travel",
      "entertainment",
    ],

    capabilities: [
      "sports_travel",
      "hotels",
    ],

    searchTerms: [
      "football",
      "football tickets",
      "football hospitality",
      "hospitality",
      "match tickets",
      "sports travel",
      "sports package",
      "champions league",
      "premier league",
      "formula 1",
      "f1",
      "rugby",
      "event package",
    ],

    countries: [
      "GB",
      "IE",
      "ES",
      "IT",
      "FR",
      "DE",
      "NL",
      "PT",
    ],

    priority: 100,

    observedConversionRate: 3.55,
  },

  {
    key: "holiday-extras",

    displayName: "Holiday Extras",

    programmeNameAliases: [
      "holiday extras",
      "holidayextras",
    ],

    domainAliases: [
      "holidayextras.com",
      "holidayextras.co.uk",
    ],

    verticals: [
      "travel",
      "services",
    ],

    capabilities: [
      "airport_parking",
      "airport_hotels",
      "airport_lounges",
      "airport_transfers",
      "travel_insurance",
    ],

    searchTerms: [
      "airport parking",
      "parking at airport",
      "airport hotel",
      "airport hotels",
      "airport lounge",
      "airport lounges",
      "airport transfer",
      "airport transfers",
      "travel insurance",
      "holiday insurance",
      "meet and greet parking",
      "park and ride",
    ],

    countries: [
      "GB",
    ],

    priority: 100,

    observedConversionRate: 7.85,
  },

  {
    key: "compare-parking-prices",

    displayName: "Compare Parking Prices UK",

    programmeNameAliases: [
      "compare parking prices uk",
      "compare parking prices",
    ],

    domainAliases: [
      "compareparkingprices.co.uk",
    ],

    verticals: [
      "travel",
      "services",
    ],

    capabilities: [
      "airport_parking",
    ],

    searchTerms: [
      "airport parking",
      "parking at airport",
      "cheap airport parking",
      "meet and greet parking",
      "park and ride",
      "airport car park",
    ],

    countries: [
      "GB",
    ],

    priority: 95,

    observedConversionRate: 5.31,
  },

  {
    key: "gsf-car-parts",

    displayName: "GSF Car Parts",

    programmeNameAliases: [
      "gsf car parts",
      "gsf",
    ],

    domainAliases: [
      "gsfcarparts.com",
    ],

    verticals: [
      "shopping",
    ],

    capabilities: [
      "car_parts",
    ],

    searchTerms: [
      "car part",
      "car parts",
      "brake pads",
      "brake discs",
      "battery",
      "car battery",
      "injector",
      "injectors",
      "fuel injector",
      "oil filter",
      "air filter",
      "fuel filter",
      "wiper blade",
      "wiper blades",
      "alternator",
      "starter motor",
      "turbo",
      "suspension",
      "engine oil",
    ],

    countries: [
      "GB",
    ],

    priority: 100,

    observedConversionRate: 7.51,
  },

  {
    key: "ev-king",

    displayName: "EV King",

    programmeNameAliases: [
      "ev king",
      "ev king electric car charging accessories",
      "evking",
      "ev cable shop",
    ],

    domainAliases: [
      "evking.co.uk",
    ],

    verticals: [
      "shopping",
    ],

    capabilities: [
      "ev_charging",
    ],

    searchTerms: [
      "ev charger",
      "ev chargers",
      "electric car charger",
      "electric vehicle charger",
      "charging cable",
      "charging cables",
      "ev charging cable",
      "ev charging cables",
      "type 1 cable",
      "type 2 cable",
      "type 1 charging cable",
      "type 2 charging cable",
      "portable ev charger",
      "home ev charger",
      "electric car accessories",
      "electric vehicle accessories",
      "tesla charging cable",
      "tesla charger",
      "hybrid charging cable",
      "phev charging cable",
    ],

    countries: [
      "GB",
    ],

    priority: 100,
  },

  {
    key: "cjs-cdkeys",

    displayName: "CJS CD Keys UK",

    programmeNameAliases: [
      "cjs cd keys uk",
      "cjs cd keys",
      "cjs-cdkeys",
      "cjs",
    ],

    domainAliases: [
      "cjs-cdkeys.com",
    ],

    verticals: [
      "shopping",
      "entertainment",
    ],

    capabilities: [
      "gaming",
      "software",
    ],

    searchTerms: [
      "game key",
      "game keys",
      "cd key",
      "cd keys",
      "steam key",
      "steam keys",
      "xbox key",
      "playstation key",
      "pc game",
      "windows key",
      "windows licence",
      "windows license",
      "office key",
      "office licence",
      "office license",
      "software key",
      "software licence",
      "software license",
      "antivirus",
    ],

    countries: [
      "GB",
    ],

    priority: 100,

    observedConversionRate: 5.19,
  },
];

function normaliseText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(
      /[^\p{L}\p{N}\s.-]/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseDomain(
  value: string
): string {
  const cleaned =
    value.trim().toLowerCase();

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

function namesMatch(
  programmeName: string,
  aliases: string[]
): boolean {
  const normalisedName =
    normaliseText(
      programmeName
    );

  return aliases.some(
    (alias) => {
      const normalisedAlias =
        normaliseText(alias);

      return (
        normalisedName ===
          normalisedAlias ||
        normalisedName.includes(
          normalisedAlias
        ) ||
        normalisedAlias.includes(
          normalisedName
        )
      );
    }
  );
}

function domainsMatch(
  programmeDomains: string[],
  definitionDomains: string[]
): boolean {
  const normalisedProgrammeDomains =
    programmeDomains
      .map(normaliseDomain)
      .filter(Boolean);

  const normalisedDefinitionDomains =
    definitionDomains
      .map(normaliseDomain)
      .filter(Boolean);

  return normalisedProgrammeDomains.some(
    (programmeDomain) =>
      normalisedDefinitionDomains.some(
        (definitionDomain) =>
          programmeDomain ===
            definitionDomain ||
          programmeDomain.endsWith(
            `.${definitionDomain}`
          ) ||
          definitionDomain.endsWith(
            `.${programmeDomain}`
          )
      )
  );
}

function matchDefinition(
  programme: AwinProgramme
): AwinPartnerDefinition | null {
  const domainMatch =
    PARTNER_DEFINITIONS.find(
      (definition) =>
        domainsMatch(
          programme.domains,
          definition.domainAliases
        )
    );

  if (domainMatch) {
    return domainMatch;
  }

  return (
    PARTNER_DEFINITIONS.find(
      (definition) =>
        namesMatch(
          programme.name,
          definition.programmeNameAliases
        )
    ) ?? null
  );
}

function queryMatchesPartner(
  query: string,
  definition: AwinPartnerDefinition
): boolean {
  const normalisedQuery =
    normaliseText(query);

  return definition.searchTerms.some(
    (term) =>
      normalisedQuery.includes(
        normaliseText(term)
      )
  );
}

function countryMatchesPartner(
  countryCode: string | undefined,
  definition: AwinPartnerDefinition
): boolean {
  if (!countryCode?.trim()) {
    return true;
  }

  const normalisedCountry =
    countryCode
      .trim()
      .toUpperCase();

  return definition.countries.includes(
    normalisedCountry
  );
}

function verticalMatchesPartner(
  vertical:
    | AggregatorVertical
    | undefined,
  definition: AwinPartnerDefinition
): boolean {
  if (!vertical) {
    return true;
  }

  return definition.verticals.includes(
    vertical
  );
}

function calculatePartnerMatchScore(
  query: string,
  definition: AwinPartnerDefinition
): number {
  const normalisedQuery =
    normaliseText(query);

  let score =
    definition.priority;

  const matchingTerms =
    definition.searchTerms.filter(
      (term) =>
        normalisedQuery.includes(
          normaliseText(term)
        )
    );

  score += Math.min(
    matchingTerms.length * 5,
    20
  );

  return score;
}

export function getAwinPartnerDefinitions(): AwinPartnerDefinition[] {
  return PARTNER_DEFINITIONS.map(
    (definition) => ({
      ...definition,

      programmeNameAliases: [
        ...definition.programmeNameAliases,
      ],

      domainAliases: [
        ...definition.domainAliases,
      ],

      verticals: [
        ...definition.verticals,
      ],

      capabilities: [
        ...definition.capabilities,
      ],

      searchTerms: [
        ...definition.searchTerms,
      ],

      countries: [
        ...definition.countries,
      ],
    })
  );
}

export async function getJoinedAwinPartners(): Promise<
  JoinedAwinPartner[]
> {
  const programmes =
    await getAwinMerchantRegistry();

  return programmes
    .map((programme) => {
      const definition =
        matchDefinition(
          programme
        );

      if (!definition) {
        return null;
      }

      return {
        definition,
        programme,

        advertiserId:
          programme.advertiserId,

        name:
          programme.name,

        domains: [
          ...programme.domains,
        ],

        active: true as const,
      };
    })
    .filter(
      (
        partner
      ): partner is JoinedAwinPartner =>
        partner !== null
    )
    .sort(
      (left, right) =>
        right.definition.priority -
        left.definition.priority
    );
}

export async function findRelevantAwinPartners(
  context: AwinPartnerSearchContext
): Promise<JoinedAwinPartner[]> {
  const query =
    context.query.trim();

  if (!query) {
    return [];
  }

  const partners =
    await getJoinedAwinPartners();

  return partners
    .filter((partner) =>
      verticalMatchesPartner(
        context.vertical,
        partner.definition
      )
    )
    .filter((partner) =>
      countryMatchesPartner(
        context.countryCode,
        partner.definition
      )
    )
    .filter((partner) =>
      queryMatchesPartner(
        query,
        partner.definition
      )
    )
    .sort(
      (left, right) =>
        calculatePartnerMatchScore(
          query,
          right.definition
        ) -
        calculatePartnerMatchScore(
          query,
          left.definition
        )
    );
}

export async function findAwinPartnerByCapability(
  capability: AwinPartnerCapability
): Promise<JoinedAwinPartner[]> {
  const partners =
    await getJoinedAwinPartners();

  return partners.filter(
    (partner) =>
      partner.definition.capabilities.includes(
        capability
      )
  );
}

export async function findJoinedAwinPartnerByUrl(
  match: AwinMerchantMatch
): Promise<JoinedAwinPartner | null> {
  const definition =
    matchDefinition(
      match.programme
    );

  if (!definition) {
    return null;
  }

  return {
    definition,

    programme:
      match.programme,

    advertiserId:
      match.programme.advertiserId,

    name:
      match.programme.name,

    domains: [
      ...match.programme.domains,
    ],

    active: true,
  };
}