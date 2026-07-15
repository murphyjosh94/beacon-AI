export type RecommendationCategory =
  | "product"
  | "holiday"
  | "service"
  | "experience"
  | "unknown";

export type RecommendationSource =
  | "affiliate"
  | "merchant"
  | "travel"
  | "search"
  | "manual";

export type RecommendationPrice = {
  amount: number;
  currency: "GBP";
  display: string;
};

export type RecommendationScore = {
  overall: number;
  relevance: number;
  value: number;
  quality: number;
  trust: number;
};

export type RecommendationMetadataValue =
  | string
  | number
  | boolean
  | null
  | RecommendationPrice
  | Record<
      string,
      string | number | boolean | null
    >;

export type RecommendationMetadata = Record<
  string,
  RecommendationMetadataValue
>;

export type Recommendation = {
  id: string;

  category: RecommendationCategory;
  source: RecommendationSource;

  title: string;
  description: string;
  reason: string;

  url: string;
  imageUrl?: string;
  merchant?: string;

  price?: RecommendationPrice;

  score: RecommendationScore;

  highlights: string[];
  warnings?: string[];

  affiliateUrl?: string;

  metadata?: RecommendationMetadata;
};

export type SearchIntent = {
  rawQuery: string;

  category: RecommendationCategory;

  keywords: string[];

  budgetMin?: number;
  budgetMax?: number;

  location?: string;
  destination?: string;

  startDate?: string;
  endDate?: string;

  travellers?: {
    adults: number;
    children: number;
  };

  preferences: string[];
  exclusions: string[];
};

export type RecommendationRequest = {
  userId?: string;
  intent: SearchIntent;
  limit: number;
};

export type RecommendationResponse = {
  query: string;
  summary: string;
  recommendations: Recommendation[];
  generatedAt: string;
};