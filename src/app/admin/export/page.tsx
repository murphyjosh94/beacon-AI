import type { ReactNode } from "react";

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq, sql } from "drizzle-orm";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import DashboardSignOutButton from "@/components/dashboard/DashboardSignOutButton";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";
import { user } from "@/lib/database/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type ExportDefinition = {
  id: string;
  title: string;
  description: string;
  filename: string;
  count: number;
  icon: string;
  supportsDateRange: boolean;
};

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  accentClass: string;
};

type SectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

type CountRow = {
  total: number | string;
};

type ExportCounts = {
  users: number;
  subscriptions: number;
  searches: number;
  savedSearches: number;
  ledgerEntries: number;
  webhookEvents: number;
  auditEvents: number;
  failedSearches: number;
};

function rowsFromResult<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "rows" in result &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows;
  }

  return [];
}

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(value);
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Administrator";
}

function isValidDate(value: string): boolean {
  if (!value) {
    return true;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}

async function requireAdministrator(): Promise<{
  id: string;
  name: string;
  email: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/signin?next=/admin/export");
  }

  const rows = await database
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const administrator = rows[0];

  if (!administrator || administrator.role !== "admin") {
    redirect("/dashboard");
  }

  return {
    id: administrator.id,
    name: administrator.name,
    email: administrator.email,
  };
}

async function safeCount(query: ReturnType<typeof sql>): Promise<number> {
  try {
    const result = await database.execute(query);
    const row = rowsFromResult<CountRow>(result)[0];
    return Number(row?.total ?? 0);
  } catch {
    return 0;
  }
}

async function readExportCounts(): Promise<ExportCounts> {
  const [
    users,
    subscriptions,
    searches,
    savedSearches,
    ledgerEntries,
    webhookEvents,
    auditEvents,
    failedSearches,
  ] = await Promise.all([
    safeCount(sql`
      select count(*)::int as total
      from "user"
    `),

    safeCount(sql`
      select count(*)::int as total
      from "user"
      where
        stripe_customer_id is not null
        or stripe_subscription_id is not null
        or beacon_plus_active = true
    `),

    safeCount(sql`
      select count(*)::int as total
      from search_history
    `),

    safeCount(sql`
      select count(*)::int as total
      from saved_search
    `),

    safeCount(sql`
      select count(*)::int as total
      from credit_ledger
    `),

    safeCount(sql`
      select count(*)::int as total
      from stripe_webhook_event
    `),

    safeCount(sql`
      select count(*)::int as total
      from beacon_admin_audit_log
    `),

    safeCount(sql`
      select count(*)::int as total
      from search_history
      where status = 'failed'
    `),
  ]);

  return {
    users,
    subscriptions,
    searches,
    savedSearches,
    ledgerEntries,
    webhookEvents,
    auditEvents,
    failedSearches,
  };
}

