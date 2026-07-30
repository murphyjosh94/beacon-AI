import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Clapperboard,
  FileImage,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Laugh,
  MessageSquareText,
  Music2,
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

type CreationType = {
  id:
    | "marketing"
    | "short-video"
    | "long-video"
    | "images"
    | "writing"
    | "memes"
    | "audio"
    | "custom";
  title: string;
  description: string;
  icon: typeof Sparkles;
  examples: string[];
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

const CREATION_TYPES: CreationType[] = [
  {
    id: "marketing",
    title: "Marketing",
    description:
      "Create branded adverts, promotions and campaigns for your business.",
    icon: BriefcaseBusiness,
    examples: ["Business advert", "Product promotion", "Website launch"],
  },
  {
    id: "short-video",
    title: "Short-form video",
    description:
      "Create vertical clips for Instagram, TikTok, YouTube and Facebook.",
    icon: Video,
    examples: ["Instagram Reel", "TikTok clip", "YouTube Short"],
  },
  {
    id: "long-video",
    title: "Long-form AI video",
    description:
      "Turn a script or idea into a longer narrated or animated production.",
    icon: Clapperboard,
    examples: ["Explainer", "Nursery rhyme", "YouTube video"],
  },
  {
    id: "images",
    title: "Images and graphics",
    description:
      "Generate social graphics, posters, thumbnails, banners and artwork.",
    icon: ImageIcon,
    examples: ["Social post", "Poster", "Thumbnail"],
  },
  {
    id: "writing",
    title: "Social posts and copy",
    description:
      "Write captions, adverts, campaigns, blogs and product descriptions.",
    icon: MessageSquareText,
    examples: ["Facebook post", "Caption", "Campaign copy"],
  },
  {
    id: "memes",
    title: "Memes and entertainment",
    description:
      "Create shareable memes, comic ideas, greetings and entertaining content.",
    icon: Laugh,
    examples: ["General meme", "Comic post", "Greeting"],
  },
  {
    id: "audio",
    title: "Voice and audio",
    description:
      "Generate voice-overs, podcast intros, narration and audio adverts.",
    icon: Music2,
    examples: ["Voice-over", "Radio advert", "Narration"],
  },
  {
    id: "custom",
    title: "Create from any idea",
    description:
      "Start with a blank request and let Beacon choose the best production path.",
    icon: WandSparkles,
    examples: ["Custom scene", "Mixed media", "Original concept"],
  },
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
    return "Campaign";
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
    return "Failed";
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
    <main className="relative min-h-screen overflow-hidden bg-[#050b18] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute right-[-8rem] top-[12rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute bottom-[-12rem] left-[35%] h-[26rem] w-[26rem] rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-blue-700/30 via-slate-950/95 to-cyan-500/10 p-6 shadow-[0_35px_100px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100">
              <Sparkles className="h-4 w-4" />
              Beacon Studio
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              What would you like to create?
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
              Turn an idea, script or business brief into marketing content,
              social posts, images, short clips or complete AI-generated
              campaigns.
            </p>

            <form
              action="/studio/create"
              className="mx-auto mt-8 max-w-3xl rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-3 shadow-2xl"
            >
              <textarea
                name="prompt"
                className="min-h-32 w-full resize-none bg-transparent px-3 py-3 text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-600 sm:text-lg"
                placeholder="Example: Create a 30-second Instagram Reel promoting my plumbing business, using a professional British voice-over and a clear call to action."
              />

              <div className="flex flex-col gap-3 border-t border-white/10 px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <select
                  name="tool"
                  defaultValue="marketing"
                  className="h-11 rounded-full border border-white/10 bg-slate-900 px-4 text-sm font-black text-slate-200 outline-none"
                >
                  {CREATION_TYPES.map((type) => (
                    <option
                      key={type.id}
                      value={type.id}
                    >
                      {type.title}
                    </option>
                  ))}
                </select>

                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-6 text-sm font-black text-white shadow-[0_15px_45px_rgba(37,99,235,0.28)] transition hover:scale-[1.02]"
                  type="submit"
                >
                  Continue to creator
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <p className="mt-4 text-xs font-semibold text-slate-500">
              Studio confirms the credit cost before generation and only
              deducts credits after a successful result.
            </p>
          </div>
        </section>

        {studioDataUnavailable ? (
          <section className="mt-6 rounded-3xl border border-amber-300/25 bg-amber-300/10 px-5 py-4 text-amber-50">
            <p className="text-sm font-black">
              Studio project history is temporarily unavailable
            </p>
            <p className="mt-1 text-sm font-medium leading-6 text-amber-100/75">
              You can still open the creator, assets, pricing and membership
              pages. Beacon has logged the database error without taking the
              entire Studio offline.
            </p>
          </section>
        ) : null}

        <section className="py-8">
          <h2 className="text-2xl font-black">
            Choose a creation type
          </h2>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Pick a starting point. Beacon can combine formats when your idea
            needs more than one type of content.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CREATION_TYPES.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={`/studio/create?tool=${encodeURIComponent(
                    item.id,
                  )}`}
                  className="group rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-black">
                    {item.title}
                  </h3>

                  <p className="mt-2 min-h-16 text-sm font-medium leading-6 text-slate-500">
                    {item.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.examples.map((example) => (
                      <span
                        key={example}
                        className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[0.65rem] font-bold text-slate-400"
                      >
                        {example}
                      </span>
                    ))}
                  </div>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-200">
                    Create
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-cyan-200" />
                <h2 className="text-xl font-black">
                  Your projects
                </h2>
              </div>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Continue a campaign, review its timeline or reopen an earlier
                generation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {[
                ["all", "All", projects.length],
                ["ready", "Ready", readyCount],
                ["generating", "Generating", generatingCount],
                ["failed", "Failed", failedCount],
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
                placeholder="Search projects"
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
                      ? "Admin bypass"
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
                              "Beacon Studio campaign project"}
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

                            {formats.length > 3 && (
                              <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[0.65rem] font-bold text-slate-400">
                                +{formats.length - 3}
                              </span>
                            )}
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
                            Open editor
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
                            className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-red-200"
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
                  <FileImage className="h-6 w-6 text-cyan-200" />
                </div>

                <h3 className="mt-4 text-lg font-black">
                  {searchQuery ||
                  requestedStatus !== "all"
                    ? "No matching projects"
                    : "Create your first Studio project"}
                </h3>

                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  {searchQuery ||
                  requestedStatus !== "all"
                    ? "Try another search term or return to all project statuses."
                    : "Describe what you want to create and Beacon will guide you through formats, quality, credits and generation."}
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
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/studio/projects"
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
            >
              <FolderOpen className="h-5 w-5 text-cyan-200" />
              <h3 className="mt-4 font-black">
                All projects
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                View every campaign, generation and previous Studio creation.
              </p>
            </Link>

            <Link
              href="/studio/assets"
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
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
              href="/studio/pricing"
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
            >
              <Sparkles className="h-5 w-5 text-cyan-200" />
              <h3 className="mt-4 font-black">
                Credits and pricing
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Review your Studio plan, available credits and usage options.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}