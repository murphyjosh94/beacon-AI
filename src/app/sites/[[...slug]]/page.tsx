import "server-only";

import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GeneratedSeo = {
  title: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
};

type GeneratedCta = {
  label: string;
  href: string;
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
  faq: Array<{
    question: string;
    answer: string;
  }>;
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
  navigation: Array<{
    label: string;
    href: string;
  }>;
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

type PublishedWebsiteRow = {
  id: string;
  domain: string;
  status: string;
  website_version: number;
  website_data: GeneratedWebsite;
  publish_configuration: Record<string, unknown>;
  published_at: string;
  last_published_at: string;
};

type PageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase publishing is not configured. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "beacon-business-public-renderer",
      },
    },
  });
}

function normaliseHost(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");
}

function normalisePath(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return "/";
  }

  return `/${slug
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .join("/")}`;
}

function resolveCanonicalUrl(domain: string, canonicalPath: string) {
  const path = canonicalPath.startsWith("/")
    ? canonicalPath
    : `/${canonicalPath}`;

  return `https://${domain}${path === "/" ? "" : path}`;
}

function isExternalHref(href: string) {
  return (
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

function safeHref(href: string) {
  const value = href.trim();

  if (
    value.startsWith("/") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:")
  ) {
    return value;
  }

  return "/";
}

function buildTextColour(background: string) {
  const hex = background.replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return "#ffffff";
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance =
    (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#111827" : "#ffffff";
}

async function getPublishedWebsite(): Promise<PublishedWebsiteRow | null> {
  const requestHeaders = await headers();

  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "";

  const rewrittenHost =
    requestHeaders.get("x-beacon-site-host") ?? forwardedHost;

  const host = normaliseHost(rewrittenHost);

  if (!host) {
    return null;
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("business_published_websites")
    .select(
      "id, domain, status, website_version, website_data, publish_configuration, published_at, last_published_at",
    )
    .eq("domain", host)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Published website lookup failed", {
      host,
      error,
    });
    return null;
  }

  return (data as PublishedWebsiteRow | null) ?? null;
}

function findGeneratedPage(
  website: GeneratedWebsite,
  path: string,
): GeneratedPage | null {
  const exact = website.pages.find((page) => page.slug === path);

  if (exact) {
    return exact;
  }

  if (path === "/") {
    return (
      website.pages.find((page) => page.pageType === "home") ?? null
    );
  }

  const serviceSlug = path.replace(/^\/services\//, "").replace(/^\/+/, "");

  if (serviceSlug && path.startsWith("/services/")) {
    const service = website.services.find(
      (candidate) => candidate.slug === serviceSlug,
    );

    if (service) {
      return {
        slug: `/services/${service.slug}`,
        navigationLabel: service.name,
        pageType: "service",
        title: service.name,
        introduction: service.shortDescription,
        sections: [
          {
            id: `service-${service.slug}-intro`,
            type: "intro",
            heading: service.name,
            subheading: service.shortDescription,
            body: service.fullDescription,
            bullets: service.benefits,
            primaryCta: {
              label: service.callToAction || "Request a quote",
              href: "/contact",
            },
            secondaryCta: {
              label: "View all services",
              href: "/services",
            },
            imageSuggestion: "",
          },
          {
            id: `service-${service.slug}-jobs`,
            type: "services",
            heading: "Common jobs",
            subheading: "",
            body: "",
            bullets: service.commonJobs,
            primaryCta: {
              label: "Get in touch",
              href: "/contact",
            },
            secondaryCta: {
              label: "",
              href: "",
            },
            imageSuggestion: "",
          },
          {
            id: `service-${service.slug}-process`,
            type: "process",
            heading: "How the service works",
            subheading: "",
            body: "",
            bullets: service.process,
            primaryCta: {
              label: "",
              href: "",
            },
            secondaryCta: {
              label: "",
              href: "",
            },
            imageSuggestion: "",
          },
          {
            id: `service-${service.slug}-faq`,
            type: "faq",
            heading: "Frequently asked questions",
            subheading: "",
            body: "",
            bullets: service.faq.map(
              (item) => `${item.question}|||${item.answer}`,
            ),
            primaryCta: {
              label: "",
              href: "",
            },
            secondaryCta: {
              label: "",
              href: "",
            },
            imageSuggestion: "",
          },
        ],
        seo: service.seo,
      };
    }
  }

  return null;
}

function CtaLink({
  cta,
  primary,
  accentColour,
}: {
  cta: GeneratedCta;
  primary: boolean;
  accentColour: string;
}) {
  if (!cta.label.trim() || !cta.href.trim()) {
    return null;
  }

  const href = safeHref(cta.href);
  const className = primary
    ? "inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4"
    : "inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-4";

  const style = primary
    ? {
        backgroundColor: accentColour,
        color: buildTextColour(accentColour),
        ["--tw-ring-color" as string]: `${accentColour}55`,
      }
    : {
        borderColor: `${accentColour}66`,
        ["--tw-ring-color" as string]: `${accentColour}33`,
      };

  if (isExternalHref(href)) {
    return (
      <a className={className} href={href} style={style}>
        {cta.label}
      </a>
    );
  }

  return (
    <Link className={className} href={href} style={style}>
      {cta.label}
    </Link>
  );
}

function SectionShell({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={muted ? "bg-slate-50" : "bg-white"}>
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        {children}
      </div>
    </section>
  );
}

function SectionHeading({
  heading,
  subheading,
}: {
  heading: string;
  subheading: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {subheading ? (
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
          {subheading}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {heading}
      </h2>
    </div>
  );
}

function HeroSection({
  section,
  website,
}: {
  section: GeneratedSection;
  website: GeneratedWebsite;
}) {
  const primary = website.brand.primaryColour;
  const secondary = website.brand.secondaryColour;
  const accent = website.brand.accentColour;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      }}
    >
      <div className="absolute inset-0 opacity-15">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          {section.subheading ? (
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-white/75">
              {section.subheading}
            </p>
          ) : null}

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {section.heading}
          </h1>

          {section.body ? (
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
              {section.body}
            </p>
          ) : null}

          {section.bullets.length > 0 ? (
            <ul className="mt-8 grid gap-3 text-sm font-bold text-white/90 sm:grid-cols-2">
              {section.bullets.map((bullet) => (
                <li className="flex items-start gap-3" key={bullet}>
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{
                      backgroundColor: accent,
                      color: buildTextColour(accent),
                    }}
                  >
                    ✓
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-9 flex flex-wrap gap-3">
            <CtaLink
              accentColour={accent}
              cta={section.primaryCta}
              primary
            />
            <CtaLink
              accentColour={accent}
              cta={section.secondaryCta}
              primary={false}
            />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl backdrop-blur">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-white/70">
              Local business
            </p>
            <p className="mt-3 text-2xl font-black text-white">
              {website.project.displayName}
            </p>
            <p className="mt-2 text-white/80">
              {website.project.serviceAreaSummary ||
                `Serving ${website.project.location} and surrounding areas.`}
            </p>

            <div className="mt-7 grid gap-3">
              {website.globalContent.phoneDisplay ? (
                <a
                  className="rounded-2xl bg-white px-5 py-4 font-extrabold text-slate-950 transition hover:bg-slate-100"
                  href={`tel:${website.globalContent.phoneDisplay.replace(
                    /[^+\d]/g,
                    "",
                  )}`}
                >
                  Call {website.globalContent.phoneDisplay}
                </a>
              ) : null}

              {website.globalContent.emailDisplay ? (
                <a
                  className="rounded-2xl border border-white/30 px-5 py-4 font-extrabold text-white transition hover:bg-white/10"
                  href={`mailto:${website.globalContent.emailDisplay}`}
                >
                  Email {website.globalContent.emailDisplay}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({
  section,
  website,
}: {
  section: GeneratedSection;
  website: GeneratedWebsite;
}) {
  const services =
    website.services.length > 0
      ? website.services
      : section.bullets.map((bullet, index) => ({
          name: bullet,
          slug: `service-${index + 1}`,
          shortDescription: "",
          fullDescription: "",
          benefits: [],
          commonJobs: [],
          process: [],
          faq: [],
          callToAction: "Request a quote",
          seo: {
            title: bullet,
            description: bullet,
            keywords: [],
            canonicalPath: `/services/service-${index + 1}`,
          },
        }));

  return (
    <SectionShell muted>
      <SectionHeading
        heading={section.heading}
        subheading={section.subheading}
      />

      {section.body ? (
        <p className="mx-auto mt-5 max-w-3xl text-center leading-7 text-slate-600">
          {section.body}
        </p>
      ) : null}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <article
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            key={service.slug}
          >
            <div
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black"
              style={{
                backgroundColor: `${website.brand.accentColour}22`,
                color: website.brand.accentColour,
              }}
            >
              ✓
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-950">
              {service.name}
            </h3>

            {service.shortDescription ? (
              <p className="mt-3 leading-7 text-slate-600">
                {service.shortDescription}
              </p>
            ) : null}

            <Link
              className="mt-6 inline-flex font-extrabold"
              href={`/services/${service.slug}`}
              style={{ color: website.brand.primaryColour }}
            >
              Learn more →
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-10 flex justify-center gap-3">
        <CtaLink
          accentColour={website.brand.accentColour}
          cta={section.primaryCta}
          primary
        />
        <CtaLink
          accentColour={website.brand.accentColour}
          cta={section.secondaryCta}
          primary={false}
        />
      </div>
    </SectionShell>
  );
}

function ProcessSection({
  section,
  website,
}: {
  section: GeneratedSection;
  website: GeneratedWebsite;
}) {
  return (
    <SectionShell>
      <SectionHeading
        heading={section.heading}
        subheading={section.subheading}
      />

      {section.body ? (
        <p className="mx-auto mt-5 max-w-3xl text-center leading-7 text-slate-600">
          {section.body}
        </p>
      ) : null}

      <ol className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
        {section.bullets.map((bullet, index) => (
          <li
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            key={`${bullet}-${index}`}
          >
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full font-black"
              style={{
                backgroundColor: website.brand.accentColour,
                color: buildTextColour(website.brand.accentColour),
              }}
            >
              {index + 1}
            </span>
            <p className="mt-5 font-bold leading-7 text-slate-800">
              {bullet}
            </p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

function FaqSection({
  section,
}: {
  section: GeneratedSection;
}) {
  const items = section.bullets.map((bullet) => {
    const [question, answer] = bullet.split("|||");

    return {
      question: question?.trim() || bullet,
      answer: answer?.trim() || "",
    };
  });

  return (
    <SectionShell muted>
      <SectionHeading
        heading={section.heading}
        subheading={section.subheading}
      />

      {section.body ? (
        <p className="mx-auto mt-5 max-w-3xl text-center leading-7 text-slate-600">
          {section.body}
        </p>
      ) : null}

      <div className="mx-auto mt-10 max-w-3xl space-y-4">
        {items.map((item, index) => (
          <details
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            key={`${item.question}-${index}`}
          >
            <summary className="cursor-pointer list-none pr-8 font-extrabold text-slate-950">
              {item.question}
            </summary>
            {item.answer ? (
              <p className="mt-4 leading-7 text-slate-600">
                {item.answer}
              </p>
            ) : null}
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

function ContactSection({
  section,
  website,
}: {
  section: GeneratedSection;
  website: GeneratedWebsite;
}) {
  return (
    <SectionShell>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
            {section.subheading || "Contact"}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {section.heading}
          </h2>
          {section.body ? (
            <p className="mt-5 leading-7 text-slate-600">
              {section.body}
            </p>
          ) : null}

          <dl className="mt-8 space-y-5">
            {website.globalContent.phoneDisplay ? (
              <div>
                <dt className="text-sm font-extrabold text-slate-500">
                  Telephone
                </dt>
                <dd className="mt-1 font-black text-slate-950">
                  <a
                    href={`tel:${website.globalContent.phoneDisplay.replace(
                      /[^+\d]/g,
                      "",
                    )}`}
                  >
                    {website.globalContent.phoneDisplay}
                  </a>
                </dd>
              </div>
            ) : null}

            {website.globalContent.emailDisplay ? (
              <div>
                <dt className="text-sm font-extrabold text-slate-500">
                  Email
                </dt>
                <dd className="mt-1 break-all font-black text-slate-950">
                  <a href={`mailto:${website.globalContent.emailDisplay}`}>
                    {website.globalContent.emailDisplay}
                  </a>
                </dd>
              </div>
            ) : null}

            {website.globalContent.addressDisplay ? (
              <div>
                <dt className="text-sm font-extrabold text-slate-500">
                  Address
                </dt>
                <dd className="mt-1 font-bold text-slate-700">
                  {website.globalContent.addressDisplay}
                </dd>
              </div>
            ) : null}

            {website.globalContent.openingHoursSummary ? (
              <div>
                <dt className="text-sm font-extrabold text-slate-500">
                  Opening hours
                </dt>
                <dd className="mt-1 font-bold text-slate-700">
                  {website.globalContent.openingHoursSummary}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-8">
          <h3 className="text-2xl font-black text-slate-950">
            Request a quote
          </h3>
          <p className="mt-3 leading-7 text-slate-600">
            Contact {website.project.displayName} directly to discuss your
            requirements.
          </p>

          <div className="mt-7 grid gap-3">
            {website.globalContent.phoneDisplay ? (
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-center font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                href={`tel:${website.globalContent.phoneDisplay.replace(
                  /[^+\d]/g,
                  "",
                )}`}
                style={{
                  backgroundColor: website.brand.accentColour,
                  color: buildTextColour(
                    website.brand.accentColour,
                  ),
                }}
              >
                Call {website.globalContent.phoneDisplay}
              </a>
            ) : null}

            {website.globalContent.emailDisplay ? (
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-center font-extrabold text-slate-800 transition hover:border-slate-400"
                href={`mailto:${website.globalContent.emailDisplay}`}
              >
                Send an email
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function StandardSection({
  section,
  website,
  muted,
}: {
  section: GeneratedSection;
  website: GeneratedWebsite;
  muted: boolean;
}) {
  return (
    <SectionShell muted={muted}>
      <SectionHeading
        heading={section.heading}
        subheading={section.subheading}
      />

      {section.body ? (
        <div className="mx-auto mt-6 max-w-3xl whitespace-pre-line text-center leading-8 text-slate-600">
          {section.body}
        </div>
      ) : null}

      {section.bullets.length > 0 ? (
        <ul className="mx-auto mt-9 grid max-w-4xl gap-4 md:grid-cols-2">
          {section.bullets.map((bullet) => (
            <li
              className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={bullet}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black"
                style={{
                  backgroundColor: `${website.brand.accentColour}22`,
                  color: website.brand.accentColour,
                }}
              >
                ✓
              </span>
              <span className="font-bold leading-7 text-slate-700">
                {bullet}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <CtaLink
          accentColour={website.brand.accentColour}
          cta={section.primaryCta}
          primary
        />
        <CtaLink
          accentColour={website.brand.accentColour}
          cta={section.secondaryCta}
          primary={false}
        />
      </div>
    </SectionShell>
  );
}

function RenderSection({
  section,
  website,
  index,
}: {
  section: GeneratedSection;
  website: GeneratedWebsite;
  index: number;
}) {
  if (section.type === "hero") {
    return (
      <HeroSection
        key={section.id}
        section={section}
        website={website}
      />
    );
  }

  if (section.type === "services") {
    return (
      <ServicesSection
        key={section.id}
        section={section}
        website={website}
      />
    );
  }

  if (section.type === "process") {
    return (
      <ProcessSection
        key={section.id}
        section={section}
        website={website}
      />
    );
  }

  if (section.type === "faq") {
    return <FaqSection key={section.id} section={section} />;
  }

  if (section.type === "contact") {
    return (
      <ContactSection
        key={section.id}
        section={section}
        website={website}
      />
    );
  }

  return (
    <StandardSection
      key={section.id}
      muted={index % 2 === 1}
      section={section}
      website={website}
    />
  );
}

function LegalPage({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:px-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            {title}
          </h1>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="whitespace-pre-line leading-8 text-slate-700">
          {content}
        </div>
      </article>
    </main>
  );
}

function SiteHeader({ website }: { website: GeneratedWebsite }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
        <Link className="min-w-0" href="/">
          <span className="block truncate text-xl font-black text-slate-950">
            {website.project.displayName}
          </span>
          {website.project.tagline ? (
            <span className="block truncate text-xs font-bold text-slate-500">
              {website.project.tagline}
            </span>
          ) : null}
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 lg:flex"
        >
          {website.navigation.map((item) => (
            <Link
              className="text-sm font-extrabold text-slate-700 transition hover:text-slate-950"
              href={safeHref(item.href)}
              key={`${item.label}-${item.href}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {website.globalContent.phoneDisplay ? (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold shadow-sm transition hover:-translate-y-0.5"
            href={`tel:${website.globalContent.phoneDisplay.replace(
              /[^+\d]/g,
              "",
            )}`}
            style={{
              backgroundColor: website.brand.accentColour,
              color: buildTextColour(website.brand.accentColour),
            }}
          >
            Call now
          </a>
        ) : null}
      </div>

      <nav
        aria-label="Mobile navigation"
        className="overflow-x-auto border-t border-slate-100 px-5 py-3 lg:hidden"
      >
        <div className="flex min-w-max gap-5">
          {website.navigation.map((item) => (
            <Link
              className="text-sm font-extrabold text-slate-700"
              href={safeHref(item.href)}
              key={`${item.label}-${item.href}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

function SiteFooter({ website }: { website: GeneratedWebsite }) {
  return (
    <footer
      style={{
        backgroundColor: website.brand.primaryColour,
        color: buildTextColour(website.brand.primaryColour),
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3 lg:px-10">
        <div>
          <p className="text-xl font-black">
            {website.project.displayName}
          </p>
          <p className="mt-4 max-w-sm leading-7 opacity-80">
            {website.globalContent.footerDescription}
          </p>
        </div>

        <div>
          <p className="font-black">Contact</p>
          <div className="mt-4 space-y-2 text-sm font-bold opacity-85">
            {website.globalContent.phoneDisplay ? (
              <p>
                <a
                  href={`tel:${website.globalContent.phoneDisplay.replace(
                    /[^+\d]/g,
                    "",
                  )}`}
                >
                  {website.globalContent.phoneDisplay}
                </a>
              </p>
            ) : null}
            {website.globalContent.emailDisplay ? (
              <p className="break-all">
                <a href={`mailto:${website.globalContent.emailDisplay}`}>
                  {website.globalContent.emailDisplay}
                </a>
              </p>
            ) : null}
            {website.globalContent.addressDisplay ? (
              <p>{website.globalContent.addressDisplay}</p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="font-black">Information</p>
          <div className="mt-4 grid gap-2 text-sm font-bold opacity-85">
            <Link href="/privacy">Privacy notice</Link>
            <Link href="/cookies">Cookie notice</Link>
            <Link href="/terms">Website terms</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs font-bold opacity-75 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>
            © {new Date().getFullYear()}{" "}
            {website.globalContent.copyrightName ||
              website.project.displayName}
            . All rights reserved.
          </p>
          <p>Website powered by Beacon Business.</p>
        </div>
      </div>
    </footer>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const published = await getPublishedWebsite();

  if (!published) {
    return {
      title: "Website unavailable",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const resolvedParams = await params;
  const path = normalisePath(resolvedParams.slug);
  const page = findGeneratedPage(published.website_data, path);

  if (!page) {
    return {
      title: `Page not found | ${published.website_data.project.displayName}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = resolveCanonicalUrl(
    published.domain,
    page.seo.canonicalPath,
  );

  return {
    title: page.seo.title || page.title,
    description: page.seo.description || page.introduction,
    keywords: page.seo.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: published.website_data.project.displayName,
      title: page.seo.title || page.title,
      description: page.seo.description || page.introduction,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PublishedWebsitePage({
  params,
}: PageProps) {
  const published = await getPublishedWebsite();

  if (!published) {
    notFound();
  }

  const resolvedParams = await params;
  const path = normalisePath(resolvedParams.slug);
  const website = published.website_data;
  const page = findGeneratedPage(website, path);

  if (!page) {
    notFound();
  }

  const schema = {
    ...website.localSeo.schema,
    url: `https://${published.domain}`,
    name: website.project.displayName,
  };

  let legalContent: string | null = null;

  if (page.pageType === "privacy") {
    legalContent = website.legal.privacyNotice;
  } else if (page.pageType === "cookies") {
    legalContent = website.legal.cookieNotice;
  } else if (page.pageType === "terms") {
    legalContent = website.legal.websiteTerms;
  }

  return (
    <div
      className="min-h-screen bg-white text-slate-950"
      style={{
        ["--site-primary" as string]: website.brand.primaryColour,
        ["--site-secondary" as string]: website.brand.secondaryColour,
        ["--site-accent" as string]: website.brand.accentColour,
      }}
    >
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />

      <SiteHeader website={website} />

      {legalContent !== null ? (
        <LegalPage content={legalContent} title={page.title} />
      ) : (
        <main>
          {page.sections.length > 0 ? (
            page.sections.map((section, index) => (
              <RenderSection
                index={index}
                key={section.id}
                section={section}
                website={website}
              />
            ))
          ) : (
            <SectionShell>
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-black tracking-tight text-slate-950">
                  {page.title}
                </h1>
                <p className="mt-5 leading-8 text-slate-600">
                  {page.introduction}
                </p>
              </div>
            </SectionShell>
          )}
        </main>
      )}

      <SiteFooter website={website} />
    </div>
  );
}