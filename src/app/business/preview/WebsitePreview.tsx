"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PackageId = "starter" | "business" | "premium";

type BriefData = {
  businessName: string;
  businessType: string;
  businessDescription: string;
  yearsTrading: string;
  serviceArea: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  primaryColour: string;
  secondaryColour: string;
  styleDirection: string;
  services: string;
  idealCustomer: string;
  keyMessage: string;
  callToAction: string;
  socialLinks: string;
  packageId: PackageId;
  chatbot: boolean;
  onlineShop: boolean;
  membershipArea: boolean;
  notes: string;
  submittedAt?: string;
};

const STORAGE_KEY = "beacon-business-website-brief";

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function WebsitePreview() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      setLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as BriefData;
      setBrief(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  const services = useMemo(
    () => (brief ? splitLines(brief.services) : []),
    [brief]
  );

  if (!loaded) {
    return (
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl animate-pulse rounded-[2rem] bg-white p-10 shadow-xl">
          <div className="h-8 w-56 rounded bg-slate-200" />
          <div className="mt-6 h-[560px] rounded-[2rem] bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!brief) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-2xl">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 text-3xl">
            🖥️
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
            Website Preview
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Create your website brief first.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Beacon needs your business details, design direction and services
            before it can prepare an interactive preview.
          </p>

          <Link
            href="/business/website"
            className="mt-8 inline-flex rounded-2xl bg-blue-950 px-8 py-4 font-extrabold text-white transition hover:bg-blue-900"
          >
            Create my website brief
          </Link>
        </div>
      </section>
    );
  }

  const primary = brief.primaryColour || "#0f3d91";
  const secondary = brief.secondaryColour || "#d4af37";
  const initials = getInitials(brief.businessName || "Business");
  const businessName = brief.businessName || "Your Business";
  const businessType = brief.businessType || "Professional local services";
  const keyMessage =
    brief.keyMessage ||
    "Reliable, professional service built around your needs.";
  const callToAction = brief.callToAction || "Request a quote";

  return (
    <>
      <section className="border-b border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-900">
              Beacon Business Preview
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {businessName}
            </h1>

            <p className="mt-2 text-slate-600">
              Interactive preview generated from your saved website brief.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="inline-flex rounded-2xl border border-slate-300 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`rounded-xl px-5 py-2 font-extrabold transition ${
                  device === "desktop"
                    ? "bg-white text-blue-950 shadow"
                    : "text-slate-600"
                }`}
              >
                Desktop
              </button>

              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`rounded-xl px-5 py-2 font-extrabold transition ${
                  device === "mobile"
                    ? "bg-white text-blue-950 shadow"
                    : "text-slate-600"
                }`}
              >
                Mobile
              </button>
            </div>

            <Link
              href="/business/website"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
            >
              Edit brief
            </Link>

            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900"
            >
              Business dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div
            className={`mx-auto overflow-hidden rounded-[2rem] border border-slate-300 bg-white shadow-2xl transition-all ${
              device === "mobile" ? "max-w-[430px]" : "max-w-full"
            }`}
          >
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="h-3 w-3 rounded-full bg-slate-300" />

              <div className="ml-2 flex-1 rounded-full bg-white px-4 py-2 text-center text-xs font-bold text-slate-500">
                {brief.website || `${businessName.toLowerCase().replace(/\s+/g, "-")}.co.uk`}
              </div>
            </div>

            <div className="bg-white">
              <header
                className={`flex items-center justify-between gap-5 border-b border-black/10 px-5 py-4 ${
                  device === "mobile" ? "flex-wrap" : "px-8"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl font-black text-white"
                    style={{ backgroundColor: primary }}
                  >
                    {initials}
                  </span>

                  <div>
                    <p className="font-black text-slate-950">{businessName}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {businessType}
                    </p>
                  </div>
                </div>

                {device === "desktop" ? (
                  <nav className="flex items-center gap-6 text-sm font-extrabold text-slate-700">
                    <a href="#preview-about">About</a>
                    <a href="#preview-services">Services</a>
                    <a href="#preview-contact">Contact</a>
                  </nav>
                ) : (
                  <span className="text-2xl text-slate-700">☰</span>
                )}
              </header>

              <section
                className={`relative overflow-hidden px-6 py-16 text-white ${
                  device === "desktop" ? "px-12 py-24" : ""
                }`}
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                }}
              >
                <div className="relative z-10 max-w-3xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-white/80">
                    {brief.serviceArea || "Serving your local area"}
                  </p>

                  <h2
                    className={`mt-5 font-black tracking-tight ${
                      device === "desktop"
                        ? "text-6xl leading-tight"
                        : "text-4xl leading-tight"
                    }`}
                  >
                    {keyMessage}
                  </h2>

                  <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
                    {brief.businessDescription ||
                      "Professional service, clear communication and work completed with care."}
                  </p>

                  <div
                    className={`mt-8 flex gap-3 ${
                      device === "mobile" ? "flex-col" : "flex-row"
                    }`}
                  >
                    <a
                      href="#preview-contact"
                      className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 font-extrabold shadow-lg"
                      style={{ color: primary }}
                    >
                      {callToAction}
                    </a>

                    <a
                      href={`tel:${brief.phone}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-6 py-4 font-extrabold text-white backdrop-blur"
                    >
                      {brief.phone || "Call us"}
                    </a>
                  </div>
                </div>

                <div
                  aria-hidden="true"
                  className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"
                />
              </section>

              <section
                id="preview-about"
                className={`grid gap-8 px-6 py-14 ${
                  device === "desktop"
                    ? "grid-cols-[1.1fr_0.9fr] px-12 py-20"
                    : ""
                }`}
              >
                <div>
                  <p
                    className="text-sm font-extrabold uppercase tracking-[0.22em]"
                    style={{ color: primary }}
                  >
                    About Us
                  </p>

                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                    Professional service you can rely on.
                  </h3>

                  <p className="mt-5 leading-8 text-slate-600">
                    {brief.businessDescription ||
                      "We provide dependable, professional services built around the needs of every customer."}
                  </p>

                  {brief.yearsTrading ? (
                    <p className="mt-5 font-extrabold text-slate-900">
                      Trading for {brief.yearsTrading}
                    </p>
                  ) : null}
                </div>

                <div
                  className="rounded-[2rem] p-7 text-white"
                  style={{ backgroundColor: primary }}
                >
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-white/75">
                    Why choose us
                  </p>

                  <ul className="mt-5 space-y-4 font-bold">
                    <li>✓ Clear and honest communication</li>
                    <li>✓ Professional local service</li>
                    <li>✓ Customer-focused approach</li>
                    <li>✓ Reliable support from enquiry to completion</li>
                  </ul>
                </div>
              </section>

              <section
                id="preview-services"
                className={`bg-slate-50 px-6 py-14 ${
                  device === "desktop" ? "px-12 py-20" : ""
                }`}
              >
                <div className="text-center">
                  <p
                    className="text-sm font-extrabold uppercase tracking-[0.22em]"
                    style={{ color: primary }}
                  >
                    Our Services
                  </p>

                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                    How we can help.
                  </h3>
                </div>

                <div
                  className={`mt-10 grid gap-5 ${
                    device === "desktop" ? "grid-cols-3" : "grid-cols-1"
                  }`}
                >
                  {(services.length
                    ? services
                    : [
                        "Professional service",
                        "Customer support",
                        "Local expertise",
                      ]
                  )
                    .slice(0, 6)
                    .map((service, index) => (
                      <article
                        key={`${service}-${index}`}
                        className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
                      >
                        <span
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl font-black text-white"
                          style={{ backgroundColor: primary }}
                        >
                          {index + 1}
                        </span>

                        <h4 className="mt-5 text-xl font-black text-slate-950">
                          {service}
                        </h4>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          Professional service delivered with care, clear
                          communication and attention to detail.
                        </p>
                      </article>
                    ))}
                </div>
              </section>

              <section
                id="preview-contact"
                className={`px-6 py-14 ${
                  device === "desktop"
                    ? "grid grid-cols-[0.9fr_1.1fr] gap-10 px-12 py-20"
                    : ""
                }`}
              >
                <div>
                  <p
                    className="text-sm font-extrabold uppercase tracking-[0.22em]"
                    style={{ color: primary }}
                  >
                    Contact Us
                  </p>

                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                    Ready to get started?
                  </h3>

                  <p className="mt-5 leading-8 text-slate-600">
                    Contact {businessName} today to discuss your requirements
                    and request a clear, no-obligation quote.
                  </p>

                  <div className="mt-7 space-y-3 text-sm font-bold text-slate-700">
                    <p>📞 {brief.phone || "Telephone number"}</p>
                    <p>✉️ {brief.email || "Email address"}</p>
                    <p>📍 {brief.serviceArea || "Service area"}</p>
                  </div>
                </div>

                <form
                  onSubmit={(event) => event.preventDefault()}
                  className={`rounded-[2rem] bg-slate-50 p-6 ${
                    device === "mobile" ? "mt-8" : ""
                  }`}
                >
                  <div className="grid gap-4">
                    <input
                      type="text"
                      placeholder="Your name"
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                    />

                    <input
                      type="email"
                      placeholder="Your email"
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                    />

                    <textarea
                      rows={5}
                      placeholder="How can we help?"
                      className="resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                    />

                    <button
                      type="submit"
                      className="rounded-2xl px-6 py-4 font-extrabold text-white"
                      style={{ backgroundColor: primary }}
                    >
                      {callToAction}
                    </button>
                  </div>
                </form>
              </section>

              <footer
                className={`flex gap-4 border-t border-slate-200 bg-white px-6 py-6 text-sm text-slate-500 ${
                  device === "desktop"
                    ? "items-center justify-between px-12"
                    : "flex-col"
                }`}
              >
                <p>
                  © {new Date().getFullYear()} {businessName}. All rights
                  reserved.
                </p>

                <p className="font-semibold">
                  Website by Beacon Business
                </p>
              </footer>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-[2rem] border border-blue-200 bg-blue-50 p-6">
            <p className="font-black text-blue-950">
              This is an interactive concept preview.
            </p>

            <p className="mt-2 leading-7 text-blue-900">
              Final copy, imagery, forms, integrations, accessibility checks
              and technical optimisation are completed during the professional
              build after approval and payment.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}