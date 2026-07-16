"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/AuthClient";

export default function DashboardSignOutButton() {
  const router = useRouter();

  const [signingOut, setSigningOut] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setError("");

    try {
      const { error: signOutError } =
        await authClient.signOut();

      if (signOutError) {
        throw signOutError;
      }

      router.replace("/signin");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not sign you out."
      );

      setSigningOut(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {signingOut
          ? "Signing Out..."
          : "Sign Out"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-2 max-w-xs text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}