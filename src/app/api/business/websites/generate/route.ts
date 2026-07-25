import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 200_000;
const MAX_SERVICES = 20;
const MAX_TEXT_LENGTH = 12_000;

type PricingStyle = "quote" | "hourly" | "fixed" | "mixed";
type VisualStyle = "modern" | "professional" | "premium" | "friendly";
type FontStyle = "clean" | "traditional" | "bold" | "soft";

type OpeningHoursRecord = {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
};

type ServiceRecord = {
  id?: string;
  name: string;
  description: string;
  emergency: boolean;
};

type WebsiteBrief = {
  businessName: string;
  tradingName: string;
  trade: string;
  yearsTrading: string;
  companyNumber: string;
  vatNumber: string;
  businessDescription: string;

  contactName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  county: string;
  postcode: string;
  serviceAreas: string;
  openingHours: OpeningHoursRecord[];

  services: ServiceRecord[];
  pricingStyle: PricingStyle;
  callOutAvailable: boolean;
  callOutMessage: string;
  guarantee: string;
  accreditations: string;

  logoName: string;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  visualStyle: VisualStyle;
  fontStyle: FontStyle;

  photoNames: string[];
  preferredDomain: string;
  websiteGoal: string;
  targetCustomers: string;
  specialInstructions: string;
};

type GeneratedCta = {
  label: string;
  href: string;
};

type GeneratedSeo = {
  title: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
};

type GeneratedSection = {
  id: string;
  type:
    | "hero"
    | "intro"
    | "services"
    | "trust"
    | "process"
    | "gallery"
    | "testimonials"
    | "faq"
    | "contact"
    | "cta";
  heading: string;
  subheading: string;
  body: string;
  bullets: string[];
  primaryCta: GeneratedCta;
  secondaryCta: GeneratedCta;
  imageSuggestion: string;
};

type GeneratedPage = {
  slug: string;
  navigationLabel: string;
  pageType:
    | "home"
    | "about"
    | "services"
    | "service"
    | "gallery"
    | "contact"
    | "faq"
    | "privacy"
    | "cookies"
    | "terms";
  title: string;
  introduction: string;
  sections: GeneratedSection[];
  seo: GeneratedSeo;
};

type GeneratedService = {
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
  commonJobs: string[];
  process: string[];
  faq: {
    question: string;
    answer: string;
  }[];
  callToAction: string;
  seo: GeneratedSeo;
};

type GeneratedWebsite = {
  project: {
    businessName: string;
    displayName: string;
    tagline: string;
    trade: string;
    location: string;
    serviceAreaSummary: string;
    preferredDomain: string;
    generatedAt: string;
    version: number;
  };
  brand: {
    primaryColour: string;
    secondaryColour: string;
    accentColour: string;
    visualStyle: VisualStyle;
    fontStyle: FontStyle;
    tone:
      | "professional"
      | "friendly"
      | "premium"
      | "direct"
      | "reassuring";
    logoAltText: string;
  };
  navigation: {
    label: string;
    href: string;
  }[];
  pages: GeneratedPage[];
  services: GeneratedService[];
  globalContent: {
    phoneDisplay: string;
    emailDisplay: string;
    addressDisplay: string;
    openingHoursSummary: string;
    emergencyMessage: string;
    guaranteeMessage: string;
    accreditationSummary: string;
    footerDescription: string;
    copyrightName: string;
  };
  localSeo: {
    primaryLocation: string;
    serviceAreas: string[];
    suggestedLocationPages: {
      location: string;
      slug: string;
      title: string;
      description: string;
    }[];
    googleBusinessDescription: string;
    schema: {
      businessType: string;
      name: string;
      telephone: string;
      email: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      areaServed: string[];
      priceRange: string;
    };
  };
  legal: {
    privacyNotice: string;
    cookieNotice: string;
    websiteTerms: string;
    legalWarnings: string[];
  };
  quality: {
    seoScore: number;
    accessibilityScore: number;
    completenessScore: number;
    strengths: string[];
    improvements: string[];
    ownerChecks: string[];
  };
  imagePlan: {
    filename: string;
    suggestedUse: string;
    altText: string;
  }[];
};

const generatedWebsiteSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "project",
    "brand",
    "navigation",
    "pages",
    "services",
    "globalContent",
    "localSeo",
    "legal",
    "quality",
    "imagePlan",
  ],
  properties: {
    project: {
      type: "object",
      additionalProperties: false,
      required: [
        "businessName",
        "displayName",
        "tagline",
        "trade",
        "location",
        "serviceAreaSummary",
        "preferredDomain",
        "generatedAt",
        "version",
      ],
      properties: {
        businessName: { type: "string", minLength: 1, maxLength: 160 },
        displayName: { type: "string", minLength: 1, maxLength: 160 },
        tagline: { type: "string", minLength: 1, maxLength: 180 },
        trade: { type: "string", minLength: 1, maxLength: 120 },
        location: { type: "string", minLength: 1, maxLength: 160 },
        serviceAreaSummary: { type: "string", minLength: 1, maxLength: 500 },
        preferredDomain: { type: "string", maxLength: 255 },
        generatedAt: { type: "string", minLength: 1, maxLength: 60 },
        version: { type: "number", minimum: 1, maximum: 1000 },
      },
    },
    brand: {
      type: "object",
      additionalProperties: false,
      required: [
        "primaryColour",
        "secondaryColour",
        "accentColour",
        "visualStyle",
        "fontStyle",
        "tone",
        "logoAltText",
      ],
      properties: {
        primaryColour: { type: "string", minLength: 4, maxLength: 20 },
        secondaryColour: { type: "string", minLength: 4, maxLength: 20 },
        accentColour: { type: "string", minLength: 4, maxLength: 20 },
        visualStyle: {
          type: "string",
          enum: ["modern", "professional", "premium", "friendly"],
        },
        fontStyle: {
          type: "string",
          enum: ["clean", "traditional", "bold", "soft"],
        },
        tone: {
          type: "string",
          enum: ["professional", "friendly", "premium", "direct", "reassuring"],
        },
        logoAltText: { type: "string", minLength: 1, maxLength: 220 },
      },
    },
    navigation: {
      type: "array",
      minItems: 4,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "href"],
        properties: {
          label: { type: "string", minLength: 1, maxLength: 80 },
          href: { type: "string", minLength: 1, maxLength: 180 },
        },
      },
    },
    pages: {
      type: "array",
      minItems: 6,
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "slug",
          "navigationLabel",
          "pageType",
          "title",
          "introduction",
          "sections",
          "seo",
        ],
        properties: {
          slug: { type: "string", minLength: 1, maxLength: 160 },
          navigationLabel: { type: "string", minLength: 1, maxLength: 80 },
          pageType: {
            type: "string",
            enum: [
              "home",
              "about",
              "services",
              "service",
              "gallery",
              "contact",
              "faq",
              "privacy",
              "cookies",
              "terms",
            ],
          },
          title: { type: "string", minLength: 1, maxLength: 180 },
          introduction: { type: "string", minLength: 1, maxLength: 1000 },
          sections: {
            type: "array",
            minItems: 1,
            maxItems: 12,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "id",
                "type",
                "heading",
                "subheading",
                "body",
                "bullets",
                "primaryCta",
                "secondaryCta",
                "imageSuggestion",
              ],
              properties: {
                id: { type: "string", minLength: 1, maxLength: 100 },
                type: {
                  type: "string",
                  enum: [
                    "hero",
                    "intro",
                    "services",
                    "trust",
                    "process",
                    "gallery",
                    "testimonials",
                    "faq",
                    "contact",
                    "cta",
                  ],
                },
                heading: { type: "string", minLength: 1, maxLength: 180 },
                subheading: { type: "string", maxLength: 300 },
                body: { type: "string", maxLength: 2400 },
                bullets: {
                  type: "array",
                  maxItems: 12,
                  items: { type: "string", minLength: 1, maxLength: 260 },
                },
                primaryCta: {
                  type: "object",
                  additionalProperties: false,
                  required: ["label", "href"],
                  properties: {
                    label: { type: "string", maxLength: 80 },
                    href: { type: "string", maxLength: 180 },
                  },
                },
                secondaryCta: {
                  type: "object",
                  additionalProperties: false,
                  required: ["label", "href"],
                  properties: {
                    label: { type: "string", maxLength: 80 },
                    href: { type: "string", maxLength: 180 },
                  },
                },
                imageSuggestion: { type: "string", maxLength: 300 },
              },
            },
          },
          seo: {
            type: "object",
            additionalProperties: false,
            required: ["title", "description", "keywords", "canonicalPath"],
            properties: {
              title: { type: "string", minLength: 1, maxLength: 70 },
              description: { type: "string", minLength: 1, maxLength: 170 },
              keywords: {
                type: "array",
                minItems: 1,
                maxItems: 15,
                items: { type: "string", minLength: 1, maxLength: 100 },
              },
              canonicalPath: { type: "string", minLength: 1, maxLength: 180 },
            },
          },
        },
      },
    },
    services: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "slug",
          "shortDescription",
          "fullDescription",
          "benefits",
          "commonJobs",
          "process",
          "faq",
          "callToAction",
          "seo",
        ],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 140 },
          slug: { type: "string", minLength: 1, maxLength: 140 },
          shortDescription: { type: "string", minLength: 1, maxLength: 350 },
          fullDescription: { type: "string", minLength: 1, maxLength: 1800 },
          benefits: {
            type: "array",
            minItems: 2,
            maxItems: 10,
            items: { type: "string", minLength: 1, maxLength: 220 },
          },
          commonJobs: {
            type: "array",
            minItems: 2,
            maxItems: 12,
            items: { type: "string", minLength: 1, maxLength: 220 },
          },
          process: {
            type: "array",
            minItems: 2,
            maxItems: 8,
            items: { type: "string", minLength: 1, maxLength: 260 },
          },
          faq: {
            type: "array",
            minItems: 2,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["question", "answer"],
              properties: {
                question: { type: "string", minLength: 1, maxLength: 220 },
                answer: { type: "string", minLength: 1, maxLength: 700 },
              },
            },
          },
          callToAction: { type: "string", minLength: 1, maxLength: 220 },
          seo: {
            type: "object",
            additionalProperties: false,
            required: ["title", "description", "keywords", "canonicalPath"],
            properties: {
              title: { type: "string", minLength: 1, maxLength: 70 },
              description: { type: "string", minLength: 1, maxLength: 170 },
              keywords: {
                type: "array",
                minItems: 1,
                maxItems: 15,
                items: { type: "string", minLength: 1, maxLength: 100 },
              },
              canonicalPath: { type: "string", minLength: 1, maxLength: 180 },
            },
          },
        },
      },
    },
    globalContent: {
      type: "object",
      additionalProperties: false,
      required: [
        "phoneDisplay",
        "emailDisplay",
        "addressDisplay",
        "openingHoursSummary",
        "emergencyMessage",
        "guaranteeMessage",
        "accreditationSummary",
        "footerDescription",
        "copyrightName",
      ],
      properties: {
        phoneDisplay: { type: "string", minLength: 1, maxLength: 80 },
        emailDisplay: { type: "string", minLength: 1, maxLength: 180 },
        addressDisplay: { type: "string", maxLength: 350 },
        openingHoursSummary: { type: "string", maxLength: 500 },
        emergencyMessage: { type: "string", maxLength: 500 },
        guaranteeMessage: { type: "string", maxLength: 500 },
        accreditationSummary: { type: "string", maxLength: 700 },
        footerDescription: { type: "string", minLength: 1, maxLength: 600 },
        copyrightName: { type: "string", minLength: 1, maxLength: 160 },
      },
    },
    localSeo: {
      type: "object",
      additionalProperties: false,
      required: [
        "primaryLocation",
        "serviceAreas",
        "suggestedLocationPages",
        "googleBusinessDescription",
        "schema",
      ],
      properties: {
        primaryLocation: { type: "string", minLength: 1, maxLength: 160 },
        serviceAreas: {
          type: "array",
          minItems: 1,
          maxItems: 30,
          items: { type: "string", minLength: 1, maxLength: 120 },
        },
        suggestedLocationPages: {
          type: "array",
          maxItems: 12,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["location", "slug", "title", "description"],
            properties: {
              location: { type: "string", minLength: 1, maxLength: 120 },
              slug: { type: "string", minLength: 1, maxLength: 150 },
              title: { type: "string", minLength: 1, maxLength: 180 },
              description: { type: "string", minLength: 1, maxLength: 500 },
            },
          },
        },
        googleBusinessDescription: {
          type: "string",
          minLength: 1,
          maxLength: 750,
        },
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "businessType",
            "name",
            "telephone",
            "email",
            "addressLocality",
            "addressRegion",
            "postalCode",
            "areaServed",
            "priceRange",
          ],
          properties: {
            businessType: { type: "string", minLength: 1, maxLength: 100 },
            name: { type: "string", minLength: 1, maxLength: 160 },
            telephone: { type: "string", minLength: 1, maxLength: 80 },
            email: { type: "string", minLength: 1, maxLength: 180 },
            addressLocality: { type: "string", maxLength: 140 },
            addressRegion: { type: "string", maxLength: 140 },
            postalCode: { type: "string", maxLength: 30 },
            areaServed: {
              type: "array",
              minItems: 1,
              maxItems: 30,
              items: { type: "string", minLength: 1, maxLength: 120 },
            },
            priceRange: { type: "string", minLength: 1, maxLength: 20 },
          },
        },
      },
    },
    legal: {
      type: "object",
      additionalProperties: false,
      required: [
        "privacyNotice",
        "cookieNotice",
        "websiteTerms",
        "legalWarnings",
      ],
      properties: {
        privacyNotice: { type: "string", minLength: 1, maxLength: 6000 },
        cookieNotice: { type: "string", minLength: 1, maxLength: 4000 },
        websiteTerms: { type: "string", minLength: 1, maxLength: 6000 },
        legalWarnings: {
          type: "array",
          minItems: 1,
          maxItems: 12,
          items: { type: "string", minLength: 1, maxLength: 320 },
        },
      },
    },
    quality: {
      type: "object",
      additionalProperties: false,
      required: [
        "seoScore",
        "accessibilityScore",
        "completenessScore",
        "strengths",
        "improvements",
        "ownerChecks",
      ],
      properties: {
        seoScore: { type: "number", minimum: 0, maximum: 100 },
        accessibilityScore: { type: "number", minimum: 0, maximum: 100 },
        completenessScore: { type: "number", minimum: 0, maximum: 100 },
        strengths: {
          type: "array",
          minItems: 1,
          maxItems: 12,
          items: { type: "string", minLength: 1, maxLength: 260 },
        },
        improvements: {
          type: "array",
          maxItems: 12,
          items: { type: "string", minLength: 1, maxLength: 260 },
        },
        ownerChecks: {
          type: "array",
          minItems: 1,
          maxItems: 15,
          items: { type: "string", minLength: 1, maxLength: 320 },
        },
      },
    },
    imagePlan: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["filename", "suggestedUse", "altText"],
        properties: {
          filename: { type: "string", minLength: 1, maxLength: 255 },
          suggestedUse: { type: "string", minLength: 1, maxLength: 300 },
          altText: { type: "string", minLength: 1, maxLength: 250 },
        },
      },
    },
  },
} as const;

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function getModel() {
  return (
    process.env.OPENAI_WEBSITE_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4.1-mini"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function booleanValue(value: unknown) {
  return value === true;
}

function validColour(value: unknown, fallback: string) {
  const colour = stringValue(value, 20);

  return /^#[0-9a-f]{6}$/i.test(colour) ? colour : fallback;
}

function cleanOpeningHours(value: unknown): OpeningHoursRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 7).flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const day = stringValue(item.day, 20);

    if (!day) {
      return [];
    }

    return [
      {
        day,
        enabled: booleanValue(item.enabled),
        open: stringValue(item.open, 10),
        close: stringValue(item.close, 10),
      },
    ];
  });
}

