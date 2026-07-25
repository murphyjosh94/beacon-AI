import type {
  CustomerRecord,
  CustomerStatus,
  TimelineEvent,
} from "./types";

export const CUSTOMERS_STORAGE_KEY = "beacon-business-customers";
export const SELECTED_CUSTOMER_STORAGE_KEY =
  "beacon-business-selected-customer";

export function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isCustomerStatus(value: unknown): value is CustomerStatus {
  return (
    value === "active" ||
    value === "lead" ||
    value === "returning" ||
    value === "inactive"
  );
}

export function createNewCustomer(): CustomerRecord {
  const now = new Date().toISOString();

  return {
    id: createId("customer"),
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    status: "lead",
    rating: 0,
    notes: "",
    createdAt: now,
    updatedAt: now,
    lastContactAt: now,
    quotes: [],
    jobs: [],
    invoices: [],
    documents: [],
    timeline: [
      {
        id: createId("timeline"),
        type: "customer",
        title: "Customer record created",
        detail: "Added to Beacon Business Customers.",
        createdAt: now,
      },
    ],
  };
}

export function normaliseCustomer(value: unknown): CustomerRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<CustomerRecord>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.email !== "string"
  ) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt =
    typeof candidate.createdAt === "string" ? candidate.createdAt : now;
  const updatedAt =
    typeof candidate.updatedAt === "string" ? candidate.updatedAt : createdAt;

  const timeline: TimelineEvent[] = Array.isArray(candidate.timeline)
    ? candidate.timeline
    : [
        {
          id: createId("timeline"),
          type: "customer",
          title: "Customer record imported",
          detail: "Existing customer upgraded to the connected CRM format.",
          createdAt,
        },
      ];

  return {
    id: candidate.id,
    name: candidate.name,
    company:
      typeof candidate.company === "string" ? candidate.company : "",
    email: candidate.email,
    phone: typeof candidate.phone === "string" ? candidate.phone : "",
    address:
      typeof candidate.address === "string" ? candidate.address : "",
    status: isCustomerStatus(candidate.status)
      ? candidate.status
      : "lead",
    rating:
      typeof candidate.rating === "number"
        ? Math.min(5, Math.max(0, candidate.rating))
        : 0,
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
    createdAt,
    updatedAt,
    lastContactAt:
      typeof candidate.lastContactAt === "string"
        ? candidate.lastContactAt
        : updatedAt,
    quotes: Array.isArray(candidate.quotes) ? candidate.quotes : [],
    jobs: Array.isArray(candidate.jobs) ? candidate.jobs : [],
    invoices: Array.isArray(candidate.invoices)
      ? candidate.invoices
      : [],
    documents: Array.isArray(candidate.documents)
      ? candidate.documents
      : [],
    timeline,
  };
}

export function parseStoredCustomers(raw: string | null): CustomerRecord[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normaliseCustomer)
      .filter((customer): customer is CustomerRecord => Boolean(customer));
  } catch {
    return [];
  }
}

export function persistCustomers(customers: CustomerRecord[]) {
  window.localStorage.setItem(
    CUSTOMERS_STORAGE_KEY,
    JSON.stringify(customers),
  );
  window.dispatchEvent(new Event("beacon-customers-updated"));
}