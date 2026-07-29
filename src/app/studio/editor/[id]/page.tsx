"use client";

import {
  ArrowLeft,
  Clock3,
  Eye,
  EyeOff,
  Film,
  Globe2,
  Layers3,
  Loader2,
  Lock,
  MousePointer2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Square,
  TextCursorInput,
  Unlock,
  WandSparkles,
  ZoomIn,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import WebsiteViewport from "../../_components/WebsiteViewport";
import PlaybackEngine, {
  type PlaybackEngineEvent,
  type PlaybackSnapshot,
} from "../../_engine/PlaybackEngine";
import type { IframeBridge } from "../../_engine/iframeBridge";
import type {
  StudioActionType,
  StudioBridgeCommand,
  StudioDevicePreset,
  StudioKeyframe,
  StudioProject,
  StudioTrack,
  StudioTrackType,
} from "../../types";

type ProjectApiResponse =
  | StudioProject
  | {
      project?: StudioProject;
      data?: StudioProject;
    };

type SaveState =
  | "saved"
  | "saving"
  | "unsaved"
  | "error";

const TRACK_ICONS: Record<
  StudioTrackType,
  React.ReactNode
> = {
  camera: <ZoomIn className="h-4 w-4" />,
  scroll: <Globe2 className="h-4 w-4" />,
  cursor: <MousePointer2 className="h-4 w-4" />,
  highlight: <Sparkles className="h-4 w-4" />,
  text: <TextCursorInput className="h-4 w-4" />,
  audio: <Film className="h-4 w-4" />,
  voiceover: <WandSparkles className="h-4 w-4" />,
};

const TRACK_LABELS: Record<
  StudioTrackType,
  string
> = {
  camera: "Camera",
  scroll: "Scroll",
  cursor: "Cursor",
  highlight: "Highlight",
  text: "Text",
  audio: "Audio",
  voiceover: "Voice-over",
};

const DEFAULT_TRACKS: StudioTrack[] = [
  {
    id: "scroll-track",
    name: "Scroll",
    type: "scroll",
    enabled: true,
    locked: false,
    keyframes: [],
  },
  {
    id: "cursor-track",
    name: "Clicks",
    type: "cursor",
    enabled: true,
    locked: false,
    keyframes: [],
  },
  {
    id: "highlight-track",
    name: "Highlights",
    type: "highlight",
    enabled: true,
    locked: false,
    keyframes: [],
  },
  {
    id: "text-track",
    name: "Typing",
    type: "text",
    enabled: true,
    locked: false,
    keyframes: [],
  },
];

const INITIAL_SNAPSHOT: PlaybackSnapshot = {
  state: "idle",
  currentTimeMs: 0,
  durationMs: 15000,
  progress: 0,
  playbackRate: 1,
};

function normaliseProject(
  payload: ProjectApiResponse,
): StudioProject | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof payload.id === "string"
  ) {
    return payload as StudioProject;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "project" in payload &&
    payload.project
  ) {
    return payload.project;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    payload.data
  ) {
    return payload.data;
  }

  return null;
}

