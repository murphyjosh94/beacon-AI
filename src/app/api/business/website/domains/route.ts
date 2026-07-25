import "server-only";

import { randomBytes } from "node:crypto";
import { resolve4, resolveCname, resolveTxt } from "node:dns/promises";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/Auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DomainType = "custom" | "temporary";
type VerificationStatus =
  | "pending"
  | "verifying"
  | "verified"
  | "failed"
  | "disconnected";
type SslStatus =
  | "pending"
  | "provisioning"
  | "active"
  | "failed"
  | "not_applicable";
type RecordType = "CNAME" | "A" | "TXT";

type PublishedWebsiteRow = {
  id: string;
  owner_id: string;
  business_name: string;
  display_name: string;
  domain: string;
  status: string;
  website_version: number;
};

type DomainRow = {
  id: string;
  owner_id: string;
  published_website_id: string;
  domain: string;
  domain_type: DomainType;
  is_primary: boolean;
  verification_status: VerificationStatus;
  ssl_status: SslStatus;
  required_record_type: RecordType;
  required_record_name: string;
  required_record_value: string;
  verification_token: string;
  verification_attempts: number;
  last_verification_error: string | null;
  last_verified_at: string | null;
  connected_at: string | null;
  disconnected_at: string | null;
  created_at: string;
  updated_at: string;
};

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

type AuthenticatedSession = {
  user: SessionUser;
};

type CreateDomainBody = {
  action?: "create";
  websiteId?: string;
  domain?: string;
  domainType?: DomainType;
  makePrimary?: boolean;
};

type UpdateDomainBody = {
  action:
    | "verify"
    | "make_primary"
    | "disconnect"
    | "reconnect"
    | "refresh_ssl";
  domainId?: string;
};

type DeleteDomainBody = {
  domainId?: string;
};

type DnsVerificationResult = {
  verified: boolean;
  message: string;
  discoveredValues: string[];
};

const DOMAIN_SELECT = [
  "id",
  "owner_id",
  "published_website_id",
  "domain",
  "domain_type",
  "is_primary",
  "verification_status",
  "ssl_status",
  "required_record_type",
  "required_record_name",
  "required_record_value",
  "verification_token",
  "verification_attempts",
  "last_verification_error",
  "last_verified_at",
  "connected_at",
  "disconnected_at",
  "created_at",
  "updated_at",
].join(", ");


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = record[key];

  if (typeof value !== "string") {
    throw new Error(`Domain database response is missing "${key}".`);
  }

  return value;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`Domain database response has an invalid "${key}".`);
  }

  return value;
}

