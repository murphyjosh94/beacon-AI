"use client";

import {
  Clock3,
  Copy,
  Film,
  Image as ImageIcon,
  Mic2,
  Music2,
  Scissors,
  Settings2,
  Square,
  Trash2,
  Type,
  Volume2,
  WandSparkles,
} from "lucide-react";
import type { ComponentType } from "react";

export type InspectorScene = {
  id: string;
  title: string;
  startMs: number;
  endMs?: number;
  durationMs?: number;
};

type InspectorProps<TScene extends InspectorScene> = {
  scene: TScene | null;
  aspect: string;
  volume: number;
  canDelete: boolean;
  onTitleChange: (title: string) => void;
  onDuplicate: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onVolumeChange: (value: number) => void;
};

function getSceneEndMs(scene: InspectorScene) {
  if (typeof scene.endMs === "number") {
    return scene.endMs;
  }

  return scene.startMs + (scene.durationMs ?? 0);
}

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

const CONTENT_ACTIONS: Array<{
  icon: ComponentType<{ className?: string }>;
  label: string;
}> = [
  { icon: Type, label: "Text" },
  { icon: ImageIcon, label: "Image" },
  { icon: Music2, label: "Audio" },
  { icon: Mic2, label: "Voice-over" },
  { icon: Square, label: "Shape" },
  { icon: WandSparkles, label: "Effect" },
];

export default function Inspector<
  TScene extends InspectorScene,
>({
  scene,
  aspect,
  volume,
  canDelete,
  onTitleChange,
  onDuplicate,
  onSplit,
  onDelete,
  onVolumeChange,
}: InspectorProps<TScene>) {
  if (!scene) {
    return (
      <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-amber-200" />
          <h2 className="text-sm font-black">
            Inspector
          </h2>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/35 p-5 text-center">
          <p className="text-sm font-black text-white">
            No scene selected
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            Select a scene to edit its settings.
          </p>
        </div>
      </aside>
    );
  }

  const endMs = getSceneEndMs(scene);

  return (
    <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-amber-200" />
        <h2 className="text-sm font-black">
          Inspector
        </h2>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-slate-500">
          Selected scene
        </p>
        <p className="mt-2 text-base font-black text-white">
          {scene.title}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {formatTime(scene.startMs)} —{" "}
          {formatTime(endMs)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-[0.58rem] font-black text-slate-300 transition hover:bg-slate-950/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onClick={onDuplicate}
          type="button"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </button>

        <button
          className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-[0.58rem] font-black text-slate-300 transition hover:bg-slate-950/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onClick={onSplit}
          type="button"
        >
          <Scissors className="h-4 w-4" />
          Split
        </button>

        <button
          className="flex flex-col items-center gap-2 rounded-xl border border-red-300/10 bg-red-400/[0.05] p-3 text-[0.58rem] font-black text-red-200 transition hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canDelete}
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-slate-500">
            Scene title
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/55 px-3 py-3 text-sm font-bold text-white outline-none focus:border-blue-300/30 focus:ring-2 focus:ring-blue-500/20"
            onChange={(event) =>
              onTitleChange(event.target.value)
            }
            value={scene.title}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-slate-500">
              Start
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/55 px-3 py-3">
              <Clock3 className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-black">
                {formatTime(scene.startMs)}
              </span>
            </div>
          </div>

          <div>
            <label className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-slate-500">
              End
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/55 px-3 py-3">
              <Clock3 className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-black">
                {formatTime(endMs)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-slate-500">
          Add content
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {CONTENT_ACTIONS.map(
            ({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-left text-xs font-black text-slate-300 transition hover:border-white/20 hover:bg-slate-950/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                type="button"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-slate-500">
          Audio
        </p>

        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/45 p-3">
          <Volume2 className="h-4 w-4 text-cyan-200" />
          <input
            aria-label="Audio volume"
            className="w-full accent-blue-500"
            max={100}
            min={0}
            onChange={(event) =>
              onVolumeChange(
                Number(event.target.value),
              )
            }
            type="range"
            value={volume}
          />
          <span className="min-w-10 text-right text-[0.62rem] font-black text-slate-400">
            {volume}%
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4">
        <div className="flex items-start gap-3">
          <Film className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
          <div>
            <p className="text-sm font-black text-white">
              Export preset
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
              MP4 · 1080p · 30fps · {aspect}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}