"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";

import {
  authClient,
} from "@/lib/auth/AuthClient";

function readAuthError(
  error: unknown
): string {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    if (
      "message" in error &&
      typeof error.message === "string" &&
      error.message.trim()
    ) {
      return error.message;
    }

    if (
      "statusText" in error &&
      typeof error.statusText === "string" &&
      error.statusText.trim()
    ) {
      return error.statusText;
    }
  }

  return "Beacon could not send the password reset email. Please try again.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    submitted,
    setSubmitted,
  ] =
    useState(false);

  const [
    submittedEmail,
    setSubmittedEmail,
  ] =
    useState("");

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const cleanedEmail =
      email
        .trim()
        .toLowerCase();

    setError("");

    if (!cleanedEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    setSubmitting(true);

    try {
      const result =
        await authClient.requestPasswordReset({
          email:
            cleanedEmail,

          redirectTo:
            "/reset-password",
        });

      if (result.error) {
        throw result.error;
      }

      setSubmittedEmail(
        cleanedEmail
      );

      setSubmitted(
        true
      );
    } catch (caughtError) {
      console.error(
        "Beacon password reset request failed:",
        caughtError
      );

      setError(
        readAuthError(
          caughtError
        )
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-14 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="text-white">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
              Beacon Account
            </p>

            <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
              Get back into your account.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Enter the email address linked to your
              Beacon AI account and we&apos;ll send
              you a secure password reset link.
            </p>

            <div className="mt-9 max-w-xl rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="font-extrabold">
                Your account security comes first.
              </p>

              <p className="mt-3 leading-7 text-blue-100">
                Password reset links expire after
                1 hour and can only be used to
                choose a new password for your
                account.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/20 bg-white p-7 shadow-2xl sm:p-10">
            {submitted ? (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl text-blue-900">
                  ✓
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-800">
                    Check your email
                  </p>

                  <h2 className="mt-3 text-3xl font-black text-slate-950">
                    Reset link requested
                  </h2>

                  <p className="mt-4 leading-7 text-slate-600">
                    If a Beacon AI account exists
                    for
                  </p>

                  <p className="mt-2 break-all font-extrabold text-slate-950">
                    {submittedEmail}
                  </p>

                  <p className="mt-5 leading-7 text-slate-600">
                    a secure password reset email
                    has been sent.
                  </p>
                </div>

                <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="font-extrabold text-blue-950">
                    Can&apos;t see the email?
                  </p>

                  <p className="mt-2 text-sm leading-6 text-blue-900">
                    Check your spam or junk folder.
                    Delivery can occasionally take a
                    minute.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setError("");
                  }}
                  className="mt-6 w-full rounded-2xl border border-blue-900 px-5 py-4 font-extrabold text-blue-900 transition hover:bg-blue-50"
                >
                  Try another email
                </button>

                <Link
                  href="/signin"
                  className="mt-4 flex w-full items-center justify-center rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
                >
                  Back to sign in
                </Link>

                <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                  For security, Beacon will not
                  confirm whether an account exists
                  for a particular email address.
                </p>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-800">
                    Password reset
                  </p>

                  <h2 className="mt-3 text-3xl font-black text-slate-950">
                    Forgot your password?
                  </h2>

                  <p className="mt-3 leading-7 text-slate-600">
                    Enter your Beacon AI account
                    email and we&apos;ll send you a
                    secure reset link.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
                  >
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="mt-7 space-y-5"
                >
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-extrabold text-slate-800"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      disabled={submitting}
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? "Sending reset email..."
                      : "Send password reset email"}
                  </button>
                </form>

                <p className="mt-7 text-center text-sm text-slate-600">
                  Remember your password?{" "}

                  <Link
                    href="/signin"
                    className="font-extrabold text-blue-800 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}