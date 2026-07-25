import type { Metadata } from "next";

import CustomersClient from "./CustomersClient";

export const metadata: Metadata = {
  title: "Customers | Beacon Business",
  description:
    "Manage customer records, quotes, jobs, documents and activity from one connected Beacon Business workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BusinessCustomersPage() {
  return (
    <main className="bg-slate-50">
      <CustomersClient />
    </main>
  );
}