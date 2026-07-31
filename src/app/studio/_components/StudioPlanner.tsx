"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Box,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Coins,
  FileOutput,
  Gauge,
  ImageIcon,
  Layers3,
  Loader2,
  MessageSquareMore,
  PackageCheck,
  RefreshCw,
  Route,
  Sparkles,
  Target,
  WandSparkles,
  Workflow,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type StudioPlannerToolId =
  | "marketing"
  | "short-video"
  | "long-video"
  | "images"
  | "writing"
  | "memes"
  | "audio"
  | "custom";

export type StudioPlannerQuality =
  | "draft"
  | "standard"
  | "high"
  | "maximum";

export type StudioPlannerAspectRatio =
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9";

export type StudioPlannerOutputCount = 1 | 2 | 4;

export type StudioPlannerInput = {
  prompt: string;
  requestedTool?: StudioPlannerToolId;
  quality?: StudioPlannerQuality;
  aspectRatio?: StudioPlannerAspectRatio;
  outputCount?: StudioPlannerOutputCount;
  durationSeconds?: number;
  audience?: string;
  style?: string;
  tone?: string;
  colours?: string[];
  referenceUrl?: string;
  notes?: string;
  brandKit?: string;
  projectTitle?: string;
  saveToLibrary?: boolean;
};

export type StudioPlannerClarification = {
  id: string;
  question: string;
  field:
    | "audience"
    | "platform"
    | "duration"
    | "style"
    | "subject"
    | "objective"
    | "brand";
  required: boolean;
  suggestedAnswer?: string;
};

export type StudioPlannerDeliverable = {
  id: string;
  name: string;
  description: string;
  format: string;
  aspectRatio: StudioPlannerAspectRatio;
  durationSeconds?: number;
  quantity: number;
};

export type StudioPlannerAssetRequirement = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  provided: boolean;
};

export type StudioPlannerModelRoute = {
  role: "planning" | "writing" | "image" | "video" | "audio";
  provider: "openai" | "provider-required";
  model: string;
  required: boolean;
  purpose: string;
};

export type StudioPlannerCreditBreakdown = {
  planning: number;
  generation: number;
  quality: number;
  duration: number;
  additionalOutputs: number;
  total: number;
};

export type StudioPlannerPlan = {
  version: string;
  intent: string;
  workflow: string;
  selectedTool: StudioPlannerToolId;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestions: StudioPlannerClarification[];
  title: string;
  summary: string;
  objective: string;
  audience: string;
  style: string;
  tone: string;
  colours: string[];
  aspectRatio: StudioPlannerAspectRatio;
  quality: StudioPlannerQuality;
  outputCount: StudioPlannerOutputCount;
  durationSeconds?: number;
  deliverables: StudioPlannerDeliverable[];
  productionSteps: string[];
  assetRequirements: StudioPlannerAssetRequirement[];
  models: StudioPlannerModelRoute[];
  optimisedPrompt: string;
  negativePrompt: string[];
  credits: StudioPlannerCreditBreakdown;
  estimatedCredits: number;
  estimatedDuration: string;
  warnings: string[];
  metadata: {
    analysedAt: string;
    originalPrompt: string;
    referenceUrl?: string;
    brandKit?: string;
    projectTitle: string;
    saveToLibrary: boolean;
  };
};

export type StudioPlannerGenerationRequest =
  StudioPlannerInput & {
    requestedTool: StudioPlannerToolId;
    quality: StudioPlannerQuality;
    aspectRatio: StudioPlannerAspectRatio;
    outputCount: StudioPlannerOutputCount;
    audience: string;
    style: string;
    tone: string;
    colours: string[];
    creativePlan: StudioPlannerPlan;
    confirmedCreditCost: number;
  };

type StudioPlanApiResponse = {
  success?: boolean;
  error?: string;
  code?: string;
  plan?: StudioPlannerPlan;
  brain?: StudioPlannerPlan;
  requiresClarification?: boolean;
  clarificationQuestions?: StudioPlannerClarification[];
  generationRequest?: StudioPlannerGenerationRequest;
};

export type StudioPlannerProps = {
  request: StudioPlannerInput;
  onBack?: () => void;
  onContinue: (
    generationRequest: StudioPlannerGenerationRequest,
    plan: StudioPlannerPlan,
  ) => void;
  continueLabel?: string;
  className?: string;
  autoLoad?: boolean;
};

type ClarificationAnswers = Record<string, string>;