export default async function AdminExportPage({
  searchParams,
}: PageProps) {
  const administrator = await requireAdministrator();
  const params = (await searchParams) ?? {};

  const from = readSearchParam(params, "from");
  const to = readSearchParam(params, "to");
  const format = readSearchParam(params, "format") || "csv";

  const dateRangeIsValid = isValidDate(from) && isValidDate(to);
  const dateOrderIsValid =
    !from ||
    !to ||
    new Date(`${from}T00:00:00.000Z`) <=
      new Date(`${to}T23:59:59.999Z`);

  const filtersAreValid = dateRangeIsValid && dateOrderIsValid;

  const counts = await readExportCounts();

  const exports: ExportDefinition[] = [
    {
      id: "users",
      title: "Users",
      description:
        "Account identity, role, verification, credit balance and membership fields.",
      filename: "beacon-users",
      count: counts.users,
      icon: "👤",
      supportsDateRange: true,
    },
    {
      id: "subscriptions",
      title: "Beacon+ subscriptions",
      description:
        "Beacon+ state, Stripe customer IDs, subscription IDs, status and renewal dates.",
      filename: "beacon-subscriptions",
      count: counts.subscriptions,
      icon: "◇",
      supportsDateRange: true,
    },
    {
      id: "search-history",
      title: "Search history",
      description:
        "Search queries, categories, result status, timestamps and associated users.",
      filename: "beacon-search-history",
      count: counts.searches,
      icon: "⌕",
      supportsDateRange: true,
    },
    {
      id: "saved-searches",
      title: "Saved searches",
      description:
        "Saved user searches and their creation or modification information.",
      filename: "beacon-saved-searches",
      count: counts.savedSearches,
      icon: "★",
      supportsDateRange: true,
    },
    {
      id: "credit-ledger",
      title: "Credit ledger",
      description:
        "Credit additions, deductions, reasons, balances and related user records.",
      filename: "beacon-credit-ledger",
      count: counts.ledgerEntries,
      icon: "＋",
      supportsDateRange: true,
    },
    {
      id: "stripe-webhooks",
      title: "Stripe webhook events",
      description:
        "Stripe event identifiers, event types, processing status and errors.",
      filename: "beacon-stripe-webhooks",
      count: counts.webhookEvents,
      icon: "↻",
      supportsDateRange: true,
    },
    {
      id: "audit-log",
      title: "Admin audit log",
      description:
        "Administrative activity, actors, target users, actions and metadata.",
      filename: "beacon-admin-audit-log",
      count: counts.auditEvents,
      icon: "✓",
      supportsDateRange: true,
    },
    {
      id: "failed-searches",
      title: "Failed searches",
      description:
        "A focused diagnostic export of search records with a failed status.",
      filename: "beacon-failed-searches",
      count: counts.failedSearches,
      icon: "!",
      supportsDateRange: true,
    },
  ];

  const totalExportableRows = exports.reduce(
    (total, item) => total + item.count,
    0
  );

  const dateRangeLabel =
    from && to
      ? `${formatDate(new Date(`${from}T00:00:00.000Z`))} to ${formatDate(
          new Date(`${to}T00:00:00.000Z`)
        )}`
      : from
        ? `From ${formatDate(new Date(`${from}T00:00:00.000Z`))}`
        : to
          ? `Up to ${formatDate(new Date(`${to}T00:00:00.000Z`))}`
          : "All available dates";

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-10 text-white sm:py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-200 transition hover:text-white"
              >
                ← Back to admin dashboard
              </Link>

              <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.28em] text-violet-200">
                Beacon Administration
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Export Center
              </h1>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-200">
                Generate accessible CSV reports for users, subscriptions,
                searches, credits, Stripe events and administrative activity.
              </p>
            </div>

            <DashboardSignOutButton />
          </div>

          <p className="mt-8 text-sm font-semibold text-slate-300">
            Signed in as{" "}
            <span className="font-black text-white">
              {getFirstName(administrator.name)}
            </span>
          </p>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Export types"
              value={formatNumber(exports.length)}
              detail="Available report categories"
              accentClass="from-violet-700 to-violet-950"
            />

            <MetricCard
              label="Exportable rows"
              value={formatNumber(totalExportableRows)}
              detail="Current combined row count"
              accentClass="from-blue-700 to-blue-950"
            />

            <MetricCard
              label="Selected format"
              value={format.toUpperCase()}
              detail="CSV is recommended for compatibility"
              accentClass="from-emerald-700 to-emerald-950"
            />

            <MetricCard
              label="Date range"
              value={from || to ? "Filtered" : "All time"}
              detail={dateRangeLabel}
              accentClass="from-amber-600 to-red-900"
            />
          </div>

          <Section
            eyebrow="Filters"
            title="Report options"
            description="Choose a date range before selecting an export. Blank dates include all available records."
          >
            <form
              method="get"
              action="/admin/export"
              className="grid gap-5 lg:grid-cols-[1fr_1fr_0.8fr_auto]"
            >
              <label className="block">
                <span className="text-sm font-extrabold text-slate-700">
                  From date
                </span>

                <input
                  type="date"
                  name="from"
                  defaultValue={from}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-extrabold text-slate-700">
                  To date
                </span>

                <input
                  type="date"
                  name="to"
                  defaultValue={to}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-extrabold text-slate-700">
                  File format
                </span>

                <select
                  name="format"
                  defaultValue={format}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="csv">CSV</option>
                </select>
              </label>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  className="min-h-12 rounded-xl bg-slate-950 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-slate-700"
                >
                  Apply
                </button>

                {(from || to || format !== "csv") && (
                  <Link
                    href="/admin/export"
                    className="min-h-12 rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-extrabold leading-6 text-slate-700 transition hover:bg-slate-100"
                  >
                    Clear
                  </Link>
                )}
              </div>
            </form>

            {!filtersAreValid && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
              >
                <p className="font-black text-red-950">
                  Check the selected dates
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-red-800">
                  Use valid dates and make sure the “From” date is not later
                  than the “To” date.
                </p>
              </div>
            )}
          </Section>

          <Section
            eyebrow="Reports"
            title="Available exports"
            description="Each download is generated securely for administrators. Row counts show the current unfiltered database totals."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              {exports.map((exportItem) => (
                <ExportCard
                  key={exportItem.id}
                  item={exportItem}
                  from={from}
                  to={to}
                  format={format}
                  disabled={!filtersAreValid}
                />
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Bulk export"
            title="Complete administrative archive"
            description="Download every supported report using the selected date range."
          >
            <div className="flex flex-col gap-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-950">
                  Export all reports
                </h3>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                  The server action will generate each report independently so
                  large datasets can be downloaded without exposing database
                  credentials or private server configuration.
                </p>
              </div>

              <DownloadLink
                exportType="all"
                filename="beacon-admin-export"
                from={from}
                to={to}
                format={format}
                disabled={!filtersAreValid}
                label="Export everything"
              />
            </div>
          </Section>

          <Section
            eyebrow="Privacy"
            title="Export handling"
            description="Administrative exports can contain personal and financial identifiers."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <GuidanceCard
                title="Store securely"
                description="Keep exported files in an encrypted, access-controlled location."
              />

              <GuidanceCard
                title="Share minimally"
                description="Only send reports to people who require the information for their role."
              />

              <GuidanceCard
                title="Delete promptly"
                description="Remove local copies when the operational or compliance task is complete."
              />
            </div>
          </Section>

          <Section
            eyebrow="Admin tools"
            title="Related workspaces"
            description="Review data before creating or sharing an export."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminLink
                href="/admin/analytics"
                title="Analytics"
                description="Review usage and growth."
              />

              <AdminLink
                href="/admin/audit"
                title="Audit log"
                description="Review administrative activity."
              />

              <AdminLink
                href="/admin/stripe"
                title="Stripe"
                description="Review subscription and payment data."
              />

              <AdminLink
                href="/admin/system"
                title="System health"
                description="Review diagnostics and failures."
              />
            </div>
          </Section>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: SectionProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-violet-700">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">
          {title}
        </h2>

        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <div className="p-6 sm:p-8">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  accentClass,
}: MetricCardProps) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className={`bg-gradient-to-r ${accentClass} px-5 py-4 text-white`}>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/80">
          {label}
        </p>
      </div>

      <div className="p-5">
        <p className="break-words text-3xl font-black text-slate-950">
          {value}
        </p>

        <p className="mt-3 break-words text-sm font-semibold leading-6 text-slate-500">
          {detail}
        </p>
      </div>
    </article>
  );
}

