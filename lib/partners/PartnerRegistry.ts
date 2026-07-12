import {
  partnerRegistry,
  type BeaconPartner,
  type PartnerCategory,
  type PartnerStatus,
} from "@/lib/partners/registry";

export class PartnerRegistry {
  static findAll(): BeaconPartner[] {
    return partnerRegistry;
  }

  static findById(id: string): BeaconPartner | undefined {
    return partnerRegistry.find((partner) => partner.id === id);
  }

  static findByStatus(status: PartnerStatus): BeaconPartner[] {
    return partnerRegistry.filter(
      (partner) => partner.status === status
    );
  }

  static findByCategory(category: PartnerCategory): BeaconPartner[] {
    return partnerRegistry.filter((partner) =>
      partner.categories.includes(category)
    );
  }

  static findApproved(): BeaconPartner[] {
    return this.findByStatus("approved");
  }

  static findFeedReady(): BeaconPartner[] {
    return partnerRegistry.filter(
      (partner) =>
        partner.status === "approved" &&
        (partner.productFeedAvailable || partner.apiAvailable)
    );
  }
}