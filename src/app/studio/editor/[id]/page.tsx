import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Film,
  Save,
  Sparkles,
} from "lucide-react";
import {
  and,
  desc,
  eq,
  isNull,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  getCurrentAccessAccount,
  hasUnrestrictedBeaconAccess,
} from "@/lib/auth/AdminAccess";
import { database } from "@/lib/database/Database";
import {
  studioAsset,
  studioGeneration,
  studioProject,
} from "@/lib/database/schema";
import {
  type StudioCampaignPlan,
  type StudioCampaignVariant,
  type StudioGeneratedScene,
} from "@/app/studio/_engine/ScenePlanner";
import {
  getStudioOutputFormat,
} from "@/app/studio/_engine/PromptBuilder";
import StudioEditorClient from "@/app/studio/_components/StudioEditorClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudioEditorPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    variant?: string;
  }>;
};

type ProjectBrief = {
  prompt?: string;
  quality?: string;
  outputCount?: number;
};

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

function formatDate(value: Date | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function StudioEditorPage({
  params,
  searchParams,
}: StudioEditorPageProps) {
  const account =
    await getCurrentAccessAccount();

  if (!account?.id) {
    redirect("/signin");
  }

  const { id } = await params;
  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : undefined;

  const [project] = await database
    .select()
    .from(studioProject)
    .where(
      and(
        eq(studioProject.id, id),
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

  const campaignPlan =
    isCampaignPlan(project.campaignPlan)
      ? project.campaignPlan
      : null;

  if (
    !campaignPlan ||
    campaignPlan.variants.length === 0
  ) {
    return (
      <main className="min-h-screen bg-[#050b18] px-5 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-amber-300" />
          <h1 className="mt-5 text-2xl font-black">
            Campaign plan unavailable
          </h1>
          <p className="mt-3 text-slate-400">
            This project exists, but its structured scene plan is not ready.
          </p>
          <Link
            href="/studio"
            className="mt-6 inline-flex rounded-xl bg-amber-300 px-5 py-3 font-black text-slate-950"
          >
            Back to Studio
          </Link>
        </div>
      </main>
    );
  }

  const selectedVariant = getSelectedVariant(
    campaignPlan,
    resolvedSearchParams?.variant,
    project.selectedVariantId,
  );

  const [latestGeneration] = await database
    .select()
    .from(studioGeneration)
    .where(
      eq(
        studioGeneration.projectId,
        project.id,
      ),
    )
    .orderBy(
      desc(studioGeneration.createdAt),
    )
    .limit(1);

  const [videoAsset] = await database
    .select({
      id: studioAsset.id,
      name: studioAsset.name,
      url: studioAsset.url,
      durationMs: studioAsset.durationMs,
      createdAt: studioAsset.createdAt,
    })
    .from(studioAsset)
    .where(
      and(
        eq(studioAsset.projectId, project.id),
        eq(studioAsset.type, "video"),
        eq(studioAsset.status, "ready"),
        isNull(studioAsset.deletedAt),
      ),
    )
    .orderBy(
      desc(studioAsset.createdAt),
    )
    .limit(1);

  const brief = readBrief(project.brief);
  const selectedFormat =
    getStudioOutputFormat(
      selectedVariant.format,
    );

  async function saveSelectedVariant(): Promise<void> {
    "use server";

    const currentAccount =
      await getCurrentAccessAccount();

    if (!currentAccount?.id) {
      redirect("/signin");
    }

    const [ownedProject] = await database
      .select({
        id: studioProject.id,
        userId: studioProject.userId,
      })
      .from(studioProject)
      .where(
        and(
          eq(studioProject.id, project.id),
          isNull(studioProject.deletedAt),
        ),
      )
      .limit(1);

    if (!ownedProject) {
      notFound();
    }

    if (
      ownedProject.userId !== currentAccount.id &&
      !hasUnrestrictedBeaconAccess(currentAccount)
    ) {
      notFound();
    }

    await database
      .update(studioProject)
      .set({
        selectedVariantId:
          selectedVariant.id,
        updatedAt: new Date(),
      })
      .where(
        eq(
          studioProject.id,
          project.id,
        ),
      );

    revalidatePath(
      `/studio/editor/${project.id}`,
    );

    redirect(
      `/studio/editor/${project.id}?variant=${encodeURIComponent(
        selectedVariant.id,
      )}&saved=1`,
    );
  }

  const editorData = {
    project: {
      id: project.id,
      title: project.title,
      description:
        project.description ||
        campaignPlan.summary,
      status: project.status,
      createdAt:
        project.createdAt.toISOString(),
      updatedAt:
        project.updatedAt.toISOString(),
    },
    campaign: {
      title: campaignPlan.title,
      summary: campaignPlan.summary,
      coreMessage:
        campaignPlan.coreMessage,
      supportingMessage:
        campaignPlan.supportingMessage ??
        null,
      callToAction:
        campaignPlan.callToAction ??
        null,
      backgroundColor:
        campaignPlan.backgroundColor,
    },
    variant: {
      id: selectedVariant.id,
      title: selectedVariant.title,
      format: selectedVariant.format,
      formatLabel:
        selectedFormat.label,
      aspectRatio:
        selectedVariant.aspectRatio,
      width: selectedVariant.width,
      height: selectedVariant.height,
      durationMs:
        selectedVariant.durationMs,
      backgroundColor:
        selectedVariant.backgroundColor,
      scenes:
        selectedVariant.scenes.map(
          (scene) => ({
            id: scene.id,
            title: scene.title,
            startMs: scene.startMs,
            durationMs:
              scene.durationMs,
            visualDirection:
              scene.visualDirection,
            onScreenText:
              scene.onScreenText ??
              null,
            narration:
              scene.narration ??
              null,
          }),
        ),
    },
    variants:
      campaignPlan.variants.map(
        (variant) => ({
          id: variant.id,
          label:
            getStudioOutputFormat(
              variant.format,
            ).label,
          aspectRatio:
            variant.aspectRatio,
          width: variant.width,
          height: variant.height,
        }),
      ),
    generation: {
      status:
        latestGeneration?.status ??
        project.status,
      creditCost:
        latestGeneration?.creditCost ??
        0,
      administratorBypass:
        latestGeneration
          ?.administratorBypass ??
        false,
      quality:
        brief.quality ??
        "standard",
      outputs:
        brief.outputCount ??
        campaignPlan.variants.length,
    },
    videoAsset:
      videoAsset?.url
        ? {
            id: videoAsset.id,
            name: videoAsset.name,
            url: videoAsset.url,
            durationMs:
              videoAsset.durationMs,
            createdAt:
              videoAsset.createdAt.toISOString(),
          }
        : null,
  };

  return (
    <main className="min-h-screen bg-[#eef3f9] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071126] text-white shadow-lg">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/studio"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
              aria-label="Back to Studio"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-cyan-200">
                Beacon Studio Editor
              </p>
              <h1 className="truncate text-sm font-black sm:text-base">
                {project.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-200">
              {videoAsset?.url
                ? "Video ready"
                : "Plan ready · render pending"}
            </span>

            <form action={saveSelectedVariant}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black transition hover:bg-white/10"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </form>

            {videoAsset?.url ? (
              <a
                href={videoAsset.url}
                download
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black text-slate-950 transition hover:bg-amber-200"
              >
                <Download className="h-4 w-4" />
                Export MP4
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="The campaign plan is complete, but no rendered video asset exists yet."
                className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-slate-700 px-4 text-sm font-black text-slate-300 opacity-70"
              >
                <Film className="h-4 w-4" />
                Export MP4
              </button>
            )}
          </div>
        </div>
      </header>

      <StudioEditorClient data={editorData} />

      <footer className="mx-auto max-w-[1500px] px-4 pb-8 text-xs font-semibold text-slate-500 sm:px-6">
        Created {formatDate(project.createdAt)} · Updated{" "}
        {formatDate(project.updatedAt)}
      </footer>
    </main>
  );
}