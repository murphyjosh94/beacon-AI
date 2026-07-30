import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  FileText,
  Layers3,
  MonitorPlay,
  Sparkles,
} from "lucide-react";
import {
  and,
  desc,
  eq,
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
import {
  campaignToStudioTimelines,
  type StudioCampaignPlan,
  type StudioCampaignVariant,
  type StudioGeneratedScene,
} from "@/app/studio/_engine/ScenePlanner";
import {
  getStudioOutputFormat,
  type StudioOutputFormatId,
} from "@/app/studio/_engine/PromptBuilder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudioEditorPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<{
    variant?: string;
  }>;
};

type ProjectBrief = {
  prompt?: string;
  formats?: StudioOutputFormatId[];
  audience?: string;
  tone?: string;
  style?: string;
  colours?: string[];
  sourceUrl?: string;
  notes?: string;
  durationMs?: number;
  quality?: string;
  outputCount?: number;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: Date | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  return DATE_FORMATTER.format(value);
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(1, Math.round(durationMs / 1_000));

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return seconds === 0
    ? `${minutes} min`
    : `${minutes}m ${seconds}s`;
}

function isScene(value: unknown): value is StudioGeneratedScene {
  if (!value || typeof value !== "object") {
    return false;
  }

  const scene = value as Partial<StudioGeneratedScene>;

  return (
    typeof scene.id === "string" &&
    typeof scene.title === "string" &&
    typeof scene.startMs === "number" &&
    typeof scene.durationMs === "number" &&
    typeof scene.visualDirection === "string"
  );
}

function isVariant(value: unknown): value is StudioCampaignVariant {
  if (!value || typeof value !== "object") {
    return false;
  }

  const variant = value as Partial<StudioCampaignVariant>;

  return (
    typeof variant.id === "string" &&
    typeof variant.format === "string" &&
    typeof variant.title === "string" &&
    typeof variant.aspectRatio === "string" &&
    typeof variant.width === "number" &&
    typeof variant.height === "number" &&
    typeof variant.durationMs === "number" &&
    typeof variant.backgroundColor === "string" &&
    Array.isArray(variant.scenes) &&
    variant.scenes.every(isScene)
  );
}

function isCampaignPlan(value: unknown): value is StudioCampaignPlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const plan = value as Partial<StudioCampaignPlan>;

  return (
    typeof plan.title === "string" &&
    typeof plan.summary === "string" &&
    typeof plan.coreMessage === "string" &&
    typeof plan.visualDirection === "string" &&
    typeof plan.backgroundColor === "string" &&
    typeof plan.durationMs === "number" &&
    Array.isArray(plan.sharedScenes) &&
    plan.sharedScenes.every(isScene) &&
    Array.isArray(plan.variants) &&
    plan.variants.every(isVariant)
  );
}

function readBrief(value: unknown): ProjectBrief {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as ProjectBrief;
}

function statusClasses(status: string): string {
  if (status === "ready" || status === "completed") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "failed") {
    return "bg-red-100 text-red-800";
  }

  if (
    status === "generating" ||
    status === "processing" ||
    status === "queued"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-100 text-slate-700";
}

function getSelectedVariant(
  plan: StudioCampaignPlan,
  requestedVariantId: string | undefined,
  savedVariantId: string | null,
): StudioCampaignVariant {
  const selectedId =
    requestedVariantId?.trim() ||
    savedVariantId?.trim();

  return (
    plan.variants.find(
      (variant) => variant.id === selectedId,
    ) ??
    plan.variants[0]
  );
}

