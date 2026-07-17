"use client";

import { useEffect, useRef } from "react";

import {
  trackSearch,
} from "@/components/Analytics";
import {
  useCookieConsent,
} from "@/lib/cookies/consent";

type SearchTrackerProps = {
  query: string;
  resultCount: number;
};

export default function SearchTracker({
  query,
  resultCount,
}: SearchTrackerProps) {
  const {
    analytics,
    isLoaded,
  } =
    useCookieConsent();

  const previousSearchRef =
    useRef<string>("");

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!analytics) {
      return;
    }

    const cleanQuery =
      query.trim();

    if (!cleanQuery) {
      return;
    }

    const key =
      `${cleanQuery}:${resultCount}`;

    if (
      previousSearchRef.current ===
      key
    ) {
      return;
    }

    previousSearchRef.current =
      key;

    trackSearch(
      cleanQuery,
      resultCount
    );
  }, [
    analytics,
    isLoaded,
    query,
    resultCount,
  ]);

  useEffect(() => {
    if (!analytics) {
      previousSearchRef.current =
        "";
    }
  }, [analytics]);

  return null;
}