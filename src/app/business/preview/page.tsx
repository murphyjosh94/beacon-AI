import type { Metadata } from "next";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";

import WebsitePreview from "./WebsitePreview";

export const metadata: Metadata = {
  title: "Website Preview | Beacon Business",

  description:
    "Review the interactive website preview created from your Beacon Business website brief.",

  alternates: {
    canonical: "/business/preview",
  },

  robots: {
    index: false,
    follow: false,
  },
};

export default function BusinessPreviewPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <WebsitePreview />

      <BeaconFooter />
    </main>
  );
}