function formatTime(milliseconds: number): string {
  const safe = Math.max(0, milliseconds);
  const totalSeconds = safe / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((safe % 1000) / 100);

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}.${tenths}`;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function actionForTrack(
  type: StudioTrackType,
): StudioActionType {
  if (type === "scroll") {
    return "scroll";
  }

  if (type === "cursor") {
    return "cursor-click";
  }

  if (type === "highlight") {
    return "highlight";
  }

  if (type === "text") {
    return "text";
  }

  if (type === "camera") {
    return "zoom";
  }

  return "wait";
}

function defaultKeyframeForTrack(
  track: StudioTrack,
  atMs: number,
): StudioKeyframe {
  const action = actionForTrack(track.type);

  if (action === "scroll") {
    return {
      id: makeId("keyframe"),
      atMs,
      durationMs: 700,
      action,
      target: {
        sectionId: "hero",
      },
      easing: "ease-in-out",
    };
  }

  if (action === "cursor-click") {
    return {
      id: makeId("keyframe"),
      atMs,
      durationMs: 300,
      action,
      target: {
        selector: "button",
      },
      easing: "ease-out",
    };
  }

  if (action === "highlight") {
    return {
      id: makeId("keyframe"),
      atMs,
      durationMs: 900,
      action,
      target: {
        selector: "main",
      },
      value: true,
      easing: "ease-in-out",
    };
  }

  if (action === "text") {
    return {
      id: makeId("keyframe"),
      atMs,
      durationMs: 900,
      action,
      target: {
        selector: "input",
      },
      value: "Ask Beacon anything",
      easing: "linear",
    };
  }

  return {
    id: makeId("keyframe"),
    atMs,
    durationMs: 700,
    action,
    value: action === "zoom" ? 1.15 : undefined,
    easing: "ease-in-out",
  };
}

export default function StudioEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id;

  const [project, setProject] =
    useState<StudioProject | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState<string | null>(null);
  const [saveState, setSaveState] =
    useState<SaveState>("saved");
  const [selectedTrackId, setSelectedTrackId] =
    useState<string | null>(null);
  const [selectedKeyframeId, setSelectedKeyframeId] =
    useState<string | null>(null);
  const [timelineZoom, setTimelineZoom] =
    useState(1);
  const [playback, setPlayback] =
    useState<PlaybackSnapshot>(INITIAL_SNAPSHOT);
  const [playbackError, setPlaybackError] =
    useState<string | null>(null);

  const bridgeRef =
    useRef<IframeBridge | null>(null);
  const engineRef =
    useRef<PlaybackEngine | null>(null);

  const tracks = project?.tracks ?? [];
  const durationMs =
    project?.durationMs &&
    project.durationMs > 0
      ? project.durationMs
      : 15000;

  const selectedTrack = useMemo(
    () =>
      tracks.find(
        (track) =>
          track.id === selectedTrackId,
      ) ?? null,
    [selectedTrackId, tracks],
  );

  const selectedKeyframe = useMemo(
    () =>
      selectedTrack?.keyframes.find(
        (keyframe) =>
          keyframe.id ===
          selectedKeyframeId,
      ) ?? null,
    [
      selectedKeyframeId,
      selectedTrack,
    ],
  );

  const sendBridgeCommand =
    useCallback(
      async (
        command: StudioBridgeCommand,
      ) => {
        const bridge = bridgeRef.current;

        if (!bridge) {
          throw new Error(
            "The website preview is not connected yet.",
          );
        }

        const sent = bridge.send(command);

        if (!sent) {
          throw new Error(
            "The website preview could not receive the command.",
          );
        }
      },
      [],
    );

  const handlePlaybackEvent =
    useCallback(
      (event: PlaybackEngineEvent) => {
        if (
          event.type === "state" ||
          event.type === "time"
        ) {
          setPlayback(event.snapshot);
        }

        if (event.type === "error") {
          setPlaybackError(
            event.error.message,
          );
        }
      },
      [],
    );

  const createEngine = useCallback(
    (nextProject: StudioProject) => {
      engineRef.current?.destroy();

      const engine = new PlaybackEngine({
        project: nextProject,
        sendCommand: sendBridgeCommand,
        onEvent: handlePlaybackEvent,
        resetOnPlay: true,
        resetOnStop: true,
      });

      engineRef.current = engine;
      setPlayback(engine.snapshot);
    },
    [
      handlePlaybackEvent,
      sendBridgeCommand,
    ],
  );

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setLoadError(
        "No Studio project ID was provided.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/motion/projects/${encodeURIComponent(
          projectId,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "This Studio project could not be found."
            : "The Studio project could not be loaded.",
        );
      }

      const payload =
        (await response.json()) as ProjectApiResponse;
      const loadedProject =
        normaliseProject(payload);

      if (!loadedProject) {
        throw new Error(
          "The project response did not contain a valid project.",
        );
      }

      const normalised: StudioProject = {
        ...loadedProject,
        name:
          loadedProject.name ||
          "Untitled website video",
        description:
          loadedProject.description ||
          "A Beacon Studio project.",
        sourceUrl:
          loadedProject.sourceUrl?.trim() ||
          "/",
        aspectRatio:
          loadedProject.aspectRatio ||
          "16:9",
        device:
          loadedProject.device ||
          "desktop",
        durationMs:
          loadedProject.durationMs ||
          15000,
        tracks:
          loadedProject.tracks?.length
            ? loadedProject.tracks
            : DEFAULT_TRACKS,
        createdAt:
          loadedProject.createdAt ||
          new Date().toISOString(),
        updatedAt:
          loadedProject.updatedAt ||
          new Date().toISOString(),
      };

      setProject(normalised);
      setSelectedTrackId(
        normalised.tracks[0]?.id ??
          null,
      );
      setSelectedKeyframeId(null);
      setSaveState("saved");
      createEngine(normalised);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "The Studio project could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [createEngine, projectId]);

  useEffect(() => {
    void loadProject();

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [loadProject]);

  const updateProject = useCallback(
    (
      updater: (
        current: StudioProject,
      ) => StudioProject,
    ) => {
      setProject((current) => {
        if (!current) {
          return current;
        }

        const next = updater(current);
        setSaveState("unsaved");

        queueMicrotask(() => {
          engineRef.current?.updateProject(
            next,
          );
        });

        return next;
      });
    },
    [],
  );

  const handleBridgeReady =
    useCallback(
      (bridge: IframeBridge) => {
        bridgeRef.current = bridge;
        setPlaybackError(null);
      },
      [],
    );

  const saveProject = async () => {
    if (
      !project ||
      saveState === "saving"
    ) {
      return;
    }

    setSaveState("saving");

    try {
      const response = await fetch(
        `/api/motion/projects/${encodeURIComponent(
          project.id,
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...project,
            updatedAt:
              new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "The project could not be saved.",
        );
      }

      const payload =
        (await response.json()) as ProjectApiResponse;
      const savedProject =
        normaliseProject(payload);

      if (savedProject) {
        const merged = {
          ...project,
          ...savedProject,
        };

        setProject(merged);
        engineRef.current?.updateProject(
          merged,
        );
      }

      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const setDevice = (
    device: StudioDevicePreset,
  ) => {
    updateProject((current) => ({
      ...current,
      device,
    }));
  };

  const setTrackState = (
    trackId: string,
    updates: Partial<StudioTrack>,
  ) => {
    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map(
        (track) =>
          track.id === trackId
            ? {
                ...track,
                ...updates,
              }
            : track,
      ),
    }));
  };

  const addTrack = (
    type: StudioTrackType,
  ) => {
    const track: StudioTrack = {
      id: makeId(type),
      name: TRACK_LABELS[type],
      type,
      enabled: true,
      locked: false,
      keyframes: [],
    };

    updateProject((current) => ({
      ...current,
      tracks: [
        ...current.tracks,
        track,
      ],
    }));

    setSelectedTrackId(track.id);
    setSelectedKeyframeId(null);
  };

  const addKeyframe = () => {
    if (
      !selectedTrack ||
      selectedTrack.locked
    ) {
      return;
    }

    const keyframe =
      defaultKeyframeForTrack(
        selectedTrack,
        Math.round(
          playback.currentTimeMs,
        ),
      );

    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map(
        (track) =>
          track.id ===
          selectedTrack.id
            ? {
                ...track,
                keyframes: [
                  ...track.keyframes,
                  keyframe,
                ].sort(
                  (left, right) =>
                    left.atMs -
                    right.atMs,
                ),
              }
            : track,
      ),
    }));

    setSelectedKeyframeId(
      keyframe.id,
    );
  };

  const deleteKeyframe = () => {
    if (
      !selectedTrack ||
      !selectedKeyframe
    ) {
      return;
    }

    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map(
        (track) =>
          track.id ===
          selectedTrack.id
            ? {
                ...track,
                keyframes:
                  track.keyframes.filter(
                    (keyframe) =>
                      keyframe.id !==
                      selectedKeyframe.id,
                  ),
              }
            : track,
      ),
    }));

    setSelectedKeyframeId(null);
  };

  const updateSelectedKeyframe = (
    updates: Partial<StudioKeyframe>,
  ) => {
    if (
      !selectedTrack ||
      !selectedKeyframe
    ) {
      return;
    }

    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map(
        (track) =>
          track.id ===
          selectedTrack.id
            ? {
                ...track,
                keyframes:
                  track.keyframes
                    .map((keyframe) =>
                      keyframe.id ===
                      selectedKeyframe.id
                        ? {
                            ...keyframe,
                            ...updates,
                          }
                        : keyframe,
                    )
                    .sort(
                      (left, right) =>
                        left.atMs -
                        right.atMs,
                    ),
              }
            : track,
      ),
    }));
  };

  const togglePlayback = async () => {
    const engine = engineRef.current;

    if (!engine) {
      return;
    }

    setPlaybackError(null);

    if (
      engine.currentState ===
      "playing"
    ) {
      engine.pause();
      return;
    }

    await engine.play();
  };

  const stopPlayback = async () => {
    await engineRef.current?.stop();
  };

  const seekPlayback = async (
    timeMs: number,
  ) => {
    await engineRef.current?.seek(
      timeMs,
      {
        executePrevious: true,
      },
    );
  };

  const exportProject = () => {
    if (!project) {
      return;
    }

    const blob = new Blob(
      [
        JSON.stringify(
          project,
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
    anchor.download = `${project.name
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "studio-project"}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050b18] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-300" />
          <p className="mt-4 text-sm font-black text-slate-400">
            Loading Beacon Studio
          </p>
        </div>
      </main>
    );
  }

  if (!project || loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050b18] px-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-300/20 bg-red-400/10 p-7 text-center">
          <h1 className="text-xl font-black">
            Project unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-red-100/80">
            {loadError ??
              "The Studio project could not be loaded."}
          </p>
          <button
            className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950"
            onClick={() =>
              router.push("/studio/projects")
            }
            type="button"
          >
            Return to projects
          </button>
        </div>
      </main>
    );
  }

  const timelineWidth =
    Math.max(
      900,
      Math.round(
        durationMs *
          0.08 *
          timelineZoom,
      ),
    );

  return (
    <main className="flex min-h-screen flex-col bg-[#050b18] text-white">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3">
        <button
          aria-label="Back to projects"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          onClick={() =>
            router.push(
              "/studio/projects",
            )
          }
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400">
          <Film className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <input
            aria-label="Project name"
            className="w-full max-w-sm bg-transparent text-sm font-black text-white outline-none"
            onChange={(event) =>
              updateProject(
                (current) => ({
                  ...current,
                  name:
                    event.target.value,
                }),
              )
            }
            value={project.name}
          />
          <p className="truncate text-xs font-semibold text-slate-600">
            {project.sourceUrl}
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
            onClick={exportProject}
            type="button"
          >
            <Film className="h-4 w-4" />
            Export JSON
          </button>

          <button
            className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-black transition ${
              saveState === "error"
                ? "bg-red-500 text-white"
                : saveState === "saved"
                  ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                  : "bg-gradient-to-r from-blue-600 to-cyan-400 text-white"
            }`}
            disabled={
              saveState === "saving"
            }
            onClick={() =>
              void saveProject()
            }
            type="button"
          >
            {saveState === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveState === "saved"
              ? "Saved"
              : saveState === "saving"
                ? "Saving"
                : saveState === "error"
                  ? "Save failed"
                  : "Save changes"}
          </button>
        </div>
      </header>

      {playbackError ? (
        <div className="border-b border-red-300/15 bg-red-400/10 px-4 py-2.5 text-xs font-bold text-red-100">
          {playbackError}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
        <aside className="flex min-h-0 flex-col border-r border-white/10 bg-[#071020]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs font-black">
                Timeline tracks
              </p>
              <p className="mt-1 text-[0.65rem] font-semibold text-slate-600">
                {tracks.length} layers
              </p>
            </div>

            <div className="group relative">
              <button
                aria-label="Add track"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>

              <div className="invisible absolute right-0 top-10 z-30 w-44 rounded-2xl border border-white/10 bg-slate-950 p-2 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
                {(
                  [
                    "scroll",
                    "cursor",
                    "highlight",
                    "text",
                    "camera",
                    "audio",
                    "voiceover",
                  ] as StudioTrackType[]
                ).map((type) => (
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-black text-slate-300 hover:bg-white/10 hover:text-white"
                    key={type}
                    onClick={() =>
                      addTrack(type)
                    }
                    type="button"
                  >
                    {TRACK_ICONS[type]}
                    {TRACK_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {tracks.map((track) => {
              const selected =
                track.id ===
                selectedTrackId;

              return (
                <button
                  className={`mb-1 flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    selected
                      ? "border-cyan-300/25 bg-cyan-300/10 text-white"
                      : "border-transparent text-slate-500 hover:bg-white/5 hover:text-white"
                  }`}
                  key={track.id}
                  onClick={() => {
                    setSelectedTrackId(
                      track.id,
                    );
                    setSelectedKeyframeId(
                      null,
                    );
                  }}
                  type="button"
                >
                  <span className="text-cyan-200">
                    {TRACK_ICONS[
                      track.type
                    ]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-black">
                    {track.name}
                  </span>
                  <span className="text-[0.65rem] font-black text-slate-600">
                    {
                      track.keyframes
                        .length
                    }
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/10 p-3">
            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={
                !selectedTrack ||
                selectedTrack.locked
              }
              onClick={addKeyframe}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add keyframe at{" "}
              {formatTime(
                playback.currentTimeMs,
              )}
            </button>
          </div>
        </aside>

        <section className="min-w-0 overflow-auto p-4 sm:p-5">
          <WebsiteViewport
            device={project.device}
            onBridgeReady={
              handleBridgeReady
            }
            onDeviceChange={
              setDevice
            }
            sourceUrl={
              project.sourceUrl
            }
          />
        </section>

        <aside className="border-l border-white/10 bg-[#071020] p-4">
          <h2 className="text-sm font-black">
            Inspector
          </h2>

          {!selectedTrack ? (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Select a track to edit its settings.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              <Field label="Track name">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-cyan-300/30"
                  onChange={(event) =>
                    setTrackState(
                      selectedTrack.id,
                      {
                        name:
                          event.target
                            .value,
                      },
                    )
                  }
                  value={
                    selectedTrack.name
                  }
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-black text-slate-300 hover:bg-white/10"
                  onClick={() =>
                    setTrackState(
                      selectedTrack.id,
                      {
                        enabled:
                          !selectedTrack.enabled,
                      },
                    )
                  }
                  type="button"
                >
                  {selectedTrack.enabled ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  {selectedTrack.enabled
                    ? "Enabled"
                    : "Disabled"}
                </button>

                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-black text-slate-300 hover:bg-white/10"
                  onClick={() =>
                    setTrackState(
                      selectedTrack.id,
                      {
                        locked:
                          !selectedTrack.locked,
                      },
                    )
                  }
                  type="button"
                >
                  {selectedTrack.locked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                  {selectedTrack.locked
                    ? "Locked"
                    : "Unlocked"}
                </button>
              </div>

              {selectedKeyframe ? (
                <>
                  <div className="border-t border-white/10 pt-5">
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-cyan-200">
                      Selected keyframe
                    </p>
                  </div>

                  <Field label="Start time (ms)">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none"
                      min={0}
                      onChange={(event) =>
                        updateSelectedKeyframe(
                          {
                            atMs:
                              Number(
                                event.target
                                  .value,
                              ) || 0,
                          },
                        )
                      }
                      type="number"
                      value={
                        selectedKeyframe.atMs
                      }
                    />
                  </Field>

                  <Field label="Action">
                    <select
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-bold text-white outline-none"
                      onChange={(event) =>
                        updateSelectedKeyframe(
                          {
                            action:
                              event.target
                                .value as StudioActionType,
                          },
                        )
                      }
                      value={
                        selectedKeyframe.action
                      }
                    >
                      <option value="scroll">
                        Scroll
                      </option>
                      <option value="cursor-click">
                        Click
                      </option>
                      <option value="highlight">
                        Highlight
                      </option>
                      <option value="text">
                        Type text
                      </option>
                      <option value="zoom">
                        Zoom
                      </option>
                      <option value="wait">
                        Wait
                      </option>
                    </select>
                  </Field>

                  <Field label="CSS selector">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none"
                      onChange={(event) =>
                        updateSelectedKeyframe(
                          {
                            target: {
                              ...selectedKeyframe.target,
                              selector:
                                event.target
                                  .value,
                            },
                          },
                        )
                      }
                      placeholder="#search-button"
                      value={
                        selectedKeyframe
                          .target
                          ?.selector ?? ""
                      }
                    />
                  </Field>

                  <Field label="Section ID">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none"
                      onChange={(event) =>
                        updateSelectedKeyframe(
                          {
                            target: {
                              ...selectedKeyframe.target,
                              sectionId:
                                event.target
                                  .value,
                            },
                          },
                        )
                      }
                      placeholder="hero"
                      value={
                        selectedKeyframe
                          .target
                          ?.sectionId ??
                        ""
                      }
                    />
                  </Field>

                  <Field label="Text or value">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none"
                      onChange={(event) =>
                        updateSelectedKeyframe(
                          {
                            value:
                              event.target
                                .value,
                          },
                        )
                      }
                      placeholder="Ask Beacon anything"
                      value={
                        typeof selectedKeyframe.value ===
                        "string"
                          ? selectedKeyframe.value
                          : ""
                      }
                    />
                  </Field>

                  <button
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-300/15 bg-red-400/10 text-xs font-black text-red-200 transition hover:bg-red-400/15"
                    onClick={
                      deleteKeyframe
                    }
                    type="button"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Delete keyframe
                  </button>
                </>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-xs font-semibold leading-6 text-slate-600">
                  Select a keyframe in the timeline to edit its action.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>

      <section className="h-[19rem] shrink-0 border-t border-white/10 bg-[#071020]">
        <div className="flex h-14 items-center justify-between gap-3 border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <button
              aria-label="Stop playback"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              onClick={() =>
                void stopPlayback()
              }
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              aria-label={
                playback.state ===
                "playing"
                  ? "Pause playback"
                  : "Play project"
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 transition hover:scale-105"
              onClick={() =>
                void togglePlayback()
              }
              type="button"
            >
              {playback.state ===
              "playing" ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              )}
            </button>

            <div className="ml-2 flex items-center gap-2 text-xs font-black">
              <Clock3 className="h-4 w-4 text-slate-600" />
              <span className="text-white">
                {formatTime(
                  playback.currentTimeMs,
                )}
              </span>
              <span className="text-slate-700">
                /
              </span>
              <span className="text-slate-500">
                {formatTime(durationMs)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              aria-label="Playback speed"
              className="rounded-full border border-white/10 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300 outline-none"
              onChange={(event) => {
                const rate = Number(
                  event.target.value,
                );

                engineRef.current?.setPlaybackRate(
                  rate,
                );
              }}
              value={
                playback.playbackRate
              }
            >
              <option value={0.5}>
                0.5×
              </option>
              <option value={1}>
                1×
              </option>
              <option value={1.5}>
                1.5×
              </option>
              <option value={2}>
                2×
              </option>
            </select>

            <input
              aria-label="Timeline zoom"
              className="w-28 accent-cyan-300"
              max={2}
              min={0.5}
              onChange={(event) =>
                setTimelineZoom(
                  Number(
                    event.target.value,
                  ),
                )
              }
              step={0.1}
              type="range"
              value={timelineZoom}
            />
          </div>
        </div>

        <div className="grid h-[calc(100%-3.5rem)] min-h-0 grid-cols-[13rem_minmax(0,1fr)]">
          <div className="overflow-hidden border-r border-white/10">
            <div className="h-8 border-b border-white/10 bg-white/[0.02]" />
            <div className="h-[calc(100%-2rem)] overflow-y-auto">
              {tracks.map((track) => (
                <button
                  className={`flex h-11 w-full items-center gap-3 border-b border-white/[0.06] px-3 text-left transition ${
                    selectedTrackId ===
                    track.id
                      ? "bg-cyan-300/10 text-white"
                      : "text-slate-500 hover:bg-white/5 hover:text-white"
                  }`}
                  key={track.id}
                  onClick={() => {
                    setSelectedTrackId(
                      track.id,
                    );
                    setSelectedKeyframeId(
                      null,
                    );
                  }}
                  type="button"
                >
                  {TRACK_ICONS[
                    track.type
                  ]}
                  <span className="truncate text-xs font-black">
                    {track.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 overflow-auto">
            <div
              className="relative"
              style={{
                width: timelineWidth,
              }}
            >
              <button
                aria-label="Seek timeline"
                className="relative block h-8 w-full border-b border-white/10 bg-white/[0.02]"
                onClick={(event) => {
                  const rect =
                    event.currentTarget.getBoundingClientRect();
                  const ratio =
                    (event.clientX -
                      rect.left) /
                    rect.width;

                  void seekPlayback(
                    ratio *
                      durationMs,
                  );
                }}
                type="button"
              >
                {Array.from({
                  length: 11,
                }).map((_, index) => (
                  <span
                    className="absolute top-0 h-full border-l border-white/10 text-[0.55rem] font-black text-slate-600"
                    key={index}
                    style={{
                      left: `${index * 10}%`,
                    }}
                  >
                    <span className="ml-1 mt-1 inline-block">
                      {formatTime(
                        (durationMs *
                          index) /
                          10,
                      )}
                    </span>
                  </span>
                ))}
              </button>

              <div className="relative">
                {tracks.map((track) => (
                  <div
                    className="relative h-11 border-b border-white/[0.06]"
                    key={track.id}
                  >
                    {track.keyframes.map(
                      (keyframe) => {
                        const left =
                          (keyframe.atMs /
                            durationMs) *
                          100;
                        const selected =
                          keyframe.id ===
                          selectedKeyframeId;

                        return (
                          <button
                            aria-label={`Select ${keyframe.action} keyframe`}
                            className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[0.3rem] border transition ${
                              selected
                                ? "border-white bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.7)]"
                                : "border-cyan-200/50 bg-cyan-400/40 hover:bg-cyan-300"
                            }`}
                            key={
                              keyframe.id
                            }
                            onClick={() => {
                              setSelectedTrackId(
                                track.id,
                              );
                              setSelectedKeyframeId(
                                keyframe.id,
                              );
                              void seekPlayback(
                                keyframe.atMs,
                              );
                            }}
                            style={{
                              left: `${left}%`,
                            }}
                            type="button"
                          />
                        );
                      },
                    )}
                  </div>
                ))}

                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-red-400"
                  style={{
                    left: `${playback.progress * 100}%`,
                  }}
                >
                  <div className="absolute -left-1.5 -top-1 h-3 w-3 rotate-45 bg-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}