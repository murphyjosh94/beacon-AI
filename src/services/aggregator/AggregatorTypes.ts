import type {
  Recommendation,
  RecommendationCategory,
  RecommendationPrice,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

export type AggregatorVertical =
  | "shopping"
  | "travel"
  | "flights"
  | "entertainment"
  | "services";

export type AggregatorProviderId =
  | "serpapi-shopping"
  | "serpapi-maps"
  | "serpapi-hotels"
  | "serpapi-flights"
  | "cjs-cdkeys"
  | "gsf-car-parts"
  | "laterooms"
  | "champions-travel"
  | "holiday-extras"
  | "public-web-search"
  | string;

export type AggregatorResultSource =
  | "merchant_feed"
  | "merchant_api"
  | "search_api"
  | "affiliate"
  | "public_search";

export type AggregatorResultAttributeValue =
  | string
  | number
  | boolean
  | null;

export type AggregatorResultAttributes = Record<
  string,
  AggregatorResultAttributeValue
>;

export type AggregatorResult = {
  id: string;

  providerId: AggregatorProviderId;
  source: AggregatorResultSource;
  vertical: AggregatorVertical;

  category: RecommendationCategory;

  title: string;
  description: string;

  merchant?: string;
  brand?: string;

  destinationUrl: string;
  imageUrl?: string;

  price?: RecommendationPrice;
  previousPrice?: RecommendationPrice;

  rating?: number;
  reviewCount?: number;

  location?: string;

  highlights: string[];
  warnings: string[];

  attributes: AggregatorResultAttributes;

  sponsored: boolean;

  relevanceScore?: number;
  valueScore?: number;
  qualityScore?: number;
  trustScore?: number;
  overallScore?: number;
};

export type AggregatorProviderContext = {
  query: string;
  intent: SearchIntent;
  vertical: AggregatorVertical;

  limit: number;

  signal?: AbortSignal;
};

export type AggregatorProviderResult = {
  providerId: AggregatorProviderId;

  results: AggregatorResult[];

  metadata?: {
    searchedAt?: string;
    requestId?: string;
    totalResults?: number;
    durationMs?: number;
  };

  warnings?: string[];
};

export type AggregatorProvider = {
  id: AggregatorProviderId;
  verticals: AggregatorVertical[];
  priority: number;

  isAvailable(): boolean | Promise<boolean>;

  search(
    context: AggregatorProviderContext
  ): Promise<AggregatorProviderResult>;
};

export type AggregatorProviderFailure = {
  providerId: AggregatorProviderId;
  message: string;
};

export type AggregatorExecutionOptions = {
  providerLimit?: number;
  finalLimit?: number;

  minimumScore?: number;
  minimumTrustScore?: number;

  timeoutMs?: number;

  signal?: AbortSignal;
};

export type AggregatorExecutionResult = {
  vertical: AggregatorVertical;
  query: string;
  intent: SearchIntent;

  recommendations: Recommendation[];

  providerResults: AggregatorProviderResult[];
  providerFailures: AggregatorProviderFailure[];

  statistics: {
    providersRequested: number;
    providersCompleted: number;
    providersFailed: number;

    rawResults: number;
    normalisedResults: number;
    deduplicatedResults: number;
    selectedResults: number;
  };
};