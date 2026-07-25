"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HostingOption = "beacon" | "external";
type DomainOption = "existing" | "new" | "temporary";
type PublishStatus =
  | "not_ready"
  | "ready"
  | "publishing"
  | "published"
  | "failed";

type GeneratedWebsite = {
  project: {
    businessName: string;
    displayName: string;
    tagline: string;
    trade: string;
    location: string;
    serviceAreaSummary: string;
    preferredDomain: string;
    generatedAt: string;
    version: number;
  };
  brand: {
    primaryColour: string;
    secondaryColour: string;
    accentColour: string;
    visualStyle: "modern" | "professional" | "premium" | "friendly";
    fontStyle: "clean" | "traditional" | "bold" | "soft";
    tone:
      | "professional"
      | "friendly"
      | "premium"
      | "direct"
      | "reassuring";
    logoAltText: string;
  };
  navigation: {
    label: string;
    href: string;
  }[];
  pages: Array<{
    slug: string;
    navigationLabel: string;
    pageType:
      | "home"
      | "about"
      | "services"
      | "service"
      | "gallery"
      | "contact"
      | "faq"
      | "privacy"
      | "cookies"
      | "terms";
    title: string;
    introduction: string;
    sections: unknown[];
    seo: {
      title: string;
      description: string;
      keywords: string[];
      canonicalPath: string;
    };
  }>;
  services: Array<{
    name: string;
    slug: string;
    shortDescription: string;
    fullDescription: string;
    benefits: string[];
    commonJobs: string[];
    process: string[];
    faq: Array<{
      question: string;
      answer: string;
    }>;
    callToAction: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
      canonicalPath: string;
    };
  }>;
  globalContent: {
    phoneDisplay: string;
    emailDisplay: string;
    addressDisplay: string;
    openingHoursSummary: string;
    emergencyMessage: string;
    guaranteeMessage: string;
    accreditationSummary: string;
    footerDescription: string;
    copyrightName: string;
  };
  localSeo: {
    primaryLocation: string;
    serviceAreas: string[];
    suggestedLocationPages: Array<{
      location: string;
      slug: string;
      title: string;
      description: string;
    }>;
    googleBusinessDescription: string;
    schema: Record<string, unknown>;
  };
  legal: {
    privacyNotice: string;
    cookieNotice: string;
    websiteTerms: string;
    legalWarnings: string[];
  };
  quality: {
    seoScore: number;
    accessibilityScore: number;
    completenessScore: number;
    strengths: string[];
    improvements: string[];
    ownerChecks: string[];
  };
  imagePlan: Array<{
    filename: string;
    suggestedUse: string;
    altText: string;
  }>;
};

type ApprovalRecord = {
  approved: boolean;
  approvedAt: string;
  approvedBy: string;
  confirmation: string;
};

type PublishConfiguration = {
  hostingOption: HostingOption;
  domainOption: DomainOption;
  existingDomain: string;
  newDomain: string;
  temporarySubdomain: string;
  includeEmailSetup: boolean;
  includeAnalytics: boolean;
  includeSearchConsole: boolean;
  includeCookieBanner: boolean;
  includeContactForm: boolean;
  includeBackups: boolean;
  includeMaintenance: boolean;
  ownerConfirmedDomainControl: boolean;
  ownerConfirmedPublishAuthority: boolean;
  ownerConfirmedFinalReview: boolean;
  notes: string;
  updatedAt: string;
};

type DashboardProject = {
  businessName: string;
  trade: string;
  location: string;
  domain: string;
  status: "not_started" | "draft" | "ready" | "published";
  completion: number;
  lastUpdated: string;
  lastPublished: string;
  seoScore: number;
  pagesGenerated: number;
  suggestions: number;
};

const GENERATED_WEBSITE_STORAGE_KEY =
  "beacon-business-generated-website";
const APPROVAL_STORAGE_KEY = "beacon-business-website-approval";
const PUBLISH_CONFIG_STORAGE_KEY =
  "beacon-business-website-publish-config";
