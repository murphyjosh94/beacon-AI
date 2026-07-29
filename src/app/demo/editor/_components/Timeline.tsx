"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

export type TimelineResizeEdge = "start" | "end";

export type TimelineScene = {
  id: string;
  title: string;
  startMs: number;
  endMs?: number;
  durationMs?: number;
};

type TimelineProps<TScene extends TimelineScene> = {
  scenes: TScene[];
  durationMs: number;
  currentTimeMs: number;
  selectedSceneId: string | null;
  zoom: number;
  onSeek: (value: number) => void;
  onSelect: (scene: TScene) => void;
  onResizeStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    scene: TScene,
    edge: TimelineResizeEdge,
  ) => void;
};

function getSceneEndMs(scene: TimelineScene) {
  if (typeof scene.endMs === "number") {
    return scene.endMs;
  }

  return scene.startMs + (scene.durationMs ?? 0);
}

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function Timeline<
  TScene extends TimelineScene,
>({
  scenes,
  durationMs,
  currentTimeMs,
  selectedSceneId,
  zoom,
  onSeek,
  onSelect,
  onResizeStart,
}: TimelineProps<TScene>) {
  const safeDuration = Math.max(durationMs, 1);
  const canvasWidth = 100 * Math.max(1, zoom);
  const playheadPosition =
    (Math.min(Math.max(currentTimeMs, 0), safeDuration) /
      safeDuration) *
    100;

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
      <div
        className="relative min-w-full"
        style={{ width: `${canvasWidth}%` }}
      >
        <div className="relative h-24">
          <div className="absolute inset-x-0 top-5 flex h-14 overflow-visible rounded-xl border border-white/10 bg-white/[0.035]">
            {scenes.map((scene, index) => {
              const endMs = getSceneEndMs(scene);
              const width =
                ((endMs - scene.startMs) /
                  safeDuration) *
                100;
              const left =
                (scene.startMs / safeDuration) * 100;
              const selected =
                scene.id === selectedSceneId;

              return (
                <div
                  key={scene.id}
                  className={`absolute top-0 h-full rounded-lg border transition ${
                    selected
                      ? "z-20 border-blue-300/40 bg-blue-500/35"
                      : index % 2 === 0
                        ? "z-10 border-white/10 bg-white/[0.07]"
                        : "z-10 border-white/10 bg-white/[0.035]"
                  }`}
                  style={{
                    left: `${Math.max(0, left)}%`,
                    width: `${Math.max(width, 1.5)}%`,
                  }}
                >
                  <button
                    className="h-full w-full px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    onClick={() => onSelect(scene)}
                    type="button"
                  >
                    <span className="block truncate text-[0.58rem] font-black text-white">
                      {scene.title}
                    </span>
                    <span className="mt-1 block text-[0.5rem] font-bold text-slate-400">
                      {formatTime(
                        Math.max(0, endMs - scene.startMs),
                      )}
                    </span>
                  </button>

                  {selected && (
                    <>
                      <button
                        aria-label={`Resize start of ${scene.title}`}
                        className="absolute -left-1.5 top-0 h-full w-3 cursor-ew-resize rounded-l-lg bg-blue-300/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        onPointerDown={(event) =>
                          onResizeStart(
                            event,
                            scene,
                            "start",
                          )
                        }
                        type="button"
                      />
                      <button
                        aria-label={`Resize end of ${scene.title}`}
                        className="absolute -right-1.5 top-0 h-full w-3 cursor-ew-resize rounded-r-lg bg-blue-300/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        onPointerDown={(event) =>
                          onResizeStart(
                            event,
                            scene,
                            "end",
                          )
                        }
                        type="button"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1 h-20 w-px bg-amber-300 shadow-[0_0_10px_rgba(246,196,83,0.7)]"
            style={{ left: `${playheadPosition}%` }}
          >
            <span className="absolute -left-1.5 -top-0.5 h-3 w-3 rotate-45 bg-amber-300" />
          </div>

          <input
            aria-label="Timeline position"
            className="absolute inset-x-0 bottom-0 h-5 w-full cursor-pointer opacity-0"
            max={safeDuration}
            min={0}
            onChange={(event) =>
              onSeek(Number(event.target.value))
            }
            step={25}
            type="range"
            value={Math.min(
              Math.max(currentTimeMs, 0),
              safeDuration,
            )}
          />
        </div>
      </div>
    </div>
  );
}