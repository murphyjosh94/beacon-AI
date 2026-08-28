"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type PartnershipStatus =
  | "contacted"
  | "responded"
  | "meeting_arranged"
  | "support_in_principle"
  | "offer_received"
  | "confirmed_partner"
  | "declined"
  | "no_response"
  | "closed";

type RelationshipType =
  | "professional_support"
  | "commercial_partner"
  | "materials_equipment"
  | "services_labour"
  | "community_support"
  | "elected_representative"
  | "academic_partner"
  | "energy_sustainability"
  | "media_awareness"
  | "public_sector"
  | "other";

type Priority =
  | "low"
  | "normal"
  | "high"
  | "critical";

type ContactMethod =
  | "email"
  | "phone"
  | "contact_form"
  | "in_person"
  | "social_media"
  | "letter"
  | "referral"
  | "other";

type Partnership = {
  id: string;

  organisation_name: string;
  contact_name: string | null;
  contact_job_title: string | null;

  email: string | null;
  phone: string | null;
  website_url: string | null;

  relationship_type: RelationshipType;
  sector: string | null;

  status: PartnershipStatus;
  priority: Priority;

  first_contacted_at: string | null;
  last_contacted_at: string | null;
  last_response_at: string | null;

  contact_method: ContactMethod | null;

  next_follow_up_at: string | null;

  meeting_scheduled_at: string | null;

  offer_summary: string | null;

  estimated_commercial_value_gbp:
    | number
    | null;

  campaign_cost_gbp:
    | number
    | null;

  contribution_value_gbp:
    | number
    | null;

  display_publicly: boolean;

  public_name_approved: boolean;

  archived: boolean;

  created_at: string;
  updated_at: string;
};

type PartnershipSummary = {
  total_active: number;
  contacted: number;
  responded: number;
  meetings_arranged: number;
  support_in_principle: number;
  offers_received: number;
  confirmed_partners: number;
  declined: number;
  publicly_recognised: number;

  estimated_commercial_value_gbp:
    number;

  campaign_cost_gbp:
    number;

  contributed_value_gbp:
    number;
};

type ApiListResponse = {
  ok: boolean;

  partnerships?: Partnership[];

  summary?: PartnershipSummary;

  error?: string;
};

type CreateResponse = {
  ok: boolean;

  partnership?: Partnership;

  summary?: PartnershipSummary;

  error?: string;

  message?: string;
};

type FormState = {
  organisationName: string;

  contactName: string;
  contactJobTitle: string;

  email: string;
  phone: string;
  websiteUrl: string;

  relationshipType:
    RelationshipType;

  sector: string;

  status:
    PartnershipStatus;

  priority:
    Priority;

  contactMethod:
    ContactMethod | "";

  firstContactedAt: string;

  supportRequested: string;

  internalNotes: string;
};

const INITIAL_FORM: FormState = {
  organisationName: "",

  contactName: "",
  contactJobTitle: "",

  email: "",
  phone: "",
  websiteUrl: "",

  relationshipType:
    "other",

  sector: "",

  status:
    "contacted",

  priority:
    "normal",

  contactMethod:
    "email",

  firstContactedAt:
    new Date()
      .toISOString()
      .slice(0, 10),

  supportRequested: "",

  internalNotes: "",
};

