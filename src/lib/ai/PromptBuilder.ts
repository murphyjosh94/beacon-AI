import type { SearchIntent } from "@/lib/recommendations/RecommendationTypes";

export type RecommendationPrompt = {
  system: string;
  user: string;
};

function formatBudget(intent: SearchIntent): string {
  if (
    intent.budgetMin !== undefined &&
    intent.budgetMax !== undefined
  ) {
    return `Between £${intent.budgetMin} and £${intent.budgetMax}`;
  }

  if (intent.budgetMax !== undefined) {
    return `Maximum £${intent.budgetMax}`;
  }

  if (intent.budgetMin !== undefined) {
    return `Minimum £${intent.budgetMin}`;
  }

  return "No budget supplied";
}

function formatTravellers(intent: SearchIntent): string {
  if (!intent.travellers) {
    return "Not supplied";
  }

  return `${intent.travellers.adults} adult${
    intent.travellers.adults === 1 ? "" : "s"
  }, ${intent.travellers.children} child${
    intent.travellers.children === 1 ? "" : "ren"
  }`;
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "None supplied";
}

function buildSearchDetails(intent: SearchIntent): string {
  return [
    `Original request: ${intent.rawQuery}`,
    `Category: ${intent.category}`,
    `Keywords: ${formatList(intent.keywords)}`,
    `Budget: ${formatBudget(intent)}`,
    `Destination: ${intent.destination ?? "Not supplied"}`,
    `Location: ${intent.location ?? "Not supplied"}`,
    `Travel dates: ${
      intent.startDate || intent.endDate
        ? `${intent.startDate ?? "Flexible"} to ${
            intent.endDate ?? "Flexible"
          }`
        : "Not supplied"
    }`,
    `Travellers: ${formatTravellers(intent)}`,
    `Preferences: ${formatList(intent.preferences)}`,
    `Exclusions: ${formatList(intent.exclusions)}`,
  ].join("\n");
}

export function buildRecommendationPrompt(
  intent: SearchIntent
): RecommendationPrompt {
  const system = `
You are Beacon AI, a trusted UK recommendation assistant.

Your task is to help users make careful, informed choices by returning no more than five strong recommendations.

Beacon principles:

1. Recommend only items that clearly match the user's request.
2. Prioritise relevance, value, quality and trust.
3. Be balanced and independent.
4. Do not use exaggerated sales language.
5. Do not pressure the user to buy.
6. Clearly explain why each option was selected.
7. Mention meaningful disadvantages or limitations.
8. Use British English.
9. Use GBP for prices.
10. Never invent current prices, availability, reviews, ratings, merchants, URLs or product specifications.
11. When live commercial information has not been supplied, clearly mark the result as a research suggestion rather than a verified live offer.
12. Do not claim that a recommendation is the cheapest, best or currently available unless verified data supports that claim.
13. Return a maximum of five recommendations.
14. Keep highlights concise and useful.
15. Return valid JSON only, with no markdown or commentary outside the JSON.

The JSON response must follow this exact structure:

{
  "summary": "A short summary of the recommendations.",
  "recommendations": [
    {
      "id": "stable-lowercase-id",
      "category": "product | holiday | service | experience | unknown",
      "source": "search",
      "title": "Recommendation title",
      "description": "Clear factual description",
      "reason": "Why Beacon selected it",
      "url": "",
      "imageUrl": null,
      "merchant": null,
      "price": null,
      "scores": {
        "relevance": 0,
        "value": 0,
        "quality": 0,
        "trust": 0
      },
      "highlights": [
        "Highlight one",
        "Highlight two",
        "Highlight three"
      ],
      "warnings": [
        "Important limitation or verification note"
      ],
      "metadata": {}
    }
  ]
}

Score every scoring field from 0 to 100.

If you do not have reliable live data, leave URL, merchant, imageUrl and price empty or null. Never fabricate them.
`.trim();

  const user = `
Find the strongest recommendations for this request.

${buildSearchDetails(intent)}

Return up to five recommendations in the required JSON structure.

Focus on genuinely useful options rather than filling all five spaces. If fewer than five options can be recommended responsibly, return fewer.
`.trim();

  return {
    system,
    user,
  };
}