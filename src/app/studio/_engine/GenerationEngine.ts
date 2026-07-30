import type {
  StudioActions,
  StudioAsset,
  StudioProject,
} from "../StudioProvider";

import {
  importGeneratedAssets,
  type GeneratedAssetDescriptor,
} from "./AssetImporter";

import {
  getPrimaryStudioFormat,
  type StudioGenerationBrief,
  type StudioOutputFormatId,
} from "./PromptBuilder";

import {
  campaignToStudioTimelines,
  getPrimaryCampaignVariant,
  variantToStudioTimeline,
  type StudioCampaignPlan,
  type StudioCampaignVariant,
  type StudioPlannedVariant,
} from "./ScenePlanner";

export type StudioGenerationUsage = {
  inputTokens?: number;
  outputTokens?: number;
  estimatedCredits?: number;
};

export type StudioGenerationResponse = {
  plan: StudioCampaignPlan;
  assets?: GeneratedAssetDescriptor[];
  usage?: StudioGenerationUsage;
};

export type StudioGenerationResult = {
  plan: StudioCampaignPlan;
  primaryVariant: StudioCampaignVariant;
  variants: StudioPlannedVariant[];
  assets: StudioAsset[];
  usage?: StudioGenerationUsage;
};

export type GenerateIntoStudioOptions = {
  brief: StudioGenerationBrief;
  project: StudioProject;
  actions: StudioActions;
  preferredFormat?: StudioOutputFormatId;
  signal?: AbortSignal;
};

function readString(
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

function readStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      readString(item),
    )
    .filter(
      (
        item,
      ): item is string =>
        Boolean(item),
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

function getErrorMessage(
  value: unknown,
): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const directError =
    readString(value.error);

  if (directError) {
    return directError;
  }

  const message =
    readString(value.message);

  if (message) {
    return message;
  }

  if (isRecord(value.error)) {
    return (
      readString(
        value.error.message,
      ) ??
      readString(
        value.error.code,
      )
    );
  }

  return undefined;
}

async function readResponseError(
  response: Response,
): Promise<string> {
  try {
    const body =
      (await response.json()) as unknown;

    const message =
      getErrorMessage(body);

    if (message) {
      return message;
    }
  } catch {
    try {
      const body =
        await response.text();

      const message =
        readString(body);

      if (message) {
        return message;
      }
    } catch {
      // The response did not contain a readable error body.
    }
  }

  return `Beacon Studio generation failed with status ${response.status}.`;
}

function isCampaignPlan(
  value: unknown,
): value is StudioCampaignPlan {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title ===
      "string" &&
    typeof value.summary ===
      "string" &&
    typeof value.coreMessage ===
      "string" &&
    typeof value.visualDirection ===
      "string" &&
    typeof value.backgroundColor ===
      "string" &&
    typeof value.durationMs ===
      "number" &&
    Number.isFinite(
      value.durationMs,
    ) &&
    Array.isArray(
      value.sharedScenes,
    ) &&
    Array.isArray(
      value.variants,
    )
  );
}

function normaliseGenerationResponse(
  value: unknown,
): StudioGenerationResponse {
  if (!isRecord(value)) {
    throw new Error(
      "Beacon Studio returned an invalid generation response.",
    );
  }

  if (
    !isCampaignPlan(value.plan)
  ) {
    throw new Error(
      "Beacon Studio returned an invalid campaign plan.",
    );
  }

  const usage =
    isRecord(value.usage)
      ? {
          inputTokens:
            typeof value.usage
              .inputTokens ===
              "number"
              ? value.usage
                  .inputTokens
              : undefined,

          outputTokens:
            typeof value.usage
              .outputTokens ===
              "number"
              ? value.usage
                  .outputTokens
              : undefined,

          estimatedCredits:
            typeof value.usage
              .estimatedCredits ===
              "number"
              ? value.usage
                  .estimatedCredits
              : undefined,
        }
      : undefined;

  const assets =
    Array.isArray(
      value.assets,
    )
      ? (value.assets as GeneratedAssetDescriptor[])
      : [];

  return {
    plan: value.plan,
    assets,
    usage,
  };
}

function getPreferredFormat(
  brief: StudioGenerationBrief,
  preferredFormat:
    | StudioOutputFormatId
    | undefined,
): StudioOutputFormatId {
  if (
    preferredFormat &&
    brief.formats.includes(
      preferredFormat,
    )
  ) {
    return preferredFormat;
  }

  return getPrimaryStudioFormat(
    brief.formats,
  ).id;
}

