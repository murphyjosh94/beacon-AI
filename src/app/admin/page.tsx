import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  and,
  count,
  desc,
  eq,
  gte,
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
  user,
} from "@/lib/database/schema";

export const dynamic =
  "force-dynamic";

function getUtcDayStart(): Date {
  const now =
    new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
}

function formatDate(
  value: Date | null
): string {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(value);
}

function formatDateTime(
  value: Date
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(value);
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-GB"
  ).format(value);
}

function getFirstName(
  name: string
): string {
  return (
    name
      .trim()
      .split(/\s+/)[0] ||
    "Admin"
  );
}

function getMembershipLabel(
  beaconPlusActive: boolean
): string {
  return beaconPlusActive
    ? "Beacon+"
    : "Free";
}

function getRoleLabel(
  role: string | null
): string {
  return role === "admin"
    ? "Administrator"
    : "Member";
}

function getSearchStatusStyle(
  status:
    | "started"
    | "completed"
    | "failed"
): string {
  if (status === "completed") {
    return (
      "bg-emerald-100 text-emerald-800"
    );
  }

  if (status === "failed") {
    return (
      "bg-red-100 text-red-800"
    );
  }

  return (
    "bg-amber-100 text-amber-800"
  );
}

function getSearchStatusLabel(
  status:
    | "started"
    | "completed"
    | "failed"
): string {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Processing";
}

