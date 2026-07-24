import type { Metadata } from "next";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";

import ProjectPortal from "./ProjectPortal";

export const metadata: Metadata = {
  title: "Project Portal | Beacon Business",

  description:
    "Track your Beacon Business website build, upload project assets, send messages and review launch progress.",

  alternates: {
    canonical: "/business/project",
  },

  robots: {
    index: false,
    follow: false,
  },
};

export default function BusinessProjectPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <ProjectPortal />

      <BeaconFooter />
    </main>
  );
}