const STATUS_OPTIONS: Array<{
  value: PartnershipStatus;
  label: string;
}> = [
  {
    value: "contacted",
    label: "Contacted",
  },
  {
    value: "responded",
    label: "Responded",
  },
  {
    value: "meeting_arranged",
    label: "Meeting Arranged",
  },
  {
    value: "support_in_principle",
    label: "Support in Principle",
  },
  {
    value: "offer_received",
    label: "Offer Received",
  },
  {
    value: "confirmed_partner",
    label: "Confirmed Partner",
  },
  {
    value: "declined",
    label: "Declined",
  },
  {
    value: "no_response",
    label: "No Response",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

const RELATIONSHIP_OPTIONS: Array<{
  value: RelationshipType;
  label: string;
}> = [
  {
    value: "professional_support",
    label: "Professional Support",
  },
  {
    value: "commercial_partner",
    label: "Commercial Partner",
  },
  {
    value: "materials_equipment",
    label: "Materials & Equipment",
  },
  {
    value: "services_labour",
    label: "Services & Labour",
  },
  {
    value: "community_support",
    label: "Community Support",
  },
  {
    value: "elected_representative",
    label: "Elected Representative",
  },
  {
    value: "academic_partner",
    label: "Academic Partner",
  },
  {
    value: "energy_sustainability",
    label: "Energy & Sustainability",
  },
  {
    value: "media_awareness",
    label: "Media & Awareness",
  },
  {
    value: "public_sector",
    label: "Public Sector",
  },
  {
    value: "other",
    label: "Other",
  },
];

const PRIORITY_OPTIONS: Array<{
  value: Priority;
  label: string;
}> = [
  {
    value: "low",
    label: "Low",
  },
  {
    value: "normal",
    label: "Normal",
  },
  {
    value: "high",
    label: "High",
  },
  {
    value: "critical",
    label: "Critical",
  },
];

const CONTACT_METHOD_OPTIONS: Array<{
  value: ContactMethod;
  label: string;
}> = [
  {
    value: "email",
    label: "Email",
  },
  {
    value: "phone",
    label: "Phone",
  },
  {
    value: "contact_form",
    label: "Contact Form",
  },
  {
    value: "in_person",
    label: "In Person",
  },
  {
    value: "social_media",
    label: "Social Media",
  },
  {
    value: "letter",
    label: "Letter",
  },
  {
    value: "referral",
    label: "Referral",
  },
  {
    value: "other",
    label: "Other",
  },
];

function formatCurrency(
  value:
    | number
    | null
    | undefined,
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(
    Number(value ?? 0),
  );
}

function formatDate(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function getStatusLabel(
  status: PartnershipStatus,
): string {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value ===
        status,
    )?.label ??
    status
  );
}

function getRelationshipLabel(
  relationship:
    RelationshipType,
): string {
  return (
    RELATIONSHIP_OPTIONS.find(
      (option) =>
        option.value ===
        relationship,
    )?.label ??
    relationship
  );
}

function getStatusClass(
  status: PartnershipStatus,
): string {
  switch (status) {
    case "confirmed_partner":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";

    case "offer_received":
      return "border-blue-300 bg-blue-50 text-blue-800";

    case "support_in_principle":
      return "border-cyan-300 bg-cyan-50 text-cyan-800";

    case "meeting_arranged":
      return "border-violet-300 bg-violet-50 text-violet-800";

    case "responded":
      return "border-sky-300 bg-sky-50 text-sky-800";

    case "declined":
      return "border-red-300 bg-red-50 text-red-800";

    case "no_response":
    case "closed":
      return "border-slate-300 bg-slate-100 text-slate-700";

    default:
      return "border-amber-300 bg-amber-50 text-amber-800";
  }
}

function getPriorityClass(
  priority: Priority,
): string {
  if (
    priority ===
    "critical"
  ) {
    return "bg-red-100 text-red-800";
  }

  if (
    priority ===
    "high"
  ) {
    return "bg-orange-100 text-orange-800";
  }

  if (
    priority ===
    "low"
  ) {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-blue-50 text-blue-700";
}

export default function PartnershipRegistryPage() {
  const [
    partnerships,
    setPartnerships,
  ] =
    useState<Partnership[]>(
      [],
    );

  const [
    summary,
    setSummary,
  ] =
    useState<PartnershipSummary | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("");

  const [
    relationshipFilter,
    setRelationshipFilter,
  ] =
    useState("");

  const [
    showAddForm,
    setShowAddForm,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      INITIAL_FORM,
    );

  const loadPartnerships =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const params =
            new URLSearchParams();

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim(),
            );
          }

          if (
            statusFilter
          ) {
            params.set(
              "status",
              statusFilter,
            );
          }

          if (
            relationshipFilter
          ) {
            params.set(
              "relationshipType",
              relationshipFilter,
            );
          }

          const response =
            await fetch(
              `/api/savewooltonbaths/admin/partnerships?${params.toString()}`,
              {
                method: "GET",
                cache: "no-store",
              },
            );

          const data =
            (await response.json()) as ApiListResponse;

          if (
            !response.ok ||
            !data.ok
          ) {
            throw new Error(
              data.error ??
                "Unable to load the partnership register.",
            );
          }

          setPartnerships(
            data.partnerships ??
              [],
          );

          setSummary(
            data.summary ??
              null,
          );
        } catch (
          caughtError
        ) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load the partnership register.",
          );
        } finally {
          setLoading(false);
        }
      },
      [
        search,
        statusFilter,
        relationshipFilter,
      ],
    );

  useEffect(
    () => {
      const timeout =
        window.setTimeout(
          () => {
            void loadPartnerships();
          },
          250,
        );

      return () => {
        window.clearTimeout(
          timeout,
        );
      };
    },
    [
      loadPartnerships,
    ],
  );

  const visibleCount =
    useMemo(
      () =>
        partnerships.length,
      [partnerships],
    );

  function updateForm<
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/savewooltonbaths/admin/partnerships",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                organisationName:
                  form.organisationName,

                contactName:
                  form.contactName,

                contactJobTitle:
                  form.contactJobTitle,

                email:
                  form.email,

                phone:
                  form.phone,

                websiteUrl:
                  form.websiteUrl,

                relationshipType:
                  form.relationshipType,

                sector:
                  form.sector,

                status:
                  form.status,

                priority:
                  form.priority,

                contactMethod:
                  form.contactMethod ||
                  null,

                firstContactedAt:
                  form.firstContactedAt
                    ? `${form.firstContactedAt}T12:00:00`
                    : null,

                lastContactedAt:
                  form.firstContactedAt
                    ? `${form.firstContactedAt}T12:00:00`
                    : null,

                supportRequested:
                  form.supportRequested,

                internalNotes:
                  form.internalNotes,

                displayPublicly:
                  false,

                publicNameApproved:
                  false,

                publicLogoApproved:
                  false,

                publicPhotoApproved:
                  false,

                publicWordingApproved:
                  false,

                displayOrder:
                  100,

                archived:
                  false,
              }),
          },
        );

      const data =
        (await response.json()) as CreateResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ??
            "Unable to create the partnership record.",
        );
      }

      setMessage(
        `${form.organisationName.trim()} added to the outreach register.`,
      );

      setForm({
        ...INITIAL_FORM,

        firstContactedAt:
          new Date()
            .toISOString()
            .slice(
              0,
              10,
            ),
      });

      setShowAddForm(
        false,
      );

      await loadPartnerships();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create the partnership record.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-[#071827] to-[#0C2940] text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#F5D97B]">
                  Save Woolton Baths
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                  Private Admin
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Outreach & Partnership Register
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                Track every organisation, professional,
                supplier, representative and potential
                partner involved in the campaign.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/savewooltonbaths/admin"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black transition hover:bg-white/10"
              >
                ← Support Registry
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(
                    (current) =>
                      !current,
                  );

                  setError("");
                  setMessage("");
                }}
                className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#E7C65A]"
              >
                {showAddForm
                  ? "Close Form"
                  : "+ Add Outreach Record"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Active Outreach"
            value={
              summary?.total_active ??
              0
            }
          />

          <SummaryCard
            label="Responses"
            value={
              (summary?.responded ??
                0) +
              (summary?.meetings_arranged ??
                0) +
              (summary?.support_in_principle ??
                0) +
              (summary?.offers_received ??
                0) +
              (summary?.confirmed_partners ??
                0)
            }
          />

          <SummaryCard
            label="Offers Received"
            value={
              summary?.offers_received ??
              0
            }
          />

          <SummaryCard
            label="Confirmed"
            value={
              summary?.confirmed_partners ??
              0
            }
          />

          <SummaryCard
            label="Publicly Recognised"
            value={
              summary?.publicly_recognised ??
              0
            }
          />
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <ValueCard
            label="Commercial Value"
            value={formatCurrency(
              summary
                ?.estimated_commercial_value_gbp,
            )}
            helper="Normal commercial value of recorded support"
          />

          <ValueCard
            label="Campaign Spend"
            value={formatCurrency(
              summary
                ?.campaign_cost_gbp,
            )}
            helper="Amount actually payable by the campaign"
          />

          <ValueCard
            label="Contributed Value"
            value={formatCurrency(
              summary
                ?.contributed_value_gbp,
            )}
            helper="Commercial value less campaign cost"
          />
        </section>

        {showAddForm ? (
          <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
              <h2 className="text-xl font-black">
                Add outreach record
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Public recognition remains disabled by
                default. It can be approved separately
                once permission has been received.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-8 p-6 sm:p-8"
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Field
                  label="Organisation / person"
                  required
                >
                  <input
                    required
                    value={
                      form.organisationName
                    }
                    onChange={(event) =>
                      updateForm(
                        "organisationName",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="e.g. Blackett-Ord Conservation Engineering"
                  />
                </Field>

                <Field label="Contact name">
                  <input
                    value={
                      form.contactName
                    }
                    onChange={(event) =>
                      updateForm(
                        "contactName",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="Contact name"
                  />
                </Field>

                <Field label="Job title">
                  <input
                    value={
                      form.contactJobTitle
                    }
                    onChange={(event) =>
                      updateForm(
                        "contactJobTitle",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="Job title"
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(event) =>
                      updateForm(
                        "email",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="email@example.com"
                  />
                </Field>

                <Field label="Phone">
                  <input
                    value={
                      form.phone
                    }
                    onChange={(event) =>
                      updateForm(
                        "phone",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="Phone number"
                  />
                </Field>

                <Field label="Website">
                  <input
                    value={
                      form.websiteUrl
                    }
                    onChange={(event) =>
                      updateForm(
                        "websiteUrl",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="www.example.co.uk"
                  />
                </Field>

                <Field
                  label="Relationship"
                  required
                >
                  <select
                    value={
                      form.relationshipType
                    }
                    onChange={(event) =>
                      updateForm(
                        "relationshipType",
                        event.target
                          .value as RelationshipType,
                      )
                    }
                    className={inputClass}
                  >
                    {RELATIONSHIP_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="Sector / trade">
                  <input
                    value={
                      form.sector
                    }
                    onChange={(event) =>
                      updateForm(
                        "sector",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="e.g. Conservation engineering"
                  />
                </Field>

                <Field
                  label="Status"
                  required
                >
                  <select
                    value={
                      form.status
                    }
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target
                          .value as PartnershipStatus,
                      )
                    }
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    value={
                      form.priority
                    }
                    onChange={(event) =>
                      updateForm(
                        "priority",
                        event.target
                          .value as Priority,
                      )
                    }
                    className={inputClass}
                  >
                    {PRIORITY_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="Contact method">
                  <select
                    value={
                      form.contactMethod
                    }
                    onChange={(event) =>
                      updateForm(
                        "contactMethod",
                        event.target
                          .value as ContactMethod,
                      )
                    }
                    className={inputClass}
                  >
                    {CONTACT_METHOD_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="First contacted">
                  <input
                    type="date"
                    value={
                      form.firstContactedAt
                    }
                    onChange={(event) =>
                      updateForm(
                        "firstContactedAt",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="What support did we ask for?">
                  <textarea
                    value={
                      form.supportRequested
                    }
                    onChange={(event) =>
                      updateForm(
                        "supportRequested",
                        event.target.value,
                      )
                    }
                    className={`${inputClass} min-h-32 resize-y`}
                    placeholder="Professional inspection, materials, equipment, labour, technical advice, partnership support..."
                  />
                </Field>

                <Field label="Internal notes">
                  <textarea
                    value={
                      form.internalNotes
                    }
                    onChange={(event) =>
                      updateForm(
                        "internalNotes",
                        event.target.value,
                      )
                    }
                    className={`${inputClass} min-h-32 resize-y`}
                    placeholder="Anything useful for campaign management..."
                  />
                </Field>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() =>
                    setShowAddForm(
                      false,
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  disabled={
                    saving
                  }
                  type="submit"
                  className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Add to Register"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
              <div>
                <h2 className="text-2xl font-black">
                  Outreach Register
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  {loading
                    ? "Loading records..."
                    : `${visibleCount} record${visibleCount === 1 ? "" : "s"} shown`}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={
                    search
                  }
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="Search..."
                />

                <select
                  value={
                    statusFilter
                  }
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    All statuses
                  </option>

                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    relationshipFilter
                  }
                  onChange={(event) =>
                    setRelationshipFilter(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    All relationships
                  </option>

                  {RELATIONSHIP_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm font-semibold text-slate-500">
              Loading partnership register...
            </div>
          ) : partnerships.length ===
            0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-black text-slate-800">
                No records found
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Add your first outreach record or change
                the current filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {partnerships.map(
                (partnership) => (
                  <article
                    key={
                      partnership.id
                    }
                    className="p-5 transition hover:bg-slate-50 sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-slate-950">
                            {
                              partnership.organisation_name
                            }
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-black ${getStatusClass(
                              partnership.status,
                            )}`}
                          >
                            {getStatusLabel(
                              partnership.status,
                            )}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityClass(
                              partnership.priority,
                            )}`}
                          >
                            {
                              partnership.priority
                            }
                          </span>

                          {partnership.display_publicly ? (
                            <span className="rounded-full bg-[#D4AF37]/15 px-2.5 py-1 text-xs font-black text-[#806812]">
                              Public
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                          <span>
                            {getRelationshipLabel(
                              partnership.relationship_type,
                            )}
                          </span>

                          {partnership.sector ? (
                            <span>
                              {
                                partnership.sector
                              }
                            </span>
                          ) : null}

                          {partnership.contact_name ? (
                            <span>
                              Contact:{" "}
                              {
                                partnership.contact_name
                              }
                            </span>
                          ) : null}

                          <span>
                            First contact:{" "}
                            {formatDate(
                              partnership.first_contacted_at,
                            )}
                          </span>
                        </div>

                        {partnership.offer_summary ? (
                          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
                            <strong>
                              Offer:
                            </strong>{" "}
                            {
                              partnership.offer_summary
                            }
                          </p>
                        ) : null}
                      </div>

                      <div className="grid min-w-[290px] gap-3 sm:grid-cols-3 xl:w-[430px]">
                        <MiniMetric
                          label="Value"
                          value={
                            partnership
                              .estimated_commercial_value_gbp
                              ? formatCurrency(
                                  partnership
                                    .estimated_commercial_value_gbp,
                                )
                              : "—"
                          }
                        />

                        <MiniMetric
                          label="Campaign Cost"
                          value={
                            partnership
                              .campaign_cost_gbp
                              ? formatCurrency(
                                  partnership.campaign_cost_gbp,
                                )
                              : "—"
                          }
                        />

                        <MiniMetric
                          label="Contributed"
                          value={
                            partnership
                              .contribution_value_gbp
                              ? formatCurrency(
                                  partnership.contribution_value_gbp,
                                )
                              : "—"
                          }
                        />

                        <Link
                          href={`/savewooltonbaths/admin/partnerships/${partnership.id}`}
                          className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-black text-slate-800 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                        >
                          Open Record →
                        </Link>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#B8941F] focus:ring-4 focus:ring-[#D4AF37]/10";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}

        {required ? (
          <span className="ml-1 text-red-600">
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ValueCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-slate-700">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-100 px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}