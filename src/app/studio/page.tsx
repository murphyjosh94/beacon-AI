import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  FileImage,
  FileText,
  Film,
  FolderOpen,
  Image as ImageIcon,
  LayoutTemplate,
  Megaphone,
  Mic2,
  MonitorPlay,
  Music2,
  Presentation,
  Search,
  Sparkles,
  Trash2,
  Video,
  WandSparkles,
} from "lucide-react";
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";

import {
  getCurrentAccessAccount,
  hasUnrestrictedBeaconAccess,
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

type StudioDashboardPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
  }>;
};

type StudioCapability = {
  title: string;
  description: string;
  icon: typeof Sparkles;
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

type ProjectBrief = {
  prompt?: string;
  quality?: string;
  outputCount?: number;
  formats?: StudioOutputFormatId[];
};

const STUDIO_CAPABILITIES: StudioCapability[] = [
  {
    title: "Marketing campaigns",
    description:
      "Adverts, launch campaigns, promotions and branded social content.",
    icon: Megaphone,
  },
  {
    title: "Video production",
    description:
      "Short-form videos, explainers, product demos and longer productions.",
    icon: Video,
  },
  {
    title: "Images and branding",
    description:
      "Social graphics, posters, logos, thumbnails and campaign artwork.",
    icon: ImageIcon,
  },
  {
    title: "Website demonstrations",
    description:
      "Polished demonstrations rendered from real Beacon website components.",
    icon: MonitorPlay,
  },
  {
    title: "Voice and audio",
    description:
      "Voice-overs, podcast content, narration, music and sound design.",
    icon: Mic2,
  },
  {
    title: "Business documents",
    description:
      "Presentations, brochures, reports, pitch decks and branded documents.",
    icon: Presentation,
  },
];

const REQUEST_EXAMPLES = [
  "Create a polished launch video introducing Beacon Business.",
  "Make three social graphics promoting my plumbing company.",
  "Create a product advert with a British voice-over and square social version.",
  "Build a professional pitch deck for a new local business.",
];

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function isCampaignPlanSummary(
  value: unknown,
): value is CampaignPlanSummary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const plan = value as Partial<CampaignPlanSummary>;

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

function formatProjectDate(
  updatedAt: Date | null,
  createdAt: Date,
): string {
  return `Updated ${DATE_FORMATTER.format(updatedAt ?? createdAt)}`;
}

function formatDuration(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "Creative project";
  }

  const totalSeconds = Math.max(
    1,
    Math.round(durationMs / 1_000),
  );

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const minutes = Math.floor(totalSeconds / 60);
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
    return "Needs attention";
  }

  return "Draft";
}

function statusClasses(status: string): string {
  if (status === "ready") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "generating") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  if (status === "failed") {
    return "border-rose-300/30 bg-rose-300/10 text-rose-100";
  }

  return "border-white/10 bg-white/5 text-slate-300";
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

