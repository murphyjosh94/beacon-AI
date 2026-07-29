"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type MotionAspectRatio = "9:16" | "1:1" | "16:9";

export type MotionPlayerRenderState = {
  currentTime: number;
  currentTimeMs: number;
  duration: number;
  durationMs: number;
  progress: number;
  isPlaying: boolean;
  isComplete: boolean;
};

type MotionPlayerChildren =
  | ReactNode
  | ((currentTimeMs: number, state: MotionPlayerRenderState) => ReactNode);

export type MotionPlayerProps = {
  children: MotionPlayerChildren;
  duration?: number;
  durationMs?: number;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  title?: string;
  subtitle?: string;
  aspectRatio?: MotionAspectRatio;
  showControls?: boolean;
  className?: string;
  stageClassName?: string;
  onComplete?: () => void;
  onTimeChange?: (currentTimeMs: number) => void;
};

const DEFAULT_DURATION_MS = 15_000;
const MINIMUM_DURATION_MS = 1_000;

const ASPECT_RATIO_CLASSES: Record<MotionAspectRatio, string> = {
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
  "16:9": "aspect-video",
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, milliseconds) / 1_000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds % 1) * 10);

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`;
}

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M8.25 5.73a1 1 0 0 1 1.52-.85l9.02 6.27a1 1 0 0 1 0 1.7l-9.02 6.27a1 1 0 0 1-1.52-.85V5.73Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M7.5 5.5a1 1 0 0 1 1-1h1.25a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1v-13Zm5.75 0a1 1 0 0 1 1-1h1.25a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-1.25a1 1 0 0 1-1-1v-13Z" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 4v6h6" />
      <path d="M5.2 15a8 8 0 1 0 1.6-8.7L4 10" />
    </svg>
  );
}

function VolumeMutedIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m19 9-6 6" />
      <path d="m13 9 6 6" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18 6a8 8 0 0 1 0 12" />
    </svg>
  );
}

export default function MotionPlayer({
  children,
  duration,
  durationMs,
  autoPlay = true,
  loop = true,
  muted = true,
  title = "Beacon Motion",
  subtitle = "Production preview",
  aspectRatio = "9:16",
  showControls = true,
  className = "",
  stageClassName = "",
  onComplete,
  onTimeChange,
}: MotionPlayerProps) {
  const resolvedDurationMs = useMemo(() => {
    const suppliedDuration = durationMs ?? duration ?? DEFAULT_DURATION_MS;

    if (!Number.isFinite(suppliedDuration)) {
      return DEFAULT_DURATION_MS;
    }

    return Math.max(MINIMUM_DURATION_MS, suppliedDuration);
  }, [duration, durationMs]);

  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const frameRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const progress = clamp(currentTimeMs / resolvedDurationMs, 0, 1);
  const isComplete = currentTimeMs >= resolvedDurationMs;

  const clearAnimationFrame = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    previousTimestampRef.current = null;
  }, []);

  const updateCurrentTime = useCallback(
    (nextTimeMs: number) => {
      const clampedTime = clamp(nextTimeMs, 0, resolvedDurationMs);

      setCurrentTimeMs(clampedTime);
      onTimeChange?.(clampedTime);
    },
    [onTimeChange, resolvedDurationMs],
  );

  const replay = useCallback(() => {
    hasCompletedRef.current = false;
    previousTimestampRef.current = null;
    updateCurrentTime(0);
    setIsPlaying(true);
  }, [updateCurrentTime]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearAnimationFrame();
  }, [clearAnimationFrame]);

  const play = useCallback(() => {
    if (isComplete) {
      replay();
      return;
    }

    previousTimestampRef.current = null;
    setIsPlaying(true);
  }, [isComplete, replay]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }

    play();
  }, [isPlaying, pause, play]);

  const completeTimeline = useCallback(() => {
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
    }

    if (loop) {
      hasCompletedRef.current = false;
      previousTimestampRef.current = null;
      updateCurrentTime(0);
      return;
    }

    updateCurrentTime(resolvedDurationMs);
    setIsPlaying(false);
    clearAnimationFrame();
  }, [
    clearAnimationFrame,
    loop,
    onComplete,
    resolvedDurationMs,
    updateCurrentTime,
  ]);

  useEffect(() => {
    if (!isPlaying || isScrubbing) {
      clearAnimationFrame();
      return;
    }

    const animate = (timestamp: number) => {
      if (previousTimestampRef.current === null) {
        previousTimestampRef.current = timestamp;
        frameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - previousTimestampRef.current;
      previousTimestampRef.current = timestamp;

      setCurrentTimeMs((current) => {
        const nextTime = current + elapsed;

        if (nextTime >= resolvedDurationMs) {
          window.queueMicrotask(completeTimeline);
          return resolvedDurationMs;
        }

        onTimeChange?.(nextTime);
        return nextTime;
      });

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return clearAnimationFrame;
  }, [
    clearAnimationFrame,
    completeTimeline,
    isPlaying,
    isScrubbing,
    onTimeChange,
    resolvedDurationMs,
  ]);

  useEffect(() => {
    return clearAnimationFrame;
  }, [clearAnimationFrame]);

  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);

  useEffect(() => {
    setCurrentTimeMs((current) =>
      clamp(current, 0, resolvedDurationMs),
    );
  }, [resolvedDurationMs]);

  const seekFromPointer = useCallback(
    (clientX: number) => {
      const timeline = timelineRef.current;

      if (!timeline) {
        return;
      }

      const bounds = timeline.getBoundingClientRect();

      if (bounds.width <= 0) {
        return;
      }

      const position = clamp((clientX - bounds.left) / bounds.width, 0, 1);

      hasCompletedRef.current = false;
      updateCurrentTime(position * resolvedDurationMs);
    },
    [resolvedDurationMs, updateCurrentTime],
  );

  const handleTimelinePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsScrubbing(true);
    seekFromPointer(event.clientX);
  };

  const handleTimelinePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!isScrubbing) {
      return;
    }

    seekFromPointer(event.clientX);
  };

  const handleTimelinePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    seekFromPointer(event.clientX);
    previousTimestampRef.current = null;
    setIsScrubbing(false);
  };

  const handleTimelineKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const smallStep = Math.max(resolvedDurationMs * 0.01, 100);
    const largeStep = Math.max(resolvedDurationMs * 0.05, 500);

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        updateCurrentTime(
          currentTimeMs - (event.shiftKey ? largeStep : smallStep),
        );
        break;

      case "ArrowRight":
        event.preventDefault();
        updateCurrentTime(
          currentTimeMs + (event.shiftKey ? largeStep : smallStep),
        );
        break;

      case "Home":
        event.preventDefault();
        updateCurrentTime(0);
        break;

      case "End":
        event.preventDefault();
        updateCurrentTime(resolvedDurationMs);
        break;

      case " ":
      case "Enter":
        event.preventDefault();
        togglePlayback();
        break;

      default:
        break;
    }
  };

  const renderState: MotionPlayerRenderState = {
    currentTime: currentTimeMs,
    currentTimeMs,
    duration: resolvedDurationMs,
    durationMs: resolvedDurationMs,
    progress,
    isPlaying,
    isComplete,
  };

  const renderedChildren =
    typeof children === "function"
      ? children(currentTimeMs, renderState)
      : children;

  const progressStyle = {
    "--motion-progress": `${progress * 100}%`,
  } as CSSProperties;

  return (
    <section
      aria-label={`${title} player`}
      className={`w-full ${className}`}
    >
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
        <header className="flex flex-col gap-4 border-b border-white/10 bg-slate-950/95 px-5 py-4 text-white backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="relative flex h-3 w-3 shrink-0"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-300" />
              </span>

              <p className="truncate text-sm font-black tracking-tight">
                {title}
              </p>
            </div>

            <p className="mt-1 truncate text-xs font-semibold text-slate-400">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {aspectRatio}
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {Math.round(resolvedDurationMs / 1_000)} sec
            </span>
          </div>
        </header>

        <div className="relative flex min-h-[28rem] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.3),transparent_48%),linear-gradient(180deg,#020617_0%,#020617_100%)] p-4 sm:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-72 w-[70%] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl"
          />

          <div
            className={`relative mx-auto w-full overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_25px_80px_rgba(0,0,0,0.55)] ${ASPECT_RATIO_CLASSES[aspectRatio]} ${
              aspectRatio === "9:16"
                ? "max-h-[78vh] max-w-[27rem]"
                : aspectRatio === "1:1"
                  ? "max-w-[46rem]"
                  : "max-w-[70rem]"
            } ${stageClassName}`}
          >
            <div className="absolute inset-0 overflow-hidden">
              {renderedChildren}
            </div>

            <button
              aria-label={isPlaying ? "Pause preview" : "Play preview"}
              className="absolute inset-0 z-40 cursor-pointer bg-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-amber-300/80"
              onClick={togglePlayback}
              type="button"
            >
              <span className="sr-only">
                {isPlaying ? "Pause preview" : "Play preview"}
              </span>
            </button>

            {!isPlaying && (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-slate-950/75 text-white shadow-2xl backdrop-blur-xl">
                  {isComplete ? <ReplayIcon /> : <PlayIcon />}
                </span>
              </div>
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] ring-1 ring-inset ring-white/10"
            />
          </div>
        </div>

        {showControls && (
          <footer className="border-t border-white/10 bg-slate-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <button
                aria-label={
                  isComplete
                    ? "Replay preview"
                    : isPlaying
                      ? "Pause preview"
                      : "Play preview"
                }
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition hover:scale-105 hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-300/30"
                onClick={isComplete ? replay : togglePlayback}
                type="button"
              >
                {isComplete ? (
                  <ReplayIcon />
                ) : isPlaying ? (
                  <PauseIcon />
                ) : (
                  <PlayIcon />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div
                  aria-label="Preview timeline"
                  aria-valuemax={resolvedDurationMs}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(currentTimeMs)}
                  className="group relative h-6 cursor-pointer touch-none outline-none"
                  onKeyDown={handleTimelineKeyDown}
                  onPointerDown={handleTimelinePointerDown}
                  onPointerMove={handleTimelinePointerMove}
                  onPointerUp={handleTimelinePointerUp}
                  ref={timelineRef}
                  role="slider"
                  tabIndex={0}
                >
                  <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-amber-300"
                      style={{
                        width: "var(--motion-progress)",
                        ...progressStyle,
                      }}
                    />
                  </div>

                  <div
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 bg-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus:opacity-100"
                    style={{
                      left: "var(--motion-progress)",
                      ...progressStyle,
                    }}
                  />
                </div>

                <div className="mt-1 flex items-center justify-between gap-4 text-xs font-bold text-slate-400">
                  <span>{formatTime(currentTimeMs)}</span>
                  <span>{formatTime(resolvedDurationMs)}</span>
                </div>
              </div>

              <button
                aria-label={isMuted ? "Unmute preview" : "Mute preview"}
                aria-pressed={isMuted}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-400/20"
                onClick={() => setIsMuted((current) => !current)}
                type="button"
              >
                {isMuted ? <VolumeMutedIcon /> : <VolumeIcon />}
              </button>

              <button
                aria-label="Restart preview"
                className="hidden h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-extrabold text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-400/20 sm:inline-flex"
                onClick={replay}
                type="button"
              >
                <ReplayIcon />
                Restart
              </button>
            </div>
          </footer>
        )}
      </div>
    </section>
  );
}