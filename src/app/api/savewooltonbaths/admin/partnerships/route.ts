import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getAccessErrorStatus,
  requireAdministratorAccount,
} from "@/lib/auth/AdminAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// Types
// ============================================================

type PartnershipStatus =
  | "contacted"
  | "responded"
  | "meeting_arranged"
  | "support_in_principle"
  | "offer_received"
  | "confirmed_partner"
  | "declined"
  | "no_response"
  | "closed";

type RelationshipType =
  | "professional_support"
  | "commercial_partner"
  | "materials_equipment"
  | "services_labour"
  | "community_support"
  | "elected_representative"
  | "academic_partner"
  | "energy_sustainability"
  | "media_awareness"
  | "public_sector"
  | "other";

type PartnershipPriority =
  | "low"
  | "normal"
  | "high"
  | "critical";

type ContactMethod =
  | "email"
  | "phone"
  | "contact_form"
  | "in_person"
  | "social_media"
  | "letter"
  | "referral"
  | "other";

type MeetingFormat =
  | "in_person"
  | "phone"
  | "teams"
  | "zoom"
  | "google_meet"
  | "other";

type ContributionType =
  | "professional_services"
  | "materials"
  | "equipment"
  | "labour"
  | "discount"
  | "technical_advice"
  | "survey_report"
  | "public_support"
  | "media_coverage"
  | "academic_support"
  | "funding"
  | "other";

type PublicCategory =
  | "professional_partners"
  | "heritage_construction"
  | "engineering_energy"
  | "community"
  | "academic"
  | "media_awareness"
  | "public_sector"
  | "other";

type PartnershipInput = {
  organisationName?: unknown;

  contactName?: unknown;
  contactJobTitle?: unknown;

  email?: unknown;
  phone?: unknown;
  websiteUrl?: unknown;

  organisationAddress?: unknown;

  relationshipType?: unknown;
  sector?: unknown;

  status?: unknown;
  priority?: unknown;

  firstContactedAt?: unknown;
  lastContactedAt?: unknown;
  lastResponseAt?: unknown;

  contactMethod?: unknown;
  referredBy?: unknown;

  nextFollowUpAt?: unknown;

  meetingScheduledAt?: unknown;
  meetingLocation?: unknown;
  meetingFormat?: unknown;
  meetingNotes?: unknown;

  supportRequested?: unknown;
  requestedCategory?: unknown;

  offerSummary?: unknown;
  offerDetails?: unknown;
  contributionType?: unknown;

  estimatedCommercialValueGbp?: unknown;
  campaignCostGbp?: unknown;

  offerConditions?: unknown;
  offerReceivedAt?: unknown;
  offerConfirmedAt?: unknown;

  accessRequired?: unknown;
  councilAccessRequired?: unknown;

  dependencyNotes?: unknown;
  actionRequired?: unknown;

  internalNotes?: unknown;

  evidenceReference?: unknown;
  documentReference?: unknown;

  logoUrl?: unknown;
  photoUrl?: unknown;

  displayPublicly?: unknown;

  publicNameApproved?: unknown;
  publicLogoApproved?: unknown;
  publicPhotoApproved?: unknown;
  publicWordingApproved?: unknown;

  publicPermissionReceivedAt?: unknown;

  approvedPublicName?: unknown;
  approvedPublicTitle?: unknown;
  approvedPublicWording?: unknown;

  publicCategory?: unknown;
  publicWebsiteUrl?: unknown;

  displayOrder?: unknown;

  confirmedPartnerSince?: unknown;

  archived?: unknown;
};

