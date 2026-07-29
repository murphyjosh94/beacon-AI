"use client";

import {
  Dispatch,
  MutableRefObject,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

export type StudioPanelId =
  | "assets"
  | "timeline"
  | "inspector"
  | "history"
  | "renderQueue"
  | "keyframes"
  | "curves"
  | "voiceOver"
  | "recording";

export type StudioTool =
  | "select"
  | "hand"
  | "text"
  | "shape"
  | "image"
  | "video"
  | "audio"
  | "crop"
  | "record";

export type StudioAssetKind =
  | "image"
  | "video"
  | "audio"
  | "voice"
  | "recording"
  | "font"
  | "document"
  | "other";

export type StudioAssetStatus =
  | "ready"
  | "uploading"
  | "processing"
  | "failed";

export type StudioAsset = {
  id: string;
  projectId?: string;
  name: string;
  kind: StudioAssetKind;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  createdAt: string;
  updatedAt?: string;
  status: StudioAssetStatus;
  favourite?: boolean;
  metadata?: Record<string, unknown>;
};

export type StudioKeyframeInterpolation =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "step"
  | "cubic-bezier";

export type StudioBezierCurve = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type StudioKeyframe = {
  id: string;
  clipId: string;
  property: string;
  timeMs: number;
  value: number | string | boolean | number[];
  interpolation: StudioKeyframeInterpolation;
  curve?: StudioBezierCurve;
};

export type StudioClipType =
  | "video"
  | "audio"
  | "image"
  | "text"
  | "shape"
  | "voice"
  | "recording"
  | "group";

export type StudioClipTransform = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  anchorX: number;
  anchorY: number;
};

export type StudioClipAudio = {
  muted: boolean;
  volume: number;
  pan: number;
  fadeInMs: number;
  fadeOutMs: number;
};

export type StudioClipStyle = {
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: "left" | "centre" | "right" | "justify";
  objectFit?: "cover" | "contain" | "fill" | "none";
  filter?: string;
  mixBlendMode?: string;
  [key: string]: unknown;
};

export type StudioClip = {
  id: string;
  trackId: string;
  assetId?: string;
  type: StudioClipType;
  name: string;
  startMs: number;
  durationMs: number;
  trimStartMs: number;
  trimEndMs: number;
  playbackRate: number;
  layer: number;
  locked: boolean;
  hidden: boolean;
  selected?: boolean;
  transform: StudioClipTransform;
  audio?: StudioClipAudio;
  style?: StudioClipStyle;
  content?: string;
  keyframes?: StudioKeyframe[];
  metadata?: Record<string, unknown>;
};

export type StudioTrackType =
  | "video"
  | "audio"
  | "overlay"
  | "voice"
  | "recording"
  | "mixed";

export type StudioTrack = {
  id: string;
  name: string;
  type: StudioTrackType;
  order: number;
  locked: boolean;
  muted: boolean;
  hidden: boolean;
  solo: boolean;
  height: number;
  clips: StudioClip[];
};

export type StudioTimeline = {
  durationMs: number;
  playheadMs: number;
  zoom: number;
  scrollLeft: number;
  snappingEnabled: boolean;
  snapThresholdPx: number;
  tracks: StudioTrack[];
  inPointMs?: number;
  outPointMs?: number;
};

export type StudioPlaybackState = {
  isPlaying: boolean;
  isLooping: boolean;
  rate: number;
  volume: number;
  muted: boolean;
  frameRate: number;
};

export type StudioSelection = {
  clipIds: string[];
  trackIds: string[];
  assetIds: string[];
  keyframeIds: string[];
  primaryClipId: string | null;
  primaryAssetId: string | null;
  primaryKeyframeId: string | null;
};

export type StudioGuide = {
  id: string;
  axis: "x" | "y";
  position: number;
  locked: boolean;
};

export type StudioPreferences = {
  autosaveEnabled: boolean;
  autosaveDelayMs: number;
  showGrid: boolean;
  showGuides: boolean;
  showSafeArea: boolean;
  reducedMotion: boolean;
  defaultClipDurationMs: number;
  defaultTransitionDurationMs: number;
  timelineFollowPlayhead: boolean;
  confirmDestructiveActions: boolean;
};

export type StudioPanelState = {
  visible: Record<StudioPanelId, boolean>;
  activePanel: StudioPanelId;
  inspectorWidth: number;
  assetPanelWidth: number;
  timelineHeight: number;
};

export type StudioRenderStatus =
  | "queued"
  | "preparing"
  | "rendering"
  | "completed"
  | "failed"
  | "cancelled";

export type StudioRenderJob = {
  id: string;
  projectId: string;
  name: string;
  status: StudioRenderStatus;
  format: "mp4" | "webm" | "gif" | "png-sequence";
  width: number;
  height: number;
  frameRate: number;
  quality: "draft" | "standard" | "high" | "maximum";
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  outputUrl?: string;
  error?: string;
};

export type StudioProject = {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  durationMs: number;
  frameRate: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: Record<string, unknown>;
};

export type StudioSnapshot = {
  project: StudioProject;
  timeline: StudioTimeline;
  assets: StudioAsset[];
  selection: StudioSelection;
  guides: StudioGuide[];
  preferences: StudioPreferences;
  panels: StudioPanelState;
  renderQueue: StudioRenderJob[];
  activeTool: StudioTool;
};

export type StudioHistoryEntry = {
  id: string;
  label: string;
  timestamp: number;
  before: StudioSnapshot;
  after: StudioSnapshot;
  source?: string;
};

export type StudioClipboard = {
  clips: StudioClip[];
  copiedAt: number | null;
};

export type StudioEvent =
  | {
      type: "project:changed";
      project: StudioProject;
    }
  | {
      type: "timeline:changed";
      timeline: StudioTimeline;
    }
  | {
      type: "selection:changed";
      selection: StudioSelection;
    }
  | {
      type: "asset:added";
      asset: StudioAsset;
    }
  | {
      type: "asset:removed";
      assetId: string;
    }
  | {
      type: "clip:added";
      clip: StudioClip;
    }
  | {
      type: "clip:removed";
      clipId: string;
    }
  | {
      type: "playback:changed";
      playback: StudioPlaybackState;
    }
  | {
      type: "history:changed";
      canUndo: boolean;
      canRedo: boolean;
    }
  | {
      type: "autosave:started";
    }
  | {
      type: "autosave:completed";
      savedAt: number;
    }
  | {
      type: "autosave:failed";
      error: unknown;
    };

export type StudioCommandContext = {
  state: StudioState;
  actions: StudioActions;
};

export type StudioCommand = {
  id: string;
  label: string;
  shortcut?: string;
  enabled?: (context: StudioCommandContext) => boolean;
  execute: (context: StudioCommandContext) => void | Promise<void>;
};

export type StudioPlugin = {
  id: string;
  name: string;
  version?: string;
  setup?: (context: StudioPluginContext) => void | (() => void);
};

export type StudioPluginContext = {
  getState: () => StudioState;
  actions: StudioActions;
  registerCommand: (command: StudioCommand) => () => void;
  subscribe: (listener: StudioEventListener) => () => void;
  emit: (event: StudioEvent) => void;
};

export type StudioState = StudioSnapshot & {
  playback: StudioPlaybackState;
  clipboard: StudioClipboard;
  history: {
    undoStack: StudioHistoryEntry[];
    redoStack: StudioHistoryEntry[];
    limit: number;
  };
  dirty: boolean;
  saving: boolean;
  lastSavedAt: number | null;
  error: string | null;
};

export type StudioEventListener = (event: StudioEvent) => void;

export type StudioProviderProps = {
  children: ReactNode;
  initialProject?: Partial<StudioProject>;
  initialTimeline?: Partial<StudioTimeline>;
  initialAssets?: StudioAsset[];
  initialPreferences?: Partial<StudioPreferences>;
  initialPanels?: Partial<StudioPanelState>;
  historyLimit?: number;
  onAutosave?: (snapshot: StudioSnapshot) => Promise<void> | void;
  onStateChange?: (state: StudioState) => void;
  plugins?: StudioPlugin[];
};

