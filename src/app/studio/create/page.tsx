"use client";

import {
  ArrowLeft,
  CreditCard,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import StudioAdvancedSettings from "@/app/studio/_components/StudioAdvancedSettings";
import {
  calculateStudioCreditEstimate,
  getStudioEstimatedWait,
  getStudioTool,
  isStudioToolId,
  isStudioVideoTool,
  type StudioAspectRatio,
  type StudioGenerateErrorResponse,
  type StudioGenerateSuccessResponse,
  type StudioOutputCount,
  type StudioQuality,
  type StudioToolId,
  type StudioToolOption,
} from "@/app/studio/_components/StudioCreateTypes";
import StudioCreditEstimate from "@/app/studio/_components/StudioCreditEstimate";
import StudioGenerationReview from "@/app/studio/_components/StudioGenerationReview";
import StudioPlanner, {
  type StudioPlannerGenerationRequest,
  type StudioPlannerInput,
  type StudioPlannerPlan,
} from "@/app/studio/_components/StudioPlanner";
import StudioRequest from "@/app/studio/_components/StudioRequest";

type StudioCreateStep =
  | "request"
  | "plan"
  | "routing";

type StudioGenerateApiResponse =
  | StudioGenerateSuccessResponse
  | StudioGenerateErrorResponse;

type WebsiteBriefPackage =
  | "starter"
  | "business"
  | "premium";

type WebsiteBriefHandoff = {
  businessName: string;
  businessType: string;
  businessDescription: string;
  yearsTrading: string;
  serviceArea: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  primaryColour: string;
  secondaryColour: string;
  styleDirection: string;
  services: string;
  idealCustomer: string;
  keyMessage: string;
  callToAction: string;
  socialLinks: string;
  packageId: WebsiteBriefPackage;
  chatbot: boolean;
  onlineShop: boolean;
  membershipArea: boolean;
  notes: string;
  studioHandoff: {
    source: "beacon-studio";
    originalPrompt: string;
    routedAt: string;
    requestedTool: StudioToolId;
    quality: StudioQuality;
    aspectRatio: StudioAspectRatio;
    outputCount: StudioOutputCount;
    durationSeconds: number;
    audience: string;
    style: string;
    tone: string;
    colours: string[];
    referenceUrl?: string;
    brandKit?: string;
    projectTitle: string;
  };
};

const WEBSITE_BRIEF_STORAGE_KEY =
  "beacon-business-website-brief";

const WEBSITE_INTENT_PHRASES = [
  "website",
  "web site",
  "website design",
  "website builder",
  "build a site",
  "build me a site",
  "business site",
  "company site",
  "landing page",
  "landing-page",
  "homepage",
  "home page",
  "web page",
  "webpage",
  "web app",
  "web application",
  "online shop",
  "online store",
  "ecommerce",
  "e-commerce",
  "portfolio site",
  "portfolio website",
  "booking website",
  "booking site",
  "service website",
  "business website",
  "responsive website",
  "desktop website",
  "mobile website",
  "website mockup",
  "website mock-up",
  "website preview",
  "site preview",
  "website layout",
  "website template",
  "web template",
  "dashboard website",
  "customer portal",
  "membership website",
];

const WEBSITE_EXCLUSION_PHRASES = [
  "website banner",
  "web banner",
  "banner for my website",
  "image for my website",
  "hero image",
  "website hero image",
  "website advert",
  "website ad",
  "social post promoting my website",
  "video promoting my website",
  "advert for my website",
];

function getInitialTool(
  requestedTool: string | null,
): StudioToolId {
  if (isStudioToolId(requestedTool)) {
    return requestedTool;
  }

  return "marketing";
}

function parseColours(
  colours: string,
): string[] {
  return colours
    .split(",")
    .map((colour) => colour.trim())
    .filter(Boolean);
}

function normaliseIntentText(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isWebsiteCreationRequest(
  prompt: string,
): boolean {
  const normalised =
    normaliseIntentText(prompt);

  if (!normalised) {
    return false;
  }

  const isExcluded =
    WEBSITE_EXCLUSION_PHRASES.some(
      (phrase) =>
        normalised.includes(phrase),
    );

  if (isExcluded) {
    return false;
  }

  return WEBSITE_INTENT_PHRASES.some(
    (phrase) =>
      normalised.includes(phrase),
  );
}

function inferWebsitePackage(
  prompt: string,
): WebsiteBriefPackage {
  const normalised =
    normaliseIntentText(prompt);

  if (
    normalised.includes("premium") ||
    normalised.includes("bespoke") ||
    normalised.includes("advanced") ||
    normalised.includes("membership") ||
    normalised.includes("customer portal") ||
    normalised.includes("booking system")
  ) {
    return "premium";
  }

  if (
    normalised.includes("simple") ||
    normalised.includes("basic") ||
    normalised.includes("starter") ||
    normalised.includes("one page") ||
    normalised.includes("one-page")
  ) {
    return "starter";
  }

  return "business";
}

function inferWebsiteStyle(
  style: string,
  prompt: string,
): string {
  const combined =
    normaliseIntentText(
      `${style} ${prompt}`,
    );

  if (
    combined.includes("premium") ||
    combined.includes("luxury") ||
    combined.includes("elegant")
  ) {
    return "Premium and elegant";
  }

  if (
    combined.includes("bold") ||
    combined.includes("energetic") ||
    combined.includes("vibrant")
  ) {
    return "Bold and energetic";
  }

  if (
    combined.includes("minimal") ||
    combined.includes("clean") ||
    combined.includes("modern")
  ) {
    return "Modern and minimal";
  }

  if (
    combined.includes("friendly") ||
    combined.includes("approachable")
  ) {
    return "Friendly and approachable";
  }

  if (
    combined.includes("traditional") ||
    combined.includes("established")
  ) {
    return "Traditional and established";
  }

  return "Professional and trustworthy";
}

function inferBusinessName(
  projectTitle: string,
): string {
  const cleaned =
    projectTitle.trim();

  if (
    !cleaned ||
    cleaned.toLowerCase() ===
      "beacon studio"
  ) {
    return "";
  }

  return cleaned.slice(0, 140);
}

function inferBusinessType(
  prompt: string,
): string {
  const normalised =
    normaliseIntentText(prompt);

  const patterns: Array<{
    label: string;
    terms: string[];
  }> = [
    {
      label: "Construction and trade services",
      terms: [
        "builder",
        "building company",
        "roofer",
        "roofing",
        "plumber",
        "plumbing",
        "electrician",
        "electrical",
        "plasterer",
        "plastering",
        "joiner",
        "carpenter",
        "landscaper",
        "landscaping",
        "decorator",
        "painting company",
      ],
    },
    {
      label: "Automotive business",
      terms: [
        "garage",
        "mechanic",
        "car dealer",
        "automotive",
        "vehicle repair",
        "mot centre",
      ],
    },
    {
      label: "Beauty and wellbeing business",
      terms: [
        "salon",
        "beauty",
        "barber",
        "hairdresser",
        "spa",
        "wellness",
        "massage",
      ],
    },
    {
      label: "Restaurant and hospitality business",
      terms: [
        "restaurant",
        "cafe",
        "coffee shop",
        "hotel",
        "guest house",
        "takeaway",
        "catering",
      ],
    },
    {
      label: "Professional services business",
      terms: [
        "accountant",
        "solicitor",
        "consultant",
        "consultancy",
        "financial adviser",
        "estate agent",
        "insurance",
      ],
    },
    {
      label: "Retail and ecommerce business",
      terms: [
        "online shop",
        "online store",
        "ecommerce",
        "e-commerce",
        "retail",
        "product store",
      ],
    },
    {
      label: "Technology business",
      terms: [
        "software",
        "technology",
        "tech company",
        "saas",
        "app",
        "digital agency",
      ],
    },
  ];

  const match =
    patterns.find((pattern) =>
      pattern.terms.some((term) =>
        normalised.includes(term),
      ),
    );

  return match?.label ?? "";
}

function inferCallToAction(
  prompt: string,
): string {
  const normalised =
    normaliseIntentText(prompt);

  if (
    normalised.includes("book") ||
    normalised.includes("booking")
  ) {
    return "Book now";
  }

  if (
    normalised.includes("shop") ||
    normalised.includes("store") ||
    normalised.includes("ecommerce") ||
    normalised.includes("e-commerce")
  ) {
    return "Shop now";
  }

  if (
    normalised.includes("contact")
  ) {
    return "Contact us";
  }

  if (
    normalised.includes("consultation")
  ) {
    return "Book a consultation";
  }

  return "Request a quote";
}

function inferWebsiteModules(
  prompt: string,
): Pick<
  WebsiteBriefHandoff,
  | "chatbot"
  | "onlineShop"
  | "membershipArea"
> {
  const normalised =
    normaliseIntentText(prompt);

  return {
    chatbot:
      normalised.includes("chatbot") ||
      normalised.includes(
        "ai assistant",
      ),

    onlineShop:
      normalised.includes(
        "online shop",
      ) ||
      normalised.includes(
        "online store",
      ) ||
      normalised.includes(
        "ecommerce",
      ) ||
      normalised.includes(
        "e-commerce",
      ) ||
      normalised.includes(
        "sell products",
      ),

    membershipArea:
      normalised.includes(
        "membership",
      ) ||
      normalised.includes(
        "member area",
      ) ||
      normalised.includes(
        "customer portal",
      ) ||
      normalised.includes(
        "client portal",
      ),
  };
}

function getHexColours(
  colours: string[],
): {
  primaryColour: string;
  secondaryColour: string;
} {
  const validHexColours =
    colours.filter((colour) =>
      /^#[0-9a-f]{6}$/i.test(
        colour.trim(),
      ),
    );

  return {
    primaryColour:
      validHexColours[0] ??
      "#0f3d91",

    secondaryColour:
      validHexColours[1] ??
      "#d4af37",
  };
}

function buildWebsiteBriefHandoff({
  prompt,
  selectedTool,
  quality,
  aspectRatio,
  outputCount,
  durationSeconds,
  audience,
  style,
  tone,
  colours,
  reference,
  notes,
  brandKit,
  projectTitle,
}: {
  prompt: string;
  selectedTool: StudioToolId;
  quality: StudioQuality;
  aspectRatio: StudioAspectRatio;
  outputCount: StudioOutputCount;
  durationSeconds: number;
  audience: string;
  style: string;
  tone: string;
  colours: string;
  reference: string;
  notes: string;
  brandKit: string;
  projectTitle: string;
}): WebsiteBriefHandoff {
  const parsedColours =
    parseColours(colours);

  const {
    primaryColour,
    secondaryColour,
  } = getHexColours(parsedColours);

  const modules =
    inferWebsiteModules(prompt);

  const cleanPrompt =
    prompt.trim();

  const cleanNotes =
    notes.trim();

  const cleanAudience =
    audience.trim();

  const cleanReference =
    reference.trim();

  const businessName =
    inferBusinessName(projectTitle);

  return {
    businessName,

    businessType:
      inferBusinessType(
        cleanPrompt,
      ),

    businessDescription:
      cleanPrompt,

    yearsTrading: "",

    serviceArea: "",

    address: "",

    phone: "",

    email: "",

    website:
      cleanReference,

    primaryColour,

    secondaryColour,

    styleDirection:
      inferWebsiteStyle(
        style,
        cleanPrompt,
      ),

    services: "",

    idealCustomer:
      cleanAudience,

    keyMessage:
      cleanPrompt,

    callToAction:
      inferCallToAction(
        cleanPrompt,
      ),

    socialLinks: "",

    packageId:
      inferWebsitePackage(
        cleanPrompt,
      ),

    chatbot:
      modules.chatbot,

    onlineShop:
      modules.onlineShop,

    membershipArea:
      modules.membershipArea,

    notes: [
      cleanNotes,

      tone.trim()
        ? `Preferred tone: ${tone.trim()}.`
        : "",

      brandKit !== "none"
        ? `Use saved brand kit: ${brandKit}.`
        : "",

      parsedColours.length > 0
        ? `Requested colours: ${parsedColours.join(
            ", ",
          )}.`
        : "",

      "This brief was started in Beacon Studio and routed directly to the Beacon Business Website Builder.",

      `Original Studio request: ${cleanPrompt}`,
    ]
      .filter(Boolean)
      .join("\n\n"),

    studioHandoff: {
      source:
        "beacon-studio",

      originalPrompt:
        cleanPrompt,

      routedAt:
        new Date().toISOString(),

      requestedTool:
        selectedTool,

      quality,

      aspectRatio,

      outputCount,

      durationSeconds,

      audience:
        cleanAudience,

      style:
        style.trim(),

      tone:
        tone.trim(),

      colours:
        parsedColours,

      referenceUrl:
        cleanReference ||
        undefined,

      brandKit:
        brandKit !== "none"
          ? brandKit
          : undefined,

      projectTitle:
        projectTitle.trim() ||
        "Beacon Studio",
    },
  };
}

function StudioCreateContent() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const requestedTool =
    searchParams.get("tool");

  const initialTool = useMemo(
    () =>
      getInitialTool(
        requestedTool,
      ),
    [requestedTool],
  );

  const [step, setStep] =
    useState<StudioCreateStep>(
      "request",
    );

  const [
    selectedTool,
    setSelectedTool,
  ] =
    useState<StudioToolId>(
      initialTool,
    );

  const [prompt, setPrompt] =
    useState("");

  const [
    showAdvanced,
    setShowAdvanced,
  ] = useState(false);

  const [quality, setQuality] =
    useState<StudioQuality>(
      "high",
    );

  const [
    aspectRatio,
    setAspectRatio,
  ] =
    useState<StudioAspectRatio>(
      initialTool ===
        "long-video"
        ? "16:9"
        : "9:16",
    );

  const [
    outputCount,
    setOutputCount,
  ] =
    useState<StudioOutputCount>(
      1,
    );

  const [
    durationSeconds,
    setDurationSeconds,
  ] = useState(
    initialTool ===
      "long-video"
      ? 60
      : 15,
  );

  const [audience, setAudience] =
    useState("");

  const [style, setStyle] =
    useState("premium");

  const [tone, setTone] =
    useState("confident");

  const [colours, setColours] =
    useState("");

  const [
    reference,
    setReference,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [brandKit, setBrandKit] =
    useState("none");

  const [
    projectTitle,
    setProjectTitle,
  ] =
    useState("Beacon Studio");

  const [
    saveToLibrary,
    setSaveToLibrary,
  ] = useState(true);

  const [
    creativePlan,
    setCreativePlan,
  ] =
    useState<StudioPlannerPlan | null>(
      null,
    );

  const [
    plannedGenerationRequest,
    setPlannedGenerationRequest,
  ] =
    useState<StudioPlannerGenerationRequest | null>(
      null,
    );

  const [
    showReview,
    setShowReview,
  ] = useState(false);

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [
    generationError,
    setGenerationError,
  ] = useState<string | null>(
    null,
  );

  const selectedToolDetails =
    useMemo<StudioToolOption>(
      () =>
        getStudioTool(
          selectedTool,
        ),
      [selectedTool],
    );

  const isVideo =
    isStudioVideoTool(
      selectedTool,
    );

  const estimatedCredits =
    useMemo(
      () =>
        calculateStudioCreditEstimate(
          {
            tool:
              selectedToolDetails,
            quality,
            outputCount,
            durationSeconds,
          },
        ),
      [
        durationSeconds,
        outputCount,
        quality,
        selectedToolDetails,
      ],
    );

  const estimatedWait =
    useMemo(
      () =>
        getStudioEstimatedWait({
          tool: selectedTool,
          quality,
        }),
      [
        quality,
        selectedTool,
      ],
    );

  const promptReady =
    prompt.trim().length >= 10;

  const plannerRequest =
    useMemo<StudioPlannerInput>(
      () => ({
        prompt:
          prompt.trim(),

        requestedTool:
          selectedTool,

        quality,

        aspectRatio,

        outputCount,

        durationSeconds:
          isVideo
            ? durationSeconds
            : undefined,

        audience:
          audience.trim() ||
          undefined,

        style:
          style.trim() ||
          undefined,

        tone:
          tone.trim() ||
          undefined,

        colours:
          parseColours(
            colours,
          ),

        referenceUrl:
          reference.trim() ||
          undefined,

        notes:
          notes.trim() ||
          undefined,

        brandKit:
          brandKit !== "none"
            ? brandKit
            : undefined,

        projectTitle:
          projectTitle.trim() ||
          "Beacon Studio",

        saveToLibrary,
      }),
      [
        aspectRatio,
        audience,
        brandKit,
        colours,
        durationSeconds,
        isVideo,
        notes,
        outputCount,
        projectTitle,
        prompt,
        quality,
        reference,
        saveToLibrary,
        selectedTool,
        style,
        tone,
      ],
    );

  useEffect(() => {
    if (
      selectedTool ===
      initialTool
    ) {
      return;
    }

    setSelectedTool(
      initialTool,
    );

    if (
      initialTool ===
      "short-video"
    ) {
      setAspectRatio(
        "9:16",
      );

      setDurationSeconds(
        15,
      );
    }

    if (
      initialTool ===
      "long-video"
    ) {
      setAspectRatio(
        "16:9",
      );

      setDurationSeconds(
        60,
      );
    }
  }, [
    initialTool,
    selectedTool,
  ]);

  function routeWebsiteRequest(): void {
    const websiteBrief =
      buildWebsiteBriefHandoff({
        prompt:
          prompt.trim(),

        selectedTool,

        quality,

        aspectRatio,

        outputCount,

        durationSeconds,

        audience,

        style,

        tone,

        colours,

        reference,

        notes,

        brandKit,

        projectTitle,
      });

    window.localStorage.setItem(
      WEBSITE_BRIEF_STORAGE_KEY,
      JSON.stringify(
        websiteBrief,
      ),
    );

    setStep("routing");

    router.push(
      "/business/website?source=studio",
    );
  }

  function createPlan(): void {
    if (
      !promptReady ||
      isGenerating
    ) {
      return;
    }

    setGenerationError(null);
    setCreativePlan(null);
    setPlannedGenerationRequest(
      null,
    );
    setShowReview(false);

    if (
      isWebsiteCreationRequest(
        prompt,
      )
    ) {
      routeWebsiteRequest();
      return;
    }

    setStep("plan");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function returnToRequest(): void {
    if (isGenerating) {
      return;
    }

    setStep("request");
    setShowReview(false);
    setGenerationError(null);
    setCreativePlan(null);
    setPlannedGenerationRequest(
      null,
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handlePlannerContinue(
    generationRequest: StudioPlannerGenerationRequest,
    plan: StudioPlannerPlan,
  ): void {
    if (isGenerating) {
      return;
    }

    setCreativePlan(plan);

    setPlannedGenerationRequest(
      generationRequest,
    );

    setGenerationError(null);
    setShowReview(true);
  }

  function closeReview(): void {
    if (isGenerating) {
      return;
    }

    setShowReview(false);
    setGenerationError(null);
  }

  async function generateCampaign(): Promise<void> {
    if (
      !creativePlan ||
      !plannedGenerationRequest ||
      isGenerating
    ) {
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      if (
        isWebsiteCreationRequest(
          plannedGenerationRequest.prompt,
        )
      ) {
        routeWebsiteRequest();
        return;
      }

      const generationDurationSeconds =
        plannedGenerationRequest.durationSeconds;

      const response =
        await fetch(
          "/api/studio/generate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                prompt:
                  plannedGenerationRequest.prompt.trim(),

                requestedTool:
                  plannedGenerationRequest.requestedTool,

                selectedTool:
                  plannedGenerationRequest.requestedTool,

                formats:
                  creativePlan.deliverables.map(
                    (
                      deliverable,
                    ) =>
                      deliverable.format,
                  ),

                audience:
                  plannedGenerationRequest.audience,

                tone:
                  plannedGenerationRequest.tone,

                style:
                  plannedGenerationRequest.style,

                colours:
                  plannedGenerationRequest.colours,

                sourceUrl:
                  plannedGenerationRequest.referenceUrl,

                referenceUrl:
                  plannedGenerationRequest.referenceUrl,

                notes:
                  plannedGenerationRequest.notes,

                durationMs:
                  typeof generationDurationSeconds ===
                  "number"
                    ? generationDurationSeconds *
                      1_000
                    : undefined,

                quality:
                  plannedGenerationRequest.quality,

                aspectRatio:
                  plannedGenerationRequest.aspectRatio,

                outputCount:
                  plannedGenerationRequest.outputCount,

                brandKit:
                  plannedGenerationRequest.brandKit,

                projectTitle:
                  plannedGenerationRequest.projectTitle,

                saveToLibrary:
                  plannedGenerationRequest.saveToLibrary,

                confirmedCreditCost:
                  creativePlan.estimatedCredits,

                creativePlan,
              }),
          },
        );

      let data:
        StudioGenerateApiResponse;

      try {
        data =
          (await response.json()) as StudioGenerateApiResponse;
      } catch {
        throw new Error(
          "Beacon Studio returned an invalid response.",
        );
      }

      if (!response.ok) {
        const errorData =
          data as StudioGenerateErrorResponse;

        if (
          response.status ===
            402 &&
          typeof errorData.requiredCredits ===
            "number" &&
          typeof errorData.availableCredits ===
            "number"
        ) {
          throw new Error(
            `You need ${errorData.requiredCredits} Studio Credits, but only ${errorData.availableCredits} are available.`,
          );
        }

        if (
          response.status ===
          401
        ) {
          throw new Error(
            "Please sign in before creating a Studio project.",
          );
        }

        if (
          response.status ===
          403
        ) {
          throw new Error(
            "Your account does not currently have permission to use this Studio workflow.",
          );
        }

        if (
          response.status ===
          422
        ) {
          throw new Error(
            errorData.error ||
              "Beacon Studio needs more information before generation can begin.",
          );
        }

        if (
          response.status ===
          429
        ) {
          throw new Error(
            "Beacon Studio is currently busy. Please wait a moment and try again.",
          );
        }

        throw new Error(
          errorData.error ||
            "Beacon Studio could not create the preview.",
        );
      }

      const successData =
        data as StudioGenerateSuccessResponse;

      if (
        !successData.projectId
      ) {
        throw new Error(
          "Beacon Studio created the project but did not return a project ID.",
        );
      }

      router.push(
        `/studio/editor/${successData.projectId}`,
      );
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Beacon Studio could not create the preview.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (step === "routing") {
    return (
      <main className="min-h-screen bg-[#020617] text-white">
        <section className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 py-16 text-center">
          <div className="w-full rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.06] p-8 shadow-2xl shadow-black/30 sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-300 text-blue-950">
              <Sparkles className="h-7 w-7" />
            </div>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Website project detected
            </p>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Opening the Beacon Business Website Builder
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-slate-300 sm:text-base">
              Website requests do not use storyboards. Your Studio request has
              been saved into the website brief and is being handed to the
              correct builder.
            </p>

            <div
              aria-hidden="true"
              className="mx-auto mt-8 h-10 w-10 animate-spin rounded-full border-4 border-cyan-200/20 border-t-cyan-300"
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.3),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_70%_100%,rgba(245,158,11,0.08),transparent_30%),linear-gradient(180deg,#020617_0%,#081225_100%)]"
        />

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-cyan-100">
                <Sparkles className="h-4 w-4" />
                Beacon Studio
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                {step === "request"
                  ? "Describe what you want to create."
                  : "Review your creative plan."}
              </h1>

              <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-300 sm:text-lg">
                {step === "request"
                  ? "Beacon identifies what you are creating and sends the request to the correct production workflow."
                  : "Studio Brain has analysed your request and selected the appropriate creative workflow."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/studio"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:border-white/20 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Studio
              </Link>

              <Link
                href="/studio/projects"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:border-white/20 hover:bg-white/10"
              >
                <FolderOpen className="h-4 w-4" />
                Projects
              </Link>

              <Link
                href="/studio/pricing"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black text-blue-950 transition hover:bg-amber-200"
              >
                <CreditCard className="h-4 w-4" />
                Buy Credits
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                number: "01",
                title: "Describe",
                active:
                  step === "request",
                complete:
                  step === "plan",
              },
              {
                number: "02",
                title: "Creative Plan",
                active:
                  step === "plan",
                complete: false,
              },
              {
                number: "03",
                title: "Preview",
                active: false,
                complete: false,
              },
            ].map((item) => (
              <div
                key={item.number}
                className={`rounded-2xl border px-4 py-4 transition ${
                  item.active
                    ? "border-cyan-300/30 bg-cyan-300/10"
                    : item.complete
                      ? "border-emerald-300/20 bg-emerald-300/10"
                      : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${
                      item.active
                        ? "bg-cyan-300 text-blue-950"
                        : item.complete
                          ? "bg-emerald-300 text-emerald-950"
                          : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {item.complete
                      ? "✓"
                      : item.number}
                  </span>

                  <span
                    className={`text-sm font-black ${
                      item.active
                        ? "text-white"
                        : item.complete
                          ? "text-emerald-100"
                          : "text-slate-500"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {step === "request" ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <StudioRequest
                prompt={prompt}
                selectedTool={
                  selectedTool
                }
                selectedToolDetails={
                  selectedToolDetails
                }
                showAdvanced={
                  showAdvanced
                }
                disabled={
                  isGenerating
                }
                onPromptChange={
                  setPrompt
                }
                onAdvancedToggle={() =>
                  setShowAdvanced(
                    (current) =>
                      !current,
                  )
                }
                onContinue={
                  createPlan
                }
              />

              {showAdvanced ? (
                <StudioAdvancedSettings
                  audience={
                    audience
                  }
                  style={style}
                  tone={tone}
                  colours={colours}
                  quality={quality}
                  aspectRatio={
                    aspectRatio
                  }
                  outputCount={
                    outputCount
                  }
                  durationSeconds={
                    durationSeconds
                  }
                  reference={
                    reference
                  }
                  notes={notes}
                  brandKit={
                    brandKit
                  }
                  projectTitle={
                    projectTitle
                  }
                  saveToLibrary={
                    saveToLibrary
                  }
                  isVideo={isVideo}
                  disabled={
                    isGenerating
                  }
                  onAudienceChange={
                    setAudience
                  }
                  onStyleChange={
                    setStyle
                  }
                  onToneChange={
                    setTone
                  }
                  onColoursChange={
                    setColours
                  }
                  onQualityChange={
                    setQuality
                  }
                  onAspectRatioChange={
                    setAspectRatio
                  }
                  onOutputCountChange={
                    setOutputCount
                  }
                  onDurationSecondsChange={
                    setDurationSeconds
                  }
                  onReferenceChange={
                    setReference
                  }
                  onNotesChange={
                    setNotes
                  }
                  onBrandKitChange={
                    setBrandKit
                  }
                  onProjectTitleChange={
                    setProjectTitle
                  }
                  onSaveToLibraryChange={
                    setSaveToLibrary
                  }
                />
              ) : null}
            </div>

            <StudioCreditEstimate
              tool={
                selectedToolDetails
              }
              quality={quality}
              aspectRatio={
                aspectRatio
              }
              outputCount={
                outputCount
              }
              durationSeconds={
                durationSeconds
              }
              estimatedCredits={
                estimatedCredits
              }
              estimatedWait={
                estimatedWait
              }
              isVideo={isVideo}
              promptReady={
                promptReady
              }
              isProcessing={
                isGenerating
              }
              error={
                generationError
              }
              onReview={
                createPlan
              }
            />
          </div>
        ) : (
          <StudioPlanner
            request={
              plannerRequest
            }
            onBack={
              returnToRequest
            }
            onContinue={
              handlePlannerContinue
            }
            continueLabel="Review and generate"
          />
        )}
      </section>

      {creativePlan &&
      plannedGenerationRequest ? (
        <StudioGenerationReview
          open={
            showReview
          }
          plan={
            creativePlan
          }
          tool={getStudioTool(
            creativePlan.selectedTool,
          )}
          quality={
            plannedGenerationRequest.quality
          }
          isGenerating={
            isGenerating
          }
          error={
            generationError
          }
          onClose={
            closeReview
          }
          onConfirm={() =>
            void generateCampaign()
          }
        />
      ) : null}
    </main>
  );
}

function StudioCreateLoading() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.3),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#081225_100%)]"
        />

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
          <div className="flex min-h-52 items-center justify-center">
            <div className="text-center">
              <div
                aria-hidden="true"
                className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-200/20 border-t-cyan-300"
              />

              <p className="mt-6 text-xl font-black text-white">
                Loading Beacon Studio…
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-400">
                Preparing your creative workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid animate-pulse gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-[560px] rounded-[2rem] border border-white/10 bg-white/[0.04]" />

          <div className="space-y-5">
            <div className="h-96 rounded-[2rem] border border-white/10 bg-white/[0.04]" />

            <div className="h-40 rounded-[2rem] border border-white/10 bg-white/[0.04]" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function StudioCreatePage() {
  return (
    <Suspense
      fallback={
        <StudioCreateLoading />
      }
    >
      <StudioCreateContent />
    </Suspense>
  );
}