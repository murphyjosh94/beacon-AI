import "server-only";

export const STUDIO_BRAIN_VERSION = "1.0.0";

export type StudioBrainToolId =
  | "marketing"
  | "short-video"
  | "long-video"
  | "images"
  | "writing"
  | "memes"
  | "audio"
  | "custom";

export type StudioBrainIntent =
  | "marketing_campaign"
  | "social_media_content"
  | "short_form_video"
  | "long_form_video"
  | "image_generation"
  | "written_content"
  | "meme_creation"
  | "audio_generation"
  | "brand_content"
  | "product_content"
  | "website_content"
  | "launch_campaign"
  | "custom_creative";

export type StudioBrainWorkflow =
  | "marketing"
  | "image"
  | "short_video"
  | "long_video"
  | "writing"
  | "meme"
  | "audio"
  | "multi_asset";

export type StudioBrainQuality =
  | "draft"
  | "standard"
  | "high"
  | "maximum";

export type StudioBrainAspectRatio =
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9";

export type StudioBrainOutputCount = 1 | 2 | 4;

export type StudioBrainOutputFormat =
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
  | "portrait-video"
  | "voiceover"
  | "article"
  | "advert-copy"
  | "caption-pack"
  | "creative-pack";

export type StudioBrainModelRole =
  | "planning"
  | "writing"
  | "image"
  | "video"
  | "audio";

export type StudioBrainModelRoute = {
  role: StudioBrainModelRole;
  provider: "openai" | "provider-required";
  model: string;
  required: boolean;
  purpose: string;
};

export type StudioBrainClarification = {
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

export type StudioBrainDeliverable = {
  id: string;
  name: string;
  description: string;
  format: StudioBrainOutputFormat;
  aspectRatio: StudioBrainAspectRatio;
  durationSeconds?: number;
  quantity: number;
};

export type StudioBrainCreditBreakdown = {
  planning: number;
  generation: number;
  quality: number;
  duration: number;
  additionalOutputs: number;
  total: number;
};

export type StudioBrainAssetRequirement = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  provided: boolean;
};

export type StudioBrainRequest = {
  prompt: string;
  requestedTool?: StudioBrainToolId | null;
  quality?: StudioBrainQuality;
  aspectRatio?: StudioBrainAspectRatio;
  outputCount?: StudioBrainOutputCount;
  durationSeconds?: number;
  audience?: string | null;
  style?: string | null;
  tone?: string | null;
  colours?: string[] | string | null;
  referenceUrl?: string | null;
  notes?: string | null;
  brandKit?: string | null;
  projectTitle?: string | null;
  saveToLibrary?: boolean;
};

