"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

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

type MeetingFormat =
  | "in_person"
  | "phone"
  | "teams"
  | "zoom"
  | "google_meet"
  | "other";

type ContributionType =
  | "professional_services"
  | "materials"
  | "equipment"
  | "labour"
  | "discount"
  | "technical_advice"
  | "survey_report"
  | "public_support"
  | "media_coverage"
  | "academic_support"
  | "funding"
  | "other";

type PublicCategory =
  | "professional_partners"
  | "heritage_construction"
  | "engineering_energy"
  | "community"
  | "academic"
  | "media_awareness"
  | "public_sector"
  | "other";

type Partnership = {
  id: string;

  organisation_name: string;

  contact_name: string | null;
  contact_job_title: string | null;

  email: string | null;
  phone: string | null;
  website_url: string | null;
  organisation_address: string | null;

  relationship_type: RelationshipType;
  sector: string | null;

  status: PartnershipStatus;
  priority: Priority;

  first_contacted_at: string | null;
  last_contacted_at: string | null;
  last_response_at: string | null;

  contact_method: ContactMethod | null;
  referred_by: string | null;

  next_follow_up_at: string | null;

  meeting_scheduled_at: string | null;
  meeting_location: string | null;
  meeting_format: MeetingFormat | null;
  meeting_notes: string | null;

  support_requested: string | null;
  requested_category: string | null;

  offer_summary: string | null;
  offer_details: string | null;

  contribution_type:
    | ContributionType
    | null;

  estimated_commercial_value_gbp:
    | number
    | null;

  campaign_cost_gbp:
    | number
    | null;

  contribution_value_gbp:
    | number
    | null;

  offer_conditions: string | null;

  offer_received_at: string | null;
  offer_confirmed_at: string | null;

  access_required: boolean;
  council_access_required: boolean;

  dependency_notes: string | null;
  action_required: string | null;

  internal_notes: string | null;

  evidence_reference: string | null;
  document_reference: string | null;

  logo_url: string | null;
  photo_url: string | null;

  display_publicly: boolean;

  public_name_approved: boolean;
  public_logo_approved: boolean;
  public_photo_approved: boolean;
  public_wording_approved: boolean;

  public_permission_received_at:
    | string
    | null;

  approved_public_name: string | null;
  approved_public_title: string | null;
  approved_public_wording: string | null;

  public_category:
    | PublicCategory
    | null;

  public_website_url: string | null;

  display_order: number;

  confirmed_partner_since:
    | string
    | null;

  archived: boolean;
  archived_at: string | null;

  created_at: string;
  updated_at: string;
};

type HistoryEvent = {
  id: string;
  partnership_id: string;

  event_type: string;
  summary: string;
  details: string | null;

  happened_at: string;
  created_at: string;
};

type RecordResponse = {
  ok: boolean;

  partnership?: Partnership;
  history?: HistoryEvent[];

  error?: string;
};

type UpdateResponse = {
  ok: boolean;

  partnership?: Partnership;

  message?: string;
  error?: string;
};

type HistoryResponse = {
  ok: boolean;

  historyEvent?: HistoryEvent;

  message?: string;
  error?: string;
};

type FormState = {
  organisationName: string;

  contactName: string;
  contactJobTitle: string;

  email: string;
  phone: string;
  websiteUrl: string;
  organisationAddress: string;

  relationshipType:
    RelationshipType;

  sector: string;

  status:
    PartnershipStatus;

  priority:
    Priority;

  firstContactedAt: string;
  lastContactedAt: string;
  lastResponseAt: string;

  contactMethod:
    ContactMethod | "";

  referredBy: string;

  nextFollowUpAt: string;

  meetingScheduledAt: string;
  meetingLocation: string;

  meetingFormat:
    MeetingFormat | "";

  meetingNotes: string;

  supportRequested: string;
  requestedCategory: string;

  offerSummary: string;
  offerDetails: string;

  contributionType:
    ContributionType | "";

  estimatedCommercialValueGbp: string;
  campaignCostGbp: string;

  offerConditions: string;

  offerReceivedAt: string;
  offerConfirmedAt: string;

  accessRequired: boolean;
  councilAccessRequired: boolean;

  dependencyNotes: string;
  actionRequired: string;

  internalNotes: string;

  evidenceReference: string;
  documentReference: string;

  logoUrl: string;
  photoUrl: string;

  displayPublicly: boolean;

  publicNameApproved: boolean;
  publicLogoApproved: boolean;
  publicPhotoApproved: boolean;
  publicWordingApproved: boolean;

  publicPermissionReceivedAt: string;

  approvedPublicName: string;
  approvedPublicTitle: string;
  approvedPublicWording: string;

  publicCategory:
    PublicCategory | "";

  publicWebsiteUrl: string;

  displayOrder: string;

  confirmedPartnerSince: string;

  archived: boolean;
};

