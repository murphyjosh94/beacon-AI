"use client";

export type KeyframeInterpolation =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "hold"
  | "bezier";

export type KeyframeValue = number | string | boolean;

export type Keyframe = {
  id: string;
  trackId: string;
  timeMs: number;
  value: KeyframeValue;
  interpolation: KeyframeInterpolation;
  bezier?: [number, number, number, number];
  metadata?: Record<string, unknown>;
};

export type KeyframeTrack = {
  id: string;
  name: string;
  property: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  colour?: string;
  locked?: boolean;
  hidden?: boolean;
  keyframes: Keyframe[];
};

export type TimelineMarker = {
  id: string;
  timeMs: number;
  label?: string;
};

export type KeyframeEditorSnapshot = {
  tracks: KeyframeTrack[];
  durationMs: number;
  playheadMs: number;
};

export type SnapSettings = {
  enabled: boolean;
  frames: boolean;
  markers: boolean;
  keyframes: boolean;
  thresholdPx: number;
};

export type SnapCandidate = {
  timeMs: number;
  source: "frame" | "marker" | "keyframe" | "boundary";
  id?: string;
};

export type KeyframeMutation =
  | {
      type: "add";
      keyframes: Keyframe[];
    }
  | {
      type: "update";
      keyframes: Keyframe[];
    }
  | {
      type: "delete";
      ids: string[];
    }
  | {
      type: "replace";
      tracks: KeyframeTrack[];
    };

export const DEFAULT_BEZIER: [number, number, number, number] = [
  0.25, 0.1, 0.25, 1,
];

