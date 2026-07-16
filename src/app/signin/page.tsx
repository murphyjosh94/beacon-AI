"use client";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  FormEvent,
  useEffect,
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
      typeof error.message === "string"
    ) {
      return error.message;
    }

    if (
      "statusText" in error &&
      typeof error.statusText === "string"
    ) {
      return error.statusText;
    }
  }

  return "Beacon could not sign you in. Please check your details and try again.";
}

function readSafeDestination(
  value: string | null
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/dashboard";
  }

  return value;
}

export default function SignInPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const {
    data: session,
    isPending: sessionPending,
  } =
    authClient.useSession();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [rememberMe, setRememberMe] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const destination =
    readSafeDestination(
      searchParams.get(
        "next"
      )
    );

  useEffect(() => {
    if (
      !sessionPending &&
      session?.user
    ) {
      router.replace(
        destination
      );
    }
  }, [
    destination,
    router,
    session,
    sessionPending,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const cleanedEmail =
      email.trim().toLowerCase();

    setError("");

    if (!cleanedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        error: signInError,
      } =
        await authClient.signIn.email({
          email:
            cleanedEmail,

          password,

          rememberMe,

          callbackURL:
            destination,
        });

      if (signInError) {
        throw signInError;
      }

      router.push(
        destination
      );

      router.refresh();
    } catch (caughtError) {
      setError(
        readAuthError(
          caughtError
        )
      );

      setSubmitting(false);
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
              Beacon Members
            </p>

            <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
              Continue where you left off.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Sign in to access your credits,
              Beacon+ membership, saved searches and
              account history.
            </p>

            <div className="mt-9 max-w-xl rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="font-extrabold">
                Your Beacon account keeps everything
                together.
              </p>

              <p className="mt-3 leading-7 text-blue-100">
                Searches and purchases will be tied
                securely to the signed-in account
                rather than trusting information sent
                from the browser.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/20 bg-white p-7 shadow-2xl sm:p-10">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-800">
                Sign in
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Welcome back
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Enter the details used when creating
                your Beacon account.
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

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-extrabold text-slate-800"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-bold text-blue-800 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  disabled={submitting}
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(
                      event.target.checked
                    )
                  }
                  disabled={submitting}
                  className="h-4 w-4 rounded border-slate-300"
                />

                Keep me signed in
              </label>

              <button
                type="submit"
                disabled={
                  submitting ||
                  sessionPending
                }
                className="w-full rounded-2xl bg-blue-900 px-5 py-4 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Signing In..."
                  : "Sign In to Beacon"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              New to Beacon?{" "}
              <Link
                href="/signup"
                className="font-extrabold text-blue-800 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}