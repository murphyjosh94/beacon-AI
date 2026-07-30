import { NextResponse } from "next/server";

import {
  buildStudioSystemPrompt,
  buildStudioUserPrompt,
  getStudioOutputFormat,
  normaliseStudioBrief,
  STUDIO_OUTPUT_FORMATS,
  type StudioAspectRatio,
  type StudioGenerationBrief,
  type StudioOutputFormatId,
} from "@/app/studio/_engine/PromptBuilder";

import type {
  StudioCampaignPlan,
  StudioCampaignVariant,
  StudioGeneratedScene,
} from "@/app/studio/_engine/ScenePlanner";

import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/services/openai/OpenAIClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OUTPUT_FORMAT_IDS = Object.keys(
  STUDIO_OUTPUT_FORMATS,
) as StudioOutputFormatId[];

const SCENE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "title",
    "startMs",
    "durationMs",
    "visualDirection",
    "onScreenText",
    "narration",
    "imagePrompt",
    "videoPrompt",
    "audioPrompt",
    "backgroundColor",
    "sourceSceneId",
  ],
  properties: {
    id: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },

    title: {
      type: "string",
      minLength: 1,
      maxLength: 140,
    },

    startMs: {
      type: "integer",
      minimum: 0,
      maximum: 1_800_000,
    },

    durationMs: {
      type: "integer",
      minimum: 250,
      maximum: 1_800_000,
    },

    visualDirection: {
      type: "string",
      minLength: 1,
      maxLength: 2_000,
    },

    onScreenText: {
      type: "string",
      maxLength: 600,
    },

    narration: {
      type: "string",
      maxLength: 2_000,
    },

    imagePrompt: {
      type: "string",
      maxLength: 2_000,
    },

    videoPrompt: {
      type: "string",
      maxLength: 2_000,
    },

    audioPrompt: {
      type: "string",
      maxLength: 1_500,
    },

    backgroundColor: {
      type: "string",
      maxLength: 50,
    },

    sourceSceneId: {
      type: "string",
      maxLength: 100,
    },
  },
} as const;

const VARIANT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "format",
    "title",
    "summary",
    "aspectRatio",
    "width",
    "height",
    "durationMs",
    "backgroundColor",
    "scenes",
    "suggestedCaption",
    "suggestedHashtags",
    "generationNotes",
  ],
  properties: {
    id: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },

    format: {
      type: "string",
      enum: OUTPUT_FORMAT_IDS,
    },

    title: {
      type: "string",
      minLength: 1,
      maxLength: 140,
    },

    summary: {
      type: "string",
      maxLength: 600,
    },

    aspectRatio: {
      type: "string",
      enum: [
        "16:9",
        "9:16",
        "1:1",
        "4:5",
        "3:2",
        "2:3",
      ],
    },

    width: {
      type: "integer",
      minimum: 1,
      maximum: 10_000,
    },

    height: {
      type: "integer",
      minimum: 1,
      maximum: 10_000,
    },

    durationMs: {
      type: "integer",
      minimum: 1_000,
      maximum: 1_800_000,
    },

    backgroundColor: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },

    scenes: {
      type: "array",
      minItems: 1,
      maxItems: 60,
      items: SCENE_SCHEMA,
    },

    suggestedCaption: {
      type: "string",
      maxLength: 2_200,
    },

    suggestedHashtags: {
      type: "array",
      maxItems: 30,
      items: {
        type: "string",
        maxLength: 100,
      },
    },

    generationNotes: {
      type: "array",
      maxItems: 30,
      items: {
        type: "string",
        maxLength: 600,
      },
    },
  },
} as const;

const CAMPAIGN_PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "coreMessage",
    "supportingMessage",
    "callToAction",
    "visualDirection",
    "backgroundColor",
    "durationMs",
    "sharedScenes",
    "variants",
    "suggestedCaption",
    "suggestedHashtags",
    "generationNotes",
  ],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 140,
    },

    summary: {
      type: "string",
      minLength: 1,
      maxLength: 700,
    },

    coreMessage: {
      type: "string",
      minLength: 1,
      maxLength: 700,
    },

    supportingMessage: {
      type: "string",
      maxLength: 700,
    },

    callToAction: {
      type: "string",
      maxLength: 300,
    },

    visualDirection: {
      type: "string",
      minLength: 1,
      maxLength: 2_000,
    },

    backgroundColor: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },

    durationMs: {
      type: "integer",
      minimum: 1_000,
      maximum: 1_800_000,
    },

    sharedScenes: {
      type: "array",
      minItems: 1,
      maxItems: 60,
      items: SCENE_SCHEMA,
    },

    variants: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: VARIANT_SCHEMA,
    },

    suggestedCaption: {
      type: "string",
      maxLength: 2_200,
    },

    suggestedHashtags: {
      type: "array",
      maxItems: 30,
      items: {
        type: "string",
        maxLength: 100,
      },
    },

    generationNotes: {
      type: "array",
      maxItems: 30,
      items: {
        type: "string",
        maxLength: 600,
      },
    },
  },
} as const;

