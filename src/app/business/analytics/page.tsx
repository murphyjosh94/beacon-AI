"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WebsiteStatus = "not_started" | "draft" | "ready" | "published";

type WebsiteProject = {
  status?: WebsiteStatus;
  completion?: number;
  seoScore?: number;
  pagesGenerated?: number;
  suggestions?: number;
  lastUpdated?: string;
  lastPublished?: string;
  domain?: string;
};

type BrandKit = {
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  primaryColour?: string;
  secondaryColour?: string;
};

type QuoteRecord = {
  id?: string;
  status?: "draft" | "sent" | "accepted" | "rejected" | "expired";
  total?: number;
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
};

type TimelineItem = {
  id: string;
  title: string;
  detail: string;
  date: string;
  icon: string;
};


const WEBSITE_STORAGE_KEY = "beacon-business-website-project";
const BRAND_KIT_STORAGE_KEY = "beacon-business-brand-kit";
const QUOTES_STORAGE_KEYS = [
  "beacon-business-quotes",
  "beacon-ai-quotes",
  "beacon-quote-builder-quotes",
];


function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function money(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string) {
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

function formatDateTime(value?: string) {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readQuotes(): QuoteRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  for (const key of QUOTES_STORAGE_KEYS) {
    const parsed = safeParse<unknown>(window.localStorage.getItem(key), []);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is QuoteRecord =>
          typeof item === "object" && item !== null,
      );
    }
  }

  return [];
}

function MetricCard({
  label,
  value,
  note,
  icon,
  href,
}: {
  label: string;
  value: string;
  note: string;
  icon: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl"
        >
          {icon}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{note}</p>
    </>
  );

  const className =
    "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition";

  if (!href) {
    return <article className={className}>{content}</article>;
  }

  return (
    <Link
      className={`${className} hover:-translate-y-1 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100`}
      href={href}
    >
      {content}
    </Link>
  );
}

function ProgressRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-extrabold text-slate-900">{label}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <span className="text-lg font-black text-slate-950">{value}/100</span>
      </div>

      <div
        aria-label={`${label} score: ${value} out of 100`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={value}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-blue-700 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-5 w-48 rounded-lg bg-slate-200" />
          <div className="mt-5 h-12 w-full max-w-xl rounded-xl bg-slate-200" />
          <div className="mt-4 h-6 w-full max-w-3xl rounded-xl bg-slate-200" />

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_1fr]">
            <div className="h-72 rounded-[2rem] bg-slate-200" />
            <div className="h-72 rounded-[2rem] bg-white" />
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="h-44 rounded-3xl bg-white" key={index} />
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="h-[34rem] rounded-[2rem] bg-white" />
            <div className="h-[34rem] rounded-[2rem] bg-white" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BusinessAnalyticsPage() {
  const [loaded, setLoaded] = useState(false);
  const [website, setWebsite] = useState<WebsiteProject>({});
  const [brandKit, setBrandKit] = useState<BrandKit>({});
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);

  useEffect(() => {
    const hydrate = () => {
      setWebsite(
        safeParse<WebsiteProject>(
          window.localStorage.getItem(WEBSITE_STORAGE_KEY),
          {},
        ),
      );

      setBrandKit(
        safeParse<BrandKit>(
          window.localStorage.getItem(BRAND_KIT_STORAGE_KEY),
          {},
        ),
      );

      setQuotes(readQuotes());
      setLoaded(true);
    };

    hydrate();

    window.addEventListener("storage", hydrate);
    window.addEventListener("beacon-brand-kit-updated", hydrate);

    return () => {
      window.removeEventListener("storage", hydrate);
      window.removeEventListener("beacon-brand-kit-updated", hydrate);
    };
  }, []);

  const analytics = useMemo(() => {
    const accepted = quotes.filter((quote) => quote.status === "accepted");
    const rejected = quotes.filter((quote) => quote.status === "rejected");
    const pending = quotes.filter(
      (quote) =>
        quote.status === "draft" ||
        quote.status === "sent" ||
        !quote.status,
    );

    const quotedValue = quotes.reduce(
      (sum, quote) =>
        sum + (typeof quote.total === "number" ? quote.total : 0),
      0,
    );

    const acceptedValue = accepted.reduce(
      (sum, quote) =>
        sum + (typeof quote.total === "number" ? quote.total : 0),
      0,
    );

    const decided = accepted.length + rejected.length;
    const conversionRate =
      decided > 0 ? Math.round((accepted.length / decided) * 100) : 0;

    const brandFields = [
      brandKit.businessName,
      brandKit.email,
      brandKit.phone,
      brandKit.address,
      brandKit.website,
      brandKit.logoUrl,
    ];

    const brandScore = Math.round(
      (brandFields.filter((value) => value?.trim()).length /
        brandFields.length) *
        100,
    );

    const websiteScore = clamp(
      typeof website.completion === "number" ? website.completion : 0,
    );

    const seoScore = clamp(
      typeof website.seoScore === "number" ? website.seoScore : 0,
    );

    const domainScore = website.domain?.trim() ? 100 : 0;
    const legalScore = website.status === "published" ? 80 : 40;
    const quoteScore =
      quotes.length > 0 ? Math.min(100, 40 + quotes.length * 10) : 20;

    const healthScore = Math.round(
      websiteScore * 0.28 +
        brandScore * 0.18 +
        seoScore * 0.22 +
        domainScore * 0.12 +
        legalScore * 0.1 +
        quoteScore * 0.1,
    );

    const insights: string[] = [];

    if (brandScore < 100) {
      insights.push(
        "Complete your Brand Kit so documents, website content and customer messages stay consistent.",
      );
    }

    if (!website.domain?.trim()) {
      insights.push(
        "Connect a domain to strengthen trust and prepare the website for publishing.",
      );
    }

    if (seoScore < 70) {
      insights.push(
        "Your SEO score has room to improve. Add clearer service pages, location content and page descriptions.",
      );
    }

    if (quotes.length === 0) {
      insights.push(
        "Create your first customer quote so Beacon can begin tracking quote value and conversion.",
      );
    } else if (conversionRate < 35) {
      insights.push(
        "Your quote conversion rate is below 35%. Review pricing, follow-up timing and the clarity of your quote descriptions.",
      );
    }

    if (insights.length === 0) {
      insights.push(
        "Your core business setup is in good shape. Keep your website content and customer documents updated.",
      );
    }

    const timeline: TimelineItem[] = [];

    if (website.lastPublished) {
      timeline.push({
        id: "website-published",
        title: "Website published",
        detail: website.domain || "Website publication recorded",
        date: website.lastPublished,
        icon: "🚀",
      });
    }

    if (website.lastUpdated) {
      timeline.push({
        id: "website-updated",
        title: "Website project updated",
        detail: `${website.completion ?? 0}% setup completion`,
        date: website.lastUpdated,
        icon: "🖥️",
      });
    }

    quotes.forEach((quote, index) => {
      const date = quote.updatedAt || quote.createdAt;

      if (!date) {
        return;
      }

      timeline.push({
        id: quote.id || `quote-${index}`,
        title:
          quote.status === "accepted"
            ? "Quote accepted"
            : quote.status === "rejected"
              ? "Quote rejected"
              : quote.status === "sent"
                ? "Quote sent"
                : "Quote created",
        detail: `${quote.customerName || "Customer"} · ${money(
          typeof quote.total === "number" ? quote.total : 0,
        )}`,
        date,
        icon:
          quote.status === "accepted"
            ? "✅"
            : quote.status === "rejected"
              ? "❌"
              : "📄",
      });
    });

    timeline.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      accepted,
      rejected,
      pending,
      quotedValue,
      acceptedValue,
      conversionRate,
      brandScore,
      websiteScore,
      seoScore,
      domainScore,
      legalScore,
      quoteScore,
      healthScore,
      insights,
      timeline: timeline.slice(0, 8),
    };
  }, [brandKit, quotes, website]);

  if (!loaded) {
    return <LoadingState />;
  }

  const businessName = brandKit.businessName?.trim() || "Your business";

  const recommendedAction =
    analytics.brandScore < 100
      ? {
          href: "/business/brand-kit",
          label: "Complete Brand Kit",
        }
      : analytics.websiteScore < 100
        ? {
            href: "/business/website",
            label: "Continue Website Setup",
          }
        : {
            href: "/business/quotes",
            label: "Open AI Quote Builder",
          };

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="text-sm font-bold text-slate-500"
            >
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link
                    className="transition hover:text-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    href="/business/dashboard"
                  >
                    Business
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-slate-950">Analytics</li>
              </ol>
            </nav>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-900">
              <span aria-hidden="true">📊</span>
              Beacon Analytics
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {businessName} performance
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Track website readiness, quote performance, revenue signals and
              the next actions most likely to improve your business.
            </p>
          </div>

          <Link
            className="inline-flex items-center justify-center rounded-2xl border-2 border-blue-200 bg-blue-50 px-6 py-4 font-extrabold text-blue-950 transition hover:border-blue-400 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
            href={recommendedAction.href}
          >
            {recommendedAction.label}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <section className="overflow-hidden rounded-[2rem] bg-blue-950 p-7 text-white shadow-xl sm:p-9">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-200">
                  Business health
                </p>
                <p
                  aria-live="polite"
                  className="mt-3 text-6xl font-black tracking-tight"
                >
                  {analytics.healthScore}
                  <span className="text-2xl text-blue-200">/100</span>
                </p>
                <p className="mt-4 max-w-xl text-lg leading-8 text-blue-100">
                  {analytics.healthScore >= 80
                    ? "Your business setup is strong. Focus on conversion and regular optimisation."
                    : analytics.healthScore >= 55
                      ? "Your foundations are taking shape. Complete the missing setup areas to improve readiness."
                      : "Beacon has identified several high-impact setup tasks that should be completed next."}
                </p>
              </div>

              <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold">Overall readiness</span>
                  <span className="text-xl font-black text-amber-300">
                    {analytics.healthScore}%
                  </span>
                </div>
                <div
                  aria-label={`Overall readiness: ${analytics.healthScore}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={analytics.healthScore}
                  className="mt-4 h-3 overflow-hidden rounded-full bg-white/15"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-amber-300"
                    style={{ width: `${analytics.healthScore}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
              AI priority
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              {analytics.insights[0]}
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Beacon uses your saved website, Brand Kit and quote data to
              surface the next useful action.
            </p>

            <Link
              className="mt-6 inline-flex rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100"
              href={recommendedAction.href}
            >
              {recommendedAction.label}
            </Link>
          </section>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            href="/business/quotes"
            icon="📄"
            label="Quotes generated"
            note={`${analytics.pending.length} currently pending`}
            value={String(quotes.length)}
          />

          <MetricCard
            href="/business/quotes"
            icon="✅"
            label="Accepted quotes"
            note={`${analytics.conversionRate}% quote conversion`}
            value={String(analytics.accepted.length)}
          />

          <MetricCard
            href="/business/quotes"
            icon="💷"
            label="Quoted value"
            note={`${money(analytics.acceptedValue)} accepted`}
            value={money(analytics.quotedValue)}
          />

          <MetricCard
            href="/business/website"
            icon="🖥️"
            label="Website completion"
            note={`${website.pagesGenerated ?? 0} pages generated`}
            value={`${analytics.websiteScore}%`}
          />

          <MetricCard
            href="/business/website"
            icon="🔎"
            label="SEO score"
            note={`${website.suggestions ?? 0} AI suggestions available`}
            value={`${analytics.seoScore}/100`}
          />

          <MetricCard
            href="/business/brand-kit"
            icon="🎨"
            label="Brand Kit"
            note={
              analytics.brandScore === 100
                ? "Core business details completed"
                : "Complete missing business details"
            }
            value={`${analytics.brandScore}%`}
          />

          <MetricCard
            href="/business/website"
            icon="🌐"
            label="Domain"
            note={website.domain || "Add a domain when the website is ready"}
            value={analytics.domainScore === 100 ? "Connected" : "Not connected"}
          />

          <MetricCard
            href="/business/website"
            icon="🚀"
            label="Last published"
            note={
              website.status === "published"
                ? "Website is marked as live"
                : "No live publication recorded"
            }
            value={formatDate(website.lastPublished)}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
              Business readiness
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Connected platform health
            </h2>

            <div className="mt-7 space-y-6">
              <ProgressRow
                detail="Setup, content and publishing readiness"
                label="Website"
                value={analytics.websiteScore}
              />
              <ProgressRow
                detail="Search visibility and content quality"
                label="SEO"
                value={analytics.seoScore}
              />
              <ProgressRow
                detail="Business identity and reusable details"
                label="Brand Kit"
                value={analytics.brandScore}
              />
              <ProgressRow
                detail="Website address and live connection"
                label="Domain"
                value={analytics.domainScore}
              />
              <ProgressRow
                detail="Privacy, cookies, terms and publishing checks"
                label="Legal readiness"
                value={analytics.legalScore}
              />
              <ProgressRow
                detail="Customer quotation and conversion activity"
                label="Quote activity"
                value={analytics.quoteScore}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
              AI insights
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Recommended next actions
            </h2>

            <div className="mt-7 space-y-4">
              {analytics.insights.map((insight, index) => (
                <div
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  key={insight}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-black text-blue-950">
                    {index + 1}
                  </span>
                  <p className="leading-7 text-slate-700">{insight}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
              Business timeline
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Recent activity
            </h2>

            {analytics.timeline.length > 0 ? (
              <div className="mt-7 space-y-4">
                {analytics.timeline.map((item) => (
                  <div
                    className="flex gap-4 rounded-2xl border border-slate-200 p-5"
                    key={item.id}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl"
                    >
                      {item.icon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-extrabold text-slate-950">
                          {item.title}
                        </p>
                        <p className="text-sm font-semibold text-slate-500">
                          {formatDateTime(item.date)}
                        </p>
                      </div>
                      <p className="mt-1 break-words text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-lg font-black text-slate-900">
                  No activity recorded yet
                </p>
                <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
                  Website updates and quote activity will appear here
                  automatically.
                </p>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    href="/business/quotes"
                  >
                    Create first quote
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-300 hover:text-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    href="/business/website"
                  >
                    Open Website Builder
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
              Quote performance
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Customer conversion
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl bg-emerald-50 p-5">
                <p className="text-sm font-extrabold text-emerald-800">
                  Accepted
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-950">
                  {analytics.accepted.length}
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  {money(analytics.acceptedValue)} value
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-5">
                <p className="text-sm font-extrabold text-amber-800">
                  Pending
                </p>
                <p className="mt-2 text-3xl font-black text-amber-950">
                  {analytics.pending.length}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Quotes awaiting a decision
                </p>
              </div>

              <div className="rounded-2xl bg-rose-50 p-5">
                <p className="text-sm font-extrabold text-rose-800">
                  Rejected
                </p>
                <p className="mt-2 text-3xl font-black text-rose-950">
                  {analytics.rejected.length}
                </p>
                <p className="mt-1 text-sm text-rose-800">
                  Review patterns before following up
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-sm font-extrabold text-blue-800">
                  Conversion
                </p>
                <p className="mt-2 text-3xl font-black text-blue-950">
                  {analytics.conversionRate}%
                </p>
                <p className="mt-1 text-sm text-blue-800">
                  Accepted from decided quotes
                </p>
              </div>
            </div>

            <Link
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-950 px-5 py-4 font-extrabold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100"
              href="/business/quotes"
            >
              Open AI Quote Builder
            </Link>
          </section>
        </div>

        <section className="mt-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                href: "/business/website",
                title: "Website Builder",
                description:
                  "Improve your website completion, SEO score and publishing readiness.",
              },
              {
                href: "/business/brand-kit",
                title: "Brand Kit",
                description:
                  "Complete your identity details so Beacon can reuse them consistently.",
              },
              {
                href: "/business/templates",
                title: "Documents",
                description:
                  "Create branded business documents using your saved Beacon details.",
              },
            ].map((item) => (
              <Link
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
                href={item.href}
                key={item.href}
              >
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">
                  Related tool
                </p>
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-2 leading-7 text-slate-600">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-blue-200 bg-blue-50 p-7 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-blue-950">
                Analytics grows with your Beacon Business activity
              </h2>
              <p className="mt-2 max-w-4xl leading-7 text-blue-900">
                This dashboard reads the business data stored by your Website
                Builder, Brand Kit and quote tools. More meaningful trends will
                appear as you create quotes, update your website and complete
                your business setup.
              </p>
            </div>

            <Link
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100"
              href="/business/dashboard"
            >
              Return to Dashboard
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}