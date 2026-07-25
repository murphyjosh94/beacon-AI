"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CustomerStatus = "active" | "lead" | "inactive";

type CustomerRecord = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const CUSTOMERS_STORAGE_KEY = "beacon-business-customers";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: CustomerStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "lead":
      return "Lead";
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
    case "inactive":
      return "bg-slate-200 text-slate-700";
  }
}

function parseStoredCustomers(raw: string | null): CustomerRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((customer): customer is CustomerRecord => {
      if (!customer || typeof customer !== "object") {
        return false;
      }

      const candidate = customer as Partial<CustomerRecord>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.email === "string" &&
        typeof candidate.status === "string"
      );
    });
  } catch {
    return [];
  }
}

function createNewCustomer(): CustomerRecord {
  const now = new Date().toISOString();

  return {
    id: createId("customer"),
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    status: "lead",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export default function BusinessCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<CustomerRecord | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>(
    "all",
  );
  const [loaded, setLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = parseStoredCustomers(
      window.localStorage.getItem(CUSTOMERS_STORAGE_KEY),
    );

    setCustomers(stored);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    window.localStorage.setItem(
      CUSTOMERS_STORAGE_KEY,
      JSON.stringify(customers),
    );
  }, [customers, loaded]);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timer = window.setTimeout(() => setSavedMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  const statistics = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter((customer) => customer.status === "active")
        .length,
      leads: customers.filter((customer) => customer.status === "lead").length,
      inactive: customers.filter((customer) => customer.status === "inactive")
        .length,
    }),
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        [
          customer.name,
          customer.company,
          customer.email,
          customer.phone,
          customer.address,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  function startNewCustomer() {
    setActiveCustomer(createNewCustomer());
    setSavedMessage(null);
  }

  function updateActiveCustomer(
    updater: (customer: CustomerRecord) => CustomerRecord,
  ) {
    setActiveCustomer((current) => {
      if (!current) {
        return current;
      }

      return updater({
        ...current,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  function saveCustomer() {
    if (!activeCustomer) {
      return;
    }

    const normalisedCustomer: CustomerRecord = {
      ...activeCustomer,
      name: activeCustomer.name.trim(),
      company: activeCustomer.company.trim(),
      email: activeCustomer.email.trim(),
      phone: activeCustomer.phone.trim(),
      address: activeCustomer.address.trim(),
      notes: activeCustomer.notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    setCustomers((current) => {
      const exists = current.some(
        (customer) => customer.id === normalisedCustomer.id,
      );

      if (exists) {
        return current.map((customer) =>
          customer.id === normalisedCustomer.id
            ? normalisedCustomer
            : customer,
        );
      }

      return [normalisedCustomer, ...current];
    });

    setActiveCustomer(normalisedCustomer);
    setSavedMessage("Customer saved successfully.");
  }

  function deleteCustomer(id: string) {
    setCustomers((current) =>
      current.filter((customer) => customer.id !== id),
    );

    if (activeCustomer?.id === id) {
      setActiveCustomer(null);
    }
  }

  function duplicateCustomer(customer: CustomerRecord) {
    const now = new Date().toISOString();

    setActiveCustomer({
      ...customer,
      id: createId("customer"),
      name: customer.name ? `${customer.name} Copy` : "",
      createdAt: now,
      updatedAt: now,
    });
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-12 w-72 rounded bg-slate-200" />
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-16 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
                Beacon Customers
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Keep every customer relationship organised.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                Store customer details, track leads and keep notes ready for
                quotes, invoices and future jobs.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/business/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-extrabold text-white transition hover:bg-white/20"
              >
                Back to Dashboard
              </Link>

              <button
                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 font-extrabold text-slate-950 transition hover:bg-amber-300"
                onClick={startNewCustomer}
                type="button"
              >
                + New Customer
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Total Customers
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.total}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Active
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.active}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Leads
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.leads}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Inactive
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.inactive}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          {activeCustomer ? (
            <div className="grid gap-8 xl:grid-cols-[1fr_0.8fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                      Customer Record
                    </p>
                    <h2 className="mt-3 text-3xl font-black">
                      {activeCustomer.name || "New customer"}
                    </h2>
                  </div>

                  <select
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) =>
                      updateActiveCustomer((customer) => ({
                        ...customer,
                        status: event.target.value as CustomerStatus,
                      }))
                    }
                    value={activeCustomer.status}
                  >
                    <option value="lead">Lead</option>
                    <option value="active">Active</option>
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
                        updateActiveCustomer((customer) => ({
                          ...customer,
                          name: event.target.value,
                        }))
                      }
                      value={activeCustomer.name}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">
                      Company
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        updateActiveCustomer((customer) => ({
                          ...customer,
                          company: event.target.value,
                        }))
                      }
                      value={activeCustomer.company}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">
                      Email
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        updateActiveCustomer((customer) => ({
                          ...customer,
                          email: event.target.value,
                        }))
                      }
                      type="email"
                      value={activeCustomer.email}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">
                      Telephone
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        updateActiveCustomer((customer) => ({
                          ...customer,
                          phone: event.target.value,
                        }))
                      }
                      type="tel"
                      value={activeCustomer.phone}
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Address
                    </span>
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        updateActiveCustomer((customer) => ({
                          ...customer,
                          address: event.target.value,
                        }))
                      }
                      value={activeCustomer.address}
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      Notes
                    </span>
                    <textarea
                      className="min-h-40 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        updateActiveCustomer((customer) => ({
                          ...customer,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Add preferences, job history, important details or follow-up notes."
                      value={activeCustomer.notes}
                    />
                  </label>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
                    onClick={saveCustomer}
                    type="button"
                  >
                    Save Customer
                  </button>

                  <button
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-300 px-6 py-4 font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-950"
                    onClick={() => setActiveCustomer(null)}
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

              <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl xl:sticky xl:top-6">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Customer Summary
                </p>

                <div className="mt-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 text-2xl font-black text-white">
                    {(activeCustomer.name || activeCustomer.company || "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-2xl font-black">
                      {activeCustomer.name || "Customer name"}
                    </h3>
                    <p className="mt-1 text-slate-600">
                      {activeCustomer.company || "No company added"}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-extrabold ${statusClasses(
                      activeCustomer.status,
                    )}`}
                  >
                    {statusLabel(activeCustomer.status)}
                  </span>
                </div>

                <div className="mt-8 space-y-5 border-t border-slate-200 pt-6">
                  <div>
                    <p className="text-sm font-bold text-slate-500">Email</p>
                    <p className="mt-1 break-words font-black">
                      {activeCustomer.email || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Telephone
                    </p>
                    <p className="mt-1 font-black">
                      {activeCustomer.phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-500">Address</p>
                    <p className="mt-1 whitespace-pre-line leading-7 text-slate-700">
                      {activeCustomer.address || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-500">Created</p>
                    <p className="mt-1 font-black">
                      {formatDate(activeCustomer.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Last updated
                    </p>
                    <p className="mt-1 font-black">
                      {formatDate(activeCustomer.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-3">
                  <button
                    className="cursor-not-allowed rounded-2xl bg-slate-200 px-5 py-3 font-extrabold text-slate-500"
                    disabled
                    type="button"
                  >
                    Create Quote
                  </button>
                  <button
                    className="cursor-not-allowed rounded-2xl bg-slate-200 px-5 py-3 font-extrabold text-slate-500"
                    disabled
                    type="button"
                  >
                    Create Invoice
                  </button>
                </div>
              </aside>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
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
                    onClick={startNewCustomer}
                    type="button"
                  >
                    + Add Customer
                  </button>
                </div>

                <div className="mt-7 grid gap-4 md:grid-cols-[1fr_180px]">
                  <input
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, company, email, phone or address"
                    value={search}
                  />

                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as "all" | CustomerStatus,
                      )
                    }
                    value={statusFilter}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="lead">Leads</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="mt-6 space-y-4">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
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
                            onClick={() => setActiveCustomer(customer)}
                            type="button"
                          >
                            Open
                          </button>

                          <button
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
                            onClick={() => duplicateCustomer(customer)}
                            type="button"
                          >
                            Duplicate
                          </button>

                          <button
                            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
                            onClick={() => deleteCustomer(customer.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
                      <p className="font-black text-slate-950">
                        No customers found.
                      </p>
                      <p className="mt-2 text-slate-600">
                        Add your first customer or change the search filters.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <aside className="h-fit rounded-[2rem] border border-blue-200 bg-blue-950 p-8 text-white shadow-2xl lg:sticky lg:top-6">
                <span
                  aria-hidden="true"
                  className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl"
                >
                  👥
                </span>

                <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.25em] text-blue-200">
                  Beacon Customer Manager
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-tight">
                  Build stronger customer relationships.
                </h2>

                <p className="mt-5 text-lg leading-8 text-blue-100">
                  Keep contact details, lead status and important notes
                  organised so your team always has the right information.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Store customer contact details",
                    "Track active customers and leads",
                    "Keep notes and job context",
                    "Prepare for quote and invoice linking",
                  ].map((feature) => (
                    <div className="flex items-start gap-3" key={feature}>
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-slate-950">
                        ✓
                      </span>
                      <p className="font-bold text-blue-50">{feature}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}