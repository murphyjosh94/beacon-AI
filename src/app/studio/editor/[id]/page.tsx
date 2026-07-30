"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import StudioShell from "../../StudioShell";
import type {
  StudioClip,
  StudioProject as ShellProject,
  StudioSnapshot,
  StudioTimeline,
  StudioTrack,
} from "../../StudioProvider";

type ProjectStatus =
  | "draft"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

type ProjectAspectRatio = "16:9" | "9:16" | "1:1" | "4:5";

type ProjectScene = {
  id: string;
  title: string;
  startMs: number;
  durationMs: number;
  background?: string;
  assetId?: string | null;
  text?: string;
};

type ApiProject = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  status?: ProjectStatus;
  aspectRatio?: ProjectAspectRatio;
  durationMs?: number;
  scenes?: ProjectScene[];
  assetIds?: string[];
  thumbnailUrl?: string;
  creditsUsed?: number;
  favourite?: boolean;
  folder?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

type ProjectApiResponse = {
  project?: ApiProject;
  error?: string;
};

function dimensionsForAspectRatio(
  aspectRatio: ProjectAspectRatio | undefined,
): { width: number; height: number } {
  switch (aspectRatio) {
    case "9:16":
      return { width: 1080, height: 1920 };
    case "1:1":
      return { width: 1080, height: 1080 };
    case "4:5":
      return { width: 1080, height: 1350 };
    default:
      return { width: 1920, height: 1080 };
  }
}

function aspectRatioFromDimensions(
  width: number,
  height: number,
): ProjectAspectRatio {
  const ratio = width / Math.max(1, height);

  if (Math.abs(ratio - 9 / 16) < 0.03) return "9:16";
  if (Math.abs(ratio - 1) < 0.03) return "1:1";
  if (Math.abs(ratio - 4 / 5) < 0.03) return "4:5";

  return "16:9";
}

function createSceneClip(
  scene: ProjectScene,
  trackId: string,
  layer: number,
  width: number,
  height: number,
): StudioClip {
  return {
    id: scene.id,
    trackId,
    assetId: scene.assetId ?? undefined,
    type: scene.assetId ? "image" : scene.text ? "text" : "shape",
    name: scene.title || `Scene ${layer + 1}`,
    startMs: Math.max(0, scene.startMs),
    durationMs: Math.max(1, scene.durationMs),
    trimStartMs: 0,
    trimEndMs: 0,
    playbackRate: 1,
    layer,
    locked: false,
    hidden: false,
    transform: {
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
    },
    style: {
      backgroundColor: scene.background ?? "#020617",
      color: "#ffffff",
      fontSize: Math.max(32, Math.round(width * 0.04)),
      fontWeight: 700,
      lineHeight: 1.2,
      textAlign: "centre",
      objectFit: "cover",
    },
    content: scene.text,
    keyframes: [],
    metadata: {
      sceneTitle: scene.title,
      source: "studio-project",
    },
  };
}

function buildInitialTimeline(
  project: ApiProject,
  width: number,
  height: number,
): Partial<StudioTimeline> {
  const scenes = project.scenes ?? [];
  const durationMs =
    project.durationMs ??
    Math.max(
      30_000,
      ...scenes.map((scene) => scene.startMs + scene.durationMs),
    );

  const trackId = `project_${project.id}_scenes`;

  const tracks: StudioTrack[] = scenes.length
    ? [
        {
          id: trackId,
          name: "Generated scenes",
          type: "mixed",
          order: 0,
          locked: false,
          muted: false,
          hidden: false,
          solo: false,
          height: 84,
          clips: scenes.map((scene, index) =>
            createSceneClip(scene, trackId, index, width, height),
          ),
        },
      ]
    : [];

  return {
    durationMs,
    playheadMs: 0,
    zoom: 1,
    scrollLeft: 0,
    snappingEnabled: true,
    snapThresholdPx: 8,
    tracks,
  };
}

function scenesFromSnapshot(snapshot: StudioSnapshot): ProjectScene[] {
  return snapshot.timeline.tracks
    .flatMap((track) => track.clips)
    .filter((clip) => clip.type !== "audio" && clip.type !== "voice")
    .sort((left, right) => left.startMs - right.startMs)
    .map((clip, index) => ({
      id: clip.id,
      title: clip.name || `Scene ${index + 1}`,
      startMs: clip.startMs,
      durationMs: clip.durationMs,
      background:
        typeof clip.style?.backgroundColor === "string"
          ? clip.style.backgroundColor
          : undefined,
      assetId: clip.assetId ?? null,
      text: clip.content,
    }));
}

