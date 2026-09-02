import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Mail,
  MailCheck,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";

import { requireAdministratorAccount } from "@/lib/auth/AdminAccess";

import { sendWooltonCampaignEmail } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  sent?: string | string[];
  error?: string | string[];
};

type AdminEmailPageProps = {
  searchParams?: Promise<SearchParams>;
};

type CampaignCorrespondence = {
  id: string;
  registration_id: string | null;
  recipient_email: string;
  sender_email: string;
  subject: string;
  message: string;
  delivery_status: "sent" | "failed";
  resend_email_id: string | null;
  sent_by: string | null;
  sent_by_name: string | null;
  sent_at: string;
  created_at: string;
};

function cleanEnvironmentValue(
  value: string | undefined,
  variableName?: string,
): string {
  let cleaned = (value ?? "").trim();

  cleaned = cleaned.replace(/^["']+|["']+$/g, "").trim();

  if (variableName) {
    const prefix = `${variableName}=`;

    if (
      cleaned
        .toLowerCase()
        .startsWith(prefix.toLowerCase())
    ) {
      cleaned = cleaned.slice(prefix.length).trim();
      cleaned = cleaned.replace(/^["']+|["']+$/g, "").trim();
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

function readSearchParameter(
  value: string | string[] | undefined,
  maxLength = 240,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getErrorMessage(code: string): string {
  if (code === "invalid-recipient") {
    return "Enter a valid recipient email address.";
  }

  if (code === "missing-subject") {
    return "Enter an email subject.";
  }

  if (code === "missing-message") {
    return "Enter a message before sending.";
  }

  if (code === "send-failed") {
    return "The email could not be sent. Please try again.";
  }

  if (code === "record-failed") {
    return "The email was sent, but its correspondence record could not be saved.";
  }

  return code || "Something went wrong while sending the email.";
}

export default async function SaveWooltonBathsCampaignEmailPage({
  searchParams,
}: AdminEmailPageProps) {
  const adminAccount =
    await requireAdministratorAccount();

  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : undefined;

  const sent = readSearchParameter(
    resolvedSearchParams?.sent,
    20,
  );

  const error = readSearchParameter(
    resolvedSearchParams?.error,
  );

  const supabase = getSupabaseAdmin();

  const {
    data: correspondenceData,
    error: correspondenceError,
  } = await supabase
    .from(
      "save_woolton_baths_support_correspondence",
    )
    .select(`
      id,
      registration_id,
      recipient_email,
      sender_email,
      subject,
      message,
      delivery_status,
      resend_email_id,
      sent_by,
      sent_by_name,
      sent_at,
      created_at
    `)
    .eq("direction", "outbound")
    .eq("channel", "email")
    .order(
      "sent_at",
      {
        ascending: false,
      },
    )
    .limit(100);

  if (correspondenceError) {
    console.error(
      "[Save Woolton Baths Campaign Email] Failed to load sent correspondence:",
      correspondenceError,
    );
  }

  const sentEmails =
    (
      correspondenceData ??
      []
    ) as CampaignCorrespondence[];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="relative overflow-hidden bg-[#071522] px-5 py-10 text-white sm:px-6 sm:py-14">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37] sm:text-sm sm:tracking-[0.28em]">
                Save Woolton Baths Administration
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Campaign Email
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Start a new branded Save Woolton Baths email conversation with
                a contact who may not already be registered on the campaign
                website.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#E6C75A]">
                  Administrator
                </span>

                <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-200">
                  {adminAccount.name}
                </span>
              </div>
            </div>

            <Link
              href="/savewooltonbaths/admin"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10 sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Support Registry
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          {sent === "1" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-black">
                  Email sent
                </p>

                <p className="mt-1 text-sm leading-6">
                  The branded campaign email was sent and added to the
                  correspondence history.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-black">
                  Email not completed
                </p>

                <p className="mt-1 text-sm leading-6">
                  {getErrorMessage(error)}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              <div className="bg-[#102532] px-5 py-5 text-white sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-black">
                    <Send className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E6C75A]">
                      New Email
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Start a conversation
                    </h2>
                  </div>
                </div>
              </div>

              <form
                action={sendWooltonCampaignEmail}
                className="p-5 sm:p-7"
              >
                <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8D7425]">
                    Sending From
                  </p>

                  <p className="mt-1 break-words font-black text-slate-900">
                    Save Woolton Baths
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-600">
                    savewooltonbaths@beacon-ai.co.uk
                  </p>
                </div>

                <label className="mt-6 block">
                  <span className="text-sm font-black text-slate-800">
                    To
                  </span>

                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type="email"
                      name="to"
                      required
                      autoComplete="email"
                      inputMode="email"
                      maxLength={320}
                      placeholder="name@example.co.uk"
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-base font-semibold outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15"
                    />
                  </div>
                </label>

                <label className="mt-5 block">
                  <span className="text-sm font-black text-slate-800">
                    Subject
                  </span>

                  <input
                    type="text"
                    name="subject"
                    required
                    maxLength={200}
                    placeholder="Email subject"
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="text-sm font-black text-slate-800">
                    Message
                  </span>

                  <textarea
                    name="message"
                    required
                    rows={12}
                    maxLength={10000}
                    placeholder="Write your message..."
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-base leading-7 outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15"
                  />
                </label>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Your message will be placed inside the Save Woolton Baths
                  branded email layout when it is sent.
                </p>

                <button
                  type="submit"
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 text-sm font-black text-black transition hover:bg-[#E6C75A] sm:w-auto"
                >
                  <Send className="h-4 w-4" />
                  Send Email
                </button>
              </form>
            </section>

            <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#102532] text-[#D4AF37]">
                    <MailCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8D7425]">
                      Correspondence
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Sent
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Outgoing campaign emails are kept here so contact made outside
                  the website remains part of the campaign record.
                </p>
              </div>

              {correspondenceError ? (
                <div className="p-5 sm:p-7">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                    <p className="font-black">
                      Sent history unavailable
                    </p>

                    <p className="mt-2 text-sm leading-6">
                      The email form is still available, but the correspondence
                      history could not be loaded right now.
                    </p>
                  </div>
                </div>
              ) : sentEmails.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {sentEmails.map(
                    (email) => (
                      <details
                        key={email.id}
                        className="group"
                      >
                        <summary className="cursor-pointer list-none px-5 py-5 marker:hidden transition hover:bg-slate-50 sm:px-7 [&::-webkit-details-marker]:hidden">
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                email.delivery_status === "sent"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {email.delivery_status === "sent" ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <XCircle className="h-5 w-5" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-black text-slate-900">
                                {email.subject}
                              </p>

                              <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                                {email.recipient_email}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {formatDateTime(
                                    email.sent_at,
                                  )}
                                </span>

                                {email.registration_id && (
                                  <span className="inline-flex items-center gap-1 text-[#8D7425]">
                                    <UserRound className="h-3.5 w-3.5" />
                                    Linked contact
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </summary>

                        <div className="border-t border-slate-100 bg-slate-50 px-5 py-5 sm:px-7">
                          <dl className="grid gap-3 text-sm">
                            <div>
                              <dt className="font-black text-slate-500">
                                To
                              </dt>

                              <dd className="mt-1 break-all font-semibold text-slate-800">
                                {email.recipient_email}
                              </dd>
                            </div>

                            <div>
                              <dt className="font-black text-slate-500">
                                From
                              </dt>

                              <dd className="mt-1 break-all font-semibold text-slate-800">
                                {email.sender_email}
                              </dd>
                            </div>

                            <div>
                              <dt className="font-black text-slate-500">
                                Delivery
                              </dt>

                              <dd className="mt-1 font-semibold capitalize text-slate-800">
                                {email.delivery_status}
                              </dd>
                            </div>

                            {email.resend_email_id && (
                              <div>
                                <dt className="font-black text-slate-500">
                                  Delivery ID
                                </dt>

                                <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                                  {email.resend_email_id}
                                </dd>
                              </div>
                            )}

                            {email.sent_by_name && (
                              <div>
                                <dt className="font-black text-slate-500">
                                  Sent By
                                </dt>

                                <dd className="mt-1 font-semibold text-slate-800">
                                  {email.sent_by_name}
                                </dd>
                              </div>
                            )}
                          </dl>

                          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                              Message
                            </p>

                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                              {email.message}
                            </p>
                          </div>
                        </div>
                      </details>
                    ),
                  )}
                </div>
              ) : (
                <div className="px-5 py-14 text-center sm:px-7">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#8D7425]">
                    <Mail className="h-7 w-7" />
                  </div>

                  <h3 className="mt-5 text-xl font-black">
                    No campaign emails yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Emails started from this page will appear here after they
                    have been sent.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
