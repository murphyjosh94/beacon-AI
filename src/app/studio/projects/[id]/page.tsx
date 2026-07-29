"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  FileImage,
  FileText,
  FolderOpen,
  Globe2,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  Megaphone,
  MonitorPlay,
  Palette,
  Presentation,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
  Video,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type StudioProjectType =
  | "video"
  | "image"
  | "logo"
  | "brand-kit"
  | "presentation"
  | "document"
  | "website"
  | "social"
  | "campaign";

type StudioProjectStatus =
  | "draft"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

type StudioAspectRatio =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:5";

type StudioScene = {
  id: string;
  title: string;
  startMs: number;
  durationMs: number;
  background?: string;
  assetId?: string | null;
  text?: string;
};

type StudioProject = {
  id: string;
  name: string;
  description: string;
  type?: StudioProjectType;
  status?: StudioProjectStatus;
  aspectRatio?: StudioAspectRatio;
  durationMs?: number;
  scenes?: StudioScene[];
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
  project?: StudioProject;
  error?: string;
};

type EditorDefinition = {
  label: string;
  description: string;
  icon: typeof Video;
  badge: string;
};

const EDITOR_DEFINITIONS: Record<
  StudioProjectType,
  EditorDefinition
> = {
  video: {
    label: "Video Studio",
    description:
      "Create scenes, arrange timing and prepare your project for rendering.",
    icon: Video,
    badge: "Video",
  },
  image: {
    label: "Image Studio",
    description:
      "Generate, refine and organise image assets for your project.",
    icon: ImageIcon,
    badge: "Image",
  },
  logo: {
    label: "Logo Studio",
    description:
      "Develop logo concepts, variants and export-ready brand marks.",
    icon: Palette,
    badge: "Logo",
  },
  "brand-kit": {
    label: "Brand Kit Studio",
    description:
      "Manage brand colours, typography, logos and reusable creative assets.",
    icon: BriefcaseBusiness,
    badge: "Brand Kit",
  },
  presentation: {
    label: "Presentation Studio",
    description:
      "Build slide decks, organise sections and prepare presentation exports.",
    icon: Presentation,
    badge: "Presentation",
  },
  document: {
    label: "Document Studio",
    description:
      "Create structured business documents, reports and downloadable files.",
    icon: FileText,
    badge: "Document",
  },
  website: {
    label: "Website Studio",
    description:
      "Plan and build website sections, layouts and supporting assets.",
    icon: Globe2,
    badge: "Website",
  },
  social: {
    label: "Social Studio",
    description:
      "Create platform-ready social graphics and campaign assets.",
    icon: Megaphone,
    badge: "Social",
  },
  campaign: {
    label: "Campaign Studio",
    description:
      "Coordinate campaign assets, messaging and publishing deliverables.",
    icon: Sparkles,
    badge: "Campaign",
  },
};

function normaliseProjectType(
  project: StudioProject,
): StudioProjectType {
  if (
    project.type &&
    project.type in EDITOR_DEFINITIONS
  ) {
    return project.type;
  }

  if (
    Array.isArray(project.scenes) ||
    typeof project.durationMs === "number"
  ) {
    return "video";
  }

  return "image";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(
  status: StudioProjectStatus | undefined,
): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Draft";
  }
}

function formatDuration(
  durationMs: number | undefined,
): string {
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs)
  ) {
    return "Not set";
  }

  const totalSeconds = Math.max(
    0,
    Math.round(durationMs / 1000),
  );

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds =
    totalSeconds % 60;

  return minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;
}

