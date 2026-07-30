"use client";

import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Pause,
  Play,
  RotateCcw,
  Video,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type EditorScene = {
  id: string;
  title: string;
  startMs: number;
  durationMs: number;
  visualDirection: string;
  onScreenText: string | null;
  narration: string | null;
};

type EditorData = {
  project: {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  campaign: {
    title: string;
    summary: string;
    coreMessage: string;
    supportingMessage: string | null;
    callToAction: string | null;
    backgroundColor: string;
  };
  variant: {
    id: string;
    title: string;
    format: string;
    formatLabel: string;
    aspectRatio: string;
    width: number;
    height: number;
    durationMs: number;
    backgroundColor: string;
    scenes: EditorScene[];
  };
  variants: Array<{
    id: string;
    label: string;
    aspectRatio: string;
    width: number;
    height: number;
  }>;
  generation: {
    status: string;
    creditCost: number;
    administratorBypass: boolean;
    quality: string;
    outputs: number;
  };
  videoAsset: {
    id: string;
    name: string;
    url: string;
    durationMs: number | null;
    createdAt: string;
  } | null;
};

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000),
  );

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function sceneAtTime(
  scenes: EditorScene[],
  playheadMs: number,
): EditorScene {
  return (
    scenes.find(
      (scene) =>
        playheadMs >= scene.startMs &&
        playheadMs <
          scene.startMs + scene.durationMs,
    ) ??
    scenes[scenes.length - 1]
  );
}