function ExportCard({
  item,
  from,
  to,
  format,
  disabled,
}: {
  item: ExportDefinition;
  from: string;
  to: string;
  format: string;
  disabled: boolean;
}) {
  return (
    <article className="flex flex-col rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xl font-black text-violet-800"
        >
          {item.icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-xl font-black text-slate-950">
            {item.title}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-700 shadow-sm">
          {formatNumber(item.count)} rows
        </span>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase text-slate-700 shadow-sm">
          {format}
        </span>

        {item.supportsDateRange && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-700 shadow-sm">
            Date filter supported
          </span>
        )}
      </div>

      <div className="mt-auto pt-6">
        <DownloadLink
          exportType={item.id}
          filename={item.filename}
          from={from}
          to={to}
          format={format}
          disabled={disabled}
          label={`Download ${item.title}`}
        />
      </div>
    </article>
  );
}

function DownloadLink({
  exportType,
  filename,
  from,
  to,
  format,
  disabled,
  label,
}: {
  exportType: string;
  filename: string;
  from: string;
  to: string;
  format: string;
  disabled: boolean;
  label: string;
}) {
  const query = new URLSearchParams({
    type: exportType,
    filename,
    format,
  });

  if (from) {
    query.set("from", from);
  }

  if (to) {
    query.set("to", to);
  }

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex cursor-not-allowed rounded-xl bg-slate-300 px-5 py-3 text-sm font-extrabold text-slate-600"
      >
        Check dates before exporting
      </span>
    );
  }

  return (
    <a
      href={`/admin/export/download?${query.toString()}`}
      className="inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-violet-200"
    >
      {label} ↓
    </a>
  );
}

function GuidanceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="font-black text-slate-950">{title}</h3>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function AdminLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-black text-slate-950">{title}</h3>

        <span
          aria-hidden="true"
          className="font-black text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950"
        >
          →
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>
    </Link>
  );
}