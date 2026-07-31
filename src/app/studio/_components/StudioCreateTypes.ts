export type StudioToolId =
  | "marketing"
  | "short-video"
  | "long-video"
  | "images"
  | "writing"
  | "memes"
  | "audio"
  | "custom";

export type StudioQuality =
  | "draft"
  | "standard"
  | "high"
  | "maximum";

export type StudioAspectRatio =
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9";

export type StudioOutputCount = 1 | 2 | 4;

export type StudioOutputFormatId =
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

export type StudioToolOption = {
  id: StudioToolId;
  name: string;
  description: string;
  baseCredits: number;
  promptExample: string;
};

export type StudioGenerateSuccessResponse = {
  projectId: string;
  generationId: string;
  creditCost: number;
};

export type StudioGenerateErrorResponse = {
  error?: string;
  code?: string;
  requiredCredits?: number;
  availableCredits?: number;
};

export type StudioCreativeSettings = {
  audience: string;
  style: string;
  tone: string;
  colours: string;
  reference: string;
  notes: string;
  brandKit: string;
  projectTitle: string;
  saveToLibrary: boolean;
  quality: StudioQuality;
  aspectRatio: StudioAspectRatio;
  outputCount: StudioOutputCount;
  durationSeconds: number;
};

export const STUDIO_TOOLS: StudioToolOption[] = [
  {
    id: "marketing",
    name: "Marketing",
    description:
      "Adverts, campaigns, product launches and promotional content.",
    baseCredits: 20,
    promptExample:
      "Create a premium social media advert for a UK plumbing business promoting emergency call-outs.",
  },
  {
    id: "short-video",
    name: "Short-form Video",
    description:
      "Instagram Reels, TikTok, YouTube Shorts and Facebook Reels.",
    baseCredits: 120,
    promptExample:
      "Create a 20-second vertical Instagram Reel promoting a summer garden furniture sale.",
  },
  {
    id: "long-video",
    name: "Long-form AI Video",
    description:
      "YouTube videos, explainers, animations and longer stories.",
    baseCredits: 300,
    promptExample:
      "Create a nursery rhyme animation of Humpty Dumpty for YouTube.",
  },
  {
    id: "images",
    name: "Images",
    description:
      "Product imagery, campaign visuals and original artwork.",
    baseCredits: 10,
    promptExample:
      "Create a premium product hero image for a navy and gold smartwatch campaign.",
  },
  {
    id: "writing",
    name: "Writing",
    description:
      "Scripts, captions, articles, adverts and business content.",
    baseCredits: 6,
    promptExample:
      "Write a confident 30-second advert script for a local roofing company.",
  },
  {
    id: "memes",
    name: "Memes",
    description:
      "Original, relevant and shareable social content.",
    baseCredits: 8,
    promptExample:
      "Create a light-hearted meme for small business owners about answering emails at midnight.",
  },
  {
    id: "audio",
    name: "Audio",
    description:
      "Voice-overs, narration, jingles and spoken content.",
    baseCredits: 40,
    promptExample:
      "Create a warm British voice-over for a 30-second family holiday advert.",
  },
  {
    id: "custom",
    name: "Custom",
    description:
      "Describe any creative outcome and let Beacon choose the production workflow.",
    baseCredits: 12,
    promptExample:
      "Create a complete launch pack for a new independent coffee shop.",
  },
];

export const STUDIO_QUALITY_MULTIPLIERS: Record<
  StudioQuality,
  number
> = {
  draft: 0.75,
  standard: 1.25,
  high: 1.8,
  maximum: 3.2,
};

export const STUDIO_QUALITY_LABELS: Record<
  StudioQuality,
  string
> = {
  draft: "Draft",
  standard: "Standard",
  high: "High",
  maximum: "Maximum",
};

export const STUDIO_OUTPUT_MULTIPLIERS: Record<
  StudioOutputCount,
  number
> = {
  1: 1,
  2: 1.85,
  4: 3.4,
};

export function isStudioToolId(
  value: string | null | undefined,
): value is StudioToolId {
  return STUDIO_TOOLS.some(
    (tool) => tool.id === value,
  );
}

export function isStudioVideoTool(
  tool: StudioToolId,
): boolean {
  return (
    tool === "short-video" ||
    tool === "long-video"
  );
}

export function getStudioTool(
  toolId: StudioToolId,
): StudioToolOption {
  return (
    STUDIO_TOOLS.find(
      (tool) => tool.id === toolId,
    ) ?? STUDIO_TOOLS[0]
  );
}

export function getFormatsForStudioSelection(
  tool: StudioToolId,
  aspectRatio: StudioAspectRatio,
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

  if (
    tool === "images" ||
    tool === "marketing"
  ) {
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

export function calculateStudioCreditEstimate({
  tool,
  quality,
  outputCount,
  durationSeconds,
}: {
  tool: StudioToolOption;
  quality: StudioQuality;
  outputCount: StudioOutputCount;
  durationSeconds: number;
}): number {
  const durationMultiplier =
    isStudioVideoTool(tool.id)
      ? Math.max(
          1,
          durationSeconds / 15,
        )
      : 1;

  return Math.max(
    1,
    Math.ceil(
      tool.baseCredits *
        STUDIO_QUALITY_MULTIPLIERS[
          quality
        ] *
        STUDIO_OUTPUT_MULTIPLIERS[
          outputCount
        ] *
        durationMultiplier,
    ),
  );
}

export function getStudioEstimatedWait({
  tool,
  quality,
}: {
  tool: StudioToolId;
  quality: StudioQuality;
}): string {
  if (tool === "long-video") {
    return quality === "maximum"
      ? "15–30 minutes"
      : "8–20 minutes";
  }

  if (tool === "short-video") {
    return quality === "maximum"
      ? "6–12 minutes"
      : "3–8 minutes";
  }

  return quality === "maximum"
    ? "2–5 minutes"
    : "Under 2 minutes";
}