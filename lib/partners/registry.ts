export type PartnerStatus =
  | "researching"
  | "applied"
  | "pending"
  | "approved"
  | "rejected"
  | "paused";

export type PartnerNetwork =
  | "Awin"
  | "Impact"
  | "Partnerize"
  | "CJ"
  | "Rakuten"
  | "TradeTracker"
  | "Direct"
  | "Other";

export type PartnerCategory =
  | "shopping"
  | "getaways"
  | "entertainment"
  | "automotive"
  | "home"
  | "pets"
  | "family";

export type BeaconPartner = {
  id: string;
  name: string;
  network: PartnerNetwork;
  categories: PartnerCategory[];
  status: PartnerStatus;

  website?: string;
  programmeUrl?: string;

  productFeedAvailable: boolean;
  apiAvailable: boolean;
  deepLinksAvailable: boolean;

  commissionNotes?: string;
  cookieDurationDays?: number;
  notes?: string;
};

export const partnerRegistry: BeaconPartner[] = [
  {
    id: "holiday-extras",
    name: "Holiday Extras",
    network: "Awin",
    categories: ["getaways"],
    status: "pending",
    productFeedAvailable: true,
    apiAvailable: false,
    deepLinksAvailable: true,
    notes:
      "Priority partner for airport parking, hotels, lounges, transfers and travel extras.",
  },
  {
    id: "sykes-holiday-cottages",
    name: "Sykes Holiday Cottages",
    network: "Awin",
    categories: ["getaways"],
    status: "pending",
    productFeedAvailable: true,
    apiAvailable: false,
    deepLinksAvailable: true,
    notes:
      "Priority UK staycation partner covering cottages and family accommodation.",
  },
  {
    id: "haven-holidays",
    name: "Haven Holidays",
    network: "Awin",
    categories: ["getaways"],
    status: "pending",
    productFeedAvailable: false,
    apiAvailable: false,
    deepLinksAvailable: true,
    notes:
      "Family-focused UK holiday parks and coastal breaks.",
  },
  {
    id: "park-holidays-uk",
    name: "Park Holidays UK",
    network: "Awin",
    categories: ["getaways"],
    status: "pending",
    productFeedAvailable: false,
    apiAvailable: false,
    deepLinksAvailable: true,
    notes:
      "UK family holiday parks and seaside accommodation.",
  },
  {
    id: "shorefield-holidays",
    name: "Shorefield Holidays",
    network: "Awin",
    categories: ["getaways"],
    status: "pending",
    productFeedAvailable: false,
    apiAvailable: false,
    deepLinksAvailable: true,
    notes:
      "Holiday parks and premium coastal breaks around the New Forest and south coast.",
  },
  {
    id: "neilson-holidays",
    name: "Neilson Holidays",
    network: "Awin",
    categories: ["getaways"],
    status: "pending",
    productFeedAvailable: false,
    apiAvailable: false,
    deepLinksAvailable: true,
    notes:
      "Activity-focused holidays including sailing, cycling and beach clubs.",
  },
  {
    id: "just-go-holidays",
    name: "Just Go Holidays",
    network: "Awin",
    categories: ["getaways"],
    status: "pending",
    productFeedAvailable: false,
    apiAvailable: false,
    deepLinksAvailable: true,
    notes:
      "Coach holidays, short breaks and organised UK or European trips.",
  },
  {
    id: "viator",
    name: "Viator",
    network: "Direct",
    categories: ["getaways", "entertainment"],
    status: "researching",
    productFeedAvailable: true,
    apiAvailable: true,
    deepLinksAvailable: true,
    notes:
      "Priority experiences partner for attractions, tours and activities.",
  },
  {
    id: "jet2holidays",
    name: "Jet2holidays",
    network: "Awin",
    categories: ["getaways"],
    status: "researching",
    productFeedAvailable: false,
    apiAvailable: false,
    deepLinksAvailable: false,
    notes:
      "Not currently visible in the Awin advertiser directory. Revisit when Beacon is live.",
  },
  {
    id: "tui",
    name: "TUI",
    network: "Direct",
    categories: ["getaways"],
    status: "researching",
    productFeedAvailable: false,
    apiAvailable: false,
    deepLinksAvailable: false,
    notes:
      "Major future package-holiday partner. May require a live website before application.",
  },
  {
    id: "easyjet-holidays",
    name: "easyJet holidays",
    network: "Partnerize",
    categories: ["getaways"],
    status: "researching",
    productFeedAvailable: false,
    apiAvailable: false,
    deepLinksAvailable: false,
    notes:
      "Future international package-holiday partner.",
  },
];