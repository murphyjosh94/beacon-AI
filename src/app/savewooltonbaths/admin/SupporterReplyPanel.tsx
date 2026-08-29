"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  Send,
} from "lucide-react";
import {
  FormEvent,
  useState,
} from "react";

export type SupporterCorrespondenceItem = {
  id: string;
  registration_id: string;
  direction: "outbound" | "inbound";
  channel: "email";
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

type SendResponse = {
  ok?: boolean;
  message?: string;
  warning?: string;
  error?: string;
  correspondence?: SupporterCorrespondenceItem;
};

type SupporterReplyPanelProps = {
  registrationId: string;
  supporterName: string;
  supporterEmail: string;
  permissionToContact: boolean;
  initialCorrespondence?: SupporterCorrespondenceItem[];
};

const DEFAULT_SUBJECT =
  "Save Woolton Baths";

const MAX_SUBJECT_LENGTH = 180;
const MAX_MESSAGE_LENGTH = 10000;

function formatDateTime(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Date unavailable";
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

async function readApiResponse(
  response: Response,
): Promise<SendResponse> {
  const contentType =
    response.headers
      .get("content-type")
      ?.toLowerCase() ?? "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    return (await response.json()) as SendResponse;
  }

  const body =
    await response.text();

  console.error(
    "[Save Woolton Baths Supporter Reply] Non-JSON API response:",
    {
      status: response.status,
      contentType,
      preview: body.slice(0, 300),
    },
  );

  if (
    response.redirected ||
    response.status === 401
  ) {
    return {
      ok: false,
      error:
        "Your administrator session may have expired. Refresh the page and sign in again if required.",
    };
  }

  if (response.status === 404) {
    return {
      ok: false,
      error:
        "The supporter reply API route was not found on this deployment.",
    };
  }

  return {
    ok: false,
    error:
      `The supporter reply service returned an unexpected response (HTTP ${response.status}).`,
  };
}

export default function SupporterReplyPanel({
  registrationId,
  supporterName,
  supporterEmail,
  permissionToContact,
  initialCorrespondence = [],
}: SupporterReplyPanelProps) {
  const [
    subject,
    setSubject,
  ] =
    useState(
      DEFAULT_SUBJECT,
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    correspondence,
    setCorrespondence,
  ] =
    useState<
      SupporterCorrespondenceItem[]
    >(
      initialCorrespondence,
    );

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    feedback,
    setFeedback,
  ] =
    useState<{
      type:
        | "success"
        | "warning"
        | "error";
      message: string;
    } | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !permissionToContact
    ) {
      setFeedback({
        type: "error",
        message:
          "This supporter has not given permission to be contacted.",
      });
      return;
    }

    const trimmedSubject =
      subject.trim();

    const trimmedMessage =
      message.trim();

    if (!trimmedSubject) {
      setFeedback({
        type: "error",
        message:
          "Please enter an email subject.",
      });
      return;
    }

    if (!trimmedMessage) {
      setFeedback({
        type: "error",
        message:
          "Please write a message before sending.",
      });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const response =
        await fetch(
          "/api/savewooltonbaths/admin/support/reply",
          {
            method: "POST",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body:
              JSON.stringify({
                registrationId,
                subject:
                  trimmedSubject,
                message:
                  trimmedMessage,
              }),
          },
        );

      const data =
        await readApiResponse(
          response,
        );

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
            "The email could not be sent.",
        );
      }

      if (
        data.correspondence
      ) {
        setCorrespondence(
          (
            current,
          ) => [
            data.correspondence as SupporterCorrespondenceItem,
            ...current.filter(
              (item) =>
                item.id !==
                data.correspondence?.id,
            ),
          ],
        );
      }

      setMessage("");

      if (data.warning) {
        setFeedback({
          type: "warning",
          message:
            data.warning,
        });
      } else {
        setFeedback({
          type: "success",
          message:
            data.message ||
            `Email sent to ${supporterName}.`,
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "The email could not be sent.",
      });
    } finally {
      setSending(false);
    }
  }

  const firstName =
    getFirstName(
      supporterName,
    );

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-[#102532] px-5 py-5 text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-black">
            <Mail className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E6C75A]">
              Personal correspondence
            </p>

            <h3 className="mt-1 text-lg font-black">
              Reply to {firstName}
            </h3>

            <p className="mt-1 break-all text-xs font-semibold text-slate-300">
              {supporterEmail}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {!permissionToContact ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-black">
                  Contact permission not granted
                </p>

                <p className="mt-1 text-sm leading-6">
                  Email sending is disabled for this supporter.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={
              handleSubmit
            }
          >
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Subject
              </span>

              <input
                type="text"
                value={
                  subject
                }
                onChange={
                  (
                    event,
                  ) =>
                    setSubject(
                      event
                        .target
                        .value,
                    )
                }
                maxLength={
                  MAX_SUBJECT_LENGTH
                }
                disabled={
                  sending
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Message
              </span>

              <textarea
                value={
                  message
                }
                onChange={
                  (
                    event,
                  ) =>
                    setMessage(
                      event
                        .target
                        .value,
                    )
                }
                rows={7}
                maxLength={
                  MAX_MESSAGE_LENGTH
                }
                disabled={
                  sending
                }
                placeholder={`Write your personal message to ${firstName} here...`}
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-base leading-7 outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <div className="mt-2 flex flex-col justify-between gap-2 text-xs font-semibold text-slate-500 sm:flex-row">
                <span>
                  “Hi {firstName},” and the campaign signature are added automatically.
                </span>

                <span className="shrink-0">
                  {message.length.toLocaleString(
                    "en-GB",
                  )}
                  {" / "}
                  {MAX_MESSAGE_LENGTH.toLocaleString(
                    "en-GB",
                  )}
                </span>
              </div>
            </label>

            <button
              type="submit"
              disabled={
                sending ||
                !message.trim() ||
                !subject.trim()
              }
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-black text-black transition hover:bg-[#E6C75A] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </button>
          </form>
        )}

        {feedback && (
          <div
            className={`mt-4 rounded-xl border p-4 text-sm font-bold leading-6 ${
              feedback.type ===
              "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : feedback.type ===
                    "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <div className="flex items-start gap-3">
              {feedback.type ===
              "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              )}

              <p>
                {feedback.message}
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 border-t border-slate-200 pt-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8D7425]">
              Correspondence history
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Personal emails sent from the supporter register.
            </p>
          </div>

          {correspondence.length ===
          0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              No personal emails have been recorded for this supporter yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {correspondence.map(
                (
                  item,
                ) => (
                  <article
                    key={
                      item.id
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                              item.delivery_status ===
                              "sent"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.delivery_status ===
                            "sent"
                              ? "Sent"
                              : "Failed"}
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatDateTime(
                              item.sent_at,
                            )}
                          </span>
                        </div>

                        <h4 className="mt-3 break-words font-black text-slate-900">
                          {item.subject}
                        </h4>

                        {item.sent_by_name && (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Sent by {item.sent_by_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap break-words border-t border-slate-200 pt-4 text-sm leading-6 text-slate-700">
                      {item.message}
                    </p>
                  </article>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
