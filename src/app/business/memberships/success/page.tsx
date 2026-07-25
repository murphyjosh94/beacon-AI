"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type MembershipPlanId = "business" | "business_pro";

type VerificationResponse = {
  verified: boolean;
  planId?: MembershipPlanId;
  planName?: string;
  customerEmail?: string | null;
  trialEndsAt?: string | null;
  status?: string | null;
  error?: string;
};

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function MembershipSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [verification, setVerification] =
    useState<VerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function verifyCheckout() {
      if (!sessionId) {
        if (isMounted) {
          setVerification({
            verified: false,
            error: "The Stripe checkout session could not be found.",
          });
          setIsLoading(false);
        }

        return;
      }

      try {
        const response = await fetch(
          `/api/business/membership/session?session_id=${encodeURIComponent(
            sessionId,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = (await response.json().catch(() => null)) as
          | VerificationResponse
          | null;

        if (!response.ok || !data) {
          throw new Error(
            data?.error ?? "We could not verify your membership checkout.",
          );
        }

        if (isMounted) {
          setVerification(data);
        }
      } catch (error) {
        if (isMounted) {
          setVerification({
            verified: false,
            error:
              error instanceof Error
                ? error.message
                : "We could not verify your membership checkout.",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void verifyCheckout();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const trialEndDate = useMemo(
    () => formatDate(verification?.trialEndsAt),
    [verification?.trialEndsAt],
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-amber-300" />
          <h1 className="mt-7 text-3xl font-black tracking-tight">
            Confirming your membership
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            We are securely checking your Stripe subscription and free trial.
          </p>
        </div>
      </main>
    );
  }

  if (!verification?.verified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
        <div className="w-full max-w-2xl rounded-3xl border border-red-300/20 bg-white/5 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-400/15 text-3xl font-black text-red-200">
            !
          </div>

          <p className="mt-7 text-sm font-black uppercase tracking-[0.22em] text-red-200">
            Verification incomplete
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            We could not confirm your membership yet
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-300">
            {verification?.error ??
              "Your payment may still be processing. Please return to the memberships page and try again if needed."}
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-7 py-4 font-black text-slate-950 transition hover:bg-amber-300"
              href="/business/memberships"
            >
              Return to Memberships
              <ArrowIcon />
            </Link>

            <Link
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-7 py-4 font-bold text-white transition hover:bg-white/10"
              href="/business"
            >
              Beacon Business Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-20 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.30),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.18),transparent_32%)]" />

        <div className="relative mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30">
              <CheckIcon />
            </div>

            <p className="mt-7 text-sm font-black uppercase tracking-[0.22em] text-amber-200">
              Membership confirmed
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Welcome to {verification.planName ?? "Beacon Business"}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Your 14-day free trial is now active. We will begin looking after
              your website under your selected membership.
            </p>

            <div className="mx-auto mt-10 grid max-w-2xl gap-4 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="text-sm font-bold text-slate-400">
                  Membership
                </div>
                <div className="mt-2 text-lg font-black text-white">
                  {verification.planName ?? "Beacon Business"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="text-sm font-bold text-slate-400">
                  Trial period
                </div>
                <div className="mt-2 text-lg font-black text-white">
                  {trialEndDate
                    ? `Free until ${trialEndDate}`
                    : "14-day free trial active"}
                </div>
              </div>

              {verification.customerEmail ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:col-span-2">
                  <div className="text-sm font-bold text-slate-400">
                    Confirmation email
                  </div>
                  <div className="mt-2 break-all text-lg font-black text-white">
                    {verification.customerEmail}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-left">
              <h2 className="font-black text-amber-100">
                What happens after the free trial?
              </h2>
              <p className="mt-2 leading-7 text-slate-200">
                Monthly billing begins automatically after the 14-day trial
                unless you cancel beforehand. There is no setup fee, and you
                can cancel at any time.
              </p>
            </div>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-7 py-4 font-black text-slate-950 transition hover:bg-amber-300"
                href="/business/dashboard"
              >
                Go to Business Dashboard
                <ArrowIcon />
              </Link>

              <Link
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-7 py-4 font-bold text-white transition hover:bg-white/10"
                href="/business/memberships"
              >
                View Memberships
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16 text-slate-950 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Website care begins",
                text: "Your selected maintenance and support services can now be prepared.",
              },
              {
                title: "You stay in control",
                text: "You can manage, change or cancel your subscription through secure Stripe billing.",
              },
              {
                title: "Support is available",
                text: "Use your Beacon Business dashboard whenever you need help with your website.",
              },
            ].map((item) => (
              <article
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
                key={item.title}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                  <CheckIcon />
                </div>
                <h2 className="mt-5 text-xl font-black">{item.title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-sm leading-6 text-slate-500">
            Keep your Stripe confirmation email for your records. It contains
            details of your subscription and trial.
          </p>
        </div>
      </section>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-amber-300" />
        <h1 className="mt-7 text-3xl font-black tracking-tight">
          Loading your membership
        </h1>
      </div>
    </main>
  );
}

export default function BusinessMembershipSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MembershipSuccessContent />
    </Suspense>
  );
}