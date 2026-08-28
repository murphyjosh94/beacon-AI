"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PublicPartnerCategory =
  | "professional_partners"
  | "heritage_construction"
  | "engineering_energy"
  | "community"
  | "academic"
  | "media_awareness"
  | "public_sector"
  | "other";

type PublicPartner = {
  id: string;

  name: string;
  title: string | null;
  wording: string | null;

  category: PublicPartnerCategory;

  websiteUrl: string | null;

  logoUrl: string | null;
  photoUrl: string | null;

  displayOrder: number;

  confirmedPartnerSince: string | null;
};

type PartnersResponse = {
  ok: boolean;
  partners?: PublicPartner[];
  count?: number;
  error?: string;
};

type CategoryDefinition = {
  key: PublicPartnerCategory;
  title: string;
  description: string;
};

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    key: "professional_partners",
    title: "Professional Support",
    description:
      "Specialists providing professional knowledge, surveys, technical guidance and expert support to help build a robust evidence base for the future of Woolton Baths.",
  },
  {
    key: "heritage_construction",
    title: "Heritage & Construction",
    description:
      "Organisations supporting the careful repair, restoration and conservation of Woolton Baths and its historic fabric.",
  },
  {
    key: "engineering_energy",
    title: "Engineering & Energy",
    description:
      "Engineering, building-services and energy organisations helping us explore efficient, resilient and sustainable solutions for the building.",
  },
  {
    key: "community",
    title: "Community Support",
    description:
      "People, groups and organisations helping strengthen the community campaign and demonstrate the importance of Woolton Baths to local residents.",
  },
  {
    key: "academic",
    title: "Academic Support",
    description:
      "Universities, colleges and academic partners contributing knowledge, research, student opportunities and specialist expertise.",
  },
  {
    key: "media_awareness",
    title: "Media & Awareness",
    description:
      "Organisations helping the campaign reach more people, communicate clearly and build public awareness.",
  },
  {
    key: "public_sector",
    title: "Public Sector",
    description:
      "Public bodies and representatives engaging constructively with the campaign and the future of Woolton Baths.",
  },
  {
    key: "other",
    title: "Other Support",
    description:
      "Additional organisations and supporters helping the Save Woolton Baths campaign in practical and meaningful ways.",
  },
];

function safeExternalUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function formatConfirmedDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function SaveWooltonBathsPartnersPage() {
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPartners() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/savewooltonbaths/partners", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as PartnersResponse;

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error ?? "Unable to load campaign supporters and partners.",
          );
        }

        if (!cancelled) {
          setPartners(data.partners ?? []);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load campaign supporters and partners.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPartners();

    return () => {
      cancelled = true;
    };
  }, []);

  const groupedPartners = useMemo(() => {
    return CATEGORY_DEFINITIONS.map((category) => {
      const categoryPartners = partners
        .filter((partner) => partner.category === category.key)
        .sort((a, b) => {
          if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder;
          }

          return a.name.localeCompare(b.name, "en-GB");
        });

      return {
        ...category,
        partners: categoryPartners,
      };
    }).filter((category) => category.partners.length > 0);
  }, [partners]);

  return (
    <main className="min-h-screen bg-[#F5F3ED] text-slate-950">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#07131F] via-[#0A2236] to-[#103A56] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #D4AF37 0, transparent 24%), radial-gradient(circle at 85% 60%, #ffffff 0, transparent 20%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#F2D574]">
              Save Woolton Baths
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Supporters & Partners
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
              Restoring Woolton Baths will require people, organisations and
              specialists working together. We are proud to recognise those who
              have given permission for their support to be publicly
              acknowledged.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/savewooltonbaths"
                className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#E6C557]"
              >
                Back to Save Woolton Baths
              </Link>

              <Link
                href="/savewooltonbaths/support"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Register Your Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#D8D2C5] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-xl font-black text-[#0A2236]">
                Working together for Woolton Baths
              </h2>

              <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
                Public recognition is only shown where permission has been
                received. Being listed here reflects the approved support or
                relationship shown on this page and should not be interpreted
                as endorsement of every future campaign decision or proposal.
              </p>
            </div>

            {!loading && !error && partners.length > 0 ? (
              <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-4 text-center">
                <div className="text-3xl font-black text-[#0A2236]">
                  {partners.length}
                </div>

                <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                  Publicly Recognised
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        {loading ? (
          <div className="rounded-[2rem] border border-[#D8D2C5] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#D4AF37]" />

            <p className="mt-5 font-black text-[#0A2236]">
              Loading supporters and partners...
            </p>
          </div>
        ) : null}

        {!loading && (error || groupedPartners.length === 0) ? (
          <section className="overflow-hidden rounded-[2rem] border border-[#D8D2C5] bg-white shadow-sm">
            <div className="h-1.5 bg-[#D4AF37]" />

            <div className="px-7 py-10 text-center sm:px-12 sm:py-14">
              <div className="mx-auto inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#9A7917]">
                Partners coming soon
              </div>

              <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-black tracking-tight text-[#0A2236] sm:text-4xl">
                Our partnership network is growing
              </h2>

              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                We&apos;re working with professionals, businesses and organisations
                who share our ambition to bring Woolton Baths back into community
                use.
              </p>

              <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Confirmed supporters and partners will be recognised here once
                permission to display their involvement has been received.
              </p>

              <div className="mx-auto mt-9 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Professional Support",
                  "Heritage & Construction",
                  "Engineering & Energy",
                  "Community Support",
                  "Academic Support",
                  "Media & Awareness",
                ].map((label) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[#E7E2D8] bg-[#FAF9F6] px-4 py-4 text-sm font-bold text-[#0A2236]"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <Link
                href="/savewooltonbaths/support"
                className="mt-9 inline-flex rounded-xl bg-[#0A2236] px-6 py-3 text-sm font-black text-white transition hover:bg-[#103A56]"
              >
                Register Your Support
              </Link>
            </div>
          </section>
        ) : null}

        {!loading && !error && groupedPartners.length > 0 ? (
          <div className="space-y-14">
            {groupedPartners.map((category) => (
              <section key={category.key}>
                <div className="mb-6 max-w-4xl">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-10 bg-[#D4AF37]" />

                    <span className="text-xs font-black uppercase tracking-[0.16em] text-[#9A7917]">
                      Campaign Support
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl font-black text-[#0A2236] sm:text-3xl">
                    {category.title}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                    {category.description}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {category.partners.map((partner) => (
                    <PartnerCard key={partner.id} partner={partner} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>

      <section className="bg-[#0A2236] text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#F2D574]">
                Get involved
              </div>

              <h2 className="mt-3 text-3xl font-black">
                Could you support the future of Woolton Baths?
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                We welcome community support, professional expertise, technical
                advice, materials, equipment, services and other practical
                contributions that could help move the project forward.
              </p>
            </div>

            <Link
              href="/savewooltonbaths/support"
              className="inline-flex justify-center rounded-xl bg-[#D4AF37] px-7 py-4 font-black text-slate-950 transition hover:bg-[#E6C557]"
            >
              Register Your Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PartnerCard({ partner }: { partner: PublicPartner }) {
  const websiteUrl = safeExternalUrl(partner.websiteUrl);
  const logoUrl = safeExternalUrl(partner.logoUrl);
  const photoUrl = safeExternalUrl(partner.photoUrl);

  const confirmedDate = formatConfirmedDate(partner.confirmedPartnerSince);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#D8D2C5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {logoUrl || photoUrl ? (
        <div className="flex min-h-40 items-center justify-center border-b border-[#E7E2D8] bg-[#FAF9F6] p-7">
          {/* Intentionally using <img> because approved public media may
              originate from external organisation domains. */}
          <img
            src={logoUrl ?? photoUrl ?? ""}
            alt={logoUrl ? `${partner.name} logo` : partner.name}
            className={
              logoUrl
                ? "max-h-24 max-w-[80%] object-contain"
                : "h-28 w-28 rounded-full object-cover"
            }
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center border-b border-[#E7E2D8] bg-gradient-to-br from-[#F7F4EB] to-[#EEE8D9] p-7">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white text-3xl font-black text-[#0A2236] shadow-sm">
            {partner.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div>
          <h3 className="text-xl font-black text-[#0A2236]">{partner.name}</h3>

          {partner.title ? (
            <p className="mt-1 text-sm font-bold text-[#9A7917]">
              {partner.title}
            </p>
          ) : null}

          {partner.wording ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
              {partner.wording}
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-6">
          {confirmedDate ? (
            <p className="mb-4 text-xs font-semibold text-slate-400">
              Supporting the campaign since {confirmedDate}
            </p>
          ) : null}

          {websiteUrl ? (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-black text-[#0A2236] transition hover:text-[#9A7917]"
            >
              Visit website
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}