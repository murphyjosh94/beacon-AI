import type {
  Metadata,
  Viewport,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import {
  absoluteUrl,
  siteConfig,
} from "@/lib/seo/SiteConfig";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

function serialiseJsonLd(
  value: unknown
): string {
  return JSON.stringify(value).replace(
    /</g,
    "\\u003c"
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),

  title: {
    default:
      "Beacon AI | Personalised Shopping and Travel Recommendations",
    template: "%s | Beacon AI",
  },

  description:
    siteConfig.description,

  applicationName:
    siteConfig.name,

  keywords: [
    ...siteConfig.keywords,
  ],

  authors: [
    {
      name: siteConfig.officialName,
      url: siteConfig.url,
    },
  ],

  creator:
    siteConfig.officialName,

  publisher:
    siteConfig.officialName,

  category:
    "technology",

  referrer:
    "origin-when-cross-origin",

  icons: {
    icon: [
      {
        url: siteConfig.logo,
        type: "image/svg+xml",
      },
    ],

    shortcut:
      siteConfig.logo,

    apple: [
      {
        url: siteConfig.socialImage,
        type: "image/png",
      },
    ],
  },

  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,

    title:
      "Beacon AI | Personalised Shopping and Travel Recommendations",

    description:
      siteConfig.shortDescription,

    images: [
      {
        url: absoluteUrl(
          siteConfig.socialImage
        ),

        width: 1200,
        height: 630,

        alt:
          "Beacon AI logo",

        type:
          "image/png",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Beacon AI | Personalised Recommendations",

    description:
      siteConfig.shortDescription,

    images: [
      absoluteUrl(
        siteConfig.socialImage
      ),
    ],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,

      "max-image-preview":
        "large",

      "max-snippet":
        -1,

      "max-video-preview":
        -1,
    },
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },

  other: {
    "impact-site-verification":
      "7b474d9c-e6d8-448c-b333-b24afe8fcd54",
  },
};

export const viewport: Viewport = {
  width:
    "device-width",

  initialScale:
    1,

  themeColor:
    siteConfig.themeColor,

  colorScheme:
    "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organisationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.officialName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(
        siteConfig.socialImage
      ),
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    publisher: {
      "@id": `${siteConfig.url}/#organization`,
    },
    inLanguage:
      siteConfig.language,
  };

  return (
    <html
      lang={siteConfig.language}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              serialiseJsonLd(
                organisationJsonLd
              ),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              serialiseJsonLd(
                websiteJsonLd
              ),
          }}
        />

        {children}
      </body>
    </html>
  );
}