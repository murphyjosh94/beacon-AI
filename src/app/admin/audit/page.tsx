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

const PAGE_SIZE = 30;

type SearchParams = Record<string, string | string[] | undefined>;

type AuditRow = {
  id: string;
  administrator_id: string;
  administrator_name: string | null;
  administrator_email: string | null;
  affected_user_id: string | null;
  affected_user_name: string | null;
  affected_user_email: string | null;
  action_type: string;
  action_label: string;
  previous_value: unknown;
  new_value: unknown;
  reason: string | null;
  metadata: unknown;
  created_at: Date | string;
};

type CountRow = {
  value: number | string | null;
};

type ActionTypeRow = {
  action_type: string;
  action_label: string;
  total: number | string;
};

type AdministratorRow = {
  id: string;
  name: string;
  email: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  accentClass: string;
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

function numberFromResult(result: unknown): number {
  const row = rowsFromResult<CountRow>(result)[0];
  return Number(row?.value ?? 0);
}

function readSearchParam(
  params: SearchParams,
  key: string
): string {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function readPositiveInteger(
  value: string,
  fallback: number
): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatActionType(value: string): string {
  return value
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Administrator";
}

function serializeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "Not recorded";
  }

  if (typeof value === "string") {
    return value || "Empty";
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Value could not be displayed";
  }
}