export type StudioActions = {
  setProject: (project: StudioProject, historyLabel?: string) => void;
  updateProject: (
    patch: Partial<StudioProject>,
    historyLabel?: string,
  ) => void;

  setTimeline: (timeline: StudioTimeline, historyLabel?: string) => void;
  updateTimeline: (
    patch: Partial<StudioTimeline>,
    historyLabel?: string,
  ) => void;
  setPlayhead: (timeMs: number) => void;
  setTimelineZoom: (zoom: number) => void;
  setTimelineScroll: (scrollLeft: number) => void;
  setSnapping: (enabled: boolean) => void;

  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  seek: (timeMs: number) => void;
  setPlaybackRate: (rate: number) => void;
  setPlaybackVolume: (volume: number) => void;
  setPlaybackMuted: (muted: boolean) => void;
  setLooping: (looping: boolean) => void;

  addTrack: (track: StudioTrack, historyLabel?: string) => void;
  updateTrack: (
    trackId: string,
    patch: Partial<StudioTrack>,
    historyLabel?: string,
  ) => void;
  removeTrack: (trackId: string, historyLabel?: string) => void;
  reorderTracks: (trackIds: string[], historyLabel?: string) => void;

  addClip: (
    trackId: string,
    clip: StudioClip,
    historyLabel?: string,
  ) => void;
  updateClip: (
    clipId: string,
    patch: Partial<StudioClip>,
    historyLabel?: string,
  ) => void;
  removeClip: (clipId: string, historyLabel?: string) => void;
  moveClip: (
    clipId: string,
    targetTrackId: string,
    startMs: number,
    historyLabel?: string,
  ) => void;
  duplicateClip: (
    clipId: string,
    offsetMs?: number,
    historyLabel?: string,
  ) => StudioClip | null;
  splitClip: (
    clipId: string,
    atMs: number,
    historyLabel?: string,
  ) => [StudioClip, StudioClip] | null;

  addAsset: (asset: StudioAsset, historyLabel?: string) => void;
  updateAsset: (
    assetId: string,
    patch: Partial<StudioAsset>,
    historyLabel?: string,
  ) => void;
  removeAsset: (assetId: string, historyLabel?: string) => void;

  setSelection: (selection: StudioSelection) => void;
  selectClip: (clipId: string, additive?: boolean) => void;
  selectAsset: (assetId: string, additive?: boolean) => void;
  selectKeyframe: (keyframeId: string, additive?: boolean) => void;
  clearSelection: () => void;

  addKeyframe: (
    clipId: string,
    keyframe: StudioKeyframe,
    historyLabel?: string,
  ) => void;
  updateKeyframe: (
    keyframeId: string,
    patch: Partial<StudioKeyframe>,
    historyLabel?: string,
  ) => void;
  removeKeyframe: (
    keyframeId: string,
    historyLabel?: string,
  ) => void;

  copySelection: () => void;
  cutSelection: () => void;
  pasteClipboard: (atMs?: number) => void;
  deleteSelection: () => void;

  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  commitHistory: (
    label: string,
    before: StudioSnapshot,
    after: StudioSnapshot,
    source?: string,
  ) => void;

  setActiveTool: (tool: StudioTool) => void;
  setPanelVisible: (panel: StudioPanelId, visible: boolean) => void;
  setActivePanel: (panel: StudioPanelId) => void;
  updatePanels: (patch: Partial<StudioPanelState>) => void;
  updatePreferences: (patch: Partial<StudioPreferences>) => void;

  addGuide: (guide: StudioGuide, historyLabel?: string) => void;
  updateGuide: (
    guideId: string,
    patch: Partial<StudioGuide>,
    historyLabel?: string,
  ) => void;
  removeGuide: (guideId: string, historyLabel?: string) => void;

  enqueueRender: (job: StudioRenderJob) => void;
  updateRenderJob: (
    jobId: string,
    patch: Partial<StudioRenderJob>,
  ) => void;
  removeRenderJob: (jobId: string) => void;

  registerCommand: (command: StudioCommand) => () => void;
  executeCommand: (commandId: string) => Promise<void>;
  subscribe: (listener: StudioEventListener) => () => void;
  emit: (event: StudioEvent) => void;

  saveNow: () => Promise<void>;
  markSaved: () => void;
  setError: (error: string | null) => void;
  resetStudio: (snapshot?: Partial<StudioSnapshot>) => void;
};

export type StudioContextValue = {
  state: StudioState;
  actions: StudioActions;
  refs: {
    stateRef: MutableRefObject<StudioState>;
    commandRegistryRef: MutableRefObject<Map<string, StudioCommand>>;
  };
};

type InternalAction =
  | {
      type: "replace-state";
      state: StudioState;
    }
  | {
      type: "set-state";
      updater: (state: StudioState) => StudioState;
    };

const DEFAULT_SELECTION: StudioSelection = {
  clipIds: [],
  trackIds: [],
  assetIds: [],
  keyframeIds: [],
  primaryClipId: null,
  primaryAssetId: null,
  primaryKeyframeId: null,
};

const DEFAULT_PREFERENCES: StudioPreferences = {
  autosaveEnabled: true,
  autosaveDelayMs: 1_500,
  showGrid: false,
  showGuides: true,
  showSafeArea: false,
  reducedMotion: false,
  defaultClipDurationMs: 5_000,
  defaultTransitionDurationMs: 400,
  timelineFollowPlayhead: true,
  confirmDestructiveActions: true,
};

const DEFAULT_PANELS: StudioPanelState = {
  visible: {
    assets: true,
    timeline: true,
    inspector: true,
    history: false,
    renderQueue: false,
    keyframes: false,
    curves: false,
    voiceOver: false,
    recording: false,
  },
  activePanel: "assets",
  inspectorWidth: 360,
  assetPanelWidth: 320,
  timelineHeight: 300,
};

const DEFAULT_PLAYBACK: StudioPlaybackState = {
  isPlaying: false,
  isLooping: false,
  rate: 1,
  volume: 1,
  muted: false,
  frameRate: 30,
};

const DEFAULT_CLIP_TRANSFORM: StudioClipTransform = {
  x: 0,
  y: 0,
  width: 640,
  height: 360,
  rotation: 0,
  opacity: 1,
  scaleX: 1,
  scaleY: 1,
  anchorX: 0.5,
  anchorY: 0.5,
};

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function createProject(
  input: Partial<StudioProject> = {},
): StudioProject {
  const createdAt = input.createdAt ?? nowIso();

  return {
    id: input.id ?? createId("studio_project"),
    name: input.name ?? "Untitled Beacon Studio project",
    width: input.width ?? 1920,
    height: input.height ?? 1080,
    backgroundColor: input.backgroundColor ?? "#020617",
    durationMs: input.durationMs ?? 30_000,
    frameRate: input.frameRate ?? 30,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    version: input.version ?? 1,
    metadata: input.metadata ?? {},
  };
}

function createTimeline(
  input: Partial<StudioTimeline> = {},
  project?: StudioProject,
): StudioTimeline {
  return {
    durationMs: input.durationMs ?? project?.durationMs ?? 30_000,
    playheadMs: input.playheadMs ?? 0,
    zoom: input.zoom ?? 1,
    scrollLeft: input.scrollLeft ?? 0,
    snappingEnabled: input.snappingEnabled ?? true,
    snapThresholdPx: input.snapThresholdPx ?? 8,
    tracks: input.tracks ?? [],
    inPointMs: input.inPointMs,
    outPointMs: input.outPointMs,
  };
}

function createInitialState(
  props: Pick<
    StudioProviderProps,
    | "initialProject"
    | "initialTimeline"
    | "initialAssets"
    | "initialPreferences"
    | "initialPanels"
    | "historyLimit"
  >,
): StudioState {
  const project = createProject(props.initialProject);
  const preferences = {
    ...DEFAULT_PREFERENCES,
    ...props.initialPreferences,
  };

  const panels: StudioPanelState = {
    ...DEFAULT_PANELS,
    ...props.initialPanels,
    visible: {
      ...DEFAULT_PANELS.visible,
      ...(props.initialPanels?.visible ?? {}),
    },
  };

  return {
    project,
    timeline: createTimeline(props.initialTimeline, project),
    assets: props.initialAssets ?? [],
    selection: cloneValue(DEFAULT_SELECTION),
    guides: [],
    preferences,
    panels,
    renderQueue: [],
    activeTool: "select",
    playback: {
      ...DEFAULT_PLAYBACK,
      frameRate: project.frameRate,
    },
    clipboard: {
      clips: [],
      copiedAt: null,
    },
    history: {
      undoStack: [],
      redoStack: [],
      limit: Math.max(1, props.historyLimit ?? 100),
    },
    dirty: false,
    saving: false,
    lastSavedAt: null,
    error: null,
  };
}

function snapshotFromState(state: StudioState): StudioSnapshot {
  return cloneValue({
    project: state.project,
    timeline: state.timeline,
    assets: state.assets,
    selection: state.selection,
    guides: state.guides,
    preferences: state.preferences,
    panels: state.panels,
    renderQueue: state.renderQueue,
    activeTool: state.activeTool,
  });
}

function stateFromSnapshot(
  current: StudioState,
  snapshot: StudioSnapshot,
): StudioState {
  return {
    ...current,
    ...cloneValue(snapshot),
    playback: {
      ...current.playback,
      isPlaying: false,
      frameRate: snapshot.project.frameRate,
    },
    dirty: true,
    error: null,
  };
}

