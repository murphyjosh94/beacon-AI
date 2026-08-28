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

type NetworkSummary = {
  totalActive: number;
  positiveResponses: number;
  professionalSupportOffers: number;
  confirmedPartners: number;
};

type NetworkResponse = {
  ok: boolean;
  summary?: NetworkSummary;
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
      "Surveyors, conservation engineers and other specialists helping us build a robust evidence base for the future of Woolton Baths.",
  },
  {
    key: "heritage_construction",
    title: "Heritage & Construction",
    description:
      "Restoration specialists, builders, roofing and access providers helping protect and repair this important historic building.",
  },
  {
    key: "engineering_energy",
    title: "Engineering & Energy",
    description:
      "Electrical, mechanical, pool-plant, energy and sustainability organisations helping us plan an efficient and resilient facility.",
  },
  {
    key: "community",
    title: "Community Support",
    description:
      "Local people, groups and community organisations standing behind the campaign and helping demonstrate why Woolton Baths matters.",
  },
  {
    key: "academic",
    title: "Academic Support",
    description:
      "Universities, colleges and academic contacts contributing knowledge, research opportunities and specialist expertise.",
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
      "Public bodies and elected representatives engaging constructively with the campaign and the future of Woolton Baths.",
  },
  {
    key: "other",
    title: "Other Support",
    description:
      "Additional organisations and supporters helping the Save Woolton Baths campaign in practical and meaningful ways.",
  },
];

const PLACEHOLDER_CATEGORIES = CATEGORY_DEFINITIONS.filter((category) =>
  [
    "professional_partners",
    "heritage_construction",
    "engineering_energy",
    "community",
    "academic",
    "media_awareness",
  ].includes(category.key),
);

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;

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
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMetric(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-GB").format(value);
}

