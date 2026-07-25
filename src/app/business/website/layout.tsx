import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Website Builder | Beacon Business",
  description:
    "Build a professional business website with AI. Beacon creates pages, service content, SEO, legal pages and a mobile-friendly structure ready for your review.",
  alternates: {
    canonical: "/business/website",
  },
  openGraph: {
    title: "AI Website Builder | Beacon Business",
    description:
      "Create a professional, mobile-friendly and SEO-ready business website with Beacon AI.",
    url: "/business/website",
    siteName: "Beacon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Website Builder | Beacon Business",
    description:
      "Create a professional, mobile-friendly and SEO-ready business website with Beacon AI.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function BusinessWebsiteLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}