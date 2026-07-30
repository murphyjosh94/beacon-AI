"use client";

import {
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AnimationCurveEditor from "./AnimationCurveEditor";
import AssetLibrary, { type StudioAsset as LibraryAsset } from "./AssetLibrary";
import HistoryManager, { type HistoryEntry as ManagerHistoryEntry } from "./HistoryManager";
import Inspector, { type InspectorProject } from "./Inspector";
import KeyframeEditor from "./KeyframeEditor";
import type { Keyframe as EditorKeyframe, KeyframeInterpolation as EditorKeyframeInterpolation, KeyframeTrack } from "./KeyframeUtils";
import RecordingToolbar, { type RecordingTimelineClip, type StudioRecording } from "./RecordingToolbar";
import RenderQueue, { type RenderJob } from "./RenderQueue";
import StudioFooter from "./StudioFooter";
import StudioHeader from "./StudioHeader";
import StudioPreview from "./StudioPreview";
import StudioToolbar from "./StudioToolbar";
import Timeline, { type TimelineChange, type TimelineKeyframe, type TimelineTrack } from "./Timeline";
import VoiceOverPanel, { type VoiceAsset, type VoiceTimelineClip } from "./VoiceOverPanel";
import {
  createStudioAsset,
  createStudioClip,
  createStudioTrack,
  type StudioAsset,
  type StudioClip,
  type StudioKeyframe,
  type StudioPanelId,
  type StudioRenderJob,
  type StudioSnapshot,
  type StudioState,
  type StudioTrack,
  useStudio,
} from "../StudioProvider";

type DockPosition = "left" | "right" | "bottom" | "centre";

type ResizeState = {
  edge: "left" | "right" | "timeline";
  pointerId: number;
  originX: number;
  originY: number;
  originValue: number;
};

type PanelDefinition = {
  id: StudioPanelId;
  label: string;
  shortLabel: string;
  dock: DockPosition;
};

const PANEL_DEFINITIONS: PanelDefinition[] = [
  {
    id: "assets",
    label: "Assets",
    shortLabel: "Assets",
    dock: "left",
  },
  {
    id: "inspector",
    label: "Inspector",
    shortLabel: "Inspect",
    dock: "right",
  },
  {
    id: "timeline",
    label: "Timeline",
    shortLabel: "Timeline",
    dock: "bottom",
  },
  {
    id: "history",
    label: "History",
    shortLabel: "History",
    dock: "right",
  },
  {
    id: "renderQueue",
    label: "Render queue",
    shortLabel: "Render",
    dock: "right",
  },
  {
    id: "keyframes",
    label: "Keyframes",
    shortLabel: "Keys",
    dock: "bottom",
  },
  {
    id: "curves",
    label: "Animation curves",
    shortLabel: "Curves",
    dock: "right",
  },
  {
    id: "voiceOver",
    label: "Voice-over",
    shortLabel: "Voice",
    dock: "centre",
  },
  {
    id: "recording",
    label: "Media capture",
    shortLabel: "Capture",
    dock: "centre",
  },
];

const MIN_LEFT_WIDTH = 240;
const MAX_LEFT_WIDTH = 520;
const MIN_RIGHT_WIDTH = 280;
const MAX_RIGHT_WIDTH = 560;
const MIN_TIMELINE_HEIGHT = 190;
const MAX_TIMELINE_HEIGHT = 620;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatTime(timeMs: number): string {
  const safe = Math.max(0, Math.round(timeMs));
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1_000);
  const frames = Math.floor((safe % 1_000) / (1_000 / 30));

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${frames
    .toString()
    .padStart(2, "0")}`;
}

function panelLabel(panelId: StudioPanelId): string {
  return (
    PANEL_DEFINITIONS.find((panel) => panel.id === panelId)?.label ??
    panelId
  );
}

function assetKindToLibraryType(
  kind: StudioAsset["kind"],
): LibraryAsset["type"] {
  switch (kind) {
    case "image":
      return "image";
    case "video":
    case "recording":
      return "video";
    case "audio":
    case "voice":
      return "audio";
    case "font":
      return "font";
    case "document":
      return "document";
    default:
      return "unknown";
  }
}

function libraryTypeToAssetKind(
  type: LibraryAsset["type"],
): StudioAsset["kind"] {
  switch (type) {
    case "image":
    case "svg":
      return "image";
    case "video":
      return "video";
    case "audio":
      return "audio";
    case "font":
      return "font";
    case "document":
    case "json":
      return "document";
    default:
      return "other";
  }
}

function toLibraryAsset(asset: StudioAsset): LibraryAsset {
  return {
    id: asset.id,
    name: asset.name,
    type: assetKindToLibraryType(asset.kind),
    url: asset.url,
    thumbnailUrl: asset.thumbnailUrl ?? null,
    mimeType: asset.mimeType ?? null,
    sizeBytes: asset.sizeBytes ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    durationMs: asset.durationMs ?? null,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt ?? null,
    favourite: asset.favourite,
    metadata: asset.metadata,
  };
}

function toStudioAsset(asset: LibraryAsset): StudioAsset {
  return createStudioAsset({
    id: asset.id,
    name: asset.name,
    kind: libraryTypeToAssetKind(asset.type),
    url: asset.url,
    thumbnailUrl: asset.thumbnailUrl ?? undefined,
    mimeType: asset.mimeType ?? undefined,
    sizeBytes: asset.sizeBytes ?? undefined,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
    durationMs: asset.durationMs ?? undefined,
    createdAt: asset.createdAt ?? undefined,
    updatedAt: asset.updatedAt ?? undefined,
    favourite: asset.favourite,
    metadata: asset.metadata,
    status: "ready",
  });
}

function studioTrackToTimelineTrack(track: StudioTrack): TimelineTrack {
  const keyframes: TimelineKeyframe[] = track.clips.map((clip) => ({
    id: clip.id,
    timeMs: clip.startMs,
    durationMs: clip.durationMs,
    label: clip.name,
    action: clip.type,
    selector:
      typeof clip.metadata?.selector === "string"
        ? clip.metadata.selector
        : undefined,
    value:
      typeof clip.content === "string"
        ? clip.content
        : null,
    disabled: clip.hidden,
    metadata: {
      clipId: clip.id,
      assetId: clip.assetId,
      clipType: clip.type,
      ...clip.metadata,
    },
  }));

  return {
    id: track.id,
    name: track.name,
    type: track.type,
    muted: track.muted,
    locked: track.locked,
    hidden: track.hidden,
    colour:
      typeof track.clips[0]?.metadata?.colour === "string"
        ? String(track.clips[0].metadata?.colour)
        : undefined,
    keyframes,
  };
}

function timelineKeyframeToClip(
  keyframe: TimelineKeyframe,
  trackId: string,
  existing?: StudioClip,
): StudioClip {
  if (existing) {
    return {
      ...existing,
      trackId,
      name: keyframe.label ?? existing.name,
      startMs: Math.max(0, keyframe.timeMs),
      durationMs: Math.max(1, keyframe.durationMs ?? existing.durationMs),
      hidden: Boolean(keyframe.disabled),
      content:
        typeof keyframe.value === "string"
          ? keyframe.value
          : existing.content,
      metadata: {
        ...existing.metadata,
        ...keyframe.metadata,
        selector: keyframe.selector,
      },
    };
  }

  return createStudioClip({
    id: keyframe.id,
    trackId,
    type:
      keyframe.action === "audio"
        ? "audio"
        : keyframe.action === "video"
          ? "video"
          : keyframe.action === "image"
            ? "image"
            : keyframe.action === "text"
              ? "text"
              : "shape",
    name: keyframe.label ?? "Timeline item",
    startMs: keyframe.timeMs,
    durationMs: keyframe.durationMs ?? 1_000,
    content:
      typeof keyframe.value === "string"
        ? keyframe.value
        : undefined,
    hidden: Boolean(keyframe.disabled),
    metadata: {
      ...keyframe.metadata,
      selector: keyframe.selector,
    },
  });
}

function renderStatusToQueueStatus(
  status: StudioRenderJob["status"],
): RenderJob["status"] {
  if (status === "rendering") return "rendering";
  if (status === "preparing") return "preparing";
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "cancelled";
  return "queued";
}

function renderFormatToQueueFormat(
  format: StudioRenderJob["format"],
): RenderJob["format"] {
  return format === "png-sequence" ? "webm" : format;
}

function resolutionFromDimensions(
  width: number,
  height: number,
): RenderJob["resolution"] {
  if (width === 1280 && height === 720) return "720p";
  if (width === 1920 && height === 1080) return "1080p";
  if (width === 2560 && height === 1440) return "1440p";
  if (width === 3840 && height === 2160) return "4k";
  return "custom";
}

function toRenderJob(
  job: StudioRenderJob,
  projectName: string,
): RenderJob {
  return {
    id: job.id,
    projectId: job.projectId,
    projectName,
    name: job.name,
    format: renderFormatToQueueFormat(job.format),
    resolution: resolutionFromDimensions(job.width, job.height),
    width: job.width,
    height: job.height,
    fps: job.frameRate,
    quality:
      job.quality === "draft"
        ? 45
        : job.quality === "standard"
          ? 70
          : job.quality === "high"
            ? 85
            : 100,
    status: renderStatusToQueueStatus(job.status),
    progress: clamp(job.progress * 100, 0, 100),
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? null,
    completedAt: job.completedAt ?? null,
    outputUrl: job.outputUrl ?? null,
    error: job.error ?? null,
  };
}

function renderQualityFromNumber(
  quality: number,
): StudioRenderJob["quality"] {
  if (quality < 60) return "draft";
  if (quality < 80) return "standard";
  if (quality < 95) return "high";
  return "maximum";
}

function toHistoryEntries(
  state: StudioState,
): ManagerHistoryEntry<StudioSnapshot>[] {
  const undoEntries = state.history.undoStack.map((entry) => ({
    id: entry.id,
    label: entry.label,
    kind: "edit" as const,
    state: entry.after,
    createdAt: new Date(entry.timestamp).toISOString(),
    description: entry.source ?? null,
  }));

  const current: ManagerHistoryEntry<StudioSnapshot> = {
    id: "current-studio-state",
    label: "Current state",
    kind: "initial",
    state: {
      project: state.project,
      timeline: state.timeline,
      assets: state.assets,
      selection: state.selection,
      guides: state.guides,
      preferences: state.preferences,
      panels: state.panels,
      renderQueue: state.renderQueue,
      activeTool: state.activeTool,
    },
    createdAt: new Date().toISOString(),
  };

  const redoEntries = state.history.redoStack.map((entry) => ({
    id: entry.id,
    label: entry.label,
    kind: "edit" as const,
    state: entry.after,
    createdAt: new Date(entry.timestamp).toISOString(),
    description: entry.source ?? null,
  }));

  return [...undoEntries, current, ...redoEntries];
}

function voiceAssetToStudioAsset(asset: VoiceAsset): StudioAsset {
  return createStudioAsset({
    id: asset.id,
    name: asset.name,
    kind: "voice",
    url: asset.url,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    durationMs: asset.durationMs,
    createdAt: asset.createdAt,
    favourite: asset.favourite,
    status: asset.status === "error" ? "failed" : "ready",
    metadata: {
      waveform: asset.waveform,
    },
  });
}

function recordingToStudioAsset(recording: StudioRecording): StudioAsset {
  return createStudioAsset({
    id: recording.id,
    name: recording.name,
    kind: "recording",
    url: recording.url,
    thumbnailUrl: recording.posterUrl,
    mimeType: recording.mimeType,
    sizeBytes: recording.sizeBytes,
    width: recording.width,
    height: recording.height,
    durationMs: recording.durationMs,
    createdAt: recording.createdAt,
    status: "ready",
    metadata: {
      mode: recording.mode,
      frameRate: recording.frameRate,
      hasCamera: recording.hasCamera,
      hasMicrophone: recording.hasMicrophone,
      hasSystemAudio: recording.hasSystemAudio,
    },
  });
}

function LoadingPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 p-6 text-center">
      <div className="h-8 w-8 animate-pulse rounded-full border border-cyan-400/30 bg-cyan-400/10" />
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function PanelFrame({
  title,
  panelId,
  children,
  onClose,
  className = "",
}: {
  title: string;
  panelId: StudioPanelId;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden border-white/10 bg-slate-950 ${className}`}
      data-studio-panel={panelId}
    >
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/90 px-3">
        <h2 className="truncate text-xs font-semibold text-slate-200">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-xs text-slate-500 transition hover:bg-white/10 hover:text-white"
          aria-label={`Close ${title}`}
        >
          ×
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}


