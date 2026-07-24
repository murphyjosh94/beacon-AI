import type { Metadata } from "next";
import { Suspense } from "react";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";

import CheckoutSuccess from "./CheckoutSuccess";

export const metadata: Metadata = {
  title: "Payment Confirmed | Beacon Business",

  description:
    "Confirm your Beacon Business website payment and review the next project steps.",

  alternates: {
    canonical: "/business/checkout/success",
  },

  robots: {
    index: false,
    follow: false,
  },
};

function CheckoutSuccessFallback() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-2xl">
        <span className="mx-auto inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-blue-950 text-3xl text-white">
          …
        </span>

        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
          Loading Checkout
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
          Preparing your payment confirmation.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Please keep this page open while Beacon loads your secure checkout
          information.
        </p>
      </div>
    </section>
  );
}

export default function BusinessCheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <Suspense fallback={<CheckoutSuccessFallback />}>
        <CheckoutSuccess />
      </Suspense>

      <BeaconFooter />
    </main>
  );
}