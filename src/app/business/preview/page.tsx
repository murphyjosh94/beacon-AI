"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PreviewMode = "desktop" | "tablet" | "mobile";

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

const GENERATED_WEBSITE_STORAGE_KEY =
  "beacon-business-generated-website";

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
      candidate.quality,
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

function formatGeneratedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently generated";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalisePath(value: string) {
  if (!value) {
    return "/";
  }

  if (value.startsWith("tel:") || value.startsWith("mailto:")) {
    return value;
  }

  return value.startsWith("/") ? value : `/${value}`;
}

function pageMatchesPath(page: GeneratedPage, path: string) {
  const normalisedPageSlug = normalisePath(page.slug);
  const normalisedPath = normalisePath(path);

  return normalisedPageSlug === normalisedPath;
}

function getPreviewWidth(mode: PreviewMode) {
  if (mode === "mobile") {
    return "390px";
  }

  if (mode === "tablet") {
    return "820px";
  }

  return "1280px";
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

function SectionWrapper({
  children,
  muted = false,
  accent = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <section
      className={`px-5 py-12 sm:px-8 lg:px-12 ${
        accent
          ? "text-white"
          : muted
            ? "bg-slate-50 text-slate-950"
            : "bg-white text-slate-950"
      }`}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function WebsiteButton({
  cta,
  primaryColour,
  secondary = false,
  onNavigate,
}: {
  cta: GeneratedCta;
  primaryColour: string;
  secondary?: boolean;
  onNavigate: (href: string) => void;
}) {
  if (!cta.label) {
    return null;
  }

  const externalAction =
    cta.href.startsWith("tel:") || cta.href.startsWith("mailto:");

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-extrabold transition ${
        secondary
          ? "border-2 border-current bg-transparent"
          : "text-white shadow-sm"
      }`}
      onClick={() => {
        if (externalAction) {
          window.location.href = cta.href;
          return;
        }

        onNavigate(cta.href);
      }}
      style={
        secondary
          ? { color: primaryColour }
          : { backgroundColor: primaryColour }
      }
      type="button"
    >
      {cta.label}
    </button>
  );
}

function HeroSection({
  section,
  website,
  onNavigate,
}: {
  section: GeneratedSection;
  website: GeneratedWebsite;
  onNavigate: (href: string) => void;
}) {
  return (
    <section
      className="relative overflow-hidden px-5 py-16 text-white sm:px-8 lg:px-12 lg:py-24"
      style={{ backgroundColor: website.brand.primaryColour }}
    >
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full"
          style={{ backgroundColor: website.brand.secondaryColour }}
        />
        <div
          className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full"
          style={{ backgroundColor: website.brand.secondaryColour }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div>
          <span
            className="inline-flex rounded-full px-4 py-2 text-sm font-extrabold text-slate-950"
            style={{ backgroundColor: website.brand.secondaryColour }}
          >
            {website.project.trade} in {website.project.location}
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            {section.heading}
          </h1>

          {section.subheading ? (
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/90">
              {section.subheading}
            </p>
          ) : null}

          {section.body ? (
            <p className="mt-5 max-w-3xl leading-8 text-white/80">
              {section.body}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <WebsiteButton
              cta={section.primaryCta}
              onNavigate={onNavigate}
              primaryColour={website.brand.secondaryColour}
            />

            <WebsiteButton
              cta={section.secondaryCta}
              onNavigate={onNavigate}
              primaryColour="#ffffff"
              secondary
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-7 backdrop-blur-sm">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-white/70">
            Why choose us
          </p>

          <div className="mt-5 space-y-4">
            {(section.bullets.length
              ? section.bullets
              : [
                  website.globalContent.guaranteeMessage,
                  website.globalContent.accreditationSummary,
                  website.project.serviceAreaSummary,
                ].filter(Boolean)
            ).map((item) => (
              <div className="flex gap-3" key={item}>
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black text-slate-950"
                  style={{
                    backgroundColor: website.brand.secondaryColour,
                  }}
                >
                  ✓
                </span>
                <p className="leading-7 text-white/90">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({
  section,
  website,
  onNavigate,
}: {
  section: GeneratedSection;
  website: GeneratedWebsite;
  onNavigate: (href: string) => void;
}) {
  return (
    <SectionWrapper muted>
      <div className="text-center">
        <p
          className="text-sm font-extrabold uppercase tracking-[0.18em]"
          style={{ color: website.brand.primaryColour }}
        >
          Our services
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          {section.heading}
        </h2>
        {section.subheading ? (
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">
            {section.subheading}
          </p>
        ) : null}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {website.services.map((service) => (
          <article
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            key={service.slug}
          >
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-white"
              style={{ backgroundColor: website.brand.primaryColour }}
            >
              {service.name.slice(0, 1).toUpperCase()}
            </span>

            <h3 className="mt-5 text-xl font-black text-slate-950">
              {service.name}
            </h3>

            <p className="mt-3 leading-7 text-slate-600">
              {service.shortDescription}
            </p>

            <button
              className="mt-5 font-extrabold"
              onClick={() => onNavigate(`/services/${service.slug}`)}
              style={{ color: website.brand.primaryColour }}
              type="button"
            >
              View service →
            </button>
          </article>
        ))}
      </div>
    </SectionWrapper>
  );
}

function GenericSection({
  section,
  website,
  index,
  onNavigate,
}: {
  section: GeneratedSection;
  website: GeneratedWebsite;
  index: number;
  onNavigate: (href: string) => void;
}) {
  const muted = index % 2 === 1;

  if (section.type === "hero") {
    return (
      <HeroSection
        onNavigate={onNavigate}
        section={section}
        website={website}
      />
    );
  }

  if (section.type === "services") {
    return (
      <ServicesSection
        onNavigate={onNavigate}
        section={section}
        website={website}
      />
    );
  }

  if (section.type === "cta") {
    return (
      <section
        className="px-5 py-14 text-white sm:px-8 lg:px-12"
        style={{ backgroundColor: website.brand.primaryColour }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              {section.heading}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-white/85">
              {section.body || section.subheading}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <WebsiteButton
              cta={section.primaryCta}
              onNavigate={onNavigate}
              primaryColour={website.brand.secondaryColour}
            />
            <WebsiteButton
              cta={section.secondaryCta}
              onNavigate={onNavigate}
              primaryColour="#ffffff"
              secondary
            />
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "gallery") {
    const imagePlan = website.imagePlan.slice(0, 6);

    return (
      <SectionWrapper muted={muted}>
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            {section.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">
            {section.subheading || section.body}
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(imagePlan.length
            ? imagePlan
            : Array.from({ length: 6 }, (_, item) => ({
                filename: `Project image ${item + 1}`,
                suggestedUse: "Completed work",
                altText: "Business project photograph placeholder",
              }))
          ).map((image, imageIndex) => (
            <div
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              key={`${image.filename}-${imageIndex}`}
            >
              <div
                className="flex h-52 items-center justify-center px-6 text-center"
                style={{
                  background: `linear-gradient(135deg, ${website.brand.primaryColour}18, ${website.brand.secondaryColour}55)`,
                }}
              >
                <div>
                  <span className="text-4xl" aria-hidden="true">
                    📷
                  </span>
                  <p className="mt-3 font-extrabold text-slate-700">
                    {image.filename}
                  </p>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm leading-6 text-slate-600">
                  {image.suggestedUse}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    );
  }

  if (section.type === "faq") {
    const faqItems = website.services.flatMap((service) =>
      service.faq.map((item) => ({
        ...item,
        service: service.name,
      })),
    );

    return (
      <SectionWrapper muted={muted}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">
            {section.heading}
          </h2>

          <div className="mt-10 space-y-4">
            {faqItems.slice(0, 8).map((item, faqIndex) => (
              <details
                className="group rounded-2xl border border-slate-200 bg-white p-5"
                key={`${item.question}-${faqIndex}`}
              >
                <summary className="cursor-pointer list-none font-black text-slate-950">
                  {item.question}
                </summary>
                <p className="mt-4 leading-7 text-slate-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </SectionWrapper>
    );
  }

  if (section.type === "contact") {
    return (
      <SectionWrapper muted={muted}>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p
              className="text-sm font-extrabold uppercase tracking-[0.18em]"
              style={{ color: website.brand.primaryColour }}
            >
              Contact us
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              {section.heading}
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              {section.body || section.subheading}
            </p>

            <div className="mt-7 space-y-3 text-slate-700">
              <p>
                <strong>Phone:</strong>{" "}
                {website.globalContent.phoneDisplay}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {website.globalContent.emailDisplay}
              </p>
              {website.globalContent.addressDisplay ? (
                <p>
                  <strong>Address:</strong>{" "}
                  {website.globalContent.addressDisplay}
                </p>
              ) : null}
              {website.globalContent.openingHoursSummary ? (
                <p>
                  <strong>Hours:</strong>{" "}
                  {website.globalContent.openingHoursSummary}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Name"
                readOnly
              />
              <input
                className="rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Phone"
                readOnly
              />
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 sm:col-span-2"
                placeholder="Email"
                readOnly
              />
              <textarea
                className="min-h-32 rounded-xl border border-slate-300 px-4 py-3 sm:col-span-2"
                placeholder="How can we help?"
                readOnly
              />
            </div>

            <button
              className="mt-4 w-full rounded-xl px-5 py-3 font-extrabold text-white"
              style={{ backgroundColor: website.brand.primaryColour }}
              type="button"
            >
              Send enquiry
            </button>
          </div>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper muted={muted}>
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <div>
          <p
            className="text-sm font-extrabold uppercase tracking-[0.18em]"
            style={{ color: website.brand.primaryColour }}
          >
            {section.type}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {section.heading}
          </h2>

          {section.subheading ? (
            <p className="mt-4 text-lg leading-8 text-slate-700">
              {section.subheading}
            </p>
          ) : null}

          {section.body ? (
            <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
              {section.body}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <WebsiteButton
              cta={section.primaryCta}
              onNavigate={onNavigate}
              primaryColour={website.brand.primaryColour}
            />
            <WebsiteButton
              cta={section.secondaryCta}
              onNavigate={onNavigate}
              primaryColour={website.brand.primaryColour}
              secondary
            />
          </div>
        </div>

        {section.bullets.length ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {section.bullets.map((bullet) => (
                <div className="flex gap-3" key={bullet}>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{
                      backgroundColor: website.brand.primaryColour,
                    }}
                  >
                    ✓
                  </span>
                  <p className="leading-7 text-slate-700">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex min-h-64 items-center justify-center rounded-3xl px-8 text-center"
            style={{
              background: `linear-gradient(135deg, ${website.brand.primaryColour}18, ${website.brand.secondaryColour}45)`,
            }}
          >
            <div>
              <span className="text-5xl" aria-hidden="true">
                ✨
              </span>
              <p className="mt-4 font-extrabold text-slate-700">
                {section.imageSuggestion ||
                  "Relevant business image or completed project"}
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

function LegalPage({
  page,
  website,
}: {
  page: GeneratedPage;
  website: GeneratedWebsite;
}) {
  let content = page.introduction;

  if (page.pageType === "privacy") {
    content = website.legal.privacyNotice;
  }

  if (page.pageType === "cookies") {
    content = website.legal.cookieNotice;
  }

  if (page.pageType === "terms") {
    content = website.legal.websiteTerms;
  }

  return (
    <SectionWrapper>
      <div className="mx-auto max-w-4xl">
        <p
          className="text-sm font-extrabold uppercase tracking-[0.18em]"
          style={{ color: website.brand.primaryColour }}
        >
          Legal information
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          {page.title}
        </h1>

        <div className="mt-8 whitespace-pre-line leading-8 text-slate-700">
          {content}
        </div>
      </div>
    </SectionWrapper>
  );
}

function ServicePage({
  service,
  website,
  onNavigate,
}: {
  service: GeneratedService;
  website: GeneratedWebsite;
  onNavigate: (href: string) => void;
}) {
  return (
    <>
      <section
        className="px-5 py-16 text-white sm:px-8 lg:px-12"
        style={{ backgroundColor: website.brand.primaryColour }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-white/70">
            {website.project.displayName}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            {service.name}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/85">
            {service.shortDescription}
          </p>
        </div>
      </section>

      <SectionWrapper>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              About this service
            </h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
              {service.fullDescription}
            </p>

            <h3 className="mt-9 text-2xl font-black">
              Common jobs
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {service.commonJobs.map((item) => (
                <li
                  className="flex gap-3 rounded-2xl bg-slate-50 p-4"
                  key={item}
                >
                  <span
                    aria-hidden="true"
                    style={{ color: website.brand.primaryColour }}
                  >
                    ✓
                  </span>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-xl font-black">Benefits</h3>
            <div className="mt-5 space-y-4">
              {service.benefits.map((benefit) => (
                <div className="flex gap-3" key={benefit}>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{
                      backgroundColor: website.brand.primaryColour,
                    }}
                  >
                    ✓
                  </span>
                  <p className="leading-7 text-slate-700">{benefit}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </SectionWrapper>

      <SectionWrapper muted>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-black tracking-tight">
            How it works
          </h2>

          <div className="mt-8 grid gap-4">
            {service.process.map((step, index) => (
              <div
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                key={step}
              >
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black text-white"
                  style={{
                    backgroundColor: website.brand.primaryColour,
                  }}
                >
                  {index + 1}
                </span>
                <p className="leading-7 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-black tracking-tight">
            Frequently asked questions
          </h2>

          <div className="mt-8 space-y-4">
            {service.faq.map((item) => (
              <details
                className="rounded-2xl border border-slate-200 bg-white p-5"
                key={item.question}
              >
                <summary className="cursor-pointer font-black text-slate-950">
                  {item.question}
                </summary>
                <p className="mt-4 leading-7 text-slate-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <section
        className="px-5 py-14 text-white sm:px-8 lg:px-12"
        style={{ backgroundColor: website.brand.primaryColour }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-black">
              Ready to discuss {service.name.toLowerCase()}?
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-white/85">
              {service.callToAction}
            </p>
          </div>

          <button
            className="rounded-xl px-5 py-3 font-extrabold text-slate-950"
            onClick={() => onNavigate("/contact")}
            style={{ backgroundColor: website.brand.secondaryColour }}
            type="button"
          >
            Request a quote
          </button>
        </div>
      </section>
    </>
  );
}

function WebsiteShell({
  website,
  page,
  previewMode,
  onNavigate,
}: {
  website: GeneratedWebsite;
  page: GeneratedPage | null;
  previewMode: PreviewMode;
  onNavigate: (href: string) => void;
}) {
  const serviceSlug =
    page?.pageType === "service"
      ? page.slug.replace(/^\/?services\//, "")
      : "";

  const selectedService = website.services.find(
    (service) => service.slug === serviceSlug,
  );

  return (
    <div
      className="overflow-hidden rounded-[28px] border border-slate-300 bg-white shadow-2xl"
      style={{
        width: getPreviewWidth(previewMode),
        maxWidth: "100%",
      }}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />

        <div className="ml-3 flex-1 rounded-lg bg-white px-4 py-2 text-center text-xs font-semibold text-slate-500">
          {website.project.preferredDomain ||
            `${website.project.displayName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")}.co.uk`}
          {page?.slug === "/" ? "" : page?.slug}
        </div>
      </div>

      <div
        className="max-h-[76vh] overflow-y-auto"
        style={{ backgroundColor: website.brand.accentColour }}
      >
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
            <button
              className="text-left"
              onClick={() => onNavigate("/")}
              type="button"
            >
              <p
                className="text-xl font-black"
                style={{ color: website.brand.primaryColour }}
              >
                {website.project.displayName}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {website.project.tagline}
              </p>
            </button>

            {previewMode === "mobile" ? (
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-extrabold text-slate-700"
                type="button"
              >
                Menu
              </button>
            ) : (
              <nav className="flex items-center gap-5">
                {website.navigation.slice(0, previewMode === "tablet" ? 5 : 7).map(
                  (item) => (
                    <button
                      className="text-sm font-extrabold text-slate-700 transition hover:text-slate-950"
                      key={`${item.label}-${item.href}`}
                      onClick={() => onNavigate(item.href)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ),
                )}

                <button
                  className="rounded-xl px-4 py-2 text-sm font-extrabold text-white"
                  onClick={() => onNavigate("/contact")}
                  style={{ backgroundColor: website.brand.primaryColour }}
                  type="button"
                >
                  Get a quote
                </button>
              </nav>
            )}
          </div>
        </header>

        {selectedService ? (
          <ServicePage
            onNavigate={onNavigate}
            service={selectedService}
            website={website}
          />
        ) : page ? (
          page.pageType === "privacy" ||
          page.pageType === "cookies" ||
          page.pageType === "terms" ? (
            <LegalPage page={page} website={website} />
          ) : (
            <>
              {page.sections.map((section, index) => (
                <GenericSection
                  index={index}
                  key={`${section.id}-${index}`}
                  onNavigate={onNavigate}
                  section={section}
                  website={website}
                />
              ))}
            </>
          )
        ) : (
          <SectionWrapper>
            <div className="py-20 text-center">
              <h1 className="text-4xl font-black text-slate-950">
                Page not found
              </h1>
              <p className="mt-4 text-slate-600">
                This generated page is not available.
              </p>
              <button
                className="mt-6 rounded-xl px-5 py-3 font-extrabold text-white"
                onClick={() => onNavigate("/")}
                style={{ backgroundColor: website.brand.primaryColour }}
                type="button"
              >
                Return home
              </button>
            </div>
          </SectionWrapper>
        )}

        <footer
          className="px-5 py-10 text-white sm:px-8 lg:px-12"
          style={{ backgroundColor: website.brand.primaryColour }}
        >
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            <div>
              <p className="text-xl font-black">
                {website.project.displayName}
              </p>
              <p className="mt-3 leading-7 text-white/75">
                {website.globalContent.footerDescription}
              </p>
            </div>

            <div>
              <p className="font-black">Contact</p>
              <div className="mt-3 space-y-2 text-white/75">
                <p>{website.globalContent.phoneDisplay}</p>
                <p>{website.globalContent.emailDisplay}</p>
                {website.globalContent.addressDisplay ? (
                  <p>{website.globalContent.addressDisplay}</p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="font-black">Information</p>
              <div className="mt-3 flex flex-col gap-2">
                {[
                  { label: "Privacy", href: "/privacy" },
                  { label: "Cookies", href: "/cookies" },
                  { label: "Terms", href: "/terms" },
                ].map((item) => (
                  <button
                    className="w-fit text-left text-white/75 hover:text-white"
                    key={item.href}
                    onClick={() => onNavigate(item.href)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-6xl border-t border-white/20 pt-6 text-sm text-white/60">
            © {new Date().getFullYear()}{" "}
            {website.globalContent.copyrightName}. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function BusinessWebsitePreviewPage() {
  const [website, setWebsite] = useState<GeneratedWebsite | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [previewMode, setPreviewMode] =
    useState<PreviewMode>("desktop");
  const [selectedPath, setSelectedPath] = useState("/");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = readGeneratedWebsite();
    setWebsite(stored);

    if (stored?.pages.length) {
      const home =
        stored.pages.find((page) => page.pageType === "home") ??
        stored.pages[0];
      setSelectedPath(normalisePath(home.slug));
    }

    setLoaded(true);
  }, []);

  const selectedPage = useMemo(() => {
    if (!website) {
      return null;
    }

    const normalised = normalisePath(selectedPath);

    const directPage = website.pages.find((page) =>
      pageMatchesPath(page, normalised),
    );

    if (directPage) {
      return directPage;
    }

    if (normalised.startsWith("/services/")) {
      const serviceSlug = normalised.replace("/services/", "");
      const service = website.services.find(
        (item) => item.slug === serviceSlug,
      );

      if (service) {
        return {
          slug: `/services/${service.slug}`,
          navigationLabel: service.name,
          pageType: "service",
          title: service.name,
          introduction: service.shortDescription,
          sections: [],
          seo: service.seo,
        } satisfies GeneratedPage;
      }
    }

    return website.pages.find((page) => page.pageType === "home") ?? null;
  }, [selectedPath, website]);

  function navigatePreview(href: string) {
    if (href.startsWith("tel:") || href.startsWith("mailto:")) {
      window.location.href = href;
      return;
    }

    setSelectedPath(normalisePath(href));
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
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
            🖥️
          </span>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
            No generated website found
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Complete the Website Setup Wizard and generate the website before
            opening the preview.
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
              Open Website Setup
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const allPages = [
    ...website.pages,
    ...website.services.map(
      (service) =>
        ({
          slug: `/services/${service.slug}`,
          navigationLabel: service.name,
          pageType: "service",
          title: service.name,
          introduction: service.shortDescription,
          sections: [],
          seo: service.seo,
        }) satisfies GeneratedPage,
    ),
  ];

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <Link
                className="text-sm font-extrabold text-blue-800 hover:text-blue-950"
                href="/business/website"
              >
                ← Website dashboard
              </Link>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Website Preview
              </h1>

              <p className="mt-2 text-slate-600">
                Generated {formatGeneratedDate(website.project.generatedAt)}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
                onClick={() => setSidebarOpen((current) => !current)}
                type="button"
              >
                {sidebarOpen ? "Hide Pages" : "Show Pages"}
              </button>

              <Link
                className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
                href="/business/project"
              >
                Edit Setup
              </Link>

              <Link
                className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900"
                href="/business/preview/review"
              >
                Review & Approve
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(
                [
                  ["desktop", "Desktop", "🖥️"],
                  ["tablet", "Tablet", "▣"],
                  ["mobile", "Mobile", "📱"],
                ] as const
              ).map(([mode, label, icon]) => (
                <button
                  className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                    previewMode === mode
                      ? "bg-blue-950 text-white shadow-sm"
                      : "text-slate-700 hover:bg-white"
                  }`}
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  type="button"
                >
                  <span aria-hidden="true">{icon}</span> {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`rounded-full px-4 py-2 text-sm font-extrabold ${scoreClasses(
                  website.quality.seoScore,
                )}`}
              >
                SEO {website.quality.seoScore}/100
              </span>
              <span
                className={`rounded-full px-4 py-2 text-sm font-extrabold ${scoreClasses(
                  website.quality.accessibilityScore,
                )}`}
              >
                Accessibility {website.quality.accessibilityScore}/100
              </span>
              <span
                className={`rounded-full px-4 py-2 text-sm font-extrabold ${scoreClasses(
                  website.quality.completenessScore,
                )}`}
              >
                Complete {website.quality.completenessScore}/100
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={`grid gap-6 ${
            sidebarOpen
              ? "xl:grid-cols-[300px_minmax(0,1fr)]"
              : "grid-cols-1"
          }`}
        >
          {sidebarOpen ? (
            <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6 xl:self-start">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-black text-slate-950">
                  Generated pages
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">
                  {allPages.length}
                </span>
              </div>

              <div className="mt-5 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {allPages.map((page) => {
                  const active =
                    normalisePath(page.slug) ===
                    normalisePath(selectedPath);

                  return (
                    <button
                      className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                        active
                          ? "bg-blue-950 text-white"
                          : "bg-slate-50 text-slate-800 hover:bg-slate-100"
                      }`}
                      key={`${page.pageType}-${page.slug}`}
                      onClick={() =>
                        setSelectedPath(normalisePath(page.slug))
                      }
                      type="button"
                    >
                      <span className="block font-extrabold">
                        {page.navigationLabel || page.title}
                      </span>
                      <span
                        className={`mt-1 block text-xs ${
                          active ? "text-blue-100" : "text-slate-500"
                        }`}
                      >
                        {page.pageType}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="font-black text-slate-950">
                  Page SEO
                </h3>

                <p className="mt-3 text-sm font-bold text-slate-700">
                  {selectedPage?.seo.title}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {selectedPage?.seo.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedPage?.seo.keywords.slice(0, 5).map((keyword) => (
                    <span
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800"
                      key={keyword}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}

          <div className="min-w-0">
            <div className="flex justify-center overflow-x-auto rounded-3xl border border-slate-200 bg-slate-200/70 p-4 sm:p-6 lg:p-8">
              <WebsiteShell
                onNavigate={navigatePreview}
                page={selectedPage}
                previewMode={previewMode}
                website={website}
              />
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Strengths
            </h2>
            <div className="mt-4 space-y-3">
              {website.quality.strengths.map((item) => (
                <p className="flex gap-3 leading-7 text-slate-700" key={item}>
                  <span className="font-black text-emerald-700">✓</span>
                  {item}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Improvements
            </h2>
            <div className="mt-4 space-y-3">
              {website.quality.improvements.length ? (
                website.quality.improvements.map((item) => (
                  <p
                    className="flex gap-3 leading-7 text-slate-700"
                    key={item}
                  >
                    <span className="font-black text-amber-700">!</span>
                    {item}
                  </p>
                ))
              ) : (
                <p className="leading-7 text-slate-600">
                  No immediate improvements were identified.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Owner checks
            </h2>
            <div className="mt-4 space-y-3">
              {website.quality.ownerChecks.map((item) => (
                <p className="flex gap-3 leading-7 text-slate-700" key={item}>
                  <span className="font-black text-blue-800">•</span>
                  {item}
                </p>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <h2 className="text-xl font-black text-amber-950">
            Preview only
          </h2>
          <p className="mt-2 max-w-5xl leading-7 text-amber-900">
            This website has not been published. Review all business claims,
            contact details, legal drafts, service information and images before
            approving it. Beacon will not make the website live without owner
            approval.
          </p>
        </section>
      </section>
    </main>
  );
}