type PartnershipRow = {
  id: string;

  organisation_name: string;

  contact_name: string | null;
  contact_job_title: string | null;

  email: string | null;
  phone: string | null;
  website_url: string | null;

  organisation_address: string | null;

  relationship_type: RelationshipType;
  sector: string | null;

  status: PartnershipStatus;
  priority: PartnershipPriority;

  first_contacted_at: string | null;
  last_contacted_at: string | null;
  last_response_at: string | null;

  contact_method: ContactMethod | null;
  referred_by: string | null;

  next_follow_up_at: string | null;

  meeting_scheduled_at: string | null;
  meeting_location: string | null;
  meeting_format: MeetingFormat | null;
  meeting_notes: string | null;

  support_requested: string | null;
  requested_category: string | null;

  offer_summary: string | null;
  offer_details: string | null;
  contribution_type: ContributionType | null;

  estimated_commercial_value_gbp:
    | number
    | null;

  campaign_cost_gbp:
    | number
    | null;

  contribution_value_gbp:
    | number
    | null;

  offer_conditions: string | null;

  offer_received_at: string | null;
  offer_confirmed_at: string | null;

  access_required: boolean;
  council_access_required: boolean;

  dependency_notes: string | null;
  action_required: string | null;

  internal_notes: string | null;

  evidence_reference: string | null;
  document_reference: string | null;

  logo_url: string | null;
  photo_url: string | null;

  display_publicly: boolean;

  public_name_approved: boolean;
  public_logo_approved: boolean;
  public_photo_approved: boolean;
  public_wording_approved: boolean;

  public_permission_received_at:
    | string
    | null;

  approved_public_name: string | null;
  approved_public_title: string | null;
  approved_public_wording:
    | string
    | null;

  public_category:
    | PublicCategory
    | null;

  public_website_url: string | null;

  display_order: number;

  confirmed_partner_since:
    | string
    | null;

  archived: boolean;
  archived_at: string | null;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
};

type PartnershipSummaryRow = {
  total_active: number;
  contacted: number;
  responded: number;
  meetings_arranged: number;
  support_in_principle: number;
  offers_received: number;
  confirmed_partners: number;
  declined: number;
  publicly_recognised: number;

  estimated_commercial_value_gbp:
    number;

  campaign_cost_gbp:
    number;

  contributed_value_gbp:
    number;
};

// ============================================================
// Allowed values
// ============================================================

const STATUSES =
  new Set<PartnershipStatus>([
    "contacted",
    "responded",
    "meeting_arranged",
    "support_in_principle",
    "offer_received",
    "confirmed_partner",
    "declined",
    "no_response",
    "closed",
  ]);

const RELATIONSHIP_TYPES =
  new Set<RelationshipType>([
    "professional_support",
    "commercial_partner",
    "materials_equipment",
    "services_labour",
    "community_support",
    "elected_representative",
    "academic_partner",
    "energy_sustainability",
    "media_awareness",
    "public_sector",
    "other",
  ]);

const PRIORITIES =
  new Set<PartnershipPriority>([
    "low",
    "normal",
    "high",
    "critical",
  ]);

const CONTACT_METHODS =
  new Set<ContactMethod>([
    "email",
    "phone",
    "contact_form",
    "in_person",
    "social_media",
    "letter",
    "referral",
    "other",
  ]);

const MEETING_FORMATS =
  new Set<MeetingFormat>([
    "in_person",
    "phone",
    "teams",
    "zoom",
    "google_meet",
    "other",
  ]);

const CONTRIBUTION_TYPES =
  new Set<ContributionType>([
    "professional_services",
    "materials",
    "equipment",
    "labour",
    "discount",
    "technical_advice",
    "survey_report",
    "public_support",
    "media_coverage",
    "academic_support",
    "funding",
    "other",
  ]);

const PUBLIC_CATEGORIES =
  new Set<PublicCategory>([
    "professional_partners",
    "heritage_construction",
    "engineering_energy",
    "community",
    "academic",
    "media_awareness",
    "public_sector",
    "other",
  ]);

// ============================================================
// Supabase administration client
// ============================================================

function cleanEnvironmentValue(
  value: string | undefined,
  variableName?: string,
): string {
  let cleaned =
    (value ?? "").trim();

  cleaned = cleaned
    .replace(
      /^["']+|["']+$/g,
      "",
    )
    .trim();

  if (variableName) {
    const prefix =
      `${variableName}=`;

    if (
      cleaned
        .toLowerCase()
        .startsWith(
          prefix.toLowerCase(),
        )
    ) {
      cleaned = cleaned
        .slice(prefix.length)
        .trim()
        .replace(
          /^["']+|["']+$/g,
          "",
        )
        .trim();
    }
  }

  return cleaned;
}

function getSupabaseAdmin():
  SupabaseClient {
  const supabaseUrl =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    );

  const serviceRoleKey =
    cleanEnvironmentValue(
      process.env
        .SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY",
    );

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl =
      new URL(supabaseUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL.",
    );
  }

  if (
    parsedUrl.protocol !==
      "https:" &&
    parsedUrl.protocol !==
      "http:"
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTP or HTTPS.",
    );
  }

  return createClient(
    parsedUrl.toString(),
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

// ============================================================
// Response helpers
// ============================================================

function jsonResponse(
  body: Record<
    string,
    unknown
  >,
  status = 200,
): NextResponse {
  return NextResponse.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",

        "X-Content-Type-Options":
          "nosniff",

        "Referrer-Policy":
          "no-referrer",
      },
    },
  );
}

