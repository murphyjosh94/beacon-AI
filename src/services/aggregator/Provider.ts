import "server-only";

import type {
  AggregatorProvider,
  AggregatorProviderContext,
  AggregatorProviderFailure,
  AggregatorProviderResult,
  AggregatorVertical,
} from "@/services/aggregator/AggregatorTypes";

export type ProviderExecutionOutcome =
  | {
      success: true;
      provider: AggregatorProvider;
      result: AggregatorProviderResult;
      durationMs: number;
    }
  | {
      success: false;
      provider: AggregatorProvider;
      failure: AggregatorProviderFailure;
      durationMs: number;
    };

export type ExecuteProvidersOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

const DEFAULT_PROVIDER_TIMEOUT_MS = 15_000;
const MINIMUM_PROVIDER_TIMEOUT_MS = 1_000;
const MAXIMUM_PROVIDER_TIMEOUT_MS = 60_000;

function clampTimeout(
  value: number | undefined
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_PROVIDER_TIMEOUT_MS;
  }

  return Math.max(
    MINIMUM_PROVIDER_TIMEOUT_MS,
    Math.min(
      MAXIMUM_PROVIDER_TIMEOUT_MS,
      Math.floor(value)
    )
  );
}

function providerSupportsVertical(
  provider: AggregatorProvider,
  vertical: AggregatorVertical
): boolean {
  return provider.verticals.includes(
    vertical
  );
}

function createTimeoutSignal(
  timeoutMs: number,
  parentSignal?: AbortSignal
): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller =
    new AbortController();

  const abortFromParent = () => {
    controller.abort(
      parentSignal?.reason
    );
  };

  if (parentSignal) {
    if (parentSignal.aborted) {
      abortFromParent();
    } else {
      parentSignal.addEventListener(
        "abort",
        abortFromParent,
        {
          once: true,
        }
      );
    }
  }

  const timeout = setTimeout(
    () => {
      controller.abort(
        new Error(
          `Provider timed out after ${timeoutMs}ms.`
        )
      );
    },
    timeoutMs
  );

  return {
    signal: controller.signal,

    cleanup: () => {
      clearTimeout(timeout);

      parentSignal?.removeEventListener(
        "abort",
        abortFromParent
      );
    },
  };
}

function readFailureMessage(
  error: unknown,
  providerId: string
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return `${providerId} could not complete its search.`;
}

function normaliseProviderResult(
  provider: AggregatorProvider,
  result: AggregatorProviderResult,
  durationMs: number
): AggregatorProviderResult {
  return {
    providerId:
      provider.id,

    results:
      Array.isArray(result.results)
        ? result.results
        : [],

    metadata: {
      ...result.metadata,

      searchedAt:
        result.metadata?.searchedAt ??
        new Date().toISOString(),

      durationMs:
        result.metadata?.durationMs ??
        durationMs,

      totalResults:
        result.metadata?.totalResults ??
        result.results.length,
    },

    warnings:
      Array.isArray(result.warnings)
        ? result.warnings
        : [],
  };
}

export function selectProvidersForVertical(
  providers: AggregatorProvider[],
  vertical: AggregatorVertical
): AggregatorProvider[] {
  return providers
    .filter((provider) =>
      providerSupportsVertical(
        provider,
        vertical
      )
    )
    .sort(
      (left, right) =>
        right.priority -
        left.priority
    );
}

export async function isProviderAvailable(
  provider: AggregatorProvider
): Promise<boolean> {
  try {
    return Boolean(
      await provider.isAvailable()
    );
  } catch {
    return false;
  }
}

export async function executeProvider(
  provider: AggregatorProvider,
  context: AggregatorProviderContext,
  options: ExecuteProvidersOptions = {}
): Promise<ProviderExecutionOutcome> {
  const timeoutMs =
    clampTimeout(
      options.timeoutMs
    );

  const startedAt =
    Date.now();

  const scopedSignal =
    createTimeoutSignal(
      timeoutMs,
      options.signal ??
        context.signal
    );

  try {
    const available =
      await isProviderAvailable(
        provider
      );

    if (!available) {
      return {
        success: false,
        provider,

        failure: {
          providerId:
            provider.id,

          message:
            `${provider.id} is not currently available.`,
        },

        durationMs:
          Date.now() -
          startedAt,
      };
    }

    const result =
      await provider.search({
        ...context,
        signal:
          scopedSignal.signal,
      });

    const durationMs =
      Date.now() -
      startedAt;

    return {
      success: true,
      provider,

      result:
        normaliseProviderResult(
          provider,
          result,
          durationMs
        ),

      durationMs,
    };
  } catch (error) {
    return {
      success: false,
      provider,

      failure: {
        providerId:
          provider.id,

        message:
          readFailureMessage(
            error,
            provider.id
          ),
      },

      durationMs:
        Date.now() -
        startedAt,
    };
  } finally {
    scopedSignal.cleanup();
  }
}

export async function executeProviders(
  providers: AggregatorProvider[],
  context: AggregatorProviderContext,
  options: ExecuteProvidersOptions = {}
): Promise<ProviderExecutionOutcome[]> {
  if (
    providers.length === 0
  ) {
    return [];
  }

  return Promise.all(
    providers.map((provider) =>
      executeProvider(
        provider,
        context,
        options
      )
    )
  );
}

export function separateProviderOutcomes(
  outcomes: ProviderExecutionOutcome[]
): {
  successful: AggregatorProviderResult[];
  failures: AggregatorProviderFailure[];
} {
  const successful:
    AggregatorProviderResult[] =
    [];

  const failures:
    AggregatorProviderFailure[] =
    [];

  for (const outcome of outcomes) {
    if (outcome.success) {
      successful.push(
        outcome.result
      );
    } else {
      failures.push(
        outcome.failure
      );
    }
  }

  return {
    successful,
    failures,
  };
}