const PROJECT_STORAGE_KEY = "beacon-business-website-project";
const PUBLISH_RESULT_STORAGE_KEY =
  "beacon-business-website-publish-result";

function isGeneratedWebsite(value: unknown): value is GeneratedWebsite {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GeneratedWebsite>;

  return Boolean(
    candidate.project &&
      candidate.brand &&
      Array.isArray(candidate.navigation) &&
      Array.isArray(candidate.pages) &&
      Array.isArray(candidate.services) &&
      candidate.globalContent &&
      candidate.legal &&
      candidate.quality,
  );
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normaliseDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function isValidDomain(value: string) {
  const domain = normaliseDomain(value);

  return /^(?=.{4,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i.test(
    domain,
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function fieldClass() {
  return "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
}

function optionCardClass(active: boolean) {
  return `cursor-pointer rounded-3xl border-2 p-5 transition ${
    active
      ? "border-blue-700 bg-blue-50 shadow-sm"
      : "border-slate-200 bg-white hover:border-blue-300"
  }`;
}

function StatusPill({
  complete,
  completeLabel = "Complete",
  incompleteLabel = "Required",
}: {
  complete: boolean;
  completeLabel?: string;
  incompleteLabel?: string;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-extrabold ${
        complete
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {complete ? completeLabel : incompleteLabel}
    </span>
  );
}

export default function BusinessWebsiteFinalScopePage() {
  const [website, setWebsite] = useState<GeneratedWebsite | null>(null);
  const [approval, setApproval] = useState<ApprovalRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [publishStatus, setPublishStatus] =
    useState<PublishStatus>("not_ready");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [configuration, setConfiguration] =
    useState<PublishConfiguration>({
      hostingOption: "beacon",
      domainOption: "new",
      existingDomain: "",
      newDomain: "",
      temporarySubdomain: "",
      includeEmailSetup: false,
      includeAnalytics: true,
      includeSearchConsole: true,
      includeCookieBanner: true,
      includeContactForm: true,
      includeBackups: true,
      includeMaintenance: false,
      ownerConfirmedDomainControl: false,
      ownerConfirmedPublishAuthority: false,
      ownerConfirmedFinalReview: false,
      notes: "",
      updatedAt: "",
    });

  useEffect(() => {
    const storedWebsite = readJson<unknown>(
      GENERATED_WEBSITE_STORAGE_KEY,
    );
    const storedApproval =
      readJson<ApprovalRecord>(APPROVAL_STORAGE_KEY);
    const storedConfiguration =
      readJson<PublishConfiguration>(PUBLISH_CONFIG_STORAGE_KEY);

    if (isGeneratedWebsite(storedWebsite)) {
      setWebsite(storedWebsite);

      const fallbackSubdomain =
        slugify(storedWebsite.project.displayName) || "business-site";

      setConfiguration((current) => ({
        ...current,
        newDomain: storedWebsite.project.preferredDomain || "",
        temporarySubdomain: fallbackSubdomain,
        ...(storedConfiguration ?? {}),
      }));
    }

    setApproval(storedApproval);

    const result = readJson<{ status?: PublishStatus }>(
      PUBLISH_RESULT_STORAGE_KEY,
    );

    if (result?.status) {
      setPublishStatus(result.status);
    }

    setLoaded(true);
  }, []);

  const selectedDomain = useMemo(() => {
    if (configuration.domainOption === "existing") {
      return normaliseDomain(configuration.existingDomain);
    }

    if (configuration.domainOption === "new") {
      return normaliseDomain(configuration.newDomain);
    }

    return `${slugify(configuration.temporarySubdomain) || "business-site"}.beaconbusiness.site`;
  }, [configuration]);

  const domainValid =
    configuration.domainOption === "temporary" ||
    isValidDomain(selectedDomain);

  const approved = Boolean(approval?.approved);
  const websiteComplete = Boolean(
    website &&
      website.pages.length > 0 &&
      website.services.length > 0 &&
      website.globalContent.phoneDisplay &&
      website.globalContent.emailDisplay,
  );

  const allOwnerConfirmations =
    configuration.ownerConfirmedDomainControl &&
    configuration.ownerConfirmedPublishAuthority &&
    configuration.ownerConfirmedFinalReview;

  const readyToPublish =
    approved &&
    websiteComplete &&
    domainValid &&
    allOwnerConfirmations;

  const includedFeatures = [
    configuration.includeAnalytics,
    configuration.includeSearchConsole,
    configuration.includeCookieBanner,
    configuration.includeContactForm,
    configuration.includeBackups,
    configuration.includeEmailSetup,
    configuration.includeMaintenance,
  ].filter(Boolean).length;

  function updateConfiguration<K extends keyof PublishConfiguration>(
    key: K,
    value: PublishConfiguration[K],
  ) {
    setConfiguration((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function saveConfiguration() {
    const nextConfiguration = {
      ...configuration,
      updatedAt: new Date().toISOString(),
    };

    setConfiguration(nextConfiguration);
    window.localStorage.setItem(
      PUBLISH_CONFIG_STORAGE_KEY,
      JSON.stringify(nextConfiguration),
    );

    setMessage("Publishing configuration saved");
    window.setTimeout(() => setMessage(""), 1800);
  }

  async function publishWebsite() {
    setError("");

    if (!website) {
      setError("No generated website is available.");
      return;
    }

    if (!approval?.approved) {
      setError("The website must be approved before publishing.");
      return;
    }

    if (!domainValid) {
      setError("Enter a valid domain name before publishing.");
      return;
    }

    if (!allOwnerConfirmations) {
      setError("Complete all owner confirmations before publishing.");
      return;
    }

    setPublishStatus("publishing");

    try {
      const publishedAt = new Date().toISOString();

      const payload = {
        website,
        approval,
        configuration: {
          ...configuration,
          selectedDomain,
          updatedAt: publishedAt,
        },
      };

      const response = await fetch("/api/business/website/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        error?: string;
        status?: string;
        liveUrl?: string;
        publishedAt?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "Beacon could not publish the website.",
        );
      }

      const liveUrl =
        result.liveUrl ||
        `https://${selectedDomain}`;

      const publishResult = {
        status: "published" as const,
        liveUrl,
        publishedAt: result.publishedAt || publishedAt,
        domain: selectedDomain,
        approval,
        configuration,
      };

      window.localStorage.setItem(
        PUBLISH_RESULT_STORAGE_KEY,
        JSON.stringify(publishResult),
      );

      const existingProject =
        readJson<Partial<DashboardProject>>(PROJECT_STORAGE_KEY) ?? {};

      const project: DashboardProject = {
        ...existingProject,
        businessName: website.project.businessName,
        trade: website.project.trade,
        location: website.project.location,
        domain: selectedDomain,
        status: "published",
        completion: 100,
        lastUpdated: publishedAt,
        lastPublished: publishResult.publishedAt,
        seoScore: website.quality.seoScore,
        pagesGenerated: website.pages.length,
        suggestions: website.quality.improvements.length,
      };

      window.localStorage.setItem(
        PROJECT_STORAGE_KEY,
        JSON.stringify(project),
      );

      setPublishStatus("published");
      setMessage("Website published successfully");
    } catch (publishError) {
      setPublishStatus("failed");
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Beacon could not publish the website.",
      );
    }
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-10 w-72 rounded-xl bg-slate-200" />
          <div className="mt-8 h-[720px] rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  if (!website) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <span
            aria-hidden="true"
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl"
          >
            🚀
          </span>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
            No website is ready for publishing
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Generate and approve the website before configuring its domain and
            publishing options.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-6 py-4 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
              href="/business/website"
            >
              Website Dashboard
            </Link>

            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
              href="/business/project"
            >
              Start Website Setup
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <Link
                className="text-sm font-extrabold text-blue-800 hover:text-blue-950"
                href="/business/preview/review"
              >
                ← Review & approval
              </Link>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Final Scope & Publishing
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                Confirm hosting, domain and launch services before making the
                website live.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {message ? (
                <span className="text-sm font-extrabold text-emerald-700">
                  ✓ {message}
                </span>
              ) : null}

              <button
                className="rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
                onClick={saveConfiguration}
                type="button"
              >
                Save Configuration
              </button>

              <Link
                className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
                href="/business/preview"
              >
                View Preview
              </Link>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">
                Approval
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {approved ? "Approved" : "Required"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">
                Selected domain
              </p>
              <p className="mt-2 break-all text-lg font-black text-slate-950">
                {selectedDomain || "Not selected"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">
                Included services
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {includedFeatures}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">
                Publish status
              </p>
              <p className="mt-2 text-2xl font-black capitalize text-slate-950">
                {publishStatus.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
                    Readiness
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Publishing requirements
                  </h2>
                  <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                    Every item below must be complete before Beacon sends the
                    website to the publishing system.
                  </p>
                </div>

                <StatusPill
                  complete={readyToPublish}
                  completeLabel="Ready"
                  incompleteLabel="Action needed"
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-700">
                    Website generated
                  </span>
                  <StatusPill complete={websiteComplete} />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-700">
                    Owner approval
                  </span>
                  <StatusPill complete={approved} />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-700">
                    Domain valid
                  </span>
                  <StatusPill complete={domainValid} />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-700">
                    Owner confirmations
                  </span>
                  <StatusPill complete={allOwnerConfirmations} />
                </div>
              </div>

              {!approved ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-black text-amber-950">
                    Website approval is still required
                  </p>
                  <p className="mt-2 leading-7 text-amber-900">
                    Return to the review page, complete all owner checks and
                    approve the website before publishing.
                  </p>
                  <Link
                    className="mt-4 inline-flex rounded-xl bg-amber-900 px-4 py-2.5 font-extrabold text-white"
                    href="/business/preview/review"
                  >
                    Complete Approval
                  </Link>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="font-black text-emerald-950">
                    Approved by {approval?.approvedBy}
                  </p>
                  <p className="mt-2 leading-7 text-emerald-900">
                    Approval recorded {formatDate(approval?.approvedAt || "")}.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Hosting
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Choose where the website will run
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label
                  className={optionCardClass(
                    configuration.hostingOption === "beacon",
                  )}
                >
                  <input
                    checked={configuration.hostingOption === "beacon"}
                    className="sr-only"
                    name="hosting"
                    onChange={() =>
                      updateConfiguration("hostingOption", "beacon")
                    }
                    type="radio"
                  />

                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-2xl text-white"
                    >
                      ⚓
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        Beacon Managed Hosting
                      </h3>
                      <p className="mt-2 leading-7 text-slate-600">
                        Beacon manages deployment, SSL, updates and basic
                        website health monitoring.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={optionCardClass(
                    configuration.hostingOption === "external",
                  )}
                >
                  <input
                    checked={configuration.hostingOption === "external"}
                    className="sr-only"
                    name="hosting"
                    onChange={() =>
                      updateConfiguration("hostingOption", "external")
                    }
                    type="radio"
                  />

                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-white"
                    >
                      ↗
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        External Hosting
                      </h3>
                      <p className="mt-2 leading-7 text-slate-600">
                        Export the final website for deployment on another
                        compatible hosting platform.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Domain
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Choose the website address
              </h2>

              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                {[
                  {
                    id: "existing" as const,
                    title: "Use Existing Domain",
                    description:
                      "Connect a domain the business already owns.",
                  },
                  {
                    id: "new" as const,
                    title: "Use New Domain",
                    description:
                      "Enter the domain selected for the new website.",
                  },
                  {
                    id: "temporary" as const,
                    title: "Temporary Address",
                    description:
                      "Launch on a Beacon subdomain before connecting a domain.",
                  },
                ].map((option) => (
                  <label
                    className={optionCardClass(
                      configuration.domainOption === option.id,
                    )}
                    key={option.id}
                  >
                    <input
                      checked={configuration.domainOption === option.id}
                      className="sr-only"
                      name="domain-option"
                      onChange={() =>
                        updateConfiguration("domainOption", option.id)
                      }
                      type="radio"
                    />
                    <h3 className="font-black text-slate-950">
                      {option.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {option.description}
                    </p>
                  </label>
                ))}
              </div>

              <div className="mt-6">
                {configuration.domainOption === "existing" ? (
                  <div>
                    <label
                      className="mb-2 block text-sm font-extrabold text-slate-800"
                      htmlFor="existingDomain"
                    >
                      Existing domain
                    </label>
                    <input
                      className={fieldClass()}
                      id="existingDomain"
                      onChange={(event) =>
                        updateConfiguration(
                          "existingDomain",
                          event.target.value,
                        )
                      }
                      placeholder="example.co.uk"
                      value={configuration.existingDomain}
                    />
                  </div>
                ) : null}

                {configuration.domainOption === "new" ? (
                  <div>
                    <label
                      className="mb-2 block text-sm font-extrabold text-slate-800"
                      htmlFor="newDomain"
                    >
                      New domain
                    </label>
                    <input
                      className={fieldClass()}
                      id="newDomain"
                      onChange={(event) =>
                        updateConfiguration(
                          "newDomain",
                          event.target.value,
                        )
                      }
                      placeholder="example.co.uk"
                      value={configuration.newDomain}
                    />
                  </div>
                ) : null}

                {configuration.domainOption === "temporary" ? (
                  <div>
                    <label
                      className="mb-2 block text-sm font-extrabold text-slate-800"
                      htmlFor="temporarySubdomain"
                    >
                      Temporary subdomain
                    </label>
                    <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                      <input
                        className="min-w-0 flex-1 px-4 py-3.5 outline-none"
                        id="temporarySubdomain"
                        onChange={(event) =>
                          updateConfiguration(
                            "temporarySubdomain",
                            slugify(event.target.value),
                          )
                        }
                        value={configuration.temporarySubdomain}
                      />
                      <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-500">
                        .beaconbusiness.site
                      </span>
                    </div>
                  </div>
                ) : null}

                <div
                  className={`mt-4 rounded-2xl p-4 ${
                    domainValid
                      ? "bg-emerald-50 text-emerald-900"
                      : "bg-red-50 text-red-900"
                  }`}
                >
                  <p className="font-extrabold">
                    {domainValid
                      ? `Selected address: ${selectedDomain}`
                      : "Enter a valid domain such as example.co.uk"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Launch services
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Select the features included at launch
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  {
                    key: "includeAnalytics" as const,
                    title: "Analytics",
                    description:
                      "Prepare traffic measurement after the owner selects an approved analytics provider.",
                  },
                  {
                    key: "includeSearchConsole" as const,
                    title: "Search Console",
                    description:
                      "Prepare ownership verification and search performance monitoring.",
                  },
                  {
                    key: "includeCookieBanner" as const,
                    title: "Cookie Controls",
                    description:
                      "Show consent controls matching the cookies actually used by the live website.",
                  },
                  {
                    key: "includeContactForm" as const,
                    title: "Contact Form",
                    description:
                      "Enable customer enquiries with spam protection and delivery testing.",
                  },
                  {
                    key: "includeBackups" as const,
                    title: "Backups",
                    description:
                      "Keep recoverable website versions before and after major updates.",
                  },
                  {
                    key: "includeEmailSetup" as const,
                    title: "Business Email Setup",
                    description:
                      "Prepare domain email records and mailbox connection instructions.",
                  },
                  {
                    key: "includeMaintenance" as const,
                    title: "Ongoing Maintenance",
                    description:
                      "Allow Beacon to surface content, SEO and website health improvements.",
                  },
                ].map((feature) => (
                  <label
                    className={`flex cursor-pointer gap-4 rounded-2xl border p-5 transition ${
                      configuration[feature.key]
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                    key={feature.key}
                  >
                    <input
                      checked={configuration[feature.key]}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
                      onChange={(event) =>
                        updateConfiguration(
                          feature.key,
                          event.target.checked,
                        )
                      }
                      type="checkbox"
                    />

                    <span>
                      <span className="block font-black text-slate-950">
                        {feature.title}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        {feature.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Notes
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Final publishing instructions
              </h2>

              <textarea
                className={`${fieldClass()} mt-6 min-h-36 resize-y`}
                onChange={(event) =>
                  updateConfiguration("notes", event.target.value)
                }
                placeholder="Add any final instructions about the domain, email, launch timing or website setup."
                value={configuration.notes}
              />
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-amber-800">
                Owner confirmation
              </p>
              <h2 className="mt-2 text-2xl font-black text-amber-950">
                Confirm authority before publishing
              </h2>

              <div className="mt-6 space-y-4">
                {[
                  {
                    key: "ownerConfirmedDomainControl" as const,
                    label:
                      configuration.domainOption === "temporary"
                        ? "I understand this will use a temporary Beacon address until a permanent domain is connected."
                        : "I confirm that I own, control or have permission to connect the selected domain.",
                  },
                  {
                    key: "ownerConfirmedPublishAuthority" as const,
                    label:
                      "I confirm that I am authorised to publish this website for the named business.",
                  },
                  {
                    key: "ownerConfirmedFinalReview" as const,
                    label:
                      "I confirm that the website content, contact details, services and legal drafts have received a final review.",
                  },
                ].map((confirmation) => (
                  <label
                    className="flex cursor-pointer gap-4 rounded-2xl border border-amber-200 bg-white p-5"
                    key={confirmation.key}
                  >
                    <input
                      checked={configuration[confirmation.key]}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
                      onChange={(event) =>
                        updateConfiguration(
                          confirmation.key,
                          event.target.checked,
                        )
                      }
                      type="checkbox"
                    />
                    <span className="leading-7 text-slate-800">
                      {confirmation.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Launch summary
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {website.project.displayName}
              </h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">
                    Website address
                  </p>
                  <p className="mt-2 break-all font-black text-slate-950">
                    {selectedDomain}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">
                    Hosting
                  </p>
                  <p className="mt-2 font-black text-slate-950">
                    {configuration.hostingOption === "beacon"
                      ? "Beacon Managed Hosting"
                      : "External Hosting"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">
                    Website content
                  </p>
                  <p className="mt-2 font-black text-slate-950">
                    {website.pages.length} pages ·{" "}
                    {website.services.length} services
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">
                    Approved by
                  </p>
                  <p className="mt-2 font-black text-slate-950">
                    {approval?.approvedBy || "Approval required"}
                  </p>
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="font-bold leading-6 text-red-800">
                    {error}
                  </p>
                </div>
              ) : null}

              {publishStatus === "published" ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="font-black text-emerald-950">
                    Website published
                  </p>
                  <p className="mt-2 leading-7 text-emerald-900">
                    The website publishing record has been saved successfully.
                  </p>
                </div>
              ) : null}

              <button
                className="mt-6 w-full rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!readyToPublish || publishStatus === "publishing"}
                onClick={publishWebsite}
                type="button"
              >
                {publishStatus === "publishing"
                  ? "Publishing Website..."
                  : publishStatus === "published"
                    ? "Website Published"
                    : "Publish Website"}
              </button>

              {!readyToPublish ? (
                <p className="mt-3 text-center text-sm leading-6 text-slate-500">
                  Complete the required approval, domain and owner confirmation
                  steps to unlock publishing.
                </p>
              ) : (
                <p className="mt-3 text-center text-sm leading-6 text-slate-500">
                  Publishing is a separate owner-approved action.
                </p>
              )}

              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="text-sm font-black text-slate-950">
                  Nothing goes live without confirmation
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Beacon will only publish after the review approval and all
                  confirmations on this page are complete.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}