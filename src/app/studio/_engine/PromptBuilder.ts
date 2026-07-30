export type StudioOutputKind =
  | "video"
  | "image"
  | "document";

export type StudioAspectRatio =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:5"
  | "3:2"
  | "2:3";

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

export type StudioTone =
  | "professional"
  | "friendly"
  | "bold"
  | "calm"
  | "playful"
  | "luxury"
  | "informative"
  | "persuasive";

export type StudioQuality =
  | "draft"
  | "standard"
  | "high"
  | "maximum";

export type StudioOutputFormat = {
  id: StudioOutputFormatId;
  label: string;
  description: string;
  kind: StudioOutputKind;
  aspectRatio: StudioAspectRatio;
  width: number;
  height: number;
  defaultDurationMs?: number;
  maximumDurationMs?: number;
};

export type StudioGenerationBrief = {
  prompt: string;
  formats: StudioOutputFormatId[];
  audience?: string;
  tone?: StudioTone | string;
  style?: string;
  colours?: string[];
  sourceUrl?: string;
  notes?: string;
  durationMs?: number;
  quality: StudioQuality;
  outputCount: number;
};

export type StudioCampaignFormatGroup = {
  id: string;
  label: string;
  formats: StudioOutputFormatId[];
};

export const STUDIO_OUTPUT_FORMATS: Record<
  StudioOutputFormatId,
  StudioOutputFormat
> = {
  "instagram-reel": {
    id: "instagram-reel",
    label: "Instagram Reel",
    description:
      "Vertical short-form video for Instagram Reels.",
    kind: "video",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    defaultDurationMs: 15_000,
    maximumDurationMs: 90_000,
  },

  "facebook-reel": {
    id: "facebook-reel",
    label: "Facebook Reel",
    description:
      "Vertical short-form video for Facebook Reels.",
    kind: "video",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    defaultDurationMs: 15_000,
    maximumDurationMs: 90_000,
  },

  tiktok: {
    id: "tiktok",
    label: "TikTok",
    description:
      "Vertical short-form video for TikTok.",
    kind: "video",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    defaultDurationMs: 15_000,
    maximumDurationMs: 180_000,
  },

  "youtube-short": {
    id: "youtube-short",
    label: "YouTube Short",
    description:
      "Vertical short-form video for YouTube Shorts.",
    kind: "video",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    defaultDurationMs: 30_000,
    maximumDurationMs: 60_000,
  },

  "instagram-story": {
    id: "instagram-story",
    label: "Instagram Story",
    description:
      "Vertical full-screen story content for Instagram.",
    kind: "video",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    defaultDurationMs: 15_000,
    maximumDurationMs: 60_000,
  },

  "facebook-story": {
    id: "facebook-story",
    label: "Facebook Story",
    description:
      "Vertical full-screen story content for Facebook.",
    kind: "video",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    defaultDurationMs: 15_000,
    maximumDurationMs: 60_000,
  },

  "instagram-post": {
    id: "instagram-post",
    label: "Instagram Post",
    description:
      "Portrait social image optimised for Instagram.",
    kind: "image",
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
  },

  "facebook-post": {
    id: "facebook-post",
    label: "Facebook Post",
    description:
      "Landscape social image optimised for Facebook.",
    kind: "image",
    aspectRatio: "16:9",
    width: 1200,
    height: 675,
  },

  "linkedin-post": {
    id: "linkedin-post",
    label: "LinkedIn Post",
    description:
      "Professional landscape graphic for LinkedIn.",
    kind: "image",
    aspectRatio: "16:9",
    width: 1200,
    height: 675,
  },

  "linkedin-video": {
    id: "linkedin-video",
    label: "LinkedIn Video",
    description:
      "Professional landscape video for LinkedIn.",
    kind: "video",
    aspectRatio: "16:9",
    width: 1920,
    height: 1080,
    defaultDurationMs: 30_000,
    maximumDurationMs: 600_000,
  },

  "x-post": {
    id: "x-post",
    label: "X Post",
    description:
      "Landscape social graphic for X.",
    kind: "image",
    aspectRatio: "16:9",
    width: 1200,
    height: 675,
  },

  "youtube-thumbnail": {
    id: "youtube-thumbnail",
    label: "YouTube Thumbnail",
    description:
      "High-impact landscape thumbnail for YouTube.",
    kind: "image",
    aspectRatio: "16:9",
    width: 1280,
    height: 720,
  },

  "web-banner": {
    id: "web-banner",
    label: "Web Banner",
    description:
      "Wide website banner for landing pages and homepages.",
    kind: "image",
    aspectRatio: "16:9",
    width: 1920,
    height: 600,
  },

  "display-banner": {
    id: "display-banner",
    label: "Display Banner",
    description:
      "Compact digital advertising banner.",
    kind: "image",
    aspectRatio: "3:2",
    width: 1200,
    height: 800,
  },

  poster: {
    id: "poster",
    label: "Poster",
    description:
      "Portrait promotional poster for print or digital use.",
    kind: "document",
    aspectRatio: "2:3",
    width: 2480,
    height: 3508,
  },

  flyer: {
    id: "flyer",
    label: "Flyer",
    description:
      "Portrait promotional flyer for print or digital use.",
    kind: "document",
    aspectRatio: "2:3",
    width: 1748,
    height: 2480,
  },

  meme: {
    id: "meme",
    label: "Meme",
    description:
      "Square social meme with concise visual copy.",
    kind: "image",
    aspectRatio: "1:1",
    width: 1080,
    height: 1080,
  },

  "square-ad": {
    id: "square-ad",
    label: "Square Advert",
    description:
      "Square advert for broad social compatibility.",
    kind: "image",
    aspectRatio: "1:1",
    width: 1080,
    height: 1080,
  },

  "landscape-video": {
    id: "landscape-video",
    label: "Landscape Video",
    description:
      "Standard widescreen video for websites and video platforms.",
    kind: "video",
    aspectRatio: "16:9",
    width: 1920,
    height: 1080,
    defaultDurationMs: 30_000,
    maximumDurationMs: 1_800_000,
  },

  "portrait-video": {
    id: "portrait-video",
    label: "Portrait Video",
    description:
      "General vertical video for mobile-first platforms.",
    kind: "video",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    defaultDurationMs: 15_000,
    maximumDurationMs: 300_000,
  },
};