export default function StudioProjectPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const projectId =
    typeof params?.id === "string"
      ? params.id
      : "";

  const [
    project,
    setProject,
  ] = useState<StudioProject | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    draftName,
    setDraftName,
  ] = useState("");

  const [
    draftDescription,
    setDraftDescription,
  ] = useState("");

  const loadProject =
    useCallback(async () => {
      if (!projectId) {
        setError(
          "The Studio project ID is missing.",
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/studio/projects/${encodeURIComponent(
            projectId,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as ProjectApiResponse;

        if (
          !response.ok ||
          !data.project
        ) {
          throw new Error(
            data.error ||
              "The Studio project could not be loaded.",
          );
        }

        setProject(data.project);
        setDraftName(
          data.project.name,
        );
        setDraftDescription(
          data.project.description ?? "",
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The Studio project could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const projectType = useMemo(
    () =>
      project
        ? normaliseProjectType(
            project,
          )
        : "video",
    [project],
  );

  const editor =
    EDITOR_DEFINITIONS[
      projectType
    ];

  const hasUnsavedChanges =
    project !== null &&
    (draftName.trim() !==
      project.name ||
      draftDescription.trim() !==
        (project.description ?? ""));

  async function saveProject() {
    if (
      !project ||
      !projectId ||
      saving
    ) {
      return;
    }

    const nextName =
      draftName
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120);

    if (!nextName) {
      setError(
        "Give the project a name before saving.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/studio/projects/${encodeURIComponent(
          projectId,
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: nextName,
            description:
              draftDescription
                .trim()
                .slice(0, 500),
          }),
        },
      );

      const data =
        (await response.json()) as ProjectApiResponse;

      if (
        !response.ok ||
        !data.project
      ) {
        throw new Error(
          data.error ||
            "The Studio project could not be saved.",
        );
      }

      setProject(data.project);
      setDraftName(
        data.project.name,
      );
      setDraftDescription(
        data.project.description ?? "",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The Studio project could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-amber-400" />
            <p className="mt-4 text-sm text-slate-300">
              Loading your Studio project…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    error &&
    !project
  ) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
          <section className="w-full rounded-3xl border border-red-400/20 bg-red-400/5 p-8">
            <AlertCircle className="h-10 w-10 text-red-300" />

            <h1 className="mt-5 text-2xl font-semibold">
              Project unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {error}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadProject()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>

              <Link
                href="/studio/projects"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to projects
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  const EditorIcon =
    editor.icon;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/studio/projects",
                  )
                }
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white"
                aria-label="Back to Studio projects"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
                    <EditorIcon className="h-3.5 w-3.5" />
                    {editor.badge}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {statusLabel(
                      project.status,
                    )}
                  </span>
                </div>

                <h1 className="mt-2 truncate text-xl font-semibold">
                  {project.name}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>

              <button
                type="button"
                onClick={() =>
                  void saveProject()
                }
                disabled={
                  saving ||
                  !hasUnsavedChanges
                }
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving
                  ? "Saving…"
                  : "Save project"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="border-b border-white/10 bg-slate-950/70 p-4 lg:min-h-[calc(100vh-105px)] lg:border-b-0 lg:border-r">
          <nav className="space-y-2">
            <Link
              href="/studio/dashboard"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Studio dashboard
            </Link>

            <Link
              href="/studio/projects"
              className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white"
            >
              <FolderOpen className="h-4 w-4" />
              Projects
            </Link>

            <Link
              href="/studio/create"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <Sparkles className="h-4 w-4" />
              Create
            </Link>
          </nav>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Project details
            </p>

            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">
                  Updated
                </dt>
                <dd className="mt-1 text-slate-200">
                  {formatDate(
                    project.updatedAt,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Credits used
                </dt>
                <dd className="mt-1 text-slate-200">
                  {project.creditsUsed ?? 0}
                </dd>
              </div>

              {projectType ===
              "video" ? (
                <>
                  <div>
                    <dt className="text-slate-500">
                      Duration
                    </dt>
                    <dd className="mt-1 text-slate-200">
                      {formatDuration(
                        project.durationMs,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">
                      Aspect ratio
                    </dt>
                    <dd className="mt-1 text-slate-200">
                      {project.aspectRatio ??
                        "16:9"}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          </div>
        </aside>

        <section className="min-w-0 bg-slate-900/40 p-4 sm:p-6 lg:p-8">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {editor.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {editor.description}
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                  Project ID:{" "}
                  {project.id.slice(
                    0,
                    8,
                  )}
                </span>
              </div>
            </div>

            <EditorWorkspace
              project={project}
              projectType={
                projectType
              }
            />
          </div>
        </section>

        <aside className="border-t border-white/10 bg-slate-950/70 p-4 lg:min-h-[calc(100vh-105px)] lg:border-l lg:border-t-0">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Project settings
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Update the basic details shared across every Studio tool.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Name
              </span>

              <input
                value={draftName}
                onChange={(event) =>
                  setDraftName(
                    event.target.value,
                  )
                }
                maxLength={120}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
                placeholder="Project name"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Description
              </span>

              <textarea
                value={
                  draftDescription
                }
                onChange={(event) =>
                  setDraftDescription(
                    event.target.value,
                  )
                }
                maxLength={500}
                rows={6}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
                placeholder="Describe this Studio project"
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Save status
              </p>

              <p className="mt-2 text-sm text-slate-200">
                {hasUnsavedChanges
                  ? "Unsaved changes"
                  : "Everything is saved"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function EditorWorkspace({
  project,
  projectType,
}: {
  project: StudioProject;
  projectType: StudioProjectType;
}) {
  if (
    projectType === "video"
  ) {
    return (
      <VideoWorkspace
        project={project}
      />
    );
  }

  const editor =
    EDITOR_DEFINITIONS[
      projectType
    ];

  const Icon = editor.icon;

  return (
    <div className="flex min-h-[560px] items-center justify-center p-6 sm:p-10">
      <div className="max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
          <Icon className="h-8 w-8 text-amber-200" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold">
          {editor.label}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          This project already opens through the unified Beacon Studio route.
          The dedicated {editor.badge.toLowerCase()} editing tools can now be
          added here without creating another project URL or API namespace.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <FeatureCard
            icon={FileImage}
            title="Asset workspace"
            text="Project files and generated outputs will live together."
          />

          <FeatureCard
            icon={MonitorPlay}
            title="Live preview"
            text="The tool-specific editor can render inside this workspace."
          />
        </div>
      </div>
    </div>
  );
}

function VideoWorkspace({
  project,
}: {
  project: StudioProject;
}) {
  const scenes =
    project.scenes ?? [];

  return (
    <div>
      <div className="grid min-h-[420px] place-items-center border-b border-white/10 bg-black/30 p-6">
        <div className="w-full max-w-4xl">
          <div
            className="relative mx-auto overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            style={{
              aspectRatio:
                project.aspectRatio ===
                "9:16"
                  ? "9 / 16"
                  : project.aspectRatio ===
                      "1:1"
                    ? "1 / 1"
                    : project.aspectRatio ===
                        "4:5"
                      ? "4 / 5"
                      : "16 / 9",
              maxHeight: "560px",
            }}
          >
            {project.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  project.thumbnailUrl
                }
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08),transparent_55%)]">
                <MonitorPlay className="h-12 w-12 text-amber-200" />
                <p className="mt-4 text-sm font-semibold text-white">
                  Video preview
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Add assets and scenes to build the preview.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Timeline
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {scenes.length}{" "}
              {scenes.length === 1
                ? "scene"
                : "scenes"}
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
            {formatDuration(
              project.durationMs,
            )}
          </span>
        </div>

        {scenes.length > 0 ? (
          <div className="mt-5 space-y-3">
            {scenes.map(
              (
                scene,
                index,
              ) => (
                <div
                  key={scene.id}
                  className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-300/10 text-sm font-semibold text-amber-200">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {scene.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {scene.text ||
                        "No scene text"}
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    {formatDuration(
                      scene.durationMs,
                    )}
                  </span>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
            <Video className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-300">
              No scenes yet
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Scene creation and timeline controls can be connected here next.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof FileImage;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
      <Icon className="h-5 w-5 text-amber-200" />
      <p className="mt-3 text-sm font-semibold text-white">
        {title}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}