function handleAccessError(
  error: unknown,
): NextResponse | null {
  const accessStatus =
    getAccessErrorStatus(error);

  if (accessStatus === 401) {
    return jsonResponse(
      {
        ok: false,

        error:
          "Administrator authentication is required.",
      },
      401,
    );
  }

  if (accessStatus === 403) {
    return jsonResponse(
      {
        ok: false,

        error:
          "Administrator access is required.",
      },
      403,
    );
  }

  return null;
}

// ============================================================
// Cleaning helpers
// ============================================================

function cleanText(
  value: unknown,
  maxLength: number,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .replace(
      /\u0000/g,
      "",
    )
    .replace(
      /\r\n/g,
      "\n",
    )
    .trim()
    .slice(
      0,
      maxLength,
    );
}

function cleanSingleLine(
  value: unknown,
  maxLength: number,
): string {
  return cleanText(
    value,
    maxLength,
  )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function emptyToNull(
  value: string,
): string | null {
  return value.length > 0
    ? value
    : null;
}

function normaliseEmail(
  value: unknown,
): string {
  return cleanSingleLine(
    value,
    320,
  ).toLowerCase();
}

function isValidEmail(
  value: string,
): boolean {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function normaliseUrl(
  value: unknown,
): string {
  const raw =
    cleanSingleLine(
      value,
      2000,
    );

  if (!raw) {
    return "";
  }

  try {
    const candidate =
      /^https?:\/\//i.test(
        raw,
      )
        ? raw
        : `https://${raw}`;

    const url =
      new URL(candidate);

    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function parseBoolean(
  value: unknown,
  defaultValue = false,
): boolean {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  return defaultValue;
}

function parseNullableNumber(
  value: unknown,
  fieldName: string,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    typeof value ===
    "number"
      ? value
      : Number(
          String(value)
            .replace(
              /,/g,
              "",
            )
            .trim(),
        );

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    throw new Error(
      `${fieldName} must be a valid non-negative number.`,
    );
  }

  return (
    Math.round(
      number * 100,
    ) / 100
  );
}

function parseDisplayOrder(
  value: unknown,
): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 100;
  }

  const parsed =
    typeof value ===
    "number"
      ? value
      : Number.parseInt(
          String(value),
          10,
        );

  if (
    !Number.isInteger(
      parsed,
    ) ||
    parsed < 0
  ) {
    throw new Error(
      "Display order must be a non-negative whole number.",
    );
  }

  return Math.min(
    parsed,
    100000,
  );
}

