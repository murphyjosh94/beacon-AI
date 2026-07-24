import type { Metadata } from "next";
import { Suspense } from "react";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";

import CheckoutSummary from "./CheckoutSummary";

export const metadata: Metadata = {
  title: "Website Checkout | Beacon Business",

  description:
    "Review your confirmed Beacon Business website package and continue to secure Stripe payment.",

  alternates: {
    canonical: "/business/checkout",
  },

  robots: {
    index: false,
    follow: false,
  },
};

function CheckoutSummaryFallback() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-2xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-blue-950 text-3xl text-white">
            …
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
            Loading Checkout
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Preparing your website order.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Beacon is loading your confirmed package, optional modules and
            secure payment details.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="h-44 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
          </div>

          <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </div>
    </section>
  );
}

export default function BusinessCheckoutPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <Suspense fallback={<CheckoutSummaryFallback />}>
        <CheckoutSummary />
      </Suspense>

      <BeaconFooter />
    </main>
  );
}