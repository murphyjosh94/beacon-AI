"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgePoundSterling,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  GraduationCap,
  HandHeart,
  Hammer,
  HeartHandshake,
  Landmark,
  Loader2,
  Mail,
  PackageOpen,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";

type SupportType =
  | ""
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

type HeardAboutCampaign =
  | ""
  | "search_engine"
  | "family_friend"
  | "flyer"
  | "poster"
  | "social_media"
  | "door_to_door"
  | "other";

type FormState = {
  name: string;
  email: string;
  phone: string;
  organisation: string;
  postcode: string;
  supportType: SupportType;
  heardAboutCampaign: HeardAboutCampaign;
  tradeProfession: string;
  materialDetails: string;
  equipmentDetails: string;
  sponsorshipDetails: string;
  fundingDetails: string;
  educationDetails: string;
  professionalDetails: string;
  message: string;
  permissionToContact: boolean;
  publicSupport: boolean;
  website: string;
};

type SupportApiResponse = {
  ok?: boolean;
  id?: string;
  message?: string;
  error?: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  phone: "",
  organisation: "",
  postcode: "",
  supportType: "",
  heardAboutCampaign: "",
  tradeProfession: "",
  materialDetails: "",
  equipmentDetails: "",
  sponsorshipDetails: "",
  fundingDetails: "",
  educationDetails: "",
  professionalDetails: "",
  message: "",
  permissionToContact: true,
  publicSupport: false,
  website: "",
};

const heardAboutOptions = [
  { value: "search_engine", label: "Search Engine" },
  { value: "family_friend", label: "Family / Friend" },
  { value: "flyer", label: "Flyer" },
  { value: "poster", label: "Poster" },
  { value: "social_media", label: "Social Media" },
  { value: "door_to_door", label: "Door to Door" },
  { value: "other", label: "Other" },
] as const;

const supportOptions = [
  {
    value: "general",
    label: "I support the campaign",
    description:
      "Add your voice to the community backing the restoration of Woolton Baths.",
    icon: HeartHandshake,
  },
  {
    value: "volunteer",
    label: "Volunteer my time",
    description:
      "Help with community activity, events, administration or practical support.",
    icon: Users,
  },
  {
    value: "trade",
    label: "Skilled trade / professional labour",
    description:
      "Offer qualified or experienced labour towards future restoration work.",
    icon: Hammer,
  },
  {
    value: "materials",
    label: "Donate building materials",
    description:
      "Offer suitable building, roofing, timber or restoration materials.",
    icon: PackageOpen,
  },
  {
    value: "equipment",
    label: "Donate pool or building equipment",
    description:
      "Offer suitable plant, pumps, filtration, heating or related equipment.",
    icon: Wrench,
  },
  {
    value: "sponsorship",
    label: "Business sponsorship",
    description:
      "Discuss financial, material, service or corporate sponsorship.",
    icon: Building2,
  },
  {
    value: "funding",
    label: "Funding / grant support",
    description:
      "Discuss grants, institutional funding or other financial support.",
    icon: BadgePoundSterling,
  },
  {
    value: "education",
    label: "Educational / student partnership",
    description:
      "Universities, colleges, apprenticeships, placements and student projects.",
    icon: GraduationCap,
  },
  {
    value: "professional",
    label: "Technical / professional advice",
    description:
      "Provide specialist knowledge, specifications, surveys or professional guidance.",
    icon: Landmark,
  },
  {
    value: "other",
    label: "Something else",
    description:
      "If you have another way to help, we would still like to hear from you.",
    icon: CircleHelp,
  },
] as const;

