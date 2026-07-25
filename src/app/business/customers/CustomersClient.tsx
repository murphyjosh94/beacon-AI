"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CustomerStatus = "lead" | "active" | "returning" | "inactive";
type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
type JobStatus = "booked" | "in_progress" | "completed" | "cancelled";
type InvoiceStatus = "draft" | "sent" | "overdue" | "paid" | "cancelled";
type ActivityType =
  | "enquiry"
  | "quote"
  | "job"
  | "invoice"
  | "document"
  | "follow_up"
  | "note";

type CustomerQuote = {
  id: string;
  title: string;
  total: number;
  status: QuoteStatus;
  createdAt: string;
};

type CustomerJob = {
  id: string;
  title: string;
  status: JobStatus;
  startDate?: string;
  value?: number;
};

type CustomerInvoice = {
  id: string;
  reference: string;
  total: number;
  status: InvoiceStatus;
  dueDate?: string;
  createdAt: string;
};

type CustomerDocument = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  href?: string;
};

type CustomerActivity = {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  createdAt: string;
};

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  status: CustomerStatus;
  rating: number;
  notes: string;
  createdAt: string;
  lastContactAt?: string;
  quotes: CustomerQuote[];
  jobs: CustomerJob[];
  invoices: CustomerInvoice[];
  documents: CustomerDocument[];
  activity: CustomerActivity[];
};

type CustomerForm = {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  status: CustomerStatus;
  notes: string;
};

const CUSTOMERS_STORAGE_KEY = "beacon-business-customers";

const emptyForm: CustomerForm = {
  firstName: "",
  lastName: "",
  businessName: "",
  email: "",
  phone: "",
  address: "",
  postcode: "",
  status: "lead",
  notes: "",
};

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

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

function daysSince(value?: string) {
  if (!value) return null;

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) return null;

  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

function statusLabel(status: CustomerStatus) {
  switch (status) {
    case "lead":
      return "Lead";
    case "active":
      return "Active";
    case "returning":
      return "Returning";
    case "inactive":
      return "Inactive";
  }
}

function statusClasses(status: CustomerStatus) {
  switch (status) {
    case "lead":
      return "bg-blue-100 text-blue-900";
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "returning":
      return "bg-amber-100 text-amber-900";
    case "inactive":
      return "bg-slate-200 text-slate-700";
  }
}

function quoteStatusClasses(status: QuoteStatus) {
  switch (status) {
    case "accepted":
      return "bg-emerald-100 text-emerald-800";
    case "sent":
      return "bg-blue-100 text-blue-900";
    case "rejected":
    case "expired":
      return "bg-rose-100 text-rose-800";
    case "draft":
      return "bg-slate-200 text-slate-700";
  }
}

function invoiceStatusClasses(status: InvoiceStatus) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    case "sent":
      return "bg-blue-100 text-blue-900";
    case "overdue":
      return "bg-rose-100 text-rose-800";
    case "draft":
    case "cancelled":
      return "bg-slate-200 text-slate-700";
  }
}

