import type { Metadata } from "next";

import Link from "next/link";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";

import {
  absoluteUrl,
  siteConfig,
} from "@/lib/seo/SiteConfig";

const legalDetails = {
  operatorName:
    "Beacon-AI",

  contactEmail:
    "Contact@beacon-ai.co.uk",

  postalAddress:
    "Beacon-AI, FREESIA AVENUE, LIVERPOOL, L9 1LD, United Kingdom",
};

const lastUpdated =
  "17 July 2026";

export const metadata: Metadata = {
  title:
    "Affiliate Disclosure",

  description:
    "Learn how Beacon-AI uses affiliate links, earns commissions and separates commercial relationships from its AI-assisted recommendations.",

  alternates: {
    canonical:
      "/affiliate-disclosure",
  },

  openGraph: {
    type:
      "website",

    url:
      absoluteUrl(
        "/affiliate-disclosure"
      ),

    title:
      "Affiliate Disclosure | Beacon AI",

    description:
      "How Beacon-AI uses affiliate links and may earn commissions from eligible purchases and bookings.",

    siteName:
      siteConfig.name,
  },

  twitter: {
    card:
      "summary",

    title:
      "Affiliate Disclosure | Beacon AI",

    description:
      "How Beacon-AI uses affiliate links and may earn commissions.",
  },

  robots: {
    index:
      true,

    follow:
      true,
  },
};

const affiliateDisclosureSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "WebPage",

  "@id":
    absoluteUrl(
      "/affiliate-disclosure#webpage"
    ),

  url:
    absoluteUrl(
      "/affiliate-disclosure"
    ),

  name:
    "Affiliate Disclosure",

  description:
    "The Beacon-AI Affiliate Disclosure.",

  dateModified:
    "2026-07-17",

  inLanguage:
    siteConfig.language,

  isPartOf: {
    "@id":
      absoluteUrl(
        "/#website"
      ),
  },

  publisher: {
    "@id":
      absoluteUrl(
        "/#organization"
      ),
  },
};

const navigationItems = [
  [
    "#summary",
    "Quick summary",
  ],
  [
    "#affiliate-links",
    "Affiliate links",
  ],
  [
    "#commissions",
    "How commissions work",
  ],
  [
    "#recommendations",
    "Our recommendations",
  ],
  [
    "#sponsored-content",
    "Sponsored content",
  ],
  [
    "#amazon",
    "Amazon Associates",
  ],
  [
    "#prices",
    "Prices and availability",
  ],
  [
    "#third-parties",
    "Third-party purchases",
  ],
  [
    "#tracking",
    "Tracking technologies",
  ],
  [
    "#contact",
    "Contact",
  ],
] as const;

const sectionClassName =
  "scroll-mt-28 border-b border-slate-200 pb-10 last:border-b-0 last:pb-0";

const headingClassName =
  "text-2xl font-black tracking-tight text-slate-950 sm:text-3xl";

const paragraphClassName =
  "mt-4 leading-8 text-slate-700";

const listClassName =
  "mt-4 list-disc space-y-3 pl-6 leading-8 text-slate-700";

