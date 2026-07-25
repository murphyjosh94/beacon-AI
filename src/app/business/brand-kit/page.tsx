import type { Metadata } from "next";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import BrandKitClient from "@/components/business/brand-kit/BrandKitClient";

export const metadata: Metadata = {
  title: "Brand Kit | Beacon Business",
  description:
    "Store your business details, logo, colours and branding once and use them across Beacon Business.",
  alternates: {
    canonical: "/business/brand-kit",
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