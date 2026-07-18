import type {
  ReactNode,
} from "react";

import Link from "next/link";
import {
  headers,
} from "next/headers";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  count,
  desc,
  eq,
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

import {
  auth,
} from "@/lib/auth/Auth";

import {
  database,
} from "@/lib/database/Database";

import {
  creditLedger,
  searchHistory,
  user,
} from "@/lib/database/schema";

export const dynamic =
  "force-dynamic";

type AdminUserPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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
    "Administrator"
  );
}

function getMembershipLabel(
  beaconPlusActive: boolean
): string {
  return beaconPlusActive
    ? "Beacon+ active"
    : "Free account";
}

function getRoleLabel(
  role: string | null
): string {
  return role === "admin"
    ? "Administrator"
    : "Member";
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

function getSearchStatusClass(
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

function getLedgerAmountClass(
  amount: number
): string {
  if (amount > 0) {
    return (
      "bg-emerald-100 text-emerald-800"
    );
  }

  if (amount < 0) {
    return (
      "bg-red-100 text-red-800"
    );
  }

  return (
    "bg-slate-100 text-slate-700"
  );
}

export default async function AdminUserPage({
  params,
}: AdminUserPageProps) {
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

  const administratorRows =
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
    administratorRows[0];

  if (
    !administrator ||
    administrator.role !== "admin"
  ) {
    redirect(
      "/dashboard"
    );
  }

  const resolvedParams =
    await params;

  const selectedUserId =
    decodeURIComponent(
      resolvedParams.id
    ).trim();

  if (!selectedUserId) {
    notFound();
  }

  const selectedUserRows =
    await database
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
        eq(
          user.id,
          selectedUserId
        )
      )
      .limit(1);

  const selectedUser =
    selectedUserRows[0];

  if (!selectedUser) {
    notFound();
  }

  const [
    totalSearchRows,
    completedSearchRows,
    failedSearchRows,
    creditChargedSearchRows,
    ledgerCountRows,
    ledgerSummaryRows,
    recentSearches,
    recentLedgerEntries,
  ] =
    await Promise.all([
      database
        .select({
          total:
            count(),
        })
        .from(searchHistory)
        .where(
          eq(
            searchHistory.userId,
            selectedUser.id
          )
        ),

      database
        .select({
          total:
            count(),
        })
        .from(searchHistory)
        .where(
          sql`
            ${searchHistory.userId}
              =
            ${selectedUser.id}
            and
            ${searchHistory.status}
              =
            'completed'
          `
        ),

      database
        .select({
          total:
            count(),
        })
        .from(searchHistory)
        .where(
          sql`
            ${searchHistory.userId}
              =
            ${selectedUser.id}
            and
            ${searchHistory.status}
              =
            'failed'
          `
        ),

      database
        .select({
          total:
            count(),
        })
        .from(searchHistory)
        .where(
          sql`
            ${searchHistory.userId}
              =
            ${selectedUser.id}
            and
            ${searchHistory.creditCharged}
              =
            true
          `
        ),

      database
        .select({
          total:
            count(),
        })
        .from(creditLedger)
        .where(
          eq(
            creditLedger.userId,
            selectedUser.id
          )
        ),

      database
        .select({
          creditsAdded:
            sql<number>`
              coalesce(
                sum(
                  case
                    when ${creditLedger.amount} > 0
                    then ${creditLedger.amount}
                    else 0
                  end
                ),
                0
              )
            `,

          creditsRemoved:
            sql<number>`
              coalesce(
                sum(
                  case
                    when ${creditLedger.amount} < 0
                    then abs(${creditLedger.amount})
                    else 0
                  end
                ),
                0
              )
            `,
        })
        .from(creditLedger)
        .where(
          eq(
            creditLedger.userId,
            selectedUser.id
          )
        ),

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
        })
        .from(searchHistory)
        .where(
          eq(
            searchHistory.userId,
            selectedUser.id
          )
        )
        .orderBy(
          desc(
            searchHistory.createdAt
          )
        )
        .limit(20),

      database
        .select({
          id:
            creditLedger.id,

          type:
            creditLedger.type,

          amount:
            creditLedger.amount,

          balanceAfter:
            creditLedger.balanceAfter,

          description:
            creditLedger.description,

          createdAt:
            creditLedger.createdAt,
        })
        .from(creditLedger)
        .where(
          eq(
            creditLedger.userId,
            selectedUser.id
          )
        )
        .orderBy(
          desc(
            creditLedger.createdAt
          )
        )
        .limit(30),
    ]);

  const totalSearches =
    Number(
      totalSearchRows[0]?.total ??
        0
    );

  const completedSearches =
    Number(
      completedSearchRows[0]?.total ??
        0
    );

  const failedSearches =
    Number(
      failedSearchRows[0]?.total ??
        0
    );

  const chargedSearches =
    Number(
      creditChargedSearchRows[0]?.total ??
        0
    );

  const ledgerEntries =
    Number(
      ledgerCountRows[0]?.total ??
        0
    );

  const creditsAdded =
    Number(
      ledgerSummaryRows[0]
        ?.creditsAdded ??
        0
    );

  const creditsRemoved =
    Number(
      ledgerSummaryRows[0]
        ?.creditsRemoved ??
        0
    );

  const isOwnAccount =
    administrator.id ===
    selectedUser.id;

  const administratorFirstName =
    getFirstName(
      administrator.name
    );

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
                href="/admin#users"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-red-200 transition hover:text-white"
              >
                ← Back to user management
              </Link>

              <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.28em] text-red-200">
                Beacon Administration
              </p>

              <h1 className="mt-3 break-words text-4xl font-black tracking-tight sm:text-5xl">
                {selectedUser.name}
              </h1>

              <p className="mt-3 break-all text-lg font-semibold text-slate-200">
                {selectedUser.email}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <StatusBadge
                  className={
                    selectedUser.role ===
                    "admin"
                      ? "border-red-300/30 bg-red-400/15 text-red-100"
                      : "border-blue-300/30 bg-blue-400/15 text-blue-100"
                  }
                >
                  {getRoleLabel(
                    selectedUser.role
                  )}
                </StatusBadge>

                <StatusBadge
                  className={
                    selectedUser.beaconPlusActive
                      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
                      : "border-white/20 bg-white/10 text-slate-100"
                  }
                >
                  {getMembershipLabel(
                    selectedUser.beaconPlusActive
                  )}
                </StatusBadge>

                <StatusBadge
                  className={
                    selectedUser.emailVerified
                      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
                      : "border-amber-300/30 bg-amber-400/15 text-amber-100"
                  }
                >
                  {selectedUser.emailVerified
                    ? "Email verified"
                    : "Email not verified"}
                </StatusBadge>

                {isOwnAccount && (
                  <StatusBadge className="border-violet-300/30 bg-violet-400/15 text-violet-100">
                    Your account
                  </StatusBadge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Admin Dashboard
              </Link>

              <DashboardSignOutButton />
            </div>
          </div>

          <p className="mt-8 text-sm font-semibold text-slate-300">
            Signed in as administrator{" "}
            <span className="font-black text-white">
              {administratorFirstName}
            </span>
          </p>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Purchased Credits"
              value={formatNumber(
                selectedUser.purchasedCredits
              )}
              detail="Current purchased-credit balance"
              accentClass="from-violet-700 to-indigo-900"
            />

            <MetricCard
              label="Total Searches"
              value={formatNumber(
                totalSearches
              )}
              detail={`${formatNumber(
                completedSearches
              )} completed successfully`}
              accentClass="from-blue-700 to-blue-900"
            />

            <MetricCard
              label="Failed Searches"
              value={formatNumber(
                failedSearches
              )}
              detail={`${formatNumber(
                chargedSearches
              )} searches charged a credit`}
              accentClass="from-amber-600 to-red-800"
            />

            <MetricCard
              label="Ledger Entries"
              value={formatNumber(
                ledgerEntries
              )}
              detail={`${formatNumber(
                creditsAdded
              )} added and ${formatNumber(
                creditsRemoved
              )} removed`}
              accentClass="from-emerald-700 to-emerald-900"
            />
          </section>

          <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-7">
              <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <SectionHeading
                  eyebrow="Account"
                  title="Account information"
                  description="Identity, membership, billing and registration details for this Beacon account."
                />

                <dl className="grid gap-px bg-slate-200 sm:grid-cols-2">
                  <DetailCell
                    label="Full name"
                    value={
                      selectedUser.name
                    }
                  />

                  <DetailCell
                    label="Email address"
                    value={
                      selectedUser.email
                    }
                    breakAll
                  />

                  <DetailCell
                    label="User ID"
                    value={
                      selectedUser.id
                    }
                    breakAll
                  />

                  <DetailCell
                    label="Account role"
                    value={getRoleLabel(
                      selectedUser.role
                    )}
                  />

                  <DetailCell
                    label="Email status"
                    value={
                      selectedUser.emailVerified
                        ? "Verified"
                        : "Not verified"
                    }
                  />

                  <DetailCell
                    label="Joined Beacon"
                    value={formatDateTime(
                      selectedUser.createdAt
                    )}
                  />

                  <DetailCell
                    label="Beacon+ status"
                    value={
                      selectedUser.beaconPlusActive
                        ? "Active"
                        : "Inactive"
                    }
                  />

                  <DetailCell
                    label="Beacon+ period end"
                    value={formatDate(
                      selectedUser.beaconPlusCurrentPeriodEnd
                    )}
                  />

                  <DetailCell
                    label="Stripe customer"
                    value={
                      selectedUser.stripeCustomerId
                        ? "Connected"
                        : "Not connected"
                    }
                  />

                  <DetailCell
                    label="Stripe customer ID"
                    value={
                      selectedUser.stripeCustomerId ??
                      "Not available"
                    }
                    breakAll
                  />
                </dl>
              </section>

              <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <SectionHeading
                  eyebrow="Search Activity"
                  title="Recent searches"
                  description={`The latest ${Math.min(
                    recentSearches.length,
                    20
                  )} searches recorded for this account.`}
                  badge={`${formatNumber(
                    totalSearches
                  )} total`}
                />

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
                              <p className="break-words font-extrabold leading-6 text-slate-950">
                                {
                                  search.query
                                }
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
                                className={`rounded-full px-3 py-1 text-xs font-extrabold ${getSearchStatusClass(
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
                  <EmptyState
                    title="No searches recorded"
                    description="This account has not created any Beacon searches yet."
                  />
                )}
              </section>

              <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <SectionHeading
                  eyebrow="Credit History"
                  title="Credit ledger"
                  description={`The latest ${Math.min(
                    recentLedgerEntries.length,
                    30
                  )} balance changes recorded for this account.`}
                  badge={`${formatNumber(
                    ledgerEntries
                  )} entries`}
                />

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
                          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
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

                              <p className="mt-3 break-words text-sm font-semibold leading-6 text-slate-700">
                                {entry.description ||
                                  "No description was recorded."}
                              </p>

                              <p className="mt-2 text-xs font-extrabold text-slate-500">
                                Balance after entry:{" "}
                                <span className="text-slate-950">
                                  {formatNumber(
                                    entry.balanceAfter
                                  )}
                                </span>
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-xl px-4 py-2 text-lg font-black ${getLedgerAmountClass(
                                entry.amount
                              )}`}
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
                  <EmptyState
                    title="No credit history"
                    description="Credit purchases, usage and administrator adjustments will appear here."
                  />
                )}
              </section>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-slate-950 to-indigo-950 px-6 py-6 text-white">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-200">
                    Quick Actions
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Manage account
                  </h2>
                </div>

                <div className="space-y-6 p-6">
                  <ActionSection
                    title="Beacon+ Membership"
                    description="Enable or disable Beacon+ access immediately."
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
                          selectedUser.id
                        }
                      />

                      <input
                        type="hidden"
                        name="beaconPlusActive"
                        value={
                          selectedUser.beaconPlusActive
                            ? "false"
                            : "true"
                        }
                      />

                      <button
                        type="submit"
                        className={`w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white transition ${
                          selectedUser.beaconPlusActive
                            ? "bg-slate-800 hover:bg-slate-700"
                            : "bg-emerald-700 hover:bg-emerald-600"
                        }`}
                      >
                        {selectedUser.beaconPlusActive
                          ? "Disable Beacon+"
                          : "Enable Beacon+"}
                      </button>
                    </form>
                  </ActionSection>

                  <ActionSection
                    title="Administrator Role"
                    description={
                      isOwnAccount
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
                          selectedUser.id
                        }
                      />

                      <input
                        type="hidden"
                        name="role"
                        value={
                          selectedUser.role ===
                          "admin"
                            ? "user"
                            : "admin"
                        }
                      />

                      <button
                        type="submit"
                        disabled={
                          isOwnAccount
                        }
                        className={`w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
                          selectedUser.role ===
                          "admin"
                            ? "bg-red-700 hover:bg-red-600"
                            : "bg-blue-800 hover:bg-blue-700"
                        }`}
                      >
                        {selectedUser.role ===
                        "admin"
                          ? "Remove Administrator"
                          : "Make Administrator"}
                      </button>
                    </form>
                  </ActionSection>

                  <ActionSection
                    title="Add Credits"
                    description="Apply a common purchased-credit amount immediately."
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <CreditQuickAction
                        userId={
                          selectedUser.id
                        }
                        adjustment={10}
                      />

                      <CreditQuickAction
                        userId={
                          selectedUser.id
                        }
                        adjustment={50}
                      />

                      <CreditQuickAction
                        userId={
                          selectedUser.id
                        }
                        adjustment={100}
                      />
                    </div>
                  </ActionSection>

                  <ActionSection
                    title="Custom Credit Adjustment"
                    description="Use a positive number to add credits or a negative number to remove them."
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
                          selectedUser.id
                        }
                      />

                      <label
                        htmlFor="credit-adjustment"
                        className="block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500"
                      >
                        Adjustment
                      </label>

                      <input
                        id="credit-adjustment"
                        name="adjustment"
                        type="number"
                        min="-100000"
                        max="100000"
                        step="1"
                        required
                        placeholder="Example: 25 or -10"
                        className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
                      />

                      <label
                        htmlFor="credit-reason"
                        className="block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500"
                      >
                        Reason
                      </label>

                      <textarea
                        id="credit-reason"
                        name="reason"
                        rows={3}
                        maxLength={300}
                        placeholder="Optional administrator note"
                        className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
                      />

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-violet-800 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-violet-700"
                      >
                        Apply Adjustment
                      </button>
                    </form>
                  </ActionSection>
                </div>
              </section>

              <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-800">
                  Administrative Notice
                </p>

                <p className="mt-3 text-sm font-semibold leading-6 text-amber-950">
                  Role, membership and credit
                  changes take effect
                  immediately. Credit changes
                  are recorded in the user’s
                  ledger.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}
