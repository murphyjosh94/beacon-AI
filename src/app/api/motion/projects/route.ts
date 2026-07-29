import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MotionAspectRatio = "16:9" | "9:16" | "1:1" | "4:5";

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

type CreateProjectBody = {
  name?: unknown;
  description?: unknown;
  aspectRatio?: unknown;
  durationMs?: unknown;
  scenes?: unknown;
  assetIds?: unknown;
};

const PROJECT_PREFIX = "motion/projects/";
const PROJECT_FILE_NAME = "project.json";
const MAX_PROJECTS_PER_REQUEST = 250;
const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_SCENES = 500;
const MAX_DURATION_MS = 24 * 60 * 60 * 1000;

const VALID_ASPECT_RATIOS = new Set<MotionAspectRatio>([
  "16:9",
  "9:16",
  "1:1",
  "4:5",
]);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function normaliseText(
  value: unknown,
  fallback: string,
  maxLength: number,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalised = value.trim().replace(/\s+/g, " ");

  return normalised.slice(0, maxLength) || fallback;
}

function normaliseAspectRatio(value: unknown): MotionAspectRatio {
  if (
    typeof value === "string" &&
    VALID_ASPECT_RATIOS.has(value as MotionAspectRatio)
  ) {
    return value as MotionAspectRatio;
  }

  return "16:9";
}

function normaliseDuration(value: unknown, fallback = 10_000) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(
    Math.max(Math.round(value), 250),
    MAX_DURATION_MS,
  );
}

function normaliseAssetIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      ),
    ),
  ).slice(0, 1000);
}

function normaliseScenes(value: unknown): MotionScene[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, MAX_SCENES)
    .map((scene, index): MotionScene | null => {
      if (!scene || typeof scene !== "object") {
        return null;
      }

      const candidate = scene as Record<string, unknown>;
      const startMs =
        typeof candidate.startMs === "number" &&
        Number.isFinite(candidate.startMs)
          ? Math.max(0, Math.round(candidate.startMs))
          : index * 3000;

      const durationMs = normaliseDuration(
        candidate.durationMs,
        3000,
      );

      return {
        id:
          typeof candidate.id === "string" &&
          candidate.id.trim().length > 0
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
          typeof candidate.background === "string"
            ? candidate.background.slice(0, 200)
            : undefined,
        assetId:
          typeof candidate.assetId === "string"
            ? candidate.assetId
            : null,
        text:
          typeof candidate.text === "string"
            ? candidate.text.slice(0, 2000)
            : undefined,
      };
    })
    .filter((scene): scene is MotionScene => scene !== null)
    .sort((first, second) => first.startMs - second.startMs);
}

function calculateProjectDuration(
  scenes: MotionScene[],
  requestedDuration: unknown,
) {
  const timelineDuration = scenes.reduce(
    (maximum, scene) =>
      Math.max(maximum, scene.startMs + scene.durationMs),
    0,
  );

  return Math.max(
    normaliseDuration(requestedDuration, 10_000),
    timelineDuration,
  );
}

function projectPath(id: string) {
  return `${PROJECT_PREFIX}${id}/${PROJECT_FILE_NAME}`;
}

function isMotionProject(value: unknown): value is MotionProject {
  if (!value || typeof value !== "object") {
    return false;
  }

  const project = value as Partial<MotionProject>;

  return (
    typeof project.id === "string" &&
    typeof project.name === "string" &&
    typeof project.createdAt === "string" &&
    typeof project.updatedAt === "string" &&
    Array.isArray(project.scenes) &&
    Array.isArray(project.assetIds)
  );
}

async function readProject(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Project document returned ${response.status}.`,
    );
  }

  const data: unknown = await response.json();

  if (!isMotionProject(data)) {
    throw new Error("Project document is invalid.");
  }

  return data;
}

export async function GET() {
  try {
    const result = await list({
      prefix: PROJECT_PREFIX,
      limit: MAX_PROJECTS_PER_REQUEST,
    });

    const projectBlobs = result.blobs.filter((blob) =>
      blob.pathname.endsWith(`/${PROJECT_FILE_NAME}`),
    );

    const settledProjects = await Promise.allSettled(
      projectBlobs.map((blob) => readProject(blob.url)),
    );

    const projects = settledProjects
      .flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      )
      .sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      );

    return NextResponse.json(
      {
        projects,
        count: projects.length,
        hasMore: result.hasMore,
        cursor: result.cursor ?? null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[motion-projects:get]", error);

    return jsonError(
      "Motion projects could not be loaded.",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      return jsonError(
        "Expected an application/json request body.",
        415,
      );
    }

    let body: CreateProjectBody;

    try {
      body = (await request.json()) as CreateProjectBody;
    } catch {
      return jsonError("The request body is not valid JSON.", 400);
    }

    const scenes = normaliseScenes(body.scenes);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const project: MotionProject = {
      id,
      name: normaliseText(
        body.name,
        "Untitled motion project",
        MAX_NAME_LENGTH,
      ),
      description: normaliseText(
        body.description,
        "",
        MAX_DESCRIPTION_LENGTH,
      ),
      aspectRatio: normaliseAspectRatio(body.aspectRatio),
      durationMs: calculateProjectDuration(
        scenes,
        body.durationMs,
      ),
      scenes,
      assetIds: normaliseAssetIds(body.assetIds),
      createdAt: now,
      updatedAt: now,
    };

    const blob = await put(
  projectPath(project.id),
  JSON.stringify(project, null, 2),
  {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  },
);

    return NextResponse.json(
      {
        project,
        storage: {
          pathname: blob.pathname,
          url: blob.url,
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          Location: `/api/motion/projects/${project.id}`,
        },
      },
    );
  } catch (error) {
    console.error("[motion-projects:post]", error);

    const message =
      error instanceof Error ? error.message.toLowerCase() : "";

    if (
      message.includes("token") ||
      message.includes("blob_read_write_token")
    ) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The motion project could not be created.",
      500,
    );
  }
}