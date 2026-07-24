"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type VerifiedOrder = {
  sessionId: string;
  paymentStatus: string;
  customerEmail: string;
  customerName: string;
  businessName: string;
  packageId: string;
  packageName: string;
  modules: string[];
  amountTotal: number;
  currency: string;
  createdAt: string;
};

const PAID_ORDER_STORAGE_KEY = "beacon-business-paid-order";

function formatCurrency(amountInMinorUnits: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInMinorUnits / 100);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Payment confirmed";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [order, setOrder] = useState<VerifiedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No Stripe checkout session was provided.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const verifyPayment = async () => {
      try {
        const response = await fetch(
          `/api/business/checkout/session?session_id=${encodeURIComponent(
            sessionId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = (await response.json()) as {
          order?: VerifiedOrder;
          error?: string;
        };

        if (!response.ok || !result.order) {
          throw new Error(
            result.error || "Unable to verify the Stripe payment."
          );
        }

        if (cancelled) {
          return;
        }

        setOrder(result.order);
        window.localStorage.setItem(
          PAID_ORDER_STORAGE_KEY,
          JSON.stringify(result.order)
        );
      } catch (verificationError) {
        if (cancelled) {
          return;
        }

        setError(
          verificationError instanceof Error
            ? verificationError.message
            : "Unable to verify the Stripe payment."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-2xl">
          <span className="mx-auto inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-blue-950 text-3xl text-white">
            …
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
            Verifying Payment
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Confirming your secure Stripe payment.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Please keep this page open while Beacon verifies the payment
            directly with Stripe.
          </p>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-rose-200 bg-white p-10 text-center shadow-2xl">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-3xl font-black text-white">
            !
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-rose-700">
            Verification Required
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            We could not confirm this payment yet.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {error ||
              "The checkout session could not be verified as a paid Beacon Business order."}
          </p>

          <div className="mx-auto mt-7 max-w-2xl rounded-2xl bg-slate-50 px-5 py-4 text-left text-sm font-semibold leading-6 text-slate-700">
            Do not make a second payment until you have checked Stripe or
            contacted Beacon support. A delayed confirmation does not always
            mean the payment failed.
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/business/checkout"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900"
            >
              Return to checkout
            </Link>

            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-7 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
            >
              Business dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-blue-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl font-black text-emerald-700 shadow-2xl">
            ✓
          </span>

          <p className="mt-7 text-sm font-extrabold uppercase tracking-[0.3em] text-emerald-100">
            Payment Confirmed
          </p>

          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Your Beacon Business website project is now active.
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-emerald-50">
            Stripe has confirmed your payment. Beacon can now move your
            approved website direction into the professional build stage.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_390px]">
          <div className="space-y-8">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
                Order Confirmed
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Thank you, {order.customerName || order.businessName}.
              </h2>

              <p className="mt-4 leading-8 text-slate-600">
                Your payment has been verified and your website order is ready
                to enter the production workflow.
              </p>

              <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <dt className="text-sm font-bold text-slate-500">
                    Business
                  </dt>
                  <dd className="mt-2 font-black text-slate-950">
                    {order.businessName}
                  </dd>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <dt className="text-sm font-bold text-slate-500">
                    Package
                  </dt>
                  <dd className="mt-2 font-black text-slate-950">
                    {order.packageName}
                  </dd>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <dt className="text-sm font-bold text-slate-500">
                    Payment confirmed
                  </dt>
                  <dd className="mt-2 font-black text-slate-950">
                    {formatDate(order.createdAt)}
                  </dd>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <dt className="text-sm font-bold text-slate-500">
                    Customer email
                  </dt>
                  <dd className="mt-2 break-all font-black text-slate-950">
                    {order.customerEmail || "Not supplied"}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                What Happens Next
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Your project moves into production.
              </h2>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "Payment recorded",
                    text: "Your Stripe payment has been verified and attached to this website order.",
                    complete: true,
                  },
                  {
                    title: "Content and asset check",
                    text: "Beacon checks that the business information, logos, images and required content are available.",
                    complete: false,
                  },
                  {
                    title: "Professional website build",
                    text: "The approved preview is developed into the complete production website.",
                    complete: false,
                  },
                  {
                    title: "Quality assurance",
                    text: "The website is tested across mobile and desktop before launch approval.",
                    complete: false,
                  },
                  {
                    title: "Domain connection and launch",
                    text: "The finished website is connected to the approved domain and published.",
                    complete: false,
                  },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className={`flex gap-4 rounded-2xl border p-5 ${
                      step.complete
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black ${
                        step.complete
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {step.complete ? "✓" : index + 1}
                    </span>

                    <div>
                      <h3 className="font-black text-slate-950">
                        {step.title}
                      </h3>

                      <p className="mt-2 leading-7 text-slate-600">
                        {step.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-blue-200 bg-blue-50 p-7 sm:p-8">
              <p className="font-black text-blue-950">
                Estimated completion: approximately 2–4 weeks
              </p>

              <p className="mt-3 leading-7 text-blue-900">
                The timeline depends on receiving all required content,
                completing any agreed revisions and confirming the domain
                connection details.
              </p>
            </article>
          </div>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl lg:sticky lg:top-6">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Payment Summary
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              {order.businessName}
            </h2>

            <div className="mt-7 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="font-black text-slate-950">
                    {order.packageName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Website package
                  </p>
                </div>
              </div>

              {order.modules.length ? (
                order.modules.map((module) => (
                  <div
                    key={module}
                    className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4"
                  >
                    <div>
                      <p className="font-black text-slate-950">{module}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Optional module
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  No optional modules selected.
                </p>
              )}

              <div className="flex items-end justify-between gap-4 pt-2">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Amount paid
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Confirmed directly by Stripe.
                  </p>
                </div>

                <p className="text-3xl font-black text-emerald-700">
                  {formatCurrency(order.amountTotal, order.currency)}
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-black text-emerald-900">Payment successful</p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Status: {order.paymentStatus}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/business/dashboard"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
              >
                Open business dashboard
              </Link>

              <Link
                href="/business"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
              >
                Explore business tools
              </Link>
            </div>

            <p className="mt-5 break-all text-center text-xs font-semibold leading-5 text-slate-500">
              Stripe session: {order.sessionId}
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}