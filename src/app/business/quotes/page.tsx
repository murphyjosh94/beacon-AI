"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

type QuoteCustomer = {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
};

type QuoteRecord = {
  id: string;
  quoteNumber: string;
  createdAt: string;
  issueDate: string;
  expiryDate: string;
  status: QuoteStatus;
  customer: QuoteCustomer;
  items: QuoteItem[];
  discountType: "fixed" | "percentage";
  discountValue: number;
  notes: string;
  terms: string;
  updatedAt: string;
};

const QUOTES_STORAGE_KEY = "beacon-business-quotes";

const emptyCustomer: QuoteCustomer = {
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

function statusLabel(status: QuoteStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
  }
}

function statusClasses(status: QuoteStatus) {
  switch (status) {
    case "draft":
      return "bg-slate-200 text-slate-700";
    case "sent":
      return "bg-blue-100 text-blue-800";
    case "accepted":
      return "bg-emerald-100 text-emerald-800";
    case "declined":
      return "bg-rose-100 text-rose-800";
    case "expired":
      return "bg-amber-100 text-amber-900";
  }
}

function parseStoredQuotes(raw: string | null): QuoteRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((quote): quote is QuoteRecord => {
      if (!quote || typeof quote !== "object") {
        return false;
      }

      const candidate = quote as Partial<QuoteRecord>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.quoteNumber === "string" &&
        typeof candidate.issueDate === "string" &&
        typeof candidate.expiryDate === "string" &&
        typeof candidate.status === "string" &&
        Array.isArray(candidate.items) &&
        typeof candidate.customer === "object"
      );
    });
  } catch {
    return [];
  }
}

function calculateQuote(quote: QuoteRecord) {
  const subtotal = quote.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const discount =
    quote.discountType === "percentage"
      ? subtotal * (Math.max(0, quote.discountValue) / 100)
      : Math.max(0, quote.discountValue);

  const discountedSubtotal = Math.max(0, subtotal - discount);

  const vat = quote.items.reduce((sum, item) => {
    const lineSubtotal = item.quantity * item.unitPrice;
    const discountShare = subtotal > 0 ? lineSubtotal / subtotal : 0;
    const discountedLine = Math.max(0, lineSubtotal - discount * discountShare);

    return sum + discountedLine * (Math.max(0, item.vatRate) / 100);
  }, 0);

  return {
    subtotal,
    discount,
    vat,
    total: discountedSubtotal + vat,
  };
}

function createNewQuote(sequence: number): QuoteRecord {
  const now = new Date().toISOString();

  return {
    id: createId("quote"),
    quoteNumber: `BQ-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`,
    createdAt: now,
    issueDate: todayIso(),
    expiryDate: addDaysIso(30),
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
      "This quotation is valid until the expiry date shown. Work will begin once the quotation is accepted and any agreed deposit is received.",
    updatedAt: now,
  };
}

