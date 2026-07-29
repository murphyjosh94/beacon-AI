export type RecorderStatus =
  | "idle"
  | "requesting-permission"
  | "ready"
  | "recording"
  | "paused"
  | "stopping"
  | "completed"
  | "cancelled"
  | "error"
  | "destroyed";

export type RecorderVideoOptions = {
  width?: number;
  height?: number;
  frameRate?: number;
  displaySurface?:
    | "browser"
    | "window"
    | "monitor";
};

export type RecorderAudioOptions = {
  enabled?: boolean;
  systemAudio?:
    | "include"
    | "exclude";
  suppressLocalAudioPlayback?: boolean;
};

export type RecorderOptions = {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  timesliceMs?: number;
  video?: RecorderVideoOptions;
  audio?: RecorderAudioOptions;
};

export type RecorderProgress = {
  status: RecorderStatus;
  elapsedMs: number;
  bytesRecorded: number;
  chunkCount: number;
};

export type RecorderResult = {
  blob: Blob;
  url: string;
  mimeType: string;
  durationMs: number;
  bytesRecorded: number;
  videoSettings:
    | MediaTrackSettings
    | null;
  audioSettings:
    | MediaTrackSettings[]
    | null;
};

export type RecorderEvent =
  | {
      type: "status";
      status: RecorderStatus;
    }
  | {
      type: "progress";
      progress: RecorderProgress;
    }
  | {
      type: "stream";
      stream: MediaStream;
    }
  | {
      type: "chunk";
      chunk: Blob;
      bytesRecorded: number;
    }
  | {
      type: "completed";
      result: RecorderResult;
    }
  | {
      type: "cancelled";
    }
  | {
      type: "error";
      error: Error;
    };

export type RecorderListener = (
  event: RecorderEvent,
) => void;

export type DisplayMediaProvider = (
  constraints: DisplayMediaStreamOptions,
) => Promise<MediaStream>;

export type RecorderEngineOptions = {
  onEvent?: RecorderListener;
  getDisplayMedia?: DisplayMediaProvider;
  progressIntervalMs?: number;
};

const DEFAULT_VIDEO_BITRATE =
  9_000_000;
const DEFAULT_AUDIO_BITRATE =
  192_000;
const DEFAULT_TIMESLICE_MS =
  250;
const DEFAULT_PROGRESS_INTERVAL_MS =
  100;

function supportsMimeType(
  mimeType: string,
): boolean {
  return (
    typeof MediaRecorder !==
      "undefined" &&
    MediaRecorder.isTypeSupported(
      mimeType,
    )
  );
}

export function chooseRecorderMimeType(
  requested?: string,
): string {
  if (
    requested &&
    supportsMimeType(requested)
  ) {
    return requested;
  }

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  return (
    candidates.find(
      supportsMimeType,
    ) ?? "video/webm"
  );
}

function normaliseError(
  error: unknown,
  fallback: string,
): Error {
  return error instanceof Error
    ? error
    : new Error(fallback);
}

function stopStream(
  stream: MediaStream | null,
): void {
  stream?.getTracks().forEach(
    (track) => {
      try {
        track.stop();
      } catch {
        // A track may already be stopped.
      }
    },
  );
}

function createDisplayConstraints(
  options: RecorderOptions,
): DisplayMediaStreamOptions {
  const video =
    options.video ?? {};
  const audio =
    options.audio ?? {};

  const videoConstraints: MediaTrackConstraints =
    {};

  if (
    typeof video.width ===
      "number" &&
    video.width > 0
  ) {
    videoConstraints.width = {
      ideal: video.width,
    };
  }

  if (
    typeof video.height ===
      "number" &&
    video.height > 0
  ) {
    videoConstraints.height = {
      ideal: video.height,
    };
  }

  if (
    typeof video.frameRate ===
      "number" &&
    video.frameRate > 0
  ) {
    videoConstraints.frameRate = {
      ideal: video.frameRate,
      max: video.frameRate,
    };
  }

  if (video.displaySurface) {
    (
      videoConstraints as MediaTrackConstraints & {
        displaySurface?:
          | "browser"
          | "window"
          | "monitor";
      }
    ).displaySurface =
      video.displaySurface;
  }

  const constraints: DisplayMediaStreamOptions =
    {
      video: videoConstraints,
      audio: audio.enabled ?? false,
    };

  const extended =
    constraints as DisplayMediaStreamOptions & {
      systemAudio?:
        | "include"
        | "exclude";
      suppressLocalAudioPlayback?: boolean;
    };

  if (audio.systemAudio) {
    extended.systemAudio =
      audio.systemAudio;
  }

  if (
    typeof audio.suppressLocalAudioPlayback ===
    "boolean"
  ) {
    extended.suppressLocalAudioPlayback =
      audio.suppressLocalAudioPlayback;
  }

  return extended;
}

