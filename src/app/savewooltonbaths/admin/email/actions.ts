"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

import { requireAdministratorAccount } from "@/lib/auth/AdminAccess";

const CAMPAIGN_EMAIL =
  "savewooltonbaths@beacon-ai.co.uk";

const CAMPAIGN_FROM =
  `Save Woolton Baths <${CAMPAIGN_EMAIL}>`;

const CAMPAIGN_ADMIN_PATH =
  "/savewooltonbaths/admin/email";

const MAX_RECIPIENT_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10000;

type AdministratorAccount = Awaited<
  ReturnType<typeof requireAdministratorAccount>
>;

type SupportMatch = {
  id: string;
  email: string;
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
  const supabaseUrl = cleanEnvironmentValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );

  const serviceRoleKey = cleanEnvironmentValue(
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

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid HTTP or HTTPS URL.",
    );
  }

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

function getResend() {
  const apiKey = cleanEnvironmentValue(
    process.env.RESEND_API_KEY,
    "RESEND_API_KEY",
  );

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured.",
    );
  }

  return new Resend(apiKey);
}

function readFormValue(
  formData: FormData,
  key: string,
  maxLength: number,
): string {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(
  value: string,
): boolean {
  if (
    !value ||
    value.length > MAX_RECIPIENT_LENGTH
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
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

function messageToHtml(
  message: string,
): string {
  return escapeHtml(message)
    .split(/\n{2,}/)
    .map((paragraph) => {
      const content = paragraph
        .replace(/\n/g, "<br />");

      return `
        <p style="margin:0 0 18px 0;font-size:16px;line-height:1.75;color:#263746;">
          ${content}
        </p>
      `;
    })
    .join("");
}

function buildCampaignEmailHtml(
  subject: string,
  message: string,
): string {
  const safeSubject = escapeHtml(subject);
  const messageHtml = messageToHtml(message);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeSubject}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f5;font-family:Arial,Helvetica,sans-serif;color:#102532;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#eef2f5;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe3e8;">
          <tr>
            <td align="center" style="background:#071522;padding:30px 24px 26px 24px;">
              <div style="font-size:13px;line-height:1.4;font-weight:800;letter-spacing:2.4px;text-transform:uppercase;color:#d4af37;">
                Save Woolton Baths
              </div>
              <div style="margin-top:9px;font-size:25px;line-height:1.25;font-weight:800;color:#ffffff;">
                Protect. Preserve. Reopen.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:34px 28px 18px 28px;">
              ${messageHtml}
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 34px 28px;">
              <div style="height:1px;background:#e5e9ec;margin:4px 0 22px 0;"></div>

              <p style="margin:0;font-size:15px;line-height:1.7;font-weight:700;color:#102532;">
                Save Woolton Baths
              </p>

              <p style="margin:4px 0 0 0;font-size:14px;line-height:1.7;color:#5d6b76;">
                Community campaign to protect, preserve and reopen Woolton Baths.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="background:#102532;padding:22px 24px;">
              <p style="margin:0;font-size:12px;line-height:1.7;color:#cbd5dc;">
                Sent by Save Woolton Baths
              </p>

              <p style="margin:4px 0 0 0;font-size:12px;line-height:1.7;">
                <a href="mailto:${CAMPAIGN_EMAIL}" style="color:#e6c75a;text-decoration:none;">
                  ${CAMPAIGN_EMAIL}
                </a>
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

function buildCampaignEmailText(
  message: string,
): string {
  return `${message}

Save Woolton Baths
Protect. Preserve. Reopen.

${CAMPAIGN_EMAIL}`;
}

function redirectWithError(
  errorCode: string,
): never {
  redirect(
    `${CAMPAIGN_ADMIN_PATH}?error=${encodeURIComponent(
      errorCode,
    )}`,
  );
}

function getAdministratorId(
  adminAccount: AdministratorAccount,
): string | null {
  if (
    "id" in adminAccount &&
    typeof adminAccount.id === "string"
  ) {
    return adminAccount.id;
  }

  return null;
}

function getAdministratorName(
  adminAccount: AdministratorAccount,
): string | null {
  if (
    "name" in adminAccount &&
    typeof adminAccount.name === "string"
  ) {
    const name = adminAccount.name.trim();

    return name || null;
  }

  return null;
}

async function findSupportRegistration(
  recipientEmail: string,
): Promise<SupportMatch | null> {
  const supabase = getSupabaseAdmin();

  const {
    data,
    error,
  } = await supabase
    .from("save_woolton_baths_support")
    .select("id,email")
    .ilike("email", recipientEmail)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "[Save Woolton Baths Campaign Email] Supporter lookup failed:",
      error,
    );

    return null;
  }

  return data as SupportMatch | null;
}

async function findPartnershipRegistrationId(
  recipientEmail: string,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  /*
   * Partnerships are checked separately because they are not guaranteed to
   * share the support-registry schema. If the current partnerships table
   * contains an email column and a support registration link, this lookup
   * can be expanded without changing the campaign-email UI.
   *
   * For now, standalone partnership/non-site contacts are deliberately
   * recorded with registration_id = null.
   */
  void recipientEmail;
  void supabase;

  return null;
}

async function recordCorrespondence({
  registrationId,
  recipientEmail,
  subject,
  message,
  deliveryStatus,
  resendEmailId,
  adminAccount,
}: {
  registrationId: string | null;
  recipientEmail: string;
  subject: string;
  message: string;
  deliveryStatus: "sent" | "failed";
  resendEmailId: string | null;
  adminAccount: AdministratorAccount;
}) {
  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();

  const {
    error,
  } = await supabase
    .from(
      "save_woolton_baths_support_correspondence",
    )
    .insert({
      registration_id: registrationId,
      direction: "outbound",
      channel: "email",
      recipient_email: recipientEmail,
      sender_email: CAMPAIGN_EMAIL,
      subject,
      message,
      delivery_status: deliveryStatus,
      resend_email_id: resendEmailId,
      sent_by: getAdministratorId(
        adminAccount,
      ),
      sent_by_name: getAdministratorName(
        adminAccount,
      ),
      sent_at: now,
      created_at: now,
    });

  if (error) {
    console.error(
      "[Save Woolton Baths Campaign Email] Failed to record correspondence:",
      error,
    );

    return false;
  }

  return true;
}

export async function sendWooltonCampaignEmail(
  formData: FormData,
): Promise<void> {
  const adminAccount =
    await requireAdministratorAccount();

  const recipientEmail = readFormValue(
    formData,
    "to",
    MAX_RECIPIENT_LENGTH,
  ).toLowerCase();

  const subject = readFormValue(
    formData,
    "subject",
    MAX_SUBJECT_LENGTH,
  );

  const message = readFormValue(
    formData,
    "message",
    MAX_MESSAGE_LENGTH,
  );

  if (!isValidEmail(recipientEmail)) {
    redirectWithError(
      "invalid-recipient",
    );
  }

  if (!subject) {
    redirectWithError(
      "missing-subject",
    );
  }

  if (!message) {
    redirectWithError(
      "missing-message",
    );
  }

  const supporterMatch =
    await findSupportRegistration(
      recipientEmail,
    );

  const partnershipRegistrationId =
    supporterMatch
      ? null
      : await findPartnershipRegistrationId(
          recipientEmail,
        );

  const registrationId =
    supporterMatch?.id ??
    partnershipRegistrationId ??
    null;

  const resend = getResend();

  let resendEmailId: string | null = null;

  try {
    const {
      data,
      error,
    } = await resend.emails.send({
      from: CAMPAIGN_FROM,
      to: recipientEmail,
      subject,
      html: buildCampaignEmailHtml(
        subject,
        message,
      ),
      text: buildCampaignEmailText(
        message,
      ),
      replyTo: CAMPAIGN_EMAIL,
    });

    if (error) {
      console.error(
        "[Save Woolton Baths Campaign Email] Resend rejected email:",
        error,
      );

      await recordCorrespondence({
        registrationId,
        recipientEmail,
        subject,
        message,
        deliveryStatus: "failed",
        resendEmailId: null,
        adminAccount,
      });

      redirectWithError(
        "send-failed",
      );
    }

    resendEmailId =
      data?.id ??
      null;
  } catch (error) {
    console.error(
      "[Save Woolton Baths Campaign Email] Email send failed:",
      error,
    );

    await recordCorrespondence({
      registrationId,
      recipientEmail,
      subject,
      message,
      deliveryStatus: "failed",
      resendEmailId: null,
      adminAccount,
    });

    redirectWithError(
      "send-failed",
    );
  }

  const recorded =
    await recordCorrespondence({
      registrationId,
      recipientEmail,
      subject,
      message,
      deliveryStatus: "sent",
      resendEmailId,
      adminAccount,
    });

  if (!recorded) {
    redirectWithError(
      "record-failed",
    );
  }

  redirect(
    `${CAMPAIGN_ADMIN_PATH}?sent=1`,
  );
}
