"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  emptyBrandKit,
  loadBrandKit,
  saveBrandKit,
  type BeaconBrandKit,
} from "@/lib/business/brand-kit/brandKit";

const fontOptions = [
  "Inter",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
];

const DETAIL_FIELDS: Array<{
  key: keyof BeaconBrandKit;
  label: string;
  type: string;
  placeholder?: string;
}> = [
  {
    key: "businessName",
    label: "Business name",
    type: "text",
    placeholder: "Beacon Electrical Ltd",
  },
  {
    key: "ownerName",
    label: "Owner or representative",
    type: "text",
    placeholder: "Jordan Smith",
  },
  {
    key: "email",
    label: "Business email",
    type: "email",
    placeholder: "hello@example.co.uk",
  },
  {
    key: "phone",
    label: "Phone number",
    type: "tel",
    placeholder: "0151 000 0000",
  },
  {
    key: "website",
    label: "Website",
    type: "url",
    placeholder: "https://example.co.uk",
  },
  {
    key: "companyNumber",
    label: "Company number",
    type: "text",
    placeholder: "12345678",
  },
  {
    key: "vatNumber",
    label: "VAT number",
    type: "text",
    placeholder: "GB123456789",
  },
  {
    key: "tagline",
    label: "Tagline",
    type: "text",
    placeholder: "Reliable service. Local expertise.",
  },
];

