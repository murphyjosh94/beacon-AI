import "server-only";

import { Resend } from "resend";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";

import { database } from "@/lib/database/Database";

import {
  account,
  session,
  user,
  verification,
} from "@/lib/database/schema";

function readRequiredEnvironmentVariable(
  name:
    | "BETTER_AUTH_SECRET"
    | "BETTER_AUTH_URL"
    | "BEACON_RESEND_API_KEY"
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is not configured.`
    );
  }

  return value;
}

const baseURL =
  readRequiredEnvironmentVariable(
    "BETTER_AUTH_URL"
  );

const secret =
  readRequiredEnvironmentVariable(
    "BETTER_AUTH_SECRET"
  );

const resendApiKey =
  readRequiredEnvironmentVariable(
    "BEACON_RESEND_API_KEY"
  );

const resend =
  new Resend(resendApiKey);

const emailFrom =
  "Beacon AI <no-reply@beacon-ai.co.uk>";

function escapeHtml(
  value: string
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFirstName(
  name?: string | null
): string {
  const trimmed =
    name?.trim();

  if (!trimmed) {
    return "there";
  }

  return trimmed.split(/\s+/)[0];
}

function buildEmailLayout({
  title,
  preview,
  greeting,
  body,
  buttonLabel,
  buttonUrl,
  footerNote,
}: {
  title: string;
  preview: string;
  greeting: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  footerNote: string;
}): string {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <meta
      name="color-scheme"
      content="dark light"
    />
    <title>${escapeHtml(title)}</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#06121D;
      font-family:Arial,Helvetica,sans-serif;
      color:#FFFFFF;
    "
  >
    <div
      style="
        display:none;
        max-height:0;
        overflow:hidden;
        opacity:0;
      "
    >
      ${escapeHtml(preview)}
    </div>

    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width:100%;
        background:#06121D;
        margin:0;
        padding:0;
      "
    >
      <tr>
        <td
          align="center"
          style="padding:32px 16px;"
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width:100%;
              max-width:620px;
              background:#0A1B2B;
              border:1px solid rgba(212,175,55,0.28);
              border-radius:24px;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  padding:28px 32px;
                  background:#08131F;
                  border-bottom:1px solid rgba(212,175,55,0.22);
                  text-align:center;
                "
              >
                <div
                  style="
                    display:inline-block;
                    margin-bottom:12px;
                    padding:7px 12px;
                    border:1px solid rgba(212,175,55,0.35);
                    border-radius:999px;
                    color:#D4AF37;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:2px;
                    text-transform:uppercase;
                  "
                >
                  Beacon AI
                </div>

                <h1
                  style="
                    margin:0;
                    color:#FFFFFF;
                    font-size:28px;
                    line-height:1.25;
                    font-weight:800;
                  "
                >
                  ${escapeHtml(title)}
                </h1>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:34px 32px;
                  color:#CBD5E1;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                <p
                  style="
                    margin:0 0 18px;
                    color:#FFFFFF;
                    font-size:17px;
                    font-weight:700;
                  "
                >
                  ${escapeHtml(greeting)}
                </p>

                <p
                  style="
                    margin:0 0 26px;
                    color:#CBD5E1;
                  "
                >
                  ${escapeHtml(body)}
                </p>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="margin:0 auto 28px;"
                >
                  <tr>
                    <td
                      align="center"
                      bgcolor="#D4AF37"
                      style="
                        border-radius:999px;
                      "
                    >
                      <a
                        href="${escapeHtml(buttonUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                          display:inline-block;
                          padding:14px 24px;
                          color:#06121D;
                          background:#D4AF37;
                          border-radius:999px;
                          font-size:15px;
                          font-weight:800;
                          text-decoration:none;
                        "
                      >
                        ${escapeHtml(buttonLabel)}
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin:0 0 10px;
                    color:#94A3B8;
                    font-size:13px;
                  "
                >
                  If the button does not work, copy and paste this link into your browser:
                </p>

                <p
                  style="
                    margin:0;
                    padding:14px;
                    background:#06121D;
                    border-radius:12px;
                    color:#D4AF37;
                    font-size:12px;
                    line-height:1.5;
                    overflow-wrap:anywhere;
                    word-break:break-word;
                  "
                >
                  ${escapeHtml(buttonUrl)}
                </p>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:24px 32px;
                  background:#08131F;
                  border-top:1px solid rgba(255,255,255,0.08);
                  color:#64748B;
                  font-size:12px;
                  line-height:1.6;
                  text-align:center;
                "
              >
                <p style="margin:0 0 8px;">
                  ${escapeHtml(footerNote)}
                </p>

                <p style="margin:0;">
                  Beacon AI · beacon-ai.co.uk
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

function buildVerificationEmail({
  name,
  url,
}: {
  name?: string | null;
  url: string;
}) {
  const firstName =
    getFirstName(name);

  return {
    subject:
      "Verify your Beacon AI account",

    text: [
      `Hi ${firstName},`,
      "",
      "Thanks for creating your Beacon AI account.",
      "",
      "Please verify your email address using the link below:",
      url,
      "",
      "This verification link expires in 1 hour.",
      "",
      "If you did not create a Beacon AI account, you can safely ignore this email.",
      "",
      "Beacon AI",
      "beacon-ai.co.uk",
    ].join("\n"),

    html: buildEmailLayout({
      title:
        "Verify your email address",

      preview:
        "Complete your Beacon AI account by verifying your email address.",

      greeting:
        `Hi ${firstName},`,

      body:
        "Thanks for creating your Beacon AI account. Please confirm that this email address belongs to you before signing in.",

      buttonLabel:
        "Verify Email",

      buttonUrl:
        url,

      footerNote:
        "This verification link expires in 1 hour. If you did not create a Beacon AI account, you can safely ignore this email.",
    }),
  };
}

function buildPasswordResetEmail({
  name,
  url,
}: {
  name?: string | null;
  url: string;
}) {
  const firstName =
    getFirstName(name);

  return {
    subject:
      "Reset your Beacon AI password",

    text: [
      `Hi ${firstName},`,
      "",
      "We received a request to reset the password for your Beacon AI account.",
      "",
      "Use the link below to choose a new password:",
      url,
      "",
      "This password reset link expires in 1 hour.",
      "",
      "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.",
      "",
      "Beacon AI",
      "beacon-ai.co.uk",
    ].join("\n"),

    html: buildEmailLayout({
      title:
        "Reset your password",

      preview:
        "Reset the password for your Beacon AI account.",

      greeting:
        `Hi ${firstName},`,

      body:
        "We received a request to reset your Beacon AI password. Use the secure link below to choose a new password.",

      buttonLabel:
        "Reset Password",

      buttonUrl:
        url,

      footerNote:
        "This password reset link expires in 1 hour. If you did not request this, you can safely ignore this email and your password will remain unchanged.",
    }),
  };
}

async function sendBeaconEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const {
    error,
  } =
    await resend.emails.send({
      from:
        emailFrom,

      to: [
        to,
      ],

      subject,

      html,

      text,
    });

  if (error) {
    console.error(
      "[Beacon Auth Email] Failed to send email:",
      {
        to,
        subject,
        error,
      }
    );

    throw new Error(
      "Failed to send authentication email."
    );
  }
}

export const auth =
  betterAuth({
    appName:
      "Beacon AI",

    baseURL,

    basePath:
      "/api/auth",

    secret,

    database:
      drizzleAdapter(
        database,
        {
          provider:
            "pg",

          schema: {
            user,
            session,
            account,
            verification,
          },
        }
      ),

    user: {
      additionalFields: {
        role: {
          type:
            "string",

          required:
            true,

          defaultValue:
            "user",

          input:
            false,
        },
      },
    },

    emailVerification: {
      sendVerificationEmail:
        async ({
          user:
            authUser,

          url,
        }) => {
          const email =
            buildVerificationEmail({
              name:
                authUser.name,

              url,
            });

          await sendBeaconEmail({
            to:
              authUser.email,

            subject:
              email.subject,

            html:
              email.html,

            text:
              email.text,
          });
        },

      sendOnSignUp:
        true,

      sendOnSignIn:
        true,

      autoSignInAfterVerification:
        true,

      expiresIn:
        60 * 60,
    },

    emailAndPassword: {
      enabled:
        true,

      minPasswordLength:
        8,

      maxPasswordLength:
        128,

      requireEmailVerification:
        true,

      autoSignIn:
        false,

      sendResetPassword:
        async ({
          user:
            authUser,

          url,
        }) => {
          const email =
            buildPasswordResetEmail({
              name:
                authUser.name,

              url,
            });

          await sendBeaconEmail({
            to:
              authUser.email,

            subject:
              email.subject,

            html:
              email.html,

            text:
              email.text,
          });
        },

      resetPasswordTokenExpiresIn:
        60 * 60,

      revokeSessionsOnPasswordReset:
        true,
    },

    session: {
      expiresIn:
        60 * 60 * 24 * 30,

      updateAge:
        60 * 60 * 24,

      cookieCache: {
        enabled:
          false,
      },
    },

    trustedOrigins: [
      "https://beacon-ai.co.uk",
      "https://www.beacon-ai.co.uk",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],

    advanced: {
      cookiePrefix:
        "beacon_ai",

      useSecureCookies:
        process.env.NODE_ENV ===
        "production",
    },

    plugins: [
      nextCookies(),
    ],
  });

export type BeaconAuth =
  typeof auth;