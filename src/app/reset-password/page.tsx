"use client";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  FormEvent,
  Suspense,
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

  return "Beacon could not reset your password. Please request a new reset link and try again.";
}

function ResetPasswordForm() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const token =
    searchParams.get("token");

  const resetError =
    searchParams.get("error");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    completed,
    setCompleted,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  const invalidToken =
    !token ||
    resetError === "INVALID_TOKEN";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      submitting ||
      invalidToken
    ) {
      return;
    }

    setError("");

    if (
      password.length < 8
    ) {
      setError(
        "Your new password must contain at least 8 characters."
      );

      return;
    }

    if (
      password.length > 128
    ) {
      setError(
        "Your password must contain no more than 128 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Your passwords do not match."
      );

      return;
    }

    setSubmitting(true);

    try {
      const result =
        await authClient.resetPassword({
          newPassword:
            password,

          token,
        });

      if (result.error) {
        throw result.error;
      }

      setPassword("");
      setConfirmPassword("");
      setCompleted(true);
    } catch (caughtError) {
      console.error(
        "Beacon password reset failed:",
        caughtError
      );

      setError(
        readAuthError(
          caughtError
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="rounded-[2rem] border border-white/20 bg-white p-7 shadow-2xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-800">
          ✓
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-800">
            Password updated
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Your password has been reset
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Your new Beacon AI password is now
            active. You can sign in using your
            updated details.
          </p>
        </div>

        <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-extrabold text-emerald-950">
            Your account is ready
          </p>

          <p className="mt-2 text-sm leading-6 text-emerald-900">
            For security, existing sessions are
            revoked when your password is reset.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            router.replace(
              "/signin"
            );
          }}
          className="mt-6 w-full rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
        >
          Sign in to Beacon
        </button>
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className="rounded-[2rem] border border-white/20 bg-white p-7 shadow-2xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-800">
          !
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-amber-700">
            Reset link unavailable
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950">
            This link has expired or is invalid
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Password reset links expire after
            1 hour and can only be used with a
            valid reset token.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="mt-7 flex w-full items-center justify-center rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
        >
          Request a new reset link
        </Link>

        <Link
          href="/signin"
          className="mt-4 flex w-full items-center justify-center rounded-2xl border border-blue-900 px-5 py-4 font-extrabold text-blue-900 transition hover:bg-blue-50"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/20 bg-white p-7 shadow-2xl sm:p-10">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-800">
          Secure password reset
        </p>

        <h2 className="mt-3 text-3xl font-black text-slate-950">
          Choose a new password
        </h2>

        <p className="mt-3 leading-7 text-slate-600">
          Enter and confirm the new password you
          want to use for your Beacon AI account.
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
            htmlFor="new-password"
            className="block text-sm font-extrabold text-slate-800"
          >
            New password
          </label>

          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            disabled={submitting}
            placeholder="At least 8 characters"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-extrabold text-slate-800"
          >
            Confirm new password
          </label>

          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            disabled={submitting}
            placeholder="Enter your new password again"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Your password must contain at least
          8 characters. Use a password you do not
          use on another website.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Updating password..."
            : "Reset my password"}
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
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="rounded-[2rem] border border-white/20 bg-white p-7 shadow-2xl sm:p-10">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-10 w-72 rounded bg-slate-200" />
        <div className="h-5 w-full rounded bg-slate-100" />

        <div className="mt-8 h-14 rounded-2xl bg-slate-100" />
        <div className="h-14 rounded-2xl bg-slate-100" />
        <div className="h-14 rounded-2xl bg-blue-100" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-14 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="text-white">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
              Beacon Account Security
            </p>

            <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
              Secure your Beacon account.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Choose a new password to restore
              access to your Beacon AI account.
            </p>

            <div className="mt-9 max-w-xl rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="font-extrabold">
                Reset links are temporary.
              </p>

              <p className="mt-3 leading-7 text-blue-100">
                Each password reset link expires
                after 1 hour. If yours has expired,
                request a fresh one from the sign-in
                page.
              </p>
            </div>
          </div>

          <Suspense
            fallback={
              <ResetPasswordFallback />
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}