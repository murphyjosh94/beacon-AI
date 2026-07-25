"use client";

import type { CustomerRecord, CustomerStatus } from "../types";

export default function CustomerForm({
  customer,
  savedMessage,
  onChange,
  onSave,
  onBack,
}: {
  customer: CustomerRecord;
  savedMessage: string | null;
  onChange: (updater: (customer: CustomerRecord) => CustomerRecord) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
            Customer Record
          </p>
          <h2 className="mt-3 text-3xl font-black">
            {customer.name || "New customer"}
          </h2>
        </div>

        <select
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              status: event.target.value as CustomerStatus,
            }))
          }
          value={customer.status}
        >
          <option value="lead">Lead</option>
          <option value="active">Active</option>
          <option value="returning">Returning</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">
            Customer name
          </span>
          <input
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            value={customer.name}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">Company</span>
          <input
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                company: event.target.value,
              }))
            }
            value={customer.company}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">Email</span>
          <input
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            type="email"
            value={customer.email}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">Telephone</span>
          <input
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            type="tel"
            value={customer.phone}
          />
        </label>

        <label className="space-y-2 sm:col-span-2">
          <span className="text-sm font-bold text-slate-700">Address</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                address: event.target.value,
              }))
            }
            value={customer.address}
          />
        </label>

        <label className="space-y-2 sm:col-span-2">
          <span className="text-sm font-bold text-slate-700">Notes</span>
          <textarea
            className="min-h-40 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            placeholder="Add preferences, job history, important details or follow-up notes."
            value={customer.notes}
          />
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
          onClick={onSave}
          type="button"
        >
          Save Customer
        </button>

        <button
          className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-300 px-6 py-4 font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-950"
          onClick={onBack}
          type="button"
        >
          Back to Customers
        </button>
      </div>

      {savedMessage ? (
        <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">
          {savedMessage}
        </p>
      ) : null}
    </section>
  );
}