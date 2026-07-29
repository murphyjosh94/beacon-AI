"use client";

import {
  ArrowRight,
  Clock3,
  Film,
  Globe2,
  LayoutTemplate,
  Loader2,
  MonitorPlay,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type StudioProject = {
  id: string;
  name: string;
  description?: string;
  sourceUrl?: string;
  durationMs?: number;
  aspectRatio?: string;
  updatedAt?: string;
  createdAt?: string;
  thumbnailUrl?: string;
};

type StudioProjectsResponse =
  | StudioProject[]
  | {
      projects?: StudioProject[];
      data?: StudioProject[];
      project?: StudioProject;
      id?: string;
    };

type Template = {
  id: string;
  name: string;
  description: string;
  duration: string;
  sourceUrl: string;
  badge: string;
};

const TEMPLATES: Template[] = [
  {
    id: "beacon-ai-overview",
    name: "Beacon AI Overview",
    description:
      "A polished product walkthrough built around the Beacon AI homepage.",
    duration: "15 sec",
    sourceUrl: "/",
    badge: "Beacon AI",
  },
  {
    id: "beacon-business-promo",
    name: "Beacon Business Promo",
    description:
      "Showcase services, website packages and the primary call to action.",
    duration: "20 sec",
    sourceUrl: "/business",
    badge: "Business",
  },
  {
    id: "website-tour",
    name: "Website Tour",
    description:
      "Start with a clean timeline for any same-origin Beacon website page.",
    duration: "30 sec",
    sourceUrl: "/",
    badge: "Blank",
  },
];

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function normaliseProjects(payload: StudioProjectsResponse): StudioProject[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.projects)) {
    return payload.projects;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.project) {
    return [payload.project];
  }

  return [];
}

function projectIdFromResponse(payload: StudioProjectsResponse): string | null {
  if (Array.isArray(payload)) {
    return payload[0]?.id ?? null;
  }

  return payload.project?.id ?? payload.id ?? null;
}

function formatProjectDate(project: StudioProject): string {
  const rawDate = project.updatedAt ?? project.createdAt;

  if (!rawDate) {
    return "Recently created";
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return `Updated ${DATE_FORMATTER.format(date)}`;
}

function formatDuration(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "15 sec";
  }

  return `${Math.max(1, Math.round(durationMs / 1000))} sec`;
}