function normaliseClip(clip: StudioClip): StudioClip {
  return {
    ...clip,
    startMs: Math.max(0, clip.startMs),
    durationMs: Math.max(1, clip.durationMs),
    trimStartMs: Math.max(0, clip.trimStartMs),
    trimEndMs: Math.max(0, clip.trimEndMs),
    playbackRate: clamp(clip.playbackRate || 1, 0.05, 16),
    transform: {
      ...DEFAULT_CLIP_TRANSFORM,
      ...clip.transform,
    },
    keyframes: clip.keyframes ?? [],
  };
}

function recalculateTimelineDuration(
  timeline: StudioTimeline,
  projectDurationMs: number,
): number {
  let maximum = projectDurationMs;

  for (const track of timeline.tracks) {
    for (const clip of track.clips) {
      maximum = Math.max(maximum, clip.startMs + clip.durationMs);
    }
  }

  return maximum;
}

function findClip(
  timeline: StudioTimeline,
  clipId: string,
): {
  track: StudioTrack;
  clip: StudioClip;
  trackIndex: number;
  clipIndex: number;
} | null {
  for (let trackIndex = 0; trackIndex < timeline.tracks.length; trackIndex += 1) {
    const track = timeline.tracks[trackIndex];
    const clipIndex = track.clips.findIndex((clip) => clip.id === clipId);

    if (clipIndex >= 0) {
      return {
        track,
        clip: track.clips[clipIndex],
        trackIndex,
        clipIndex,
      };
    }
  }

  return null;
}

function findKeyframe(
  timeline: StudioTimeline,
  keyframeId: string,
): {
  clip: StudioClip;
  keyframe: StudioKeyframe;
  trackIndex: number;
  clipIndex: number;
  keyframeIndex: number;
} | null {
  for (let trackIndex = 0; trackIndex < timeline.tracks.length; trackIndex += 1) {
    const track = timeline.tracks[trackIndex];

    for (let clipIndex = 0; clipIndex < track.clips.length; clipIndex += 1) {
      const clip = track.clips[clipIndex];
      const keyframes = clip.keyframes ?? [];
      const keyframeIndex = keyframes.findIndex(
        (keyframe) => keyframe.id === keyframeId,
      );

      if (keyframeIndex >= 0) {
        return {
          clip,
          keyframe: keyframes[keyframeIndex],
          trackIndex,
          clipIndex,
          keyframeIndex,
        };
      }
    }
  }

  return null;
}

function removeClipIdsFromSelection(
  selection: StudioSelection,
  removedClipIds: Set<string>,
): StudioSelection {
  const clipIds = selection.clipIds.filter(
    (clipId) => !removedClipIds.has(clipId),
  );

  return {
    ...selection,
    clipIds,
    primaryClipId:
      selection.primaryClipId &&
      removedClipIds.has(selection.primaryClipId)
        ? clipIds[0] ?? null
        : selection.primaryClipId,
  };
}

