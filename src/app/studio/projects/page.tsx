"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Download,
  Film,
  Folder,
  FolderOpen,
  Grid2X2,
  Heart,
  Import,
  LayoutList,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
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
  favourite?: boolean;
  folder?: string;
  tags?: string[];
};

type ProjectApiResponse =
  | StudioProject[]
  | {
      projects?: StudioProject[];
      data?: StudioProject[];
      project?: StudioProject;
      id?: string;
    };

type ViewMode = "grid" | "list";
type ProjectFilter =
  | "all"
  | "recent"
  | "favourites"
  | "trash";

const DATE_FORMATTER = new Intl.DateTimeFormat(
  "en-GB",
  {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
);

function normaliseProjects(
  payload: ProjectApiResponse,
): StudioProject[] {
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

function projectIdFromResponse(
  payload: ProjectApiResponse,
): string | null {
  if (Array.isArray(payload)) {
    return payload[0]?.id ?? null;
  }

  return payload.project?.id ?? payload.id ?? null;
}

function formatDate(project: StudioProject): string {
  const value =
    project.updatedAt ?? project.createdAt;

  if (!value) {
    return "Recently updated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return DATE_FORMATTER.format(date);
}

function formatDuration(
  durationMs?: number,
): string {
  if (!durationMs || durationMs <= 0) {
    return "15 sec";
  }

  return `${Math.max(
    1,
    Math.round(durationMs / 1000),
  )} sec`;
}

function getProjectTime(
  project: StudioProject,
): number {
  const value =
    project.updatedAt ?? project.createdAt;

  if (!value) {
    return 0;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 0
    : date.getTime();
}

function makeCopyName(name: string): string {
  const base = name.trim() || "Untitled project";
  return base.toLowerCase().endsWith("copy")
    ? `${base} 2`
    : `${base} Copy`;
}

export default function StudioProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<
    StudioProject[]
  >([]);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [viewMode, setViewMode] =
    useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] =
    useState<ProjectFilter>("all");
  const [activeFolder, setActiveFolder] =
    useState("All projects");
  const [isLoading, setIsLoading] =
    useState(true);
  const [isRefreshing, setIsRefreshing] =
    useState(false);
  const [busyProjectId, setBusyProjectId] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  const loadProjects = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const response = await fetch(
          "/api/motion/projects",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Could not load your Studio projects.",
          );
        }

        const payload =
          (await response.json()) as ProjectApiResponse;

        setProjects(
          normaliseProjects(payload).sort(
            (a, b) =>
              getProjectTime(b) -
              getProjectTime(a),
          ),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your Studio projects.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const folders = useMemo(() => {
    const unique = new Set<string>();

    for (const project of projects) {
      const folder = project.folder?.trim();

      if (folder) {
        unique.add(folder);
      }
    }

    return [
      "All projects",
      ...Array.from(unique).sort((a, b) =>
        a.localeCompare(b),
      ),
    ];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    let next = [...projects];

    if (
      activeFolder !== "All projects"
    ) {
      next = next.filter(
        (project) =>
          project.folder === activeFolder,
      );
    }

    if (activeFilter === "recent") {
      const cutoff =
        Date.now() -
        1000 * 60 * 60 * 24 * 30;

      next = next.filter(
        (project) =>
          getProjectTime(project) >= cutoff,
      );
    }

    if (activeFilter === "favourites") {
      next = next.filter(
        (project) => project.favourite,
      );
    }

    if (activeFilter === "trash") {
      return [];
    }

    if (query) {
      next = next.filter((project) => {
        const haystack = [
          project.name,
          project.description,
          project.sourceUrl,
          project.folder,
          ...(project.tags ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      });
    }

    return next;
  }, [
    projects,
    activeFolder,
    activeFilter,
    searchQuery,
  ]);

  const createProject = async () => {
    setError(null);

    try {
      const response = await fetch(
        "/api/motion/projects",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: "Untitled website video",
            title:
              "Untitled website video",
            description:
              "A new Beacon Studio website motion project.",
            sourceUrl: "/",
            aspectRatio: "16:9",
            device: "desktop",
            durationMs: 15000,
            tracks: [],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Could not create the project.",
        );
      }

      const payload =
        (await response.json()) as ProjectApiResponse;
      const id =
        projectIdFromResponse(payload);

      if (!id) {
        throw new Error(
          "The project was created without an ID.",
        );
      }

      router.push(
        `/studio/editor/${encodeURIComponent(
          id,
        )}`,
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create the project.",
      );
    }
  };

  const deleteProject = async (
    projectId: string,
  ) => {
    const confirmed = window.confirm(
      "Delete this Studio project? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setBusyProjectId(projectId);
    setError(null);

    try {
      const response = await fetch(
        `/api/motion/projects/${encodeURIComponent(
          projectId,
        )}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Could not delete the project.",
        );
      }

      setProjects((current) =>
        current.filter(
          (project) =>
            project.id !== projectId,
        ),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the project.",
      );
    } finally {
      setBusyProjectId(null);
    }
  };

  const duplicateProject = async (
    project: StudioProject,
  ) => {
    setBusyProjectId(project.id);
    setError(null);

    try {
      const response = await fetch(
        "/api/motion/projects",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...project,
            id: undefined,
            name: makeCopyName(project.name),
            title: makeCopyName(
              project.name,
            ),
            createdAt: undefined,
            updatedAt: undefined,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Could not duplicate the project.",
        );
      }

      const payload =
        (await response.json()) as ProjectApiResponse;
      const id =
        projectIdFromResponse(payload);

      if (!id) {
        throw new Error(
          "The duplicated project did not return an ID.",
        );
      }

      await loadProjects(true);
    } catch (duplicateError) {
      setError(
        duplicateError instanceof Error
          ? duplicateError.message
          : "Could not duplicate the project.",
      );
    } finally {
      setBusyProjectId(null);
    }
  };

  const toggleFavourite = async (
    project: StudioProject,
  ) => {
    const nextValue = !project.favourite;

    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? {
              ...item,
              favourite: nextValue,
            }
          : item,
      ),
    );

    try {
      const response = await fetch(
        `/api/motion/projects/${encodeURIComponent(
          project.id,
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...project,
            favourite: nextValue,
          }),
        },
      );

      if (!response.ok) {
        throw new Error();
      }
    } catch {
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id
            ? {
                ...item,
                favourite:
                  project.favourite,
              }
            : item,
        ),
      );

      setError(
        "The favourite setting could not be saved.",
      );
    }
  };

  const exportProject = (
    project: StudioProject,
  ) => {
    const data = JSON.stringify(
      project,
      null,
      2,
    );
    const blob = new Blob([data], {
      type: "application/json",
    });
    const url =
      URL.createObjectURL(blob);
    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download = `${project.name
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "studio-project"}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#050b18] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute right-[-8rem] top-[20%] h-[30rem] w-[30rem] rounded-full bg-cyan-400/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto min-h-screen w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Back to Studio"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              onClick={() =>
                router.push("/studio")
              }
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-[0_10px_35px_rgba(37,99,235,0.25)]">
              <FolderOpen className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Studio projects
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Organise, duplicate and open your website motion projects.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
              onClick={() =>
                void loadProjects(true)
              }
              type="button"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>

            <button
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
              type="button"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>

            <button
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-4 text-xs font-black text-white transition hover:scale-[1.02]"
              onClick={() =>
                void createProject()
              }
              type="button"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">
            <span>{error}</span>
            <button
              className="shrink-0 text-xs font-black uppercase tracking-wider text-red-200 hover:text-white"
              onClick={() =>
                setError(null)
              }
              type="button"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="grid gap-5 py-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-3 lg:sticky lg:top-5 lg:h-fit">
            <div className="space-y-1">
              <FilterButton
                active={
                  activeFilter === "all"
                }
                icon={
                  <Grid2X2 className="h-4 w-4" />
                }
                label="All projects"
                onClick={() => {
                  setActiveFilter("all");
                  setActiveFolder(
                    "All projects",
                  );
                }}
              />
              <FilterButton
                active={
                  activeFilter === "recent"
                }
                icon={
                  <Clock3 className="h-4 w-4" />
                }
                label="Recent"
                onClick={() =>
                  setActiveFilter("recent")
                }
              />
              <FilterButton
                active={
                  activeFilter ===
                  "favourites"
                }
                icon={
                  <Star className="h-4 w-4" />
                }
                label="Favourites"
                onClick={() =>
                  setActiveFilter(
                    "favourites",
                  )
                }
              />
              <FilterButton
                active={
                  activeFilter === "trash"
                }
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                label="Trash"
                onClick={() =>
                  setActiveFilter("trash")
                }
              />
            </div>

            <div className="my-4 border-t border-white/10" />

            <div className="flex items-center justify-between px-2">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-600">
                Folders
              </p>
              <button
                aria-label="Create folder"
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/10 hover:text-white"
                type="button"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2 space-y-1">
              {folders.map((folder) => (
                <button
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
                    activeFolder === folder
                      ? "bg-cyan-300/10 text-cyan-100"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                  }`}
                  key={folder}
                  onClick={() => {
                    setActiveFolder(folder);
                    setActiveFilter("all");
                  }}
                  type="button"
                >
                  {folder ===
                  "All projects" ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                  <span className="truncate">
                    {folder}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex h-11 w-full items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 sm:max-w-md">
                <Search className="h-4 w-4 text-slate-600" />
                <input
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-700"
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search projects, folders or tags"
                  type="search"
                  value={searchQuery}
                />
              </label>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-xs font-black text-slate-600">
                  {filteredProjects.length}{" "}
                  project
                  {filteredProjects.length === 1
                    ? ""
                    : "s"}
                </span>

                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                  <button
                    aria-label="Grid view"
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      viewMode === "grid"
                        ? "bg-white/10 text-white"
                        : "text-slate-600 hover:text-white"
                    }`}
                    onClick={() =>
                      setViewMode("grid")
                    }
                    type="button"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </button>

                  <button
                    aria-label="List view"
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      viewMode === "list"
                        ? "bg-white/10 text-white"
                        : "text-slate-600 hover:text-white"
                    }`}
                    onClick={() =>
                      setViewMode("list")
                    }
                    type="button"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {isLoading ? (
                <div className="flex min-h-[28rem] items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-300" />
                    <p className="mt-4 text-sm font-black text-slate-500">
                      Loading projects
                    </p>
                  </div>
                </div>
              ) : activeFilter ===
                "trash" ? (
                <EmptyState
                  description="Deleted projects are removed immediately at the moment. A recoverable trash system will be connected later."
                  icon={
                    <Trash2 className="h-6 w-6" />
                  }
                  title="Trash is empty"
                />
              ) : filteredProjects.length ===
                0 ? (
                <EmptyState
                  action={
                    !searchQuery
                      ? {
                          label:
                            "Create project",
                          onClick: () =>
                            void createProject(),
                        }
                      : undefined
                  }
                  description={
                    searchQuery
                      ? "Try changing your search or selecting another folder."
                      : "Create a website motion project and it will appear here."
                  }
                  icon={
                    <Film className="h-6 w-6" />
                  }
                  title={
                    searchQuery
                      ? "No matching projects"
                      : "No projects here yet"
                  }
                />
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map(
                    (project) => (
                      <ProjectCard
                        busy={
                          busyProjectId ===
                          project.id
                        }
                        key={project.id}
                        onDelete={() =>
                          void deleteProject(
                            project.id,
                          )
                        }
                        onDuplicate={() =>
                          void duplicateProject(
                            project,
                          )
                        }
                        onExport={() =>
                          exportProject(project)
                        }
                        onFavourite={() =>
                          void toggleFavourite(
                            project,
                          )
                        }
                        onOpen={() =>
                          router.push(
                            `/studio/editor/${encodeURIComponent(
                              project.id,
                            )}`,
                          )
                        }
                        project={project}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/55">
                  {filteredProjects.map(
                    (project, index) => (
                      <ProjectRow
                        busy={
                          busyProjectId ===
                          project.id
                        }
                        isLast={
                          index ===
                          filteredProjects.length -
                            1
                        }
                        key={project.id}
                        onDelete={() =>
                          void deleteProject(
                            project.id,
                          )
                        }
                        onDuplicate={() =>
                          void duplicateProject(
                            project,
                          )
                        }
                        onExport={() =>
                          exportProject(project)
                        }
                        onFavourite={() =>
                          void toggleFavourite(
                            project,
                          )
                        }
                        onOpen={() =>
                          router.push(
                            `/studio/editor/${encodeURIComponent(
                              project.id,
                            )}`,
                          )
                        }
                        project={project}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

type FilterButtonProps = {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

function FilterButton({
  active,
  icon,
  label,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
        active
          ? "bg-white/10 text-white"
          : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

type ProjectActions = {
  busy: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onFavourite: () => void;
  onOpen: () => void;
  project: StudioProject;
};

function ProjectCard({
  busy,
  onDelete,
  onDuplicate,
  onExport,
  onFavourite,
  onOpen,
  project,
}: ProjectActions) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]">
      <button
        className="block w-full text-left"
        onClick={onOpen}
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
              <Film className="relative h-9 w-9 text-cyan-200" />
            </>
          )}

          <span className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[0.65rem] font-black text-slate-200 backdrop-blur">
            {formatDuration(
              project.durationMs,
            )}
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-black">
                {project.name ||
                  "Untitled project"}
              </h2>
              <p className="mt-1 truncate text-xs font-semibold text-slate-600">
                {project.sourceUrl ||
                  "Website source not set"}
              </p>
            </div>

            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-700 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <MetaPill>
              {project.aspectRatio ??
                "16:9"}
            </MetaPill>
            {project.folder ? (
              <MetaPill>
                <Folder className="h-3 w-3" />
                {project.folder}
              </MetaPill>
            ) : null}
          </div>

          <p className="mt-4 text-xs font-bold text-slate-600">
            Updated {formatDate(project)}
          </p>
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
        <button
          aria-label={
            project.favourite
              ? "Remove favourite"
              : "Add favourite"
          }
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
            project.favourite
              ? "bg-amber-300/10 text-amber-200"
              : "text-slate-600 hover:bg-white/10 hover:text-white"
          }`}
          onClick={onFavourite}
          type="button"
        >
          <Star
            className={`h-4 w-4 ${
              project.favourite
                ? "fill-current"
                : ""
            }`}
          />
        </button>

        <ProjectMenu
          busy={busy}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onExport={onExport}
        />
      </div>
    </article>
  );
}

type ProjectRowProps = ProjectActions & {
  isLast: boolean;
};

function ProjectRow({
  busy,
  isLast,
  onDelete,
  onDuplicate,
  onExport,
  onFavourite,
  onOpen,
  project,
}: ProjectRowProps) {
  return (
    <div
      className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${
        isLast
          ? ""
          : "border-b border-white/10"
      }`}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
        onClick={onOpen}
        type="button"
      >
        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-blue-700/30 via-slate-900 to-cyan-500/10">
          <Film className="h-5 w-5 text-cyan-200" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-black">
            {project.name ||
              "Untitled project"}
          </h2>
          <p className="mt-1 truncate text-xs font-semibold text-slate-600">
            {project.sourceUrl ||
              "Website source not set"}
          </p>
        </div>
      </button>

      <div className="flex items-center justify-between gap-5 sm:justify-end">
        <span className="hidden text-xs font-bold text-slate-600 md:inline">
          {project.aspectRatio ??
            "16:9"}
        </span>

        <span className="hidden text-xs font-bold text-slate-600 lg:inline">
          {formatDuration(
            project.durationMs,
          )}
        </span>

        <span className="text-xs font-bold text-slate-600">
          {formatDate(project)}
        </span>

        <button
          aria-label={
            project.favourite
              ? "Remove favourite"
              : "Add favourite"
          }
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
            project.favourite
              ? "bg-amber-300/10 text-amber-200"
              : "text-slate-600 hover:bg-white/10 hover:text-white"
          }`}
          onClick={onFavourite}
          type="button"
        >
          <Star
            className={`h-4 w-4 ${
              project.favourite
                ? "fill-current"
                : ""
            }`}
          />
        </button>

        <ProjectMenu
          busy={busy}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onExport={onExport}
        />
      </div>
    </div>
  );
}

type ProjectMenuProps = {
  busy: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
};

function ProjectMenu({
  busy,
  onDelete,
  onDuplicate,
  onExport,
}: ProjectMenuProps) {
  const [open, setOpen] =
    useState(false);

  return (
    <div className="relative">
      <button
        aria-label="Project actions"
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        disabled={busy}
        onClick={() =>
          setOpen((value) => !value)
        }
        type="button"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </button>

      {open ? (
        <>
          <button
            aria-label="Close project actions"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />

          <div className="absolute bottom-10 right-0 z-30 w-44 rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-[0_20px_70px_rgba(0,0,0,0.55)]">
            <MenuButton
              icon={
                <Copy className="h-4 w-4" />
              }
              label="Duplicate"
              onClick={() => {
                setOpen(false);
                onDuplicate();
              }}
            />
            <MenuButton
              icon={
                <Download className="h-4 w-4" />
              }
              label="Export JSON"
              onClick={() => {
                setOpen(false);
                onExport();
              }}
            />
            <MenuButton
              danger
              icon={
                <Trash2 className="h-4 w-4" />
              }
              label="Delete"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

type MenuButtonProps = {
  danger?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

function MenuButton({
  danger = false,
  icon,
  label,
  onClick,
}: MenuButtonProps) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
        danger
          ? "text-red-300 hover:bg-red-400/10"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function MetaPill({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] font-black text-slate-500">
      {children}
    </span>
  );
}

type EmptyStateProps = {
  action?: {
    label: string;
    onClick: () => void;
  };
  description: string;
  icon: React.ReactNode;
  title: string;
};

function EmptyState({
  action,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
        {icon}
      </div>

      <h2 className="mt-4 text-lg font-black">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-600">
        {description}
      </p>

      {action ? (
        <button
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-5 text-sm font-black text-white transition hover:scale-[1.02]"
          onClick={action.onClick}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </button>
      ) : null}
    </div>
  );
}