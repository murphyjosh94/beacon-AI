import type { Metadata } from "next";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";

import {
  absoluteUrl,
  siteConfig,
} from "@/lib/seo/SiteConfig";

import WebsiteBriefBuilder from "./WebsiteBriefBuilder";

export const metadata: Metadata = {
  title: "Build Your Business Website | Beacon Business",

  description:
    "Tell Beacon about your business, choose your website package and create a complete website brief before reviewing your interactive preview.",

  alternates: {
    canonical: "/business/website",
  },

  openGraph: {
    type: "website",
    url: absoluteUrl("/business/website"),
    title: "Build Your Website with Beacon Business",
    description:
      "Create your business website brief, choose your package and prepare an interactive preview before paying.",
    images: [
      {
        url: absoluteUrl(siteConfig.socialImage),
        width: 1200,
        height: 630,
        alt: "Beacon Business website brief builder",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Build Your Website with Beacon Business",
    description:
      "Create a complete website brief and prepare your interactive website preview.",
    images: [absoluteUrl(siteConfig.socialImage)],
  },
};

const websiteBuilderSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": absoluteUrl("/business/website#webpage"),
  url: absoluteUrl("/business/website"),
  name: "Beacon Business Website Builder",
  description:
    "A guided business website brief builder for creating an interactive website preview.",
  inLanguage: siteConfig.language,
  isPartOf: {
    "@id": absoluteUrl("/#website"),
  },
  about: {
    "@id": absoluteUrl("/#organization"),
  },
};

export default function BusinessWebsitePage() {
  return (
    <>
      <JsonLd data={websiteBuilderSchema} />

      <main className="min-h-screen bg-slate-50">
        <Navbar />

        <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-20 text-white sm:py-24">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl"
          />

          <div className="relative mx-auto max-w-5xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
              Beacon Business Website Builder
            </p>

            <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-6xl">
              Tell us about your business.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-blue-100">
              Complete your website brief, choose the right package and review
              every detail before your interactive preview is prepared.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-bold text-blue-100">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                Draft saved on this device
              </span>

              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                No payment at this stage
              </span>

              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                Review before submission
              </span>
            </div>
          </div>
        </section>

        <WebsiteBriefBuilder />

        <BeaconFooter />
      </main>
    </>
  );
}