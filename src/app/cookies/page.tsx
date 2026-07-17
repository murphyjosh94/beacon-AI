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
    "Beacon-AI, FREESIA AVENUE,LIVERPOOL, L9 1LD, United Kingdom",
};

const lastUpdated =
  "17 July 2026";

export const metadata: Metadata = {
  title:
    "Cookie Policy",

  description:
    "Learn how Beacon-AI uses cookies and similar technologies for security, account access, preferences, analytics and service functionality.",

  alternates: {
    canonical:
      "/cookies",
  },

  openGraph: {
    type:
      "website",

    url:
      absoluteUrl(
        "/cookies"
      ),

    title:
      "Cookie Policy | Beacon AI",

    description:
      "How Beacon-AI uses cookies and similar technologies.",

    siteName:
      siteConfig.name,
  },

  twitter: {
    card:
      "summary",

    title:
      "Cookie Policy | Beacon AI",

    description:
      "How Beacon-AI uses cookies and similar technologies.",
  },

  robots: {
    index:
      true,

    follow:
      true,
  },
};

const cookiePageSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "WebPage",

  "@id":
    absoluteUrl(
      "/cookies#webpage"
    ),

  url:
    absoluteUrl(
      "/cookies"
    ),

  name:
    "Cookie Policy",

  description:
    "The Beacon-AI Cookie Policy.",

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
    "#about",
    "About this policy",
  ],
  [
    "#what-are-cookies",
    "What cookies are",
  ],
  [
    "#technologies",
    "Technologies we use",
  ],
  [
    "#how-we-use-cookies",
    "How we use them",
  ],
  [
    "#cookie-categories",
    "Cookie categories",
  ],
  [
    "#cookie-inventory",
    "Cookie inventory",
  ],
  [
    "#third-parties",
    "Third parties",
  ],
  [
    "#consent",
    "Consent",
  ],
  [
    "#managing-cookies",
    "Managing cookies",
  ],
  [
    "#disabling-cookies",
    "Disabling cookies",
  ],
  [
    "#retention",
    "Retention",
  ],
  [
    "#changes",
    "Policy changes",
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

type CookieCategoryCardProps = {
  title: string;
  consentRequired: boolean;
  description: string;
  examples: string[];
};

function CookieCategoryCard({
  title,
  consentRequired,
  description,
  examples,
}: CookieCategoryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-black text-slate-950">
          {title}
        </h3>

        <span
          className={
            consentRequired
              ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900"
              : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-900"
          }
        >
          {consentRequired
            ? "Consent required"
            : "Usually essential"}
        </span>
      </div>

      <p className="mt-4 leading-7 text-slate-700">
        {description}
      </p>

      <p className="mt-5 font-black text-slate-950">
        Examples may include:
      </p>

      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-700">
        {examples.map(
          (
            example
          ) => (
            <li
              key={
                example
              }
            >
              {example}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <>
      <JsonLd
        data={
          cookiePageSchema
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
                Cookie Policy
              </span>
            </nav>

            <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
              Legal Information
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Cookie Policy
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              This policy explains how Beacon-AI uses cookies,
              local storage and similar technologies when you use
              our website, recommendation tools, account features
              and Beacon+ services.
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
                aria-label="Cookie policy sections"
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
              id="about"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                1. About this policy
              </h2>

              <p className={paragraphClassName}>
                This Cookie Policy applies to the Beacon-AI website
                and online services operated by{" "}
                <strong>
                  {
                    legalDetails.operatorName
                  }
                </strong>
                , trading as Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                It explains what cookies and similar technologies
                are, why we may use them, when consent is required
                and how you can manage your choices.
              </p>

              <p className={paragraphClassName}>
                This policy should be read alongside our{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Privacy Policy
                </Link>
                , which explains how we use personal information more
                generally.
              </p>
            </section>

            <section
              id="what-are-cookies"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                2. What are cookies?
              </h2>

              <p className={paragraphClassName}>
                A cookie is a small text file stored on your browser
                or device when you visit a website. Cookies can help
                a website recognise a browser, maintain a login
                session, remember settings and understand how the
                service is used.
              </p>

              <p className={paragraphClassName}>
                Some cookies last only until you close your browser.
                These are commonly called session cookies. Others
                remain for a defined period or until you delete them.
                These are commonly called persistent cookies.
              </p>

              <p className={paragraphClassName}>
                Cookies may be placed directly by Beacon-AI or by a
                service provider whose technology is used on the
                website.
              </p>
            </section>

            <section
              id="technologies"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                3. Similar technologies
              </h2>

              <p className={paragraphClassName}>
                This policy also covers technologies that perform
                functions similar to cookies, including:
              </p>

              <ul className={listClassName}>
                <li>
                  browser local storage and session storage;
                </li>

                <li>
                  software development kits;
                </li>

                <li>
                  tracking pixels and web beacons;
                </li>

                <li>
                  device or browser identifiers;
                </li>

                <li>
                  scripts that read or store information on a device;
                  and
                </li>

                <li>
                  similar storage or access technologies introduced
                  in the future.
                </li>
              </ul>

              <p className={paragraphClassName}>
                References to cookies in this policy include these
                similar technologies unless the context requires
                otherwise.
              </p>
            </section>

            <section
              id="how-we-use-cookies"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                4. How Beacon-AI uses cookies
              </h2>

              <p className={paragraphClassName}>
                We may use cookies and similar technologies to:
              </p>

              <ul className={listClassName}>
                <li>
                  keep the website and account systems secure;
                </li>

                <li>
                  authenticate users and maintain login sessions;
                </li>

                <li>
                  prevent fraud, abuse and unauthorised access;
                </li>

                <li>
                  remember cookie-consent choices;
                </li>

                <li>
                  save interface settings and user preferences;
                </li>

                <li>
                  provide Beacon+ account and membership features;
                </li>

                <li>
                  maintain shopping, subscription or checkout
                  sessions;
                </li>

                <li>
                  diagnose errors and monitor technical performance;
                </li>

                <li>
                  understand how visitors use Beacon-AI;
                </li>

                <li>
                  improve navigation, content and recommendations;
                  and
                </li>

                <li>
                  measure the effectiveness of campaigns or affiliate
                  activity where permitted.
                </li>
              </ul>
            </section>

            <section
              id="cookie-categories"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                5. Categories of cookies
              </h2>

              <div className="mt-7 grid gap-6">
                <CookieCategoryCard
                  title="Strictly necessary cookies"
                  consentRequired={
                    false
                  }
                  description="These technologies are required to provide a service you request, maintain security or perform essential website functions. They cannot normally be disabled through our consent controls."
                  examples={[
                    "Maintaining a secure login session.",
                    "Protecting accounts and detecting suspicious activity.",
                    "Balancing traffic and maintaining website availability.",
                    "Remembering the choices made through a cookie banner.",
                    "Completing a checkout or subscription process.",
                  ]}
                />

                <CookieCategoryCard
                  title="Functional cookies"
                  consentRequired={
                    true
                  }
                  description="These technologies remember optional choices and help provide a more personalised experience. Whether consent is required depends on the technology and its purpose."
                  examples={[
                    "Remembering display or interface preferences.",
                    "Saving optional search settings on a device.",
                    "Remembering recently viewed content.",
                    "Supporting non-essential personalisation features.",
                  ]}
                />

                <CookieCategoryCard
                  title="Analytics cookies"
                  consentRequired={
                    true
                  }
                  description="These technologies help us understand how visitors use Beacon-AI, identify errors and improve the service. Where required, they are activated only after you give consent."
                  examples={[
                    "Counting visits and understanding popular pages.",
                    "Measuring navigation paths and feature use.",
                    "Identifying technical errors and slow pages.",
                    "Producing aggregated website-performance reports.",
                  ]}
                />

                <CookieCategoryCard
                  title="Advertising and marketing cookies"
                  consentRequired={
                    true
                  }
                  description="These technologies may be used to measure advertising, limit repeated adverts or understand whether a campaign led to a visit or conversion. Beacon-AI will not activate them without the required consent."
                  examples={[
                    "Measuring campaign referrals.",
                    "Attributing eligible affiliate conversions.",
                    "Limiting how often an advert is displayed.",
                    "Supporting interest-based advertising where introduced.",
                  ]}
                />
              </div>
            </section>

            <section
              id="strictly-necessary"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                6. Strictly necessary technologies
              </h2>

              <p className={paragraphClassName}>
                Some cookies and related technologies are necessary
                for Beacon-AI to work securely or to provide a
                feature you explicitly request.
              </p>

              <p className={paragraphClassName}>
                These technologies may be used without consent where
                an applicable legal exception allows this. We still
                provide information about them and limit their use to
                the relevant essential purpose.
              </p>

              <p className={paragraphClassName}>
                A technology is not treated as strictly necessary
                merely because it is useful to Beacon-AI. Analytics,
                advertising and optional personalisation
                technologies are not classified as essential simply
                because they help us operate or improve the business.
              </p>
            </section>

            <section
              id="analytics"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                7. Analytics
              </h2>

              <p className={paragraphClassName}>
                Beacon-AI may use analytics tools to understand
                website traffic, feature use, errors and general
                performance.
              </p>

              <p className={paragraphClassName}>
                Where analytics involves storing information on, or
                accessing information from, your device and no legal
                exception applies, the analytics technology will be
                optional and should not operate until you consent.
              </p>

              <p className={paragraphClassName}>
                Analytics reports may contain aggregated or
                pseudonymous information such as page views,
                approximate location, device type, browser type,
                referral source and interaction events.
              </p>

              <p className={paragraphClassName}>
                You may refuse analytics cookies without losing
                access to the main Beacon-AI service.
              </p>
            </section>

            <section
              id="cookie-inventory"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                8. Cookie and technology inventory
              </h2>

              <p className={paragraphClassName}>
                The table below must be updated to match the cookies
                and similar technologies actually used in the live
                Beacon-AI service.
              </p>

              <div className="mt-7 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full border-collapse text-left">
                  <thead className="bg-slate-950 text-white">
                    <tr>
                      <th
                        scope="col"
                        className="px-5 py-4 text-sm font-black"
                      >
                        Name
                      </th>

                      <th
                        scope="col"
                        className="px-5 py-4 text-sm font-black"
                      >
                        Provider
                      </th>

                      <th
                        scope="col"
                        className="px-5 py-4 text-sm font-black"
                      >
                        Purpose
                      </th>

                      <th
                        scope="col"
                        className="px-5 py-4 text-sm font-black"
                      >
                        Category
                      </th>

                      <th
                        scope="col"
                        className="px-5 py-4 text-sm font-black"
                      >
                        Duration
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 text-sm leading-6 text-slate-700">
                    <tr className="bg-white">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-950">
                        TODO
                      </td>

                      <td className="px-5 py-4">
                        Beacon-AI
                      </td>

                      <td className="px-5 py-4">
                        Authentication or secure session management.
                      </td>

                      <td className="px-5 py-4">
                        Strictly necessary
                      </td>

                      <td className="px-5 py-4">
                        TODO
                      </td>
                    </tr>

                    <tr className="bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-950">
                        TODO
                      </td>

                      <td className="px-5 py-4">
                        Beacon-AI
                      </td>

                      <td className="px-5 py-4">
                        Remembers cookie and privacy choices.
                      </td>

                      <td className="px-5 py-4">
                        Strictly necessary
                      </td>

                      <td className="px-5 py-4">
                        TODO
                      </td>
                    </tr>

                    <tr className="bg-white">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-950">
                        TODO
                      </td>

                      <td className="px-5 py-4">
                        Stripe
                      </td>

                      <td className="px-5 py-4">
                        Payment security, fraud prevention or checkout
                        functionality.
                      </td>

                      <td className="px-5 py-4">
                        Confirm after implementation review
                      </td>

                      <td className="px-5 py-4">
                        TODO
                      </td>
                    </tr>

                    <tr className="bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-950">
                        TODO
                      </td>

                      <td className="px-5 py-4">
                        TODO: analytics provider
                      </td>

                      <td className="px-5 py-4">
                        Measures website traffic and feature use.
                      </td>

                      <td className="px-5 py-4">
                        Analytics
                      </td>

                      <td className="px-5 py-4">
                        TODO
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="font-black text-amber-950">
                  Implementation check required
                </h3>

                <p className="mt-2 leading-7 text-amber-900">
                  Inspect the live site, authentication provider,
                  Stripe integration, hosting platform, analytics
                  scripts and consent manager before publishing this
                  table. Delete unused placeholder rows and add every
                  cookie, local-storage key, pixel or comparable
                  technology that is actually present.
                </p>
              </div>
            </section>

            <section
              id="third-parties"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                9. Third-party technologies
              </h2>

              <p className={paragraphClassName}>
                Some parts of Beacon-AI may rely on third-party
                providers. Depending on how those services are
                implemented, they may place or read cookies and
                similar technologies.
              </p>

              <h3 className={subheadingClassName}>
                Stripe
              </h3>

              <p className={paragraphClassName}>
                Stripe may use cookies or similar technologies when
                providing checkout, payment security, fraud
                prevention and related services. Some payment
                technologies may be necessary to complete a
                transaction or protect the payment process.
              </p>

              <h3 className={subheadingClassName}>
                Authentication and infrastructure providers
              </h3>

              <p className={paragraphClassName}>
                Account, hosting, database, security and
                infrastructure providers may use technologies needed
                to maintain sessions, prevent abuse, balance traffic
                or provide secure access.
              </p>

              <h3 className={subheadingClassName}>
                Analytics providers
              </h3>

              <p className={paragraphClassName}>
                Analytics providers may receive technical and usage
                information if you consent to the relevant optional
                technologies.
              </p>

              <h3 className={subheadingClassName}>
                Affiliate partners
              </h3>

              <p className={paragraphClassName}>
                Beacon-AI may include links to Amazon and other
                retailers, booking platforms or affiliate partners.
                Clicking an ordinary outbound link may communicate
                referral information to the destination website.
              </p>

              <p className={paragraphClassName}>
                After you leave Beacon-AI, the destination website may
                use its own cookies under its own privacy and cookie
                policies. We do not control cookies placed on a
                third-party website.
              </p>

              <p className={paragraphClassName}>
                Where Beacon-AI embeds third-party content or uses
                conversion-tracking technology on our own pages, we
                will seek any consent required before activating
                non-essential technologies.
              </p>
            </section>

            <section
              id="consent"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                10. Your consent choices
              </h2>

              <p className={paragraphClassName}>
                When consent is required, Beacon-AI should present a
                clear choice before the relevant optional technology
                is activated.
              </p>

              <p className={paragraphClassName}>
                You should be able to accept or reject optional
                categories without being required to accept them as a
                condition of accessing the main service, except where
                a particular optional feature genuinely depends on
                that technology.
              </p>

              <p className={paragraphClassName}>
                Consent must be an active choice. Continuing to browse
                the website, inactivity or the use of a pre-selected
                option is not treated as consent.
              </p>

              <p className={paragraphClassName}>
                You may withdraw consent at any time. Withdrawal does
                not affect the lawfulness of processing that occurred
                before your choice was changed.
              </p>

              <div className="mt-6 rounded-2xl bg-blue-50 p-6">
                <h3 className="font-black text-blue-950">
                  Cookie settings
                </h3>

                <p className="mt-2 leading-7 text-blue-950">
                  Use the “Cookie settings” control in the website
                  footer or cookie banner to review and update your
                  optional cookie choices.
                </p>

                <p className="mt-3 text-sm font-bold text-blue-900">
                  TODO: Confirm that a working cookie-settings control
                  is available before publishing this statement.
                </p>
              </div>
            </section>

            <section
              id="managing-cookies"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                11. Managing cookies in your browser
              </h2>

              <p className={paragraphClassName}>
                Most browsers allow you to view, delete or block
                cookies. The available controls differ between
                browsers and devices.
              </p>

              <p className={paragraphClassName}>
                Browser controls may allow you to:
              </p>

              <ul className={listClassName}>
                <li>
                  delete cookies already stored on your device;
                </li>

                <li>
                  block all cookies or third-party cookies;
                </li>

                <li>
                  allow cookies only for selected websites;
                </li>

                <li>
                  receive a warning before a cookie is stored; or
                </li>

                <li>
                  clear local storage and other site data.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Blocking cookies through your browser does not
                necessarily prevent every form of device storage or
                tracking. You may also need to use Beacon-AI&apos;s
                consent controls or the settings offered by the
                relevant third-party provider.
              </p>
            </section>

            <section
              id="disabling-cookies"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                12. What happens when cookies are disabled?
              </h2>

              <p className={paragraphClassName}>
                You can reject optional cookies without losing access
                to the main Beacon-AI website. However, blocking
                strictly necessary technologies through your browser
                may prevent parts of the service from working
                correctly.
              </p>

              <p className={paragraphClassName}>
                Depending on the technology blocked:
              </p>

              <ul className={listClassName}>
                <li>
                  you may be unable to sign in or remain signed in;
                </li>

                <li>
                  account-security checks may fail;
                </li>

                <li>
                  checkout or subscription payments may not work;
                </li>

                <li>
                  Beacon+ account features may become unavailable;
                </li>

                <li>
                  preferences stored on your device may be lost;
                </li>

                <li>
                  cookie choices may need to be entered again; or
                </li>

                <li>
                  some embedded or personalised features may not
                  appear.
                </li>
              </ul>
            </section>

            <section
              id="retention"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                13. How long cookies remain
              </h2>

              <p className={paragraphClassName}>
                The duration of a cookie depends on its purpose. A
                session cookie normally expires when the browser is
                closed. A persistent cookie remains until its stated
                expiry date, until it is replaced or until you delete
                it.
              </p>

              <p className={paragraphClassName}>
                We aim to use retention periods that are proportionate
                to the relevant purpose. The specific durations of
                technologies used by Beacon-AI should be listed in the
                cookie inventory above.
              </p>

              <p className={paragraphClassName}>
                Some information produced through a cookie, such as a
                security log or aggregated analytics report, may be
                retained separately from the cookie itself. That
                information is handled according to our{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section
              id="do-not-track"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                14. Browser privacy signals
              </h2>

              <p className={paragraphClassName}>
                Some browsers send privacy signals such as “Do Not
                Track.” There is not always a consistent technical or
                legal standard for interpreting every signal.
              </p>

              <p className={paragraphClassName}>
                Beacon-AI will continue to review recognised privacy
                signals and will respond where required by applicable
                law or supported by our consent technology.
              </p>
            </section>

            <section
              id="changes"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                15. Changes to this policy
              </h2>

              <p className={paragraphClassName}>
                We may update this Cookie Policy when our technology,
                providers, legal obligations or business practices
                change.
              </p>

              <p className={paragraphClassName}>
                The latest version will be published on this page
                with an updated revision date.
              </p>

              <p className={paragraphClassName}>
                Where a change affects an existing consent choice, we
                may ask you to review or renew that choice.
              </p>
            </section>

            <section
              id="contact"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                16. Contact us
              </h2>

              <p className={paragraphClassName}>
                Contact us if you have questions about cookies,
                consent choices or the technologies used by
                Beacon-AI.
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
                Replace the legal contact details, complete the
                cookie inventory and confirm that Beacon-AI has a
                working consent banner and permanent cookie-settings
                control. Optional analytics, advertising and
                personalisation scripts must remain blocked until the
                required consent is received.
              </p>
            </div>
          </article>
        </div>

        <BeaconFooter />
      </main>
    </>
  );
}