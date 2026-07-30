import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Copy,
  Film,
  FolderOpen,
  Grid2X2,
  LayoutList,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
} from "drizzle-orm";

import {
  hasUnrestrictedBeaconAccess,
  requireSignedInAccount,
} from "@/lib/auth/AdminAccess";
import { database } from "@/lib/database/Database";
import {
  studioGeneration,
  studioProject,
} from "@/lib/database/schema";
import type {
  StudioCampaignPlan,
  StudioCampaignVariant,
} from "@/app/studio/_engine/ScenePlanner";
import type {
  StudioOutputFormatId,
} from "@/app/studio/_engine/PromptBuilder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudioProjectsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    view?: string;
    sort?: string;
  }>;
};

type ProjectBrief = {
  prompt?: string;
  quality?: string;
  outputCount?: number;
  formats?: StudioOutputFormatId[];
};

type CampaignPlanSummary = Pick<
  StudioCampaignPlan,
  "durationMs" | "backgroundColor"
> & {
  variants: Array<
    Pick<
      StudioCampaignVariant,
      | "id"
      | "format"
      | "title"
      | "aspectRatio"
      | "width"
      | "height"
      | "durationMs"
      | "backgroundColor"
    >
  >;
};

type ViewMode = "grid" | "list";
type SortMode =
  | "updated-desc"
  | "updated-asc"
  | "title-asc"
  | "title-desc";
type StatusFilter =
  | "all"
  | "recent"
  | "draft"
  | "generating"
  | "ready"
  | "failed"
  | "archived"
  | "trash";


const DATE_FORMATTER = new Intl.DateTimeFormat(
  "en-GB",
  {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
);

function isCampaignPlanSummary(
  value: unknown,
): value is CampaignPlanSummary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const plan =
    value as Partial<CampaignPlanSummary>;

  return (
    typeof plan.durationMs === "number" &&
    typeof plan.backgroundColor === "string" &&
    Array.isArray(plan.variants)
  );
}

function readBrief(value: unknown): ProjectBrief {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as ProjectBrief;
}

function normaliseView(value?: string): ViewMode {
  return value === "list" ? "list" : "grid";
}

function normaliseSort(value?: string): SortMode {
  if (
    value === "updated-asc" ||
    value === "title-asc" ||
    value === "title-desc"
  ) {
    return value;
  }

  return "updated-desc";
}

function normaliseStatus(
  value?: string,
): StatusFilter {
  if (
    value === "recent" ||
    value === "draft" ||
    value === "generating" ||
    value === "ready" ||
    value === "failed" ||
    value === "archived" ||
    value === "trash"
  ) {
    return value;
  }

  return "all";
}

function formatDate(value: Date): string {
  return DATE_FORMATTER.format(value);
}

function formatDuration(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "Campaign";
  }

  const totalSeconds = Math.max(
    1,
    Math.round(durationMs / 1_000),
  );

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const minutes =
    Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return seconds === 0
    ? `${minutes} min`
    : `${minutes}m ${seconds}s`;
}

function statusLabel(status: string): string {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "generating") {
    return "Generating";
  }

  if (status === "failed") {
    return "Failed";
  }

  if (status === "archived") {
    return "Archived";
  }

  return "Draft";
}

function statusClasses(status: string): string {
  if (status === "ready") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";
  }

  if (status === "generating") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  if (status === "failed") {
    return "border-red-300/30 bg-red-300/10 text-red-100";
  }

  if (status === "archived") {
    return "border-violet-300/30 bg-violet-300/10 text-violet-100";
  }

  return "border-slate-300/20 bg-white/5 text-slate-300";
}