export default async function StudioEditorPage({
  params,
  searchParams,
}: StudioEditorPageProps) {
  const account = await requireSignedInAccount();

  if (!account?.id) {
    redirect("/sign-in");
  }

  const { projectId } = await params;
  const resolvedSearchParams = searchParams
    ? await searchParams
    : undefined;

  const [project] = await database
    .select()
    .from(studioProject)
    .where(
      and(
        eq(studioProject.id, projectId),
        isNull(studioProject.deletedAt),
      ),
    )
    .limit(1);

  if (!project) {
    notFound();
  }

  const isAdministrator =
    hasUnrestrictedBeaconAccess(account);

  if (
    project.userId !== account.id &&
    !isAdministrator
  ) {
    notFound();
  }

  await database
    .update(studioProject)
    .set({
      lastOpenedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(studioProject.id, project.id));

  const [latestGeneration] = await database
    .select()
    .from(studioGeneration)
    .where(
      and(
        eq(studioGeneration.projectId, project.id),
        eq(studioGeneration.userId, project.userId),
      ),
    )
    .orderBy(desc(studioGeneration.createdAt))
    .limit(1);

  const campaignPlan = isCampaignPlan(project.campaignPlan)
    ? project.campaignPlan
    : null;

  const brief = readBrief(project.brief);

  if (!campaignPlan || campaignPlan.variants.length === 0) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-950">
        <section className="border-b border-white/10 bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 font-black text-blue-200 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Studio
            </Link>

            <div className="mt-7 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">
                  Beacon Studio Project
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                  {project.title}
                </h1>
                <p className="mt-4 max-w-3xl text-lg font-medium leading-8 text-slate-300">
                  {project.description ||
                    "This Studio project is being prepared."}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-black capitalize ${statusClasses(
                  project.status,
                )}`}
              >
                {project.status}
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-950">
              <Sparkles className="h-8 w-8" />
            </div>

            <h2 className="mt-6 text-3xl font-black">
              Campaign plan not available yet
            </h2>

            <p className="mx-auto mt-4 max-w-2xl font-medium leading-7 text-slate-600">
              {latestGeneration?.errorMessage ||
                "Beacon Studio has created the project record, but the structured campaign plan is not ready."}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/studio/create"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-950 px-6 py-3 font-black text-white transition hover:bg-blue-900"
              >
                Create another campaign
              </Link>

              <Link
                href="/studio"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 px-6 py-3 font-black text-slate-700 transition hover:bg-slate-50"
              >
                Return to projects
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const selectedVariant = getSelectedVariant(
    campaignPlan,
    resolvedSearchParams?.variant,
    project.selectedVariantId,
  );

  const plannedVariants =
    campaignToStudioTimelines(campaignPlan);

  const selectedPlannedVariant =
    plannedVariants.find(
      ({ variant }) =>
        variant.id === selectedVariant.id,
    ) ?? plannedVariants[0];

  const selectedFormat =
    getStudioOutputFormat(
      selectedVariant.format,
    );

  const timeline = selectedPlannedVariant.timeline;
  const clipCount = timeline.tracks.reduce(
    (total, track) =>
      total + track.clips.length,
    0,
  );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="border-b border-white/10 bg-slate-950 text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 font-black text-blue-200 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Studio
              </Link>

              <p className="mt-7 text-sm font-black uppercase tracking-[0.18em] text-amber-300">
                Beacon Studio Editor
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                {project.title}
              </h1>

              <p className="mt-4 max-w-4xl text-lg font-medium leading-8 text-slate-300">
                {project.description || campaignPlan.summary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-4 py-2 text-sm font-black capitalize ${statusClasses(
                  project.status,
                )}`}
              >
                {project.status}
              </span>

              <Link
                href="/studio/create"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 font-black text-blue-950 transition hover:bg-amber-200"
              >
                New campaign
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-7 px-5 py-8 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-7">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                    Canvas Preview
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    {selectedVariant.title}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {selectedFormat.label}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {selectedVariant.width} × {selectedVariant.height}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {formatDuration(selectedVariant.durationMs)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex min-h-[420px] items-center justify-center rounded-[1.5rem] bg-slate-950 p-6">
                <div
                  className="relative flex w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                  style={{
                    aspectRatio: `${selectedVariant.width} / ${selectedVariant.height}`,
                    backgroundColor:
                      selectedVariant.backgroundColor ||
                      campaignPlan.backgroundColor,
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.28),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_30%)]" />

                  <div className="relative flex w-full flex-col justify-end p-[8%] text-white">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300 sm:text-sm">
                      {selectedFormat.label}
                    </p>

                    <h3 className="mt-3 max-w-3xl text-2xl font-black leading-tight sm:text-4xl">
                      {selectedVariant.scenes[0]?.onScreenText ||
                        campaignPlan.coreMessage}
                    </h3>

                    <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-slate-200 sm:text-base">
                      {selectedVariant.scenes[0]?.visualDirection ||
                        campaignPlan.visualDirection}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
                This is the campaign-plan preview. Generated image, video,
                audio and voice assets will replace the planning canvas as
                production jobs complete.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <Layers3 className="h-6 w-6 text-blue-800" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                  Timeline
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {timeline.tracks.length} tracks · {clipCount} clips
                </h2>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {timeline.tracks.map((track) => (
                <article
                  key={track.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-black text-slate-950">
                        {track.name}
                      </h3>
                      <p className="mt-1 text-sm font-semibold capitalize text-slate-500">
                        {track.type} track
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                      {track.clips.length} clips
                    </span>
                  </div>

                  <div className="mt-4 flex min-h-16 gap-2 overflow-x-auto rounded-xl bg-slate-200/70 p-2">
                    {track.clips.map((clip) => (
                      <div
                        key={clip.id}
                        className="min-w-40 rounded-lg bg-white px-3 py-3 shadow-sm"
                      >
                        <p className="truncate text-xs font-black text-slate-900">
                          {clip.name}
                        </p>
                        <p className="mt-1 text-[0.7rem] font-bold text-slate-500">
                          {formatDuration(clip.durationMs)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Scene Plan
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {selectedVariant.scenes.length} editable scenes
            </h2>

            <div className="mt-7 space-y-4">
              {selectedVariant.scenes.map((scene, index) => (
                <article
                  key={scene.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                        Scene {index + 1}
                      </p>
                      <h3 className="mt-2 text-xl font-black">
                        {scene.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {formatDuration(scene.durationMs)}
                    </span>
                  </div>

                  <p className="mt-4 font-medium leading-7 text-slate-600">
                    {scene.visualDirection}
                  </p>

                  {scene.onScreenText && (
                    <div className="mt-4 rounded-xl bg-blue-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                        On-screen text
                      </p>
                      <p className="mt-2 font-black text-blue-950">
                        {scene.onScreenText}
                      </p>
                    </div>
                  )}

                  {scene.narration && (
                    <div className="mt-4 rounded-xl bg-amber-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">
                        Narration
                      </p>
                      <p className="mt-2 font-medium leading-7 text-slate-700">
                        {scene.narration}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">
              Output Variants
            </p>

            <div className="mt-5 space-y-3">
              {campaignPlan.variants.map((variant) => {
                const format =
                  getStudioOutputFormat(variant.format);
                const isSelected =
                  variant.id === selectedVariant.id;

                return (
                  <Link
                    key={variant.id}
                    href={`/studio/editor/${project.id}?variant=${encodeURIComponent(
                      variant.id,
                    )}`}
                    className={`block rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-amber-300 bg-amber-300 text-blue-950"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    <p className="font-black">
                      {format.label}
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        isSelected
                          ? "text-blue-900/70"
                          : "text-blue-100/60"
                      }`}
                    >
                      {variant.aspectRatio} · {variant.width} × {variant.height}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-800" />
              <h2 className="text-xl font-black">
                Campaign
              </h2>
            </div>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Core message
                </dt>
                <dd className="mt-1 font-bold leading-6 text-slate-800">
                  {campaignPlan.coreMessage}
                </dd>
              </div>

              {campaignPlan.supportingMessage && (
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Supporting message
                  </dt>
                  <dd className="mt-1 font-medium leading-6 text-slate-700">
                    {campaignPlan.supportingMessage}
                  </dd>
                </div>
              )}

              {campaignPlan.callToAction && (
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Call to action
                  </dt>
                  <dd className="mt-1 font-black text-blue-900">
                    {campaignPlan.callToAction}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MonitorPlay className="h-5 w-5 text-blue-800" />
              <h2 className="text-xl font-black">
                Generation
              </h2>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-slate-500">
                  Status
                </dt>
                <dd className="font-black capitalize text-slate-900">
                  {latestGeneration?.status || project.status}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-slate-500">
                  Credits
                </dt>
                <dd className="font-black text-slate-900">
                  {latestGeneration?.administratorBypass
                    ? "Admin bypass"
                    : latestGeneration?.creditCost ?? 0}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-slate-500">
                  Quality
                </dt>
                <dd className="font-black capitalize text-slate-900">
                  {brief.quality || "standard"}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-slate-500">
                  Outputs
                </dt>
                <dd className="font-black text-slate-900">
                  {brief.outputCount ||
                    campaignPlan.variants.length}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-blue-800" />
              <h2 className="text-xl font-black">
                Project details
              </h2>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">
                  Created
                </dt>
                <dd className="mt-1 font-black text-slate-900">
                  {formatDate(project.createdAt)}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-500">
                  Last updated
                </dt>
                <dd className="mt-1 font-black text-slate-900">
                  {formatDate(project.updatedAt)}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-500">
                  Project ID
                </dt>
                <dd className="mt-1 break-all font-mono text-xs font-bold text-slate-600">
                  {project.id}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>
    </main>
  );
}