import type { ReactNode } from "react";

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  count,
  eq,
  sql,
} from "drizzle-orm";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import DashboardSignOutButton from "@/components/dashboard/DashboardSignOutButton";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";

import {
  creditLedger,
  savedSearch,
  searchHistory,
  stripeWebhookEvent,
  user,
} from "@/lib/database/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HealthStatus =
  | "healthy"
  | "warning"
  | "error"
  | "unknown";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  accentClass: string;
};

type StatusBadgeProps = {
  status: HealthStatus;
  label?: string;
};

type SystemCheck = {
  name: string;
  status: HealthStatus;
  detail: string;
  value?: string;
};

type DatabaseSummary = {
  users: number;
  searches: number;
  savedSearches: number;
  ledgerEntries: number;
  webhookEvents: number;
};

type SearchStatusRow = {
  status: string;
  total: number | string;
};

type WebhookStatusRow = {
  status: string;
  total: number | string;
};

type RecentFailureRow = {
  id: string;
  query: string;
  category: string | null;
  created_at: Date | string;
};

type RecentWebhookFailureRow = {
  stripe_event_id: string;
  event_type: string;
  error_message: string | null;
  created_at: Date | string;
};

type DatabaseProbe = {
  ok: boolean;
  latencyMs: number;
  version: string;
  error: string | null;
};

function rowsFromResult<T>(
  result: unknown
): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "rows" in result &&
    Array.isArray(
      (result as {
        rows?: unknown;
      }).rows
    )
  ) {
    return (
      result as {
        rows: T[];
      }
    ).rows;
  }

  return [];
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-GB"
  ).format(value);
}

function formatDateTime(
  value:
    | Date
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(date);
}

