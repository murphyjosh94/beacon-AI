import "server-only";

import {
  prepareBeaconIntent,
} from "@/services/orchestrator/BeaconIntentAdapter";

import {
  executeBeaconRoute,
} from "@/services/orchestrator/BeaconRouteExecutor";

import {
  BeaconEngineError,
  createInvalidSearchError,
  createMissingQueryError,
} from "@/services/orchestrator/BeaconEngineErrors";

import type {
  BeaconResponse,
} from "@/services/response/BeaconResponse";

export {
  BeaconEngineError,
} from "@/services/orchestrator/BeaconEngineErrors";

export type {
  BeaconEngineErrorCode,
} from "@/services/orchestrator/BeaconEngineErrors";

const DEFAULT_RESULT_LIMIT = 5;

export async function executeBeaconRequest(
  rawQuery: string
): Promise<BeaconResponse> {
  if (
    typeof rawQuery !== "string" ||
    !rawQuery.trim()
  ) {
    throw createMissingQueryError();
  }

  try {
    const prepared =
      prepareBeaconIntent({
        rawQuery,

        resultLimit:
          DEFAULT_RESULT_LIMIT,
      });

    return await executeBeaconRoute({
      query:
        prepared.query,

      plan:
        prepared.plan,

      intent:
        prepared.intent,
    });
  } catch (error) {
    if (
      error instanceof
      BeaconEngineError
    ) {
      throw error;
    }

    console.error(
      "Beacon engine execution failed:",
      error
    );

    throw createInvalidSearchError(
      error
    );
  }
}