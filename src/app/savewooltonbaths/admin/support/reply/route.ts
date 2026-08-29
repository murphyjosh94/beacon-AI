import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import {
  getAccessErrorStatus,
  requireAdministratorAccount,
} from "@/lib/auth/AdminAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_API_URL = "https://api.resend.com/emails";

const SUPPORT_EMAIL_FROM =
  "Save Woolton Baths <savewooltonbaths@beacon-ai.co.uk>";

const SUPPORT_EMAIL_REPLY_TO =
  "savewooltonbaths@gmail.com";

const SUPPORT_EMAIL_ADDRESS =
  "savewooltonbaths@beacon-ai.co.uk";

const CAMPAIGN_URL =
  "https://beacon-ai.co.uk/savewooltonbaths";

const CAMPAIGN_LOGO_URL =
  "https://beacon-ai.co.uk/savewooltonbaths/logo.png";

const MAX_SUBJECT_LENGTH = 180;
const MAX_MESSAGE_LENGTH = 10000;

type ReplyRequestBody = {
  registrationId?: unknown;
  subject?: unknown;
  message?: unknown;
};

type SupporterRow = {
  id: string;
  name: string;
  email: string;
  permission_to_contact: boolean;
};

type ResendResponse = {
  id?: string;
};

function cleanEnvironmentValue(
  value: string | undefined,
  variableName?: string,
): string {
  let cleaned = (value ?? "").trim();

  cleaned = cleaned
    .replace(/^["']+|["']+$/g, "")
    .trim();

  if (variableName) {
    const prefix = `${variableName}=`;

    if (
      cleaned
        .toLowerCase()
        .startsWith(prefix.toLowerCase())
    ) {
      cleaned = cleaned
        .slice(prefix.length)
        .trim()
        .replace(/^["']+|["']+$/g, "")
        .trim();
    }
  }

  return cleaned;
}

function getSupabaseAdmin() {
  const supabaseUrl =
    cleanEnvironmentValue(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    );

  const serviceRoleKey =
    cleanEnvironmentValue(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
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

  return createClient(
    supabaseUrl,
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
  status: number,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function cleanSingleLine(
  value: unknown,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanMessage(
  value: unknown,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function isUuid(
  value: string,
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function escapeHtml(
  value: string,
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function textToHtml(
  value: string,
): string {
  return escapeHtml(value)
    .replace(/\n/g, "<br />");
}

function getFirstName(
  name: string,
): string {
  return (
    name
      .trim()
      .split(/\s+/)[0] ||
    name
  );
}

function buildEmailHtml(input: {
  supporterName: string;
  message: string;
}) {
  const firstName =
    escapeHtml(
      getFirstName(
        input.supporterName,
      ),
    );

  const messageHtml =
    textToHtml(
      input.message,
    );

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Save Woolton Baths</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td align="center" style="background:#071b33;padding:28px 24px 22px;">
              <img src="cid:save-woolton-baths-logo" width="100" alt="Save Woolton Baths" style="display:block;width:100px;max-width:100px;height:auto;border:0;margin:0 auto 12px;" />
              <div style="font-size:13px;line-height:18px;letter-spacing:2px;text-transform:uppercase;color:#d5b15a;font-weight:700;">Save Woolton Baths</div>
            </td>
          </tr>

          <tr>
            <td style="padding:34px 34px 28px;">
              <p style="margin:0 0 18px;font-size:16px;line-height:26px;">Hi ${firstName},</p>

              <div style="font-size:16px;line-height:27px;color:#273244;">
                ${messageHtml}
              </div>

              <div style="margin-top:30px;padding-top:22px;border-top:1px solid #e5e7eb;">
                <p style="margin:0 0 5px;font-size:15px;line-height:24px;font-weight:700;color:#071b33;">Save Woolton Baths</p>
                <p style="margin:0;font-size:13px;line-height:21px;color:#6b7280;">Community-led restoration. Heritage protected. Built for the future.</p>
              </div>

              <p style="margin:24px 0 0;font-size:13px;line-height:21px;color:#6b7280;">
                <a href="${CAMPAIGN_URL}" style="color:#8d7425;font-weight:700;text-decoration:none;">Visit the Save Woolton Baths campaign</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailText(input: {
  supporterName: string;
  message: string;
}) {
  const firstName =
    getFirstName(
      input.supporterName,
    );

  return `Hi ${firstName},

${input.message}

Save Woolton Baths
Community-led restoration. Heritage protected. Built for the future.

${CAMPAIGN_URL}`;
}

async function readJsonBody(
  request: NextRequest,
): Promise<ReplyRequestBody | null> {
  const contentType =
    request.headers
      .get("content-type")
      ?.toLowerCase() ?? "";

  if (
    !contentType.includes(
      "application/json",
    )
  ) {
    return null;
  }

  try {
    const body =
      await request.json();

    if (!isRecord(body)) {
      return null;
    }

    return body as ReplyRequestBody;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const adminAccount =
      await requireAdministratorAccount();

    const body =
      await readJsonBody(
        request,
      );

    if (!body) {
      return jsonResponse(
        {
          ok: false,
          error:
            "The reply request could not be read.",
        },
        400,
      );
    }

    const registrationId =
      cleanSingleLine(
        body.registrationId,
        80,
      );

    const subject =
      cleanSingleLine(
        body.subject,
        MAX_SUBJECT_LENGTH,
      );

    const message =
      cleanMessage(
        body.message,
      );

    if (
      !registrationId ||
      !isUuid(registrationId)
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "A valid supporter registration is required.",
        },
        400,
      );
    }

    if (!subject) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Please enter an email subject.",
        },
        400,
      );
    }

    if (!message) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Please enter a message.",
        },
        400,
      );
    }

    const supabase =
      getSupabaseAdmin();

    const {
      data: supporterData,
      error: supporterError,
    } =
      await supabase
        .from(
          "save_woolton_baths_support",
        )
        .select(
          `
            id,
            name,
            email,
            permission_to_contact
          `,
        )
        .eq(
          "id",
          registrationId,
        )
        .maybeSingle();

    if (supporterError) {
      console.error(
        "[Save Woolton Baths Admin Reply] Failed to load supporter:",
        supporterError,
      );

      return jsonResponse(
        {
          ok: false,
          error:
            "The supporter record could not be loaded.",
        },
        500,
      );
    }

    if (!supporterData) {
      return jsonResponse(
        {
          ok: false,
          error:
            "The supporter registration was not found.",
        },
        404,
      );
    }

    const supporter =
      supporterData as SupporterRow;

    const recipientEmail =
      cleanSingleLine(
        supporter.email,
        254,
      ).toLowerCase();

    if (!recipientEmail) {
      return jsonResponse(
        {
          ok: false,
          error:
            "This supporter does not have an email address.",
        },
        400,
      );
    }

    if (
      !supporter.permission_to_contact
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "This supporter has not given permission to be contacted. Email sending has been blocked.",
        },
        403,
      );
    }

    const apiKey =
      cleanEnvironmentValue(
        process.env.RESEND_API_KEY,
        "RESEND_API_KEY",
      );

    if (!apiKey) {
      return jsonResponse(
        {
          ok: false,
          error:
            "RESEND_API_KEY is not configured.",
        },
        500,
      );
    }

    const html =
      buildEmailHtml({
        supporterName:
          supporter.name,
        message,
      });

    const text =
      buildEmailText({
        supporterName:
          supporter.name,
        message,
      });

    let resendResponse:
      Response;

    try {
      resendResponse =
        await fetch(
          RESEND_API_URL,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${apiKey}`,
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                from:
                  SUPPORT_EMAIL_FROM,
                to: [
                  recipientEmail,
                ],
                reply_to:
                  SUPPORT_EMAIL_REPLY_TO,
                subject,
                html,
                text,
                attachments: [
                  {
                    path:
                      CAMPAIGN_LOGO_URL,
                    filename:
                      "save-woolton-baths-logo.png",
                    content_id:
                      "save-woolton-baths-logo",
                  },
                ],
              }),
          },
        );
    } catch (error) {
      console.error(
        "[Save Woolton Baths Admin Reply] Resend request failed:",
        {
          registrationId,
          error,
        },
      );

      await supabase
        .from(
          "save_woolton_baths_support_correspondence",
        )
        .insert({
          registration_id:
            registrationId,
          direction:
            "outbound",
          channel:
            "email",
          recipient_email:
            recipientEmail,
          sender_email:
            SUPPORT_EMAIL_ADDRESS,
          subject,
          message,
          delivery_status:
            "failed",
          resend_email_id:
            null,
          sent_by:
            adminAccount.id,
          sent_by_name:
            adminAccount.name,
          sent_at:
            new Date()
              .toISOString(),
        });

      return jsonResponse(
        {
          ok: false,
          error:
            "The email service could not be reached. The failed attempt has been recorded.",
        },
        502,
      );
    }

    if (!resendResponse.ok) {
      const responseText =
        await resendResponse
          .text();

      console.error(
        "[Save Woolton Baths Admin Reply] Resend rejected the email:",
        {
          registrationId,
          status:
            resendResponse.status,
          response:
            responseText.slice(
              0,
              1000,
            ),
        },
      );

      const {
        error: failedLogError,
      } =
        await supabase
          .from(
            "save_woolton_baths_support_correspondence",
          )
          .insert({
            registration_id:
              registrationId,
            direction:
              "outbound",
            channel:
              "email",
            recipient_email:
              recipientEmail,
            sender_email:
              SUPPORT_EMAIL_ADDRESS,
            subject,
            message,
            delivery_status:
              "failed",
            resend_email_id:
              null,
            sent_by:
              adminAccount.id,
            sent_by_name:
              adminAccount.name,
            sent_at:
              new Date()
                .toISOString(),
          });

      if (failedLogError) {
        console.error(
          "[Save Woolton Baths Admin Reply] Failed to record rejected email:",
          failedLogError,
        );
      }

      return jsonResponse(
        {
          ok: false,
          error:
            "The email provider rejected the message. The failed attempt has been recorded.",
        },
        502,
      );
    }

    let resendResult:
      ResendResponse = {};

    try {
      resendResult =
        (await resendResponse.json()) as ResendResponse;
    } catch {
      resendResult = {};
    }

    const sentAt =
      new Date()
        .toISOString();

    const {
      data: correspondenceData,
      error: correspondenceError,
    } =
      await supabase
        .from(
          "save_woolton_baths_support_correspondence",
        )
        .insert({
          registration_id:
            registrationId,
          direction:
            "outbound",
          channel:
            "email",
          recipient_email:
            recipientEmail,
          sender_email:
            SUPPORT_EMAIL_ADDRESS,
          subject,
          message,
          delivery_status:
            "sent",
          resend_email_id:
            resendResult.id ??
            null,
          sent_by:
            adminAccount.id,
          sent_by_name:
            adminAccount.name,
          sent_at:
            sentAt,
        })
        .select(
          `
            id,
            subject,
            message,
            delivery_status,
            resend_email_id,
            sent_by_name,
            sent_at
          `,
        )
        .single();

    if (correspondenceError) {
      console.error(
        "[Save Woolton Baths Admin Reply] Email sent but correspondence history failed:",
        {
          registrationId,
          resendEmailId:
            resendResult.id ??
            null,
          error:
            correspondenceError,
        },
      );

      return jsonResponse(
        {
          ok: true,
          warning:
            "The email was sent successfully, but its correspondence history could not be saved.",
          resendEmailId:
            resendResult.id ??
            null,
        },
        200,
      );
    }

    const {
      error: supportUpdateError,
    } =
      await supabase
        .from(
          "save_woolton_baths_support",
        )
        .update({
          contacted_at:
            sentAt,
          updated_at:
            sentAt,
        })
        .eq(
          "id",
          registrationId,
        );

    if (supportUpdateError) {
      console.error(
        "[Save Woolton Baths Admin Reply] Email sent but supporter contacted timestamp could not be updated:",
        {
          registrationId,
          error:
            supportUpdateError,
        },
      );
    }

    return jsonResponse(
      {
        ok: true,
        message:
          `Email sent to ${supporter.name}.`,
        correspondence:
          correspondenceData,
      },
      200,
    );
  } catch (error) {
    const accessStatus =
      getAccessErrorStatus(
        error,
      );

    if (accessStatus) {
      return jsonResponse(
        {
          ok: false,
          error:
            accessStatus === 401
              ? "Please sign in to continue."
              : "Administrator access is required.",
        },
        accessStatus,
      );
    }

    console.error(
      "[Save Woolton Baths Admin Reply] Unexpected error:",
      error,
    );

    return jsonResponse(
      {
        ok: false,
        error:
          "The supporter email could not be sent.",
      },
      500,
    );
  }
}
