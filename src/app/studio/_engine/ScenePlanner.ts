import type {
  StudioClip,
  StudioClipTransform,
  StudioTimeline,
  StudioTrack,
} from "../StudioProvider";

import {
  getPrimaryStudioFormat,
  getStudioOutputFormat,
  type StudioAspectRatio,
  type StudioOutputFormatId,
} from "./PromptBuilder";

export type StudioGeneratedScene = {
  id: string;
  title: string;
  startMs: number;
  durationMs: number;
  visualDirection: string;
  onScreenText?: string;
  narration?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  audioPrompt?: string;
  backgroundColor?: string;
  sourceSceneId?: string;
};

export type StudioCampaignVariant = {
  id: string;
  format: StudioOutputFormatId;
  title: string;
  summary?: string;
  aspectRatio: StudioAspectRatio;
  width: number;
  height: number;
  durationMs: number;
  backgroundColor: string;
  scenes: StudioGeneratedScene[];
  suggestedCaption?: string;
  suggestedHashtags?: string[];
  generationNotes?: string[];
};

export type StudioCampaignPlan = {
  title: string;
  summary: string;
  coreMessage: string;
  supportingMessage?: string;
  callToAction?: string;
  visualDirection: string;
  backgroundColor: string;
  durationMs: number;
  sharedScenes: StudioGeneratedScene[];
  variants: StudioCampaignVariant[];
  suggestedCaption?: string;
  suggestedHashtags?: string[];
  generationNotes?: string[];
};

export type StudioPlannedVariant = {
  variant: StudioCampaignVariant;
  timeline: StudioTimeline;
};

const DEFAULT_BACKGROUND_COLOUR = "#020617";

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function cleanText(
  value: string | undefined,
): string | undefined {
  const cleaned = value
    ?.trim()
    .replace(/\s+/g, " ");

  return cleaned || undefined;
}

function clampDuration(
  durationMs: number,
): number {
  if (!Number.isFinite(durationMs)) {
    return 1_000;
  }

  return Math.min(
    Math.max(
      Math.round(durationMs),
      250,
    ),
    30 * 60 * 1_000,
  );
}

function getCanvasTransform(
  width: number,
  height: number,
): StudioClipTransform {
  return {
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    anchorX: 0.5,
    anchorY: 0.5,
  };
}

function getTextTransform(
  width: number,
  height: number,
): StudioClipTransform {
  return {
    ...getCanvasTransform(
      width,
      height,
    ),
    x: Math.round(
      width * 0.08,
    ),
    y: Math.round(
      height * 0.24,
    ),
    width: Math.round(
      width * 0.84,
    ),
    height: Math.round(
      height * 0.52,
    ),
  };
}

function getResponsiveFontSize(
  width: number,
  height: number,
): number {
  const shortestSide =
    Math.min(width, height);

  return Math.max(
    34,
    Math.min(
      96,
      Math.round(
        shortestSide * 0.068,
      ),
    ),
  );
}

function normaliseScenes(
  scenes: StudioGeneratedScene[],
  requestedDurationMs: number,
): StudioGeneratedScene[] {
  if (
    !Array.isArray(scenes) ||
    scenes.length === 0
  ) {
    return [
      {
        id: createId("scene"),
        title: "Campaign scene",
        startMs: 0,
        durationMs: Math.max(
          1_000,
          requestedDurationMs,
        ),
        visualDirection:
          "Create a branded campaign visual using the supplied message and visual direction.",
      },
    ];
  }

  let nextStartMs = 0;

  return scenes
    .map(
      (
        scene,
        index,
      ): StudioGeneratedScene => {
        const durationMs =
          clampDuration(
            scene.durationMs,
          );

        const normalisedScene = {
          ...scene,
          id:
            cleanText(scene.id) ??
            createId("scene"),
          title:
            cleanText(
              scene.title,
            ) ??
            `Scene ${index + 1}`,
          startMs: nextStartMs,
          durationMs,
          visualDirection:
            cleanText(
              scene.visualDirection,
            ) ??
            "Create a suitable branded campaign visual.",
          onScreenText:
            cleanText(
              scene.onScreenText,
            ),
          narration:
            cleanText(
              scene.narration,
            ),
          imagePrompt:
            cleanText(
              scene.imagePrompt,
            ),
          videoPrompt:
            cleanText(
              scene.videoPrompt,
            ),
          audioPrompt:
            cleanText(
              scene.audioPrompt,
            ),
          backgroundColor:
            cleanText(
              scene.backgroundColor,
            ),
          sourceSceneId:
            cleanText(
              scene.sourceSceneId,
            ),
        };

        nextStartMs +=
          durationMs;

        return normalisedScene;
      },
    )
    .sort(
      (first, second) =>
        first.startMs -
        second.startMs,
    );
}

