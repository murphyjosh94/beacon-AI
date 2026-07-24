import type { Metadata } from "next";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";

import PreviewReview from "./PreviewReview";

export const metadata: Metadata = {
  title: "Review Website Preview | Beacon Business",

  description:
    "Review your Beacon Business website preview, request changes or approve the design direction before payment.",

  alternates: {
    canonical: "/business/preview/review",
  },

  robots: {
    index: false,
    follow: false,
  },
};

export default function PreviewReviewPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <PreviewReview />

      <BeaconFooter />
    </main>
  );
}