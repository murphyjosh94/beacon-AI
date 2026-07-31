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
  | "plan";

type StudioGenerateApiResponse =
  | StudioGenerateSuccessResponse
  | StudioGenerateErrorResponse;

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

function StudioCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedTool =
    searchParams.get("tool");

  const initialTool = useMemo(
    () => getInitialTool(requestedTool),
    [requestedTool],
  );

  const [step, setStep] =
    useState<StudioCreateStep>("request");

  const [selectedTool, setSelectedTool] =
    useState<StudioToolId>(initialTool);

  const [prompt, setPrompt] =
    useState("");

  const [showAdvanced, setShowAdvanced] =
    useState(false);

  const [quality, setQuality] =
    useState<StudioQuality>("high");

  const [aspectRatio, setAspectRatio] =
    useState<StudioAspectRatio>(
      initialTool === "long-video"
        ? "16:9"
        : "9:16",
    );

  const [outputCount, setOutputCount] =
    useState<StudioOutputCount>(1);

  const [durationSeconds, setDurationSeconds] =
    useState(
      initialTool === "long-video"
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

  const [reference, setReference] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [brandKit, setBrandKit] =
    useState("none");

  const [projectTitle, setProjectTitle] =
    useState("Beacon Studio");

  const [saveToLibrary, setSaveToLibrary] =
    useState(true);

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

  const [showReview, setShowReview] =
    useState(false);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [
    generationError,
    setGenerationError,
  ] = useState<string | null>(null);

  const selectedToolDetails =
    useMemo<StudioToolOption>(
      () => getStudioTool(selectedTool),
      [selectedTool],
    );

  const isVideo =
    isStudioVideoTool(selectedTool);

  const estimatedCredits = useMemo(
    () =>
      calculateStudioCreditEstimate({
        tool: selectedToolDetails,
        quality,
        outputCount,
        durationSeconds,
      }),
    [
      durationSeconds,
      outputCount,
      quality,
      selectedToolDetails,
    ],
  );

  const estimatedWait = useMemo(
    () =>
      getStudioEstimatedWait({
        tool: selectedTool,
        quality,
      }),
    [quality, selectedTool],
  );

  const promptReady =
    prompt.trim().length >= 10;

  const plannerRequest =
    useMemo<StudioPlannerInput>(
      () => ({
        prompt: prompt.trim(),
        requestedTool: selectedTool,
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
          parseColours(colours),
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
      selectedTool === initialTool
    ) {
      return;
    }

    setSelectedTool(initialTool);

    if (initialTool === "short-video") {
      setAspectRatio("9:16");
      setDurationSeconds(15);
    }

    if (initialTool === "long-video") {
      setAspectRatio("16:9");
      setDurationSeconds(60);
    }
  }, [
    initialTool,
    selectedTool,
  ]);

  function createPlan(): void {
    if (
      !promptReady ||
      isGenerating
    ) {
      return;
    }

    setGenerationError(null);
    setCreativePlan(null);
    setPlannedGenerationRequest(null);
    setShowReview(false);
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
    setPlannedGenerationRequest(null);

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
      const generationDurationSeconds =
        plannedGenerationRequest.durationSeconds;

      const response = await fetch(
        "/api/studio/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            prompt:
              plannedGenerationRequest.prompt.trim(),

            requestedTool:
              plannedGenerationRequest.requestedTool,

            selectedTool:
              plannedGenerationRequest.requestedTool,

            formats:
              creativePlan.deliverables.map(
                (deliverable) =>
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

      let data: StudioGenerateApiResponse;

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
          response.status === 402 &&
          typeof errorData.requiredCredits ===
            "number" &&
          typeof errorData.availableCredits ===
            "number"
        ) {
          throw new Error(
            `You need ${errorData.requiredCredits} Studio Credits, but only ${errorData.availableCredits} are available.`,
          );
        }

        if (response.status === 401) {
          throw new Error(
            "Please sign in before creating a Studio project.",
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Your account does not currently have permission to use this Studio workflow.",
          );
        }

        if (response.status === 422) {
          throw new Error(
            errorData.error ||
              "Beacon Studio needs more information before generation can begin.",
          );
        }

        if (response.status === 429) {
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

      if (!successData.projectId) {
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
                  ? "Beacon turns your request into a structured production plan before any credits are used."
                  : "Studio Brain has analysed your request and selected the best production route."}
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
                selectedTool={selectedTool}
                selectedToolDetails={
                  selectedToolDetails
                }
                showAdvanced={showAdvanced}
                disabled={isGenerating}
                onPromptChange={setPrompt}
                onAdvancedToggle={() =>
                  setShowAdvanced(
                    (current) =>
                      !current,
                  )
                }
                onContinue={createPlan}
              />

              {showAdvanced ? (
                <StudioAdvancedSettings
                  audience={audience}
                  style={style}
                  tone={tone}
                  colours={colours}
                  quality={quality}
                  aspectRatio={aspectRatio}
                  outputCount={outputCount}
                  durationSeconds={
                    durationSeconds
                  }
                  reference={reference}
                  notes={notes}
                  brandKit={brandKit}
                  projectTitle={
                    projectTitle
                  }
                  saveToLibrary={
                    saveToLibrary
                  }
                  isVideo={isVideo}
                  disabled={isGenerating}
                  onAudienceChange={
                    setAudience
                  }
                  onStyleChange={setStyle}
                  onToneChange={setTone}
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
                  onNotesChange={setNotes}
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
              tool={selectedToolDetails}
              quality={quality}
              aspectRatio={aspectRatio}
              outputCount={outputCount}
              durationSeconds={
                durationSeconds
              }
              estimatedCredits={
                estimatedCredits
              }
              estimatedWait={estimatedWait}
              isVideo={isVideo}
              promptReady={promptReady}
              isProcessing={isGenerating}
              error={generationError}
              onReview={createPlan}
            />
          </div>
        ) : (
          <StudioPlanner
            request={plannerRequest}
            onBack={returnToRequest}
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
          open={showReview}
          plan={creativePlan}
          tool={getStudioTool(
            creativePlan.selectedTool,
          )}
          quality={
            plannedGenerationRequest.quality
          }
          isGenerating={isGenerating}
          error={generationError}
          onClose={closeReview}
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