function readBoolean(
  record: Record<string, unknown>,
  key: string,
): boolean {
  const value = record[key];

  if (typeof value !== "boolean") {
    throw new Error(`Domain database response has an invalid "${key}".`);
  }

  return value;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Domain database response has an invalid "${key}".`);
  }

  return value;
}

function isDomainType(value: string): value is DomainType {
  return value === "custom" || value === "temporary";
}

function isVerificationStatus(
  value: string,
): value is VerificationStatus {
  return (
    value === "pending" ||
    value === "verifying" ||
    value === "verified" ||
    value === "failed" ||
    value === "disconnected"
  );
}

function isSslStatus(value: string): value is SslStatus {
  return (
    value === "pending" ||
    value === "provisioning" ||
    value === "active" ||
    value === "failed" ||
    value === "not_applicable"
  );
}

function isRecordType(value: string): value is RecordType {
  return value === "CNAME" || value === "A" || value === "TXT";
}

function parsePublishedWebsiteRow(
  value: unknown,
): PublishedWebsiteRow {
  if (!isRecord(value)) {
    throw new Error("Website database response is invalid.");
  }

  return {
    id: readString(value, "id"),
    owner_id: readString(value, "owner_id"),
    business_name: readString(value, "business_name"),
    display_name: readString(value, "display_name"),
    domain: readString(value, "domain"),
    status: readString(value, "status"),
    website_version: readNumber(value, "website_version"),
  };
}

function parseDomainRow(value: unknown): DomainRow {
  if (!isRecord(value)) {
    throw new Error("Domain database response is invalid.");
  }

  const domainType = readString(value, "domain_type");
  const verificationStatus = readString(
    value,
    "verification_status",
  );
  const sslStatus = readString(value, "ssl_status");
  const requiredRecordType = readString(
    value,
    "required_record_type",
  );

  if (!isDomainType(domainType)) {
    throw new Error("Domain database response has an invalid domain type.");
  }

  if (!isVerificationStatus(verificationStatus)) {
    throw new Error(
      "Domain database response has an invalid verification status.",
    );
  }

  if (!isSslStatus(sslStatus)) {
    throw new Error("Domain database response has an invalid SSL status.");
  }

  if (!isRecordType(requiredRecordType)) {
    throw new Error(
      "Domain database response has an invalid DNS record type.",
    );
  }

  return {
    id: readString(value, "id"),
    owner_id: readString(value, "owner_id"),
    published_website_id: readString(
      value,
      "published_website_id",
    ),
    domain: readString(value, "domain"),
    domain_type: domainType,
    is_primary: readBoolean(value, "is_primary"),
    verification_status: verificationStatus,
    ssl_status: sslStatus,
    required_record_type: requiredRecordType,
    required_record_name: readString(
      value,
      "required_record_name",
    ),
    required_record_value: readString(
      value,
      "required_record_value",
    ),
    verification_token: readString(
      value,
      "verification_token",
    ),
    verification_attempts: readNumber(
      value,
      "verification_attempts",
    ),
    last_verification_error: readNullableString(
      value,
      "last_verification_error",
    ),
    last_verified_at: readNullableString(
      value,
      "last_verified_at",
    ),
    connected_at: readNullableString(value, "connected_at"),
    disconnected_at: readNullableString(
      value,
      "disconnected_at",
    ),
    created_at: readString(value, "created_at"),
    updated_at: readString(value, "updated_at"),
  };
}

function parseDomainRows(value: unknown): DomainRow[] {
  if (!Array.isArray(value)) {
    throw new Error("Domain list database response is invalid.");
  }

  return value.map(parseDomainRow);
}

function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      ...(details === undefined ? {} : { details }),
    },
    { status },
  );
}

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status },
  );
}

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
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
        "X-Client-Info": "beacon-business-domain-management",
      },
    },
  });
}

async function getAuthenticatedSession(
  request: NextRequest,
): Promise<AuthenticatedSession | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return null;
  }

  return {
    user: {
      id: String(session.user.id),
      email:
        typeof session.user.email === "string"
          ? session.user.email
          : null,
      name:
        typeof session.user.name === "string"
          ? session.user.name
          : null,
    },
  };
}

function normaliseDomain(input: string) {
  let value = input.trim().toLowerCase();

  value = value
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");

  return value;
}

function isValidDomain(domain: string) {
  if (domain.length < 4 || domain.length > 253) {
    return false;
  }

  if (
    domain === "localhost" ||
    domain.endsWith(".localhost") ||
    domain.endsWith(".local") ||
    domain.endsWith(".test")
  ) {
    return false;
  }

  const labels = domain.split(".");

  if (labels.length < 2) {
    return false;
  }

  return labels.every((label) => {
    if (label.length < 1 || label.length > 63) {
      return false;
    }

    return (
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label) &&
      !label.includes("--")
    );
  });
}

function isReservedPlatformDomain(domain: string) {
  const reserved = new Set([
    "beacon-ai.co.uk",
    "www.beacon-ai.co.uk",
    "beaconbusiness.site",
    "www.beaconbusiness.site",
  ]);

  const configured = (process.env.BEACON_PLATFORM_HOSTS ?? "")
    .split(",")
    .map((item) => normaliseDomain(item))
    .filter(Boolean);

  for (const item of configured) {
    reserved.add(item);
  }

  return reserved.has(domain);
}

function getTemporaryDomainSuffix() {
  return (
    process.env.BEACON_TEMPORARY_DOMAIN_SUFFIX?.trim().toLowerCase() ||
    "beaconbusiness.site"
  );
}

function getDnsTarget() {
  const configured =
    process.env.BEACON_CUSTOM_DOMAIN_CNAME_TARGET?.trim().toLowerCase();

  if (configured) {
    return configured.replace(/\.$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim().toLowerCase();

  if (vercelUrl) {
    return vercelUrl.replace(/^https?:\/\//, "").replace(/\.$/, "");
  }

  return "cname.vercel-dns.com";
}

function getRequiredDnsRecord(domain: string): {
  type: RecordType;
  name: string;
  value: string;
} {
  const labels = domain.split(".");
  const isApex = labels.length === 2;

  if (isApex) {
    return {
      type: "A",
      name: "@",
      value:
        process.env.BEACON_CUSTOM_DOMAIN_APEX_IP?.trim() ||
        "76.76.21.21",
    };
  }

  return {
    type: "CNAME",
    name: labels[0] ?? "www",
    value: getDnsTarget(),
  };
}

function slugifyTemporaryDomain(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return slug || `business-${randomBytes(4).toString("hex")}`;
}

async function createUniqueTemporaryDomain(
  supabase: SupabaseClient,
  displayName: string,
) {
  const suffix = getTemporaryDomainSuffix();
  const base = slugifyTemporaryDomain(displayName);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate =
      attempt === 0
        ? `${base}.${suffix}`
        : `${base}-${attempt + 1}.${suffix}`;

    const { data, error } = await supabase
      .from("business_website_domains")
      .select("id")
      .eq("domain", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to check temporary domain availability: ${error.message}`,
      );
    }

    if (!data) {
      return candidate;
    }
  }

  return `${base}-${randomBytes(4).toString("hex")}.${suffix}`;
}

