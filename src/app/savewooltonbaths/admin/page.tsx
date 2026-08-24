import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Archive,
  BadgePoundSterling,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Filter,
  GraduationCap,
  HandHeart,
  Hammer,
  HeartHandshake,
  Landmark,
  Mail,
  MapPin,
  PackageOpen,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";

import { requireAdministratorAccount } from "@/lib/auth/AdminAccess";

import {
  archiveWooltonSupportRegistration,
  markWooltonSupportConfirmed,
  markWooltonSupportContacted,
  updateWooltonSupportNotes,
  updateWooltonSupportStatus,
} from "./actions";

export const dynamic = "force-dynamic";

type SupportStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "confirmed"
  | "completed"
  | "declined"
  | "archived";

type SupportType =
  | "general"
  | "volunteer"
  | "trade"
  | "materials"
  | "equipment"
  | "sponsorship"
  | "funding"
  | "education"
  | "professional"
  | "other";

type SearchParams = {
  q?: string | string[];
  type?: string | string[];
  status?: string | string[];
};

type AdminPageProps = {
  searchParams?: Promise<SearchParams>;
};

type SupportRegistration = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  postcode: string | null;
  support_type: SupportType;

  trade_profession: string | null;
  material_details: string | null;
  equipment_details: string | null;
  sponsorship_details: string | null;
  funding_details: string | null;
  education_details: string | null;
  professional_details: string | null;

  message: string | null;

  permission_to_contact: boolean;
  public_support: boolean;

  status: SupportStatus;

  internal_notes: string | null;

  contacted_at: string | null;
  confirmed_at: string | null;

  created_at: string;
  updated_at: string;
};

const SUPPORT_TYPE_OPTIONS: Array<{
  value: SupportType;
  label: string;
}> = [
  {
    value: "general",
    label: "General Support",
  },
  {
    value: "volunteer",
    label: "Volunteer",
  },
  {
    value: "trade",
    label: "Skilled Trade",
  },
  {
    value: "materials",
    label: "Materials",
  },
  {
    value: "equipment",
    label: "Equipment",
  },
  {
    value: "sponsorship",
    label: "Sponsorship",
  },
  {
    value: "funding",
    label: "Funding / Grant",
  },
  {
    value: "education",
    label: "Education",
  },
  {
    value: "professional",
    label: "Professional Advice",
  },
  {
    value: "other",
    label: "Other",
  },
];

const STATUS_OPTIONS: Array<{
  value: SupportStatus;
  label: string;
}> = [
  {
    value: "new",
    label: "New",
  },
  {
    value: "reviewing",
    label: "Reviewing",
  },
  {
    value: "contacted",
    label: "Contacted",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "declined",
    label: "Declined",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function readSearchParameter(
  value: string | string[] | undefined,
  maxLength = 120,
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(
      0,
      maxLength,
    );
}

function isSupportType(
  value: string,
): value is SupportType {
  return SUPPORT_TYPE_OPTIONS.some(
    (option) =>
      option.value === value,
  );
}

function isSupportStatus(
  value: string,
): value is SupportStatus {
  return STATUS_OPTIONS.some(
    (option) =>
      option.value === value,
  );
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-GB",
  ).format(value);
}

function getSupportTypeLabel(
  value: SupportType,
): string {
  return (
    SUPPORT_TYPE_OPTIONS.find(
      (option) =>
        option.value === value,
    )?.label ??
    value
  );
}

function getStatusLabel(
  value: SupportStatus,
): string {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value === value,
    )?.label ??
    value
  );
}

