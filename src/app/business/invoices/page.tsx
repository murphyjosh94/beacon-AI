"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

type InvoiceCustomer = {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
};

type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  discountType: "fixed" | "percentage";
  discountValue: number;
  notes: string;
  terms: string;
  paymentReference: string;
  paidAt?: string | null;
  updatedAt: string;
};

const INVOICES_STORAGE_KEY = "beacon-business-invoices";

const emptyCustomer: InvoiceCustomer = {
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
};

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

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

function statusLabel(status: InvoiceStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
    case "cancelled":
      return "Cancelled";
  }
}

function statusClasses(status: InvoiceStatus) {
  switch (status) {
    case "draft":
      return "bg-slate-200 text-slate-700";
    case "sent":
      return "bg-blue-100 text-blue-800";
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    case "overdue":
      return "bg-amber-100 text-amber-900";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
  }
}

function parseStoredInvoices(raw: string | null): InvoiceRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((invoice): invoice is InvoiceRecord => {
      if (!invoice || typeof invoice !== "object") {
        return false;
      }

      const candidate = invoice as Partial<InvoiceRecord>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.invoiceNumber === "string" &&
        typeof candidate.issueDate === "string" &&
        typeof candidate.dueDate === "string" &&
        typeof candidate.status === "string" &&
        Array.isArray(candidate.items) &&
        typeof candidate.customer === "object"
      );
    });
  } catch {
    return [];
  }
}

function calculateInvoice(invoice: InvoiceRecord) {
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const discount =
    invoice.discountType === "percentage"
      ? subtotal * (Math.max(0, invoice.discountValue) / 100)
      : Math.max(0, invoice.discountValue);

  const discountedSubtotal = Math.max(0, subtotal - discount);

  const vat = invoice.items.reduce((sum, item) => {
    const lineSubtotal = item.quantity * item.unitPrice;
    const discountShare = subtotal > 0 ? lineSubtotal / subtotal : 0;
    const discountedLine = Math.max(
      0,
      lineSubtotal - discount * discountShare,
    );

    return sum + discountedLine * (Math.max(0, item.vatRate) / 100);
  }, 0);

  return {
    subtotal,
    discount,
    vat,
    total: discountedSubtotal + vat,
  };
}

