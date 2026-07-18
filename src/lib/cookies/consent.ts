"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export const CONSENT_STORAGE_KEY =
  "beacon-ai-cookie-consent";

export const CONSENT_VERSION =
  1;

export const CONSENT_CHANGED_EVENT =
  "beacon-ai:cookie-consent-changed";

export const OPEN_COOKIE_SETTINGS_EVENT =
  "beacon-ai:open-cookie-settings";

export type ConsentCategory =
  | "necessary"
  | "functional"
  | "analytics"
  | "marketing";

export type OptionalConsentCategory =
  Exclude<
    ConsentCategory,
    "necessary"
  >;

export type ConsentPreferences = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type StoredConsent = {
  version: number;
  updatedAt: string;
  preferences: ConsentPreferences;
};

export const defaultConsentPreferences: ConsentPreferences =
  {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  };

export const allConsentPreferences: ConsentPreferences =
  {
    necessary: true,
    functional: true,
    analytics: true,
    marketing: true,
  };

function isBoolean(
  value: unknown
): value is boolean {
  return (
    typeof value ===
    "boolean"
  );
}

export function isStoredConsent(
  value: unknown
): value is StoredConsent {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false;
  }

  const candidate =
    value as Partial<StoredConsent>;

  if (
    candidate.version !==
      CONSENT_VERSION
  ) {
    return false;
  }

  if (
    typeof candidate.updatedAt !==
      "string"
  ) {
    return false;
  }

  if (
    Number.isNaN(
      Date.parse(
        candidate.updatedAt
      )
    )
  ) {
    return false;
  }

  const preferences =
    candidate.preferences;

  if (
    !preferences ||
    typeof preferences !==
      "object"
  ) {
    return false;
  }

  return (
    preferences.necessary ===
      true &&
    isBoolean(
      preferences.functional
    ) &&
    isBoolean(
      preferences.analytics
    ) &&
    isBoolean(
      preferences.marketing
    )
  );
}

function isBrowser() {
  return (
    typeof window !==
      "undefined" &&
    typeof document !==
      "undefined"
  );
}

export function createStoredConsent(
  preferences: ConsentPreferences
): StoredConsent {
  return {
    version:
      CONSENT_VERSION,

    updatedAt:
      new Date().toISOString(),

    preferences: {
      necessary:
        true,

      functional:
        preferences.functional,

      analytics:
        preferences.analytics,

      marketing:
        preferences.marketing,
    },
  };
}

