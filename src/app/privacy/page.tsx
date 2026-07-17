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

export const metadata: Metadata = {
  title:
    "Privacy Policy",

  description:
    "Read the Beacon-AI Privacy Policy, including how we collect, use, store and protect personal information.",

  alternates: {
    canonical:
      "/privacy",
  },

  openGraph: {
    type:
      "website",

    url:
      absoluteUrl(
        "/privacy"
      ),

    title:
      "Privacy Policy | Beacon AI",

    description:
      "How Beacon-AI collects, uses, stores and protects personal information.",

    siteName:
      siteConfig.name,
  },

  twitter: {
    card:
      "summary",

    title:
      "Privacy Policy | Beacon AI",

    description:
      "How Beacon-AI collects, uses, stores and protects personal information.",
  },

  robots: {
    index:
      true,

    follow:
      true,
  },
};

const lastUpdated =
  "17 July 2026";

const privacyPageSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "WebPage",

  "@id":
    absoluteUrl(
      "/privacy#webpage"
    ),

  url:
    absoluteUrl(
      "/privacy"
    ),

  name:
    "Privacy Policy",

  description:
    "The Beacon-AI Privacy Policy.",

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

const sectionClassName =
  "scroll-mt-28 border-b border-slate-200 pb-10 last:border-b-0 last:pb-0";

const headingClassName =
  "text-2xl font-black tracking-tight text-slate-950 sm:text-3xl";

const paragraphClassName =
  "mt-4 leading-8 text-slate-700";

