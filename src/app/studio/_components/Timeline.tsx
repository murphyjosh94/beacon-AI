"use client";

import {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type TimelineTrackType =
  | "camera"
  | "text"
  | "image"
  | "video"
  | "audio"
  | "effect"
  | "interaction"
  | string;

export type TimelineActionType =
  | "scroll"
  | "highlight"
  | "click"
  | "type"
  | "wait"
  | "zoom"
  | "pan"
  | "custom"
  | string;

export type TimelineKeyframe = {
  id: string;
  timeMs: number;
  durationMs?: number;
  label?: string;
  action?: TimelineActionType;
  selector?: string;
  value?: string | number | boolean | null;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
};

export type TimelineTrack = {
  id: string;
  name: string;
  type: TimelineTrackType;
  muted?: boolean;
  locked?: boolean;
  hidden?: boolean;
  colour?: string;
  keyframes: TimelineKeyframe[];
};

export type TimelineChange = {
  tracks: TimelineTrack[];
  selectedTrackId: string | null;
  selectedKeyframeIds: string[];
};

export type TimelineProps = {
  tracks: TimelineTrack[];
  durationMs: number;
  currentTimeMs: number;
  isPlaying?: boolean;
  selectedTrackId?: string | null;
  selectedKeyframeIds?: string[];
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  snapMs?: number;
  rowHeight?: number;
  headerWidth?: number;
  disabled?: boolean;
  className?: string;
  onSeek?: (timeMs: number) => void;
  onTracksChange?: (tracks: TimelineTrack[]) => void;
  onSelectionChange?: (selection: TimelineChange) => void;
  onAddTrack?: () => void;
  onAddKeyframe?: (trackId: string, timeMs: number) => void;
  onDeleteSelection?: (
    trackId: string | null,
    keyframeIds: string[],
  ) => void;
  onDuplicateSelection?: (
    trackId: string | null,
    keyframeIds: string[],
  ) => void;
};

type DragMode = "move" | "resize-start" | "resize-end";

type DragState = {
  pointerId: number;
  trackId: string;
  keyframeId: string;
  mode: DragMode;
  originClientX: number;
  originTimeMs: number;
  originDurationMs: number;
};

const DEFAULT_ROW_HEIGHT = 54;
const DEFAULT_HEADER_WIDTH = 220;
const DEFAULT_SNAP_MS = 100;
const DEFAULT_INITIAL_ZOOM = 0.12;
const DEFAULT_MIN_ZOOM = 0.03;
const DEFAULT_MAX_ZOOM = 1.5;
const MIN_KEYFRAME_DURATION_MS = 100;
const TIMELINE_PADDING_PX = 32;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function roundToSnap(value: number, snapMs: number) {
  if (snapMs <= 0) {
    return Math.round(value);
  }

  return Math.round(value / snapMs) * snapMs;
}

function formatTime(milliseconds: number) {
  const safe = Math.max(0, Math.round(milliseconds));
  const totalSeconds = safe / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((safe % 1000) / 100);

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getTrackGlyph(type: TimelineTrackType) {
  switch (type) {
    case "camera":
      return "◉";
    case "text":
      return "T";
    case "image":
      return "▧";
    case "video":
      return "▶";
    case "audio":
      return "♪";
    case "effect":
      return "✦";
    case "interaction":
      return "↗";
    default:
      return "●";
  }
}

function getTickStep(zoom: number) {
  if (zoom >= 0.8) return 100;
  if (zoom >= 0.45) return 250;
  if (zoom >= 0.22) return 500;
  if (zoom >= 0.1) return 1000;
  if (zoom >= 0.055) return 2000;
  return 5000;
}

export default function Timeline({
  tracks,
  durationMs,
  currentTimeMs,
  isPlaying = false,
  selectedTrackId: controlledSelectedTrackId = null,
  selectedKeyframeIds: controlledSelectedKeyframeIds = [],
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  initialZoom = DEFAULT_INITIAL_ZOOM,
  snapMs = DEFAULT_SNAP_MS,
  rowHeight = DEFAULT_ROW_HEIGHT,
  headerWidth = DEFAULT_HEADER_WIDTH,
  disabled = false,
  className = "",
  onSeek,
  onTracksChange,
  onSelectionChange,
  onAddTrack,
  onAddKeyframe,
  onDeleteSelection,
  onDuplicateSelection,
}: TimelineProps) {
  const [zoom, setZoom] = useState(() =>
    clamp(initialZoom, minZoom, maxZoom),
  );
  const [internalTracks, setInternalTracks] = useState(tracks);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    controlledSelectedTrackId,
  );
  const [selectedKeyframeIds, setSelectedKeyframeIds] = useState<string[]>(
    controlledSelectedKeyframeIds,
  );
  const [dragState, setDragState] = useState<DragState | null>(null);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const tracksRef = useRef(internalTracks);

  useEffect(() => {
    setInternalTracks(tracks);
  }, [tracks]);

  useEffect(() => {
    tracksRef.current = internalTracks;
  }, [internalTracks]);

  useEffect(() => {
    setSelectedTrackId(controlledSelectedTrackId);
  }, [controlledSelectedTrackId]);

  useEffect(() => {
    setSelectedKeyframeIds(controlledSelectedKeyframeIds);
  }, [controlledSelectedKeyframeIds]);

  const safeDurationMs = Math.max(1000, durationMs);
  const timelineWidth = Math.max(
    safeDurationMs * zoom + TIMELINE_PADDING_PX * 2,
    700,
  );

  const tickStepMs = getTickStep(zoom);
  const rulerTicks = useMemo(() => {
    const ticks: number[] = [];

    for (let time = 0; time <= safeDurationMs; time += tickStepMs) {
      ticks.push(time);
    }

    if (ticks[ticks.length - 1] !== safeDurationMs) {
      ticks.push(safeDurationMs);
    }

    return ticks;
  }, [safeDurationMs, tickStepMs]);

  const emitSelection = useCallback(
    (
      nextTrackId: string | null,
      nextKeyframeIds: string[],
      nextTracks = tracksRef.current,
    ) => {
      setSelectedTrackId(nextTrackId);
      setSelectedKeyframeIds(nextKeyframeIds);

      onSelectionChange?.({
        tracks: nextTracks,
        selectedTrackId: nextTrackId,
        selectedKeyframeIds: nextKeyframeIds,
      });
    },
    [onSelectionChange],
  );

  const commitTracks = useCallback(
    (nextTracks: TimelineTrack[]) => {
      tracksRef.current = nextTracks;
      setInternalTracks(nextTracks);
      onTracksChange?.(nextTracks);
    },
    [onTracksChange],
  );

  const updateTrack = useCallback(
    (
      trackId: string,
      updater: (track: TimelineTrack) => TimelineTrack,
    ) => {
      const nextTracks = tracksRef.current.map((track) =>
        track.id === trackId ? updater(track) : track,
      );

      commitTracks(nextTracks);
    },
    [commitTracks],
  );

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const content = contentRef.current;

      if (!content) {
        return;
      }

      const rect = content.getBoundingClientRect();
      const rawTime =
        (clientX - rect.left - TIMELINE_PADDING_PX) / zoom;
      const nextTime = clamp(
        roundToSnap(rawTime, snapMs),
        0,
        safeDurationMs,
      );

      onSeek?.(nextTime);
    },
    [onSeek, safeDurationMs, snapMs, zoom],
  );

  const handleRulerPointerDown = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (disabled || event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromClientX(event.clientX);
  };

  const handleRulerPointerMove = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (
      disabled ||
      !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return;
    }

    seekFromClientX(event.clientX);
  };

  const handleKeyframePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    track: TimelineTrack,
    keyframe: TimelineKeyframe,
    mode: DragMode,
  ) => {
    if (disabled || track.locked || event.button !== 0) {
      return;
    }

    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const shouldToggle = event.metaKey || event.ctrlKey;
    const alreadySelected = selectedKeyframeIds.includes(keyframe.id);

    let nextSelectedIds: string[];

    if (shouldToggle) {
      nextSelectedIds = alreadySelected
        ? selectedKeyframeIds.filter((id) => id !== keyframe.id)
        : [...selectedKeyframeIds, keyframe.id];
    } else if (alreadySelected) {
      nextSelectedIds = selectedKeyframeIds;
    } else {
      nextSelectedIds = [keyframe.id];
    }

    emitSelection(track.id, nextSelectedIds);

    setDragState({
      pointerId: event.pointerId,
      trackId: track.id,
      keyframeId: keyframe.id,
      mode,
      originClientX: event.clientX,
      originTimeMs: keyframe.timeMs,
      originDurationMs: Math.max(
        keyframe.durationMs ?? tickStepMs,
        MIN_KEYFRAME_DURATION_MS,
      ),
    });
  };

  const handleKeyframePointerMove = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (
      !dragState ||
      event.pointerId !== dragState.pointerId ||
      disabled
    ) {
      return;
    }

    event.preventDefault();

    const deltaMs = (event.clientX - dragState.originClientX) / zoom;

    updateTrack(dragState.trackId, (track) => ({
      ...track,
      keyframes: track.keyframes.map((keyframe) => {
        if (keyframe.id !== dragState.keyframeId) {
          return keyframe;
        }

        if (dragState.mode === "resize-start") {
          const originalEnd =
            dragState.originTimeMs + dragState.originDurationMs;
          const nextStart = clamp(
            roundToSnap(dragState.originTimeMs + deltaMs, snapMs),
            0,
            originalEnd - MIN_KEYFRAME_DURATION_MS,
          );

          return {
            ...keyframe,
            timeMs: nextStart,
            durationMs: originalEnd - nextStart,
          };
        }

        if (dragState.mode === "resize-end") {
          const nextDuration = clamp(
            roundToSnap(dragState.originDurationMs + deltaMs, snapMs),
            MIN_KEYFRAME_DURATION_MS,
            safeDurationMs - dragState.originTimeMs,
          );

          return {
            ...keyframe,
            durationMs: nextDuration,
          };
        }

        return {
          ...keyframe,
          timeMs: clamp(
            roundToSnap(dragState.originTimeMs + deltaMs, snapMs),
            0,
            Math.max(
              0,
              safeDurationMs - dragState.originDurationMs,
            ),
          ),
        };
      }),
    }));
  };

  const endDrag = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragState(null);
  };

  const handleTrackClick = (
    event: MouseEvent<HTMLDivElement>,
    track: TimelineTrack,
  ) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    emitSelection(track.id, []);
  };

  const handleTrackDoubleClick = (
    event: MouseEvent<HTMLDivElement>,
    track: TimelineTrack,
  ) => {
    if (disabled || track.locked) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const timeMs = clamp(
      roundToSnap(
        (event.clientX - rect.left - TIMELINE_PADDING_PX) / zoom,
        snapMs,
      ),
      0,
      safeDurationMs,
    );

    if (onAddKeyframe) {
      onAddKeyframe(track.id, timeMs);
      return;
    }

    const nextKeyframe: TimelineKeyframe = {
      id: createId("keyframe"),
      timeMs,
      durationMs: Math.max(tickStepMs, 500),
      label: "New action",
      action: "custom",
    };

    updateTrack(track.id, (currentTrack) => ({
      ...currentTrack,
      keyframes: [...currentTrack.keyframes, nextKeyframe].sort(
        (first, second) => first.timeMs - second.timeMs,
      ),
    }));

    emitSelection(track.id, [nextKeyframe.id]);
  };

  const deleteSelection = useCallback(() => {
    if (disabled || selectedKeyframeIds.length === 0) {
      return;
    }

    if (onDeleteSelection) {
      onDeleteSelection(selectedTrackId, selectedKeyframeIds);
      return;
    }

    const selected = new Set(selectedKeyframeIds);
    const nextTracks = tracksRef.current.map((track) => ({
      ...track,
      keyframes: track.keyframes.filter(
        (keyframe) => !selected.has(keyframe.id),
      ),
    }));

    commitTracks(nextTracks);
    emitSelection(selectedTrackId, [], nextTracks);
  }, [
    commitTracks,
    disabled,
    emitSelection,
    onDeleteSelection,
    selectedKeyframeIds,
    selectedTrackId,
  ]);

  const duplicateSelection = useCallback(() => {
    if (disabled || selectedKeyframeIds.length === 0) {
      return;
    }

    if (onDuplicateSelection) {
      onDuplicateSelection(selectedTrackId, selectedKeyframeIds);
      return;
    }

    const selected = new Set(selectedKeyframeIds);
    const createdIds: string[] = [];

    const nextTracks = tracksRef.current.map((track) => {
      const copies = track.keyframes
        .filter((keyframe) => selected.has(keyframe.id))
        .map((keyframe) => {
          const id = createId("keyframe");
          createdIds.push(id);

          return {
            ...keyframe,
            id,
            timeMs: clamp(
              keyframe.timeMs + Math.max(snapMs, 250),
              0,
              safeDurationMs -
                Math.max(
                  keyframe.durationMs ?? MIN_KEYFRAME_DURATION_MS,
                  MIN_KEYFRAME_DURATION_MS,
                ),
            ),
            label: keyframe.label
              ? `${keyframe.label} copy`
              : "Copy",
          };
        });

      return copies.length === 0
        ? track
        : {
            ...track,
            keyframes: [...track.keyframes, ...copies].sort(
              (first, second) => first.timeMs - second.timeMs,
            ),
          };
    });

    commitTracks(nextTracks);
    emitSelection(selectedTrackId, createdIds, nextTracks);
  }, [
    commitTracks,
    disabled,
    emitSelection,
    onDuplicateSelection,
    safeDurationMs,
    selectedKeyframeIds,
    selectedTrackId,
    snapMs,
  ]);

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    const target = event.target as HTMLElement;

    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelection();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateSelection();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      onSeek?.(
        clamp(
          currentTimeMs + direction * Math.max(snapMs, 100),
          0,
          safeDurationMs,
        ),
      );
    }
  };

  const toggleTrackFlag = (
    trackId: string,
    flag: "muted" | "locked" | "hidden",
  ) => {
    if (disabled) {
      return;
    }

    updateTrack(trackId, (track) => ({
      ...track,
      [flag]: !track[flag],
    }));
  };

  const zoomAroundPlayhead = (nextZoom: number) => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      setZoom(clamp(nextZoom, minZoom, maxZoom));
      return;
    }

    const clampedZoom = clamp(nextZoom, minZoom, maxZoom);
    const playheadViewportX =
      TIMELINE_PADDING_PX +
      currentTimeMs * zoom -
      scroller.scrollLeft;

    setZoom(clampedZoom);

    requestAnimationFrame(() => {
      scroller.scrollLeft = Math.max(
        0,
        TIMELINE_PADDING_PX +
          currentTimeMs * clampedZoom -
          playheadViewportX,
      );
    });
  };

  const containerStyle: CSSProperties = {
    "--timeline-header-width": `${headerWidth}px`,
    "--timeline-row-height": `${rowHeight}px`,
  } as CSSProperties;

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      style={containerStyle}
      aria-label="Beacon Studio timeline"
      tabIndex={0}
      onKeyDown={handleKeyboard}
    >
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 bg-slate-900/95 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onAddTrack}
            disabled={disabled || !onAddTrack}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add track
          </button>

          <button
            type="button"
            onClick={duplicateSelection}
            disabled={disabled || selectedKeyframeIds.length === 0}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Duplicate
          </button>

          <button
            type="button"
            onClick={deleteSelection}
            disabled={disabled || selectedKeyframeIds.length === 0}
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-400 sm:inline">
            {isPlaying ? "Playing" : "Paused"} · {formatTime(currentTimeMs)}
          </span>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            Zoom
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.01}
              value={zoom}
              disabled={disabled}
              onChange={(event) =>
                zoomAroundPlayhead(Number(event.target.value))
              }
              className="w-24 accent-cyan-400 sm:w-36"
              aria-label="Timeline zoom"
            />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-[var(--timeline-header-width)_minmax(0,1fr)]">
        <div className="z-20 border-r border-white/10 bg-slate-900">
          <div className="flex h-10 items-center border-b border-white/10 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Tracks
          </div>

          {internalTracks.map((track) => {
            const selected = track.id === selectedTrackId;

            return (
              <div
                key={track.id}
                className={`flex h-[var(--timeline-row-height)] items-center gap-2 border-b border-white/5 px-2 ${
                  selected ? "bg-cyan-400/10" : "bg-slate-900"
                }`}
              >
                <button
                  type="button"
                  onClick={() => emitSelection(track.id, [])}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-white/5"
                  title={track.name}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-bold"
                    aria-hidden="true"
                  >
                    {getTrackGlyph(track.type)}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {track.name}
                    </span>
                    <span className="block truncate text-[10px] uppercase tracking-wider text-slate-500">
                      {track.type}
                    </span>
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleTrackFlag(track.id, "muted")}
                    className={`h-7 w-7 rounded text-xs transition hover:bg-white/10 ${
                      track.muted ? "text-amber-300" : "text-slate-500"
                    }`}
                    title={track.muted ? "Unmute track" : "Mute track"}
                    aria-label={track.muted ? "Unmute track" : "Mute track"}
                  >
                    {track.muted ? "M" : "m"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleTrackFlag(track.id, "locked")}
                    className={`h-7 w-7 rounded text-xs transition hover:bg-white/10 ${
                      track.locked ? "text-amber-300" : "text-slate-500"
                    }`}
                    title={track.locked ? "Unlock track" : "Lock track"}
                    aria-label={track.locked ? "Unlock track" : "Lock track"}
                  >
                    {track.locked ? "●" : "○"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleTrackFlag(track.id, "hidden")}
                    className={`h-7 w-7 rounded text-xs transition hover:bg-white/10 ${
                      track.hidden ? "text-slate-600" : "text-slate-400"
                    }`}
                    title={track.hidden ? "Show track" : "Hide track"}
                    aria-label={track.hidden ? "Show track" : "Hide track"}
                  >
                    {track.hidden ? "–" : "◇"}
                  </button>
                </div>
              </div>
            );
          })}

          {internalTracks.length === 0 && (
            <div className="flex h-28 items-center justify-center px-4 text-center text-sm text-slate-500">
              Add a track to begin building the timeline.
            </div>
          )}
        </div>

        <div
          ref={scrollerRef}
          className="relative min-w-0 overflow-auto bg-slate-950"
        >
          <div
            ref={contentRef}
            className="relative"
            style={{
              width: timelineWidth,
              minHeight: 40 + internalTracks.length * rowHeight,
            }}
          >
            <div
              className="sticky top-0 z-10 h-10 cursor-crosshair border-b border-white/10 bg-slate-900/95 backdrop-blur"
              onPointerDown={handleRulerPointerDown}
              onPointerMove={handleRulerPointerMove}
            >
              {rulerTicks.map((timeMs) => {
                const left = TIMELINE_PADDING_PX + timeMs * zoom;

                return (
                  <div
                    key={timeMs}
                    className="absolute inset-y-0 border-l border-white/15"
                    style={{ left }}
                  >
                    <span className="absolute left-1 top-1 text-[10px] tabular-nums text-slate-500">
                      {formatTime(timeMs)}
                    </span>
                  </div>
                );
              })}
            </div>

            {internalTracks.map((track, trackIndex) => (
              <div
                key={track.id}
                className={`relative border-b border-white/5 ${
                  track.id === selectedTrackId
                    ? "bg-cyan-400/[0.035]"
                    : trackIndex % 2 === 0
                      ? "bg-white/[0.012]"
                      : ""
                }`}
                style={{ height: rowHeight }}
                onClick={(event) => handleTrackClick(event, track)}
                onDoubleClick={(event) =>
                  handleTrackDoubleClick(event, track)
                }
              >
                {rulerTicks.map((timeMs) => (
                  <div
                    key={`${track.id}-${timeMs}`}
                    className="pointer-events-none absolute inset-y-0 border-l border-white/[0.045]"
                    style={{
                      left: TIMELINE_PADDING_PX + timeMs * zoom,
                    }}
                  />
                ))}

                {track.keyframes.map((keyframe) => {
                  const duration = Math.max(
                    keyframe.durationMs ?? tickStepMs,
                    MIN_KEYFRAME_DURATION_MS,
                  );
                  const selected = selectedKeyframeIds.includes(keyframe.id);
                  const width = Math.max(duration * zoom, 18);
                  const left = TIMELINE_PADDING_PX + keyframe.timeMs * zoom;

                  return (
                    <button
                      key={keyframe.id}
                      type="button"
                      disabled={disabled || track.locked}
                      className={`group absolute top-2 flex h-[calc(var(--timeline-row-height)-16px)] min-w-[18px] cursor-grab items-center overflow-hidden rounded-md border text-left shadow-sm outline-none transition active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected
                          ? "border-cyan-300 bg-cyan-400/25 ring-2 ring-cyan-400/25"
                          : "border-white/15 bg-slate-700/80 hover:border-white/30 hover:bg-slate-700"
                      } ${keyframe.disabled ? "opacity-40" : ""}`}
                      style={{
                        left,
                        width,
                        borderLeftColor: track.colour,
                      }}
                      title={`${keyframe.label ?? keyframe.action ?? "Keyframe"} at ${formatTime(
                        keyframe.timeMs,
                      )}`}
                      onPointerDown={(event) =>
                        handleKeyframePointerDown(
                          event,
                          track,
                          keyframe,
                          "move",
                        )
                      }
                      onPointerMove={handleKeyframePointerMove}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                    >
                      <span
                        className="absolute inset-y-0 left-0 z-10 w-2 cursor-ew-resize bg-white/0 group-hover:bg-white/10"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          handleKeyframePointerDown(
                            event as unknown as PointerEvent<HTMLButtonElement>,
                            track,
                            keyframe,
                            "resize-start",
                          );
                        }}
                        aria-hidden="true"
                      />

                      <span className="pointer-events-none min-w-0 flex-1 truncate px-3 text-xs font-medium">
                        {keyframe.label ?? keyframe.action ?? "Action"}
                      </span>

                      <span
                        className="absolute inset-y-0 right-0 z-10 w-2 cursor-ew-resize bg-white/0 group-hover:bg-white/10"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          handleKeyframePointerDown(
                            event as unknown as PointerEvent<HTMLButtonElement>,
                            track,
                            keyframe,
                            "resize-end",
                          );
                        }}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            ))}

            <div
              className="pointer-events-none absolute bottom-0 top-0 z-30 w-px bg-rose-400 shadow-[0_0_0_1px_rgba(251,113,133,0.15)]"
              style={{
                left:
                  TIMELINE_PADDING_PX +
                  clamp(currentTimeMs, 0, safeDurationMs) * zoom,
              }}
              aria-hidden="true"
            >
              <div className="absolute -left-1.5 top-0 h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-rose-400" />
            </div>
          </div>
        </div>
      </div>

      <footer className="flex min-h-9 items-center justify-between border-t border-white/10 bg-slate-900 px-3 text-[11px] text-slate-500">
        <span>
          {internalTracks.length} track
          {internalTracks.length === 1 ? "" : "s"} ·{" "}
          {internalTracks.reduce(
            (total, track) => total + track.keyframes.length,
            0,
          )}{" "}
          keyframes
        </span>

        <span>
          Snap {snapMs} ms · Duration {formatTime(safeDurationMs)}
        </span>
      </footer>
    </section>
  );
}