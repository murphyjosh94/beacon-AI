import type { PartnerAdapter } from "../../core/PartnerAdapter";
import type { BeaconIntent } from "@/lib/engine/types";
import { demoOffers } from "../../demoOffers";

export const demoAdapter: PartnerAdapter = {
  id: "demo",

  name: "Demo Data",

  enabled: true,

  async search(intent: BeaconIntent) {
    return demoOffers.filter(
      (offer) => offer.category === intent.category
    );
  },
};