async function getOwnedWebsite(
  supabase: SupabaseClient,
  websiteId: string,
  ownerId: string,
): Promise<PublishedWebsiteRow | null> {
  const { data, error } = await supabase
    .from("business_published_websites")
    .select(
      "id, owner_id, business_name, display_name, domain, status, website_version",
    )
    .eq("id", websiteId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load website: ${error.message}`);
  }

  return data ? parsePublishedWebsiteRow(data) : null;
}

async function getOwnedDomain(
  supabase: SupabaseClient,
  domainId: string,
  ownerId: string,
): Promise<DomainRow | null> {
  const { data, error } = await supabase
    .from("business_website_domains")
    .select(DOMAIN_SELECT)
    .eq("id", domainId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load domain: ${error.message}`);
  }

  return data ? parseDomainRow(data) : null;
}

async function writeHistory(
  supabase: SupabaseClient,
  input: {
    domain: DomainRow;
    action:
      | "created"
      | "verification_started"
      | "verification_passed"
      | "verification_failed"
      | "made_primary"
      | "ssl_updated"
      | "disconnected"
      | "reconnected"
      | "deleted";
    performedBy: string;
    previousState?: Record<string, unknown> | null;
    newState?: Record<string, unknown> | null;
  },
) {
  const { error } = await supabase
    .from("business_website_domain_history")
    .insert({
      domain_id: input.domain.id,
      owner_id: input.domain.owner_id,
      published_website_id: input.domain.published_website_id,
      domain: input.domain.domain,
      action: input.action,
      previous_state: input.previousState ?? null,
      new_state: input.newState ?? null,
      performed_by: input.performedBy,
    });

  if (error) {
    throw new Error(`Unable to write domain history: ${error.message}`);
  }
}

function serialiseDomain(domain: DomainRow) {
  return {
    id: domain.id,
    websiteId: domain.published_website_id,
    domain: domain.domain,
    domainType: domain.domain_type,
    isPrimary: domain.is_primary,
    verificationStatus: domain.verification_status,
    sslStatus: domain.ssl_status,
    dnsRecord: {
      type: domain.required_record_type,
      name: domain.required_record_name,
      value: domain.required_record_value,
    },
    verificationAttempts: domain.verification_attempts,
    lastVerificationError: domain.last_verification_error,
    lastVerifiedAt: domain.last_verified_at,
    connectedAt: domain.connected_at,
    disconnectedAt: domain.disconnected_at,
    createdAt: domain.created_at,
    updatedAt: domain.updated_at,
  };
}