type HistoryFormState = {
  eventType: string;
  summary: string;
  details: string;
  happenedAt: string;
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

const MEETING_FORMAT_OPTIONS: Array<{
  value: MeetingFormat;
  label: string;
}> = [
  {
    value: "in_person",
    label: "In Person",
  },
  {
    value: "phone",
    label: "Phone",
  },
  {
    value: "teams",
    label: "Microsoft Teams",
  },
  {
    value: "zoom",
    label: "Zoom",
  },
  {
    value: "google_meet",
    label: "Google Meet",
  },
  {
    value: "other",
    label: "Other",
  },
];

const CONTRIBUTION_OPTIONS: Array<{
  value: ContributionType;
  label: string;
}> = [
  {
    value: "professional_services",
    label: "Professional Services",
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
    value: "labour",
    label: "Labour",
  },
  {
    value: "discount",
    label: "Discount / Preferential Pricing",
  },
  {
    value: "technical_advice",
    label: "Technical Advice",
  },
  {
    value: "survey_report",
    label: "Survey / Report",
  },
  {
    value: "public_support",
    label: "Public Support",
  },
  {
    value: "media_coverage",
    label: "Media Coverage",
  },
  {
    value: "academic_support",
    label: "Academic Support",
  },
  {
    value: "funding",
    label: "Funding",
  },
  {
    value: "other",
    label: "Other",
  },
];

const PUBLIC_CATEGORY_OPTIONS: Array<{
  value: PublicCategory;
  label: string;
}> = [
  {
    value: "professional_partners",
    label: "Professional Partners",
  },
  {
    value: "heritage_construction",
    label: "Heritage & Construction",
  },
  {
    value: "engineering_energy",
    label: "Engineering & Energy",
  },
  {
    value: "community",
    label: "Community",
  },
  {
    value: "academic",
    label: "Academic",
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

const HISTORY_OPTIONS = [
  {
    value: "contact",
    label: "Contact",
  },
  {
    value: "response",
    label: "Response",
  },
  {
    value: "meeting",
    label: "Meeting",
  },
  {
    value: "offer",
    label: "Offer",
  },
  {
    value: "confirmation",
    label: "Confirmation",
  },
  {
    value: "public_permission",
    label: "Public Permission",
  },
  {
    value: "note",
    label: "General Note",
  },
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#B8941F] focus:ring-4 focus:ring-[#D4AF37]/10";

function dateInputValue(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function dateTimeInputValue(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const local =
    new Date(
      date.getTime() -
        offset * 60000,
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "Not recorded";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
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
  ).format(date);
}

function formatCurrency(
  value:
    | number
    | null,
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

function statusLabel(
  value: PartnershipStatus,
): string {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value === value,
    )?.label ?? value
  );
}

function recordToForm(
  record: Partnership,
): FormState {
  return {
    organisationName:
      record.organisation_name,

    contactName:
      record.contact_name ?? "",

    contactJobTitle:
      record.contact_job_title ?? "",

    email:
      record.email ?? "",

    phone:
      record.phone ?? "",

    websiteUrl:
      record.website_url ?? "",

    organisationAddress:
      record.organisation_address ?? "",

    relationshipType:
      record.relationship_type,

    sector:
      record.sector ?? "",

    status:
      record.status,

    priority:
      record.priority,

    firstContactedAt:
      dateTimeInputValue(
        record.first_contacted_at,
      ),

    lastContactedAt:
      dateTimeInputValue(
        record.last_contacted_at,
      ),

    lastResponseAt:
      dateTimeInputValue(
        record.last_response_at,
      ),

    contactMethod:
      record.contact_method ?? "",

    referredBy:
      record.referred_by ?? "",

    nextFollowUpAt:
      dateTimeInputValue(
        record.next_follow_up_at,
      ),

    meetingScheduledAt:
      dateTimeInputValue(
        record.meeting_scheduled_at,
      ),

    meetingLocation:
      record.meeting_location ?? "",

    meetingFormat:
      record.meeting_format ?? "",

    meetingNotes:
      record.meeting_notes ?? "",

    supportRequested:
      record.support_requested ?? "",

    requestedCategory:
      record.requested_category ?? "",

    offerSummary:
      record.offer_summary ?? "",

    offerDetails:
      record.offer_details ?? "",

    contributionType:
      record.contribution_type ?? "",

    estimatedCommercialValueGbp:
      record.estimated_commercial_value_gbp ===
      null
        ? ""
        : String(
            record.estimated_commercial_value_gbp,
          ),

    campaignCostGbp:
      record.campaign_cost_gbp === null
        ? ""
        : String(
            record.campaign_cost_gbp,
          ),

    offerConditions:
      record.offer_conditions ?? "",

    offerReceivedAt:
      dateTimeInputValue(
        record.offer_received_at,
      ),

    offerConfirmedAt:
      dateTimeInputValue(
        record.offer_confirmed_at,
      ),

    accessRequired:
      record.access_required,

    councilAccessRequired:
      record.council_access_required,

    dependencyNotes:
      record.dependency_notes ?? "",

    actionRequired:
      record.action_required ?? "",

    internalNotes:
      record.internal_notes ?? "",

    evidenceReference:
      record.evidence_reference ?? "",

    documentReference:
      record.document_reference ?? "",

    logoUrl:
      record.logo_url ?? "",

    photoUrl:
      record.photo_url ?? "",

    displayPublicly:
      record.display_publicly,

    publicNameApproved:
      record.public_name_approved,

    publicLogoApproved:
      record.public_logo_approved,

    publicPhotoApproved:
      record.public_photo_approved,

    publicWordingApproved:
      record.public_wording_approved,

    publicPermissionReceivedAt:
      dateTimeInputValue(
        record.public_permission_received_at,
      ),

    approvedPublicName:
      record.approved_public_name ?? "",

    approvedPublicTitle:
      record.approved_public_title ?? "",

    approvedPublicWording:
      record.approved_public_wording ?? "",

    publicCategory:
      record.public_category ?? "",

    publicWebsiteUrl:
      record.public_website_url ?? "",

    displayOrder:
      String(
        record.display_order ?? 100,
      ),

    confirmedPartnerSince:
      record.confirmed_partner_since
        ? dateInputValue(
            record.confirmed_partner_since,
          )
        : "",

    archived:
      record.archived,
  };
}

export default function PartnershipRecordPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const partnershipId =
    params.id;

  const [
    record,
    setRecord,
  ] =
    useState<Partnership | null>(
      null,
    );

  const [
    history,
    setHistory,
  ] =
    useState<HistoryEvent[]>(
      [],
    );

  const [
    form,
    setForm,
  ] =
    useState<FormState | null>(
      null,
    );

  const [
    historyForm,
    setHistoryForm,
  ] =
    useState<HistoryFormState>({
      eventType: "note",
      summary: "",
      details: "",
      happenedAt: "",
    });

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
    savingHistory,
    setSavingHistory,
  ] =
    useState(false);

  const [
    archiving,
    setArchiving,
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

  const loadRecord =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              `/api/savewooltonbaths/admin/partnerships/${partnershipId}`,
              {
                method: "GET",
                cache: "no-store",
              },
            );

          const data =
            (await response.json()) as RecordResponse;

          if (
            !response.ok ||
            !data.ok ||
            !data.partnership
          ) {
            throw new Error(
              data.error ??
                "Unable to load the partnership record.",
            );
          }

          setRecord(
            data.partnership,
          );

          setForm(
            recordToForm(
              data.partnership,
            ),
          );

          setHistory(
            data.history ?? [],
          );
        } catch (
          caughtError
        ) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load the partnership record.",
          );
        } finally {
          setLoading(false);
        }
      },
      [partnershipId],
    );

  useEffect(
    () => {
      void loadRecord();
    },
    [loadRecord],
  );

  const contributionPreview =
    useMemo(
      () => {
        if (!form) {
          return 0;
        }

        const commercial =
          Number(
            form.estimatedCommercialValueGbp ||
              0,
          );

        const cost =
          Number(
            form.campaignCostGbp ||
              0,
          );

        if (
          !Number.isFinite(
            commercial,
          ) ||
          !Number.isFinite(
            cost,
          )
        ) {
          return 0;
        }

        return Math.max(
          0,
          commercial - cost,
        );
      },
      [form],
    );

  function updateForm<
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K],
  ) {
    setForm(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          [key]: value,
        };
      },
    );
  }

  function updateHistoryForm<
    K extends keyof HistoryFormState,
  >(
    key: K,
    value: HistoryFormState[K],
  ) {
    setHistoryForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  }

  async function saveRecord(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/savewooltonbaths/admin/partnerships/${partnershipId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ...form,

                firstContactedAt:
                  form.firstContactedAt ||
                  null,

                lastContactedAt:
                  form.lastContactedAt ||
                  null,

                lastResponseAt:
                  form.lastResponseAt ||
                  null,

                nextFollowUpAt:
                  form.nextFollowUpAt ||
                  null,

                meetingScheduledAt:
                  form.meetingScheduledAt ||
                  null,

                offerReceivedAt:
                  form.offerReceivedAt ||
                  null,

                offerConfirmedAt:
                  form.offerConfirmedAt ||
                  null,

                publicPermissionReceivedAt:
                  form.publicPermissionReceivedAt ||
                  null,

                confirmedPartnerSince:
                  form.confirmedPartnerSince ||
                  null,

                estimatedCommercialValueGbp:
                  form.estimatedCommercialValueGbp ||
                  null,

                campaignCostGbp:
                  form.campaignCostGbp ||
                  null,

                displayOrder:
                  form.displayOrder ||
                  "100",
              }),
          },
        );

      const data =
        (await response.json()) as UpdateResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.partnership
      ) {
        throw new Error(
          data.error ??
            "Unable to save the partnership record.",
        );
      }

      setRecord(
        data.partnership,
      );

      setForm(
        recordToForm(
          data.partnership,
        ),
      );

      setMessage(
        "Partnership record saved.",
      );

      await loadRecord();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the partnership record.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addHistoryEvent(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSavingHistory(true);
    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/savewooltonbaths/admin/partnerships/${partnershipId}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                eventType:
                  historyForm.eventType,

                summary:
                  historyForm.summary,

                details:
                  historyForm.details,

                happenedAt:
                  historyForm.happenedAt ||
                  null,
              }),
          },
        );

      const data =
        (await response.json()) as HistoryResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ??
            "Unable to save the history event.",
        );
      }

      setHistoryForm({
        eventType: "note",
        summary: "",
        details: "",
        happenedAt: "",
      });

      setMessage(
        "History event added.",
      );

      await loadRecord();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the history event.",
      );
    } finally {
      setSavingHistory(false);
    }
  }

  async function archiveRecord() {
    if (
      !window.confirm(
        "Archive this partnership record? It will remain in the database and audit history.",
      )
    ) {
      return;
    }

    setArchiving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/savewooltonbaths/admin/partnerships/${partnershipId}`,
          {
            method: "DELETE",
          },
        );

      const data =
        (await response.json()) as UpdateResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ??
            "Unable to archive the partnership record.",
        );
      }

      router.push(
        "/savewooltonbaths/admin/partnerships",
      );

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to archive the partnership record.",
      );

      setArchiving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="font-black text-slate-700">
            Loading partnership record...
          </p>
        </div>
      </main>
    );
  }

  if (
    !record ||
    !form
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-xl font-black text-red-900">
            Partnership record unavailable
          </h1>

          <p className="mt-3 text-red-800">
            {error ||
              "The requested partnership record could not be loaded."}
          </p>

          <Link
            href="/savewooltonbaths/admin/partnerships"
            className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            ← Return to Register
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-[#071827] to-[#0C2940] text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-[#F5D97B]">
                  Partnership Record
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                  {statusLabel(
                    record.status,
                  )}
                </span>

                {record.display_publicly ? (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                    Public Recognition Enabled
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">
                    Private
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                {record.organisation_name}
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Last updated{" "}
                {formatDateTime(
                  record.updated_at,
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/savewooltonbaths/admin/partnerships"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black transition hover:bg-white/10"
              >
                ← Partnership Register
              </Link>

              <button
                type="button"
                disabled={
                  archiving
                }
                onClick={() => {
                  void archiveRecord();
                }}
                className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {archiving
                  ? "Archiving..."
                  : "Archive Record"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        {error ? (
          <Notice
            type="error"
            text={error}
          />
        ) : null}

        {message ? (
          <Notice
            type="success"
            text={message}
          />
        ) : null}

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <Metric
            label="Commercial Value"
            value={formatCurrency(
              record.estimated_commercial_value_gbp,
            )}
          />

          <Metric
            label="Campaign Cost"
            value={formatCurrency(
              record.campaign_cost_gbp,
            )}
          />

          <Metric
            label="Contributed Value"
            value={formatCurrency(
              record.contribution_value_gbp,
            )}
            helper={`Current form estimate: ${formatCurrency(
              contributionPreview,
            )}`}
          />
        </section>

        <form
          onSubmit={saveRecord}
          className="space-y-8"
        >
          <Section
            title="Organisation & Contact"
            description="Private campaign contact information and relationship classification."
          >
            <Grid>
              <Field
                label="Organisation / person"
                required
              >
                <input
                  required
                  className={inputClass}
                  value={
                    form.organisationName
                  }
                  onChange={(event) =>
                    updateForm(
                      "organisationName",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Contact name">
                <input
                  className={inputClass}
                  value={
                    form.contactName
                  }
                  onChange={(event) =>
                    updateForm(
                      "contactName",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Job title">
                <input
                  className={inputClass}
                  value={
                    form.contactJobTitle
                  }
                  onChange={(event) =>
                    updateForm(
                      "contactJobTitle",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={
                    form.email
                  }
                  onChange={(event) =>
                    updateForm(
                      "email",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Phone">
                <input
                  className={inputClass}
                  value={
                    form.phone
                  }
                  onChange={(event) =>
                    updateForm(
                      "phone",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Website">
                <input
                  className={inputClass}
                  value={
                    form.websiteUrl
                  }
                  onChange={(event) =>
                    updateForm(
                      "websiteUrl",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Relationship">
                <select
                  className={inputClass}
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
                  className={inputClass}
                  value={
                    form.sector
                  }
                  onChange={(event) =>
                    updateForm(
                      "sector",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Referred by">
                <input
                  className={inputClass}
                  value={
                    form.referredBy
                  }
                  onChange={(event) =>
                    updateForm(
                      "referredBy",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </Grid>

            <Field label="Organisation address">
              <textarea
                className={`${inputClass} min-h-24`}
                value={
                  form.organisationAddress
                }
                onChange={(event) =>
                  updateForm(
                    "organisationAddress",
                    event.target.value,
                  )
                }
              />
            </Field>
          </Section>

          <Section
            title="Campaign Status & Contact"
            description="Track exactly where this relationship currently stands."
          >
            <Grid>
              <Field label="Status">
                <select
                  className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
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
                >
                  <option value="">
                    Not recorded
                  </option>

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

              <DateTimeField
                label="First contacted"
                value={
                  form.firstContactedAt
                }
                onChange={(value) =>
                  updateForm(
                    "firstContactedAt",
                    value,
                  )
                }
              />

              <DateTimeField
                label="Last contacted"
                value={
                  form.lastContactedAt
                }
                onChange={(value) =>
                  updateForm(
                    "lastContactedAt",
                    value,
                  )
                }
              />

              <DateTimeField
                label="Last response"
                value={
                  form.lastResponseAt
                }
                onChange={(value) =>
                  updateForm(
                    "lastResponseAt",
                    value,
                  )
                }
              />

              <DateTimeField
                label="Next follow-up"
                value={
                  form.nextFollowUpAt
                }
                onChange={(value) =>
                  updateForm(
                    "nextFollowUpAt",
                    value,
                  )
                }
              />
            </Grid>

            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Support requested">
                <textarea
                  className={`${inputClass} min-h-32`}
                  value={
                    form.supportRequested
                  }
                  onChange={(event) =>
                    updateForm(
                      "supportRequested",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Requested category / scope">
                <textarea
                  className={`${inputClass} min-h-32`}
                  value={
                    form.requestedCategory
                  }
                  onChange={(event) =>
                    updateForm(
                      "requestedCategory",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Meeting"
            description="Record arranged meetings and the important outcomes."
          >
            <Grid>
              <DateTimeField
                label="Meeting scheduled"
                value={
                  form.meetingScheduledAt
                }
                onChange={(value) =>
                  updateForm(
                    "meetingScheduledAt",
                    value,
                  )
                }
              />

              <Field label="Meeting format">
                <select
                  className={inputClass}
                  value={
                    form.meetingFormat
                  }
                  onChange={(event) =>
                    updateForm(
                      "meetingFormat",
                      event.target
                        .value as MeetingFormat,
                    )
                  }
                >
                  <option value="">
                    Not recorded
                  </option>

                  {MEETING_FORMAT_OPTIONS.map(
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

              <Field label="Meeting location">
                <input
                  className={inputClass}
                  value={
                    form.meetingLocation
                  }
                  onChange={(event) =>
                    updateForm(
                      "meetingLocation",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </Grid>

            <Field label="Meeting notes">
              <textarea
                className={`${inputClass} min-h-36`}
                value={
                  form.meetingNotes
                }
                onChange={(event) =>
                  updateForm(
                    "meetingNotes",
                    event.target.value,
                  )
                }
              />
            </Field>
          </Section>

          <Section
            title="Offer & Contribution"
            description="Record the normal commercial value, what the campaign actually pays, and the resulting contributed value."
          >
            <Grid>
              <Field label="Contribution type">
                <select
                  className={inputClass}
                  value={
                    form.contributionType
                  }
                  onChange={(event) =>
                    updateForm(
                      "contributionType",
                      event.target
                        .value as ContributionType,
                    )
                  }
                >
                  <option value="">
                    Not recorded
                  </option>

                  {CONTRIBUTION_OPTIONS.map(
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

              <Field label="Commercial value (£)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={
                    form.estimatedCommercialValueGbp
                  }
                  onChange={(event) =>
                    updateForm(
                      "estimatedCommercialValueGbp",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Campaign cost (£)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={
                    form.campaignCostGbp
                  }
                  onChange={(event) =>
                    updateForm(
                      "campaignCostGbp",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                  Contributed Value
                </p>

                <p className="mt-1 text-xl font-black text-emerald-950">
                  {formatCurrency(
                    contributionPreview,
                  )}
                </p>
              </div>

              <DateTimeField
                label="Offer received"
                value={
                  form.offerReceivedAt
                }
                onChange={(value) =>
                  updateForm(
                    "offerReceivedAt",
                    value,
                  )
                }
              />

              <DateTimeField
                label="Offer confirmed"
                value={
                  form.offerConfirmedAt
                }
                onChange={(value) =>
                  updateForm(
                    "offerConfirmedAt",
                    value,
                  )
                }
              />

              <Field label="Confirmed partner since">
                <input
                  type="date"
                  className={inputClass}
                  value={
                    form.confirmedPartnerSince
                  }
                  onChange={(event) =>
                    updateForm(
                      "confirmedPartnerSince",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </Grid>

            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Offer summary">
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={
                    form.offerSummary
                  }
                  onChange={(event) =>
                    updateForm(
                      "offerSummary",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Offer details">
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={
                    form.offerDetails
                  }
                  onChange={(event) =>
                    updateForm(
                      "offerDetails",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </div>

            <Field label="Conditions attached to offer">
              <textarea
                className={`${inputClass} min-h-28`}
                value={
                  form.offerConditions
                }
                onChange={(event) =>
                  updateForm(
                    "offerConditions",
                    event.target.value,
                  )
                }
              />
            </Field>
          </Section>

          <Section
            title="Access, Dependencies & Actions"
            description="Especially useful for professional inspections that cannot proceed until authorised access is provided."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleCard
                checked={
                  form.accessRequired
                }
                onChange={(checked) =>
                  updateForm(
                    "accessRequired",
                    checked,
                  )
                }
                title="Site access required"
                description="This organisation needs physical access to Woolton Baths."
              />

              <ToggleCard
                checked={
                  form.councilAccessRequired
                }
                onChange={(checked) =>
                  updateForm(
                    "councilAccessRequired",
                    checked,
                  )
                }
                title="Council authorisation required"
                description="The next action depends on Liverpool City Council providing or approving access."
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Dependencies">
                <textarea
                  className={`${inputClass} min-h-32`}
                  value={
                    form.dependencyNotes
                  }
                  onChange={(event) =>
                    updateForm(
                      "dependencyNotes",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Next action required">
                <textarea
                  className={`${inputClass} min-h-32`}
                  value={
                    form.actionRequired
                  }
                  onChange={(event) =>
                    updateForm(
                      "actionRequired",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Evidence & Internal Notes"
            description="Private campaign evidence, references and management notes."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Evidence reference">
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={
                    form.evidenceReference
                  }
                  onChange={(event) =>
                    updateForm(
                      "evidenceReference",
                      event.target.value,
                    )
                  }
                  placeholder="Email date, message reference, correspondence details..."
                />
              </Field>

              <Field label="Document reference">
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={
                    form.documentReference
                  }
                  onChange={(event) =>
                    updateForm(
                      "documentReference",
                      event.target.value,
                    )
                  }
                  placeholder="Report, survey, quotation, folder or document reference..."
                />
              </Field>
            </div>

            <Field label="Internal notes">
              <textarea
                className={`${inputClass} min-h-40`}
                value={
                  form.internalNotes
                }
                onChange={(event) =>
                  updateForm(
                    "internalNotes",
                    event.target.value,
                  )
                }
              />
            </Field>
          </Section>

          <Section
            title="Public Recognition"
            description="Nothing should be published here until the person or organisation has given permission for the relevant information."
          >
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-black text-amber-950">
                Publication safeguard
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-900">
                Turning on public display requires an
                approved public name and public category.
                Logo, photo and wording approvals remain
                separate so permission can be recorded
                precisely.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ToggleCard
                checked={
                  form.displayPublicly
                }
                onChange={(checked) =>
                  updateForm(
                    "displayPublicly",
                    checked,
                  )
                }
                title="Display publicly"
                description="Allow this approved record to appear on the future campaign supporters/partners page."
              />

              <ToggleCard
                checked={
                  form.publicNameApproved
                }
                onChange={(checked) =>
                  updateForm(
                    "publicNameApproved",
                    checked,
                  )
                }
                title="Name approved"
                description="Permission to publish the approved name."
              />

              <ToggleCard
                checked={
                  form.publicLogoApproved
                }
                onChange={(checked) =>
                  updateForm(
                    "publicLogoApproved",
                    checked,
                  )
                }
                title="Logo approved"
                description="Permission to display the organisation logo."
              />

              <ToggleCard
                checked={
                  form.publicPhotoApproved
                }
                onChange={(checked) =>
                  updateForm(
                    "publicPhotoApproved",
                    checked,
                  )
                }
                title="Photo approved"
                description="Permission to display the supplied photograph."
              />

              <ToggleCard
                checked={
                  form.publicWordingApproved
                }
                onChange={(checked) =>
                  updateForm(
                    "publicWordingApproved",
                    checked,
                  )
                }
                title="Wording approved"
                description="The public recognition wording has been approved."
              />
            </div>

            <Grid>
              <DateTimeField
                label="Permission received"
                value={
                  form.publicPermissionReceivedAt
                }
                onChange={(value) =>
                  updateForm(
                    "publicPermissionReceivedAt",
                    value,
                  )
                }
              />

              <Field label="Public category">
                <select
                  className={inputClass}
                  value={
                    form.publicCategory
                  }
                  onChange={(event) =>
                    updateForm(
                      "publicCategory",
                      event.target
                        .value as PublicCategory,
                    )
                  }
                >
                  <option value="">
                    Not selected
                  </option>

                  {PUBLIC_CATEGORY_OPTIONS.map(
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

              <Field label="Display order">
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={inputClass}
                  value={
                    form.displayOrder
                  }
                  onChange={(event) =>
                    updateForm(
                      "displayOrder",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Approved public name">
                <input
                  className={inputClass}
                  value={
                    form.approvedPublicName
                  }
                  onChange={(event) =>
                    updateForm(
                      "approvedPublicName",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Approved public title">
                <input
                  className={inputClass}
                  value={
                    form.approvedPublicTitle
                  }
                  onChange={(event) =>
                    updateForm(
                      "approvedPublicTitle",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Professional Supporter"
                />
              </Field>

              <Field label="Public website">
                <input
                  className={inputClass}
                  value={
                    form.publicWebsiteUrl
                  }
                  onChange={(event) =>
                    updateForm(
                      "publicWebsiteUrl",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Logo URL">
                <input
                  className={inputClass}
                  value={
                    form.logoUrl
                  }
                  onChange={(event) =>
                    updateForm(
                      "logoUrl",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Photo URL">
                <input
                  className={inputClass}
                  value={
                    form.photoUrl
                  }
                  onChange={(event) =>
                    updateForm(
                      "photoUrl",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </Grid>

            <Field label="Approved public wording">
              <textarea
                className={`${inputClass} min-h-32`}
                value={
                  form.approvedPublicWording
                }
                onChange={(event) =>
                  updateForm(
                    "approvedPublicWording",
                    event.target.value,
                  )
                }
                placeholder="Exact approved wording describing their support."
              />
            </Field>
          </Section>

          <div className="sticky bottom-4 z-20 flex justify-end">
            <button
              type="submit"
              disabled={
                saving
              }
              className="rounded-2xl bg-[#D4AF37] px-8 py-4 font-black text-slate-950 shadow-xl transition hover:bg-[#E7C65A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Record..."
                : "Save Partnership Record"}
            </button>
          </div>
        </form>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white sm:px-8">
            <h2 className="text-xl font-black">
              Relationship History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Keep a chronological record of contacts,
              responses, meetings, offers and permissions.
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[420px_1fr]">
            <form
              onSubmit={
                addHistoryEvent
              }
              className="space-y-5"
            >
              <Field label="Event type">
                <select
                  className={inputClass}
                  value={
                    historyForm.eventType
                  }
                  onChange={(event) =>
                    updateHistoryForm(
                      "eventType",
                      event.target.value,
                    )
                  }
                >
                  {HISTORY_OPTIONS.map(
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

              <Field
                label="Summary"
                required
              >
                <input
                  required
                  className={inputClass}
                  value={
                    historyForm.summary
                  }
                  onChange={(event) =>
                    updateHistoryForm(
                      "summary",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Offered initial structural inspection"
                />
              </Field>

              <Field label="Details">
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={
                    historyForm.details
                  }
                  onChange={(event) =>
                    updateHistoryForm(
                      "details",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Event date / time">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={
                    historyForm.happenedAt
                  }
                  onChange={(event) =>
                    updateHistoryForm(
                      "happenedAt",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <button
                type="submit"
                disabled={
                  savingHistory
                }
                className="w-full rounded-xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {savingHistory
                  ? "Saving..."
                  : "Add History Event"}
              </button>
            </form>

            <div>
              {history.length ===
              0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                  No history events recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map(
                    (event) => (
                      <article
                        key={
                          event.id
                        }
                        className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-700">
                              {event.event_type.replace(
                                /_/g,
                                " ",
                              )}
                            </span>

                            <h3 className="mt-3 font-black text-slate-950">
                              {event.summary}
                            </h3>
                          </div>

                          <time className="text-xs font-semibold text-slate-500">
                            {formatDateTime(
                              event.happened_at,
                            )}
                          </time>
                        </div>

                        {event.details ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {event.details}
                          </p>
                        ) : null}
                      </article>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
        <h2 className="text-xl font-black">
          {title}
        </h2>

        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        {children}
      </div>
    </section>
  );
}

function Grid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
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

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="datetime-local"
        className={inputClass}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
      />
    </Field>
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (
    checked: boolean,
  ) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked,
          )
        }
        className="mt-1 h-5 w-5 rounded border-slate-300 accent-[#D4AF37]"
      />

      <span>
        <span className="block font-black text-slate-900">
          {title}
        </span>

        <span className="mt-1 block text-sm leading-6 text-slate-600">
          {description}
        </span>
      </span>
    </label>
  );
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>

      {helper ? (
        <p className="mt-2 text-xs text-slate-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function Notice({
  type,
  text,
}: {
  type:
    | "error"
    | "success";
  text: string;
}) {
  const classes =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div
      className={`mb-6 rounded-2xl border px-5 py-4 font-semibold ${classes}`}
    >
      {text}
    </div>
  );
}