function getRequiredDetailError(form: FormState): string | null {
  switch (form.supportType) {
    case "trade":
      return form.tradeProfession.trim()
        ? null
        : "Please tell us your trade, profession or specialist skill.";

    case "materials":
      return form.materialDetails.trim()
        ? null
        : "Please tell us what materials you may be able to provide.";

    case "equipment":
      return form.equipmentDetails.trim()
        ? null
        : "Please tell us what equipment may be available.";

    case "sponsorship":
      return form.sponsorshipDetails.trim()
        ? null
        : "Please tell us about your sponsorship interest.";

    case "funding":
      return form.fundingDetails.trim()
        ? null
        : "Please provide some information about the funding opportunity.";

    case "education":
      return form.educationDetails.trim()
        ? null
        : "Please tell us about the educational partnership.";

    case "professional":
      return form.professionalDetails.trim()
        ? null
        : "Please tell us about your area of professional expertise.";

    default:
      return null;
  }
}

export default function SaveWooltonBathsSupportPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSupport = useMemo(
    () => supportOptions.find((option) => option.value === form.supportType),
    [form.supportType],
  );

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!form.supportType) {
      setError("Please select how you would like to support the campaign.");
      return;
    }

    if (!form.heardAboutCampaign) {
      setError("Please tell us how you heard about the campaign.");
      return;
    }

    if (!form.permissionToContact) {
      setError(
        "Please confirm that we may contact you regarding your offer of support.",
      );
      return;
    }

    const detailError = getRequiredDetailError(form);

    if (detailError) {
      setError(detailError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/savewooltonbaths/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          organisation: form.organisation,
          postcode: form.postcode,
          supportType: form.supportType,
          heardAboutCampaign: form.heardAboutCampaign,
          tradeProfession: form.tradeProfession,
          materialDetails: form.materialDetails,
          equipmentDetails: form.equipmentDetails,
          sponsorshipDetails: form.sponsorshipDetails,
          fundingDetails: form.fundingDetails,
          educationDetails: form.educationDetails,
          professionalDetails: form.professionalDetails,
          message: form.message,
          permissionToContact: form.permissionToContact,
          publicSupport: form.publicSupport,
          website: form.website,
        }),
      });

      let result: SupportApiResponse = {};

      try {
        result = (await response.json()) as SupportApiResponse;
      } catch {
        result = {};
      }

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            "We could not register your support right now. Please try again.",
        );
      }

      setSubmissionId(result.id ?? "");
      setSubmitted(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (submitError) {
      console.error(
        "[Save Woolton Baths Support] Submission failed:",
        submitError,
      );

      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not register your support right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setForm(initialFormState);
    setSubmitted(false);
    setSubmissionId("");
    setError("");
    setIsSubmitting(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (submitted) {
    return (
      <section className="relative overflow-hidden bg-[#071522]">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37] text-black">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            Support Registered
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">
            Thank you for supporting Woolton Baths.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-9 text-slate-300">
            Your registration has been securely received and recorded. The Save
            Woolton Baths project team can now review your offer of support and
            contact you where appropriate.
          </p>

          <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-white/10 bg-white/5 p-7 text-left">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Your selected support
            </p>

            <p className="mt-3 text-xl font-bold text-white">
              {selectedSupport?.label ?? "Support for the campaign"}
            </p>

            <p className="mt-2 leading-7 text-slate-400">
              {selectedSupport?.description}
            </p>

            {submissionId && (
              <p className="mt-5 border-t border-white/10 pt-5 text-xs text-slate-500">
                Registration reference: {submissionId}
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 py-3 font-bold text-white transition hover:border-[#D4AF37]/60 hover:bg-white/5"
            >
              Register Another Offer
            </button>

            <Link
              href="/savewooltonbaths"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3 font-black text-black transition hover:bg-[#E6C75A]"
            >
              Return to Campaign
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-[#071522]">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                <HandHeart className="h-4 w-4" />
                Get Involved
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                Help us bring
                <span className="block text-[#D4AF37]">
                  Woolton Baths back.
                </span>
              </h1>

              <p className="mt-7 max-w-3xl text-lg leading-9 text-slate-300 md:text-xl">
                Saving Woolton Baths will require much more than fundraising.
                We need residents, skilled trades, suppliers, businesses,
                professionals, educational institutions and organisations to
                come together around one practical restoration plan.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <Sparkles className="h-8 w-8 text-[#D4AF37]" />

              <h2 className="mt-5 text-2xl font-black text-white">
                Every kind of support matters.
              </h2>

              <p className="mt-4 leading-8 text-slate-300">
                You do not need to make a financial donation to contribute.
                Your skills, equipment, materials, experience or simply your
                support for the project could make a genuine difference.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F2EFE7] text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <Users className="h-8 w-8 text-[#8D7425]" />
              <h2 className="mt-5 text-xl font-black">
                Show Community Support
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                Registering helps us demonstrate that Woolton residents and the
                wider community want to see this historic facility restored.
              </p>
            </div>

            <div>
              <Hammer className="h-8 w-8 text-[#8D7425]" />
              <h2 className="mt-5 text-xl font-black">
                Build the Trade Coalition
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                Skilled labour, professional expertise and supplier support are
                central to our plan for reducing restoration costs.
              </p>
            </div>

            <div>
              <Landmark className="h-8 w-8 text-[#8D7425]" />
              <h2 className="mt-5 text-xl font-black">
                Strengthen the Proposal
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                A documented network of supporters, businesses and
                professionals can strengthen the evidence behind our Community
                Asset Transfer proposal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
            <aside>
              <div className="lg:sticky lg:top-36">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#8D7425]">
                  Register Your Support
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-tight">
                  Tell us how you would like to help.
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Complete the form and select the type of support you are
                  interested in providing.
                </p>

                <div className="mt-9 space-y-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#8D7425]" />
                    <p className="text-sm leading-7 text-slate-600">
                      Your details will only be used for the Save Woolton Baths
                      campaign and related project communication.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Mail className="mt-1 h-5 w-5 shrink-0 text-[#8D7425]" />
                    <p className="text-sm leading-7 text-slate-600">
                      Registering does not commit you to providing money,
                      materials or labour.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <HeartHandshake className="mt-1 h-5 w-5 shrink-0 text-[#8D7425]" />
                    <p className="text-sm leading-7 text-slate-600">
                      We can contact you to discuss your offer before anything
                      is formally agreed.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-slate-200 bg-[#F8F7F3] p-6 md:p-9"
            >
              <div
                aria-hidden="true"
                className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
              >
                <label htmlFor="swb-website">
                  Website
                  <input
                    id="swb-website"
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={(event) =>
                      updateField("website", event.target.value)
                    }
                    autoComplete="off"
                    tabIndex={-1}
                  />
                </label>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8D7425]">
                  Step 1
                </p>

                <h3 className="mt-2 text-2xl font-black">Your details</h3>

                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <UserRound className="h-4 w-4" />
                      Name *
                    </span>

                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      autoComplete="name"
                      maxLength={120}
                      disabled={isSubmitting}
                      placeholder="Your full name"
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <Mail className="h-4 w-4" />
                      Email *
                    </span>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      autoComplete="email"
                      maxLength={254}
                      disabled={isSubmitting}
                      placeholder="you@example.com"
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <Phone className="h-4 w-4" />
                      Phone
                    </span>

                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      autoComplete="tel"
                      maxLength={40}
                      disabled={isSubmitting}
                      placeholder="Optional"
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <Building2 className="h-4 w-4" />
                      Organisation / Business
                    </span>

                    <input
                      type="text"
                      value={form.organisation}
                      onChange={(event) =>
                        updateField("organisation", event.target.value)
                      }
                      autoComplete="organization"
                      maxLength={180}
                      disabled={isSubmitting}
                      placeholder="Optional"
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 text-sm font-bold">Postcode</span>

                    <input
                      type="text"
                      value={form.postcode}
                      onChange={(event) =>
                        updateField("postcode", event.target.value)
                      }
                      autoComplete="postal-code"
                      maxLength={16}
                      disabled={isSubmitting}
                      placeholder="Optional — helps us understand where community support is coming from"
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base uppercase outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-12 border-t border-slate-200 pt-10">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8D7425]">
                  Step 2
                </p>

                <h3 className="mt-2 text-2xl font-black">
                  How would you like to support Woolton Baths?
                </h3>

                <label className="mt-7 block">
                  <span className="mb-2 block text-sm font-bold">
                    Type of support *
                  </span>

                  <div className="relative">
                    <select
                      value={form.supportType}
                      onChange={(event) =>
                        updateField(
                          "supportType",
                          event.target.value as SupportType,
                        )
                      }
                      disabled={isSubmitting}
                      className="min-h-14 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-12 text-base font-semibold outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Select an option</option>

                      {supportOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  </div>
                </label>

                <label className="mt-6 block">
                  <span className="mb-2 block text-sm font-bold">
                    How did you hear about the Save Woolton Baths campaign? *
                  </span>

                  <div className="relative">
                    <select
                      value={form.heardAboutCampaign}
                      onChange={(event) =>
                        updateField(
                          "heardAboutCampaign",
                          event.target.value as HeardAboutCampaign,
                        )
                      }
                      disabled={isSubmitting}
                      required
                      className="min-h-14 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-12 text-base font-semibold outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Select an option</option>

                      {heardAboutOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  </div>
                </label>

                {selectedSupport && (
                  <div className="mt-5 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-5">
                    <p className="font-black text-[#725D18]">
                      {selectedSupport.label}
                    </p>

                    <p className="mt-2 leading-7 text-slate-700">
                      {selectedSupport.description}
                    </p>
                  </div>
                )}

                {form.supportType === "trade" && (
                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-bold">
                      Your trade, profession or specialist skill *
                    </span>

                    <input
                      type="text"
                      value={form.tradeProfession}
                      onChange={(event) =>
                        updateField("tradeProfession", event.target.value)
                      }
                      maxLength={180}
                      disabled={isSubmitting}
                      placeholder="e.g. Plumber, electrician, roofer, plasterer, structural engineer"
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                )}

                {form.supportType === "materials" && (
                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-bold">
                      What materials may you be able to provide? *
                    </span>

                    <textarea
                      value={form.materialDetails}
                      onChange={(event) =>
                        updateField("materialDetails", event.target.value)
                      }
                      rows={4}
                      maxLength={4000}
                      disabled={isSubmitting}
                      placeholder="Tell us about the type, approximate quantity and availability of the materials."
                      className="w-full rounded-xl border border-slate-300 bg-white p-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                )}

                {form.supportType === "equipment" && (
                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-bold">
                      What equipment may be available? *
                    </span>

                    <textarea
                      value={form.equipmentDetails}
                      onChange={(event) =>
                        updateField("equipmentDetails", event.target.value)
                      }
                      rows={4}
                      maxLength={4000}
                      disabled={isSubmitting}
                      placeholder="For example: pumps, filtration equipment, heating equipment, controls or other pool/building plant."
                      className="w-full rounded-xl border border-slate-300 bg-white p-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                )}

                {form.supportType === "sponsorship" && (
                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-bold">
                      Tell us about your sponsorship interest *
                    </span>

                    <textarea
                      value={form.sponsorshipDetails}
                      onChange={(event) =>
                        updateField("sponsorshipDetails", event.target.value)
                      }
                      rows={4}
                      maxLength={4000}
                      disabled={isSubmitting}
                      placeholder="Financial sponsorship, services, materials, equipment, promotional support or another form of partnership."
                      className="w-full rounded-xl border border-slate-300 bg-white p-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                )}

                {form.supportType === "funding" && (
                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-bold">
                      Funding / grant information *
                    </span>

                    <textarea
                      value={form.fundingDetails}
                      onChange={(event) =>
                        updateField("fundingDetails", event.target.value)
                      }
                      rows={4}
                      maxLength={4000}
                      disabled={isSubmitting}
                      placeholder="Tell us about the funding opportunity, grant programme or organisation."
                      className="w-full rounded-xl border border-slate-300 bg-white p-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                )}

                {form.supportType === "education" && (
                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-bold">
                      Educational partnership *
                    </span>

                    <textarea
                      value={form.educationDetails}
                      onChange={(event) =>
                        updateField("educationDetails", event.target.value)
                      }
                      rows={4}
                      maxLength={4000}
                      disabled={isSubmitting}
                      placeholder="Tell us about your university, college, course, placement programme or potential student involvement."
                      className="w-full rounded-xl border border-slate-300 bg-white p-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                )}

                {form.supportType === "professional" && (
                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-bold">
                      Your area of professional expertise *
                    </span>

                    <textarea
                      value={form.professionalDetails}
                      onChange={(event) =>
                        updateField("professionalDetails", event.target.value)
                      }
                      rows={4}
                      maxLength={4000}
                      disabled={isSubmitting}
                      placeholder="For example: heritage, architecture, structural engineering, pool design, procurement, legal, planning or building services."
                      className="w-full rounded-xl border border-slate-300 bg-white p-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                )}
              </div>

              <div className="mt-12 border-t border-slate-200 pt-10">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8D7425]">
                  Step 3
                </p>

                <h3 className="mt-2 text-2xl font-black">
                  Anything else we should know?
                </h3>

                <label className="mt-7 block">
                  <span className="mb-2 block text-sm font-bold">Message</span>

                  <textarea
                    value={form.message}
                    onChange={(event) =>
                      updateField("message", event.target.value)
                    }
                    rows={6}
                    maxLength={5000}
                    disabled={isSubmitting}
                    placeholder="Tell us more about how you would like to help, your experience, availability or anything else that may be useful."
                    className="w-full rounded-xl border border-slate-300 bg-white p-4 text-base outline-none transition focus:border-[#8D7425] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              </div>

              <div className="mt-10 space-y-5">
                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <input
                    type="checkbox"
                    checked={form.permissionToContact}
                    onChange={(event) =>
                      updateField("permissionToContact", event.target.checked)
                    }
                    disabled={isSubmitting}
                    className="mt-1 h-5 w-5 shrink-0 accent-[#8D7425]"
                  />

                  <span>
                    <span className="block font-bold">
                      Permission to contact me *
                    </span>

                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      I agree that the Save Woolton Baths project team may
                      contact me about my registration and potential support.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <input
                    type="checkbox"
                    checked={form.publicSupport}
                    onChange={(event) =>
                      updateField("publicSupport", event.target.checked)
                    }
                    disabled={isSubmitting}
                    className="mt-1 h-5 w-5 shrink-0 accent-[#8D7425]"
                  />

                  <span>
                    <span className="block font-bold">Public supporter</span>

                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      I am happy for my name or organisation to potentially be
                      listed as a supporter of Save Woolton Baths. We will not
                      publish contact details.
                    </span>
                  </span>
                </label>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800"
                >
                  {error}
                </div>
              )}

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#102532] px-7 py-4 text-base font-black text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Registering Support...
                    </>
                  ) : (
                    <>
                      Register My Support
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-xs leading-6 text-slate-500">
                  Registering an offer of support does not create a contractual
                  commitment or obligation between you and the Save Woolton
                  Baths campaign.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-[#0A1B2B]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <Building2 className="h-10 w-10 text-[#D4AF37]" />

              <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
                Businesses & Organisations
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
                There are many ways an organisation can make a difference.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">
                We welcome conversations with businesses, manufacturers,
                suppliers, leisure operators, universities, colleges,
                professional practices and community organisations interested
                in helping restore Woolton Baths.
              </p>
            </div>

            <div className="rounded-3xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-7">
              <p className="font-black text-[#E6C75A]">
                Upgrading a pool or leisure facility?
              </p>

              <p className="mt-4 leading-8 text-slate-300">
                If usable pool plant, filtration equipment, pumps, heating
                equipment or other suitable infrastructure is being replaced,
                we would be interested in discussing whether it could support
                the future restoration of Woolton Baths.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#D4AF37] text-black">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:py-20">
          <HandHeart className="mx-auto h-10 w-10" />

          <h2 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
            One building. One community. Many ways to help.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-8">
            Whether you can give an hour, a professional skill, a pallet of
            materials, specialist equipment or simply your support, we want to
            hear from you.
          </p>
        </div>
      </section>
    </>
  );
}