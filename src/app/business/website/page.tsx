"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WebsiteStatus = "not_started" | "draft" | "ready" | "published";

type WebsiteProject = {
  businessName: string;
  trade: string;
  location: string;
  domain: string;
  status: WebsiteStatus;
  completion: number;
  lastUpdated: string;
  lastPublished: string;
  seoScore: number;
  pagesGenerated: number;
  suggestions: number;
};

type NavigationItem = {
  href: string;
  label: string;
};

const PROJECT_STORAGE_KEY = "beacon-business-website-project";

const EMPTY_PROJECT: WebsiteProject = {
  businessName: "",
  trade: "",
  location: "",
  domain: "",
  status: "not_started",
  completion: 0,
  lastUpdated: "",
  lastPublished: "",
  seoScore: 0,
  pagesGenerated: 0,
  suggestions: 0,
};

const BUSINESS_NAVIGATION: NavigationItem[] = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/website", label: "Website Builder" },
  { href: "/business/brand-kit", label: "Brand Kit" },
  { href: "/business/templates", label: "Templates" },
  { href: "/business/analytics", label: "Analytics" },
  { href: "/business/memberships", label: "Membership" },
];

function formatDate(value: string) {
  if (!value) {
    return "Not yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function readStoredProject(): WebsiteProject {
  if (typeof window === "undefined") {
    return EMPTY_PROJECT;
  }

  const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);

  if (!raw) {
    return EMPTY_PROJECT;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebsiteProject>;

    return {
      businessName:
        typeof parsed.businessName === "string" ? parsed.businessName : "",
      trade: typeof parsed.trade === "string" ? parsed.trade : "",
      location: typeof parsed.location === "string" ? parsed.location : "",
      domain: typeof parsed.domain === "string" ? parsed.domain : "",
      status:
        parsed.status === "draft" ||
        parsed.status === "ready" ||
        parsed.status === "published"
          ? parsed.status
          : "not_started",
      completion:
        typeof parsed.completion === "number"
          ? Math.min(100, Math.max(0, parsed.completion))
          : 0,
      lastUpdated:
        typeof parsed.lastUpdated === "string" ? parsed.lastUpdated : "",
      lastPublished:
        typeof parsed.lastPublished === "string" ? parsed.lastPublished : "",
      seoScore:
        typeof parsed.seoScore === "number"
          ? Math.min(100, Math.max(0, parsed.seoScore))
          : 0,
      pagesGenerated:
        typeof parsed.pagesGenerated === "number"
          ? Math.max(0, parsed.pagesGenerated)
          : 0,
      suggestions:
        typeof parsed.suggestions === "number"
          ? Math.max(0, parsed.suggestions)
          : 0,
    };
  } catch {
    return EMPTY_PROJECT;
  }
}

function statusLabel(status: WebsiteStatus) {
  switch (status) {
    case "draft":
      return "In progress";
    case "ready":
      return "Ready to review";
    case "published":
      return "Live";
    default:
      return "Not started";
  }
}