export default function BusinessQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [activeQuote, setActiveQuote] = useState<QuoteRecord | null>(null);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = parseStoredQuotes(
      window.localStorage.getItem(QUOTES_STORAGE_KEY),
    );

    setQuotes(stored);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    window.localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
  }, [quotes, loaded]);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timer = window.setTimeout(() => setSavedMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return quotes;
    }

    return quotes.filter((quote) => {
      const customerText = [
        quote.customer.name,
        quote.customer.company,
        quote.customer.email,
      ]
        .join(" ")
        .toLowerCase();

      return (
        quote.quoteNumber.toLowerCase().includes(query) ||
        customerText.includes(query) ||
        statusLabel(quote.status).toLowerCase().includes(query)
      );
    });
  }, [quotes, search]);

  const statistics = useMemo(() => {
    const acceptedValue = quotes
      .filter((quote) => quote.status === "accepted")
      .reduce((sum, quote) => sum + calculateQuote(quote).total, 0);

    return {
      total: quotes.length,
      draft: quotes.filter((quote) => quote.status === "draft").length,
      sent: quotes.filter((quote) => quote.status === "sent").length,
      acceptedValue,
    };
  }, [quotes]);

  const activeTotals = useMemo(
    () => (activeQuote ? calculateQuote(activeQuote) : null),
    [activeQuote],
  );

  function startNewQuote() {
    setActiveQuote(createNewQuote(quotes.length + 1));
    setSavedMessage(null);
  }

  function updateActiveQuote(updater: (quote: QuoteRecord) => QuoteRecord) {
    setActiveQuote((current) => {
      if (!current) {
        return current;
      }

      return updater({
        ...current,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  function saveQuote() {
    if (!activeQuote) {
      return;
    }

    const normalisedQuote: QuoteRecord = {
      ...activeQuote,
      customer: {
        ...activeQuote.customer,
        name: activeQuote.customer.name.trim(),
        company: activeQuote.customer.company.trim(),
        email: activeQuote.customer.email.trim(),
        phone: activeQuote.customer.phone.trim(),
        address: activeQuote.customer.address.trim(),
      },
      items: activeQuote.items.map((item) => ({
        ...item,
        description: item.description.trim(),
        quantity: Math.max(0, Number(item.quantity) || 0),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
        vatRate: Math.max(0, Number(item.vatRate) || 0),
      })),
      updatedAt: new Date().toISOString(),
    };

    setQuotes((current) => {
      const exists = current.some((quote) => quote.id === normalisedQuote.id);

      if (exists) {
        return current.map((quote) =>
          quote.id === normalisedQuote.id ? normalisedQuote : quote,
        );
      }

      return [normalisedQuote, ...current];
    });

    setActiveQuote(normalisedQuote);
    setSavedMessage("Quote saved successfully.");
  }

  function deleteQuote(id: string) {
    setQuotes((current) => current.filter((quote) => quote.id !== id));

    if (activeQuote?.id === id) {
      setActiveQuote(null);
    }
  }

  function duplicateQuote(quote: QuoteRecord) {
    const now = new Date().toISOString();

    const copy: QuoteRecord = {
      ...quote,
      id: createId("quote"),
      quoteNumber: `BQ-${new Date().getFullYear()}-${String(
        quotes.length + 1,
      ).padStart(4, "0")}`,
      status: "draft",
      issueDate: todayIso(),
      expiryDate: addDaysIso(30),
      createdAt: now,
      updatedAt: now,
      items: quote.items.map((item) => ({
        ...item,
        id: createId("item"),
      })),
    };

    setActiveQuote(copy);
  }

  function addItem() {
    updateActiveQuote((quote) => ({
      ...quote,
      items: [
        ...quote.items,
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
    updateActiveQuote((quote) => ({
      ...quote,
      items:
        quote.items.length === 1
          ? quote.items
          : quote.items.filter((item) => item.id !== itemId),
    }));
  }

  function updateItem(
    itemId: string,
    field: keyof Omit<QuoteItem, "id">,
    value: string,
  ) {
    updateActiveQuote((quote) => ({
      ...quote,
      items: quote.items.map((item) =>
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

  function printQuote() {
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
                Beacon Quote
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Create professional quotes with confidence.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                Build, save and manage clear quotations with line items,
                discounts, VAT, expiry dates and customer details.
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
                onClick={startNewQuote}
                type="button"
              >
                + New Quote
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 print:hidden">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Total Quotes
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
                Sent
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.sent}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Accepted Value
              </p>
              <p className="mt-3 text-3xl font-black">
                {formatCurrency(statistics.acceptedValue)}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          {activeQuote ? (
            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-6 print:hidden">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                        Quote Details
                      </p>
                      <h2 className="mt-3 text-3xl font-black">
                        {activeQuote.quoteNumber}
                      </h2>
                    </div>

                    <select
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        updateActiveQuote((quote) => ({
                          ...quote,
                          status: event.target.value as QuoteStatus,
                        }))
                      }
                      value={activeQuote.status}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Quote number
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveQuote((quote) => ({
                            ...quote,
                            quoteNumber: event.target.value,
                          }))
                        }
                        value={activeQuote.quoteNumber}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Issue date
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveQuote((quote) => ({
                            ...quote,
                            issueDate: event.target.value,
                          }))
                        }
                        type="date"
                        value={activeQuote.issueDate}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Expiry date
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveQuote((quote) => ({
                            ...quote,
                            expiryDate: event.target.value,
                          }))
                        }
                        type="date"
                        value={activeQuote.expiryDate}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                    Customer
                  </p>
                  <h2 className="mt-3 text-3xl font-black">
                    Who is this quote for?
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
                            updateActiveQuote((quote) => ({
                              ...quote,
                              customer: {
                                ...quote.customer,
                                [field]: event.target.value,
                              },
                            }))
                          }
                          type={type}
                          value={
                            activeQuote.customer[
                              field as keyof QuoteCustomer
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
                          updateActiveQuote((quote) => ({
                            ...quote,
                            customer: {
                              ...quote.customer,
                              address: event.target.value,
                            },
                          }))
                        }
                        value={activeQuote.customer.address}
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
                        Labour, materials and services.
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
                    {activeQuote.items.map((item, index) => (
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
                            disabled={activeQuote.items.length === 1}
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
                              placeholder="e.g. Labour, materials or service"
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
                          updateActiveQuote((quote) => ({
                            ...quote,
                            discountType: event.target.value as
                              | "fixed"
                              | "percentage",
                          }))
                        }
                        value={activeQuote.discountType}
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
                          updateActiveQuote((quote) => ({
                            ...quote,
                            discountValue: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          }))
                        }
                        step="0.01"
                        type="number"
                        value={activeQuote.discountValue}
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Notes
                      </span>
                      <textarea
                        className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveQuote((quote) => ({
                            ...quote,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Add project notes, exclusions or payment details."
                        value={activeQuote.notes}
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Terms
                      </span>
                      <textarea
                        className="min-h-32 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveQuote((quote) => ({
                            ...quote,
                            terms: event.target.value,
                          }))
                        }
                        value={activeQuote.terms}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:flex-row">
                  <button
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
                    onClick={saveQuote}
                    type="button"
                  >
                    Save Quote
                  </button>

                  <button
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-300 px-6 py-4 font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-950"
                    onClick={printQuote}
                    type="button"
                  >
                    Print / Save PDF
                  </button>

                  <button
                    className="inline-flex flex-1 cursor-not-allowed items-center justify-center rounded-2xl bg-slate-200 px-6 py-4 font-extrabold text-slate-500"
                    disabled
                    type="button"
                  >
                    Convert to Invoice
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
                      <h2 className="mt-2 text-3xl font-black">Quotation</h2>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-extrabold ${statusClasses(
                        activeQuote.status,
                      )}`}
                    >
                      {statusLabel(activeQuote.status)}
                    </span>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Quote number
                      </p>
                      <p className="mt-1 font-black">
                        {activeQuote.quoteNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Issue date
                      </p>
                      <p className="mt-1 font-black">
                        {formatDate(activeQuote.issueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Valid until
                      </p>
                      <p className="mt-1 font-black">
                        {formatDate(activeQuote.expiryDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                      Prepared for
                    </p>
                    <p className="mt-3 text-xl font-black">
                      {activeQuote.customer.name || "Customer name"}
                    </p>
                    {activeQuote.customer.company ? (
                      <p className="mt-1 font-bold text-slate-700">
                        {activeQuote.customer.company}
                      </p>
                    ) : null}
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {activeQuote.customer.address || "Customer address"}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      {activeQuote.customer.email || "Customer email"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {activeQuote.customer.phone || "Customer telephone"}
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
                        {activeQuote.items.map((item) => (
                          <tr className="border-t border-slate-200" key={item.id}>
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
                        <span className="font-black">Total</span>
                        <span className="font-black text-blue-950">
                          {formatCurrency(activeTotals.total)}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {activeQuote.notes ? (
                    <div className="mt-8">
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                        Notes
                      </p>
                      <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">
                        {activeQuote.notes}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                      Terms
                    </p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {activeQuote.terms}
                    </p>
                  </div>

                  <p className="mt-8 rounded-2xl bg-blue-950 px-5 py-4 text-center text-sm font-bold text-blue-100">
                    Built with trust. Guided by purpose.
                  </p>
                </article>
              </aside>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] print:hidden">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Your Quotes
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  Find and manage every quotation.
                </h2>

                <input
                  className="mt-7 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search quote number, customer or status"
                  value={search}
                />

                <div className="mt-6 space-y-4">
                  {filteredQuotes.length > 0 ? (
                    filteredQuotes.map((quote) => {
                      const totals = calculateQuote(quote);

                      return (
                        <article
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                          key={quote.id}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="text-lg font-black">
                                  {quote.quoteNumber}
                                </p>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusClasses(
                                    quote.status,
                                  )}`}
                                >
                                  {statusLabel(quote.status)}
                                </span>
                              </div>

                              <p className="mt-2 font-bold text-slate-700">
                                {quote.customer.name ||
                                  quote.customer.company ||
                                  "Unnamed customer"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Updated {formatDate(quote.updatedAt)}
                              </p>
                            </div>

                            <p className="text-xl font-black text-blue-950">
                              {formatCurrency(totals.total)}
                            </p>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              className="rounded-xl bg-blue-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-blue-900"
                              onClick={() => setActiveQuote(quote)}
                              type="button"
                            >
                              Open
                            </button>
                            <button
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
                              onClick={() => duplicateQuote(quote)}
                              type="button"
                            >
                              Duplicate
                            </button>
                            <button
                              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
                              onClick={() => deleteQuote(quote.id)}
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
                        No quotes found.
                      </p>
                      <p className="mt-2 text-slate-600">
                        Create your first professional quotation.
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
                  📋
                </span>

                <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.25em] text-blue-200">
                  Beacon Quote Builder
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-tight">
                  Turn enquiries into professional opportunities.
                </h2>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                  Add customers, labour, materials, VAT, discounts, notes and
                  terms. Save every quote and print a polished customer-ready
                  version.
                </p>

                <button
                  className="mt-8 inline-flex rounded-2xl bg-amber-400 px-7 py-4 text-lg font-extrabold text-slate-950 transition hover:bg-amber-300"
                  onClick={startNewQuote}
                  type="button"
                >
                  Create New Quote
                </button>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}