function reducer(
  state: StudioState,
  action: InternalAction,
): StudioState {
  if (action.type === "replace-state") {
    return action.state;
  }

  return action.updater(state);
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({
  children,
  initialProject,
  initialTimeline,
  initialAssets,
  initialPreferences,
  initialPanels,
  historyLimit = 100,
  onAutosave,
  onStateChange,
  plugins = [],
}: StudioProviderProps) {
  const [state, dispatch] = useReducer(
    reducer,
    {
      initialProject,
      initialTimeline,
      initialAssets,
      initialPreferences,
      initialPanels,
      historyLimit,
    },
    createInitialState,
  );

  const stateRef = useRef(state);
  const eventListenersRef = useRef(new Set<StudioEventListener>());
  const commandRegistryRef = useRef(new Map<string, StudioCommand>());
  const autosaveTimerRef = useRef<number | null>(null);
  const playbackFrameRef = useRef<number | null>(null);
  const playbackLastTimeRef = useRef<number | null>(null);
  const pluginCleanupsRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    stateRef.current = state;
    onStateChange?.(state);
  }, [onStateChange, state]);

  const emit = useCallback((event: StudioEvent) => {
    eventListenersRef.current.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Beacon Studio event listener failed:", error);
      }
    });
  }, []);

  const subscribe = useCallback((listener: StudioEventListener) => {
    eventListenersRef.current.add(listener);

    return () => {
      eventListenersRef.current.delete(listener);
    };
  }, []);

  const applyMutation = useCallback(
    (
      label: string | undefined,
      mutator: (current: StudioState) => StudioState,
      source?: string,
    ) => {
      dispatch({
        type: "set-state",
        updater: (current) => {
          const before = snapshotFromState(current);
          let next = mutator(current);

          if (next === current) return current;

          next = {
            ...next,
            dirty: true,
            error: null,
          };

          if (!label) return next;

          const after = snapshotFromState(next);
          const entry: StudioHistoryEntry = {
            id: createId("history"),
            label,
            timestamp: Date.now(),
            before,
            after,
            source,
          };

          const undoStack = [...current.history.undoStack, entry].slice(
            -current.history.limit,
          );

          return {
            ...next,
            history: {
              ...current.history,
              undoStack,
              redoStack: [],
            },
          };
        },
      });
    },
    [],
  );

  const commitHistory = useCallback(
    (
      label: string,
      before: StudioSnapshot,
      after: StudioSnapshot,
      source?: string,
    ) => {
      dispatch({
        type: "set-state",
        updater: (current) => {
          const entry: StudioHistoryEntry = {
            id: createId("history"),
            label,
            timestamp: Date.now(),
            before: cloneValue(before),
            after: cloneValue(after),
            source,
          };

          return {
            ...stateFromSnapshot(current, after),
            history: {
              ...current.history,
              undoStack: [...current.history.undoStack, entry].slice(
                -current.history.limit,
              ),
              redoStack: [],
            },
          };
        },
      });
    },
    [],
  );

  const setProject = useCallback(
    (project: StudioProject, historyLabel = "Replace project") => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        project: {
          ...project,
          updatedAt: nowIso(),
        },
        playback: {
          ...current.playback,
          frameRate: project.frameRate,
        },
      }));

      emit({
        type: "project:changed",
        project,
      });
    },
    [applyMutation, emit],
  );

  const updateProject = useCallback(
    (patch: Partial<StudioProject>, historyLabel = "Update project") => {
      applyMutation(historyLabel, (current) => {
        const project = {
          ...current.project,
          ...patch,
          updatedAt: nowIso(),
          version: current.project.version + 1,
        };

        return {
          ...current,
          project,
          timeline: {
            ...current.timeline,
            durationMs:
              patch.durationMs ?? current.timeline.durationMs,
          },
          playback: {
            ...current.playback,
            frameRate: patch.frameRate ?? current.playback.frameRate,
          },
        };
      });
    },
    [applyMutation],
  );

  const setTimeline = useCallback(
    (timeline: StudioTimeline, historyLabel = "Replace timeline") => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        timeline: cloneValue(timeline),
      }));

      emit({
        type: "timeline:changed",
        timeline,
      });
    },
    [applyMutation, emit],
  );

  const updateTimeline = useCallback(
    (
      patch: Partial<StudioTimeline>,
      historyLabel = "Update timeline",
    ) => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        timeline: {
          ...current.timeline,
          ...patch,
        },
      }));
    },
    [applyMutation],
  );

  const setPlayhead = useCallback((timeMs: number) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        timeline: {
          ...current.timeline,
          playheadMs: clamp(
            timeMs,
            0,
            current.timeline.durationMs,
          ),
        },
      }),
    });
  }, []);

  const setTimelineZoom = useCallback((zoom: number) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        timeline: {
          ...current.timeline,
          zoom: clamp(zoom, 0.05, 100),
        },
      }),
    });
  }, []);

  const setTimelineScroll = useCallback((scrollLeft: number) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        timeline: {
          ...current.timeline,
          scrollLeft: Math.max(0, scrollLeft),
        },
      }),
    });
  }, []);

  const setSnapping = useCallback((enabled: boolean) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        timeline: {
          ...current.timeline,
          snappingEnabled: enabled,
        },
      }),
    });
  }, []);

  const play = useCallback(() => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        playback: {
          ...current.playback,
          isPlaying: true,
        },
      }),
    });
  }, []);

  const pause = useCallback(() => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        playback: {
          ...current.playback,
          isPlaying: false,
        },
      }),
    });
  }, []);

  const togglePlayback = useCallback(() => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        playback: {
          ...current.playback,
          isPlaying: !current.playback.isPlaying,
        },
      }),
    });
  }, []);

  const seek = useCallback(
    (timeMs: number) => {
      setPlayhead(timeMs);
    },
    [setPlayhead],
  );

  const setPlaybackRate = useCallback((rate: number) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        playback: {
          ...current.playback,
          rate: clamp(rate, 0.05, 16),
        },
      }),
    });
  }, []);

  const setPlaybackVolume = useCallback((volume: number) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        playback: {
          ...current.playback,
          volume: clamp(volume, 0, 1),
        },
      }),
    });
  }, []);

  const setPlaybackMuted = useCallback((muted: boolean) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        playback: {
          ...current.playback,
          muted,
        },
      }),
    });
  }, []);

  const setLooping = useCallback((looping: boolean) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        playback: {
          ...current.playback,
          isLooping: looping,
        },
      }),
    });
  }, []);

  const addTrack = useCallback(
    (track: StudioTrack, historyLabel = "Add track") => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        timeline: {
          ...current.timeline,
          tracks: [
            ...current.timeline.tracks,
            {
              ...track,
              clips: track.clips.map(normaliseClip),
            },
          ],
        },
      }));
    },
    [applyMutation],
  );

  const updateTrack = useCallback(
    (
      trackId: string,
      patch: Partial<StudioTrack>,
      historyLabel = "Update track",
    ) => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        timeline: {
          ...current.timeline,
          tracks: current.timeline.tracks.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  ...patch,
                  clips: patch.clips
                    ? patch.clips.map(normaliseClip)
                    : track.clips,
                }
              : track,
          ),
        },
      }));
    },
    [applyMutation],
  );

  const removeTrack = useCallback(
    (trackId: string, historyLabel = "Remove track") => {
      applyMutation(historyLabel, (current) => {
        const track = current.timeline.tracks.find(
          (item) => item.id === trackId,
        );

        if (!track) return current;

        const removedClipIds = new Set(
          track.clips.map((clip) => clip.id),
        );

        return {
          ...current,
          timeline: {
            ...current.timeline,
            tracks: current.timeline.tracks.filter(
              (item) => item.id !== trackId,
            ),
          },
          selection: {
            ...removeClipIdsFromSelection(
              current.selection,
              removedClipIds,
            ),
            trackIds: current.selection.trackIds.filter(
              (id) => id !== trackId,
            ),
          },
        };
      });
    },
    [applyMutation],
  );

  const reorderTracks = useCallback(
    (
      trackIds: string[],
      historyLabel = "Reorder tracks",
    ) => {
      applyMutation(historyLabel, (current) => {
        const map = new Map(
          current.timeline.tracks.map((track) => [track.id, track]),
        );

        const ordered = trackIds
          .map((id) => map.get(id))
          .filter((track): track is StudioTrack => Boolean(track));

        const remaining = current.timeline.tracks.filter(
          (track) => !trackIds.includes(track.id),
        );

        return {
          ...current,
          timeline: {
            ...current.timeline,
            tracks: [...ordered, ...remaining].map((track, index) => ({
              ...track,
              order: index,
            })),
          },
        };
      });
    },
    [applyMutation],
  );

  const addClip = useCallback(
    (
      trackId: string,
      clip: StudioClip,
      historyLabel = "Add clip",
    ) => {
      const nextClip = normaliseClip({
        ...clip,
        trackId,
      });

      applyMutation(historyLabel, (current) => {
        const hasTrack = current.timeline.tracks.some(
          (track) => track.id === trackId,
        );

        if (!hasTrack) return current;

        const tracks = current.timeline.tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                clips: [...track.clips, nextClip].sort(
                  (a, b) => a.startMs - b.startMs,
                ),
              }
            : track,
        );

        const timeline = {
          ...current.timeline,
          tracks,
        };

        timeline.durationMs = recalculateTimelineDuration(
          timeline,
          current.project.durationMs,
        );

        return {
          ...current,
          timeline,
        };
      });

      emit({
        type: "clip:added",
        clip: nextClip,
      });
    },
    [applyMutation, emit],
  );

  const updateClip = useCallback(
    (
      clipId: string,
      patch: Partial<StudioClip>,
      historyLabel = "Update clip",
    ) => {
      applyMutation(historyLabel, (current) => {
        const found = findClip(current.timeline, clipId);
        if (!found) return current;

        const tracks = current.timeline.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) =>
            clip.id === clipId
              ? normaliseClip({
                  ...clip,
                  ...patch,
                  transform: {
                    ...clip.transform,
                    ...(patch.transform ?? {}),
                  },
                  audio:
                    clip.audio || patch.audio
                      ? {
                          muted: false,
                          volume: 1,
                          pan: 0,
                          fadeInMs: 0,
                          fadeOutMs: 0,
                          ...(clip.audio ?? {}),
                          ...(patch.audio ?? {}),
                        }
                      : undefined,
                  style: {
                    ...(clip.style ?? {}),
                    ...(patch.style ?? {}),
                  },
                })
              : clip,
          ),
        }));

        const timeline = {
          ...current.timeline,
          tracks,
        };

        timeline.durationMs = recalculateTimelineDuration(
          timeline,
          current.project.durationMs,
        );

        return {
          ...current,
          timeline,
        };
      });
    },
    [applyMutation],
  );

  const removeClip = useCallback(
    (
      clipId: string,
      historyLabel = "Remove clip",
    ) => {
      applyMutation(historyLabel, (current) => {
        if (!findClip(current.timeline, clipId)) return current;

        const tracks = current.timeline.tracks.map((track) => ({
          ...track,
          clips: track.clips.filter((clip) => clip.id !== clipId),
        }));

        const timeline = {
          ...current.timeline,
          tracks,
        };

        timeline.durationMs = recalculateTimelineDuration(
          timeline,
          current.project.durationMs,
        );

        return {
          ...current,
          timeline,
          selection: removeClipIdsFromSelection(
            current.selection,
            new Set([clipId]),
          ),
        };
      });

      emit({
        type: "clip:removed",
        clipId,
      });
    },
    [applyMutation, emit],
  );

  const moveClip = useCallback(
    (
      clipId: string,
      targetTrackId: string,
      startMs: number,
      historyLabel = "Move clip",
    ) => {
      applyMutation(historyLabel, (current) => {
        const found = findClip(current.timeline, clipId);
        const targetTrack = current.timeline.tracks.find(
          (track) => track.id === targetTrackId,
        );

        if (!found || !targetTrack || targetTrack.locked) {
          return current;
        }

        const movedClip = {
          ...found.clip,
          trackId: targetTrackId,
          startMs: Math.max(0, startMs),
        };

        const tracks = current.timeline.tracks.map((track) => {
          const clipsWithoutMoved = track.clips.filter(
            (clip) => clip.id !== clipId,
          );

          if (track.id === targetTrackId) {
            return {
              ...track,
              clips: [...clipsWithoutMoved, movedClip].sort(
                (a, b) => a.startMs - b.startMs,
              ),
            };
          }

          return {
            ...track,
            clips: clipsWithoutMoved,
          };
        });

        const timeline = {
          ...current.timeline,
          tracks,
        };

        timeline.durationMs = recalculateTimelineDuration(
          timeline,
          current.project.durationMs,
        );

        return {
          ...current,
          timeline,
        };
      });
    },
    [applyMutation],
  );

  const duplicateClip = useCallback(
    (
      clipId: string,
      offsetMs = 250,
      historyLabel = "Duplicate clip",
    ): StudioClip | null => {
      const current = stateRef.current;
      const found = findClip(current.timeline, clipId);

      if (!found) return null;

      const duplicate: StudioClip = {
        ...cloneValue(found.clip),
        id: createId("clip"),
        name: `${found.clip.name} copy`,
        startMs: found.clip.startMs + Math.max(0, offsetMs),
        keyframes: (found.clip.keyframes ?? []).map((keyframe) => ({
          ...keyframe,
          id: createId("keyframe"),
          clipId: "",
        })),
      };

      duplicate.keyframes = duplicate.keyframes?.map((keyframe) => ({
        ...keyframe,
        clipId: duplicate.id,
      }));

      addClip(found.track.id, duplicate, historyLabel);
      return duplicate;
    },
    [addClip],
  );

  const splitClip = useCallback(
    (
      clipId: string,
      atMs: number,
      historyLabel = "Split clip",
    ): [StudioClip, StudioClip] | null => {
      const current = stateRef.current;
      const found = findClip(current.timeline, clipId);

      if (!found) return null;

      const relative = atMs - found.clip.startMs;
      if (relative <= 0 || relative >= found.clip.durationMs) {
        return null;
      }

      const left: StudioClip = {
        ...cloneValue(found.clip),
        id: createId("clip"),
        durationMs: relative,
        trimEndMs:
          found.clip.trimEndMs +
          (found.clip.durationMs - relative),
      };

      const right: StudioClip = {
        ...cloneValue(found.clip),
        id: createId("clip"),
        startMs: atMs,
        durationMs: found.clip.durationMs - relative,
        trimStartMs: found.clip.trimStartMs + relative,
      };

      left.keyframes = (left.keyframes ?? [])
        .filter((keyframe) => keyframe.timeMs <= relative)
        .map((keyframe) => ({
          ...keyframe,
          id: createId("keyframe"),
          clipId: left.id,
        }));

      right.keyframes = (right.keyframes ?? [])
        .filter((keyframe) => keyframe.timeMs >= relative)
        .map((keyframe) => ({
          ...keyframe,
          id: createId("keyframe"),
          clipId: right.id,
          timeMs: keyframe.timeMs - relative,
        }));

      applyMutation(historyLabel, (state) => ({
        ...state,
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map((track) =>
            track.id === found.track.id
              ? {
                  ...track,
                  clips: track.clips
                    .filter((clip) => clip.id !== clipId)
                    .concat(left, right)
                    .sort((a, b) => a.startMs - b.startMs),
                }
              : track,
          ),
        },
        selection: {
          ...state.selection,
          clipIds: [left.id, right.id],
          primaryClipId: right.id,
        },
      }));

      return [left, right];
    },
    [applyMutation],
  );

  const addAsset = useCallback(
    (
      asset: StudioAsset,
      historyLabel = "Add asset",
    ) => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        assets: [...current.assets, asset],
      }));

      emit({
        type: "asset:added",
        asset,
      });
    },
    [applyMutation, emit],
  );

  const updateAsset = useCallback(
    (
      assetId: string,
      patch: Partial<StudioAsset>,
      historyLabel = "Update asset",
    ) => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        assets: current.assets.map((asset) =>
          asset.id === assetId
            ? {
                ...asset,
                ...patch,
                updatedAt: nowIso(),
              }
            : asset,
        ),
      }));
    },
    [applyMutation],
  );

  const removeAsset = useCallback(
    (
      assetId: string,
      historyLabel = "Remove asset",
    ) => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        assets: current.assets.filter(
          (asset) => asset.id !== assetId,
        ),
        selection: {
          ...current.selection,
          assetIds: current.selection.assetIds.filter(
            (id) => id !== assetId,
          ),
          primaryAssetId:
            current.selection.primaryAssetId === assetId
              ? null
              : current.selection.primaryAssetId,
        },
      }));

      emit({
        type: "asset:removed",
        assetId,
      });
    },
    [applyMutation, emit],
  );

  const setSelection = useCallback(
    (selection: StudioSelection) => {
      dispatch({
        type: "set-state",
        updater: (current) => ({
          ...current,
          selection,
        }),
      });

      emit({
        type: "selection:changed",
        selection,
      });
    },
    [emit],
  );

  const selectClip = useCallback(
    (clipId: string, additive = false) => {
      const current = stateRef.current.selection;
      const clipIds = additive
        ? current.clipIds.includes(clipId)
          ? current.clipIds.filter((id) => id !== clipId)
          : [...current.clipIds, clipId]
        : [clipId];

      setSelection({
        ...current,
        clipIds,
        primaryClipId: clipIds.includes(clipId)
          ? clipId
          : clipIds[0] ?? null,
      });
    },
    [setSelection],
  );

  const selectAsset = useCallback(
    (assetId: string, additive = false) => {
      const current = stateRef.current.selection;
      const assetIds = additive
        ? current.assetIds.includes(assetId)
          ? current.assetIds.filter((id) => id !== assetId)
          : [...current.assetIds, assetId]
        : [assetId];

      setSelection({
        ...current,
        assetIds,
        primaryAssetId: assetIds.includes(assetId)
          ? assetId
          : assetIds[0] ?? null,
      });
    },
    [setSelection],
  );

  const selectKeyframe = useCallback(
    (keyframeId: string, additive = false) => {
      const current = stateRef.current.selection;
      const keyframeIds = additive
        ? current.keyframeIds.includes(keyframeId)
          ? current.keyframeIds.filter((id) => id !== keyframeId)
          : [...current.keyframeIds, keyframeId]
        : [keyframeId];

      setSelection({
        ...current,
        keyframeIds,
        primaryKeyframeId: keyframeIds.includes(keyframeId)
          ? keyframeId
          : keyframeIds[0] ?? null,
      });
    },
    [setSelection],
  );

  const clearSelection = useCallback(() => {
    setSelection(cloneValue(DEFAULT_SELECTION));
  }, [setSelection]);

  const addKeyframe = useCallback(
    (
      clipId: string,
      keyframe: StudioKeyframe,
      historyLabel = "Add keyframe",
    ) => {
      applyMutation(historyLabel, (current) => {
        const found = findClip(current.timeline, clipId);
        if (!found) return current;

        return {
          ...current,
          timeline: {
            ...current.timeline,
            tracks: current.timeline.tracks.map((track) => ({
              ...track,
              clips: track.clips.map((clip) =>
                clip.id === clipId
                  ? {
                      ...clip,
                      keyframes: [
                        ...(clip.keyframes ?? []),
                        {
                          ...keyframe,
                          clipId,
                        },
                      ].sort((a, b) => a.timeMs - b.timeMs),
                    }
                  : clip,
              ),
            })),
          },
        };
      });
    },
    [applyMutation],
  );

  const updateKeyframe = useCallback(
    (
      keyframeId: string,
      patch: Partial<StudioKeyframe>,
      historyLabel = "Update keyframe",
    ) => {
      applyMutation(historyLabel, (current) => {
        const found = findKeyframe(current.timeline, keyframeId);
        if (!found) return current;

        return {
          ...current,
          timeline: {
            ...current.timeline,
            tracks: current.timeline.tracks.map((track) => ({
              ...track,
              clips: track.clips.map((clip) => ({
                ...clip,
                keyframes: (clip.keyframes ?? [])
                  .map((keyframe) =>
                    keyframe.id === keyframeId
                      ? {
                          ...keyframe,
                          ...patch,
                          id: keyframe.id,
                          clipId: keyframe.clipId,
                        }
                      : keyframe,
                  )
                  .sort((a, b) => a.timeMs - b.timeMs),
              })),
            })),
          },
        };
      });
    },
    [applyMutation],
  );

  const removeKeyframe = useCallback(
    (
      keyframeId: string,
      historyLabel = "Remove keyframe",
    ) => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        timeline: {
          ...current.timeline,
          tracks: current.timeline.tracks.map((track) => ({
            ...track,
            clips: track.clips.map((clip) => ({
              ...clip,
              keyframes: (clip.keyframes ?? []).filter(
                (keyframe) => keyframe.id !== keyframeId,
              ),
            })),
          })),
        },
        selection: {
          ...current.selection,
          keyframeIds: current.selection.keyframeIds.filter(
            (id) => id !== keyframeId,
          ),
          primaryKeyframeId:
            current.selection.primaryKeyframeId === keyframeId
              ? null
              : current.selection.primaryKeyframeId,
        },
      }));
    },
    [applyMutation],
  );

  const copySelection = useCallback(() => {
    const current = stateRef.current;
    const selected = new Set(current.selection.clipIds);
    const clips = current.timeline.tracks.flatMap((track) =>
      track.clips
        .filter((clip) => selected.has(clip.id))
        .map((clip) => cloneValue(clip)),
    );

    dispatch({
      type: "set-state",
      updater: (state) => ({
        ...state,
        clipboard: {
          clips,
          copiedAt: Date.now(),
        },
      }),
    });
  }, []);

  const cutSelection = useCallback(() => {
    const current = stateRef.current;
    const selected = new Set(current.selection.clipIds);
    const clips = current.timeline.tracks.flatMap((track) =>
      track.clips
        .filter((clip) => selected.has(clip.id))
        .map((clip) => cloneValue(clip)),
    );

    if (!clips.length) return;

    applyMutation("Cut clips", (state) => ({
      ...state,
      timeline: {
        ...state.timeline,
        tracks: state.timeline.tracks.map((track) => ({
          ...track,
          clips: track.clips.filter(
            (clip) => !selected.has(clip.id),
          ),
        })),
      },
      clipboard: {
        clips,
        copiedAt: Date.now(),
      },
      selection: cloneValue(DEFAULT_SELECTION),
    }));
  }, [applyMutation]);

  const pasteClipboard = useCallback(
    (atMs?: number) => {
      const current = stateRef.current;
      if (!current.clipboard.clips.length) return;

      const earliestStart = Math.min(
        ...current.clipboard.clips.map((clip) => clip.startMs),
      );
      const targetStart = atMs ?? current.timeline.playheadMs;
      const idMap = new Map<string, string>();

      const pasted = current.clipboard.clips.map((clip) => {
        const id = createId("clip");
        idMap.set(clip.id, id);

        return {
          ...cloneValue(clip),
          id,
          startMs: targetStart + (clip.startMs - earliestStart),
          keyframes: (clip.keyframes ?? []).map((keyframe) => ({
            ...keyframe,
            id: createId("keyframe"),
            clipId: id,
          })),
        };
      });

      applyMutation("Paste clips", (state) => {
        const trackMap = new Map(
          state.timeline.tracks.map((track) => [
            track.id,
            {
              ...track,
              clips: [...track.clips],
            },
          ]),
        );

        for (const clip of pasted) {
          const targetTrack =
            trackMap.get(clip.trackId) ??
            state.timeline.tracks[0];

          if (!targetTrack) continue;

          const track = trackMap.get(targetTrack.id);
          if (!track) continue;

          track.clips.push({
            ...clip,
            trackId: targetTrack.id,
          });
        }

        const tracks = state.timeline.tracks.map((track) => {
          const next = trackMap.get(track.id) ?? track;

          return {
            ...next,
            clips: [...next.clips].sort(
              (a, b) => a.startMs - b.startMs,
            ),
          };
        });

        const timeline = {
          ...state.timeline,
          tracks,
        };

        timeline.durationMs = recalculateTimelineDuration(
          timeline,
          state.project.durationMs,
        );

        return {
          ...state,
          timeline,
          selection: {
            ...state.selection,
            clipIds: pasted.map((clip) => clip.id),
            primaryClipId: pasted[0]?.id ?? null,
          },
        };
      });
    },
    [applyMutation],
  );

  const deleteSelection = useCallback(() => {
    const current = stateRef.current;
    const selected = new Set(current.selection.clipIds);
    if (!selected.size) return;

    applyMutation("Delete selected clips", (state) => ({
      ...state,
      timeline: {
        ...state.timeline,
        tracks: state.timeline.tracks.map((track) => ({
          ...track,
          clips: track.clips.filter(
            (clip) => !selected.has(clip.id),
          ),
        })),
      },
      selection: cloneValue(DEFAULT_SELECTION),
    }));
  }, [applyMutation]);

  const undo = useCallback(() => {
    dispatch({
      type: "set-state",
      updater: (current) => {
        const entry =
          current.history.undoStack[
            current.history.undoStack.length - 1
          ];

        if (!entry) return current;

        const undoStack = current.history.undoStack.slice(0, -1);

        return {
          ...stateFromSnapshot(current, entry.before),
          history: {
            ...current.history,
            undoStack,
            redoStack: [entry, ...current.history.redoStack],
          },
        };
      },
    });
  }, []);

  const redo = useCallback(() => {
    dispatch({
      type: "set-state",
      updater: (current) => {
        const entry = current.history.redoStack[0];
        if (!entry) return current;

        return {
          ...stateFromSnapshot(current, entry.after),
          history: {
            ...current.history,
            undoStack: [...current.history.undoStack, entry],
            redoStack: current.history.redoStack.slice(1),
          },
        };
      },
    });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        history: {
          ...current.history,
          undoStack: [],
          redoStack: [],
        },
      }),
    });
  }, []);

  const setActiveTool = useCallback((tool: StudioTool) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        activeTool: tool,
      }),
    });
  }, []);

  const setPanelVisible = useCallback(
    (panel: StudioPanelId, visible: boolean) => {
      dispatch({
        type: "set-state",
        updater: (current) => ({
          ...current,
          panels: {
            ...current.panels,
            visible: {
              ...current.panels.visible,
              [panel]: visible,
            },
          },
        }),
      });
    },
    [],
  );

  const setActivePanel = useCallback(
    (panel: StudioPanelId) => {
      dispatch({
        type: "set-state",
        updater: (current) => ({
          ...current,
          panels: {
            ...current.panels,
            activePanel: panel,
            visible: {
              ...current.panels.visible,
              [panel]: true,
            },
          },
        }),
      });
    },
    [],
  );

  const updatePanels = useCallback(
    (patch: Partial<StudioPanelState>) => {
      dispatch({
        type: "set-state",
        updater: (current) => ({
          ...current,
          panels: {
            ...current.panels,
            ...patch,
            visible: {
              ...current.panels.visible,
              ...(patch.visible ?? {}),
            },
          },
        }),
      });
    },
    [],
  );

  const updatePreferences = useCallback(
    (patch: Partial<StudioPreferences>) => {
      dispatch({
        type: "set-state",
        updater: (current) => ({
          ...current,
          preferences: {
            ...current.preferences,
            ...patch,
          },
          dirty: true,
        }),
      });
    },
    [],
  );

  const addGuide = useCallback(
    (guide: StudioGuide, historyLabel = "Add guide") => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        guides: [...current.guides, guide],
      }));
    },
    [applyMutation],
  );

  const updateGuide = useCallback(
    (
      guideId: string,
      patch: Partial<StudioGuide>,
      historyLabel = "Update guide",
    ) => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        guides: current.guides.map((guide) =>
          guide.id === guideId
            ? {
                ...guide,
                ...patch,
                id: guide.id,
              }
            : guide,
        ),
      }));
    },
    [applyMutation],
  );

  const removeGuide = useCallback(
    (
      guideId: string,
      historyLabel = "Remove guide",
    ) => {
      applyMutation(historyLabel, (current) => ({
        ...current,
        guides: current.guides.filter(
          (guide) => guide.id !== guideId,
        ),
      }));
    },
    [applyMutation],
  );

  const enqueueRender = useCallback((job: StudioRenderJob) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        renderQueue: [...current.renderQueue, job],
      }),
    });
  }, []);

  const updateRenderJob = useCallback(
    (
      jobId: string,
      patch: Partial<StudioRenderJob>,
    ) => {
      dispatch({
        type: "set-state",
        updater: (current) => ({
          ...current,
          renderQueue: current.renderQueue.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  ...patch,
                  id: job.id,
                }
              : job,
          ),
        }),
      });
    },
    [],
  );

  const removeRenderJob = useCallback((jobId: string) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        renderQueue: current.renderQueue.filter(
          (job) => job.id !== jobId,
        ),
      }),
    });
  }, []);

  const markSaved = useCallback(() => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        dirty: false,
        saving: false,
        lastSavedAt: Date.now(),
        error: null,
      }),
    });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({
      type: "set-state",
      updater: (current) => ({
        ...current,
        error,
        saving: false,
      }),
    });
  }, []);

  const saveNow = useCallback(async () => {
    const current = stateRef.current;
    if (!onAutosave || current.saving) return;

    dispatch({
      type: "set-state",
      updater: (state) => ({
        ...state,
        saving: true,
        error: null,
      }),
    });

    emit({
      type: "autosave:started",
    });

    try {
      await onAutosave(snapshotFromState(current));

      const savedAt = Date.now();
      dispatch({
        type: "set-state",
        updater: (state) => ({
          ...state,
          dirty: false,
          saving: false,
          lastSavedAt: savedAt,
          error: null,
        }),
      });

      emit({
        type: "autosave:completed",
        savedAt,
      });
    } catch (error) {
      dispatch({
        type: "set-state",
        updater: (state) => ({
          ...state,
          saving: false,
          error:
            error instanceof Error
              ? error.message
              : "Studio autosave failed.",
        }),
      });

      emit({
        type: "autosave:failed",
        error,
      });
    }
  }, [emit, onAutosave]);

  const resetStudio = useCallback(
    (snapshot?: Partial<StudioSnapshot>) => {
      const fresh = createInitialState({
        initialProject: snapshot?.project ?? initialProject,
        initialTimeline: snapshot?.timeline ?? initialTimeline,
        initialAssets: snapshot?.assets ?? initialAssets,
        initialPreferences:
          snapshot?.preferences ?? initialPreferences,
        initialPanels: snapshot?.panels ?? initialPanels,
        historyLimit,
      });

      const next: StudioState = {
        ...fresh,
        selection:
          snapshot?.selection ?? fresh.selection,
        guides: snapshot?.guides ?? fresh.guides,
        renderQueue:
          snapshot?.renderQueue ?? fresh.renderQueue,
        activeTool:
          snapshot?.activeTool ?? fresh.activeTool,
      };

      dispatch({
        type: "replace-state",
        state: next,
      });
    },
    [
      historyLimit,
      initialAssets,
      initialPanels,
      initialPreferences,
      initialProject,
      initialTimeline,
    ],
  );

  const registerCommand = useCallback(
    (command: StudioCommand) => {
      commandRegistryRef.current.set(command.id, command);

      return () => {
        const current = commandRegistryRef.current.get(command.id);

        if (current === command) {
          commandRegistryRef.current.delete(command.id);
        }
      };
    },
    [],
  );

  const actionsRef = useRef<StudioActions | null>(null);

  const executeCommand = useCallback(
    async (commandId: string) => {
      const command =
        commandRegistryRef.current.get(commandId);

      if (!command || !actionsRef.current) return;

      const context: StudioCommandContext = {
        state: stateRef.current,
        actions: actionsRef.current,
      };

      if (command.enabled && !command.enabled(context)) {
        return;
      }

      await command.execute(context);
    },
    [],
  );

  const actions = useMemo<StudioActions>(
    () => ({
      setProject,
      updateProject,

      setTimeline,
      updateTimeline,
      setPlayhead,
      setTimelineZoom,
      setTimelineScroll,
      setSnapping,

      play,
      pause,
      togglePlayback,
      seek,
      setPlaybackRate,
      setPlaybackVolume,
      setPlaybackMuted,
      setLooping,

      addTrack,
      updateTrack,
      removeTrack,
      reorderTracks,

      addClip,
      updateClip,
      removeClip,
      moveClip,
      duplicateClip,
      splitClip,

      addAsset,
      updateAsset,
      removeAsset,

      setSelection,
      selectClip,
      selectAsset,
      selectKeyframe,
      clearSelection,

      addKeyframe,
      updateKeyframe,
      removeKeyframe,

      copySelection,
      cutSelection,
      pasteClipboard,
      deleteSelection,

      undo,
      redo,
      clearHistory,
      commitHistory,

      setActiveTool,
      setPanelVisible,
      setActivePanel,
      updatePanels,
      updatePreferences,

      addGuide,
      updateGuide,
      removeGuide,

      enqueueRender,
      updateRenderJob,
      removeRenderJob,

      registerCommand,
      executeCommand,
      subscribe,
      emit,

      saveNow,
      markSaved,
      setError,
      resetStudio,
    }),
    [
      addAsset,
      addClip,
      addGuide,
      addKeyframe,
      addTrack,
      clearHistory,
      clearSelection,
      commitHistory,
      copySelection,
      cutSelection,
      deleteSelection,
      duplicateClip,
      emit,
      enqueueRender,
      executeCommand,
      markSaved,
      moveClip,
      pasteClipboard,
      pause,
      play,
      redo,
      registerCommand,
      removeAsset,
      removeClip,
      removeGuide,
      removeKeyframe,
      removeRenderJob,
      removeTrack,
      reorderTracks,
      resetStudio,
      saveNow,
      seek,
      selectAsset,
      selectClip,
      selectKeyframe,
      setActivePanel,
      setActiveTool,
      setError,
      setLooping,
      setPanelVisible,
      setPlaybackMuted,
      setPlaybackRate,
      setPlaybackVolume,
      setPlayhead,
      setProject,
      setSelection,
      setSnapping,
      setTimeline,
      setTimelineScroll,
      setTimelineZoom,
      splitClip,
      subscribe,
      togglePlayback,
      undo,
      updateAsset,
      updateClip,
      updateGuide,
      updateKeyframe,
      updatePanels,
      updatePreferences,
      updateProject,
      updateRenderJob,
      updateTimeline,
      updateTrack,
    ],
  );

  actionsRef.current = actions;

  useEffect(() => {
    const unregister = [
      registerCommand({
        id: "studio.undo",
        label: "Undo",
        shortcut: "Ctrl/Cmd+Z",
        enabled: ({ state }) =>
          state.history.undoStack.length > 0,
        execute: ({ actions }) => actions.undo(),
      }),
      registerCommand({
        id: "studio.redo",
        label: "Redo",
        shortcut: "Ctrl/Cmd+Shift+Z",
        enabled: ({ state }) =>
          state.history.redoStack.length > 0,
        execute: ({ actions }) => actions.redo(),
      }),
      registerCommand({
        id: "studio.copy",
        label: "Copy",
        shortcut: "Ctrl/Cmd+C",
        enabled: ({ state }) =>
          state.selection.clipIds.length > 0,
        execute: ({ actions }) => actions.copySelection(),
      }),
      registerCommand({
        id: "studio.cut",
        label: "Cut",
        shortcut: "Ctrl/Cmd+X",
        enabled: ({ state }) =>
          state.selection.clipIds.length > 0,
        execute: ({ actions }) => actions.cutSelection(),
      }),
      registerCommand({
        id: "studio.paste",
        label: "Paste",
        shortcut: "Ctrl/Cmd+V",
        enabled: ({ state }) =>
          state.clipboard.clips.length > 0,
        execute: ({ actions }) => actions.pasteClipboard(),
      }),
      registerCommand({
        id: "studio.delete",
        label: "Delete",
        shortcut: "Delete",
        enabled: ({ state }) =>
          state.selection.clipIds.length > 0,
        execute: ({ actions }) => actions.deleteSelection(),
      }),
      registerCommand({
        id: "studio.playback.toggle",
        label: "Play or pause",
        shortcut: "Space",
        execute: ({ actions }) => actions.togglePlayback(),
      }),
      registerCommand({
        id: "studio.save",
        label: "Save",
        shortcut: "Ctrl/Cmd+S",
        execute: ({ actions }) => actions.saveNow(),
      }),
    ];

    return () => {
      unregister.forEach((cleanup) => cleanup());
    };
  }, [registerCommand]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (modifier && key === "z" && event.shiftKey) {
        event.preventDefault();
        void executeCommand("studio.redo");
        return;
      }

      if (modifier && key === "z") {
        event.preventDefault();
        void executeCommand("studio.undo");
        return;
      }

      if (modifier && key === "c") {
        event.preventDefault();
        void executeCommand("studio.copy");
        return;
      }

      if (modifier && key === "x") {
        event.preventDefault();
        void executeCommand("studio.cut");
        return;
      }

      if (modifier && key === "v") {
        event.preventDefault();
        void executeCommand("studio.paste");
        return;
      }

      if (modifier && key === "s") {
        event.preventDefault();
        void executeCommand("studio.save");
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        void executeCommand("studio.playback.toggle");
        return;
      }

      if (
        event.key === "Delete" ||
        event.key === "Backspace"
      ) {
        event.preventDefault();
        void executeCommand("studio.delete");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [executeCommand]);

  useEffect(() => {
    if (!state.playback.isPlaying) {
      if (playbackFrameRef.current !== null) {
        cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
      }

      playbackLastTimeRef.current = null;
      return;
    }

    const tick = (time: number) => {
      const current = stateRef.current;

      if (!current.playback.isPlaying) {
        playbackFrameRef.current = null;
        playbackLastTimeRef.current = null;
        return;
      }

      const previous = playbackLastTimeRef.current ?? time;
      const elapsed =
        (time - previous) * current.playback.rate;
      playbackLastTimeRef.current = time;

      let nextPlayhead =
        current.timeline.playheadMs + elapsed;

      const loopStart = current.timeline.inPointMs ?? 0;
      const loopEnd =
        current.timeline.outPointMs ??
        current.timeline.durationMs;

      if (nextPlayhead >= loopEnd) {
        if (current.playback.isLooping) {
          nextPlayhead =
            loopStart + (nextPlayhead - loopEnd);
        } else {
          nextPlayhead = loopEnd;
          dispatch({
            type: "set-state",
            updater: (value) => ({
              ...value,
              timeline: {
                ...value.timeline,
                playheadMs: nextPlayhead,
              },
              playback: {
                ...value.playback,
                isPlaying: false,
              },
            }),
          });
          playbackFrameRef.current = null;
          playbackLastTimeRef.current = null;
          return;
        }
      }

      dispatch({
        type: "set-state",
        updater: (value) => ({
          ...value,
          timeline: {
            ...value.timeline,
            playheadMs: nextPlayhead,
          },
        }),
      });

      playbackFrameRef.current =
        requestAnimationFrame(tick);
    };

    playbackFrameRef.current =
      requestAnimationFrame(tick);

    return () => {
      if (playbackFrameRef.current !== null) {
        cancelAnimationFrame(playbackFrameRef.current);
      }

      playbackFrameRef.current = null;
      playbackLastTimeRef.current = null;
    };
  }, [state.playback.isPlaying]);

  useEffect(() => {
    emit({
      type: "playback:changed",
      playback: state.playback,
    });
  }, [emit, state.playback]);

  useEffect(() => {
    emit({
      type: "history:changed",
      canUndo: state.history.undoStack.length > 0,
      canRedo: state.history.redoStack.length > 0,
    });
  }, [
    emit,
    state.history.redoStack.length,
    state.history.undoStack.length,
  ]);

  useEffect(() => {
    if (
      !onAutosave ||
      !state.preferences.autosaveEnabled ||
      !state.dirty ||
      state.saving
    ) {
      return;
    }

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void saveNow();
    }, state.preferences.autosaveDelayMs);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [
    onAutosave,
    saveNow,
    state.dirty,
    state.preferences.autosaveDelayMs,
    state.preferences.autosaveEnabled,
    state.saving,
  ]);

  useEffect(() => {
    pluginCleanupsRef.current.forEach((cleanup) => cleanup());
    pluginCleanupsRef.current = [];

    const context: StudioPluginContext = {
      getState: () => stateRef.current,
      actions,
      registerCommand,
      subscribe,
      emit,
    };

    for (const plugin of plugins) {
      try {
        const cleanup = plugin.setup?.(context);

        if (typeof cleanup === "function") {
          pluginCleanupsRef.current.push(cleanup);
        }
      } catch (error) {
        console.error(
          `Beacon Studio plugin "${plugin.name}" failed to initialise:`,
          error,
        );
      }
    }

    return () => {
      pluginCleanupsRef.current.forEach((cleanup) => cleanup());
      pluginCleanupsRef.current = [];
    };
  }, [actions, emit, plugins, registerCommand, subscribe]);

  const value = useMemo<StudioContextValue>(
    () => ({
      state,
      actions,
      refs: {
        stateRef,
        commandRegistryRef,
      },
    }),
    [actions, state],
  );

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const context = useContext(StudioContext);

  if (!context) {
    throw new Error(
      "useStudio must be used inside a StudioProvider.",
    );
  }

  return context;
}

