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

  function update<K extends keyof BeaconBrandKit>(
    key: K,
    value: BeaconBrandKit[K],
  ) {
    setBrandKit((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSave() {
    const saved = saveBrandKit(brandKit);
    setBrandKit(saved);
    setMessage("Brand Kit saved. Beacon Documents will now use these details automatically.");
  }

  if (!loaded) {
    return (
      <section className="px-6 py-20">
        <div className="mx-auto h-96 max-w-7xl animate-pulse rounded-[2rem] bg-white shadow-xl" />
      </section>
    );
  }

  return (
    <>
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/business/dashboard"
            className="font-extrabold text-blue-100 hover:text-white"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-amber-200">
                Beacon Business
              </p>
              <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">
                Brand Kit
              </h1>
              <p className="mt-5 max-w-3xl text-xl leading-9 text-blue-100">
                Store your business identity once and keep every document,
                website and customer message consistent.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="font-extrabold">Brand Kit completion</span>
                <span className="text-2xl font-black text-amber-300">
                  {completion}%
                </span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-amber-300 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
              <h2 className="text-2xl font-black text-slate-950">
                Business details
              </h2>
              <p className="mt-2 text-slate-600">
                These details are inserted into Beacon Documents automatically.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {[
                  ["businessName", "Business name", "text"],
                  ["ownerName", "Owner or representative", "text"],
                  ["email", "Business email", "email"],
                  ["phone", "Phone number", "tel"],
                  ["website", "Website", "text"],
                  ["companyNumber", "Company number", "text"],
                  ["vatNumber", "VAT number", "text"],
                  ["tagline", "Tagline", "text"],
                ].map(([key, label, type]) => (
                  <label key={key} className="block">
                    <span className="text-sm font-extrabold text-slate-800">
                      {label}
                    </span>
                    <input
                      type={type}
                      value={brandKit[key as keyof BeaconBrandKit] as string}
                      onChange={(event) =>
                        update(
                          key as keyof BeaconBrandKit,
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                ))}

                <label className="block sm:col-span-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    Business address
                  </span>
                  <textarea
                    rows={4}
                    value={brandKit.address}
                    onChange={(event) => update("address", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
              <h2 className="text-2xl font-black text-slate-950">
                Visual identity
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    Logo URL
                  </span>
                  <input
                    type="url"
                    value={brandKit.logoUrl}
                    onChange={(event) => update("logoUrl", event.target.value)}
                    placeholder="https://..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-extrabold text-slate-800">
                    Primary colour
                  </span>
                  <div className="mt-2 flex gap-3">
                    <input
                      type="color"
                      value={brandKit.primaryColour}
                      onChange={(event) =>
                        update("primaryColour", event.target.value)
                      }
                      className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1"
                    />
                    <input
                      value={brandKit.primaryColour}
                      onChange={(event) =>
                        update("primaryColour", event.target.value)
                      }
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold uppercase"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-extrabold text-slate-800">
                    Secondary colour
                  </span>
                  <div className="mt-2 flex gap-3">
                    <input
                      type="color"
                      value={brandKit.secondaryColour}
                      onChange={(event) =>
                        update("secondaryColour", event.target.value)
                      }
                      className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1"
                    />
                    <input
                      value={brandKit.secondaryColour}
                      onChange={(event) =>
                        update("secondaryColour", event.target.value)
                      }
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold uppercase"
                    />
                  </div>
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    Brand font
                  </span>
                  <select
                    value={brandKit.fontFamily}
                    onChange={(event) =>
                      update("fontFamily", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none"
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
              type="button"
              onClick={handleSave}
              className="w-full rounded-2xl bg-blue-950 px-7 py-4 text-lg font-extrabold text-white transition hover:bg-blue-900"
            >
              Save Brand Kit
            </button>

            {message ? (
              <div
                role="status"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800"
              >
                {message}
              </div>
            ) : null}
          </div>

          <aside className="xl:sticky xl:top-28 xl:self-start">
            <div
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
              style={{ fontFamily: brandKit.fontFamily }}
            >
              <div
                className="p-7 text-white"
                style={{ backgroundColor: brandKit.primaryColour }}
              >
                {brandKit.logoUrl ? (
                  <img
                    src={brandKit.logoUrl}
                    alt=""
                    className="mb-5 h-16 max-w-full object-contain object-left"
                  />
                ) : (
                  <div
                    className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black"
                    style={{
                      backgroundColor: brandKit.secondaryColour,
                      color: brandKit.primaryColour,
                    }}
                  >
                    {brandKit.businessName.charAt(0).toUpperCase() || "B"}
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
                  style={{ backgroundColor: brandKit.secondaryColour }}
                />
                <p className="mt-6 leading-7 text-slate-600">
                  {brandKit.address || "Business address"}
                </p>
                <div className="mt-5 space-y-2 font-semibold text-slate-800">
                  <p>{brandKit.phone || "Phone number"}</p>
                  <p>{brandKit.email || "Business email"}</p>
                  <p>{brandKit.website || "Website"}</p>
                </div>
              </div>
            </div>

            <Link
              href="/business/templates"
              className="mt-5 flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4 font-extrabold text-blue-950 transition hover:bg-blue-100"
            >
              Open Beacon Documents →
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}