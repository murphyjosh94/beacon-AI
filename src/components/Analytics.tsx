"use client";

import { useCallback } from "react";

import {
  hasAnalyticsConsent,
  subscribeToConsent,
} from "@/lib/cookies/consent";

export type AnalyticsValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type AnalyticsProperties = Record<
  string,
  AnalyticsValue
>;

export type AnalyticsEvent = {
  name: string;
  properties?: AnalyticsProperties;
};

export type PageViewEvent = {
  path: string;
  title?: string;
  referrer?: string;
};

type GoogleTagFunction = (
  ...arguments_: unknown[]
) => void;

type PlausibleFunction = (
  eventName: string,
  options?: {
    props?: AnalyticsProperties;
  }
) => void;

type PostHogClient = {
  capture: (
    eventName: string,
    properties?: AnalyticsProperties
  ) => void;

  identify?: (
    userId: string,
    properties?: AnalyticsProperties
  ) => void;

  reset?: () => void;
};

type ClarityFunction = (
  command: string,
  ...arguments_: unknown[]
) => void;

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: GoogleTagFunction;
  plausible?: PlausibleFunction;
  posthog?: PostHogClient;
  clarity?: ClarityFunction;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getAnalyticsWindow(): AnalyticsWindow | null {
  if (!isBrowser()) {
    return null;
  }

  return window as AnalyticsWindow;
}

function canTrackAnalytics(): boolean {
  return (
    isBrowser() &&
    hasAnalyticsConsent()
  );
}

function removeUndefinedValues(
  properties: AnalyticsProperties = {}
): AnalyticsProperties {
  return Object.fromEntries(
    Object.entries(
      properties
    ).filter(
      ([, value]) =>
        value !== undefined
    )
  );
}

function sendToDataLayer(
  eventName: string,
  properties: AnalyticsProperties
): void {
  const analyticsWindow =
    getAnalyticsWindow();

  if (
    !analyticsWindow?.dataLayer
  ) {
    return;
  }

  analyticsWindow.dataLayer.push({
    event: eventName,
    ...properties,
  });
}

function sendToGoogleAnalytics(
  eventName: string,
  properties: AnalyticsProperties
): void {
  const analyticsWindow =
    getAnalyticsWindow();

  if (
    !analyticsWindow?.gtag
  ) {
    return;
  }

  analyticsWindow.gtag(
    "event",
    eventName,
    properties
  );
}

function sendToPlausible(
  eventName: string,
  properties: AnalyticsProperties
): void {
  const analyticsWindow =
    getAnalyticsWindow();

  if (
    !analyticsWindow?.plausible
  ) {
    return;
  }

  analyticsWindow.plausible(
    eventName,
    {
      props: properties,
    }
  );
}

function sendToPostHog(
  eventName: string,
  properties: AnalyticsProperties
): void {
  const analyticsWindow =
    getAnalyticsWindow();

  if (
    !analyticsWindow?.posthog
  ) {
    return;
  }

  analyticsWindow.posthog.capture(
    eventName,
    properties
  );
}

function sendToClarity(
  eventName: string,
  properties: AnalyticsProperties
): void {
  const analyticsWindow =
    getAnalyticsWindow();

  if (
    !analyticsWindow?.clarity
  ) {
    return;
  }

  analyticsWindow.clarity(
    "event",
    eventName,
    properties
  );
}

export function trackEvent({
  name,
  properties = {},
}: AnalyticsEvent): boolean {
  if (
    !canTrackAnalytics()
  ) {
    return false;
  }

  const cleanName =
    name.trim();

  if (
    !cleanName
  ) {
    return false;
  }

  const cleanProperties =
    removeUndefinedValues(
      properties
    );

  sendToDataLayer(
    cleanName,
    cleanProperties
  );

  sendToGoogleAnalytics(
    cleanName,
    cleanProperties
  );

  sendToPlausible(
    cleanName,
    cleanProperties
  );

  sendToPostHog(
    cleanName,
    cleanProperties
  );

  sendToClarity(
    cleanName,
    cleanProperties
  );

  return true;
}

export function trackPageView({
  path,
  title,
  referrer,
}: PageViewEvent): boolean {
  const cleanPath =
    path.trim();

  if (
    !cleanPath
  ) {
    return false;
  }

  return trackEvent({
    name: "page_view",

    properties: {
      page_path: cleanPath,
      page_title: title,
      page_referrer: referrer,
    },
  });
}

export function trackSearch(
  query: string,
  resultCount?: number
): boolean {
  const cleanQuery =
    query.trim();

  if (
    !cleanQuery
  ) {
    return false;
  }

  return trackEvent({
    name: "search",

    properties: {
      search_term: cleanQuery,
      result_count: resultCount,
    },
  });
}

