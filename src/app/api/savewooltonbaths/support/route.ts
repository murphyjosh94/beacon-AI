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


const RESEND_API_URL = "https://api.resend.com/emails";
const SUPPORT_EMAIL_FROM =
  "Save Woolton Baths <savewooltonbaths@beacon-ai.co.uk>";
const SUPPORT_EMAIL_REPLY_TO = "savewooltonbaths@gmail.com";
const CAMPAIGN_URL = "https://beacon-ai.co.uk/savewooltonbaths";
const CAMPAIGN_LOGO_URL =
  "https://beacon-ai.co.uk/savewooltonbaths/logo.png";

const SUPPORT_TYPE_LABELS: Record<SupportType, string> = {
  general: "General campaign support",
  volunteer: "Volunteering",
  trade: "Trade, profession or specialist skill",
  materials: "Materials support",
  equipment: "Equipment support",
  sponsorship: "Sponsorship",
  funding: "Funding opportunity",
  education: "Education partnership",
  professional: "Professional expertise",
  other: "Other support",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

async function sendSupportAcknowledgement(input: {
  name: string;
  email: string;
  supportType: SupportType;
  registrationId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error(
      "[Save Woolton Baths Support] RESEND_API_KEY is not configured. Registration succeeded but acknowledgement email was not sent.",
      { registrationId: input.registrationId },
    );
    return;
  }

  const firstName = escapeHtml(getFirstName(input.name));
  const supportLabel = escapeHtml(SUPPORT_TYPE_LABELS[input.supportType]);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Thank you for supporting Save Woolton Baths</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#172033;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td align="center" style="background:#071b33;padding:30px 24px 24px;">
<img src="${CAMPAIGN_LOGO_URL}" width="110" alt="Save Woolton Baths" style="display:block;width:110px;max-width:110px;height:auto;border:0;margin:0 auto 14px;" />
<div style="font-size:13px;line-height:18px;letter-spacing:2px;text-transform:uppercase;color:#d5b15a;font-weight:700;">Save Woolton Baths</div>
</td></tr>
<tr><td style="padding:36px 34px 12px;">
<h1 style="margin:0 0 18px;font-size:28px;line-height:36px;color:#071b33;">Thank you for standing with Woolton Baths</h1>
<p style="margin:0 0 18px;font-size:16px;line-height:26px;">Hi ${firstName},</p>
<p style="margin:0 0 18px;font-size:16px;line-height:26px;">Thank you for registering your support for the Save Woolton Baths campaign.</p>
<p style="margin:0 0 24px;font-size:16px;line-height:26px;">Your support has been safely recorded and will help us demonstrate the community backing behind our work to secure, restore and reopen Woolton Baths for future generations.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;background:#f8f6ef;border-left:4px solid #d5b15a;border-radius:8px;">
<tr><td style="padding:18px 20px;">
<div style="font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:1.2px;color:#6b7280;font-weight:700;margin-bottom:5px;">Your registration</div>
<div style="font-size:16px;line-height:24px;color:#071b33;font-weight:700;">${supportLabel}</div>
</td></tr></table>
<p style="margin:0 0 26px;font-size:16px;line-height:26px;">Where you have offered skills, professional expertise, materials, equipment or practical assistance, the campaign team may contact you as the project develops.</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 30px;"><tr><td align="center" bgcolor="#071b33" style="border-radius:8px;">
<a href="${CAMPAIGN_URL}" style="display:inline-block;padding:14px 24px;font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;">View the campaign</a>
</td></tr></table>
<p style="margin:0 0 8px;font-size:16px;line-height:25px;color:#071b33;font-weight:700;">Thank you for supporting Save Woolton Baths.</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Community-led restoration. Heritage protected. Built for the future.</p>
</td></tr>
<tr><td style="padding:24px 34px 30px;"><div style="border-top:1px solid #e5e7eb;padding-top:20px;font-size:12px;line-height:19px;color:#6b7280;text-align:center;">
This email confirms the support registration you submitted to Save Woolton Baths. If you need to contact the campaign, simply reply to this email.
</div></td></tr>
</table></td></tr></table>
</body></html>`;

  const text = `Hi ${getFirstName(input.name)},

Thank you for registering your support for the Save Woolton Baths campaign.

Your support has been safely recorded and will help us demonstrate the community backing behind our work to secure, restore and reopen Woolton Baths for future generations.

Your registration: ${SUPPORT_TYPE_LABELS[input.supportType]}

Where you have offered skills, professional expertise, materials, equipment or practical assistance, the campaign team may contact you as the project develops.

View the campaign: ${CAMPAIGN_URL}

Thank you for supporting Save Woolton Baths.

Community-led restoration. Heritage protected. Built for the future.

This email confirms the support registration you submitted to Save Woolton Baths.`;

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SUPPORT_EMAIL_FROM,
        to: [input.email],
        reply_to: SUPPORT_EMAIL_REPLY_TO,
        subject: "Thank you for supporting Save Woolton Baths",
        html,
        text,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("[Save Woolton Baths Support] Acknowledgement email failed:", {
        registrationId: input.registrationId,
        status: response.status,
        response: responseText.slice(0, 1000),
      });
      return;
    }

    const result = (await response.json()) as { id?: string };

    console.info("[Save Woolton Baths Support] Acknowledgement email sent", {
      registrationId: input.registrationId,
      resendEmailId: result.id ?? null,
    });
  } catch (error) {
    console.error(
      "[Save Woolton Baths Support] Acknowledgement email request failed:",
      { registrationId: input.registrationId, error },
    );
  }
}


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

    await sendSupportAcknowledgement({
      name,
      email,
      supportType,
      registrationId: String(data.id),
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