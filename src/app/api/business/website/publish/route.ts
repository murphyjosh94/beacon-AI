import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/Auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 2_500_000;

type HostingOption = "beacon" | "external";
type DomainOption = "existing" | "new" | "temporary";

type ApprovalRecord = {
  approved: boolean;
  approvedAt: string;
  approvedBy: string;
  confirmation: string;
};

type PublishConfiguration = {
  hostingOption: HostingOption;
  domainOption: DomainOption;
  existingDomain: string;
  newDomain: string;
  temporarySubdomain: string;
  includeEmailSetup: boolean;
  includeAnalytics: boolean;
  includeSearchConsole: boolean;
  includeCookieBanner: boolean;
  includeContactForm: boolean;
  includeBackups: boolean;
  includeMaintenance: boolean;
  ownerConfirmedDomainControl: boolean;
  ownerConfirmedPublishAuthority: boolean;
  ownerConfirmedFinalReview: boolean;
  notes: string;
  selectedDomain?: string;
  updatedAt: string;
};

type GeneratedSeo = {
  title: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
};

type GeneratedCta = {
  label: string;
  href: string;
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
  faq: Array<{
    question: string;
    answer: string;
  }>;
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
    visualStyle: "modern" | "professional" | "premium" | "friendly";
    fontStyle: "clean" | "traditional" | "bold" | "soft";
    tone:
      | "professional"
      | "friendly"
      | "premium"
      | "direct"
      | "reassuring";
    logoAltText: string;
  };
  navigation: Array<{
    label: string;
    href: string;
  }>;
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
    suggestedLocationPages: Array<{
      location: string;
      slug: string;
      title: string;
      description: string;
    }>;
    googleBusinessDescription: string;
    schema: Record<string, unknown>;
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
  imagePlan: Array<{
    filename: string;
    suggestedUse: string;
    altText: string;
  }>;
};

type PublishRequestBody = {
  website: GeneratedWebsite;
  approval: ApprovalRecord;
  configuration: PublishConfiguration;
};

type ValidationIssue = {
  path: string;
  message: string;
};

type PublishWebsiteRpcResult = {
  published_website_id: string;
  domain: string;
  website_version: number;
  action: "published" | "republished";
  published_at: string;
};

class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normaliseDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

function normaliseTemporarySubdomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function isValidDomain(value: string) {
  const domain = normaliseDomain(value);

  if (domain.length < 4 || domain.length > 253) {
    return false;
  }

  if (
    domain === "localhost" ||
    domain.endsWith(".localhost") ||
    domain.endsWith(".local") ||
    domain.endsWith(".internal")
  ) {
    return false;
  }

  const labels = domain.split(".");

  if (labels.length < 2) {
    return false;
  }

  return labels.every(
    (label) =>
      label.length >= 1 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
  );
}

function isValidSlug(value: string) {
  return /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/?)*$/i.test(value);
}

