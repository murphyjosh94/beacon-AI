import { NextResponse } from "next/server";

import {
  getAccessErrorStatus,
  requireSignedInAccount,
} from "@/lib/auth/AdminAccess";
import {
  StudioBrainError,
  studioBrain,
  type StudioBrainAspectRatio,
  type StudioBrainOutputCount,
  type StudioBrainQuality,
  type StudioBrainRequest,
  type StudioBrainToolId,
} from "@/lib/studio/studio-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAXIMUM_REQUEST_BODY_SIZE = 128_000;

const STUDIO_TOOL_IDS: StudioBrainToolId[] = [
  "marketing",
  "short-video",
  "long-video",
  "images",
  "writing",
  "memes",
  "audio",
  "custom",
];

const STUDIO_QUALITY_IDS: StudioBrainQuality[] = [
  "draft",
  "standard",
  "high",
  "maximum",
];

const STUDIO_ASPECT_RATIOS: StudioBrainAspectRatio[] = [
  "1:1",
  "4:5",
  "9:16",
  "16:9",
];

const STUDIO_OUTPUT_COUNTS: StudioBrainOutputCount[] = [1, 2, 4];

type JsonRecord = Record<string, unknown>;

type StudioPlanRequestBody = {
  prompt: string;
  requestedTool?: StudioBrainToolId;
  quality?: StudioBrainQuality;
  aspectRatio?: StudioBrainAspectRatio;
  outputCount?: StudioBrainOutputCount;
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

function jsonError(
  message: string,
  status: number,
  code: string,
  details?: JsonRecord,
): Response {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details ? { details } : {}),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isRecord(value: unknown): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function cleanString(
  value: unknown,
  maximumLength?: number,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return undefined;
  }

  if (
    typeof maximumLength === "number" &&
    cleaned.length > maximumLength
  ) {
    return cleaned.slice(0, maximumLength);
  }

  return cleaned;
}

function cleanStringArray(
  value: unknown,
  maximumItems = 12,
  maximumItemLength = 100,
): string[] | undefined {
  if (typeof value === "string") {
    const values = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maximumItems)
      .map((item) => item.slice(0, maximumItemLength));

    return values.length > 0 ? values : undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const values = value
    .map((item) => cleanString(item, maximumItemLength))
    .filter((item): item is string => Boolean(item))
    .slice(0, maximumItems);

  return values.length > 0 ? values : undefined;
}

function isStudioToolId(
  value: unknown,
): value is StudioBrainToolId {
  return (
    typeof value === "string" &&
    STUDIO_TOOL_IDS.includes(value as StudioBrainToolId)
  );
}

function isStudioQuality(
  value: unknown,
): value is StudioBrainQuality {
  return (
    typeof value === "string" &&
    STUDIO_QUALITY_IDS.includes(value as StudioBrainQuality)
  );
}

function isStudioAspectRatio(
  value: unknown,
): value is StudioBrainAspectRatio {
  return (
    typeof value === "string" &&
    STUDIO_ASPECT_RATIOS.includes(
      value as StudioBrainAspectRatio,
    )
  );
}

function isStudioOutputCount(
  value: unknown,
): value is StudioBrainOutputCount {
  return (
    typeof value === "number" &&
    STUDIO_OUTPUT_COUNTS.includes(
      value as StudioBrainOutputCount,
    )
  );
}

function getOptionalBoolean(
  value: unknown,
): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function getDurationSeconds(
  value: unknown,
): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return Math.min(600, Math.max(5, Math.round(value)));
}

function parseRequestBody(
  value: unknown,
): StudioPlanRequestBody {
  if (!isRecord(value)) {
    throw new StudioBrainError(
      "A valid Studio planning request is required.",
      "INVALID_REQUEST",
    );
  }

  const prompt = cleanString(value.prompt);

  if (!prompt) {
    throw new StudioBrainError(
      "Describe what you want Beacon Studio to create.",
      "PROMPT_TOO_SHORT",
    );
  }

  const requestedTool =
    isStudioToolId(value.requestedTool)
      ? value.requestedTool
      : isStudioToolId(value.selectedTool)
        ? value.selectedTool
        : isStudioToolId(value.tool)
          ? value.tool
          : undefined;

  const quality = isStudioQuality(value.quality)
    ? value.quality
    : undefined;

  const aspectRatio = isStudioAspectRatio(value.aspectRatio)
    ? value.aspectRatio
    : undefined;

  const outputCount = isStudioOutputCount(value.outputCount)
    ? value.outputCount
    : undefined;

  return {
    prompt,
    requestedTool,
    quality,
    aspectRatio,
    outputCount,
    durationSeconds: getDurationSeconds(value.durationSeconds),
    audience: cleanString(value.audience, 500),
    style: cleanString(value.style, 500),
    tone: cleanString(value.tone, 500),
    colours: cleanStringArray(value.colours),
    referenceUrl: cleanString(value.referenceUrl, 2_000),
    notes: cleanString(value.notes, 4_000),
    brandKit: cleanString(value.brandKit, 250),
    projectTitle: cleanString(value.projectTitle, 140),
    saveToLibrary: getOptionalBoolean(value.saveToLibrary),
  };
}