export default function AffiliateDisclosurePage() {
  return (
    <>
      <JsonLd
        data={
          affiliateDisclosureSchema
        }
      />

      <main className="min-h-screen bg-slate-50">
        <Navbar />

        <header className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 px-6 py-16 text-white sm:py-20">
          <div className="mx-auto max-w-5xl">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-sm font-semibold text-blue-100"
            >
              <Link
                href="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <span
                aria-hidden="true"
              >
                /
              </span>

              <span className="text-white">
                Affiliate Disclosure
              </span>
            </nav>

            <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
              Commercial Transparency
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Affiliate Disclosure
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Beacon-AI may earn commission when you follow certain
              links and complete an eligible purchase or booking.
              This page explains how those relationships work.
            </p>

            <p className="mt-6 text-sm font-semibold text-blue-200">
              Last updated:{" "}
              {lastUpdated}
            </p>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[260px_1fr] lg:py-20">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-black text-slate-950">
                On this page
              </h2>

              <nav
                aria-label="Affiliate disclosure sections"
                className="mt-5"
              >
                <ul className="space-y-3 text-sm font-semibold text-slate-600">
                  {navigationItems.map(
                    (
                      [
                        href,
                        label,
                      ]
                    ) => (
                      <li
                        key={
                          href
                        }
                      >
                        <a
                          href={
                            href
                          }
                          className="transition hover:text-blue-900"
                        >
                          {label}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </nav>
            </div>
          </aside>

          <article className="space-y-10 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-10 lg:p-12">
            <section
              id="summary"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                1. Quick summary
              </h2>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <p className="text-lg font-black leading-8 text-blue-950">
                  Some links on Beacon-AI are affiliate links.
                  Beacon-AI may receive a commission if you follow
                  one of these links and complete an eligible
                  purchase or booking.
                </p>

                <p className="mt-4 leading-7 text-blue-950">
                  This will not normally increase the price you pay.
                  You remain free to visit a merchant directly or
                  choose a different provider.
                </p>
              </div>

              <p className={paragraphClassName}>
                Beacon-AI is operated by{" "}
                <strong>
                  {
                    legalDetails.operatorName
                  }
                </strong>
                , trading as Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                Affiliate income helps support the operation,
                development and maintenance of Beacon-AI, including
                its research, comparison and AI-assisted
                recommendation features.
              </p>
            </section>

            <section
              id="affiliate-links"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                2. What is an affiliate link?
              </h2>

              <p className={paragraphClassName}>
                An affiliate link is a link containing information
                that allows a retailer, booking platform, affiliate
                network or other partner to identify that a visitor
                was referred by Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                When you select an affiliate link, you may be taken
                to an independent third-party website. If you then
                complete an eligible transaction, Beacon-AI may
                receive a fee or commission from the third party.
              </p>

              <p className={paragraphClassName}>
                Affiliate links may appear in:
              </p>

              <ul className={listClassName}>
                <li>
                  product recommendations;
                </li>

                <li>
                  hotel, flight or holiday comparisons;
                </li>

                <li>
                  entertainment and ticket recommendations;
                </li>

                <li>
                  vehicle and service comparisons;
                </li>

                <li>
                  editorial guides and research pages;
                </li>

                <li>
                  email alerts or account notifications; and
                </li>

                <li>
                  other clearly identified commercial content.
                </li>
              </ul>
            </section>

            <section
              id="commissions"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                3. How commissions work
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI may be paid when you:
              </p>

              <ul className={listClassName}>
                <li>
                  select an affiliate link;
                </li>

                <li>
                  make a qualifying purchase;
                </li>

                <li>
                  complete a qualifying booking;
                </li>

                <li>
                  register for an eligible service;
                </li>

                <li>
                  request a quote or submit an eligible enquiry; or
                </li>

                <li>
                  complete another action defined by the relevant
                  affiliate programme.
                </li>
              </ul>

              <p className={paragraphClassName}>
                The commission amount may vary by merchant, product,
                service, transaction value, affiliate network or
                campaign.
              </p>

              <p className={paragraphClassName}>
                Beacon-AI does not usually know the identity of an
                individual customer solely because that person
                completed a purchase through an affiliate link.
                Affiliate reports may instead contain transaction
                references, timestamps, order values, product
                categories or commission information.
              </p>

              <p className={paragraphClassName}>
                Further information about affiliate tracking and
                personal information is provided in our{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/cookies"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </section>

            <section
              id="recommendations"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                4. How affiliate relationships affect recommendations
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI aims to provide useful recommendations based
                on factors relevant to the user&apos;s request, which
                may include:
              </p>

              <ul className={listClassName}>
                <li>
                  price and overall value;
                </li>

                <li>
                  product or service features;
                </li>

                <li>
                  suitability for the stated requirements;
                </li>

                <li>
                  availability;
                </li>

                <li>
                  customer feedback and reputation signals;
                </li>

                <li>
                  compatibility, location or convenience;
                </li>

                <li>
                  cancellation, delivery or warranty information; and
                </li>

                <li>
                  the quality and completeness of available data.
                </li>
              </ul>

              <p className={paragraphClassName}>
                A commercial relationship may affect which merchants,
                offers or links Beacon-AI is technically able to show.
                Not every merchant or option available in the market
                will necessarily be included.
              </p>

              <p className={paragraphClassName}>
                The existence or amount of an affiliate commission
                does not guarantee that an option will receive the
                highest recommendation score.
              </p>

              <p className={paragraphClassName}>
                Beacon-AI may display non-affiliate options where they
                are available and relevant. However, no recommendation
                should be treated as a complete review of the entire
                market.
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-6">
                <h3 className="font-black text-slate-950">
                  Your decision remains your own
                </h3>

                <p className="mt-2 leading-7 text-slate-700">
                  Beacon-AI recommendations are research assistance,
                  not guarantees. Check the current price, terms,
                  availability, suitability and merchant information
                  before purchasing or booking.
                </p>
              </div>
            </section>

            <section
              id="sponsored-content"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                5. Sponsored and paid content
              </h2>

              <p className={paragraphClassName}>
                Affiliate links are not the same as every other form
                of paid promotion.
              </p>

              <p className={paragraphClassName}>
                Beacon-AI may also publish or display:
              </p>

              <ul className={listClassName}>
                <li>
                  sponsored recommendations;
                </li>

                <li>
                  paid placements;
                </li>

                <li>
                  featured listings;
                </li>

                <li>
                  advertisements;
                </li>

                <li>
                  brand partnerships; or
                </li>

                <li>
                  content created in exchange for payment, products,
                  services or another benefit.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Where content is advertising or has been materially
                influenced by a commercial arrangement, Beacon-AI
                will aim to identify it clearly and prominently using
                wording such as:
              </p>

              <ul className={listClassName}>
                <li>
                  Advertisement;
                </li>

                <li>
                  Ad;
                </li>

                <li>
                  Sponsored;
                </li>

                <li>
                  Paid partnership; or
                </li>

                <li>
                  Affiliate link.
                </li>
              </ul>

              <p className={paragraphClassName}>
                A disclosure should appear close enough to the
                relevant content or link for users to understand the
                commercial relationship before engaging with it.
              </p>
            </section>

            <section
              id="amazon"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                6. Amazon Associates disclosure
              </h2>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-lg font-black leading-8 text-amber-950">
                  As an Amazon Associate I earn from qualifying
                  purchases.
                </p>
              </div>

              <p className={paragraphClassName}>
                Beacon-AI may participate in the Amazon Associates
                Programme and may receive commission from qualifying
                purchases made through eligible Amazon links.
              </p>

              <p className={paragraphClassName}>
                Amazon and the Amazon logo are trademarks of
                Amazon.com, Inc. or its affiliates.
              </p>

              <p className={paragraphClassName}>
                Product prices and availability shown by Beacon-AI
                may have changed by the time you visit Amazon. The
                price and availability displayed on Amazon at the
                time of purchase will apply.
              </p>

              <p className={paragraphClassName}>
                Amazon is responsible for orders placed on its
                website, including payment, delivery, returns,
                warranties and customer service, subject to its own
                terms and applicable consumer law.
              </p>
            </section>

            <section
              id="prices"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                7. Prices, offers and availability
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI may receive prices, availability,
                specifications and offer information from merchants,
                affiliate networks, data providers or public sources.
              </p>

              <p className={paragraphClassName}>
                This information can change at any time. Beacon-AI
                cannot guarantee that:
              </p>

              <ul className={listClassName}>
                <li>
                  a displayed price is still available;
                </li>

                <li>
                  an item remains in stock;
                </li>

                <li>
                  a promotion remains valid;
                </li>

                <li>
                  taxes, booking fees or delivery charges are
                  included;
                </li>

                <li>
                  a product specification has not changed; or
                </li>

                <li>
                  a merchant will accept or fulfil an order.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Always review the final price, description, terms and
                availability on the merchant&apos;s website before
                completing a transaction.
              </p>
            </section>

            <section
              id="third-parties"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                8. Purchases from third parties
              </h2>

              <p className={paragraphClassName}>
                Following an affiliate link does not normally create
                a sales contract between you and Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                Your purchase, booking or service agreement will
                normally be made directly with the relevant retailer,
                travel provider, venue, marketplace or other
                third-party business.
              </p>

              <p className={paragraphClassName}>
                The third party is generally responsible for:
              </p>

              <ul className={listClassName}>
                <li>
                  product and service descriptions;
                </li>

                <li>
                  accepting and fulfilling orders;
                </li>

                <li>
                  collecting payment;
                </li>

                <li>
                  delivery or performance;
                </li>

                <li>
                  booking changes and cancellations;
                </li>

                <li>
                  guarantees and warranties;
                </li>

                <li>
                  refunds and returns;
                </li>

                <li>
                  customer support; and
                </li>

                <li>
                  its own privacy and cookie practices.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Review the merchant&apos;s terms, privacy policy and
                returns or cancellation policy before completing a
                transaction.
              </p>
            </section>

            <section
              id="tracking"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                9. Affiliate tracking
              </h2>

              <p className={paragraphClassName}>
                Affiliate links commonly contain referral parameters
                or identifiers. The destination merchant or affiliate
                network may use those identifiers, together with
                cookies or similar technologies, to attribute an
                eligible transaction to Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                Tracking may record information such as:
              </p>

              <ul className={listClassName}>
                <li>
                  the referring page or campaign;
                </li>

                <li>
                  the date and time a link was selected;
                </li>

                <li>
                  an anonymous or pseudonymous referral identifier;
                </li>

                <li>
                  the type or value of an eligible transaction;
                </li>

                <li>
                  whether a transaction was cancelled or returned;
                  and
                </li>

                <li>
                  the commission attributed to Beacon-AI.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Where Beacon-AI stores or accesses non-essential
                tracking information on your device, we will seek
                consent where required. Technologies operating on a
                third-party website are controlled by that third
                party.
              </p>
            </section>

            <section
              id="no-extra-cost"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                10. Does an affiliate link cost more?
              </h2>

              <p className={paragraphClassName}>
                Using an affiliate link will not normally increase the
                price you pay. The merchant pays Beacon-AI a
                commission from its own marketing or sales budget.
              </p>

              <p className={paragraphClassName}>
                However, prices can vary between merchants, platforms,
                users, dates, locations and promotional channels. You
                should compare the final total cost before purchasing.
              </p>
            </section>

            <section
              id="changes"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                11. Changes to this disclosure
              </h2>

              <p className={paragraphClassName}>
                We may update this disclosure when our affiliate
                partners, commercial arrangements, recommendation
                methods or legal obligations change.
              </p>

              <p className={paragraphClassName}>
                The latest version will be published on this page with
                an updated revision date.
              </p>
            </section>

            <section
              id="contact"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                12. Contact us
              </h2>

              <p className={paragraphClassName}>
                Contact us if you have a question about an affiliate
                relationship, sponsored placement or commercial
                disclosure on Beacon-AI.
              </p>

              <address className="mt-6 not-italic">
                <div className="rounded-2xl bg-blue-50 p-6 leading-8 text-slate-800">
                  <p>
                    <strong>
                      {
                        legalDetails.operatorName
                      }
                    </strong>
                  </p>

                  <p>
                    Trading as Beacon-AI
                  </p>

                  <p className="mt-3">
                    {
                      legalDetails.postalAddress
                    }
                  </p>

                  <p className="mt-3">
                    Email:{" "}
                    {
                      legalDetails.contactEmail
                    }
                  </p>

                  <p className="mt-3">
                    Website:{" "}
                    <a
                      href={
                        siteConfig.url
                      }
                      className="font-semibold text-blue-900 underline decoration-blue-300 underline-offset-4"
                    >
                      {
                        siteConfig.url
                      }
                    </a>
                  </p>
                </div>
              </address>
            </section>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="font-black text-amber-950">
                Complete before publishing
              </h2>

              <p className="mt-2 leading-7 text-amber-900">
                Replace the legal contact details and confirm which
                affiliate programmes Beacon-AI has joined. Add clear,
                prominent disclosures beside affiliate links and
                sponsored content rather than relying only on this
                policy page.
              </p>
            </div>
          </article>
        </div>

        <BeaconFooter />
      </main>
    </>
  );
}