"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type WebsiteStatus = "not_started" | "draft" | "ready" | "published";

type ServiceRecord = {
  id: string;
  name: string;
  description: string;
  emergency: boolean;
};

type OpeningHoursRecord = {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
};

type PhotoRecord = {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
};

type WebsiteWizardData = {
  businessName: string;
  tradingName: string;
  trade: string;
  yearsTrading: string;
  companyNumber: string;
  vatNumber: string;
  businessDescription: string;

  contactName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  county: string;
  postcode: string;
  serviceAreas: string;
  openingHours: OpeningHoursRecord[];

  services: ServiceRecord[];
  pricingStyle: "quote" | "hourly" | "fixed" | "mixed";
  callOutAvailable: boolean;
  callOutMessage: string;
  guarantee: string;
  accreditations: string;

  logoName: string;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  visualStyle: "modern" | "professional" | "premium" | "friendly";
  fontStyle: "clean" | "traditional" | "bold" | "soft";

  photoNames: string[];
  preferredDomain: string;
  websiteGoal: string;
  targetCustomers: string;
  specialInstructions: string;

  currentStep: number;
  completedSteps: number[];
  updatedAt: string;
};

type DashboardProject = {
  businessName: string;
  trade: string;
  location: string;
  domain: string;
  status: WebsiteStatus;
  completion: number;
  lastUpdated: string;
  lastPublished: string;
  seoScore: number;
  pagesGenerated: number;
  suggestions: number;
};

const WIZARD_STORAGE_KEY = "beacon-business-website-wizard";
const PROJECT_STORAGE_KEY = "beacon-business-website-project";
const GENERATED_WEBSITE_STORAGE_KEY = "beacon-business-generated-website";
const MAX_PHOTOS = 12;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

const STEPS = [
  {
    id: 1,
    title: "Business",
    subtitle: "Tell Beacon about the company.",
  },
  {
    id: 2,
    title: "Contact",
    subtitle: "Add contact details and service areas.",
  },
  {
    id: 3,
    title: "Services",
    subtitle: "Describe what the business offers.",
  },
  {
    id: 4,
    title: "Branding",
    subtitle: "Choose the look and feel.",
  },
  {
    id: 5,
    title: "Photos",
    subtitle: "Add examples of completed work.",
  },
  {
    id: 6,
    title: "Review",
    subtitle: "Check everything before generation.",
  },
  {
    id: 7,
    title: "Generate",
    subtitle: "Prepare the website with AI.",
  },
] as const;

const DEFAULT_HOURS: OpeningHoursRecord[] = [
  { day: "Monday", enabled: true, open: "08:00", close: "17:00" },
  { day: "Tuesday", enabled: true, open: "08:00", close: "17:00" },
  { day: "Wednesday", enabled: true, open: "08:00", close: "17:00" },
  { day: "Thursday", enabled: true, open: "08:00", close: "17:00" },
  { day: "Friday", enabled: true, open: "08:00", close: "17:00" },
  { day: "Saturday", enabled: false, open: "09:00", close: "13:00" },
  { day: "Sunday", enabled: false, open: "09:00", close: "13:00" },
];

