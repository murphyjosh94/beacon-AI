"use client";

import {
  buildSnapCandidates,
  clamp,
  findNearestSnap,
  Keyframe,
  KeyframeTrack,
  normaliseNumericValue,
  SnapSettings,
  TimelineMarker,
  xToTime,
} from "./KeyframeUtils";

export type KeyframeDragMode = "time" | "value" | "time-and-value";

export type DragStartOptions = {
  pointerX: number;
  pointerY: number;
  selectedKeyframes: Keyframe[];
  tracks: KeyframeTrack[];
  durationMs: number;
  viewportWidth: number;
  zoom: number;
  fps: number;
  markers: TimelineMarker[];
  snapSettings: SnapSettings;
  mode?: KeyframeDragMode;
};

export type DragUpdate = {
  keyframes: Keyframe[];
  snappedToMs: number | null;
  deltaTimeMs: number;
  deltaValue: number;
};

type DragState = DragStartOptions & {
  mode: KeyframeDragMode;
  initialById: Map<string, Keyframe>;
};

export class KeyframeDragEngine {
  private state: DragState | null = null;

  start(options: DragStartOptions): void {
    this.state = {
      ...options,
      mode: options.mode ?? "time",
      initialById: new Map(
        options.selectedKeyframes.map((keyframe) => [
          keyframe.id,
          { ...keyframe },
        ]),
      ),
    };
  }

  isDragging(): boolean {
    return this.state !== null;
  }

  update(pointerX: number, pointerY: number): DragUpdate {
    const state = this.state;

    if (!state) {
      return {
        keyframes: [],
        snappedToMs: null,
        deltaTimeMs: 0,
        deltaValue: 0,
      };
    }

    const rawDeltaTime = xToTime(
      pointerX - state.pointerX,
      state.durationMs,
      state.viewportWidth,
      state.zoom,
    );

    const excluded = new Set(state.selectedKeyframes.map((item) => item.id));
    const candidates = buildSnapCandidates({
      tracks: state.tracks,
      markers: state.markers,
      durationMs: state.durationMs,
      fps: state.fps,
      includeFrames: state.snapSettings.frames,
      includeMarkers: state.snapSettings.markers,
      includeKeyframes: state.snapSettings.keyframes,
      excludeIds: excluded,
    });

    const thresholdMs = xToTime(
      state.snapSettings.thresholdPx,
      state.durationMs,
      state.viewportWidth,
      state.zoom,
    );

    let snappedToMs: number | null = null;
    let adjustedDeltaTime = rawDeltaTime;

    if (state.snapSettings.enabled && state.selectedKeyframes.length > 0) {
      const leading = Math.min(
        ...state.selectedKeyframes.map((item) => item.timeMs),
      );
      const proposed = leading + rawDeltaTime;
      const nearest = findNearestSnap(proposed, candidates, thresholdMs);

      if (nearest) {
        snappedToMs = nearest.timeMs;
        adjustedDeltaTime = nearest.timeMs - leading;
      }
    }

    const rawDeltaValue = -(pointerY - state.pointerY);
    const updates = state.selectedKeyframes.map((keyframe) => {
      const initial = state.initialById.get(keyframe.id) ?? keyframe;
      const track = state.tracks.find((item) => item.id === initial.trackId);

      let nextValue = initial.value;

      if (
        state.mode !== "time" &&
        track &&
        typeof initial.value === "number"
      ) {
        const range =
          typeof track.min === "number" && typeof track.max === "number"
            ? track.max - track.min
            : 100;
        const scaled = initial.value + (rawDeltaValue / 120) * range;
        nextValue = normaliseNumericValue(scaled, track);
      }

      return {
        ...initial,
        timeMs:
          state.mode === "value"
            ? initial.timeMs
            : clamp(initial.timeMs + adjustedDeltaTime, 0, state.durationMs),
        value: nextValue,
      };
    });

    return {
      keyframes: updates,
      snappedToMs,
      deltaTimeMs: adjustedDeltaTime,
      deltaValue: rawDeltaValue,
    };
  }

  finish(): Keyframe[] {
    const result = this.state?.selectedKeyframes ?? [];
    this.state = null;
    return result;
  }

  cancel(): Keyframe[] {
    const restored = this.state
      ? Array.from(this.state.initialById.values())
      : [];
    this.state = null;
    return restored;
  }
}