export default function StudioDashboardPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Studio Project");
  const [sourceUrl, setSourceUrl] = useState("/");
  const [description, setDescription] = useState(
    "A live website motion project created in Beacon Studio.",
  );

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/motion/projects", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load your Studio projects.");
      }

      const payload = (await response.json()) as StudioProjectsResponse;
      setProjects(normaliseProjects(payload));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your Studio projects.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const searchable = [
        project.name,
        project.description,
        project.sourceUrl,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [projects, searchQuery]);

  const createProject = async (
    event?: FormEvent<HTMLFormElement>,
    template?: Template,
  ) => {
    event?.preventDefault();

    if (isCreating) {
      return;
    }

    const finalName = template?.name ?? projectName.trim();
    const finalSourceUrl = template?.sourceUrl ?? sourceUrl.trim();
    const finalDescription = template?.description ?? description.trim();

    if (!finalName) {
      setError("Enter a project name.");
      return;
    }

    if (!finalSourceUrl) {
      setError("Enter a website path or URL.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/motion/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: finalName,
          title: finalName,
          description: finalDescription,
          sourceUrl: finalSourceUrl,
          aspectRatio: "16:9",
          device: "desktop",
          durationMs: template?.duration === "30 sec" ? 30000 : template?.duration === "20 sec" ? 20000 : 15000,
          tracks: [],
        }),
      });

      if (!response.ok) {
        const detail = await response
          .json()
          .catch(() => null) as { error?: string; message?: string } | null;

        throw new Error(
          detail?.error ??
            detail?.message ??
            "Could not create the Studio project.",
        );
      }

      const payload = (await response.json()) as StudioProjectsResponse;
      const id = projectIdFromResponse(payload);

      if (!id) {
        throw new Error(
          "The project was created, but no project ID was returned.",
        );
      }

      router.push(`/studio/editor/${encodeURIComponent(id)}`);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create the Studio project.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (deletingId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this Studio project? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(projectId);
    setError(null);

    try {
      const response = await fetch(
        `/api/motion/projects/${encodeURIComponent(projectId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Could not delete the project.");
      }

      setProjects((current) =>
        current.filter((project) => project.id !== projectId),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the project.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#050b18] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute right-[-8rem] top-[12rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute bottom-[-12rem] left-[35%] h-[26rem] w-[26rem] rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/25 bg-gradient-to-br from-blue-600 to-cyan-400 shadow-[0_0_35px_rgba(56,189,248,0.25)]">
              <Film className="h-6 w-6 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">
                  Beacon Studio
                </h1>
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-amber-200">
                  Motion
                </span>
              </div>

              <p className="mt-1 text-sm font-medium text-slate-400">
                Create motion videos from real Beacon websites.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 text-sm font-black text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              onClick={() => router.push("/admin")}
              type="button"
            >
              Back to admin
            </button>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-5 text-sm font-black text-white shadow-[0_15px_45px_rgba(37,99,235,0.28)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreating}
              onClick={() => setShowCreatePanel(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          </div>
        </header>

        <section className="grid gap-5 py-7 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-700/30 via-slate-950/90 to-cyan-500/10 p-6 shadow-[0_35px_100px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="absolute right-[-5rem] top-[-5rem] h-52 w-52 rounded-full border border-cyan-300/20 bg-cyan-400/10 blur-sm" />

            <div className="relative max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100">
                <WandSparkles className="h-3.5 w-3.5" />
                Live website motion editor
              </div>

              <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                Turn real websites into polished promotional videos.
              </h2>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
                Load Beacon AI, Beacon Business or another supported page,
                then animate scrolling, camera movement, highlights, cursor
                actions and text from one timeline.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-slate-950 transition hover:scale-[1.02]"
                  onClick={() => setShowCreatePanel(true)}
                  type="button"
                >
                  Create from website
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-black text-white transition hover:bg-white/10"
                  onClick={() =>
                    document
                      .getElementById("studio-templates")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  type="button"
                >
                  <LayoutTemplate className="h-4 w-4" />
                  Browse templates
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard
              icon={<Globe2 className="h-5 w-5" />}
              label="Live source"
              value="Real websites"
            />
            <StatCard
              icon={<MonitorPlay className="h-5 w-5" />}
              label="Preview modes"
              value="Desktop · Tablet · Mobile"
            />
            <StatCard
              icon={<Sparkles className="h-5 w-5" />}
              label="Editor engine"
              value="Timeline controlled"
            />
          </div>
        </section>

        {error ? (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">
            <span>{error}</span>
            <button
              className="shrink-0 text-xs font-black uppercase tracking-wider text-red-200 hover:text-white"
              onClick={() => setError(null)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Your projects</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Continue editing or start a fresh website video.
              </p>
            </div>

            <label className="flex h-11 w-full items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 sm:max-w-sm">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects"
                type="search"
                value={searchQuery}
              />
            </label>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-300" />
                  <p className="mt-3 text-sm font-bold text-slate-400">
                    Loading Studio projects
                  </p>
                </div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <article
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]"
                    key={project.id}
                  >
                    <button
                      className="block w-full text-left"
                      onClick={() =>
                        router.push(
                          `/studio/editor/${encodeURIComponent(project.id)}`,
                        )
                      }
                      type="button"
                    >
                      <div className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-br from-blue-700/30 via-slate-900 to-cyan-500/10">
                        {project.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt=""
                            className="h-full w-full object-cover"
                            src={project.thumbnailUrl}
                          />
                        ) : (
                          <>
                            <div className="absolute inset-5 rounded-2xl border border-white/10 bg-slate-950/70 shadow-2xl" />
                            <Globe2 className="relative h-9 w-9 text-cyan-200" />
                          </>
                        )}

                        <span className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[0.65rem] font-black text-slate-200 backdrop-blur">
                          {formatDuration(project.durationMs)}
                        </span>
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black text-white">
                              {project.name || "Untitled project"}
                            </h3>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                              {project.sourceUrl || "Website source not set"}
                            </p>
                          </div>

                          <MoreHorizontal className="h-5 w-5 shrink-0 text-slate-600" />
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatProjectDate(project)}
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-black text-cyan-200">
                            Open
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-white/10 px-5 py-3">
                      <button
                        className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-red-200 disabled:opacity-50"
                        disabled={deletingId === project.id}
                        onClick={() => void deleteProject(project.id)}
                        type="button"
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete project
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                  <Film className="h-6 w-6 text-cyan-200" />
                </div>

                <h3 className="mt-4 text-lg font-black">
                  {searchQuery ? "No matching projects" : "Create your first Studio project"}
                </h3>

                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  {searchQuery
                    ? "Try another search term or clear the search."
                    : "Choose a Beacon page, open it in the live viewport and build its motion timeline."}
                </p>

                {!searchQuery ? (
                  <button
                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500"
                    onClick={() => setShowCreatePanel(true)}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    New project
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <section className="py-8" id="studio-templates">
          <div>
            <h2 className="text-xl font-black">Start from a template</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Create the project structure now, then build its timeline inside
              the editor.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {TEMPLATES.map((template) => (
              <button
                className="group rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCreating}
                key={template.id}
                onClick={() => void createProject(undefined, template)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-cyan-100">
                    {template.badge}
                  </span>

                  <span className="text-xs font-black text-slate-500">
                    {template.duration}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-black">{template.name}</h3>
                <p className="mt-2 min-h-12 text-sm font-medium leading-6 text-slate-500">
                  {template.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-200">
                  Use template
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {showCreatePanel ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
        >
          <button
            aria-label="Close create project dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => setShowCreatePanel(false)}
            type="button"
          />

          <form
            className="relative w-full max-w-xl rounded-t-[2rem] border border-white/10 bg-[#081122] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.65)] sm:rounded-[2rem] sm:p-7"
            onSubmit={(event) => void createProject(event)}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Create Studio project</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Use a route from this Beacon application for full motion
                  bridge control.
                </p>
              </div>

              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-slate-400 hover:bg-white/10 hover:text-white"
                onClick={() => setShowCreatePanel(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Project name
                </span>
                <input
                  autoFocus
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:bg-white/[0.07]"
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Beacon AI launch video"
                  value={projectName}
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Website route or URL
                </span>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:bg-white/[0.07]"
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="/ or /business"
                  value={sourceUrl}
                />
                <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
                  Same-origin Beacon routes can receive scrolling, clicking,
                  typing and highlight commands from Studio.
                </p>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Description
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:bg-white/[0.07]"
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </label>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="h-11 rounded-full border border-white/10 bg-white/5 px-5 text-sm font-black text-slate-300 transition hover:bg-white/10"
                onClick={() => setShowCreatePanel(false)}
                type="button"
              >
                Cancel
              </button>

              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-6 text-sm font-black text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCreating}
                type="submit"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create and open
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex min-h-28 items-center gap-4 rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
        {icon}
      </div>

      <div>
        <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-600">
          {label}
        </p>
        <p className="mt-1 text-sm font-black text-slate-200">{value}</p>
      </div>
    </div>
  );
}