import type { Metadata } from "next";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import BrandKitClient from "@/components/business/brand-kit/BrandKitClient";

export const metadata: Metadata = {
  title: "Brand Kit | Beacon Business",
  description:
    "Create and manage your business identity in one place. Store your logo, colours, company details and branding for use across Beacon Business.",
  alternates: {
    canonical: "/business/brand-kit",
  },
  openGraph: {
    title: "Brand Kit | Beacon Business",
    description:
      "Keep your logo, colours, business details and visual identity consistent across Beacon Business.",
    url: "/business/brand-kit",
    siteName: "Beacon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Kit | Beacon Business",
    description:
      "Manage your business logo, colours and brand identity in one place with Beacon Business.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function BrandKitPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <BrandKitClient />
      <BeaconFooter />
    </main>
  );
}