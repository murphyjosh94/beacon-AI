"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

import { requireAdministratorAccount } from "@/lib/auth/AdminAccess";

const CAMPAIGN_EMAIL =
  "savewooltonbaths@futureofwoolton.org.uk";

const CAMPAIGN_FROM =
  `Save Woolton Baths <${CAMPAIGN_EMAIL}>`;

const CAMPAIGN_ADMIN_PATH =
  "/savewooltonbaths/admin/email";

const MAX_RECIPIENT_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_CC_RECIPIENTS = 10;
const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const MASS_UPDATE_SUBJECT =
  "Save Woolton Baths Update — Introducing Future of Woolton";

const MASS_UPDATE_MESSAGE = `Hello,

We wanted to share an important update about the future of the Save Woolton Baths campaign.

Save Woolton Baths is now being organised through Future of Woolton, a new community-focused organisation being established to support the long-term future of Woolton Baths and wider community projects across Woolton and the surrounding area.

Save Woolton Baths remains our flagship campaign.

The purpose of the campaign has not changed. We remain focused on protecting, preserving and working towards the reopening of Woolton Baths for community benefit.

Future of Woolton gives us a stronger structure for the next stage of the campaign, including governance, partnership working, fundraising, professional support and the long-term management of community projects.

You may also notice that our campaign email address has changed.

Our new Save Woolton Baths email is:

savewooltonbaths@futureofwoolton.org.uk

General Future of Woolton enquiries can be sent to:

support@futureofwoolton.org.uk

Thank you for continuing to support Save Woolton Baths and for being part of the campaign.

We will continue to share updates as discussions, surveys, professional work and the next stages of the project progress.

Save Woolton Baths
Protect. Preserve. Reopen.

Organised by Future of Woolton
futureofwoolton.org.uk`;

type AdministratorAccount = Awaited<
  ReturnType<typeof requireAdministratorAccount>
>;

type SupportMatch = {
  id: string;
  email: string;
};

type CampaignSupporter = {
  id: string;
  name: string;
  email: string;
  permission_to_contact: boolean;
  status: string;
};

type ExistingCorrespondence = {
  recipient_email: string;
  subject: string;
  delivery_status: string;
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
    process.env.FOW_RESEND_API_KEY,
    "FOW_RESEND_API_KEY",
  );

  if (!apiKey) {
    throw new Error(
      "FOW_RESEND_API_KEY is not configured.",
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

function readCcRecipients(
  formData: FormData,
): string[] {
  const raw = readFormValue(
    formData,
    "cc",
    MAX_RECIPIENT_LENGTH * MAX_CC_RECIPIENTS,
  );

  if (!raw) {
    return [];
  }

  return [
    ...new Set(
      raw
        .split(/[,\n;]/)
        .map(
          (value) =>
            value.trim().toLowerCase(),
        )
        .filter(Boolean),
    ),
  ];
}

type CampaignAttachment = {
  filename: string;
  content: Buffer;
};

async function readAttachments(
  formData: FormData,
): Promise<CampaignAttachment[]> {
  const files = formData
    .getAll("attachments")
    .filter(
      (value): value is File =>
        typeof File !== "undefined" &&
        value instanceof File &&
        value.size > 0,
    );

  if (files.length > MAX_ATTACHMENTS) {
    redirectWithError(
      "too-many-attachments",
    );
  }

  let totalBytes = 0;

  const attachments: CampaignAttachment[] = [];

  for (const file of files) {
    if (
      file.size >
      MAX_ATTACHMENT_BYTES
    ) {
      redirectWithError(
        "attachment-too-large",
      );
    }

    totalBytes += file.size;

    if (
      totalBytes >
      MAX_TOTAL_ATTACHMENT_BYTES
    ) {
      redirectWithError(
        "attachments-too-large",
      );
    }

    attachments.push({
      filename:
        file.name
          .trim()
          .slice(0, 240) ||
        "attachment",

      content:
        Buffer.from(
          await file.arrayBuffer(),
        ),
    });
  }

  return attachments;
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
    .map(
      (paragraph) => {
        const content =
          paragraph.replace(
            /\n/g,
            "<br />",
          );

        return `
          <p style="margin:0 0 18px 0;font-size:16px;line-height:1.75;color:#263746;">
            ${content}
          </p>
        `;
      },
    )
    .join("");
}

function buildCampaignEmailHtml(
  subject: string,
  message: string,
): string {
  const safeSubject =
    escapeHtml(subject);

  const messageHtml =
    messageToHtml(message);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeSubject}</title>
</head>

<body style="margin:0;padding:0;background:#eef2f5;font-family:Arial,Helvetica,sans-serif;color:#102532;">
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="width:100%;background:#eef2f5;margin:0;padding:0;"
  >
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="width:100%;max-width:680px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe3e8;"
        >
          <tr>
            <td
              align="center"
              style="background:#071522;padding:30px 24px 26px 24px;"
            >
              <div
                style="font-size:13px;line-height:1.4;font-weight:800;letter-spacing:2.4px;text-transform:uppercase;color:#d4af37;"
              >
                Save Woolton Baths
              </div>

              <div
                style="margin-top:9px;font-size:25px;line-height:1.25;font-weight:800;color:#ffffff;"
              >
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
              <div
                style="height:1px;background:#e5e9ec;margin:4px 0 22px 0;"
              ></div>

              <p
                style="margin:0;font-size:15px;line-height:1.7;font-weight:700;color:#102532;"
              >
                Save Woolton Baths
              </p>

              <p
                style="margin:4px 0 0 0;font-size:14px;line-height:1.7;color:#5d6b76;"
              >
                A Future of Woolton campaign to protect,
                preserve and reopen Woolton Baths.
              </p>
            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="background:#102532;padding:22px 24px;"
            >
              <p
                style="margin:0;font-size:12px;line-height:1.7;color:#cbd5dc;"
              >
                Save Woolton Baths · Organised by Future of Woolton
              </p>

              <p
                style="margin:4px 0 0 0;font-size:12px;line-height:1.7;"
              >
                <a
                  href="mailto:${CAMPAIGN_EMAIL}"
                  style="color:#e6c75a;text-decoration:none;"
                >
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

A Future of Woolton campaign.

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
    const name =
      adminAccount.name.trim();

    return name || null;
  }

  return null;
}

