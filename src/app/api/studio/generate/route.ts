import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import {
  getAccessErrorStatus,
  hasUnrestrictedBeaconAccess,
  requireSignedInAccount,
} from "@/lib/auth/AdminAccess";
import { database } from "@/lib/database/Database";
import {
  studioCreditLedger,
  studioGeneration,
  studioProject,
  user,
} from "@/lib/database/schema";

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

type StudioCreditBalances = {
  purchased: number;
  studioMembership: number;
  business: number;
};

class InsufficientStudioCreditsError extends Error {
  readonly status = 402;

  constructor(
    readonly required: number,
    readonly available: number,
  ) {
    super(
      `This generation requires ${required} Studio Credits, but only ${available} are available.`,
    );

    this.name =
      "InsufficientStudioCreditsError";
  }
}

function safeInteger(
  value: unknown,
  fallback = 0,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.round(value),
  );
}

function calculateStudioCreditCost(
  rawBody: Record<string, unknown>,
  brief: StudioGenerationBrief,
): number {
  const confirmedCost =
    safeInteger(
      rawBody.confirmedCreditCost,
    );

  if (confirmedCost > 0) {
    return Math.min(
      confirmedCost,
      100_000,
    );
  }

  const qualityMultiplier =
  brief.quality === "maximum"
    ? 3.2
    : brief.quality === "high"
      ? 1.8
      : brief.quality === "standard"
        ? 1.25
        : 1;

  const outputCount =
    Math.min(
      Math.max(
        safeInteger(
          brief.outputCount,
          1,
        ),
        1,
      ),
      20,
    );

  const outputMultiplier =
    outputCount >= 4
      ? 3.4
      : outputCount >= 2
        ? 1.85
        : 1;

  const formatMultiplier =
    Math.max(
      1,
      brief.formats.length,
    );

  return Math.max(
    1,
    Math.ceil(
      6 *
        qualityMultiplier *
        outputMultiplier *
        formatMultiplier,
    ),
  );
}

function getProjectTitle(
  rawBody: Record<string, unknown>,
  brief: StudioGenerationBrief,
): string {
  const requestedTitle =
    cleanString(
      rawBody.project,
    ) ??
    cleanString(
      rawBody.projectTitle,
    );

  if (requestedTitle) {
    return requestedTitle.slice(
      0,
      140,
    );
  }

  return brief.prompt
    .slice(
      0,
      90,
    )
    .trim() ||
    "Beacon Studio campaign";
}

function getTotalBalance(
  balances: StudioCreditBalances,
): number {
  return (
    balances.purchased +
    balances.studioMembership +
    balances.business
  );
}

function deductStudioCredits(
  balances: StudioCreditBalances,
  creditCost: number,
): StudioCreditBalances {
  let remaining =
    creditCost;

  const businessUsed =
    Math.min(
      balances.business,
      remaining,
    );

  remaining -=
    businessUsed;

  const studioMembershipUsed =
    Math.min(
      balances.studioMembership,
      remaining,
    );

  remaining -=
    studioMembershipUsed;

  const purchasedUsed =
    Math.min(
      balances.purchased,
      remaining,
    );

  remaining -=
    purchasedUsed;

  if (remaining > 0) {
    throw new InsufficientStudioCreditsError(
      creditCost,
      getTotalBalance(
        balances,
      ),
    );
  }

  return {
    business:
      balances.business -
      businessUsed,

    studioMembership:
      balances.studioMembership -
      studioMembershipUsed,

    purchased:
      balances.purchased -
      purchasedUsed,
  };
}

function asJsonRecord(
  value: unknown,
): Record<string, unknown> {
  if (isRecord(value)) {
    return value;
  }

  return {
    value,
  };
}