export const STUDIO_CAMPAIGN_FORMAT_GROUPS: StudioCampaignFormatGroup[] =
  [
    {
      id: "short-video",
      label: "Short-form video",
      formats: [
        "instagram-reel",
        "facebook-reel",
        "tiktok",
        "youtube-short",
      ],
    },
    {
      id: "stories",
      label: "Stories",
      formats: [
        "instagram-story",
        "facebook-story",
      ],
    },
    {
      id: "social-posts",
      label: "Social posts",
      formats: [
        "instagram-post",
        "facebook-post",
        "linkedin-post",
        "x-post",
      ],
    },
    {
      id: "marketing-assets",
      label: "Marketing assets",
      formats: [
        "web-banner",
        "display-banner",
        "poster",
        "flyer",
        "square-ad",
      ],
    },
    {
      id: "video",
      label: "Video",
      formats: [
        "linkedin-video",
        "landscape-video",
        "portrait-video",
      ],
    },
    {
      id: "creative",
      label: "Creative",
      formats: [
        "youtube-thumbnail",
        "meme",
      ],
    },
  ];

const DEFAULT_FORMATS: StudioOutputFormatId[] = [
  "instagram-reel",
];

function clean(
  value: string | undefined,
): string | undefined {
  const normalised = value
    ?.trim()
    .replace(/\s+/g, " ");

  return normalised || undefined;
}

function cleanColours(
  colours: string[] | undefined,
): string[] {
  if (!Array.isArray(colours)) {
    return [];
  }

  return Array.from(
    new Set(
      colours
        .map((colour) => clean(colour))
        .filter(
          (colour): colour is string =>
            Boolean(colour),
        ),
    ),
  ).slice(0, 12);
}

function isStudioOutputFormatId(
  value: string,
): value is StudioOutputFormatId {
  return Object.prototype.hasOwnProperty.call(
    STUDIO_OUTPUT_FORMATS,
    value,
  );
}

function cleanFormats(
  formats:
    | StudioOutputFormatId[]
    | undefined,
): StudioOutputFormatId[] {
  if (!Array.isArray(formats)) {
    return [];
  }

  return Array.from(
    new Set(
      formats.filter(
        isStudioOutputFormatId,
      ),
    ),
  );
}

function clampDuration(
  durationMs: number | undefined,
  formats: StudioOutputFormatId[],
): number {
  const selectedFormats =
    formats.map(
      (format) =>
        STUDIO_OUTPUT_FORMATS[
          format
        ],
    );

  const videoFormats =
    selectedFormats.filter(
      (format) =>
        format.kind === "video",
    );

  if (
    videoFormats.length === 0
  ) {
    return 5_000;
  }

  const requestedDuration =
    typeof durationMs === "number" &&
    Number.isFinite(durationMs)
      ? Math.round(durationMs)
      : Math.max(
          ...videoFormats.map(
            (format) =>
              format.defaultDurationMs ??
              15_000,
          ),
        );

  const sharedMaximum =
    Math.min(
      ...videoFormats.map(
        (format) =>
          format.maximumDurationMs ??
          1_800_000,
      ),
    );

  return Math.min(
    Math.max(
      requestedDuration,
      1_000,
    ),
    sharedMaximum,
  );
}

export function getStudioOutputFormat(
  formatId: StudioOutputFormatId,
): StudioOutputFormat {
  return STUDIO_OUTPUT_FORMATS[
    formatId
  ];
}

export function getStudioOutputFormats(
  formatIds: StudioOutputFormatId[],
): StudioOutputFormat[] {
  return cleanFormats(formatIds).map(
    (formatId) =>
      getStudioOutputFormat(
        formatId,
      ),
  );
}