const listClassName =
  "mt-4 list-disc space-y-3 pl-6 leading-8 text-slate-700";

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={
          privacyPageSchema
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
                Privacy Policy
              </span>
            </nav>

            <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
              Legal Information
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Privacy Policy
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              This policy explains how Beacon-AI collects, uses,
              shares, stores and protects personal information when
              you use our website, recommendation services and
              membership features.
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
                aria-label="Privacy policy sections"
                className="mt-5"
              >
                <ul className="space-y-3 text-sm font-semibold text-slate-600">
                  {[
                    [
                      "#who-we-are",
                      "Who we are",
                    ],
                    [
                      "#information-we-collect",
                      "Information we collect",
                    ],
                    [
                      "#how-we-use-information",
                      "How we use information",
                    ],
                    [
                      "#lawful-bases",
                      "Lawful bases",
                    ],
                    [
                      "#ai-recommendations",
                      "AI recommendations",
                    ],
                    [
                      "#payments",
                      "Payments",
                    ],
                    [
                      "#sharing",
                      "Sharing information",
                    ],
                    [
                      "#international-transfers",
                      "International transfers",
                    ],
                    [
                      "#retention",
                      "Data retention",
                    ],
                    [
                      "#security",
                      "Security",
                    ],
                    [
                      "#rights",
                      "Your rights",
                    ],
                    [
                      "#cookies",
                      "Cookies",
                    ],
                    [
                      "#children",
                      "Children",
                    ],
                    [
                      "#complaints",
                      "Complaints",
                    ],
                    [
                      "#contact",
                      "Contact us",
                    ],
                  ].map(
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
              id="who-we-are"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                1. Who we are
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI is an independent business operated by{" "}
                <strong>
                  {
                    legalDetails.operatorName
                  }
                </strong>
                , trading as Beacon-AI. We provide AI-assisted
                recommendations for products, travel, entertainment,
                vehicles, services and other consumer choices.
              </p>

              <p className={paragraphClassName}>
                For the purposes of UK data protection law, the
                operator of Beacon-AI is the data controller for the
                personal information described in this policy.
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-slate-700">
                <p>
                  <strong>
                    Trading name:
                  </strong>{" "}
                  Beacon-AI
                </p>

                <p className="mt-2">
                  <strong>
                    Website:
                  </strong>{" "}
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

                <p className="mt-2">
                  <strong>
                    Email:
                  </strong>{" "}
                  {
                    legalDetails.contactEmail
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Postal address:
                  </strong>{" "}
                  {
                    legalDetails.postalAddress
                  }
                </p>
              </div>
            </section>

            <section
              id="information-we-collect"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                2. Information we collect
              </h2>

              <p className={paragraphClassName}>
                The information we collect depends on how you use
                Beacon-AI. It may include the following categories.
              </p>

              <h3 className="mt-7 text-xl font-black text-slate-950">
                Information you provide
              </h3>

              <ul className={listClassName}>
                <li>
                  Your name, email address and account login
                  information.
                </li>

                <li>
                  Information included in recommendation requests,
                  such as your budget, preferred location, travel
                  dates, interests, product requirements or other
                  priorities.
                </li>

                <li>
                  Preferences saved to your account, including
                  household, family, pet or vehicle information where
                  you choose to provide it.
                </li>

                <li>
                  Messages, feedback, support enquiries and other
                  communications you send to us.
                </li>

                <li>
                  Subscription, billing and transaction information,
                  excluding complete payment-card details handled
                  directly by our payment provider.
                </li>
              </ul>

              <h3 className="mt-7 text-xl font-black text-slate-950">
                Information collected automatically
              </h3>

              <ul className={listClassName}>
                <li>
                  Internet Protocol address, browser type, device
                  type, operating system and approximate location
                  derived from technical data.
                </li>

                <li>
                  Pages visited, links selected, searches performed,
                  referring pages and the date and time of activity.
                </li>

                <li>
                  Account, session, security and authentication data.
                </li>

                <li>
                  Cookie identifiers and similar technical
                  information, subject to your consent where required.
                </li>

                <li>
                  Diagnostic information, error logs and performance
                  data used to maintain and secure the service.
                </li>
              </ul>

              <h3 className="mt-7 text-xl font-black text-slate-950">
                Information received from other organisations
              </h3>

              <p className={paragraphClassName}>
                We may receive information from payment providers,
                authentication providers, analytics services,
                affiliate networks and commercial partners. The
                information received depends on the service involved
                and the choices you make.
              </p>

              <p className={paragraphClassName}>
                Please avoid including sensitive personal information
                in a recommendation request unless it is genuinely
                necessary. This includes information about health,
                ethnicity, religion, political beliefs, trade-union
                membership, genetics, biometrics or sexual life.
              </p>
            </section>

            <section
              id="how-we-use-information"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                3. How we use your information
              </h2>

              <p className={paragraphClassName}>
                We may use personal information to:
              </p>

              <ul className={listClassName}>
                <li>
                  Create, operate and secure your Beacon-AI account.
                </li>

                <li>
                  Interpret your requests and generate personalised
                  recommendations.
                </li>

                <li>
                  Remember preferences and provide Beacon+
                  membership features.
                </li>

                <li>
                  Process subscriptions, payments, refunds and
                  related billing administration.
                </li>

                <li>
                  Respond to enquiries, complaints and support
                  requests.
                </li>

                <li>
                  Measure website use and improve functionality,
                  reliability and user experience.
                </li>

                <li>
                  Detect fraud, misuse, security incidents and
                  technical problems.
                </li>

                <li>
                  Send service messages about your account,
                  subscription or important changes.
                </li>

                <li>
                  Send marketing communications where you have
                  consented, or where another lawful basis permits
                  them.
                </li>

                <li>
                  Meet legal, tax, accounting, regulatory and
                  enforcement obligations.
                </li>

                <li>
                  Establish, exercise or defend legal claims.
                </li>
              </ul>
            </section>

            <section
              id="lawful-bases"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                4. Our lawful bases
              </h2>

              <p className={paragraphClassName}>
                UK data protection law requires us to have a lawful
                basis for each use of personal information. Depending
                on the circumstances, we rely on one or more of the
                following bases.
              </p>

              <div className="mt-6 grid gap-5">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black text-slate-950">
                    Contract
                  </h3>

                  <p className="mt-2 leading-7 text-slate-700">
                    Processing is necessary to provide a service you
                    requested or to take steps at your request before
                    entering into a contract. This includes operating
                    accounts, providing recommendations and managing
                    Beacon+ subscriptions.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black text-slate-950">
                    Legitimate interests
                  </h3>

                  <p className="mt-2 leading-7 text-slate-700">
                    We may process information where reasonably
                    necessary to operate, secure and improve
                    Beacon-AI, prevent fraud, understand service
                    performance and protect our business or users. We
                    consider the effect on your rights before relying
                    on this basis.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black text-slate-950">
                    Consent
                  </h3>

                  <p className="mt-2 leading-7 text-slate-700">
                    We rely on consent for optional cookies and
                    certain marketing activities. You can withdraw
                    consent at any time, without affecting processing
                    that occurred before withdrawal.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black text-slate-950">
                    Legal obligation
                  </h3>

                  <p className="mt-2 leading-7 text-slate-700">
                    We may process information to comply with laws
                    relating to taxation, accounting, consumer
                    protection, fraud prevention, law enforcement or
                    regulatory requirements.
                  </p>
                </div>
              </div>
            </section>

            <section
              id="ai-recommendations"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                5. AI-assisted recommendations
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI uses automated systems and artificial
                intelligence to interpret search requests, compare
                options, calculate recommendation scores and produce
                explanatory text.
              </p>

              <p className={paragraphClassName}>
                Information entered into a recommendation request may
                be processed by technology providers that help us
                generate or deliver the response. We aim to provide
                only the information reasonably required for that
                purpose.
              </p>

              <p className={paragraphClassName}>
                Recommendation results are intended to support your
                own research and decision-making. They are not
                guaranteed to be complete, current or suitable for
                every individual. Beacon-AI does not use automated
                processing to make legal or similarly significant
                decisions about you.
              </p>

              <p className={paragraphClassName}>
                Do not enter confidential information, payment-card
                details, passwords or unnecessary sensitive personal
                information into a recommendation request.
              </p>
            </section>

            <section
              id="payments"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                6. Payments and Stripe
              </h2>

              <p className={paragraphClassName}>
                Payments and subscriptions may be processed by
                Stripe. When you make a payment, Stripe may collect
                information such as your name, email address, billing
                address, payment-method details, transaction amount,
                subscription status and applicable tax information.
              </p>

              <p className={paragraphClassName}>
                Complete payment-card details are submitted to and
                handled by Stripe rather than stored directly by
                Beacon-AI. We may receive limited payment
                information, including payment status, transaction
                identifiers, card type, card expiry information,
                billing details, subscription status and fraud or
                dispute information.
              </p>

              <p className={paragraphClassName}>
                Stripe may process personal information as a data
                processor on our behalf and, for some activities, as
                an independent data controller. Stripe&apos;s own
                privacy terms apply to its processing.
              </p>

              <p className={paragraphClassName}>
                Stripe may assist with the calculation, collection or
                reporting of applicable taxes. Beacon-AI remains
                responsible for its own legal, accounting and tax
                obligations except where the law or Stripe&apos;s
                terms provide otherwise.
              </p>
            </section>

            <section
              id="sharing"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                7. Who we share information with
              </h2>

              <p className={paragraphClassName}>
                We do not sell your personal information. We may
                disclose it to the following categories of recipient
                where reasonably necessary:
              </p>

              <ul className={listClassName}>
                <li>
                  Hosting, database, cloud infrastructure and
                  cybersecurity providers.
                </li>

                <li>
                  AI, search, data and recommendation technology
                  providers.
                </li>

                <li>
                  Stripe and other payment, subscription, billing,
                  fraud-prevention or tax-service providers.
                </li>

                <li>
                  Account authentication and email-delivery
                  providers.
                </li>

                <li>
                  Analytics providers where you have consented to
                  optional analytics technologies.
                </li>

                <li>
                  Affiliate networks, retailers, travel providers and
                  other partners when you follow an outbound link.
                </li>

                <li>
                  Professional advisers, including accountants,
                  insurers and legal advisers.
                </li>

                <li>
                  Regulators, courts, law-enforcement agencies,
                  government authorities or other parties where
                  disclosure is legally required.
                </li>

                <li>
                  A buyer, investor or successor if Beacon-AI is
                  reorganised, sold or transferred, subject to
                  appropriate safeguards.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Third-party websites have their own privacy policies.
                Beacon-AI is not responsible for how an external
                website collects or uses information after you leave
                our service.
              </p>
            </section>

            <section
              id="international-transfers"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                8. International data transfers
              </h2>

              <p className={paragraphClassName}>
                Some service providers may process personal
                information outside the United Kingdom. Where UK data
                protection law requires additional protection, we
                seek to use a legally recognised transfer mechanism,
                such as an adequacy regulation, approved contractual
                clauses or another lawful safeguard.
              </p>

              <p className={paragraphClassName}>
                You may contact us for more information about the
                safeguards relevant to your information.
              </p>
            </section>

            <section
              id="retention"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                9. How long we keep information
              </h2>

              <p className={paragraphClassName}>
                We keep personal information only for as long as
                reasonably necessary for the purpose for which it was
                collected, including legal, accounting, tax,
                security, fraud-prevention and dispute-resolution
                requirements.
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-[220px_1fr]">
                  <strong className="text-slate-950">
                    Account information
                  </strong>

                  <span className="text-slate-700">
                    Usually retained while your account remains
                    active and for a reasonable period afterwards.
                  </span>
                </div>

                <div className="grid gap-2 border-b border-slate-200 p-5 sm:grid-cols-[220px_1fr]">
                  <strong className="text-slate-950">
                    Recommendation history
                  </strong>

                  <span className="text-slate-700">
                    Retained while needed to provide history, saved
                    preferences and service improvements, unless
                    deleted earlier.
                  </span>
                </div>

                <div className="grid gap-2 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-[220px_1fr]">
                  <strong className="text-slate-950">
                    Payment records
                  </strong>

                  <span className="text-slate-700">
                    Retained for the period required by applicable
                    tax, accounting and legal rules.
                  </span>
                </div>

                <div className="grid gap-2 border-b border-slate-200 p-5 sm:grid-cols-[220px_1fr]">
                  <strong className="text-slate-950">
                    Support messages
                  </strong>

                  <span className="text-slate-700">
                    Retained while needed to resolve the enquiry and
                    manage related legal or operational issues.
                  </span>
                </div>

                <div className="grid gap-2 bg-slate-50 p-5 sm:grid-cols-[220px_1fr]">
                  <strong className="text-slate-950">
                    Technical logs
                  </strong>

                  <span className="text-slate-700">
                    Retained for a limited period based on security,
                    diagnostic and fraud-prevention requirements.
                  </span>
                </div>
              </div>

              <p className={paragraphClassName}>
                We may anonymise information so it can no longer be
                associated with an identifiable person. Anonymised
                information may be retained for research, statistics
                and service improvement.
              </p>
            </section>

            <section
              id="security"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                10. How we protect information
              </h2>

              <p className={paragraphClassName}>
                We use appropriate technical and organisational
                measures designed to protect personal information
                against unauthorised access, loss, misuse, alteration
                or disclosure. These may include access controls,
                encryption in transit, secure authentication,
                monitoring, backups and restrictions on service
                providers.
              </p>

              <p className={paragraphClassName}>
                No internet service can guarantee absolute security.
                You are responsible for keeping your login
                credentials confidential and for notifying us
                promptly if you believe your account has been
                compromised.
              </p>
            </section>

            <section
              id="rights"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                11. Your data protection rights
              </h2>

              <p className={paragraphClassName}>
                Depending on the circumstances, UK data protection
                law may give you the right to:
              </p>

              <ul className={listClassName}>
                <li>
                  Ask for confirmation that we process your personal
                  information and request a copy.
                </li>

                <li>
                  Ask us to correct inaccurate or incomplete
                  information.
                </li>

                <li>
                  Ask us to erase personal information in certain
                  circumstances.
                </li>

                <li>
                  Ask us to restrict processing in certain
                  circumstances.
                </li>

                <li>
                  Object to processing based on legitimate interests.
                </li>

                <li>
                  Object at any time to the use of your information
                  for direct marketing.
                </li>

                <li>
                  Request the transfer of eligible information in a
                  structured, commonly used and machine-readable
                  format.
                </li>

                <li>
                  Withdraw consent where processing is based on
                  consent.
                </li>

                <li>
                  Ask for information about safeguards used for
                  international transfers.
                </li>

                <li>
                  Complain to the Information Commissioner&apos;s
                  Office.
                </li>
              </ul>

              <p className={paragraphClassName}>
                These rights are not absolute and may be subject to
                legal exceptions. We may need to verify your identity
                before acting on a request. We normally respond within
                the period required by applicable law.
              </p>

              <p className={paragraphClassName}>
                To exercise a right, contact us using the details at
                the end of this policy.
              </p>
            </section>

            <section
              id="cookies"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                12. Cookies and similar technologies
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI may use cookies, local storage and similar
                technologies to keep the website secure, maintain
                sessions, remember choices, understand performance
                and measure website use.
              </p>

              <p className={paragraphClassName}>
                Strictly necessary technologies may operate without
                consent where permitted by law because they are
                required to provide a service you requested or
                maintain security. Optional analytics, advertising
                or personalisation technologies should not be
                activated until the required consent has been given.
              </p>

              <p className={paragraphClassName}>
                You can manage optional technologies through our
                cookie controls and your browser settings. For more
                information, read our{" "}
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
              id="marketing"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                13. Marketing communications
              </h2>

              <p className={paragraphClassName}>
                We may send marketing emails only where permitted by
                law. You can unsubscribe using the link included in a
                marketing email or by contacting us.
              </p>

              <p className={paragraphClassName}>
                Unsubscribing from marketing does not prevent us from
                sending necessary service messages about your
                account, payments, security or changes to the service.
              </p>
            </section>

            <section
              id="affiliate-links"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                14. Affiliate links
              </h2>

              <p className={paragraphClassName}>
                Some Beacon-AI recommendations contain affiliate
                links. If you follow one of these links, the
                destination website or affiliate network may collect
                information about the referral and may use cookies or
                similar technologies.
              </p>

              <p className={paragraphClassName}>
                Beacon-AI may receive a commission if you complete an
                eligible transaction. This does not normally increase
                the price you pay. For further information, read our{" "}
                <Link
                  href="/affiliate-disclosure"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Affiliate Disclosure
                </Link>
                .
              </p>
            </section>

            <section
              id="children"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                15. Children&apos;s information
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI is intended for people aged 18 or over. We
                do not knowingly offer paid memberships directly to
                children or intentionally collect personal
                information from children.
              </p>

              <p className={paragraphClassName}>
                If you believe a child has provided personal
                information to us, contact us so that we can review
                and, where appropriate, delete it.
              </p>
            </section>

            <section
              id="external-links"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                16. External websites
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI links to retailers, travel businesses,
                service providers and other external websites. This
                privacy policy does not govern those websites. Review
                the privacy information provided by an external
                organisation before submitting personal information
                to it.
              </p>
            </section>

            <section
              id="changes"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                17. Changes to this policy
              </h2>

              <p className={paragraphClassName}>
                We may update this policy when our services,
                suppliers, business practices or legal obligations
                change. The latest version will be published on this
                page with an updated revision date.
              </p>

              <p className={paragraphClassName}>
                Where a change materially affects how we use personal
                information, we may provide an additional notice by
                email, through your account or on the website.
              </p>
            </section>

            <section
              id="complaints"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                18. Questions and complaints
              </h2>

              <p className={paragraphClassName}>
                Please contact us first if you have a question or
                concern about how Beacon-AI handles personal
                information. We will investigate and respond as soon
                as reasonably possible.
              </p>

              <p className={paragraphClassName}>
                You also have the right to complain to the UK
                Information Commissioner&apos;s Office. Information
                about making a complaint is available on the
                ICO&apos;s official website.
              </p>
            </section>

            <section
              id="contact"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                19. Contact us
              </h2>

              <p className={paragraphClassName}>
                Contact the Beacon-AI data controller using the
                following details:
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
                </div>
              </address>
            </section>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="font-black text-amber-950">
                Complete before publishing
              </h2>

              <p className="mt-2 leading-7 text-amber-900">
                Replace the legal name, privacy email address and
                postal address at the top of this file. The published
                notice must accurately identify the sole trader who
                operates Beacon-AI and provide working contact
                details.
              </p>
            </div>
          </article>
        </div>

        <BeaconFooter />
      </main>
    </>
  );
}