const EMPTY_DATA: WebsiteWizardData = {
  businessName: "",
  tradingName: "",
  trade: "",
  yearsTrading: "",
  companyNumber: "",
  vatNumber: "",
  businessDescription: "",

  contactName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  townCity: "",
  county: "",
  postcode: "",
  serviceAreas: "",
  openingHours: DEFAULT_HOURS,

  services: [
    {
      id: "service-1",
      name: "",
      description: "",
      emergency: false,
    },
  ],
  pricingStyle: "quote",
  callOutAvailable: false,
  callOutMessage: "",
  guarantee: "",
  accreditations: "",

  logoName: "",
  primaryColour: "#0f3d73",
  secondaryColour: "#d4a017",
  accentColour: "#ffffff",
  visualStyle: "professional",
  fontStyle: "clean",

  photoNames: [],
  preferredDomain: "",
  websiteGoal: "Generate more customer enquiries",
  targetCustomers: "",
  specialInstructions: "",

  currentStep: 1,
  completedSteps: [],
  updatedAt: "",
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normaliseWizardData(value: Partial<WebsiteWizardData>) {
  return {
    ...EMPTY_DATA,
    ...value,
    openingHours:
      Array.isArray(value.openingHours) && value.openingHours.length === 7
        ? value.openingHours
        : DEFAULT_HOURS,
    services:
      Array.isArray(value.services) && value.services.length > 0
        ? value.services
        : EMPTY_DATA.services,
    photoNames: Array.isArray(value.photoNames) ? value.photoNames : [],
    completedSteps: Array.isArray(value.completedSteps)
      ? value.completedSteps.filter(
          (step): step is number =>
            typeof step === "number" && step >= 1 && step <= 7,
        )
      : [],
    currentStep:
      typeof value.currentStep === "number"
        ? Math.min(7, Math.max(1, value.currentStep))
        : 1,
  } satisfies WebsiteWizardData;
}

function readWizardData() {
  if (typeof window === "undefined") {
    return EMPTY_DATA;
  }

  const raw = window.localStorage.getItem(WIZARD_STORAGE_KEY);

  if (!raw) {
    return EMPTY_DATA;
  }

  try {
    return normaliseWizardData(
      JSON.parse(raw) as Partial<WebsiteWizardData>,
    );
  } catch {
    return EMPTY_DATA;
  }
}

function calculateCompletion(data: WebsiteWizardData) {
  const checks = [
    Boolean(data.businessName.trim()),
    Boolean(data.trade.trim()),
    Boolean(data.businessDescription.trim()),
    Boolean(data.contactName.trim()),
    Boolean(data.phone.trim()),
    Boolean(data.email.trim()),
    Boolean(data.townCity.trim()),
    Boolean(data.serviceAreas.trim()),
    data.services.some((service) => service.name.trim()),
    Boolean(data.primaryColour),
    Boolean(data.secondaryColour),
    Boolean(data.websiteGoal.trim()),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function fieldClass(hasError = false) {
  return `w-full rounded-2xl border bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 ${
    hasError
      ? "border-red-400 ring-2 ring-red-100 focus:border-red-500"
      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  }`;
}

function labelClass() {
  return "mb-2 block text-sm font-extrabold text-slate-800";
}

function helperClass() {
  return "mt-2 text-sm leading-6 text-slate-500";
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-200 py-4 last:border-b-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="font-bold text-slate-600">{label}</dt>
      <dd className="text-slate-950 sm:max-w-[65%] sm:text-right">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

export default function BusinessWebsiteProjectPage() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [data, setData] = useState<WebsiteWizardData>(EMPTY_DATA);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    setData(readWizardData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  const completion = useMemo(() => calculateCompletion(data), [data]);
  const currentStepMeta = STEPS[data.currentStep - 1];

  function persist(nextData: WebsiteWizardData, message = "Saved") {
    const now = new Date().toISOString();
    const value = {
      ...nextData,
      updatedAt: now,
    };

    setData(value);
    window.localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(value));

    const dashboardProject: DashboardProject = {
      businessName: value.businessName,
      trade: value.trade,
      location: value.townCity || value.county,
      domain: value.preferredDomain,
      status: value.currentStep >= 7 ? "ready" : "draft",
      completion: calculateCompletion(value),
      lastUpdated: now,
      lastPublished: "",
      seoScore: 0,
      pagesGenerated: value.currentStep >= 7 ? 6 : 0,
      suggestions: value.currentStep >= 7 ? 3 : 0,
    };

    window.localStorage.setItem(
      PROJECT_STORAGE_KEY,
      JSON.stringify(dashboardProject),
    );

    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(""), 1800);
  }

  function updateField<K extends keyof WebsiteWizardData>(
    key: K,
    value: WebsiteWizardData[K],
  ) {
    setData((current) => ({
      ...current,
      [key]: value,
    }));

    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  function validateStep(step: number) {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (!data.businessName.trim()) {
        nextErrors.businessName = "Business name is required.";
      }

      if (!data.trade.trim()) {
        nextErrors.trade = "Please enter the main trade or industry.";
      }

      if (data.businessDescription.trim().length < 30) {
        nextErrors.businessDescription =
          "Add at least 30 characters so Beacon understands the business.";
      }
    }

    if (step === 2) {
      if (!data.contactName.trim()) {
        nextErrors.contactName = "Primary contact name is required.";
      }

      if (!data.phone.trim()) {
        nextErrors.phone = "Phone number is required.";
      }

      if (!data.email.trim()) {
        nextErrors.email = "Email address is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        nextErrors.email = "Enter a valid email address.";
      }

      if (!data.townCity.trim()) {
        nextErrors.townCity = "Town or city is required.";
      }

      if (!data.serviceAreas.trim()) {
        nextErrors.serviceAreas =
          "Add at least one town, city, county or postcode area.";
      }
    }

    if (step === 3) {
      if (!data.services.some((service) => service.name.trim())) {
        nextErrors.services = "Add at least one service.";
      }
    }

    if (step === 4) {
      if (!data.primaryColour || !data.secondaryColour) {
        nextErrors.branding = "Choose primary and secondary colours.";
      }
    }

    if (step === 6) {
      const requiredCompletion = calculateCompletion(data);

      if (requiredCompletion < 75) {
        nextErrors.review =
          "Complete the required business information before generating.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goToStep(step: number) {
    if (step < data.currentStep || data.completedSteps.includes(step - 1)) {
      persist(
        {
          ...data,
          currentStep: step,
        },
        "Progress saved",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function nextStep(event?: FormEvent) {
    event?.preventDefault();

    if (!validateStep(data.currentStep)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const nextStepNumber = Math.min(7, data.currentStep + 1);
    const completedSteps = Array.from(
      new Set([...data.completedSteps, data.currentStep]),
    ).sort((a, b) => a - b);

    persist(
      {
        ...data,
        currentStep: nextStepNumber,
        completedSteps,
      },
      "Progress saved",
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    const previous = Math.max(1, data.currentStep - 1);
    persist({ ...data, currentStep: previous }, "Progress saved");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveAndExit() {
    persist(data, "Progress saved");
    router.push("/business/website");
  }

  function addService() {
    updateField("services", [
      ...data.services,
      {
        id: createId("service"),
        name: "",
        description: "",
        emergency: false,
      },
    ]);
  }

  function updateService(
    id: string,
    field: keyof Omit<ServiceRecord, "id">,
    value: string | boolean,
  ) {
    updateField(
      "services",
      data.services.map((service) =>
        service.id === id ? { ...service, [field]: value } : service,
      ),
    );

    if (errors.services) {
      setErrors((current) => {
        const next = { ...current };
        delete next.services;
        return next;
      });
    }
  }

  function removeService(id: string) {
    if (data.services.length === 1) {
      updateField("services", [
        {
          id: createId("service"),
          name: "",
          description: "",
          emergency: false,
        },
      ]);
      return;
    }

    updateField(
      "services",
      data.services.filter((service) => service.id !== id),
    );
  }

  function updateOpeningHours(
    day: string,
    field: keyof Omit<OpeningHoursRecord, "day">,
    value: string | boolean,
  ) {
    updateField(
      "openingHours",
      data.openingHours.map((record) =>
        record.day === day ? { ...record, [field]: value } : record,
      ),
    );
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({
        ...current,
        logoName: "Please select a valid image.",
      }));
      return;
    }

    updateField("logoName", file.name);
    setErrors((current) => {
      const next = { ...current };
      delete next.logoName;
      return next;
    });
  }

  function handlePhotosChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      return;
    }

    const remainingSlots = Math.max(0, MAX_PHOTOS - photos.length);
    const selected = files.slice(0, remainingSlots);

    const invalid = selected.find(
      (file) =>
        !file.type.startsWith("image/") || file.size > MAX_PHOTO_SIZE,
    );

    if (invalid) {
      setErrors((current) => ({
        ...current,
        photos:
          "Each upload must be an image and no larger than 10 MB.",
      }));
      event.target.value = "";
      return;
    }

    const nextPhotos = selected.map((file) => ({
      id: createId("photo"),
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
    }));

    const combined = [...photos, ...nextPhotos].slice(0, MAX_PHOTOS);
    setPhotos(combined);
    updateField(
      "photoNames",
      combined.map((photo) => photo.name),
    );

    setErrors((current) => {
      const next = { ...current };
      delete next.photos;
      return next;
    });

    event.target.value = "";
  }

  function removePhoto(id: string) {
    const target = photos.find((photo) => photo.id === id);

    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }

    const next = photos.filter((photo) => photo.id !== id);
    setPhotos(next);
    updateField(
      "photoNames",
      next.map((photo) => photo.name),
    );
  }

  async function generateWebsite() {
    if (!validateStep(6)) {
      return;
    }

    setIsGenerating(true);
    setGenerationError("");

    try {
      const response = await fetch("/api/business/website/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brief: data,
        }),
      });

      const payload = (await response.json()) as
        | Record<string, unknown>
        | { error?: string };

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Beacon could not generate the website.";

        throw new Error(message);
      }

      const generatedAt =
        payload &&
        typeof payload === "object" &&
        "project" in payload &&
        payload.project &&
        typeof payload.project === "object" &&
        "generatedAt" in payload.project &&
        typeof payload.project.generatedAt === "string"
          ? payload.project.generatedAt
          : new Date().toISOString();

      window.localStorage.setItem(
        GENERATED_WEBSITE_STORAGE_KEY,
        JSON.stringify(payload),
      );

      const completedSteps = Array.from(
        new Set([...data.completedSteps, 1, 2, 3, 4, 5, 6, 7]),
      ).sort((a, b) => a - b);

      const nextData = {
        ...data,
        currentStep: 7,
        completedSteps,
        updatedAt: generatedAt,
      };

      persist(nextData, "Website generated");

      const existingProjectRaw =
        window.localStorage.getItem(PROJECT_STORAGE_KEY);
      const existingProject = existingProjectRaw
        ? (JSON.parse(existingProjectRaw) as Partial<DashboardProject>)
        : {};

      const generatedPages =
        payload &&
        typeof payload === "object" &&
        "pages" in payload &&
        Array.isArray(payload.pages)
          ? payload.pages.length
          : 0;

      const seoScore =
        payload &&
        typeof payload === "object" &&
        "quality" in payload &&
        payload.quality &&
        typeof payload.quality === "object" &&
        "seoScore" in payload.quality &&
        typeof payload.quality.seoScore === "number"
          ? payload.quality.seoScore
          : 0;

      const suggestions =
        payload &&
        typeof payload === "object" &&
        "quality" in payload &&
        payload.quality &&
        typeof payload.quality === "object" &&
        "improvements" in payload.quality &&
        Array.isArray(payload.quality.improvements)
          ? payload.quality.improvements.length
          : 0;

      const updatedProject: DashboardProject = {
        businessName: data.businessName,
        trade: data.trade,
        location: data.townCity || data.county,
        domain: data.preferredDomain,
        status: "ready",
        completion: 100,
        lastUpdated: generatedAt,
        lastPublished:
          typeof existingProject.lastPublished === "string"
            ? existingProject.lastPublished
            : "",
        seoScore,
        pagesGenerated: generatedPages,
        suggestions,
      };

      window.localStorage.setItem(
        PROJECT_STORAGE_KEY,
        JSON.stringify(updatedProject),
      );
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Beacon could not generate the website. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-10 w-72 rounded-xl bg-slate-200" />
          <div className="mt-8 h-24 rounded-3xl bg-white" />
          <div className="mt-6 h-[520px] rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                className="text-sm font-extrabold text-blue-800 hover:text-blue-950"
                href="/business/website"
              >
                ← Website dashboard
              </Link>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                AI Website Setup
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                Add the business information once. Beacon will use it to create
                the website structure, content and SEO.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {saveMessage ? (
                <span className="text-sm font-extrabold text-emerald-700">
                  ✓ {saveMessage}
                </span>
              ) : null}

              <button
                className="rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
                onClick={saveAndExit}
                type="button"
              >
                Save & Exit
              </button>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Overall completion
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {completion}%
                </p>
              </div>

              <p className="text-right text-sm text-slate-500">
                Step {data.currentStep} of 7
                <br />
                <span className="font-bold text-slate-700">
                  {currentStepMeta.title}
                </span>
              </p>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-700 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside>
            <nav
              aria-label="Website setup progress"
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6"
            >
              <ol className="space-y-2">
                {STEPS.map((step) => {
                  const active = data.currentStep === step.id;
                  const complete = data.completedSteps.includes(step.id);
                  const available =
                    step.id <= data.currentStep ||
                    data.completedSteps.includes(step.id - 1);

                  return (
                    <li key={step.id}>
                      <button
                        className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                          active
                            ? "bg-blue-950 text-white"
                            : available
                              ? "text-slate-800 hover:bg-slate-100"
                              : "cursor-not-allowed text-slate-400"
                        }`}
                        disabled={!available}
                        onClick={() => goToStep(step.id)}
                        type="button"
                      >
                        <span
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                            active
                              ? "bg-white text-blue-950"
                              : complete
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {complete ? "✓" : step.id}
                        </span>

                        <span>
                          <span className="block font-extrabold">
                            {step.title}
                          </span>
                          <span
                            className={`mt-0.5 block text-xs leading-5 ${
                              active ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            {step.subtitle}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>

          <form
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10"
            onSubmit={nextStep}
          >
            {data.currentStep === 1 ? (
              <div>
                <SectionHeading
                  description="Beacon uses this information to understand the business, choose the right language and create accurate service content."
                  eyebrow="Step 1"
                  title="Business details"
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass()} htmlFor="businessName">
                      Business name *
                    </label>
                    <input
                      className={fieldClass(Boolean(errors.businessName))}
                      id="businessName"
                      onChange={(event) =>
                        updateField("businessName", event.target.value)
                      }
                      placeholder="Example: Murphy Property Services"
                      value={data.businessName}
                    />
                    {errors.businessName ? (
                      <p className="mt-2 text-sm font-bold text-red-700">
                        {errors.businessName}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="tradingName">
                      Trading name
                    </label>
                    <input
                      className={fieldClass()}
                      id="tradingName"
                      onChange={(event) =>
                        updateField("tradingName", event.target.value)
                      }
                      placeholder="Leave blank if it matches the business name"
                      value={data.tradingName}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="trade">
                      Main trade or industry *
                    </label>
                    <input
                      className={fieldClass(Boolean(errors.trade))}
                      id="trade"
                      onChange={(event) =>
                        updateField("trade", event.target.value)
                      }
                      placeholder="Plumber, roofer, electrician, cleaner..."
                      value={data.trade}
                    />
                    {errors.trade ? (
                      <p className="mt-2 text-sm font-bold text-red-700">
                        {errors.trade}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="yearsTrading">
                      Years trading
                    </label>
                    <input
                      className={fieldClass()}
                      id="yearsTrading"
                      inputMode="numeric"
                      min="0"
                      onChange={(event) =>
                        updateField("yearsTrading", event.target.value)
                      }
                      placeholder="Example: 12"
                      type="number"
                      value={data.yearsTrading}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="companyNumber">
                      Company number
                    </label>
                    <input
                      className={fieldClass()}
                      id="companyNumber"
                      onChange={(event) =>
                        updateField("companyNumber", event.target.value)
                      }
                      placeholder="Optional"
                      value={data.companyNumber}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="vatNumber">
                      VAT number
                    </label>
                    <input
                      className={fieldClass()}
                      id="vatNumber"
                      onChange={(event) =>
                        updateField("vatNumber", event.target.value)
                      }
                      placeholder="Optional"
                      value={data.vatNumber}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label
                    className={labelClass()}
                    htmlFor="businessDescription"
                  >
                    Tell Beacon about the business *
                  </label>
                  <textarea
                    className={`${fieldClass(
                      Boolean(errors.businessDescription),
                    )} min-h-40 resize-y`}
                    id="businessDescription"
                    onChange={(event) =>
                      updateField("businessDescription", event.target.value)
                    }
                    placeholder="Describe the business, experience, values, typical jobs, strengths and what makes it different."
                    value={data.businessDescription}
                  />
                  <p className={helperClass()}>
                    Include the details a customer should know. Beacon will turn
                    this into professional website content.
                  </p>
                  {errors.businessDescription ? (
                    <p className="mt-2 text-sm font-bold text-red-700">
                      {errors.businessDescription}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {data.currentStep === 2 ? (
              <div>
                <SectionHeading
                  description="These details appear on the contact page and help Beacon create relevant local SEO content."
                  eyebrow="Step 2"
                  title="Contact information and opening hours"
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass()} htmlFor="contactName">
                      Primary contact *
                    </label>
                    <input
                      className={fieldClass(Boolean(errors.contactName))}
                      id="contactName"
                      onChange={(event) =>
                        updateField("contactName", event.target.value)
                      }
                      placeholder="Full name"
                      value={data.contactName}
                    />
                    {errors.contactName ? (
                      <p className="mt-2 text-sm font-bold text-red-700">
                        {errors.contactName}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="phone">
                      Phone number *
                    </label>
                    <input
                      className={fieldClass(Boolean(errors.phone))}
                      id="phone"
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      placeholder="Example: 07123 456789"
                      type="tel"
                      value={data.phone}
                    />
                    {errors.phone ? (
                      <p className="mt-2 text-sm font-bold text-red-700">
                        {errors.phone}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="email">
                      Business email *
                    </label>
                    <input
                      className={fieldClass(Boolean(errors.email))}
                      id="email"
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      placeholder="contact@example.co.uk"
                      type="email"
                      value={data.email}
                    />
                    {errors.email ? (
                      <p className="mt-2 text-sm font-bold text-red-700">
                        {errors.email}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="postcode">
                      Postcode
                    </label>
                    <input
                      className={fieldClass()}
                      id="postcode"
                      onChange={(event) =>
                        updateField("postcode", event.target.value)
                      }
                      placeholder="Example: NE1 1AA"
                      value={data.postcode}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="addressLine1">
                      Address line 1
                    </label>
                    <input
                      className={fieldClass()}
                      id="addressLine1"
                      onChange={(event) =>
                        updateField("addressLine1", event.target.value)
                      }
                      value={data.addressLine1}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="addressLine2">
                      Address line 2
                    </label>
                    <input
                      className={fieldClass()}
                      id="addressLine2"
                      onChange={(event) =>
                        updateField("addressLine2", event.target.value)
                      }
                      value={data.addressLine2}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="townCity">
                      Town or city *
                    </label>
                    <input
                      className={fieldClass(Boolean(errors.townCity))}
                      id="townCity"
                      onChange={(event) =>
                        updateField("townCity", event.target.value)
                      }
                      value={data.townCity}
                    />
                    {errors.townCity ? (
                      <p className="mt-2 text-sm font-bold text-red-700">
                        {errors.townCity}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="county">
                      County
                    </label>
                    <input
                      className={fieldClass()}
                      id="county"
                      onChange={(event) =>
                        updateField("county", event.target.value)
                      }
                      value={data.county}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className={labelClass()} htmlFor="serviceAreas">
                    Areas covered *
                  </label>
                  <textarea
                    className={`${fieldClass(
                      Boolean(errors.serviceAreas),
                    )} min-h-28 resize-y`}
                    id="serviceAreas"
                    onChange={(event) =>
                      updateField("serviceAreas", event.target.value)
                    }
                    placeholder="Example: Newcastle, Gateshead, North Tyneside and surrounding areas within 25 miles."
                    value={data.serviceAreas}
                  />
                  {errors.serviceAreas ? (
                    <p className="mt-2 text-sm font-bold text-red-700">
                      {errors.serviceAreas}
                    </p>
                  ) : null}
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-black text-slate-950">
                    Opening hours
                  </h3>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                    {data.openingHours.map((record) => (
                      <div
                        className="grid gap-4 border-b border-slate-200 p-4 last:border-b-0 sm:grid-cols-[150px_100px_1fr_1fr] sm:items-center"
                        key={record.day}
                      >
                        <p className="font-extrabold text-slate-800">
                          {record.day}
                        </p>

                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <input
                            checked={record.enabled}
                            className="h-5 w-5 rounded border-slate-300"
                            onChange={(event) =>
                              updateOpeningHours(
                                record.day,
                                "enabled",
                                event.target.checked,
                              )
                            }
                            type="checkbox"
                          />
                          Open
                        </label>

                        <input
                          className={fieldClass()}
                          disabled={!record.enabled}
                          onChange={(event) =>
                            updateOpeningHours(
                              record.day,
                              "open",
                              event.target.value,
                            )
                          }
                          type="time"
                          value={record.open}
                        />

                        <input
                          className={fieldClass()}
                          disabled={!record.enabled}
                          onChange={(event) =>
                            updateOpeningHours(
                              record.day,
                              "close",
                              event.target.value,
                            )
                          }
                          type="time"
                          value={record.close}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {data.currentStep === 3 ? (
              <div>
                <SectionHeading
                  description="Beacon will create clear service sections and can later generate a dedicated page for each major service."
                  eyebrow="Step 3"
                  title="Services and customer promises"
                />

                <div className="space-y-5">
                  {data.services.map((service, index) => (
                    <article
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                      key={service.id}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-black text-slate-950">
                          Service {index + 1}
                        </h3>

                        <button
                          className="text-sm font-extrabold text-red-700 hover:text-red-900"
                          onClick={() => removeService(service.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            className={labelClass()}
                            htmlFor={`service-name-${service.id}`}
                          >
                            Service name
                          </label>
                          <input
                            className={fieldClass(Boolean(errors.services))}
                            id={`service-name-${service.id}`}
                            onChange={(event) =>
                              updateService(
                                service.id,
                                "name",
                                event.target.value,
                              )
                            }
                            placeholder="Example: Boiler installation"
                            value={service.name}
                          />
                        </div>

                        <div className="flex items-end">
                          <label className="flex w-full items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700">
                            <input
                              checked={service.emergency}
                              className="h-5 w-5 rounded border-slate-300"
                              onChange={(event) =>
                                updateService(
                                  service.id,
                                  "emergency",
                                  event.target.checked,
                                )
                              }
                              type="checkbox"
                            />
                            Emergency or urgent service
                          </label>
                        </div>
                      </div>

                      <div className="mt-5">
                        <label
                          className={labelClass()}
                          htmlFor={`service-description-${service.id}`}
                        >
                          Service details
                        </label>
                        <textarea
                          className={`${fieldClass()} min-h-28 resize-y`}
                          id={`service-description-${service.id}`}
                          onChange={(event) =>
                            updateService(
                              service.id,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Describe what is included, common jobs and any important customer information."
                          value={service.description}
                        />
                      </div>
                    </article>
                  ))}
                </div>

                {errors.services ? (
                  <p className="mt-3 text-sm font-bold text-red-700">
                    {errors.services}
                  </p>
                ) : null}

                <button
                  className="mt-5 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 px-5 py-3 font-extrabold text-blue-900 transition hover:border-blue-500"
                  onClick={addService}
                  type="button"
                >
                  + Add another service
                </button>

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass()} htmlFor="pricingStyle">
                      Pricing style
                    </label>
                    <select
                      className={fieldClass()}
                      id="pricingStyle"
                      onChange={(event) =>
                        updateField(
                          "pricingStyle",
                          event.target.value as WebsiteWizardData["pricingStyle"],
                        )
                      }
                      value={data.pricingStyle}
                    >
                      <option value="quote">Free quotation</option>
                      <option value="hourly">Hourly pricing</option>
                      <option value="fixed">Fixed-price packages</option>
                      <option value="mixed">A mixture of pricing options</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="guarantee">
                      Guarantee or warranty
                    </label>
                    <input
                      className={fieldClass()}
                      id="guarantee"
                      onChange={(event) =>
                        updateField("guarantee", event.target.value)
                      }
                      placeholder="Example: 12-month workmanship guarantee"
                      value={data.guarantee}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-4 font-extrabold text-slate-800">
                      <input
                        checked={data.callOutAvailable}
                        className="h-5 w-5 rounded border-slate-300"
                        onChange={(event) =>
                          updateField(
                            "callOutAvailable",
                            event.target.checked,
                          )
                        }
                        type="checkbox"
                      />
                      The business offers call-outs or emergency attendance
                    </label>
                  </div>

                  {data.callOutAvailable ? (
                    <div className="sm:col-span-2">
                      <label
                        className={labelClass()}
                        htmlFor="callOutMessage"
                      >
                        Call-out information
                      </label>
                      <textarea
                        className={`${fieldClass()} min-h-24 resize-y`}
                        id="callOutMessage"
                        onChange={(event) =>
                          updateField("callOutMessage", event.target.value)
                        }
                        placeholder="Availability, response area, call-out fees or conditions."
                        value={data.callOutMessage}
                      />
                    </div>
                  ) : null}

                  <div className="sm:col-span-2">
                    <label
                      className={labelClass()}
                      htmlFor="accreditations"
                    >
                      Qualifications, memberships and accreditations
                    </label>
                    <textarea
                      className={`${fieldClass()} min-h-28 resize-y`}
                      id="accreditations"
                      onChange={(event) =>
                        updateField("accreditations", event.target.value)
                      }
                      placeholder="Example: Gas Safe registered, NICEIC approved, fully insured..."
                      value={data.accreditations}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {data.currentStep === 4 ? (
              <div>
                <SectionHeading
                  description="Choose a starting style. Beacon will use these preferences consistently across the website."
                  eyebrow="Step 4"
                  title="Branding and visual style"
                />

                <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                  <div>
                    <div>
                      <label className={labelClass()}>Business logo</label>

                      <input
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                        ref={logoInputRef}
                        type="file"
                      />

                      <button
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-left transition hover:border-blue-400 hover:bg-blue-50"
                        onClick={() => logoInputRef.current?.click()}
                        type="button"
                      >
                        <span>
                          <span className="block font-extrabold text-slate-900">
                            {data.logoName || "Upload logo"}
                          </span>
                          <span className="mt-1 block text-sm text-slate-500">
                            PNG, JPEG, WebP or SVG
                          </span>
                        </span>

                        <span className="rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-blue-900 shadow-sm">
                          Choose file
                        </span>
                      </button>

                      {errors.logoName ? (
                        <p className="mt-2 text-sm font-bold text-red-700">
                          {errors.logoName}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-8 grid gap-6 sm:grid-cols-3">
                      <div>
                        <label
                          className={labelClass()}
                          htmlFor="primaryColour"
                        >
                          Primary
                        </label>
                        <input
                          className="h-14 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white p-2"
                          id="primaryColour"
                          onChange={(event) =>
                            updateField("primaryColour", event.target.value)
                          }
                          type="color"
                          value={data.primaryColour}
                        />
                      </div>

                      <div>
                        <label
                          className={labelClass()}
                          htmlFor="secondaryColour"
                        >
                          Secondary
                        </label>
                        <input
                          className="h-14 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white p-2"
                          id="secondaryColour"
                          onChange={(event) =>
                            updateField("secondaryColour", event.target.value)
                          }
                          type="color"
                          value={data.secondaryColour}
                        />
                      </div>

                      <div>
                        <label
                          className={labelClass()}
                          htmlFor="accentColour"
                        >
                          Background
                        </label>
                        <input
                          className="h-14 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white p-2"
                          id="accentColour"
                          onChange={(event) =>
                            updateField("accentColour", event.target.value)
                          }
                          type="color"
                          value={data.accentColour}
                        />
                      </div>
                    </div>

                    {errors.branding ? (
                      <p className="mt-3 text-sm font-bold text-red-700">
                        {errors.branding}
                      </p>
                    ) : null}

                    <div className="mt-8 grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className={labelClass()} htmlFor="visualStyle">
                          Website style
                        </label>
                        <select
                          className={fieldClass()}
                          id="visualStyle"
                          onChange={(event) =>
                            updateField(
                              "visualStyle",
                              event.target
                                .value as WebsiteWizardData["visualStyle"],
                            )
                          }
                          value={data.visualStyle}
                        >
                          <option value="modern">Modern and clean</option>
                          <option value="professional">
                            Professional and trustworthy
                          </option>
                          <option value="premium">Premium and polished</option>
                          <option value="friendly">
                            Friendly and approachable
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass()} htmlFor="fontStyle">
                          Font personality
                        </label>
                        <select
                          className={fieldClass()}
                          id="fontStyle"
                          onChange={(event) =>
                            updateField(
                              "fontStyle",
                              event.target
                                .value as WebsiteWizardData["fontStyle"],
                            )
                          }
                          value={data.fontStyle}
                        >
                          <option value="clean">Clean and simple</option>
                          <option value="traditional">
                            Traditional and established
                          </option>
                          <option value="bold">Bold and confident</option>
                          <option value="soft">Soft and welcoming</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <aside
                    className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm"
                    style={{ backgroundColor: data.accentColour }}
                  >
                    <div
                      className="px-6 py-5"
                      style={{ backgroundColor: data.primaryColour }}
                    >
                      <p className="font-black text-white">
                        {data.businessName || "Your Business"}
                      </p>
                    </div>

                    <div className="p-6">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold"
                        style={{
                          backgroundColor: data.secondaryColour,
                          color: "#0f172a",
                        }}
                      >
                        Trusted local service
                      </span>

                      <h3 className="mt-5 text-3xl font-black text-slate-950">
                        Professional work, clearly explained.
                      </h3>

                      <p className="mt-3 leading-7 text-slate-600">
                        This preview shows how Beacon may combine the selected
                        colours.
                      </p>

                      <button
                        className="mt-6 rounded-2xl px-5 py-3 font-extrabold text-white"
                        style={{ backgroundColor: data.primaryColour }}
                        type="button"
                      >
                        Request a quote
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            ) : null}

            {data.currentStep === 5 ? (
              <div>
                <SectionHeading
                  description="Upload completed work, the team, vehicles, premises or equipment. Beacon will choose the most useful images for each page."
                  eyebrow="Step 5"
                  title="Photos and project images"
                />

                <input
                  accept="image/*"
                  className="hidden"
                  multiple
                  onChange={handlePhotosChange}
                  ref={photoInputRef}
                  type="file"
                />

                <button
                  className="flex min-h-52 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-300 bg-blue-50 px-6 py-10 text-center transition hover:border-blue-500 hover:bg-blue-100"
                  onClick={() => photoInputRef.current?.click()}
                  type="button"
                >
                  <span className="text-4xl" aria-hidden="true">
                    📷
                  </span>
                  <span className="mt-4 text-lg font-black text-blue-950">
                    Upload business photos
                  </span>
                  <span className="mt-2 max-w-xl text-sm leading-6 text-blue-800">
                    Up to {MAX_PHOTOS} images. Each image must be 10 MB or
                    smaller.
                  </span>
                </button>

                {errors.photos ? (
                  <p className="mt-3 text-sm font-bold text-red-700">
                    {errors.photos}
                  </p>
                ) : null}

                {photos.length ? (
                  <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {photos.map((photo) => (
                      <article
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                        key={photo.id}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={photo.name}
                          className="h-48 w-full object-cover"
                          src={photo.previewUrl}
                        />

                        <div className="flex items-center justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-slate-900">
                              {photo.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {(photo.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>

                          <button
                            className="text-sm font-extrabold text-red-700 hover:text-red-900"
                            onClick={() => removePhoto(photo.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                    Photos are optional for now. The website can still be
                    generated, but genuine business photos usually improve trust
                    and conversion.
                  </div>
                )}

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      className={labelClass()}
                      htmlFor="preferredDomain"
                    >
                      Preferred domain
                    </label>
                    <input
                      className={fieldClass()}
                      id="preferredDomain"
                      onChange={(event) =>
                        updateField("preferredDomain", event.target.value)
                      }
                      placeholder="example.co.uk"
                      value={data.preferredDomain}
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="websiteGoal">
                      Main website goal
                    </label>
                    <select
                      className={fieldClass()}
                      id="websiteGoal"
                      onChange={(event) =>
                        updateField("websiteGoal", event.target.value)
                      }
                      value={data.websiteGoal}
                    >
                      <option>Generate more customer enquiries</option>
                      <option>Showcase completed work</option>
                      <option>Build trust and credibility</option>
                      <option>Promote emergency services</option>
                      <option>Explain specialist services</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className={labelClass()}
                      htmlFor="targetCustomers"
                    >
                      Ideal customers
                    </label>
                    <textarea
                      className={`${fieldClass()} min-h-28 resize-y`}
                      id="targetCustomers"
                      onChange={(event) =>
                        updateField("targetCustomers", event.target.value)
                      }
                      placeholder="Homeowners, landlords, commercial property managers..."
                      value={data.targetCustomers}
                    />
                  </div>

                  <div>
                    <label
                      className={labelClass()}
                      htmlFor="specialInstructions"
                    >
                      Special instructions for Beacon
                    </label>
                    <textarea
                      className={`${fieldClass()} min-h-28 resize-y`}
                      id="specialInstructions"
                      onChange={(event) =>
                        updateField(
                          "specialInstructions",
                          event.target.value,
                        )
                      }
                      placeholder="Anything Beacon should include, avoid or prioritise."
                      value={data.specialInstructions}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {data.currentStep === 6 ? (
              <div>
                <SectionHeading
                  description="Review the business brief before Beacon prepares the website. Every section remains editable."
                  eyebrow="Step 6"
                  title="Review the website brief"
                />

                {errors.review ? (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-800">
                    {errors.review}
                  </div>
                ) : null}

                {generationError ? (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                    <p className="font-black text-red-900">
                      Website generation failed
                    </p>
                    <p className="mt-2 leading-7 text-red-800">
                      {generationError}
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-2">
                  <section className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-black text-slate-950">
                        Business
                      </h3>
                      <button
                        className="font-extrabold text-blue-800 hover:text-blue-950"
                        onClick={() =>
                          persist({ ...data, currentStep: 1 }, "Progress saved")
                        }
                        type="button"
                      >
                        Edit
                      </button>
                    </div>

                    <dl className="mt-3">
                      <SummaryRow
                        label="Business name"
                        value={data.businessName}
                      />
                      <SummaryRow label="Trade" value={data.trade} />
                      <SummaryRow
                        label="Years trading"
                        value={data.yearsTrading}
                      />
                      <SummaryRow
                        label="Description"
                        value={data.businessDescription}
                      />
                    </dl>
                  </section>

                  <section className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-black text-slate-950">
                        Contact
                      </h3>
                      <button
                        className="font-extrabold text-blue-800 hover:text-blue-950"
                        onClick={() =>
                          persist({ ...data, currentStep: 2 }, "Progress saved")
                        }
                        type="button"
                      >
                        Edit
                      </button>
                    </div>

                    <dl className="mt-3">
                      <SummaryRow label="Contact" value={data.contactName} />
                      <SummaryRow label="Phone" value={data.phone} />
                      <SummaryRow label="Email" value={data.email} />
                      <SummaryRow
                        label="Location"
                        value={[data.townCity, data.county]
                          .filter(Boolean)
                          .join(", ")}
                      />
                      <SummaryRow
                        label="Areas covered"
                        value={data.serviceAreas}
                      />
                    </dl>
                  </section>

                  <section className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-black text-slate-950">
                        Services
                      </h3>
                      <button
                        className="font-extrabold text-blue-800 hover:text-blue-950"
                        onClick={() =>
                          persist({ ...data, currentStep: 3 }, "Progress saved")
                        }
                        type="button"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {data.services
                        .filter((service) => service.name.trim())
                        .map((service) => (
                          <div
                            className="rounded-2xl bg-slate-50 p-4"
                            key={service.id}
                          >
                            <p className="font-extrabold text-slate-900">
                              {service.name}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {service.description || "No description added."}
                            </p>
                          </div>
                        ))}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-black text-slate-950">
                        Branding
                      </h3>
                      <button
                        className="font-extrabold text-blue-800 hover:text-blue-950"
                        onClick={() =>
                          persist({ ...data, currentStep: 4 }, "Progress saved")
                        }
                        type="button"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-5 flex gap-3">
                      {[
                        data.primaryColour,
                        data.secondaryColour,
                        data.accentColour,
                      ].map((colour) => (
                        <span
                          className="h-12 w-12 rounded-2xl border border-slate-200 shadow-sm"
                          key={colour}
                          style={{ backgroundColor: colour }}
                        />
                      ))}
                    </div>

                    <dl className="mt-3">
                      <SummaryRow
                        label="Style"
                        value={data.visualStyle}
                      />
                      <SummaryRow
                        label="Font"
                        value={data.fontStyle}
                      />
                      <SummaryRow
                        label="Logo"
                        value={data.logoName || "No logo uploaded"}
                      />
                      <SummaryRow
                        label="Photos"
                        value={data.photoNames.length}
                      />
                    </dl>
                  </section>
                </div>

                <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-6">
                  <h3 className="text-lg font-black text-blue-950">
                    What Beacon will prepare
                  </h3>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      "Homepage content and layout",
                      "About page",
                      "Service pages",
                      "Contact page and enquiry calls-to-action",
                      "Frequently asked questions",
                      "Privacy, cookie and terms pages",
                      "SEO titles and descriptions",
                      "Local business structured data",
                    ].map((item) => (
                      <p
                        className="flex gap-2 font-semibold text-blue-900"
                        key={item}
                      >
                        <span aria-hidden="true">✓</span>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {data.currentStep === 7 ? (
              <div>
                <SectionHeading
                  description="The business brief is ready. The next connection will send it to Beacon's website-generation engine."
                  eyebrow="Step 7"
                  title="Website brief prepared"
                />

                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-200 text-3xl"
                  >
                    ✓
                  </span>

                  <h3 className="mt-5 text-2xl font-black text-emerald-950">
                    Your website has been generated
                  </h3>

                  <p className="mx-auto mt-3 max-w-2xl leading-7 text-emerald-900">
                    Beacon has created the pages, service content, SEO, legal
                    drafts and local business data. Review the complete website
                    preview before approving anything for publication.
                  </p>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 p-6 text-center">
                    <p className="text-3xl font-black text-slate-950">
                      {
                        data.services.filter((service) =>
                          service.name.trim(),
                        ).length
                      }
                    </p>
                    <p className="mt-2 font-bold text-slate-600">Services</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-6 text-center">
                    <p className="text-3xl font-black text-slate-950">
                      {data.photoNames.length}
                    </p>
                    <p className="mt-2 font-bold text-slate-600">Photos</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-6 text-center">
                    <p className="text-3xl font-black text-slate-950">
                      {completion}%
                    </p>
                    <p className="mt-2 font-bold text-slate-600">Brief complete</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-6 py-4 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
                    href="/business/website"
                  >
                    Website Dashboard
                  </Link>

                  <Link
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
                    href="/business/preview"
                  >
                    Open Website Preview
                  </Link>
                </div>
              </div>
            ) : null}

            {data.currentStep < 7 ? (
              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  className={`rounded-2xl border-2 px-6 py-4 font-extrabold transition ${
                    data.currentStep === 1
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "border-slate-300 bg-white text-slate-800 hover:border-blue-400 hover:text-blue-950"
                  }`}
                  disabled={data.currentStep === 1}
                  onClick={previousStep}
                  type="button"
                >
                  Previous
                </button>

                {data.currentStep === 6 ? (
                  <button
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-wait disabled:opacity-70"
                    disabled={isGenerating}
                    onClick={generateWebsite}
                    type="button"
                  >
                    {isGenerating
                      ? "Generating Website..."
                      : "Generate Website"}
                  </button>
                ) : (
                  <button
                    className="rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900"
                    type="submit"
                  >
                    Save & Continue
                  </button>
                )}
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}