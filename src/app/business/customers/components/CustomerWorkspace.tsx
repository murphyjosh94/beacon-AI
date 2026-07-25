"use client";

import Link from "next/link";

import type { CustomerFinancials, CustomerRecord } from "../types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function timelineIcon(type: string) {
  switch (type) {
    case "quote":
      return "📋";
    case "job":
      return "🛠️";
    case "invoice":
      return "🧾";
    case "document":
      return "📄";
    case "follow_up":
      return "✉️";
    case "note":
      return "📝";
    default:
      return "👤";
  }
}

export default function CustomerWorkspace({
  customer,
  financials,
  onAddNote,
}: {
  customer: CustomerRecord;
  financials: CustomerFinancials;
  onAddNote: () => void;
}) {
  const lastContactDays = customer.lastContactAt
    ? Math.floor(
        (Date.now() - new Date(customer.lastContactAt).getTime()) /
          86_400_000,
      )
    : null;

  const insight =
    financials.outstandingBalance > 0
      ? `${customer.name || "This customer"} has ${formatCurrency(
          financials.outstandingBalance,
        )} outstanding. Consider sending a payment reminder.`
      : lastContactDays !== null && lastContactDays >= 30
        ? `${customer.name || "This customer"} has not been contacted for ${lastContactDays} days. A follow-up may be useful.`
        : customer.quotes.some((quote) => quote.status === "sent")
          ? "A quote is awaiting a response. Consider sending a short follow-up message."
          : financials.lifetimeValue > 0
            ? `This customer has generated ${formatCurrency(
                financials.lifetimeValue,
              )} in paid invoices. Consider a repeat-service reminder.`
            : "Add quotes, jobs, invoices and notes to unlock more useful customer insights.";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-amber-800">
          Beacon AI Insight
        </p>
        <p className="mt-3 text-lg font-bold leading-8 text-slate-900">
          {insight}
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Quotes
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">
                Customer quotations
              </h3>
            </div>
            <Link href="/business/quotes" className="font-black text-blue-950">
              New quote →
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {customer.quotes.length > 0 ? (
              customer.quotes.map((quote) => (
                <article
                  key={quote.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <p className="font-black text-slate-950">{quote.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {formatDate(quote.createdAt)} · {quote.status}
                  </p>
                  <p className="mt-4 text-2xl font-black text-blue-950">
                    {formatCurrency(quote.total)}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-6 text-slate-600">
                No quotes are linked to this customer yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Jobs
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">
                Work history
              </h3>
            </div>
            <Link href="/business/jobs" className="font-black text-blue-950">
              Open jobs →
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {customer.jobs.length > 0 ? (
              customer.jobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <p className="font-black text-slate-950">{job.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {job.status} · {formatDate(job.startDate)}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-6 text-slate-600">
                No jobs are linked to this customer yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Invoices
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">
                Payments and balances
              </h3>
            </div>
            <Link
              href="/business/invoices"
              className="font-black text-blue-950"
            >
              New invoice →
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {customer.invoices.length > 0 ? (
              customer.invoices.map((invoice) => (
                <article
                  key={invoice.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <p className="font-black text-slate-950">
                    {invoice.reference}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {invoice.status} · Due {formatDate(invoice.dueDate)}
                  </p>
                  <p className="mt-4 text-2xl font-black text-blue-950">
                    {formatCurrency(invoice.total)}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-6 text-slate-600">
                No invoices are linked to this customer yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Documents
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">
                Customer files
              </h3>
            </div>
            <Link
              href="/business/templates"
              className="font-black text-blue-950"
            >
              Templates →
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {customer.documents.length > 0 ? (
              customer.documents.map((document) => (
                <article
                  key={document.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <p className="font-black text-slate-950">
                    {document.name}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {document.type} · {formatDate(document.createdAt)}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-6 text-slate-600">
                No documents are linked to this customer yet.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
              Timeline
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              Complete customer history
            </h3>
          </div>

          <button
            type="button"
            onClick={onAddNote}
            className="rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900"
          >
            Add Timeline Note
          </button>
        </div>

        <div className="mt-7 space-y-4">
          {[...customer.timeline]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((event) => (
              <article
                key={event.id}
                className="flex gap-4 rounded-2xl border border-slate-200 p-5"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                  {timelineIcon(event.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-black text-slate-950">{event.title}</p>
                    <p className="text-sm font-semibold text-slate-500">
                      {formatDate(event.createdAt)}
                    </p>
                  </div>
                  {event.detail ? (
                    <p className="mt-2 leading-7 text-slate-600">
                      {event.detail}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}