function jobStatusLabel(status: JobStatus) {
  switch (status) {
    case "booked":
      return "Booked";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

function activityIcon(type: ActivityType) {
  switch (type) {
    case "enquiry":
      return "💬";
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
  }
}

function readStoredCustomers() {
  if (typeof window === "undefined") return [] as Customer[];

  const raw = window.localStorage.getItem(CUSTOMERS_STORAGE_KEY);

  if (!raw) return [] as Customer[];

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [] as Customer[];

    return parsed.filter(
      (item): item is Customer =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "firstName" in item &&
        "lastName" in item &&
        "email" in item,
    );
  } catch {
    return [] as Customer[];
  }
}

function CustomerMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

export default function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>(
    "all",
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = readStoredCustomers();
    setCustomers(stored);
    setSelectedCustomerId(stored[0]?.id ?? null);
    setLoaded(true);
  }, []);

  function saveCustomers(nextCustomers: Customer[]) {
    setCustomers(nextCustomers);
    window.localStorage.setItem(
      CUSTOMERS_STORAGE_KEY,
      JSON.stringify(nextCustomers),
    );
    window.dispatchEvent(new Event("beacon-customers-updated"));
  }

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ?? null;

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesStatus =
        statusFilter === "all" || customer.status === statusFilter;

      const matchesSearch =
        !query ||
        [
          customer.firstName,
          customer.lastName,
          customer.businessName,
          customer.email,
          customer.phone,
          customer.postcode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [customers, search, statusFilter]);

  const metrics = useMemo(() => {
    const lifetimeValue = customers.reduce(
      (sum, customer) =>
        sum +
        customer.invoices
          .filter((invoice) => invoice.status === "paid")
          .reduce((invoiceSum, invoice) => invoiceSum + invoice.total, 0),
      0,
    );

    const outstanding = customers.reduce(
      (sum, customer) =>
        sum +
        customer.invoices
          .filter(
            (invoice) =>
              invoice.status === "sent" || invoice.status === "overdue",
          )
          .reduce((invoiceSum, invoice) => invoiceSum + invoice.total, 0),
      0,
    );

    const returning = customers.filter(
      (customer) => customer.status === "returning",
    ).length;

    return {
      total: customers.length,
      active: customers.filter((customer) => customer.status === "active")
        .length,
      returning,
      lifetimeValue,
      outstanding,
    };
  }, [customers]);

  const customerTotals = useMemo(() => {
    if (!selectedCustomer) {
      return {
        lifetimeValue: 0,
        outstanding: 0,
        acceptedQuotes: 0,
        lastJob: null as CustomerJob | null,
      };
    }

    const lifetimeValue = selectedCustomer.invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.total, 0);

    const outstanding = selectedCustomer.invoices
      .filter(
        (invoice) =>
          invoice.status === "sent" || invoice.status === "overdue",
      )
      .reduce((sum, invoice) => sum + invoice.total, 0);

    const acceptedQuotes = selectedCustomer.quotes.filter(
      (quote) => quote.status === "accepted",
    ).length;

    const lastJob =
      [...selectedCustomer.jobs].sort((a, b) => {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
        return bDate - aDate;
      })[0] ?? null;

    return {
      lifetimeValue,
      outstanding,
      acceptedQuotes,
      lastJob,
    };
  }, [selectedCustomer]);

  const aiInsight = useMemo(() => {
    if (!selectedCustomer) return null;

    const contactGap = daysSince(selectedCustomer.lastContactAt);

    if (customerTotals.outstanding > 0) {
      return `${selectedCustomer.firstName} has ${formatCurrency(
        customerTotals.outstanding,
      )} outstanding. Consider sending a polite payment reminder.`;
    }

    if (contactGap !== null && contactGap >= 30) {
      return `${selectedCustomer.firstName} has not been contacted for ${contactGap} days. A follow-up or maintenance reminder may be useful.`;
    }

    if (
      selectedCustomer.quotes.some((quote) => quote.status === "sent")
    ) {
      return `${selectedCustomer.firstName} has a quote awaiting a decision. Consider sending a short follow-up message.`;
    }

    if (customerTotals.lifetimeValue > 0) {
      return `${selectedCustomer.firstName} is an existing customer worth ${formatCurrency(
        customerTotals.lifetimeValue,
      )}. Consider offering a repeat-customer service reminder.`;
    }

    return "Add quotes, jobs, invoices and contact notes to unlock more useful customer insights.";
  }, [customerTotals, selectedCustomer]);

  function submitCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();

    const customer: Customer = {
      id: makeId("customer"),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      businessName: form.businessName.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      postcode: form.postcode.trim(),
      status: form.status,
      rating: 0,
      notes: form.notes.trim(),
      createdAt: now,
      lastContactAt: now,
      quotes: [],
      jobs: [],
      invoices: [],
      documents: [],
      activity: [
        {
          id: makeId("activity"),
          type: "enquiry",
          title: "Customer record created",
          detail: "Added to Beacon Business Customers.",
          createdAt: now,
        },
      ],
    };

    const nextCustomers = [customer, ...customers];
    saveCustomers(nextCustomers);
    setSelectedCustomerId(customer.id);
    setForm(emptyForm);
    setShowForm(false);
  }

  function addTimelineNote() {
    if (!selectedCustomer) return;

    const note = window.prompt("Add a customer note");

    if (!note?.trim()) return;

    const now = new Date().toISOString();

    const nextCustomers = customers.map((customer) =>
      customer.id === selectedCustomer.id
        ? {
            ...customer,
            lastContactAt: now,
            activity: [
              {
                id: makeId("activity"),
                type: "note" as const,
                title: "Customer note added",
                detail: note.trim(),
                createdAt: now,
              },
              ...customer.activity,
            ],
          }
        : customer,
    );

    saveCustomers(nextCustomers);
  }

  function deleteCustomer() {
    if (!selectedCustomer) return;

    const confirmed = window.confirm(
      `Delete ${selectedCustomer.firstName} ${selectedCustomer.lastName}? This cannot be undone.`,
    );

    if (!confirmed) return;

    const nextCustomers = customers.filter(
      (customer) => customer.id !== selectedCustomer.id,
    );

    saveCustomers(nextCustomers);
    setSelectedCustomerId(nextCustomers[0]?.id ?? null);
  }

  if (!loaded) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl">
            <div className="h-5 w-36 rounded bg-slate-200" />
            <div className="mt-4 h-12 max-w-2xl rounded bg-slate-200" />
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              <div className="h-96 rounded-3xl bg-slate-100" />
              <div className="h-96 rounded-3xl bg-slate-100 lg:col-span-2" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-20 text-white">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
                Beacon Business Customers
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Every customer. One connected record.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                Keep contact details, quotes, jobs, invoices, documents and
                activity together from first enquiry to final payment.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 font-extrabold text-blue-950 transition hover:bg-blue-50"
            >
              Add Customer
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
          <CustomerMetric
            label="Customers"
            value={String(metrics.total)}
            detail={`${metrics.active} active customer records`}
          />
          <CustomerMetric
            label="Returning"
            value={String(metrics.returning)}
            detail="Customers marked as returning"
          />
          <CustomerMetric
            label="Customer Value"
            value={formatCurrency(metrics.lifetimeValue)}
            detail="Paid invoice value across all customers"
          />
          <CustomerMetric
            label="Outstanding"
            value={formatCurrency(metrics.outstanding)}
            detail="Sent and overdue invoice value"
          />
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                  Customer list
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {filteredCustomers.length} shown
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-blue-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-blue-900"
              >
                Add
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | CustomerStatus,
                  )
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">All statuses</option>
                <option value="lead">Leads</option>
                <option value="active">Active</option>
                <option value="returning">Returning</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="mt-5 space-y-3">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                  const selected = customer.id === selectedCustomerId;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-700 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                            {customer.businessName || customer.email}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${statusClasses(
                            customer.status,
                          )}`}
                        >
                          {statusLabel(customer.status)}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="font-black text-slate-900">
                    No customers found
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Add a customer or change your search filters.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0">
            {selectedCustomer ? (
              <div className="space-y-6">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                          {selectedCustomer.firstName}{" "}
                          {selectedCustomer.lastName}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${statusClasses(
                            selectedCustomer.status,
                          )}`}
                        >
                          {statusLabel(selectedCustomer.status)}
                        </span>
                      </div>

                      {selectedCustomer.businessName ? (
                        <p className="mt-2 text-lg font-bold text-blue-900">
                          {selectedCustomer.businessName}
                        </p>
                      ) : null}

                      <div className="mt-4 flex items-center gap-1 text-xl">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span
                            key={index}
                            aria-hidden="true"
                            className={
                              index < selectedCustomer.rating
                                ? "text-amber-400"
                                : "text-slate-300"
                            }
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm font-bold text-slate-500">
                          Customer rating
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={addTimelineNote}
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900"
                      >
                        Add Note
                      </button>
                      <button
                        type="button"
                        onClick={deleteCustomer}
                        className="inline-flex items-center justify-center rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3 font-extrabold text-rose-800 transition hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <dl className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <dt className="text-sm font-bold text-slate-500">
                        Joined
                      </dt>
                      <dd className="mt-2 font-black text-slate-950">
                        {formatDate(selectedCustomer.createdAt)}
                      </dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <dt className="text-sm font-bold text-slate-500">
                        Last job
                      </dt>
                      <dd className="mt-2 font-black text-slate-950">
                        {customerTotals.lastJob?.title || "No jobs yet"}
                      </dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <dt className="text-sm font-bold text-slate-500">
                        Lifetime value
                      </dt>
                      <dd className="mt-2 font-black text-slate-950">
                        {formatCurrency(customerTotals.lifetimeValue)}
                      </dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <dt className="text-sm font-bold text-slate-500">
                        Outstanding
                      </dt>
                      <dd className="mt-2 font-black text-slate-950">
                        {formatCurrency(customerTotals.outstanding)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-5">
                      <p className="text-sm font-bold text-slate-500">
                        Contact details
                      </p>
                      <div className="mt-3 space-y-2 font-semibold text-slate-800">
                        <p>{selectedCustomer.phone || "No phone provided"}</p>
                        <p className="break-all">
                          {selectedCustomer.email || "No email provided"}
                        </p>
                        <p>
                          {selectedCustomer.address || "No address provided"}
                          {selectedCustomer.postcode
                            ? `, ${selectedCustomer.postcode}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-5">
                      <p className="text-sm font-bold text-slate-500">
                        Customer notes
                      </p>
                      <p className="mt-3 leading-7 text-slate-700">
                        {selectedCustomer.notes || "No customer notes yet."}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-amber-800">
                    Beacon AI insight
                  </p>
                  <p className="mt-3 text-lg font-bold leading-8 text-slate-900">
                    {aiInsight}
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
                      <Link
                        href="/business/quotes"
                        className="font-black text-blue-950"
                      >
                        New quote →
                      </Link>
                    </div>

                    <div className="mt-6 space-y-3">
                      {selectedCustomer.quotes.length > 0 ? (
                        selectedCustomer.quotes.map((quote) => (
                          <article
                            key={quote.id}
                            className="rounded-2xl border border-slate-200 p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-black text-slate-950">
                                  {quote.title}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                  {formatDate(quote.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${quoteStatusClasses(
                                  quote.status,
                                )}`}
                              >
                                {quote.status}
                              </span>
                            </div>
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
                      <Link
                        href="/business/jobs"
                        className="font-black text-blue-950"
                      >
                        Open jobs →
                      </Link>
                    </div>

                    <div className="mt-6 space-y-3">
                      {selectedCustomer.jobs.length > 0 ? (
                        selectedCustomer.jobs.map((job) => (
                          <article
                            key={job.id}
                            className="rounded-2xl border border-slate-200 p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-black text-slate-950">
                                  {job.title}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                  {formatDate(job.startDate)}
                                </p>
                              </div>
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-900">
                                {jobStatusLabel(job.status)}
                              </span>
                            </div>
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
                      {selectedCustomer.invoices.length > 0 ? (
                        selectedCustomer.invoices.map((invoice) => (
                          <article
                            key={invoice.id}
                            className="rounded-2xl border border-slate-200 p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-black text-slate-950">
                                  {invoice.reference}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                  Due {formatDate(invoice.dueDate)}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${invoiceStatusClasses(
                                  invoice.status,
                                )}`}
                              >
                                {invoice.status}
                              </span>
                            </div>
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
                      {selectedCustomer.documents.length > 0 ? (
                        selectedCustomer.documents.map((document) => (
                          <article
                            key={document.id}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5"
                          >
                            <div>
                              <p className="font-black text-slate-950">
                                {document.name}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                {document.type} · {formatDate(document.createdAt)}
                              </p>
                            </div>
                            {document.href ? (
                              <Link
                                href={document.href}
                                className="font-black text-blue-950"
                              >
                                Open
                              </Link>
                            ) : (
                              <span className="text-sm font-bold text-slate-400">
                                Saved
                              </span>
                            )}
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
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                        Timeline
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-slate-950">
                        Complete customer history
                      </h3>
                    </div>
                    <p className="text-sm font-bold text-slate-500">
                      {selectedCustomer.activity.length} events
                    </p>
                  </div>

                  <div className="mt-7 space-y-4">
                    {[...selectedCustomer.activity]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .map((activity) => (
                        <article
                          key={activity.id}
                          className="flex gap-4 rounded-2xl border border-slate-200 p-5"
                        >
                          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                            {activityIcon(activity.type)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="font-black text-slate-950">
                                {activity.title}
                              </p>
                              <p className="text-sm font-semibold text-slate-500">
                                {formatDate(activity.createdAt)}
                              </p>
                            </div>
                            {activity.detail ? (
                              <p className="mt-2 leading-7 text-slate-600">
                                {activity.detail}
                              </p>
                            ) : null}
                          </div>
                        </article>
                      ))}
                  </div>
                </section>
              </div>
            ) : (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-14">
                <span
                  aria-hidden="true"
                  className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 text-3xl"
                >
                  👥
                </span>
                <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
                  Add your first customer.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Customer records connect quotes, jobs, invoices, documents
                  and follow-ups across Beacon Business.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-8 inline-flex rounded-2xl bg-blue-950 px-8 py-4 text-lg font-extrabold text-white transition hover:bg-blue-900"
                >
                  Add Customer
                </button>
              </section>
            )}
          </div>
        </div>
      </section>

      {showForm ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-form-title"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Customer record
                </p>
                <h2
                  id="customer-form-title"
                  className="mt-2 text-3xl font-black text-slate-950"
                >
                  Add a new customer
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close customer form"
                className="rounded-xl bg-slate-100 px-4 py-2 font-black text-slate-700 transition hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCustomer} className="mt-8 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="font-extrabold text-slate-900">
                    First name
                  </span>
                  <input
                    required
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="font-extrabold text-slate-900">
                    Last name
                  </span>
                  <input
                    required
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="font-extrabold text-slate-900">
                    Business name
                  </span>
                  <input
                    value={form.businessName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        businessName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="font-extrabold text-slate-900">Email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="font-extrabold text-slate-900">Phone</span>
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="font-extrabold text-slate-900">
                    Address
                  </span>
                  <input
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="font-extrabold text-slate-900">
                    Postcode
                  </span>
                  <input
                    value={form.postcode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        postcode: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 uppercase outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="font-extrabold text-slate-900">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as CustomerStatus,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="lead">Lead</option>
                    <option value="active">Active</option>
                    <option value="returning">Returning</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="font-extrabold text-slate-900">Notes</span>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-2xl border border-slate-300 px-6 py-3 font-extrabold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-blue-950 px-6 py-3 font-extrabold text-white transition hover:bg-blue-900"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}