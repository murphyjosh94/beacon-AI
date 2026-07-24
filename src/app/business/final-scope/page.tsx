import type { Metadata } from "next";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";

import FinalScope from "./FinalScope";

export const metadata: Metadata = {
  title: "Final Scope | Beacon Business",

  description:
    "Review the final Beacon Business website scope, selected package, optional modules and total before payment.",

  alternates: {
    canonical: "/business/final-scope",
  },

  robots: {
    index: false,
    follow: false,
  },
};

export default function FinalScopePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <FinalScope />

      <BeaconFooter />
    </main>
  );
}