function createNewInvoice(sequence: number): InvoiceRecord {
  const now = new Date().toISOString();

  return {
    id: createId("invoice"),
    invoiceNumber: `BI-${new Date().getFullYear()}-${String(sequence).padStart(
      4,
      "0",
    )}`,
    createdAt: now,
    issueDate: todayIso(),
    dueDate: addDaysIso(14),
    status: "draft",
    customer: { ...emptyCustomer },
    items: [
      {
        id: createId("item"),
        description: "",
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
    ],
    discountType: "fixed",
    discountValue: 0,
    notes: "",
    terms:
      "Payment is due by the date shown. Please use the invoice number as your payment reference.",
    paymentReference: "",
    paidAt: null,
    updatedAt: now,
  };
}

export default function BusinessInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceRecord | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = parseStoredInvoices(
      window.localStorage.getItem(INVOICES_STORAGE_KEY),
    );

    setInvoices(stored);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    window.localStorage.setItem(
      INVOICES_STORAGE_KEY,
      JSON.stringify(invoices),
    );
  }, [invoices, loaded]);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timer = window.setTimeout(() => setSavedMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return invoices;
    }

    return invoices.filter((invoice) => {
      const customerText = [
        invoice.customer.name,
        invoice.customer.company,
        invoice.customer.email,
      ]
        .join(" ")
        .toLowerCase();

      return (
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        customerText.includes(query) ||
        statusLabel(invoice.status).toLowerCase().includes(query)
      );
    });
  }, [invoices, search]);

  const statistics = useMemo(() => {
    const paidValue = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + calculateInvoice(invoice).total, 0);

    const outstandingValue = invoices
      .filter(
        (invoice) =>
          invoice.status === "sent" || invoice.status === "overdue",
      )
      .reduce((sum, invoice) => sum + calculateInvoice(invoice).total, 0);

    return {
      total: invoices.length,
      draft: invoices.filter((invoice) => invoice.status === "draft").length,
      overdue: invoices.filter((invoice) => invoice.status === "overdue")
        .length,
      paidValue,
      outstandingValue,
    };
  }, [invoices]);

  const activeTotals = useMemo(
    () => (activeInvoice ? calculateInvoice(activeInvoice) : null),
    [activeInvoice],
  );

  function startNewInvoice() {
    setActiveInvoice(createNewInvoice(invoices.length + 1));
    setSavedMessage(null);
  }

  function updateActiveInvoice(
    updater: (invoice: InvoiceRecord) => InvoiceRecord,
  ) {
    setActiveInvoice((current) => {
      if (!current) {
        return current;
      }

      return updater({
        ...current,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  function saveInvoice() {
    if (!activeInvoice) {
      return;
    }

    const normalisedInvoice: InvoiceRecord = {
      ...activeInvoice,
      customer: {
        ...activeInvoice.customer,
        name: activeInvoice.customer.name.trim(),
        company: activeInvoice.customer.company.trim(),
        email: activeInvoice.customer.email.trim(),
        phone: activeInvoice.customer.phone.trim(),
        address: activeInvoice.customer.address.trim(),
      },
      items: activeInvoice.items.map((item) => ({
        ...item,
        description: item.description.trim(),
        quantity: Math.max(0, Number(item.quantity) || 0),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
        vatRate: Math.max(0, Number(item.vatRate) || 0),
      })),
      paymentReference: activeInvoice.paymentReference.trim(),
      updatedAt: new Date().toISOString(),
      paidAt:
        activeInvoice.status === "paid"
          ? activeInvoice.paidAt || new Date().toISOString()
          : null,
    };

    setInvoices((current) => {
      const exists = current.some(
        (invoice) => invoice.id === normalisedInvoice.id,
      );

      if (exists) {
        return current.map((invoice) =>
          invoice.id === normalisedInvoice.id
            ? normalisedInvoice
            : invoice,
        );
      }

      return [normalisedInvoice, ...current];
    });

    setActiveInvoice(normalisedInvoice);
    setSavedMessage("Invoice saved successfully.");
  }

  function deleteInvoice(id: string) {
    setInvoices((current) =>
      current.filter((invoice) => invoice.id !== id),
    );

    if (activeInvoice?.id === id) {
      setActiveInvoice(null);
    }
  }

  function duplicateInvoice(invoice: InvoiceRecord) {
    const now = new Date().toISOString();

    const copy: InvoiceRecord = {
      ...invoice,
      id: createId("invoice"),
      invoiceNumber: `BI-${new Date().getFullYear()}-${String(
        invoices.length + 1,
      ).padStart(4, "0")}`,
      status: "draft",
      issueDate: todayIso(),
      dueDate: addDaysIso(14),
      createdAt: now,
      updatedAt: now,
      paidAt: null,
      items: invoice.items.map((item) => ({
        ...item,
        id: createId("item"),
      })),
    };

    setActiveInvoice(copy);
  }

  function addItem() {
    updateActiveInvoice((invoice) => ({
      ...invoice,
      items: [
        ...invoice.items,
        {
          id: createId("item"),
          description: "",
          quantity: 1,
          unitPrice: 0,
          vatRate: 20,
        },
      ],
    }));
  }

  function removeItem(itemId: string) {
    updateActiveInvoice((invoice) => ({
      ...invoice,
      items:
        invoice.items.length === 1
          ? invoice.items
          : invoice.items.filter((item) => item.id !== itemId),
    }));
  }

  function updateItem(
    itemId: string,
    field: keyof Omit<InvoiceItem, "id">,
    value: string,
  ) {
    updateActiveInvoice((invoice) => ({
      ...invoice,
      items: invoice.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]:
                field === "description"
                  ? value
                  : Math.max(0, Number(value) || 0),
            }
          : item,
      ),
    }));
  }

  function printInvoice() {
    window.print();
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
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-16 text-white print:hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
                Beacon Invoices
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Create, track and manage every invoice.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                Build professional invoices, monitor payment status and keep
                outstanding balances visible.
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
                onClick={startNewInvoice}
                type="button"
              >
                + New Invoice
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 print:hidden">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Total Invoices
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.total}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Draft
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.draft}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Overdue
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.overdue}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Outstanding
              </p>
              <p className="mt-3 text-3xl font-black">
                {formatCurrency(statistics.outstandingValue)}
              </p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Paid Value
              </p>
              <p className="mt-3 text-3xl font-black">
                {formatCurrency(statistics.paidValue)}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          {activeInvoice ? (
            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-6 print:hidden">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                        Invoice Details
                      </p>
                      <h2 className="mt-3 text-3xl font-black">
                        {activeInvoice.invoiceNumber}
                      </h2>
                    </div>

                    <select
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        updateActiveInvoice((invoice) => ({
                          ...invoice,
                          status: event.target.value as InvoiceStatus,
                        }))
                      }
                      value={activeInvoice.status}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Invoice number
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveInvoice((invoice) => ({
                            ...invoice,
                            invoiceNumber: event.target.value,
                          }))
                        }
                        value={activeInvoice.invoiceNumber}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Issue date
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveInvoice((invoice) => ({
                            ...invoice,
                            issueDate: event.target.value,
                          }))
                        }
                        type="date"
                        value={activeInvoice.issueDate}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Due date
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveInvoice((invoice) => ({
                            ...invoice,
                            dueDate: event.target.value,
                          }))
                        }
                        type="date"
                        value={activeInvoice.dueDate}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Payment reference
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveInvoice((invoice) => ({
                            ...invoice,
                            paymentReference: event.target.value,
                          }))
                        }
                        placeholder={activeInvoice.invoiceNumber}
                        value={activeInvoice.paymentReference}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                    Customer
                  </p>
                  <h2 className="mt-3 text-3xl font-black">
                    Who is this invoice for?
                  </h2>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    {[
                      ["name", "Customer name", "text"],
                      ["company", "Company", "text"],
                      ["email", "Email", "email"],
                      ["phone", "Telephone", "tel"],
                    ].map(([field, label, type]) => (
                      <label className="space-y-2" key={field}>
                        <span className="text-sm font-bold text-slate-700">
                          {label}
                        </span>
                        <input
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                          onChange={(event) =>
                            updateActiveInvoice((invoice) => ({
                              ...invoice,
                              customer: {
                                ...invoice.customer,
                                [field]: event.target.value,
                              },
                            }))
                          }
                          type={type}
                          value={
                            activeInvoice.customer[
                              field as keyof InvoiceCustomer
                            ]
                          }
                        />
                      </label>
                    ))}

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Address
                      </span>
                      <textarea
                        className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveInvoice((invoice) => ({
                            ...invoice,
                            customer: {
                              ...invoice.customer,
                              address: event.target.value,
                            },
                          }))
                        }
                        value={activeInvoice.customer.address}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                        Line Items
                      </p>
                      <h2 className="mt-3 text-3xl font-black">
                        Products, labour and services.
                      </h2>
                    </div>

                    <button
                      className="rounded-2xl border-2 border-blue-950 px-5 py-3 font-extrabold text-blue-950 transition hover:bg-blue-950 hover:text-white"
                      onClick={addItem}
                      type="button"
                    >
                      + Add item
                    </button>
                  </div>

                  <div className="mt-7 space-y-5">
                    {activeInvoice.items.map((item, index) => (
                      <div
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                        key={item.id}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-black text-slate-950">
                            Item {index + 1}
                          </p>
                          <button
                            className="text-sm font-bold text-rose-700 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={activeInvoice.items.length === 1}
                            onClick={() => removeItem(item.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_110px_150px_110px]">
                          <label className="space-y-2">
                            <span className="text-sm font-bold text-slate-700">
                              Description
                            </span>
                            <input
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                              onChange={(event) =>
                                updateItem(
                                  item.id,
                                  "description",
                                  event.target.value,
                                )
                              }
                              placeholder="e.g. Labour, service or product"
                              value={item.description}
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-bold text-slate-700">
                              Quantity
                            </span>
                            <input
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                              min="0"
                              onChange={(event) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={item.quantity}
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-bold text-slate-700">
                              Unit price
                            </span>
                            <input
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                              min="0"
                              onChange={(event) =>
                                updateItem(
                                  item.id,
                                  "unitPrice",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={item.unitPrice}
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-bold text-slate-700">
                              VAT %
                            </span>
                            <input
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                              min="0"
                              onChange={(event) =>
                                updateItem(
                                  item.id,
                                  "vatRate",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={item.vatRate}
                            />
                          </label>
                        </div>

                        <p className="mt-4 text-right font-black text-blue-950">
                          Line total:{" "}
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                    Discount, Notes & Terms
                  </p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Discount type
                      </span>
                      <select
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveInvoice((invoice) => ({
                            ...invoice,
                            discountType: event.target.value as
                              | "fixed"
                              | "percentage",
                          }))
                        }
                        value={activeInvoice.discountType}
                      >
                        <option value="fixed">Fixed amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Discount value
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        min="0"
                        onChange={(event) =>
                          updateActiveInvoice((invoice) => ({
                            ...invoice,
                            discountValue: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          }))
                        }
                        step="0.01"
                        type="number"
                        value={activeInvoice.discountValue}
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Notes
                      </span>
                      <textarea
                        className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveInvoice((invoice) => ({
                            ...invoice,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Add payment details or project notes."
                        value={activeInvoice.notes}
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Terms
                      </span>
                      <textarea
                        className="min-h-32 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveInvoice((invoice) => ({
                            ...invoice,
                            terms: event.target.value,
                          }))
                        }
                        value={activeInvoice.terms}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:flex-row">
                  <button
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
                    onClick={saveInvoice}
                    type="button"
                  >
                    Save Invoice
                  </button>

                  <button
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-300 px-6 py-4 font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-950"
                    onClick={printInvoice}
                    type="button"
                  >
                    Print / Save PDF
                  </button>

                  <button
                    className="inline-flex flex-1 cursor-not-allowed items-center justify-center rounded-2xl bg-slate-200 px-6 py-4 font-extrabold text-slate-500"
                    disabled
                    type="button"
                  >
                    Send Invoice
                  </button>
                </div>

                {savedMessage ? (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">
                    {savedMessage}
                  </p>
                ) : null}
              </section>

              <aside className="h-fit xl:sticky xl:top-6">
                <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl print:rounded-none print:border-0 print:p-0 print:shadow-none">
                  <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-7">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                        Beacon Business
                      </p>
                      <h2 className="mt-2 text-3xl font-black">Invoice</h2>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-extrabold ${statusClasses(
                        activeInvoice.status,
                      )}`}
                    >
                      {statusLabel(activeInvoice.status)}
                    </span>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Invoice number
                      </p>
                      <p className="mt-1 font-black">
                        {activeInvoice.invoiceNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Issue date
                      </p>
                      <p className="mt-1 font-black">
                        {formatDate(activeInvoice.issueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Due date
                      </p>
                      <p className="mt-1 font-black">
                        {formatDate(activeInvoice.dueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Payment reference
                      </p>
                      <p className="mt-1 font-black">
                        {activeInvoice.paymentReference ||
                          activeInvoice.invoiceNumber}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                      Bill to
                    </p>
                    <p className="mt-3 text-xl font-black">
                      {activeInvoice.customer.name || "Customer name"}
                    </p>
                    {activeInvoice.customer.company ? (
                      <p className="mt-1 font-bold text-slate-700">
                        {activeInvoice.customer.company}
                      </p>
                    ) : null}
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {activeInvoice.customer.address || "Customer address"}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      {activeInvoice.customer.email || "Customer email"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {activeInvoice.customer.phone || "Customer telephone"}
                    </p>
                  </div>

                  <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-950 text-white">
                        <tr>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Qty</th>
                          <th className="px-4 py-3 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeInvoice.items.map((item) => (
                          <tr
                            className="border-t border-slate-200"
                            key={item.id}
                          >
                            <td className="px-4 py-4 font-semibold">
                              {item.description || "Item description"}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-4 text-right font-bold">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {activeTotals ? (
                    <div className="mt-7 ml-auto max-w-sm space-y-3">
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-black">
                          {formatCurrency(activeTotals.subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-slate-600">Discount</span>
                        <span className="font-black">
                          -{formatCurrency(activeTotals.discount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-slate-600">VAT</span>
                        <span className="font-black">
                          {formatCurrency(activeTotals.vat)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-6 border-t-2 border-slate-950 pt-4 text-xl">
                        <span className="font-black">Total due</span>
                        <span className="font-black text-blue-950">
                          {formatCurrency(activeTotals.total)}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {activeInvoice.notes ? (
                    <div className="mt-8">
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                        Notes
                      </p>
                      <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">
                        {activeInvoice.notes}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                      Terms
                    </p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {activeInvoice.terms}
                    </p>
                  </div>

                  {activeInvoice.status === "paid" ? (
                    <p className="mt-8 rounded-2xl bg-emerald-100 px-5 py-4 text-center font-black text-emerald-800">
                      Paid {formatDate(activeInvoice.paidAt)}
                    </p>
                  ) : (
                    <p className="mt-8 rounded-2xl bg-blue-950 px-5 py-4 text-center text-sm font-bold text-blue-100">
                      Built with trust. Guided by purpose.
                    </p>
                  )}
                </article>
              </aside>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] print:hidden">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Your Invoices
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  Find and manage every invoice.
                </h2>

                <input
                  className="mt-7 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search invoice number, customer or status"
                  value={search}
                />

                <div className="mt-6 space-y-4">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => {
                      const totals = calculateInvoice(invoice);

                      return (
                        <article
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                          key={invoice.id}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="text-lg font-black">
                                  {invoice.invoiceNumber}
                                </p>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusClasses(
                                    invoice.status,
                                  )}`}
                                >
                                  {statusLabel(invoice.status)}
                                </span>
                              </div>

                              <p className="mt-2 font-bold text-slate-700">
                                {invoice.customer.name ||
                                  invoice.customer.company ||
                                  "Unnamed customer"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Due {formatDate(invoice.dueDate)}
                              </p>
                            </div>

                            <p className="text-xl font-black text-blue-950">
                              {formatCurrency(totals.total)}
                            </p>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              className="rounded-xl bg-blue-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-blue-900"
                              onClick={() => setActiveInvoice(invoice)}
                              type="button"
                            >
                              Open
                            </button>
                            <button
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
                              onClick={() => duplicateInvoice(invoice)}
                              type="button"
                            >
                              Duplicate
                            </button>
                            <button
                              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
                              onClick={() => deleteInvoice(invoice.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
                      <p className="font-black text-slate-950">
                        No invoices found.
                      </p>
                      <p className="mt-2 text-slate-600">
                        Create your first professional invoice.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-blue-200 bg-blue-950 p-8 text-white shadow-2xl">
                <span
                  aria-hidden="true"
                  className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl"
                >
                  🧾
                </span>

                <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.25em] text-blue-200">
                  Beacon Invoice Builder
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-tight">
                  Keep payments organised and visible.
                </h2>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                  Create professional invoices, track whether they are draft,
                  sent, paid or overdue and keep every customer balance in one
                  place.
                </p>

                <button
                  className="mt-8 inline-flex rounded-2xl bg-amber-400 px-7 py-4 text-lg font-extrabold text-slate-950 transition hover:bg-amber-300"
                  onClick={startNewInvoice}
                  type="button"
                >
                  Create New Invoice
                </button>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}