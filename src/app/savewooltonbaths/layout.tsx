import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  HeartHandshake,
  Landmark,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Save Woolton Baths | Community Restoration Campaign",
  description:
    "A community-led campaign to secure and restore the historic Grade II listed Woolton Baths in Liverpool through a Community Asset Transfer.",

  keywords: [
    "Save Woolton Baths",
    "Woolton Baths",
    "Liverpool",
    "Community Asset Transfer",
    "Heritage Restoration",
    "Swimming Pool Restoration",
    "Woolton",
    "South Liverpool",
  ],

  icons: {
    icon: [
      {
        url: "/savewooltonbaths/logo.png",
        type: "image/png",
      },
    ],
    shortcut: "/savewooltonbaths/logo.png",
    apple: "/savewooltonbaths/logo.png",
  },

  openGraph: {
    title: "Save Woolton Baths",
    description:
      "Help bring Woolton Baths back to life through a community-led restoration campaign.",
    type: "website",
    siteName: "Save Woolton Baths",
    images: [
      {
        url: "/savewooltonbaths/logo.png",
        alt: "Save Woolton Baths",
      },
    ],
  },
};

export default function SaveWooltonBathsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#06121D] text-white antialiased">
        <div className="flex min-h-screen flex-col">
          {/* ------------------------------------------------------------ */}
          {/* Top Campaign Banner */}
          {/* ------------------------------------------------------------ */}

          <div className="bg-gradient-to-r from-[#D4AF37] via-[#F5D97B] to-[#D4AF37] text-black">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-center text-sm font-semibold">
              <Landmark className="h-4 w-4 shrink-0" />

              <span>
                Community-led restoration campaign for the historic Grade II
                listed Woolton Baths.
              </span>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Navigation */}
          {/* ------------------------------------------------------------ */}

          <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06121D]/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3">
              <Link
                href="/savewooltonbaths"
                className="group flex min-w-0 items-center gap-4"
                aria-label="Save Woolton Baths home"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-[#0C2235] shadow-lg shadow-black/20 sm:h-20 sm:w-20">
                  <Image
                    src="/savewooltonbaths/logo.png"
                    alt="Save Woolton Baths logo"
                    fill
                    priority
                    sizes="80px"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="hidden min-w-0 sm:block">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] lg:text-xs">
                    Community Campaign
                  </p>

                  <p className="mt-1 text-base font-bold tracking-wide text-white lg:text-lg">
                    Save Woolton Baths
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation */}

              <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                <Link
                  href="/savewooltonbaths"
                  className="transition hover:text-[#D4AF37]"
                >
                  Home
                </Link>

                <Link
                  href="/savewooltonbaths/history"
                  className="transition hover:text-[#D4AF37]"
                >
                  History
                </Link>

                <Link
                  href="/savewooltonbaths/updates"
                  className="transition hover:text-[#D4AF37]"
                >
                  Updates
                </Link>

                <Link
                  href="/savewooltonbaths/partners"
                  className="transition hover:text-[#D4AF37]"
                >
                  Partners
                </Link>

                <Link
                  href="/savewooltonbaths/support"
                  className="transition hover:text-[#D4AF37]"
                >
                  Support Us
                </Link>

                <Link
                  href="/savewooltonbaths/donate"
                  className="transition hover:text-[#D4AF37]"
                >
                  Donate
                </Link>
              </nav>

              <Link
                href="/savewooltonbaths/support"
                className="hidden rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#E5C24F] md:inline-flex"
              >
                Register Support
              </Link>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Mobile Navigation */}
            {/* ------------------------------------------------------------ */}

            <div className="border-t border-white/10 md:hidden">
              <nav className="mx-auto grid max-w-7xl grid-cols-6 text-center text-[10px] font-semibold sm:text-xs">
                <Link
                  href="/savewooltonbaths"
                  className="px-1 py-3 transition hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  Home
                </Link>

                <Link
                  href="/savewooltonbaths/history"
                  className="px-1 py-3 transition hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  History
                </Link>

                <Link
                  href="/savewooltonbaths/updates"
                  className="px-1 py-3 transition hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  Updates
                </Link>

                <Link
                  href="/savewooltonbaths/partners"
                  className="px-1 py-3 transition hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  Partners
                </Link>

                <Link
                  href="/savewooltonbaths/support"
                  className="px-1 py-3 transition hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  Support
                </Link>

                <Link
                  href="/savewooltonbaths/donate"
                  className="px-1 py-3 transition hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  Donate
                </Link>
              </nav>
            </div>
          </header>

          {/* ------------------------------------------------------------ */}
          {/* Main Content */}
          {/* ------------------------------------------------------------ */}

          <main className="flex-1">{children}</main>

          {/* ------------------------------------------------------------ */}
          {/* Beacon Thank You */}
          {/* ------------------------------------------------------------ */}

          <section className="border-t border-[#D4AF37]/20 bg-gradient-to-b from-[#0A1B2B] to-[#06121D]">
            <div className="mx-auto max-w-6xl px-6 py-16">
              <div className="rounded-3xl border border-[#D4AF37]/25 bg-[#08131F] p-8 md:p-10">
                <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
                      <HeartHandshake className="h-4 w-4" />
                      Thank You Beacon AI
                    </div>

                    <h2 className="mb-4 text-3xl font-bold text-white">
                      This website has been built and hosted completely free of
                      charge.
                    </h2>

                    <p className="text-base leading-8 text-slate-300">
                      The Save Woolton Baths campaign would like to sincerely
                      thank{" "}
                      <span className="font-semibold text-[#D4AF37]">
                        Beacon AI
                      </span>{" "}
                      for donating the design, development and ongoing hosting
                      of this website.
                    </p>

                    <p className="mt-5 text-base leading-8 text-slate-300">
                      This means{" "}
                      <span className="font-semibold text-white">
                        no campaign donations or community fundraising money are
                        being spent on building or hosting this website.
                      </span>{" "}
                      Every pound raised can go towards helping restore Woolton
                      Baths.
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href="https://beacon-ai.co.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 px-6 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
                    >
                      Visit Beacon AI
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------------ */}
          {/* Footer */}
          {/* ------------------------------------------------------------ */}

          <footer className="border-t border-white/10 bg-[#040B12]">
            <div className="mx-auto max-w-7xl px-6 py-12">
              <div className="grid gap-10 md:grid-cols-3">
                <div>
                  <div className="mb-5 flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#D4AF37]/30">
                      <Image
                        src="/savewooltonbaths/logo.png"
                        alt="Save Woolton Baths"
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
                        Save Woolton Baths
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-300">
                        Woolton · Liverpool
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold">
                    Bringing Woolton Baths back to life.
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-400">
                    A community-led campaign working to secure Woolton Baths
                    through a Community Asset Transfer and restore it for future
                    generations.
                  </p>
                </div>

                <div>
                  <h4 className="mb-4 font-semibold text-white">
                    Campaign Pages
                  </h4>

                  <ul className="space-y-3 text-sm text-slate-400">
                    <li>
                      <Link
                        href="/savewooltonbaths"
                        className="hover:text-[#D4AF37]"
                      >
                        Our Vision
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/savewooltonbaths/history"
                        className="hover:text-[#D4AF37]"
                      >
                        Our History
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/savewooltonbaths/updates"
                        className="hover:text-[#D4AF37]"
                      >
                        Project Updates
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/savewooltonbaths/partners"
                        className="hover:text-[#D4AF37]"
                      >
                        Supporters & Partners
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/savewooltonbaths/support"
                        className="hover:text-[#D4AF37]"
                      >
                        Register Your Support
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/savewooltonbaths/donate"
                        className="hover:text-[#D4AF37]"
                      >
                        Crowdfunding Campaign
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-4 font-semibold text-white">
                    Community First
                  </h4>

                  <p className="text-sm leading-7 text-slate-400">
                    We believe Woolton Baths belongs at the heart of the
                    community. Every volunteer, sponsor, supplier and supporter
                    helps move this historic building one step closer to
                    reopening.
                  </p>
                </div>
              </div>

              <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 md:flex-row md:items-center">
                <p>
                  © {new Date().getFullYear()} Save Woolton Baths Campaign.
                </p>

                <p className="text-[#D4AF37]">
                  Website designed, built & hosted free of charge by Beacon AI.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}