function getTimelineDuration(
  scenes: StudioGeneratedScene[],
  requestedDurationMs: number,
): number {
  const scenesDuration =
    scenes.reduce(
      (
        maximum,
        scene,
      ) =>
        Math.max(
          maximum,
          scene.startMs +
            scene.durationMs,
        ),
      0,
    );

  return Math.max(
    1_000,
    requestedDurationMs,
    scenesDuration,
  );
}

function createVisualClip(
  trackId: string,
  scene: StudioGeneratedScene,
  variant: StudioCampaignVariant,
  layer: number,
): StudioClip {
  return {
    id: createId("clip"),
    trackId,
    type: "shape",
    name: scene.title,
    startMs: scene.startMs,
    durationMs:
      scene.durationMs,
    trimStartMs: 0,
    trimEndMs: 0,
    playbackRate: 1,
    layer,
    locked: false,
    hidden: false,
    transform:
      getCanvasTransform(
        variant.width,
        variant.height,
      ),
    style: {
      backgroundColor:
        scene.backgroundColor ??
        variant.backgroundColor ??
        DEFAULT_BACKGROUND_COLOUR,
    },
    content:
      scene.visualDirection,
    keyframes: [],
    metadata: {
      generated: true,
      generatedBy:
        "beacon-studio-ai",
      campaignVariantId:
        variant.id,
      format:
        variant.format,
      aspectRatio:
        variant.aspectRatio,
      width:
        variant.width,
      height:
        variant.height,
      sceneId:
        scene.id,
      sourceSceneId:
        scene.sourceSceneId,
      visualDirection:
        scene.visualDirection,
      imagePrompt:
        scene.imagePrompt,
      videoPrompt:
        scene.videoPrompt,
      audioPrompt:
        scene.audioPrompt,
      pendingVisualGeneration:
        Boolean(
          scene.imagePrompt ||
            scene.videoPrompt,
        ),
    },
  };
}

function createTextClip(
  trackId: string,
  scene: StudioGeneratedScene,
  variant: StudioCampaignVariant,
  layer: number,
): StudioClip | null {
  const content =
    cleanText(
      scene.onScreenText,
    );

  if (!content) {
    return null;
  }

  return {
    id: createId("clip"),
    trackId,
    type: "text",
    name: `${scene.title} text`,
    startMs: scene.startMs,
    durationMs:
      scene.durationMs,
    trimStartMs: 0,
    trimEndMs: 0,
    playbackRate: 1,
    layer,
    locked: false,
    hidden: false,
    transform:
      getTextTransform(
        variant.width,
        variant.height,
      ),
    style: {
      color: "#ffffff",
      fontSize:
        getResponsiveFontSize(
          variant.width,
          variant.height,
        ),
      fontWeight: 700,
      lineHeight: 1.08,
      textAlign: "centre",
    },
    content,
    keyframes: [],
    metadata: {
      generated: true,
      generatedBy:
        "beacon-studio-ai",
      campaignVariantId:
        variant.id,
      format:
        variant.format,
      sceneId:
        scene.id,
      sourceSceneId:
        scene.sourceSceneId,
      safeZone: {
        left: 0.08,
        right: 0.08,
        top: 0.12,
        bottom: 0.12,
      },
    },
  };
}