function jsonError(
  message: string,
  status: number,
): Response {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isStudioOutputFormatId(
  value: unknown,
): value is StudioOutputFormatId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      STUDIO_OUTPUT_FORMATS,
      value,
    )
  );
}

function isBrief(
  value: unknown,
): value is StudioGenerationBrief {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.prompt !== "string" ||
    value.prompt.trim().length === 0
  ) {
    return false;
  }

  if (
    !Array.isArray(value.formats) ||
    value.formats.length === 0 ||
    !value.formats.every(
      isStudioOutputFormatId,
    )
  ) {
    return false;
  }

  if (
    typeof value.quality !== "string"
  ) {
    return false;
  }

  if (
    typeof value.outputCount !== "number" ||
    !Number.isFinite(
      value.outputCount,
    )
  ) {
    return false;
  }

  if (
    value.durationMs !== undefined &&
    (
      typeof value.durationMs !== "number" ||
      !Number.isFinite(
        value.durationMs,
      )
    )
  ) {
    return false;
  }

  return true;
}

function cleanString(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value
    .trim()
    .replace(/\s+/g, " ");

  return cleaned || undefined;
}

function cleanStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      cleanString(item),
    )
    .filter(
      (
        item,
      ): item is string =>
        Boolean(item),
    );
}

