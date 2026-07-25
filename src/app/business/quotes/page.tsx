"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CUSTOMERS_STORAGE_KEY,
  SELECTED_CUSTOMER_STORAGE_KEY,
  parseStoredCustomers,
  persistCustomers,
} from "../customers/customerStorage";
import type { CustomerRecord } from "../customers/types";

type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
type CrmQuoteStatus = CustomerRecord["quotes"][number]["status"];
type CrmQuoteSummary = CustomerRecord["quotes"][number];

type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  category?: "labour" | "materials" | "equipment" | "other";
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
  customerId?: string;
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
  aiGenerated: boolean;
  workDescription: string;
  imageNames: string[];
  assumptions: string[];
  warnings: string[];
};

type AiQuoteResponse = {
  title?: string;
  summary?: string;
  items?: Array<{
    description?: string;
    quantity?: number;
    unitPrice?: number;
    vatRate?: number;
    category?: "labour" | "materials" | "equipment" | "other";
  }>;
  notes?: string;
  assumptions?: string[];
  warnings?: string[];
};

type ImagePreview = {
  file: File;
  url: string;
};

type JobStatus =
  | "enquiry"
  | "quoted"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

type JobPriority = "low" | "normal" | "high" | "urgent";

type JobRecord = {
  id: string;
  jobNumber: string;
  title: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  status: JobStatus;
  priority: JobPriority;
  scheduledDate: string;
  scheduledTime: string;
  estimatedHours: number;
  assignedTo: string;
  description: string;
  internalNotes: string;
  quotedValue: number;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  sourceQuoteId?: string;
  sourceQuoteNumber?: string;
};

const QUOTES_STORAGE_KEY = "beacon-business-quotes";
const JOBS_STORAGE_KEY = "beacon-business-jobs";
const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

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

    return parsed
      .filter((quote): quote is QuoteRecord => {
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
      })
      .map((quote) => ({
        ...quote,
        aiGenerated: Boolean(quote.aiGenerated),
        workDescription:
          typeof quote.workDescription === "string"
            ? quote.workDescription
            : "",
        imageNames: Array.isArray(quote.imageNames)
          ? quote.imageNames.filter(
              (name): name is string => typeof name === "string",
            )
          : [],
        assumptions: Array.isArray(quote.assumptions)
          ? quote.assumptions.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
        warnings: Array.isArray(quote.warnings)
          ? quote.warnings.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
      }));
  } catch {
    return [];
  }
}

function parseStoredJobs(raw: string | null): JobRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((job): job is JobRecord => {
      if (!job || typeof job !== "object") {
        return false;
      }

      const candidate = job as Partial<JobRecord>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.jobNumber === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.status === "string" &&
        typeof candidate.priority === "string"
      );
    });
  } catch {
    return [];
  }
}

function nextJobSequence(jobs: JobRecord[]) {
  const year = new Date().getFullYear();
  const prefix = `BJ-${year}-`;

  const highest = jobs.reduce((currentHighest, job) => {
    if (!job.jobNumber.startsWith(prefix)) {
      return currentHighest;
    }

    const value = Number(job.jobNumber.slice(prefix.length));

    return Number.isFinite(value)
      ? Math.max(currentHighest, value)
      : currentHighest;
  }, 0);

  return highest + 1;
}

function quoteJobTitle(quote: QuoteRecord) {
  const description = quote.workDescription.trim();

  if (description) {
    const firstLine = description.split(/\r?\n/)[0].trim();

    if (firstLine.length <= 90) {
      return firstLine;
    }

    return `${firstLine.slice(0, 87).trim()}...`;
  }

  const firstItem = quote.items.find((item) => item.description.trim());

  if (firstItem) {
    return firstItem.description.trim().slice(0, 90);
  }

  return `Job from ${quote.quoteNumber}`;
}

