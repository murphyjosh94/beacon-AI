import "server-only";

import {
  findRelevantAwinPartners,
  type JoinedAwinPartner,
} from "@/services/affiliate/awin/AwinPartnerCatalog";

import type {
  AggregatorProvider,
  AggregatorProviderContext,
  AggregatorProviderResult,
  AggregatorResult,
  AggregatorResultAttributes,
} from "@/services/aggregator/AggregatorTypes";

type PartnerCardContent = {
  title: string;
  description: string;
  highlights: string[];
  actionType:
    | "view_deal"
    | "view_hotel"
    | "view_offer"
    | "view_tickets"
    | "search_products";
};

function cleanText(
  value: string | undefined
): string | undefined {
  const cleaned = value
    ?.replace(/\s+/g, " ")
    .trim();

  return cleaned || undefined;
}

function normaliseText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createStableId(
  partner: JoinedAwinPartner
): string {
  return [
    "awin",
    partner.definition.key,
    partner.advertiserId,
  ].join("-");
}

function getDestinationUrl(
  partner: JoinedAwinPartner
): string {
  return (
    cleanText(
      partner.programme.clickThroughUrl
    ) ||
    cleanText(
      partner.programme.displayUrl
    ) ||
    ""
  );
}

function getPartnerCardContent(
  partner: JoinedAwinPartner,
  query: string
): PartnerCardContent {
  const normalisedQuery =
    normaliseText(query);

  switch (
    partner.definition.key
  ) {
    case "laterooms":
      return {
        title:
          "Search LateRooms.com",

        description:
          "Search LateRooms for UK hotel and accommodation options related to your request.",

        highlights: [
          "UK accommodation partner",
          "Hotel and short-break searches",
          "Tracked partner destination",
        ],

        actionType:
          "view_hotel",
      };

    case "champions-travel":
      return {
        title:
          "Explore Champions Travel",

        description:
          "Explore official-style sports travel, ticket and hospitality packages relevant to your request.",

        highlights: [
          "Sports travel packages",
          "Tickets and hospitality",
          "UK and European events",
        ],

        actionType:
          "view_tickets",
      };

    case "holiday-extras": {
      const isParking =
        normalisedQuery.includes(
          "parking"
        );

      const isLounge =
        normalisedQuery.includes(
          "lounge"
        );

      const isTransfer =
        normalisedQuery.includes(
          "transfer"
        );

      const isInsurance =
        normalisedQuery.includes(
          "insurance"
        );

      const serviceLabel =
        isParking
          ? "airport parking"
          : isLounge
            ? "airport lounges"
            : isTransfer
              ? "airport transfers"
              : isInsurance
                ? "travel insurance"
                : "travel extras";

      return {
        title:
          `Search Holiday Extras for ${serviceLabel}`,

        description:
          `Compare ${serviceLabel} through Holiday Extras for the trip or airport described in your request.`,

        highlights: [
          "Airport and holiday services",
          "Parking, hotels and lounges",
          "Transfers and insurance",
        ],

        actionType:
          "view_offer",
      };
    }

    case "compare-parking-prices":
      return {
        title:
          "Compare Airport Parking Prices",

        description:
          "Compare airport parking services, including park-and-ride and meet-and-greet options.",

        highlights: [
          "UK airport parking",
          "Price comparison",
          "Multiple parking options",
        ],

        actionType:
          "view_offer",
      };

    case "gsf-car-parts":
      return {
        title:
          "Check GSF Car Parts",

        description:
          "Search GSF Car Parts for products relevant to the vehicle and part described in your request. Confirm final compatibility on the retailer website.",

        highlights: [
          "Automotive parts partner",
          "Vehicle compatibility tools",
          "UK retailer",
        ],

        actionType:
          "search_products",
      };

    case "cjs-cdkeys":
      return {
        title:
          "Search CJS CD Keys",

        description:
          "Search CJS CD Keys for gaming, Windows, Office and other digital software products related to your request.",

        highlights: [
          "Game and software keys",
          "Digital delivery",
          "Gaming and productivity software",
        ],

        actionType:
          "view_deal",
      };

    default:
      return {
        title:
          `Explore ${partner.definition.displayName}`,

        description:
          `View relevant offers from ${partner.definition.displayName}.`,

        highlights: [
          "Joined Beacon partner",
          "Tracked destination",
        ],

        actionType:
          "view_offer",
      };
  }
}

