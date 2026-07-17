import "server-only";

import {
  serpApiShoppingAggregatorProvider,
} from "@/services/aggregator/providers/SerpApiShoppingAggregatorProvider";

import {
  serpApiHotelsAggregatorProvider,
} from "@/services/aggregator/providers/SerpApiHotelsAggregatorProvider";

import {
  serpApiFlightsAggregatorProvider,
} from "./providers/SerpApiFlightsAggregatorProvider";

import {
  awinPartnerAggregatorProvider,
} from "@/services/aggregator/providers/AwinPartnerAggregatorProvider";

import type {
  AggregatorProvider,
  AggregatorProviderId,
  AggregatorVertical,
} from "@/services/aggregator/AggregatorTypes";

const REGISTERED_PROVIDERS:
  readonly AggregatorProvider[] = [
    awinPartnerAggregatorProvider,
    serpApiFlightsAggregatorProvider,
    serpApiHotelsAggregatorProvider,
    serpApiShoppingAggregatorProvider,
  ];

function cloneProviderList(
  providers:
    readonly AggregatorProvider[]
): AggregatorProvider[] {
  return [...providers];
}

function sortProvidersByPriority(
  providers:
    AggregatorProvider[]
): AggregatorProvider[] {
  return providers.sort(
    (left, right) => {
      const priorityDifference =
        right.priority -
        left.priority;

      if (
        priorityDifference !==
        0
      ) {
        return priorityDifference;
      }

      return String(
        left.id
      ).localeCompare(
        String(right.id),
        "en-GB"
      );
    }
  );
}

function providerSupportsVertical(
  provider:
    AggregatorProvider,
  vertical:
    AggregatorVertical
): boolean {
  return provider.verticals.includes(
    vertical
  );
}

function validateProviderRegistry(
  providers:
    readonly AggregatorProvider[]
): void {
  const providerIds =
    new Set<string>();

  for (
    const provider of
      providers
  ) {
    const providerId =
      String(
        provider.id
      ).trim();

    if (!providerId) {
      throw new Error(
        "Every aggregator provider must have a valid ID."
      );
    }

    if (
      providerIds.has(
        providerId
      )
    ) {
      throw new Error(
        `Duplicate aggregator provider ID detected: ${providerId}.`
      );
    }

    providerIds.add(
      providerId
    );

    if (
      !Array.isArray(
        provider.verticals
      ) ||
      provider.verticals
        .length === 0
    ) {
      throw new Error(
        `${providerId} must support at least one aggregator vertical.`
      );
    }

    if (
      !Number.isFinite(
        provider.priority
      )
    ) {
      throw new Error(
        `${providerId} must define a numeric priority.`
      );
    }

    if (
      typeof provider
        .isAvailable !==
      "function"
    ) {
      throw new Error(
        `${providerId} must define isAvailable().`
      );
    }

    if (
      typeof provider.search !==
      "function"
    ) {
      throw new Error(
        `${providerId} must define search().`
      );
    }
  }
}

validateProviderRegistry(
  REGISTERED_PROVIDERS
);

export function getAggregatorProviders():
  AggregatorProvider[] {
  return sortProvidersByPriority(
    cloneProviderList(
      REGISTERED_PROVIDERS
    )
  );
}

export function getAggregatorProvidersForVertical(
  vertical:
    AggregatorVertical
): AggregatorProvider[] {
  return sortProvidersByPriority(
    cloneProviderList(
      REGISTERED_PROVIDERS
    ).filter(
      (provider) =>
        providerSupportsVertical(
          provider,
          vertical
        )
    )
  );
}

export function getAggregatorProviderById(
  providerId:
    AggregatorProviderId
): AggregatorProvider | null {
  const normalisedProviderId =
    String(
      providerId
    ).trim();

  if (
    !normalisedProviderId
  ) {
    return null;
  }

  return (
    REGISTERED_PROVIDERS.find(
      (provider) =>
        String(
          provider.id
        ) ===
        normalisedProviderId
    ) ??
    null
  );
}

export function hasAggregatorProvider(
  providerId:
    AggregatorProviderId
): boolean {
  return (
    getAggregatorProviderById(
      providerId
    ) !== null
  );
}

export async function getAvailableAggregatorProviders(
  vertical?:
    AggregatorVertical
): Promise<
  AggregatorProvider[]
> {
  const candidates =
    vertical
      ? getAggregatorProvidersForVertical(
          vertical
        )
      : getAggregatorProviders();

  const availabilityResults =
    await Promise.all(
      candidates.map(
        async (
          provider
        ) => {
          try {
            return {
              provider,

              available:
                Boolean(
                  await provider
                    .isAvailable()
                ),
            };
          } catch {
            return {
              provider,
              available:
                false,
            };
          }
        }
      )
    );

  return sortProvidersByPriority(
    availabilityResults
      .filter(
        (entry) =>
          entry.available
      )
      .map(
        (entry) =>
          entry.provider
      )
  );
}

export async function getUnavailableAggregatorProviders(
  vertical?:
    AggregatorVertical
): Promise<
  AggregatorProvider[]
> {
  const candidates =
    vertical
      ? getAggregatorProvidersForVertical(
          vertical
        )
      : getAggregatorProviders();

  const availabilityResults =
    await Promise.all(
      candidates.map(
        async (
          provider
        ) => {
          try {
            return {
              provider,

              available:
                Boolean(
                  await provider
                    .isAvailable()
                ),
            };
          } catch {
            return {
              provider,
              available:
                false,
            };
          }
        }
      )
    );

  return sortProvidersByPriority(
    availabilityResults
      .filter(
        (entry) =>
          !entry.available
      )
      .map(
        (entry) =>
          entry.provider
      )
  );
}

export function getProviderRegistrySummary():
  Array<{
    id:
      AggregatorProviderId;

    verticals:
      AggregatorVertical[];

    priority:
      number;
  }> {
  return getAggregatorProviders()
    .map(
      (provider) => ({
        id:
          provider.id,

        verticals: [
          ...provider.verticals,
        ],

        priority:
          provider.priority,
      })
    );
}