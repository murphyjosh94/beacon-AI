"use client";

import Link from "next/link";

import type { CustomerFinancials, CustomerRecord } from "../types";
import {
  SELECTED_CUSTOMER_STORAGE_KEY,
} from "../customerStorage";

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

export default function CustomerSidebar({
  customer,
  financials,
}: {
  customer: CustomerRecord;
  financials: CustomerFinancials;
}) {
  function selectForNextModule() {
    window.localStorage.setItem(
      SELECTED_CUSTOMER_STORAGE_KEY,
      customer.id,
    );
  }

  return (
    <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl xl:sticky xl:top-6">
      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
        Customer Summary
      </p>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 text-2xl font-black text-white">
          {(customer.name || customer.company || "?")
            .slice(0, 1)
            .toUpperCase()}
        </div>

        <div>
          <h3 className="text-2xl font-black">
            {customer.name || "Customer name"}
          </h3>
          <p className="mt-1 text-slate-600">
            {customer.company || "No company added"}
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-500">Lifetime value</p>
          <p className="mt-1 text-xl font-black text-slate-950">
            {formatCurrency(financials.lifetimeValue)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-500">Outstanding</p>
          <p className="mt-1 text-xl font-black text-slate-950">
            {formatCurrency(financials.outstandingBalance)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-500">
            Accepted quotes
          </p>
          <p className="mt-1 text-xl font-black text-slate-950">
            {financials.acceptedQuotes}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-500">
            Completed jobs
          </p>
          <p className="mt-1 text-xl font-black text-slate-950">
            {financials.completedJobs}
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-5 border-t border-slate-200 pt-6">
        <div>
          <p className="text-sm font-bold text-slate-500">Last contact</p>
          <p className="mt-1 font-black">
            {formatDate(customer.lastContactAt)}
          </p>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-500">Customer rating</p>
          <p className="mt-2 text-xl">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className={
                  index < customer.rating
                    ? "text-amber-400"
                    : "text-slate-300"
                }
              >
                ★
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        <Link
          href="/business/quotes"
          onClick={selectForNextModule}
          className="rounded-2xl bg-blue-950 px-5 py-3 text-center font-extrabold text-white transition hover:bg-blue-900"
        >
          Create Quote
        </Link>
        <Link
          href="/business/invoices"
          onClick={selectForNextModule}
          className="rounded-2xl border-2 border-slate-300 px-5 py-3 text-center font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-950"
        >
          Create Invoice
        </Link>
      </div>
    </aside>
  );
}