const TOOL_LABELS: Record<StudioPlannerToolId, string> = {
  marketing: "Marketing",
  "short-video": "Short video",
  "long-video": "Long video",
  images: "Images",
  writing: "Writing",
  memes: "Memes",
  audio: "Audio",
  custom: "Creative pack",
};

const MODEL_ROLE_LABELS: Record<
  StudioPlannerModelRoute["role"],
  string
> = {
  planning: "Planning",
  writing: "Writing",
  image: "Image",
  video: "Video",
  audio: "Audio",
};

function joinClassNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

function humanise(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatConfidence(value: number): string {
  const safe = Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;

  return `${Math.round(safe * 100)}%`;
}

function formatDuration(
  durationSeconds: number | undefined,
): string | null {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return null;
  }

  if (durationSeconds < 60) {
    return `${Math.round(durationSeconds)} seconds`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.round(durationSeconds % 60);

  return seconds > 0
    ? `${minutes}m ${seconds}s`
    : `${minutes} minutes`;
}

function getErrorMessage(
  payload: StudioPlanApiResponse | null,
  fallback: string,
): string {
  if (
    payload &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error;
  }

  return fallback;
}

function createRequestKey(
  request: StudioPlannerInput,
): string {
  return JSON.stringify({
    prompt: request.prompt,
    requestedTool: request.requestedTool,
    quality: request.quality,
    aspectRatio: request.aspectRatio,
    outputCount: request.outputCount,
    durationSeconds: request.durationSeconds,
    audience: request.audience,
    style: request.style,
    tone: request.tone,
    colours: request.colours,
    referenceUrl: request.referenceUrl,
    notes: request.notes,
    brandKit: request.brandKit,
    projectTitle: request.projectTitle,
    saveToLibrary: request.saveToLibrary,
  });
}

function applyClarificationAnswers(
  request: StudioPlannerInput,
  questions: StudioPlannerClarification[],
  answers: ClarificationAnswers,
): StudioPlannerInput {
  const next: StudioPlannerInput = {
    ...request,
  };

  const additionalNotes: string[] = [];

  for (const question of questions) {
    const answer = answers[question.id]?.trim();

    if (!answer) {
      continue;
    }

    switch (question.field) {
      case "audience":
        next.audience = answer;
        break;

      case "duration": {
        const duration = Number.parseInt(
          answer.replace(/[^\d]/g, ""),
          10,
        );

        if (Number.isFinite(duration) && duration > 0) {
          next.durationSeconds = duration;
        } else {
          additionalNotes.push(
            `${question.question} ${answer}`,
          );
        }

        break;
      }

      case "style":
        next.style = answer;
        break;

      case "brand":
        next.brandKit = answer;
        break;

      case "platform":
      case "subject":
      case "objective":
        additionalNotes.push(
          `${question.question} ${answer}`,
        );
        break;
    }
  }

  if (additionalNotes.length > 0) {
    next.notes = [
      request.notes?.trim(),
      ...additionalNotes,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return next;
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  children,
  className,
}: {
  icon: typeof Sparkles;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={joinClassNames(
        "rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300/80">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-lg font-black text-white">
            {title}
          </h2>
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-200">
        {value}
      </p>
    </div>
  );
}

export default function StudioPlanner({
  request,
  onBack,
  onContinue,
  continueLabel = "Review and generate",
  className,
  autoLoad = true,
}: StudioPlannerProps) {
  const [
    plan,
    setPlan,
  ] = useState<StudioPlannerPlan | null>(null);

  const [
    generationRequest,
    setGenerationRequest,
  ] =
    useState<StudioPlannerGenerationRequest | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    clarificationAnswers,
    setClarificationAnswers,
  ] = useState<ClarificationAnswers>({});

  const [
    expandedRouting,
    setExpandedRouting,
  ] = useState(false);

  const [
    activeRequest,
    setActiveRequest,
  ] = useState<StudioPlannerInput>(request);

  const abortControllerRef =
    useRef<AbortController | null>(null);

  const latestRequestKeyRef = useRef("");

  const requestKey = useMemo(
    () => createRequestKey(request),
    [request],
  );

  const loadPlan = useCallback(
    async (
      nextRequest: StudioPlannerInput,
    ): Promise<void> => {
      const prompt = nextRequest.prompt.trim();

      if (prompt.length < 10) {
        setError(
          "Describe what you want Beacon Studio to create using at least 10 characters.",
        );
        setPlan(null);
        setGenerationRequest(null);
        return;
      }

      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "/api/studio/plan",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
            body: JSON.stringify(
              nextRequest,
            ),
          },
        );

        const payload =
          (await response
            .json()
            .catch(
              () => null,
            )) as StudioPlanApiResponse | null;

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              payload,
              "Beacon Studio could not prepare the creative plan.",
            ),
          );
        }

        const nextPlan =
          payload?.plan ??
          payload?.brain;

        if (!nextPlan) {
          throw new Error(
            "Beacon Studio returned an incomplete creative plan.",
          );
        }

        const nextGenerationRequest =
          payload?.generationRequest;

        if (!nextGenerationRequest) {
          throw new Error(
            "Beacon Studio did not return a generation request.",
          );
        }

        setActiveRequest(nextRequest);
        setPlan(nextPlan);
        setGenerationRequest(
          nextGenerationRequest,
        );

        setClarificationAnswers(
          Object.fromEntries(
            nextPlan.clarificationQuestions.map(
              (question) => [
                question.id,
                question.suggestedAnswer ?? "",
              ],
            ),
          ),
        );
      } catch (planError) {
        if (
          planError instanceof DOMException &&
          planError.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "[studio-planner:load]",
          planError,
        );

        setError(
          planError instanceof Error
            ? planError.message
            : "Beacon Studio could not prepare the creative plan.",
        );

        setPlan(null);
        setGenerationRequest(null);
      } finally {
        if (
          abortControllerRef.current ===
          controller
        ) {
          abortControllerRef.current =
            null;
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    setActiveRequest(request);

    if (!autoLoad) {
      return;
    }

    if (
      latestRequestKeyRef.current ===
      requestKey
    ) {
      return;
    }

    latestRequestKeyRef.current =
      requestKey;

    void loadPlan(request);
  }, [
    autoLoad,
    loadPlan,
    request,
    requestKey,
  ]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const requiredClarifications =
    useMemo(
      () =>
        plan?.clarificationQuestions.filter(
          (question) =>
            question.required,
        ) ?? [],
      [plan],
    );

  const allRequiredAnswered =
    useMemo(
      () =>
        requiredClarifications.every(
          (question) =>
            Boolean(
              clarificationAnswers[
                question.id
              ]?.trim(),
            ),
        ),
      [
        clarificationAnswers,
        requiredClarifications,
      ],
    );

  const canContinue =
    Boolean(
      plan &&
        generationRequest &&
        !loading &&
        (
          !plan.needsClarification ||
          allRequiredAnswered
        ),
    );

  const creditRows =
    useMemo(() => {
      if (!plan) {
        return [];
      }

      return [
        {
          label: "Planning",
          value: plan.credits.planning,
        },
        {
          label: "Generation",
          value: plan.credits.generation,
        },
        {
          label: "Quality",
          value: plan.credits.quality,
        },
        {
          label: "Duration",
          value: plan.credits.duration,
        },
        {
          label: "Extra outputs",
          value:
            plan.credits.additionalOutputs,
        },
      ].filter((item) => item.value > 0);
    }, [plan]);

  async function submitClarifications(): Promise<void> {
    if (!plan) {
      return;
    }

    if (!allRequiredAnswered) {
      setError(
        "Answer the required planning questions before continuing.",
      );
      return;
    }

    const clarifiedRequest =
      applyClarificationAnswers(
        activeRequest,
        plan.clarificationQuestions,
        clarificationAnswers,
      );

    await loadPlan(clarifiedRequest);
  }

  function continueToReview(): void {
    if (
      !plan ||
      !generationRequest ||
      !canContinue
    ) {
      return;
    }

    onContinue(
      {
        ...generationRequest,
        creativePlan: plan,
        confirmedCreditCost:
          plan.estimatedCredits,
      },
      plan,
    );
  }

  if (loading && !plan) {
    return (
      <div
        className={joinClassNames(
          "rounded-[32px] border border-cyan-300/15 bg-[#07101f] p-6 sm:p-10",
          className,
        )}
      >
        <div className="mx-auto flex min-h-[430px] max-w-xl flex-col items-center justify-center text-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[30px] border border-cyan-300/20 bg-cyan-300/10">
            <BrainCircuit className="h-10 w-10 text-cyan-200" />
            <Loader2 className="absolute h-16 w-16 animate-spin text-cyan-300/40" />
          </div>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Beacon Studio Brain
          </p>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Building your creative plan
          </h2>

          <p className="mt-4 max-w-lg text-sm font-medium leading-7 text-slate-400">
            Studio is analysing your idea, selecting the
            right workflow and preparing the deliverables,
            production steps and credit estimate.
          </p>

          <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
            {[
              "Understanding intent",
              "Planning deliverables",
              "Routing production",
            ].map((label) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 text-xs font-bold text-slate-300"
                key={label}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div
        className={joinClassNames(
          "rounded-[32px] border border-rose-300/20 bg-[#07101f] p-6 sm:p-10",
          className,
        )}
      >
        <div className="mx-auto flex min-h-[360px] max-w-xl flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-300/20 bg-rose-300/10 text-rose-200">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-2xl font-black text-white">
            The creative plan could not be prepared
          </h2>

          <p className="mt-3 text-sm font-medium leading-7 text-slate-400">
            {error}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {onBack ? (
              <button
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-slate-200 transition hover:bg-white/[0.08]"
                onClick={onBack}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : null}

            <button
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              onClick={() =>
                void loadPlan(activeRequest)
              }
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan || !generationRequest) {
    return null;
  }

  return (
    <div
      className={joinClassNames(
        "space-y-5",
        className,
      )}
    >
      <section className="overflow-hidden rounded-[32px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.13),transparent_32%),linear-gradient(145deg,#07101f,#030712)] shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Studio Brain plan
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
                  {TOOL_LABELS[plan.selectedTool]}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
                  {humanise(plan.workflow)}
                </span>
              </div>

              <h1 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {plan.title}
              </h1>

              <p className="mt-3 text-sm font-medium leading-7 text-slate-300 sm:text-base">
                {plan.summary}
              </p>
            </div>

            <div className="grid min-w-[260px] grid-cols-2 gap-3">
              <DetailPill
                label="Credits"
                value={`${plan.estimatedCredits}`}
              />
              <DetailPill
                label="Estimated time"
                value={plan.estimatedDuration}
              />
              <DetailPill
                label="Confidence"
                value={formatConfidence(
                  plan.confidence,
                )}
              />
              <DetailPill
                label="Outputs"
                value={`${plan.deliverables.length}`}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-7 lg:grid-cols-4">
          <DetailPill
            label="Audience"
            value={plan.audience}
          />
          <DetailPill
            label="Style"
            value={plan.style}
          />
          <DetailPill
            label="Tone"
            value={plan.tone}
          />
          <DetailPill
            label="Format"
            value={`${plan.aspectRatio} · ${humanise(
              plan.quality,
            )}`}
          />
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-4 text-sm font-bold text-rose-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {plan.clarificationQuestions.length > 0 ? (
        <SectionCard
          eyebrow="Planning questions"
          icon={MessageSquareMore}
          title={
            plan.needsClarification
              ? "Studio needs a little more detail"
              : "Optional details to improve the result"
          }
        >
          <div className="space-y-4">
            {plan.clarificationQuestions.map(
              (question) => (
                <label
                  className="block rounded-2xl border border-white/10 bg-black/20 p-4"
                  key={question.id}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-black text-white">
                      {question.question}
                    </span>

                    <span
                      className={joinClassNames(
                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                        question.required
                          ? "bg-amber-300/15 text-amber-200"
                          : "bg-white/[0.06] text-slate-400",
                      )}
                    >
                      {question.required
                        ? "Required"
                        : "Optional"}
                    </span>
                  </span>

                  <input
                    className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-[#050b16] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10"
                    onChange={(event) =>
                      setClarificationAnswers(
                        (current) => ({
                          ...current,
                          [question.id]:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder={
                      question.suggestedAnswer ??
                      "Enter your answer"
                    }
                    type="text"
                    value={
                      clarificationAnswers[
                        question.id
                      ] ?? ""
                    }
                  />
                </label>
              ),
            )}

            <button
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                loading ||
                !allRequiredAnswered
              }
              onClick={() =>
                void submitClarifications()
              }
              type="button"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="h-4 w-4" />
              )}
              Update creative plan
            </button>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <SectionCard
            eyebrow="Creative direction"
            icon={Target}
            title="Objective and message"
          >
            <p className="text-sm font-medium leading-7 text-slate-300">
              {plan.objective}
            </p>

            {plan.colours.length > 0 ? (
              <div className="mt-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Preferred colours
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {plan.colours.map((colour) => (
                    <span
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-slate-300"
                      key={colour}
                    >
                      {colour}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            eyebrow="Output plan"
            icon={FileOutput}
            title="Deliverables"
          >
            <div className="space-y-3">
              {plan.deliverables.map(
                (deliverable, index) => (
                  <article
                    className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                    key={deliverable.id}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-300/10 text-violet-200">
                      <span className="text-sm font-black">
                        {index + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-black text-white">
                          {deliverable.name}
                        </h3>

                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                          {deliverable.aspectRatio}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-medium leading-6 text-slate-400">
                        {deliverable.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
                        <span>
                          {humanise(
                            deliverable.format,
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          Quantity{" "}
                          {deliverable.quantity}
                        </span>

                        {formatDuration(
                          deliverable.durationSeconds,
                        ) ? (
                          <>
                            <span>•</span>
                            <span>
                              {formatDuration(
                                deliverable.durationSeconds,
                              )}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Production"
            icon={Workflow}
            title="How Studio will create it"
          >
            <ol className="space-y-3">
              {plan.productionSteps.map(
                (step, index) => (
                  <li
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                    key={`${index}-${step}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-xs font-black text-cyan-200">
                      {index + 1}
                    </span>

                    <p className="pt-1 text-sm font-semibold leading-6 text-slate-300">
                      {step}
                    </p>
                  </li>
                ),
              )}
            </ol>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            eyebrow="Estimate"
            icon={Coins}
            title="Studio Credits"
          >
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-center">
              <p className="text-4xl font-black text-white">
                {plan.estimatedCredits}
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                Estimated credits
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {creditRows.map((row) => (
                <div
                  className="flex items-center justify-between rounded-xl px-2 py-2 text-sm"
                  key={row.label}
                >
                  <span className="font-semibold text-slate-400">
                    {row.label}
                  </span>
                  <span className="font-black text-slate-200">
                    {row.value}
                  </span>
                </div>
              ))}

              <div className="mt-2 flex items-center justify-between border-t border-white/10 px-2 pt-4 text-sm">
                <span className="font-black text-white">
                  Total
                </span>
                <span className="font-black text-cyan-200">
                  {plan.credits.total}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Estimated production time
                </p>
                <p className="mt-1 text-sm font-black text-slate-200">
                  {plan.estimatedDuration}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Inputs"
            icon={PackageCheck}
            title="Asset requirements"
          >
            <div className="space-y-3">
              {plan.assetRequirements.map(
                (asset) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    key={asset.id}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={joinClassNames(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                          asset.provided
                            ? "bg-emerald-300/10 text-emerald-200"
                            : "bg-white/[0.06] text-slate-400",
                        )}
                      >
                        {asset.provided ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Box className="h-4 w-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-white">
                            {asset.name}
                          </p>

                          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                            {asset.required
                              ? "Required"
                              : "Optional"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
                          {asset.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Routing"
            icon={Route}
            title="AI production route"
          >
            <button
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 text-left"
              onClick={() =>
                setExpandedRouting(
                  (current) => !current,
                )
              }
              type="button"
            >
              <div>
                <p className="text-sm font-black text-white">
                  {plan.models.length} model{" "}
                  {plan.models.length === 1
                    ? "stage"
                    : "stages"}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  View Studio&apos;s selected production
                  route
                </p>
              </div>

              {expandedRouting ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {expandedRouting ? (
              <div className="mt-3 space-y-3">
                {plan.models.map(
                  (model, index) => (
                    <div
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      key={`${model.role}-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-300/10 text-indigo-200">
                          {model.role ===
                          "image" ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <Layers3 className="h-4 w-4" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-black text-white">
                            {
                              MODEL_ROLE_LABELS[
                                model.role
                              ]
                            }
                          </p>
                          <p className="text-[11px] font-bold text-slate-500">
                            {humanise(
                              model.provider,
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">
                        {model.purpose}
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : null}
          </SectionCard>
        </div>
      </div>

      {plan.warnings.length > 0 ? (
        <SectionCard
          eyebrow="Before generation"
          icon={AlertTriangle}
          title="Planning notes"
        >
          <div className="space-y-3">
            {plan.warnings.map(
              (warning, index) => (
                <div
                  className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"
                  key={`${index}-${warning}`}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                  <p className="text-sm font-semibold leading-6 text-amber-50">
                    {warning}
                  </p>
                </div>
              ),
            )}
          </div>
        </SectionCard>
      ) : null}

      <div className="sticky bottom-4 z-20 rounded-[28px] border border-white/10 bg-[#07101f]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
              <Gauge className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-white">
                {plan.estimatedCredits} Studio Credits
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Estimated completion:{" "}
                {plan.estimatedDuration}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {onBack ? (
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-slate-200 transition hover:bg-white/[0.08]"
                onClick={onBack}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Edit request
              </button>
            ) : null}

            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canContinue}
              onClick={continueToReview}
              type="button"
            >
              {continueLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}