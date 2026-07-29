"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clapperboard,
  Clock3,
  Film,
  LoaderCircle,
  MonitorPlay,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

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

type ProjectTemplate = "beacon-ai" | "beacon-business";

const templates: Record<
  ProjectTemplate,
  {
    name: string;
    description: string;
    aspectRatio: MotionAspectRatio;
    durationMs: number;
    scenes: MotionScene[];
  }
> = {
  "beacon-ai": {
    name: "Beacon AI Motion",
    description:
      "A motion project built around the real Beacon AI website experience.",
    aspectRatio: "9:16",
    durationMs: 15_000,
    scenes: [
      {
        id: "ai-intro",
        title: "Brand intro",
        startMs: 0,
        durationMs: 2_500,
        text: "Beacon AI",
      },
      {
        id: "ai-search",
        title: "Search experience",
        startMs: 2_500,
        durationMs: 3_000,
        text: "Describe what you need.",
      },
      {
        id: "ai-results",
        title: "Recommendation results",
        startMs: 5_500,
        durationMs: 5_000,
        text: "Trusted options, clearly ranked.",
      },
      {
        id: "ai-trust",
        title: "Trust and transparency",
        startMs: 10_500,
        durationMs: 2_500,
        text: "Know why each result appears.",
      },
      {
        id: "ai-end",
        title: "End card",
        startMs: 13_000,
        durationMs: 2_000,
        text: "Search smarter. Choose confidently.",
      },
    ],
  },
  "beacon-business": {
    name: "Beacon Business Motion",
    description:
      "A motion project built around the real Beacon Business website experience.",
    aspectRatio: "9:16",
    durationMs: 15_000,
    scenes: [
      {
        id: "business-intro",
        title: "Brand intro",
        startMs: 0,
        durationMs: 2_500,
        text: "Beacon Business",
      },
      {
        id: "business-brief",
        title: "Business brief",
        startMs: 2_500,
        durationMs: 3_000,
        text: "Tell Beacon about your business.",
      },
      {
        id: "business-build",
        title: "Website generation",
        startMs: 5_500,
        durationMs: 4_500,
        text: "Build a professional business website.",
      },
      {
        id: "business-tools",
        title: "Business tools",
        startMs: 10_000,
        durationMs: 3_000,
        text: "Quotes, branding, analytics and growth.",
      },
      {
        id: "business-end",
        title: "End card",
        startMs: 13_000,
        durationMs: 2_000,
        text: "Build your business with Beacon.",
      },
    ],
  },
};

function readProjectsPayload(payload: unknown): MotionProject[] {
  if (Array.isArray(payload)) {
    return payload as MotionProject[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "projects" in payload &&
    Array.isArray((payload as { projects?: unknown }).projects)
  ) {
    return (payload as { projects: MotionProject[] }).projects;
  }

  return [];
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function BeaconMotionMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/25 bg-slate-950/80 shadow-[0_0_45px_rgba(246,196,83,0.12)]">
      <Clapperboard className="h-7 w-7 text-amber-200" />
    </div>
  );
}