function formatOutputName(format: string): string {
  return format
    .split("-")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function makeCopyTitle(title: string): string {
  const clean =
    title.trim() || "Untitled project";

  return clean.toLowerCase().endsWith("copy")
    ? `${clean} 2`
    : `${clean} Copy`;
}

function buildProjectsUrl(
  current: {
    search: string;
    status: StatusFilter;
    view: ViewMode;
    sort: SortMode;
  },
  patch: Partial<{
    search: string;
    status: StatusFilter;
    view: ViewMode;
    sort: SortMode;
  }>,
): string {
  const next = {
    ...current,
    ...patch,
  };

  const params = new URLSearchParams();

  if (next.search) {
    params.set("search", next.search);
  }

  if (next.status !== "all") {
    params.set("status", next.status);
  }

  if (next.view !== "grid") {
    params.set("view", next.view);
  }

  if (next.sort !== "updated-desc") {
    params.set("sort", next.sort);
  }

  const query = params.toString();

  return query
    ? `/studio/projects?${query}`
    : "/studio/projects";
}

async function getOwnedProject(
  projectId: string,
  includeDeleted = false,
) {
  const account =
    await requireSignedInAccount();

  if (!account?.id) {
    redirect("/sign-in");
  }

  const deletedCondition =
    includeDeleted
      ? undefined
      : isNull(studioProject.deletedAt);

  const whereCondition =
    deletedCondition
      ? and(
          eq(studioProject.id, projectId),
          deletedCondition,
        )
      : eq(studioProject.id, projectId);

  const [project] = await database
    .select()
    .from(studioProject)
    .where(whereCondition)
    .limit(1);

  if (!project) {
    return {
      account,
      project: null,
    };
  }

  if (
    project.userId !== account.id &&
    !hasUnrestrictedBeaconAccess(account)
  ) {
    return {
      account,
      project: null,
    };
  }

  return {
    account,
    project,
  };
}

async function duplicateStudioProject(
  formData: FormData,
): Promise<void> {
  "use server";

  const projectId =
    formData.get("projectId");

  if (
    typeof projectId !== "string" ||
    !projectId.trim()
  ) {
    return;
  }

  const { account, project } =
    await getOwnedProject(projectId);

  if (!project) {
    return;
  }

  const now = new Date();

  await database
    .insert(studioProject)
    .values({
      userId: account.id,
      title: makeCopyTitle(project.title),
      description: project.description,
      status:
        project.status === "generating"
          ? "draft"
          : project.status,
      brief: project.brief,
      campaignPlan: project.campaignPlan,
      selectedVariantId:
        project.selectedVariantId,
      thumbnailUrl: project.thumbnailUrl,
      lastOpenedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

  revalidatePath("/studio");
  revalidatePath("/studio/projects");
}

async function moveProjectToTrash(
  formData: FormData,
): Promise<void> {
  "use server";

  const projectId =
    formData.get("projectId");

  if (
    typeof projectId !== "string" ||
    !projectId.trim()
  ) {
    return;
  }

  const { project } =
    await getOwnedProject(projectId);

  if (!project) {
    return;
  }

  const now = new Date();

  await database
    .update(studioProject)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(studioProject.id, project.id));

  revalidatePath("/studio");
  revalidatePath("/studio/projects");
}

async function restoreStudioProject(
  formData: FormData,
): Promise<void> {
  "use server";

  const projectId =
    formData.get("projectId");

  if (
    typeof projectId !== "string" ||
    !projectId.trim()
  ) {
    return;
  }

  const { project } =
    await getOwnedProject(projectId, true);

  if (!project || !project.deletedAt) {
    return;
  }

  const now = new Date();

  await database
    .update(studioProject)
    .set({
      deletedAt: null,
      updatedAt: now,
    })
    .where(eq(studioProject.id, project.id));

  revalidatePath("/studio");
  revalidatePath("/studio/projects");
}

async function permanentlyDeleteStudioProject(
  formData: FormData,
): Promise<void> {
  "use server";

  const projectId =
    formData.get("projectId");

  if (
    typeof projectId !== "string" ||
    !projectId.trim()
  ) {
    return;
  }

  const { project } =
    await getOwnedProject(projectId, true);

  if (!project || !project.deletedAt) {
    return;
  }

  await database
    .delete(studioProject)
    .where(eq(studioProject.id, project.id));

  revalidatePath("/studio");
  revalidatePath("/studio/projects");
}

export default async function StudioProjectsPage({
  searchParams,
}: StudioProjectsPageProps) {
  const account =
    await requireSignedInAccount();

  if (!account?.id) {
    redirect("/sign-in");
  }

  const resolved =
    searchParams
      ? await searchParams
      : undefined;

  const search =
    resolved?.search?.trim().toLowerCase() ??
    "";

  const status =
    normaliseStatus(resolved?.status);

  const view =
    normaliseView(resolved?.view);

  const sort =
    normaliseSort(resolved?.sort);

  const isTrash = status === "trash";

  const orderBy =
    sort === "updated-asc"
      ? asc(studioProject.updatedAt)
      : sort === "title-asc"
        ? asc(studioProject.title)
        : sort === "title-desc"
          ? desc(studioProject.title)
          : desc(studioProject.updatedAt);

  const projects = await database
    .select()
    .from(studioProject)
    .where(
      and(
        eq(studioProject.userId, account.id),
        isTrash
          ? isNotNull(studioProject.deletedAt)
          : isNull(studioProject.deletedAt),
      ),
    )
    .orderBy(orderBy)
    .limit(250);

  const projectIds =
    projects.map((project) => project.id);

  const generations =
    projectIds.length > 0
      ? await database
          .select()
          .from(studioGeneration)
          .where(
            inArray(
              studioGeneration.projectId,
              projectIds,
            ),
          )
          .orderBy(
            desc(studioGeneration.createdAt),
          )
      : [];

  const latestGenerationByProject =
    new Map<
      string,
      (typeof generations)[number]
    >();

  for (const generation of generations) {
    if (
      !latestGenerationByProject.has(
        generation.projectId,
      )
    ) {
      latestGenerationByProject.set(
        generation.projectId,
        generation,
      );
    }
  }

  const recentCutoff =
    Date.now() -
    1000 * 60 * 60 * 24 * 30;

  const visibleProjects =
    projects.filter((project) => {
      const brief =
        readBrief(project.brief);

      const matchesStatus =
        status === "all" ||
        status === "trash" ||
        (status === "recent"
          ? project.updatedAt.getTime() >=
            recentCutoff
          : project.status === status);

      if (!matchesStatus) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        project.title,
        project.description,
        brief.prompt,
        brief.quality,
        ...(brief.formats ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  const currentQuery = {
    search,
    status,
    view,
    sort,
  };

  const counts = {
    all: projects.length,
    recent: projects.filter(
      (project) =>
        project.updatedAt.getTime() >=
        recentCutoff,
    ).length,
    draft: projects.filter(
      (project) =>
        project.status === "draft",
    ).length,
    generating: projects.filter(
      (project) =>
        project.status === "generating",
    ).length,
    ready: projects.filter(
      (project) =>
        project.status === "ready",
    ).length,
    failed: projects.filter(
      (project) =>
        project.status === "failed",
    ).length,
    archived: projects.filter(
      (project) =>
        project.status === "archived",
    ).length,
    trash: isTrash ? projects.length : 0,
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
            <Link
              aria-label="Back to Studio"
              href="/studio"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-[0_10px_35px_rgba(37,99,235,0.25)]">
              <FolderOpen className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Studio projects
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Search, sort, duplicate and manage every Beacon Studio campaign.
              </p>
            </div>
          </div>

          <Link
            href="/studio/create"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-5 text-sm font-black text-white transition hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            New campaign
          </Link>
        </header>

        <div className="grid gap-5 py-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-3 lg:sticky lg:top-5 lg:h-fit">
            <p className="px-3 pb-2 pt-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-600">
              Project filters
            </p>

            <div className="space-y-1">
              <Link
                href={buildProjectsUrl(
                  currentQuery,
                  {
                    status: "all",
                  },
                )}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
                  status === "all"
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Grid2X2 className="h-4 w-4" />
                  All projects
                </span>

                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem]">
                  {counts.all}
                </span>
              </Link>
              <Link
                href={buildProjectsUrl(
                  currentQuery,
                  {
                    status: "recent",
                  },
                )}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
                  status === "recent"
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Clock3 className="h-4 w-4" />
                  Recent
                </span>

                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem]">
                  {counts.recent}
                </span>
              </Link>
              <Link
                href={buildProjectsUrl(
                  currentQuery,
                  {
                    status: "draft",
                  },
                )}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
                  status === "draft"
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Film className="h-4 w-4" />
                  Drafts
                </span>

                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem]">
                  {counts.draft}
                </span>
              </Link>
              <Link
                href={buildProjectsUrl(
                  currentQuery,
                  {
                    status: "generating",
                  },
                )}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
                  status === "generating"
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4" />
                  Generating
                </span>

                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem]">
                  {counts.generating}
                </span>
              </Link>
              <Link
                href={buildProjectsUrl(
                  currentQuery,
                  {
                    status: "ready",
                  },
                )}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
                  status === "ready"
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready
                </span>

                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem]">
                  {counts.ready}
                </span>
              </Link>
              <Link
                href={buildProjectsUrl(
                  currentQuery,
                  {
                    status: "failed",
                  },
                )}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
                  status === "failed"
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <TriangleAlert className="h-4 w-4" />
                  Failed
                </span>

                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem]">
                  {counts.failed}
                </span>
              </Link>
              <Link
                href={buildProjectsUrl(
                  currentQuery,
                  {
                    status: "archived",
                  },
                )}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
                  status === "archived"
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <CalendarClock className="h-4 w-4" />
                  Archived
                </span>

                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem]">
                  {counts.archived}
                </span>
              </Link>
              <Link
                href={buildProjectsUrl(
                  currentQuery,
                  {
                    status: "trash",
                  },
                )}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${
                  status === "trash"
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Trash2 className="h-4 w-4" />
                  Trash
                </span>

                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem]">
                  {counts.trash}
                </span>
              </Link>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4">
              <form
                action="/studio/projects"
                className="flex flex-col gap-3 xl:flex-row"
              >
                <input
                  type="hidden"
                  name="status"
                  value={status}
                />

                <input
                  type="hidden"
                  name="view"
                  value={view}
                />

                <label className="flex h-11 flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4">
                  <Search className="h-4 w-4 text-slate-600" />
                  <input
                    name="search"
                    defaultValue={
                      resolved?.search ?? ""
                    }
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-700"
                    placeholder="Search titles, prompts, formats or quality"
                    type="search"
                  />
                </label>

                <select
                  name="sort"
                  defaultValue={sort}
                  className="h-11 rounded-full border border-white/10 bg-slate-900 px-4 text-sm font-black text-slate-300 outline-none"
                >
                  <option value="updated-desc">
                    Recently updated
                  </option>
                  <option value="updated-asc">
                    Oldest updated
                  </option>
                  <option value="title-asc">
                    Title A–Z
                  </option>
                  <option value="title-desc">
                    Title Z–A
                  </option>
                </select>

                <button
                  type="submit"
                  className="h-11 rounded-full bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500"
                >
                  Apply
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs font-black text-slate-600">
                  {visibleProjects.length} project
                  {visibleProjects.length === 1
                    ? ""
                    : "s"}
                </span>

                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                  <Link
                    aria-label="Grid view"
                    href={buildProjectsUrl(
                      currentQuery,
                      {
                        view: "grid",
                      },
                    )}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      view === "grid"
                        ? "bg-white/10 text-white"
                        : "text-slate-600 hover:text-white"
                    }`}
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Link>

                  <Link
                    aria-label="List view"
                    href={buildProjectsUrl(
                      currentQuery,
                      {
                        view: "list",
                      },
                    )}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      view === "list"
                        ? "bg-white/10 text-white"
                        : "text-slate-600 hover:text-white"
                    }`}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {visibleProjects.length === 0 ? (
                <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
                    {isTrash ? (
                      <Trash2 className="h-6 w-6" />
                    ) : (
                      <Film className="h-6 w-6" />
                    )}
                  </div>

                  <h2 className="mt-4 text-lg font-black">
                    {isTrash
                      ? "Trash is empty"
                      : search
                        ? "No matching projects"
                        : "No projects in this view"}
                  </h2>

                  <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-600">
                    {isTrash
                      ? "Projects moved to trash will remain here until you restore or permanently delete them."
                      : search
                        ? "Try another search term or change the selected filter."
                        : "Create a new Beacon Studio campaign and it will appear here."}
                  </p>

                  {!isTrash && !search ? (
                    <Link
                      href="/studio/create"
                      className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-5 text-sm font-black text-white transition hover:scale-[1.02]"
                    >
                      <Plus className="h-4 w-4" />
                      Create campaign
                    </Link>
                  ) : null}
                </div>
              ) : view === "grid" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleProjects.map(
                    (project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        generation={
                          latestGenerationByProject.get(
                            project.id,
                          )
                        }
                        trash={isTrash}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/55">
                  {visibleProjects.map(
                    (project, index) => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        generation={
                          latestGenerationByProject.get(
                            project.id,
                          )
                        }
                        trash={isTrash}
                        last={
                          index ===
                          visibleProjects.length - 1
                        }
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

type ProjectRecord =
  typeof studioProject.$inferSelect;

type GenerationRecord =
  typeof studioGeneration.$inferSelect;

function ProjectCard({
  project,
  generation,
  trash,
}: {
  project: ProjectRecord;
  generation?: GenerationRecord;
  trash: boolean;
}) {
  const plan =
    isCampaignPlanSummary(
      project.campaignPlan,
    )
      ? project.campaignPlan
      : null;

  const brief =
    readBrief(project.brief);

  const selectedVariant =
    plan?.variants.find(
      (variant) =>
        variant.id ===
        project.selectedVariantId,
    ) ??
    plan?.variants[0];

  const formats =
    plan?.variants
      .map((variant) => variant.format)
      .filter(
        (format, index, all) =>
          all.indexOf(format) === index,
      ) ??
    brief.formats ??
    [];

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]">
      {trash ? (
        <div
          className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-white/10"
          style={{
            backgroundColor:
              selectedVariant
                ?.backgroundColor ??
              plan?.backgroundColor ??
              "#0f172a",
          }}
        >
          <div className="absolute inset-0 bg-slate-950/55" />
          <Trash2 className="relative h-9 w-9 text-slate-400" />
        </div>
      ) : (
        <Link
          href={`/studio/editor/${project.id}`}
          className="block"
        >
          <ProjectPreview
            project={project}
            plan={plan}
            selectedVariant={selectedVariant}
          />
        </Link>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black">
              {project.title}
            </h2>
            <p className="mt-2 line-clamp-2 min-h-10 text-xs font-semibold leading-5 text-slate-600">
              {project.description ||
                brief.prompt ||
                "Beacon Studio campaign"}
            </p>
          </div>

          {!trash ? (
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-700 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {formats
            .slice(0, 3)
            .map((format) => (
              <span
                key={format}
                className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[0.65rem] font-bold text-slate-400"
              >
                {formatOutputName(format)}
              </span>
            ))}

          {brief.quality ? (
            <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[0.65rem] font-bold capitalize text-slate-400">
              {brief.quality}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <span>
            {trash && project.deletedAt
              ? `Deleted ${formatDate(
                  project.deletedAt,
                )}`
              : `Updated ${formatDate(
                  project.updatedAt,
                )}`}
          </span>

          <span className="text-amber-200">
            {generation?.administratorBypass
              ? "Admin bypass"
              : `${generation?.creditCost ?? 0} credits`}
          </span>
        </div>
      </div>

      <ProjectActions
        project={project}
        trash={trash}
      />
    </article>
  );
}

function ProjectPreview({
  project,
  plan,
  selectedVariant,
}: {
  project: ProjectRecord;
  plan: CampaignPlanSummary | null;
  selectedVariant:
    | CampaignPlanSummary["variants"][number]
    | undefined;
}) {
  return (
    <div
      className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-white/10"
      style={{
        backgroundColor:
          selectedVariant?.backgroundColor ??
          plan?.backgroundColor ??
          "#0f172a",
      }}
    >
      {project.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          src={project.thumbnailUrl}
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.18),transparent_35%)]" />
          <Film className="relative h-9 w-9 text-cyan-200" />
        </>
      )}

      <span
        className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-[0.65rem] font-black ${statusClasses(
          project.status,
        )}`}
      >
        {statusLabel(project.status)}
      </span>

      <span className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[0.65rem] font-black text-slate-200 backdrop-blur">
        {formatDuration(
          selectedVariant?.durationMs ??
            plan?.durationMs,
        )}
      </span>
    </div>
  );
}

function ProjectRow({
  project,
  generation,
  trash,
  last,
}: {
  project: ProjectRecord;
  generation?: GenerationRecord;
  trash: boolean;
  last: boolean;
}) {
  const plan =
    isCampaignPlanSummary(
      project.campaignPlan,
    )
      ? project.campaignPlan
      : null;

  const selectedVariant =
    plan?.variants.find(
      (variant) =>
        variant.id ===
        project.selectedVariantId,
    ) ??
    plan?.variants[0];

  const brief =
    readBrief(project.brief);

  return (
    <div
      className={`flex flex-col gap-4 p-4 xl:flex-row xl:items-center ${
        last
          ? ""
          : "border-b border-white/10"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div
          className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-white/10"
          style={{
            backgroundColor:
              selectedVariant
                ?.backgroundColor ??
              plan?.backgroundColor ??
              "#0f172a",
          }}
        >
          {trash ? (
            <Trash2 className="h-5 w-5 text-slate-500" />
          ) : (
            <Film className="h-5 w-5 text-cyan-200" />
          )}
        </div>

        <div className="min-w-0">
          {trash ? (
            <h2 className="truncate text-sm font-black">
              {project.title}
            </h2>
          ) : (
            <Link
              href={`/studio/editor/${project.id}`}
              className="truncate text-sm font-black transition hover:text-cyan-200"
            >
              {project.title}
            </Link>
          )}

          <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-600">
            {project.description ||
              brief.prompt ||
              "Beacon Studio campaign"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 xl:justify-end">
        {!trash ? (
          <span
            className={`rounded-full border px-3 py-1 text-[0.65rem] font-black ${statusClasses(
              project.status,
            )}`}
          >
            {statusLabel(project.status)}
          </span>
        ) : null}

        <span className="text-xs font-bold text-slate-600">
          {formatDuration(
            selectedVariant?.durationMs ??
              plan?.durationMs,
          )}
        </span>

        <span className="text-xs font-black text-amber-200">
          {generation?.administratorBypass
            ? "Admin bypass"
            : `${generation?.creditCost ?? 0} credits`}
        </span>

        <span className="text-xs font-bold text-slate-600">
          {trash && project.deletedAt
            ? formatDate(project.deletedAt)
            : formatDate(project.updatedAt)}
        </span>

        <ProjectActions
          project={project}
          trash={trash}
          compact
        />
      </div>
    </div>
  );
}

function ProjectActions({
  project,
  trash,
  compact = false,
}: {
  project: ProjectRecord;
  trash: boolean;
  compact?: boolean;
}) {
  if (trash) {
    return (
      <div
        className={`flex items-center gap-2 ${
          compact
            ? ""
            : "border-t border-white/10 px-4 py-3"
        }`}
      >
        <form action={restoreStudioProject}>
          <input
            type="hidden"
            name="projectId"
            value={project.id}
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 text-xs font-black text-emerald-200 transition hover:bg-emerald-300/15"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore
          </button>
        </form>

        <form
          action={
            permanentlyDeleteStudioProject
          }
        >
          <input
            type="hidden"
            name="projectId"
            value={project.id}
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-3 text-xs font-black text-red-200 transition hover:bg-red-300/15"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete forever
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        compact
          ? ""
          : "border-t border-white/10 px-4 py-3"
      }`}
    >
      <form action={duplicateStudioProject}>
        <input
          type="hidden"
          name="projectId"
          value={project.id}
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-black text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicate
        </button>
      </form>

      <form action={moveProjectToTrash}>
        <input
          type="hidden"
          name="projectId"
          value={project.id}
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-black text-slate-500 transition hover:bg-red-300/10 hover:text-red-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Trash
        </button>
      </form>
    </div>
  );
}