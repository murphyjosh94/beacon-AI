import type { ReactNode } from "react";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";

import BusinessNavigation from "./BusinessNavigation";

type BusinessLayoutProps = {
  children: ReactNode;
};

export default function BusinessLayout({
  children,
}: BusinessLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <BusinessNavigation />

      <div className="flex-1">{children}</div>

      <BeaconFooter />
    </div>
  );
}