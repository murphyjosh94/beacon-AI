"use client";

import { useEffect, useRef } from "react";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  trackPageView,
} from "@/components/Analytics";
import {
  useCookieConsent,
} from "@/lib/cookies/consent";

function buildPagePath(
  pathname: string,
  searchParams: URLSearchParams
): string {
  const queryString =
    searchParams.toString();

  if (!queryString) {
    return pathname;
  }

  return `${pathname}?${queryString}`;
}

export default function PageViewTracker() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const {
    analytics,
    isLoaded,
  } =
    useCookieConsent();

  const lastTrackedPathRef =
    useRef<string | null>(
      null
    );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!analytics) {
      return;
    }

    const pagePath =
      buildPagePath(
        pathname,
        searchParams
      );

    if (
      lastTrackedPathRef.current ===
      pagePath
    ) {
      return;
    }

    const tracked =
      trackPageView({
        path: pagePath,
        title:
          document.title,
        referrer:
          document.referrer ||
          undefined,
      });

    if (tracked) {
      lastTrackedPathRef.current =
        pagePath;
    }
  }, [
    analytics,
    isLoaded,
    pathname,
    searchParams,
  ]);

  useEffect(() => {
    if (analytics) {
      return;
    }

    lastTrackedPathRef.current =
      null;
  }, [analytics]);

  return null;
}