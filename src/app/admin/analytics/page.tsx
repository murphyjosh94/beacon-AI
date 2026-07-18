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

type QueryResultRow = Record<string, unknown>;

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

type DailyRow = {
  day: string | Date;
  total: number | string;
};

type CategoryRow = {
  category: string | null;
  total: number | string;
};

type LeaderboardRow = {
  id: string;
  name: string;
  email: string;
  searches: number | string;
  completed: number | string;
  failed: number | string;
};

function rowsFromResult<T extends QueryResultRow>(result: unknown): T[] {
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
  const row = rowsFromResult<{ value: number | string | null }>(result)[0];
  return Number(row?.value ?? 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDay(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function percentage(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return (part / total) * 100;
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Administrator";
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
    redirect("/signin?next=/admin/analytics");
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

export default async function AdminAnalyticsPage() {
  const administrator = await requireAdministrator();

  const [
    totalUsersResult,
    usersTodayResult,
    usersWeekResult,
    usersMonthResult,
    verifiedUsersResult,
    beaconPlusResult,
    totalSearchesResult,
    searchesTodayResult,
    searchesWeekResult,
    searchesMonthResult,
    completedSearchesResult,
    failedSearchesResult,
    chargedSearchesResult,
    activeUsersResult,
    zeroSearchUsersResult,
    purchasedBalanceResult,
    creditsPurchasedResult,
    creditsUsedResult,
    creditsRefundedResult,
    creditsAdjustedResult,
    dailyUsersResult,
    dailySearchesResult,
    categoriesResult,
    leaderboardResult,
  ] = await Promise.all([
    database.execute(sql`
      select count(*)::int as value
      from "user"
    `),

    database.execute(sql`
      select count(*)::int as value
      from "user"
      where created_at >= date_trunc('day', now())
    `),

    database.execute(sql`
      select count(*)::int as value
      from "user"
      where created_at >= now() - interval '7 days'
    `),

    database.execute(sql`
      select count(*)::int as value
      from "user"
      where created_at >= now() - interval '30 days'
    `),

    database.execute(sql`
      select count(*)::int as value
      from "user"
      where email_verified = true
    `),

    database.execute(sql`
      select count(*)::int as value
      from "user"
      where beacon_plus_active = true
    `),

    database.execute(sql`
      select count(*)::int as value
      from search_history
    `),

    database.execute(sql`
      select count(*)::int as value
      from search_history
      where created_at >= date_trunc('day', now())
    `),

    database.execute(sql`
      select count(*)::int as value
      from search_history
      where created_at >= now() - interval '7 days'
    `),

    database.execute(sql`
      select count(*)::int as value
      from search_history
      where created_at >= now() - interval '30 days'
    `),

    database.execute(sql`
      select count(*)::int as value
      from search_history
      where status = 'completed'
    `),

    database.execute(sql`
      select count(*)::int as value
      from search_history
      where status = 'failed'
    `),

    database.execute(sql`
      select count(*)::int as value
      from search_history
      where credit_charged = true
    `),

    database.execute(sql`
      select count(distinct user_id)::int as value
      from search_history
      where created_at >= now() - interval '30 days'
    `),

    database.execute(sql`
      select count(*)::int as value
      from "user" u
      where not exists (
        select 1
        from search_history s
        where s.user_id = u.id
      )
    `),

    database.execute(sql`
      select coalesce(sum(purchased_credits), 0)::int as value
      from "user"
    `),

    database.execute(sql`
      select coalesce(sum(amount), 0)::int as value
      from credit_ledger
      where type = 'purchase'
        and amount > 0
    `),

    database.execute(sql`
      select coalesce(abs(sum(amount)), 0)::int as value
      from credit_ledger
      where type = 'search'
        and amount < 0
    `),

    database.execute(sql`
      select coalesce(sum(amount), 0)::int as value
      from credit_ledger
      where type = 'refund'
        and amount > 0
    `),

    database.execute(sql`
      select coalesce(sum(amount), 0)::int as value
      from credit_ledger
      where type in ('adjustment', 'promotion')
    `),

    database.execute(sql`
      with days as (
        select generate_series(
          date_trunc('day', now()) - interval '13 days',
          date_trunc('day', now()),
          interval '1 day'
        ) as day
      )
      select
        days.day,
        count(u.id)::int as total
      from days
      left join "user" u
        on u.created_at >= days.day
       and u.created_at < days.day + interval '1 day'
      group by days.day
      order by days.day
    `),

    database.execute(sql`
      with days as (
        select generate_series(
          date_trunc('day', now()) - interval '13 days',
          date_trunc('day', now()),
          interval '1 day'
        ) as day
      )
      select
        days.day,
        count(s.id)::int as total
      from days
      left join search_history s
        on s.created_at >= days.day
       and s.created_at < days.day + interval '1 day'
      group by days.day
      order by days.day
    `),

    database.execute(sql`
      select
        coalesce(nullif(trim(category), ''), 'Uncategorised') as category,
        count(*)::int as total
      from search_history
      where created_at >= now() - interval '30 days'
      group by coalesce(nullif(trim(category), ''), 'Uncategorised')
      order by total desc
      limit 8
    `),

    database.execute(sql`
      select
        u.id,
        u.name,
        u.email,
        count(s.id)::int as searches,
        count(*) filter (where s.status = 'completed')::int as completed,
        count(*) filter (where s.status = 'failed')::int as failed
      from "user" u
      join search_history s
        on s.user_id = u.id
      where s.created_at >= now() - interval '30 days'
      group by u.id, u.name, u.email
      order by searches desc
      limit 10
    `),
  ]);

  const totalUsers = numberFromResult(totalUsersResult);
  const usersToday = numberFromResult(usersTodayResult);
  const usersWeek = numberFromResult(usersWeekResult);
  const usersMonth = numberFromResult(usersMonthResult);
  const verifiedUsers = numberFromResult(verifiedUsersResult);
  const beaconPlusMembers = numberFromResult(beaconPlusResult);

  const totalSearches = numberFromResult(totalSearchesResult);
  const searchesToday = numberFromResult(searchesTodayResult);
  const searchesWeek = numberFromResult(searchesWeekResult);
  const searchesMonth = numberFromResult(searchesMonthResult);
  const completedSearches = numberFromResult(completedSearchesResult);
  const failedSearches = numberFromResult(failedSearchesResult);
  const chargedSearches = numberFromResult(chargedSearchesResult);
  const activeUsers = numberFromResult(activeUsersResult);
  const zeroSearchUsers = numberFromResult(zeroSearchUsersResult);

  const purchasedBalance = numberFromResult(purchasedBalanceResult);
  const creditsPurchased = numberFromResult(creditsPurchasedResult);
  const creditsUsed = numberFromResult(creditsUsedResult);
  const creditsRefunded = numberFromResult(creditsRefundedResult);
  const creditsAdjusted = numberFromResult(creditsAdjustedResult);

  const dailyUsers = rowsFromResult<DailyRow>(dailyUsersResult);
  const dailySearches = rowsFromResult<DailyRow>(dailySearchesResult);
  const categories = rowsFromResult<CategoryRow>(categoriesResult);
  const leaderboard = rowsFromResult<LeaderboardRow>(leaderboardResult);

  const successRate = percentage(completedSearches, totalSearches);
  const failureRate = percentage(failedSearches, totalSearches);
  const conversionRate = percentage(beaconPlusMembers, totalUsers);
  const verificationRate = percentage(verifiedUsers, totalUsers);
  const averageSearches =
    totalUsers > 0 ? totalSearches / totalUsers : 0;

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
                Analytics
              </h1>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-200">
                Live user growth, search performance, membership adoption and
                credit activity from Beacon’s database.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/settings"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
              >
                Site Settings
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
          <AnalyticsSection
            eyebrow="Growth"
            title="User growth"
            description="Registration, verification and Beacon+ adoption."
          >
            <MetricGrid>
              <MetricCard
                label="Total users"
                value={formatNumber(totalUsers)}
                detail={`${formatNumber(usersToday)} joined today`}
                accentClass="from-slate-700 to-slate-950"
              />

              <MetricCard
                label="New this week"
                value={formatNumber(usersWeek)}
                detail={`${formatNumber(usersMonth)} in the last 30 days`}
                accentClass="from-blue-700 to-blue-950"
              />

              <MetricCard
                label="Beacon+ members"
                value={formatNumber(beaconPlusMembers)}
                detail={`${formatDecimal(conversionRate)}% conversion`}
                accentClass="from-emerald-700 to-emerald-950"
              />

              <MetricCard
                label="Verified users"
                value={formatNumber(verifiedUsers)}
                detail={`${formatDecimal(verificationRate)}% verification rate`}
                accentClass="from-violet-700 to-violet-950"
              />
            </MetricGrid>

            <div className="mt-6">
              <BarChart
                title="New users — last 14 days"
                rows={dailyUsers}
                emptyText="No registration activity is available yet."
              />
            </div>
          </AnalyticsSection>

          <AnalyticsSection
            eyebrow="Searches"
            title="Search performance"
            description="Volume, outcomes, credit charging and member engagement."
          >
            <MetricGrid>
              <MetricCard
                label="Total searches"
                value={formatNumber(totalSearches)}
                detail={`${formatNumber(searchesToday)} today`}
                accentClass="from-indigo-700 to-indigo-950"
              />

              <MetricCard
                label="Last 7 days"
                value={formatNumber(searchesWeek)}
                detail={`${formatNumber(searchesMonth)} in 30 days`}
                accentClass="from-cyan-700 to-blue-950"
              />

              <MetricCard
                label="Success rate"
                value={`${formatDecimal(successRate)}%`}
                detail={`${formatNumber(completedSearches)} completed`}
                accentClass="from-emerald-700 to-teal-950"
              />

              <MetricCard
                label="Failure rate"
                value={`${formatDecimal(failureRate)}%`}
                detail={`${formatNumber(failedSearches)} failed`}
                accentClass="from-amber-600 to-red-900"
              />

              <MetricCard
                label="Charged searches"
                value={formatNumber(chargedSearches)}
                detail="Searches that consumed purchased credit"
                accentClass="from-fuchsia-700 to-purple-950"
              />

              <MetricCard
                label="Average per user"
                value={formatDecimal(averageSearches)}
                detail="Lifetime searches per account"
                accentClass="from-sky-700 to-slate-950"
              />

              <MetricCard
                label="Active users"
                value={formatNumber(activeUsers)}
                detail="Accounts searching in the last 30 days"
                accentClass="from-lime-700 to-emerald-950"
              />

              <MetricCard
                label="Zero-search users"
                value={formatNumber(zeroSearchUsers)}
                detail="Registered accounts with no search history"
                accentClass="from-slate-600 to-slate-900"
              />
            </MetricGrid>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <BarChart
                title="Searches — last 14 days"
                rows={dailySearches}
                emptyText="No search activity is available yet."
              />

              <CategoryChart categories={categories} />
            </div>
          </AnalyticsSection>

          <AnalyticsSection
            eyebrow="Credits"
            title="Credit economy"
            description="Purchased balances and ledger movement across Beacon."
          >
            <MetricGrid>
              <MetricCard
                label="Outstanding balance"
                value={formatNumber(purchasedBalance)}
                detail="Purchased credits currently held by users"
                accentClass="from-violet-700 to-indigo-950"
              />

              <MetricCard
                label="Credits purchased"
                value={formatNumber(creditsPurchased)}
                detail="Positive purchase ledger entries"
                accentClass="from-emerald-700 to-emerald-950"
              />

              <MetricCard
                label="Credits used"
                value={formatNumber(creditsUsed)}
                detail="Credits removed by paid searches"
                accentClass="from-blue-700 to-blue-950"
              />

              <MetricCard
                label="Credits refunded"
                value={formatNumber(creditsRefunded)}
                detail={`${formatNumber(creditsAdjusted)} net adjustment`}
                accentClass="from-amber-600 to-orange-900"
              />
            </MetricGrid>
          </AnalyticsSection>

          <AnalyticsSection
            eyebrow="Leaderboard"
            title="Most active users"
            description="Accounts with the most searches during the last 30 days."
          >
            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <TableHeading>User</TableHeading>
                      <TableHeading>Searches</TableHeading>
                      <TableHeading>Completed</TableHeading>
                      <TableHeading>Failed</TableHeading>
                      <TableHeading>Success</TableHeading>
                      <TableHeading>Account</TableHeading>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((account, index) => {
                      const searches = Number(account.searches);
                      const completed = Number(account.completed);
                      const failed = Number(account.failed);

                      return (
                        <tr
                          key={account.id}
                          className="transition hover:bg-slate-50"
                        >
                          <TableCell>
                            <div className="min-w-60">
                              <p className="font-black text-slate-950">
                                <span className="mr-3 text-slate-400">
                                  #{index + 1}
                                </span>
                                {account.name}
                              </p>

                              <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                                {account.email}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <strong className="text-slate-950">
                              {formatNumber(searches)}
                            </strong>
                          </TableCell>

                          <TableCell>
                            <span className="font-extrabold text-emerald-700">
                              {formatNumber(completed)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-extrabold text-red-700">
                              {formatNumber(failed)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-extrabold text-slate-700">
                              {formatDecimal(
                                percentage(completed, searches)
                              )}
                              %
                            </span>
                          </TableCell>

                          <TableCell>
                            <Link
                              href={`/admin/users/${encodeURIComponent(
                                account.id
                              )}`}
                              className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-slate-700"
                            >
                              View user
                            </Link>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No active users"
                description="User activity will appear after searches have been recorded."
              />
            )}
          </AnalyticsSection>

          <section className="rounded-[2rem] border border-blue-200 bg-blue-50 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-800">
              Revenue note
            </p>

            <h2 className="mt-2 text-xl font-black text-blue-950">
              Revenue totals are not estimated here
            </h2>

            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-blue-950">
              Accurate MRR, ARR, payments and refunds require Stripe invoice
              data. Those figures belong in the dedicated Stripe admin page
              rather than being guessed from membership flags.
            </p>
          </section>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}

function AnalyticsSection({
  eyebrow,
  title,
  description,
  children,
}: SectionProps) {
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

function MetricGrid({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
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

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          {detail}
        </p>
      </div>
    </article>
  );
}

function BarChart({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: DailyRow[];
  emptyText: string;
}) {
  const maximum = Math.max(
    1,
    ...rows.map((row) => Number(row.total))
  );

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <h3 className="text-lg font-black text-slate-950">
        {title}
      </h3>

      {rows.length > 0 ? (
        <div
          className="mt-6 flex h-64 items-end gap-2"
          role="img"
          aria-label={title}
        >
          {rows.map((row) => {
            const total = Number(row.total);
            const height = Math.max(
              total > 0 ? 8 : 2,
              (total / maximum) * 100
            );

            return (
              <div
                key={new Date(row.day).toISOString()}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              >
                <span className="mb-2 text-xs font-black text-slate-700">
                  {formatNumber(total)}
                </span>

                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-800 to-indigo-500"
                  style={{
                    height: `${height}%`,
                  }}
                  title={`${formatDay(row.day)}: ${formatNumber(total)}`}
                />

                <span className="mt-2 hidden text-[10px] font-bold text-slate-500 sm:block">
                  {formatDay(row.day)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 text-sm font-semibold text-slate-500">
          {emptyText}
        </p>
      )}
    </section>
  );
}

function CategoryChart({
  categories,
}: {
  categories: CategoryRow[];
}) {
  const maximum = Math.max(
    1,
    ...categories.map((category) => Number(category.total))
  );

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <h3 className="text-lg font-black text-slate-950">
        Popular categories — 30 days
      </h3>

      {categories.length > 0 ? (
        <div className="mt-6 space-y-4">
          {categories.map((category) => {
            const total = Number(category.total);
            const width = Math.max(
              4,
              (total / maximum) * 100
            );

            return (
              <div
                key={
                  category.category ??
                  "Uncategorised"
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="truncate text-sm font-extrabold text-slate-700">
                    {category.category ?? "Uncategorised"}
                  </p>

                  <p className="shrink-0 text-sm font-black text-slate-950">
                    {formatNumber(total)}
                  </p>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-700 to-indigo-500"
                    style={{
                      width: `${width}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 text-sm font-semibold text-slate-500">
          No category activity is available yet.
        </p>
      )}
    </section>
  );
}

function TableHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-6 py-4 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td className="px-6 py-5 align-top text-sm">
      {children}
    </td>
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
    <div className="px-6 py-14 text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl"
      >
        ◇
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