async function verifyDnsRecord(
  domain: DomainRow,
): Promise<DnsVerificationResult> {
  try {
    if (domain.required_record_type === "CNAME") {
      const values = (await resolveCname(domain.domain)).map((value) =>
        value.toLowerCase().replace(/\.$/, ""),
      );

      const expected = domain.required_record_value
        .toLowerCase()
        .replace(/\.$/, "");

      const verified = values.includes(expected);

      return {
        verified,
        discoveredValues: values,
        message: verified
          ? "The required CNAME record was found."
          : `The CNAME record does not point to ${expected}.`,
      };
    }

    if (domain.required_record_type === "A") {
      const values = await resolve4(domain.domain);
      const expected = domain.required_record_value.trim();
      const verified = values.includes(expected);

      return {
        verified,
        discoveredValues: values,
        message: verified
          ? "The required A record was found."
          : `The A record does not point to ${expected}.`,
      };
    }

    const txtGroups = await resolveTxt(domain.domain);
    const values = txtGroups.map((group) => group.join(""));
    const expected = domain.required_record_value.trim();
    const verified = values.includes(expected);

    return {
      verified,
      discoveredValues: values,
      message: verified
        ? "The required TXT record was found."
        : "The required TXT verification value was not found.",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "DNS lookup failed for an unknown reason.";

    return {
      verified: false,
      discoveredValues: [],
      message,
    };
  }
}

async function syncPublishedWebsitePrimaryDomain(
  supabase: SupabaseClient,
  domain: DomainRow,
) {
  const { error } = await supabase
    .from("business_published_websites")
    .update({
      domain: domain.domain,
      temporary_domain: domain.domain_type === "temporary",
      updated_at: new Date().toISOString(),
    })
    .eq("id", domain.published_website_id)
    .eq("owner_id", domain.owner_id);

  if (error) {
    throw new Error(
      `Unable to update the website primary domain: ${error.message}`,
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return jsonError("You must be signed in.", 401);
    }

    const websiteId =
      request.nextUrl.searchParams.get("websiteId")?.trim() ?? "";

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("business_website_domains")
      .select(DOMAIN_SELECT)
      .eq("owner_id", session.user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (websiteId) {
      const website = await getOwnedWebsite(
        supabase,
        websiteId,
        session.user.id,
      );

      if (!website) {
        return jsonError("Website not found.", 404);
      }

      query = query.eq("published_website_id", websiteId);
    }

    const { data, error } = await query;

    if (error) {
      return jsonError("Unable to load domains.", 500, error.message);
    }

    return jsonSuccess({
      domains: parseDomainRows(data ?? []).map(serialiseDomain),
      configuration: {
        temporaryDomainSuffix: getTemporaryDomainSuffix(),
        customDomainCnameTarget: getDnsTarget(),
        customDomainApexIp:
          process.env.BEACON_CUSTOM_DOMAIN_APEX_IP?.trim() ||
          "76.76.21.21",
      },
    });
  } catch (error) {
    console.error("Domain GET failed", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to load domains.",
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return jsonError("You must be signed in.", 401);
    }

    const body = (await request.json()) as CreateDomainBody;
    const websiteId = body.websiteId?.trim() ?? "";

    if (!websiteId) {
      return jsonError("websiteId is required.");
    }

    const supabase = getSupabaseAdmin();
    const website = await getOwnedWebsite(
      supabase,
      websiteId,
      session.user.id,
    );

    if (!website) {
      return jsonError("Website not found.", 404);
    }

    if (website.status !== "published") {
      return jsonError(
        "The website must be published before a domain can be connected.",
        409,
      );
    }

    const domainType: DomainType =
      body.domainType === "temporary" ? "temporary" : "custom";

    let domain: string;

    if (domainType === "temporary") {
      domain = await createUniqueTemporaryDomain(
        supabase,
        website.display_name || website.business_name,
      );
    } else {
      domain = normaliseDomain(body.domain ?? "");

      if (!domain) {
        return jsonError("Enter the custom domain you want to connect.");
      }

      if (!isValidDomain(domain)) {
        return jsonError(
          "Enter a valid domain without http://, https://, a path or a port.",
        );
      }

      if (isReservedPlatformDomain(domain)) {
        return jsonError(
          "That domain is reserved for the Beacon platform.",
          409,
        );
      }

      if (domain.endsWith(`.${getTemporaryDomainSuffix()}`)) {
        return jsonError(
          "Beacon temporary domains are allocated automatically.",
          409,
        );
      }
    }

    const { data: existing, error: existingError } = await supabase
      .from("business_website_domains")
      .select("id, owner_id, verification_status")
      .eq("domain", domain)
      .maybeSingle();

    if (existingError) {
      return jsonError(
        "Unable to check domain availability.",
        500,
        existingError.message,
      );
    }

    if (existing) {
      return jsonError(
        existing.owner_id === session.user.id
          ? "This domain has already been added to your account."
          : "This domain is already connected to another Beacon website.",
        409,
      );
    }

    const { count, error: countError } = await supabase
      .from("business_website_domains")
      .select("id", { count: "exact", head: true })
      .eq("published_website_id", websiteId)
      .neq("verification_status", "disconnected");

    if (countError) {
      return jsonError(
        "Unable to inspect existing domains.",
        500,
        countError.message,
      );
    }

    const dns =
      domainType === "temporary"
        ? {
            type: "CNAME" as const,
            name: domain.split(".")[0] ?? "@",
            value: getDnsTarget(),
          }
        : getRequiredDnsRecord(domain);

    const now = new Date().toISOString();
    const isTemporary = domainType === "temporary";
    const isPrimary = body.makePrimary === true || (count ?? 0) === 0;

    const insertPayload = {
      owner_id: session.user.id,
      published_website_id: websiteId,
      domain,
      domain_type: domainType,
      is_primary: isPrimary,
      verification_status: isTemporary ? "verified" : "pending",
      ssl_status: isTemporary ? "active" : "pending",
      required_record_type: dns.type,
      required_record_name: dns.name,
      required_record_value: dns.value,
      verification_attempts: 0,
      last_verification_error: null,
      last_verified_at: isTemporary ? now : null,
      connected_at: isTemporary ? now : null,
      disconnected_at: null,
    };

    const { data, error } = await supabase
      .from("business_website_domains")
      .insert(insertPayload)
      .select(DOMAIN_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonError(
          "This domain is already connected to a Beacon website.",
          409,
        );
      }

      return jsonError(
        "Unable to add the domain.",
        500,
        error.message,
      );
    }

    const created = parseDomainRow(data);

    await writeHistory(supabase, {
      domain: created,
      action: "created",
      performedBy: session.user.id,
      previousState: null,
      newState: {
        domain: created.domain,
        domainType: created.domain_type,
        isPrimary: created.is_primary,
        verificationStatus: created.verification_status,
        sslStatus: created.ssl_status,
      },
    });

    if (created.is_primary && created.verification_status === "verified") {
      await syncPublishedWebsitePrimaryDomain(supabase, created);
    }

    return jsonSuccess(
      {
        domain: serialiseDomain(created),
        nextStep:
          created.verification_status === "verified"
            ? "The domain is active."
            : "Add the displayed DNS record, then verify the domain.",
      },
      201,
    );
  } catch (error) {
    console.error("Domain POST failed", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to add the domain.",
      500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return jsonError("You must be signed in.", 401);
    }

    const body = (await request.json()) as UpdateDomainBody;
    const domainId = body.domainId?.trim() ?? "";

    if (!domainId) {
      return jsonError("domainId is required.");
    }

    if (
      ![
        "verify",
        "make_primary",
        "disconnect",
        "reconnect",
        "refresh_ssl",
      ].includes(body.action)
    ) {
      return jsonError("A valid domain action is required.");
    }

    const supabase = getSupabaseAdmin();
    const existing = await getOwnedDomain(
      supabase,
      domainId,
      session.user.id,
    );

    if (!existing) {
      return jsonError("Domain not found.", 404);
    }

    if (body.action === "verify") {
      if (existing.domain_type === "temporary") {
        return jsonSuccess({
          domain: serialiseDomain(existing),
          message: "Temporary Beacon domains are verified automatically.",
        });
      }

      if (existing.verification_status === "disconnected") {
        return jsonError(
          "Reconnect the domain before verifying it.",
          409,
        );
      }

      const startedAt = new Date().toISOString();

      const { data: verifyingData, error: verifyingError } =
        await supabase
          .from("business_website_domains")
          .update({
            verification_status: "verifying",
            verification_attempts:
              existing.verification_attempts + 1,
            last_verification_error: null,
            updated_at: startedAt,
          })
          .eq("id", existing.id)
          .eq("owner_id", session.user.id)
          .select(DOMAIN_SELECT)
          .single();

      if (verifyingError) {
        return jsonError(
          "Unable to start domain verification.",
          500,
          verifyingError.message,
        );
      }

      const verifyingDomain = parseDomainRow(verifyingData);

      await writeHistory(supabase, {
        domain: verifyingDomain,
        action: "verification_started",
        performedBy: session.user.id,
        previousState: {
          verificationStatus: existing.verification_status,
          verificationAttempts: existing.verification_attempts,
        },
        newState: {
          verificationStatus: "verifying",
          verificationAttempts:
            existing.verification_attempts + 1,
        },
      });

      const result = await verifyDnsRecord(verifyingDomain);
      const completedAt = new Date().toISOString();

      const nextStatus: VerificationStatus = result.verified
        ? "verified"
        : "failed";

      const nextSslStatus: SslStatus = result.verified
        ? "provisioning"
        : existing.ssl_status;

      const { data: verifiedData, error: verifiedError } =
        await supabase
          .from("business_website_domains")
          .update({
            verification_status: nextStatus,
            ssl_status: nextSslStatus,
            last_verification_error: result.verified
              ? null
              : result.message,
            last_verified_at: result.verified
              ? completedAt
              : existing.last_verified_at,
            connected_at: result.verified
              ? existing.connected_at ?? completedAt
              : existing.connected_at,
            disconnected_at: null,
            updated_at: completedAt,
          })
          .eq("id", existing.id)
          .eq("owner_id", session.user.id)
          .select(DOMAIN_SELECT)
          .single();

      if (verifiedError) {
        return jsonError(
          "DNS verification completed, but its result could not be saved.",
          500,
          verifiedError.message,
        );
      }

      const verifiedDomain = parseDomainRow(verifiedData);

      await writeHistory(supabase, {
        domain: verifiedDomain,
        action: result.verified
          ? "verification_passed"
          : "verification_failed",
        performedBy: session.user.id,
        previousState: {
          verificationStatus: "verifying",
        },
        newState: {
          verificationStatus: nextStatus,
          sslStatus: nextSslStatus,
          message: result.message,
          discoveredValues: result.discoveredValues,
        },
      });

      if (result.verified && verifiedDomain.is_primary) {
        await syncPublishedWebsitePrimaryDomain(
          supabase,
          verifiedDomain,
        );
      }

      return jsonSuccess({
        domain: serialiseDomain(verifiedDomain),
        verification: result,
      });
    }

    if (body.action === "make_primary") {
      if (existing.verification_status !== "verified") {
        return jsonError(
          "Only a verified domain can be made primary.",
          409,
        );
      }

      const previous = {
        isPrimary: existing.is_primary,
      };

      const { data, error } = await supabase
        .from("business_website_domains")
        .update({
          is_primary: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("owner_id", session.user.id)
        .select(DOMAIN_SELECT)
        .single();

      if (error) {
        return jsonError(
          "Unable to make the domain primary.",
          500,
          error.message,
        );
      }

      const updated = parseDomainRow(data);

      await syncPublishedWebsitePrimaryDomain(supabase, updated);

      await writeHistory(supabase, {
        domain: updated,
        action: "made_primary",
        performedBy: session.user.id,
        previousState: previous,
        newState: {
          isPrimary: true,
        },
      });

      return jsonSuccess({
        domain: serialiseDomain(updated),
        message: `${updated.domain} is now the primary domain.`,
      });
    }

    if (body.action === "disconnect") {
      if (existing.domain_type === "temporary") {
        return jsonError(
          "A temporary Beacon domain cannot be disconnected. Delete it instead.",
          409,
        );
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("business_website_domains")
        .update({
          is_primary: false,
          verification_status: "disconnected",
          ssl_status: "not_applicable",
          disconnected_at: now,
          updated_at: now,
        })
        .eq("id", existing.id)
        .eq("owner_id", session.user.id)
        .select(DOMAIN_SELECT)
        .single();

      if (error) {
        return jsonError(
          "Unable to disconnect the domain.",
          500,
          error.message,
        );
      }

      const updated = parseDomainRow(data);

      await writeHistory(supabase, {
        domain: updated,
        action: "disconnected",
        performedBy: session.user.id,
        previousState: {
          isPrimary: existing.is_primary,
          verificationStatus: existing.verification_status,
          sslStatus: existing.ssl_status,
        },
        newState: {
          isPrimary: false,
          verificationStatus: "disconnected",
          sslStatus: "not_applicable",
        },
      });

      return jsonSuccess({
        domain: serialiseDomain(updated),
        message: "The domain has been disconnected.",
      });
    }

    if (body.action === "reconnect") {
      if (existing.verification_status !== "disconnected") {
        return jsonError("This domain is not disconnected.", 409);
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("business_website_domains")
        .update({
          verification_status: "pending",
          ssl_status: "pending",
          last_verification_error: null,
          disconnected_at: null,
          updated_at: now,
        })
        .eq("id", existing.id)
        .eq("owner_id", session.user.id)
        .select(DOMAIN_SELECT)
        .single();

      if (error) {
        return jsonError(
          "Unable to reconnect the domain.",
          500,
          error.message,
        );
      }

      const updated = parseDomainRow(data);

      await writeHistory(supabase, {
        domain: updated,
        action: "reconnected",
        performedBy: session.user.id,
        previousState: {
          verificationStatus: existing.verification_status,
          sslStatus: existing.ssl_status,
        },
        newState: {
          verificationStatus: "pending",
          sslStatus: "pending",
        },
      });

      return jsonSuccess({
        domain: serialiseDomain(updated),
        message:
          "The domain has been reconnected. Verify its DNS record to activate it.",
      });
    }

    if (existing.verification_status !== "verified") {
      return jsonError(
        "SSL can only be refreshed for a verified domain.",
        409,
      );
    }

    const nextSslStatus: SslStatus =
      existing.domain_type === "temporary"
        ? "active"
        : "provisioning";

    const { data, error } = await supabase
      .from("business_website_domains")
      .update({
        ssl_status: nextSslStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("owner_id", session.user.id)
      .select(DOMAIN_SELECT)
      .single();

    if (error) {
      return jsonError(
        "Unable to refresh SSL status.",
        500,
        error.message,
      );
    }

    const updated = parseDomainRow(data);

    await writeHistory(supabase, {
      domain: updated,
      action: "ssl_updated",
      performedBy: session.user.id,
      previousState: {
        sslStatus: existing.ssl_status,
      },
      newState: {
        sslStatus: nextSslStatus,
      },
    });

    return jsonSuccess({
      domain: serialiseDomain(updated),
      message:
        nextSslStatus === "active"
          ? "SSL is active."
          : "SSL provisioning has been requested.",
    });
  } catch (error) {
    console.error("Domain PATCH failed", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to update the domain.",
      500,
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return jsonError("You must be signed in.", 401);
    }

    let body: DeleteDomainBody = {};

    try {
      body = (await request.json()) as DeleteDomainBody;
    } catch {
      body = {
        domainId:
          request.nextUrl.searchParams.get("domainId") ?? undefined,
      };
    }

    const domainId =
      body.domainId?.trim() ||
      request.nextUrl.searchParams.get("domainId")?.trim() ||
      "";

    if (!domainId) {
      return jsonError("domainId is required.");
    }

    const supabase = getSupabaseAdmin();
    const existing = await getOwnedDomain(
      supabase,
      domainId,
      session.user.id,
    );

    if (!existing) {
      return jsonError("Domain not found.", 404);
    }

    if (
      existing.is_primary &&
      existing.verification_status === "verified"
    ) {
      const { count, error: countError } = await supabase
        .from("business_website_domains")
        .select("id", { count: "exact", head: true })
        .eq(
          "published_website_id",
          existing.published_website_id,
        )
        .eq("owner_id", session.user.id)
        .eq("verification_status", "verified")
        .neq("id", existing.id);

      if (countError) {
        return jsonError(
          "Unable to inspect alternative domains.",
          500,
          countError.message,
        );
      }

      if ((count ?? 0) > 0) {
        return jsonError(
          "Make another verified domain primary before deleting this one.",
          409,
        );
      }
    }

    await writeHistory(supabase, {
      domain: existing,
      action: "deleted",
      performedBy: session.user.id,
      previousState: {
        domain: existing.domain,
        domainType: existing.domain_type,
        isPrimary: existing.is_primary,
        verificationStatus: existing.verification_status,
        sslStatus: existing.ssl_status,
      },
      newState: null,
    });

    const { error } = await supabase
      .from("business_website_domains")
      .delete()
      .eq("id", existing.id)
      .eq("owner_id", session.user.id);

    if (error) {
      return jsonError(
        "Unable to delete the domain.",
        500,
        error.message,
      );
    }

    return jsonSuccess({
      deletedDomainId: existing.id,
      domain: existing.domain,
      message: "The domain has been removed.",
    });
  } catch (error) {
    console.error("Domain DELETE failed", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to delete the domain.",
      500,
    );
  }
}