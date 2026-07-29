import type {
  StudioBridgeCommand,
  StudioKeyframe,
  StudioProject,
  StudioTrack,
} from "../types";

export type PlaybackState =
  | "idle"
  | "playing"
  | "paused"
  | "seeking"
  | "ended"
  | "destroyed";

export type PlaybackSnapshot = {
  state: PlaybackState;
  currentTimeMs: number;
  durationMs: number;
  progress: number;
  playbackRate: number;
};

export type PlaybackEngineEvent =
  | {
      type: "state";
      snapshot: PlaybackSnapshot;
    }
  | {
      type: "time";
      snapshot: PlaybackSnapshot;
    }
  | {
      type: "command";
      command: StudioBridgeCommand;
      keyframe: StudioKeyframe;
      track: StudioTrack;
    }
  | {
      type: "error";
      error: Error;
      keyframe?: StudioKeyframe;
      track?: StudioTrack;
    };

export type PlaybackEngineListener = (
  event: PlaybackEngineEvent,
) => void;

export type PlaybackCommandSender = (
  command: StudioBridgeCommand,
) => void | Promise<void>;

export type PlaybackEngineOptions = {
  project: StudioProject;
  sendCommand: PlaybackCommandSender;
  onEvent?: PlaybackEngineListener;
  tickIntervalMs?: number;
  resetOnPlay?: boolean;
  resetOnStop?: boolean;
};

type ScheduledKeyframe = {
  id: string;
  timeMs: number;
  order: number;
  track: StudioTrack;
  keyframe: StudioKeyframe;
  command: StudioBridgeCommand;
};

const DEFAULT_DURATION_MS = 15_000;
const DEFAULT_TICK_INTERVAL_MS = 33;

function asRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function numberFrom(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function stringFrom(
  value: unknown,
): string | undefined {
  return typeof value === "string"
    ? value
    : undefined;
}

function booleanFrom(
  value: unknown,
): boolean | undefined {
  return typeof value === "boolean"
    ? value
    : undefined;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

function readProjectDuration(
  project: StudioProject,
): number {
  const projectRecord =
    asRecord(project);

  const duration =
    numberFrom(
      projectRecord?.durationMs,
    ) ??
    numberFrom(
      projectRecord?.duration,
    );

  return duration && duration > 0
    ? duration
    : DEFAULT_DURATION_MS;
}

function readTracks(
  project: StudioProject,
): StudioTrack[] {
  const record = asRecord(project);
  const tracks = record?.tracks;

  return Array.isArray(tracks)
    ? (tracks as StudioTrack[])
    : [];
}

function readTrackKeyframes(
  track: StudioTrack,
): StudioKeyframe[] {
  const record = asRecord(track);
  const keyframes =
    record?.keyframes ??
    record?.items ??
    record?.events;

  return Array.isArray(keyframes)
    ? (keyframes as StudioKeyframe[])
    : [];
}

function readKeyframeTime(
  keyframe: StudioKeyframe,
): number {
  const record = asRecord(keyframe);

  const direct =
    numberFrom(record?.timeMs) ??
    numberFrom(record?.startMs) ??
    numberFrom(record?.atMs) ??
    numberFrom(record?.timestampMs);

  if (direct !== null) {
    return Math.max(0, direct);
  }

  const seconds =
    numberFrom(record?.time) ??
    numberFrom(record?.start) ??
    numberFrom(record?.at);

  return seconds !== null
    ? Math.max(0, seconds * 1000)
    : 0;
}

function readKeyframeId(
  keyframe: StudioKeyframe,
  trackIndex: number,
  keyframeIndex: number,
): string {
  const record = asRecord(keyframe);

  return (
    stringFrom(record?.id) ??
    `track-${trackIndex}-keyframe-${keyframeIndex}`
  );
}

function commandFromKeyframe(
  keyframe: StudioKeyframe,
): StudioBridgeCommand | null {
  const record = asRecord(keyframe);

  if (!record) {
    return null;
  }

  const nestedCommand =
    asRecord(record.command) ??
    asRecord(record.payload);

  if (
    nestedCommand &&
    typeof nestedCommand.type === "string" &&
    nestedCommand.type.startsWith(
      "beacon-studio:",
    )
  ) {
    return nestedCommand as StudioBridgeCommand;
  }

  const rawType =
    stringFrom(record.type) ??
    stringFrom(record.action) ??
    stringFrom(record.kind);

  if (!rawType) {
    return null;
  }

  const selector =
    stringFrom(record.selector) ??
    stringFrom(record.target);
  const sectionId =
    stringFrom(record.sectionId);
  const text =
    stringFrom(record.text) ??
    stringFrom(record.value);
  const top =
    numberFrom(record.top) ??
    numberFrom(record.scrollTop);
  const behavior =
    stringFrom(record.behavior);
  const enabled =
    booleanFrom(record.enabled);

  const type = rawType
    .replace(/^beacon-studio:/, "")
    .toLowerCase();

  if (type === "ping") {
    return {
      type: "beacon-studio:ping",
    } as StudioBridgeCommand;
  }

  if (
    type === "reset" ||
    type === "stop"
  ) {
    return {
      type: "beacon-studio:reset",
    } as StudioBridgeCommand;
  }

  if (
    type === "scroll" ||
    type === "scroll-to" ||
    type === "scrolltoselector" ||
    type === "scroll-to-selector" ||
    type === "scrolltosection" ||
    type === "scroll-to-section" ||
    type === "scrolltotop" ||
    type === "scroll-to-top"
  ) {
    return {
      type: "beacon-studio:scroll",
      selector,
      sectionId,
      top:
        type === "scrolltotop" ||
        type === "scroll-to-top"
          ? 0
          : top ?? undefined,
      behavior:
        behavior === "auto" ||
        behavior === "smooth"
          ? behavior
          : "smooth",
    } as StudioBridgeCommand;
  }

  if (
    type === "highlight" ||
    type === "spotlight"
  ) {
    if (!selector) {
      return null;
    }

    return {
      type: "beacon-studio:highlight",
      selector,
      enabled: enabled ?? true,
    } as StudioBridgeCommand;
  }

  if (
    type === "unhighlight" ||
    type === "remove-highlight"
  ) {
    if (!selector) {
      return null;
    }

    return {
      type: "beacon-studio:highlight",
      selector,
      enabled: false,
    } as StudioBridgeCommand;
  }

  if (type === "click") {
    if (!selector) {
      return null;
    }

    return {
      type: "beacon-studio:click",
      selector,
    } as StudioBridgeCommand;
  }

  if (
    type === "type" ||
    type === "input" ||
    type === "fill"
  ) {
    if (!selector) {
      return null;
    }

    return {
      type: "beacon-studio:type",
      selector,
      text: text ?? "",
    } as StudioBridgeCommand;
  }

  return null;
}

function buildSchedule(
  project: StudioProject,
): ScheduledKeyframe[] {
  const scheduled: ScheduledKeyframe[] = [];
  const tracks = readTracks(project);

  tracks.forEach((track, trackIndex) => {
    const trackRecord = asRecord(track);

    if (
      trackRecord?.enabled === false ||
      trackRecord?.muted === true ||
      trackRecord?.hidden === true
    ) {
      return;
    }

    const keyframes =
      readTrackKeyframes(track);

    keyframes.forEach(
      (keyframe, keyframeIndex) => {
        const command =
          commandFromKeyframe(keyframe);

        if (!command) {
          return;
        }

        scheduled.push({
          id: readKeyframeId(
            keyframe,
            trackIndex,
            keyframeIndex,
          ),
          timeMs:
            readKeyframeTime(keyframe),
          order:
            trackIndex * 100_000 +
            keyframeIndex,
          track,
          keyframe,
          command,
        });
      },
    );
  });

  return scheduled.sort(
    (left, right) =>
      left.timeMs - right.timeMs ||
      left.order - right.order,
  );
}

export class PlaybackEngine {
  private project: StudioProject;
  private readonly sendCommand: PlaybackCommandSender;
  private readonly onEvent?: PlaybackEngineListener;
  private readonly tickIntervalMs: number;
  private readonly resetOnPlay: boolean;
  private readonly resetOnStop: boolean;

  private schedule: ScheduledKeyframe[];
  private executedIds = new Set<string>();

  private state: PlaybackState = "idle";
  private currentTimeMs = 0;
  private durationMs: number;
  private playbackRate = 1;

  private startedAt = 0;
  private startedFromMs = 0;
  private timer: ReturnType<
    typeof setInterval
  > | null = null;

  constructor(
    options: PlaybackEngineOptions,
  ) {
    this.project = options.project;
    this.sendCommand =
      options.sendCommand;
    this.onEvent = options.onEvent;
    this.tickIntervalMs = Math.max(
      16,
      options.tickIntervalMs ??
        DEFAULT_TICK_INTERVAL_MS,
    );
    this.resetOnPlay =
      options.resetOnPlay ?? true;
    this.resetOnStop =
      options.resetOnStop ?? true;

    this.durationMs =
      readProjectDuration(
        options.project,
      );
    this.schedule =
      buildSchedule(options.project);

    this.emitState();
  }

  get snapshot(): PlaybackSnapshot {
    return {
      state: this.state,
      currentTimeMs:
        this.currentTimeMs,
      durationMs: this.durationMs,
      progress:
        this.durationMs > 0
          ? this.currentTimeMs /
            this.durationMs
          : 0,
      playbackRate:
        this.playbackRate,
    };
  }

  get currentState(): PlaybackState {
    return this.state;
  }

  get currentTime(): number {
    return this.currentTimeMs;
  }

  get duration(): number {
    return this.durationMs;
  }

  updateProject(
    project: StudioProject,
  ): void {
    this.assertUsable();

    const wasPlaying =
      this.state === "playing";

    if (wasPlaying) {
      this.pause();
    }

    this.project = project;
    this.durationMs =
      readProjectDuration(project);
    this.schedule =
      buildSchedule(project);
    this.currentTimeMs = clamp(
      this.currentTimeMs,
      0,
      this.durationMs,
    );
    this.rebuildExecutedSet(
      this.currentTimeMs,
    );

    this.emitState();

    if (wasPlaying) {
      void this.play();
    }
  }

  setPlaybackRate(rate: number): void {
    this.assertUsable();

    if (
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      throw new Error(
        "Playback rate must be greater than zero.",
      );
    }

    if (this.state === "playing") {
      this.syncCurrentTime();
      this.startedFromMs =
        this.currentTimeMs;
      this.startedAt =
        performance.now();
    }

    this.playbackRate = rate;
    this.emitState();
  }

  async play(): Promise<void> {
    this.assertUsable();

    if (this.state === "playing") {
      return;
    }

    if (
      this.state === "ended" ||
      this.currentTimeMs >=
        this.durationMs
    ) {
      await this.seek(0, {
        executePrevious: false,
        resetPage: true,
      });
    } else if (
      this.state === "idle" &&
      this.currentTimeMs === 0 &&
      this.resetOnPlay
    ) {
      await this.safeSend({
        type: "beacon-studio:reset",
      } as StudioBridgeCommand);
    }

    this.state = "playing";
    this.startedAt = performance.now();
    this.startedFromMs =
      this.currentTimeMs;

    await this.executeDueCommands(
      this.currentTimeMs,
    );

    this.startTimer();
    this.emitState();
  }

  pause(): void {
    this.assertUsable();

    if (this.state !== "playing") {
      return;
    }

    this.syncCurrentTime();
    this.stopTimer();
    this.state = "paused";
    this.emitState();
  }

  async stop(): Promise<void> {
    this.assertUsable();

    this.stopTimer();
    this.currentTimeMs = 0;
    this.executedIds.clear();
    this.state = "idle";

    if (this.resetOnStop) {
      await this.safeSend({
        type: "beacon-studio:reset",
      } as StudioBridgeCommand);
    }

    this.emitTime();
    this.emitState();
  }

  async restart(): Promise<void> {
    this.assertUsable();

    await this.stop();
    await this.play();
  }

  async seek(
    timeMs: number,
    options?: {
      executePrevious?: boolean;
      resetPage?: boolean;
    },
  ): Promise<void> {
    this.assertUsable();

    const wasPlaying =
      this.state === "playing";

    this.stopTimer();
    this.state = "seeking";

    const nextTime = clamp(
      timeMs,
      0,
      this.durationMs,
    );

    const shouldReset =
      options?.resetPage ??
      nextTime < this.currentTimeMs;

    if (shouldReset) {
      await this.safeSend({
        type: "beacon-studio:reset",
      } as StudioBridgeCommand);
    }

    this.currentTimeMs = nextTime;
    this.executedIds.clear();

    if (
      options?.executePrevious ?? true
    ) {
      await this.executeDueCommands(
        nextTime,
      );
    } else {
      this.rebuildExecutedSet(nextTime);
    }

    this.emitTime();

    if (
      nextTime >= this.durationMs
    ) {
      this.state = "ended";
      this.emitState();
      return;
    }

    this.state = wasPlaying
      ? "playing"
      : "paused";

    if (wasPlaying) {
      this.startedAt = performance.now();
      this.startedFromMs =
        this.currentTimeMs;
      this.startTimer();
    }

    this.emitState();
  }

  async step(
    amountMs: number,
  ): Promise<void> {
    await this.seek(
      this.currentTimeMs + amountMs,
    );
  }

  async executeAt(
    timeMs: number,
  ): Promise<void> {
    this.assertUsable();

    const target = clamp(
      timeMs,
      0,
      this.durationMs,
    );

    await this.executeDueCommands(
      target,
    );
  }

  destroy(): void {
    if (this.state === "destroyed") {
      return;
    }

    this.stopTimer();
    this.executedIds.clear();
    this.state = "destroyed";
    this.emitState();
  }

  private startTimer(): void {
    this.stopTimer();

    this.timer = setInterval(() => {
      void this.tick();
    }, this.tickIntervalMs);
  }

  private stopTimer(): void {
    if (this.timer === null) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (this.state !== "playing") {
      return;
    }

    this.syncCurrentTime();

    await this.executeDueCommands(
      this.currentTimeMs,
    );

    this.emitTime();

    if (
      this.currentTimeMs >=
      this.durationMs
    ) {
      this.currentTimeMs =
        this.durationMs;
      this.stopTimer();
      this.state = "ended";
      this.emitTime();
      this.emitState();
    }
  }

  private syncCurrentTime(): void {
    const elapsed =
      (performance.now() -
        this.startedAt) *
      this.playbackRate;

    this.currentTimeMs = clamp(
      this.startedFromMs + elapsed,
      0,
      this.durationMs,
    );
  }

  private async executeDueCommands(
    targetTimeMs: number,
  ): Promise<void> {
    for (const item of this.schedule) {
      if (item.timeMs > targetTimeMs) {
        break;
      }

      if (
        this.executedIds.has(item.id)
      ) {
        continue;
      }

      this.executedIds.add(item.id);

      try {
        await this.sendCommand(
          item.command,
        );

        this.onEvent?.({
          type: "command",
          command: item.command,
          keyframe: item.keyframe,
          track: item.track,
        });
      } catch (error) {
        const normalisedError =
          error instanceof Error
            ? error
            : new Error(
                "A Studio command could not be executed.",
              );

        this.onEvent?.({
          type: "error",
          error: normalisedError,
          keyframe: item.keyframe,
          track: item.track,
        });
      }
    }
  }

  private rebuildExecutedSet(
    timeMs: number,
  ): void {
    this.executedIds.clear();

    for (const item of this.schedule) {
      if (item.timeMs > timeMs) {
        break;
      }

      this.executedIds.add(item.id);
    }
  }

  private async safeSend(
    command: StudioBridgeCommand,
  ): Promise<void> {
    try {
      await this.sendCommand(command);
    } catch (error) {
      const normalisedError =
        error instanceof Error
          ? error
          : new Error(
              "A Studio bridge command failed.",
            );

      this.onEvent?.({
        type: "error",
        error: normalisedError,
      });
    }
  }

  private emitTime(): void {
    this.onEvent?.({
      type: "time",
      snapshot: this.snapshot,
    });
  }

  private emitState(): void {
    this.onEvent?.({
      type: "state",
      snapshot: this.snapshot,
    });
  }

  private assertUsable(): void {
    if (this.state === "destroyed") {
      throw new Error(
        "This PlaybackEngine has been destroyed.",
      );
    }
  }
}

export function createPlaybackEngine(
  options: PlaybackEngineOptions,
): PlaybackEngine {
  return new PlaybackEngine(options);
}

export default PlaybackEngine;