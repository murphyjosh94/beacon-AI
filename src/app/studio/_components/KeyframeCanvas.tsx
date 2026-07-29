"use client";

import {
  PointerEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  formatTimecode,
  Keyframe,
  KeyframeTrack,
  TimelineMarker,
  timeToX,
  xToTime,
} from "./KeyframeUtils";
import {
  KeyframeScreenPosition,
  MarqueeSelection,
} from "./KeyframeSelection";

export type KeyframeCanvasProps = {
  tracks: KeyframeTrack[];
  durationMs: number;
  playheadMs: number;
  fps: number;
  zoom: number;
  selectedIds: Set<string>;
  markers?: TimelineMarker[];
  rowHeight?: number;
  rulerHeight?: number;
  disabled?: boolean;
  onPlayheadChange?: (timeMs: number) => void;
  onKeyframePointerDown?: (
    event: PointerEvent<HTMLButtonElement>,
    keyframe: Keyframe,
    track: KeyframeTrack,
  ) => void;
  onSelectionChange?: (ids: Set<string>) => void;
  onMarqueeSelect?: (
    marquee: MarqueeSelection,
    positions: KeyframeScreenPosition[],
    additive: boolean,
  ) => void;
};

export default function KeyframeCanvas({
  tracks,
  durationMs,
  playheadMs,
  fps,
  zoom,
  selectedIds,
  markers = [],
  rowHeight = 48,
  rulerHeight = 28,
  disabled = false,
  onPlayheadChange,
  onKeyframePointerDown,
  onSelectionChange,
  onMarqueeSelect,
}: KeyframeCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [marquee, setMarquee] = useState<MarqueeSelection | null>(null);

  const contentWidth = Math.max(800, 1200 * zoom);
  const totalHeight = rulerHeight + tracks.length * rowHeight;

  const keyframePositions = useMemo<KeyframeScreenPosition[]>(
    () =>
      tracks.flatMap((track, trackIndex) =>
        track.keyframes.map((keyframe) => ({
          id: keyframe.id,
          x: timeToX(keyframe.timeMs, durationMs, 1200, zoom),
          y: rulerHeight + trackIndex * rowHeight + rowHeight / 2,
        })),
      ),
    [durationMs, rowHeight, rulerHeight, tracks, zoom],
  );

  const handleCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest("[data-keyframe]")) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const startX = event.clientX - rect.left + event.currentTarget.scrollLeft;
    const startY = event.clientY - rect.top + event.currentTarget.scrollTop;

    if (startY <= rulerHeight) {
      const timeMs = xToTime(startX, durationMs, 1200, zoom);
      onPlayheadChange?.(Math.min(Math.max(timeMs, 0), durationMs));
      return;
    }

    if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
      onSelectionChange?.(new Set());
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setMarquee({
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });
  };

  const handleCanvasPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!marquee) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setMarquee({
      ...marquee,
      currentX: event.clientX - rect.left + event.currentTarget.scrollLeft,
      currentY: event.clientY - rect.top + event.currentTarget.scrollTop,
    });
  };

  const handleCanvasPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!marquee) return;

    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    onMarqueeSelect?.(marquee, keyframePositions, additive);
    setMarquee(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const rulerTicks = useMemo(() => {
    const count = Math.max(10, Math.ceil(durationMs / 1000));
    return Array.from({ length: count + 1 }, (_, index) => {
      const timeMs = (index / count) * durationMs;
      return {
        timeMs,
        x: timeToX(timeMs, durationMs, 1200, zoom),
      };
    });
  }, [durationMs, zoom]);

  const marqueeStyle = marquee
    ? {
        left: Math.min(marquee.startX, marquee.currentX),
        top: Math.min(marquee.startY, marquee.currentY),
        width: Math.abs(marquee.currentX - marquee.startX),
        height: Math.abs(marquee.currentY - marquee.startY),
      }
    : null;

  return (
    <div
      ref={viewportRef}
      className="relative h-full min-h-[24rem] overflow-auto bg-slate-950"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onPointerCancel={() => setMarquee(null)}
    >
      <div
        className="relative"
        style={{
          width: contentWidth,
          height: totalHeight,
        }}
      >
        <div
          className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/95"
          style={{ height: rulerHeight }}
        >
          {rulerTicks.map((tick) => (
            <div
              key={tick.timeMs}
              className="absolute bottom-0 top-0 border-l border-white/10"
              style={{ left: tick.x }}
            >
              <span className="absolute left-1 top-1 text-[9px] text-slate-600">
                {formatTimecode(tick.timeMs, fps)}
              </span>
            </div>
          ))}
        </div>

        {tracks.map((track, trackIndex) => {
          const rowTop = rulerHeight + trackIndex * rowHeight;

          return (
            <div
              key={track.id}
              className="absolute left-0 right-0 border-b border-white/5"
              style={{ top: rowTop, height: rowHeight }}
            >
              {rulerTicks.map((tick) => (
                <div
                  key={`${track.id}-${tick.timeMs}`}
                  className="absolute bottom-0 top-0 border-l border-white/[0.035]"
                  style={{ left: tick.x }}
                />
              ))}

              {track.keyframes.map((keyframe) => {
                const x = timeToX(
                  keyframe.timeMs,
                  durationMs,
                  1200,
                  zoom,
                );
                const selected = selectedIds.has(keyframe.id);

                return (
                  <button
                    key={keyframe.id}
                    type="button"
                    data-keyframe
                    disabled={disabled || track.locked}
                    title={`${track.name} · ${formatTimecode(
                      keyframe.timeMs,
                      fps,
                    )}`}
                    onPointerDown={(event) =>
                      onKeyframePointerDown?.(event, keyframe, track)
                    }
                    className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border transition ${
                      selected
                        ? "z-10 border-cyan-100 bg-cyan-400 shadow-[0_0_0_3px_rgba(34,211,238,0.18)]"
                        : "border-slate-300/40 bg-slate-500 hover:border-cyan-200 hover:bg-cyan-500"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                    style={{ left: x }}
                  />
                );
              })}
            </div>
          );
        })}

        {markers.map((marker) => (
          <div
            key={marker.id}
            className="pointer-events-none absolute bottom-0 top-0 z-10 border-l border-amber-300/50"
            style={{
              left: timeToX(marker.timeMs, durationMs, 1200, zoom),
            }}
          >
            {marker.label ? (
              <span className="absolute left-1 top-7 rounded bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-200">
                {marker.label}
              </span>
            ) : null}
          </div>
        ))}

        <div
          className="pointer-events-none absolute bottom-0 top-0 z-30 border-l border-cyan-300"
          style={{
            left: timeToX(playheadMs, durationMs, 1200, zoom),
          }}
        >
          <div className="absolute -left-1.5 top-0 h-3 w-3 rotate-45 bg-cyan-300" />
        </div>

        {marqueeStyle ? (
          <div
            className="pointer-events-none absolute z-40 border border-cyan-300 bg-cyan-400/10"
            style={marqueeStyle}
          />
        ) : null}
      </div>
    </div>
  );
}