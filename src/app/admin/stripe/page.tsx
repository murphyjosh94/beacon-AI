import type { ReactNode } from "react";
import type Stripe from "stripe";

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
import { getStripeClient } from "@/lib/stripe/StripeClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type LocalSubscriptionRow = {
  id: string;
  name: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  beacon_plus_active: boolean;
  beacon_plus_current_period_end: Date | string | null;
};

type WebhookRow = {
  stripe_event_id: string;
  event_type: string;
  status: string;
  error_message: string | null;
  created_at: Date | string;
  processed_at: Date | string | null;
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

type StripeSnapshot = {
  subscriptions: Stripe.Subscription[];
  charges: Stripe.Charge[];
  refunds: Stripe.Refund[];
  balance: Stripe.Balance | null;
  error: string | null;
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

function formatMoney(amount: number, currency = "gbp"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(value: number | Date | string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date =
    typeof value === "number"
      ? new Date(value * 1000)
      : new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(
  value: number | Date | string | null | undefined
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    typeof value === "number"
      ? new Date(value * 1000)
      : new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Administrator";
}

function readExpandableId(
  value:
    | string
    | { id: string }
    | null
    | undefined
): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function stripeDashboardUrl(path: string): string {
  const testMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
  return `https://dashboard.stripe.com/${testMode ? "test/" : ""}${path}`;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  const values = subscription.items.data
    .map((item) => item.current_period_end)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value)
    );

  return values.length > 0 ? Math.max(...values) : null;
}

function subscriptionAmount(subscription: Stripe.Subscription): {
  amount: number;
  currency: string;
  interval: string;
} {
  const item = subscription.items.data[0];
  const price = item?.price;

  return {
    amount: (price?.unit_amount ?? 0) * (item?.quantity ?? 1),
    currency: price?.currency ?? "gbp",
    interval: price?.recurring?.interval ?? "unknown",
  };
}

function calculateRecurringRevenue(
  subscriptions: Stripe.Subscription[]
): {
  mrr: number;
  arr: number;
  currency: string;
} {
  let mrr = 0;
  let currency = "gbp";

  for (const subscription of subscriptions) {
    if (!["active", "trialing", "past_due"].includes(subscription.status)) {
      continue;
    }

    const value = subscriptionAmount(subscription);
    currency = value.currency;

    if (value.interval === "month") {
      mrr += value.amount;
    } else if (value.interval === "year") {
      mrr += value.amount / 12;
    } else if (value.interval === "week") {
      mrr += (value.amount * 52) / 12;
    } else if (value.interval === "day") {
      mrr += (value.amount * 365) / 12;
    }
  }

  return {
    mrr: Math.round(mrr),
    arr: Math.round(mrr * 12),
    currency,
  };
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
    redirect("/signin?next=/admin/stripe");
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

async function readStripeSnapshot(): Promise<StripeSnapshot> {
  try {
    const stripe = getStripeClient();

    const [subscriptions, charges, refunds, balance] = await Promise.all([
      stripe.subscriptions.list({
        status: "all",
        limit: 100,
        expand: ["data.customer"],
      }),
      stripe.charges.list({
        limit: 50,
        expand: ["data.customer"],
      }),
      stripe.refunds.list({
        limit: 50,
      }),
      stripe.balance.retrieve(),
    ]);

    return {
      subscriptions: subscriptions.data,
      charges: charges.data,
      refunds: refunds.data,
      balance,
      error: null,
    };
  } catch (error) {
    return {
      subscriptions: [],
      charges: [],
      refunds: [],
      balance: null,
      error:
        error instanceof Error
          ? error.message
          : "Stripe data could not be loaded.",
    };
  }
}

export default async function AdminStripePage({
  searchParams,
}: PageProps) {
  const administrator = await requireAdministrator();
  const params = (await searchParams) ?? {};
  const query = readSearchParam(params, "q").toLowerCase().slice(0, 200);

  const [localSubscriptionsResult, webhookResult, stripeSnapshot] =
    await Promise.all([
      database.execute(sql`
        select
          id,
          name,
          email,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_subscription_status,
          beacon_plus_active,
          beacon_plus_current_period_end
        from "user"
        where
          stripe_customer_id is not null
          or stripe_subscription_id is not null
          or beacon_plus_active = true
        order by
          beacon_plus_active desc,
          beacon_plus_current_period_end desc nulls last,
          created_at desc
        limit 250
      `),

      database.execute(sql`
        select
          stripe_event_id,
          event_type,
          status,
          error_message,
          created_at,
          processed_at
        from stripe_webhook_event
        order by created_at desc
        limit 30
      `),

      readStripeSnapshot(),
    ]);

  const localSubscriptions =
    rowsFromResult<LocalSubscriptionRow>(localSubscriptionsResult);

  const webhookEvents = rowsFromResult<WebhookRow>(webhookResult);

  const subscriptions = stripeSnapshot.subscriptions;
  const charges = stripeSnapshot.charges;
  const refunds = stripeSnapshot.refunds;

  const recurring = calculateRecurringRevenue(subscriptions);

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "active"
  ).length;

  const trialingSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "trialing"
  ).length;

  const pastDueSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "past_due"
  ).length;

  const canceledSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status === "canceled" ||
      subscription.cancel_at_period_end
  ).length;

  const successfulRevenue = charges
    .filter((charge) => charge.paid && !charge.refunded)
    .reduce((total, charge) => total + charge.amount_captured, 0);

  const refundedRevenue = refunds
    .filter((refund) => refund.status === "succeeded")
    .reduce((total, refund) => total + refund.amount, 0);

  const revenueCurrency =
    charges.find((charge) => charge.currency)?.currency ??
    recurring.currency;

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (!query) {
      return true;
    }

    const customer =
      typeof subscription.customer === "object" &&
      subscription.customer &&
      !("deleted" in subscription.customer)
        ? subscription.customer
        : null;

    const searchable = [
      subscription.id,
      subscription.status,
      readExpandableId(subscription.customer),
      customer?.email,
      customer?.name,
      subscription.metadata?.beaconUserId,
      subscription.metadata?.purchaseType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });

  const filteredCharges = charges.filter((charge) => {
    if (!query) {
      return true;
    }

    const customer =
      typeof charge.customer === "object" &&
      charge.customer &&
      !("deleted" in charge.customer)
        ? charge.customer
        : null;

    const searchable = [
      charge.id,
      charge.payment_intent,
      charge.receipt_email,
      charge.billing_details.email,
      customer?.email,
      customer?.name,
      readExpandableId(charge.customer),
      charge.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-10 text-white sm:py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950" />
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-36 left-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-indigo-200 transition hover:text-white"
              >
                ← Back to admin dashboard
              </Link>

              <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.28em] text-indigo-200">
                Beacon Administration
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Stripe
              </h1>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-200">
                Subscription health, recurring revenue, payments, refunds and
                webhook processing.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={stripeDashboardUrl("")}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"
              >
                Open Stripe Dashboard ↗
              </a>

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
          {stripeSnapshot.error && (
            <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-800">
                Stripe unavailable
              </p>

              <h2 className="mt-2 text-xl font-black text-red-950">
                Live Stripe data could not be loaded
              </h2>

              <p className="mt-3 break-words text-sm font-semibold leading-7 text-red-900">
                {stripeSnapshot.error}
              </p>
            </section>
          )}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Monthly revenue"
              value={formatMoney(recurring.mrr, recurring.currency)}
              detail="Estimated from active Stripe subscription prices"
              accentClass="from-emerald-700 to-emerald-950"
            />

            <MetricCard
              label="Annual revenue"
              value={formatMoney(recurring.arr, recurring.currency)}
              detail="MRR multiplied by twelve"
              accentClass="from-blue-700 to-blue-950"
            />

            <MetricCard
              label="Captured payments"
              value={formatMoney(successfulRevenue, revenueCurrency)}
              detail={`Across ${formatNumber(charges.length)} recent charges`}
              accentClass="from-violet-700 to-violet-950"
            />

            <MetricCard
              label="Refunded"
              value={formatMoney(refundedRevenue, revenueCurrency)}
              detail={`${formatNumber(refunds.length)} recent refund records`}
              accentClass="from-amber-600 to-red-900"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Active"
              value={formatNumber(activeSubscriptions)}
              detail="Stripe subscriptions with active status"
              accentClass="from-emerald-700 to-teal-950"
            />

            <MetricCard
              label="Trials"
              value={formatNumber(trialingSubscriptions)}
              detail="Subscriptions currently trialing"
              accentClass="from-cyan-700 to-blue-950"
            />

            <MetricCard
              label="Past due"
              value={formatNumber(pastDueSubscriptions)}
              detail="Subscriptions requiring payment attention"
              accentClass="from-orange-600 to-red-900"
            />

            <MetricCard
              label="Canceling or canceled"
              value={formatNumber(canceledSubscriptions)}
              detail="Canceled or ending after the current period"
              accentClass="from-slate-700 to-slate-950"
            />
          </div>

          {stripeSnapshot.balance && (
            <AnalyticsSection
              eyebrow="Balance"
              title="Stripe account balance"
              description="Available and pending funds reported by Stripe."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <BalanceList
                  title="Available"
                  amounts={stripeSnapshot.balance.available}
                />

                <BalanceList
                  title="Pending"
                  amounts={stripeSnapshot.balance.pending}
                />
              </div>
            </AnalyticsSection>
          )}

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
                Customer lookup
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Search Stripe records
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Search by customer email, customer ID, subscription ID,
                payment ID or Beacon user ID.
              </p>
            </div>

            <form
              method="get"
              action="/admin/stripe"
              className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:p-8"
            >
              <label className="block flex-1">
                <span className="text-sm font-extrabold text-slate-700">
                  Search
                </span>

                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Email, cus_…, sub_…, pi_… or Beacon user ID"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-slate-700"
              >
                Search
              </button>

              {query && (
                <Link
                  href="/admin/stripe"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
                >
                  Clear
                </Link>
              )}
            </form>
          </section>

          <AnalyticsSection
            eyebrow="Subscriptions"
            title="Stripe subscriptions"
            description="Live subscription records returned by Stripe."
          >
            {filteredSubscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <TableHeading>Customer</TableHeading>
                      <TableHeading>Status</TableHeading>
                      <TableHeading>Plan</TableHeading>
                      <TableHeading>Period end</TableHeading>
                      <TableHeading>Identifiers</TableHeading>
                      <TableHeading>Stripe</TableHeading>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredSubscriptions.map((subscription) => {
                      const customer =
                        typeof subscription.customer === "object" &&
                        subscription.customer &&
                        !("deleted" in subscription.customer)
                          ? subscription.customer
                          : null;

                      const amount = subscriptionAmount(subscription);
                      const customerId = readExpandableId(
                        subscription.customer
                      );

                      return (
                        <tr
                          key={subscription.id}
                          className="transition hover:bg-slate-50"
                        >
                          <TableCell>
                            <p className="min-w-52 font-black text-slate-950">
                              {customer?.name ||
                                customer?.email ||
                                "Stripe customer"}
                            </p>

                            <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                              {customer?.email || "No email returned"}
                            </p>
                          </TableCell>

                          <TableCell>
                            <StatusBadge status={subscription.status} />

                            {subscription.cancel_at_period_end && (
                              <p className="mt-2 text-xs font-bold text-amber-700">
                                Cancels at period end
                              </p>
                            )}
                          </TableCell>

                          <TableCell>
                            <p className="font-black text-slate-950">
                              {formatMoney(amount.amount, amount.currency)}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              per {amount.interval}
                            </p>
                          </TableCell>

                          <TableCell>
                            <span className="font-bold text-slate-700">
                              {formatDate(subscriptionPeriodEnd(subscription))}
                            </span>
                          </TableCell>

                          <TableCell>
                            <Identifier label="Subscription" value={subscription.id} />
                            <Identifier label="Customer" value={customerId} />
                          </TableCell>

                          <TableCell>
                            <a
                              href={stripeDashboardUrl(
                                `subscriptions/${subscription.id}`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-lg bg-slate-950 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-slate-700"
                            >
                              Open ↗
                            </a>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No matching subscriptions"
                description="No Stripe subscriptions matched the current search."
              />
            )}
          </AnalyticsSection>

          <AnalyticsSection
            eyebrow="Payments"
            title="Recent Stripe charges"
            description="The latest payment charges returned by Stripe."
          >
            {filteredCharges.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <TableHeading>Customer</TableHeading>
                      <TableHeading>Amount</TableHeading>
                      <TableHeading>Status</TableHeading>
                      <TableHeading>Date</TableHeading>
                      <TableHeading>Payment</TableHeading>
                      <TableHeading>Stripe</TableHeading>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredCharges.map((charge) => (
                      <tr
                        key={charge.id}
                        className="transition hover:bg-slate-50"
                      >
                        <TableCell>
                          <p className="min-w-52 font-black text-slate-950">
                            {charge.billing_details.name ||
                              charge.receipt_email ||
                              "Stripe customer"}
                          </p>

                          <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                            {charge.billing_details.email ||
                              charge.receipt_email ||
                              "No email returned"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-black text-slate-950">
                            {formatMoney(charge.amount, charge.currency)}
                          </p>

                          {charge.amount_refunded > 0 && (
                            <p className="mt-1 text-xs font-bold text-amber-700">
                              {formatMoney(
                                charge.amount_refunded,
                                charge.currency
                              )}{" "}
                              refunded
                            </p>
                          )}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={
                              charge.refunded
                                ? "refunded"
                                : charge.status
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <span className="font-bold text-slate-700">
                            {formatDateTime(charge.created)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Identifier label="Charge" value={charge.id} />
                          <Identifier
                            label="Payment intent"
                            value={readExpandableId(charge.payment_intent)}
                          />
                        </TableCell>

                        <TableCell>
                          <a
                            href={stripeDashboardUrl(`payments/${charge.id}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-lg bg-slate-950 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-slate-700"
                          >
                            Open ↗
                          </a>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No matching payments"
                description="No recent Stripe charges matched the current search."
              />
            )}
          </AnalyticsSection>

          <AnalyticsSection
            eyebrow="Beacon database"
            title="Local subscription state"
            description="Subscription fields currently stored on Beacon user accounts."
          >
            {localSubscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <TableHeading>User</TableHeading>
                      <TableHeading>Beacon+</TableHeading>
                      <TableHeading>Status</TableHeading>
                      <TableHeading>Period end</TableHeading>
                      <TableHeading>Stripe IDs</TableHeading>
                      <TableHeading>Account</TableHeading>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {localSubscriptions.map((account) => (
                      <tr
                        key={account.id}
                        className="transition hover:bg-slate-50"
                      >
                        <TableCell>
                          <p className="min-w-52 font-black text-slate-950">
                            {account.name}
                          </p>

                          <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                            {account.email}
                          </p>
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={
                              account.beacon_plus_active
                                ? "active"
                                : "inactive"
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <span className="font-bold text-slate-700">
                            {account.stripe_subscription_status ||
                              "Not recorded"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-bold text-slate-700">
                            {formatDate(
                              account.beacon_plus_current_period_end
                            )}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Identifier
                            label="Customer"
                            value={account.stripe_customer_id}
                          />
                          <Identifier
                            label="Subscription"
                            value={account.stripe_subscription_id}
                          />
                        </TableCell>

                        <TableCell>
                          <Link
                            href={`/admin/users/${encodeURIComponent(
                              account.id
                            )}`}
                            className="inline-flex rounded-lg bg-slate-950 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-slate-700"
                          >
                            View user
                          </Link>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No local subscription records"
                description="Beacon has not stored any Stripe customer or subscription IDs yet."
              />
            )}
          </AnalyticsSection>

          <AnalyticsSection
            eyebrow="Webhooks"
            title="Recent Stripe webhook events"
            description="Processing history from Beacon’s Stripe webhook idempotency table."
          >
            {webhookEvents.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {webhookEvents.map((event) => (
                  <article
                    key={event.stripe_event_id}
                    className="grid gap-4 px-1 py-5 lg:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={event.status} />

                        <span className="text-sm font-black text-slate-950">
                          {event.event_type}
                        </span>
                      </div>

                      <p className="mt-3 break-all text-xs font-semibold text-slate-500">
                        {event.stripe_event_id}
                      </p>

                      {event.error_message && (
                        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-900">
                          {event.error_message}
                        </p>
                      )}
                    </div>

                    <div className="text-sm font-bold text-slate-600 lg:text-right">
                      <p>{formatDateTime(event.created_at)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Processed: {formatDateTime(event.processed_at)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No webhook events"
                description="Stripe webhook deliveries will appear after Beacon receives them."
              />
            )}
          </AnalyticsSection>
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

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          {detail}
        </p>
      </div>
    </article>
  );
}

function BalanceList({
  title,
  amounts,
}: {
  title: string;
  amounts: Stripe.Balance.Available[];
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>

      <div className="mt-4 space-y-3">
        {amounts.length > 0 ? (
          amounts.map((amount) => (
            <div
              key={`${title}-${amount.currency}`}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
            >
              <span className="font-bold uppercase text-slate-500">
                {amount.currency}
              </span>

              <span className="font-black text-slate-950">
                {formatMoney(amount.amount, amount.currency)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-slate-500">
            No balance reported.
          </p>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const classes =
    normalized === "active" ||
    normalized === "succeeded" ||
    normalized === "paid" ||
    normalized === "completed"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "trialing" ||
          normalized === "processing" ||
          normalized === "pending"
        ? "bg-blue-100 text-blue-800"
        : normalized === "past_due" ||
            normalized === "requires_action" ||
            normalized === "refunded"
          ? "bg-amber-100 text-amber-800"
          : normalized === "failed" ||
              normalized === "canceled" ||
              normalized === "inactive"
            ? "bg-red-100 text-red-800"
            : "bg-slate-100 text-slate-800";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${classes}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function Identifier({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <p className="max-w-64 break-all text-xs font-semibold leading-5 text-slate-500">
      <span className="font-black text-slate-700">{label}:</span>{" "}
      {value || "Not recorded"}
    </p>
  );
}

function TableHeading({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-6 py-4 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-6 py-5 align-top text-sm">{children}</td>;
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