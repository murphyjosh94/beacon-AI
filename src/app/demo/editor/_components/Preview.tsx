"use client";

import { Sparkles } from "lucide-react";
import { BeaconMark } from "./Toolbar";

export type PreviewAspectRatio =
  | "9:16"
  | "1:1"
  | "16:9"
  | "4:5";

export type PreviewSceneType =
  | "intro"
  | "search"
  | "research"
  | "results"
  | "trust"
  | "end";

export type PreviewScene = {
  id: string;
  title: string;
  type?: PreviewSceneType;
  startMs: number;
  endMs?: number;
  durationMs?: number;
};

export type PreviewProject = {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  durationMs: number;
  accent?: string;
  scenes: PreviewScene[];
};

type PreviewProps = {
  project: PreviewProject;
  aspect: PreviewAspectRatio;
  currentTimeMs: number;
};

const ASPECTS: Record<PreviewAspectRatio, string> = {
  "9:16": "aspect-[9/16] max-h-[36rem]",
  "1:1": "aspect-square max-h-[32rem]",
  "16:9": "aspect-video max-h-[28rem]",
  "4:5": "aspect-[4/5] max-h-[34rem]",
};

function getSceneEndMs(scene: PreviewScene) {
  if (typeof scene.endMs === "number") {
    return scene.endMs;
  }

  return scene.startMs + (scene.durationMs ?? 0);
}

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function getBrandLabel(projectId: string) {
  if (projectId.toLowerCase().includes("business")) {
    return "Beacon Business";
  }

  return "Beacon AI";
}

function getSceneHeadline(
  project: PreviewProject,
  scene: PreviewScene,
) {
  const isBusiness = project.id
    .toLowerCase()
    .includes("business");

  switch (scene.type) {
    case "intro":
      return project.name;
    case "search":
      return isBusiness
        ? "Tell Beacon about your business."
        : "Describe what you need.";
    case "research":
      return isBusiness
        ? "Building your website."
        : "Researching trusted options.";
    case "results":
      return isBusiness
        ? "Your new business website."
        : "The strongest matches, ranked.";
    case "trust":
      return isBusiness
        ? "Branding, analytics and growth."
        : "Confidence before you click.";
    case "end":
      return isBusiness
        ? "Build your business with Beacon."
        : "Search smarter. Choose confidently.";
    default:
      return scene.title;
  }
}

export default function Preview({
  project,
  aspect,
  currentTimeMs,
}: PreviewProps) {
  const fallbackScene = project.scenes.at(-1);

  const activeScene =
    project.scenes.find((scene) => {
      const endMs = getSceneEndMs(scene);
      return (
        currentTimeMs >= scene.startMs &&
        currentTimeMs <= endMs
      );
    }) ?? fallbackScene;

  if (!activeScene) {
    return (
      <div
        className={`mx-auto flex w-full items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-slate-950/55 p-8 text-center text-sm font-bold text-slate-500 ${ASPECTS[aspect]}`}
      >
        Add a scene to begin previewing this project.
      </div>
    );
  }

  const safeDuration = Math.max(project.durationMs, 1);
  const progress = Math.min(
    1,
    Math.max(0, currentTimeMs / safeDuration),
  );

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(37,99,235,0.38),transparent_34%),linear-gradient(180deg,#071B3D_0%,#020617_78%)] shadow-[0_35px_100px_rgba(0,0,0,0.45)] ${ASPECTS[aspect]}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex h-full flex-col p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[0.58rem] font-black uppercase tracking-[0.14em] text-amber-200">
            <Sparkles className="h-3 w-3" />
            {getBrandLabel(project.id)}
          </div>

          <span className="max-w-[50%] truncate rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[0.5rem] font-black uppercase tracking-[0.1em] text-slate-300">
            {activeScene.title}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <BeaconMark />

          <p className="mt-5 text-[0.6rem] font-black uppercase tracking-[0.18em] text-cyan-200">
            {project.accent ??
              "AI-powered creative tools"}
          </p>

          <h2 className="mt-3 max-w-sm text-3xl font-black tracking-[-0.055em]">
            {getSceneHeadline(project, activeScene)}
          </h2>

          <p className="mt-4 max-w-xs text-sm font-semibold leading-6 text-slate-300">
            {project.subtitle ??
              project.description ??
              "Create polished motion content with Beacon."}
          </p>
        </div>

        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-amber-300 transition-[width] duration-75"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[0.55rem] font-black text-slate-400">
            <span>{formatTime(currentTimeMs)}</span>
            <span>{formatTime(project.durationMs)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}