function createVoiceClip(
  trackId: string,
  scene: StudioGeneratedScene,
  variant: StudioCampaignVariant,
  layer: number,
): StudioClip | null {
  const narration =
    cleanText(
      scene.narration,
    );

  if (!narration) {
    return null;
  }

  return {
    id: createId("clip"),
    trackId,
    type: "voice",
    name: `${scene.title} voiceover`,
    startMs: scene.startMs,
    durationMs:
      scene.durationMs,
    trimStartMs: 0,
    trimEndMs: 0,
    playbackRate: 1,
    layer,
    locked: false,
    hidden: false,
    transform:
      getCanvasTransform(
        variant.width,
        variant.height,
      ),
    audio: {
      muted: false,
      volume: 1,
      pan: 0,
      fadeInMs: 100,
      fadeOutMs: 100,
    },
    content: narration,
    keyframes: [],
    metadata: {
      generated: true,
      generatedBy:
        "beacon-studio-ai",
      campaignVariantId:
        variant.id,
      format:
        variant.format,
      sceneId:
        scene.id,
      sourceSceneId:
        scene.sourceSceneId,
      pendingVoiceGeneration:
        true,
      voiceScript:
        narration,
    },
  };
}

function createVisualTrack(
  variant: StudioCampaignVariant,
  scenes: StudioGeneratedScene[],
): StudioTrack {
  const trackId =
    createId("track");

  return {
    id: trackId,
    name: `${getStudioOutputFormat(variant.format).label} visuals`,
    type: "video",
    order: 0,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    height: 84,
    clips: scenes.map(
      (
        scene,
        index,
      ) =>
        createVisualClip(
          trackId,
          scene,
          variant,
          index,
        ),
    ),
  };
}

function createTextTrack(
  variant: StudioCampaignVariant,
  scenes: StudioGeneratedScene[],
): StudioTrack | null {
  const trackId =
    createId("track");

  const clips = scenes
    .map(
      (
        scene,
        index,
      ) =>
        createTextClip(
          trackId,
          scene,
          variant,
          100 + index,
        ),
    )
    .filter(
      (
        clip,
      ): clip is StudioClip =>
        Boolean(clip),
    );

  if (clips.length === 0) {
    return null;
  }

  return {
    id: trackId,
    name: `${getStudioOutputFormat(variant.format).label} text`,
    type: "overlay",
    order: 1,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    height: 72,
    clips,
  };
}

function createVoiceTrack(
  variant: StudioCampaignVariant,
  scenes: StudioGeneratedScene[],
): StudioTrack | null {
  const trackId =
    createId("track");

  const clips = scenes
    .map(
      (
        scene,
        index,
      ) =>
        createVoiceClip(
          trackId,
          scene,
          variant,
          200 + index,
        ),
    )
    .filter(
      (
        clip,
      ): clip is StudioClip =>
        Boolean(clip),
    );

  if (clips.length === 0) {
    return null;
  }

  return {
    id: trackId,
    name: `${getStudioOutputFormat(variant.format).label} voiceover`,
    type: "voice",
    order: 2,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    height: 72,
    clips,
  };
}

function normaliseTrackOrder(
  tracks: StudioTrack[],
): StudioTrack[] {
  return tracks.map(
    (
      track,
      index,
    ) => ({
      ...track,
      order: index,
    }),
  );
}