function buildCampaignMetadata(
  options: {
    project: StudioProject;
    brief: StudioGenerationBrief;
    plan: StudioCampaignPlan;
    primaryVariant: StudioCampaignVariant;
    variants: StudioPlannedVariant[];
    usage:
      | StudioGenerationUsage
      | undefined;
  },
): Record<string, unknown> {
  const {
    project,
    brief,
    plan,
    primaryVariant,
    variants,
    usage,
  } = options;

  const existingMetadata =
    isRecord(project.metadata)
      ? project.metadata
      : {};

  return {
    ...existingMetadata,

    aiGenerated: true,

    studioGenerationMode:
      "multi-format-campaign",

    originalBrief: brief,

    campaign: {
      title: plan.title,
      summary: plan.summary,
      coreMessage:
        plan.coreMessage,
      supportingMessage:
        plan.supportingMessage,
      callToAction:
        plan.callToAction,
      visualDirection:
        plan.visualDirection,
      backgroundColor:
        plan.backgroundColor,
      durationMs:
        plan.durationMs,
      suggestedCaption:
        plan.suggestedCaption,
      suggestedHashtags:
        readStringArray(
          plan.suggestedHashtags,
        ),
      generationNotes:
        readStringArray(
          plan.generationNotes,
        ),
    },

    primaryVariantId:
      primaryVariant.id,

    primaryFormat:
      primaryVariant.format,

    selectedFormats:
      brief.formats,

    campaignVariants:
      variants.map(
        ({
          variant,
        }) => ({
          id: variant.id,
          format:
            variant.format,
          title:
            variant.title,
          summary:
            variant.summary,
          aspectRatio:
            variant.aspectRatio,
          width:
            variant.width,
          height:
            variant.height,
          durationMs:
            variant.durationMs,
          backgroundColor:
            variant.backgroundColor,
          suggestedCaption:
            variant.suggestedCaption,
          suggestedHashtags:
            variant.suggestedHashtags,
          generationNotes:
            variant.generationNotes,
          scenes:
            variant.scenes,
        }),
      ),

    generatedAt:
      new Date().toISOString(),

    generationUsage:
      usage,
  };
}

export async function requestStudioGeneration(
  brief: StudioGenerationBrief,
  signal?: AbortSignal,
): Promise<StudioGenerationResponse> {
  const response = await fetch(
    "/api/studio/generate",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        brief,
      ),

      signal,

      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await readResponseError(
        response,
      ),
    );
  }

  let body: unknown;

  try {
    body =
      await response.json();
  } catch {
    throw new Error(
      "Beacon Studio returned a response that could not be read.",
    );
  }

  return normaliseGenerationResponse(
    body,
  );
}

export async function generateIntoStudio(
  options: GenerateIntoStudioOptions,
): Promise<StudioGenerationResult> {
  const {
    brief,
    project,
    actions,
    preferredFormat,
    signal,
  } = options;

  const generated =
    await requestStudioGeneration(
      brief,
      signal,
    );

  if (signal?.aborted) {
    throw new DOMException(
      "Studio generation was cancelled.",
      "AbortError",
    );
  }

  const selectedFormat =
    getPreferredFormat(
      brief,
      preferredFormat,
    );

  const primaryVariant =
    getPrimaryCampaignVariant(
      generated.plan,
      selectedFormat,
    );

  const primaryTimeline =
    variantToStudioTimeline(
      primaryVariant,
    );

  const plannedVariants =
    campaignToStudioTimelines(
      generated.plan,
    );

  const importedAssets =
    importGeneratedAssets(
      generated.assets ?? [],
      project.id,
    );

  const projectName =
    readString(
      generated.plan.title,
    ) ??
    readString(
      primaryVariant.title,
    ) ??
    project.name;

  const projectMetadata =
    buildCampaignMetadata({
      project,
      brief,
      plan:
        generated.plan,
      primaryVariant,
      variants:
        plannedVariants,
      usage:
        generated.usage,
    });

  actions.updateProject(
    {
      name: projectName,
      width:
        primaryVariant.width,
      height:
        primaryVariant.height,
      backgroundColor:
        primaryVariant.backgroundColor,
      durationMs:
        primaryVariant.durationMs,
      metadata:
        projectMetadata,
    },
    "Apply AI campaign",
  );

  actions.setTimeline(
    primaryTimeline,
    `Build ${primaryVariant.title} timeline`,
  );

  for (
    const asset of importedAssets
  ) {
    actions.addAsset(
      asset,
      "Import generated Studio asset",
    );
  }

  return {
    plan:
      generated.plan,
    primaryVariant,
    variants:
      plannedVariants,
    assets:
      importedAssets,
    usage:
      generated.usage,
  };
}