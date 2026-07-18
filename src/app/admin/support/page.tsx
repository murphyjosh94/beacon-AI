// Placeholder complete page for Admin Support.
// This page is intentionally self-contained and compiles once the referenced
// project imports exist.

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";
import DashboardSignOutButton from "@/components/dashboard/DashboardSignOutButton";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";
import { user } from "@/lib/database/schema";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/signin?next=/admin/support");
  }

  const rows = await database
    .select({
      id: user.id,
      name: user.name,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!rows[0] || rows[0].role !== "admin") {
    redirect("/dashboard");
  }

  return rows[0];
}

export default async function AdminSupportPage() {
  const admin = await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <section className="bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm font-bold text-slate-300 hover:text-white">
              ← Back to admin
            </Link>

            <h1 className="mt-4 text-5xl font-black">
              Support Workspace
            </h1>

            <p className="mt-4 max-w-3xl text-slate-300">
              Search users, review accounts, recent searches, credits,
              subscriptions, audit history and internal support notes.
            </p>

            <p className="mt-6 text-sm text-slate-400">
              Signed in as <strong>{admin.name}</strong>
            </p>
          </div>

          <DashboardSignOutButton />
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-10">

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black">User Lookup</h2>

          <form className="mt-6 grid gap-4 md:grid-cols-5">
            <input
              name="q"
              placeholder="Name, email, user ID, Stripe customer, subscription..."
              className="md:col-span-4 rounded-xl border px-4 py-3"
            />

            <button
              className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
              type="submit"
            >
              Search
            </button>
          </form>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          <section className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black">
              Account Summary
            </h2>

            <ul className="mt-6 space-y-3 text-sm">
              <li>• Name</li>
              <li>• Email</li>
              <li>• Role</li>
              <li>• Verification status</li>
              <li>• Beacon+ status</li>
              <li>• Credits</li>
              <li>• Stripe customer</li>
              <li>• Subscription</li>
            </ul>
          </section>

          <section className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black">
              Quick Actions
            </h2>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/users" className="rounded-xl bg-slate-900 px-5 py-3 text-white font-bold">
                User Manager
              </Link>

              <Link href="/admin/analytics" className="rounded-xl border px-5 py-3 font-bold">
                Analytics
              </Link>

              <Link href="/admin/audit" className="rounded-xl border px-5 py-3 font-bold">
                Audit
              </Link>

              <Link href="/admin/stripe" className="rounded-xl border px-5 py-3 font-bold">
                Stripe
              </Link>
            </div>
          </section>

        </div>

        <div className="grid gap-6 xl:grid-cols-2">

          <section className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black">
              Recent Searches
            </h2>

            <p className="mt-6 text-slate-500">
              Populate this section from your search_history table.
            </p>
          </section>

          <section className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black">
              Credit Ledger
            </h2>

            <p className="mt-6 text-slate-500">
              Populate this section from credit_ledger.
            </p>
          </section>

          <section className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black">
              Audit History
            </h2>

            <p className="mt-6 text-slate-500">
              Show recent admin actions affecting the selected user.
            </p>
          </section>

          <section className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black">
              Internal Support Notes
            </h2>

            <textarea
              rows={10}
              placeholder="Private notes..."
              className="mt-6 w-full rounded-xl border p-4"
            />

            <button className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">
              Save Note
            </button>
          </section>

        </div>

      </section>

      <BeaconFooter />
    </main>
  );
}