function buildStudioBrainRequest(
  body: StudioPlanRequestBody,
): StudioBrainRequest {
  return {
    prompt: body.prompt,
    requestedTool: body.requestedTool,
    quality: body.quality,
    aspectRatio: body.aspectRatio,
    outputCount: body.outputCount,
    durationSeconds: body.durationSeconds,
    audience: body.audience,
    style: body.style,
    tone: body.tone,
    colours: body.colours,
    referenceUrl: body.referenceUrl,
    notes: body.notes,
    brandKit: body.brandKit,
    projectTitle: body.projectTitle,
    saveToLibrary: body.saveToLibrary,
  };
}

function getContentLength(request: Request): number | null {
  const rawContentLength = request.headers.get("content-length");

  if (!rawContentLength) {
    return null;
  }

  const contentLength = Number(rawContentLength);

  if (!Number.isFinite(contentLength)) {
    return null;
  }

  return Math.max(0, Math.round(contentLength));
}

export async function POST(
  request: Request,
): Promise<Response> {
  try {
    await requireSignedInAccount();

    const contentType = request.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      return jsonError(
        "Expected an application/json request body.",
        415,
        "INVALID_CONTENT_TYPE",
      );
    }

    const contentLength = getContentLength(request);

    if (
      contentLength !== null &&
      contentLength > MAXIMUM_REQUEST_BODY_SIZE
    ) {
      return jsonError(
        "The Studio planning request is too large.",
        413,
        "REQUEST_TOO_LARGE",
      );
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return jsonError(
        "The request body is not valid JSON.",
        400,
        "INVALID_JSON",
      );
    }

    const body = parseRequestBody(rawBody);
    const brainRequest = buildStudioBrainRequest(body);
    const brain = await studioBrain.analyse(brainRequest);

    return NextResponse.json(
      {
        success: true,
        plan: brain,
        brain,
        requiresClarification: brain.needsClarification,
        clarificationQuestions: brain.clarificationQuestions,
        estimate: {
          credits: brain.estimatedCredits,
          duration: brain.estimatedDuration,
          breakdown: brain.credits,
        },
        routing: {
          intent: brain.intent,
          workflow: brain.workflow,
          selectedTool: brain.selectedTool,
          confidence: brain.confidence,
          models: brain.models,
        },
        generationRequest: {
          prompt: body.prompt,
          requestedTool: brain.selectedTool,
          quality: brain.quality,
          aspectRatio: brain.aspectRatio,
          outputCount: brain.outputCount,
          durationSeconds: brain.durationSeconds,
          audience: brain.audience,
          style: brain.style,
          tone: brain.tone,
          colours: brain.colours,
          referenceUrl: body.referenceUrl,
          notes: body.notes,
          brandKit: body.brandKit,
          projectTitle:
            body.projectTitle ??
            brain.metadata.projectTitle,
          saveToLibrary: brain.metadata.saveToLibrary,
          creativePlan: brain,
          confirmedCreditCost: brain.estimatedCredits,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[studio-plan:post]", error);

    const accessStatus = getAccessErrorStatus(error);

    if (accessStatus) {
      return jsonError(
        error instanceof Error
          ? error.message
          : "Access denied.",
        accessStatus,
        "ACCESS_DENIED",
      );
    }

    if (error instanceof StudioBrainError) {
      return jsonError(
        error.message,
        error.status,
        error.code,
      );
    }

    return jsonError(
      error instanceof Error
        ? error.message
        : "Beacon Studio could not prepare the creative plan.",
      500,
      "STUDIO_PLAN_FAILED",
    );
  }
}