"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  allConsentPreferences,
  defaultConsentPreferences,
  OPEN_COOKIE_SETTINGS_EVENT,
  saveConsent,
  type ConsentPreferences,
} from "@/lib/cookies/consent";

function getFocusableElements(
  container: HTMLElement
): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      selector
    )
  ).filter(
    (element) =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !==
        "true"
  );
}

type ConsentToggleProps = {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (
    checked: boolean
  ) => void;
};

function ConsentToggle({
  id,
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: ConsentToggleProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-5">
        <div>
          <span className="font-black text-slate-950">
            {title}
          </span>

          <p
            id={`${id}-description`}
            className="mt-2 text-sm leading-6 text-slate-600"
          >
            {description}
          </p>
        </div>

        <button
          id={id}
          type="button"
          role="switch"
          aria-label={title}
          aria-checked={checked}
          aria-describedby={`${id}-description`}
          disabled={disabled}
          onClick={() => {
            onChange?.(!checked);
          }}
          className={[
            "relative mt-0.5 inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
            checked
              ? "bg-blue-700"
              : "bg-slate-300",
            disabled
              ? "cursor-not-allowed opacity-70"
              : "cursor-pointer",
          ].join(" ")}
        >
          <span className="sr-only">
            {checked
              ? `Disable ${title}`
              : `Enable ${title}`}
          </span>

          <span
            aria-hidden="true"
            className={[
              "pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-sm ring-0 transition",
              checked
                ? "translate-x-5"
                : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>

      {disabled ? (
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-emerald-700">
          Always enabled
        </p>
      ) : null}
    </div>
  );
}

export default function CookieConsent() {
  const titleId = useId();
  const descriptionId = useId();
  const necessaryId = useId();
  const functionalId = useId();
  const analyticsId = useId();
  const marketingId = useId();

  const dialogRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const previouslyFocusedElementRef =
    useRef<HTMLElement | null>(
      null
    );

  const [hasLoaded, setHasLoaded] =
    useState(false);

  const [hasDecision, setHasDecision] =
    useState(false);

  const [
    isPreferencesOpen,
    setIsPreferencesOpen,
  ] = useState(false);

  const [
    preferences,
    setPreferences,
  ] =
    useState<ConsentPreferences>(
      defaultConsentPreferences
    );

  const closePreferences =
    useCallback(() => {
      setIsPreferencesOpen(false);
    }, []);

  const openPreferences =
    useCallback(() => {
      previouslyFocusedElementRef.current =
        document.activeElement instanceof
        HTMLElement
          ? document.activeElement
          : null;

      setIsPreferencesOpen(true);
    }, []);

  const savePreferences =
    useCallback(
      (
        nextPreferences: ConsentPreferences
      ) => {
        const savedConsent =
          saveConsent(
            nextPreferences
          );

        if (!savedConsent) {
          return;
        }

        setPreferences(
          savedConsent.preferences
        );

        setHasDecision(true);
        setIsPreferencesOpen(false);
      },
      []
    );

  useEffect(() => {
    try {
      const storedValue =
        window.localStorage.getItem(
          "beacon-ai-cookie-consent"
        );

      if (storedValue) {
        const parsedValue =
          JSON.parse(storedValue) as {
            version?: number;
            preferences?: Partial<ConsentPreferences>;
          };

        const storedPreferences =
          parsedValue.preferences;

        if (
          parsedValue.version === 1 &&
          storedPreferences?.necessary ===
            true &&
          typeof storedPreferences.functional ===
            "boolean" &&
          typeof storedPreferences.analytics ===
            "boolean" &&
          typeof storedPreferences.marketing ===
            "boolean"
        ) {
          const functional =
            storedPreferences.functional;

          const analytics =
            storedPreferences.analytics;

          const marketing =
            storedPreferences.marketing;

          queueMicrotask(() => {
            setPreferences({
              necessary: true,
              functional,
              analytics,
              marketing,
            });

            setHasDecision(true);
          });
        }
      }
    } catch {
      queueMicrotask(() => {
        setPreferences(
          defaultConsentPreferences
        );
      });
    }

    queueMicrotask(() => {
      setHasLoaded(true);
    });
  }, []);

  useEffect(() => {
    const handleOpenPreferences =
      () => {
        openPreferences();
      };

    window.addEventListener(
      OPEN_COOKIE_SETTINGS_EVENT,
      handleOpenPreferences
    );

    return () => {
      window.removeEventListener(
        OPEN_COOKIE_SETTINGS_EVENT,
        handleOpenPreferences
      );
    };
  }, [openPreferences]);

  useEffect(() => {
    if (!isPreferencesOpen) {
      return;
    }

    const dialog =
      dialogRef.current;

    if (!dialog) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const focusableElements =
      getFocusableElements(dialog);

    window.requestAnimationFrame(() => {
      focusableElements[0]?.focus();
    });

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreferences();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentElements =
        getFocusableElements(dialog);

      if (
        currentElements.length === 0
      ) {
        event.preventDefault();
        return;
      }

      const firstElement =
        currentElements[0];

      const lastElement =
        currentElements[
          currentElements.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement ===
          firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement ===
          lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      previouslyFocusedElementRef.current?.focus();
    };
  }, [
    closePreferences,
    isPreferencesOpen,
  ]);

  if (!hasLoaded) {
    return null;
  }

  const showInitialBanner =
    !hasDecision &&
    !isPreferencesOpen;

  return (
    <>
      {showInitialBanner ? (
        <section
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[90] p-4 sm:p-6"
        >
          <div className="mx-auto max-w-6xl rounded-3xl border border-slate-700 bg-slate-950 p-6 text-white shadow-2xl sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                  Your cookie choices
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                  Beacon-AI uses strictly necessary
                  technologies for security and core
                  website features. With your
                  permission, we may also use
                  functional, analytics and marketing
                  technologies.
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Read our{" "}
                  <a
                    href="/cookies"
                    className="font-bold text-blue-300 underline decoration-blue-500 underline-offset-4 transition hover:text-blue-200"
                  >
                    Cookie Policy
                  </a>{" "}
                  for more information.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:max-w-md lg:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    savePreferences(
                      defaultConsentPreferences
                    );
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-600 px-5 py-3 text-sm font-black text-white transition hover:border-slate-400 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Reject optional cookies
                </button>

                <button
                  type="button"
                  onClick={openPreferences}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-400 px-5 py-3 text-sm font-black text-blue-200 transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Manage preferences
                </button>

                <button
                  type="button"
                  onClick={() => {
                    savePreferences(
                      allConsentPreferences
                    );
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Accept optional cookies
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {hasDecision &&
      !isPreferencesOpen ? (
        <button
          type="button"
          onClick={openPreferences}
          className="fixed bottom-4 left-4 z-[80] inline-flex min-h-11 items-center justify-center rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-xl transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:bottom-6 sm:left-6"
        >
          Cookie settings
        </button>
      ) : null}

      {isPreferencesOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePreferences();
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={
              descriptionId
            }
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
              <div>
                <h2
                  id={titleId}
                  className="text-2xl font-black tracking-tight text-slate-950"
                >
                  Cookie preferences
                </h2>

                <p
                  id={descriptionId}
                  className="mt-2 text-sm leading-6 text-slate-600"
                >
                  Choose which optional
                  technologies Beacon-AI may use on
                  this device.
                </p>
              </div>

              <button
                type="button"
                onClick={closePreferences}
                aria-label="Close cookie preferences"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl leading-none text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span aria-hidden="true">
                  ×
                </span>
              </button>
            </div>

            <div className="space-y-4 p-6 sm:p-8">
              <ConsentToggle
                id={necessaryId}
                title="Strictly necessary"
                description="Required for security, authentication, fraud prevention, consent storage and core website functionality."
                checked
                disabled
              />

              <ConsentToggle
                id={functionalId}
                title="Functional"
                description="Remembers optional preferences and supports enhanced or personalised website features."
                checked={
                  preferences.functional
                }
                onChange={(checked) => {
                  setPreferences(
                    (current) => ({
                      ...current,
                      functional: checked,
                    })
                  );
                }}
              />

              <ConsentToggle
                id={analyticsId}
                title="Analytics"
                description="Helps us understand website use, diagnose errors and improve Beacon-AI. Analytics remain inactive until you consent."
                checked={
                  preferences.analytics
                }
                onChange={(checked) => {
                  setPreferences(
                    (current) => ({
                      ...current,
                      analytics: checked,
                    })
                  );
                }}
              />

              <ConsentToggle
                id={marketingId}
                title="Marketing"
                description="Supports campaign measurement, conversion attribution and advertising technologies where introduced."
                checked={
                  preferences.marketing
                }
                onChange={(checked) => {
                  setPreferences(
                    (current) => ({
                      ...current,
                      marketing: checked,
                    })
                  );
                }}
              />

              <p className="text-sm leading-6 text-slate-600">
                You can change these choices later
                using the permanent Cookie settings
                button. Learn more in our{" "}
                <a
                  href="/cookies"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Cookie Policy
                </a>
                .
              </p>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-5 sm:px-8">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPreferences(
                      defaultConsentPreferences
                    );

                    savePreferences(
                      defaultConsentPreferences
                    );
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Reject all optional
                </button>

                <button
                  type="button"
                  onClick={() => {
                    savePreferences(
                      preferences
                    );
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Save preferences
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreferences(
                      allConsentPreferences
                    );

                    savePreferences(
                      allConsentPreferences
                    );
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Accept all optional
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}