export function readConsent(): StoredConsent | null {
  if (
    !isBrowser()
  ) {
    return null;
  }

  try {
    const storedValue =
      window.localStorage.getItem(
        CONSENT_STORAGE_KEY
      );

    if (
      !storedValue
    ) {
      return null;
    }

    const parsedValue =
      JSON.parse(
        storedValue
      ) as unknown;

    if (
      !isStoredConsent(
        parsedValue
      )
    ) {
      window.localStorage.removeItem(
        CONSENT_STORAGE_KEY
      );

      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export function getConsentPreferences(): ConsentPreferences {
  return (
    readConsent()
      ?.preferences ??
    defaultConsentPreferences
  );
}

export function hasConsentDecision(): boolean {
  return (
    readConsent() !==
    null
  );
}

export function applyConsentToDocument(
  preferences: ConsentPreferences
): void {
  if (
    !isBrowser()
  ) {
    return;
  }

  const root =
    document.documentElement;

  root.dataset.cookieConsentNecessary =
    "granted";

  root.dataset.cookieConsentFunctional =
    preferences.functional
      ? "granted"
      : "denied";

  root.dataset.cookieConsentAnalytics =
    preferences.analytics
      ? "granted"
      : "denied";

  root.dataset.cookieConsentMarketing =
    preferences.marketing
      ? "granted"
      : "denied";
}

export function dispatchConsentChanged(
  consent: StoredConsent
): void {
  if (
    !isBrowser()
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<StoredConsent>(
      CONSENT_CHANGED_EVENT,
      {
        detail:
          consent,
      }
    )
  );
}

export function saveConsent(
  preferences: ConsentPreferences
): StoredConsent | null {
  if (
    !isBrowser()
  ) {
    return null;
  }

  const consent =
    createStoredConsent(
      preferences
    );

  try {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(
        consent
      )
    );
  } catch {
    return null;
  }

  applyConsentToDocument(
    consent.preferences
  );

  dispatchConsentChanged(
    consent
  );

  return consent;
}

export function rejectOptionalConsent(): StoredConsent | null {
  return saveConsent(
    defaultConsentPreferences
  );
}

export function acceptAllConsent(): StoredConsent | null {
  return saveConsent(
    allConsentPreferences
  );
}

export function clearConsent(): void {
  if (
    !isBrowser()
  ) {
    return;
  }

  try {
    window.localStorage.removeItem(
      CONSENT_STORAGE_KEY
    );
  } catch {
    // Consent still falls back to denied when storage is unavailable.
  }

  applyConsentToDocument(
    defaultConsentPreferences
  );
}

export function hasConsent(
  category: ConsentCategory
): boolean {
  if (
    category ===
    "necessary"
  ) {
    return true;
  }

  return getConsentPreferences()[
    category
  ];
}

export function hasFunctionalConsent(): boolean {
  return hasConsent(
    "functional"
  );
}

export function hasAnalyticsConsent(): boolean {
  return hasConsent(
    "analytics"
  );
}

export function hasMarketingConsent(): boolean {
  return hasConsent(
    "marketing"
  );
}

export function openCookieSettings(): void {
  if (
    !isBrowser()
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      OPEN_COOKIE_SETTINGS_EVENT
    )
  );
}

export function subscribeToConsent(
  listener: (
    consent: StoredConsent | null
  ) => void
): () => void {
  if (
    !isBrowser()
  ) {
    return () => {
      // No browser subscription is required during server rendering.
    };
  }

  const handleConsentChange =
    (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<StoredConsent>;

      listener(
        isStoredConsent(
          customEvent.detail
        )
          ? customEvent.detail
          : readConsent()
      );
    };

  const handleStorageChange =
    (
      event: StorageEvent
    ) => {
      if (
        event.key !==
        CONSENT_STORAGE_KEY
      ) {
        return;
      }

      listener(
        readConsent()
      );
    };

  window.addEventListener(
    CONSENT_CHANGED_EVENT,
    handleConsentChange
  );

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  return () => {
    window.removeEventListener(
      CONSENT_CHANGED_EVENT,
      handleConsentChange
    );

    window.removeEventListener(
      "storage",
      handleStorageChange
    );
  };
}

export function useCookieConsent() {
  const [
    consent,
    setConsent,
  ] =
    useState<StoredConsent | null>(
      null
    );

  const [
    isLoaded,
    setIsLoaded,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      const currentConsent =
        readConsent();

      applyConsentToDocument(
        currentConsent
          ?.preferences ??
          defaultConsentPreferences
      );

      queueMicrotask(() => {
        setConsent(
          currentConsent
        );

        setIsLoaded(
          true
        );
      });

      return subscribeToConsent(
        (
          nextConsent
        ) => {
          setConsent(
            nextConsent
          );
        }
      );
    },
    []
  );

  const updateConsent =
    useCallback(
      (
        preferences: ConsentPreferences
      ) => {
        const savedConsent =
          saveConsent(
            preferences
          );

        if (
          savedConsent
        ) {
          setConsent(
            savedConsent
          );
        }

        return savedConsent;
      },
      []
    );

  const acceptAll =
    useCallback(
      () => {
        const savedConsent =
          acceptAllConsent();

        if (
          savedConsent
        ) {
          setConsent(
            savedConsent
          );
        }

        return savedConsent;
      },
      []
    );

  const rejectOptional =
    useCallback(
      () => {
        const savedConsent =
          rejectOptionalConsent();

        if (
          savedConsent
        ) {
          setConsent(
            savedConsent
          );
        }

        return savedConsent;
      },
      []
    );

  const resetConsent =
    useCallback(
      () => {
        clearConsent();

        setConsent(
          null
        );
      },
      []
    );

  const preferences =
    consent
      ?.preferences ??
    defaultConsentPreferences;

  return {
    consent,
    preferences,
    isLoaded,
    hasDecision:
      consent !==
      null,
    functional:
      preferences.functional,
    analytics:
      preferences.analytics,
    marketing:
      preferences.marketing,
    updateConsent,
    acceptAll,
    rejectOptional,
    resetConsent,
    openSettings:
      openCookieSettings,
  };
}

export function useConsentCategory(
  category: ConsentCategory
): {
  isLoaded: boolean;
  hasDecision: boolean;
  isGranted: boolean;
} {
  const {
    isLoaded,
    hasDecision,
    preferences,
  } =
    useCookieConsent();

  return {
    isLoaded,
    hasDecision,
    isGranted:
      category ===
      "necessary"
        ? true
        : preferences[
            category
          ],
  };
}