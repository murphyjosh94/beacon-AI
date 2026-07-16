import type {
  Metadata,
  Viewport,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://beacon-ai.co.uk"
  ),

  title: {
    default: "Beacon AI",
    template: "%s | Beacon AI",
  },

  description:
    "Beacon AI helps you discover and compare products, hotels, getaways, entertainment and useful offers through personalised AI-powered recommendations.",

  applicationName:
    "Beacon AI",

  icons: {
    icon: [
      {
        url: "/images/logo.svg",
        type: "image/svg+xml",
      },
    ],

    shortcut:
      "/images/logo.svg",

    apple:
      "/images/logo.svg",
  },

  openGraph: {
    type: "website",

    url:
      "https://beacon-ai.co.uk",

    siteName:
      "Beacon AI",

    title:
      "Beacon AI",

    description:
      "Personalised AI-powered recommendations for smarter shopping, travel and entertainment choices.",

    images: [
      {
        url:
          "/images/logo.svg",

        alt:
          "Beacon AI lighthouse logo",
      },
    ],
  },

  twitter: {
    card:
      "summary",

    title:
      "Beacon AI",

    description:
      "Personalised AI-powered recommendations for smarter choices.",

    images: [
      "/images/logo.svg",
    ],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width:
    "device-width",

  initialScale: 1,

  themeColor:
    "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta
          name="impact-site-verification"
          content="7b474d9c-e6d8-448c-b333-b24afe8fcd54"
        />
      </head>

      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}