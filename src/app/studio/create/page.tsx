"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ToolId =
  | "marketing"
  | "short-video"
  | "long-video"
  | "images"
  | "writing"
  | "memes"
  | "audio"
  | "custom";

type Quality = "draft" | "standard" | "high" | "maximum";
type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";
type OutputCount = 1 | 2 | 4;

type ToolOption = {
  id: ToolId;
  name: string;
  description: string;
  icon: string;
  baseCredits: number;
  promptExample: string;
};

const tools: ToolOption[] = [
  {
    id: "marketing",
    name: "Marketing",
    description: "Adverts, campaigns, product launches and promotional content.",
    icon: "↗",
    baseCredits: 20,
    promptExample:
      "Create a premium social media advert for a UK plumbing business promoting emergency call-outs.",
  },
  {
    id: "short-video",
    name: "Short-form Video",
    description: "Instagram Reels, TikTok, YouTube Shorts and Facebook Reels.",
    icon: "▶",
    baseCredits: 120,
    promptExample:
      "Create a 20-second vertical Instagram Reel promoting a summer garden furniture sale.",
  },
  {
    id: "long-video",
    name: "Long-form AI Video",
    description: "YouTube videos, explainers, animations and longer stories.",
    icon: "▰",
    baseCredits: 300,
    promptExample:
      "Create a nursery rhyme animation of Humpty Dumpty for YouTube.",
  },
  {
    id: "images",
    name: "Images",
    description: "Product imagery, campaign visuals and original artwork.",
    icon: "✦",
    baseCredits: 10,
    promptExample:
      "Create a premium product hero image for a navy and gold smartwatch campaign.",
  },
  {
    id: "writing",
    name: "Writing",
    description: "Scripts, captions, articles, adverts and business content.",
    icon: "T",
    baseCredits: 6,
    promptExample:
      "Write a confident 30-second advert script for a local roofing company.",
  },
  {
    id: "memes",
    name: "Memes",
    description: "Original, relevant and shareable social content.",
    icon: "☺",
    baseCredits: 8,
    promptExample:
      "Create a light-hearted meme for small business owners about answering emails at midnight.",
  },
  {
    id: "audio",
    name: "Audio",
    description: "Voiceovers, narration, jingles and spoken content.",
    icon: "♪",
    baseCredits: 40,
    promptExample:
      "Create a warm British voiceover for a 30-second family holiday advert.",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Describe any creative asset and let Beacon choose the workflow.",
    icon: "+",
    baseCredits: 12,
    promptExample:
      "Create a complete launch pack for a new independent coffee shop.",
  },
];

const qualityMultipliers: Record<Quality, number> = {
  draft: 0.75,
  standard: 1.25,
  high: 1.8,
  maximum: 3.2,
};

const qualityLabels: Record<Quality, string> = {
  draft: "Draft",
  standard: "Standard",
  high: "High",
  maximum: "Maximum",
};

const outputMultipliers: Record<OutputCount, number> = {
  1: 1,
  2: 1.85,
  4: 3.4,
};

const recentGenerations: Array<{
  name: string;
  tool: string;
  created: string;
  credits: number;
  status: "Complete" | "Processing";
}> = [];


type StudioOutputFormatId =
  | "instagram-reel"
  | "facebook-reel"
  | "tiktok"
  | "youtube-short"
  | "instagram-story"
  | "facebook-story"
  | "instagram-post"
  | "facebook-post"
  | "linkedin-post"
  | "linkedin-video"
  | "x-post"
  | "youtube-thumbnail"
  | "web-banner"
  | "display-banner"
  | "poster"
  | "flyer"
  | "meme"
  | "square-ad"
  | "landscape-video"
  | "portrait-video";

type GenerateSuccessResponse = {
  projectId: string;
  generationId: string;
  creditCost: number;
};

type GenerateErrorResponse = {
  error?: string;
  code?: string;
  requiredCredits?: number;
  availableCredits?: number;
};