function formatUptime(
  seconds: number
): string {
  const days =
    Math.floor(
      seconds / 86_400
    );

  const hours =
    Math.floor(
      (
        seconds %
        86_400
      ) /
        3_600
    );

  const minutes =
    Math.floor(
      (
        seconds %
        3_600
      ) /
        60
    );

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getFirstName(
  name: string
): string {
  return (
    name
      .trim()
      .split(/\s+/)[0] ||
    "Administrator"
  );
}

function readEnvironmentStatus(
  name: string
): SystemCheck {
  const value =
    process.env[name]?.trim();

  if (!value) {
    return {
      name,
      status:
        "error",
      detail:
        "This environment variable is not configured.",
      value:
        "Missing",
    };
  }

  return {
    name,
    status:
      "healthy",
    detail:
      "Configured in the current deployment.",
    value:
      "Configured",
  };
}

function statusLabel(
  status: HealthStatus
): string {
  if (
    status ===
    "healthy"
  ) {
    return "Healthy";
  }

  if (
    status ===
    "warning"
  ) {
    return "Warning";
  }

  if (
    status ===
    "error"
  ) {
    return "Error";
  }

  return "Unknown";
}

function statusClasses(
  status: HealthStatus
): string {
  if (
    status ===
    "healthy"
  ) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (
    status ===
    "warning"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (
    status ===
    "error"
  ) {
    return "bg-red-100 text-red-800";
  }

  return "bg-slate-100 text-slate-700";
}

async function requireAdministrator(): Promise<{
  id: string;
  name: string;
  email: string;
}> {
  const session =
    await auth.api.getSession({
      headers:
        await headers(),
    });

  if (
    !session?.user?.id
  ) {
    redirect(
      "/signin?next=/admin/system"
    );
  }

  const rows =
    await database
      .select({
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,
      })
      .from(user)
      .where(
        eq(
          user.id,
          session.user.id
        )
      )
      .limit(1);

  const administrator =
    rows[0];

  if (
    !administrator ||
    administrator.role !==
      "admin"
  ) {
    redirect(
      "/dashboard"
    );
  }

  return {
    id:
      administrator.id,

    name:
      administrator.name,

    email:
      administrator.email,
  };
}

async function probeDatabase(): Promise<DatabaseProbe> {
  const startedAt =
    performance.now();

  try {
    const result =
      await database.execute(
        sql`
          select
            version() as version
        `
      );

    const row =
      rowsFromResult<{
        version?: string;
      }>(result)[0];

    return {
      ok:
        true,

      latencyMs:
        Math.round(
          performance.now() -
            startedAt
        ),

      version:
        row?.version ??
        "PostgreSQL",

      error:
        null,
    };
  } catch (error) {
    return {
      ok:
        false,

      latencyMs:
        Math.round(
          performance.now() -
            startedAt
        ),

      version:
        "Unavailable",

      error:
        error instanceof Error
          ? error.message
          : "Database probe failed.",
    };
  }
}

async function readSystemData() {
  const databaseProbe =
    await probeDatabase();

  if (
    !databaseProbe.ok
  ) {
    return {
      databaseProbe,

      summary: {
        users:
          0,

        searches:
          0,

        savedSearches:
          0,

        ledgerEntries:
          0,

        webhookEvents:
          0,
      } satisfies DatabaseSummary,

      searchStatuses:
        [] as SearchStatusRow[],

      webhookStatuses:
        [] as WebhookStatusRow[],

      recentFailures:
        [] as RecentFailureRow[],

      recentWebhookFailures:
        [] as RecentWebhookFailureRow[],
    };
  }

  const [
    userCountRows,
    searchCountRows,
    savedSearchCountRows,
    ledgerCountRows,
    webhookCountRows,
    searchStatusResult,
    webhookStatusResult,
    recentFailureResult,
    recentWebhookFailureResult,
  ] =
    await Promise.all([
      database
        .select({
          total:
            count(),
        })
        .from(user),

      database
        .select({
          total:
            count(),
        })
        .from(
          searchHistory
        ),

      database
        .select({
          total:
            count(),
        })
        .from(savedSearch),

      database
        .select({
          total:
            count(),
        })
        .from(
          creditLedger
        ),

      database
        .select({
          total:
            count(),
        })
        .from(
          stripeWebhookEvent
        ),

      database.execute(
        sql`
          select
            status,
            count(*)::int as total
          from search_history
          group by status
          order by total desc
        `
      ),

      database.execute(
        sql`
          select
            status,
            count(*)::int as total
          from stripe_webhook_event
          group by status
          order by total desc
        `
      ),

      database.execute(
        sql`
          select
            id,
            query,
            category,
            created_at
          from search_history
          where status = 'failed'
          order by created_at desc
          limit 12
        `
      ),

      database.execute(
        sql`
          select
            stripe_event_id,
            event_type,
            error_message,
            created_at
          from stripe_webhook_event
          where
            status = 'failed'
            or error_message is not null
          order by created_at desc
          limit 12
        `
      ),
    ]);

  return {
    databaseProbe,

    summary: {
      users:
        Number(
          userCountRows[0]
            ?.total ??
            0
        ),

      searches:
        Number(
          searchCountRows[0]
            ?.total ??
            0
        ),

      savedSearches:
        Number(
          savedSearchCountRows[0]
            ?.total ??
            0
        ),

      ledgerEntries:
        Number(
          ledgerCountRows[0]
            ?.total ??
            0
        ),

      webhookEvents:
        Number(
          webhookCountRows[0]
            ?.total ??
            0
        ),
    } satisfies DatabaseSummary,

    searchStatuses:
      rowsFromResult<SearchStatusRow>(
        searchStatusResult
      ),

    webhookStatuses:
      rowsFromResult<WebhookStatusRow>(
        webhookStatusResult
      ),

    recentFailures:
      rowsFromResult<RecentFailureRow>(
        recentFailureResult
      ),

    recentWebhookFailures:
      rowsFromResult<RecentWebhookFailureRow>(
        recentWebhookFailureResult
      ),
  };
}

export default async function AdminSystemPage() {
  const administrator =
    await requireAdministrator();

  const system =
    await readSystemData();

  const environmentChecks = [
    readEnvironmentStatus(
      "DATABASE_URL"
    ),

    readEnvironmentStatus(
      "BETTER_AUTH_SECRET"
    ),

    readEnvironmentStatus(
      "BETTER_AUTH_URL"
    ),

    readEnvironmentStatus(
      "STRIPE_SECRET_KEY"
    ),

    readEnvironmentStatus(
      "STRIPE_WEBHOOK_SECRET"
    ),

    readEnvironmentStatus(
      "NEXT_PUBLIC_SITE_URL"
    ),
  ];

  const missingEnvironmentVariables =
    environmentChecks.filter(
      (check) =>
        check.status ===
        "error"
    ).length;

  const searchStatusMap =
    new Map(
      system.searchStatuses.map(
        (row) => [
          row.status,
          Number(row.total),
        ]
      )
    );

  const webhookStatusMap =
    new Map(
      system.webhookStatuses.map(
        (row) => [
          row.status,
          Number(row.total),
        ]
      )
    );

  const failedSearches =
    searchStatusMap.get(
      "failed"
    ) ?? 0;

  const processingSearches =
    searchStatusMap.get(
      "started"
    ) ?? 0;

  const failedWebhooks =
    webhookStatusMap.get(
      "failed"
    ) ?? 0;

  const databaseStatus:
    HealthStatus =
    system.databaseProbe.ok
      ? system.databaseProbe
          .latencyMs >
        1_000
        ? "warning"
        : "healthy"
      : "error";

  const overallStatus:
    HealthStatus =
    !system.databaseProbe.ok ||
    missingEnvironmentVariables >
      0
      ? "error"
      : failedWebhooks > 0 ||
          failedSearches > 0 ||
          processingSearches > 10
        ? "warning"
        : "healthy";

  const nodeVersion =
    process.version;

  const deploymentEnvironment =
    process.env
      .VERCEL_ENV ??
    process.env.NODE_ENV ??
    "unknown";

  const deploymentRegion =
    process.env
      .VERCEL_REGION ??
    process.env
      .AWS_REGION ??
    "Not reported";

  const deploymentUrl =
    process.env
      .VERCEL_PROJECT_PRODUCTION_URL ??
    process.env
      .VERCEL_URL ??
    process.env
      .NEXT_PUBLIC_SITE_URL ??
    "Not reported";

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-10 text-white sm:py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-cyan-200 transition hover:text-white"
              >
                ← Back to admin dashboard
              </Link>

              <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.28em] text-cyan-200">
                Beacon Administration
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                System Health
              </h1>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-200">
                Deployment diagnostics, database health, environment checks,
                workload status and recent failures.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge
                status={
                  overallStatus
                }
                label={`Overall: ${statusLabel(
                  overallStatus
                )}`}
              />

              <DashboardSignOutButton />
            </div>
          </div>

          <p className="mt-8 text-sm font-semibold text-slate-300">
            Signed in as{" "}
            <span className="font-black text-white">
              {getFirstName(
                administrator.name
              )}
            </span>
          </p>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Database"
              value={
                system.databaseProbe
                  .ok
                  ? `${system.databaseProbe.latencyMs} ms`
                  : "Offline"
              }
              detail={
                system.databaseProbe
                  .ok
                  ? "Live query latency"
                  : system
                      .databaseProbe
                      .error ??
                    "Database unavailable"
              }
              accentClass="from-emerald-700 to-emerald-950"
            />

            <MetricCard
              label="Application uptime"
              value={formatUptime(
                process.uptime()
              )}
              detail="Current server process uptime"
              accentClass="from-blue-700 to-blue-950"
            />

            <MetricCard
              label="Failed searches"
              value={formatNumber(
                failedSearches
              )}
              detail={`${formatNumber(
                processingSearches
              )} searches currently started`}
              accentClass="from-amber-600 to-red-900"
            />

            <MetricCard
              label="Failed webhooks"
              value={formatNumber(
                failedWebhooks
              )}
              detail={`${formatNumber(
                system.summary
                  .webhookEvents
              )} webhook events recorded`}
              accentClass="from-violet-700 to-violet-950"
            />
          </div>

          <Section
            eyebrow="Core services"
            title="Service health"
            description="Live operational checks performed during this page request."
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <HealthCheckCard
                name="PostgreSQL database"
                status={
                  databaseStatus
                }
                value={
                  system.databaseProbe
                    .ok
                    ? `${system.databaseProbe.latencyMs} ms`
                    : "Unavailable"
                }
                detail={
                  system.databaseProbe
                    .ok
                    ? system
                        .databaseProbe
                        .version
                    : system
                        .databaseProbe
                        .error ??
                      "Connection failed."
                }
              />

              <HealthCheckCard
                name="Authentication"
                status={
                  process.env
                    .BETTER_AUTH_SECRET &&
                  process.env
                    .BETTER_AUTH_URL
                    ? "healthy"
                    : "error"
                }
                value={
                  process.env
                    .BETTER_AUTH_SECRET &&
                  process.env
                    .BETTER_AUTH_URL
                    ? "Configured"
                    : "Incomplete"
                }
                detail="Better Auth secret and base URL configuration."
              />

              <HealthCheckCard
                name="Stripe"
                status={
                  process.env
                    .STRIPE_SECRET_KEY &&
                  process.env
                    .STRIPE_WEBHOOK_SECRET
                    ? "healthy"
                    : "error"
                }
                value={
                  process.env
                    .STRIPE_SECRET_KEY?.startsWith(
                      "sk_live_"
                    )
                    ? "Live mode"
                    : process.env
                          .STRIPE_SECRET_KEY
                      ? "Test mode"
                      : "Not configured"
                }
                detail="Stripe API and webhook signing configuration."
              />

              <HealthCheckCard
                name="Search pipeline"
                status={
                  failedSearches >
                  0
                    ? "warning"
                    : "healthy"
                }
                value={`${formatNumber(
                  failedSearches
                )} failed`}
                detail={`${formatNumber(
                  system.summary
                    .searches
                )} total searches recorded.`}
              />

              <HealthCheckCard
                name="Webhook processor"
                status={
                  failedWebhooks >
                  0
                    ? "warning"
                    : "healthy"
                }
                value={`${formatNumber(
                  failedWebhooks
                )} failed`}
                detail={`${formatNumber(
                  system.summary
                    .webhookEvents
                )} Stripe webhook events recorded.`}
              />

              <HealthCheckCard
                name="Environment"
                status={
                  missingEnvironmentVariables >
                  0
                    ? "error"
                    : "healthy"
                }
                value={
                  missingEnvironmentVariables >
                  0
                    ? `${missingEnvironmentVariables} missing`
                    : "Complete"
                }
                detail="Required runtime environment variables."
              />
            </div>
          </Section>

          <Section
            eyebrow="Deployment"
            title="Runtime information"
            description="Non-secret details reported by the current server process."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DetailCard
                label="Environment"
                value={
                  deploymentEnvironment
                }
              />

              <DetailCard
                label="Region"
                value={
                  deploymentRegion
                }
              />

              <DetailCard
                label="Node.js"
                value={
                  nodeVersion
                }
              />

              <DetailCard
                label="Platform"
                value={`${process.platform} / ${process.arch}`}
              />

              <DetailCard
                label="Deployment URL"
                value={
                  deploymentUrl
                }
                wide
              />

              <DetailCard
                label="Generated"
                value={formatDateTime(
                  new Date()
                )}
              />

              <DetailCard
                label="Process ID"
                value={String(
                  process.pid
                )}
              />
            </div>
          </Section>

          <Section
            eyebrow="Environment"
            title="Configuration checks"
            description="Only configuration presence is displayed. Secret values are never rendered."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="divide-y divide-slate-200">
                {environmentChecks.map(
                  (check) => (
                    <div
                      key={
                        check.name
                      }
                      className="grid gap-3 bg-white px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div>
                        <p className="font-black text-slate-950">
                          {
                            check.name
                          }
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {
                            check.detail
                          }
                        </p>
                      </div>

                      <StatusBadge
                        status={
                          check.status
                        }
                        label={
                          check.value
                        }
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </Section>

          <Section
            eyebrow="Database"
            title="Operational totals"
            description="Current row counts from Beacon's core tables."
          >
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
              <CountCard
                label="Users"
                value={
                  system.summary
                    .users
                }
              />

              <CountCard
                label="Searches"
                value={
                  system.summary
                    .searches
                }
              />

              <CountCard
                label="Saved searches"
                value={
                  system.summary
                    .savedSearches
                }
              />

              <CountCard
                label="Ledger entries"
                value={
                  system.summary
                    .ledgerEntries
                }
              />

              <CountCard
                label="Webhook events"
                value={
                  system.summary
                    .webhookEvents
                }
              />
            </div>
          </Section>

          <div className="grid gap-8 xl:grid-cols-2">
            <Section
              eyebrow="Search pipeline"
              title="Search status"
              description="Distribution of search history records by status."
            >
              <StatusBreakdown
                rows={
                  system.searchStatuses
                }
                emptyMessage="No search history records are available."
              />
            </Section>

            <Section
              eyebrow="Stripe"
              title="Webhook status"
              description="Distribution of Stripe webhook records by processing status."
            >
              <StatusBreakdown
                rows={
                  system.webhookStatuses
                }
                emptyMessage="No Stripe webhook records are available."
              />
            </Section>
          </div>

          <Section
            eyebrow="Diagnostics"
            title="Recent failed searches"
            description="The most recent failed search-history records."
          >
            {system.recentFailures
              .length >
            0 ? (
              <div className="divide-y divide-slate-200">
                {system.recentFailures.map(
                  (failure) => (
                    <article
                      key={
                        failure.id
                      }
                      className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge
                            status="error"
                            label="Failed"
                          />

                          <span className="text-sm font-black text-slate-700">
                            {failure.category ??
                              "Uncategorised"}
                          </span>
                        </div>

                        <p className="mt-3 break-words font-bold leading-7 text-slate-950">
                          {
                            failure.query
                          }
                        </p>

                        <p className="mt-2 break-all text-xs font-semibold text-slate-400">
                          ID:{" "}
                          {
                            failure.id
                          }
                        </p>
                      </div>

                      <p className="text-sm font-bold text-slate-500 lg:text-right">
                        {formatDateTime(
                          failure.created_at
                        )}
                      </p>
                    </article>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                title="No failed searches"
                description="No failed search-history records were found."
              />
            )}
          </Section>

          <Section
            eyebrow="Diagnostics"
            title="Recent webhook failures"
            description="Stripe webhook records with a failed status or an error message."
          >
            {system
              .recentWebhookFailures
              .length >
            0 ? (
              <div className="divide-y divide-slate-200">
                {system.recentWebhookFailures.map(
                  (failure) => (
                    <article
                      key={
                        failure.stripe_event_id
                      }
                      className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge
                            status="error"
                            label="Webhook error"
                          />

                          <span className="break-all text-sm font-black text-slate-700">
                            {
                              failure.event_type
                            }
                          </span>
                        </div>

                        <p className="mt-3 break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-900">
                          {failure.error_message ??
                            "The event has a failed status but no error message was stored."}
                        </p>

                        <p className="mt-2 break-all text-xs font-semibold text-slate-400">
                          {
                            failure.stripe_event_id
                          }
                        </p>
                      </div>

                      <p className="text-sm font-bold text-slate-500 lg:text-right">
                        {formatDateTime(
                          failure.created_at
                        )}
                      </p>
                    </article>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                title="No webhook failures"
                description="No failed Stripe webhook records were found."
              />
            )}
          </Section>

          <Section
            eyebrow="Admin tools"
            title="Operational navigation"
            description="Open the related Beacon administration workspaces."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminLink
                href="/admin/analytics"
                title="Analytics"
                description="Usage, growth and activity metrics."
              />

              <AdminLink
                href="/admin/audit"
                title="Audit log"
                description="Administrative action history."
              />

              <AdminLink
                href="/admin/stripe"
                title="Stripe"
                description="Subscriptions, payments and webhooks."
              />

              <AdminLink
                href="/admin/support"
                title="Support"
                description="User lookup and support workspace."
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
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">
          {title}
        </h2>

        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {children}
      </div>
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
      <div
        className={`bg-gradient-to-r ${accentClass} px-5 py-4 text-white`}
      >
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

function StatusBadge({
  status,
  label,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold ${statusClasses(
        status
      )}`}
    >
      {label ??
        statusLabel(status)}
    </span>
  );
}

function HealthCheckCard({
  name,
  status,
  value,
  detail,
}: {
  name: string;
  status: HealthStatus;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-black text-slate-950">
          {name}
        </h3>

        <StatusBadge
          status={status}
        />
      </div>

      <p className="mt-5 break-words text-2xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-3 break-words text-sm font-semibold leading-6 text-slate-500">
        {detail}
      </p>
    </article>
  );
}

function DetailCard({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 ${
        wide
          ? "sm:col-span-2"
          : ""
      }`}
    >
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 break-all font-black text-slate-950">
        {value}
      </p>
    </article>
  );
}

function CountCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
      <p className="text-3xl font-black text-slate-950">
        {formatNumber(value)}
      </p>

      <p className="mt-2 text-sm font-extrabold text-slate-500">
        {label}
      </p>
    </article>
  );
}

function StatusBreakdown({
  rows,
  emptyMessage,
}: {
  rows: Array<{
    status: string;
    total: number | string;
  }>;
  emptyMessage: string;
}) {
  if (
    rows.length ===
    0
  ) {
    return (
      <p className="text-sm font-semibold text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  const total =
    rows.reduce(
      (
        runningTotal,
        row
      ) =>
        runningTotal +
        Number(
          row.total
        ),
      0
    );

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const value =
          Number(
            row.total
          );

        const percentage =
          total > 0
            ? Math.round(
                (
                  value /
                  total
                ) *
                  100
              )
            : 0;

        const normalized =
          row.status.toLowerCase();

        const status:
          HealthStatus =
          normalized ===
            "completed" ||
          normalized ===
            "succeeded" ||
          normalized ===
            "processed"
            ? "healthy"
            : normalized ===
                  "failed" ||
                normalized ===
                  "error"
              ? "error"
              : "warning";

        return (
          <div
            key={row.status}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <StatusBadge
                status={status}
                label={row.status.replaceAll(
                  "_",
                  " "
                )}
              />

              <span className="font-black text-slate-950">
                {formatNumber(
                  value
                )}
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-slate-900"
                style={{
                  width: `${Math.max(
                    percentage,
                    value > 0
                      ? 2
                      : 0
                  )}%`,
                }}
              />
            </div>

            <p className="mt-2 text-right text-xs font-bold text-slate-500">
              {percentage}%
            </p>
          </div>
        );
      })}
    </div>
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
        <h3 className="font-black text-slate-950">
          {title}
        </h3>

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

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="py-10 text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl"
      >
        ✓
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-950">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-lg font-semibold leading-7 text-slate-500">
        {description}
      </p>
    </div>
  );
}