function validHexColour(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export default function BrandKitClient() {
  const [brandKit, setBrandKit] = useState<BeaconBrandKit>(emptyBrandKit);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setBrandKit(loadBrandKit());
    setLoaded(true);
  }, []);

  const completion = useMemo(() => {
    const important = [
      brandKit.businessName,
      brandKit.email,
      brandKit.phone,
      brandKit.address,
      brandKit.website,
      brandKit.primaryColour,
      brandKit.secondaryColour,
    ];

    const completed = important.filter((value) => value.trim()).length;
    return Math.round((completed / important.length) * 100);
  }, [brandKit]);

  const nextStep = useMemo(() => {
    if (!brandKit.businessName.trim()) {
      return "Add your business name so Beacon can personalise documents, websites and customer communications.";
    }

    if (!brandKit.email.trim() || !brandKit.phone.trim()) {
      return "Add your contact details so Beacon can place them consistently across every business tool.";
    }

    if (!brandKit.address.trim() || !brandKit.website.trim()) {
      return "Complete your business address and website details to finish the core company profile.";
    }

    if (!brandKit.logoUrl.trim()) {
      return "Add your logo URL to complete the visual identity shown across websites and documents.";
    }

    return "Your Brand Kit is ready. Save any final changes before using it across Beacon Business.";
  }, [brandKit]);

  function update<K extends keyof BeaconBrandKit>(
    key: K,
    value: BeaconBrandKit[K],
  ) {
    setBrandKit((current) => ({
      ...current,
      [key]: value,
    }));

    if (message) {
      setMessage("");
    }
  }

  function handleSave() {
    const saved = saveBrandKit(brandKit);
    setBrandKit(saved);
    setMessage(
      "Brand Kit saved successfully. Your website, templates and documents will now use your updated branding.",
    );
  }

  const previewPrimary = validHexColour(
    brandKit.primaryColour,
    emptyBrandKit.primaryColour,
  );
  const previewSecondary = validHexColour(
    brandKit.secondaryColour,
    emptyBrandKit.secondaryColour,
  );

  if (!loaded) {
    return (
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-8">
          <div className="h-20 rounded-2xl bg-white" />
          <div className="h-72 rounded-[2rem] bg-slate-200" />
          <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
            <div className="h-[720px] rounded-[2rem] bg-white" />
            <div className="h-[520px] rounded-[2rem] bg-white" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm font-bold text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  className="rounded transition hover:text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  href="/business/dashboard"
                >
                  Business
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-800">Brand Kit</li>
            </ol>
          </nav>
        </div>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:items-end lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-900">
              <span aria-hidden="true">🎨</span>
              Beacon Brand Kit
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Keep your business identity consistent
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Store your logo, colours and business details once, then reuse
              them across Beacon websites, templates and customer documents.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="font-extrabold text-slate-800">
                Brand Kit completion
              </span>
              <span className="text-2xl font-black text-blue-950">
                {completion}%
              </span>
            </div>

            <div
              aria-label={`Brand Kit ${completion}% complete`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={completion}
              className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-blue-950 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">
                Next step
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{nextStep}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">
                  Company profile
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Business details
                </h2>
                <p className="mt-2 text-slate-600">
                  Beacon inserts these details automatically into supported
                  documents, pages and customer communications.
                </p>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {DETAIL_FIELDS.map(({ key, label, type, placeholder }) => (
                  <label className="block" key={key}>
                    <span className="text-sm font-extrabold text-slate-800">
                      {label}
                    </span>
                    <input
                      autoComplete={
                        key === "email"
                          ? "email"
                          : key === "phone"
                            ? "tel"
                            : key === "businessName"
                              ? "organization"
                              : key === "website"
                                ? "url"
                                : undefined
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        update(key, event.target.value as BeaconBrandKit[typeof key])
                      }
                      placeholder={placeholder}
                      type={type}
                      value={brandKit[key] as string}
                    />
                  </label>
                ))}

                <label className="block sm:col-span-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    Business address
                  </span>
                  <textarea
                    autoComplete="street-address"
                    className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => update("address", event.target.value)}
                    placeholder="Business address, town or city, postcode"
                    rows={4}
                    value={brandKit.address}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">
                  Brand styling
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Visual identity
                </h2>
                <p className="mt-2 text-slate-600">
                  Set the logo, colours and font Beacon should use when creating
                  branded material.
                </p>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    Logo URL
                  </span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => update("logoUrl", event.target.value)}
                    placeholder="https://example.co.uk/logo.png"
                    type="url"
                    value={brandKit.logoUrl}
                  />
                  <span className="mt-2 block text-sm leading-6 text-slate-500">
                    Use a direct image address ending in .png, .jpg, .webp or
                    .svg for the most reliable preview.
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-extrabold text-slate-800">
                    Primary colour
                  </span>
                  <div className="mt-2 flex gap-3">
                    <input
                      aria-label="Choose primary brand colour"
                      className="h-12 w-16 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                      onChange={(event) =>
                        update("primaryColour", event.target.value)
                      }
                      type="color"
                      value={previewPrimary}
                    />
                    <input
                      aria-label="Primary colour hex value"
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold uppercase outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        update("primaryColour", event.target.value)
                      }
                      placeholder="#0F172A"
                      value={brandKit.primaryColour}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-extrabold text-slate-800">
                    Secondary colour
                  </span>
                  <div className="mt-2 flex gap-3">
                    <input
                      aria-label="Choose secondary brand colour"
                      className="h-12 w-16 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                      onChange={(event) =>
                        update("secondaryColour", event.target.value)
                      }
                      type="color"
                      value={previewSecondary}
                    />
                    <input
                      aria-label="Secondary colour hex value"
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold uppercase outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        update("secondaryColour", event.target.value)
                      }
                      placeholder="#FBBF24"
                      value={brandKit.secondaryColour}
                    />
                  </div>
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    Brand font
                  </span>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    onChange={(event) =>
                      update("fontFamily", event.target.value)
                    }
                    value={brandKit.fontFamily}
                  >
                    {fontOptions.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <button
              className="w-full rounded-2xl bg-blue-950 px-7 py-4 text-lg font-extrabold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200"
              onClick={handleSave}
              type="button"
            >
              Save Brand Kit
            </button>

            {message ? (
              <div
                aria-live="polite"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900"
                role="status"
              >
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-200 font-black"
                  >
                    ✓
                  </span>
                  <div>
                    <p className="font-extrabold">
                      Brand Kit saved successfully
                    </p>
                    <p className="mt-1 leading-6">{message}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="xl:sticky xl:top-28 xl:self-start">
            <div
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl"
              style={{ fontFamily: brandKit.fontFamily }}
            >
              <div
                className="p-7 text-white"
                style={{ backgroundColor: previewPrimary }}
              >
                {brandKit.logoUrl ? (
                  <img
                    alt={`${brandKit.businessName || "Business"} logo`}
                    className="mb-5 h-16 max-w-full object-contain object-left"
                    loading="lazy"
                    src={brandKit.logoUrl}
                  />
                ) : (
                  <div>
                    <div
                      aria-hidden="true"
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black"
                      style={{
                        backgroundColor: previewSecondary,
                        color: previewPrimary,
                      }}
                    >
                      {brandKit.businessName.charAt(0).toUpperCase() || "B"}
                    </div>
                    <p className="mb-5 text-sm font-semibold text-white/75">
                      No logo uploaded yet
                    </p>
                  </div>
                )}

                <p className="text-sm font-bold uppercase tracking-[0.2em] opacity-80">
                  Brand preview
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  {brandKit.businessName || "Your Business"}
                </h2>
                <p className="mt-2 opacity-85">
                  {brandKit.tagline || "Your business tagline"}
                </p>
              </div>

              <div className="p-7">
                <div
                  className="h-2 w-24 rounded-full"
                  style={{ backgroundColor: previewSecondary }}
                />
                <p className="mt-6 leading-7 text-slate-600">
                  {brandKit.address || "Business address"}
                </p>
                <div className="mt-5 space-y-2 break-words font-semibold text-slate-800">
                  <p>{brandKit.phone || "Phone number"}</p>
                  <p>{brandKit.email || "Business email"}</p>
                  <p>{brandKit.website || "Website"}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
                Used across
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {["Website", "Quote", "Document", "Customer message"].map(
                  (item) => (
                    <div
                      className="rounded-xl bg-slate-50 px-3 py-3 text-center text-sm font-extrabold text-slate-700"
                      key={item}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>

            <Link
              className="mt-5 flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4 font-extrabold text-blue-950 transition hover:border-blue-400 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
              href="/business/templates"
            >
              Open Beacon Documents →
            </Link>
          </aside>
        </div>

        <section className="mx-auto mt-10 grid max-w-7xl gap-6 pb-10 md:grid-cols-3">
          {[
            {
              href: "/business/website",
              eyebrow: "Related tool",
              title: "Website Builder",
              description:
                "Apply your colours, logo and business details to your generated website.",
            },
            {
              href: "/business/templates",
              eyebrow: "Related tool",
              title: "Template Library",
              description:
                "Create consistent business documents using your saved Brand Kit.",
            },
            {
              href: "/business/analytics",
              eyebrow: "Related tool",
              title: "Business Analytics",
              description:
                "Review how your Beacon Business tools and customer activity are performing.",
            },
          ].map((item) => (
            <Link
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
              href={item.href}
              key={item.href}
            >
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">
                {item.eyebrow}
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">
                {item.title}
              </h2>
              <p className="mt-2 leading-7 text-slate-600">
                {item.description}
              </p>
            </Link>
          ))}
        </section>
      </section>
    </>
  );
}