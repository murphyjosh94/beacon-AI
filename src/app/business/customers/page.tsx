import type { Metadata } from "next";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";

import CustomersClient from "./CustomersClient";

export const metadata: Metadata = {
  title: "Customers | Beacon Business",
  description:
    "Manage customer records, quotes, jobs, invoices, documents and activity from one connected Beacon Business workspace.",
};

export default function BusinessCustomersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <CustomersClient />
      </main>
      <BeaconFooter />
    </>
  );
}