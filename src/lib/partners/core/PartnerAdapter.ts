import type { BeaconIntent } from "@/lib/types";
import type { PartnerOffer } from "@/lib/partners/types";

export interface PartnerAdapter {
  readonly id: string;

  readonly name: string;

  readonly enabled: boolean;

  search(intent: BeaconIntent): Promise<PartnerOffer[]>;
}