function getFormatsForSelection(
  tool: ToolId,
  aspectRatio: AspectRatio,
): StudioOutputFormatId[] {
  if (tool === "short-video") {
    return aspectRatio === "16:9"
      ? ["landscape-video"]
      : ["instagram-reel"];
  }

  if (tool === "long-video") {
    return aspectRatio === "9:16"
      ? ["portrait-video"]
      : ["landscape-video"];
  }

  if (tool === "images") {
    if (aspectRatio === "1:1") {
      return ["square-ad"];
    }

    if (aspectRatio === "4:5") {
      return ["instagram-post"];
    }

    if (aspectRatio === "9:16") {
      return ["instagram-story"];
    }

    return ["web-banner"];
  }

  if (tool === "memes") {
    return ["meme"];
  }

  if (tool === "marketing") {
    if (aspectRatio === "1:1") {
      return ["square-ad"];
    }

    if (aspectRatio === "4:5") {
      return ["instagram-post"];
    }

    if (aspectRatio === "9:16") {
      return ["instagram-story"];
    }

    return ["web-banner"];
  }

  if (tool === "writing") {
    return ["linkedin-post"];
  }

  if (tool === "audio") {
    return ["landscape-video"];
  }

  if (aspectRatio === "1:1") {
    return ["square-ad"];
  }

  if (aspectRatio === "4:5") {
    return ["instagram-post"];
  }

  if (aspectRatio === "9:16") {
    return ["portrait-video"];
  }

  return ["landscape-video"];
}

function StudioCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTool = searchParams.get("tool") as ToolId | null;
  const initialTool = tools.some((tool) => tool.id === requestedTool)
    ? requestedTool
    : "marketing";

  const [selectedTool, setSelectedTool] = useState<ToolId>(
    initialTool ?? "marketing",
  );
  const [prompt, setPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quality, setQuality] = useState<Quality>("high");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [outputs, setOutputs] = useState<OutputCount>(1);
  const [duration, setDuration] = useState(15);
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState("premium");
  const [tone, setTone] = useState("confident");
  const [colours, setColours] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [brandKit, setBrandKit] = useState("none");
  const [project, setProject] = useState("Beacon Studio");
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const selectedToolDetails =
    tools.find((tool) => tool.id === selectedTool) ?? tools[0];

  const isVideo =
    selectedTool === "short-video" || selectedTool === "long-video";

  const estimatedCredits = useMemo(() => {
    const durationMultiplier = isVideo
      ? Math.max(1, duration / 15)
      : 1;

    return Math.max(
      1,
      Math.ceil(
        selectedToolDetails.baseCredits *
          qualityMultipliers[quality] *
          outputMultipliers[outputs] *
          durationMultiplier,
      ),
    );
  }, [
    duration,
    isVideo,
    outputs,
    quality,
    selectedToolDetails.baseCredits,
  ]);

  const estimatedWait = useMemo(() => {
    if (selectedTool === "long-video") {
      return quality === "maximum" ? "15–30 minutes" : "8–20 minutes";
    }

    if (selectedTool === "short-video") {
      return quality === "maximum" ? "6–12 minutes" : "3–8 minutes";
    }

    return quality === "maximum" ? "2–5 minutes" : "Under 2 minutes";
  }, [quality, selectedTool]);

  function selectTool(tool: ToolOption) {
    setSelectedTool(tool.id);

    if (!prompt.trim()) {
      setPrompt(tool.promptExample);
    }

    if (tool.id === "short-video") {
      setAspectRatio("9:16");
      setDuration(15);
    }

    if (tool.id === "long-video") {
      setAspectRatio("16:9");
      setDuration(60);
    }
  }

  async function generateCampaign() {
    if (!prompt.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/studio/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          formats: getFormatsForSelection(selectedTool, aspectRatio),
          audience: audience.trim() || undefined,
          tone,
          style,
          colours: colours
            .split(",")
            .map((colour) => colour.trim())
            .filter(Boolean),
          sourceUrl: reference.trim() || undefined,
          notes: [
            notes.trim(),
            brandKit !== "none" ? `Use saved brand kit: ${brandKit}.` : "",
            saveToLibrary ? "Save this generation to the project library." : "",
            `Creation workflow: ${selectedToolDetails.name}.`,
            `Requested aspect ratio: ${aspectRatio}.`,
          ]
            .filter(Boolean)
            .join(" "),
          durationMs: isVideo ? duration * 1_000 : undefined,
          quality,
          outputCount: outputs,
          projectTitle: project,
          confirmedCreditCost: estimatedCredits,
        }),
      });

      const data = (await response.json()) as
        | GenerateSuccessResponse
        | GenerateErrorResponse;

      if (!response.ok) {
        const errorData = data as GenerateErrorResponse;

        if (
          response.status === 402 &&
          typeof errorData.requiredCredits === "number" &&
          typeof errorData.availableCredits === "number"
        ) {
          throw new Error(
            `You need ${errorData.requiredCredits} Studio Credits, but only ${errorData.availableCredits} are available.`,
          );
        }

        throw new Error(
          errorData.error || "Beacon Studio could not generate the campaign.",
        );
      }

      const successData = data as GenerateSuccessResponse;

      if (!successData.projectId) {
        throw new Error(
          "Beacon Studio created the campaign but did not return a project ID.",
        );
      }

      router.push(`/studio/editor/${successData.projectId}`);
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Beacon Studio could not generate the campaign.",
      );
      setShowReview(false);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(245,158,11,0.16),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
        />

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-sm font-extrabold text-blue-100">
                <span aria-hidden="true">✦</span>
                <span>Beacon Studio Create</span>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                What would you like to create?
              </h1>

              <p className="mt-4 max-w-3xl text-lg font-medium leading-8 text-slate-300">
                Describe your idea naturally. Beacon will help choose the right
                creative workflow, then show the estimated Studio Credit cost
                before generation.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/studio"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-black text-white transition hover:bg-white/10"
              >
                Back to Studio
              </Link>

              <Link
                href="/studio/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 font-black text-blue-950 transition hover:bg-amber-200"
              >
                Buy Credits
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Studio Credits
                </p>
                <p className="mt-2 text-xl font-black text-blue-950">
                  Checked live at generation
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Membership
                </p>
                <p className="mt-2 text-xl font-black text-blue-950">
                  Account-linked
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Queue Priority
                </p>
                <p className="mt-2 text-xl font-black text-blue-950">
                  Live queue
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-blue-950 px-6 py-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-200">
              Current Selection
            </p>
            <p className="mt-2 text-xl font-black text-amber-300">
              {selectedToolDetails.name}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
            Choose a Creation Type
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Start with the result you need.
          </h2>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => {
            const isSelected = selectedTool === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => selectTool(tool)}
                className={`group rounded-[1.5rem] border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                  isSelected
                    ? "border-blue-800 bg-blue-950 text-white"
                    : "border-slate-200 bg-white text-slate-950 hover:border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    aria-hidden="true"
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black ${
                      isSelected
                        ? "bg-amber-300 text-blue-950"
                        : "bg-blue-100 text-blue-950"
                    }`}
                  >
                    {tool.icon}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      isSelected
                        ? "bg-white/10 text-blue-100"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    From {tool.baseCredits} credits
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black">{tool.name}</h3>
                <p
                  className={`mt-3 leading-7 ${
                    isSelected ? "text-blue-100/80" : "text-slate-600"
                  }`}
                >
                  {tool.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-8">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                  Quick Create
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">
                  Describe your idea.
                </h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Write naturally. Include the platform, subject, audience,
                  message and style when they matter.
                </p>
              </div>

              <label className="mt-7 block">
                <span className="sr-only">Creation prompt</span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={9}
                  placeholder={selectedToolDetails.promptExample}
                  className="w-full rounded-[1.5rem] border border-slate-300 bg-white px-5 py-5 text-lg font-medium leading-8 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Beacon will use the selected creation type and your prompt to
                  prepare the render.
                </p>

                <button
                  type="button"
                  onClick={() => setShowAdvanced((current) => !current)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-blue-950 transition hover:border-blue-300 hover:bg-blue-50"
                  aria-expanded={showAdvanced}
                >
                  {showAdvanced ? "Hide Advanced Settings" : "Advanced Settings"}
                </button>
              </div>
            </section>

            {showAdvanced && (
              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                    Advanced Settings
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    Fine-tune the result.
                  </h2>
                  <p className="mt-3 leading-7 text-slate-600">
                    These settings are optional. Beacon can choose sensible
                    defaults when you leave them unchanged.
                  </p>
                </div>

                <div className="mt-7 grid gap-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">
                        Target audience
                      </span>
                      <input
                        value={audience}
                        onChange={(event) => setAudience(event.target.value)}
                        type="text"
                        placeholder="Example: UK small business owners"
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">
                        Creative style
                      </span>
                      <select
                        value={style}
                        onChange={(event) => setStyle(event.target.value)}
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="premium">Premium and polished</option>
                        <option value="minimal">Minimal and modern</option>
                        <option value="bold">Bold and energetic</option>
                        <option value="corporate">
                          Professional and corporate
                        </option>
                        <option value="editorial">Editorial</option>
                        <option value="cinematic">Cinematic</option>
                        <option value="friendly">
                          Friendly and approachable
                        </option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">Tone</span>
                      <select
                        value={tone}
                        onChange={(event) => setTone(event.target.value)}
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="confident">Confident</option>
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="luxury">Luxury</option>
                        <option value="playful">Playful</option>
                        <option value="calm">Calm</option>
                        <option value="technical">Technical</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">
                        Preferred colours
                      </span>
                      <input
                        value={colours}
                        onChange={(event) => setColours(event.target.value)}
                        type="text"
                        placeholder="Example: Beacon blue, gold and white"
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">Quality</span>
                      <select
                        value={quality}
                        onChange={(event) =>
                          setQuality(event.target.value as Quality)
                        }
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="draft">Draft</option>
                        <option value="standard">Standard</option>
                        <option value="high">High</option>
                        <option value="maximum">Maximum</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">
                        Aspect ratio
                      </span>
                      <select
                        value={aspectRatio}
                        onChange={(event) =>
                          setAspectRatio(event.target.value as AspectRatio)
                        }
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="1:1">Square · 1:1</option>
                        <option value="4:5">Portrait · 4:5</option>
                        <option value="9:16">Vertical · 9:16</option>
                        <option value="16:9">Landscape · 16:9</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">Outputs</span>
                      <select
                        value={outputs}
                        onChange={(event) =>
                          setOutputs(Number(event.target.value) as OutputCount)
                        }
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value={1}>1 output</option>
                        <option value={2}>2 outputs</option>
                        <option value={4}>4 outputs</option>
                      </select>
                    </label>
                  </div>

                  {isVideo && (
                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">
                        Video duration
                      </span>
                      <select
                        value={duration}
                        onChange={(event) =>
                          setDuration(Number(event.target.value))
                        }
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value={15}>15 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={120}>2 minutes</option>
                        <option value={300}>5 minutes</option>
                      </select>
                    </label>
                  )}

                  <label className="grid gap-2">
                    <span className="font-black text-slate-800">
                      Reference link
                    </span>
                    <input
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      type="url"
                      placeholder="Paste a website, product or visual reference URL"
                      className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="font-black text-slate-800">
                      Additional notes
                    </span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={4}
                      placeholder="Include anything Beacon must avoid, preserve or prioritise..."
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium leading-7 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">
                        Saved brand kit
                      </span>
                      <select
                        value={brandKit}
                        onChange={(event) => setBrandKit(event.target.value)}
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="none">Do not use a brand kit</option>
                        <option value="beacon">Beacon Master Brand</option>
                        <option value="beacon-business">
                          Beacon Business
                        </option>
                        <option value="beacon-studio">Beacon Studio</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="font-black text-slate-800">
                        Save to project
                      </span>
                      <select
                        value={project}
                        onChange={(event) => setProject(event.target.value)}
                        className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="Beacon AI">Beacon AI</option>
                        <option value="Beacon Business">
                          Beacon Business
                        </option>
                        <option value="Beacon Studio">Beacon Studio</option>
                        <option value="New client project">
                          New client project
                        </option>
                      </select>
                    </label>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <input
                      type="checkbox"
                      checked={saveToLibrary}
                      onChange={(event) =>
                        setSaveToLibrary(event.target.checked)
                      }
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                    />
                    <span>
                      <span className="block font-black text-slate-900">
                        Save to Project Library
                      </span>
                      <span className="mt-1 block text-sm font-medium leading-6 text-slate-600">
                        Keep the generation, settings and prompt available for
                        later editing or duplication.
                      </span>
                    </span>
                  </label>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[1.75rem] bg-blue-950 p-7 text-white shadow-xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">
                Estimated Rendering Cost
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="font-semibold text-blue-100/70">Tool</span>
                  <span className="text-right font-black">
                    {selectedToolDetails.name}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="font-semibold text-blue-100/70">Quality</span>
                  <span className="font-black">{qualityLabels[quality]}</span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="font-semibold text-blue-100/70">
                    Aspect ratio
                  </span>
                  <span className="font-black">{aspectRatio}</span>
                </div>

                {isVideo && (
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="font-semibold text-blue-100/70">
                      Duration
                    </span>
                    <span className="font-black">
                      {duration < 60
                        ? `${duration} seconds`
                        : `${duration / 60} minute${duration === 60 ? "" : "s"}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="font-semibold text-blue-100/70">
                    Outputs
                  </span>
                  <span className="font-black">{outputs}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-blue-100/70">
                    Estimated total
                  </span>
                  <span className="text-3xl font-black text-amber-300">
                    {estimatedCredits} Credits
                  </span>
                </div>
              </div>

              <p className="mt-6 text-sm font-semibold leading-6 text-blue-100/70">
                The final Studio Credit cost should be confirmed by your live
                calculator before any generation begins.
              </p>

              {generationError && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-red-300/30 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100"
                >
                  {generationError}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setGenerationError(null);
                  setShowReview(true);
                }}
                disabled={!prompt.trim() || isGenerating}
                className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-amber-300 px-6 py-4 text-lg font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isGenerating ? "Generating…" : "Review and Generate"}
              </button>

              <p className="mt-4 text-center text-xs font-bold leading-5 text-blue-100/60">
                No credits are deducted until the final live cost is displayed
                and confirmed.
              </p>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Queue Status
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-600">
                    Current position
                  </span>
                  <span className="font-black text-slate-950">Ready</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-600">
                    Estimated wait
                  </span>
                  <span className="text-right font-black text-slate-950">
                    {estimatedWait}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-600">Priority</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                    Priority
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-amber-300/40 bg-amber-50 p-6">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-800">
                Before You Generate
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">
                You stay in control of every render.
              </h2>

              <ul className="mt-5 space-y-3 text-sm font-bold leading-6 text-slate-700">
                {[
                  "Rendering costs can vary.",
                  "The final cost is shown before generation.",
                  "Credits are deducted only after confirmation.",
                  "Higher quality and longer outputs use more credits.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-black text-slate-950"
                    >
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Generation History
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Your latest Studio renders.
              </h2>
            </div>

            <Link
              href="/studio"
              className="font-black text-blue-800 transition hover:text-blue-950"
            >
              View all projects →
            </Link>
          </div>

          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Generation
                  </th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Tool
                  </th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Created
                  </th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Credits
                  </th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Status
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentGenerations.length > 0 ? (
                  recentGenerations.map((generation) => (
                    <tr
                      key={generation.name}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-3 py-4 font-black text-slate-900">
                        {generation.name}
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-600">
                        {generation.tool}
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-600">
                        {generation.created}
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-600">
                        {generation.credits}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            generation.status === "Complete"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {generation.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <span className="text-sm font-bold text-slate-400">
                          Open from project library
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center"
                    >
                      <p className="font-black text-slate-900">
                        No Studio generations yet.
                      </p>
                      <p className="mt-2 font-medium text-slate-500">
                        Your completed campaigns will appear here after generation.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showReview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="studio-review-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-5 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl rounded-[1.75rem] border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                  Final Review
                </p>
                <h2
                  id="studio-review-title"
                  className="mt-2 text-3xl font-black tracking-tight text-slate-950"
                >
                  Confirm this Studio generation.
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowReview(false)}
                disabled={isGenerating}
                aria-label="Close review"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-xl font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-7 grid gap-3 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Creation type
                </p>
                <p className="mt-1 font-black text-slate-950">
                  {selectedToolDetails.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Quality
                </p>
                <p className="mt-1 font-black text-slate-950">
                  {qualityLabels[quality]}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Outputs
                </p>
                <p className="mt-1 font-black text-slate-950">
                  {outputs}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Confirmed cost
                </p>
                <p className="mt-1 text-xl font-black text-blue-950">
                  {estimatedCredits} Studio Credits
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Prompt
              </p>
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-medium leading-7 text-slate-700">
                {prompt.trim()}
              </p>
            </div>

            <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">
              Credits are charged only when generation completes successfully.
              If generation fails, the project is recorded as failed and no
              Studio Credits are deducted.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowReview(false)}
                disabled={isGenerating}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={generateCampaign}
                disabled={isGenerating}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-950 px-6 py-3 font-black text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating
                  ? "Creating Campaign…"
                  : `Confirm ${estimatedCredits} Credits`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StudioCreateLoading() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(245,158,11,0.16),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
        />

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex min-h-44 items-center justify-center">
            <div className="text-center">
              <div
                className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200/30 border-t-amber-300"
                aria-hidden="true"
              />
              <p className="mt-6 text-lg font-black text-white">
                Loading Beacon Studio…
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                Preparing your creation workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-48 rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function StudioCreatePage() {
  return (
    <Suspense fallback={<StudioCreateLoading />}>
      <StudioCreateContent />
    </Suspense>
  );
}