export class RecorderEngine {
  private readonly onEvent?: RecorderListener;
  private readonly getDisplayMedia?: DisplayMediaProvider;
  private readonly progressIntervalMs: number;

  private status: RecorderStatus =
    "idle";
  private recorder:
    | MediaRecorder
    | null = null;
  private stream:
    | MediaStream
    | null = null;
  private chunks: Blob[] = [];
  private bytesRecorded = 0;
  private startedAt = 0;
  private pausedAt = 0;
  private accumulatedPauseMs = 0;
  private progressTimer:
    | ReturnType<typeof setInterval>
    | null = null;
  private activeStopPromise:
    | Promise<RecorderResult>
    | null = null;
  private resolveStop:
    | ((result: RecorderResult) => void)
    | null = null;
  private rejectStop:
    | ((error: Error) => void)
    | null = null;
  private currentMimeType =
    "video/webm";
  private cancelled = false;

  constructor(
    options: RecorderEngineOptions = {},
  ) {
    this.onEvent = options.onEvent;
    this.getDisplayMedia =
      options.getDisplayMedia;
    this.progressIntervalMs =
      Math.max(
        50,
        options.progressIntervalMs ??
          DEFAULT_PROGRESS_INTERVAL_MS,
      );
  }

  get currentStatus(): RecorderStatus {
    return this.status;
  }

  get isRecording(): boolean {
    return (
      this.status === "recording" ||
      this.status === "paused"
    );
  }

  get activeStream(): MediaStream | null {
    return this.stream;
  }

  get elapsedMs(): number {
    if (this.startedAt === 0) {
      return 0;
    }

    const now =
      this.status === "paused"
        ? this.pausedAt
        : performance.now();

    return Math.max(
      0,
      now -
        this.startedAt -
        this.accumulatedPauseMs,
    );
  }

  async requestStream(
    options: RecorderOptions = {},
  ): Promise<MediaStream> {
    this.assertUsable();
    this.assertBrowserSupport();

    if (this.isRecording) {
      throw new Error(
        "A recording is already in progress.",
      );
    }

    if (this.stream) {
      stopStream(this.stream);
      this.stream = null;
    }

    this.setStatus(
      "requesting-permission",
    );

    try {
      const constraints =
        createDisplayConstraints(
          options,
        );

      const stream =
        this.getDisplayMedia
          ? await this.getDisplayMedia(
              constraints,
            )
          : await navigator.mediaDevices.getDisplayMedia(
              constraints,
            );

      const videoTrack =
        stream.getVideoTracks()[0];

      if (!videoTrack) {
        stopStream(stream);

        throw new Error(
          "No video track was returned by the browser.",
        );
      }

      videoTrack.addEventListener(
        "ended",
        () => {
          if (
            this.isRecording ||
            this.status ===
              "ready"
          ) {
            void this.stop();
          }
        },
        {
          once: true,
        },
      );

      this.stream = stream;
      this.setStatus("ready");

      this.onEvent?.({
        type: "stream",
        stream,
      });

      return stream;
    } catch (error) {
      const normalised =
        normaliseError(
          error,
          "The screen or tab could not be captured.",
        );

      this.setStatus("error");

      this.onEvent?.({
        type: "error",
        error: normalised,
      });

      throw normalised;
    }
  }