export default function SaveWooltonBathsPartnersPage() {
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnersError, setPartnersError] = useState("");
  const [networkSummary, setNetworkSummary] = useState<NetworkSummary | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      setLoading(true);
      setPartnersError("");

      const partnersRequest = fetch("/api/savewooltonbaths/partners", {
        method: "GET",
        cache: "no-store",
      });

      const networkRequest = fetch("/api/savewooltonbaths/partners/network", {
        method: "GET",
        cache: "no-store",
      });

      const [partnersResult, networkResult] = await Promise.allSettled([
        partnersRequest,
        networkRequest,
      ]);

      if (!cancelled) {
        if (partnersResult.status === "fulfilled") {
          try {
            const data = (await partnersResult.value.json()) as PartnersResponse;

            if (partnersResult.value.ok && data.ok) {
              setPartners(data.partners ?? []);
            } else {
              setPartnersError(
                data.error ?? "Unable to load campaign supporters and partners.",
              );
            }
          } catch {
            setPartnersError("Unable to load campaign supporters and partners.");
          }
        } else {
          setPartnersError("Unable to load campaign supporters and partners.");
        }

        if (networkResult.status === "fulfilled") {
          try {
            const data = (await networkResult.value.json()) as NetworkResponse;

            if (networkResult.value.ok && data.ok && data.summary) {
              setNetworkSummary(data.summary);
            }
          } catch {
            setNetworkSummary(null);
          }
        }

        setLoading(false);
      }
    }

    void loadPageData();

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

  const hasPublicPartners = groupedPartners.length > 0;

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

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#F2D574]">
              Save Woolton Baths
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Supporters & Partners
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
              Restoring Woolton Baths will require people, organisations and
              specialists working together. This page recognises those who have
              given permission for their support to be publicly acknowledged.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
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

      {!hasPublicPartners && !loading ? (
        <section className="border-b border-[#D8D2C5] bg-[#F5F3ED]">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
            <div className="rounded-[2rem] border border-[#D8D2C5] bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
              <div className="inline-flex rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#8B6B0B]">
                Partners coming soon
              </div>

              <h2 className="mx-auto mt-6 max-w-4xl text-3xl font-black tracking-tight text-[#0A2236] sm:text-4xl">
                Our partnership network is growing
              </h2>

              <p className="mx-auto mt-5 max-w-4xl text-base leading-8 text-slate-600 sm:text-lg">
                We&apos;re working with professionals, businesses and
                organisations who share our ambition to bring Woolton Baths back
                into community use.
              </p>

              <p className="mx-auto mt-4 max-w-4xl text-base leading-8 text-slate-600 sm:text-lg">
                Confirmed supporters and partners will be recognised here once
                permission to display their involvement has been received.
              </p>

              <div className="mx-auto mt-9 grid max-w-5xl gap-3 md:grid-cols-2 xl:grid-cols-3">
                {PLACEHOLDER_CATEGORIES.map((category) => (
                  <div
                    key={category.key}
                    className="rounded-2xl border border-[#E4DED2] bg-[#FAF9F6] px-5 py-5 text-left"
                  >
                    <div className="text-sm font-black text-[#0A2236]">
                      {category.title}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {category.description}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/savewooltonbaths/support"
                className="mt-9 inline-flex rounded-xl bg-[#0A2236] px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#103A56]"
              >
                Register Your Support
              </Link>

              {partnersError ? (
                <p className="mx-auto mt-5 max-w-3xl text-xs leading-5 text-slate-400">
                  Public partner listings are being updated. The campaign page
                  remains available while this information refreshes.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-[#D8D2C5] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="mb-7 max-w-4xl">
            <div className="flex items-center gap-3">
              <div className="h-px w-10 bg-[#D4AF37]" />
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9A7917]">
                Campaign network progress
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-black text-[#0A2236] sm:text-3xl">
              Building the team around Woolton Baths
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              We are building a network of businesses, professionals, community
              organisations and public representatives who can help move the
              restoration from ambition to evidence-backed delivery.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              value={formatMetric(networkSummary?.totalActive)}
              label="Organisations engaged"
            />
            <MetricCard
              value={formatMetric(networkSummary?.positiveResponses)}
              label="Positive responses"
            />
            <MetricCard
              value={formatMetric(networkSummary?.professionalSupportOffers)}
              label="Professional support offers"
            />
            <MetricCard
              value={formatMetric(networkSummary?.confirmedPartners)}
              label="Confirmed partners"
            />
          </div>
        </div>
      </section>

      {hasPublicPartners ? (
        <section className="bg-[#F5F3ED]">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
            <div className="mb-10 max-w-4xl">
              <div className="inline-flex rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#8B6B0B]">
                Proudly supporting the campaign
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-[#0A2236] sm:text-4xl">
                Founding Campaign Partners
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                The organisations and professionals shown below gave their
                support during the campaign to secure a sustainable community
                future for Woolton Baths. Their contribution forms part of the
                evidence, expertise and momentum behind the project.
              </p>
            </div>

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

                    <h3 className="mt-3 text-2xl font-black text-[#0A2236] sm:text-3xl">
                      {category.title}
                    </h3>

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
          </div>
        </section>
      ) : null}

      <section className="border-y border-[#D8D2C5] bg-[#EFEADF]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#9A7917]">
                Founding Campaign Partners
              </div>

              <h2 className="mt-3 text-3xl font-black text-[#0A2236]">
                Recognition that stays with the project
              </h2>

              <p className="mt-4 max-w-3xl leading-8 text-slate-600">
                The first organisations and professionals who materially support
                the campaign during its Community Asset Transfer and restoration
                planning stages will be recognised as Founding Campaign Partners.
                Their early support helped establish the evidence base,
                professional network and community momentum behind the project.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-[#D4AF37]/40 bg-white p-7 shadow-sm">
              <div className="inline-flex rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#07131F]">
                Founding Campaign Partner
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-600">
                Recognition is only applied where the relationship is confirmed
                and permission for public acknowledgement has been received.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="rounded-[2rem] border border-[#D8D2C5] bg-[#FAF9F6] p-8 sm:p-10">
            <div className="max-w-4xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#9A7917]">
                Community campaign
              </div>

              <h2 className="mt-3 text-3xl font-black text-[#0A2236]">
                The Wall of Support
              </h2>

              <p className="mt-4 text-base leading-8 text-slate-600">
                Every organisation publicly recognised on this page has chosen
                to stand alongside the community campaign in a practical or
                professional way. More names will appear as support is confirmed
                and permission for public recognition is received.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-500">
                Public recognition reflects the specific approved relationship
                shown here and should not be interpreted as endorsement of every
                future campaign decision or proposal.
              </p>
            </div>
          </div>
        </div>
      </section>

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

              <p className="mt-7 text-sm font-black uppercase tracking-[0.16em] text-[#F2D574]">
                Built with Trust. Guided by Purpose.
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

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E2DCCF] bg-[#FAF9F6] px-6 py-6">
      <div className="text-3xl font-black text-[#0A2236]">{value}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
    </div>
  );
}

function PartnerCard({ partner }: { partner: PublicPartner }) {
  const websiteUrl = safeExternalUrl(partner.websiteUrl);
  const logoUrl = safeExternalUrl(partner.logoUrl);
  const photoUrl = safeExternalUrl(partner.photoUrl);
  const confirmedDate = formatConfirmedDate(partner.confirmedPartnerSince);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#D8D2C5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-b border-[#E7E2D8] bg-[#07131F] px-5 py-3">
        <span className="inline-flex rounded-full bg-[#D4AF37] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#07131F]">
          Founding Campaign Partner
        </span>
      </div>

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
