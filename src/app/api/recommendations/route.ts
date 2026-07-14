import { NextResponse } from "next/server";

import {
  BeaconEngineError,
  executeBeaconRequest,
} from "@/services/orchestrator/BeaconEngine";

type RecommendationRequestBody = {
  query?: unknown;
};

function readQuery(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function POST(request: Request) {
  try {
    let body: RecommendationRequestBody;

    try {
      body =
        (await request.json()) as RecommendationRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_request",
            message:
              "Beacon could not read this request.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const query = readQuery(body.query);

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "missing_query",
            message:
              "Please enter something for Beacon to help with.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await executeBeaconRequest(query);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof BeaconEngineError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            ...(error.issues
              ? {
                  issues: error.issues,
                }
              : {}),
          },
        },
        {
          status: error.status,
        }
      );
    }

    console.error(
      "Beacon recommendation route failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "internal_error",
          message:
            "Beacon could not complete this request. Please try again shortly.",
        },
      },
      {
        status: 500,
      }
    );
  }
}