export function trackRecommendationClick({
  recommendationId,
  recommendationTitle,
  category,
  destinationUrl,
  position,
  affiliate,
}: {
  recommendationId?: string;
  recommendationTitle: string;
  category?: string;
  destinationUrl?: string;
  position?: number;
  affiliate?: boolean;
}): boolean {
  return trackEvent({
    name: "recommendation_click",

    properties: {
      recommendation_id:
        recommendationId,

      recommendation_title:
        recommendationTitle,

      category,

      destination_url:
        destinationUrl,

      position,

      affiliate:
        affiliate ?? false,
    },
  });
}

export function trackAffiliateClick({
  merchant,
  destinationUrl,
  itemName,
  category,
  position,
}: {
  merchant: string;
  destinationUrl: string;
  itemName?: string;
  category?: string;
  position?: number;
}): boolean {
  return trackEvent({
    name: "affiliate_click",

    properties: {
      merchant,

      destination_url:
        destinationUrl,

      item_name:
        itemName,

      category,

      position,
    },
  });
}

export function trackBeaconPlusEvent({
  action,
  plan,
  value,
  currency = "GBP",
}: {
  action:
    | "view"
    | "checkout_started"
    | "subscribed"
    | "cancelled"
    | "renewed";

  plan?: string;
  value?: number;
  currency?: string;
}): boolean {
  return trackEvent({
    name:
      `beacon_plus_${action}`,

    properties: {
      plan,
      value,
      currency,
    },
  });
}

export function identifyAnalyticsUser({
  userId,
  properties = {},
}: {
  userId: string;
  properties?: AnalyticsProperties;
}): boolean {
  if (
    !canTrackAnalytics()
  ) {
    return false;
  }

  const cleanUserId =
    userId.trim();

  if (
    !cleanUserId
  ) {
    return false;
  }

  const analyticsWindow =
    getAnalyticsWindow();

  if (
    !analyticsWindow
  ) {
    return false;
  }

  const cleanProperties =
    removeUndefinedValues(
      properties
    );

  analyticsWindow.posthog?.identify?.(
    cleanUserId,
    cleanProperties
  );

  analyticsWindow.clarity?.(
    "identify",
    cleanUserId
  );

  return true;
}

export function resetAnalyticsUser(): void {
  const analyticsWindow =
    getAnalyticsWindow();

  analyticsWindow?.posthog?.reset?.();
}

export function onAnalyticsConsentGranted(
  callback: () => void
): () => void {
  if (
    !isBrowser()
  ) {
    return () => undefined;
  }

  if (
    hasAnalyticsConsent()
  ) {
    callback();
  }

  return subscribeToConsent(
    (
      consent
    ) => {
      if (
        consent?.preferences.analytics
      ) {
        callback();
      }
    }
  );
}

export function useAnalytics() {
  const event =
    useCallback(
      (
        name: string,
        properties?: AnalyticsProperties
      ) => {
        return trackEvent({
          name,
          properties,
        });
      },
      []
    );

  const pageView =
    useCallback(
      (
        path: string,
        options?: {
          title?: string;
          referrer?: string;
        }
      ) => {
        return trackPageView({
          path,

          title:
            options?.title,

          referrer:
            options?.referrer,
        });
      },
      []
    );

  const search =
    useCallback(
      (
        query: string,
        resultCount?: number
      ) => {
        return trackSearch(
          query,
          resultCount
        );
      },
      []
    );

  const recommendationClick =
    useCallback(
      (
        details: Parameters<
          typeof trackRecommendationClick
        >[0]
      ) => {
        return trackRecommendationClick(
          details
        );
      },
      []
    );

  const affiliateClick =
    useCallback(
      (
        details: Parameters<
          typeof trackAffiliateClick
        >[0]
      ) => {
        return trackAffiliateClick(
          details
        );
      },
      []
    );

  const beaconPlus =
    useCallback(
      (
        details: Parameters<
          typeof trackBeaconPlusEvent
        >[0]
      ) => {
        return trackBeaconPlusEvent(
          details
        );
      },
      []
    );

  const identify =
    useCallback(
      (
        details: Parameters<
          typeof identifyAnalyticsUser
        >[0]
      ) => {
        return identifyAnalyticsUser(
          details
        );
      },
      []
    );

  const resetUser =
    useCallback(
      () => {
        resetAnalyticsUser();
      },
      []
    );

  return {
    event,
    pageView,
    search,
    recommendationClick,
    affiliateClick,
    beaconPlus,
    identify,
    resetUser,
  };
}

export default function Analytics() {
  return null;
}