  async start(
    options: RecorderOptions = {},
  ): Promise<void> {
    this.assertUsable();
    this.assertBrowserSupport();

    if (this.isRecording) {
      throw new Error(
        "A recording is already in progress.",
      );
    }

    this.cancelled = false;
    this.chunks = [];
    this.bytesRecorded = 0;
    this.startedAt = 0;
    this.pausedAt = 0;
    this.accumulatedPauseMs = 0;

    const stream =
      this.stream ??
      (await this.requestStream(
        options,
      ));

    const mimeType =
      chooseRecorderMimeType(
        options.mimeType,
      );

    this.currentMimeType =
      mimeType;

    let recorder: MediaRecorder;

    try {
      recorder = new MediaRecorder(
        stream,
        {
          mimeType,
          videoBitsPerSecond:
            options.videoBitsPerSecond ??
            DEFAULT_VIDEO_BITRATE,
          audioBitsPerSecond:
            options.audioBitsPerSecond ??
            DEFAULT_AUDIO_BITRATE,
        },
      );
    } catch (error) {
      const normalised =
        normaliseError(
          error,
          "The browser could not create a media recorder.",
        );

      this.setStatus("error");

      this.onEvent?.({
        type: "error",
        error: normalised,
      });

      throw normalised;
    }

    this.recorder = recorder;
    this.attachRecorderListeners(
      recorder,
    );

    recorder.start(
      Math.max(
        50,
        options.timesliceMs ??
          DEFAULT_TIMESLICE_MS,
      ),
    );

    this.startedAt =
      performance.now();
    this.setStatus("recording");
    this.startProgressTimer();
  }

  pause(): void {
    this.assertUsable();

    if (
      !this.recorder ||
      this.status !== "recording"
    ) {
      return;
    }

    this.recorder.pause();
    this.pausedAt =
      performance.now();
    this.setStatus("paused");
    this.emitProgress();
  }

  resume(): void {
    this.assertUsable();

    if (
      !this.recorder ||
      this.status !== "paused"
    ) {
      return;
    }

    this.accumulatedPauseMs +=
      performance.now() -
      this.pausedAt;
    this.pausedAt = 0;

    this.recorder.resume();
    this.setStatus("recording");
    this.emitProgress();
  }

  stop(): Promise<RecorderResult> {
    this.assertUsable();

    if (this.activeStopPromise) {
      return this.activeStopPromise;
    }

    if (
      !this.recorder ||
      this.recorder.state ===
        "inactive"
    ) {
      return Promise.reject(
        new Error(
          "There is no active recording to stop.",
        ),
      );
    }

    this.setStatus("stopping");
    this.stopProgressTimer();

    this.activeStopPromise =
      new Promise<RecorderResult>(
        (resolve, reject) => {
          this.resolveStop =
            resolve;
          this.rejectStop =
            reject;
        },
      ).finally(() => {
        this.activeStopPromise =
          null;
        this.resolveStop =
          null;
        this.rejectStop =
          null;
      });

    try {
      this.recorder.requestData();
    } catch {
      // Some browsers throw if data was
      // already requested immediately before stop.
    }

    this.recorder.stop();

    return this.activeStopPromise;
  }

  cancel(): void {
    if (
      this.status ===
      "destroyed"
    ) {
      return;
    }

    this.cancelled = true;
    this.stopProgressTimer();

    if (
      this.recorder &&
      this.recorder.state !==
        "inactive"
    ) {
      try {
        this.recorder.stop();
      } catch {
        // Recorder may already be stopping.
      }
    }

    stopStream(this.stream);
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
    this.bytesRecorded = 0;
    this.setStatus("cancelled");

    this.rejectStop?.(
      new DOMException(
        "The recording was cancelled.",
        "AbortError",
      ),
    );

    this.onEvent?.({
      type: "cancelled",
    });
  }

  releaseStream(): void {
    if (this.isRecording) {
      throw new Error(
        "The capture stream cannot be released while recording.",
      );
    }

    stopStream(this.stream);
    this.stream = null;

    if (
      this.status === "ready" ||
      this.status === "completed" ||
      this.status === "error" ||
      this.status === "cancelled"
    ) {
      this.setStatus("idle");
    }
  }

  destroy(): void {
    if (
      this.status ===
      "destroyed"
    ) {
      return;
    }

    this.cancel();
    this.stopProgressTimer();
    stopStream(this.stream);

    this.stream = null;
    this.recorder = null;
    this.chunks = [];
    this.setStatus("destroyed");
  }

