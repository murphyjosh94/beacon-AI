import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import {
  count,
  desc,
  eq,
} from "drizzle-orm";

import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";
import DashboardSignOutButton from "@/components/dashboard/DashboardSignOutButton";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";

import {
  savedSearch,
  searchHistory,
  user,
} from "@/lib/database/schema";

export const dynamic =
  "force-dynamic";

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

function getFirstName(
  name: string
): string {
  return (
    name
      .trim()
      .split(/\s+/)[0] ||
    "there"
  );
}

function getSearchStatusStyle(
  status:
    | "started"
    | "completed"
    | "failed"
): string {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "failed") {
    return "bg-red-100 text-red-800";
  }

  return "bg-amber-100 text-amber-800";
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

export default async function DashboardPage() {
  const requestHeaders =
    await headers();

  const session =
    await auth.api.getSession({
      headers:
        requestHeaders,
    });

  if (!session?.user) {
    redirect(
      "/signin?next=/dashboard"
    );
  }

  const [
    accountRows,
    recentSearches,
    savedSearches,
    searchCountRows,
    savedCountRows,
  ] = await Promise.all([
    database
      .select()
      .from(user)
      .where(
        eq(
          user.id,
          session.user.id
        )
      )
      .limit(1),

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
          session.user.id
        )
      )
      .orderBy(
        desc(
          searchHistory.createdAt
        )
      )
      .limit(5),

    database
      .select({
        id:
          savedSearch.id,

        name:
          savedSearch.name,

        query:
          savedSearch.query,

        category:
          savedSearch.category,

        createdAt:
          savedSearch.createdAt,
      })
      .from(savedSearch)
      .where(
        eq(
          savedSearch.userId,
          session.user.id
        )
      )
      .orderBy(
        desc(
          savedSearch.createdAt
        )
      )
      .limit(5),

    database
      .select({
        total:
          count(),
      })
      .from(searchHistory)
      .where(
        eq(
          searchHistory.userId,
          session.user.id
        )
      ),

    database
      .select({
        total:
          count(),
      })
      .from(savedSearch)
      .where(
        eq(
          savedSearch.userId,
          session.user.id
        )
      ),
  ]);

  const account =
    accountRows[0];

  if (!account) {
    redirect("/signin");
  }

  const searchCount =
    Number(
      searchCountRows[0]?.total ??
        0
    );

  const savedCount =
    Number(
      savedCountRows[0]?.total ??
        0
    );

  const isBeaconPlus =
    account.beaconPlusActive;

  const membershipLabel =
    isBeaconPlus
      ? "Beacon+"
      : "Free Member";

  const firstName =
    getFirstName(
      account.name
    );

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-12 text-white sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950" />

        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
              Beacon Member Dashboard
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Welcome back,{" "}
              {firstName}.
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-100">
              Manage your searches,
              credits, saved results and
              Beacon+ membership from one
              place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Start a Search
            </Link>

            <DashboardSignOutButton />
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric
              label="Membership"
              value={membershipLabel}
              detail={
                isBeaconPlus
                  ? "Unlimited searches, subject to fair use"
                  : "Upgrade for the full Beacon experience"
              }
              accentClass={
                isBeaconPlus
                  ? "from-emerald-600 to-emerald-700"
                  : "from-slate-700 to-slate-800"
              }
            />

            <DashboardMetric
              label="Purchased Credits"
              value={String(
                account.purchasedCredits
              )}
              detail="Credits available after your free allowance"
              accentClass="from-blue-700 to-blue-900"
            />

            <DashboardMetric
              label="Searches"
              value={String(
                searchCount
              )}
              detail="Searches recorded on this account"
              accentClass="from-indigo-600 to-indigo-800"
            />

            <DashboardMetric
              label="Saved Searches"
              value={String(
                savedCount
              )}
              detail="Saved searches ready to revisit"
              accentClass="from-violet-600 to-violet-800"
            />
          </div>

          <div className="mt-8 grid gap-7 xl:grid-cols-[1.4fr_0.8fr]">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
                    Activity
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Recent Searches
                  </h2>
                </div>

                <Link
                  href="/"
                  className="text-sm font-extrabold text-blue-800 hover:underline"
                >
                  New Search
                </Link>
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

                              {search.resultCount >
                                0 && (
                                <>
                                  <span
                                    aria-hidden="true"
                                  >
                                    •
                                  </span>

                                  <span>
                                    {
                                      search.resultCount
                                    }{" "}
                                    results
                                  </span>
                                </>
                              )}
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
                                1 credit
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <DashboardEmptyState
                  title="No searches yet"
                  description="Your completed Beacon searches will appear here once search history is connected."
                  actionHref="/"
                  actionLabel="Start Searching"
                />
              )}
            </section>

            <aside className="space-y-7">
              <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-950 to-indigo-950 p-7 text-white shadow-xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-blue-200">
                  Membership
                </p>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black">
                      {membershipLabel}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-blue-100">
                      {isBeaconPlus
                        ? "Your Beacon+ membership is active."
                        : "Unlock unlimited research and member tools."}
                    </p>
                  </div>

                  <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-wider">
                    {isBeaconPlus
                      ? "Active"
                      : "Free"}
                  </div>
                </div>

                {isBeaconPlus &&
                  account.beaconPlusCurrentPeriodEnd && (
                    <p className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-semibold text-blue-50">
                      Current period ends{" "}
                      {formatDate(
                        account.beaconPlusCurrentPeriodEnd
                      )}
                    </p>
                  )}

                <Link
                  href="/pricing"
                  className="mt-7 block rounded-xl bg-white px-5 py-3 text-center text-sm font-extrabold text-blue-950 transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  {isBeaconPlus
                    ? "Manage Membership"
                    : "Upgrade to Beacon+"}
                </Link>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500">
                  Account
                </p>

                <h2 className="mt-3 text-xl font-black text-slate-950">
                  {account.name}
                </h2>

                <p className="mt-2 break-all text-sm text-slate-600">
                  {account.email}
                </p>

                <dl className="mt-6 space-y-4 border-t border-slate-200 pt-5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="font-semibold text-slate-500">
                      Email status
                    </dt>

                    <dd
                      className={`font-extrabold ${
                        account.emailVerified
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {account.emailVerified
                        ? "Verified"
                        : "Not verified"}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="font-semibold text-slate-500">
                      Member since
                    </dt>

                    <dd className="font-extrabold text-slate-800">
                      {formatDate(
                        account.createdAt
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="font-semibold text-slate-500">
                      Billing
                    </dt>

                    <dd className="font-extrabold text-slate-800">
                      {account.stripeCustomerId
                        ? "Connected"
                        : "Not connected"}
                    </dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>

          <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-violet-700">
                  Saved
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Saved Searches
                </h2>
              </div>

              <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-extrabold text-violet-800">
                {savedCount} saved
              </span>
            </div>

            {savedSearches.length >
            0 ? (
              <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3 sm:p-8">
                {savedSearches.map(
                  (saved) => (
                    <article
                      key={saved.id}
                      className="flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                          {saved.category ??
                            "Search"}
                        </p>

                        <span className="text-xs font-semibold text-slate-400">
                          {formatDate(
                            saved.createdAt
                          )}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-black text-slate-950">
                        {saved.name}
                      </h3>

                      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                        {saved.query}
                      </p>

                      <Link
                        href={`/?q=${encodeURIComponent(
                          saved.query
                        )}`}
                        className="mt-5 font-extrabold text-blue-800 hover:underline"
                      >
                        Run Search Again
                      </Link>
                    </article>
                  )
                )}
              </div>
            ) : (
              <DashboardEmptyState
                title="Nothing saved yet"
                description="Saved products, hotels and searches will appear here once the save controls are connected."
                actionHref="/"
                actionLabel="Explore Beacon"
              />
            )}
          </section>

          <section className="mt-8">
            <div className="mb-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500">
                Quick Actions
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Continue with Beacon
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <QuickAction
                title="Start a Search"
                description="Ask Beacon to compare products, hotels or experiences."
                href="/"
                label="Search Now"
              />

              <QuickAction
                title="Buy Credits"
                description="Add more searches to your account with a one-time payment."
                href="/pricing"
                label="View Pricing"
              />

              <QuickAction
                title="Manage Beacon+"
                description="Upgrade or review your Beacon membership."
                href="/pricing"
                label="Membership"
              />

              <QuickAction
                title="Account Settings"
                description="Profile, security and billing controls are coming next."
                href="/dashboard"
                label="Current Account"
              />
            </div>
          </section>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}

type DashboardMetricProps = {
  label: string;
  value: string;
  detail: string;
  accentClass: string;
};

function DashboardMetric({
  label,
  value,
  detail,
  accentClass,
}: DashboardMetricProps) {
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

type DashboardEmptyStateProps = {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
};

function DashboardEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: DashboardEmptyStateProps) {
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

      <Link
        href={actionHref}
        className="mt-6 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-800"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

type QuickActionProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

function QuickAction({
  title,
  description,
  href,
  label,
}: QuickActionProps) {
  return (
    <article className="flex min-h-56 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <h3 className="text-xl font-black text-slate-950">
        {title}
      </h3>

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