export function useStudioState(): StudioState {
  return useStudio().state;
}

export function useStudioActions(): StudioActions {
  return useStudio().actions;
}

export function useStudioProject(): StudioProject {
  return useStudio().state.project;
}

export function useStudioTimeline(): StudioTimeline {
  return useStudio().state.timeline;
}

export function useStudioPlayback(): {
  playback: StudioPlaybackState;
  playheadMs: number;
  actions: Pick<
    StudioActions,
    | "play"
    | "pause"
    | "togglePlayback"
    | "seek"
    | "setPlaybackRate"
    | "setPlaybackVolume"
    | "setPlaybackMuted"
    | "setLooping"
  >;
} {
  const { state, actions } = useStudio();

  return {
    playback: state.playback,
    playheadMs: state.timeline.playheadMs,
    actions: {
      play: actions.play,
      pause: actions.pause,
      togglePlayback: actions.togglePlayback,
      seek: actions.seek,
      setPlaybackRate: actions.setPlaybackRate,
      setPlaybackVolume: actions.setPlaybackVolume,
      setPlaybackMuted: actions.setPlaybackMuted,
      setLooping: actions.setLooping,
    },
  };
}

export function useStudioSelection(): {
  selection: StudioSelection;
  actions: Pick<
    StudioActions,
    | "setSelection"
    | "selectClip"
    | "selectAsset"
    | "selectKeyframe"
    | "clearSelection"
  >;
} {
  const { state, actions } = useStudio();

  return {
    selection: state.selection,
    actions: {
      setSelection: actions.setSelection,
      selectClip: actions.selectClip,
      selectAsset: actions.selectAsset,
      selectKeyframe: actions.selectKeyframe,
      clearSelection: actions.clearSelection,
    },
  };
}

