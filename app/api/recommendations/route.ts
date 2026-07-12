import { NextResponse } from "next/server";
import { buildDemoRecommendations } from "@/lib/engine/buildDemoRecommendations";
import { extractIntent } from "@/lib/engine/intent/extractIntent";
import type {
  BeaconCategory,
  BeaconSearchRequest,
  BeaconSearchResponse,
} from "@/lib/engine/types";

const allowedCategories: BeaconCategory[] = [
  "shopping",
  "getaways",
  "entertainment",
];

function isBeaconCategory(
  value: unknown
): value is BeaconCategory {
  return allowedCategories.includes(value as BeaconCategory);
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as Partial<BeaconSearchRequest>;

    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json(
        {
          error: "Please tell Beacon what you are looking for.",
        },
        {
          status: 400,
        }
      );
    }

    const categoryHint = isBeaconCategory(body.category)
      ? body.category
      : undefined;

    const intent = extractIntent(query, categoryHint);

    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });

    const response: BeaconSearchResponse = {
      query,
      category: intent.category,
      intent,
      recommendations: buildDemoRecommendations(intent),
      isDemo: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Beacon recommendation error:", error);

    return NextResponse.json(
      {
        error:
          "Beacon could not complete this search. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}