function cleanServices(value: unknown): ServiceRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, MAX_SERVICES).flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const name = stringValue(item.name, 140);

    if (!name) {
      return [];
    }

    return [
      {
        id: stringValue(item.id, 120),
        name,
        description: stringValue(item.description, 2500),
        emergency: booleanValue(item.emergency),
      },
    ];
  });
}

function cleanEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

function parseBrief(value: unknown): WebsiteBrief {
  if (!isRecord(value)) {
    throw new Error("A website brief is required.");
  }

  const services = cleanServices(value.services);
  const businessName = stringValue(value.businessName, 160);
  const trade = stringValue(value.trade, 120);
  const businessDescription = stringValue(
    value.businessDescription,
    MAX_TEXT_LENGTH,
  );
  const phone = stringValue(value.phone, 80);
  const email = stringValue(value.email, 180);
  const townCity = stringValue(value.townCity, 140);
  const serviceAreas = stringValue(value.serviceAreas, 3000);

  if (!businessName) {
    throw new Error("Business name is required.");
  }

  if (!trade) {
    throw new Error("The main trade or industry is required.");
  }

  if (businessDescription.length < 30) {
    throw new Error(
      "The business description must contain at least 30 characters.",
    );
  }

  if (!phone || !email) {
    throw new Error("A phone number and email address are required.");
  }

  if (!townCity || !serviceAreas) {
    throw new Error("A primary location and service area are required.");
  }

  if (!services.length) {
    throw new Error("At least one service is required.");
  }

  const photoNames = Array.isArray(value.photoNames)
    ? value.photoNames
        .map((item) => stringValue(item, 255))
        .filter(Boolean)
        .slice(0, 20)
    : [];

  return {
    businessName,
    tradingName: stringValue(value.tradingName, 160),
    trade,
    yearsTrading: stringValue(value.yearsTrading, 10),
    companyNumber: stringValue(value.companyNumber, 40),
    vatNumber: stringValue(value.vatNumber, 40),
    businessDescription,

    contactName: stringValue(value.contactName, 160),
    phone,
    email,
    addressLine1: stringValue(value.addressLine1, 200),
    addressLine2: stringValue(value.addressLine2, 200),
    townCity,
    county: stringValue(value.county, 140),
    postcode: stringValue(value.postcode, 30),
    serviceAreas,
    openingHours: cleanOpeningHours(value.openingHours),

    services,
    pricingStyle: cleanEnum(
      value.pricingStyle,
      ["quote", "hourly", "fixed", "mixed"] as const,
      "quote",
    ),
    callOutAvailable: booleanValue(value.callOutAvailable),
    callOutMessage: stringValue(value.callOutMessage, 1000),
    guarantee: stringValue(value.guarantee, 1000),
    accreditations: stringValue(value.accreditations, 2000),

    logoName: stringValue(value.logoName, 255),
    primaryColour: validColour(value.primaryColour, "#0f3d73"),
    secondaryColour: validColour(value.secondaryColour, "#d4a017"),
    accentColour: validColour(value.accentColour, "#ffffff"),
    visualStyle: cleanEnum(
      value.visualStyle,
      ["modern", "professional", "premium", "friendly"] as const,
      "professional",
    ),
    fontStyle: cleanEnum(
      value.fontStyle,
      ["clean", "traditional", "bold", "soft"] as const,
      "clean",
    ),

    photoNames,
    preferredDomain: stringValue(value.preferredDomain, 255),
    websiteGoal: stringValue(value.websiteGoal, 500),
    targetCustomers: stringValue(value.targetCustomers, 1600),
    specialInstructions: stringValue(value.specialInstructions, 3000),
  };
}

