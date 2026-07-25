export type CustomerStatus = "active" | "lead" | "returning" | "inactive";
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type JobStatus = "booked" | "in_progress" | "completed" | "cancelled";
export type InvoiceStatus = "draft" | "sent" | "overdue" | "paid" | "cancelled";
export type TimelineEventType =
  | "customer"
  | "quote"
  | "job"
  | "invoice"
  | "document"
  | "follow_up"
  | "note";

export type QuoteSummary = {
  id: string;
  title: string;
  total: number;
  status: QuoteStatus;
  createdAt: string;
  updatedAt?: string;
};

export type JobSummary = {
  id: string;
  title: string;
  status: JobStatus;
  startDate?: string;
  completedAt?: string;
  value?: number;
};

export type InvoiceSummary = {
  id: string;
  reference: string;
  total: number;
  status: InvoiceStatus;
  createdAt: string;
  dueDate?: string;
  paidAt?: string;
};

export type CustomerDocument = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  href?: string;
};

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  detail?: string;
  createdAt: string;
};

export type CustomerRecord = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  rating: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
  quotes: QuoteSummary[];
  jobs: JobSummary[];
  invoices: InvoiceSummary[];
  documents: CustomerDocument[];
  timeline: TimelineEvent[];
};

export type CustomerFinancials = {
  lifetimeValue: number;
  outstandingBalance: number;
  acceptedQuotes: number;
  completedJobs: number;
};