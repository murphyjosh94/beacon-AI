export type BeaconCategory =
  | "shopping"
  | "getaways"
  | "entertainment";

export type BeaconIntent = {
  originalQuery: string;
  category: BeaconCategory;

  budget?: number;
  destination?: string;
  departingFrom?: string;

  adults?: number;
  children?: number;

  dates?: string[];
  brands?: string[];
  preferences: string[];
};

export type BeaconScoreDetails = {
  budgetScore: number;
  preferenceScore: number;
  completenessScore: number;
  trustScore: number;
};

export type BeaconRecommendation = {
  id: string;
  title: string;
  provider: string;
  description: string;
  score: number;
  scoreDetails: BeaconScoreDetails;
  reasons: string[];
  price?: number;
  priceLabel?: string;
  destinationUrl: string;
  features: string[];
  sponsored?: boolean;
};

export type BeaconSearchRequest = {
  query: string;
  category?: BeaconCategory;
};

export type BeaconSearchResponse = {
  query: string;
  category: BeaconCategory;
  intent: BeaconIntent;
  recommendations: BeaconRecommendation[];
  isDemo: boolean;
};