function parseNullableDateTime(
  value: unknown,
  fieldName: string,
): string | null {
  const raw =
    cleanSingleLine(
      value,
      100,
    );

  if (!raw) {
    return null;
  }

  const parsed =
    new Date(raw);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} is not a valid date or time.`,
    );
  }

  return parsed.toISOString();
}

function parseNullableDate(
  value: unknown,
  fieldName: string,
): string | null {
  const raw =
    cleanSingleLine(
      value,
      20,
    );

  if (!raw) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      raw,
    );

  if (!match) {
    throw new Error(
      `${fieldName} must use YYYY-MM-DD format.`,
    );
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    throw new Error(
      `${fieldName} is not a valid date.`,
    );
  }

  return raw;
}

// ============================================================
// Enum parsers
// ============================================================

function parseStatus(
  value: unknown,
): PartnershipStatus {
  const candidate =
    cleanSingleLine(
      value,
      80,
    ) as PartnershipStatus;

  if (!candidate) {
    return "contacted";
  }

  if (
    !STATUSES.has(
      candidate,
    )
  ) {
    throw new Error(
      "Invalid partnership status.",
    );
  }

  return candidate;
}

function parseRelationshipType(
  value: unknown,
): RelationshipType {
  const candidate =
    cleanSingleLine(
      value,
      100,
    ) as RelationshipType;

  if (!candidate) {
    return "other";
  }

  if (
    !RELATIONSHIP_TYPES.has(
      candidate,
    )
  ) {
    throw new Error(
      "Invalid relationship type.",
    );
  }

  return candidate;
}

function parsePriority(
  value: unknown,
): PartnershipPriority {
  const candidate =
    cleanSingleLine(
      value,
      50,
    ) as PartnershipPriority;

  if (!candidate) {
    return "normal";
  }

  if (
    !PRIORITIES.has(
      candidate,
    )
  ) {
    throw new Error(
      "Invalid priority.",
    );
  }

  return candidate;
}

function parseContactMethod(
  value: unknown,
): ContactMethod | null {
  const candidate =
    cleanSingleLine(
      value,
      50,
    ) as ContactMethod;

  if (!candidate) {
    return null;
  }

  if (
    !CONTACT_METHODS.has(
      candidate,
    )
  ) {
    throw new Error(
      "Invalid contact method.",
    );
  }

  return candidate;
}

function parseMeetingFormat(
  value: unknown,
): MeetingFormat | null {
  const candidate =
    cleanSingleLine(
      value,
      50,
    ) as MeetingFormat;

  if (!candidate) {
    return null;
  }

  if (
    !MEETING_FORMATS.has(
      candidate,
    )
  ) {
    throw new Error(
      "Invalid meeting format.",
    );
  }

  return candidate;
}

function parseContributionType(
  value: unknown,
): ContributionType | null {
  const candidate =
    cleanSingleLine(
      value,
      80,
    ) as ContributionType;

  if (!candidate) {
    return null;
  }

  if (
    !CONTRIBUTION_TYPES.has(
      candidate,
    )
  ) {
    throw new Error(
      "Invalid contribution type.",
    );
  }

  return candidate;
}

function parsePublicCategory(
  value: unknown,
): PublicCategory | null {
  const candidate =
    cleanSingleLine(
      value,
      100,
    ) as PublicCategory;

  if (!candidate) {
    return null;
  }

  if (
    !PUBLIC_CATEGORIES.has(
      candidate,
    )
  ) {
    throw new Error(
      "Invalid public category.",
    );
  }

  return candidate;
}

// ============================================================
// Input parser
// ============================================================

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function parseJsonBody(
  request: NextRequest,
): Promise<PartnershipInput> {
  const contentType =
    request.headers.get(
      "content-type",
    ) ?? "";

  if (
    !contentType
      .toLowerCase()
      .includes(
        "application/json",
      )
  ) {
    throw new Error(
      "Request body must be JSON.",
    );
  }

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    throw new Error(
      "The request body could not be read.",
    );
  }

  if (!isRecord(body)) {
    throw new Error(
      "Invalid request body.",
    );
  }

  return (
    body as PartnershipInput
  );
}

// ============================================================
// Database payload
// ============================================================

function buildDatabasePayload(
  body: PartnershipInput,
  administratorId: string,
) {
  const organisationName =
    cleanSingleLine(
      body.organisationName,
      200,
    );

  if (!organisationName) {
    throw new Error(
      "Organisation name is required.",
    );
  }

  const email =
    normaliseEmail(
      body.email,
    );

  if (
    !isValidEmail(email)
  ) {
    throw new Error(
      "Please enter a valid contact email address.",
    );
  }

  const websiteRaw =
    cleanSingleLine(
      body.websiteUrl,
      2000,
    );

  const websiteUrl =
    normaliseUrl(
      body.websiteUrl,
    );

  if (
    websiteRaw &&
    !websiteUrl
  ) {
    throw new Error(
      "Please enter a valid organisation website.",
    );
  }

  const publicWebsiteRaw =
    cleanSingleLine(
      body.publicWebsiteUrl,
      2000,
    );

  const publicWebsiteUrl =
    normaliseUrl(
      body.publicWebsiteUrl,
    );

  if (
    publicWebsiteRaw &&
    !publicWebsiteUrl
  ) {
    throw new Error(
      "Please enter a valid public website.",
    );
  }

  const logoRaw =
    cleanSingleLine(
      body.logoUrl,
      2000,
    );

  const logoUrl =
    normaliseUrl(
      body.logoUrl,
    );

  if (
    logoRaw &&
    !logoUrl
  ) {
    throw new Error(
      "Please enter a valid logo URL.",
    );
  }

  const photoRaw =
    cleanSingleLine(
      body.photoUrl,
      2000,
    );

  const photoUrl =
    normaliseUrl(
      body.photoUrl,
    );

  if (
    photoRaw &&
    !photoUrl
  ) {
    throw new Error(
      "Please enter a valid photo URL.",
    );
  }

  const displayPublicly =
    parseBoolean(
      body.displayPublicly,
    );

  const publicNameApproved =
    parseBoolean(
      body.publicNameApproved,
    );

  const publicLogoApproved =
    parseBoolean(
      body.publicLogoApproved,
    );

  const publicPhotoApproved =
    parseBoolean(
      body.publicPhotoApproved,
    );

  const publicWordingApproved =
    parseBoolean(
      body.publicWordingApproved,
    );

  const approvedPublicName =
    cleanSingleLine(
      body.approvedPublicName,
      200,
    );

  const publicCategory =
    parsePublicCategory(
      body.publicCategory,
    );

  if (
    displayPublicly &&
    !publicNameApproved
  ) {
    throw new Error(
      "Public name approval is required before this record can be displayed publicly.",
    );
  }

  if (
    displayPublicly &&
    !publicCategory
  ) {
    throw new Error(
      "A public category is required before this record can be displayed publicly.",
    );
  }

  if (
    displayPublicly &&
    !approvedPublicName
  ) {
    throw new Error(
      "Enter the approved public name before publishing this record.",
    );
  }

  return {
    organisation_name:
      organisationName,

    contact_name:
      emptyToNull(
        cleanSingleLine(
          body.contactName,
          180,
        ),
      ),

    contact_job_title:
      emptyToNull(
        cleanSingleLine(
          body.contactJobTitle,
          200,
        ),
      ),

    email:
      emptyToNull(email),

    phone:
      emptyToNull(
        cleanSingleLine(
          body.phone,
          80,
        ),
      ),

    website_url:
      emptyToNull(
        websiteUrl,
      ),

    organisation_address:
      emptyToNull(
        cleanText(
          body.organisationAddress,
          2000,
        ),
      ),

    relationship_type:
      parseRelationshipType(
        body.relationshipType,
      ),

    sector:
      emptyToNull(
        cleanSingleLine(
          body.sector,
          200,
        ),
      ),

    status:
      parseStatus(
        body.status,
      ),

    priority:
      parsePriority(
        body.priority,
      ),

    first_contacted_at:
      parseNullableDateTime(
        body.firstContactedAt,
        "First contacted date",
      ),

    last_contacted_at:
      parseNullableDateTime(
        body.lastContactedAt,
        "Last contacted date",
      ),

    last_response_at:
      parseNullableDateTime(
        body.lastResponseAt,
        "Last response date",
      ),

    contact_method:
      parseContactMethod(
        body.contactMethod,
      ),

    referred_by:
      emptyToNull(
        cleanSingleLine(
          body.referredBy,
          250,
        ),
      ),

    next_follow_up_at:
      parseNullableDateTime(
        body.nextFollowUpAt,
        "Next follow-up date",
      ),

    meeting_scheduled_at:
      parseNullableDateTime(
        body.meetingScheduledAt,
        "Meeting date",
      ),

    meeting_location:
      emptyToNull(
        cleanSingleLine(
          body.meetingLocation,
          500,
        ),
      ),

    meeting_format:
      parseMeetingFormat(
        body.meetingFormat,
      ),

    meeting_notes:
      emptyToNull(
        cleanText(
          body.meetingNotes,
          10000,
        ),
      ),

    support_requested:
      emptyToNull(
        cleanText(
          body.supportRequested,
          10000,
        ),
      ),

    requested_category:
      emptyToNull(
        cleanSingleLine(
          body.requestedCategory,
          250,
        ),
      ),

    offer_summary:
      emptyToNull(
        cleanText(
          body.offerSummary,
          2500,
        ),
      ),

    offer_details:
      emptyToNull(
        cleanText(
          body.offerDetails,
          15000,
        ),
      ),

    contribution_type:
      parseContributionType(
        body.contributionType,
      ),

    estimated_commercial_value_gbp:
      parseNullableNumber(
        body
          .estimatedCommercialValueGbp,
        "Estimated commercial value",
      ),

    campaign_cost_gbp:
      parseNullableNumber(
        body.campaignCostGbp,
        "Campaign cost",
      ),

    offer_conditions:
      emptyToNull(
        cleanText(
          body.offerConditions,
          10000,
        ),
      ),

    offer_received_at:
      parseNullableDateTime(
        body.offerReceivedAt,
        "Offer received date",
      ),

    offer_confirmed_at:
      parseNullableDateTime(
        body.offerConfirmedAt,
        "Offer confirmed date",
      ),

    access_required:
      parseBoolean(
        body.accessRequired,
      ),

    council_access_required:
      parseBoolean(
        body.councilAccessRequired,
      ),

    dependency_notes:
      emptyToNull(
        cleanText(
          body.dependencyNotes,
          10000,
        ),
      ),

    action_required:
      emptyToNull(
        cleanText(
          body.actionRequired,
          5000,
        ),
      ),

    internal_notes:
      emptyToNull(
        cleanText(
          body.internalNotes,
          20000,
        ),
      ),

    evidence_reference:
      emptyToNull(
        cleanText(
          body.evidenceReference,
          5000,
        ),
      ),

    document_reference:
      emptyToNull(
        cleanText(
          body.documentReference,
          5000,
        ),
      ),

    logo_url:
      emptyToNull(
        logoUrl,
      ),

    photo_url:
      emptyToNull(
        photoUrl,
      ),

    display_publicly:
      displayPublicly,

    public_name_approved:
      publicNameApproved,

    public_logo_approved:
      publicLogoApproved,

    public_photo_approved:
      publicPhotoApproved,

    public_wording_approved:
      publicWordingApproved,

    public_permission_received_at:
      parseNullableDateTime(
        body
          .publicPermissionReceivedAt,
        "Public permission date",
      ),

    approved_public_name:
      emptyToNull(
        approvedPublicName,
      ),

    approved_public_title:
      emptyToNull(
        cleanSingleLine(
          body.approvedPublicTitle,
          300,
        ),
      ),

    approved_public_wording:
      emptyToNull(
        cleanText(
          body.approvedPublicWording,
          5000,
        ),
      ),

    public_category:
      publicCategory,

    public_website_url:
      emptyToNull(
        publicWebsiteUrl,
      ),

    display_order:
      parseDisplayOrder(
        body.displayOrder,
      ),

    confirmed_partner_since:
      parseNullableDate(
        body
          .confirmedPartnerSince,
        "Confirmed partner date",
      ),

    archived:
      parseBoolean(
        body.archived,
      ),

    updated_by:
      administratorId,
  };
}

// ============================================================
// Summary
// ============================================================

async function getSummary(
  supabase: SupabaseClient,
): Promise<PartnershipSummaryRow> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "woolton_partnership_summary",
      )
      .select("*")
      .single();

  if (error) {
    console.error(
      "[Woolton Partnerships] Summary query failed:",
      error,
    );

    throw new Error(
      "The partnership summary could not be loaded.",
    );
  }

  return (
    data as PartnershipSummaryRow
  );
}

// ============================================================
// Validation error classification
// ============================================================

function isValidationError(
  message: string,
): boolean {
  return (
    message.includes(
      "required",
    ) ||
    message.includes(
      "valid",
    ) ||
    message.includes(
      "Invalid",
    ) ||
    message.includes(
      "must",
    ) ||
    message.includes(
      "before publishing",
    ) ||
    message.includes(
      "before this record",
    )
  );
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request: NextRequest,
) {
  try {
    await requireAdministratorAccount();

    const supabase =
      getSupabaseAdmin();

    const search =
      request.nextUrl.searchParams
        .get("search")
        ?.trim()
        .slice(
          0,
          200,
        ) ?? "";

    const status =
      request.nextUrl.searchParams
        .get("status")
        ?.trim() ?? "";

    const relationshipType =
      request.nextUrl.searchParams
        .get(
          "relationshipType",
        )
        ?.trim() ?? "";

    const publicOnly =
      request.nextUrl.searchParams
        .get(
          "publicOnly",
        ) === "true";

    const archived =
      request.nextUrl.searchParams
        .get(
          "archived",
        ) === "true";

    if (
      status &&
      !STATUSES.has(
        status as PartnershipStatus,
      )
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Invalid status filter.",
        },
        400,
      );
    }

    if (
      relationshipType &&
      !RELATIONSHIP_TYPES.has(
        relationshipType as RelationshipType,
      )
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Invalid relationship filter.",
        },
        400,
      );
    }

    let query =
      supabase
        .from(
          "woolton_partnership_registry",
        )
        .select("*")
        .eq(
          "archived",
          archived,
        )
        .order(
          "updated_at",
          {
            ascending: false,
          },
        );

    if (status) {
      query =
        query.eq(
          "status",
          status,
        );
    }

    if (
      relationshipType
    ) {
      query =
        query.eq(
          "relationship_type",
          relationshipType,
        );
    }

    if (publicOnly) {
      query =
        query.eq(
          "display_publicly",
          true,
        );
    }

    if (search) {
      const safeSearch =
        search
          .replace(
            /[%_,()]/g,
            " ",
          )
          .replace(
            /\s+/g,
            " ",
          )
          .trim();

      if (safeSearch) {
        query =
          query.or(
            [
              `organisation_name.ilike.%${safeSearch}%`,
              `contact_name.ilike.%${safeSearch}%`,
              `email.ilike.%${safeSearch}%`,
              `sector.ilike.%${safeSearch}%`,
              `offer_summary.ilike.%${safeSearch}%`,
            ].join(","),
          );
      }
    }

    const {
      data,
      error,
    } =
      await query;

    if (error) {
      console.error(
        "[Woolton Partnerships] List query failed:",
        error,
      );

      return jsonResponse(
        {
          ok: false,

          error:
            "The partnership register could not be loaded.",
        },
        500,
      );
    }

    const summary =
      await getSummary(
        supabase,
      );

    return jsonResponse(
      {
        ok: true,

        partnerships:
          (data ??
            []) as PartnershipRow[],

        summary,
      },
      200,
    );
  } catch (error) {
    const accessResponse =
      handleAccessError(
        error,
      );

    if (accessResponse) {
      return accessResponse;
    }

    console.error(
      "[Woolton Partnerships] GET failed:",
      error,
    );

    return jsonResponse(
      {
        ok: false,

        error:
          "The partnership register could not be loaded.",
      },
      500,
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request: NextRequest,
) {
  try {
    const administrator =
      await requireAdministratorAccount();

    const body =
      await parseJsonBody(
        request,
      );

    const payload =
      buildDatabasePayload(
        body,
        administrator.id,
      );

    const supabase =
      getSupabaseAdmin();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "woolton_partnership_registry",
        )
        .insert({
          ...payload,

          created_by:
            administrator.id,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "[Woolton Partnerships] Insert failed:",
        error,
      );

      if (
        error.code ===
        "23514"
      ) {
        return jsonResponse(
          {
            ok: false,

            error:
              "The record does not satisfy the partnership database rules. Check its status and public-recognition settings.",
          },
          400,
        );
      }

      return jsonResponse(
        {
          ok: false,

          error:
            "The partnership record could not be created.",
        },
        500,
      );
    }

    console.info(
      "[Woolton Partnerships] Record created:",
      {
        id:
          data.id,

        organisation:
          data.organisation_name,

        status:
          data.status,

        administratorId:
          administrator.id,
      },
    );

    const summary =
      await getSummary(
        supabase,
      );

    return jsonResponse(
      {
        ok: true,

        partnership:
          data as PartnershipRow,

        summary,

        message:
          "Partnership record created.",
      },
      201,
    );
  } catch (error) {
    const accessResponse =
      handleAccessError(
        error,
      );

    if (accessResponse) {
      return accessResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

    if (
      isValidationError(
        message,
      )
    ) {
      return jsonResponse(
        {
          ok: false,
          error: message,
        },
        400,
      );
    }

    console.error(
      "[Woolton Partnerships] POST failed:",
      error,
    );

    return jsonResponse(
      {
        ok: false,

        error:
          "The partnership record could not be created.",
      },
      500,
    );
  }
}