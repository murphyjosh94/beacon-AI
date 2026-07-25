import type { Metadata } from "next";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";
import TemplatesClient from "@/components/business/templates/TemplatesClient";

import { absoluteUrl, siteConfig } from "@/lib/seo/SiteConfig";

export const metadata: Metadata = {
  title: "Beacon Documents | AI Business Templates",
  description:
    "Create professional legal, trade, customer, marketing, HR and branding documents using your saved Beacon Business details and practical AI assistance.",
  alternates: {
    canonical: "/business/templates",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/business/templates"),
    title: "Beacon Documents | Professional Business Documents with AI",
    description:
      "Create, edit and manage professional business documents from one connected Beacon Business workspace.",
    images: [
      {
        url: absoluteUrl(siteConfig.socialImage),
        width: 1200,
        height: 630,
        alt: "Beacon Documents business template platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beacon Documents | Professional Business Documents with AI",
    description:
      "Create legal, trade, customer, marketing, HR and branded business documents in one place.",
    images: [absoluteUrl(siteConfig.socialImage)],
  },
};

const documentsSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Beacon Documents",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: absoluteUrl("/business/templates"),
  description:
    "An AI-assisted business document workspace for creating legal, trade, customer, marketing, HR and branded documents.",
  isPartOf: {
    "@id": absoluteUrl("/business#webpage"),
  },
};

export default function BusinessTemplatesPage() {
  return (
    <>
      <JsonLd data={documentsSchema} />

      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <TemplatesClient />
        <BeaconFooter />
      </main>
    </>
  );
}