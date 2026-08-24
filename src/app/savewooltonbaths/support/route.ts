import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupportType =
  | "general"
  | "volunteer"
  | "trade"
  | "materials"
  | "equipment"
  | "sponsorship"
  | "funding"
  | "education"
  | "professional"
  | "other";

type SupportSubmission = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  organisation?: unknown;
  postcode?: unknown;
  supportType?: unknown;
  tradeProfession?: unknown;
  materialDetails?: unknown;
  equipmentDetails?: unknown;
  sponsorshipDetails?: unknown;
  fundingDetails?: unknown;
  educationDetails?: unknown;
  professionalDetails?: unknown;
  message?: unknown;
  permissionToContact?: unknown;
  publicSupport?: unknown;
  website?: unknown;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const SUPPORT_TYPES = new Set<SupportType>([
  "general",
  "volunteer",
  "trade",
  "materials",
  "equipment",
  "sponsorship",
  "funding",
  "education",
  "professional",
  "other",
]);

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;

const rateLimitStore = new Map<string, RateLimitRecord>();

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  const current = rateLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  current.count += 1;
  rateLimitStore.set(ip, current);

  return false;
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function cleanSingleLine(value: unknown, maxLength: number): string {
  return cleanText(value, maxLength)
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseEmail(value: unknown): string {
  return cleanSingleLine(value, 254).toLowerCase();
}

function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalisePhone(value: unknown): string {
  const phone = cleanSingleLine(value, 40);

  if (!phone) {
    return "";
  }

  return phone.replace(/[^\d+()\-\s]/g, "").slice(0, 40);
}

function normalisePostcode(value: unknown): string {
  return cleanSingleLine(value, 16).toUpperCase();
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function getSupportType(value: unknown): SupportType | null {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim() as SupportType;

  return SUPPORT_TYPES.has(candidate) ? candidate : null;
}

function emptyToNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    if (isRateLimited(ip)) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Too many submissions have been received from this connection. Please wait a few minutes and try again.",
        },
        429,
      );
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid request format.",
        },
        415,
      );
    }

    let body: SupportSubmission;

    try {
      body = (await request.json()) as SupportSubmission;
    } catch {
      return jsonResponse(
        {
          ok: false,
          error: "The submitted form data could not be read.",
        },
        400,
      );
    }

    /*
     * Honeypot field.
     *
     * The support page can send `website: ""`.
     * Real users will never see or populate it.
     * Basic automated bots commonly fill every available field.
     */
    const honeypot = cleanSingleLine(body.website, 200);

    if (honeypot) {
      /*
       * Return success rather than advertising that the spam trap fired.
       * Nothing is written to the database.
       */
      return jsonResponse(
        {
          ok: true,
          message: "Thank you for supporting Save Woolton Baths.",
        },
        200,
      );
    }

    const name = cleanSingleLine(body.name, 120);
    const email = normaliseEmail(body.email);
    const phone = normalisePhone(body.phone);
    const organisation = cleanSingleLine(body.organisation, 180);
    const postcode = normalisePostcode(body.postcode);
    const supportType = getSupportType(body.supportType);

    const tradeProfession = cleanSingleLine(body.tradeProfession, 180);
    const materialDetails = cleanText(body.materialDetails, 4000);
    const equipmentDetails = cleanText(body.equipmentDetails, 4000);
    const sponsorshipDetails = cleanText(body.sponsorshipDetails, 4000);
    const fundingDetails = cleanText(body.fundingDetails, 4000);
    const educationDetails = cleanText(body.educationDetails, 4000);
    const professionalDetails = cleanText(body.professionalDetails, 4000);
    const message = cleanText(body.message, 5000);

    const permissionToContact = body.permissionToContact;
    const publicSupport = body.publicSupport;

    if (!name) {
      return jsonResponse(
        {
          ok: false,
          error: "Please enter your name.",
        },
        400,
      );
    }

    if (name.length < 2) {
      return jsonResponse(
        {
          ok: false,
          error: "Please enter a valid name.",
        },
        400,
      );
    }

    if (!email) {
      return jsonResponse(
        {
          ok: false,
          error: "Please enter your email address.",
        },
        400,
      );
    }

    if (!isValidEmail(email)) {
      return jsonResponse(
        {
          ok: false,
          error: "Please enter a valid email address.",
        },
        400,
      );
    }

    if (!supportType) {
      return jsonResponse(
        {
          ok: false,
          error: "Please select how you would like to support the campaign.",
        },
        400,
      );
    }

    if (!isBoolean(permissionToContact) || !permissionToContact) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Please confirm that the project team may contact you regarding your registration.",
        },
        400,
      );
    }

    if (!isBoolean(publicSupport)) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid public supporter preference.",
        },
        400,
      );
    }

    if (supportType === "trade" && !tradeProfession) {
      return jsonResponse(
        {
          ok: false,
          error: "Please tell us your trade, profession or specialist skill.",
        },
        400,
      );
    }

    if (supportType === "materials" && !materialDetails) {
      return jsonResponse(
        {
          ok: false,
          error: "Please tell us what materials you may be able to provide.",
        },
        400,
      );
    }

    if (supportType === "equipment" && !equipmentDetails) {
      return jsonResponse(
        {
          ok: false,
          error: "Please tell us what equipment may be available.",
        },
        400,
      );
    }

    if (supportType === "sponsorship" && !sponsorshipDetails) {
      return jsonResponse(
        {
          ok: false,
          error: "Please tell us about your sponsorship interest.",
        },
        400,
      );
    }

    if (supportType === "funding" && !fundingDetails) {
      return jsonResponse(
        {
          ok: false,
          error: "Please provide some information about the funding opportunity.",
        },
        400,
      );
    }

    if (supportType === "education" && !educationDetails) {
      return jsonResponse(
        {
          ok: false,
          error: "Please tell us about the educational partnership.",
        },
        400,
      );
    }

    if (supportType === "professional" && !professionalDetails) {
      return jsonResponse(
        {
          ok: false,
          error: "Please tell us about your area of professional expertise.",
        },
        400,
      );
    }

    const userAgent = cleanSingleLine(
      request.headers.get("user-agent"),
      500,
    );

    const referer = cleanSingleLine(
      request.headers.get("referer"),
      1000,
    );

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("save_woolton_baths_support")
      .insert({
        name,
        email,
        phone: emptyToNull(phone),
        organisation: emptyToNull(organisation),
        postcode: emptyToNull(postcode),

        support_type: supportType,

        trade_profession: emptyToNull(tradeProfession),
        material_details: emptyToNull(materialDetails),
        equipment_details: emptyToNull(equipmentDetails),
        sponsorship_details: emptyToNull(sponsorshipDetails),
        funding_details: emptyToNull(fundingDetails),
        education_details: emptyToNull(educationDetails),
        professional_details: emptyToNull(professionalDetails),

        message: emptyToNull(message),

        permission_to_contact: permissionToContact,
        public_support: publicSupport,

        status: "new",

        source: "savewooltonbaths_support_page",

        user_agent: emptyToNull(userAgent),
        referer: emptyToNull(referer),

        /*
         * We deliberately do not store the visitor's raw IP address.
         * It is only used transiently above for basic request throttling.
         */
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error(
        "[Save Woolton Baths Support] Database insert failed:",
        error,
      );

      return jsonResponse(
        {
          ok: false,
          error:
            "We could not register your support right now. Please try again shortly.",
        },
        500,
      );
    }

    console.info("[Save Woolton Baths Support] Registration created", {
      id: data.id,
      supportType,
      createdAt: data.created_at,
    });

    return jsonResponse(
      {
        ok: true,
        id: data.id,
        message:
          "Thank you. Your support for Save Woolton Baths has been registered.",
      },
      201,
    );
  } catch (error) {
    console.error(
      "[Save Woolton Baths Support] Unexpected API error:",
      error,
    );

    return jsonResponse(
      {
        ok: false,
        error:
          "Something went wrong while registering your support. Please try again.",
      },
      500,
    );
  }
}

export async function GET() {
  return jsonResponse(
    {
      ok: false,
      error: "Method not allowed.",
    },
    405,
  );
}