export function useStudioHistory(): {
  undoStack: StudioHistoryEntry[];
  redoStack: StudioHistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
} {
  const { state, actions } = useStudio();

  return {
    undoStack: state.history.undoStack,
    redoStack: state.history.redoStack,
    canUndo: state.history.undoStack.length > 0,
    canRedo: state.history.redoStack.length > 0,
    undo: actions.undo,
    redo: actions.redo,
    clearHistory: actions.clearHistory,
  };
}

export function useStudioAssets(): {
  assets: StudioAsset[];
  addAsset: StudioActions["addAsset"];
  updateAsset: StudioActions["updateAsset"];
  removeAsset: StudioActions["removeAsset"];
} {
  const { state, actions } = useStudio();

  return {
    assets: state.assets,
    addAsset: actions.addAsset,
    updateAsset: actions.updateAsset,
    removeAsset: actions.removeAsset,
  };
}

export function useStudioPanels(): {
  panels: StudioPanelState;
  setPanelVisible: StudioActions["setPanelVisible"];
  setActivePanel: StudioActions["setActivePanel"];
  updatePanels: StudioActions["updatePanels"];
} {
  const { state, actions } = useStudio();

  return {
    panels: state.panels,
    setPanelVisible: actions.setPanelVisible,
    setActivePanel: actions.setActivePanel,
    updatePanels: actions.updatePanels,
  };
}

