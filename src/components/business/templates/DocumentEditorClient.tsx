"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getTemplateDefinition,
  type BusinessDetails,
  type TemplateDefinition,
} from "@/lib/business/templates/templateDefinitions";
import {
  BRAND_KIT_STORAGE_KEY,
  loadBrandKit,
} from "@/lib/business/brand-kit/brandKit";

type Props = {
  templateSlug: string;
};

const emptyBusiness: BusinessDetails = {
  businessName: "",
  ownerName: "",
  address: "",
  email: "",
  phone: "",
  website: "",
  companyNumber: "",
  vatNumber: "",
};

const improvementOptions = [
  { id: "professional", label: "More professional" },
  { id: "plain", label: "Plain English" },
  { id: "friendly", label: "Friendlier" },
  { id: "shorter", label: "Shorter" },
  { id: "expand", label: "Add useful detail" },
  { id: "grammar", label: "Improve grammar" },
  { id: "uk", label: "Use UK English" },
];

function storageKey(slug: string) {
  return `beacon-document-draft:${slug}`;
}

function requireTemplateDefinition(slug: string): TemplateDefinition {
  const template = getTemplateDefinition(slug);

  if (!template) {
    throw new Error(`Unknown Beacon document template: ${slug}`);
  }

  return template;
}

export default function DocumentEditorClient({ templateSlug }: Props) {
  const template = requireTemplateDefinition(templateSlug);

  const [business, setBusiness] = useState<BusinessDetails>(emptyBusiness);
  const [values, setValues] = useState<Record<string, string>>({});
  const [document, setDocument] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [message, setMessage] = useState("");

  const requiredComplete = useMemo(
    () =>
      template.fields
        .filter((field) => field.required)
        .every((field) => values[field.id]?.trim()),
    [template.fields, values],
  );

  useEffect(() => {
    const applyBrandKit = () => {
      const kit = loadBrandKit();

      setBusiness({
        businessName: kit.businessName,
        ownerName: kit.ownerName,
        address: kit.address,
        email: kit.email,
        phone: kit.phone,
        website: kit.website,
        companyNumber: kit.companyNumber,
        vatNumber: kit.vatNumber,
      });
    };

    applyBrandKit();

    try {
      const raw = window.localStorage.getItem(storageKey(template.slug));

      if (raw) {
        const parsed = JSON.parse(raw) as {
          business?: BusinessDetails;
          values?: Record<string, string>;
          document?: string;
          savedAt?: string;
        };

        if (parsed.business) {
          setBusiness((current) => ({
            ...current,
            ...parsed.business,
          }));
        }

        if (parsed.values) setValues(parsed.values);
        if (parsed.document) setDocument(parsed.document);
        if (parsed.savedAt) setSavedAt(parsed.savedAt);
      }
    } catch {
      setMessage("The previous local draft could not be restored.");
    }

    const handleBrandKitUpdate = () => applyBrandKit();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BRAND_KIT_STORAGE_KEY) {
        applyBrandKit();
      }
    };

    window.addEventListener(
      "beacon-brand-kit-updated",
      handleBrandKitUpdate,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "beacon-brand-kit-updated",
        handleBrandKitUpdate,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [template.slug]);

  useEffect(() => {
    if (!document && Object.keys(values).length === 0) return;

    const timeout = window.setTimeout(() => {
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(
        storageKey(template.slug),
        JSON.stringify({ business, values, document, savedAt: timestamp }),
      );
      setSavedAt(timestamp);
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [business, document, template.slug, values]);

  function generateDocument() {
    if (!requiredComplete) {
      setMessage("Complete the required fields before creating the first draft.");
      return;
    }

    setDocument(template.buildDocument(values, business));
    setMessage("First draft created. You can edit every line.");
  }

  async function improveDocument(style: string) {
    if (!document.trim()) {
      setMessage("Create or write a document before using Beacon AI.");
      return;
    }

    setImproving(true);
    setMessage("");

    try {
      const response = await fetch("/api/business/templates/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document,
          instruction: style,
          templateTitle: template.title,
        }),
      });

      const result = (await response.json()) as {
        document?: string;
        error?: string;
      };

      if (!response.ok || !result.document) {
        throw new Error(result.error || "Beacon AI could not improve the document.");
      }

      setDocument(result.document);
      setMessage("Beacon AI has improved the document.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Beacon AI could not improve the document.",
      );
    } finally {
      setImproving(false);
    }
  }

  async function copyDocument() {
    if (!document.trim()) return;
    await navigator.clipboard.writeText(document);
    setMessage("Document copied to your clipboard.");
  }

  function downloadText() {
    if (!document.trim()) return;

    const blob = new Blob([document], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${template.slug}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Document downloaded.");
  }

  function clearDraft() {
    if (!window.confirm("Clear this document and its saved local draft?")) return;

    window.localStorage.removeItem(storageKey(template.slug));
    setBusiness(emptyBusiness);
    setValues({});
    setDocument("");
    setSavedAt(null);
    setMessage("Draft cleared.");
  }

  return (
    <>
      <section className="border-b border-slate-200 bg-white px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/business/templates"
            className="inline-flex items-center font-extrabold text-blue-900 hover:text-blue-700"
          >
            ← Back to Beacon Documents
          </Link>

          <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-900">
                {template.category} document
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {template.title}
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                {template.description}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-600">
              {savedAt
                ? `Saved locally ${new Date(savedAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Your draft saves automatically on this device"}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                    Brand Kit
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Business details
                  </h2>
                </div>
                <span aria-hidden="true" className="text-3xl">
                  🎨
                </span>
              </div>

              <p className="mt-3 leading-7 text-slate-600">
                These details are loaded from your Beacon Brand Kit. Changes made here apply to this document draft only.
              </p>
              <Link
                href="/business/brand-kit"
                className="mt-4 inline-flex font-extrabold text-blue-900 hover:text-blue-700"
              >
                Manage Brand Kit →
              </Link>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {[
                  ["businessName", "Business name", "text"],
                  ["ownerName", "Owner or representative", "text"],
                  ["email", "Business email", "email"],
                  ["phone", "Phone", "tel"],
                  ["website", "Website", "text"],
                  ["companyNumber", "Company number", "text"],
                  ["vatNumber", "VAT number", "text"],
                ].map(([id, label, type]) => (
                  <label key={id} className="block">
                    <span className="text-sm font-extrabold text-slate-800">
                      {label}
                    </span>
                    <input
                      type={type}
                      value={business[id as keyof BusinessDetails]}
                      onChange={(event) =>
                        setBusiness((current) => ({
                          ...current,
                          [id]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                ))}

                <label className="block sm:col-span-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    Business address
                  </span>
                  <textarea
                    rows={3}
                    value={business.address}
                    onChange={(event) =>
                      setBusiness((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                  Document details
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Tell Beacon what to include
                </h2>
              </div>

              <div className="mt-6 space-y-5">
                {template.fields.map((field) => (
                  <label key={field.id} className="block">
                    <span className="text-sm font-extrabold text-slate-800">
                      {field.label}
                      {field.required ? (
                        <span className="ml-1 text-rose-600">*</span>
                      ) : null}
                    </span>

                    {field.type === "textarea" ? (
                      <textarea
                        rows={5}
                        value={values[field.id] || ""}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={values[field.id] || ""}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    )}
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={generateDocument}
                className="mt-7 w-full rounded-2xl bg-blue-950 px-6 py-4 text-lg font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Create first draft
              </button>
            </section>
          </div>

          <div className="xl:sticky xl:top-28 xl:self-start">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-amber-300">
                      Universal document editor
                    </p>
                    <h2 className="mt-1 text-2xl font-black">
                      Edit your document
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyDocument}
                      disabled={!document.trim()}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={downloadText}
                      disabled={!document.trim()}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      disabled={!document.trim()}
                      className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-extrabold text-blue-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Print / PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <textarea
                  aria-label={`${template.title} document editor`}
                  value={document}
                  onChange={(event) => setDocument(event.target.value)}
                  placeholder="Complete the document details and select “Create first draft”, or begin writing here."
                  className="min-h-[650px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-6 font-mono text-sm leading-7 text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <div className="mt-6 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="text-2xl">
                      ✨
                    </span>
                    <div>
                      <p className="font-black text-blue-950">
                        Improve with Beacon AI
                      </p>
                      <p className="text-sm font-semibold text-blue-800">
                        Beacon keeps the meaning but improves the writing.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {improvementOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        disabled={improving || !document.trim()}
                        onClick={() => improveDocument(option.id)}
                        className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-extrabold text-blue-900 transition hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {improving ? "Working..." : option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {message ? (
                  <div
                    role="status"
                    className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold text-slate-700"
                  >
                    {message}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-slate-500">
                    This tool creates a first draft. Legal, HR and safety
                    documents should be reviewed by a competent professional.
                  </p>
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="shrink-0 rounded-xl px-4 py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
                  >
                    Clear draft
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}