function createId(
  prefix: string,
): string {
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

function normaliseDuration(
  value: unknown,
  fallback: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.min(
    Math.max(
      Math.round(value),
      1_000,
    ),
    1_800_000,
  );
}

function normaliseScenes(
  value: unknown,
  fallbackDurationMs: number,
): StudioGeneratedScene[] {
  if (
    !Array.isArray(value) ||
    value.length === 0
  ) {
    return [
      {
        id: createId("scene"),
        title: "Campaign scene",
        startMs: 0,
        durationMs:
          fallbackDurationMs,
        visualDirection:
          "Create a suitable branded campaign visual.",
      },
    ];
  }

  let nextStartMs = 0;

  return value
    .filter(isRecord)
    .map(
      (
        scene,
        index,
      ): StudioGeneratedScene => {
        const durationMs =
          normaliseDuration(
            scene.durationMs,
            Math.max(
              1_000,
              Math.round(
                fallbackDurationMs /
                  Math.max(
                    value.length,
                    1,
                  ),
              ),
            ),
          );

        const result: StudioGeneratedScene =
          {
            id:
              cleanString(scene.id) ??
              createId("scene"),

            title:
              cleanString(
                scene.title,
              ) ??
              `Scene ${index + 1}`,

            startMs:
              nextStartMs,

            durationMs,

            visualDirection:
              cleanString(
                scene.visualDirection,
              ) ??
              "Create a suitable branded campaign visual.",

            onScreenText:
              cleanString(
                scene.onScreenText,
              ),

            narration:
              cleanString(
                scene.narration,
              ),

            imagePrompt:
              cleanString(
                scene.imagePrompt,
              ),

            videoPrompt:
              cleanString(
                scene.videoPrompt,
              ),

            audioPrompt:
              cleanString(
                scene.audioPrompt,
              ),

            backgroundColor:
              cleanString(
                scene.backgroundColor,
              ),

            sourceSceneId:
              cleanString(
                scene.sourceSceneId,
              ),
          };

        nextStartMs +=
          durationMs;

        return result;
      },
    );
}

function getScenesDuration(
  scenes: StudioGeneratedScene[],
): number {
  return scenes.reduce(
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
}

function normaliseVariant(
  value: unknown,
  formatId: StudioOutputFormatId,
  sharedScenes: StudioGeneratedScene[],
  campaignDurationMs: number,
  campaignBackgroundColor: string,
  campaignTitle: string,
): StudioCampaignVariant {
  const format =
    getStudioOutputFormat(
      formatId,
    );

  const record =
    isRecord(value)
      ? value
      : {};

  const requestedDurationMs =
    normaliseDuration(
      record.durationMs,
      format.defaultDurationMs ??
        campaignDurationMs,
    );

  const scenes =
    normaliseScenes(
      record.scenes,
      requestedDurationMs,
    );

  const durationMs =
    Math.max(
      requestedDurationMs,
      getScenesDuration(scenes),
    );

  return {
    id:
      cleanString(record.id) ??
      createId("variant"),

    format:
      formatId,

    title:
      cleanString(
        record.title,
      ) ??
      `${campaignTitle} — ${format.label}`,

    summary:
      cleanString(
        record.summary,
      ),

    aspectRatio:
      format.aspectRatio,

    width:
      format.width,

    height:
      format.height,

    durationMs,

    backgroundColor:
      cleanString(
        record.backgroundColor,
      ) ??
      campaignBackgroundColor,

    scenes:
      scenes.length > 0
        ? scenes
        : sharedScenes,

    suggestedCaption:
      cleanString(
        record.suggestedCaption,
      ),

    suggestedHashtags:
      cleanStringArray(
        record.suggestedHashtags,
      ),

    generationNotes:
      cleanStringArray(
        record.generationNotes,
      ),
  };
}

function normaliseCampaignPlan(
  value: unknown,
  brief: StudioGenerationBrief,
): StudioCampaignPlan {
  if (!isRecord(value)) {
    throw new Error(
      "OpenAI returned an invalid campaign plan.",
    );
  }

  const campaignDurationMs =
    normaliseDuration(
      value.durationMs,
      brief.durationMs ??
        15_000,
    );

  const title =
    cleanString(value.title) ??
    "Beacon Studio campaign";

  const summary =
    cleanString(value.summary) ??
    brief.prompt;

  const coreMessage =
    cleanString(
      value.coreMessage,
    ) ??
    brief.prompt;

  const visualDirection =
    cleanString(
      value.visualDirection,
    ) ??
    "Create a consistent branded campaign across all selected formats.";

  const backgroundColor =
    cleanString(
      value.backgroundColor,
    ) ??
    "#020617";

  const sharedScenes =
    normaliseScenes(
      value.sharedScenes,
      campaignDurationMs,
    );

  const rawVariants =
    Array.isArray(
      value.variants,
    )
      ? value.variants.filter(
          isRecord,
        )
      : [];

  const variants =
    brief.formats.map(
      (formatId) => {
        const matchingVariant =
          rawVariants.find(
            (variant) =>
              variant.format ===
              formatId,
          );

        return normaliseVariant(
          matchingVariant,
          formatId,
          sharedScenes,
          campaignDurationMs,
          backgroundColor,
          title,
        );
      },
    );

  return {
    title,

    summary,

    coreMessage,

    supportingMessage:
      cleanString(
        value.supportingMessage,
      ),

    callToAction:
      cleanString(
        value.callToAction,
      ),

    visualDirection,

    backgroundColor,

    durationMs:
      Math.max(
        campaignDurationMs,
        getScenesDuration(
          sharedScenes,
        ),
      ),

    sharedScenes,

    variants,

    suggestedCaption:
      cleanString(
        value.suggestedCaption,
      ),

    suggestedHashtags:
      cleanStringArray(
        value.suggestedHashtags,
      ),

    generationNotes:
      cleanStringArray(
        value.generationNotes,
      ),
  };
}

export async function POST(
  request: Request,
): Promise<Response> {
  try {
    const contentType =
      request.headers.get(
        "content-type",
      );

    if (
      !contentType?.includes(
        "application/json",
      )
    ) {
      return jsonError(
        "Expected an application/json request body.",
        415,
      );
    }

    let rawBody: unknown;

    try {
      rawBody =
        await request.json();
    } catch {
      return jsonError(
        "The request body is not valid JSON.",
        400,
      );
    }

    if (!isBrief(rawBody)) {
      return jsonError(
        "A prompt, at least one valid format, quality and output count are required.",
        400,
      );
    }

    const brief =
      normaliseStudioBrief(
        rawBody,
      );

    if (
      brief.prompt.length >
      6_000
    ) {
      return jsonError(
        "The Studio prompt is too long.",
        400,
      );
    }

    if (
      brief.formats.length >
      20
    ) {
      return jsonError(
        "Too many output formats were selected.",
        400,
      );
    }

    const client =
      getOpenAIClient();

    const response =
      await client.responses.create(
        {
          model:
            getOpenAIModel(),

          instructions:
            buildStudioSystemPrompt(),

          input:
            buildStudioUserPrompt(
              brief,
            ),

          text: {
            format: {
              type: "json_schema",

              name:
                "beacon_studio_campaign_plan",

              strict: true,

              schema:
                CAMPAIGN_PLAN_SCHEMA,
            },
          },
        },
      );

    const outputText =
      response.output_text?.trim();

    if (!outputText) {
      return jsonError(
        "OpenAI returned an empty Studio campaign.",
        502,
      );
    }

    let rawPlan: unknown;

    try {
      rawPlan =
        JSON.parse(outputText);
    } catch {
      return jsonError(
        "OpenAI returned an invalid Studio campaign.",
        502,
      );
    }

    const plan =
      normaliseCampaignPlan(
        rawPlan,
        brief,
      );

    return NextResponse.json(
      {
        plan,

        assets: [],

        usage: {
          inputTokens:
            response.usage
              ?.input_tokens,

          outputTokens:
            response.usage
              ?.output_tokens,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[studio-generate:post]",
      error,
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Beacon Studio could not generate the campaign.",
      500,
    );
  }
}