async function findSupportRegistration(
  recipientEmail: string,
): Promise<SupportMatch | null> {
  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "save_woolton_baths_support",
      )
      .select(
        "id,email",
      )
      .ilike(
        "email",
        recipientEmail,
      )
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
  const supabase =
    getSupabaseAdmin();

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
  deliveryStatus:
    | "sent"
    | "failed";
  resendEmailId: string | null;
  adminAccount: AdministratorAccount;
}) {
  const supabase =
    getSupabaseAdmin();

  const now =
    new Date().toISOString();

  const {
    error,
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
          CAMPAIGN_EMAIL,

        subject,

        message,

        delivery_status:
          deliveryStatus,

        resend_email_id:
          resendEmailId,

        sent_by:
          getAdministratorId(
            adminAccount,
          ),

        sent_by_name:
          getAdministratorName(
            adminAccount,
          ),

        sent_at:
          now,

        created_at:
          now,
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

async function getEligibleCampaignSupporters(): Promise<
  CampaignSupporter[]
> {
  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "save_woolton_baths_support",
      )
      .select(
        "id,name,email,permission_to_contact,status",
      );

  if (error) {
    throw new Error(
      `Unable to load campaign supporters: ${error.message}`,
    );
  }

  const rows =
    (
      data ??
      []
    ) as unknown as CampaignSupporter[];

  const eligible =
    rows.filter(
      (supporter) => {
        if (
          supporter.permission_to_contact !==
          true
        ) {
          return false;
        }

        if (
          !isValidEmail(
            supporter.email
              .trim()
              .toLowerCase(),
          )
        ) {
          return false;
        }

        const status =
          supporter.status
            .trim()
            .toLowerCase();

        if (
          status === "archived" ||
          status === "declined"
        ) {
          return false;
        }

        return true;
      },
    );

  const uniqueByEmail =
    new Map<
      string,
      CampaignSupporter
    >();

  for (
    const supporter of eligible
  ) {
    const email =
      supporter.email
        .trim()
        .toLowerCase();

    if (
      !uniqueByEmail.has(
        email,
      )
    ) {
      uniqueByEmail.set(
        email,
        {
          ...supporter,
          email,
        },
      );
    }
  }

  return Array.from(
    uniqueByEmail.values(),
  );
}

async function getAlreadySentMassUpdateEmails(): Promise<
  Set<string>
> {
  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "save_woolton_baths_support_correspondence",
      )
      .select(
        "recipient_email,subject,delivery_status",
      )
      .eq(
        "subject",
        MASS_UPDATE_SUBJECT,
      );

  if (error) {
    throw new Error(
      `Unable to check previous campaign update emails: ${error.message}`,
    );
  }

  const rows =
    (
      data ??
      []
    ) as unknown as ExistingCorrespondence[];

  return new Set(
    rows
      .filter(
        (record) => {
          const status =
            record.delivery_status
              .trim()
              .toLowerCase();

          return (
            status === "sent" ||
            status === "delivered"
          );
        },
      )
      .map(
        (record) =>
          record.recipient_email
            .trim()
            .toLowerCase(),
      ),
  );
}

