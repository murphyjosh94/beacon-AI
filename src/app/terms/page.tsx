import type {
  Metadata,
} from "next";

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
    "Beacon-AI, FREESIA AVENUE,LIVERPOOL, L9 1LD, United Kingdom",
};

const lastUpdated =
  "17 July 2026";

export const metadata: Metadata = {
  title:
    "Terms and Conditions",

  description:
    "Read the terms governing your use of Beacon-AI, including AI recommendations, Beacon+ subscriptions, payments and affiliate links.",

  alternates: {
    canonical:
      "/terms",
  },

  openGraph: {
    type:
      "website",

    url:
      absoluteUrl(
        "/terms"
      ),

    title:
      "Terms and Conditions | Beacon AI",

    description:
      "The terms governing your use of Beacon-AI and Beacon+ services.",

    siteName:
      siteConfig.name,
  },

  twitter: {
    card:
      "summary",

    title:
      "Terms and Conditions | Beacon AI",

    description:
      "The terms governing your use of Beacon-AI and Beacon+ services.",
  },

  robots: {
    index:
      true,

    follow:
      true,
  },
};

const termsPageSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "WebPage",

  "@id":
    absoluteUrl(
      "/terms#webpage"
    ),

  url:
    absoluteUrl(
      "/terms"
    ),

  name:
    "Terms and Conditions",

  description:
    "The Beacon-AI Terms and Conditions.",

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
    "#agreement",
    "Agreement",
  ],
  [
    "#about-beacon",
    "About Beacon-AI",
  ],
  [
    "#eligibility",
    "Eligibility",
  ],
  [
    "#accounts",
    "Accounts",
  ],
  [
    "#recommendations",
    "AI recommendations",
  ],
  [
    "#beacon-plus",
    "Beacon+",
  ],
  [
    "#payments",
    "Payments",
  ],
  [
    "#cancellation",
    "Cancellation",
  ],
  [
    "#third-parties",
    "Third parties",
  ],
  [
    "#affiliate-links",
    "Affiliate links",
  ],
  [
    "#acceptable-use",
    "Acceptable use",
  ],
  [
    "#intellectual-property",
    "Intellectual property",
  ],
  [
    "#availability",
    "Availability",
  ],
  [
    "#liability",
    "Liability",
  ],
  [
    "#termination",
    "Termination",
  ],
  [
    "#disputes",
    "Complaints",
  ],
  [
    "#governing-law",
    "Governing law",
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

const subheadingClassName =
  "mt-7 text-xl font-black text-slate-950";

const paragraphClassName =
  "mt-4 leading-8 text-slate-700";

const listClassName =
  "mt-4 list-disc space-y-3 pl-6 leading-8 text-slate-700";

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={
          termsPageSchema
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
                Terms and Conditions
              </span>
            </nav>

            <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
              Legal Information
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Terms and Conditions
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              These terms explain the rules that apply when you use
              Beacon-AI, request recommendations, create an account or
              purchase a Beacon+ subscription.
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
                aria-label="Terms and conditions sections"
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
                          {
                            label
                          }
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
              id="agreement"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                1. Agreement to these terms
              </h2>

              <p className={paragraphClassName}>
                These Terms and Conditions form a legal agreement
                between you and{" "}
                <strong>
                  {
                    legalDetails.operatorName
                  }
                </strong>
                , trading as Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                By accessing or using Beacon-AI, creating an account,
                requesting recommendations or purchasing a Beacon+
                subscription, you agree to these terms.
              </p>

              <p className={paragraphClassName}>
                If you do not agree to these terms, you must not use
                Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                These terms should be read alongside our{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Privacy Policy
                </Link>
                ,{" "}
                <Link
                  href="/cookies"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Cookie Policy
                </Link>
                ,{" "}
                <Link
                  href="/affiliate-disclosure"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Affiliate Disclosure
                </Link>{" "}
                and{" "}
                <Link
                  href="/refunds"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Cancellation and Refund Policy
                </Link>
                .
              </p>
            </section>

            <section
              id="about-beacon"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                2. About Beacon-AI
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI is an independent AI-assisted recommendation
                service operated as a sole-trader business under the
                trading name Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                Beacon-AI helps users research and compare products,
                hotels, holidays, flights, entertainment, vehicles,
                services and other options.
              </p>

              <p className={paragraphClassName}>
                Unless we expressly state otherwise, Beacon-AI:
              </p>

              <ul className={listClassName}>
                <li>
                  does not manufacture, own or supply the products
                  shown in recommendations;
                </li>

                <li>
                  does not operate the hotels, airlines, venues,
                  retailers or service providers shown in results;
                </li>

                <li>
                  is not a travel agent, financial adviser, medical
                  adviser or legal adviser;
                </li>

                <li>
                  is not a party to transactions completed with
                  third-party merchants; and
                </li>

                <li>
                  does not control third-party prices, availability,
                  delivery, warranties, returns or customer service.
                </li>
              </ul>
            </section>

            <section
              id="eligibility"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                3. Eligibility
              </h2>

              <p className={paragraphClassName}>
                You must be at least 18 years old and legally capable
                of entering into a binding contract to create a paid
                Beacon+ subscription.
              </p>

              <p className={paragraphClassName}>
                By using Beacon-AI, you confirm that:
              </p>

              <ul className={listClassName}>
                <li>
                  the information you provide is accurate and not
                  misleading;
                </li>

                <li>
                  you are entitled to use any payment method submitted
                  for a purchase;
                </li>

                <li>
                  you will use the service only for lawful purposes;
                  and
                </li>

                <li>
                  you will comply with these terms and applicable law.
                </li>
              </ul>
            </section>

            <section
              id="accounts"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                4. Accounts
              </h2>

              <p className={paragraphClassName}>
                Some features may require you to create an account.
                You are responsible for keeping your account
                information accurate and your login credentials
                confidential.
              </p>

              <p className={paragraphClassName}>
                You must notify us promptly if you believe that your
                account has been accessed without permission or that
                your login information has been compromised.
              </p>

              <p className={paragraphClassName}>
                You are responsible for activity carried out through
                your account unless that activity resulted from our
                failure to use reasonable care or from circumstances
                for which the law makes us responsible.
              </p>

              <p className={paragraphClassName}>
                Accounts are personal and must not be sold, transferred
                or shared in a way that compromises the security of the
                service.
              </p>
            </section>

            <section
              id="recommendations"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                5. AI-assisted recommendations
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI uses automated systems and artificial
                intelligence to interpret requests, compare available
                information, rank options and generate explanatory
                content.
              </p>

              <p className={paragraphClassName}>
                Recommendations are provided for general information
                and research assistance. They do not replace your own
                judgement or independent checks.
              </p>

              <p className={paragraphClassName}>
                AI-generated content may occasionally be inaccurate,
                incomplete, outdated or unsuitable. Before making a
                purchase or booking, you should verify important
                details directly with the relevant merchant or service
                provider.
              </p>

              <p className={paragraphClassName}>
                This includes checking:
              </p>

              <ul className={listClassName}>
                <li>
                  the current price and total cost;
                </li>

                <li>
                  availability and delivery times;
                </li>

                <li>
                  product dimensions, compatibility and
                  specifications;
                </li>

                <li>
                  travel dates, routes, baggage allowances and entry
                  requirements;
                </li>

                <li>
                  cancellation, refund and warranty terms;
                </li>

                <li>
                  accessibility, safety and suitability requirements;
                  and
                </li>

                <li>
                  any restrictions or conditions imposed by the
                  third-party provider.
                </li>
              </ul>

              <p className={paragraphClassName}>
                A Beacon Score is an informational comparison tool. It
                is not a guarantee of quality, value, availability,
                performance or individual suitability.
              </p>
            </section>

            <section
              id="beacon-plus"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                6. Beacon+ subscriptions
              </h2>

              <p className={paragraphClassName}>
                Beacon+ is a paid subscription that may provide
                additional features such as saved preferences, search
                history, alerts, household profiles, vehicle details
                and enhanced recommendations.
              </p>

              <p className={paragraphClassName}>
                The features included in a subscription, its billing
                frequency, price and any trial period will be shown
                before you subscribe.
              </p>

              <h3 className={subheadingClassName}>
                Automatic renewal
              </h3>

              <p className={paragraphClassName}>
                Where a Beacon+ plan is described as recurring, it will
                renew automatically at the stated billing interval
                until cancelled.
              </p>

              <p className={paragraphClassName}>
                By purchasing a recurring subscription, you authorise
                us and our payment provider to charge the applicable
                subscription fee using your selected payment method on
                each renewal date.
              </p>

              <h3 className={subheadingClassName}>
                Price changes
              </h3>

              <p className={paragraphClassName}>
                We may change Beacon+ prices from time to time. Any
                price change affecting an existing recurring
                subscription will be communicated in advance where
                required by law.
              </p>

              <p className={paragraphClassName}>
                Unless you agree otherwise, a revised recurring price
                will apply no earlier than your next eligible renewal
                after the required notice has been provided.
              </p>

              <h3 className={subheadingClassName}>
                Feature changes
              </h3>

              <p className={paragraphClassName}>
                We may update Beacon+ features to improve the service,
                respond to technical or legal requirements, address
                security risks or reflect changes in third-party
                services.
              </p>

              <p className={paragraphClassName}>
                We will not remove a material paid feature without
                considering your statutory rights and providing
                appropriate notice or remedies where required.
              </p>
            </section>

            <section
              id="payments"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                7. Payments and taxes
              </h2>

              <p className={paragraphClassName}>
                Beacon+ payments are processed through Stripe or
                another payment provider identified during checkout.
              </p>

              <p className={paragraphClassName}>
                Beacon-AI does not directly store complete payment-card
                details. Payment information is submitted to and
                processed by the payment provider.
              </p>

              <p className={paragraphClassName}>
                You agree to provide current and accurate billing
                information and authorise the payment provider to
                collect amounts properly due under your subscription.
              </p>

              <p className={paragraphClassName}>
                Prices shown during checkout will indicate whether
                applicable taxes are included or added. Stripe may
                assist with calculating, collecting or reporting
                taxes, but Beacon-AI remains responsible for its own
                legal and tax obligations.
              </p>

              <p className={paragraphClassName}>
                If a payment fails, we may retry the payment, ask you
                to update your payment method or temporarily restrict
                paid features. We will not charge amounts that are not
                authorised by your contract or permitted by law.
              </p>
            </section>

            <section
              id="cancellation"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                8. Cancellation and refunds
              </h2>

              <p className={paragraphClassName}>
                You may cancel a recurring Beacon+ subscription using
                the cancellation method made available in your
                account, through the relevant billing portal or by
                contacting us.
              </p>

              <p className={paragraphClassName}>
                Cancellation normally prevents the next renewal. Your
                access may continue until the end of the billing period
                already paid for, unless the service description,
                applicable law or a refund decision provides otherwise.
              </p>

              <p className={paragraphClassName}>
                Cancelling your Beacon-AI account does not necessarily
                cancel an active recurring payment. You should complete
                the subscription cancellation process separately and
                retain confirmation.
              </p>

              <p className={paragraphClassName}>
                Your statutory cancellation and refund rights are not
                excluded or restricted by these terms. More information
                is provided in our{" "}
                <Link
                  href="/refunds"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Cancellation and Refund Policy
                </Link>
                .
              </p>
            </section>

            <section
              id="third-parties"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                9. Third-party products and services
              </h2>

              <p className={paragraphClassName}>
                Recommendation results may link to products, bookings
                or services offered by independent third parties.
              </p>

              <p className={paragraphClassName}>
                When you purchase from a third party, your contract for
                that product, booking or service is normally with that
                third party rather than Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                The third party is generally responsible for:
              </p>

              <ul className={listClassName}>
                <li>
                  accepting and fulfilling your order;
                </li>

                <li>
                  delivery, collection or performance of the service;
                </li>

                <li>
                  product descriptions and availability;
                </li>

                <li>
                  warranties, guarantees and after-sales support;
                </li>

                <li>
                  booking changes and cancellations;
                </li>

                <li>
                  refunds, replacements and complaints; and
                </li>

                <li>
                  its own legal terms and privacy practices.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Beacon-AI is not responsible for the conduct of an
                independent merchant, but this does not exclude
                liability that the law does not allow us to exclude.
              </p>
            </section>

            <section
              id="affiliate-links"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                10. Affiliate links and commercial relationships
              </h2>

              <p className={paragraphClassName}>
                Some links on Beacon-AI are affiliate links. If you
                follow an affiliate link and complete an eligible
                purchase or booking, Beacon-AI may receive a
                commission.
              </p>

              <p className={paragraphClassName}>
                An affiliate commission will not normally increase the
                price you pay.
              </p>

              <p className={paragraphClassName}>
                Sponsored placements, paid partnerships and other
                commercial relationships will be identified where
                required.
              </p>

              <p className={paragraphClassName}>
                Commercial relationships may affect which merchants or
                links are available to us. They do not guarantee that a
                particular option is the best choice for every user.
              </p>

              <p className={paragraphClassName}>
                Read our{" "}
                <Link
                  href="/affiliate-disclosure"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Affiliate Disclosure
                </Link>{" "}
                for further information.
              </p>
            </section>

            <section
              id="acceptable-use"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                11. Acceptable use
              </h2>

              <p className={paragraphClassName}>
                You must not use Beacon-AI:
              </p>

              <ul className={listClassName}>
                <li>
                  for an unlawful, fraudulent, harmful or deceptive
                  purpose;
                </li>

                <li>
                  to violate another person&apos;s rights, privacy or
                  intellectual property;
                </li>

                <li>
                  to upload malware, harmful code or content designed
                  to disrupt the service;
                </li>

                <li>
                  to gain unauthorised access to accounts, systems,
                  databases or networks;
                </li>

                <li>
                  to interfere with security, rate limits or technical
                  restrictions;
                </li>

                <li>
                  to impersonate another person or misrepresent your
                  identity;
                </li>

                <li>
                  to submit confidential payment details, passwords or
                  unnecessary sensitive personal information into a
                  recommendation request;
                </li>

                <li>
                  to scrape, harvest, copy or extract data through
                  automated means without our written permission;
                </li>

                <li>
                  to reproduce or resell a substantial part of the
                  service;
                </li>

                <li>
                  to use results to train or develop a competing
                  service without our written permission; or
                </li>

                <li>
                  in a way that creates an unreasonable load on our
                  infrastructure or interferes with another user.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Reasonable use of public search-engine crawlers is
                subject to our technical instructions, including
                robots rules.
              </p>
            </section>

            <section
              id="user-content"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                12. Information you submit
              </h2>

              <p className={paragraphClassName}>
                You retain ownership of information and original
                content you submit to Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                You grant us a limited, non-exclusive licence to host,
                process, reproduce and analyse that information only
                as reasonably necessary to:
              </p>

              <ul className={listClassName}>
                <li>
                  provide your requested service;
                </li>

                <li>
                  maintain and secure Beacon-AI;
                </li>

                <li>
                  operate account and subscription features;
                </li>

                <li>
                  investigate misuse or technical problems; and
                </li>

                <li>
                  improve the service using aggregated or appropriately
                  protected information.
                </li>
              </ul>

              <p className={paragraphClassName}>
                You must have the right to submit the information you
                provide and must not submit content that is unlawful,
                defamatory, infringing or harmful.
              </p>
            </section>

            <section
              id="intellectual-property"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                13. Intellectual property
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI and its licensors retain all intellectual
                property rights in the service, including its branding,
                logo, software, design, databases, scoring systems,
                original written content and site presentation.
              </p>

              <p className={paragraphClassName}>
                These terms give you a limited, personal,
                non-exclusive, non-transferable and revocable right to
                use Beacon-AI for your own lawful, non-commercial
                purposes.
              </p>

              <p className={paragraphClassName}>
                You may save or share an individual recommendation for
                personal use, but you must not reproduce, republish,
                distribute, sell or commercially exploit a substantial
                part of Beacon-AI without written permission.
              </p>

              <p className={paragraphClassName}>
                Third-party names, logos, product images and trademarks
                belong to their respective owners. Their appearance on
                Beacon-AI does not imply endorsement unless expressly
                stated.
              </p>
            </section>

            <section
              id="availability"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                14. Service availability and changes
              </h2>

              <p className={paragraphClassName}>
                We aim to keep Beacon-AI available and functioning
                reliably, but continuous or error-free access cannot be
                guaranteed.
              </p>

              <p className={paragraphClassName}>
                We may temporarily restrict access for maintenance,
                updates, security incidents, capacity limits or events
                outside our reasonable control.
              </p>

              <p className={paragraphClassName}>
                We may add, remove or modify free features. Changes to
                paid features will be handled fairly and consistently
                with your statutory rights.
              </p>

              <p className={paragraphClassName}>
                We may discontinue Beacon-AI or a paid service. Where
                this affects a prepaid subscription, we will provide
                notice and any refund or alternative remedy required by
                law.
              </p>
            </section>

            <section
              id="liability"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                15. Our responsibility to you
              </h2>

              <p className={paragraphClassName}>
                Nothing in these terms excludes or limits liability
                where doing so would be unlawful.
              </p>

              <p className={paragraphClassName}>
                In particular, nothing excludes or limits liability
                for:
              </p>

              <ul className={listClassName}>
                <li>
                  death or personal injury caused by negligence;
                </li>

                <li>
                  fraud or fraudulent misrepresentation;
                </li>

                <li>
                  breach of rights that cannot lawfully be excluded;
                  or
                </li>

                <li>
                  any other liability that cannot be excluded or
                  limited under applicable law.
                </li>
              </ul>

              <p className={paragraphClassName}>
                If you are a consumer, Beacon-AI is responsible for
                foreseeable loss or damage caused by our failure to use
                reasonable care and skill or by our breach of these
                terms.
              </p>

              <p className={paragraphClassName}>
                Loss or damage is foreseeable where it was an obvious
                consequence of the breach or where both parties knew it
                might occur when the contract was formed.
              </p>

              <p className={paragraphClassName}>
                Beacon-AI is not responsible for loss or damage caused
                solely by:
              </p>

              <ul className={listClassName}>
                <li>
                  inaccurate information supplied by you;
                </li>

                <li>
                  your failure to verify important information with a
                  merchant;
                </li>

                <li>
                  an independent third-party merchant or provider;
                </li>

                <li>
                  changes in third-party prices, availability or
                  terms;
                </li>

                <li>
                  unauthorised account use resulting from your failure
                  to protect login credentials; or
                </li>

                <li>
                  events outside our reasonable control, except where
                  the law makes us responsible.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Beacon-AI is supplied primarily for domestic and
                private use. If you use it for business purposes, we
                will not be responsible for business losses such as
                lost profits, lost revenue, lost opportunities or
                business interruption, except where liability cannot
                lawfully be excluded.
              </p>
            </section>

            <section
              id="indemnity"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                16. Business users
              </h2>

              <p className={paragraphClassName}>
                This section applies only where you use Beacon-AI
                wholly or mainly for business purposes.
              </p>

              <p className={paragraphClassName}>
                To the extent permitted by law, a business user is
                responsible for reasonable losses, liabilities and
                costs arising directly from its unlawful use of
                Beacon-AI, infringement of another person&apos;s rights
                or material breach of these terms.
              </p>

              <p className={paragraphClassName}>
                This section does not apply to consumers acting wholly
                or mainly outside their trade, business, craft or
                profession.
              </p>
            </section>

            <section
              id="termination"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                17. Suspension and termination
              </h2>

              <p className={paragraphClassName}>
                You may stop using Beacon-AI at any time. You may also
                request account closure, subject to any information we
                must retain for legal or operational reasons.
              </p>

              <p className={paragraphClassName}>
                We may restrict, suspend or terminate access where we
                reasonably believe that:
              </p>

              <ul className={listClassName}>
                <li>
                  you have materially or repeatedly breached these
                  terms;
                </li>

                <li>
                  your activity creates a security, legal or fraud
                  risk;
                </li>

                <li>
                  payment remains overdue after reasonable attempts to
                  resolve it;
                </li>

                <li>
                  continued access could harm Beacon-AI, another user
                  or a third party; or
                </li>

                <li>
                  suspension or termination is required by law.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Where appropriate, we will provide notice and an
                opportunity to correct the issue before termination.
                Immediate action may be taken where necessary to
                protect security, comply with law or prevent serious
                harm.
              </p>

              <p className={paragraphClassName}>
                Termination does not affect rights or obligations that
                arose before termination. Provisions intended to
                continue, including intellectual property, liability
                and dispute provisions, remain effective.
              </p>
            </section>

            <section
              id="privacy"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                18. Privacy and cookies
              </h2>

              <p className={paragraphClassName}>
                Our{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Privacy Policy
                </Link>{" "}
                explains how we collect and use personal information.
              </p>

              <p className={paragraphClassName}>
                Our{" "}
                <Link
                  href="/cookies"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Cookie Policy
                </Link>{" "}
                explains how cookies and similar technologies are used.
              </p>
            </section>

            <section
              id="changes"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                19. Changes to these terms
              </h2>

              <p className={paragraphClassName}>
                We may update these terms to reflect changes in the
                service, law, technology, suppliers or business
                practices.
              </p>

              <p className={paragraphClassName}>
                The latest version will be published on this page with
                an updated revision date.
              </p>

              <p className={paragraphClassName}>
                Where a change materially affects an existing paid
                subscription, we will provide reasonable advance notice
                and any cancellation or refund rights required by law.
              </p>

              <p className={paragraphClassName}>
                Changes will not retrospectively remove rights that you
                have already acquired under applicable consumer law.
              </p>
            </section>

            <section
              id="disputes"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                20. Complaints and disputes
              </h2>

              <p className={paragraphClassName}>
                Please contact us first if you have a complaint. We
                will aim to investigate it fairly and respond within a
                reasonable period.
              </p>

              <p className={paragraphClassName}>
                When contacting us, include your name, account email,
                relevant transaction information and a clear
                description of the issue.
              </p>

              <p className={paragraphClassName}>
                Nothing in this section prevents you from using any
                complaint procedure, alternative dispute resolution
                process or court remedy available under applicable law.
              </p>
            </section>

            <section
              id="governing-law"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                21. Governing law
              </h2>

              <p className={paragraphClassName}>
                These terms are governed by the laws of England and
                Wales.
              </p>

              <p className={paragraphClassName}>
                If you are a consumer resident in another part of the
                United Kingdom, you may also benefit from mandatory
                protections under the law of the place where you live
                and may be entitled to bring proceedings in your local
                courts.
              </p>

              <p className={paragraphClassName}>
                If you are a consumer resident outside the United
                Kingdom, any mandatory consumer rights available in
                your country of residence remain unaffected where they
                cannot lawfully be excluded.
              </p>

              <p className={paragraphClassName}>
                Business users agree that the courts of England and
                Wales have exclusive jurisdiction, unless applicable
                law requires otherwise.
              </p>
            </section>

            <section
              id="general"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                22. General terms
              </h2>

              <h3 className={subheadingClassName}>
                Entire agreement
              </h3>

              <p className={paragraphClassName}>
                These terms and the policies incorporated into them
                form the agreement between you and Beacon-AI concerning
                use of the service.
              </p>

              <h3 className={subheadingClassName}>
                No waiver
              </h3>

              <p className={paragraphClassName}>
                A delay in enforcing a right does not mean that the
                right has been waived.
              </p>

              <h3 className={subheadingClassName}>
                Severability
              </h3>

              <p className={paragraphClassName}>
                If part of these terms is found to be unlawful or
                unenforceable, the remaining provisions will continue
                to apply. The affected provision will be interpreted or
                adjusted only to the extent necessary to make it lawful
                and enforceable.
              </p>

              <h3 className={subheadingClassName}>
                Transfer
              </h3>

              <p className={paragraphClassName}>
                We may transfer our rights and obligations to another
                organisation as part of a lawful sale, transfer or
                reorganisation of Beacon-AI. We will ensure that this
                does not reduce your statutory rights.
              </p>

              <p className={paragraphClassName}>
                You may not transfer your account or contractual rights
                without our written agreement, except where applicable
                law gives you that right.
              </p>

              <h3 className={subheadingClassName}>
                Third-party rights
              </h3>

              <p className={paragraphClassName}>
                Unless expressly stated, a person who is not a party to
                these terms has no right to enforce them.
              </p>
            </section>

            <section
              id="contact"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                23. Contact us
              </h2>

              <p className={paragraphClassName}>
                Questions, cancellation requests and complaints may be
                sent to:
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
                Replace the legal name, business email address and
                postal address at the top of this file. You should also
                confirm that the subscription renewal, cancellation
                and Beacon+ feature descriptions match the service
                users will actually receive.
              </p>
            </div>
          </article>
        </div>

        <BeaconFooter />
      </main>
    </>
  );
}