export default function StudioProjectEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const projectId = typeof params?.id === "string" ? params.id : "";

  const [project, setProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setLoadError("The Studio project ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/studio/projects/${encodeURIComponent(projectId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = (await response.json()) as ProjectApiResponse;

      if (!response.ok || !data.project) {
        throw new Error(
          data.error || "The Studio project could not be loaded.",
        );
      }

      setProject(data.project);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "The Studio project could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const dimensions = useMemo(
    () => dimensionsForAspectRatio(project?.aspectRatio),
    [project?.aspectRatio],
  );

  const initialProject = useMemo<Partial<ShellProject> | undefined>(() => {
    if (!project) return undefined;

    return {
      id: project.id,
      name: project.name,
      width: dimensions.width,
      height: dimensions.height,
      durationMs: project.durationMs ?? 30_000,
      frameRate: 30,
      backgroundColor: "#020617",
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      version:
        typeof project.metadata?.version === "number"
          ? project.metadata.version
          : 1,
      metadata: {
        ...project.metadata,
        description: project.description ?? "",
        projectType: project.type ?? "custom",
        projectStatus: project.status ?? "draft",
        creditsUsed: project.creditsUsed ?? 0,
        thumbnailUrl: project.thumbnailUrl,
      },
    };
  }, [dimensions.height, dimensions.width, project]);

  const initialTimeline = useMemo<Partial<StudioTimeline> | undefined>(() => {
    if (!project) return undefined;

    return buildInitialTimeline(
      project,
      dimensions.width,
      dimensions.height,
    );
  }, [dimensions.height, dimensions.width, project]);

  const saveSnapshot = useCallback(
    async (snapshot: StudioSnapshot) => {
      if (!projectId) return;

      setSaveError(null);

      const response = await fetch(
        `/api/studio/projects/${encodeURIComponent(projectId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: snapshot.project.name.trim().slice(0, 120),
            description:
              typeof snapshot.project.metadata?.description === "string"
                ? snapshot.project.metadata.description.slice(0, 500)
                : project?.description ?? "",
            durationMs: snapshot.timeline.durationMs,
            aspectRatio: aspectRatioFromDimensions(
              snapshot.project.width,
              snapshot.project.height,
            ),
            scenes: scenesFromSnapshot(snapshot),
            assetIds: snapshot.assets.map((asset) => asset.id),
            metadata: {
              ...project?.metadata,
              ...snapshot.project.metadata,
              version: snapshot.project.version,
              studioSnapshot: snapshot,
            },
          }),
        },
      );

      const data = (await response.json()) as ProjectApiResponse;

      if (!response.ok) {
        const message =
          data.error || "The Studio project could not be saved.";
        setSaveError(message);
        throw new Error(message);
      }

      if (data.project) {
        setProject(data.project);
      }
    },
    [project?.description, project?.metadata, projectId],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-amber-300" />
            <p className="mt-4 text-sm font-semibold text-slate-300">
              Loading your creative workspace…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (loadError || !project || !initialProject || !initialTimeline) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
          <section className="w-full rounded-3xl border border-red-400/20 bg-red-400/5 p-8">
            <AlertCircle className="h-10 w-10 text-red-300" />

            <h1 className="mt-5 text-2xl font-black">
              Project unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {loadError || "The Studio project could not be opened."}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadProject()}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-200"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>

              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Studio
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {saveError ? (
        <div className="border-b border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">
          <div className="mx-auto flex max-w-[1600px] items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        </div>
      ) : null}

      <StudioShell
        key={`${project.id}:${project.updatedAt}`}
        projectId={project.id}
        initialProject={initialProject}
        initialTimeline={initialTimeline}
        initialAssets={[]}
        onAutosave={saveSnapshot}
        onExit={() => router.push("/studio")}
        onPublish={async (snapshot) => {
          await saveSnapshot(snapshot);
          router.push(`/studio/editor/${encodeURIComponent(project.id)}`);
        }}
        preview={
          project.thumbnailUrl ? (
            <div className="flex h-full items-center justify-center bg-black p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.thumbnailUrl}
                alt={`${project.name} preview`}
                className="max-h-full max-w-full rounded-xl object-contain"
              />
            </div>
          ) : undefined
        }
      />

      <Link
        href="/studio/create"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 shadow-2xl transition hover:-translate-y-0.5 hover:bg-amber-200"
      >
        <Sparkles className="h-4 w-4" />
        New AI creation
      </Link>
    </main>
  );
}