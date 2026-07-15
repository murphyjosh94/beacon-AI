import "server-only";

import {
  serpApiShoppingAggregatorProvider,
} from "@/services/aggregator/providers/SerpApiShoppingAggregatorProvider";

import {
  serpApiHotelsAggregatorProvider,
} from "@/services/aggregator/providers/SerpApiHotelsAggregatorProvider";

import type {
  AggregatorProvider,
  AggregatorProviderId,
  AggregatorVertical,
} from "@/services/aggregator/AggregatorTypes";

const providers: AggregatorProvider[] = [
  serpApiShoppingAggregatorProvider,
  serpApiHotelsAggregatorProvider,
];

function sortProviders(
  values: AggregatorProvider[]
): AggregatorProvider[] {
  return [...values].sort(
    (left, right) =>
      right.priority -
      left.priority
  );
}

export function getAggregatorProviders(): AggregatorProvider[] {
  return sortProviders(providers);
}

export function getAggregatorProvidersForVertical(
  vertical: AggregatorVertical
): AggregatorProvider[] {
  return sortProviders(
    providers.filter(
      (provider) =>
        provider.verticals.includes(
          vertical
        )
    )
  );
}

export function getAggregatorProviderById(
  providerId: AggregatorProviderId
): AggregatorProvider | null {
  return (
    providers.find(
      (provider) =>
        provider.id === providerId
    ) ?? null
  );
}

export function hasAggregatorProvider(
  providerId: AggregatorProviderId
): boolean {
  return providers.some(
    (provider) =>
      provider.id === providerId
  );
}

export async function getAvailableAggregatorProviders(
  vertical?: AggregatorVertical
): Promise<AggregatorProvider[]> {
  const candidates =
    vertical
      ? getAggregatorProvidersForVertical(
          vertical
        )
      : getAggregatorProviders();

  const availability =
    await Promise.all(
      candidates.map(
        async (provider) => {
          try {
            const available =
              await provider.isAvailable();

            return {
              provider,
              available:
                Boolean(available),
            };
          } catch {
            return {
              provider,
              available: false,
            };
          }
        }
      )
    );

  return availability
    .filter(
      (entry) =>
        entry.available
    )
    .map(
      (entry) =>
        entry.provider
    );
}

export function getProviderRegistrySummary(): Array<{
  id: AggregatorProviderId;
  verticals: AggregatorVertical[];
  priority: number;
}> {
  return getAggregatorProviders().map(
    (provider) => ({
      id: provider.id,
      verticals: [
        ...provider.verticals,
      ],
      priority:
        provider.priority,
    })
  );
}