export function getPrimaryStudioFormat(
  formatIds: StudioOutputFormatId[],
): StudioOutputFormat {
  const selectedFormats =
    getStudioOutputFormats(
      formatIds,
    );

  if (
    selectedFormats.length === 0
  ) {
    return STUDIO_OUTPUT_FORMATS[
      "instagram-reel"
    ];
  }

  const firstVideo =
    selectedFormats.find(
      (format) =>
        format.kind === "video",
    );

  return (
    firstVideo ??
    selectedFormats[0]
  );
}

export function normaliseStudioBrief(
  input: StudioGenerationBrief,
): StudioGenerationBrief {
  const formats =
    cleanFormats(
      input.formats,
    );

  const safeFormats: StudioOutputFormatId[] =
    formats.length > 0
      ? formats
      : [...DEFAULT_FORMATS];

  return {
    ...input,
    prompt:
      clean(input.prompt) ?? "",
    formats: safeFormats,
    audience: clean(
      input.audience,
    ),
    tone: clean(input.tone),
    style: clean(input.style),
    colours: cleanColours(
      input.colours,
    ),
    sourceUrl: clean(
      input.sourceUrl,
    ),
    notes: clean(input.notes),
    durationMs: clampDuration(
      input.durationMs,
      safeFormats,
    ),
    outputCount: Math.min(
      Math.max(
        Math.round(
          input.outputCount || 1,
        ),
        1,
      ),
      4,
    ),
  };
}

export function buildStudioSystemPrompt(): string {
  return [
    "You are Beacon Studio's campaign creative director and multi-format scene planner.",
    "The user describes one campaign and selects one or more output formats.",
    "Create one shared campaign concept with linked platform-specific variants.",
    "Preserve the same core message, offer, visual identity and call to action across every variant.",
    "Adapt framing, copy length, pacing, safe zones and visual hierarchy for each selected format.",
    "Do not duplicate identical layouts across incompatible aspect ratios.",
    "Vertical video variants should use mobile-first framing and concise on-screen copy.",
    "Landscape and square variants should reposition content so no important text or subject is cropped.",
    "Static formats such as posters, banners, social posts and memes must still be represented as editable scenes.",
    "Every scene must be suitable for conversion into Beacon Studio timeline tracks and clips.",
    "Write concise on-screen copy, narration, visual direction and asset-generation prompts.",
    "Use British English.",
    "Keep scene timings sequential and non-overlapping.",
    "Do not claim that image, video, audio or voice files already exist.",
    "Return only the structured campaign plan requested by the response schema.",
  ].join(" ");
}

export function buildStudioUserPrompt(
  input: StudioGenerationBrief,
): string {
  const brief =
    normaliseStudioBrief(
      input,
    );

  const selectedFormats =
    getStudioOutputFormats(
      brief.formats,
    );

  const durationSeconds =
    Math.max(
      1,
      Math.round(
        (brief.durationMs ??
          5_000) / 1_000,
      ),
    );

  const formatLines =
    selectedFormats.map(
      (format) =>
        [
          `- ${format.label}`,
          `kind=${format.kind}`,
          `canvas=${format.width}x${format.height}`,
          `aspect=${format.aspectRatio}`,
        ].join(", "),
    );

  const lines = [
    "Create one editable multi-format campaign.",
    "",
    `Core request: ${brief.prompt}`,
    "",
    "Selected output formats:",
    ...formatLines,
    "",
    `Shared video duration where applicable: ${durationSeconds} seconds.`,
    `Planning quality: ${brief.quality}.`,
    `Requested creative variations: ${brief.outputCount}.`,
  ];

  if (brief.audience) {
    lines.push(
      `Target audience: ${brief.audience}.`,
    );
  }

  if (brief.tone) {
    lines.push(
      `Tone: ${brief.tone}.`,
    );
  }

  if (brief.style) {
    lines.push(
      `Visual style: ${brief.style}.`,
    );
  }

  if (
    brief.colours?.length
  ) {
    lines.push(
      `Preferred colours: ${brief.colours.join(", ")}.`,
    );
  }

  if (brief.sourceUrl) {
    lines.push(
      `Reference URL supplied by the user: ${brief.sourceUrl}. Treat it only as user-provided context and do not claim to have browsed it.`,
    );
  }

  if (brief.notes) {
    lines.push(
      `Additional instructions: ${brief.notes}`,
    );
  }

  lines.push(
    "",
    "Create a shared campaign foundation containing:",
    "- campaign title",
    "- campaign summary",
    "- core message",
    "- supporting message",
    "- call to action",
    "- visual direction",
    "- shared scenes",
    "",
    "Then create one linked variant for every selected format.",
    "Each variant must contain its own dimensions, aspect ratio, duration, adapted copy and scene layout.",
    "Reuse the same campaign idea while adapting it properly for each platform.",
    "For formats with different dimensions or media types, reposition and rewrite content where needed.",
  );

  return lines.join("\n");
}