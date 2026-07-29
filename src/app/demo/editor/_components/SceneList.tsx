"use client";

import {
  Check,
  GripVertical,
} from "lucide-react";
import { useState } from "react";

export type SceneListScene = {
  id: string;
  title: string;
  startMs: number;
  endMs?: number;
  durationMs?: number;
};

type SceneListProps<TScene extends SceneListScene> = {
  scenes: TScene[];
  selectedSceneId: string | null;
  onSelect: (scene: TScene) => void;
  onReorder: (
    draggedId: string,
    targetId: string,
  ) => void;
};

function getSceneEndMs(scene: SceneListScene) {
  if (typeof scene.endMs === "number") {
    return scene.endMs;
  }

  return scene.startMs + (scene.durationMs ?? 0);
}

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function SceneList<
  TScene extends SceneListScene,
>({
  scenes,
  selectedSceneId,
  onSelect,
  onReorder,
}: SceneListProps<TScene>) {
  const [draggedId, setDraggedId] =
    useState<string | null>(null);
  const [dropTargetId, setDropTargetId] =
    useState<string | null>(null);

  if (scenes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-5 text-center">
        <p className="text-sm font-black text-white">
          No scenes yet
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          Add a scene to begin building the timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scenes.map((scene, index) => {
        const selected =
          scene.id === selectedSceneId;
        const isDropTarget =
          scene.id === dropTargetId;
        const endMs = getSceneEndMs(scene);

        return (
          <button
            key={scene.id}
            aria-pressed={selected}
            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              selected
                ? "border-blue-300/25 bg-blue-500/12"
                : isDropTarget
                  ? "border-cyan-300/30 bg-cyan-400/10"
                  : "border-white/10 bg-slate-950/35 hover:border-white/20 hover:bg-slate-950/55"
            } ${draggedId === scene.id ? "opacity-50" : ""}`}
            draggable
            onClick={() => onSelect(scene)}
            onDragEnd={() => {
              setDraggedId(null);
              setDropTargetId(null);
            }}
            onDragEnter={() => {
              if (
                draggedId &&
                draggedId !== scene.id
              ) {
                setDropTargetId(scene.id);
              }
            }}
            onDragLeave={() => {
              if (dropTargetId === scene.id) {
                setDropTargetId(null);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDragStart={(event) => {
              setDraggedId(scene.id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(
                "text/plain",
                scene.id,
              );
            }}
            onDrop={(event) => {
              event.preventDefault();

              const sourceId =
                draggedId ||
                event.dataTransfer.getData(
                  "text/plain",
                );

              if (
                sourceId &&
                sourceId !== scene.id
              ) {
                onReorder(sourceId, scene.id);
              }

              setDraggedId(null);
              setDropTargetId(null);
            }}
            type="button"
          >
            <GripVertical
              aria-hidden="true"
              className="h-4 w-4 shrink-0 cursor-grab text-slate-600 active:cursor-grabbing"
            />

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white">
              {index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">
                {scene.title}
              </p>
              <p className="mt-1 text-[0.62rem] font-bold text-slate-500">
                {formatTime(scene.startMs)} —{" "}
                {formatTime(endMs)}
              </p>
            </div>

            {selected && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                <Check className="h-4 w-4" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}