export function createKeyframeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `kf-${crypto.randomUUID()}`;
  }

  return `kf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function msPerFrame(fps: number): number {
  return 1000 / Math.max(1, fps);
}

export function frameToMs(frame: number, fps: number): number {
  return frame * msPerFrame(fps);
}

export function msToFrame(timeMs: number, fps: number): number {
  return Math.round(timeMs / msPerFrame(fps));
}

export function snapToFrame(timeMs: number, fps: number): number {
  return frameToMs(msToFrame(timeMs, fps), fps);
}

export function formatTimecode(timeMs: number, fps: number): string {
  const safeFps = Math.max(1, Math.round(fps));
  const totalFrames = Math.max(0, Math.round((timeMs / 1000) * safeFps));
  const frames = totalFrames % safeFps;
  const totalSeconds = Math.floor(totalFrames / safeFps);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  return [hours, minutes, seconds, frames]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function timeToX(
  timeMs: number,
  durationMs: number,
  width: number,
  zoom = 1,
): number {
  if (durationMs <= 0 || width <= 0) return 0;
  return (timeMs / durationMs) * width * zoom;
}

export function xToTime(
  x: number,
  durationMs: number,
  width: number,
  zoom = 1,
): number {
  if (durationMs <= 0 || width <= 0 || zoom <= 0) return 0;
  return (x / (width * zoom)) * durationMs;
}

export function getAllKeyframes(tracks: KeyframeTrack[]): Keyframe[] {
  return tracks.flatMap((track) => track.keyframes);
}

export function sortTrackKeyframes(track: KeyframeTrack): KeyframeTrack {
  return {
    ...track,
    keyframes: [...track.keyframes].sort((a, b) => a.timeMs - b.timeMs),
  };
}

export function sortTracks(tracks: KeyframeTrack[]): KeyframeTrack[] {
  return tracks.map(sortTrackKeyframes);
}

export function updateKeyframesInTracks(
  tracks: KeyframeTrack[],
  updates: Keyframe[],
): KeyframeTrack[] {
  const updateMap = new Map(updates.map((item) => [item.id, item]));

  return tracks.map((track) =>
    sortTrackKeyframes({
      ...track,
      keyframes: track.keyframes.map(
        (keyframe) => updateMap.get(keyframe.id) ?? keyframe,
      ),
    }),
  );
}

export function deleteKeyframesFromTracks(
  tracks: KeyframeTrack[],
  ids: Iterable<string>,
): KeyframeTrack[] {
  const idSet = new Set(ids);

  return tracks.map((track) => ({
    ...track,
    keyframes: track.keyframes.filter((keyframe) => !idSet.has(keyframe.id)),
  }));
}

export function insertKeyframesIntoTracks(
  tracks: KeyframeTrack[],
  keyframes: Keyframe[],
): KeyframeTrack[] {
  const grouped = new Map<string, Keyframe[]>();

  for (const keyframe of keyframes) {
    const current = grouped.get(keyframe.trackId) ?? [];
    current.push(keyframe);
    grouped.set(keyframe.trackId, current);
  }

  return tracks.map((track) =>
    sortTrackKeyframes({
      ...track,
      keyframes: [
        ...track.keyframes,
        ...(grouped.get(track.id) ?? []),
      ],
    }),
  );
}

export function duplicateKeyframes(
  keyframes: Keyframe[],
  offsetMs: number,
  durationMs: number,
): Keyframe[] {
  return keyframes.map((keyframe) => ({
    ...keyframe,
    id: createKeyframeId(),
    timeMs: clamp(keyframe.timeMs + offsetMs, 0, durationMs),
  }));
}

export function buildSnapCandidates({
  tracks,
  markers,
  durationMs,
  fps,
  includeFrames,
  includeMarkers,
  includeKeyframes,
  excludeIds,
}: {
  tracks: KeyframeTrack[];
  markers: TimelineMarker[];
  durationMs: number;
  fps: number;
  includeFrames: boolean;
  includeMarkers: boolean;
  includeKeyframes: boolean;
  excludeIds?: Set<string>;
}): SnapCandidate[] {
  const candidates: SnapCandidate[] = [
    { timeMs: 0, source: "boundary" },
    { timeMs: durationMs, source: "boundary" },
  ];

  if (includeFrames) {
    const step = msPerFrame(fps);
    for (let value = 0; value <= durationMs; value += step) {
      candidates.push({ timeMs: value, source: "frame" });
    }
  }

  if (includeMarkers) {
    for (const marker of markers) {
      candidates.push({
        timeMs: marker.timeMs,
        source: "marker",
        id: marker.id,
      });
    }
  }

  if (includeKeyframes) {
    for (const track of tracks) {
      for (const keyframe of track.keyframes) {
        if (!excludeIds?.has(keyframe.id)) {
          candidates.push({
            timeMs: keyframe.timeMs,
            source: "keyframe",
            id: keyframe.id,
          });
        }
      }
    }
  }

  return candidates;
}

export function findNearestSnap(
  timeMs: number,
  candidates: SnapCandidate[],
  thresholdMs: number,
): SnapCandidate | null {
  let best: SnapCandidate | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = Math.abs(candidate.timeMs - timeMs);

    if (distance <= thresholdMs && distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}

export function normaliseNumericValue(
  value: number,
  track: KeyframeTrack,
): number {
  const stepped =
    typeof track.step === "number" && track.step > 0
      ? Math.round(value / track.step) * track.step
      : value;

  return clamp(
    stepped,
    track.min ?? Number.NEGATIVE_INFINITY,
    track.max ?? Number.POSITIVE_INFINITY,
  );
}

export function keyframeLabel(keyframe: Keyframe, track: KeyframeTrack): string {
  const unit = track.unit ?? "";
  return `${track.name}: ${String(keyframe.value)}${unit}`;
}

export function cloneTracks(tracks: KeyframeTrack[]): KeyframeTrack[] {
  return tracks.map((track) => ({
    ...track,
    keyframes: track.keyframes.map((keyframe) => ({
      ...keyframe,
      bezier: keyframe.bezier ? [...keyframe.bezier] as [number, number, number, number] : undefined,
      metadata: keyframe.metadata ? { ...keyframe.metadata } : undefined,
    })),
  }));
}