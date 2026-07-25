"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type GeneratedCta = {
  label: string;
  href: string;
};

type GeneratedSeo = {
  title: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
};

type GeneratedSection = {
  id: string;
  type:
    | "hero"
    | "intro"
    | "services"
    | "trust"
    | "process"
    | "gallery"
    | "testimonials"
    | "faq"
    | "contact"
    | "cta";
  heading: string;
  subheading: string;
  body: string;
  bullets: string[];
  primaryCta: GeneratedCta;
  secondaryCta: GeneratedCta;
  imageSuggestion: string;
};

type GeneratedPage = {
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
  sections: GeneratedSection[];
  seo: GeneratedSeo;
};

type GeneratedService = {
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
  commonJobs: string[];
  process: string[];
  faq: {
    question: string;
    answer: string;
  }[];
  callToAction: string;
  seo: GeneratedSeo;
};

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
  pages: GeneratedPage[];
  services: GeneratedService[];
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
    suggestedLocationPages: {
      location: string;
      slug: string;
      title: string;
      description: string;
    }[];
    googleBusinessDescription: string;
    schema: {
      businessType: string;
      name: string;
      telephone: string;
      email: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      areaServed: string[];
      priceRange: string;
    };
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
  imagePlan: {
    filename: string;
    suggestedUse: string;
    altText: string;
  }[];
};

type ReviewSection =
  | "overview"
  | "pages"
  | "services"
  | "seo"
  | "legal"
  | "owner-checks"
  | "approval";

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

type ApprovalRecord = {
  approved: boolean;
  approvedAt: string;
  approvedBy: string;
  confirmation: string;
};

const GENERATED_WEBSITE_STORAGE_KEY =
  "beacon-business-generated-website";
const PROJECT_STORAGE_KEY = "beacon-business-website-project";
const APPROVAL_STORAGE_KEY = "beacon-business-website-approval";

function fieldClass() {
  return "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
}

function labelClass() {
  return "mb-2 block text-sm font-extrabold text-slate-800";
}

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
      candidate.localSeo &&
      candidate.legal &&
      candidate.quality &&
      Array.isArray(candidate.imagePlan),
  );
}