export async function sendWooltonCampaignEmail(
  formData: FormData,
): Promise<void> {
  const adminAccount =
    await requireAdministratorAccount();

  const recipientEmail =
    readFormValue(
      formData,
      "to",
      MAX_RECIPIENT_LENGTH,
    ).toLowerCase();

  const subject =
    readFormValue(
      formData,
      "subject",
      MAX_SUBJECT_LENGTH,
    );

  const message =
    readFormValue(
      formData,
      "message",
      MAX_MESSAGE_LENGTH,
    );

  const ccRecipients =
    readCcRecipients(
      formData,
    );

  const attachments =
    await readAttachments(
      formData,
    );

  if (
    !isValidEmail(
      recipientEmail,
    )
  ) {
    redirectWithError(
      "invalid-recipient",
    );
  }

  if (
    ccRecipients.length >
      MAX_CC_RECIPIENTS ||
    ccRecipients.some(
      (email) =>
        !isValidEmail(
          email,
        ),
    )
  ) {
    redirectWithError(
      "invalid-cc",
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

  const resend =
    getResend();

  let resendEmailId:
    | string
    | null = null;

  try {
    const {
      data,
      error,
    } =
      await resend.emails.send({
        from:
          CAMPAIGN_FROM,

        to:
          recipientEmail,

        ...(ccRecipients.length >
        0
          ? {
              cc:
                ccRecipients,
            }
          : {}),

        subject,

        html:
          buildCampaignEmailHtml(
            subject,
            message,
          ),

        text:
          buildCampaignEmailText(
            message,
          ),

        replyTo:
          CAMPAIGN_EMAIL,

        ...(attachments.length >
        0
          ? {
              attachments,
            }
          : {}),
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

        deliveryStatus:
          "failed",

        resendEmailId:
          null,

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

      deliveryStatus:
        "failed",

      resendEmailId:
        null,

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

      deliveryStatus:
        "sent",

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

export async function sendFutureOfWooltonCampaignUpdate(): Promise<void> {
  const adminAccount =
    await requireAdministratorAccount();

  const supporters =
    await getEligibleCampaignSupporters();

  if (
    supporters.length === 0
  ) {
    redirect(
      `${CAMPAIGN_ADMIN_PATH}?mass-update=none`,
    );
  }

  const alreadySent =
    await getAlreadySentMassUpdateEmails();

  const recipients =
    supporters.filter(
      (supporter) =>
        !alreadySent.has(
          supporter.email,
        ),
    );

  if (
    recipients.length === 0
  ) {
    redirect(
      `${CAMPAIGN_ADMIN_PATH}?mass-update=already-sent`,
    );
  }

  const resend =
    getResend();

  let sentCount = 0;
  let failedCount = 0;

  for (
    const supporter of recipients
  ) {
    let resendEmailId:
      | string
      | null = null;

    try {
      const {
        data,
        error,
      } =
        await resend.emails.send({
          from:
            CAMPAIGN_FROM,

          to:
            supporter.email,

          subject:
            MASS_UPDATE_SUBJECT,

          html:
            buildCampaignEmailHtml(
              MASS_UPDATE_SUBJECT,
              MASS_UPDATE_MESSAGE,
            ),

          text:
            buildCampaignEmailText(
              MASS_UPDATE_MESSAGE,
            ),

          replyTo:
            CAMPAIGN_EMAIL,
        });

      if (error) {
        console.error(
          `[Save Woolton Baths Mass Update] Resend rejected email for ${supporter.email}:`,
          error,
        );

        failedCount += 1;

        await recordCorrespondence({
          registrationId:
            supporter.id,

          recipientEmail:
            supporter.email,

          subject:
            MASS_UPDATE_SUBJECT,

          message:
            MASS_UPDATE_MESSAGE,

          deliveryStatus:
            "failed",

          resendEmailId:
            null,

          adminAccount,
        });

        continue;
      }

      resendEmailId =
        data?.id ??
        null;

      const recorded =
        await recordCorrespondence({
          registrationId:
            supporter.id,

          recipientEmail:
            supporter.email,

          subject:
            MASS_UPDATE_SUBJECT,

          message:
            MASS_UPDATE_MESSAGE,

          deliveryStatus:
            "sent",

          resendEmailId,

          adminAccount,
        });

      if (!recorded) {
        failedCount += 1;

        continue;
      }

      sentCount += 1;
    } catch (error) {
      console.error(
        `[Save Woolton Baths Mass Update] Email send failed for ${supporter.email}:`,
        error,
      );

      failedCount += 1;

      await recordCorrespondence({
        registrationId:
          supporter.id,

        recipientEmail:
          supporter.email,

        subject:
          MASS_UPDATE_SUBJECT,

        message:
          MASS_UPDATE_MESSAGE,

        deliveryStatus:
          "failed",

        resendEmailId:
          null,

        adminAccount,
      });
    }
  }

  redirect(
    `${CAMPAIGN_ADMIN_PATH}?mass-update=complete&sent=${sentCount}&failed=${failedCount}&eligible=${recipients.length}`,
  );
}