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

  alternates: {
    canonical: "/",
  },

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
  return (
    <html
      lang={siteConfig.language}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}