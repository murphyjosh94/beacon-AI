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
    "beacon-AI",

  contactEmail:
    "Contact@beacon-ai.co.uk",

  postalAddress:
    "Beacon-AI, FREESIA AVENUE, LIVERPOOL, L9 1LD, United Kingdom",
};

const lastUpdated =
  "17 July 2026";

export const metadata: Metadata = {
  title:
    "Cancellation and Refund Policy",

  description:
    "Learn how to cancel Beacon+, request a refund and exercise your statutory rights when purchasing a Beacon-AI subscription.",

  alternates: {
    canonical:
      "/refunds",
  },

  openGraph: {
    type:
      "website",

    url:
      absoluteUrl(
        "/refunds"
      ),

    title:
      "Cancellation and Refund Policy | Beacon AI",

    description:
      "Information about Beacon+ cancellations, renewals, refunds and statutory consumer rights.",

    siteName:
      siteConfig.name,
  },

  twitter: {
    card:
      "summary",

    title:
      "Cancellation and Refund Policy | Beacon AI",

    description:
      "Information about Beacon+ cancellations, renewals and refunds.",
  },

  robots: {
    index:
      true,

    follow:
      true,
  },
};

const refundPageSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "WebPage",

  "@id":
    absoluteUrl(
      "/refunds#webpage"
    ),

  url:
    absoluteUrl(
      "/refunds"
    ),

  name:
    "Cancellation and Refund Policy",

  description:
    "The Beacon-AI Cancellation and Refund Policy.",

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
    "#overview",
    "Overview",
  ],
  [
    "#cancel-subscription",
    "Cancel Beacon+",
  ],
  [
    "#after-cancellation",
    "After cancellation",
  ],
  [
    "#cooling-off",
    "Cooling-off rights",
  ],
  [
    "#immediate-access",
    "Immediate access",
  ],
  [
    "#refund-eligibility",
    "Refund eligibility",
  ],
  [
    "#service-problems",
    "Service problems",
  ],
  [
    "#renewals",
    "Renewals",
  ],
  [
    "#failed-payments",
    "Failed payments",
  ],
  [
    "#third-party-purchases",
    "Third-party purchases",
  ],
  [
    "#request-refund",
    "Request a refund",
  ],
  [
    "#refund-processing",
    "Refund processing",
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

export default function RefundsPage() {
  return (
    <>
      <JsonLd
        data={
          refundPageSchema
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
                Cancellation and Refund Policy
              </span>
            </nav>

            <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
              Billing Information
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Cancellation and Refund Policy
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              This policy explains how to cancel Beacon+, when access
              ends, when a refund may be available and how to contact
              us about a subscription payment.
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
                aria-label="Cancellation and refund policy sections"
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
              id="overview"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                1. Overview
              </h2>

              <p className={paragraphClassName}>
                This policy applies to paid Beacon+ subscriptions
                purchased directly from{" "}
                <strong>
                  {
                    legalDetails.operatorName
                  }
                </strong>
                , trading as Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                Beacon+ is a digital subscription service. The
                subscription price, billing interval, included
                features and renewal arrangements will be shown before
                you complete a purchase.
              </p>

              <p className={paragraphClassName}>
                This policy forms part of our{" "}
                <Link
                  href="/terms"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Terms and Conditions
                </Link>
                . Nothing in this policy excludes or limits rights
                that cannot lawfully be excluded under UK consumer
                law.
              </p>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <h3 className="text-lg font-black text-blue-950">
                  Cancelling and requesting a refund are different
                actions
                </h3>

                <p className="mt-3 leading-7 text-blue-950">
                  Cancelling normally prevents a future renewal. It
                  does not automatically refund a subscription period
                  that has already been paid for. Refund eligibility
                  depends on your statutory rights and the
                  circumstances described below.
                </p>
              </div>
            </section>

            <section
              id="cancel-subscription"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                2. How to cancel Beacon+
              </h2>

              <p className={paragraphClassName}>
                You may cancel a recurring Beacon+ subscription at any
                time before its next renewal.
              </p>

              <p className={paragraphClassName}>
                Depending on the account features available at the
                time, you may cancel by:
              </p>

              <ul className={listClassName}>
                <li>
                  opening your Beacon-AI account settings;
                </li>

                <li>
                  selecting the Beacon+ subscription or billing
                  section;
                </li>

                <li>
                  choosing the option to manage or cancel your
                  subscription;
                </li>

                <li>
                  using the Stripe-hosted customer billing portal; or
                </li>

                <li>
                  contacting us using the details at the end of this
                  policy.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Your cancellation is complete when the billing system
                confirms that the subscription has been cancelled or
                scheduled not to renew.
              </p>

              <p className={paragraphClassName}>
                Please retain the cancellation confirmation for your
                records.
              </p>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="font-black text-amber-950">
                  Deleting an account
                </h3>

                <p className="mt-2 leading-7 text-amber-900">
                  Deleting or abandoning your Beacon-AI account may not
                  automatically cancel an active recurring payment.
                  Complete the subscription cancellation process
                  separately before deleting your account.
                </p>
              </div>
            </section>

            <section
              id="after-cancellation"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                3. What happens after cancellation?
              </h2>

              <p className={paragraphClassName}>
                Unless we tell you otherwise or applicable law requires
                a different outcome, cancellation will take effect at
                the end of the subscription period that has already
                been paid for.
              </p>

              <p className={paragraphClassName}>
                Until that date, you may continue to use the Beacon+
                features included in your plan.
              </p>

              <p className={paragraphClassName}>
                After the subscription ends:
              </p>

              <ul className={listClassName}>
                <li>
                  you will no longer be charged for future renewal
                  periods;
                </li>

                <li>
                  access to paid Beacon+ features may end;
                </li>

                <li>
                  your account may revert to a free service tier, where
                  available;
                </li>

                <li>
                  saved subscription-only features may become
                  unavailable; and
                </li>

                <li>
                  information associated with your account will be
                  handled according to our{" "}
                  <Link
                    href="/privacy"
                    className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                  >
                    Privacy Policy
                  </Link>
                  .
                </li>
              </ul>
            </section>

            <section
              id="cooling-off"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                4. Statutory cooling-off rights
              </h2>

              <p className={paragraphClassName}>
                Consumers who purchase Beacon+ online may have a
                statutory right to cancel within 14 days after the day
                the subscription contract is entered into.
              </p>

              <p className={paragraphClassName}>
                You do not need to use particular wording or provide a
                reason. You must clearly tell us that you have decided
                to cancel.
              </p>

              <p className={paragraphClassName}>
                You may do this by email or through another
                cancellation method made available by Beacon-AI.
              </p>

              <p className={paragraphClassName}>
                The extent of any refund may depend on whether you
                requested immediate access to Beacon+ and how much of
                the service was supplied before you cancelled.
              </p>
            </section>

            <section
              id="immediate-access"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                5. Immediate access during the cancellation period
              </h2>

              <p className={paragraphClassName}>
                Beacon+ is intended to become available shortly after
                payment. At checkout, you may therefore be asked to
                expressly request that the service begins before the
                end of the statutory cancellation period.
              </p>

              <p className={paragraphClassName}>
                Where required, we will also explain the effect that
                requesting immediate performance may have on your
                cancellation and refund rights.
              </p>

              <p className={paragraphClassName}>
                If you cancel after expressly requesting that a service
                begins during the cancellation period, we may be
                entitled to deduct a proportionate amount for the
                service supplied before you notified us of
                cancellation.
              </p>

              <p className={paragraphClassName}>
                We will not apply a deduction where the law does not
                permit one, including where required information or
                consent was not properly obtained.
              </p>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="font-black text-amber-950">
                  Checkout implementation required
                </h3>

                <p className="mt-2 leading-7 text-amber-900">
                  The Beacon+ checkout must accurately explain when
                  service begins and obtain any acknowledgement or
                  express request required for immediate performance.
                  This policy alone is not a substitute for the
                  information and controls shown during checkout.
                </p>
              </div>
            </section>

            <section
              id="refund-eligibility"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                6. When a refund may be available
              </h2>

              <p className={paragraphClassName}>
                You may be entitled to a full or partial refund where:
              </p>

              <ul className={listClassName}>
                <li>
                  you validly exercise a statutory cancellation right;
                </li>

                <li>
                  Beacon+ was not supplied as agreed;
                </li>

                <li>
                  a material paid feature was unavailable for a
                  significant period;
                </li>

                <li>
                  the service was not provided with reasonable care
                  and skill;
                </li>

                <li>
                  the subscription did not match its description;
                </li>

                <li>
                  you were charged after a properly completed
                  cancellation;
                </li>

                <li>
                  you were charged more than once for the same
                  subscription period;
                </li>

                <li>
                  a payment was taken without your authorisation;
                </li>

                <li>
                  we discontinue a prepaid service before the end of
                  the paid period; or
                </li>

                <li>
                  applicable consumer law otherwise requires a refund
                  or price reduction.
                </li>
              </ul>

              <p className={paragraphClassName}>
                We may also issue a discretionary refund where we
                consider it fair and reasonable, even where a refund
                is not legally required.
              </p>

              <p className={paragraphClassName}>
                A discretionary refund in one case does not create an
                automatic entitlement to the same outcome in another
                case.
              </p>
            </section>

            <section
              id="non-refundable"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                7. When a refund will not normally be provided
              </h2>

              <p className={paragraphClassName}>
                Subject to your statutory rights, we will not normally
                provide a refund merely because:
              </p>

              <ul className={listClassName}>
                <li>
                  you forgot to cancel before a clearly disclosed
                  renewal date;
                </li>

                <li>
                  you changed your mind after using the paid service
                  outside an applicable cancellation period;
                </li>

                <li>
                  you did not use the subscription during the paid
                  period;
                </li>

                <li>
                  you no longer need the service;
                </li>

                <li>
                  you failed to cancel through an available
                  cancellation method;
                </li>

                <li>
                  you deleted the app, browser data or account without
                  cancelling the subscription;
                </li>

                <li>
                  a third-party merchant changed the price or
                  availability of a recommended item;
                </li>

                <li>
                  you were dissatisfied with a third-party product or
                  service purchased through an affiliate link; or
                </li>

                <li>
                  an individual recommendation did not lead to the
                  outcome you expected.
                </li>
              </ul>

              <p className={paragraphClassName}>
                These examples do not override rights available under
                consumer law. We will consider the specific facts of
                each request.
              </p>
            </section>

            <section
              id="service-problems"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                8. Problems with Beacon+
              </h2>

              <p className={paragraphClassName}>
                Contact us promptly if Beacon+ is unavailable, does
                not match its description or is not working as
                reasonably expected.
              </p>

              <p className={paragraphClassName}>
                We may first attempt to:
              </p>

              <ul className={listClassName}>
                <li>
                  investigate the problem;
                </li>

                <li>
                  restore access;
                </li>

                <li>
                  repair an affected feature;
                </li>

                <li>
                  provide reasonable troubleshooting instructions;
                </li>

                <li>
                  correct an account or billing error; or
                </li>

                <li>
                  provide an alternative remedy that does not reduce
                  your statutory rights.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Where the issue cannot be resolved within a reasonable
                time or without significant inconvenience, you may be
                entitled to an appropriate price reduction or refund.
              </p>
            </section>

            <section
              id="renewals"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                9. Subscription renewals
              </h2>

              <p className={paragraphClassName}>
                Recurring Beacon+ subscriptions renew at the billing
                interval shown during checkout until cancelled.
              </p>

              <p className={paragraphClassName}>
                Renewal charges will normally be collected using the
                payment method stored with Stripe shortly before or on
                the renewal date.
              </p>

              <p className={paragraphClassName}>
                We will provide renewal information and reminders where
                required by applicable law.
              </p>

              <p className={paragraphClassName}>
                If you cancel before the renewal is processed, you
                should not be charged for the next subscription period.
                Contact us promptly if a payment is collected after a
                cancellation that had already taken effect.
              </p>

              <h3 className={subheadingClassName}>
                Price changes
              </h3>

              <p className={paragraphClassName}>
                If we change the recurring subscription price, we will
                provide any advance notice required by law and explain
                when the new price will apply.
              </p>

              <p className={paragraphClassName}>
                You may cancel before the revised price takes effect.
              </p>
            </section>

            <section
              id="failed-payments"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                10. Failed, disputed and duplicate payments
              </h2>

              <p className={paragraphClassName}>
                If a payment fails, Stripe or Beacon-AI may attempt to
                collect it again or ask you to update your payment
                method.
              </p>

              <p className={paragraphClassName}>
                Beacon+ access may be restricted or suspended while a
                payment remains overdue.
              </p>

              <p className={paragraphClassName}>
                If you believe a charge is unauthorised, duplicated or
                incorrect, contact us as soon as possible with the
                relevant payment details.
              </p>

              <p className={paragraphClassName}>
                You may also have rights through your bank or card
                provider. Starting a payment dispute does not prevent
                you from contacting Beacon-AI, but please tell us if a
                dispute is already open so that we do not process the
                same issue twice.
              </p>
            </section>

            <section
              id="third-party-purchases"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                11. Purchases made through affiliate links
              </h2>

              <p className={paragraphClassName}>
                This policy covers payments made directly to
                Beacon-AI for Beacon+.
              </p>

              <p className={paragraphClassName}>
                It does not govern refunds for products, bookings or
                services purchased from Amazon or another third-party
                merchant through a Beacon-AI recommendation or
                affiliate link.
              </p>

              <p className={paragraphClassName}>
                For a third-party purchase, contact the relevant
                retailer, marketplace, airline, hotel, booking
                platform or service provider.
              </p>

              <p className={paragraphClassName}>
                The third party&apos;s own cancellation, return,
                warranty and refund terms will apply, together with
                any statutory rights you have against that seller.
              </p>

              <p className={paragraphClassName}>
                Read our{" "}
                <Link
                  href="/affiliate-disclosure"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Affiliate Disclosure
                </Link>{" "}
                for more information about these relationships.
              </p>
            </section>

            <section
              id="request-refund"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                12. How to request a refund
              </h2>

              <p className={paragraphClassName}>
                Send your request to{" "}
                <strong>
                  {
                    legalDetails.contactEmail
                  }
                </strong>
                .
              </p>

              <p className={paragraphClassName}>
                To help us investigate efficiently, include:
              </p>

              <ul className={listClassName}>
                <li>
                  your full name;
                </li>

                <li>
                  the email address linked to your Beacon-AI account;
                </li>

                <li>
                  the date and amount of the payment;
                </li>

                <li>
                  the subscription plan involved;
                </li>

                <li>
                  the reason for your request;
                </li>

                <li>
                  the date you attempted to cancel, where relevant;
                  and
                </li>

                <li>
                  any confirmation, invoice or receipt that may help us
                  locate the payment.
                </li>
              </ul>

              <p className={paragraphClassName}>
                Do not send your complete card number, security code,
                password or other sensitive login information.
              </p>

              <p className={paragraphClassName}>
                We may ask for additional information where reasonably
                necessary to verify the account, locate the payment or
                prevent fraud.
              </p>
            </section>

            <section
              id="refund-processing"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                13. How refunds are processed
              </h2>

              <p className={paragraphClassName}>
                Approved refunds will normally be returned to the
                original payment method used for the subscription.
              </p>

              <p className={paragraphClassName}>
                We will process refunds without undue delay and within
                any period required by law.
              </p>

              <p className={paragraphClassName}>
                After Beacon-AI submits a refund, your bank, card
                provider or payment provider may require additional
                time to display the credit in your account.
              </p>

              <p className={paragraphClassName}>
                We do not control the processing time of your financial
                institution.
              </p>

              <p className={paragraphClassName}>
                Where only part of the paid service is refundable, we
                may issue a proportionate refund calculated according
                to the circumstances and applicable law.
              </p>

              <p className={paragraphClassName}>
                We will explain the outcome of your request, including
                any deduction or refusal, unless legal, security or
                fraud-prevention requirements prevent us from
                disclosing particular information.
              </p>
            </section>

            <section
              id="account-data"
              className={
                sectionClassName
              }
            >
              <h2 className={headingClassName}>
                14. Account data after cancellation
              </h2>

              <p className={paragraphClassName}>
                Cancelling Beacon+ does not automatically delete your
                Beacon-AI account or all information associated with
                it.
              </p>

              <p className={paragraphClassName}>
                You may separately request account deletion, subject to
                information that we must retain for legal, accounting,
                fraud-prevention, dispute-resolution or security
                purposes.
              </p>

              <p className={paragraphClassName}>
                Our{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-blue-900 underline decoration-blue-300 underline-offset-4"
                >
                  Privacy Policy
                </Link>{" "}
                explains how long different categories of information
                may be retained.
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
                We may update this policy when our subscription plans,
                payment systems, legal obligations or business
                practices change.
              </p>

              <p className={paragraphClassName}>
                The latest version will be published on this page with
                an updated revision date.
              </p>

              <p className={paragraphClassName}>
                A policy change will not retrospectively remove any
                statutory right or refund entitlement you have already
                acquired.
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
                Contact us if you need help cancelling Beacon+, believe
                a payment is incorrect or wish to request a refund.
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
                Replace the legal contact details and confirm that the
                cancellation instructions match your live Stripe
                customer portal. Ensure checkout clearly states the
                billing interval, renewal terms, immediate service
                start and any effect on statutory cancellation rights.
              </p>
            </div>
          </article>
        </div>

        <BeaconFooter />
      </main>
    </>
  );
}