function isValidHexColour(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrlOrPath(value: string) {
  if (value.startsWith("/")) {
    return true;
  }

  if (value.startsWith("tel:") || value.startsWith("mailto:")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function readContentLength(request: NextRequest) {
  const raw = request.headers.get("content-length");

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new HttpError(415, "Content-Type must be application/json.");
  }

  const contentLength = readContentLength(request);

  if (contentLength !== null && contentLength > MAX_REQUEST_BYTES) {
    throw new HttpError(413, "The website publishing payload is too large.");
  }

  const raw = await request.text();

  if (Buffer.byteLength(raw, "utf8") > MAX_REQUEST_BYTES) {
    throw new HttpError(413, "The website publishing payload is too large.");
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, "The request body contains invalid JSON.");
  }
}

function validateApproval(value: unknown, issues: ValidationIssue[]) {
  if (!isRecord(value)) {
    issues.push({
      path: "approval",
      message: "Approval information is required.",
    });
    return;
  }

  if (value.approved !== true) {
    issues.push({
      path: "approval.approved",
      message: "The website must be approved before publishing.",
    });
  }

  if (!isNonEmptyString(value.approvedAt)) {
    issues.push({
      path: "approval.approvedAt",
      message: "The approval date is required.",
    });
  } else if (Number.isNaN(new Date(value.approvedAt).getTime())) {
    issues.push({
      path: "approval.approvedAt",
      message: "The approval date is invalid.",
    });
  }

  if (!isNonEmptyString(value.approvedBy)) {
    issues.push({
      path: "approval.approvedBy",
      message: "The approving owner name is required.",
    });
  }

  if (!isNonEmptyString(value.confirmation)) {
    issues.push({
      path: "approval.confirmation",
      message: "The approval confirmation is required.",
    });
  }
}

function validateConfiguration(value: unknown, issues: ValidationIssue[]) {
  if (!isRecord(value)) {
    issues.push({
      path: "configuration",
      message: "Publishing configuration is required.",
    });
    return;
  }

  if (value.hostingOption !== "beacon" && value.hostingOption !== "external") {
    issues.push({
      path: "configuration.hostingOption",
      message: "Select a supported hosting option.",
    });
  }

  if (
    value.domainOption !== "existing" &&
    value.domainOption !== "new" &&
    value.domainOption !== "temporary"
  ) {
    issues.push({
      path: "configuration.domainOption",
      message: "Select a supported domain option.",
    });
  }

  const booleanFields = [
    "includeEmailSetup",
    "includeAnalytics",
    "includeSearchConsole",
    "includeCookieBanner",
    "includeContactForm",
    "includeBackups",
    "includeMaintenance",
    "ownerConfirmedDomainControl",
    "ownerConfirmedPublishAuthority",
    "ownerConfirmedFinalReview",
  ] as const;

  for (const field of booleanFields) {
    if (!isBoolean(value[field])) {
      issues.push({
        path: `configuration.${field}`,
        message: `${field} must be true or false.`,
      });
    }
  }

  if (value.ownerConfirmedDomainControl !== true) {
    issues.push({
      path: "configuration.ownerConfirmedDomainControl",
      message: "Domain control confirmation is required.",
    });
  }

  if (value.ownerConfirmedPublishAuthority !== true) {
    issues.push({
      path: "configuration.ownerConfirmedPublishAuthority",
      message: "Publishing authority confirmation is required.",
    });
  }

  if (value.ownerConfirmedFinalReview !== true) {
    issues.push({
      path: "configuration.ownerConfirmedFinalReview",
      message: "Final review confirmation is required.",
    });
  }

  if (
    value.domainOption === "existing" &&
    (!isNonEmptyString(value.existingDomain) ||
      !isValidDomain(value.existingDomain))
  ) {
    issues.push({
      path: "configuration.existingDomain",
      message: "Enter a valid existing domain.",
    });
  }

  if (
    value.domainOption === "new" &&
    (!isNonEmptyString(value.newDomain) || !isValidDomain(value.newDomain))
  ) {
    issues.push({
      path: "configuration.newDomain",
      message: "Enter a valid new domain.",
    });
  }

  if (
    value.domainOption === "temporary" &&
    (!isNonEmptyString(value.temporarySubdomain) ||
      !/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/i.test(
        value.temporarySubdomain,
      ))
  ) {
    issues.push({
      path: "configuration.temporarySubdomain",
      message: "Enter a valid temporary subdomain.",
    });
  }

  if (value.notes !== undefined && typeof value.notes !== "string") {
    issues.push({
      path: "configuration.notes",
      message: "Publishing notes must be text.",
    });
  }
}

function validateSeo(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "SEO information is required.",
    });
    return;
  }

  if (!isNonEmptyString(value.title)) {
    issues.push({
      path: `${path}.title`,
      message: "SEO title is required.",
    });
  }

  if (!isNonEmptyString(value.description)) {
    issues.push({
      path: `${path}.description`,
      message: "SEO description is required.",
    });
  }

  if (!isStringArray(value.keywords)) {
    issues.push({
      path: `${path}.keywords`,
      message: "SEO keywords must be a list of text values.",
    });
  }

  if (
    !isNonEmptyString(value.canonicalPath) ||
    !isValidSlug(value.canonicalPath)
  ) {
    issues.push({
      path: `${path}.canonicalPath`,
      message: "Canonical path must be a valid internal path.",
    });
  }
}

