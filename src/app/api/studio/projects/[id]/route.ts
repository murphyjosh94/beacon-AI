import {
  del,
  list,
  put,
} from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MotionAspectRatio =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:5";

type MotionScene = {
  id: string;
  title: string;
  startMs: number;
  durationMs: number;
  background?: string;
  assetId?: string | null;
  text?: string;
};

type MotionProject = {
  id: string;
  name: string;
  description: string;
  aspectRatio: MotionAspectRatio;
  durationMs: number;
  scenes: MotionScene[];
  assetIds: string[];
  createdAt: string;
  updatedAt: string;
};

type UpdateProjectBody = {
  name?: unknown;
  description?: unknown;
  aspectRatio?: unknown;
  durationMs?: unknown;
  scenes?: unknown;
  assetIds?: unknown;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const PROJECT_PREFIX =
  "motion/projects/";
const PROJECT_FILE_NAME =
  "project.json";

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_SCENES = 500;
const MAX_DURATION_MS =
  24 * 60 * 60 * 1000;

const VALID_ASPECT_RATIOS =
  new Set<MotionAspectRatio>([
    "16:9",
    "9:16",
    "1:1",
    "4:5",
  ]);

function jsonError(
  message: string,
  status: number,
) {
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

function projectPath(
  id: string,
): string {
  return `${PROJECT_PREFIX}${id}/${PROJECT_FILE_NAME}`;
}

function normaliseProjectId(
  value: string,
): string | null {
  const id = value.trim();

  if (
    id.length === 0 ||
    id.length > 100
  ) {
    return null;
  }

  if (
    !/^[a-zA-Z0-9_-]+$/.test(id)
  ) {
    return null;
  }

  return id;
}

function normaliseText(
  value: unknown,
  fallback: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalised = value
    .trim()
    .replace(/\s+/g, " ");

  return (
    normalised.slice(
      0,
      maxLength,
    ) || fallback
  );
}

function normaliseAspectRatio(
  value: unknown,
  fallback: MotionAspectRatio,
): MotionAspectRatio {
  if (
    typeof value === "string" &&
    VALID_ASPECT_RATIOS.has(
      value as MotionAspectRatio,
    )
  ) {
    return value as MotionAspectRatio;
  }

  return fallback;
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
      250,
    ),
    MAX_DURATION_MS,
  );
}

function normaliseAssetIds(
  value: unknown,
  fallback: string[],
): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return Array.from(
    new Set(
      value.filter(
        (
          item,
        ): item is string =>
          typeof item ===
            "string" &&
          item.trim().length >
            0,
      ),
    ),
  )
    .map((item) =>
      item.trim(),
    )
    .slice(0, 1000);
}

function normaliseScenes(
  value: unknown,
  fallback: MotionScene[],
): MotionScene[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .slice(0, MAX_SCENES)
    .map(
      (
        scene,
        index,
      ): MotionScene | null => {
        if (
          !scene ||
          typeof scene !==
            "object"
        ) {
          return null;
        }

        const candidate =
          scene as Record<
            string,
            unknown
          >;

        const startMs =
          typeof candidate.startMs ===
            "number" &&
          Number.isFinite(
            candidate.startMs,
          )
            ? Math.max(
                0,
                Math.round(
                  candidate.startMs,
                ),
              )
            : index * 3000;

        const durationMs =
          normaliseDuration(
            candidate.durationMs,
            3000,
          );

        return {
          id:
            typeof candidate.id ===
              "string" &&
            candidate.id.trim()
              .length > 0
              ? candidate.id.trim()
              : crypto.randomUUID(),
          title: normaliseText(
            candidate.title,
            `Scene ${index + 1}`,
            100,
          ),
          startMs,
          durationMs,
          background:
            typeof candidate.background ===
            "string"
              ? candidate.background.slice(
                  0,
                  200,
                )
              : undefined,
          assetId:
            typeof candidate.assetId ===
            "string"
              ? candidate.assetId
              : null,
          text:
            typeof candidate.text ===
            "string"
              ? candidate.text.slice(
                  0,
                  2000,
                )
              : undefined,
        };
      },
    )
    .filter(
      (
        scene,
      ): scene is MotionScene =>
        scene !== null,
    )
    .sort(
      (first, second) =>
        first.startMs -
        second.startMs,
    );
}

function calculateProjectDuration(
  scenes: MotionScene[],
  requestedDuration: unknown,
  fallback: number,
): number {
  const timelineDuration =
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
    normaliseDuration(
      requestedDuration,
      fallback,
    ),
    timelineDuration,
  );
}

