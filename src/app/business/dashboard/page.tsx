import type { Metadata } from "next";

import JsonLd from "@/components/seo/JsonLd";

import {
  absoluteUrl,
  siteConfig,
} from "@/lib/seo/SiteConfig";

import BusinessDashboard from "./BusinessDashboard";

export const metadata: Metadata = {
  title: "Business Dashboard | Beacon Business",

  description:
    "Review your Beacon Business website brief, selected package, optional modules and project progress from one clear dashboard.",

  alternates: {
    canonical: "/business/dashboard",
  },

  robots: {
    index: false,
    follow: false,
  },

  openGraph: {
    type: "website",
    url: absoluteUrl("/business/dashboard"),
    title: "Beacon Business Dashboard",
    description:
      "Manage your website brief, package, modules and project progress.",
    images: [
      {
        url: absoluteUrl(siteConfig.socialImage),
        width: 1200,
        height: 630,
        alt: "Beacon Business dashboard",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Beacon Business Dashboard",
    description:
      "Manage your Beacon Business website brief and project progress.",
    images: [absoluteUrl(siteConfig.socialImage)],
  },
};

const dashboardSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": absoluteUrl("/business/dashboard#webpage"),
  url: absoluteUrl("/business/dashboard"),
  name: "Beacon Business Dashboard",
  description:
    "A private dashboard for reviewing a Beacon Business website brief and project progress.",
  inLanguage: siteConfig.language,
  isPartOf: {
    "@id": absoluteUrl("/#website"),
  },
  about: {
    "@id": absoluteUrl("/#organization"),
  },
};

export default function BusinessDashboardPage() {
  return (
    <>
      <JsonLd data={dashboardSchema} />
      <BusinessDashboard />
    </>
  );
}