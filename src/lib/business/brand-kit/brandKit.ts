export const BRAND_KIT_STORAGE_KEY = "beacon-business-brand-kit";
export const WEBSITE_BRIEF_STORAGE_KEY = "beacon-business-website-brief";

export type BeaconBrandKit = {
  businessName: string;
  ownerName: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  companyNumber: string;
  vatNumber: string;
  logoUrl: string;
  primaryColour: string;
  secondaryColour: string;
  fontFamily: string;
  tagline: string;
  updatedAt?: string;
};

export const emptyBrandKit: BeaconBrandKit = {
  businessName: "",
  ownerName: "",
  address: "",
  email: "",
  phone: "",
  website: "",
  companyNumber: "",
  vatNumber: "",
  logoUrl: "",
  primaryColour: "#0f2a55",
  secondaryColour: "#f4c542",
  fontFamily: "Inter",
  tagline: "",
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normaliseBrandKit(value: unknown): BeaconBrandKit {
  if (!value || typeof value !== "object") {
    return { ...emptyBrandKit };
  }

  const input = value as Record<string, unknown>;

  return {
    businessName: text(input.businessName),
    ownerName: text(input.ownerName),
    address: text(input.address),
    email: text(input.email),
    phone: text(input.phone),
    website: text(input.website),
    companyNumber: text(input.companyNumber),
    vatNumber: text(input.vatNumber),
    logoUrl: text(input.logoUrl),
    primaryColour: text(input.primaryColour) || emptyBrandKit.primaryColour,
    secondaryColour:
      text(input.secondaryColour) || emptyBrandKit.secondaryColour,
    fontFamily: text(input.fontFamily) || emptyBrandKit.fontFamily,
    tagline: text(input.tagline),
    updatedAt: text(input.updatedAt) || undefined,
  };
}

export function loadBrandKit(): BeaconBrandKit {
  if (typeof window === "undefined") {
    return { ...emptyBrandKit };
  }

  try {
    const saved = window.localStorage.getItem(BRAND_KIT_STORAGE_KEY);

    if (saved) {
      return normaliseBrandKit(JSON.parse(saved));
    }

    const websiteBrief = window.localStorage.getItem(
      WEBSITE_BRIEF_STORAGE_KEY,
    );

    if (websiteBrief) {
      const parsed = JSON.parse(websiteBrief) as Record<string, unknown>;

      return normaliseBrandKit({
        businessName: parsed.businessName,
        address: parsed.address,
        email: parsed.email,
        phone: parsed.phone,
        website: parsed.website,
        primaryColour: parsed.primaryColour,
        secondaryColour: parsed.secondaryColour,
      });
    }
  } catch {
    return { ...emptyBrandKit };
  }

  return { ...emptyBrandKit };
}

export function saveBrandKit(brandKit: BeaconBrandKit): BeaconBrandKit {
  const saved: BeaconBrandKit = {
    ...normaliseBrandKit(brandKit),
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    BRAND_KIT_STORAGE_KEY,
    JSON.stringify(saved),
  );

  window.dispatchEvent(
    new CustomEvent("beacon-brand-kit-updated", {
      detail: saved,
    }),
  );

  return saved;
}