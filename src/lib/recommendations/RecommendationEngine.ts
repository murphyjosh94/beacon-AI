import type {
  Recommendation,
  RecommendationRequest,
  RecommendationResponse,
} from "@/lib/recommendations/RecommendationTypes";

import { parseSearchQuery } from "@/lib/search/SearchParser";
import { assertValidSearchIntent } from "@/lib/search/SearchValidator";
import { applyIntentClassification } from "@/lib/search/IntentClassifier";

import { selectBestRecommendations } from "@/lib/recommendations/RecommendationRanking";
import { buildRecommendationResponse } from "@/lib/recommendations/RecommendationExplainer";

export class RecommendationEngine {
  async search(
    query: string,
    recommendations: Recommendation[]
  ): Promise<RecommendationResponse> {
    let intent = parseSearchQuery(query);

    intent = applyIntentClassification(intent);

    assertValidSearchIntent(intent);

    const request: RecommendationRequest = {
      intent,
      limit: 5,
    };

    const selected = selectBestRecommendations(
      recommendations,
      request
    );

    return buildRecommendationResponse(
      intent,
      selected
    );
  }
}

export const recommendationEngine =
  new RecommendationEngine();