export async function POST(
  request: Request,
): Promise<Response> {
  let projectId:
    | string
    | null =
    null;

  let generationId:
    | string
    | null =
    null;

  try {
    const account =
      await requireSignedInAccount();

    const administratorBypass =
      hasUnrestrictedBeaconAccess(
        account,
      );

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

    const creditCost =
      administratorBypass
        ? 0
        : calculateStudioCreditCost(
            rawBody,
            brief,
          );

    if (
      !administratorBypass
    ) {
      const balances =
        await database
          .select({
            purchased:
              user.studioPurchasedCredits,

            studioMembership:
              user.studioMembershipCreditsAllowance,

            business:
              user.businessStudioCreditsAllowance,
          })
          .from(user)
          .where(
            eq(
              user.id,
              account.id,
            ),
          )
          .limit(1);

      const current =
        balances[0];

      if (!current) {
        return jsonError(
          "Your Beacon account could not be loaded.",
          404,
        );
      }

      const available =
        getTotalBalance({
          purchased:
            current.purchased,

          studioMembership:
            current.studioMembership,

          business:
            current.business,
        });

      if (
        available <
        creditCost
      ) {
        return NextResponse.json(
          {
            error:
              `This generation requires ${creditCost} Studio Credits, but only ${available} are available.`,

            code:
              "INSUFFICIENT_STUDIO_CREDITS",

            requiredCredits:
              creditCost,

            availableCredits:
              available,
          },
          {
            status: 402,
            headers: {
              "Cache-Control":
                "no-store",
            },
          },
        );
      }
    }

    const now =
      new Date();

    const created =
      await database.transaction(
        async (tx) => {
          const projects =
            await tx
              .insert(
                studioProject,
              )
              .values({
                userId:
                  account.id,

                title:
                  getProjectTitle(
                    rawBody,
                    brief,
                  ),

                description:
                  brief.prompt,

                status:
                  "generating",

                brief:
                  asJsonRecord(
                    brief,
                  ),

                createdAt:
                  now,

                updatedAt:
                  now,
              })
              .returning({
                id:
                  studioProject.id,
              });

          const project =
            projects[0];

          if (!project) {
            throw new Error(
              "Beacon Studio could not create the project.",
            );
          }

          const generations =
            await tx
              .insert(
                studioGeneration,
              )
              .values({
                projectId:
                  project.id,

                userId:
                  account.id,

                status:
                  "processing",

                creditCost,

                administratorBypass,

                model:
                  getOpenAIModel(),

                requestPayload:
                  asJsonRecord(
                    brief,
                  ),

                startedAt:
                  now,

                createdAt:
                  now,
              })
              .returning({
                id:
                  studioGeneration.id,
              });

          const generation =
            generations[0];

          if (!generation) {
            throw new Error(
              "Beacon Studio could not create the generation record.",
            );
          }

          return {
            projectId:
              project.id,

            generationId:
              generation.id,
          };
        },
      );

    projectId =
      created.projectId;

    generationId =
      created.generationId;

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
      throw new Error(
        "OpenAI returned an empty Studio campaign.",
      );
    }

    let rawPlan: unknown;

    try {
      rawPlan =
        JSON.parse(
          outputText,
        );
    } catch {
      throw new Error(
        "OpenAI returned an invalid Studio campaign.",
      );
    }

    const plan =
      normaliseCampaignPlan(
        rawPlan,
        brief,
      );

    const completedAt =
      new Date();

    const balancesAfter =
      await database.transaction(
        async (tx) => {
          let purchasedAfter =
            0;

          let studioMembershipAfter =
            0;

          let businessAfter =
            0;

          if (
            !administratorBypass
          ) {
            const accountRows =
              await tx
                .select({
                  purchased:
                    user.studioPurchasedCredits,

                  studioMembership:
                    user.studioMembershipCreditsAllowance,

                  business:
                    user.businessStudioCreditsAllowance,
                })
                .from(user)
                .where(
                  eq(
                    user.id,
                    account.id,
                  ),
                )
                .limit(1)
                .for(
                  "update",
                );

            const current =
              accountRows[0];

            if (!current) {
              throw new Error(
                "Your Beacon account could not be loaded.",
              );
            }

            const next =
              deductStudioCredits(
                {
                  purchased:
                    current.purchased,

                  studioMembership:
                    current.studioMembership,

                  business:
                    current.business,
                },
                creditCost,
              );

            purchasedAfter =
              next.purchased;

            studioMembershipAfter =
              next.studioMembership;

            businessAfter =
              next.business;

            await tx
              .update(user)
              .set({
                studioPurchasedCredits:
                  purchasedAfter,

                studioMembershipCreditsAllowance:
                  studioMembershipAfter,

                businessStudioCreditsAllowance:
                  businessAfter,

                updatedAt:
                  completedAt,
              })
              .where(
                eq(
                  user.id,
                  account.id,
                ),
              );

            await tx
              .insert(
                studioCreditLedger,
              )
              .values({
                userId:
                  account.id,

                type:
                  "generation",

                amount:
                  -creditCost,

                purchasedBalanceAfter:
                  purchasedAfter,

                studioMembershipAllowanceAfter:
                  studioMembershipAfter,

                businessAllowanceAfter:
                  businessAfter,

                totalAvailableAfter:
                  purchasedAfter +
                  studioMembershipAfter +
                  businessAfter,

                description:
                  `Beacon Studio generation: ${plan.title}`,

                studioProjectId:
                  projectId,

                studioGenerationId:
                  generationId,

                metadata: {
                  model:
                    getOpenAIModel(),

                  quality:
                    brief.quality,

                  outputCount:
                    brief.outputCount,

                  formatCount:
                    brief.formats.length,
                },

                createdAt:
                  completedAt,
              });
          }

          await tx
            .update(
              studioProject,
            )
            .set({
              title:
                plan.title,

              description:
                plan.summary,

              status:
                "ready",

              campaignPlan:
                asJsonRecord(
                  plan,
                ),

              selectedVariantId:
                plan.variants[0]
                  ?.id ??
                null,

              updatedAt:
                completedAt,

              lastOpenedAt:
                completedAt,
            })
            .where(
              eq(
                studioProject.id,
                projectId!,
              ),
            );

          await tx
            .update(
              studioGeneration,
            )
            .set({
              status:
                "completed",

              inputTokens:
                response.usage
                  ?.input_tokens ??
                null,

              outputTokens:
                response.usage
                  ?.output_tokens ??
                null,

              responsePayload:
                asJsonRecord(
                  plan,
                ),

              completedAt,
            })
            .where(
              eq(
                studioGeneration.id,
                generationId!,
              ),
            );

          return {
            purchased:
              purchasedAfter,

            studioMembership:
              studioMembershipAfter,

            business:
              businessAfter,
          };
        },
      );

    return NextResponse.json(
      {
        projectId,

        generationId,

        plan,

        assets: [],

        creditCost,

        administratorBypass,

        balances:
          administratorBypass
            ? null
            : {
                ...balancesAfter,

                total:
                  getTotalBalance(
                    balancesAfter,
                  ),
              },

        usage: {
          inputTokens:
            response.usage
              ?.input_tokens,

          outputTokens:
            response.usage
              ?.output_tokens,

          estimatedCredits:
            creditCost,
        },
      },
      {
        status: 201,
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

    if (
      projectId &&
      generationId
    ) {
      const failedAt =
        new Date();

      try {
        await database.transaction(
          async (tx) => {
            await tx
              .update(
                studioProject,
              )
              .set({
                status:
                  "failed",

                updatedAt:
                  failedAt,
              })
              .where(
                eq(
                  studioProject.id,
                  projectId!,
                ),
              );

            await tx
              .update(
                studioGeneration,
              )
              .set({
                status:
                  "failed",

                errorMessage:
                  error instanceof Error
                    ? error.message
                    : "Beacon Studio generation failed.",

                completedAt:
                  failedAt,
              })
              .where(
                eq(
                  studioGeneration.id,
                  generationId!,
                ),
              );
          },
        );
      } catch (
        persistenceError
      ) {
        console.error(
          "[studio-generate:failure-persistence]",
          persistenceError,
        );
      }
    }

    const accessStatus =
      getAccessErrorStatus(
        error,
      );

    if (accessStatus) {
      return jsonError(
        error instanceof Error
          ? error.message
          : "Access denied.",
        accessStatus,
      );
    }

    if (
      error instanceof
      InsufficientStudioCreditsError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,

          code:
            "INSUFFICIENT_STUDIO_CREDITS",

          requiredCredits:
            error.required,

          availableCredits:
            error.available,
        },
        {
          status:
            error.status,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    return jsonError(
      error instanceof Error
        ? error.message
        : "Beacon Studio could not generate the campaign.",
      500,
    );
  }
}