function quoteJobDescription(quote: QuoteRecord) {
  const itemSummary = quote.items
    .filter((item) => item.description.trim())
    .map(
      (item) =>
        `${item.quantity} × ${item.description.trim()} at ${formatCurrency(
          item.unitPrice,
        )} + ${item.vatRate}% VAT`,
    )
    .join("\n");

  return [
    quote.workDescription.trim(),
    itemSummary ? `Quoted work:\n${itemSummary}` : "",
    quote.notes.trim() ? `Quote notes:\n${quote.notes.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
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

function nextQuoteSequence(quotes: QuoteRecord[]) {
  const year = new Date().getFullYear();
  const prefix = `BQ-${year}-`;

  const highest = quotes.reduce((currentHighest, quote) => {
    if (!quote.quoteNumber.startsWith(prefix)) {
      return currentHighest;
    }

    const value = Number(quote.quoteNumber.slice(prefix.length));

    return Number.isFinite(value)
      ? Math.max(currentHighest, value)
      : currentHighest;
  }, 0);

  return highest + 1;
}

function createNewQuote(
  sequence: number,
  options?: {
    workDescription?: string;
    imageNames?: string[];
    customer?: CustomerRecord | null;
  },
): QuoteRecord {
  const now = new Date().toISOString();

  return {
    id: createId("quote"),
    quoteNumber: `BQ-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`,
    createdAt: now,
    issueDate: todayIso(),
    expiryDate: addDaysIso(30),
    status: "draft",
    customerId: options?.customer?.id,
    customer: options?.customer
      ? {
          name: options.customer.name,
          company: options.customer.company,
          email: options.customer.email,
          phone: options.customer.phone,
          address: options.customer.address,
        }
      : { ...emptyCustomer },
    items: [
      {
        id: createId("item"),
        description: "",
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
        category: "other",
      },
    ],
    discountType: "fixed",
    discountValue: 0,
    notes: "",
    terms:
      "This quotation is valid until the expiry date shown. Work will begin once the quotation is accepted and any agreed deposit is received. Final pricing remains subject to an on-site inspection where required.",
    updatedAt: now,
    aiGenerated: false,
    workDescription: options?.workDescription ?? "",
    imageNames: options?.imageNames ?? [],
    assumptions: [],
    warnings: [],
  };
}

function normaliseAiItems(items: AiQuoteResponse["items"]): QuoteItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items
    .filter((item) => item && typeof item.description === "string")
    .map((item) => ({
      id: createId("item"),
      description: item.description?.trim() || "Quoted work",
      quantity: Math.max(0, Number(item.quantity) || 1),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0),
      vatRate: Math.max(0, Number(item.vatRate) || 0),
      category: item.category ?? "other",
    }));
}

function customerQuoteStatus(status: QuoteStatus): CrmQuoteStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "sent":
      return "sent";
    case "accepted":
      return "accepted";
    case "declined":
      return "rejected";
    case "expired":
      return "expired";
  }
}

function customerJobStatus(status: JobStatus) {
  switch (status) {
    case "completed":
      return "completed" as const;
    case "cancelled":
      return "cancelled" as const;
    case "in_progress":
      return "in_progress" as const;
    default:
      return "booked" as const;
  }
}

function findLinkedCustomer(
  customers: CustomerRecord[],
  quote: QuoteRecord,
): CustomerRecord | null {
  if (quote.customerId) {
    const byId = customers.find(
      (customer) => customer.id === quote.customerId,
    );

    if (byId) return byId;
  }

  const email = quote.customer.email.trim().toLowerCase();

  if (email) {
    const byEmail = customers.find(
      (customer) => customer.email.trim().toLowerCase() === email,
    );

    if (byEmail) return byEmail;
  }

  const name = quote.customer.name.trim().toLowerCase();
  const company = quote.customer.company.trim().toLowerCase();

  return (
    customers.find((customer) => {
      const sameName =
        name &&
        customer.name.trim().toLowerCase() === name;
      const sameCompany =
        company &&
        customer.company.trim().toLowerCase() === company;

      return Boolean(sameName && (!company || sameCompany));
    }) ?? null
  );
}

function quoteTimelineTitle(
  quoteNumber: string,
  status: QuoteStatus,
  isNew: boolean,
) {
  if (isNew) return `Quote ${quoteNumber} created`;

  switch (status) {
    case "sent":
      return `Quote ${quoteNumber} sent`;
    case "accepted":
      return `Quote ${quoteNumber} accepted`;
    case "declined":
      return `Quote ${quoteNumber} declined`;
    case "expired":
      return `Quote ${quoteNumber} expired`;
    default:
      return `Quote ${quoteNumber} updated`;
  }
}

function syncQuoteToCustomer(quote: QuoteRecord): string | undefined {
  const customers = parseStoredCustomers(
    window.localStorage.getItem(CUSTOMERS_STORAGE_KEY),
  );
  const customer = findLinkedCustomer(customers, quote);

  if (!customer) {
    return quote.customerId;
  }

  const totals = calculateQuote(quote);
  const existingSummary = customer.quotes.find(
    (item) => item.id === quote.id,
  );
  const nextStatus: CrmQuoteStatus = customerQuoteStatus(quote.status);
  const statusChanged =
    existingSummary !== undefined &&
    existingSummary.status !== nextStatus;
  const now = new Date().toISOString();

  const quoteSummary: CrmQuoteSummary = {
    id: quote.id,
    title:
      quote.workDescription.trim().split(/\r?\n/)[0]?.slice(0, 90) ||
      quote.items.find((item) => item.description.trim())?.description ||
      quote.quoteNumber,
    total: totals.total,
    status: nextStatus,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };

  const nextQuotes: CustomerRecord["quotes"] = existingSummary
    ? customer.quotes.map(
        (item): CrmQuoteSummary =>
          item.id === quote.id ? quoteSummary : item,
      )
    : [quoteSummary, ...customer.quotes];

  const timeline: CustomerRecord["timeline"] = [...customer.timeline];

  if (!existingSummary || statusChanged) {
    timeline.unshift({
      id: createId("timeline"),
      type: "quote",
      title: quoteTimelineTitle(
        quote.quoteNumber,
        quote.status,
        !existingSummary,
      ),
      detail: `${formatCurrency(
        totals.total,
      )} quotation linked to this customer.`,
      createdAt: now,
    });
  }

  const updatedCustomer: CustomerRecord = {
    ...customer,
    status:
      quote.status === "accepted" && customer.status === "lead"
        ? "active"
        : customer.status,
    updatedAt: now,
    lastContactAt:
      quote.status === "sent" ||
      quote.status === "accepted" ||
      quote.status === "declined"
        ? now
        : customer.lastContactAt,
    quotes: nextQuotes,
    timeline,
  };

  const nextCustomers: CustomerRecord[] = customers.map(
    (item): CustomerRecord =>
      item.id === updatedCustomer.id ? updatedCustomer : item,
  );

  persistCustomers(nextCustomers);

  return updatedCustomer.id;
}

function removeQuoteFromCustomer(quote: QuoteRecord) {
  const customers = parseStoredCustomers(
    window.localStorage.getItem(CUSTOMERS_STORAGE_KEY),
  );
  const customer = findLinkedCustomer(customers, quote);

  if (!customer) return;

  const now = new Date().toISOString();
  const updatedCustomer: CustomerRecord = {
    ...customer,
    updatedAt: now,
    quotes: customer.quotes.filter((item) => item.id !== quote.id),
    timeline: [
      {
        id: createId("timeline"),
        type: "quote",
        title: `Quote ${quote.quoteNumber} deleted`,
        detail: "The quotation was removed from Beacon Quotes.",
        createdAt: now,
      },
      ...customer.timeline,
    ],
  };

  persistCustomers(
    customers.map((item) =>
      item.id === updatedCustomer.id ? updatedCustomer : item,
    ),
  );
}

function syncJobToCustomer(quote: QuoteRecord, job: JobRecord) {
  const customers = parseStoredCustomers(
    window.localStorage.getItem(CUSTOMERS_STORAGE_KEY),
  );
  const customer = findLinkedCustomer(customers, quote);

  if (!customer) return;

  const now = new Date().toISOString();
  const existingJob = customer.jobs.find((item) => item.id === job.id);
  const jobSummary = {
    id: job.id,
    title: job.title,
    status: customerJobStatus(job.status),
    startDate: job.scheduledDate,
    completedAt: job.completedAt ?? undefined,
    value: job.quotedValue,
  };

  const updatedCustomer: CustomerRecord = {
    ...customer,
    status: customer.status === "lead" ? "active" : customer.status,
    updatedAt: now,
    jobs: existingJob
      ? customer.jobs.map((item) =>
          item.id === job.id ? jobSummary : item,
        )
      : [jobSummary, ...customer.jobs],
    timeline: existingJob
      ? customer.timeline
      : [
          {
            id: createId("timeline"),
            type: "job",
            title: `Job ${job.jobNumber} created`,
            detail: `${job.title} was created from ${quote.quoteNumber}.`,
            createdAt: now,
          },
          ...customer.timeline,
        ],
  };

  persistCustomers(
    customers.map((item) =>
      item.id === updatedCustomer.id ? updatedCustomer : item,
    ),
  );
}

export default function BusinessQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [activeQuote, setActiveQuote] = useState<QuoteRecord | null>(null);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);

  const [workDescription, setWorkDescription] = useState("");
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = parseStoredQuotes(
      window.localStorage.getItem(QUOTES_STORAGE_KEY),
    );
    const selectedCustomerId = window.localStorage.getItem(
      SELECTED_CUSTOMER_STORAGE_KEY,
    );
    const customers = parseStoredCustomers(
      window.localStorage.getItem(CUSTOMERS_STORAGE_KEY),
    );
    const customer =
      customers.find((item) => item.id === selectedCustomerId) ?? null;

    setQuotes(stored);
    setSelectedCustomer(customer);

    if (customer) {
      setActiveQuote(
        createNewQuote(nextQuoteSequence(stored), {
          customer,
        }),
      );
      window.localStorage.removeItem(SELECTED_CUSTOMER_STORAGE_KEY);
    }

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

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

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
        quote.workDescription,
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

  function clearImagePreviews() {
    setImagePreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));
      return [];
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startNewQuote() {
    setActiveQuote(null);
    setWorkDescription("");
    clearImagePreviews();
    setGenerationError(null);
    setSavedMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startManualQuote() {
    const quote = createNewQuote(nextQuoteSequence(quotes), {
      customer: selectedCustomer,
    });
    setActiveQuote(quote);
    setGenerationError(null);
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

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    setGenerationError(null);

    const selected = Array.from(event.target.files ?? []);

    if (selected.length === 0) {
      return;
    }

    const remainingSpaces = Math.max(0, MAX_IMAGES - imagePreviews.length);
    const accepted = selected.slice(0, remainingSpaces);

    const invalidFile = accepted.find(
      (file) =>
        !file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE_BYTES,
    );

    if (invalidFile) {
      setGenerationError(
        "Each upload must be an image smaller than 8 MB.",
      );
      event.target.value = "";
      return;
    }

    if (selected.length > remainingSpaces) {
      setGenerationError(`You can upload up to ${MAX_IMAGES} images.`);
    }

    setImagePreviews((current) => [
      ...current,
      ...accepted.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    ]);

    event.target.value = "";
  }

  function removeImage(index: number) {
    setImagePreviews((current) => {
      const target = current[index];

      if (target) {
        URL.revokeObjectURL(target.url);
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function generateQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const description = workDescription.trim();

    if (description.length < 20) {
      setGenerationError(
        "Describe the work in a little more detail before generating the quote.",
      );
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    setSavedMessage(null);

    try {
      const formData = new FormData();
      formData.append("description", description);

      imagePreviews.forEach(({ file }) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/business/quotes/generate", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | (AiQuoteResponse & { error?: string })
        | null;

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Beacon could not generate this quote. Please try again.",
        );
      }

      const items = normaliseAiItems(data?.items);

      if (items.length === 0) {
        throw new Error(
          "Beacon could not identify enough information to create line items. Add more detail or clearer images.",
        );
      }

      const quote = createNewQuote(nextQuoteSequence(quotes), {
        workDescription: description,
        imageNames: imagePreviews.map(({ file }) => file.name),
        customer: selectedCustomer,
      });

      quote.items = items;
      quote.aiGenerated = true;
      quote.notes =
        data?.notes?.trim() ||
        "AI-generated draft based on the supplied description and images. Review labour, materials, quantities and prices before sending.";
      quote.assumptions = Array.isArray(data?.assumptions)
        ? data.assumptions.filter(
            (value): value is string => typeof value === "string",
          )
        : [];
      quote.warnings = Array.isArray(data?.warnings)
        ? data.warnings.filter(
            (value): value is string => typeof value === "string",
          )
        : [];
      quote.updatedAt = new Date().toISOString();

      setActiveQuote(quote);
      setSavedMessage(
        "AI draft generated. Review every item and price before saving.",
      );
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Beacon could not generate this quote.",
      );
    } finally {
      setGenerating(false);
    }
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

    const linkedCustomerId = syncQuoteToCustomer(normalisedQuote);
    normalisedQuote.customerId = linkedCustomerId;

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
    const quote = quotes.find((item) => item.id === id);

    if (quote) {
      removeQuoteFromCustomer(quote);
    }

    setQuotes((current) => current.filter((item) => item.id !== id));

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
        nextQuoteSequence(quotes),
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
          category: "other",
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
                field === "description" || field === "category"
                  ? value
                  : Math.max(0, Number(value) || 0),
            }
          : item,
      ),
    }));
  }

  function convertQuoteToJob() {
    if (!activeQuote) {
      return;
    }

    if (activeQuote.status !== "accepted") {
      setSavedMessage(
        "Mark the quote as accepted before converting it into a job.",
      );
      return;
    }

    const storedJobs = parseStoredJobs(
      window.localStorage.getItem(JOBS_STORAGE_KEY),
    );

    const existingJob = storedJobs.find(
      (job) => job.sourceQuoteId === activeQuote.id,
    );

    if (existingJob) {
      setSavedMessage(
        `${activeQuote.quoteNumber} has already been converted to ${existingJob.jobNumber}.`,
      );
      return;
    }

    const now = new Date().toISOString();
    const totals = calculateQuote(activeQuote);
    const labourHours = activeQuote.items
      .filter((item) => item.category === "labour")
      .reduce((sum, item) => sum + Math.max(0, item.quantity), 0);

    const job: JobRecord = {
      id: createId("job"),
      jobNumber: `BJ-${new Date().getFullYear()}-${String(
        nextJobSequence(storedJobs),
      ).padStart(4, "0")}`,
      title: quoteJobTitle(activeQuote),
      customerName: activeQuote.customer.name.trim(),
      customerCompany: activeQuote.customer.company.trim(),
      customerEmail: activeQuote.customer.email.trim(),
      customerPhone: activeQuote.customer.phone.trim(),
      address: activeQuote.customer.address.trim(),
      status: "scheduled",
      priority: "normal",
      scheduledDate: todayIso(),
      scheduledTime: "09:00",
      estimatedHours: labourHours > 0 ? labourHours : 1,
      assignedTo: "",
      description: quoteJobDescription(activeQuote),
      internalNotes: [
        `Created automatically from accepted quote ${activeQuote.quoteNumber}.`,
        activeQuote.assumptions.length
          ? `Assumptions:\n${activeQuote.assumptions
              .map((item) => `- ${item}`)
              .join("\n")}`
          : "",
        activeQuote.warnings.length
          ? `Warnings and checks:\n${activeQuote.warnings
              .map((item) => `- ${item}`)
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      quotedValue: totals.total,
      invoiceNumber: "",
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      sourceQuoteId: activeQuote.id,
      sourceQuoteNumber: activeQuote.quoteNumber,
    };

    window.localStorage.setItem(
      JOBS_STORAGE_KEY,
      JSON.stringify([job, ...storedJobs]),
    );

    syncJobToCustomer(activeQuote, job);
    saveQuote();
    setSavedMessage(
      `${activeQuote.quoteNumber} converted to ${job.jobNumber}. Opening Jobs...`,
    );

    window.setTimeout(() => {
      router.push("/business/jobs");
    }, 700);
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
                Beacon AI Quotes
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Describe the work. Add photos. Generate the quote.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                Beacon analyses the job description and supporting images,
                prepares editable labour and material line items, and flags
                anything that still needs an on-site check.
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
                + New AI Quote
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
                {activeQuote.customerId ? (
                  <article className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                    <p className="font-black text-emerald-900">
                      Connected to Customer CRM
                    </p>
                    <p className="mt-2 leading-7 text-emerald-800">
                      Saving this quote will update the customer profile,
                      quote history, activity timeline and customer analytics.
                    </p>
                  </article>
                ) : null}

                {activeQuote.aiGenerated ? (
                  <article className="rounded-[2rem] border border-amber-300 bg-amber-50 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-2xl"
                      >
                        ✨
                      </span>

                      <div>
                        <p className="font-black text-slate-950">
                          AI-generated draft
                        </p>
                        <p className="mt-2 leading-7 text-slate-700">
                          Beacon has prepared this quote from the supplied
                          description and images. Review all quantities, labour,
                          material prices, VAT and exclusions before sending it
                          to the customer.
                        </p>
                      </div>
                    </div>
                  </article>
                ) : null}

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

                {activeQuote.workDescription ? (
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                    <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                      Source Information
                    </p>
                    <h2 className="mt-3 text-3xl font-black">
                      What Beacon analysed.
                    </h2>

                    <p className="mt-5 whitespace-pre-line rounded-2xl bg-slate-50 p-5 leading-7 text-slate-700">
                      {activeQuote.workDescription}
                    </p>

                    {activeQuote.imageNames.length > 0 ? (
                      <div className="mt-5">
                        <p className="text-sm font-bold text-slate-600">
                          Images supplied
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeQuote.imageNames.map((name) => (
                            <span
                              className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-900"
                              key={name}
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

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
                        AI Quote Items
                      </p>
                      <h2 className="mt-3 text-3xl font-black">
                        Review labour, materials and services.
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

                        <div className="mt-4 grid gap-4 xl:grid-cols-[140px_minmax(0,1fr)_100px_145px_100px]">
                          <label className="space-y-2">
                            <span className="text-sm font-bold text-slate-700">
                              Category
                            </span>
                            <select
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                              onChange={(event) =>
                                updateItem(
                                  item.id,
                                  "category",
                                  event.target.value,
                                )
                              }
                              value={item.category ?? "other"}
                            >
                              <option value="labour">Labour</option>
                              <option value="materials">Materials</option>
                              <option value="equipment">Equipment</option>
                              <option value="other">Other</option>
                            </select>
                          </label>

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
                              placeholder="Labour, materials or service"
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

                {activeQuote.assumptions.length > 0 ||
                activeQuote.warnings.length > 0 ? (
                  <div className="grid gap-5 lg:grid-cols-2">
                    <article className="rounded-[2rem] border border-blue-200 bg-blue-50 p-6">
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                        AI Assumptions
                      </p>
                      <ul className="mt-4 space-y-3">
                        {activeQuote.assumptions.length > 0 ? (
                          activeQuote.assumptions.map((assumption) => (
                            <li
                              className="flex gap-3 leading-7 text-slate-700"
                              key={assumption}
                            >
                              <span aria-hidden="true">•</span>
                              <span>{assumption}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-600">
                            No assumptions were returned.
                          </li>
                        )}
                      </ul>
                    </article>

                    <article className="rounded-[2rem] border border-amber-300 bg-amber-50 p-6">
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-amber-900">
                        Checks Required
                      </p>
                      <ul className="mt-4 space-y-3">
                        {activeQuote.warnings.length > 0 ? (
                          activeQuote.warnings.map((warning) => (
                            <li
                              className="flex gap-3 leading-7 text-slate-700"
                              key={warning}
                            >
                              <span aria-hidden="true">⚠</span>
                              <span>{warning}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-600">
                            No additional checks were returned.
                          </li>
                        )}
                      </ul>
                    </article>
                  </div>
                ) : null}

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
                    className={`inline-flex flex-1 items-center justify-center rounded-2xl px-6 py-4 font-extrabold transition ${
                      activeQuote.status === "accepted"
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "cursor-not-allowed bg-slate-200 text-slate-500"
                    }`}
                    disabled={activeQuote.status !== "accepted"}
                    onClick={convertQuoteToJob}
                    title={
                      activeQuote.status === "accepted"
                        ? "Create a scheduled job from this quote"
                        : "Mark this quote as accepted first"
                    }
                    type="button"
                  >
                    Convert to Job
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
            <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] print:hidden">
              <section className="space-y-8">
                {selectedCustomer ? (
                  <article className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">
                      Customer selected
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      {selectedCustomer.name ||
                        selectedCustomer.company ||
                        "CRM customer"}
                    </p>
                    <p className="mt-2 text-slate-700">
                      Their contact details will be added automatically to the
                      next AI or manual quote.
                    </p>
                  </article>
                ) : null}

                <form
                  className="rounded-[2rem] border border-blue-200 bg-white p-7 shadow-2xl sm:p-9"
                  onSubmit={generateQuote}
                >
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-2xl text-white"
                    >
                      ✨
                    </span>

                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                        AI Quote Generator
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight">
                        Tell Beacon what work is needed.
                      </h2>
                    </div>
                  </div>

                  <label className="mt-8 block space-y-3">
                    <span className="font-black text-slate-800">
                      Describe the job
                    </span>
                    <textarea
                      className="min-h-52 w-full rounded-2xl border border-slate-300 px-5 py-4 text-base leading-7 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        setWorkDescription(event.target.value)
                      }
                      placeholder="Example: Remove the damaged plaster from a 3 metre by 2.4 metre bedroom wall, repair the cracked section, apply two coats of plaster, protect the flooring and remove all waste. Access is through one flight of stairs."
                      value={workDescription}
                    />
                  </label>

                  <div className="mt-7">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="font-black text-slate-800">
                          Add photos of the work
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Upload up to {MAX_IMAGES} clear images. Each image must
                          be smaller than 8 MB.
                        </p>
                      </div>

                      <button
                        className="inline-flex items-center justify-center rounded-2xl border-2 border-blue-950 px-5 py-3 font-extrabold text-blue-950 transition hover:bg-blue-950 hover:text-white"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        + Add images
                      </button>
                    </div>

                    <input
                      accept="image/*"
                      className="sr-only"
                      multiple
                      onChange={handleImageSelection}
                      ref={fileInputRef}
                      type="file"
                    />

                    {imagePreviews.length > 0 ? (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {imagePreviews.map((preview, index) => (
                          <div
                            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                            key={`${preview.file.name}-${index}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={`Work upload ${index + 1}`}
                              className="h-40 w-full object-cover"
                              src={preview.url}
                            />
                            <div className="flex items-center justify-between gap-3 p-3">
                              <p className="min-w-0 truncate text-sm font-bold text-slate-700">
                                {preview.file.name}
                              </p>
                              <button
                                className="shrink-0 text-sm font-extrabold text-rose-700 hover:text-rose-900"
                                onClick={() => removeImage(index)}
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        className="mt-5 flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        <span aria-hidden="true" className="text-3xl">
                          📷
                        </span>
                        <span className="mt-3 font-black text-slate-800">
                          Upload images of the work area
                        </span>
                        <span className="mt-1 text-sm text-slate-600">
                          Images are optional, but they help Beacon identify
                          visible damage, access issues and likely materials.
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="mt-7 rounded-2xl border border-amber-300 bg-amber-50 p-5">
                    <p className="font-black text-amber-950">
                      AI quotes must be reviewed
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Photos cannot reveal hidden damage, exact measurements,
                      structural issues or local material prices. Beacon creates
                      an editable draft—not a guaranteed final price.
                    </p>
                  </div>

                  {generationError ? (
                    <p
                      className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 font-bold text-rose-800"
                      role="alert"
                    >
                      {generationError}
                    </p>
                  ) : null}

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-950 px-7 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={generating}
                      type="submit"
                    >
                      {generating
                        ? "Beacon is analysing the job..."
                        : "Generate AI Quote"}
                    </button>

                    <button
                      className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-300 px-6 py-4 font-extrabold text-slate-700 transition hover:border-blue-500 hover:text-blue-950"
                      disabled={generating}
                      onClick={startManualQuote}
                      type="button"
                    >
                      Create manually
                    </button>
                  </div>
                </form>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                    How it works
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        number: "1",
                        title: "Describe",
                        description:
                          "Explain the work, measurements, access and finish required.",
                      },
                      {
                        number: "2",
                        title: "Upload",
                        description:
                          "Add clear images showing the work area and visible damage.",
                      },
                      {
                        number: "3",
                        title: "Review",
                        description:
                          "Check Beacon's labour, materials, assumptions and price.",
                      },
                    ].map((step) => (
                      <article
                        className="rounded-2xl bg-slate-50 p-5"
                        key={step.number}
                      >
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-950 font-black text-white">
                          {step.number}
                        </span>
                        <p className="mt-4 font-black text-slate-950">
                          {step.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {step.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              </section>

              <section className="h-fit rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl xl:sticky xl:top-6">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Saved Quotes
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  Find and manage every quotation.
                </h2>

                <input
                  className="mt-7 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search quote, customer, job or status"
                  value={search}
                />

                <div className="mt-6 max-h-[760px] space-y-4 overflow-y-auto pr-1">
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
                                {quote.aiGenerated ? (
                                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-800">
                                    AI
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-2 font-bold text-slate-700">
                                {quote.customer.name ||
                                  quote.customer.company ||
                                  quote.workDescription.slice(0, 70) ||
                                  "Unnamed quote"}
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
                        Describe your first job and let Beacon prepare the draft.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}