function getActionBadgeClasses(actionType: string): string {
  if (actionType.includes("credit")) {
    return "bg-violet-100 text-violet-800";
  }

  if (actionType.includes("role")) {
    return "bg-red-100 text-red-800";
  }

  if (
    actionType.includes("membership") ||
    actionType.includes("beacon_plus")
  ) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (actionType.includes("setting")) {
    return "bg-blue-100 text-blue-800";
  }

  if (
    actionType.includes("delete") ||
    actionType.includes("remove")
  ) {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-slate-100 text-slate-800";
}

async function ensureAuditTable(): Promise<void> {
  await database.execute(sql`
    create table if not exists beacon_admin_audit_log (
      id uuid primary key default gen_random_uuid(),
      administrator_id text not null references "user"(id) on delete restrict,
      affected_user_id text references "user"(id) on delete set null,
      action_type text not null,
      action_label text not null,
      previous_value jsonb,
      new_value jsonb,
      reason text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);

  await database.execute(sql`
    create index if not exists beacon_admin_audit_admin_idx
      on beacon_admin_audit_log (administrator_id)
  `);

  await database.execute(sql`
    create index if not exists beacon_admin_audit_user_idx
      on beacon_admin_audit_log (affected_user_id)
  `);

  await database.execute(sql`
    create index if not exists beacon_admin_audit_action_idx
      on beacon_admin_audit_log (action_type)
  `);

  await database.execute(sql`
    create index if not exists beacon_admin_audit_created_idx
      on beacon_admin_audit_log (created_at desc)
  `);
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
    redirect("/signin?next=/admin/audit");
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

function buildAuditHref(
  current: {
    query: string;
    action: string;
    administrator: string;
    from: string;
    to: string;
  },
  page: number
): string {
  const params = new URLSearchParams();

  if (current.query) {
    params.set("q", current.query);
  }

  if (current.action) {
    params.set("action", current.action);
  }

  if (current.administrator) {
    params.set("administrator", current.administrator);
  }

  if (current.from) {
    params.set("from", current.from);
  }

  if (current.to) {
    params.set("to", current.to);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString
    ? `/admin/audit?${queryString}`
    : "/admin/audit";
}

export default async function AdminAuditPage({
  searchParams,
}: PageProps) {
  const administrator = await requireAdministrator();
  await ensureAuditTable();

  const params = (await searchParams) ?? {};

  const query = readSearchParam(params, "q").slice(0, 200);
  const action = readSearchParam(params, "action").slice(0, 100);
  const administratorFilter = readSearchParam(
    params,
    "administrator"
  ).slice(0, 200);
  const from = readSearchParam(params, "from").slice(0, 10);
  const to = readSearchParam(params, "to").slice(0, 10);
  const requestedPage = readPositiveInteger(
    readSearchParam(params, "page"),
    1
  );

  const queryPattern = `%${query}%`;
  const administratorPattern = `%${administratorFilter}%`;

  const filterClause = sql`
    where
      (
        ${query} = ''
        or audit.action_type ilike ${queryPattern}
        or audit.action_label ilike ${queryPattern}
        or coalesce(audit.reason, '') ilike ${queryPattern}
        or coalesce(admin_user.email, '') ilike ${queryPattern}
        or coalesce(admin_user.name, '') ilike ${queryPattern}
        or coalesce(affected_user.email, '') ilike ${queryPattern}
        or coalesce(affected_user.name, '') ilike ${queryPattern}
        or coalesce(audit.affected_user_id, '') ilike ${queryPattern}
      )
      and (
        ${action} = ''
        or audit.action_type = ${action}
      )
      and (
        ${administratorFilter} = ''
        or audit.administrator_id = ${administratorFilter}
        or coalesce(admin_user.email, '') ilike ${administratorPattern}
        or coalesce(admin_user.name, '') ilike ${administratorPattern}
      )
      and (
        ${from} = ''
        or audit.created_at >= ${from}::date
      )
      and (
        ${to} = ''
        or audit.created_at < (${to}::date + interval '1 day')
      )
  `;

  const filteredCountResult = await database.execute(sql`
    select count(*)::int as value
    from beacon_admin_audit_log audit
    left join "user" admin_user
      on admin_user.id = audit.administrator_id
    left join "user" affected_user
      on affected_user.id = audit.affected_user_id
    ${filterClause}
  `);

  const filteredCount = numberFromResult(filteredCountResult);
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * PAGE_SIZE;

  const [
    totalActionsResult,
    todayActionsResult,
    creditActionsResult,
    roleActionsResult,
    settingsActionsResult,
    auditResult,
    actionTypeResult,
    administratorResult,
  ] = await Promise.all([
    database.execute(sql`
      select count(*)::int as value
      from beacon_admin_audit_log
    `),

    database.execute(sql`
      select count(*)::int as value
      from beacon_admin_audit_log
      where created_at >= date_trunc('day', now())
    `),

    database.execute(sql`
      select count(*)::int as value
      from beacon_admin_audit_log
      where action_type ilike '%credit%'
    `),

    database.execute(sql`
      select count(*)::int as value
      from beacon_admin_audit_log
      where action_type ilike '%role%'
    `),

    database.execute(sql`
      select count(*)::int as value
      from beacon_admin_audit_log
      where action_type ilike '%setting%'
    `),

    database.execute(sql`
      select
        audit.id,
        audit.administrator_id,
        admin_user.name as administrator_name,
        admin_user.email as administrator_email,
        audit.affected_user_id,
        affected_user.name as affected_user_name,
        affected_user.email as affected_user_email,
        audit.action_type,
        audit.action_label,
        audit.previous_value,
        audit.new_value,
        audit.reason,
        audit.metadata,
        audit.created_at
      from beacon_admin_audit_log audit
      left join "user" admin_user
        on admin_user.id = audit.administrator_id
      left join "user" affected_user
        on affected_user.id = audit.affected_user_id
      ${filterClause}
      order by audit.created_at desc
      limit ${PAGE_SIZE}
      offset ${offset}
    `),

    database.execute(sql`
      select
        action_type,
        max(action_label) as action_label,
        count(*)::int as total
      from beacon_admin_audit_log
      group by action_type
      order by action_type
    `),

    database.execute(sql`
      select
        id,
        name,
        email
      from "user"
      where role = 'admin'
      order by name, email
    `),
  ]);

  const totalActions = numberFromResult(totalActionsResult);
  const todayActions = numberFromResult(todayActionsResult);
  const creditActions = numberFromResult(creditActionsResult);
  const roleActions = numberFromResult(roleActionsResult);
  const settingsActions = numberFromResult(settingsActionsResult);

  const auditEntries = rowsFromResult<AuditRow>(auditResult);
  const actionTypes = rowsFromResult<ActionTypeRow>(actionTypeResult);
  const administrators =
    rowsFromResult<AdministratorRow>(administratorResult);

  const activeFilters = Boolean(
    query || action || administratorFilter || from || to
  );

  const filterState = {
    query,
    action,
    administrator: administratorFilter,
    from,
    to,
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-10 text-white sm:py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-slate-950 to-indigo-950" />
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -bottom-36 left-1/4 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-red-200 transition hover:text-white"
              >
                ← Back to admin dashboard
              </Link>

              <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.28em] text-red-200">
                Beacon Administration
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Audit Log
              </h1>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-200">
                A permanent timeline of administrator changes to users,
                credits, membership and platform settings.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/analytics"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
              >
                Analytics
              </Link>

              <DashboardSignOutButton />
            </div>
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
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Total actions"
              value={formatNumber(totalActions)}
              detail="All recorded administrator actions"
              accentClass="from-slate-700 to-slate-950"
            />

            <MetricCard
              label="Today"
              value={formatNumber(todayActions)}
              detail="Actions since midnight"
              accentClass="from-blue-700 to-blue-950"
            />

            <MetricCard
              label="Credit changes"
              value={formatNumber(creditActions)}
              detail="Adjustments, gifts and corrections"
              accentClass="from-violet-700 to-violet-950"
            />

            <MetricCard
              label="Role changes"
              value={formatNumber(roleActions)}
              detail="Administrator and user role updates"
              accentClass="from-red-700 to-red-950"
            />

            <MetricCard
              label="Settings changes"
              value={formatNumber(settingsActions)}
              detail="Platform configuration updates"
              accentClass="from-emerald-700 to-emerald-950"
            />
          </div>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
                Find activity
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Search and filter
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Search names, emails, user IDs, action names and reasons.
              </p>
            </div>

            <form
              method="get"
              action="/admin/audit"
              className="grid gap-5 p-6 sm:p-8 lg:grid-cols-2 xl:grid-cols-6"
            >
              <Field label="Search" className="xl:col-span-2">
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Email, user ID or action"
                  className={inputClasses}
                />
              </Field>

              <Field label="Action">
                <select
                  name="action"
                  defaultValue={action}
                  className={inputClasses}
                >
                  <option value="">All actions</option>
                  {actionTypes.map((item) => (
                    <option
                      key={item.action_type}
                      value={item.action_type}
                    >
                      {item.action_label ||
                        formatActionType(item.action_type)}{" "}
                      ({formatNumber(Number(item.total))})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Administrator">
                <select
                  name="administrator"
                  defaultValue={administratorFilter}
                  className={inputClasses}
                >
                  <option value="">All administrators</option>
                  {administrators.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} — {account.email}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="From date">
                <input
                  type="date"
                  name="from"
                  defaultValue={from}
                  className={inputClasses}
                />
              </Field>

              <Field label="To date">
                <input
                  type="date"
                  name="to"
                  defaultValue={to}
                  className={inputClasses}
                />
              </Field>

              <div className="flex flex-wrap items-end gap-3 lg:col-span-2 xl:col-span-6">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-slate-700"
                >
                  Apply filters
                </button>

                {activeFilters && (
                  <Link
                    href="/admin/audit"
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
                  >
                    Clear filters
                  </Link>
                )}

                <p className="ml-auto text-sm font-bold text-slate-500">
                  {formatNumber(filteredCount)} matching{" "}
                  {filteredCount === 1 ? "action" : "actions"}
                </p>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-indigo-700">
                  Timeline
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Administrator activity
                </h2>
              </div>

              <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-extrabold text-indigo-800">
                Page {page} of {totalPages}
              </span>
            </div>

            {auditEntries.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {auditEntries.map((entry) => (
                  <AuditEntry key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={
                  activeFilters
                    ? "No matching audit actions"
                    : "No audit actions recorded yet"
                }
                description={
                  activeFilters
                    ? "Try clearing or broadening the current filters."
                    : "The audit table is ready. Entries will appear after admin server actions start writing records."
                }
              />
            )}

            {totalPages > 1 && (
              <div className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
                <p className="text-sm font-bold text-slate-600">
                  Showing{" "}
                  {formatNumber(
                    filteredCount === 0 ? 0 : offset + 1
                  )}{" "}
                  to{" "}
                  {formatNumber(
                    Math.min(offset + PAGE_SIZE, filteredCount)
                  )}{" "}
                  of {formatNumber(filteredCount)}
                </p>

                <div className="flex gap-3">
                  {page > 1 ? (
                    <Link
                      href={buildAuditHref(filterState, page - 1)}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-extrabold text-slate-400">
                      ← Previous
                    </span>
                  )}

                  {page < totalPages ? (
                    <Link
                      href={buildAuditHref(filterState, page + 1)}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-700"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-xl bg-slate-200 px-5 py-3 text-sm font-extrabold text-slate-400">
                      Next →
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-800">
              Integration status
            </p>

            <h2 className="mt-2 text-xl font-black text-amber-950">
              The audit storage table is created automatically
            </h2>

            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-amber-950">
              This page prepares and reads the audit table. The next step is
              updating each admin server action so role, membership, credit and
              settings changes insert an audit record in the same transaction.
            </p>
          </section>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}

const inputClasses =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-extrabold text-slate-700">
        {label}
      </span>
      {children}
    </label>
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

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          {detail}
        </p>
      </div>
    </article>
  );
}

function AuditEntry({ entry }: { entry: AuditRow }) {
  const affectedUserLabel =
    entry.affected_user_name ||
    entry.affected_user_email ||
    entry.affected_user_id ||
    "Platform-wide action";

  const administratorLabel =
    entry.administrator_name ||
    entry.administrator_email ||
    entry.administrator_id;

  return (
    <article className="p-6 transition hover:bg-slate-50 sm:p-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${getActionBadgeClasses(
                entry.action_type
              )}`}
            >
              {entry.action_label ||
                formatActionType(entry.action_type)}
            </span>

            <span className="text-xs font-bold text-slate-500">
              {formatDateTime(entry.created_at)}
            </span>
          </div>

          <h3 className="mt-4 text-xl font-black text-slate-950">
            {affectedUserLabel}
          </h3>

          {entry.affected_user_email && (
            <p className="mt-1 break-all text-sm font-semibold text-slate-500">
              {entry.affected_user_email}
            </p>
          )}

          <p className="mt-3 text-sm font-semibold text-slate-600">
            Performed by{" "}
            <span className="font-black text-slate-900">
              {administratorLabel}
            </span>
          </p>

          {entry.reason && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-800">
                Reason
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-950">
                {entry.reason}
              </p>
            </div>
          )}
        </div>

        {entry.affected_user_id && (
          <Link
            href={`/admin/users/${encodeURIComponent(
              entry.affected_user_id
            )}`}
            className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-700"
          >
            View user
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ValuePanel
          label="Previous value"
          value={entry.previous_value}
          emptyLabel="No previous value recorded"
        />

        <ValuePanel
          label="New value"
          value={entry.new_value}
          emptyLabel="No new value recorded"
        />
      </div>

      {entry.metadata !== null &&
        entry.metadata !== undefined &&
        serializeValue(entry.metadata) !== "{}" && (
          <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-4 py-3 text-sm font-extrabold text-slate-700">
              Technical metadata
            </summary>

            <pre className="overflow-x-auto border-t border-slate-200 p-4 text-xs leading-6 text-slate-700">
              {serializeValue(entry.metadata)}
            </pre>
          </details>
        )}
    </article>
  );
}

function ValuePanel({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value: unknown;
  emptyLabel: string;
}) {
  const serialized = serializeValue(value);
  const empty =
    value === null ||
    value === undefined;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      {empty ? (
        <p className="mt-2 text-sm font-semibold text-slate-400">
          {emptyLabel}
        </p>
      ) : (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-800">
          {serialized}
        </pre>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl"
      >
        ◇
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-950">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-2xl font-semibold leading-7 text-slate-500">
        {description}
      </p>
    </div>
  );
}