function statusClasses(status: WebsiteStatus) {
  switch (status) {
    case "draft":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "ready":
      return "bg-blue-100 text-blue-800 ring-blue-200";
    case "published":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function Icon({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl ${className}`}
    >
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  emptyValue,
  hasProject,
}: {
  label: string;
  value: string;
  emptyValue: string;
  hasProject: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p
        className={`mt-2 font-black ${
          hasProject ? "text-2xl text-slate-950" : "text-base text-slate-600"
        }`}
      >
        {hasProject ? value : emptyValue}
      </p>
    </div>
  );
}

export default function BusinessWebsitePage() {
  const [project, setProject] = useState<WebsiteProject>(EMPTY_PROJECT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProject(readStoredProject());
    setLoaded(true);
  }, []);

  const hasProject = project.status !== "not_started" || project.completion > 0;
  const canReview =
    project.status === "ready" || project.status === "published";
  const canManageDomains = project.status === "published";

  const websiteName = useMemo(() => {
    if (project.businessName.trim()) {
      return project.businessName.trim();
    }

    return "Your business website";
  }, [project.businessName]);

  const nextStep = useMemo(() => {
    if (!hasProject) {
      return "Add your business details so Beacon can create the first version of your website.";
    }

    if (project.status === "draft") {
      return "Continue the setup and complete any missing business, service or branding details.";
    }

    if (project.status === "ready") {
      return "Review the generated website and approve the final version before publishing.";
    }

    return "Your website is live. Review performance, update content or manage your domain.";
  }, [hasProject, project.status]);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-14 rounded-2xl bg-white" />
          <div className="mt-8 h-10 w-72 rounded-xl bg-slate-200" />
          <div className="mt-4 h-6 w-full max-w-2xl rounded-xl bg-slate-200" />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="h-64 rounded-3xl bg-white" />
            <div className="h-64 rounded-3xl bg-white" />
            <div className="h-64 rounded-3xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <Link
              className="text-lg font-black tracking-tight text-blue-950"
              href="/business/dashboard"
            >
              Beacon Business
            </Link>

            <Link
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
              href="/my-beacon"
            >
              My Beacon
            </Link>
          </div>

          <nav
            aria-label="Business navigation"
            className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          >
            <div className="flex min-w-max gap-2">
              {BUSINESS_NAVIGATION.map((item) => {
                const isCurrent = item.href === "/business/website";

                return (
                  <Link
                    aria-current={isCurrent ? "page" : undefined}
                    className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                      isCurrent
                        ? "bg-blue-950 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-blue-950"
                    }`}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm font-bold text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  className="transition hover:text-blue-900"
                  href="/business/dashboard"
                >
                  Business
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-800">Website Builder</li>
            </ol>
          </nav>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-900">
              <span aria-hidden="true">✨</span>
              AI Website Builder
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Build and manage your business website
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Beacon creates the content, pages, SEO and structure. You review
              and approve everything before anything goes live.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "No coding required",
                "Mobile friendly",
                "SEO optimised",
                "Review before publishing",
              ].map((badge) => (
                <span
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700"
                  key={badge}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {canManageDomains ? (
              <Link
                className="inline-flex items-center justify-center rounded-2xl border-2 border-blue-200 bg-blue-50 px-6 py-4 font-extrabold text-blue-950 transition hover:border-blue-400 hover:bg-blue-100"
                href="/business/website/domains"
              >
                Manage Domains
              </Link>
            ) : null}

            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200"
              href="/business/project"
            >
              {hasProject ? "Continue Website Setup" : "Start Website Setup"}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
                    Website progress
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {websiteName}
                  </h2>

                  <p className="mt-2 text-slate-600">
                    {project.trade || project.location
                      ? [project.trade, project.location]
                          .filter(Boolean)
                          .join(" · ")
                      : "Complete the setup wizard so Beacon can begin building."}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-extrabold ring-1 ${statusClasses(
                    project.status,
                  )}`}
                >
                  {statusLabel(project.status)}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Setup completion
                  </p>
                  <p className="mt-1 text-4xl font-black text-slate-950">
                    {project.completion}%
                  </p>
                </div>

                <p className="text-right text-sm text-slate-500">
                  Last updated
                  <br />
                  <span className="font-bold text-slate-700">
                    {formatDate(project.lastUpdated)}
                  </span>
                </p>
              </div>

              <div
                aria-label={`Website setup ${project.completion}% complete`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={project.completion}
                className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-blue-700 transition-all"
                  style={{ width: `${project.completion}%` }}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
                  Next step
                </p>
                <p className="mt-2 leading-7 text-blue-950">{nextStep}</p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MetricCard
                  emptyValue="Not generated yet"
                  hasProject={hasProject}
                  label="Pages"
                  value={String(project.pagesGenerated)}
                />
                <MetricCard
                  emptyValue="Pending generation"
                  hasProject={hasProject}
                  label="SEO score"
                  value={`${project.seoScore}/100`}
                />
                <MetricCard
                  emptyValue="Available after first build"
                  hasProject={hasProject}
                  label="AI suggestions"
                  value={String(project.suggestions)}
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-950 px-5 py-4 font-extrabold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200"
                  href="/business/project"
                >
                  {hasProject ? "Continue Setup" : "Start Setup"}
                </Link>

                <Link
                  aria-disabled={!hasProject}
                  className={`inline-flex flex-1 items-center justify-center rounded-2xl border-2 px-5 py-4 font-extrabold transition ${
                    hasProject
                      ? "border-slate-300 bg-white text-slate-800 hover:border-blue-400 hover:text-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                  href="/business/preview"
                  tabIndex={hasProject ? 0 : -1}
                >
                  Preview Website
                </Link>
              </div>
            </div>
          </article>

          <aside className="rounded-3xl border border-slate-200 bg-blue-950 p-6 text-white shadow-sm sm:p-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-200">
              What Beacon handles
            </p>

            <h2 className="mt-3 text-2xl font-black">
              A professional website without hiring a developer
            </h2>

            <p className="mt-3 leading-7 text-blue-100">
              Most first website drafts can be prepared in minutes once your
              business details, services and branding are complete.
            </p>

            <div className="mt-7 space-y-4">
              {[
                "Writes the website content",
                "Creates service and location pages",
                "Builds mobile-friendly layouts",
                "Adds SEO metadata and structured data",
                "Creates privacy, cookie and terms pages",
                "Prepares everything for review before publishing",
              ].map((item) => (
                <div className="flex gap-3" key={item}>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 font-black text-blue-950"
                  >
                    ✓
                  </span>
                  <p className="font-semibold text-blue-50">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              href: "/business/project",
              icon: "🧭",
              title: "Website Setup",
              description:
                "Add business details, services, contact information, branding and photos.",
              linkText: "Open setup →",
              enabled: true,
            },
            {
              href: "/business/preview",
              icon: "🖥️",
              title: "Website Preview",
              description:
                "Review the generated website across desktop, tablet and mobile layouts.",
              linkText: "Open preview →",
              enabled: hasProject,
            },
            {
              href: "/business/preview/review",
              icon: "✅",
              title: "Review & Approve",
              description:
                "Check AI-generated content and approve the website before it can be published.",
              linkText: "Review website →",
              enabled: canReview,
            },
            {
              href: "/business/final-scope",
              icon: "🚀",
              title: "Publish Website",
              description:
                "Confirm the final scope, domain and publishing details when the website is ready.",
              linkText: "Publishing options →",
              enabled: canReview,
            },
            {
              href: "/business/website/domains",
              icon: "🌐",
              title: "Manage Domains",
              description:
                "Create a Beacon address, connect a custom domain, verify DNS and manage SSL.",
              linkText: "Manage domains →",
              enabled: canManageDomains,
            },
          ].map((card) => (
            <Link
              aria-disabled={!card.enabled}
              className={`group rounded-3xl border p-6 shadow-sm transition ${
                card.enabled
                  ? "border-slate-200 bg-white hover:-translate-y-1 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
                  : "pointer-events-none border-slate-200 bg-slate-100 opacity-60"
              }`}
              href={card.href}
              key={card.href}
              tabIndex={card.enabled ? 0 : -1}
            >
              <Icon>{card.icon}</Icon>
              <h3 className="mt-5 text-xl font-black text-slate-950">
                {card.title}
              </h3>
              <p className="mt-2 leading-7 text-slate-600">{card.description}</p>
              <p className="mt-5 font-extrabold text-blue-800 group-hover:text-blue-950">
                {card.linkText}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <Icon>🌐</Icon>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Domain
                </p>
                <h2 className="mt-2 break-all text-xl font-black text-slate-950">
                  {project.domain || "No domain connected yet"}
                </h2>
                <p className="mt-2 leading-7 text-slate-600">
                  {canManageDomains
                    ? "Manage the live website address, DNS verification, SSL and primary-domain settings."
                    : "Domain management becomes available after the website has been published."}
                </p>

                <Link
                  aria-disabled={!canManageDomains}
                  className={`mt-5 inline-flex items-center justify-center rounded-2xl border-2 px-5 py-3 font-extrabold transition ${
                    canManageDomains
                      ? "border-blue-200 bg-blue-50 text-blue-950 hover:border-blue-400 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                  href="/business/website/domains"
                  tabIndex={canManageDomains ? 0 : -1}
                >
                  Manage Domains
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <Icon>📅</Icon>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Last published
                </p>
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  {formatDate(project.lastPublished)}
                </h2>
                <p className="mt-2 leading-7 text-slate-600">
                  Beacon keeps a record of each approved publication so you
                  always know when the live website changed.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Link
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 sm:p-8"
            href="/business/brand-kit"
          >
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">
              Related tool
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              Complete your Brand Kit
            </h2>
            <p className="mt-2 leading-7 text-slate-600">
              Keep colours, logos and visual styling consistent across your
              generated website.
            </p>
          </Link>

          <Link
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 sm:p-8"
            href="/business/templates"
          >
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">
              Related tool
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              Explore business templates
            </h2>
            <p className="mt-2 leading-7 text-slate-600">
              Prepare matching policies, terms and business documents for your
              website.
            </p>
          </Link>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-2xl"
            >
              🔒
            </span>

            <div>
              <h2 className="text-xl font-black text-amber-950">
                You stay in control
              </h2>
              <p className="mt-2 max-w-4xl leading-7 text-amber-900">
                Beacon can generate and prepare the complete website, but it
                will not publish important changes automatically. You review
                the preview and approve the final version first.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}