function readGeneratedWebsite() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(
    GENERATED_WEBSITE_STORAGE_KEY,
  );

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isGeneratedWebsite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readApprovalRecord(): ApprovalRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(APPROVAL_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ApprovalRecord;
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

function scoreClasses(score: number) {
  if (score >= 80) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (score >= 60) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-red-100 text-red-800";
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 max-w-4xl leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default function BusinessWebsiteReviewPage() {
  const [website, setWebsite] = useState<GeneratedWebsite | null>(null);
  const [activeSection, setActiveSection] =
    useState<ReviewSection>("overview");
  const [loaded, setLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [approvalRecord, setApprovalRecord] =
    useState<ApprovalRecord | null>(null);
  const [ownerCheckStatus, setOwnerCheckStatus] = useState<boolean[]>([]);
  const [approvalName, setApprovalName] = useState("");
  const [approvalConfirmation, setApprovalConfirmation] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  useEffect(() => {
    const stored = readGeneratedWebsite();
    setWebsite(stored);

    if (stored) {
      setOwnerCheckStatus(
        stored.quality.ownerChecks.map(() => false),
      );
    }

    setApprovalRecord(readApprovalRecord());
    setLoaded(true);
  }, []);

  const completedOwnerChecks = ownerCheckStatus.filter(Boolean).length;
  const allOwnerChecksComplete =
    website !== null &&
    website.quality.ownerChecks.length > 0 &&
    completedOwnerChecks === website.quality.ownerChecks.length;

  const legalReviewed =
    Boolean(website?.legal.privacyNotice.trim()) &&
    Boolean(website?.legal.cookieNotice.trim()) &&
    Boolean(website?.legal.websiteTerms.trim());

  const readyForApproval =
    Boolean(website) &&
    allOwnerChecksComplete &&
    legalReviewed &&
    Boolean(approvalName.trim()) &&
    approvalConfirmation;

  const totalItems = useMemo(() => {
    if (!website) {
      return 0;
    }

    return (
      website.pages.length +
      website.services.length +
      website.quality.ownerChecks.length +
      3
    );
  }, [website]);

  function persist(nextWebsite: GeneratedWebsite, message = "Changes saved") {
    setWebsite(nextWebsite);
    window.localStorage.setItem(
      GENERATED_WEBSITE_STORAGE_KEY,
      JSON.stringify(nextWebsite),
    );
    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(""), 1800);
  }

  function updateProjectField<
    K extends keyof GeneratedWebsite["project"],
  >(key: K, value: GeneratedWebsite["project"][K]) {
    if (!website) {
      return;
    }

    persist({
      ...website,
      project: {
        ...website.project,
        [key]: value,
      },
    });
  }

  function updateGlobalField<
    K extends keyof GeneratedWebsite["globalContent"],
  >(key: K, value: GeneratedWebsite["globalContent"][K]) {
    if (!website) {
      return;
    }

    persist({
      ...website,
      globalContent: {
        ...website.globalContent,
        [key]: value,
      },
    });
  }

  function updatePage(
    pageIndex: number,
    updater: (page: GeneratedPage) => GeneratedPage,
  ) {
    if (!website) {
      return;
    }

    persist({
      ...website,
      pages: website.pages.map((page, index) =>
        index === pageIndex ? updater(page) : page,
      ),
    });
  }

  function updateSection(
    pageIndex: number,
    sectionIndex: number,
    updater: (section: GeneratedSection) => GeneratedSection,
  ) {
    updatePage(pageIndex, (page) => ({
      ...page,
      sections: page.sections.map((section, index) =>
        index === sectionIndex ? updater(section) : section,
      ),
    }));
  }

  function updateService(
    serviceIndex: number,
    updater: (service: GeneratedService) => GeneratedService,
  ) {
    if (!website) {
      return;
    }

    persist({
      ...website,
      services: website.services.map((service, index) =>
        index === serviceIndex ? updater(service) : service,
      ),
    });
  }

  function updateLegalField<
    K extends keyof GeneratedWebsite["legal"],
  >(key: K, value: GeneratedWebsite["legal"][K]) {
    if (!website) {
      return;
    }

    persist({
      ...website,
      legal: {
        ...website.legal,
        [key]: value,
      },
    });
  }

  function updateSeo(
    pageIndex: number,
    field: keyof GeneratedSeo,
    value: string | string[],
  ) {
    updatePage(pageIndex, (page) => ({
      ...page,
      seo: {
        ...page.seo,
        [field]: value,
      },
    }));
  }

  function updateServiceSeo(
    serviceIndex: number,
    field: keyof GeneratedSeo,
    value: string | string[],
  ) {
    updateService(serviceIndex, (service) => ({
      ...service,
      seo: {
        ...service.seo,
        [field]: value,
      },
    }));
  }

  function saveAllChanges() {
    if (!website) {
      return;
    }

    persist(
      {
        ...website,
        project: {
          ...website.project,
          version: website.project.version + 1,
          generatedAt: new Date().toISOString(),
        },
      },
      "All changes saved",
    );
  }

  function approveWebsite() {
    if (!website) {
      return;
    }

    setApprovalError("");

    if (!allOwnerChecksComplete) {
      setApprovalError(
        "Complete every owner check before approving the website.",
      );
      return;
    }

    if (!approvalName.trim()) {
      setApprovalError("Enter the name of the person approving the website.");
      return;
    }

    if (!approvalConfirmation) {
      setApprovalError(
        "Confirm that the website details have been reviewed.",
      );
      return;
    }

    const approvedAt = new Date().toISOString();
    const record: ApprovalRecord = {
      approved: true,
      approvedAt,
      approvedBy: approvalName.trim(),
      confirmation:
        "Website content, business details, services, SEO and legal drafts reviewed and approved for publishing.",
    };

    window.localStorage.setItem(
      APPROVAL_STORAGE_KEY,
      JSON.stringify(record),
    );

    const existingProjectRaw =
      window.localStorage.getItem(PROJECT_STORAGE_KEY);
    const existingProject = existingProjectRaw
      ? (JSON.parse(existingProjectRaw) as Partial<DashboardProject>)
      : {};

    const project: DashboardProject = {
      businessName: website.project.businessName,
      trade: website.project.trade,
      location: website.project.location,
      domain: website.project.preferredDomain,
      status: "ready",
      completion: 100,
      lastUpdated: approvedAt,
      lastPublished:
        typeof existingProject.lastPublished === "string"
          ? existingProject.lastPublished
          : "",
      seoScore: website.quality.seoScore,
      pagesGenerated: website.pages.length,
      suggestions: website.quality.improvements.length,
    };

    window.localStorage.setItem(
      PROJECT_STORAGE_KEY,
      JSON.stringify(project),
    );

    setApprovalRecord(record);
    setSaveMessage("Website approved");
    window.setTimeout(() => setSaveMessage(""), 1800);
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-10 w-72 rounded-xl bg-slate-200" />
          <div className="mt-8 h-[700px] rounded-3xl bg-white" />
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
            ✅
          </span>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
            No website is ready for review
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Generate the website first, then return here to review and approve
            the content.
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
              Generate Website
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const sections: {
    id: ReviewSection;
    label: string;
    description: string;
  }[] = [
    {
      id: "overview",
      label: "Overview",
      description: "Business details and website summary",
    },
    {
      id: "pages",
      label: "Pages",
      description: "Review page content and sections",
    },
    {
      id: "services",
      label: "Services",
      description: "Edit generated service content",
    },
    {
      id: "seo",
      label: "SEO",
      description: "Titles, descriptions and keywords",
    },
    {
      id: "legal",
      label: "Legal",
      description: "Privacy, cookies and terms",
    },
    {
      id: "owner-checks",
      label: "Owner Checks",
      description: "Confirm important business facts",
    },
    {
      id: "approval",
      label: "Approval",
      description: "Final sign-off before publishing",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <Link
                className="text-sm font-extrabold text-blue-800 hover:text-blue-950"
                href="/business/preview"
              >
                ← Website preview
              </Link>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Review & Approve Website
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                Review every important detail, edit generated content and
                approve the website only when it is accurate.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {saveMessage ? (
                <span className="text-sm font-extrabold text-emerald-700">
                  ✓ {saveMessage}
                </span>
              ) : null}

              <button
                className="rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
                onClick={saveAllChanges}
                type="button"
              >
                Save Changes
              </button>

              <Link
                className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900"
                href="/business/final-scope"
              >
                Publishing Options
              </Link>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">Pages</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {website.pages.length}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">Services</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {website.services.length}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">Review items</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {totalItems}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">Status</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {approvalRecord?.approved ? "Approved" : "Reviewing"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside>
            <nav className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
              <div className="mb-4 px-3">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Review areas
                </p>
              </div>

              <div className="space-y-2">
                {sections.map((section) => {
                  const active = activeSection === section.id;

                  return (
                    <button
                      className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                        active
                          ? "bg-blue-950 text-white"
                          : "text-slate-800 hover:bg-slate-100"
                      }`}
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      type="button"
                    >
                      <span className="block font-extrabold">
                        {section.label}
                      </span>
                      <span
                        className={`mt-1 block text-xs leading-5 ${
                          active ? "text-blue-100" : "text-slate-500"
                        }`}
                      >
                        {section.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-200 px-3 pt-5">
                <p className="text-sm font-bold text-slate-500">
                  Owner checks
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {completedOwnerChecks}/
                  {website.quality.ownerChecks.length}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-700"
                    style={{
                      width: `${
                        website.quality.ownerChecks.length
                          ? (completedOwnerChecks /
                              website.quality.ownerChecks.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </nav>
          </aside>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            {activeSection === "overview" ? (
              <div>
                <SectionTitle
                  description="Check the core business identity and global website information."
                  eyebrow="Overview"
                  title="Business and website summary"
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass()} htmlFor="businessName">
                      Business name
                    </label>
                    <input
                      className={fieldClass()}
                      id="businessName"
                      onChange={(event) =>
                        updateProjectField(
                          "businessName",
                          event.target.value,
                        )
                      }
                      value={website.project.businessName}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="displayName">
                      Display name
                    </label>
                    <input
                      className={fieldClass()}
                      id="displayName"
                      onChange={(event) =>
                        updateProjectField(
                          "displayName",
                          event.target.value,
                        )
                      }
                      value={website.project.displayName}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="trade">
                      Trade or industry
                    </label>
                    <input
                      className={fieldClass()}
                      id="trade"
                      onChange={(event) =>
                        updateProjectField("trade", event.target.value)
                      }
                      value={website.project.trade}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="location">
                      Primary location
                    </label>
                    <input
                      className={fieldClass()}
                      id="location"
                      onChange={(event) =>
                        updateProjectField("location", event.target.value)
                      }
                      value={website.project.location}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass()} htmlFor="tagline">
                      Tagline
                    </label>
                    <input
                      className={fieldClass()}
                      id="tagline"
                      onChange={(event) =>
                        updateProjectField("tagline", event.target.value)
                      }
                      value={website.project.tagline}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      className={labelClass()}
                      htmlFor="serviceAreaSummary"
                    >
                      Service area summary
                    </label>
                    <textarea
                      className={`${fieldClass()} min-h-28 resize-y`}
                      id="serviceAreaSummary"
                      onChange={(event) =>
                        updateProjectField(
                          "serviceAreaSummary",
                          event.target.value,
                        )
                      }
                      value={website.project.serviceAreaSummary}
                    />
                  </div>

                  <div>
                    <label
                      className={labelClass()}
                      htmlFor="preferredDomain"
                    >
                      Preferred domain
                    </label>
                    <input
                      className={fieldClass()}
                      id="preferredDomain"
                      onChange={(event) =>
                        updateProjectField(
                          "preferredDomain",
                          event.target.value,
                        )
                      }
                      value={website.project.preferredDomain}
                    />
                  </div>

                  <div>
                    <label
                      className={labelClass()}
                      htmlFor="phoneDisplay"
                    >
                      Phone display
                    </label>
                    <input
                      className={fieldClass()}
                      id="phoneDisplay"
                      onChange={(event) =>
                        updateGlobalField(
                          "phoneDisplay",
                          event.target.value,
                        )
                      }
                      value={website.globalContent.phoneDisplay}
                    />
                  </div>

                  <div>
                    <label
                      className={labelClass()}
                      htmlFor="emailDisplay"
                    >
                      Email display
                    </label>
                    <input
                      className={fieldClass()}
                      id="emailDisplay"
                      onChange={(event) =>
                        updateGlobalField(
                          "emailDisplay",
                          event.target.value,
                        )
                      }
                      value={website.globalContent.emailDisplay}
                    />
                  </div>

                  <div>
                    <label
                      className={labelClass()}
                      htmlFor="addressDisplay"
                    >
                      Address display
                    </label>
                    <input
                      className={fieldClass()}
                      id="addressDisplay"
                      onChange={(event) =>
                        updateGlobalField(
                          "addressDisplay",
                          event.target.value,
                        )
                      }
                      value={website.globalContent.addressDisplay}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      className={labelClass()}
                      htmlFor="footerDescription"
                    >
                      Footer description
                    </label>
                    <textarea
                      className={`${fieldClass()} min-h-28 resize-y`}
                      id="footerDescription"
                      onChange={(event) =>
                        updateGlobalField(
                          "footerDescription",
                          event.target.value,
                        )
                      }
                      value={website.globalContent.footerDescription}
                    />
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div
                    className={`rounded-2xl p-5 ${scoreClasses(
                      website.quality.seoScore,
                    )}`}
                  >
                    <p className="text-sm font-bold">SEO score</p>
                    <p className="mt-2 text-3xl font-black">
                      {website.quality.seoScore}/100
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl p-5 ${scoreClasses(
                      website.quality.accessibilityScore,
                    )}`}
                  >
                    <p className="text-sm font-bold">Accessibility</p>
                    <p className="mt-2 text-3xl font-black">
                      {website.quality.accessibilityScore}/100
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl p-5 ${scoreClasses(
                      website.quality.completenessScore,
                    )}`}
                  >
                    <p className="text-sm font-bold">Completeness</p>
                    <p className="mt-2 text-3xl font-black">
                      {website.quality.completenessScore}/100
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "pages" ? (
              <div>
                <SectionTitle
                  description="Edit page titles, introductions and individual content sections."
                  eyebrow="Pages"
                  title="Generated website pages"
                />

                <div className="space-y-6">
                  {website.pages.map((page, pageIndex) => (
                    <details
                      className="rounded-3xl border border-slate-200 bg-slate-50"
                      key={`${page.pageType}-${page.slug}`}
                      open={pageIndex === 0}
                    >
                      <summary className="cursor-pointer list-none p-5 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-lg font-black text-slate-950">
                              {page.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {page.pageType} · {page.slug}
                            </p>
                          </div>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-600">
                            {page.sections.length} sections
                          </span>
                        </div>
                      </summary>

                      <div className="border-t border-slate-200 bg-white p-5 sm:p-6">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label className={labelClass()}>
                              Navigation label
                            </label>
                            <input
                              className={fieldClass()}
                              onChange={(event) =>
                                updatePage(pageIndex, (current) => ({
                                  ...current,
                                  navigationLabel: event.target.value,
                                }))
                              }
                              value={page.navigationLabel}
                            />
                          </div>

                          <div>
                            <label className={labelClass()}>Page title</label>
                            <input
                              className={fieldClass()}
                              onChange={(event) =>
                                updatePage(pageIndex, (current) => ({
                                  ...current,
                                  title: event.target.value,
                                }))
                              }
                              value={page.title}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className={labelClass()}>
                              Page introduction
                            </label>
                            <textarea
                              className={`${fieldClass()} min-h-28 resize-y`}
                              onChange={(event) =>
                                updatePage(pageIndex, (current) => ({
                                  ...current,
                                  introduction: event.target.value,
                                }))
                              }
                              value={page.introduction}
                            />
                          </div>
                        </div>

                        <div className="mt-7 space-y-5">
                          {page.sections.map(
                            (section, sectionIndex) => (
                              <article
                                className="rounded-2xl border border-slate-200 p-5"
                                key={`${section.id}-${sectionIndex}`}
                              >
                                <div className="mb-5 flex items-center justify-between gap-4">
                                  <div>
                                    <p className="font-black text-slate-950">
                                      {section.heading}
                                    </p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                                      {section.type}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid gap-5">
                                  <div>
                                    <label className={labelClass()}>
                                      Heading
                                    </label>
                                    <input
                                      className={fieldClass()}
                                      onChange={(event) =>
                                        updateSection(
                                          pageIndex,
                                          sectionIndex,
                                          (current) => ({
                                            ...current,
                                            heading:
                                              event.target.value,
                                          }),
                                        )
                                      }
                                      value={section.heading}
                                    />
                                  </div>

                                  <div>
                                    <label className={labelClass()}>
                                      Subheading
                                    </label>
                                    <textarea
                                      className={`${fieldClass()} min-h-24 resize-y`}
                                      onChange={(event) =>
                                        updateSection(
                                          pageIndex,
                                          sectionIndex,
                                          (current) => ({
                                            ...current,
                                            subheading:
                                              event.target.value,
                                          }),
                                        )
                                      }
                                      value={section.subheading}
                                    />
                                  </div>

                                  <div>
                                    <label className={labelClass()}>
                                      Body content
                                    </label>
                                    <textarea
                                      className={`${fieldClass()} min-h-36 resize-y`}
                                      onChange={(event) =>
                                        updateSection(
                                          pageIndex,
                                          sectionIndex,
                                          (current) => ({
                                            ...current,
                                            body: event.target.value,
                                          }),
                                        )
                                      }
                                      value={section.body}
                                    />
                                  </div>

                                  <div>
                                    <label className={labelClass()}>
                                      Bullet points
                                    </label>
                                    <textarea
                                      className={`${fieldClass()} min-h-28 resize-y`}
                                      onChange={(event) =>
                                        updateSection(
                                          pageIndex,
                                          sectionIndex,
                                          (current) => ({
                                            ...current,
                                            bullets: event.target.value
                                              .split("\n")
                                              .map((item) =>
                                                item.trim(),
                                              )
                                              .filter(Boolean),
                                          }),
                                        )
                                      }
                                      value={section.bullets.join("\n")}
                                    />
                                    <p className="mt-2 text-sm text-slate-500">
                                      Use one bullet point per line.
                                    </p>
                                  </div>

                                  <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                      <label className={labelClass()}>
                                        Primary button
                                      </label>
                                      <input
                                        className={fieldClass()}
                                        onChange={(event) =>
                                          updateSection(
                                            pageIndex,
                                            sectionIndex,
                                            (current) => ({
                                              ...current,
                                              primaryCta: {
                                                ...current.primaryCta,
                                                label:
                                                  event.target.value,
                                              },
                                            }),
                                          )
                                        }
                                        value={section.primaryCta.label}
                                      />
                                    </div>

                                    <div>
                                      <label className={labelClass()}>
                                        Primary link
                                      </label>
                                      <input
                                        className={fieldClass()}
                                        onChange={(event) =>
                                          updateSection(
                                            pageIndex,
                                            sectionIndex,
                                            (current) => ({
                                              ...current,
                                              primaryCta: {
                                                ...current.primaryCta,
                                                href:
                                                  event.target.value,
                                              },
                                            }),
                                          )
                                        }
                                        value={section.primaryCta.href}
                                      />
                                    </div>

                                    <div>
                                      <label className={labelClass()}>
                                        Secondary button
                                      </label>
                                      <input
                                        className={fieldClass()}
                                        onChange={(event) =>
                                          updateSection(
                                            pageIndex,
                                            sectionIndex,
                                            (current) => ({
                                              ...current,
                                              secondaryCta: {
                                                ...current.secondaryCta,
                                                label:
                                                  event.target.value,
                                              },
                                            }),
                                          )
                                        }
                                        value={section.secondaryCta.label}
                                      />
                                    </div>

                                    <div>
                                      <label className={labelClass()}>
                                        Secondary link
                                      </label>
                                      <input
                                        className={fieldClass()}
                                        onChange={(event) =>
                                          updateSection(
                                            pageIndex,
                                            sectionIndex,
                                            (current) => ({
                                              ...current,
                                              secondaryCta: {
                                                ...current.secondaryCta,
                                                href:
                                                  event.target.value,
                                              },
                                            }),
                                          )
                                        }
                                        value={section.secondaryCta.href}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </article>
                            ),
                          )}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "services" ? (
              <div>
                <SectionTitle
                  description="Review the description, benefits, process and frequently asked questions for each service."
                  eyebrow="Services"
                  title="Generated service content"
                />

                <div className="space-y-6">
                  {website.services.map((service, serviceIndex) => (
                    <details
                      className="rounded-3xl border border-slate-200 bg-slate-50"
                      key={service.slug}
                      open={serviceIndex === 0}
                    >
                      <summary className="cursor-pointer list-none p-5 sm:p-6">
                        <p className="text-lg font-black text-slate-950">
                          {service.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          /services/{service.slug}
                        </p>
                      </summary>

                      <div className="border-t border-slate-200 bg-white p-5 sm:p-6">
                        <div className="grid gap-5">
                          <div>
                            <label className={labelClass()}>Service name</label>
                            <input
                              className={fieldClass()}
                              onChange={(event) =>
                                updateService(serviceIndex, (current) => ({
                                  ...current,
                                  name: event.target.value,
                                }))
                              }
                              value={service.name}
                            />
                          </div>

                          <div>
                            <label className={labelClass()}>
                              Short description
                            </label>
                            <textarea
                              className={`${fieldClass()} min-h-24 resize-y`}
                              onChange={(event) =>
                                updateService(serviceIndex, (current) => ({
                                  ...current,
                                  shortDescription: event.target.value,
                                }))
                              }
                              value={service.shortDescription}
                            />
                          </div>

                          <div>
                            <label className={labelClass()}>
                              Full description
                            </label>
                            <textarea
                              className={`${fieldClass()} min-h-40 resize-y`}
                              onChange={(event) =>
                                updateService(serviceIndex, (current) => ({
                                  ...current,
                                  fullDescription: event.target.value,
                                }))
                              }
                              value={service.fullDescription}
                            />
                          </div>

                          <div className="grid gap-5 lg:grid-cols-3">
                            <div>
                              <label className={labelClass()}>Benefits</label>
                              <textarea
                                className={`${fieldClass()} min-h-44 resize-y`}
                                onChange={(event) =>
                                  updateService(
                                    serviceIndex,
                                    (current) => ({
                                      ...current,
                                      benefits: event.target.value
                                        .split("\n")
                                        .map((item) => item.trim())
                                        .filter(Boolean),
                                    }),
                                  )
                                }
                                value={service.benefits.join("\n")}
                              />
                            </div>

                            <div>
                              <label className={labelClass()}>
                                Common jobs
                              </label>
                              <textarea
                                className={`${fieldClass()} min-h-44 resize-y`}
                                onChange={(event) =>
                                  updateService(
                                    serviceIndex,
                                    (current) => ({
                                      ...current,
                                      commonJobs: event.target.value
                                        .split("\n")
                                        .map((item) => item.trim())
                                        .filter(Boolean),
                                    }),
                                  )
                                }
                                value={service.commonJobs.join("\n")}
                              />
                            </div>

                            <div>
                              <label className={labelClass()}>Process</label>
                              <textarea
                                className={`${fieldClass()} min-h-44 resize-y`}
                                onChange={(event) =>
                                  updateService(
                                    serviceIndex,
                                    (current) => ({
                                      ...current,
                                      process: event.target.value
                                        .split("\n")
                                        .map((item) => item.trim())
                                        .filter(Boolean),
                                    }),
                                  )
                                }
                                value={service.process.join("\n")}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={labelClass()}>
                              Call to action
                            </label>
                            <input
                              className={fieldClass()}
                              onChange={(event) =>
                                updateService(serviceIndex, (current) => ({
                                  ...current,
                                  callToAction: event.target.value,
                                }))
                              }
                              value={service.callToAction}
                            />
                          </div>

                          <div>
                            <h3 className="text-lg font-black text-slate-950">
                              Frequently asked questions
                            </h3>

                            <div className="mt-4 space-y-4">
                              {service.faq.map((item, faqIndex) => (
                                <div
                                  className="rounded-2xl border border-slate-200 p-5"
                                  key={`${item.question}-${faqIndex}`}
                                >
                                  <label className={labelClass()}>
                                    Question
                                  </label>
                                  <input
                                    className={fieldClass()}
                                    onChange={(event) =>
                                      updateService(
                                        serviceIndex,
                                        (current) => ({
                                          ...current,
                                          faq: current.faq.map(
                                            (faqItem, index) =>
                                              index === faqIndex
                                                ? {
                                                    ...faqItem,
                                                    question:
                                                      event.target.value,
                                                  }
                                                : faqItem,
                                          ),
                                        }),
                                      )
                                    }
                                    value={item.question}
                                  />

                                  <label className={`${labelClass()} mt-4`}>
                                    Answer
                                  </label>
                                  <textarea
                                    className={`${fieldClass()} min-h-28 resize-y`}
                                    onChange={(event) =>
                                      updateService(
                                        serviceIndex,
                                        (current) => ({
                                          ...current,
                                          faq: current.faq.map(
                                            (faqItem, index) =>
                                              index === faqIndex
                                                ? {
                                                    ...faqItem,
                                                    answer:
                                                      event.target.value,
                                                  }
                                                : faqItem,
                                          ),
                                        }),
                                      )
                                    }
                                    value={item.answer}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "seo" ? (
              <div>
                <SectionTitle
                  description="Review page titles, descriptions, keywords and canonical paths."
                  eyebrow="SEO"
                  title="Search engine settings"
                />

                <div className="space-y-6">
                  {website.pages.map((page, pageIndex) => (
                    <article
                      className="rounded-3xl border border-slate-200 p-5 sm:p-6"
                      key={`seo-${page.slug}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-black text-slate-950">
                          {page.title}
                        </h3>
                        <span className="text-sm font-bold text-slate-500">
                          {page.slug}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-5">
                        <div>
                          <label className={labelClass()}>
                            SEO title ({page.seo.title.length}/60)
                          </label>
                          <input
                            className={fieldClass()}
                            onChange={(event) =>
                              updateSeo(
                                pageIndex,
                                "title",
                                event.target.value,
                              )
                            }
                            value={page.seo.title}
                          />
                        </div>

                        <div>
                          <label className={labelClass()}>
                            SEO description ({page.seo.description.length}/155)
                          </label>
                          <textarea
                            className={`${fieldClass()} min-h-24 resize-y`}
                            onChange={(event) =>
                              updateSeo(
                                pageIndex,
                                "description",
                                event.target.value,
                              )
                            }
                            value={page.seo.description}
                          />
                        </div>

                        <div>
                          <label className={labelClass()}>
                            Keywords
                          </label>
                          <textarea
                            className={`${fieldClass()} min-h-24 resize-y`}
                            onChange={(event) =>
                              updateSeo(
                                pageIndex,
                                "keywords",
                                event.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              )
                            }
                            value={page.seo.keywords.join(", ")}
                          />
                        </div>

                        <div>
                          <label className={labelClass()}>
                            Canonical path
                          </label>
                          <input
                            className={fieldClass()}
                            onChange={(event) =>
                              updateSeo(
                                pageIndex,
                                "canonicalPath",
                                event.target.value,
                              )
                            }
                            value={page.seo.canonicalPath}
                          />
                        </div>
                      </div>
                    </article>
                  ))}

                  {website.services.map((service, serviceIndex) => (
                    <article
                      className="rounded-3xl border border-blue-200 bg-blue-50 p-5 sm:p-6"
                      key={`service-seo-${service.slug}`}
                    >
                      <h3 className="text-lg font-black text-blue-950">
                        Service: {service.name}
                      </h3>

                      <div className="mt-5 grid gap-5">
                        <input
                          className={fieldClass()}
                          onChange={(event) =>
                            updateServiceSeo(
                              serviceIndex,
                              "title",
                              event.target.value,
                            )
                          }
                          value={service.seo.title}
                        />

                        <textarea
                          className={`${fieldClass()} min-h-24 resize-y`}
                          onChange={(event) =>
                            updateServiceSeo(
                              serviceIndex,
                              "description",
                              event.target.value,
                            )
                          }
                          value={service.seo.description}
                        />

                        <textarea
                          className={`${fieldClass()} min-h-24 resize-y`}
                          onChange={(event) =>
                            updateServiceSeo(
                              serviceIndex,
                              "keywords",
                              event.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            )
                          }
                          value={service.seo.keywords.join(", ")}
                        />

                        <input
                          className={fieldClass()}
                          onChange={(event) =>
                            updateServiceSeo(
                              serviceIndex,
                              "canonicalPath",
                              event.target.value,
                            )
                          }
                          value={service.seo.canonicalPath}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "legal" ? (
              <div>
                <SectionTitle
                  description="These are editable starter drafts. They must match how the live website actually collects and uses data."
                  eyebrow="Legal"
                  title="Privacy, cookies and website terms"
                />

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-black text-amber-950">
                    Important legal review
                  </p>
                  <p className="mt-2 leading-7 text-amber-900">
                    Beacon prepares practical starter drafts, but these pages do
                    not replace professional legal advice. Confirm that the final
                    wording matches the website’s real forms, cookies,
                    analytics, advertising and payment systems.
                  </p>
                </div>

                <div className="mt-8 space-y-7">
                  <div>
                    <label className={labelClass()} htmlFor="privacyNotice">
                      Privacy notice
                    </label>
                    <textarea
                      className={`${fieldClass()} min-h-[420px] resize-y`}
                      id="privacyNotice"
                      onChange={(event) =>
                        updateLegalField(
                          "privacyNotice",
                          event.target.value,
                        )
                      }
                      value={website.legal.privacyNotice}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="cookieNotice">
                      Cookie notice
                    </label>
                    <textarea
                      className={`${fieldClass()} min-h-[320px] resize-y`}
                      id="cookieNotice"
                      onChange={(event) =>
                        updateLegalField(
                          "cookieNotice",
                          event.target.value,
                        )
                      }
                      value={website.legal.cookieNotice}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="websiteTerms">
                      Website terms
                    </label>
                    <textarea
                      className={`${fieldClass()} min-h-[420px] resize-y`}
                      id="websiteTerms"
                      onChange={(event) =>
                        updateLegalField(
                          "websiteTerms",
                          event.target.value,
                        )
                      }
                      value={website.legal.websiteTerms}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-950">
                      Legal warnings
                    </h3>
                    <div className="mt-4 space-y-3">
                      {website.legal.legalWarnings.map((warning) => (
                        <p
                          className="flex gap-3 rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700"
                          key={warning}
                        >
                          <span className="font-black text-amber-700">!</span>
                          {warning}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "owner-checks" ? (
              <div>
                <SectionTitle
                  description="Confirm each factual or operational point before approving the website."
                  eyebrow="Owner checks"
                  title="Final business fact checks"
                />

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <p className="font-black text-blue-950">
                    {completedOwnerChecks} of{" "}
                    {website.quality.ownerChecks.length} complete
                  </p>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-blue-700"
                      style={{
                        width: `${
                          website.quality.ownerChecks.length
                            ? (completedOwnerChecks /
                                website.quality.ownerChecks.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {website.quality.ownerChecks.map((item, index) => (
                    <label
                      className={`flex cursor-pointer gap-4 rounded-2xl border p-5 transition ${
                        ownerCheckStatus[index]
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                      key={`${item}-${index}`}
                    >
                      <input
                        checked={ownerCheckStatus[index] ?? false}
                        className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
                        onChange={(event) =>
                          setOwnerCheckStatus((current) =>
                            current.map((value, itemIndex) =>
                              itemIndex === index
                                ? event.target.checked
                                : value,
                            ),
                          )
                        }
                        type="checkbox"
                      />

                      <span>
                        <span className="block font-extrabold text-slate-950">
                          Check {index + 1}
                        </span>
                        <span className="mt-1 block leading-7 text-slate-700">
                          {item}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "approval" ? (
              <div>
                <SectionTitle
                  description="Approving confirms that the owner has reviewed the generated website and authorises it to move to the publishing stage."
                  eyebrow="Approval"
                  title="Final owner sign-off"
                />

                {approvalRecord?.approved ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7">
                    <div className="flex gap-4">
                      <span
                        aria-hidden="true"
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-2xl"
                      >
                        ✓
                      </span>

                      <div>
                        <h3 className="text-xl font-black text-emerald-950">
                          Website approved
                        </h3>
                        <p className="mt-2 leading-7 text-emerald-900">
                          Approved by {approvalRecord.approvedBy} on{" "}
                          {formatDate(approvalRecord.approvedAt)}.
                        </p>
                        <p className="mt-2 leading-7 text-emerald-800">
                          The website can now proceed to final scope, domain and
                          publishing configuration.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
                  <div>
                    <div className="rounded-3xl border border-slate-200 p-6">
                      <h3 className="text-xl font-black text-slate-950">
                        Approval checklist
                      </h3>

                      <div className="mt-5 space-y-4">
                        {[
                          {
                            label: "Owner checks complete",
                            complete: allOwnerChecksComplete,
                          },
                          {
                            label: "Legal drafts contain content",
                            complete: legalReviewed,
                          },
                          {
                            label: "Business identity reviewed",
                            complete: Boolean(
                              website.project.businessName &&
                                website.project.location &&
                                website.project.trade,
                            ),
                          },
                          {
                            label: "Contact details reviewed",
                            complete: Boolean(
                              website.globalContent.phoneDisplay &&
                                website.globalContent.emailDisplay,
                            ),
                          },
                          {
                            label: "Pages and services generated",
                            complete:
                              website.pages.length > 0 &&
                              website.services.length > 0,
                          },
                        ].map((item) => (
                          <div
                            className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                            key={item.label}
                          >
                            <span className="font-bold text-slate-700">
                              {item.label}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                                item.complete
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {item.complete ? "Complete" : "Required"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
                    <h3 className="text-xl font-black text-blue-950">
                      Approver details
                    </h3>

                    <div className="mt-5">
                      <label
                        className={labelClass()}
                        htmlFor="approvalName"
                      >
                        Approved by
                      </label>
                      <input
                        className={fieldClass()}
                        id="approvalName"
                        onChange={(event) =>
                          setApprovalName(event.target.value)
                        }
                        placeholder="Full name"
                        value={approvalName}
                      />
                    </div>

                    <label className="mt-5 flex gap-3 rounded-2xl border border-blue-200 bg-white p-4">
                      <input
                        checked={approvalConfirmation}
                        className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
                        onChange={(event) =>
                          setApprovalConfirmation(event.target.checked)
                        }
                        type="checkbox"
                      />
                      <span className="leading-7 text-slate-700">
                        I confirm that I have reviewed the website content,
                        business details, services, contact information, SEO and
                        legal drafts, and I approve this version to proceed to
                        publishing.
                      </span>
                    </label>

                    {approvalError ? (
                      <p className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-red-800">
                        {approvalError}
                      </p>
                    ) : null}

                    <button
                      className="mt-6 w-full rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!readyForApproval}
                      onClick={approveWebsite}
                      type="button"
                    >
                      Approve Website
                    </button>
                  </div>
                </div>

                <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
                  <h3 className="text-lg font-black text-amber-950">
                    Approval does not publish automatically
                  </h3>
                  <p className="mt-2 leading-7 text-amber-900">
                    Approval only confirms that the website is ready to move to
                    final publishing configuration. The website remains offline
                    until the owner separately confirms the domain and
                    publishing action.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}