export type StudioWorkspaceProps = {
  disabled?: boolean;
  onExit?: () => void;
  onPublish?: (snapshot: StudioSnapshot) => Promise<void> | void;
  preview?: ReactNode;
  className?: string;
};

export default function StudioWorkspace({
  disabled = false,
  onExit,
  onPublish,
  preview,
  className = "",
}: StudioWorkspaceProps) {
  const { state, actions } = useStudio();
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [mobilePanel, setMobilePanel] = useState<StudioPanelId | null>(null);
  const [draggedPanel, setDraggedPanel] = useState<StudioPanelId | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);

  const timelineTracks = useMemo(
    () => state.timeline.tracks.map(studioTrackToTimelineTrack),
    [state.timeline.tracks],
  );

  const selectedTimelineTrackId = useMemo(() => {
    if (state.selection.trackIds[0]) return state.selection.trackIds[0];

    if (state.selection.primaryClipId) {
      return (
        state.timeline.tracks.find((track) =>
          track.clips.some(
            (clip) => clip.id === state.selection.primaryClipId,
          ),
        )?.id ?? null
      );
    }

    return null;
  }, [
    state.selection.primaryClipId,
    state.selection.trackIds,
    state.timeline.tracks,
  ]);

  const selectedTimelineKeyframeIds = state.selection.clipIds;

  const selectedTimelineTrack =
    timelineTracks.find(
      (track) => track.id === selectedTimelineTrackId,
    ) ?? null;

  const selectedTimelineKeyframe =
    selectedTimelineTrack?.keyframes.find((keyframe) =>
      selectedTimelineKeyframeIds.includes(keyframe.id),
    ) ?? null;

  const libraryAssets = useMemo(
    () => state.assets.map(toLibraryAsset),
    [state.assets],
  );

  const renderJobs = useMemo(
    () =>
      state.renderQueue.map((job) =>
        toRenderJob(job, state.project.name),
      ),
    [state.project.name, state.renderQueue],
  );

  const historyEntries = useMemo(
    () => toHistoryEntries(state),
    [state],
  );

  const historyCurrentIndex = state.history.undoStack.length;

  const visibleLeft = state.panels.visible.assets;
  const visibleRight =
    state.panels.visible.inspector ||
    state.panels.visible.history ||
    state.panels.visible.renderQueue ||
    state.panels.visible.curves;
  const visibleBottom =
    state.panels.visible.timeline ||
    state.panels.visible.keyframes;

  const rightPanel =
    state.panels.activePanel === "history" &&
    state.panels.visible.history
      ? "history"
      : state.panels.activePanel === "renderQueue" &&
          state.panels.visible.renderQueue
        ? "renderQueue"
        : state.panels.activePanel === "curves" &&
            state.panels.visible.curves
          ? "curves"
          : state.panels.visible.inspector
            ? "inspector"
            : state.panels.visible.history
              ? "history"
              : state.panels.visible.renderQueue
                ? "renderQueue"
                : state.panels.visible.curves
                  ? "curves"
                  : null;

  const bottomPanel =
    state.panels.activePanel === "keyframes" &&
    state.panels.visible.keyframes
      ? "keyframes"
      : state.panels.visible.timeline
        ? "timeline"
        : state.panels.visible.keyframes
          ? "keyframes"
          : null;

  const overlayPanel =
    state.panels.activePanel === "voiceOver" &&
    state.panels.visible.voiceOver
      ? "voiceOver"
      : state.panels.activePanel === "recording" &&
          state.panels.visible.recording
        ? "recording"
        : null;

  const beginResize = (
    edge: ResizeState["edge"],
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    setResizeState({
      edge,
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      originValue:
        edge === "left"
          ? state.panels.assetPanelWidth
          : edge === "right"
            ? state.panels.inspectorWidth
            : state.panels.timelineHeight,
    });
  };

  useEffect(() => {
    if (!resizeState) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== resizeState.pointerId) return;

      if (resizeState.edge === "left") {
        actions.updatePanels({
          assetPanelWidth: clamp(
            resizeState.originValue +
              (event.clientX - resizeState.originX),
            MIN_LEFT_WIDTH,
            MAX_LEFT_WIDTH,
          ),
        });
        return;
      }

      if (resizeState.edge === "right") {
        actions.updatePanels({
          inspectorWidth: clamp(
            resizeState.originValue -
              (event.clientX - resizeState.originX),
            MIN_RIGHT_WIDTH,
            MAX_RIGHT_WIDTH,
          ),
        });
        return;
      }

      actions.updatePanels({
        timelineHeight: clamp(
          resizeState.originValue -
            (event.clientY - resizeState.originY),
          MIN_TIMELINE_HEIGHT,
          MAX_TIMELINE_HEIGHT,
        ),
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId === resizeState.pointerId) {
        setResizeState(null);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [actions, resizeState]);

  const handleTimelineTracksChange = (tracks: TimelineTrack[]) => {
    const currentTracksById = new Map(
      state.timeline.tracks.map((track) => [track.id, track]),
    );

    const nextTracks: StudioTrack[] = tracks.map((track, order) => {
      const currentTrack = currentTracksById.get(track.id);

      const clips = track.keyframes.map((keyframe) => {
        const existing = currentTrack?.clips.find(
          (clip) => clip.id === keyframe.id,
        );

        return timelineKeyframeToClip(
          keyframe,
          track.id,
          existing,
        );
      });

      return {
        ...(currentTrack ??
          createStudioTrack({
            id: track.id,
            name: track.name,
            type: "mixed",
          })),
        id: track.id,
        name: track.name,
        type:
          track.type === "audio"
            ? "audio"
            : track.type === "video"
              ? "video"
              : track.type === "camera"
                ? "recording"
                : "mixed",
        order,
        muted: Boolean(track.muted),
        locked: Boolean(track.locked),
        hidden: Boolean(track.hidden),
        clips,
      };
    });

    actions.updateTimeline(
      {
        tracks: nextTracks,
      },
      "Edit timeline",
    );
  };

  const handleTimelineSelection = (selection: TimelineChange) => {
    actions.setSelection({
      ...state.selection,
      trackIds: selection.selectedTrackId
        ? [selection.selectedTrackId]
        : [],
      clipIds: selection.selectedKeyframeIds,
      primaryClipId:
        selection.selectedKeyframeIds[0] ?? null,
    });
  };

  const handleAddTrack = () => {
    const track = createStudioTrack({
      id: createId("track"),
      name: `Track ${state.timeline.tracks.length + 1}`,
      type: "mixed",
      order: state.timeline.tracks.length,
    });

    actions.addTrack(track);
    actions.setSelection({
      ...state.selection,
      trackIds: [track.id],
    });
  };

  const handleAddTimelineItem = (
    trackId: string,
    timeMs: number,
  ) => {
    const clip = createStudioClip({
      id: createId("clip"),
      trackId,
      type: "shape",
      name: "New timeline item",
      startMs: timeMs,
      durationMs: state.preferences.defaultClipDurationMs,
    });

    actions.addClip(trackId, clip);
    actions.selectClip(clip.id);
  };

  const insertAsset = (asset: LibraryAsset) => {
    let targetTrack =
      state.timeline.tracks.find((track) => {
        if (asset.type === "audio") {
          return (
            track.type === "audio" ||
            track.type === "voice"
          );
        }

        return (
          track.type === "video" ||
          track.type === "overlay" ||
          track.type === "mixed"
        );
      }) ?? null;

    if (!targetTrack) {
      targetTrack = createStudioTrack({
        id: createId("track"),
        name:
          asset.type === "audio"
            ? "Audio"
            : "Media",
        type:
          asset.type === "audio"
            ? "audio"
            : "mixed",
        order: state.timeline.tracks.length,
      });
      actions.addTrack(targetTrack);
    }

    const clip = createStudioClip({
      id: createId("clip"),
      trackId: targetTrack.id,
      assetId: asset.id,
      type:
        asset.type === "image"
          ? "image"
          : asset.type === "audio"
            ? "audio"
            : asset.type === "video"
              ? "video"
              : "shape",
      name: asset.name,
      startMs: state.timeline.playheadMs,
      durationMs:
        asset.durationMs ??
        state.preferences.defaultClipDurationMs,
      transform: {
        x: 0,
        y: 0,
        width: Math.min(
          asset.width ?? state.project.width,
          state.project.width,
        ),
        height: Math.min(
          asset.height ?? state.project.height,
          state.project.height,
        ),
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        anchorX: 0.5,
        anchorY: 0.5,
      },
    });

    actions.addClip(targetTrack.id, clip);
    actions.selectClip(clip.id);
  };

  const handleVoiceClip = (
    voiceClip: VoiceTimelineClip,
    voiceAsset: VoiceAsset,
  ) => {
    let track =
      state.timeline.tracks.find(
        (item) => item.type === "voice",
      ) ?? null;

    if (!track) {
      track = createStudioTrack({
        id: createId("voice_track"),
        name: "Voice-over",
        type: "voice",
        order: state.timeline.tracks.length,
      });
      actions.addTrack(track);
    }

    const asset =
      state.assets.find((item) => item.id === voiceAsset.id) ??
      voiceAssetToStudioAsset(voiceAsset);

    if (!state.assets.some((item) => item.id === asset.id)) {
      actions.addAsset(asset);
    }

    const clip = createStudioClip({
      id: voiceClip.id,
      trackId: track.id,
      assetId: asset.id,
      type: "voice",
      name: voiceClip.name,
      startMs: voiceClip.startMs,
      durationMs: voiceClip.durationMs,
      trimStartMs: voiceClip.trimStartMs,
      trimEndMs: voiceClip.trimEndMs,
      playbackRate: voiceClip.playbackRate,
      audio: {
        muted: voiceClip.muted,
        volume: voiceClip.gain,
        pan: voiceClip.pan,
        fadeInMs: voiceClip.fadeInMs,
        fadeOutMs: voiceClip.fadeOutMs,
      },
    });

    actions.addClip(track.id, clip, "Add voice-over");
    actions.selectClip(clip.id);
  };

  const handleRecordingClip = (
    recordingClip: RecordingTimelineClip,
    recording: StudioRecording,
  ) => {
    let track =
      state.timeline.tracks.find(
        (item) => item.type === "recording",
      ) ?? null;

    if (!track) {
      track = createStudioTrack({
        id: createId("recording_track"),
        name: "Captured media",
        type: "recording",
        order: state.timeline.tracks.length,
      });
      actions.addTrack(track);
    }

    const asset =
      state.assets.find((item) => item.id === recording.id) ??
      recordingToStudioAsset(recording);

    if (!state.assets.some((item) => item.id === asset.id)) {
      actions.addAsset(asset);
    }

    const clip = createStudioClip({
      id: recordingClip.id,
      trackId: track.id,
      assetId: asset.id,
      type: "recording",
      name: recordingClip.name,
      startMs: recordingClip.startMs,
      durationMs: recordingClip.durationMs,
      trimStartMs: recordingClip.trimStartMs,
      trimEndMs: recordingClip.trimEndMs,
      playbackRate: recordingClip.playbackRate,
      audio: {
        muted: recordingClip.muted,
        volume: 1,
        pan: 0,
        fadeInMs: 0,
        fadeOutMs: 0,
      },
      locked: recordingClip.locked,
      layer: recordingClip.layer,
      transform: {
        x: 0,
        y: 0,
        width: state.project.width,
        height: state.project.height,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        anchorX: 0.5,
        anchorY: 0.5,
      },
    });

    actions.addClip(track.id, clip, "Add recording");
    actions.selectClip(clip.id);
  };

  const dropPanel = (
    event: DragEvent<HTMLDivElement>,
    panelId: StudioPanelId,
  ) => {
    event.preventDefault();
    setDraggedPanel(null);
    actions.setActivePanel(panelId);
  };

  const renderRightPanel = () => {
    if (rightPanel === "history") {
      return (
        <PanelFrame
          title="History"
          panelId="history"
          onClose={() => actions.setPanelVisible("history", false)}
          className="h-full border-l"
        >
          <HistoryManager
            entries={historyEntries}
            currentIndex={historyCurrentIndex}
            onUndo={actions.undo}
            onRedo={actions.redo}
            onJumpTo={(index) => {
              const delta = index - historyCurrentIndex;

              if (delta < 0) {
                for (let step = 0; step < Math.abs(delta); step += 1) {
                  actions.undo();
                }
              } else if (delta > 0) {
                for (let step = 0; step < delta; step += 1) {
                  actions.redo();
                }
              }
            }}
            onClear={actions.clearHistory}
            className="h-full border-0 rounded-none"
          />
        </PanelFrame>
      );
    }

    if (rightPanel === "renderQueue") {
      return (
        <PanelFrame
          title="Render queue"
          panelId="renderQueue"
          onClose={() =>
            actions.setPanelVisible("renderQueue", false)
          }
          className="h-full border-l"
        >
          <RenderQueue
            jobs={renderJobs}
            defaultProjectId={state.project.id}
            defaultProjectName={state.project.name}
            onCreateJob={(input) => {
              const job: StudioRenderJob = {
                id: createId("render"),
                projectId: input.projectId,
                name: input.name,
                status: "queued",
                format: input.format,
                width: input.width,
                height: input.height,
                frameRate: input.fps,
                quality: renderQualityFromNumber(input.quality),
                progress: 0,
                createdAt: new Date().toISOString(),
              };

              actions.enqueueRender(job);
              return toRenderJob(job, state.project.name);
            }}
            onPauseJob={(jobId) =>
              actions.updateRenderJob(jobId, {
                status: "rendering",
              })
            }
            onResumeJob={(jobId) =>
              actions.updateRenderJob(jobId, {
                status: "rendering",
              })
            }
            onCancelJob={(jobId) =>
              actions.updateRenderJob(jobId, {
                status: "cancelled",
              })
            }
            onRetryJob={(jobId) => {
              actions.updateRenderJob(jobId, {
                status: "queued",
                progress: 0,
                error: undefined,
              });
            }}
            onDeleteJob={actions.removeRenderJob}
            onClearCompleted={() => {
              state.renderQueue
                .filter((job) => job.status === "completed")
                .forEach((job) =>
                  actions.removeRenderJob(job.id),
                );
            }}
            onReorderJobs={(orderedIds) => {
              const orderMap = new Map(
                orderedIds.map((id, index) => [id, index]),
              );

              const sorted = [...state.renderQueue].sort(
                (a, b) =>
                  (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
                  (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER),
              );

              sorted.forEach((job, index) => {
                actions.updateRenderJob(job.id, {
                  metadata: {
                    ...(job as StudioRenderJob & {
                      metadata?: Record<string, unknown>;
                    }).metadata,
                    queueOrder: index,
                  },
                } as Partial<StudioRenderJob>);
              });
            }}
            onDownloadJob={(job) => {
              if (!job.outputUrl) return;
              const anchor = document.createElement("a");
              anchor.href = job.outputUrl;
              anchor.download = job.name;
              anchor.click();
            }}
            className="h-full border-0 rounded-none"
          />
        </PanelFrame>
      );
    }

    if (rightPanel === "curves") {
      const selectedClip = state.timeline.tracks
        .flatMap((track) => track.clips)
        .find(
          (clip) => clip.id === state.selection.primaryClipId,
        );

      const keyframe = selectedClip?.keyframes?.find(
        (item) =>
          item.id === state.selection.primaryKeyframeId,
      );

      const curve = keyframe?.curve
        ? [
            keyframe.curve.x1,
            keyframe.curve.y1,
            keyframe.curve.x2,
            keyframe.curve.y2,
          ] as [number, number, number, number]
        : undefined;

      return (
        <PanelFrame
          title="Animation curves"
          panelId="curves"
          onClose={() => actions.setPanelVisible("curves", false)}
          className="h-full border-l"
        >
          <AnimationCurveEditor
            value={curve}
            disabled={!keyframe || disabled}
            onCommit={(next) => {
              if (!keyframe) return;

              actions.updateKeyframe(
                keyframe.id,
                {
                  interpolation: "cubic-bezier",
                  curve: {
                    x1: next[0],
                    y1: next[1],
                    x2: next[2],
                    y2: next[3],
                  },
                },
                "Change animation curve",
              );
            }}
            className="h-full border-0 rounded-none"
          />
        </PanelFrame>
      );
    }

    return (
      <PanelFrame
        title="Inspector"
        panelId="inspector"
        onClose={() =>
          actions.setPanelVisible("inspector", false)
        }
        className="h-full border-l"
      >
        <Inspector
          project={
            {
              id: state.project.id,
              name: state.project.name,
              durationMs: state.project.durationMs,
              description:
                typeof state.project.metadata?.description === "string"
                  ? state.project.metadata.description
                  : undefined,
            } satisfies InspectorProject
          }
          selection={{
            track: selectedTimelineTrack,
            keyframe: selectedTimelineKeyframe,
          }}
          disabled={disabled}
          onProjectChange={(project) => {
            actions.updateProject(
              {
                name: project.name,
                durationMs: project.durationMs,
                metadata: {
                  ...state.project.metadata,
                  description: project.description,
                },
              },
              "Update project details",
            );
          }}
          onTrackChange={(track) => {
            actions.updateTrack(
              track.id,
              {
                name: track.name,
                muted: Boolean(track.muted),
                locked: Boolean(track.locked),
                hidden: Boolean(track.hidden),
              },
              "Update track",
            );
          }}
          onKeyframeChange={(trackId, keyframe) => {
            const existing = state.timeline.tracks
              .find((track) => track.id === trackId)
              ?.clips.find((clip) => clip.id === keyframe.id);

            if (!existing) return;

            actions.updateClip(
              existing.id,
              {
                name: keyframe.label ?? existing.name,
                startMs: keyframe.timeMs,
                durationMs:
                  keyframe.durationMs ?? existing.durationMs,
                hidden: Boolean(keyframe.disabled),
                content:
                  typeof keyframe.value === "string"
                    ? keyframe.value
                    : existing.content,
                metadata: {
                  ...existing.metadata,
                  ...keyframe.metadata,
                  selector: keyframe.selector,
                },
              },
              "Update timeline item",
            );
          }}
          onDeleteTrack={actions.removeTrack}
          onDeleteKeyframe={(_, keyframeId) =>
            actions.removeClip(keyframeId)
          }
          onDuplicateKeyframe={(_, keyframeId) =>
            actions.duplicateClip(keyframeId)
          }
          onPreviewKeyframe={(_, keyframe) =>
            actions.seek(keyframe.timeMs)
          }
          className="h-full border-0 rounded-none"
        />
      </PanelFrame>
    );
  };

  const renderBottomPanel = () => {
    if (bottomPanel === "keyframes") {
      const selectedClip = state.timeline.tracks
        .flatMap((track) => track.clips)
        .find(
          (clip) => clip.id === state.selection.primaryClipId,
        );

      const toEditorInterpolation = (
        interpolation: StudioKeyframe["interpolation"],
      ): EditorKeyframeInterpolation => {
        switch (interpolation) {
          case "linear":
            return "linear";
          case "ease-in":
            return "ease-in";
          case "ease-out":
            return "ease-out";
          case "ease-in-out":
            return "ease-in-out";
          case "step":
            return "hold";
          case "cubic-bezier":
            return "bezier";
          case "ease":
          default:
            return "ease-in-out";
        }
      };

      const keyframeTracks: KeyframeTrack[] = selectedClip
        ? [
            {
              id: selectedClip.id,
              name: selectedClip.name,
              property:
                selectedClip.keyframes?.[0]?.property ?? "value",
              colour: "#22d3ee",
              keyframes: (selectedClip.keyframes ?? [])
                .filter(
                  (
                    keyframe,
                  ): keyframe is StudioKeyframe & {
                    value: number | string | boolean;
                  } =>
                    typeof keyframe.value === "number" ||
                    typeof keyframe.value === "string" ||
                    typeof keyframe.value === "boolean",
                )
                .map<EditorKeyframe>((keyframe) => ({
                  id: keyframe.id,
                  trackId: selectedClip.id,
                  timeMs: keyframe.timeMs,
                  value: keyframe.value,
                  interpolation: toEditorInterpolation(
                    keyframe.interpolation,
                  ),
                  bezier: keyframe.curve
                    ? [
                        keyframe.curve.x1,
                        keyframe.curve.y1,
                        keyframe.curve.x2,
                        keyframe.curve.y2,
                      ]
                    : undefined,
                  metadata: {
                    property: keyframe.property,
                  },
                })),
            },
          ]
        : [];

      return (
        <PanelFrame
          title="Keyframe editor"
          panelId="keyframes"
          onClose={() =>
            actions.setPanelVisible("keyframes", false)
          }
          className="h-full border-t"
        >
          {selectedClip ? (
            <KeyframeEditor
              tracks={keyframeTracks}
              durationMs={selectedClip.durationMs}
              playheadMs={Math.max(
                0,
                state.timeline.playheadMs - selectedClip.startMs,
              )}
              fps={state.project.frameRate}
              disabled={disabled}
              onTracksChange={(tracks) => {
                const fromEditorInterpolation = (
                  interpolation: EditorKeyframeInterpolation,
                ): StudioKeyframe["interpolation"] => {
                  switch (interpolation) {
                    case "linear":
                      return "linear";
                    case "ease-in":
                      return "ease-in";
                    case "ease-out":
                      return "ease-out";
                    case "ease-in-out":
                      return "ease-in-out";
                    case "hold":
                      return "step";
                    case "bezier":
                      return "cubic-bezier";
                    default:
                      return "ease";
                  }
                };

                const nextKeyframes: StudioKeyframe[] =
                  tracks[0]?.keyframes.map((keyframe) => ({
                    id: keyframe.id,
                    clipId: selectedClip.id,
                    property:
                      typeof keyframe.metadata?.property ===
                      "string"
                        ? keyframe.metadata.property
                        : tracks[0]?.property ?? "value",
                    timeMs: keyframe.timeMs,
                    value: keyframe.value,
                    interpolation: fromEditorInterpolation(
                      keyframe.interpolation,
                    ),
                    curve: keyframe.bezier
                      ? {
                          x1: keyframe.bezier[0],
                          y1: keyframe.bezier[1],
                          x2: keyframe.bezier[2],
                          y2: keyframe.bezier[3],
                        }
                      : undefined,
                  })) ?? [];

                actions.updateClip(
                  selectedClip.id,
                  {
                    keyframes: nextKeyframes,
                  },
                  "Edit keyframes",
                );
              }}
              onPlayheadChange={(timeMs) =>
                actions.seek(selectedClip.startMs + timeMs)
              }
              onSelectionChange={(selectedIds) => {
                actions.setSelection({
                  ...state.selection,
                  keyframeIds: [...selectedIds],
                  primaryKeyframeId:
                    [...selectedIds][0] ?? null,
                });
              }}
              className="h-full border-0 rounded-none"
            />
          ) : (
            <LoadingPanel
              title="Select a clip"
              description="Choose a clip on the timeline to edit its animation keyframes."
            />
          )}
        </PanelFrame>
      );
    }

    return (
      <PanelFrame
        title="Timeline"
        panelId="timeline"
        onClose={() =>
          actions.setPanelVisible("timeline", false)
        }
        className="h-full border-t"
      >
        <Timeline
          tracks={timelineTracks}
          durationMs={state.timeline.durationMs}
          currentTimeMs={state.timeline.playheadMs}
          isPlaying={state.playback.isPlaying}
          selectedTrackId={selectedTimelineTrackId}
          selectedKeyframeIds={selectedTimelineKeyframeIds}
          initialZoom={Math.max(
            0.03,
            Math.min(1.5, state.timeline.zoom * 0.12),
          )}
          snapMs={
            state.timeline.snappingEnabled
              ? Math.max(
                  1,
                  Math.round(
                    1_000 / state.project.frameRate,
                  ),
                )
              : 0
          }
          disabled={disabled}
          onSeek={actions.seek}
          onTracksChange={handleTimelineTracksChange}
          onSelectionChange={handleTimelineSelection}
          onAddTrack={handleAddTrack}
          onAddKeyframe={handleAddTimelineItem}
          onDeleteSelection={(_, clipIds) => {
            clipIds.forEach((clipId) =>
              actions.removeClip(clipId),
            );
          }}
          onDuplicateSelection={(_, clipIds) => {
            clipIds.forEach((clipId, index) =>
              actions.duplicateClip(
                clipId,
                250 * (index + 1),
              ),
            );
          }}
          className="h-full border-0 rounded-none"
        />
      </PanelFrame>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`flex h-dvh min-h-[640px] w-full flex-col overflow-hidden bg-slate-950 text-slate-100 ${className}`}
    >
      <StudioHeader
        disabled={disabled}
        onExit={onExit}
        onPublish={onPublish}
        onOpenMobilePanels={() =>
          setMobilePanel((current) => (current ? null : "assets"))
        }
        onPanelDragStart={setDraggedPanel}
        onPanelDragEnd={() => setDraggedPanel(null)}
      />

      <StudioToolbar
        disabled={disabled}
        onOpenCampaign={() => {
          window.location.assign("/studio/create");
        }}
        onOpenUpload={() => {
          actions.setPanelVisible("assets", true);
          actions.setActivePanel("assets");
        }}
      />

      <main className="relative min-h-0 flex-1">
        <div className="flex h-full min-h-0">
          {visibleLeft ? (
            <>
              <div
                className="hidden min-h-0 shrink-0 lg:block"
                style={{
                  width: state.panels.assetPanelWidth,
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) =>
                  dropPanel(event, draggedPanel ?? "assets")
                }
              >
                <PanelFrame
                  title="Asset library"
                  panelId="assets"
                  onClose={() =>
                    actions.setPanelVisible("assets", false)
                  }
                  className="h-full border-r"
                >
                  <AssetLibrary
                    assets={libraryAssets}
                    selectedAssetIds={state.selection.assetIds}
                    disabled={disabled}
                    onUploadFiles={async (files, onProgress) => {
                      const created: LibraryAsset[] = [];

                      for (const file of files) {
                        onProgress(file, 15);
                        const url = URL.createObjectURL(file);
                        onProgress(file, 65);

                        const asset: LibraryAsset = {
                          id: createId("asset"),
                          name: file.name,
                          type: file.type.startsWith("image/")
                            ? "image"
                            : file.type.startsWith("video/")
                              ? "video"
                              : file.type.startsWith("audio/")
                                ? "audio"
                                : "unknown",
                          url,
                          mimeType: file.type,
                          sizeBytes: file.size,
                          createdAt: new Date().toISOString(),
                        };

                        actions.addAsset(toStudioAsset(asset));
                        created.push(asset);
                        onProgress(file, 100);
                      }

                      return created;
                    }}
                    onSelectionChange={(assetIds) =>
                      actions.setSelection({
                        ...state.selection,
                        assetIds,
                        primaryAssetId: assetIds[0] ?? null,
                      })
                    }
                    onInsertAsset={insertAsset}
                    onRenameAsset={(assetId, name) =>
                      actions.updateAsset(
                        assetId,
                        {
                          name,
                        },
                        "Rename asset",
                      )
                    }
                    onDeleteAssets={(assetIds) =>
                      assetIds.forEach((assetId) =>
                        actions.removeAsset(assetId),
                      )
                    }
                    onToggleFavourite={(assetId, favourite) =>
                      actions.updateAsset(
                        assetId,
                        {
                          favourite,
                        },
                        favourite
                          ? "Favourite asset"
                          : "Unfavourite asset",
                      )
                    }
                    className="h-full border-0 rounded-none"
                  />
                </PanelFrame>
              </div>

              <button
                type="button"
                aria-label="Resize asset panel"
                onPointerDown={(event) =>
                  beginResize("left", event)
                }
                className="relative z-20 hidden w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-cyan-400/40 lg:block"
              />
            </>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1">
              <StudioPreview externalPreview={preview} />

              {overlayPanel ? (
                <div className="absolute inset-4 z-30 overflow-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur">
                  <div className="mb-2 flex items-center justify-between px-2 py-1">
                    <h2 className="text-xs font-semibold text-white">
                      {panelLabel(overlayPanel)}
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        actions.setPanelVisible(
                          overlayPanel,
                          false,
                        )
                      }
                      className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-white/10 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  {overlayPanel === "voiceOver" ? (
                    <VoiceOverPanel
                      projectId={state.project.id}
                      playheadMs={state.timeline.playheadMs}
                      disabled={disabled}
                      initialAssets={state.assets
                        .filter((asset) => asset.kind === "voice")
                        .map((asset) => ({
                          id: asset.id,
                          name: asset.name,
                          url: asset.url,
                          durationMs: asset.durationMs ?? 0,
                          sizeBytes: asset.sizeBytes ?? 0,
                          mimeType:
                            asset.mimeType ?? "audio/unknown",
                          createdAt: asset.createdAt,
                          favourite: Boolean(asset.favourite),
                          status:
                            asset.status === "failed"
                              ? "error"
                              : "ready",
                          waveform:
                            Array.isArray(
                              asset.metadata?.waveform,
                            )
                              ? (asset.metadata
                                  ?.waveform as number[])
                              : [],
                        }))}
                      onAssetsChange={(assets) => {
                        assets.forEach((asset) => {
                          if (
                            !state.assets.some(
                              (item) => item.id === asset.id,
                            )
                          ) {
                            actions.addAsset(
                              voiceAssetToStudioAsset(asset),
                            );
                          }
                        });
                      }}
                      onAddClip={handleVoiceClip}
                      onDeleteAsset={(asset) =>
                        actions.removeAsset(asset.id)
                      }
                      className="border-0 shadow-none"
                    />
                  ) : (
                    <RecordingToolbar
                      projectId={state.project.id}
                      playheadMs={state.timeline.playheadMs}
                      disabled={disabled}
                      onRecordingCreated={(recording) => {
                        if (
                          !state.assets.some(
                            (asset) =>
                              asset.id === recording.id,
                          )
                        ) {
                          actions.addAsset(
                            recordingToStudioAsset(recording),
                          );
                        }
                      }}
                      onAddToTimeline={handleRecordingClip}
                      className="border-0 shadow-none"
                    />
                  )}
                </div>
              ) : null}
            </div>

            {visibleBottom && bottomPanel ? (
              <>
                <button
                  type="button"
                  aria-label="Resize timeline"
                  onPointerDown={(event) =>
                    beginResize("timeline", event)
                  }
                  className="relative z-20 h-1 shrink-0 cursor-row-resize bg-transparent hover:bg-cyan-400/40"
                />
                <div
                  className="min-h-0 shrink-0"
                  style={{
                    height: state.panels.timelineHeight,
                  }}
                  onDragOver={(event) =>
                    event.preventDefault()
                  }
                  onDrop={(event) =>
                    dropPanel(
                      event,
                      draggedPanel ?? bottomPanel,
                    )
                  }
                >
                  {renderBottomPanel()}
                </div>
              </>
            ) : null}
          </div>

          {visibleRight && rightPanel ? (
            <>
              <button
                type="button"
                aria-label="Resize inspector panel"
                onPointerDown={(event) =>
                  beginResize("right", event)
                }
                className="relative z-20 hidden w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-cyan-400/40 lg:block"
              />
              <div
                className="hidden min-h-0 shrink-0 lg:block"
                style={{
                  width: state.panels.inspectorWidth,
                }}
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onDrop={(event) =>
                  dropPanel(
                    event,
                    draggedPanel ?? rightPanel,
                  )
                }
              >
                <div className="flex h-9 items-center gap-1 overflow-x-auto border-b border-white/10 bg-slate-900 px-2">
                  {(
                    [
                      "inspector",
                      "history",
                      "renderQueue",
                      "curves",
                    ] as StudioPanelId[]
                  ).map((panelId) => {
                    if (!state.panels.visible[panelId]) {
                      return null;
                    }

                    return (
                      <button
                        key={panelId}
                        type="button"
                        onClick={() =>
                          actions.setActivePanel(panelId)
                        }
                        className={`shrink-0 rounded px-2 py-1 text-[10px] ${
                          rightPanel === panelId
                            ? "bg-cyan-400/10 text-cyan-100"
                            : "text-slate-500 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {panelLabel(panelId)}
                      </button>
                    );
                  })}
                </div>
                <div className="h-[calc(100%-2.25rem)]">
                  {renderRightPanel()}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {mobilePanel ? (
          <div className="absolute inset-0 z-50 bg-slate-950/95 p-3 lg:hidden">
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950">
              <div className="flex items-center justify-between border-b border-white/10 p-3">
                <select
                  value={mobilePanel}
                  onChange={(event) =>
                    setMobilePanel(
                      event.target.value as StudioPanelId,
                    )
                  }
                  className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  {PANEL_DEFINITIONS.map((panel) => (
                    <option key={panel.id} value={panel.id}>
                      {panel.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setMobilePanel(null)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                {mobilePanel === "assets" ? (
                  <AssetLibrary
                    assets={libraryAssets}
                    selectedAssetIds={state.selection.assetIds}
                    onSelectionChange={(ids) =>
                      actions.setSelection({
                        ...state.selection,
                        assetIds: ids,
                        primaryAssetId: ids[0] ?? null,
                      })
                    }
                    onInsertAsset={insertAsset}
                    className="h-full border-0 rounded-none"
                  />
                ) : mobilePanel === "timeline" ? (
                  renderBottomPanel()
                ) : mobilePanel === "keyframes" ? (
                  renderBottomPanel()
                ) : mobilePanel === "voiceOver" ? (
                  <VoiceOverPanel
                    projectId={state.project.id}
                    playheadMs={state.timeline.playheadMs}
                    onAddClip={handleVoiceClip}
                    className="border-0 rounded-none"
                  />
                ) : mobilePanel === "recording" ? (
                  <RecordingToolbar
                    projectId={state.project.id}
                    playheadMs={state.timeline.playheadMs}
                    onRecordingCreated={(recording) =>
                      actions.addAsset(
                        recordingToStudioAsset(recording),
                      )
                    }
                    onAddToTimeline={handleRecordingClip}
                    className="border-0 rounded-none"
                  />
                ) : (
                  renderRightPanel()
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <StudioFooter resizing={Boolean(resizeState)} />
    </div>
  );
}
