import type { BeaconIntent } from "@/lib/types";
import type { PartnerOffer } from "../types";

import { demoAdapter } from "../adapters/demo/adapter";

const adapters = [
  demoAdapter,
];

export async function searchPartners(
  intent: BeaconIntent
): Promise<PartnerOffer[]> {
  const searches = await Promise.all(
    adapters
      .filter((adapter) => adapter.enabled)
      .map((adapter) => adapter.search(intent))
  );

  return searches.flat();
}