export default async function AdminPage() {
  const requestHeaders =
    await headers();

  const session =
    await auth.api.getSession({
      headers:
        requestHeaders,
    });

  if (!session?.user?.id) {
    redirect(
      "/signin?next=/admin"
    );
  }

  const adminRows =
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

  const adminAccount =
    adminRows[0];

  if (
    !adminAccount ||
    adminAccount.role !== "admin"
  ) {
    redirect("/dashboard");
  }

  const todayStart =
    getUtcDayStart();

  const [
    totalUserRows,
    beaconPlusRows,
    freeMemberRows,
    administratorRows,
    totalSearchRows,
    todaySearchRows,
    failedSearchRows,
    savedSearchRows,
    purchasedCreditRows,
    ledgerEntryRows,
    recentUsers,
    recentSearches,
    recentLedgerEntries,
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
        .from(user)
        .where(
          eq(
            user.beaconPlusActive,
            true
          )
        ),

      database
        .select({
          total:
            count(),
        })
        .from(user)
        .where(
          eq(
            user.beaconPlusActive,
            false
          )
        ),

      database
        .select({
          total:
            count(),
        })
        .from(user)
        .where(
          eq(
            user.role,
            "admin"
          )
        ),

      database
        .select({
          total:
            count(),
        })
        .from(searchHistory),

      database
        .select({
          total:
            count(),
        })
        .from(searchHistory)
        .where(
          gte(
            searchHistory.createdAt,
            todayStart
          )
        ),

      database
        .select({
          total:
            count(),
        })
        .from(searchHistory)
        .where(
          eq(
            searchHistory.status,
            "failed"
          )
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
            sql<number>`
              coalesce(
                sum(${user.purchasedCredits}),
                0
              )
            `,
        })
        .from(user),

      database
        .select({
          total:
            count(),
        })
        .from(creditLedger),

      database
        .select({
          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          emailVerified:
            user.emailVerified,

          role:
            user.role,

          beaconPlusActive:
            user.beaconPlusActive,

          purchasedCredits:
            user.purchasedCredits,

          stripeCustomerId:
            user.stripeCustomerId,

          createdAt:
            user.createdAt,
        })
        .from(user)
        .orderBy(
          desc(
            user.createdAt
          )
        )
        .limit(8),

      database
        .select({
          id:
            searchHistory.id,

          query:
            searchHistory.query,

          category:
            searchHistory.category,

          status:
            searchHistory.status,

          resultCount:
            searchHistory.resultCount,

          creditCharged:
            searchHistory.creditCharged,

          createdAt:
            searchHistory.createdAt,

          userName:
            user.name,

          userEmail:
            user.email,
        })
        .from(searchHistory)
        .leftJoin(
          user,
          eq(
            searchHistory.userId,
            user.id
          )
        )
        .orderBy(
          desc(
            searchHistory.createdAt
          )
        )
        .limit(8),

      database
        .select({
          id:
            creditLedger.id,

          userId:
            creditLedger.userId,

          type:
            creditLedger.type,

          amount:
            creditLedger.amount,

          createdAt:
            creditLedger.createdAt,

          userName:
            user.name,

          userEmail:
            user.email,
        })
        .from(creditLedger)
        .leftJoin(
          user,
          eq(
            creditLedger.userId,
            user.id
          )
        )
        .orderBy(
          desc(
            creditLedger.createdAt
          )
        )
        .limit(8),
    ]);

  const totalUsers =
    Number(
      totalUserRows[0]?.total ??
        0
    );

  const beaconPlusMembers =
    Number(
      beaconPlusRows[0]?.total ??
        0
    );

  const freeMembers =
    Number(
      freeMemberRows[0]?.total ??
        0
    );

  const administrators =
    Number(
      administratorRows[0]?.total ??
        0
    );

  const totalSearches =
    Number(
      totalSearchRows[0]?.total ??
        0
    );

  const searchesToday =
    Number(
      todaySearchRows[0]?.total ??
        0
    );

  const failedSearches =
    Number(
      failedSearchRows[0]?.total ??
        0
    );

  const totalSavedSearches =
    Number(
      savedSearchRows[0]?.total ??
        0
    );

  const purchasedCredits =
    Number(
      purchasedCreditRows[0]?.total ??
        0
    );

  const ledgerEntries =
    Number(
      ledgerEntryRows[0]?.total ??
        0
    );

  const beaconPlusPercentage =
    totalUsers > 0
      ? Math.round(
          (
            beaconPlusMembers /
            totalUsers
          ) *
            100
        )
      : 0;

  const searchFailurePercentage =
    totalSearches > 0
      ? Math.round(
          (
            failedSearches /
            totalSearches
          ) *
            100
        )
      : 0;

  const firstName =
    getFirstName(
      adminAccount.name
    );

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-12 text-white sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-slate-950 to-indigo-950" />

        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />

        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-red-200">
              Beacon Administration
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Welcome, {firstName}.
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
              Monitor Beacon AI users,
              memberships, searches,
              purchased credits and recent
              platform activity.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white">
                Administrator
              </span>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                Live Data
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Member Dashboard
            </Link>

            <DashboardSignOutButton />
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <section>
            <div className="mb-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-red-700">
                Platform Overview
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Beacon at a glance
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <AdminMetric
                label="Total Users"
                value={formatNumber(
                  totalUsers
                )}
                detail={`${formatNumber(
                  beaconPlusMembers
                )} Beacon+ and ${formatNumber(
                  freeMembers
                )} free members`}
                accentClass="from-slate-700 to-slate-900"
              />

              <AdminMetric
                label="Beacon+ Members"
                value={formatNumber(
                  beaconPlusMembers
                )}
                detail={`${beaconPlusPercentage}% of all registered users`}
                accentClass="from-emerald-600 to-emerald-800"
              />

              <AdminMetric
                label="Searches Today"
                value={formatNumber(
                  searchesToday
                )}
                detail={`${formatNumber(
                  totalSearches
                )} searches completed or attempted overall`}
                accentClass="from-blue-700 to-blue-900"
              />

              <AdminMetric
                label="Purchased Credits"
                value={formatNumber(
                  purchasedCredits
                )}
                detail={`${formatNumber(
                  ledgerEntries
                )} credit ledger entries recorded`}
                accentClass="from-indigo-600 to-violet-800"
              />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <AdminMetric
                label="Free Members"
                value={formatNumber(
                  freeMembers
                )}
                detail="Registered accounts without an active Beacon+ membership"
                accentClass="from-cyan-700 to-blue-800"
              />

              <AdminMetric
                label="Administrators"
                value={formatNumber(
                  administrators
                )}
                detail="Accounts with access to this administration area"
                accentClass="from-red-700 to-red-900"
              />

              <AdminMetric
                label="Saved Searches"
                value={formatNumber(
                  totalSavedSearches
                )}
                detail="Searches saved across all Beacon accounts"
                accentClass="from-violet-600 to-purple-800"
              />

              <AdminMetric
                label="Failed Searches"
                value={formatNumber(
                  failedSearches
                )}
                detail={`${searchFailurePercentage}% of all recorded searches`}
                accentClass="from-amber-600 to-orange-800"
              />
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500">
                Administration
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Management areas
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <AdminAction
                title="User Management"
                description="Review accounts, membership status, administrator roles and purchased credit balances."
                href="#recent-users"
                label="View Users"
                status="Available"
              />

              <AdminAction
                title="Search Activity"
                description="Monitor recent queries, completed searches, failures and result totals."
                href="#recent-searches"
                label="View Searches"
                status="Available"
              />

              <AdminAction
                title="Credit Ledger"
                description="Review recent allowance usage, purchases and credit balance changes."
                href="#credit-ledger"
                label="View Ledger"
                status="Available"
              />

              <AdminAction
                title="Site Settings"
                description="Control allowances, maintenance mode and Beacon platform configuration."
                href="#site-settings"
                label="View Settings"
                status="Coming next"
              />
            </div>
          </section>

          <section
            id="recent-users"
            className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
                  Users
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Recent Registrations
                </h2>
              </div>

              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-extrabold text-blue-800">
                {formatNumber(
                  totalUsers
                )} total
              </span>
            </div>

            {recentUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <TableHeading>
                        User
                      </TableHeading>

                      <TableHeading>
                        Membership
                      </TableHeading>

                      <TableHeading>
                        Role
                      </TableHeading>

                      <TableHeading>
                        Credits
                      </TableHeading>

                      <TableHeading>
                        Billing
                      </TableHeading>

                      <TableHeading>
                        Joined
                      </TableHeading>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentUsers.map(
                      (
                        account
                      ) => (
                        <tr
                          key={
                            account.id
                          }
                          className="transition hover:bg-slate-50"
                        >
                          <TableCell>
                            <div className="min-w-52">
                              <p className="font-extrabold text-slate-950">
                                {
                                  account.name
                                }
                              </p>

                              <p className="mt-1 break-all text-xs text-slate-500">
                                {
                                  account.email
                                }
                              </p>

                              <p
                                className={`mt-2 text-xs font-extrabold ${
                                  account.emailVerified
                                    ? "text-emerald-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {account.emailVerified
                                  ? "Email verified"
                                  : "Email not verified"}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                                account.beaconPlusActive
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {getMembershipLabel(
                                account.beaconPlusActive
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                                account.role ===
                                "admin"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {getRoleLabel(
                                account.role
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-black text-slate-950">
                              {formatNumber(
                                account.purchasedCredits
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`font-extrabold ${
                                account.stripeCustomerId
                                  ? "text-emerald-700"
                                  : "text-slate-500"
                              }`}
                            >
                              {account.stripeCustomerId
                                ? "Connected"
                                : "Not connected"}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="whitespace-nowrap text-sm font-semibold text-slate-600">
                              {formatDate(
                                account.createdAt
                              )}
                            </span>
                          </TableCell>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <AdminEmptyState
                title="No users found"
                description="Registered Beacon accounts will appear here."
              />
            )}
          </section>

          <div className="mt-8 grid gap-7 xl:grid-cols-2">
            <section
              id="recent-searches"
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:px-8">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-indigo-700">
                    Activity
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Recent Searches
                  </h2>
                </div>

                <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-extrabold text-indigo-800">
                  {formatNumber(
                    totalSearches
                  )}
                </span>
              </div>

              {recentSearches.length >
              0 ? (
                <div className="divide-y divide-slate-100">
                  {recentSearches.map(
                    (search) => (
                      <article
                        key={
                          search.id
                        }
                        className="px-6 py-5 transition hover:bg-slate-50 sm:px-8"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <p className="line-clamp-2 font-extrabold leading-6 text-slate-950">
                              {
                                search.query
                              }
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-600">
                              {search.userName ??
                                "Unknown user"}
                            </p>

                            <p className="mt-1 break-all text-xs text-slate-500">
                              {search.userEmail ??
                                "No email available"}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                              <span>
                                {formatDateTime(
                                  search.createdAt
                                )}
                              </span>

                              {search.category && (
                                <>
                                  <span
                                    aria-hidden="true"
                                  >
                                    •
                                  </span>

                                  <span className="capitalize">
                                    {
                                      search.category
                                    }
                                  </span>
                                </>
                              )}

                              <span
                                aria-hidden="true"
                              >
                                •
                              </span>

                              <span>
                                {
                                  search.resultCount
                                }{" "}
                                {search.resultCount ===
                                1
                                  ? "result"
                                  : "results"}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-extrabold ${getSearchStatusStyle(
                                search.status
                              )}`}
                            >
                              {getSearchStatusLabel(
                                search.status
                              )}
                            </span>

                            {search.creditCharged && (
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-800">
                                Credit charged
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <AdminEmptyState
                  title="No searches found"
                  description="Beacon search activity will appear here."
                />
              )}
            </section>

            <section
              id="credit-ledger"
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:px-8">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-violet-700">
                    Credits
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Recent Ledger Entries
                  </h2>
                </div>

                <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-extrabold text-violet-800">
                  {formatNumber(
                    ledgerEntries
                  )}
                </span>
              </div>

              {recentLedgerEntries.length >
              0 ? (
                <div className="divide-y divide-slate-100">
                  {recentLedgerEntries.map(
                    (entry) => (
                      <article
                        key={
                          entry.id
                        }
                        className="px-6 py-5 transition hover:bg-slate-50 sm:px-8"
                      >
                        <div className="flex items-start justify-between gap-5">
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-950">
                              {entry.userName ??
                                "Unknown user"}
                            </p>

                            <p className="mt-1 break-all text-xs text-slate-500">
                              {entry.userEmail ??
                                entry.userId}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold capitalize text-slate-700">
                                {entry.type.replaceAll(
                                  "_",
                                  " "
                                )}
                              </span>

                              <span className="text-xs font-semibold text-slate-500">
                                {formatDateTime(
                                  entry.createdAt
                                )}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-xl px-4 py-2 text-lg font-black ${
                              entry.amount >
                              0
                                ? "bg-emerald-100 text-emerald-800"
                                : entry.amount <
                                    0
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {entry.amount >
                            0
                              ? "+"
                              : ""}
                            {
                              entry.amount
                            }
                          </span>
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <AdminEmptyState
                  title="No ledger entries"
                  description="Credit purchases and usage will appear here."
                />
              )}
            </section>
          </div>

          <section
            id="site-settings"
            className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 to-indigo-950 p-7 text-white shadow-xl sm:p-9"
          >
            <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-indigo-200">
                  Next Development Stage
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Interactive admin controls
                </h2>

                <p className="mt-4 max-w-3xl leading-7 text-slate-200">
                  This first admin page is
                  read-only and safely reports
                  live platform data. The next
                  stage will add protected
                  controls for managing user
                  roles, Beacon+ membership
                  and purchased credit
                  balances.
                </p>
              </div>

              <div className="shrink-0">
                <span className="inline-flex rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white">
                  Controls coming next
                </span>
              </div>
            </div>
          </section>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}

type AdminMetricProps = {
  label: string;
  value: string;
  detail: string;
  accentClass: string;
};

function AdminMetric({
  label,
  value,
  detail,
  accentClass,
}: AdminMetricProps) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div
        className={`bg-gradient-to-r ${accentClass} px-6 py-4 text-white`}
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80">
          {label}
        </p>
      </div>

      <div className="p-6">
        <p className="break-words text-3xl font-black text-slate-950">
          {value}
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {detail}
        </p>
      </div>
    </article>
  );
}

type AdminActionProps = {
  title: string;
  description: string;
  href: string;
  label: string;
  status: string;
};

function AdminAction({
  title,
  description,
  href,
  label,
  status,
}: AdminActionProps) {
  return (
    <article className="flex min-h-56 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-black text-slate-950">
          {title}
        </h3>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${
            status ===
            "Available"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {status}
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <Link
        href={href}
        className="mt-6 font-extrabold text-blue-800 hover:underline"
      >
        {label} →
      </Link>
    </article>
  );
}

type TableHeadingProps = {
  children: React.ReactNode;
};

function TableHeading({
  children,
}: TableHeadingProps) {
  return (
    <th className="whitespace-nowrap px-6 py-4 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
      {children}
    </th>
  );
}

type TableCellProps = {
  children: React.ReactNode;
};

function TableCell({
  children,
}: TableCellProps) {
  return (
    <td className="px-6 py-5 align-top">
      {children}
    </td>
  );
}

type AdminEmptyStateProps = {
  title: string;
  description: string;
};

function AdminEmptyState({
  title,
  description,
}: AdminEmptyStateProps) {
  return (
    <div className="px-6 py-14 text-center sm:px-8">
      <div
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl"
      >
        ✦
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-950">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-500">
        {description}
      </p>
    </div>
  );
}