export function useStudioCommand(
  commandId: string,
): () => Promise<void> {
  const { actions } = useStudio();

  return useCallback(
    () => actions.executeCommand(commandId),
    [actions, commandId],
  );
}

export function useStudioControlledState<T>(
  selector: (state: StudioState) => T,
  setter: (value: T) => void,
): [T, Dispatch<SetStateAction<T>>] {
  const { state } = useStudio();
  const selected = selector(state);

  const setSelected = useCallback<Dispatch<SetStateAction<T>>>(
    (value) => {
      setter(
        typeof value === "function"
          ? (
              value as (previous: T) => T
            )(selector(stateRefFallback(state)))
          : value,
      );
    },
    [selector, setter, state],
  );

  return [selected, setSelected];
}

function stateRefFallback(state: StudioState): StudioState {
  return state;
}

export function createStudioTrack(
  input: Partial<StudioTrack> = {},
): StudioTrack {
  return {
    id: input.id ?? createId("track"),
    name: input.name ?? "Untitled track",
    type: input.type ?? "mixed",
    order: input.order ?? 0,
    locked: input.locked ?? false,
    muted: input.muted ?? false,
    hidden: input.hidden ?? false,
    solo: input.solo ?? false,
    height: input.height ?? 64,
    clips: input.clips ?? [],
  };
}

