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
  if (!value) return fallback;

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
  if (!value) return "Not yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not yet";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return "Not yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not yet";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readQuotes(): QuoteRecord[] {
  if (typeof window === "undefined") return [];

  for (const key of QUOTES_STORAGE_KEYS) {
    const parsed = safeParse<unknown>(
      window.localStorage.getItem(key),
      [],
    );

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
      href={href}
      className={`${className} hover:-translate-y-1 hover:border-blue-300 hover:shadow-md`}
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

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-700 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
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
    const quoteScore = quotes.length > 0 ? Math.min(100, 40 + quotes.length * 10) : 20;

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
      if (!date) return;

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
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
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
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-10 w-80 rounded-xl bg-slate-200" />
          <div className="mt-4 h-6 w-full max-w-2xl rounded-xl bg-slate-200" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-44 rounded-3xl bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const businessName =
    brandKit.businessName?.trim() || "Your business";

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <Link
              href="/business/dashboard"
              className="font-extrabold text-blue-800 hover:text-blue-950"
            >
              ← Back to Dashboard
            </Link>

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
            href="/business/brand-kit"
            className="inline-flex items-center justify-center rounded-2xl border-2 border-blue-200 bg-blue-50 px-6 py-4 font-extrabold text-blue-950 transition hover:border-blue-400 hover:bg-blue-100"
          >
            Manage Brand Kit
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
                <p className="mt-3 text-6xl font-black tracking-tight">
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
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
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
              Beacon uses your saved website, Brand Kit and quote data to surface
              the next useful action.
            </p>

            <Link
              href={
                analytics.brandScore < 100
                  ? "/business/brand-kit"
                  : analytics.websiteScore < 100
                    ? "/business/website"
                    : "/business/quotes"
              }
              className="mt-6 inline-flex rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900"
            >
              Take recommended action
            </Link>
          </section>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Quotes generated"
            value={String(quotes.length)}
            note={`${analytics.pending.length} currently pending`}
            icon="📄"
            href="/business/quotes"
          />

          <MetricCard
            label="Accepted quotes"
            value={String(analytics.accepted.length)}
            note={`${analytics.conversionRate}% quote conversion`}
            icon="✅"
            href="/business/quotes"
          />

          <MetricCard
            label="Quoted value"
            value={money(analytics.quotedValue)}
            note={`${money(analytics.acceptedValue)} accepted`}
            icon="💷"
            href="/business/quotes"
          />

          <MetricCard
            label="Website completion"
            value={`${analytics.websiteScore}%`}
            note={`${website.pagesGenerated ?? 0} pages generated`}
            icon="🖥️"
            href="/business/website"
          />

          <MetricCard
            label="SEO score"
            value={`${analytics.seoScore}/100`}
            note={`${website.suggestions ?? 0} AI suggestions available`}
            icon="🔎"
            href="/business/website"
          />

          <MetricCard
            label="Brand Kit"
            value={`${analytics.brandScore}%`}
            note={
              analytics.brandScore === 100
                ? "Core business details completed"
                : "Complete missing business details"
            }
            icon="🎨"
            href="/business/brand-kit"
          />

          <MetricCard
            label="Domain"
            value={analytics.domainScore === 100 ? "Connected" : "Not connected"}
            note={website.domain || "Add a domain when the website is ready"}
            icon="🌐"
            href="/business/website/domains"
          />

          <MetricCard
            label="Last published"
            value={formatDate(website.lastPublished)}
            note={
              website.status === "published"
                ? "Website is marked as live"
                : "No live publication recorded"
            }
            icon="🚀"
            href="/business/website"
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
                  Business readiness
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Connected platform health
                </h2>
              </div>
            </div>

            <div className="mt-7 space-y-6">
              <ProgressRow
                label="Website"
                value={analytics.websiteScore}
                detail="Setup, content and publishing readiness"
              />
              <ProgressRow
                label="SEO"
                value={analytics.seoScore}
                detail="Search visibility and content quality"
              />
              <ProgressRow
                label="Brand Kit"
                value={analytics.brandScore}
                detail="Business identity and reusable details"
              />
              <ProgressRow
                label="Domain"
                value={analytics.domainScore}
                detail="Website address and live connection"
              />
              <ProgressRow
                label="Legal readiness"
                value={analytics.legalScore}
                detail="Privacy, cookies, terms and publishing checks"
              />
              <ProgressRow
                label="Quote activity"
                value={analytics.quoteScore}
                detail="Customer quotation and conversion activity"
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
                  key={insight}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
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
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-slate-200 p-5"
                  >
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
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
                <p className="mt-2 leading-7 text-slate-600">
                  Website updates and quote activity will appear here
                  automatically.
                </p>
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
              href="/business/quotes"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-950 px-5 py-4 font-extrabold text-white transition hover:bg-blue-900"
            >
              Open AI Quote Builder
            </Link>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-blue-200 bg-blue-50 p-7 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-blue-950">
                Analytics will grow with Beacon Business
              </h2>
              <p className="mt-2 max-w-4xl leading-7 text-blue-900">
                This dashboard already reads the business data stored by your
                Website Builder, Brand Kit and quote tools. Live visitor,
                enquiry, invoice and payment analytics can be connected when
                those services are added.
              </p>
            </div>

            <Link
              href="/business/dashboard"
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
            >
              Return to Dashboard
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}