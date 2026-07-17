import type {
  Recommendation,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

export type BeaconResponseType =
  | "recommendations"
  | "general_answer";

export type BeaconResponseSource =
  | "shopping"
  | "hotel"
  | "flight"
  | "entertainment"
  | "affiliate"
  | "general";

export type BeaconDataProvider =
  | "serpapi-google-shopping"
  | "serpapi-google-hotels"
  | "serpapi-google-maps"
  | "serpapi-google-flights"
  | "cjs-cdkeys"
  | "gsf-car-parts"
  | "laterooms"
  | "champions-travel"
  | "holiday-extras"
  | "openai"
  | "openai-web-search"
  | "mixed";

type BeaconResponseBase = {
  query: string;
  responseType: BeaconResponseType;
  source: BeaconResponseSource;
  dataProvider: BeaconDataProvider;
  liveData: boolean;
  generatedAt: string;
};

export type BeaconRecommendationResponse =
  BeaconResponseBase & {
    responseType: "recommendations";
    intent: SearchIntent;
    summary: string;
    aiSummary?: string;
    recommendations: Recommendation[];
  };

export type BeaconGeneralAnswerResponse =
  BeaconResponseBase & {
    responseType: "general_answer";
    answer: string;
    usedWebSearch: boolean;
    recommendations: [];
  };

export type BeaconResponse =
  | BeaconRecommendationResponse
  | BeaconGeneralAnswerResponse;

export type BeaconApiSuccessResponse = {
  success: true;
  data: BeaconResponse;
  publicPath?: string;
  account?: {
    freeDailyLimit: number;
    creditCharged: boolean;
    purchasedCreditsRemaining: number;
    beaconPlusActive: boolean;
  };
};

export type BeaconApiErrorCode =
  | "invalid_request"
  | "missing_query"
  | "invalid_search"
  | "validation_failed"
  | "missing_destination"
  | "provider_unavailable"
  | "authentication_required"
  | "authentication_failed"
  | "billing_required"
  | "rate_limited"
  | "invalid_response"
  | "internal_error";

export type BeaconApiErrorResponse = {
  success: false;
  error: {
    code: BeaconApiErrorCode | string;
    message: string;
    issues?: unknown[];
  };
};

export type BeaconApiResponse =
  | BeaconApiSuccessResponse
  | BeaconApiErrorResponse;

export function createRecommendationResponse(input: {
  query: string;
  source: Exclude<
    BeaconResponseSource,
    "general"
  >;
  dataProvider: BeaconDataProvider;
  liveData: boolean;
  intent: SearchIntent;
  summary: string;
  aiSummary?: string;
  recommendations: Recommendation[];
}): BeaconRecommendationResponse {
  return {
    query: input.query,
    responseType: "recommendations",
    source: input.source,
    dataProvider: input.dataProvider,
    liveData: input.liveData,
    generatedAt: new Date().toISOString(),
    intent: input.intent,
    summary: input.summary,
    aiSummary: input.aiSummary,
    recommendations: input.recommendations,
  };
}

export function createGeneralAnswerResponse(input: {
  query: string;
  answer: string;
  usedWebSearch: boolean;
}): BeaconGeneralAnswerResponse {
  return {
    query: input.query,
    responseType: "general_answer",
    source: "general",
    dataProvider: input.usedWebSearch
      ? "openai-web-search"
      : "openai",
    liveData: input.usedWebSearch,
    generatedAt: new Date().toISOString(),
    answer: input.answer,
    usedWebSearch: input.usedWebSearch,
    recommendations: [],
  };
}