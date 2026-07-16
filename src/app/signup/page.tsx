"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

  return "Beacon could not create your account. Please try again.";
}

export default function SignUpPage() {
  const router =
    useRouter();

  const {
    data: session,
    isPending: sessionPending,
  } =
    authClient.useSession();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (
      !sessionPending &&
      session?.user
    ) {
      router.replace(
        "/dashboard"
      );
    }
  }, [
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

    const cleanedName =
      name.trim();

    const cleanedEmail =
      email.trim().toLowerCase();

    setError("");

    if (!cleanedName) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!cleanedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (
      password.length < 8
    ) {
      setError(
        "Your password must contain at least 8 characters."
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

    if (!acceptedTerms) {
      setError(
        "Please accept the Terms and Privacy Policy."
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        error: signUpError,
      } =
        await authClient.signUp.email({
          name:
            cleanedName,

          email:
            cleanedEmail,

          password,

          callbackURL:
            "/dashboard",
        });

      if (signUpError) {
        throw signUpError;
      }

      router.push(
        "/dashboard"
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-blue-900" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="text-white">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
              Join Beacon AI
            </p>

            <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
              Your searches, saved in one place.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Create your account to manage
              searches, credits, saved results and
              Beacon+ membership.
            </p>

            <div className="mt-9 grid max-w-2xl gap-4 sm:grid-cols-2">
              {[
                "Manage purchased search credits",
                "View recent Beacon searches",
                "Save products, hotels and offers",
                "Manage Beacon+ membership",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 font-semibold text-blue-50 backdrop-blur"
                >
                  <span
                    aria-hidden="true"
                    className="mr-2 text-blue-300"
                  >
                    ✓
                  </span>

                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/20 bg-white p-7 shadow-2xl sm:p-10">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-800">
                Create account
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Welcome to Beacon
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Enter your details to create your
                free account.
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
                  htmlFor="name"
                  className="block text-sm font-extrabold text-slate-800"
                >
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  disabled={submitting}
                  placeholder="Your name"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

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
                <label
                  htmlFor="password"
                  className="block text-sm font-extrabold text-slate-800"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
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
                  Confirm password
                </label>

                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  disabled={submitting}
                  placeholder="Enter your password again"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) =>
                    setAcceptedTerms(
                      event.target.checked
                    )
                  }
                  disabled={submitting}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />

                <span className="text-sm leading-6 text-slate-600">
                  I agree to Beacon AI&apos;s{" "}
                  <Link
                    href="/terms"
                    className="font-bold text-blue-800 hover:underline"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-bold text-blue-800 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
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
                  ? "Creating Account..."
                  : "Create My Account"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Already have a Beacon account?{" "}
              <Link
                href="/signin"
                className="font-extrabold text-blue-800 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}