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

type HistoryInput = {
  eventType?: unknown;
  summary?: unknown;
  details?: unknown;
  happenedAt?: unknown;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

const HISTORY_EVENT_TYPES = new Set([
  "created",
  "status_changed",
  "contact",
  "response",
  "meeting",
  "offer",
  "confirmation",
  "public_permission",
  "note",
  "updated",
  "archived",
  "restored",
]);

function cleanEnvironmentValue(
  value: string | undefined,
  variableName?: string,
): string {
  let cleaned =
    (value ?? "").trim();

  cleaned = cleaned
    .replace(/^["']+|["']+$/g, "")
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

  const parsedUrl =
    new URL(supabaseUrl);

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.protocol !== "http:"
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

function jsonResponse(
  body: Record<string, unknown>,
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
  const status =
    getAccessErrorStatus(error);

  if (status === 401) {
    return jsonResponse(
      {
        ok: false,
        error:
          "Administrator authentication is required.",
      },
      401,
    );
  }

  if (status === 403) {
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

function cleanText(
  value: unknown,
  maxLength: number,
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
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
  return value
    ? value
    : null;
}

function readUuid(
  value: unknown,
): string {
  const candidate =
    cleanSingleLine(
      value,
      100,
    );

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      candidate,
    )
  ) {
    throw new Error(
      "Invalid partnership identifier.",
    );
  }

  return candidate;
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
      url.protocol !== "http:" &&
      url.protocol !== "https:"
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
  return typeof value === "boolean"
    ? value
    : defaultValue;
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
    typeof value === "number"
      ? value
      : Number(
          String(value)
            .replace(/,/g, "")
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

  const number =
    typeof value === "number"
      ? value
      : Number.parseInt(
          String(value),
          10,
        );

  if (
    !Number.isInteger(
      number,
    ) ||
    number < 0
  ) {
    throw new Error(
      "Display order must be a non-negative whole number.",
    );
  }

  return Math.min(
    number,
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

  const date =
    new Date(raw);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} is not a valid date or time.`,
    );
  }

  return date.toISOString();
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
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(
      `${fieldName} is not a valid date.`,
    );
  }

  return raw;
}

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
    !STATUSES.has(candidate)
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
    !PRIORITIES.has(candidate)
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

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function readJsonObject(
  request: NextRequest,
): Promise<
  Record<string, unknown>
> {
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

  return body;
}

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

  const status =
    parseStatus(
      body.status,
    );

  const publicPermissionReceivedAt =
    parseNullableDateTime(
      body.publicPermissionReceivedAt,
      "Public permission date",
    );

  if (
    displayPublicly &&
    status !== "confirmed_partner"
  ) {
    throw new Error(
      "Only a confirmed partner can be displayed publicly.",
    );
  }

  if (
    displayPublicly &&
    !publicPermissionReceivedAt
  ) {
    throw new Error(
      "Public recognition permission must be recorded before publishing this partner.",
    );
  }

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

    status,

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
      publicPermissionReceivedAt,

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

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdministratorAccount();

    const {
      id,
    } =
      await context.params;

    const partnershipId =
      readUuid(id);

    const supabase =
      getSupabaseAdmin();

    const [
      partnershipResult,
      historyResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "woolton_partnership_registry",
          )
          .select("*")
          .eq(
            "id",
            partnershipId,
          )
          .maybeSingle(),

        supabase
          .from(
            "woolton_partnership_history",
          )
          .select("*")
          .eq(
            "partnership_id",
            partnershipId,
          )
          .order(
            "happened_at",
            {
              ascending: false,
            },
          ),
      ]);

    if (
      partnershipResult.error
    ) {
      console.error(
        "[Woolton Partnerships] Record query failed:",
        partnershipResult.error,
      );

      return jsonResponse(
        {
          ok: false,
          error:
            "The partnership record could not be loaded.",
        },
        500,
      );
    }

    if (
      !partnershipResult.data
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "The partnership record could not be found.",
        },
        404,
      );
    }

    if (
      historyResult.error
    ) {
      console.error(
        "[Woolton Partnerships] History query failed:",
        historyResult.error,
      );

      return jsonResponse(
        {
          ok: false,
          error:
            "The partnership history could not be loaded.",
        },
        500,
      );
    }

    return jsonResponse(
      {
        ok: true,
        partnership:
          partnershipResult.data,
        history:
          historyResult.data ?? [],
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

    const message =
      error instanceof Error
        ? error.message
        : "";

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
      "[Woolton Partnerships] GET record failed:",
      error,
    );

    return jsonResponse(
      {
        ok: false,
        error:
          "The partnership record could not be loaded.",
      },
      500,
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const administrator =
      await requireAdministratorAccount();

    const {
      id,
    } =
      await context.params;

    const partnershipId =
      readUuid(id);

    const rawBody =
      await readJsonObject(
        request,
      );

    const body =
      rawBody as PartnershipInput;

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
        .update(
          payload,
        )
        .eq(
          "id",
          partnershipId,
        )
        .select("*")
        .maybeSingle();

    if (error) {
      console.error(
        "[Woolton Partnerships] Update failed:",
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
              "The record does not satisfy the partnership database rules. To publish, confirm the partner status, record public permission, approve the public name, enter the approved public name and select a public category.",
          },
          400,
        );
      }

      return jsonResponse(
        {
          ok: false,
          error:
            "The partnership record could not be updated.",
        },
        500,
      );
    }

    if (!data) {
      return jsonResponse(
        {
          ok: false,
          error:
            "The partnership record could not be found.",
        },
        404,
      );
    }

    await supabase
      .from(
        "woolton_partnership_history",
      )
      .insert({
        partnership_id:
          partnershipId,

        event_type:
          "updated",

        summary:
          "Partnership record updated",

        created_by:
          administrator.id,
      });

    return jsonResponse(
      {
        ok: true,
        partnership:
          data,
        message:
          "Partnership record updated.",
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

    const message =
      error instanceof Error
        ? error.message
        : "";

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
      "[Woolton Partnerships] PATCH failed:",
      error,
    );

    return jsonResponse(
      {
        ok: false,
        error:
          "The partnership record could not be updated.",
      },
      500,
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const administrator =
      await requireAdministratorAccount();

    const {
      id,
    } =
      await context.params;

    const partnershipId =
      readUuid(id);

    const body =
      await readJsonObject(
        request,
      ) as HistoryInput;

    const eventType =
      cleanSingleLine(
        body.eventType,
        80,
      );

    if (
      !HISTORY_EVENT_TYPES.has(
        eventType,
      )
    ) {
      throw new Error(
        "Invalid history event type.",
      );
    }

    const summary =
      cleanSingleLine(
        body.summary,
        500,
      );

    if (!summary) {
      throw new Error(
        "History summary is required.",
      );
    }

    const happenedAt =
      parseNullableDateTime(
        body.happenedAt,
        "History event date",
      );

    const supabase =
      getSupabaseAdmin();

    const existing =
      await supabase
        .from(
          "woolton_partnership_registry",
        )
        .select("id")
        .eq(
          "id",
          partnershipId,
        )
        .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (!existing.data) {
      return jsonResponse(
        {
          ok: false,
          error:
            "The partnership record could not be found.",
        },
        404,
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "woolton_partnership_history",
        )
        .insert({
          partnership_id:
            partnershipId,

          event_type:
            eventType,

          summary,

          details:
            emptyToNull(
              cleanText(
                body.details,
                10000,
              ),
            ),

          happened_at:
            happenedAt ??
            new Date().toISOString(),

          created_by:
            administrator.id,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "[Woolton Partnerships] History insert failed:",
        error,
      );

      return jsonResponse(
        {
          ok: false,
          error:
            "The history event could not be saved.",
        },
        500,
      );
    }

    return jsonResponse(
      {
        ok: true,
        historyEvent:
          data,
        message:
          "History event saved.",
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
        : "";

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
      "[Woolton Partnerships] History POST failed:",
      error,
    );

    return jsonResponse(
      {
        ok: false,
        error:
          "The history event could not be saved.",
      },
      500,
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const administrator =
      await requireAdministratorAccount();

    const {
      id,
    } =
      await context.params;

    const partnershipId =
      readUuid(id);

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
        .update({
          archived: true,
          updated_by:
            administrator.id,
        })
        .eq(
          "id",
          partnershipId,
        )
        .select("*")
        .maybeSingle();

    if (error) {
      console.error(
        "[Woolton Partnerships] Archive failed:",
        error,
      );

      return jsonResponse(
        {
          ok: false,
          error:
            "The partnership record could not be archived.",
        },
        500,
      );
    }

    if (!data) {
      return jsonResponse(
        {
          ok: false,
          error:
            "The partnership record could not be found.",
        },
        404,
      );
    }

    return jsonResponse(
      {
        ok: true,
        partnership:
          data,
        message:
          "Partnership record archived.",
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
      "[Woolton Partnerships] DELETE failed:",
      error,
    );

    return jsonResponse(
      {
        ok: false,
        error:
          "The partnership record could not be archived.",
      },
      500,
    );
  }
}