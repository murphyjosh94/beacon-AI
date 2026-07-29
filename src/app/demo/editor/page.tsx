"use client";

import {
  ChevronDown,
  Layers3,
  MonitorPlay,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scissors,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import Inspector from "./_components/Inspector";
import Preview, {
  type PreviewAspectRatio,
  type PreviewProject,
  type PreviewSceneType,
} from "./_components/Preview";
import SceneList from "./_components/SceneList";
import Timeline, {
  type TimelineResizeEdge,
} from "./_components/Timeline";
import Toolbar from "./_components/Toolbar";
import {
  type MotionProject,
  type MotionScene,
  useMotionProject,
} from "./_hooks/useMotionProject";

const MIN_SCENE_MS = 350;
const SNAP_MS = 50;

const INITIAL_SCENES: MotionScene[] = [
  {
    id: "beacon-intro",
    title: "Brand intro",
    startMs: 0,
    durationMs: 2_450,
    background: "#071B3D",
    text: "Beacon AI Launch",
  },
  {
    id: "beacon-search",
    title: "Search prompt",
    startMs: 2_050,
    durationMs: 2_700,
    background: "#0F2A5F",
    text: "Describe what you need.",
  },
  {
    id: "beacon-research",
    title: "Beacon research",
    startMs: 4_250,
    durationMs: 2_400,
    background: "#102F70",
    text: "Researching trusted options.",
  },
  {
    id: "beacon-results",
    title: "Recommendations",
    startMs: 6_050,
    durationMs: 4_600,
    background: "#0B2557",
    text: "The strongest matches, ranked.",
  },
  {
    id: "beacon-trust",
    title: "Trust score",
    startMs: 9_950,
    durationMs: 3_400,
    background: "#081D45",
    text: "Confidence before you click.",
  },
  {
    id: "beacon-end",
    title: "End card",
    startMs: 13_000,
    durationMs: 2_000,
    background: "#020617",
    text: "Search smarter. Choose confidently.",
  },
];

type ResizeState = {
  sceneId: string;
  edge: TimelineResizeEdge;
  pointerStartX: number;
  originalStartMs: number;
  originalDurationMs: number;
};

function snap(value: number) {
  return Math.round(value / SNAP_MS) * SNAP_MS;
}

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function getSceneEndMs(scene: MotionScene) {
  return scene.startMs + scene.durationMs;
}

function inferSceneType(
  scene: MotionScene,
  index: number,
  sceneCount: number,
): PreviewSceneType {
  const value = `${scene.id} ${scene.title}`.toLowerCase();

  if (value.includes("intro") || index === 0) {
    return "intro";
  }

  if (
    value.includes("search") ||
    value.includes("prompt") ||
    value.includes("brief")
  ) {
    return "search";
  }

  if (
    value.includes("research") ||
    value.includes("build")
  ) {
    return "research";
  }

  if (
    value.includes("result") ||
    value.includes("recommend") ||
    value.includes("preview")
  ) {
    return "results";
  }

  if (
    value.includes("trust") ||
    value.includes("analytics") ||
    value.includes("brand")
  ) {
    return "trust";
  }

  if (
    value.includes("end") ||
    index === sceneCount - 1
  ) {
    return "end";
  }

  return "results";
}

function toPreviewProject(
  project: MotionProject,
): PreviewProject {
  return {
    id: project.id,
    name: project.name,
    subtitle:
      project.description ||
      "Shopping recommendation reel",
    description: project.description,
    durationMs: project.durationMs,
    accent: "AI-powered recommendations",
    scenes: project.scenes.map((scene, index) => ({
      ...scene,
      type: inferSceneType(
        scene,
        index,
        project.scenes.length,
      ),
    })),
  };
}

function MotionEditorWorkspace() {
  const searchParams = useSearchParams();
  const requestedProjectId = searchParams.get("projectId");
  const {
    project,
    status,
    error,
    isDirty,
    updateProject,
    saveProject,
    clearError,
  } = useMotionProject({
    projectId: requestedProjectId,
    createIfMissing: true,
    autosaveDelayMs: 1_500,
    initialProject: {
      name: "Beacon AI Launch",
      description: "Shopping recommendation reel",
      aspectRatio: "9:16",
      durationMs: 15_000,
      scenes: INITIAL_SCENES,
      assetIds: [],
    },
  });

  const [selectedSceneId, setSelectedSceneId] =
    useState<string | null>(INITIAL_SCENES[0].id);
  const [currentTimeMs, setCurrentTimeMs] =
    useState(0);
  const [isPlaying, setIsPlaying] =
    useState(false);
  const [zoom, setZoom] = useState(1);
  const [volume, setVolume] = useState(80);
  const [resizeState, setResizeState] =
    useState<ResizeState | null>(null);

  const timelineHostRef =
    useRef<HTMLDivElement | null>(null);

  const selectedScene = useMemo(() => {
    if (!project || project.scenes.length === 0) {
      return null;
    }

    return (
      project.scenes.find(
        (scene) => scene.id === selectedSceneId,
      ) ?? project.scenes[0]
    );
  }, [project, selectedSceneId]);

  const previewProject = useMemo(
    () => (project ? toPreviewProject(project) : null),
    [project],
  );

  useEffect(() => {
    if (!project || project.scenes.length === 0) {
      setSelectedSceneId(null);
      setCurrentTimeMs(0);
      setIsPlaying(false);
      return;
    }

    const selectedStillExists = project.scenes.some(
      (scene) => scene.id === selectedSceneId,
    );

    if (!selectedStillExists) {
      setSelectedSceneId(project.scenes[0].id);
    }

    setCurrentTimeMs((current) =>
      Math.min(current, project.durationMs),
    );
  }, [project, selectedSceneId]);

  useEffect(() => {
    if (!isPlaying || !project) {
      return;
    }

    let previousTime = performance.now();
    let animationFrame = 0;

    const tick = (time: number) => {
      const elapsed = time - previousTime;
      previousTime = time;

      setCurrentTimeMs((current) => {
        const next = current + elapsed;

        if (next >= project.durationMs) {
          setIsPlaying(false);
          return project.durationMs;
        }

        return next;
      });

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, project]);

  useEffect(() => {
    if (!resizeState || !project) {
      return;
    }

    const handlePointerMove = (
      event: PointerEvent,
    ) => {
      const host = timelineHostRef.current;

      if (!host) {
        return;
      }

      const usableWidth =
        host.getBoundingClientRect().width * zoom;

      if (usableWidth <= 0) {
        return;
      }

      const deltaMs =
        ((event.clientX -
          resizeState.pointerStartX) /
          usableWidth) *
        project.durationMs;

      updateProject((currentProject) => ({
        ...currentProject,
        scenes: currentProject.scenes.map((scene) => {
          if (scene.id !== resizeState.sceneId) {
            return scene;
          }

          const originalEndMs =
            resizeState.originalStartMs +
            resizeState.originalDurationMs;

          if (resizeState.edge === "start") {
            const nextStartMs = Math.max(
              0,
              Math.min(
                snap(
                  resizeState.originalStartMs +
                    deltaMs,
                ),
                originalEndMs - MIN_SCENE_MS,
              ),
            );

            return {
              ...scene,
              startMs: nextStartMs,
              durationMs:
                originalEndMs - nextStartMs,
            };
          }

          const nextEndMs = Math.min(
            currentProject.durationMs,
            Math.max(
              snap(originalEndMs + deltaMs),
              resizeState.originalStartMs +
                MIN_SCENE_MS,
            ),
          );

          return {
            ...scene,
            durationMs:
              nextEndMs -
              resizeState.originalStartMs,
          };
        }),
      }));
    };

    const handlePointerUp = () => {
      setResizeState(null);
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
    );
    window.addEventListener(
      "pointerup",
      handlePointerUp,
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );
      window.removeEventListener(
        "pointerup",
        handlePointerUp,
      );
    };
  }, [
    project,
    resizeState,
    updateProject,
    zoom,
  ]);

  const updateScenes = (
    updater: (scenes: MotionScene[]) => MotionScene[],
  ) => {
    updateProject((currentProject) => {
      const scenes = updater(currentProject.scenes);

      const timelineEnd = scenes.reduce(
        (maximum, scene) =>
          Math.max(maximum, getSceneEndMs(scene)),
        0,
      );

      return {
        ...currentProject,
        scenes,
        durationMs: Math.max(
          currentProject.durationMs,
          timelineEnd,
        ),
      };
    });
  };

  const selectScene = (scene: MotionScene) => {
    setSelectedSceneId(scene.id);
    setCurrentTimeMs(scene.startMs);
    setIsPlaying(false);
  };

  const reorderScenes = (
    draggedId: string,
    targetId: string,
  ) => {
    updateScenes((currentScenes) => {
      const scenes = [...currentScenes];
      const fromIndex = scenes.findIndex(
        (scene) => scene.id === draggedId,
      );
      const toIndex = scenes.findIndex(
        (scene) => scene.id === targetId,
      );

      if (fromIndex < 0 || toIndex < 0) {
        return currentScenes;
      }

      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);

      return scenes;
    });
  };

  const addScene = () => {
    if (!project) {
      return;
    }

    const lastScene = project.scenes.at(-1);
    const startMs = lastScene
      ? getSceneEndMs(lastScene)
      : 0;

    const scene: MotionScene = {
      id: crypto.randomUUID(),
      title: "New scene",
      startMs,
      durationMs: 1_500,
      background: "#071B3D",
      assetId: null,
      text: "New Beacon scene",
    };

    updateScenes((scenes) => [...scenes, scene]);
    setSelectedSceneId(scene.id);
    setCurrentTimeMs(scene.startMs);
  };

  const duplicateSelectedScene = () => {
    if (!project || !selectedScene) {
      return;
    }

    const sourceIndex = project.scenes.findIndex(
      (scene) => scene.id === selectedScene.id,
    );

    const duplicate: MotionScene = {
      ...selectedScene,
      id: crypto.randomUUID(),
      title: `${selectedScene.title} copy`,
      startMs: getSceneEndMs(selectedScene),
    };

    updateScenes((currentScenes) => {
      const scenes = [...currentScenes];
      scenes.splice(
        Math.max(0, sourceIndex + 1),
        0,
        duplicate,
      );
      return scenes;
    });

    setSelectedSceneId(duplicate.id);
    setCurrentTimeMs(duplicate.startMs);
  };

  const deleteSelectedScene = () => {
    if (
      !project ||
      !selectedScene ||
      project.scenes.length <= 1
    ) {
      return;
    }

    const selectedIndex = project.scenes.findIndex(
      (scene) => scene.id === selectedScene.id,
    );

    const remainingScenes = project.scenes.filter(
      (scene) => scene.id !== selectedScene.id,
    );

    const nextScene =
      remainingScenes[
        Math.min(
          Math.max(selectedIndex, 0),
          remainingScenes.length - 1,
        )
      ];

    updateScenes(() => remainingScenes);
    setSelectedSceneId(nextScene.id);
    setCurrentTimeMs(nextScene.startMs);
    setIsPlaying(false);
  };

  const splitAtPlayhead = () => {
    if (!project || !selectedScene) {
      return;
    }

    const sceneEndMs =
      getSceneEndMs(selectedScene);
    const splitMs = snap(currentTimeMs);

    if (
      splitMs <=
        selectedScene.startMs + MIN_SCENE_MS ||
      splitMs >= sceneEndMs - MIN_SCENE_MS
    ) {
      return;
    }

    const sceneIndex = project.scenes.findIndex(
      (scene) => scene.id === selectedScene.id,
    );

    const firstScene: MotionScene = {
      ...selectedScene,
      durationMs:
        splitMs - selectedScene.startMs,
    };

    const secondScene: MotionScene = {
      ...selectedScene,
      id: crypto.randomUUID(),
      title: `${selectedScene.title} part 2`,
      startMs: splitMs,
      durationMs: sceneEndMs - splitMs,
    };

    updateScenes((currentScenes) => {
      const scenes = [...currentScenes];
      scenes.splice(
        sceneIndex,
        1,
        firstScene,
        secondScene,
      );
      return scenes;
    });

    setSelectedSceneId(secondScene.id);
    setCurrentTimeMs(secondScene.startMs);
  };

  const updateSelectedTitle = (title: string) => {
    if (!selectedScene) {
      return;
    }

    updateScenes((scenes) =>
      scenes.map((scene) =>
        scene.id === selectedScene.id
          ? { ...scene, title }
          : scene,
      ),
    );
  };

  const beginResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
    scene: MotionScene,
    edge: TimelineResizeEdge,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setSelectedSceneId(scene.id);
    setResizeState({
      sceneId: scene.id,
      edge,
      pointerStartX: event.clientX,
      originalStartMs: scene.startMs,
      originalDurationMs: scene.durationMs,
    });
  };

  const changeAspect = (
    aspectRatio: PreviewAspectRatio,
  ) => {
    updateProject({ aspectRatio });
  };

  const restartPlayback = () => {
    setCurrentTimeMs(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!project) {
      return;
    }

    if (currentTimeMs >= project.durationMs) {
      setCurrentTimeMs(0);
    }

    setIsPlaying((playing) => !playing);
  };

  if (!project || !previewProject) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
            Beacon Motion
          </p>
          <h1 className="mt-4 text-3xl font-black">
            {status === "error"
              ? "The editor could not open"
              : "Preparing your editor"}
          </h1>
          <p className="mt-4 font-semibold leading-7 text-slate-400">
            {error ??
              "Creating your motion project and loading the timeline."}
          </p>

          {status === "error" && (
            <button
              className="mt-6 rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white"
              onClick={clearError}
              type="button"
            >
              Dismiss error
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#020617_0%,#071126_50%,#020617_100%)] text-white">
      <Toolbar
        isDirty={isDirty}
        onSave={saveProject}
        projectName={project.name}
        saveStatus={status}
      />

      <div className="mx-auto grid max-w-[1800px] gap-4 p-4 sm:p-6 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
        <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-cyan-200" />
            <h2 className="text-sm font-black">
              Scenes
            </h2>
          </div>

          <div className="mt-4">
            <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-500">
              Project
            </label>

            <div className="relative mt-2">
              <select
                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 pr-9 text-sm font-black text-white outline-none"
                disabled
                value={project.id}
              >
                <option value={project.id}>
                  {project.name}
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div className="mt-5">
            <SceneList
              onReorder={reorderScenes}
              onSelect={selectScene}
              scenes={project.scenes}
              selectedSceneId={
                selectedScene?.id ?? null
              }
            />
          </div>

          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-white/15 bg-white/[0.025] px-4 py-3 text-xs font-black text-slate-300 transition hover:border-white/25 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={addScene}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add scene
          </button>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                  Canvas
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                  {project.name}
                </h1>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 p-1">
                {(
                  [
                    "9:16",
                    "1:1",
                    "16:9",
                    "4:5",
                  ] as PreviewAspectRatio[]
                ).map((value) => (
                  <button
                    key={value}
                    className={`rounded-full px-3 py-2 text-[0.62rem] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      project.aspectRatio === value
                        ? "bg-blue-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                    onClick={() =>
                      changeAspect(value)
                    }
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <Preview
              aspect={project.aspectRatio}
              currentTimeMs={currentTimeMs}
              project={previewProject}
            />

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                aria-label="Restart playback"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                onClick={restartPlayback}
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                aria-label={
                  isPlaying
                    ? "Pause playback"
                    : "Play project"
                }
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-950 shadow-xl transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                onClick={togglePlayback}
                type="button"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                )}
              </button>

              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                onClick={splitAtPlayhead}
                type="button"
              >
                <Scissors className="h-4 w-4" />
                Split
              </button>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-slate-300">
                {formatTime(currentTimeMs)} /{" "}
                {formatTime(project.durationMs)}
              </div>
            </div>
          </div>

          <div ref={timelineHostRef}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  aria-label="Zoom timeline out"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  onClick={() =>
                    setZoom((value) =>
                      Math.max(1, value - 0.25),
                    )
                  }
                  type="button"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <span className="min-w-16 text-center text-xs font-black text-slate-400">
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  aria-label="Zoom timeline in"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  onClick={() =>
                    setZoom((value) =>
                      Math.min(4, value + 0.25),
                    )
                  }
                  type="button"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs font-semibold text-slate-500">
                Drag scene edges to resize · drag
                scene cards to reorder · snaps to
                50ms
              </p>
            </div>

            <Timeline
              currentTimeMs={currentTimeMs}
              durationMs={project.durationMs}
              onResizeStart={beginResize}
              onSeek={(value) => {
                setCurrentTimeMs(value);
                setIsPlaying(false);
              }}
              onSelect={selectScene}
              scenes={project.scenes}
              selectedSceneId={
                selectedScene?.id ?? null
              }
              zoom={zoom}
            />
          </div>
        </section>

        <Inspector
          aspect={project.aspectRatio}
          canDelete={project.scenes.length > 1}
          onDelete={deleteSelectedScene}
          onDuplicate={duplicateSelectedScene}
          onSplit={splitAtPlayhead}
          onTitleChange={updateSelectedTitle}
          onVolumeChange={setVolume}
          scene={selectedScene}
          volume={volume}
        />
      </div>

      <div className="mx-auto max-w-[1800px] px-4 pb-6 sm:px-6">
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.025] px-4 py-4 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2">
            <MonitorPlay className="h-4 w-4" />
            Beacon Motion editor
          </p>

          <p>
            Live playback, autosave, scene
            reordering, duplication, deletion,
            splitting, resizing, zoom and snapping
            are active.
          </p>
        </div>
      </div>
    </main>
  );
}


export default function MotionEditorPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              Beacon Motion
            </p>
            <h1 className="mt-4 text-3xl font-black">
              Opening your project
            </h1>
          </div>
        </main>
      }
    >
      <MotionEditorWorkspace />
    </Suspense>
  );
}