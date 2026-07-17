"use client";

import { useEffect, useRef } from "react";

import {
  useCookieConsent,
} from "@/lib/cookies/consent";

type AnalyticsProviderProps = {
  children?: React.ReactNode;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function AnalyticsProvider({
  children,
}: AnalyticsProviderProps) {
  const {
    analytics,
    isLoaded,
  } =
    useCookieConsent();

  const analyticsLoaded =
    useRef(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!analytics) {
      return;
    }

    if (analyticsLoaded.current) {
      return;
    }

    analyticsLoaded.current =
      true;

    initializeAnalytics();
  }, [
    analytics,
    isLoaded,
  ]);

  return <>{children}</>;
}

function initializeAnalytics() {
  /*
   * ======================================================
   * Google Analytics
   * ======================================================
   *
   * Example:
   *
   * loadScript(
   *   `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`
   * );
   *
   * window.dataLayer = window.dataLayer ?? [];
   *
   * function gtag(...args: unknown[]) {
   *   window.dataLayer!.push(args);
   * }
   *
   * window.gtag = gtag;
   *
   * gtag("js", new Date());
   *
   * gtag(
   *   "config",
   *   process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
   *   {
   *     anonymize_ip: true,
   *   }
   * );
   */

  /*
   * ======================================================
   * Plausible
   * ======================================================
   *
   * loadScript(
   *   "https://plausible.io/js/script.js",
   *   {
   *     "data-domain":
   *       "beacon-ai.co.uk",
   *   }
   * );
   */

  /*
   * ======================================================
   * PostHog
   * ======================================================
   *
   * posthog.init(...)
   */

  /*
   * ======================================================
   * Microsoft Clarity
   * ======================================================
   *
   * Insert Clarity loader here.
   */

  console.info(
    "[Beacon-AI] Analytics enabled after user consent."
  );
}

function loadScript(
  src: string,
  attributes?: Record<
    string,
    string
  >
) {
  if (
    document.querySelector(
      `script[src="${src}"]`
    )
  ) {
    return;
  }

  const script =
    document.createElement(
      "script"
    );

  script.async = true;
  script.src = src;

  if (attributes) {
    Object.entries(
      attributes
    ).forEach(
      ([
        key,
        value,
      ]) => {
        script.setAttribute(
          key,
          value
        );
      }
    );
  }

  document.head.appendChild(
    script
  );
}