function parseGeneratedWebsite(outputText: string): GeneratedWebsite {
  const parsed = JSON.parse(outputText) as GeneratedWebsite;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !parsed.project ||
    !parsed.brand ||
    !Array.isArray(parsed.pages) ||
    !Array.isArray(parsed.services) ||
    !parsed.globalContent ||
    !parsed.localSeo ||
    !parsed.legal ||
    !parsed.quality ||
    !Array.isArray(parsed.imagePlan)
  ) {
    throw new Error("The AI response did not contain a complete website.");
  }

  return parsed;
}

function websitePrompt(brief: WebsiteBrief) {
  return `Create a complete, editable website content package for this UK business.

BUSINESS BRIEF:
${JSON.stringify(brief, null, 2)}

Generation requirements:
- Use British English throughout.
- Write for real prospective customers, not for developers.
- Make the business sound trustworthy, clear and professional without using exaggerated claims.
- Never invent awards, reviews, accreditations, guarantees, qualifications, insurance, prices, response times, years of experience or availability.
- Only include factual claims supported by the brief.
- When details are missing, use neutral wording or add an owner check.
- Do not claim that the business is the best, cheapest, number one, certified, approved or available 24/7 unless explicitly supported.
- Do not fabricate testimonials. A testimonials section may explain that verified reviews can be added later, but must not contain invented customer quotes.
- Use the supplied services as the source of truth. Create one detailed service record for every supplied service.
- Create these core pages: home, about, services, gallery, contact, FAQ, privacy, cookies and terms.
- Also create a separate service page for each supplied service.
- Keep navigation practical; legal pages should normally remain in the footer rather than the main navigation.
- Use internal paths beginning with "/".
- Use "tel:" and "mailto:" links where appropriate.
- Make local SEO natural. Do not keyword-stuff or create doorway-page copy.
- Suggested location pages must be genuinely useful and must be presented as suggestions, not automatically published pages.
- SEO title text should normally stay within 60 characters and descriptions within about 155 characters.
- Legal pages are editable starter drafts, not legal advice. Include that limitation in legalWarnings.
- Privacy content must not claim specific analytics, advertising, payment or cookie tools unless the brief confirms them.
- Cookie content should explain that the final version must match the cookies actually deployed.
- Terms must avoid inventing booking, cancellation, payment, guarantee or liability rules.
- Owner checks must clearly identify every important fact that needs confirmation before publication.
- Image plans must use only supplied filenames. If no images were supplied, return an empty imagePlan and recommend genuine business photography in improvements.
- Preserve the selected brand colours and style.
- Scores must reflect the quality and completeness of the supplied information, not arbitrary perfection.
- generatedAt must be "${new Date().toISOString()}".
- version must be 1.
- Return only data matching the required schema.`;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return errorResponse("This endpoint expects a JSON website brief.", 415);
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");

    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return errorResponse("The website brief is too large.", 413);
    }

    const body = (await request.json()) as unknown;
    const rawBrief =
      isRecord(body) && "brief" in body ? body.brief : body;
    const brief = parseBrief(rawBrief);

    const client = getOpenAIClient();

    const response = await client.responses.create({
      model: getModel(),
      temperature: 0.25,
      max_output_tokens: 14_000,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `You are Beacon Business Website Architect, a careful UK small-business website planning and content system.

You create structured website content packages for tradespeople and small service businesses.

Your work must be accurate, useful, accessible and commercially clear. You must not invent facts or misrepresent a business. You prepare drafts for owner review; you do not claim that legal text replaces professional legal advice.`,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: websitePrompt(brief),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "beacon_business_website",
          strict: true,
          schema: generatedWebsiteSchema,
        },
      },
    });

    if (!response.output_text) {
      return errorResponse(
        "Beacon could not generate a website from the supplied brief.",
        502,
      );
    }

    const generatedWebsite = parseGeneratedWebsite(response.output_text);

    return NextResponse.json(generatedWebsite, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Website generation failed:", error);

    if (
      error instanceof Error &&
      error.message === "OPENAI_API_KEY is not configured."
    ) {
      return errorResponse(
        "AI website generation is not configured on the server.",
        503,
      );
    }

    if (
      error instanceof SyntaxError ||
      (error instanceof Error &&
        [
          "A website brief is required.",
          "Business name is required.",
          "The main trade or industry is required.",
          "The business description must contain at least 30 characters.",
          "A phone number and email address are required.",
          "A primary location and service area are required.",
          "At least one service is required.",
        ].includes(error.message))
    ) {
      return errorResponse(
        error instanceof Error ? error.message : "The website brief is invalid.",
        400,
      );
    }

    return errorResponse(
      "Beacon could not generate the website. Please try again.",
      500,
    );
  }
}