function validateWebsite(value: unknown, issues: ValidationIssue[]) {
  if (!isRecord(value)) {
    issues.push({
      path: "website",
      message: "Generated website data is required.",
    });
    return;
  }

  if (!isRecord(value.project)) {
    issues.push({
      path: "website.project",
      message: "Website project information is required.",
    });
  } else {
    for (const field of [
      "businessName",
      "displayName",
      "trade",
      "location",
    ] as const) {
      if (!isNonEmptyString(value.project[field])) {
        issues.push({
          path: `website.project.${field}`,
          message: `${field} is required.`,
        });
      }
    }

    if (
      !isFiniteNumber(value.project.version) ||
      value.project.version < 1
    ) {
      issues.push({
        path: "website.project.version",
        message: "Website version must be at least 1.",
      });
    }
  }

  if (!isRecord(value.brand)) {
    issues.push({
      path: "website.brand",
      message: "Website brand information is required.",
    });
  } else {
    for (const field of [
      "primaryColour",
      "secondaryColour",
      "accentColour",
    ] as const) {
      if (
        !isNonEmptyString(value.brand[field]) ||
        !isValidHexColour(value.brand[field])
      ) {
        issues.push({
          path: `website.brand.${field}`,
          message: `${field} must be a six-character hex colour.`,
        });
      }
    }
  }

  if (!Array.isArray(value.navigation)) {
    issues.push({
      path: "website.navigation",
      message: "Website navigation is required.",
    });
  }

  if (!Array.isArray(value.pages) || value.pages.length === 0) {
    issues.push({
      path: "website.pages",
      message: "At least one generated page is required.",
    });
  } else {
    let homePageCount = 0;
    const pageSlugs = new Set<string>();

    value.pages.forEach((page, pageIndex) => {
      const path = `website.pages.${pageIndex}`;

      if (!isRecord(page)) {
        issues.push({
          path,
          message: "Each page must be an object.",
        });
        return;
      }

      if (!isNonEmptyString(page.slug) || !isValidSlug(page.slug)) {
        issues.push({
          path: `${path}.slug`,
          message: "Page slug must be a valid internal path.",
        });
      } else {
        if (pageSlugs.has(page.slug)) {
          issues.push({
            path: `${path}.slug`,
            message: "Page slugs must be unique.",
          });
        }

        pageSlugs.add(page.slug);
      }

      if (page.pageType === "home") {
        homePageCount += 1;
      }

      if (!isNonEmptyString(page.title)) {
        issues.push({
          path: `${path}.title`,
          message: "Page title is required.",
        });
      }

      if (!Array.isArray(page.sections)) {
        issues.push({
          path: `${path}.sections`,
          message: "Page sections must be a list.",
        });
      } else {
        page.sections.forEach((section, sectionIndex) => {
          const sectionPath = `${path}.sections.${sectionIndex}`;

          if (!isRecord(section)) {
            issues.push({
              path: sectionPath,
              message: "Each section must be an object.",
            });
            return;
          }

          if (!isNonEmptyString(section.id)) {
            issues.push({
              path: `${sectionPath}.id`,
              message: "Section ID is required.",
            });
          }

          if (!isNonEmptyString(section.heading)) {
            issues.push({
              path: `${sectionPath}.heading`,
              message: "Section heading is required.",
            });
          }

          if (
            isRecord(section.primaryCta) &&
            isNonEmptyString(section.primaryCta.href) &&
            !isValidUrlOrPath(section.primaryCta.href)
          ) {
            issues.push({
              path: `${sectionPath}.primaryCta.href`,
              message: "Primary CTA link is invalid.",
            });
          }

          if (
            isRecord(section.secondaryCta) &&
            isNonEmptyString(section.secondaryCta.href) &&
            !isValidUrlOrPath(section.secondaryCta.href)
          ) {
            issues.push({
              path: `${sectionPath}.secondaryCta.href`,
              message: "Secondary CTA link is invalid.",
            });
          }
        });
      }

      validateSeo(page.seo, `${path}.seo`, issues);
    });

    if (homePageCount !== 1) {
      issues.push({
        path: "website.pages",
        message: "The website must contain exactly one homepage.",
      });
    }
  }

  if (!Array.isArray(value.services) || value.services.length === 0) {
    issues.push({
      path: "website.services",
      message: "At least one service is required.",
    });
  } else {
    const serviceSlugs = new Set<string>();

    value.services.forEach((service, serviceIndex) => {
      const path = `website.services.${serviceIndex}`;

      if (!isRecord(service)) {
        issues.push({
          path,
          message: "Each service must be an object.",
        });
        return;
      }

      if (!isNonEmptyString(service.name)) {
        issues.push({
          path: `${path}.name`,
          message: "Service name is required.",
        });
      }

      if (
        !isNonEmptyString(service.slug) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(service.slug)
      ) {
        issues.push({
          path: `${path}.slug`,
          message: "Service slug is invalid.",
        });
      } else {
        if (serviceSlugs.has(service.slug)) {
          issues.push({
            path: `${path}.slug`,
            message: "Service slugs must be unique.",
          });
        }

        serviceSlugs.add(service.slug);
      }

      if (!isNonEmptyString(service.shortDescription)) {
        issues.push({
          path: `${path}.shortDescription`,
          message: "Short service description is required.",
        });
      }

      if (!isNonEmptyString(service.fullDescription)) {
        issues.push({
          path: `${path}.fullDescription`,
          message: "Full service description is required.",
        });
      }

      validateSeo(service.seo, `${path}.seo`, issues);
    });
  }

  if (!isRecord(value.globalContent)) {
    issues.push({
      path: "website.globalContent",
      message: "Global website content is required.",
    });
  } else {
    if (
      !isNonEmptyString(value.globalContent.emailDisplay) ||
      !isValidEmail(value.globalContent.emailDisplay)
    ) {
      issues.push({
        path: "website.globalContent.emailDisplay",
        message: "A valid public email address is required.",
      });
    }

    if (!isNonEmptyString(value.globalContent.phoneDisplay)) {
      issues.push({
        path: "website.globalContent.phoneDisplay",
        message: "A public phone number is required.",
      });
    }

    if (!isNonEmptyString(value.globalContent.footerDescription)) {
      issues.push({
        path: "website.globalContent.footerDescription",
        message: "Footer description is required.",
      });
    }
  }

  if (!isRecord(value.legal)) {
    issues.push({
      path: "website.legal",
      message: "Legal content is required.",
    });
  } else {
    for (const field of [
      "privacyNotice",
      "cookieNotice",
      "websiteTerms",
    ] as const) {
      if (!isNonEmptyString(value.legal[field])) {
        issues.push({
          path: `website.legal.${field}`,
          message: `${field} is required before publishing.`,
        });
      }
    }
  }
}

