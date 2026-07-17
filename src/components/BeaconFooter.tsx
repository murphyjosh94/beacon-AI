import Link from "next/link";

import {
  siteConfig,
} from "@/lib/seo/SiteConfig";

const primaryLinks = [
  {
    href:
      "/",
    label:
      "Home",
  },
  {
    href:
      "/search",
    label:
      "Search",
  },
  {
    href:
      "/categories",
    label:
      "Categories",
  },
  {
    href:
      "/beacon-plus",
    label:
      "Beacon+",
  },
] as const;

const categoryLinks = [
  {
    href:
      "/categories/products",
    label:
      "Products",
  },
  {
    href:
      "/categories/travel",
    label:
      "Travel",
  },
  {
    href:
      "/categories/entertainment",
    label:
      "Entertainment",
  },
  {
    href:
      "/categories/vehicles",
    label:
      "Vehicles",
  },
] as const;

const legalLinks = [
  {
    href:
      "/privacy",
    label:
      "Privacy Policy",
  },
  {
    href:
      "/terms",
    label:
      "Terms and Conditions",
  },
  {
    href:
      "/cookies",
    label:
      "Cookie Policy",
  },
  {
    href:
      "/affiliate-disclosure",
    label:
      "Affiliate Disclosure",
  },
  {
    href:
      "/refunds",
    label:
      "Cancellation and Refund Policy",
  },
] as const;

const footerLinkClassName =
  "inline-flex rounded-md text-sm font-semibold leading-6 text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950";

type FooterLinkGroupProps = {
  title: string;
  ariaLabel: string;
  links: ReadonlyArray<{
    href: string;
    label: string;
  }>;
};

function FooterLinkGroup({
  title,
  ariaLabel,
  links,
}: FooterLinkGroupProps) {
  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
        {title}
      </h2>

      <nav
        aria-label={
          ariaLabel
        }
        className="mt-5"
      >
        <ul className="space-y-3">
          {links.map(
            (
              link
            ) => (
              <li
                key={
                  link.href
                }
              >
                <Link
                  href={
                    link.href
                  }
                  className={
                    footerLinkClassName
                  }
                >
                  {
                    link.label
                  }
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>
    </div>
  );
}

export default function BeaconFooter() {
  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr] lg:gap-16">
          <div>
            <Link
              href="/"
              aria-label="Beacon-AI home"
              className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950"
            >
              <span className="text-2xl font-black tracking-tight text-white">
                Beacon
                <span className="text-blue-400">
                  -AI
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Beacon-AI helps people research and compare products,
              travel, entertainment, vehicles and other options using
              AI-assisted recommendations.
            </p>

            <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
              Recommendations are provided for general research and
              comparison purposes. Always verify current prices,
              availability, terms and suitability with the relevant
              provider before making a decision.
            </p>

            <Link
              href="/beacon-plus"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950"
            >
              Explore Beacon+
            </Link>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <FooterLinkGroup
              title="Explore"
              ariaLabel="Footer main navigation"
              links={
                primaryLinks
              }
            />

            <FooterLinkGroup
              title="Categories"
              ariaLabel="Footer category navigation"
              links={
                categoryLinks
              }
            />

            <FooterLinkGroup
              title="Legal"
              ariaLabel="Footer legal navigation"
              links={
                legalLinks
              }
            />
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h2 className="text-sm font-black text-white">
            Affiliate disclosure
          </h2>

          <p className="mt-2 max-w-5xl text-sm leading-7 text-slate-300">
            Some links on Beacon-AI are affiliate links. We may earn
            a commission when you follow one of these links and
            complete an eligible purchase, booking or registration.
            This will not normally increase the price you pay.
          </p>

          <Link
            href="/affiliate-disclosure"
            className="mt-3 inline-flex rounded-md text-sm font-bold text-blue-300 underline decoration-blue-500 underline-offset-4 transition hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900"
          >
            Read the full affiliate disclosure
          </Link>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-slate-800 pt-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            ©{" "}
            {
              currentYear
            }{" "}
            Beacon-AI. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <Link
              href="/privacy"
              className={
                footerLinkClassName
              }
            >
              Privacy
            </Link>

            <Link
              href="/cookies"
              className={
                footerLinkClassName
              }
            >
              Cookies
            </Link>

            <Link
              href="/terms"
              className={
                footerLinkClassName
              }
            >
              Terms
            </Link>

            <a
              href={
                siteConfig.url
              }
              className={
                footerLinkClassName
              }
              aria-label="Visit the Beacon-AI website"
            >
              {
                siteConfig.url.replace(
                  /^https?:\/\//,
                  ""
                )
              }
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}