function getStatusClasses(
  status: SupportStatus,
): string {
  if (
    status === "new"
  ) {
    return "bg-blue-100 text-blue-800";
  }

  if (
    status === "reviewing"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (
    status === "contacted"
  ) {
    return "bg-violet-100 text-violet-800";
  }

  if (
    status === "confirmed"
  ) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (
    status === "completed"
  ) {
    return "bg-teal-100 text-teal-800";
  }

  if (
    status === "declined"
  ) {
    return "bg-red-100 text-red-800";
  }

  return "bg-slate-200 text-slate-700";
}

function getSupportIcon(
  type: SupportType,
) {
  if (
    type === "general"
  ) {
    return HeartHandshake;
  }

  if (
    type === "volunteer"
  ) {
    return Users;
  }

  if (
    type === "trade"
  ) {
    return Hammer;
  }

  if (
    type === "materials"
  ) {
    return PackageOpen;
  }

  if (
    type === "equipment"
  ) {
    return Wrench;
  }

  if (
    type === "sponsorship"
  ) {
    return Building2;
  }

  if (
    type === "funding"
  ) {
    return BadgePoundSterling;
  }

  if (
    type === "education"
  ) {
    return GraduationCap;
  }

  if (
    type === "professional"
  ) {
    return Landmark;
  }

  return HandHeart;
}

export default async function SaveWooltonBathsAdminPage({
  searchParams,
}: AdminPageProps) {
  const adminAccount =
    await requireAdministratorAccount();

  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : undefined;

  const query =
    readSearchParameter(
      resolvedSearchParams?.q,
    );

  const rawType =
    readSearchParameter(
      resolvedSearchParams?.type,
      30,
    );

  const rawStatus =
    readSearchParameter(
      resolvedSearchParams?.status,
      30,
    );

  const supportType =
    isSupportType(rawType)
      ? rawType
      : "";

  const supportStatus =
    isSupportStatus(rawStatus)
      ? rawStatus
      : "";

  const supabase =
    getSupabaseAdmin();

  let registryQuery =
    supabase
      .from(
        "save_woolton_baths_support",
      )
      .select(
        `
          id,
          name,
          email,
          phone,
          organisation,
          postcode,
          support_type,
          trade_profession,
          material_details,
          equipment_details,
          sponsorship_details,
          funding_details,
          education_details,
          professional_details,
          message,
          permission_to_contact,
          public_support,
          status,
          internal_notes,
          contacted_at,
          confirmed_at,
          created_at,
          updated_at
        `,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

  if (supportType) {
    registryQuery =
      registryQuery.eq(
        "support_type",
        supportType,
      );
  }

  if (supportStatus) {
    registryQuery =
      registryQuery.eq(
        "status",
        supportStatus,
      );
  }

  if (query) {
    registryQuery =
      registryQuery.or(
        [
          `name.ilike.%${query}%`,
          `email.ilike.%${query}%`,
          `organisation.ilike.%${query}%`,
          `postcode.ilike.%${query}%`,
        ].join(","),
      );
  }

  const [
    registryResult,
    totalResult,
    newResult,
    tradeResult,
    materialEquipmentResult,
    sponsorFundingResult,
  ] =
    await Promise.all([
      registryQuery,

      supabase
        .from(
          "save_woolton_baths_support",
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        ),

      supabase
        .from(
          "save_woolton_baths_support",
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq(
          "status",
          "new",
        ),

      supabase
        .from(
          "save_woolton_baths_support",
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .in(
          "support_type",
          [
            "trade",
            "volunteer",
            "professional",
          ],
        ),

      supabase
        .from(
          "save_woolton_baths_support",
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .in(
          "support_type",
          [
            "materials",
            "equipment",
          ],
        ),

      supabase
        .from(
          "save_woolton_baths_support",
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .in(
          "support_type",
          [
            "sponsorship",
            "funding",
          ],
        ),
    ]);

  if (
    registryResult.error
  ) {
    console.error(
      "[Save Woolton Baths Admin] Failed to load registry:",
      registryResult.error,
    );

    throw new Error(
      "Unable to load the Save Woolton Baths registry.",
    );
  }

  const registrations =
    (
      registryResult.data ??
      []
    ) as SupportRegistration[];

  const totalRegistrations =
    totalResult.count ??
    0;

  const newRegistrations =
    newResult.count ??
    0;

  const tradeSupport =
    tradeResult.count ??
    0;

  const materialEquipmentSupport =
    materialEquipmentResult.count ??
    0;

  const sponsorFundingSupport =
    sponsorFundingResult.count ??
    0;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}

      <section className="relative overflow-hidden bg-[#071522] px-6 py-12 text-white sm:py-16">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#D4AF37]">
              Save Woolton Baths Administration
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Support Registry
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
              Review community support, skilled-trade offers, materials,
              equipment, sponsorship, funding and professional assistance for
              the Save Woolton Baths campaign.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#E6C75A]">
                Administrator
              </span>

              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-200">
                {adminAccount.name}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10"
            >
              Beacon Admin
            </Link>

            <Link
              href="/savewooltonbaths"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-black text-black transition hover:bg-[#E6C75A]"
            >
              View Campaign
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CONTENT */}
      {/* ============================================================ */}

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          {/* SUMMARY */}

          <section>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8D7425]">
              Campaign Overview
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Support at a glance
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Total Registrations"
                value={formatNumber(
                  totalRegistrations,
                )}
                detail="All support registrations received."
                icon={Users}
              />

              <MetricCard
                label="New"
                value={formatNumber(
                  newRegistrations,
                )}
                detail="Registrations awaiting review."
                icon={Mail}
              />

              <MetricCard
                label="Trades & Volunteers"
                value={formatNumber(
                  tradeSupport,
                )}
                detail="Practical and professional support."
                icon={Hammer}
              />

              <MetricCard
                label="Materials & Equipment"
                value={formatNumber(
                  materialEquipmentSupport,
                )}
                detail="Potential physical project contributions."
                icon={PackageOpen}
              />

              <MetricCard
                label="Sponsors & Funding"
                value={formatNumber(
                  sponsorFundingSupport,
                )}
                detail="Commercial or financial support."
                icon={CircleDollarSign}
              />
            </div>
          </section>

          {/* FILTERS */}

          <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-[#8D7425]" />

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8D7425]">
                    Search & Filter
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    Find registrations
                  </h2>
                </div>
              </div>

              <form
                action="/savewooltonbaths/admin"
                method="get"
                className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px_220px_auto]"
              >
                <label className="block">
                  <span className="sr-only">
                    Search registrations
                  </span>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type="search"
                      name="q"
                      defaultValue={query}
                      placeholder="Name, email, organisation or postcode"
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-base font-semibold outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15"
                    />
                  </div>
                </label>

                <select
                  name="type"
                  defaultValue={supportType}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15"
                >
                  <option value="">
                    All support types
                  </option>

                  {SUPPORT_TYPE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>

                <select
                  name="status"
                  defaultValue={supportStatus}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15"
                >
                  <option value="">
                    All statuses
                  </option>

                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>

                <button
                  type="submit"
                  className="min-h-12 rounded-xl bg-[#102532] px-6 text-sm font-black text-white transition hover:bg-[#D4AF37] hover:text-black"
                >
                  Apply Filters
                </button>
              </form>

              {(query ||
                supportType ||
                supportStatus) && (
                <div className="mt-4">
                  <Link
                    href="/savewooltonbaths/admin"
                    className="text-sm font-black text-[#8D7425] hover:underline"
                  >
                    Clear all filters
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between gap-3 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:px-8">
              <p>
                Showing{" "}
                <strong className="text-slate-950">
                  {formatNumber(
                    registrations.length,
                  )}
                </strong>{" "}
                registration
                {registrations.length === 1
                  ? ""
                  : "s"}
              </p>

              <p>
                Total registry:{" "}
                <strong className="text-slate-950">
                  {formatNumber(
                    totalRegistrations,
                  )}
                </strong>
              </p>
            </div>
          </section>

          {/* REGISTRY */}

          <section className="mt-8">
            {registrations.length > 0 ? (
              <div className="space-y-6">
                {registrations.map(
                  (registration) => (
                    <RegistrationCard
                      key={
                        registration.id
                      }
                      registration={
                        registration
                      }
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#8D7425]">
                  <Users className="h-8 w-8" />
                </div>

                <h2 className="mt-5 text-2xl font-black">
                  No registrations found
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                  Try clearing the filters or using a different search term.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: MetricCardProps) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="bg-[#102532] px-6 py-4 text-white">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
            {label}
          </p>

          <Icon className="h-5 w-5 text-[#D4AF37]" />
        </div>
      </div>

      <div className="p-6">
        <p className="text-3xl font-black">
          {value}
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {detail}
        </p>
      </div>
    </article>
  );
}

type RegistrationCardProps = {
  registration: SupportRegistration;
};

function RegistrationCard({
  registration,
}: RegistrationCardProps) {
  const SupportIcon =
    getSupportIcon(
      registration.support_type,
    );

  const detailBlocks =
    [
      {
        label: "Trade / Profession",
        value:
          registration.trade_profession,
      },
      {
        label: "Materials Offered",
        value:
          registration.material_details,
      },
      {
        label: "Equipment Offered",
        value:
          registration.equipment_details,
      },
      {
        label: "Sponsorship Details",
        value:
          registration.sponsorship_details,
      },
      {
        label: "Funding Details",
        value:
          registration.funding_details,
      },
      {
        label: "Educational Support",
        value:
          registration.education_details,
      },
      {
        label: "Professional Advice",
        value:
          registration.professional_details,
      },
      {
        label: "Additional Message",
        value:
          registration.message,
      },
    ].filter(
      (item) =>
        Boolean(item.value),
    );

  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      {/* CARD HEADER */}

      <div className="border-b border-slate-200 bg-[#102532] px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-black">
              <SupportIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-2xl font-black">
                {registration.name}
              </h2>

              <p className="mt-2 font-bold text-[#E6C75A]">
                {getSupportTypeLabel(
                  registration.support_type,
                )}
              </p>

              {registration.organisation && (
                <p className="mt-1 text-sm font-semibold text-slate-300">
                  {registration.organisation}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${getStatusClasses(
                registration.status,
              )}`}
            >
              {getStatusLabel(
                registration.status,
              )}
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300">
              {formatDateTime(
                registration.created_at,
              )}
            </span>
          </div>
        </div>
      </div>

      {/* BODY */}

      <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[0.8fr_1.2fr]">
        {/* CONTACT */}

        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8D7425]">
            Contact Details
          </p>

          <div className="mt-5 space-y-4">
            <ContactRow
              icon={Mail}
              label="Email"
              value={
                registration.email
              }
              href={`mailto:${registration.email}`}
            />

            <ContactRow
              icon={Phone}
              label="Phone"
              value={
                registration.phone ??
                "Not supplied"
              }
              href={
                registration.phone
                  ? `tel:${registration.phone}`
                  : undefined
              }
            />

            <ContactRow
              icon={MapPin}
              label="Postcode"
              value={
                registration.postcode ??
                "Not supplied"
              }
            />

            <ContactRow
              icon={Building2}
              label="Organisation"
              value={
                registration.organisation ??
                "Not supplied"
              }
            />
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <ConsentBadge
              label="Permission to Contact"
              active={
                registration.permission_to_contact
              }
            />

            <ConsentBadge
              label="Public Supporter"
              active={
                registration.public_support
              }
            />
          </div>

          <dl className="mt-7 space-y-3 border-t border-slate-200 pt-6 text-sm">
            <AdminDetail
              label="Registered"
              value={formatDateTime(
                registration.created_at,
              )}
            />

            <AdminDetail
              label="Last Updated"
              value={formatDateTime(
                registration.updated_at,
              )}
            />

            <AdminDetail
              label="Contacted"
              value={formatDateTime(
                registration.contacted_at,
              )}
            />

            <AdminDetail
              label="Confirmed"
              value={formatDateTime(
                registration.confirmed_at,
              )}
            />
          </dl>
        </div>

        {/* OFFER + MANAGEMENT */}

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8D7425]">
            Offer & Management
          </p>

          {detailBlocks.length > 0 ? (
            <div className="mt-5 space-y-4">
              {detailBlocks.map(
                (detail) => (
                  <div
                    key={detail.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      {detail.label}
                    </p>

                    <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-slate-700">
                      {detail.value}
                    </p>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
              No additional details were provided.
            </div>
          )}

          {/* STATUS */}

          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-black">
              Registration Status
            </p>

            <form
              action={
                updateWooltonSupportStatus
              }
              className="mt-4 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="hidden"
                name="registrationId"
                value={
                  registration.id
                }
              />

              <select
                name="status"
                defaultValue={
                  registration.status
                }
                className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15"
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>

              <button
                type="submit"
                className="min-h-12 rounded-xl bg-[#102532] px-5 text-sm font-black text-white transition hover:bg-[#D4AF37] hover:text-black"
              >
                Update Status
              </button>
            </form>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <form
                action={
                  markWooltonSupportContacted
                }
              >
                <input
                  type="hidden"
                  name="registrationId"
                  value={
                    registration.id
                  }
                />

                <button
                  type="submit"
                  className="min-h-11 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-black text-violet-800 transition hover:bg-violet-100"
                >
                  Mark Contacted
                </button>
              </form>

              <form
                action={
                  markWooltonSupportConfirmed
                }
              >
                <input
                  type="hidden"
                  name="registrationId"
                  value={
                    registration.id
                  }
                />

                <button
                  type="submit"
                  className="min-h-11 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                >
                  Confirm Support
                </button>
              </form>

              <form
                action={
                  archiveWooltonSupportRegistration
                }
              >
                <input
                  type="hidden"
                  name="registrationId"
                  value={
                    registration.id
                  }
                />

                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
              </form>
            </div>
          </section>

          {/* NOTES */}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="font-black">
              Internal Notes
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Visible only to administrators. Use this to record follow-up,
              availability, materials, meetings or other project information.
            </p>

            <form
              action={
                updateWooltonSupportNotes
              }
              className="mt-4"
            >
              <input
                type="hidden"
                name="registrationId"
                value={
                  registration.id
                }
              />

              <textarea
                name="internalNotes"
                defaultValue={
                  registration.internal_notes ??
                  ""
                }
                rows={5}
                maxLength={5000}
                placeholder="Example: Contacted 27 Aug — available to provide roofing labour during Phase 1."
                className="w-full rounded-xl border border-slate-300 bg-white p-4 text-base leading-7 outline-none transition focus:border-[#8D7425] focus:ring-4 focus:ring-[#D4AF37]/15"
              />

              <button
                type="submit"
                className="mt-3 min-h-11 rounded-xl bg-[#8D7425] px-5 text-sm font-black text-white transition hover:bg-[#725D18]"
              >
                Save Internal Notes
              </button>
            </form>
          </section>
        </div>
      </div>
    </article>
  );
}

type ContactRowProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  href?: string;
};

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: ContactRowProps) {
  const content = (
    <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-bold text-slate-800">
        {value}
      </p>
    </div>
  );

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#8D7425]">
        <Icon className="h-4 w-4" />
      </div>

      {href ? (
        <a
          href={href}
          className="min-w-0 hover:text-[#8D7425]"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

type ConsentBadgeProps = {
  label: string;
  active: boolean;
};

function ConsentBadge({
  label,
  active,
}: ConsentBadgeProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" />
      ) : (
        <ShieldCheck className="h-5 w-5 shrink-0" />
      )}

      <p className="text-sm font-black">
        {label}:{" "}
        {active
          ? "Yes"
          : "No"}
      </p>
    </div>
  );
}

type AdminDetailProps = {
  label: string;
  value: string;
};

function AdminDetail({
  label,
  value,
}: AdminDetailProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="font-bold text-slate-500">
        {label}
      </dt>

      <dd className="text-right font-black text-slate-800">
        {value}
      </dd>
    </div>
  );
}