export function normaliseCampaignVariant(
  variant: StudioCampaignVariant,
): StudioCampaignVariant {
  const format =
    getStudioOutputFormat(
      variant.format,
    );

  const scenes =
    normaliseScenes(
      variant.scenes,
      variant.durationMs,
    );

  return {
    ...variant,
    id:
      cleanText(variant.id) ??
      createId("variant"),
    title:
      cleanText(
        variant.title,
      ) ??
      format.label,
    summary:
      cleanText(
        variant.summary,
      ),
    aspectRatio:
      variant.aspectRatio ??
      format.aspectRatio,
    width:
      Number.isFinite(
        variant.width,
      ) &&
      variant.width > 0
        ? Math.round(
            variant.width,
          )
        : format.width,
    height:
      Number.isFinite(
        variant.height,
      ) &&
      variant.height > 0
        ? Math.round(
            variant.height,
          )
        : format.height,
    durationMs:
      getTimelineDuration(
        scenes,
        clampDuration(
          variant.durationMs,
        ),
      ),
    backgroundColor:
      cleanText(
        variant.backgroundColor,
      ) ??
      DEFAULT_BACKGROUND_COLOUR,
    scenes,
    suggestedCaption:
      cleanText(
        variant.suggestedCaption,
      ),
    suggestedHashtags:
      variant.suggestedHashtags
        ?.map(
          (hashtag) =>
            cleanText(
              hashtag,
            ),
        )
        .filter(
          (
            hashtag,
          ): hashtag is string =>
            Boolean(hashtag),
        ),
    generationNotes:
      variant.generationNotes
        ?.map(
          (note) =>
            cleanText(note),
        )
        .filter(
          (
            note,
          ): note is string =>
            Boolean(note),
        ),
  };
}

export function variantToStudioTimeline(
  inputVariant: StudioCampaignVariant,
): StudioTimeline {
  const variant =
    normaliseCampaignVariant(
      inputVariant,
    );

  const visualTrack =
    createVisualTrack(
      variant,
      variant.scenes,
    );

  const textTrack =
    createTextTrack(
      variant,
      variant.scenes,
    );

  const voiceTrack =
    createVoiceTrack(
      variant,
      variant.scenes,
    );

  const tracks =
    normaliseTrackOrder(
      [
        visualTrack,
        textTrack,
        voiceTrack,
      ].filter(
        (
          track,
        ): track is StudioTrack =>
          Boolean(track),
      ),
    );

  return {
    durationMs:
      variant.durationMs,
    playheadMs: 0,
    zoom: 1,
    scrollLeft: 0,
    snappingEnabled: true,
    snapThresholdPx: 8,
    tracks,
    inPointMs: 0,
    outPointMs:
      variant.durationMs,
  };
}

export function campaignToStudioTimelines(
  plan: StudioCampaignPlan,
): StudioPlannedVariant[] {
  return plan.variants.map(
    (variant) => {
      const normalisedVariant =
        normaliseCampaignVariant(
          variant,
        );

      return {
        variant:
          normalisedVariant,
        timeline:
          variantToStudioTimeline(
            normalisedVariant,
          ),
      };
    },
  );
}

export function getPrimaryCampaignVariant(
  plan: StudioCampaignPlan,
  preferredFormat?: StudioOutputFormatId,
): StudioCampaignVariant {
  if (
    plan.variants.length === 0
  ) {
    const fallbackFormat =
      getPrimaryStudioFormat(
        preferredFormat
          ? [preferredFormat]
          : [
              "instagram-reel",
            ],
      );

    return normaliseCampaignVariant(
      {
        id: createId("variant"),
        format:
          fallbackFormat.id,
        title:
          plan.title ||
          fallbackFormat.label,
        summary:
          plan.summary,
        aspectRatio:
          fallbackFormat.aspectRatio,
        width:
          fallbackFormat.width,
        height:
          fallbackFormat.height,
        durationMs:
          plan.durationMs,
        backgroundColor:
          plan.backgroundColor,
        scenes:
          plan.sharedScenes,
        suggestedCaption:
          plan.suggestedCaption,
        suggestedHashtags:
          plan.suggestedHashtags,
        generationNotes:
          plan.generationNotes,
      },
    );
  }

  const preferredVariant =
    preferredFormat
      ? plan.variants.find(
          (variant) =>
            variant.format ===
            preferredFormat,
        )
      : undefined;

  return normaliseCampaignVariant(
    preferredVariant ??
      plan.variants[0],
  );
}

export function planToStudioTimeline(
  plan: StudioCampaignPlan,
  preferredFormat?: StudioOutputFormatId,
): StudioTimeline {
  return variantToStudioTimeline(
    getPrimaryCampaignVariant(
      plan,
      preferredFormat,
    ),
  );
}