export default function MotionStudioPage() {
  const [projects, setProjects] = useState<MotionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<ProjectTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime(),
      ),
    [projects],
  );

  async function loadProjects() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/motion/projects", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "Unable to load motion projects.";

        throw new Error(message);
      }

      setProjects(readProjectsPayload(payload));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load motion projects.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function createProject(templateId: ProjectTemplate) {
    if (creating) {
      return;
    }

    setCreating(templateId);
    setError(null);

    try {
      const template = templates[templateId];

      const response = await fetch("/api/motion/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...template,
          assetIds: [],
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { project?: MotionProject; error?: string }
        | null;

      if (!response.ok || !payload?.project) {
        throw new Error(
          payload?.error ?? "Unable to create the motion project.",
        );
      }

      window.location.assign(
        `/demo/editor?projectId=${encodeURIComponent(payload.project.id)}`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create the motion project.",
      );
      setCreating(null);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_34%),linear-gradient(180deg,#020617_0%,#071126_50%,#020617_100%)] text-white">
      <header className="border-b border-white/10 bg-slate-950/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <BeaconMotionMark />
            <div>
              <p className="text-xl font-black tracking-[-0.04em]">
                Beacon Motion
              </p>
              <p className="text-sm font-semibold text-slate-400">
                Working motion studio and project manager
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black transition hover:bg-white/10"
              href="/admin"
            >
              Admin dashboard
            </Link>

            <Link
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black transition hover:bg-white/10"
              href="/"
            >
              Return to Beacon
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-200">
                <Film className="h-4 w-4" />
                Production workspace
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                Create real Beacon motion projects.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-400">
                Start a project, edit scenes on the timeline and preview the
                real Beacon AI or Beacon Business website inside the editor.
                The old mock phone showcase has been removed.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[28rem]">
              <button
                className="group rounded-[1.5rem] border border-blue-300/20 bg-blue-500/10 p-5 text-left transition hover:-translate-y-1 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={creating !== null}
                onClick={() => void createProject("beacon-ai")}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <Sparkles className="h-6 w-6 text-cyan-200" />
                  {creating === "beacon-ai" ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </div>
                <p className="mt-5 text-lg font-black">
                  New Beacon AI project
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                  Uses the real Beacon AI demo as the live preview.
                </p>
              </button>

              <button
                className="group rounded-[1.5rem] border border-amber-300/20 bg-amber-300/[0.08] p-5 text-left transition hover:-translate-y-1 hover:bg-amber-300/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={creating !== null}
                onClick={() => void createProject("beacon-business")}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <BriefcaseBusiness className="h-6 w-6 text-amber-200" />
                  {creating === "beacon-business" ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </div>
                <p className="mt-5 text-lg font-black">
                  New Business project
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                  Uses the real Beacon Business demo as the live preview.
                </p>
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold text-red-100">
            {error}
          </div>
        )}

        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Motion projects
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.045em]">
                Your studio
              </h2>
            </div>

            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black transition hover:bg-white/10 disabled:opacity-50"
              disabled={loading}
              onClick={() => void loadProjects()}
              type="button"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh projects
            </button>
          </div>

          {loading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.035]"
                />
              ))}
            </div>
          ) : sortedProjects.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {sortedProjects.map((project) => {
                const isBusiness =
                  `${project.id} ${project.name}`
                    .toLowerCase()
                    .includes("business");

                return (
                  <article
                    key={project.id}
                    className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50">
                        {isBusiness ? (
                          <BriefcaseBusiness className="h-6 w-6 text-amber-200" />
                        ) : (
                          <Sparkles className="h-6 w-6 text-cyan-200" />
                        )}
                      </div>

                      <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.12em] text-emerald-200">
                        Saved
                      </span>
                    </div>

                    <h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">
                      {project.name}
                    </h3>

                    <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-slate-400">
                      {project.description || "Beacon Motion project"}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                        <Clock3 className="h-4 w-4 text-slate-500" />
                        <p className="mt-2 text-xs font-black">
                          {(project.durationMs / 1000).toFixed(0)}s
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                        <MonitorPlay className="h-4 w-4 text-slate-500" />
                        <p className="mt-2 text-xs font-black">
                          {project.aspectRatio}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                        <Film className="h-4 w-4 text-slate-500" />
                        <p className="mt-2 text-xs font-black">
                          {project.scenes.length} scenes
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs font-semibold text-slate-500">
                      Updated {formatUpdatedAt(project.updatedAt)}
                    </p>

                    <Link
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-3.5 text-sm font-black shadow-[0_12px_35px_rgba(37,99,235,0.3)] transition hover:scale-[1.015]"
                      href={`/demo/editor?projectId=${encodeURIComponent(project.id)}`}
                    >
                      Open editor
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-white/15 bg-white/[0.025] p-10 text-center">
              <Clapperboard className="mx-auto h-10 w-10 text-slate-600" />
              <h3 className="mt-5 text-xl font-black">
                No motion projects yet
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-500">
                Create a Beacon AI or Beacon Business project above. It will
                be stored in the private Motion project store and appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}