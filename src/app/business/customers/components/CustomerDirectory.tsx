"use client";

import type { CustomerRecord, CustomerStatus } from "../types";

function statusLabel(status: CustomerStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "lead":
      return "Lead";
    case "returning":
      return "Returning";
    case "inactive":
      return "Inactive";
  }
}

function statusClasses(status: CustomerStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "lead":
      return "bg-blue-100 text-blue-800";
    case "returning":
      return "bg-amber-100 text-amber-900";
    case "inactive":
      return "bg-slate-200 text-slate-700";
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CustomerDirectory({
  customers,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onOpen,
  onDuplicate,
  onDelete,
  onCreate,
}: {
  customers: CustomerRecord[];
  search: string;
  statusFilter: "all" | CustomerStatus;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | CustomerStatus) => void;
  onOpen: (customer: CustomerRecord) => void;
  onDuplicate: (customer: CustomerRecord) => void;
  onDelete: (customer: CustomerRecord) => void;
  onCreate: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
            Customer Directory
          </p>
          <h2 className="mt-3 text-3xl font-black">
            Find every customer in one place.
          </h2>
        </div>

        <button
          className="rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900"
          onClick={onCreate}
          type="button"
        >
          + Add Customer
        </button>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-[1fr_180px]">
        <input
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, company, email, phone or address"
          value={search}
        />

        <select
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          onChange={(event) =>
            onStatusFilterChange(
              event.target.value as "all" | CustomerStatus,
            )
          }
          value={statusFilter}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="lead">Leads</option>
          <option value="returning">Returning</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {customers.length > 0 ? (
          customers.map((customer) => (
            <article
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              key={customer.id}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-950 font-black text-white">
                    {(customer.name || customer.company || "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black">
                        {customer.name ||
                          customer.company ||
                          "Unnamed customer"}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusClasses(
                          customer.status,
                        )}`}
                      >
                        {statusLabel(customer.status)}
                      </span>
                    </div>

                    {customer.company && customer.name ? (
                      <p className="mt-1 font-bold text-slate-700">
                        {customer.company}
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm text-slate-600">
                      {customer.email || "No email"} ·{" "}
                      {customer.phone || "No telephone"}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-500">
                  Updated {formatDate(customer.updatedAt)}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="rounded-xl bg-blue-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-blue-900"
                  onClick={() => onOpen(customer)}
                  type="button"
                >
                  Open
                </button>

                <button
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
                  onClick={() => onDuplicate(customer)}
                  type="button"
                >
                  Duplicate
                </button>

                <button
                  className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
                  onClick={() => onDelete(customer)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <p className="font-black text-slate-950">No customers found.</p>
            <p className="mt-2 text-slate-600">
              Add your first customer or change the search filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}