export function createStudioClip(
  input: Partial<StudioClip> & {
    trackId: string;
    type: StudioClipType;
  },
): StudioClip {
  return normaliseClip({
    id: input.id ?? createId("clip"),
    trackId: input.trackId,
    assetId: input.assetId,
    type: input.type,
    name: input.name ?? "Untitled clip",
    startMs: input.startMs ?? 0,
    durationMs: input.durationMs ?? 5_000,
    trimStartMs: input.trimStartMs ?? 0,
    trimEndMs: input.trimEndMs ?? 0,
    playbackRate: input.playbackRate ?? 1,
    layer: input.layer ?? 0,
    locked: input.locked ?? false,
    hidden: input.hidden ?? false,
    selected: input.selected ?? false,
    transform: {
      ...DEFAULT_CLIP_TRANSFORM,
      ...(input.transform ?? {}),
    },
    audio: input.audio,
    style: input.style,
    content: input.content,
    keyframes: input.keyframes ?? [],
    metadata: input.metadata ?? {},
  });
}

export function createStudioAsset(
  input: Partial<StudioAsset> & {
    name: string;
    kind: StudioAssetKind;
    url: string;
  },
): StudioAsset {
  return {
    id: input.id ?? createId("asset"),
    projectId: input.projectId,
    name: input.name,
    kind: input.kind,
    url: input.url,
    thumbnailUrl: input.thumbnailUrl,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    width: input.width,
    height: input.height,
    durationMs: input.durationMs,
    createdAt: input.createdAt ?? nowIso(),
    updatedAt: input.updatedAt,
    status: input.status ?? "ready",
    favourite: input.favourite ?? false,
    metadata: input.metadata ?? {},
  };
}

export function createStudioKeyframe(
  input: Partial<StudioKeyframe> & {
    clipId: string;
    property: string;
    timeMs: number;
    value: StudioKeyframe["value"];
  },
): StudioKeyframe {
  return {
    id: input.id ?? createId("keyframe"),
    clipId: input.clipId,
    property: input.property,
    timeMs: Math.max(0, input.timeMs),
    value: input.value,
    interpolation: input.interpolation ?? "ease",
    curve: input.curve,
  };
}

export function createStudioRenderJob(
  input: Partial<StudioRenderJob> & {
    projectId: string;
    name: string;
  },
): StudioRenderJob {
  return {
    id: input.id ?? createId("render"),
    projectId: input.projectId,
    name: input.name,
    status: input.status ?? "queued",
    format: input.format ?? "mp4",
    width: input.width ?? 1920,
    height: input.height ?? 1080,
    frameRate: input.frameRate ?? 30,
    quality: input.quality ?? "high",
    progress: clamp(input.progress ?? 0, 0, 1),
    createdAt: input.createdAt ?? nowIso(),
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    outputUrl: input.outputUrl,
    error: input.error,
  };
}