export default function StudioEditorClient({
  data,
}: {
  data: EditorData;
}) {
  const [playheadMs, setPlayheadMs] =
    useState(0);
  const [isPlaying, setIsPlaying] =
    useState(false);
  const [selectedSceneId, setSelectedSceneId] =
    useState(
      data.variant.scenes[0]?.id ?? "",
    );
  const [showInspector, setShowInspector] =
    useState(true);
  const intervalRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const currentScene = useMemo(
    () =>
      sceneAtTime(
        data.variant.scenes,
        playheadMs,
      ),
    [
      data.variant.scenes,
      playheadMs,
    ],
  );

  const selectedScene =
    data.variant.scenes.find(
      (scene) =>
        scene.id === selectedSceneId,
    ) ??
    currentScene;

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current,
        );
        intervalRef.current = null;
      }

      return;
    }

    intervalRef.current =
      setInterval(() => {
        setPlayheadMs((current) => {
          const next =
            current + 100;

          if (
            next >=
            data.variant.durationMs
          ) {
            setIsPlaying(false);
            return 0;
          }

          return next;
        });
      }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current,
        );
        intervalRef.current = null;
      }
    };
  }, [
    data.variant.durationMs,
    isPlaying,
  ]);

  function togglePlayback() {
    setIsPlaying((current) => !current);
  }

  function restart() {
    setPlayheadMs(0);
    setIsPlaying(true);
  }

  function selectScene(scene: EditorScene) {
    setSelectedSceneId(scene.id);
    setPlayheadMs(scene.startMs);
    setIsPlaying(false);
  }

  function exportStoryboard() {
    const payload = {
      exportedAt:
        new Date().toISOString(),
      project: data.project,
      campaign: data.campaign,
      variant: data.variant,
      generation: data.generation,
    };

    const blob = new Blob(
      [
        JSON.stringify(
          payload,
          null,
          2,
        ),
      ],
      {
        type: "application/json",
      },
    );

    const url =
      URL.createObjectURL(blob);
    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download = `${data.project.title
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "studio-project"}-storyboard.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const progress =
    data.variant.durationMs > 0
      ? Math.min(
          100,
          (playheadMs /
            data.variant.durationMs) *
            100,
        )
      : 0;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Preview
              </p>
              <h2 className="mt-1 text-lg font-black">
                {data.variant.title}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-black text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1.5">
                {data.variant.formatLabel}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">
                {data.variant.width} ×{" "}
                {data.variant.height}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">
                {formatTime(
                  data.variant.durationMs,
                )}
              </span>
            </div>
          </div>

          <div className="grid gap-4 bg-[#091225] p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="flex min-h-[420px] items-center justify-center">
              {data.videoAsset ? (
                <video
                  src={data.videoAsset.url}
                  controls
                  preload="metadata"
                  className="max-h-[420px] max-w-full rounded-2xl bg-black shadow-2xl"
                />
              ) : (
                <div
                  className="relative flex max-h-[420px] w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                  style={{
                    aspectRatio: `${data.variant.width} / ${data.variant.height}`,
                    backgroundColor:
                      data.variant
                        .backgroundColor ||
                      data.campaign
                        .backgroundColor,
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.4),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.28),transparent_34%)]" />

                  <div className="relative flex w-full flex-col justify-between p-[8%] text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-black/35 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-amber-300 backdrop-blur">
                        Storyboard preview
                      </span>

                      <span className="rounded-full bg-black/35 px-3 py-1 text-[0.65rem] font-black backdrop-blur">
                        {formatTime(
                          playheadMs,
                        )}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                        {currentScene?.title ??
                          data.variant
                            .formatLabel}
                      </p>

                      <h3 className="mt-3 text-2xl font-black leading-tight">
                        {currentScene
                          ?.onScreenText ||
                          data.campaign
                            .coreMessage}
                      </h3>

                      <p className="mt-4 text-sm font-semibold leading-6 text-slate-200">
                        {currentScene
                          ?.visualDirection ||
                          data.campaign
                            .summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                Scene inspector
              </p>

              <h3 className="mt-3 text-lg font-black">
                {selectedScene?.title}
              </h3>

              <p className="mt-3 text-sm font-medium leading-6 text-slate-300">
                {selectedScene
                  ?.visualDirection}
              </p>

              {selectedScene
                ?.onScreenText ? (
                <div className="mt-4 rounded-xl bg-blue-500/10 p-3">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-blue-200">
                    On-screen text
                  </p>
                  <p className="mt-2 text-sm font-black">
                    {
                      selectedScene.onScreenText
                    }
                  </p>
                </div>
              ) : null}

              {selectedScene?.narration ? (
                <details className="mt-4 rounded-xl bg-amber-300/10 p-3">
                  <summary className="cursor-pointer text-[0.65rem] font-black uppercase tracking-[0.14em] text-amber-200">
                    Narration
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {
                      selectedScene.narration
                    }
                  </p>
                </details>
              ) : null}
            </div>
          </div>

          {!data.videoAsset ? (
            <div className="border-t border-slate-200 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-black text-white transition hover:bg-blue-900"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isPlaying
                    ? "Pause"
                    : "Play storyboard"}
                </button>

                <button
                  type="button"
                  onClick={restart}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </button>

                <span className="ml-auto text-xs font-black text-slate-500">
                  {formatTime(
                    playheadMs,
                  )}{" "}
                  /{" "}
                  {formatTime(
                    data.variant.durationMs,
                  )}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={
                  data.variant.durationMs
                }
                step={100}
                value={playheadMs}
                onChange={(event) => {
                  setPlayheadMs(
                    Number(
                      event.target
                        .value,
                    ),
                  );
                  setIsPlaying(false);
                }}
                className="mt-4 w-full accent-blue-700"
                aria-label="Storyboard playhead"
              />

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-blue-700 transition-[width]"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl bg-blue-950 p-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">
              Output variants
            </p>

            <div className="mt-4 space-y-2">
              {data.variants.map(
                (variant) => {
                  const selected =
                    variant.id ===
                    data.variant.id;

                  return (
                    <Link
                      key={variant.id}
                      href={`/studio/editor/${data.project.id}?variant=${encodeURIComponent(
                        variant.id,
                      )}`}
                      className={`block rounded-xl border p-3 transition ${
                        selected
                          ? "border-amber-300 bg-amber-300 text-blue-950"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <p className="text-sm font-black">
                        {variant.label}
                      </p>
                      <p className="mt-1 text-xs font-semibold opacity-70">
                        {
                          variant.aspectRatio
                        }{" "}
                        · {variant.width} ×{" "}
                        {variant.height}
                      </p>
                    </Link>
                  );
                },
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black">
                Production status
              </h2>
              <Video className="h-5 w-5 text-blue-800" />
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-500">
                  Campaign plan
                </dt>
                <dd className="font-black text-emerald-700">
                  Complete
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-500">
                  Video render
                </dt>
                <dd
                  className={`font-black ${
                    data.videoAsset
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {data.videoAsset
                    ? "Ready"
                    : "Pending"}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-500">
                  Quality
                </dt>
                <dd className="font-black capitalize">
                  {
                    data.generation
                      .quality
                  }
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-500">
                  Credits
                </dt>
                <dd className="font-black">
                  {data.generation
                    .administratorBypass
                    ? "Admin bypass"
                    : data.generation
                        .creditCost}
                </dd>
              </div>
            </dl>

            {!data.videoAsset ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">
                The scene plan is playable as a storyboard. A real MP4 cannot be exported until the video rendering service creates a ready video asset.
              </div>
            ) : null}
          </section>

          <button
            type="button"
            onClick={exportStoryboard}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export storyboard
          </button>
        </aside>
      </div>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              Timeline
            </p>
            <h2 className="mt-1 text-lg font-black">
              {data.variant.scenes.length} scenes
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowInspector(
                (current) => !current,
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700"
          >
            {showInspector ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showInspector
              ? "Compact"
              : "Expand"}
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {data.variant.scenes.map(
            (scene, index) => {
              const selected =
                scene.id ===
                selectedScene?.id;

              const widthPercentage =
                Math.max(
                  12,
                  (scene.durationMs /
                    data.variant
                      .durationMs) *
                    100,
                );

              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() =>
                    selectScene(scene)
                  }
                  className={`shrink-0 rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-blue-700 bg-blue-50"
                      : "border-slate-200 bg-slate-50 hover:bg-white"
                  }`}
                  style={{
                    width: `${Math.min(
                      34,
                      widthPercentage,
                    )}%`,
                    minWidth: "170px",
                  }}
                >
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-blue-700">
                    Scene {index + 1}
                  </p>
                  <p className="mt-2 truncate text-sm font-black">
                    {scene.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatTime(
                      scene.durationMs,
                    )}
                  </p>
                </button>
              );
            },
          )}
        </div>

        {showInspector &&
        selectedScene ? (
          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Visual direction
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                {
                  selectedScene.visualDirection
                }
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                On-screen text
              </p>
              <p className="mt-2 text-sm font-black text-slate-900">
                {selectedScene.onScreenText ||
                  "No text"}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Narration
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                {selectedScene.narration ||
                  "No narration"}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}