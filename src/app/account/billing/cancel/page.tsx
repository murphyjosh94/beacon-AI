import Link from "next/link";

import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";

export const metadata = {
  title:
    "Checkout cancelled | Beacon",
  description:
    "Your Beacon checkout was cancelled and no payment was taken.",
};

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-16 text-white sm:py-24">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />

          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cyan-400 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/15">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-10 w-10 text-amber-300"
            >
              <path
                d="M12 8v5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M12 17h.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <path
                d="M10.2 4.6 3.4 16.4A2 2 0 0 0 5.1 19h13.8a2 2 0 0 0 1.7-2.6L13.8 4.6a2 2 0 0 0-3.6 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="mt-7 text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
            Checkout cancelled
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            No payment was taken.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            You left Stripe Checkout
            before completing your
            purchase. Your Beacon
            account and billing details
            have not been changed.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
              What happens now?
            </p>

            <h2 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
              You can return whenever
              you are ready.
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Your selected Beacon+
              membership or credit pack
              was not purchased. You
              can review the options
              again and start a new
              secure Stripe Checkout
              session at any time.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-6 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Return to pricing
              </Link>

              <Link
                href="/account/billing"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 font-extrabold text-slate-900 transition hover:bg-slate-100"
              >
                View billing account
              </Link>
            </div>
          </article>

          <aside className="mt-8 rounded-[2rem] border border-blue-200 bg-blue-50 p-7">
            <h2 className="text-xl font-black text-slate-950">
              Need help choosing?
            </h2>

            <p className="mt-3 leading-7 text-slate-700">
              Beacon+ is available
              with monthly or annual
              billing. Credit packs are
              separate one-off
              purchases and never
              create a recurring
              subscription.
            </p>

            <Link
              href="/dashboard"
              className="mt-5 inline-flex font-extrabold text-blue-900 underline decoration-2 underline-offset-4 transition hover:text-blue-700"
            >
              Return to dashboard
            </Link>
          </aside>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}