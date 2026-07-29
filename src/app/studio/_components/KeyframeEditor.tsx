"use client";

import {
  KeyboardEvent,
  PointerEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import InterpolationPanel from "./InterpolationPanel";
import KeyframeCanvas from "./KeyframeCanvas";
import { KeyframeDragEngine } from "./KeyframeDragEngine";
import {
  KeyframeSelectionController,
  KeyframeScreenPosition,
  MarqueeSelection,
} from "./KeyframeSelection";
import {
  createKeyframeId,
  deleteKeyframesFromTracks,
  duplicateKeyframes,
  formatTimecode,
  insertKeyframesIntoTracks,
  Keyframe,
  KeyframeEditorSnapshot,
  KeyframeInterpolation,
  KeyframeTrack,
  SnapSettings,
  TimelineMarker,
  updateKeyframesInTracks,
} from "./KeyframeUtils";

export type KeyframeEditorProps = {
  tracks: KeyframeTrack[];
  durationMs: number;
  playheadMs: number;
  fps?: number;
  markers?: TimelineMarker[];
  disabled?: boolean;
  className?: string;
  snapSettings?: Partial<SnapSettings>;
  onTracksChange: (
    tracks: KeyframeTrack[],
    context?: {
      label: string;
      before: KeyframeEditorSnapshot;
      after: KeyframeEditorSnapshot;
      groupId?: string;
    },
  ) => void;
  onPlayheadChange?: (timeMs: number) => void;
  onSelectionChange?: (selectedIds: Set<string>) => void;
};

const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  enabled: true,
  frames: true,
  markers: true,
  keyframes: true,
  thresholdPx: 8,
};