function isMotionProject(
  value: unknown,
): value is MotionProject {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const project =
    value as Partial<MotionProject>;

  return (
    typeof project.id ===
      "string" &&
    typeof project.name ===
      "string" &&
    typeof project.description ===
      "string" &&
    typeof project.aspectRatio ===
      "string" &&
    typeof project.durationMs ===
      "number" &&
    typeof project.createdAt ===
      "string" &&
    typeof project.updatedAt ===
      "string" &&
    Array.isArray(
      project.scenes,
    ) &&
    Array.isArray(
      project.assetIds,
    )
  );
}

async function findProjectBlob(
  id: string,
) {
  const pathname =
    projectPath(id);

  const result = await list({
    prefix: pathname,
    limit: 1,
  });

  return (
    result.blobs.find(
      (blob) =>
        blob.pathname ===
        pathname,
    ) ?? null
  );
}

async function readProject(
  id: string,
): Promise<MotionProject | null> {
  const blob =
    await findProjectBlob(id);

  if (!blob) {
    return null;
  }

  const response = await fetch(
    blob.url,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Project document returned ${response.status}.`,
    );
  }

  const data: unknown =
    await response.json();

  if (!isMotionProject(data)) {
    throw new Error(
      "Project document is invalid.",
    );
  }

  return data;
}

function isBlobConfigurationError(
  error: unknown,
): boolean {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : "";

  return (
    message.includes("token") ||
    message.includes(
      "blob_read_write_token",
    )
  );
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { id: rawId } =
      await context.params;
    const id =
      normaliseProjectId(
        rawId,
      );

    if (!id) {
      return jsonError(
        "The project ID is invalid.",
        400,
      );
    }

    const project =
      await readProject(id);

    if (!project) {
      return jsonError(
        "The Studio project was not found.",
        404,
      );
    }

    return NextResponse.json(
      {
        project,
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
      "[studio-project:get]",
      error,
    );

    if (
      isBlobConfigurationError(
        error,
      )
    ) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The Studio project could not be loaded.",
      500,
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { id: rawId } =
      await context.params;
    const id =
      normaliseProjectId(
        rawId,
      );

    if (!id) {
      return jsonError(
        "The project ID is invalid.",
        400,
      );
    }

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

    let body: UpdateProjectBody;

    try {
      body =
        (await request.json()) as UpdateProjectBody;
    } catch {
      return jsonError(
        "The request body is not valid JSON.",
        400,
      );
    }

    const existing =
      await readProject(id);

    if (!existing) {
      return jsonError(
        "The Studio project was not found.",
        404,
      );
    }

    const scenes =
      normaliseScenes(
        body.scenes,
        existing.scenes,
      );

    const project: MotionProject =
      {
        ...existing,
        id,
        name: normaliseText(
          body.name,
          existing.name,
          MAX_NAME_LENGTH,
        ),
        description:
          normaliseText(
            body.description,
            existing.description,
            MAX_DESCRIPTION_LENGTH,
          ),
        aspectRatio:
          normaliseAspectRatio(
            body.aspectRatio,
            existing.aspectRatio,
          ),
        durationMs:
          calculateProjectDuration(
            scenes,
            body.durationMs,
            existing.durationMs,
          ),
        scenes,
        assetIds:
          normaliseAssetIds(
            body.assetIds,
            existing.assetIds,
          ),
        createdAt:
          existing.createdAt,
        updatedAt:
          new Date().toISOString(),
      };

    const blob = await put(
      projectPath(id),
      JSON.stringify(
        project,
        null,
        2,
      ),
      {
        access: "private",
        contentType:
          "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      },
    );

    return NextResponse.json(
      {
        project,
        storage: {
          pathname:
            blob.pathname,
          url: blob.url,
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
      "[studio-project:put]",
      error,
    );

    if (
      isBlobConfigurationError(
        error,
      )
    ) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The Studio project could not be saved.",
      500,
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { id: rawId } =
      await context.params;
    const id =
      normaliseProjectId(
        rawId,
      );

    if (!id) {
      return jsonError(
        "The project ID is invalid.",
        400,
      );
    }

    const blob =
      await findProjectBlob(id);

    if (!blob) {
      return jsonError(
        "The Studio project was not found.",
        404,
      );
    }

    await del(blob.url);

    return NextResponse.json(
      {
        deleted: true,
        id,
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
      "[studio-project:delete]",
      error,
    );

    if (
      isBlobConfigurationError(
        error,
      )
    ) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The Studio project could not be deleted.",
      500,
    );
  }
}