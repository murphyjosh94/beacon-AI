import type {
  Metadata,
  Viewport,
} from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";

import AnalyticsProvider from "@/components/AnalyticsProvider";
import CookieConsent from "@/components/CookieConsent";
import PageViewTracker from "@/components/PageViewTracker";
import JsonLd from "@/components/seo/JsonLd";
import {
  absoluteUrl,
  siteConfig,
} from "@/lib/seo/SiteConfig";

const inter = Inter({
  subsets: [
    "latin",
  ],
  display:
    "swap",
  variable:
    "--font-inter",
});

export const metadata: Metadata = {
  metadataBase:
    new URL(
      siteConfig.url
    ),

  title: {
    default:
      siteConfig.name,
    template:
      `%s | ${siteConfig.name}`,
  },

  description:
    siteConfig.description,

  applicationName:
    siteConfig.name,

  generator:
    "Next.js",

  keywords: [
    "AI",
    "Beacon AI",
    "Product recommendations",
    "Travel",
    "Entertainment",
    "Vehicle comparison",
    "AI assistant",
  ],

  authors: [
    {
      name:
        siteConfig.name,
    },
  ],

  creator:
    siteConfig.name,

  publisher:
    siteConfig.name,

  alternates: {
    canonical:
      "/",
  },

  openGraph: {
    type:
      "website",
    locale:
      "en_GB",
    url:
      siteConfig.url,
    siteName:
      siteConfig.name,
    title:
      siteConfig.name,
    description:
      siteConfig.description,
  },

  twitter: {
    card:
      "summary_large_image",
    title:
      siteConfig.name,
    description:
      siteConfig.description,
  },

  robots: {
    index:
      true,
    follow:
      true,

    googleBot: {
      index:
        true,
      follow:
        true,
      "max-image-preview":
        "large",
      "max-video-preview":
        -1,
      "max-snippet":
        -1,
    },
  },

  icons: {
    icon:
      "/favicon.ico",
    shortcut:
      "/favicon.ico",
    apple:
      "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor:
    "#0f172a",
  colorScheme:
    "light",
  width:
    "device-width",
  initialScale:
    1,
};

const websiteSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "WebSite",

  "@id":
    absoluteUrl(
      "/#website"
    ),

  url:
    siteConfig.url,

  name:
    siteConfig.name,

  description:
    siteConfig.description,

  inLanguage:
    siteConfig.language,

  publisher: {
    "@id":
      absoluteUrl(
        "/#organization"
      ),
  },

  potentialAction: {
    "@type":
      "SearchAction",

    target:
      `${siteConfig.url}/search?q={search_term_string}`,

    "query-input":
      "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "Organization",

  "@id":
    absoluteUrl(
      "/#organization"
    ),

  name:
    siteConfig.name,

  url:
    siteConfig.url,

  logo:
    absoluteUrl(
      "/icon-512.png"
    ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
    >
      <head>
        <JsonLd
          data={
            websiteSchema
          }
        />

        <JsonLd
          data={
            organizationSchema
          }
        />

        <meta
          name="format-detection"
          content="telephone=no,address=no,email=no"
        />
      </head>

      <body
        className={`${inter.variable} min-h-screen bg-slate-50 font-sans antialiased`}
      >
        <AnalyticsProvider>
          {children}

          <Suspense
            fallback={
              null
            }
          >
            <PageViewTracker />
          </Suspense>
        </AnalyticsProvider>

        <CookieConsent />
      </body>
    </html>
  );
}