export type StudioBrainResult = {
  version: string;
  intent: StudioBrainIntent;
  workflow: StudioBrainWorkflow;
  selectedTool: StudioBrainToolId;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestions: StudioBrainClarification[];
  title: string;
  summary: string;
  objective: string;
  audience: string;
  style: string;
  tone: string;
  colours: string[];
  aspectRatio: StudioBrainAspectRatio;
  quality: StudioBrainQuality;
  outputCount: StudioBrainOutputCount;
  durationSeconds?: number;
  deliverables: StudioBrainDeliverable[];
  productionSteps: string[];
  assetRequirements: StudioBrainAssetRequirement[];
  models: StudioBrainModelRoute[];
  optimisedPrompt: string;
  negativePrompt: string[];
  credits: StudioBrainCreditBreakdown;
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

export class StudioBrainError extends Error {
  public readonly code:
    | "INVALID_REQUEST"
    | "PROMPT_TOO_SHORT"
    | "PROMPT_TOO_LONG"
    | "INVALID_REFERENCE_URL";

  public readonly status: number;

  constructor(
    message: string,
    code: StudioBrainError["code"],
    status = 400,
  ) {
    super(message);
    this.name = "StudioBrainError";
    this.code = code;
    this.status = status;
  }
}

type IntentRule = {
  intent: StudioBrainIntent;
  workflow: StudioBrainWorkflow;
  tool: StudioBrainToolId;
  keywords: string[];
  baseConfidence: number;
};

type NormalisedRequest = {
  prompt: string;
  requestedTool?: StudioBrainToolId;
  quality: StudioBrainQuality;
  aspectRatio?: StudioBrainAspectRatio;
  outputCount: StudioBrainOutputCount;
  durationSeconds?: number;
  audience: string;
  style: string;
  tone: string;
  colours: string[];
  referenceUrl?: string;
  notes: string;
  brandKit?: string;
  projectTitle: string;
  saveToLibrary: boolean;
};

type IntentResolution = {
  intent: StudioBrainIntent;
  workflow: StudioBrainWorkflow;
  tool: StudioBrainToolId;
  confidence: number;
};

const MAXIMUM_PROMPT_LENGTH = 12_000;
const MINIMUM_PROMPT_LENGTH = 10;

const TOOL_BASE_CREDITS: Record<StudioBrainToolId, number> = {
  marketing: 20,
  "short-video": 120,
  "long-video": 300,
  images: 10,
  writing: 6,
  memes: 8,
  audio: 40,
  custom: 12,
};

const QUALITY_MULTIPLIERS: Record<StudioBrainQuality, number> = {
  draft: 0.75,
  standard: 1.25,
  high: 1.8,
  maximum: 3.2,
};

const OUTPUT_MULTIPLIERS: Record<StudioBrainOutputCount, number> = {
  1: 1,
  2: 1.85,
  4: 3.4,
};

const INTENT_RULES: IntentRule[] = [
  {
    intent: "short_form_video",
    workflow: "short_video",
    tool: "short-video",
    baseConfidence: 0.82,
    keywords: [
      "reel",
      "reels",
      "tiktok",
      "shorts",
      "youtube short",
      "short-form",
      "short form",
      "vertical video",
      "15 second",
      "20 second",
      "30 second video",
    ],
  },
  {
    intent: "long_form_video",
    workflow: "long_video",
    tool: "long-video",
    baseConfidence: 0.84,
    keywords: [
      "youtube video",
      "explainer video",
      "documentary",
      "animation",
      "animated story",
      "nursery rhyme",
      "long-form",
      "long form",
      "five minute video",
      "5 minute video",
    ],
  },
  {
    intent: "audio_generation",
    workflow: "audio",
    tool: "audio",
    baseConfidence: 0.86,
    keywords: [
      "voiceover",
      "voice over",
      "narration",
      "narrator",
      "podcast",
      "jingle",
      "spoken",
      "audio",
      "voice",
    ],
  },
  {
    intent: "meme_creation",
    workflow: "meme",
    tool: "memes",
    baseConfidence: 0.95,
    keywords: ["meme", "funny post", "reaction image"],
  },
  {
    intent: "image_generation",
    workflow: "image",
    tool: "images",
    baseConfidence: 0.8,
    keywords: [
      "image",
      "picture",
      "artwork",
      "illustration",
      "poster",
      "flyer",
      "thumbnail",
      "product photo",
      "hero image",
      "visual",
      "banner",
    ],
  },
  {
    intent: "written_content",
    workflow: "writing",
    tool: "writing",
    baseConfidence: 0.76,
    keywords: [
      "write",
      "article",
      "blog",
      "caption",
      "copy",
      "description",
      "script",
      "email",
      "press release",
      "social post",
    ],
  },
  {
    intent: "launch_campaign",
    workflow: "multi_asset",
    tool: "custom",
    baseConfidence: 0.88,
    keywords: [
      "launch pack",
      "launch campaign",
      "complete campaign",
      "campaign pack",
      "full campaign",
      "marketing pack",
      "content pack",
    ],
  },
  {
    intent: "product_content",
    workflow: "marketing",
    tool: "marketing",
    baseConfidence: 0.76,
    keywords: [
      "product launch",
      "product advert",
      "product ad",
      "product campaign",
      "sale advert",
      "promotion",
      "promotional",
    ],
  },
  {
    intent: "brand_content",
    workflow: "marketing",
    tool: "marketing",
    baseConfidence: 0.74,
    keywords: [
      "brand campaign",
      "brand awareness",
      "branding content",
      "business advert",
      "advertising campaign",
    ],
  },
  {
    intent: "website_content",
    workflow: "marketing",
    tool: "marketing",
    baseConfidence: 0.7,
    keywords: [
      "website banner",
      "homepage banner",
      "landing page visual",
      "website hero",
      "display advert",
    ],
  },
  {
    intent: "social_media_content",
    workflow: "marketing",
    tool: "marketing",
    baseConfidence: 0.68,
    keywords: [
      "instagram post",
      "facebook post",
      "linkedin post",
      "social media",
      "social campaign",
    ],
  },
  {
    intent: "marketing_campaign",
    workflow: "marketing",
    tool: "marketing",
    baseConfidence: 0.64,
    keywords: [
      "advert",
      "advertise",
      "advertising",
      "campaign",
      "marketing",
      "promote",
      "promotion",
      "sale",
    ],
  },
];

function cleanText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseSentence(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function shortenText(value: string, maximumLength: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= maximumLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maximumLength).trimEnd()}…`;
}

function normaliseColours(
  value: StudioBrainRequest["colours"],
): string[] {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean).slice(0, 12);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(cleanText)
      .filter(Boolean)
      .slice(0, 12);
  }

  return [];
}

function validateReferenceUrl(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new StudioBrainError(
      "The supplied reference link is not a valid URL.",
      "INVALID_REFERENCE_URL",
    );
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new StudioBrainError(
      "The reference link must use HTTP or HTTPS.",
      "INVALID_REFERENCE_URL",
    );
  }

  return parsed.toString();
}

function normaliseRequest(
  request: StudioBrainRequest,
): NormalisedRequest {
  if (!request || typeof request !== "object") {
    throw new StudioBrainError(
      "A valid Studio request is required.",
      "INVALID_REQUEST",
    );
  }

  const prompt = cleanText(request.prompt);

  if (prompt.length < MINIMUM_PROMPT_LENGTH) {
    throw new StudioBrainError(
      `Describe the requested creative work using at least ${MINIMUM_PROMPT_LENGTH} characters.`,
      "PROMPT_TOO_SHORT",
    );
  }

  if (prompt.length > MAXIMUM_PROMPT_LENGTH) {
    throw new StudioBrainError(
      `The Studio request must not exceed ${MAXIMUM_PROMPT_LENGTH.toLocaleString(
        "en-GB",
      )} characters.`,
      "PROMPT_TOO_LONG",
    );
  }

  const requestedTool =
    request.requestedTool &&
    Object.prototype.hasOwnProperty.call(
      TOOL_BASE_CREDITS,
      request.requestedTool,
    )
      ? request.requestedTool
      : undefined;

  const quality: StudioBrainQuality = [
    "draft",
    "standard",
    "high",
    "maximum",
  ].includes(request.quality ?? "")
    ? (request.quality as StudioBrainQuality)
    : "high";

  const outputCount: StudioBrainOutputCount = [1, 2, 4].includes(
    request.outputCount ?? 0,
  )
    ? (request.outputCount as StudioBrainOutputCount)
    : 1;

  const durationSeconds =
    typeof request.durationSeconds === "number" &&
    Number.isFinite(request.durationSeconds)
      ? Math.min(600, Math.max(5, Math.round(request.durationSeconds)))
      : undefined;

  return {
    prompt,
    requestedTool,
    quality,
    aspectRatio: request.aspectRatio,
    outputCount,
    durationSeconds,
    audience: cleanText(request.audience),
    style: cleanText(request.style) || "premium",
    tone: cleanText(request.tone) || "confident",
    colours: normaliseColours(request.colours),
    referenceUrl: validateReferenceUrl(cleanText(request.referenceUrl)),
    notes: cleanText(request.notes),
    brandKit:
      cleanText(request.brandKit) &&
      request.brandKit !== "none"
        ? cleanText(request.brandKit)
        : undefined,
    projectTitle: cleanText(request.projectTitle) || "Beacon Studio",
    saveToLibrary: request.saveToLibrary !== false,
  };
}

function getToolIntent(
  tool: StudioBrainToolId,
): IntentResolution {
  const routes: Record<StudioBrainToolId, IntentResolution> = {
    marketing: {
      intent: "marketing_campaign",
      workflow: "marketing",
      tool: "marketing",
      confidence: 0.92,
    },
    "short-video": {
      intent: "short_form_video",
      workflow: "short_video",
      tool: "short-video",
      confidence: 0.96,
    },
    "long-video": {
      intent: "long_form_video",
      workflow: "long_video",
      tool: "long-video",
      confidence: 0.96,
    },
    images: {
      intent: "image_generation",
      workflow: "image",
      tool: "images",
      confidence: 0.94,
    },
    writing: {
      intent: "written_content",
      workflow: "writing",
      tool: "writing",
      confidence: 0.94,
    },
    memes: {
      intent: "meme_creation",
      workflow: "meme",
      tool: "memes",
      confidence: 0.98,
    },
    audio: {
      intent: "audio_generation",
      workflow: "audio",
      tool: "audio",
      confidence: 0.96,
    },
    custom: {
      intent: "custom_creative",
      workflow: "multi_asset",
      tool: "custom",
      confidence: 0.7,
    },
  };

  return routes[tool];
}

function resolveIntent(
  request: NormalisedRequest,
): IntentResolution {
  const prompt = request.prompt.toLowerCase();

  let bestRule: IntentRule | null = null;
  let bestScore = 0;

  for (const rule of INTENT_RULES) {
    const matches = rule.keywords.filter((keyword) =>
      prompt.includes(keyword),
    );

    if (matches.length === 0) {
      continue;
    }

    const score = Math.min(
      0.99,
      rule.baseConfidence + Math.min(0.14, matches.length * 0.035),
    );

    if (score > bestScore) {
      bestRule = rule;
      bestScore = score;
    }
  }

  if (
    request.requestedTool &&
    request.requestedTool !== "custom"
  ) {
    const requestedResolution = getToolIntent(request.requestedTool);

    if (!bestRule) {
      return requestedResolution;
    }

    if (bestRule.tool === request.requestedTool) {
      return {
        ...requestedResolution,
        intent: bestRule.intent,
        workflow: bestRule.workflow,
        confidence: Math.max(requestedResolution.confidence, bestScore),
      };
    }

    return bestScore >= 0.92
      ? {
          intent: bestRule.intent,
          workflow: bestRule.workflow,
          tool: bestRule.tool,
          confidence: bestScore,
        }
      : requestedResolution;
  }

  if (bestRule) {
    return {
      intent: bestRule.intent,
      workflow: bestRule.workflow,
      tool: bestRule.tool,
      confidence: bestScore,
    };
  }

  if (request.requestedTool === "custom") {
    return getToolIntent("custom");
  }

  return {
    intent: "custom_creative",
    workflow: "multi_asset",
    tool: "custom",
    confidence: 0.58,
  };
}

function detectPlatform(prompt: string): string | undefined {
  const lowerPrompt = prompt.toLowerCase();

  const platforms: Array<[string, string[]]> = [
    ["Instagram", ["instagram", "insta"]],
    ["TikTok", ["tiktok"]],
    ["YouTube", ["youtube"]],
    ["Facebook", ["facebook"]],
    ["LinkedIn", ["linkedin"]],
    ["X", ["twitter", "x post"]],
    ["Website", ["website", "homepage", "landing page"]],
  ];

  return platforms.find(([, keywords]) =>
    keywords.some((keyword) => lowerPrompt.includes(keyword)),
  )?.[0];
}

function inferAudience(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (
    lowerPrompt.includes("small business") ||
    lowerPrompt.includes("business owner")
  ) {
    return "Small business owners";
  }

  if (
    lowerPrompt.includes("family") ||
    lowerPrompt.includes("families")
  ) {
    return "Families";
  }

  if (
    lowerPrompt.includes("children") ||
    lowerPrompt.includes("kids")
  ) {
    return "Parents and children";
  }

  if (
    lowerPrompt.includes("homeowner") ||
    lowerPrompt.includes("home owner")
  ) {
    return "Homeowners";
  }

  if (
    lowerPrompt.includes("uk") ||
    lowerPrompt.includes("british")
  ) {
    return "UK customers";
  }

  return "Audience inferred from the request";
}

function resolveAspectRatio(
  request: NormalisedRequest,
  workflow: StudioBrainWorkflow,
): StudioBrainAspectRatio {
  if (request.aspectRatio) {
    return request.aspectRatio;
  }

  const prompt = request.prompt.toLowerCase();

  if (
    prompt.includes("vertical") ||
    prompt.includes("reel") ||
    prompt.includes("tiktok") ||
    prompt.includes("shorts") ||
    prompt.includes("story")
  ) {
    return "9:16";
  }

  if (
    prompt.includes("instagram post") ||
    prompt.includes("portrait post")
  ) {
    return "4:5";
  }

  if (
    prompt.includes("square") ||
    prompt.includes("meme")
  ) {
    return "1:1";
  }

  if (
    workflow === "short_video"
  ) {
    return "9:16";
  }

  if (
    workflow === "long_video" ||
    workflow === "audio"
  ) {
    return "16:9";
  }

  return "1:1";
}

function resolveDuration(
  request: NormalisedRequest,
  workflow: StudioBrainWorkflow,
): number | undefined {
  if (request.durationSeconds) {
    return request.durationSeconds;
  }

  const match = request.prompt.match(
    /(\d{1,3})\s*(?:second|seconds|sec|secs)\b/i,
  );

  if (match) {
    return Math.min(600, Math.max(5, Number(match[1])));
  }

  if (workflow === "short_video") {
    return 20;
  }

  if (workflow === "long_video") {
    return 60;
  }

  if (workflow === "audio") {
    return 30;
  }

  return undefined;
}

function resolveFormat(
  workflow: StudioBrainWorkflow,
  aspectRatio: StudioBrainAspectRatio,
  prompt: string,
): StudioBrainOutputFormat {
  const lowerPrompt = prompt.toLowerCase();

  if (workflow === "writing") {
    if (lowerPrompt.includes("article") || lowerPrompt.includes("blog")) {
      return "article";
    }

    if (lowerPrompt.includes("caption")) {
      return "caption-pack";
    }

    return "advert-copy";
  }

  if (workflow === "audio") {
    return "voiceover";
  }

  if (workflow === "meme") {
    return "meme";
  }

  if (workflow === "short_video") {
    if (lowerPrompt.includes("tiktok")) {
      return "tiktok";
    }

    if (lowerPrompt.includes("youtube")) {
      return "youtube-short";
    }

    if (lowerPrompt.includes("facebook")) {
      return "facebook-reel";
    }

    return "instagram-reel";
  }

  if (workflow === "long_video") {
    return aspectRatio === "9:16"
      ? "portrait-video"
      : "landscape-video";
  }

  if (workflow === "multi_asset") {
    return "creative-pack";
  }

  if (lowerPrompt.includes("poster")) {
    return "poster";
  }

  if (lowerPrompt.includes("flyer")) {
    return "flyer";
  }

  if (lowerPrompt.includes("thumbnail")) {
    return "youtube-thumbnail";
  }

  if (lowerPrompt.includes("website") || lowerPrompt.includes("banner")) {
    return "web-banner";
  }

  if (aspectRatio === "9:16") {
    return "instagram-story";
  }

  if (aspectRatio === "4:5") {
    return "instagram-post";
  }

  return "square-ad";
}

function formatLabel(format: StudioBrainOutputFormat): string {
  return format
    .split("-")
    .map((word) => normaliseSentence(word))
    .join(" ");
}

function createDeliverables(
  request: NormalisedRequest,
  resolution: IntentResolution,
  aspectRatio: StudioBrainAspectRatio,
  durationSeconds?: number,
): StudioBrainDeliverable[] {
  const primaryFormat = resolveFormat(
    resolution.workflow,
    aspectRatio,
    request.prompt,
  );

  if (resolution.workflow === "multi_asset") {
    return [
      {
        id: "creative-pack-primary-1",
        name: "Primary campaign visual",
        description:
          "A polished primary visual that establishes the campaign direction.",
        format:
          aspectRatio === "9:16"
            ? "instagram-story"
            : "square-ad",
        aspectRatio,
        quantity: 1,
      },
      {
        id: "creative-pack-copy-1",
        name: "Campaign copy",
        description:
          "Platform-ready headline, supporting copy and call to action.",
        format: "advert-copy",
        aspectRatio,
        quantity: 1,
      },
      {
        id: "creative-pack-support-1",
        name: "Supporting social asset",
        description:
          "A supporting asset adapted from the approved campaign direction.",
        format:
          aspectRatio === "9:16"
            ? "instagram-reel"
            : "instagram-post",
        aspectRatio,
        durationSeconds:
          aspectRatio === "9:16" ? durationSeconds ?? 15 : undefined,
        quantity: 1,
      },
    ];
  }

  return Array.from(
    { length: request.outputCount },
    (_, index): StudioBrainDeliverable => ({
      id: `${primaryFormat}-${index + 1}`,
      name:
        request.outputCount === 1
          ? formatLabel(primaryFormat)
          : `${formatLabel(primaryFormat)} ${index + 1}`,
      description: `A ${request.quality} quality ${formatLabel(
        primaryFormat,
      ).toLowerCase()} prepared for preview, review and final export.`,
      format: primaryFormat,
      aspectRatio,
      durationSeconds,
      quantity: 1,
    }),
  );
}

function createTitle(
  resolution: IntentResolution,
  prompt: string,
): string {
  const titles: Record<StudioBrainIntent, string> = {
    marketing_campaign: "Marketing campaign plan",
    social_media_content: "Social media content plan",
    short_form_video: "Short-form video plan",
    long_form_video: "Long-form video plan",
    image_generation: "Image production plan",
    written_content: "Written content plan",
    meme_creation: "Social meme plan",
    audio_generation: "Audio production plan",
    brand_content: "Brand content plan",
    product_content: "Product campaign plan",
    website_content: "Website creative plan",
    launch_campaign: "Launch campaign plan",
    custom_creative: "Custom creative plan",
  };

  return titles[resolution.intent] || shortenText(prompt, 70);
}

function createProductionSteps(
  workflow: StudioBrainWorkflow,
): string[] {
  switch (workflow) {
    case "short_video":
    case "long_video":
      return [
        "Analyse the objective, audience and intended viewing platform.",
        "Create the script, hook, sequence and visual direction.",
        "Generate the initial scenes, motion and supporting assets.",
        "Assemble the first video preview for review.",
        "Apply requested natural-language edits.",
        "Render and prepare the final export.",
      ];

    case "audio":
      return [
        "Analyse the message, audience and required delivery style.",
        "Prepare the spoken script and pronunciation guidance.",
        "Generate the initial voice or audio preview.",
        "Review pacing, tone and clarity.",
        "Apply requested audio changes.",
        "Prepare the final audio export.",
      ];

    case "writing":
      return [
        "Analyse the purpose, audience and publishing platform.",
        "Create the content structure and key message hierarchy.",
        "Produce the first written draft.",
        "Review accuracy, tone and clarity.",
        "Apply requested revisions.",
        "Prepare the final copy for export.",
      ];

    case "multi_asset":
      return [
        "Analyse the campaign objective and identify the required asset set.",
        "Create a shared campaign concept, message and visual direction.",
        "Develop the primary creative asset.",
        "Adapt the approved direction across supporting deliverables.",
        "Apply requested natural-language changes.",
        "Prepare the final campaign export pack.",
      ];

    default:
      return [
        "Analyse the objective, audience and intended platform.",
        "Create the visual concept, message and layout direction.",
        "Generate the first creative preview.",
        "Review brand consistency and content clarity.",
        "Apply requested natural-language edits.",
        "Prepare the final production-ready export.",
      ];
  }
}

function createAssetRequirements(
  request: NormalisedRequest,
  resolution: IntentResolution,
): StudioBrainAssetRequirement[] {
  const requirements: StudioBrainAssetRequirement[] = [
    {
      id: "brand-kit",
      name: "Brand kit",
      description: request.brandKit
        ? `Use the saved ${request.brandKit} brand kit.`
        : "A logo, brand colours and preferred fonts improve consistency.",
      required: false,
      provided: Boolean(request.brandKit),
    },
    {
      id: "reference",
      name: "Reference material",
      description: request.referenceUrl
        ? "Use the supplied reference URL for creative context."
        : "A visual, website or campaign reference may improve direction.",
      required: false,
      provided: Boolean(request.referenceUrl),
    },
  ];

  if (
    ["marketing", "image", "short_video", "long_video", "multi_asset"].includes(
      resolution.workflow,
    )
  ) {
    requirements.push({
      id: "product-or-subject",
      name: "Product or subject imagery",
      description:
        "Original product, service or subject imagery may be needed when an exact real-world item must be represented.",
      required: false,
      provided: false,
    });
  }

  if (
    resolution.workflow === "audio"
  ) {
    requirements.push({
      id: "pronunciation",
      name: "Pronunciation guidance",
      description:
        "Provide pronunciation guidance for unusual names, products or places.",
      required: false,
      provided: false,
    });
  }

  return requirements;
}

function createClarifications(
  request: NormalisedRequest,
  resolution: IntentResolution,
  durationSeconds?: number,
): StudioBrainClarification[] {
  const questions: StudioBrainClarification[] = [];
  const platform = detectPlatform(request.prompt);

  if (!request.audience) {
    questions.push({
      id: "audience",
      field: "audience",
      question: "Who is the main audience for this creative work?",
      required: false,
      suggestedAnswer: inferAudience(request.prompt),
    });
  }

  if (
    ["short_video", "long_video", "marketing"].includes(
      resolution.workflow,
    ) &&
    !platform
  ) {
    questions.push({
      id: "platform",
      field: "platform",
      question: "Which platform will this be published on?",
      required: false,
      suggestedAnswer:
        resolution.workflow === "short_video"
          ? "Instagram Reels"
          : "Website and social media",
    });
  }

  if (
    ["short_video", "long_video", "audio"].includes(resolution.workflow) &&
    !durationSeconds
  ) {
    questions.push({
      id: "duration",
      field: "duration",
      question: "How long should the final output be?",
      required: false,
      suggestedAnswer:
        resolution.workflow === "long_video"
          ? "60 seconds"
          : "30 seconds",
    });
  }

  if (
    resolution.confidence < 0.65
  ) {
    questions.push({
      id: "objective",
      field: "objective",
      question:
        "What is the most important result this creative work should achieve?",
      required: true,
    });
  }

  return questions;
}

function createModelRoutes(
  workflow: StudioBrainWorkflow,
): StudioBrainModelRoute[] {
  const routes: StudioBrainModelRoute[] = [
    {
      role: "planning",
      provider: "openai",
      model: "configured-planning-model",
      required: true,
      purpose:
        "Understand the request and prepare the structured creative plan.",
    },
  ];

  if (
    ["writing", "marketing", "multi_asset", "short_video", "long_video"].includes(
      workflow,
    )
  ) {
    routes.push({
      role: "writing",
      provider: "openai",
      model: "configured-writing-model",
      required: true,
      purpose:
        "Prepare scripts, captions, headlines, descriptions and calls to action.",
    });
  }

  if (
    ["image", "marketing", "meme", "multi_asset"].includes(workflow)
  ) {
    routes.push({
      role: "image",
      provider: "openai",
      model: "configured-image-model",
      required: true,
      purpose: "Generate visual assets and previews.",
    });
  }

  if (
    ["short_video", "long_video"].includes(workflow)
  ) {
    routes.push({
      role: "video",
      provider: "provider-required",
      model: "configured-video-model",
      required: true,
      purpose: "Generate, animate and render video scenes.",
    });
  }

  if (workflow === "audio") {
    routes.push({
      role: "audio",
      provider: "openai",
      model: "configured-audio-model",
      required: true,
      purpose: "Generate narration, voiceovers or spoken audio.",
    });
  }

  return routes;
}

function createOptimisedPrompt(
  request: NormalisedRequest,
  resolution: IntentResolution,
  audience: string,
  aspectRatio: StudioBrainAspectRatio,
  durationSeconds?: number,
): string {
  return [
    `Create a ${request.quality} quality ${resolution.workflow.replaceAll(
      "_",
      " ",
    )} production.`,
    `Primary request: ${request.prompt}`,
    `Objective: Deliver a clear, polished and platform-appropriate result.`,
    `Audience: ${audience}.`,
    `Creative style: ${normaliseSentence(request.style)}.`,
    `Tone: ${normaliseSentence(request.tone)}.`,
    request.colours.length > 0
      ? `Preferred colours: ${request.colours.join(", ")}.`
      : "",
    `Aspect ratio: ${aspectRatio}.`,
    durationSeconds
      ? `Target duration: ${durationSeconds} seconds.`
      : "",
    request.brandKit
      ? `Apply saved brand kit: ${request.brandKit}.`
      : "",
    request.referenceUrl
      ? `Use the supplied reference URL for context without copying protected creative work.`
      : "",
    request.notes
      ? `Additional production notes: ${request.notes}`
      : "",
    "Keep all visible wording accurate, readable and free from invented claims.",
    "Prepare the result for preview, natural-language revision and final export.",
  ]
    .filter(Boolean)
    .join("\n");
}

function createNegativePrompt(
  workflow: StudioBrainWorkflow,
): string[] {
  const shared = [
    "Unreadable or misspelled visible text",
    "Invented prices, offers, statistics or product claims",
    "Unrequested logos, trademarks or watermarks",
    "Low-resolution or unfinished presentation",
    "Content that conflicts with the requested audience or tone",
  ];

  if (
    ["image", "marketing", "meme", "multi_asset"].includes(workflow)
  ) {
    shared.push(
      "Distorted anatomy, duplicated objects or inconsistent lighting",
    );
  }

  if (
    ["short_video", "long_video"].includes(workflow)
  ) {
    shared.push(
      "Abrupt cuts, unstable motion, inconsistent subjects or broken continuity",
    );
  }

  if (workflow === "audio") {
    shared.push(
      "Clipped speech, unnatural pacing, incorrect pronunciation or background noise",
    );
  }

  return shared;
}

function calculateCredits(
  request: NormalisedRequest,
  resolution: IntentResolution,
  durationSeconds?: number,
): StudioBrainCreditBreakdown {
  const base = TOOL_BASE_CREDITS[resolution.tool];
  const qualityMultiplier = QUALITY_MULTIPLIERS[request.quality];
  const outputMultiplier = OUTPUT_MULTIPLIERS[request.outputCount];

  const isTimedWorkflow = [
    "short_video",
    "long_video",
    "audio",
  ].includes(resolution.workflow);

  const durationMultiplier =
    isTimedWorkflow && durationSeconds
      ? Math.max(1, durationSeconds / 15)
      : 1;

  const planning = Math.max(
    1,
    Math.ceil(base * 0.08),
  );

  const generation = Math.max(
    1,
    Math.ceil(base * outputMultiplier),
  );

  const quality = Math.max(
    0,
    Math.ceil(
      base *
        outputMultiplier *
        Math.max(0, qualityMultiplier - 1),
    ),
  );

  const duration = Math.max(
    0,
    Math.ceil(
      base *
        outputMultiplier *
        Math.max(0, durationMultiplier - 1),
    ),
  );

  const additionalOutputs = Math.max(
    0,
    Math.ceil(
      base *
        Math.max(0, outputMultiplier - 1) *
        0.15,
    ),
  );

  const total = Math.max(
    1,
    planning +
      generation +
      quality +
      duration +
      additionalOutputs,
  );

  return {
    planning,
    generation,
    quality,
    duration,
    additionalOutputs,
    total,
  };
}

function estimateDuration(
  workflow: StudioBrainWorkflow,
  quality: StudioBrainQuality,
  outputCount: StudioBrainOutputCount,
): string {
  const extraOutputs = outputCount > 1;

  if (workflow === "long_video") {
    if (quality === "maximum") {
      return extraOutputs ? "25–50 minutes" : "15–30 minutes";
    }

    return extraOutputs ? "15–35 minutes" : "8–20 minutes";
  }

  if (workflow === "short_video") {
    if (quality === "maximum") {
      return extraOutputs ? "10–20 minutes" : "6–12 minutes";
    }

    return extraOutputs ? "6–15 minutes" : "3–8 minutes";
  }

  if (workflow === "audio") {
    return extraOutputs ? "3–8 minutes" : "1–4 minutes";
  }

  if (workflow === "multi_asset") {
    return quality === "maximum"
      ? "8–18 minutes"
      : "4–10 minutes";
  }

  return quality === "maximum"
    ? extraOutputs
      ? "4–8 minutes"
      : "2–5 minutes"
    : extraOutputs
      ? "2–5 minutes"
      : "Under 2 minutes";
}

function createWarnings(
  request: NormalisedRequest,
  resolution: IntentResolution,
): string[] {
  const warnings: string[] = [];

  if (
    resolution.workflow === "multi_asset" &&
    request.outputCount === 1
  ) {
    warnings.push(
      "A multi-asset request may create several connected deliverables even when one output is selected.",
    );
  }

  if (
    !request.brandKit &&
    request.prompt.toLowerCase().includes("brand")
  ) {
    warnings.push(
      "No saved brand kit was selected, so brand styling will be inferred from the request.",
    );
  }

  if (
    request.referenceUrl
  ) {
    warnings.push(
      "Reference material should guide direction only and must not be copied in a way that infringes third-party rights.",
    );
  }

  if (
    resolution.confidence < 0.65
  ) {
    warnings.push(
      "The request is broad, so the proposed workflow may need confirmation before generation.",
    );
  }

  return warnings;
}

export function analyseStudioRequest(
  input: StudioBrainRequest,
): StudioBrainResult {
  const request = normaliseRequest(input);
  const resolution = resolveIntent(request);

  const aspectRatio = resolveAspectRatio(
    request,
    resolution.workflow,
  );

  const durationSeconds = resolveDuration(
    request,
    resolution.workflow,
  );

  const audience =
    request.audience || inferAudience(request.prompt);

  const clarificationQuestions = createClarifications(
    request,
    resolution,
    durationSeconds,
  );

  const deliverables = createDeliverables(
    request,
    resolution,
    aspectRatio,
    durationSeconds,
  );

  const credits = calculateCredits(
    request,
    resolution,
    durationSeconds,
  );

  const summary = shortenText(
    request.prompt,
    300,
  );

  const objective = request.notes
    ? `${shortenText(request.prompt, 220)} Additional direction: ${shortenText(
        request.notes,
        160,
      )}`
    : shortenText(request.prompt, 360);

  return {
    version: STUDIO_BRAIN_VERSION,
    intent: resolution.intent,
    workflow: resolution.workflow,
    selectedTool: resolution.tool,
    confidence: Number(
      resolution.confidence.toFixed(2),
    ),
    needsClarification: clarificationQuestions.some(
      (question) => question.required,
    ),
    clarificationQuestions,
    title: createTitle(resolution, request.prompt),
    summary,
    objective,
    audience,
    style: normaliseSentence(request.style),
    tone: normaliseSentence(request.tone),
    colours: request.colours,
    aspectRatio,
    quality: request.quality,
    outputCount: request.outputCount,
    durationSeconds,
    deliverables,
    productionSteps: createProductionSteps(
      resolution.workflow,
    ),
    assetRequirements: createAssetRequirements(
      request,
      resolution,
    ),
    models: createModelRoutes(
      resolution.workflow,
    ),
    optimisedPrompt: createOptimisedPrompt(
      request,
      resolution,
      audience,
      aspectRatio,
      durationSeconds,
    ),
    negativePrompt: createNegativePrompt(
      resolution.workflow,
    ),
    credits,
    estimatedCredits: credits.total,
    estimatedDuration: estimateDuration(
      resolution.workflow,
      request.quality,
      request.outputCount,
    ),
    warnings: createWarnings(
      request,
      resolution,
    ),
    metadata: {
      analysedAt: new Date().toISOString(),
      originalPrompt: request.prompt,
      referenceUrl: request.referenceUrl,
      brandKit: request.brandKit,
      projectTitle: request.projectTitle,
      saveToLibrary: request.saveToLibrary,
    },
  };
}

export async function runStudioBrain(
  request: StudioBrainRequest,
): Promise<StudioBrainResult> {
  return analyseStudioRequest(request);
}

export const studioBrain = {
  version: STUDIO_BRAIN_VERSION,
  analyse: runStudioBrain,
  analyseSync: analyseStudioRequest,
} as const;

export default studioBrain;