function calculateRelevanceScore(
  partner: JoinedAwinPartner,
  query: string
): number {
  const normalisedQuery =
    normaliseText(query);

  const matchingTerms =
    partner.definition.searchTerms.filter(
      (term) =>
        normalisedQuery.includes(
          normaliseText(term)
        )
    ).length;

  if (matchingTerms >= 3) {
    return 96;
  }

  if (matchingTerms === 2) {
    return 91;
  }

  if (matchingTerms === 1) {
    return 84;
  }

  return 70;
}

function calculateTrustScore(
  partner: JoinedAwinPartner
): number {
  let score = 76;

  if (
    partner.programme.clickThroughUrl
  ) {
    score += 8;
  }

  if (
    partner.programme.displayUrl
  ) {
    score += 5;
  }

  if (
    partner.domains.length > 0
  ) {
    score += 6;
  }

  if (
    partner.programme.logoUrl
  ) {
    score += 3;
  }

  return Math.min(
    score,
    100
  );
}

function createAttributes(
  partner: JoinedAwinPartner,
  content: PartnerCardContent
): AggregatorResultAttributes {
  return {
    network: "awin",

    advertiserId:
      partner.advertiserId,

    partnerKey:
      partner.definition.key,

    actionType:
      content.actionType,

    programmeStatus:
      partner.programme
        .programmeStatus ??
      null,

    linkStatus:
      partner.programme
        .linkStatus ??
      null,

    countryCode:
      partner.programme
        .countryCode ??
      null,

    primarySector:
      partner.programme
        .primarySector ??
      null,

    conversionRate:
      partner.definition
        .observedConversionRate ??
      null,

    capabilities:
      partner.definition.capabilities.join(
        ", "
      ),
  };
}

function mapPartnerToResult(
  partner: JoinedAwinPartner,
  context: AggregatorProviderContext
): AggregatorResult | null {
  const destinationUrl =
    getDestinationUrl(partner);

  if (!destinationUrl) {
    return null;
  }

  const content =
    getPartnerCardContent(
      partner,
      context.query
    );

  const relevanceScore =
    calculateRelevanceScore(
      partner,
      context.query
    );

  const trustScore =
    calculateTrustScore(
      partner
    );

  return {
    id:
      createStableId(partner),

    providerId:
      "awin-partners",

    source:
      "affiliate",

    vertical:
      context.vertical,

    category:
      context.vertical ===
      "shopping"
        ? "product"
        : context.vertical ===
            "entertainment"
          ? "experience"
          : context.vertical ===
              "services"
            ? "service"
            : "holiday",

    title:
      content.title,

    description:
      content.description,

    merchant:
      partner.definition
        .displayName,

    brand:
      partner.definition
        .displayName,

    destinationUrl,

    imageUrl:
      cleanText(
        partner.programme.logoUrl
      ),

    price:
      undefined,

    previousPrice:
      undefined,

    rating:
      undefined,

    reviewCount:
      undefined,

    location:
      partner.programme
        .regionName,

    highlights:
      content.highlights,

    warnings: [
      "Prices, availability and final eligibility are confirmed on the partner website.",
    ],

    attributes:
      createAttributes(
        partner,
        content
      ),

    sponsored: false,

    relevanceScore,

    valueScore: 65,

    qualityScore: 72,

    trustScore,

    overallScore:
      undefined,
  };
}

async function searchProvider(
  context: AggregatorProviderContext
): Promise<AggregatorProviderResult> {
  const startedAt =
    Date.now();

  const partners =
    await findRelevantAwinPartners({
      query:
        context.query,

      vertical:
        context.vertical,

      countryCode: "GB",
    });

  const results =
    partners
      .map((partner) =>
        mapPartnerToResult(
          partner,
          context
        )
      )
      .filter(
        (
          result
        ): result is AggregatorResult =>
          result !== null
      )
      .slice(
        0,
        context.limit
      );

  return {
    providerId:
      "awin-partners",

    results,

    metadata: {
      searchedAt:
        new Date().toISOString(),

      totalResults:
        results.length,

      durationMs:
        Date.now() -
        startedAt,
    },

    warnings: [],
  };
}

export const awinPartnerAggregatorProvider: AggregatorProvider =
  {
    id:
      "awin-partners",

    verticals: [
      "shopping",
      "travel",
      "entertainment",
      "services",
    ],

    priority: 90,

    isAvailable() {
      return Boolean(
        process.env
          .AWIN_API_TOKEN
          ?.trim() &&
        process.env
          .AWIN_PUBLISHER_ID
          ?.trim()
      );
    },

    search:
      searchProvider,
  };