function matchesSearch(
  title: string,
  description: string | null,
  brief: ProjectBrief,
  query: string,
): boolean {
  if (!query) {
    return true;
  }

  return [
    title,
    description,
    brief.prompt,
    brief.quality,
    ...(brief.formats ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

async function deleteStudioProject(
  formData: FormData,
): Promise<void> {
  "use server";

  let account;

  try {
    account =
      await getCurrentAccessAccount();
  } catch (error) {
    console.error(
      "[studio] Unable to resolve the current account during project deletion.",
      error,
    );

    redirect("/signin");
  }

  if (!account?.id) {
    redirect("/signin");
  }

  const projectId =
    formData.get("projectId");

  if (
    typeof projectId !== "string" ||
    !projectId.trim()
  ) {
    return;
  }

  const [project] = await database
    .select({
      id: studioProject.id,
      userId: studioProject.userId,
    })
    .from(studioProject)
    .where(
      and(
        eq(studioProject.id, projectId),
        isNull(studioProject.deletedAt),
      ),
    )
    .limit(1);

  if (!project) {
    return;
  }

  if (
    project.userId !== account.id &&
    !hasUnrestrictedBeaconAccess(account)
  ) {
    return;
  }

  const deletedAt = new Date();

  await database
    .update(studioProject)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(eq(studioProject.id, project.id));

  revalidatePath("/studio");
  revalidatePath("/studio/projects");
}

export default async function StudioDashboardPage({
  searchParams,
}: StudioDashboardPageProps) {
  let account;

  try {
    account =
      await getCurrentAccessAccount();
  } catch (error) {
    console.error(
      "[studio] Unable to resolve the current account.",
      error,
    );

    redirect("/signin");
  }

  if (!account?.id) {
    redirect("/signin");
  }

  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : undefined;

  const searchQuery =
    resolvedSearchParams?.search
      ?.trim()
      .toLowerCase() ?? "";

  const requestedStatus =
    resolvedSearchParams?.status
      ?.trim()
      .toLowerCase() ?? "all";

  let studioDataUnavailable = false;

  const projects = await database
    .select()
    .from(studioProject)
    .where(
      and(
        eq(studioProject.userId, account.id),
        isNull(studioProject.deletedAt),
      ),
    )
    .orderBy(
      desc(studioProject.updatedAt),
      desc(studioProject.createdAt),
    )
    .limit(60)
    .catch((error) => {
      studioDataUnavailable = true;

      console.error(
        "[studio] Failed to load Studio projects.",
        error,
      );

      return [];
    });

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
          .catch((error) => {
            studioDataUnavailable = true;

            console.error(
              "[studio] Failed to load Studio generations.",
              error,
            );

            return [];
          })
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

  const visibleProjects =
    projects.filter((project) => {
      const brief =
        readBrief(project.brief);

      const matchesStatus =
        requestedStatus === "all" ||
        project.status === requestedStatus;

      return (
        matchesStatus &&
        matchesSearch(
          project.title,
          project.description,
          brief,
          searchQuery,
        )
      );
    });

  const readyCount =
    projects.filter(
      (project) => project.status === "ready",
    ).length;

  const generatingCount =
    projects.filter(
      (project) =>
        project.status === "generating",
    ).length;

  const failedCount =
    projects.filter(
      (project) => project.status === "failed",
    ).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050a16] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute -right-32 top-20 h-[32rem] w-[32rem] rounded-full bg-cyan-400/10 blur-[140px]" />
        <div className="absolute bottom-[-14rem] left-[32%] h-[30rem] w-[30rem] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(30,64,175,0.34),rgba(2,6,23,0.96)_46%,rgba(8,145,178,0.14))] px-5 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:px-8 sm:py-12 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
                <Sparkles className="h-4 w-4" />
                Beacon Studio
              </div>

              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
                Describe what you would like to create
              </h1>

              <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-8 text-slate-300 sm:text-lg">
                Beacon works out the format, structure, visuals, motion,
                voice, music and export requirements from one clear request.
              </p>
            </div>

            <form
              action="/studio/create"
              className="mx-auto mt-9 max-w-4xl rounded-[2rem] border border-white/10 bg-slate-950/80 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur"
            >
              <label
                htmlFor="studio-request"
                className="sr-only"
              >
                Describe what you would like Beacon Studio to create
              </label>

              <textarea
                id="studio-request"
                name="prompt"
                required
                className="min-h-44 w-full resize-none rounded-[1.4rem] bg-transparent px-4 py-4 text-base font-semibold leading-8 text-white outline-none placeholder:text-slate-600 sm:min-h-48 sm:px-5 sm:py-5 sm:text-lg"
                placeholder="Describe the result you need, who it is for, where it will be used and anything Beacon should include..."
              />

              <input
                type="hidden"
                name="tool"
                value="custom"
              />

              <div className="flex flex-col gap-4 border-t border-white/10 px-2 pb-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <WandSparkles className="h-4 w-4 text-cyan-200" />
                  Beacon selects the best production path automatically
                </div>

                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-7 py-3 text-sm font-black text-white shadow-[0_18px_50px_rgba(37,99,235,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(37,99,235,0.4)]"
                  type="submit"
                >
                  Analyse my request
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mx-auto mt-6 grid max-w-4xl gap-2 sm:grid-cols-2">
              {REQUEST_EXAMPLES.map((example) => (
                <Link
                  key={example}
                  href={`/studio/create?tool=custom&prompt=${encodeURIComponent(
                    example,
                  )}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-xs font-bold leading-5 text-slate-400 transition hover:border-cyan-300/25 hover:bg-white/[0.06] hover:text-slate-200"
                >
                  “{example}”
                </Link>
              ))}
            </div>

            <p className="mt-5 text-center text-xs font-semibold text-slate-500">
              Studio shows the planned outputs and credit cost before any
              generation begins.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
              One request. Multiple production engines.
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Beacon chooses the tools for you
            </h2>

            <p className="mx-auto mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-400 sm:text-base">
              You do not need to choose between an image editor, video editor,
              document builder or audio tool. Studio combines the right
              capabilities around the outcome you describe.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {STUDIO_CAPABILITIES.map((capability) => {
              const Icon = capability.icon;

              return (
                <article
                  key={capability.title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-lg font-black">
                    {capability.title}
                  </h3>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    {capability.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="grid gap-4 md:grid-cols-5">
            {[
              {
                number: "01",
                title: "Request",
                text: "Explain the result you need.",
              },
              {
                number: "02",
                title: "Review",
                text: "Beacon prepares the creative plan.",
              },
              {
                number: "03",
                title: "Preview",
                text: "Review the first generated version.",
              },
              {
                number: "04",
                title: "AI edits",
                text: "Describe changes in normal language.",
              },
              {
                number: "05",
                title: "Export",
                text: "Render and download the final files.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <span className="text-xs font-black tracking-[0.16em] text-cyan-200">
                  {step.number}
                </span>

                <h3 className="mt-3 text-base font-black">
                  {step.title}
                </h3>

                <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {studioDataUnavailable ? (
          <section className="mt-6 rounded-3xl border border-amber-300/25 bg-amber-300/10 px-5 py-4 text-amber-50">
            <p className="text-sm font-black">
              Studio project history is temporarily unavailable
            </p>

            <p className="mt-1 text-sm font-medium leading-6 text-amber-100/75">
              The creator remains available. Beacon has recorded the database
              error without taking the rest of Studio offline.
            </p>
          </section>
        ) : null}

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-cyan-200" />

                <h2 className="text-xl font-black">
                  Your Studio projects
                </h2>
              </div>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Continue creating, review a preview or reopen an earlier
                production.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {[
                ["all", "All", projects.length],
                ["ready", "Ready", readyCount],
                ["generating", "Generating", generatingCount],
                ["failed", "Attention", failedCount],
              ].map(([value, label, count]) => (
                <Link
                  key={String(value)}
                  href={`/studio?status=${value}${
                    searchQuery
                      ? `&search=${encodeURIComponent(
                          searchQuery,
                        )}`
                      : ""
                  }`}
                  className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                    requestedStatus === value
                      ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {label} {count}
                </Link>
              ))}
            </div>
          </div>

          <form
            action="/studio"
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="hidden"
              name="status"
              value={requestedStatus}
            />

            <label className="flex h-11 flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4">
              <Search className="h-4 w-4 text-slate-500" />

              <input
                name="search"
                defaultValue={
                  resolvedSearchParams?.search ?? ""
                }
                className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
                placeholder="Search Studio projects"
                type="search"
              />
            </label>

            <button
              type="submit"
              className="h-11 rounded-full bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500"
            >
              Search
            </button>
          </form>

          <div className="mt-6">
            {visibleProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleProjects.map((project) => {
                  const campaignPlan =
                    isCampaignPlanSummary(
                      project.campaignPlan,
                    )
                      ? project.campaignPlan
                      : null;

                  const brief =
                    readBrief(project.brief);

                  const latestGeneration =
                    latestGenerationByProject.get(
                      project.id,
                    );

                  const primaryVariant =
                    campaignPlan?.variants.find(
                      (variant) =>
                        variant.id ===
                        project.selectedVariantId,
                    ) ??
                    campaignPlan?.variants[0];

                  const formats =
                    campaignPlan?.variants
                      .map(
                        (variant) =>
                          variant.format,
                      )
                      .filter(
                        (
                          format,
                          index,
                          all,
                        ) =>
                          all.indexOf(format) ===
                          index,
                      ) ??
                    brief.formats ??
                    [];

                  const creditText =
                    latestGeneration
                      ?.administratorBypass
                      ? "Admin access"
                      : `${
                          latestGeneration
                            ?.creditCost ?? 0
                        } credits`;

                  return (
                    <article
                      key={project.id}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]"
                    >
                      <Link
                        href={`/studio/editor/${project.id}`}
                        className="block"
                      >
                        <div
                          className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-white/10"
                          style={{
                            backgroundColor:
                              primaryVariant
                                ?.backgroundColor ??
                              campaignPlan
                                ?.backgroundColor ??
                              "#0f172a",
                          }}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.18),transparent_35%)]" />

                          <div className="relative max-w-[80%] text-center">
                            {project.status ===
                            "generating" ? (
                              <Sparkles className="mx-auto h-10 w-10 animate-pulse text-amber-200" />
                            ) : (
                              <Film className="mx-auto h-10 w-10 text-cyan-200" />
                            )}

                            <p className="mt-3 line-clamp-2 text-sm font-black text-white">
                              {project.title}
                            </p>
                          </div>

                          <span
                            className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-[0.65rem] font-black ${statusClasses(
                              project.status,
                            )}`}
                          >
                            {statusLabel(
                              project.status,
                            )}
                          </span>

                          <span className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[0.65rem] font-black text-slate-200 backdrop-blur">
                            {formatDuration(
                              primaryVariant
                                ?.durationMs ??
                                campaignPlan
                                  ?.durationMs,
                            )}
                          </span>
                        </div>

                        <div className="p-5">
                          <h3 className="truncate text-base font-black text-white">
                            {project.title}
                          </h3>

                          <p className="mt-2 line-clamp-2 min-h-10 text-xs font-semibold leading-5 text-slate-500">
                            {project.description ||
                              brief.prompt ||
                              "Beacon Studio creative project"}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {formats
                              .slice(0, 3)
                              .map((format) => (
                                <span
                                  key={format}
                                  className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[0.65rem] font-bold text-slate-400"
                                >
                                  {formatOutputName(
                                    format,
                                  )}
                                </span>
                              ))}

                            {formats.length > 3 ? (
                              <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[0.65rem] font-bold text-slate-400">
                                +{formats.length - 3}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" />

                              {formatProjectDate(
                                project.updatedAt,
                                project.createdAt,
                              )}
                            </span>

                            <span className="text-xs font-black text-amber-200">
                              {creditText}
                            </span>
                          </div>

                          <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-cyan-200">
                            Open project
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>

                      <div className="border-t border-white/10 px-5 py-3">
                        <form
                          action={
                            deleteStudioProject
                          }
                        >
                          <input
                            type="hidden"
                            name="projectId"
                            value={project.id}
                          />

                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-rose-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete project
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                  <WandSparkles className="h-6 w-6 text-cyan-200" />
                </div>

                <h3 className="mt-4 text-lg font-black">
                  {searchQuery ||
                  requestedStatus !== "all"
                    ? "No matching projects"
                    : "Your first creation starts with one request"}
                </h3>

                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  {searchQuery ||
                  requestedStatus !== "all"
                    ? "Try another search term or return to all project statuses."
                    : "Tell Beacon what you need and Studio will prepare the production plan, formats, preview and export options."}
                </p>

                <Link
                  href="/studio/create"
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500"
                >
                  <Sparkles className="h-4 w-4" />
                  Start creating
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="py-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/studio/projects"
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
            >
              <FolderOpen className="h-5 w-5 text-cyan-200" />

              <h3 className="mt-4 font-black">
                All projects
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Review every Studio project and previous generation.
              </p>
            </Link>

            <Link
              href="/studio/assets"
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
            >
              <FileImage className="h-5 w-5 text-cyan-200" />

              <h3 className="mt-4 font-black">
                Asset library
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Manage reusable logos, images, clips, audio and brand files.
              </p>
            </Link>

            <Link
              href="/studio/projects"
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
            >
              <LayoutTemplate className="h-5 w-5 text-cyan-200" />

              <h3 className="mt-4 font-black">
                Templates
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Start from reusable campaign and production structures.
              </p>
            </Link>

            <Link
              href="/studio/pricing"
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
            >
              <Sparkles className="h-5 w-5 text-cyan-200" />

              <h3 className="mt-4 font-black">
                Credits and pricing
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Review Studio access, available credits and usage options.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}