type StatusBadgeProps = {
  children: ReactNode;
  className: string;
};

function StatusBadge({
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-wider ${className}`}
    >
      {children}
    </span>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  accentClass: string;
};

function MetricCard({
  label,
  value,
  detail,
  accentClass,
}: MetricCardProps) {
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

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
};

function SectionHeading({
  eyebrow,
  title,
  description,
  badge,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-start sm:px-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      {badge && (
        <span className="w-fit shrink-0 rounded-full bg-blue-100 px-4 py-2 text-sm font-extrabold text-blue-800">
          {badge}
        </span>
      )}
    </div>
  );
}

type DetailCellProps = {
  label: string;
  value: string;
  breakAll?: boolean;
};

function DetailCell({
  label,
  value,
  breakAll = false,
}: DetailCellProps) {
  return (
    <div className="bg-white px-6 py-5 sm:px-8">
      <dt className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </dt>

      <dd
        className={`mt-2 font-extrabold text-slate-950 ${
          breakAll
            ? "break-all"
            : "break-words"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

type ActionSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function ActionSection({
  title,
  description,
  children,
}: ActionSectionProps) {
  return (
    <section className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
      <h3 className="font-black text-slate-950">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

type CreditQuickActionProps = {
  userId: string;
  adjustment: number;
};

function CreditQuickAction({
  userId,
  adjustment,
}: CreditQuickActionProps) {
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
        value={`Administrator added ${adjustment} purchased credits from the user detail page.`}
      />

      <button
        type="submit"
        className="w-full rounded-xl border border-violet-200 bg-violet-50 px-2 py-3 text-sm font-extrabold text-violet-800 transition hover:bg-violet-100"
      >
        +{adjustment}
      </button>
    </form>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
};

function EmptyState({
  title,
  description,
}: EmptyStateProps) {
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