  private attachRecorderListeners(
    recorder: MediaRecorder,
  ): void {
    recorder.addEventListener(
      "dataavailable",
      (event) => {
        if (
          event.data.size <= 0
        ) {
          return;
        }

        this.chunks.push(
          event.data,
        );
        this.bytesRecorded +=
          event.data.size;

        this.onEvent?.({
          type: "chunk",
          chunk: event.data,
          bytesRecorded:
            this.bytesRecorded,
        });

        this.emitProgress();
      },
    );

    recorder.addEventListener(
      "error",
      () => {
        const error = new Error(
          "The browser recorder encountered an error.",
        );

        this.stopProgressTimer();
        this.setStatus("error");

        this.rejectStop?.(error);

        this.onEvent?.({
          type: "error",
          error,
        });
      },
    );

    recorder.addEventListener(
      "stop",
      () => {
        this.handleRecorderStopped();
      },
      {
        once: true,
      },
    );
  }

  private handleRecorderStopped(): void {
    this.stopProgressTimer();

    if (this.cancelled) {
      stopStream(this.stream);
      this.stream = null;
      this.recorder = null;
      this.chunks = [];
      return;
    }

    const durationMs =
      this.elapsedMs;

    const blob = new Blob(
      this.chunks,
      {
        type:
          this.currentMimeType,
      },
    );

    if (blob.size === 0) {
      const error = new Error(
        "The browser did not produce any recorded video data.",
      );

      this.setStatus("error");
      this.rejectStop?.(error);

      this.onEvent?.({
        type: "error",
        error,
      });

      return;
    }

    const videoSettings =
      this.stream
        ?.getVideoTracks()[0]
        ?.getSettings() ?? null;

    const audioTracks =
      this.stream?.getAudioTracks() ??
      [];

    const result: RecorderResult = {
      blob,
      url:
        URL.createObjectURL(
          blob,
        ),
      mimeType:
        this.currentMimeType,
      durationMs,
      bytesRecorded:
        blob.size,
      videoSettings,
      audioSettings:
        audioTracks.length > 0
          ? audioTracks.map(
              (track) =>
                track.getSettings(),
            )
          : null,
    };

    stopStream(this.stream);
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
    this.bytesRecorded =
      blob.size;

    this.setStatus("completed");
    this.emitProgress();

    this.resolveStop?.(result);

    this.onEvent?.({
      type: "completed",
      result,
    });
  }

  private startProgressTimer(): void {
    this.stopProgressTimer();

    this.progressTimer =
      setInterval(() => {
        this.emitProgress();
      }, this.progressIntervalMs);
  }

  private stopProgressTimer(): void {
    if (
      this.progressTimer === null
    ) {
      return;
    }

    clearInterval(
      this.progressTimer,
    );
    this.progressTimer = null;
  }

  private emitProgress(): void {
    this.onEvent?.({
      type: "progress",
      progress: {
        status: this.status,
        elapsedMs:
          this.elapsedMs,
        bytesRecorded:
          this.bytesRecorded,
        chunkCount:
          this.chunks.length,
      },
    });
  }

  private setStatus(
    status: RecorderStatus,
  ): void {
    this.status = status;

    this.onEvent?.({
      type: "status",
      status,
    });
  }

  private assertBrowserSupport(): void {
    if (
      typeof window ===
        "undefined" ||
      typeof navigator ===
        "undefined"
    ) {
      throw new Error(
        "Beacon Studio recording can only run in a browser.",
      );
    }

    if (
      typeof MediaRecorder ===
        "undefined"
    ) {
      throw new Error(
        "This browser does not support video recording.",
      );
    }

    if (
      !navigator.mediaDevices
        ?.getDisplayMedia &&
      !this.getDisplayMedia
    ) {
      throw new Error(
        "This browser does not support display capture.",
      );
    }
  }

  private assertUsable(): void {
    if (
      this.status ===
      "destroyed"
    ) {
      throw new Error(
        "This RecorderEngine has been destroyed.",
      );
    }
  }
}

export function createRecorderEngine(
  options: RecorderEngineOptions = {},
): RecorderEngine {
  return new RecorderEngine(
    options,
  );
}

export function downloadRecording(
  result: RecorderResult,
  fileName = "beacon-studio-recording.webm",
): void {
  const anchor =
    document.createElement("a");

  anchor.href = result.url;
  anchor.download =
    fileName.endsWith(
      ".webm",
    )
      ? fileName
      : `${fileName}.webm`;

  document.body.appendChild(
    anchor,
  );
  anchor.click();
  anchor.remove();
}

export function releaseRecording(
  result: RecorderResult,
): void {
  URL.revokeObjectURL(
    result.url,
  );
}

export default RecorderEngine;