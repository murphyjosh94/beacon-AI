"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState("");

  const isRegistering = mode === "register";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(
      isRegistering
        ? "Account creation will be connected to Beacon authentication next."
        : "Secure login will be connected to Beacon authentication next."
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-16">
        <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden min-h-[720px] overflow-hidden bg-slate-950 lg:block">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/media/posters/beacon-hero.png"
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source
                src="/media/hero/beacon-hero-v2.mp4"
                type="video/mp4"
              />
              <source
                src="/media/hero/beacon-hero-v1.mp4"
                type="video/mp4"
              />
            </video>

            <div className="absolute inset-0 bg-slate-950/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/20" />

            <div className="relative flex min-h-[720px] flex-col justify-between p-10 text-white">
              <Link href="/" className="inline-flex w-fit">
                <div className="relative h-24 w-24">
                  <Image
                    src="/images/logo.svg"
                    alt="Beacon AI"
                    fill
                    priority
                    className="object-contain"
                    sizes="96px"
                  />
                </div>
              </Link>

              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
                  Welcome to Beacon
                </p>

                <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight">
                  Better choices start with someone who understands you.
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-8 text-blue-50">
                  Create your free account to save favourites, build your
                  preferences and make every future recommendation more
                  personal.
                </p>

                <div className="mt-8 grid gap-3 text-sm font-bold text-blue-50 sm:grid-cols-2">
                  <span>✓ Five free searches daily</span>
                  <span>✓ Save favourite options</span>
                  <span>✓ Personalised recommendations</span>
                  <span>✓ Beacon+ ready</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center px-6 py-12 sm:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-lg">
              <div className="text-center lg:text-left">
                <div className="relative mx-auto h-24 w-24 lg:hidden">
                  <Image
                    src="/images/logo.svg"
                    alt="Beacon AI"
                    fill
                    priority
                    className="object-contain"
                    sizes="96px"
                  />
                </div>

                <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.28em] text-blue-900 lg:mt-0">
                  My Beacon
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                  {isRegistering
                    ? "Create your account"
                    : "Welcome back"}
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  {isRegistering
                    ? "Start using Beacon as your personal AI shopper. No payment details are required."
                    : "Log in to continue your searches, favourites and personalised recommendations."}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage("");
                  }}
                  className={`rounded-xl px-4 py-3 font-extrabold transition ${
                    mode === "login"
                      ? "bg-white text-blue-950 shadow"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Log In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setMessage("");
                  }}
                  className={`rounded-xl px-4 py-3 font-extrabold transition ${
                    mode === "register"
                      ? "bg-white text-blue-950 shadow"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {isRegistering && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first-name"
                        className="mb-2 block font-extrabold text-slate-900"
                      >
                        First name
                      </label>

                      <input
                        id="first-name"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        placeholder="Your first name"
                        className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-medium text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="last-name"
                        className="mb-2 block font-extrabold text-slate-900"
                      >
                        Last name
                      </label>

                      <input
                        id="last-name"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        required
                        placeholder="Your last name"
                        className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-medium text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block font-extrabold text-slate-900"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-medium text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="font-extrabold text-slate-900"
                    >
                      Password
                    </label>

                    {!isRegistering && (
                      <button
                        type="button"
                        className="text-sm font-extrabold text-blue-800 hover:text-blue-950"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={
                      isRegistering ? "new-password" : "current-password"
                    }
                    required
                    minLength={8}
                    placeholder={
                      isRegistering
                        ? "Create a secure password"
                        : "Enter your password"
                    }
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-medium text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  />

                  {isRegistering && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Use at least eight characters. Password security will be
                      enforced by Beacon authentication.
                    </p>
                  )}
                </div>

                {isRegistering && (
                  <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <input
                      name="termsAccepted"
                      type="checkbox"
                      required
                      className="mt-1 h-5 w-5 shrink-0 rounded border-slate-400"
                    />

                    <span className="text-sm leading-6 text-slate-600">
                      I agree to Beacon&apos;s{" "}
                      <Link
                        href="/terms"
                        className="font-extrabold text-blue-800 hover:text-blue-950"
                      >
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="font-extrabold text-blue-800 hover:text-blue-950"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-blue-900 px-6 py-4 text-lg font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-800"
                >
                  {isRegistering
                    ? "Create Free Account"
                    : "Log In to Beacon"}
                </button>
              </form>

              {message && (
                <div
                  aria-live="polite"
                  className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 font-semibold text-blue-950"
                >
                  {message}
                </div>
              )}

              <p className="mt-8 text-center text-sm leading-6 text-slate-500">
                Beacon earns commission when you choose selected partner
                recommendations. This never guarantees a higher Beacon Score.
              </p>
            </div>
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}