export default function KeyframeEditor({
  tracks,
  durationMs,
  playheadMs,
  fps = 30,
  markers = [],
  disabled = false,
  className = "",
  snapSettings,
  onTracksChange,
  onPlayheadChange,
  onSelectionChange,
}: KeyframeEditorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(
    tracks[0]?.id ?? null,
  );
  const [dragging, setDragging] = useState(false);
  const [localTracks, setLocalTracks] = useState<KeyframeTrack[]>(tracks);

  const selectionRef = useRef(new KeyframeSelectionController());
  const dragEngineRef = useRef(new KeyframeDragEngine());
  const dragBeforeRef = useRef<KeyframeEditorSnapshot | null>(null);
  const pointerTargetRef = useRef<HTMLElement | null>(null);

  const settings: SnapSettings = {
    ...DEFAULT_SNAP_SETTINGS,
    ...snapSettings,
  };

  const selectedKeyframes = useMemo(
    () =>
      localTracks.flatMap((track) =>
        track.keyframes.filter((keyframe) => selectedIds.has(keyframe.id)),
      ),
    [localTracks, selectedIds],
  );

  const publishSelection = (ids: Set<string>) => {
    const next = new Set(ids);
    setSelectedIds(next);
    onSelectionChange?.(next);
  };

  const commitTracks = (
    nextTracks: KeyframeTrack[],
    label: string,
    beforeTracks = localTracks,
    groupId?: string,
  ) => {
    const before: KeyframeEditorSnapshot = {
      tracks: beforeTracks,
      durationMs,
      playheadMs,
    };
    const after: KeyframeEditorSnapshot = {
      tracks: nextTracks,
      durationMs,
      playheadMs,
    };

    setLocalTracks(nextTracks);
    onTracksChange(nextTracks, {
      label,
      before,
      after,
      groupId,
    });
  };

  const addKeyframe = () => {
    const track =
      localTracks.find((item) => item.id === activeTrackId) ?? localTracks[0];

    if (!track || track.locked) return;

    const fallbackValue =
      track.keyframes.findLast((item) => item.timeMs <= playheadMs)?.value ??
      track.min ??
      0;

    const keyframe: Keyframe = {
      id: createKeyframeId(),
      trackId: track.id,
      timeMs: playheadMs,
      value: fallbackValue,
      interpolation: "ease-in-out",
    };

    const next = insertKeyframesIntoTracks(localTracks, [keyframe]);
    selectionRef.current.setSelection([keyframe.id]);
    publishSelection(new Set([keyframe.id]));
    commitTracks(next, `Add ${track.name} keyframe`);
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;

    const next = deleteKeyframesFromTracks(localTracks, selectedIds);
    commitTracks(next, `Delete ${selectedIds.size} keyframe${selectedIds.size === 1 ? "" : "s"}`);
    selectionRef.current.clear();
    publishSelection(new Set());
  };

  const duplicateSelected = () => {
    const duplicates = duplicateKeyframes(
      selectedKeyframes,
      1000 / fps,
      durationMs,
    );
    if (duplicates.length === 0) return;

    const next = insertKeyframesIntoTracks(localTracks, duplicates);
    selectionRef.current.setSelection(duplicates.map((item) => item.id));
    publishSelection(new Set(duplicates.map((item) => item.id)));
    commitTracks(next, "Duplicate keyframes");
  };

  const copySelected = () => {
    selectionRef.current.copy(localTracks);
  };

  const paste = () => {
    const pasted = selectionRef.current.paste(1000 / fps, durationMs);
    if (pasted.length === 0) return;

    const next = insertKeyframesIntoTracks(localTracks, pasted);
    publishSelection(selectionRef.current.getSelection());
    commitTracks(next, "Paste keyframes");
  };

  const updateInterpolation = (updates: Keyframe[]) => {
    const next = updateKeyframesInTracks(localTracks, updates);
    commitTracks(next, "Change interpolation");
  };

  const updateExactTime = (value: number) => {
    if (selectedKeyframes.length === 0) return;

    const firstTime = selectedKeyframes[0].timeMs;
    const delta = value - firstTime;
    const updates = selectedKeyframes.map((keyframe) => ({
      ...keyframe,
      timeMs: Math.min(Math.max(keyframe.timeMs + delta, 0), durationMs),
    }));

    const next = updateKeyframesInTracks(localTracks, updates);
    commitTracks(next, "Edit keyframe time");
  };

  const updateExactValue = (value: string) => {
    if (selectedKeyframes.length === 0) return;

    const updates = selectedKeyframes.map((keyframe) => {
      const numeric = typeof keyframe.value === "number";

      return {
        ...keyframe,
        value: numeric && value.trim() !== "" ? Number(value) : value,
      };
    });

    const next = updateKeyframesInTracks(localTracks, updates);
    commitTracks(next, "Edit keyframe value");
  };

  const handleKeyframePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    keyframe: Keyframe,
    track: KeyframeTrack,
  ) => {
    if (disabled || track.locked) return;

    event.preventDefault();
    event.stopPropagation();

    let nextSelection: Set<string>;

    if (event.shiftKey) {
      nextSelection = selectionRef.current.selectRange(track, keyframe.id);
    } else if (event.metaKey || event.ctrlKey) {
      nextSelection = selectionRef.current.toggle(keyframe.id);
    } else if (!selectionRef.current.has(keyframe.id)) {
      nextSelection = selectionRef.current.selectOnly(keyframe.id);
    } else {
      nextSelection = selectionRef.current.getSelection();
    }

    publishSelection(nextSelection);
    setActiveTrackId(track.id);

    const selected = localTracks.flatMap((item) =>
      item.keyframes.filter((candidate) => nextSelection.has(candidate.id)),
    );

    dragBeforeRef.current = {
      tracks: localTracks,
      durationMs,
      playheadMs,
    };

    dragEngineRef.current.start({
      pointerX: event.clientX,
      pointerY: event.clientY,
      selectedKeyframes: selected,
      tracks: localTracks,
      durationMs,
      viewportWidth: 1200,
      zoom,
      fps,
      markers,
      snapSettings: settings,
      mode: event.altKey ? "time-and-value" : "time",
    });

    pointerTargetRef.current = event.currentTarget;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);

    const move = (moveEvent: globalThis.PointerEvent) => {
      const update = dragEngineRef.current.update(
        moveEvent.clientX,
        moveEvent.clientY,
      );
      setLocalTracks((current) =>
        updateKeyframesInTracks(current, update.keyframes),
      );
    };

    const finish = (upEvent: globalThis.PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);

      if (
        pointerTargetRef.current &&
        "releasePointerCapture" in pointerTargetRef.current
      ) {
        try {
          (pointerTargetRef.current as HTMLElement).releasePointerCapture(
            upEvent.pointerId,
          );
        } catch {
          // Capture may already be released by the browser.
        }
      }

      dragEngineRef.current.finish();
      setDragging(false);

      const before = dragBeforeRef.current;
      dragBeforeRef.current = null;

      if (before) {
        onTracksChange(localTracks, {
          label: "Move keyframes",
          before,
          after: {
            tracks: localTracks,
            durationMs,
            playheadMs,
          },
          groupId: "keyframe-drag",
        });
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
  };

  const handleMarqueeSelect = (
    marquee: MarqueeSelection,
    positions: KeyframeScreenPosition[],
    additive: boolean,
  ) => {
    const next = selectionRef.current.selectMarquee(
      marquee,
      positions,
      additive,
    );
    publishSelection(next);
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;

    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable
    ) {
      return;
    }

    const modifier = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelected();
      return;
    }

    if (modifier && key === "c") {
      event.preventDefault();
      copySelected();
      return;
    }

    if (modifier && key === "v") {
      event.preventDefault();
      paste();
      return;
    }

    if (modifier && key === "d") {
      event.preventDefault();
      duplicateSelected();
      return;
    }

    if (modifier && key === "a") {
      event.preventDefault();
      const next = selectionRef.current.selectAll(localTracks);
      publishSelection(next);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      const amount = (1000 / fps) * (event.shiftKey ? 10 : 1);
      const updates = selectedKeyframes.map((keyframe) => ({
        ...keyframe,
        timeMs: Math.min(
          Math.max(keyframe.timeMs + direction * amount, 0),
          durationMs,
        ),
      }));
      if (updates.length > 0) {
        commitTracks(
          updateKeyframesInTracks(localTracks, updates),
          "Nudge keyframes",
        );
      }
    }
  };

  const currentInterpolation: KeyframeInterpolation | "mixed" =
    selectedKeyframes.length === 0
      ? "mixed"
      : selectedKeyframes.every(
          (item) => item.interpolation === selectedKeyframes[0].interpolation,
        )
      ? selectedKeyframes[0].interpolation
      : "mixed";

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyboard}
      aria-label="Beacon Studio keyframe editor"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/95 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Keyframe editor</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatTimecode(playheadMs, fps)} · {selectedIds.size} selected
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addKeyframe}
            disabled={disabled || localTracks.length === 0}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-40"
          >
            Add keyframe
          </button>

          <button
            type="button"
            onClick={duplicateSelected}
            disabled={disabled || selectedIds.size === 0}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-40"
          >
            Duplicate
          </button>

          <button
            type="button"
            onClick={deleteSelected}
            disabled={disabled || selectedIds.size === 0}
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 hover:bg-rose-500/20 disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </header>

      <div className="grid min-h-[38rem] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="border-b border-white/10 bg-slate-900/50 xl:border-b-0 xl:border-r">
          <div className="border-b border-white/10 p-3">
            <label className="text-[11px] font-medium text-slate-500">Zoom</label>
            <input
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-[10px] text-slate-600">{zoom.toFixed(1)}×</p>
          </div>

          <div className="divide-y divide-white/5">
            {localTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => setActiveTrackId(track.id)}
                className={`flex h-12 w-full items-center justify-between gap-2 px-3 text-left transition ${
                  activeTrackId === track.id
                    ? "bg-cyan-400/10 text-cyan-100"
                    : "text-slate-400 hover:bg-white/[0.03]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">
                    {track.name}
                  </span>
                  <span className="block truncate text-[10px] text-slate-600">
                    {track.property}
                  </span>
                </span>
                <span className="text-[10px] text-slate-600">
                  {track.keyframes.length}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 border-b border-white/10 xl:border-b-0 xl:border-r">
          <KeyframeCanvas
            tracks={localTracks}
            durationMs={durationMs}
            playheadMs={playheadMs}
            fps={fps}
            zoom={zoom}
            selectedIds={selectedIds}
            markers={markers}
            disabled={disabled}
            onPlayheadChange={onPlayheadChange}
            onKeyframePointerDown={handleKeyframePointerDown}
            onSelectionChange={(ids) => {
              selectionRef.current.setSelection(ids);
              publishSelection(ids);
            }}
            onMarqueeSelect={handleMarqueeSelect}
          />
        </div>

        <aside className="bg-slate-900/45 p-4">
          <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-white">Keyframe values</h3>

            <div className="mt-4 space-y-3">
              <label className="block text-[11px] text-slate-500">
                Time (ms)
                <input
                  type="number"
                  value={
                    selectedKeyframes.length > 0
                      ? Math.round(selectedKeyframes[0].timeMs)
                      : ""
                  }
                  disabled={disabled || selectedKeyframes.length === 0}
                  onChange={(event) => updateExactTime(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-40"
                />
              </label>

              <label className="block text-[11px] text-slate-500">
                Value
                <input
                  type="text"
                  value={
                    selectedKeyframes.length > 0
                      ? String(selectedKeyframes[0].value)
                      : ""
                  }
                  disabled={disabled || selectedKeyframes.length === 0}
                  onChange={(event) => updateExactValue(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-40"
                />
              </label>

              <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3 text-[11px] text-slate-500">
                Interpolation:{" "}
                <span className="font-medium text-slate-300">
                  {currentInterpolation}
                </span>
              </div>
            </div>
          </div>

          <InterpolationPanel
            selectedKeyframes={selectedKeyframes}
            disabled={disabled}
            onChange={updateInterpolation}
            className="mt-4"
          />
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3 text-[11px] text-slate-500">
        <span>
          {dragging ? "Dragging keyframes…" : "Ready"} · {localTracks.length} tracks
        </span>
        <span>
          Delete · Ctrl/Cmd+C · Ctrl/Cmd+V · Ctrl/Cmd+D · Arrow keys
        </span>
      </footer>
    </section>
  );
}