function validateRequestBody(
  value: unknown,
): asserts value is PublishRequestBody {
  if (!isRecord(value)) {
    throw new HttpError(400, "The request body must be a JSON object.");
  }

  const issues: ValidationIssue[] = [];

  validateWebsite(value.website, issues);
  validateApproval(value.approval, issues);
  validateConfiguration(value.configuration, issues);

  if (issues.length > 0) {
    throw new HttpError(
      422,
      "The website is not ready to publish.",
      issues.slice(0, 100),
    );
  }
}

function resolveDomain(configuration: PublishConfiguration) {
  if (configuration.domainOption === "existing") {
    return {
      domain: normaliseDomain(configuration.existingDomain),
      temporaryDomain: false,
    };
  }

  if (configuration.domainOption === "new") {
    return {
      domain: normaliseDomain(configuration.newDomain),
      temporaryDomain: false,
    };
  }

  const temporarySubdomain = normaliseTemporarySubdomain(
    configuration.temporarySubdomain,
  );

  return {
    domain: `${temporarySubdomain}.beaconbusiness.site`,
    temporaryDomain: true,
  };
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new HttpError(
      503,
      "Supabase publishing is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the server environment.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "beacon-business-publisher",
      },
    },
  });
}

async function getAuthenticatedOwner() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new HttpError(401, "You must be signed in to publish a website.");
  }

  return {
    id: session.user.id,
    name:
      session.user.name?.trim() ||
      session.user.email?.trim() ||
      "Beacon Business owner",
    email: session.user.email?.trim() || "",
  };
}

function parseRpcResult(value: unknown): PublishWebsiteRpcResult {
  const result = Array.isArray(value) ? value[0] : value;

  if (!isRecord(result)) {
    throw new HttpError(
      500,
      "The publishing transaction returned an invalid response.",
    );
  }

  if (
    !isNonEmptyString(result.published_website_id) ||
    !isNonEmptyString(result.domain) ||
    !isFiniteNumber(result.website_version) ||
    !isNonEmptyString(result.action) ||
    !isNonEmptyString(result.published_at)
  ) {
    throw new HttpError(
      500,
      "The publishing transaction returned incomplete information.",
    );
  }

  if (result.action !== "published" && result.action !== "republished") {
    throw new HttpError(
      500,
      "The publishing transaction returned an unsupported action.",
    );
  }

  return {
    published_website_id: result.published_website_id,
    domain: result.domain,
    website_version: result.website_version,
    action: result.action,
    published_at: result.published_at,
  };
}

function buildSecurityHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: buildSecurityHeaders(),
  });
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  try {
    const owner = await getAuthenticatedOwner();
    const rawBody = await readJsonBody(request);

    validateRequestBody(rawBody);

    const { domain, temporaryDomain } = resolveDomain(
      rawBody.configuration,
    );

    if (!isValidDomain(domain)) {
      throw new HttpError(
        422,
        "The selected publishing domain is invalid.",
      );
    }

    if (
      rawBody.configuration.hostingOption === "external" &&
      rawBody.configuration.domainOption === "temporary"
    ) {
      throw new HttpError(
        422,
        "A temporary Beacon subdomain cannot use external hosting.",
      );
    }

    const approvedBy =
      rawBody.approval.approvedBy.trim() || owner.name;

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc(
      "publish_business_website",
      {
        p_owner_id: owner.id,
        p_business_name: rawBody.website.project.businessName.trim(),
        p_display_name: rawBody.website.project.displayName.trim(),
        p_domain: domain,
        p_temporary_domain: temporaryDomain,
        p_website_data: rawBody.website,
        p_publish_configuration: {
          ...rawBody.configuration,
          selectedDomain: domain,
        },
        p_approval_data: {
          ...rawBody.approval,
          approvedBy,
          authenticatedOwnerId: owner.id,
          authenticatedOwnerEmail: owner.email,
        },
        p_approved_by: approvedBy,
        p_approved_at: rawBody.approval.approvedAt,
      },
    );

    if (error) {
      if (
        error.code === "23505" ||
        error.message.toLowerCase().includes("domain")
      ) {
        throw new HttpError(
          409,
          "That domain is already connected to another published website.",
        );
      }

      if (
        error.code === "PGRST202" ||
        error.message
          .toLowerCase()
          .includes("publish_business_website")
      ) {
        throw new HttpError(
          503,
          "The database publishing function is not installed yet. Run the Beacon Business publishing transaction migration in Supabase.",
        );
      }

      throw new HttpError(
        500,
        `The website could not be saved: ${error.message}`,
      );
    }

    const result = parseRpcResult(data);
    const liveUrl = `https://${result.domain}`;

    return jsonResponse({
      ok: true,
      status: "published",
      requestId,
      publishedWebsiteId: result.published_website_id,
      domain: result.domain,
      liveUrl,
      websiteVersion: result.website_version,
      action: result.action,
      publishedAt: result.published_at,
      durationMs: Date.now() - startedAt,
      message:
        result.action === "republished"
          ? "The latest approved website version is now live."
          : "The approved website is now live.",
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message =
      error instanceof HttpError
        ? error.message
        : "Beacon could not publish the website.";

    if (!(error instanceof HttpError)) {
      console.error("Database website publishing failed", {
        requestId,
        error,
      });
    }

    return jsonResponse(
      {
        ok: false,
        status: "failed",
        requestId,
        error: message,
        ...(error instanceof HttpError && error.details
          ? { details: error.details }
          : {}),
        durationMs: Date.now() - startedAt,
      },
      status,
    );
  }
}

export async function GET() {
  try {
    const owner = await getAuthenticatedOwner();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("business_published_websites")
      .select(
        "id, business_name, display_name, domain, temporary_domain, status, website_version, approved_at, published_at, last_published_at, updated_at",
      )
      .eq("owner_id", owner.id)
      .neq("status", "archived")
      .order("last_published_at", { ascending: false });

    if (error) {
      throw new HttpError(
        500,
        `Published websites could not be loaded: ${error.message}`,
      );
    }

    return jsonResponse({
      ok: true,
      websites: (data ?? []).map((website) => ({
        id: website.id,
        businessName: website.business_name,
        displayName: website.display_name,
        domain: website.domain,
        liveUrl: `https://${website.domain}`,
        temporaryDomain: website.temporary_domain,
        status: website.status,
        websiteVersion: website.website_version,
        approvedAt: website.approved_at,
        publishedAt: website.published_at,
        lastPublishedAt: website.last_published_at,
        updatedAt: website.updated_at,
      })),
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message =
      error instanceof HttpError
        ? error.message
        : "Published websites could not be loaded.";

    return jsonResponse(
      {
        ok: false,
        error: message,
      },
      status,
    );
  }
}