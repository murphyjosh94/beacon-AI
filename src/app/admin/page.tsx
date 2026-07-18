import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  count,
  desc,
  eq,
  gte,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import DashboardSignOutButton from "@/components/dashboard/DashboardSignOutButton";

import {
  adjustUserCredits,
  updateUserMembership,
  updateUserRole,
} from "@/app/admin/actions";

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

type AdminPageProps = {
  searchParams?: Promise<{
    user?: string | string[];
  }>;
};

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

function readSearchParameter(
  value: string | string[] | undefined
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(
      0,
      120
    );
}

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
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

  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : undefined;

  const userSearchQuery =
    readSearchParameter(
      resolvedSearchParams?.user
    );

  const todayStart =
    getUtcDayStart();

  const userSearchCondition =
    userSearchQuery
      ? or(
          ilike(
            user.name,
            `%${userSearchQuery}%`
          ),
          ilike(
            user.email,
            `%${userSearchQuery}%`
          )
        )
      : undefined;

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
    managedUsers,
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

      userSearchCondition
        ? database
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

              beaconPlusCurrentPeriodEnd:
                user.beaconPlusCurrentPeriodEnd,

              purchasedCredits:
                user.purchasedCredits,

              stripeCustomerId:
                user.stripeCustomerId,

              createdAt:
                user.createdAt,
            })
            .from(user)
            .where(
              userSearchCondition
            )
            .orderBy(
              desc(
                user.createdAt
              )
            )
            .limit(50)
        : database
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

              beaconPlusCurrentPeriodEnd:
                user.beaconPlusCurrentPeriodEnd,

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
            .limit(20),

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
              Manage Beacon AI users,
              memberships, account roles,
              purchased credits and platform
              activity.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white">
                Administrator
              </span>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                Live controls
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
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
          <AdminSidebar />

          <div className="min-w-0">
            <section id="overview">
              <div className="mb-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-red-700">
                  Platform Overview
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Beacon at a glance
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
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
                  )} searches recorded overall`}
                  accentClass="from-blue-700 to-blue-900"
                />

                <AdminMetric
                  label="Purchased Credits"
                  value={formatNumber(
                    purchasedCredits
                  )}
                  detail={`${formatNumber(
                    ledgerEntries
                  )} ledger entries recorded`}
                  accentClass="from-indigo-600 to-violet-800"
                />
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
                <AdminMetric
                  label="Free Members"
                  value={formatNumber(
                    freeMembers
                  )}
                  detail="Accounts without an active Beacon+ membership"
                  accentClass="from-cyan-700 to-blue-800"
                />

                <AdminMetric
                  label="Administrators"
                  value={formatNumber(
                    administrators
                  )}
                  detail="Accounts with administration access"
                  accentClass="from-red-700 to-red-900"
                />

                <AdminMetric
                  label="Saved Searches"
                  value={formatNumber(
                    totalSavedSearches
                  )}
                  detail="Searches saved across Beacon accounts"
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

            <section
              id="users"
              className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
                      User Management
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      Manage Beacon Accounts
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Search members and change
                      account roles, Beacon+
                      access or purchased-credit
                      balances.
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-extrabold text-blue-800">
                    {formatNumber(
                      totalUsers
                    )} total users
                  </span>
                </div>

                <form
                  action="/admin"
                  method="get"
                  className="mt-6 flex flex-col gap-3 sm:flex-row"
                >
                  <label
                    htmlFor="admin-user-search"
                    className="sr-only"
                  >
                    Search users by name or
                    email
                  </label>

                  <input
                    id="admin-user-search"
                    name="user"
                    type="search"
                    defaultValue={
                      userSearchQuery
                    }
                    placeholder="Search by name or email"
                    className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="submit"
                    className="min-h-12 rounded-xl bg-blue-900 px-6 text-sm font-extrabold text-white transition hover:bg-blue-800"
                  >
                    Search Users
                  </button>

                  {userSearchQuery && (
                    <Link
                      href="/admin#users"
                      className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                    >
                      Clear
                    </Link>
                  )}
                </form>

                {userSearchQuery && (
                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    Showing results for{" "}
                    <span className="font-black text-slate-950">
                      “{userSearchQuery}”
                    </span>
                  </p>
                )}
              </div>

              {managedUsers.length >
              0 ? (
                <div className="divide-y divide-slate-200">
                  {managedUsers.map(
                    (account) => (
                      <UserManagementCard
                        key={
                          account.id
                        }
                        account={
                          account
                        }
                        currentAdminId={
                          adminAccount.id
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <AdminEmptyState
                  title="No matching users"
                  description="Try a different name or email address."
                />
              )}
            </section>

            <div className="mt-8 grid gap-7 2xl:grid-cols-2">
              <section
                id="searches"
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
                id="credits"
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
                    description="Credit purchases and adjustments will appear here."
                  />
                )}
              </section>
            </div>

            <section
              id="subscriptions"
              className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-slate-950 to-indigo-950 p-7 text-white shadow-xl sm:p-9"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-emerald-200">
                Subscriptions
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Beacon+ management is active
              </h2>

              <p className="mt-4 max-w-3xl leading-7 text-slate-200">
                Administrators can now enable
                or disable Beacon+ access for
                individual accounts from the
                user-management section.
                Stripe subscription cancellation
                and billing-history controls
                remain separate future features.
              </p>
            </section>

            <section
              id="settings"
              className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-500">
                System
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Site settings
              </h2>

              <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                Daily allowance values are
                currently controlled through
                environment variables. A future
                settings area can store these
                values in the database and add
                maintenance mode, feature flags
                and site announcements.
              </p>
            </section>
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}

function AdminSidebar() {
  return (
    <aside className="xl:sticky xl:top-6 xl:self-start">
      <nav
        aria-label="Admin navigation"
        className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
      >
        <div className="bg-gradient-to-br from-slate-950 to-indigo-950 px-6 py-6 text-white">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-indigo-200">
            Admin Console
          </p>

          <p className="mt-2 text-xl font-black">
            Beacon AI
          </p>
        </div>

        <div className="space-y-6 p-5">
          <AdminNavigationGroup
            title="Dashboard"
            links={[
              {
                href:
                  "#overview",
                label:
                  "Overview",
              },
            ]}
          />

          <AdminNavigationGroup
            title="Users"
            links={[
              {
                href:
                  "#users",
                label:
                  "User Management",
              },
            ]}
          />

          <AdminNavigationGroup
            title="Subscriptions"
            links={[
              {
                href:
                  "#subscriptions",
                label:
                  "Beacon+",
              },
            ]}
          />

          <AdminNavigationGroup
            title="Credits"
            links={[
              {
                href:
                  "#credits",
                label:
                  "Ledger",
              },
              {
                href:
                  "#users",
                label:
                  "Adjustments",
              },
            ]}
          />

          <AdminNavigationGroup
            title="Analytics"
            links={[
              {
                href:
                  "#searches",
                label:
                  "Search Activity",
              },
            ]}
          />

          <AdminNavigationGroup
            title="System"
            links={[
              {
                href:
                  "#settings",
                label:
                  "Settings",
              },
            ]}
          />
        </div>
      </nav>
    </aside>
  );
}

type AdminNavigationGroupProps = {
  title: string;
  links: Array<{
    href: string;
    label: string;
  }>;
};

function AdminNavigationGroup({
  title,
  links,
}: AdminNavigationGroupProps) {
  return (
    <div>
      <p className="px-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>

      <div className="mt-2 space-y-1">
        {links.map(
          (link) => (
            <Link
              key={`${title}-${link.label}`}
              href={link.href}
              className="block rounded-xl px-3 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-blue-50 hover:text-blue-900"
            >
              {link.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: "user" | "admin" | null;
  beaconPlusActive: boolean;
  beaconPlusCurrentPeriodEnd: Date | null;
  purchasedCredits: number;
  stripeCustomerId: string | null;
  createdAt: Date;
};

type UserManagementCardProps = {
  account: ManagedUser;
  currentAdminId: string;
};

function UserManagementCard({
  account,
  currentAdminId,
}: UserManagementCardProps) {
  const isCurrentAdministrator =
    account.id ===
    currentAdminId;

  return (
    <article className="p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 xl:max-w-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-xl font-black text-slate-950">
              {account.name}
            </h3>

            {isCurrentAdministrator && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-extrabold text-red-800">
                Your account
              </span>
            )}
          </div>

          <p className="mt-2 break-all text-sm font-semibold text-slate-600">
            {account.email}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                account.emailVerified
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {account.emailVerified
                ? "Email verified"
                : "Email not verified"}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                account.beaconPlusActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {getMembershipLabel(
                account.beaconPlusActive
              )}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
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
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-1">
            <AccountDetail
              label="Purchased credits"
              value={formatNumber(
                account.purchasedCredits
              )}
            />

            <AccountDetail
              label="Joined"
              value={formatDate(
                account.createdAt
              )}
            />

            <AccountDetail
              label="Billing"
              value={
                account.stripeCustomerId
                  ? "Stripe connected"
                  : "Not connected"
              }
            />

            <AccountDetail
              label="Beacon+ period end"
              value={formatDate(
                account.beaconPlusCurrentPeriodEnd
              )}
            />
          </dl>
        </div>

        <div className="grid flex-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          <AdminControlPanel
            title="Membership"
            description="Enable or disable Beacon+ access for this account."
          >
            <form
              action={
                updateUserMembership
              }
            >
              <input
                type="hidden"
                name="userId"
                value={
                  account.id
                }
              />

              <input
                type="hidden"
                name="beaconPlusActive"
                value={
                  account.beaconPlusActive
                    ? "false"
                    : "true"
                }
              />

              <button
                type="submit"
                className={`w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white transition ${
                  account.beaconPlusActive
                    ? "bg-slate-800 hover:bg-slate-700"
                    : "bg-emerald-700 hover:bg-emerald-600"
                }`}
              >
                {account.beaconPlusActive
                  ? "Disable Beacon+"
                  : "Enable Beacon+"}
              </button>
            </form>
          </AdminControlPanel>

          <AdminControlPanel
            title="Account Role"
            description={
              isCurrentAdministrator
                ? "You cannot remove your own administrator access."
                : "Promote this member or remove administrator access."
            }
          >
            <form
              action={
                updateUserRole
              }
            >
              <input
                type="hidden"
                name="userId"
                value={
                  account.id
                }
              />

              <input
                type="hidden"
                name="role"
                value={
                  account.role ===
                  "admin"
                    ? "user"
                    : "admin"
                }
              />

              <button
                type="submit"
                disabled={
                  isCurrentAdministrator
                }
                className={`w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
                  account.role ===
                  "admin"
                    ? "bg-red-700 hover:bg-red-600"
                    : "bg-blue-800 hover:bg-blue-700"
                }`}
              >
                {account.role ===
                "admin"
                  ? "Remove Admin"
                  : "Make Administrator"}
              </button>
            </form>
          </AdminControlPanel>

          <AdminControlPanel
            title="Purchased Credits"
            description="Use a positive number to add credits or a negative number to remove them."
            wide
          >
            <form
              action={
                adjustUserCredits
              }
              className="space-y-3"
            >
              <input
                type="hidden"
                name="userId"
                value={
                  account.id
                }
              />

              <label
                htmlFor={`credit-adjustment-${account.id}`}
                className="block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500"
              >
                Credit adjustment
              </label>

              <input
                id={`credit-adjustment-${account.id}`}
                name="adjustment"
                type="number"
                step="1"
                min="-100000"
                max="100000"
                required
                placeholder="Example: 10 or -5"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
              />

              <label
                htmlFor={`credit-reason-${account.id}`}
                className="block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500"
              >
                Reason
              </label>

              <input
                id={`credit-reason-${account.id}`}
                name="reason"
                type="text"
                maxLength={300}
                placeholder="Optional admin note"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
              />

              <div className="grid grid-cols-3 gap-2">
                <CreditShortcut
                  userId={
                    account.id
                  }
                  adjustment={10}
                />

                <CreditShortcut
                  userId={
                    account.id
                  }
                  adjustment={50}
                />

                <CreditShortcut
                  userId={
                    account.id
                  }
                  adjustment={100}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-violet-800 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-violet-700"
              >
                Apply Custom Adjustment
              </button>
            </form>
          </AdminControlPanel>
        </div>
      </div>
    </article>
  );
}

type CreditShortcutProps = {
  userId: string;
  adjustment: number;
};

function CreditShortcut({
  userId,
  adjustment,
}: CreditShortcutProps) {
  return (
    <form
      action={
        adjustUserCredits
      }
    >
      <input
        type="hidden"
        name="userId"
        value={userId}
      />

      <input
        type="hidden"
        name="adjustment"
        value={String(
          adjustment
        )}
      />

      <input
        type="hidden"
        name="reason"
        value={`Administrator added ${adjustment} purchased credits using a quick action.`}
      />

      <button
        type="submit"
        className="w-full rounded-lg border border-violet-200 bg-violet-50 px-2 py-2 text-xs font-extrabold text-violet-800 transition hover:bg-violet-100"
      >
        +{adjustment}
      </button>
    </form>
  );
}

type AdminControlPanelProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
};

function AdminControlPanel({
  title,
  description,
  children,
  wide = false,
}: AdminControlPanelProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 ${
        wide
          ? "lg:col-span-2 2xl:col-span-1"
          : ""
      }`}
    >
      <h4 className="font-black text-slate-950">
        {title}
      </h4>

      <p className="mt-2 min-h-12 text-xs leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

type AccountDetailProps = {
  label: string;
  value: string;
};

function AccountDetail({
  label,
  value,
}: AccountDetailProps) {
  return (
    <div>
      <dt className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 font-extrabold text-slate-800">
        {value}
      </dd>
    </div>
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