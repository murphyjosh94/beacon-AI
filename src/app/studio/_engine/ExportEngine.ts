import type {
  StudioProject,
} from "../types";
import type {
  PlaybackEngine,
} from "./PlaybackEngine";

export type ExportFormat =
  | "webm";

export type ExportQuality =
  | "720p"
  | "1080p"
  | "1440p"
  | "4k";

export type ExportFrameRate =
  | 30
  | 60;

export type ExportStatus =
  | "idle"
  | "preparing"
  | "recording"
  | "finalising"
  | "completed"
  | "cancelled"
  | "error";

export type ExportPreset = {
  width: number;
  height: number;
  videoBitsPerSecond: number;
};

export type ExportOptions = {
  quality?: ExportQuality;
  width?: number;
  height?: number;
  fps?: ExportFrameRate;
  format?: ExportFormat;
  fileName?: string;
  includeAudio?: boolean;
  playbackRate?: number;
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  countdownMs?: number;
};

export type ExportProgress = {
  status: ExportStatus;
  currentTimeMs: number;
  durationMs: number;
  progress: number;
  message: string;
};

export type ExportResult = {
  blob: Blob;
  url: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  fps: ExportFrameRate;
  durationMs: number;
};

export type ExportEngineEvent =
  | {
      type: "progress";
      progress: ExportProgress;
    }
  | {
      type: "completed";
      result: ExportResult;
    }
  | {
      type: "cancelled";
    }
  | {
      type: "error";
      error: Error;
    };

export type ExportEngineListener = (
  event: ExportEngineEvent,
) => void;

export type DisplayMediaProvider = (
  constraints: DisplayMediaStreamOptions,
) => Promise<MediaStream>;

export type ExportEngineOptions = {
  project: StudioProject;
  playbackEngine: PlaybackEngine;
  onEvent?: ExportEngineListener;
  getDisplayMedia?: DisplayMediaProvider;
};

const QUALITY_PRESETS: Record<
  ExportQuality,
  ExportPreset
> = {
  "720p": {
    width: 1280,
    height: 720,
    videoBitsPerSecond: 5_000_000,
  },
  "1080p": {
    width: 1920,
    height: 1080,
    videoBitsPerSecond: 9_000_000,
  },
  "1440p": {
    width: 2560,
    height: 1440,
    videoBitsPerSecond: 16_000_000,
  },
  "4k": {
    width: 3840,
    height: 2160,
    videoBitsPerSecond: 32_000_000,
  },
};

const DEFAULT_AUDIO_BITRATE =
  192_000;
const DEFAULT_COUNTDOWN_MS =
  500;
const PROGRESS_INTERVAL_MS =
  100;

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

function sanitiseFileName(
  value: string,
): string {
  const cleaned = value
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return cleaned || "beacon-studio-export";
}

function getProjectName(
  project: StudioProject,
): string {
  return (
    project.name?.trim() ||
    "Beacon Studio Export"
  );
}

function getProjectDuration(
  project: StudioProject,
  playbackEngine: PlaybackEngine,
): number {
  const duration =
    project.durationMs ??
    playbackEngine.duration;

  return duration > 0
    ? duration
    : 15_000;
}

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

function chooseMimeType(
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

function wait(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      Math.max(0, milliseconds),
    );
  });
}

function stopStream(
  stream: MediaStream | null,
): void {
  stream?.getTracks().forEach(
    (track) => {
      track.stop();
    },
  );
}

function makeProgress(
  status: ExportStatus,
  currentTimeMs: number,
  durationMs: number,
  message: string,
): ExportProgress {
  return {
    status,
    currentTimeMs,
    durationMs,
    progress:
      durationMs > 0
        ? clamp(
            currentTimeMs /
              durationMs,
            0,
            1,
          )
        : 0,
    message,
  };
}

export class ExportEngine {
  private project: StudioProject;
  private playbackEngine: PlaybackEngine;
  private readonly onEvent?: ExportEngineListener;
  private readonly getDisplayMedia?: DisplayMediaProvider;

  private status: ExportStatus =
    "idle";
  private mediaRecorder:
    | MediaRecorder
    | null = null;
  private mediaStream:
    | MediaStream
    | null = null;
  private progressTimer:
    | ReturnType<typeof setInterval>
    | null = null;
  private chunks: Blob[] = [];
  private cancelled = false;
  private activeExport:
    | Promise<ExportResult>
    | null = null;

  constructor(
    options: ExportEngineOptions,
  ) {
    this.project =
      options.project;
    this.playbackEngine =
      options.playbackEngine;
    this.onEvent = options.onEvent;
    this.getDisplayMedia =
      options.getDisplayMedia;
  }

  get currentStatus(): ExportStatus {
    return this.status;
  }

  get isExporting(): boolean {
    return (
      this.status === "preparing" ||
      this.status === "recording" ||
      this.status === "finalising"
    );
  }

  updateProject(
    project: StudioProject,
  ): void {
    if (this.isExporting) {
      throw new Error(
        "The project cannot be changed during an export.",
      );
    }

    this.project = project;
  }

  updatePlaybackEngine(
    playbackEngine: PlaybackEngine,
  ): void {
    if (this.isExporting) {
      throw new Error(
        "The playback engine cannot be changed during an export.",
      );
    }

    this.playbackEngine =
      playbackEngine;
  }

  export(
    options: ExportOptions = {},
  ): Promise<ExportResult> {
    if (this.activeExport) {
      return this.activeExport;
    }

    this.activeExport =
      this.runExport(options).finally(
        () => {
          this.activeExport = null;
        },
      );

    return this.activeExport;
  }

  cancel(): void {
    if (!this.isExporting) {
      return;
    }

    this.cancelled = true;
    this.status = "cancelled";

    this.stopProgressTimer();

    if (
      this.mediaRecorder &&
      this.mediaRecorder.state !==
        "inactive"
    ) {
      this.mediaRecorder.stop();
    }

    stopStream(this.mediaStream);
    this.mediaStream = null;

    void this.playbackEngine.stop();

    this.onEvent?.({
      type: "cancelled",
    });
  }

  destroy(): void {
    this.cancel();
    this.stopProgressTimer();
    stopStream(this.mediaStream);
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }

  private async runExport(
    options: ExportOptions,
  ): Promise<ExportResult> {
    this.assertBrowserSupport();

    this.cancelled = false;
    this.chunks = [];
    this.status = "preparing";

    const quality =
      options.quality ?? "1080p";
    const preset =
      QUALITY_PRESETS[quality];
    const width =
      options.width ??
      preset.width;
    const height =
      options.height ??
      preset.height;
    const fps =
      options.fps ?? 30;
    const durationMs =
      getProjectDuration(
        this.project,
        this.playbackEngine,
      );
    const mimeType =
      chooseMimeType(
        options.mimeType,
      );
    const fileName = `${sanitiseFileName(
      options.fileName ??
        getProjectName(
          this.project,
        ),
    )}.webm`;

    this.emitProgress(
      makeProgress(
        "preparing",
        0,
        durationMs,
        "Choose the Beacon Studio preview tab or window to begin exporting.",
      ),
    );

    try {
      const stream =
        await this.requestDisplayStream({
          includeAudio:
            options.includeAudio ??
            false,
          width,
          height,
          fps,
        });

      if (this.cancelled) {
        stopStream(stream);
        throw new DOMException(
          "The export was cancelled.",
          "AbortError",
        );
      }

      this.mediaStream = stream;

      const recorder =
        new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond:
            options.videoBitsPerSecond ??
            preset.videoBitsPerSecond,
          audioBitsPerSecond:
            options.audioBitsPerSecond ??
            DEFAULT_AUDIO_BITRATE,
        });

      this.mediaRecorder =
        recorder;

      const recordingComplete =
        this.createRecorderPromise(
          recorder,
        );

      const videoTrack =
        stream.getVideoTracks()[0];

      videoTrack?.addEventListener(
        "ended",
        () => {
          if (
            this.isExporting &&
            recorder.state !==
              "inactive"
          ) {
            recorder.stop();
          }
        },
        {
          once: true,
        },
      );

      const countdownMs =
        options.countdownMs ??
        DEFAULT_COUNTDOWN_MS;

      if (countdownMs > 0) {
        await wait(countdownMs);
      }

      await this.playbackEngine.stop();

      if (
        options.playbackRate &&
        options.playbackRate > 0
      ) {
        this.playbackEngine.setPlaybackRate(
          options.playbackRate,
        );
      }

      recorder.start(250);

      this.status = "recording";
      this.startProgressTimer(
        durationMs,
      );

      this.emitProgress(
        makeProgress(
          "recording",
          0,
          durationMs,
          "Recording the Studio timeline.",
        ),
      );

      await this.playbackEngine.play();
      await this.waitForPlaybackEnd(
        durationMs,
      );

      if (
        this.cancelled
      ) {
        throw new DOMException(
          "The export was cancelled.",
          "AbortError",
        );
      }

      this.status = "finalising";
      this.stopProgressTimer();

      this.emitProgress(
        makeProgress(
          "finalising",
          durationMs,
          durationMs,
          "Finalising the video file.",
        ),
      );

      if (
        recorder.state !==
        "inactive"
      ) {
        recorder.stop();
      }

      await recordingComplete;

      stopStream(stream);
      this.mediaStream = null;

      const blob = new Blob(
        this.chunks,
        {
          type: mimeType,
        },
      );

      if (blob.size === 0) {
        throw new Error(
          "The browser did not produce any recorded video data.",
        );
      }

      const result: ExportResult = {
        blob,
        url:
          URL.createObjectURL(
            blob,
          ),
        fileName,
        mimeType,
        width,
        height,
        fps,
        durationMs,
      };

      this.status = "completed";

      this.emitProgress(
        makeProgress(
          "completed",
          durationMs,
          durationMs,
          "Export complete.",
        ),
      );

      this.onEvent?.({
        type: "completed",
        result,
      });

      return result;
    } catch (error) {
      this.stopProgressTimer();
      stopStream(this.mediaStream);
      this.mediaStream = null;

      if (
        this.cancelled ||
        (
          error instanceof DOMException &&
          error.name === "AbortError"
        )
      ) {
        this.status = "cancelled";

        throw new DOMException(
          "The export was cancelled.",
          "AbortError",
        );
      }

      const normalised =
        error instanceof Error
          ? error
          : new Error(
              "Beacon Studio could not export the video.",
            );

      this.status = "error";

      this.onEvent?.({
        type: "error",
        error: normalised,
      });

      throw normalised;
    } finally {
      this.stopProgressTimer();
      this.mediaRecorder = null;
      this.chunks = [];
    }
  }

  private async requestDisplayStream(
    options: {
      includeAudio: boolean;
      width: number;
      height: number;
      fps: ExportFrameRate;
    },
  ): Promise<MediaStream> {
    const constraints: DisplayMediaStreamOptions =
      {
        video: {
          width: {
            ideal:
              options.width,
          },
          height: {
            ideal:
              options.height,
          },
          frameRate: {
            ideal:
              options.fps,
            max:
              options.fps,
          },
          displaySurface:
            "browser",
        } as MediaTrackConstraints,
        audio:
          options.includeAudio,
      };

    if (
      this.getDisplayMedia
    ) {
      return this.getDisplayMedia(
        constraints,
      );
    }

    return navigator.mediaDevices.getDisplayMedia(
      constraints,
    );
  }

  private createRecorderPromise(
    recorder: MediaRecorder,
  ): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        recorder.addEventListener(
          "dataavailable",
          (event) => {
            if (
              event.data.size > 0
            ) {
              this.chunks.push(
                event.data,
              );
            }
          },
        );

        recorder.addEventListener(
          "stop",
          () => {
            resolve();
          },
          {
            once: true,
          },
        );

        recorder.addEventListener(
          "error",
          () => {
            reject(
              new Error(
                "The browser recorder encountered an error.",
              ),
            );
          },
          {
            once: true,
          },
        );
      },
    );
  }

  private waitForPlaybackEnd(
    durationMs: number,
  ): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        const startedAt =
          performance.now();
        const safetyLimit =
          durationMs * 4 +
          10_000;

        const check = () => {
          if (this.cancelled) {
            reject(
              new DOMException(
                "The export was cancelled.",
                "AbortError",
              ),
            );
            return;
          }

          const state =
            this.playbackEngine.currentState;

          if (
            state === "ended"
          ) {
            resolve();
            return;
          }

          if (
            performance.now() -
              startedAt >
            safetyLimit
          ) {
            reject(
              new Error(
                "The export timed out before playback completed.",
              ),
            );
            return;
          }

          window.setTimeout(
            check,
            50,
          );
        };

        check();
      },
    );
  }

  private startProgressTimer(
    durationMs: number,
  ): void {
    this.stopProgressTimer();

    this.progressTimer =
      setInterval(() => {
        const currentTimeMs =
          clamp(
            this.playbackEngine
              .currentTime,
            0,
            durationMs,
          );

        this.emitProgress(
          makeProgress(
            "recording",
            currentTimeMs,
            durationMs,
            "Recording the Studio timeline.",
          ),
        );
      }, PROGRESS_INTERVAL_MS);
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

  private emitProgress(
    progress: ExportProgress,
  ): void {
    this.onEvent?.({
      type: "progress",
      progress,
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
        "Beacon Studio exports can only run in a browser.",
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
}

export function createExportEngine(
  options: ExportEngineOptions,
): ExportEngine {
  return new ExportEngine(
    options,
  );
}

export function downloadExport(
  result: ExportResult,
): void {
  const anchor =
    document.createElement("a");

  anchor.href = result.url;
  anchor.download =
    result.fileName;

  document.body.appendChild(
    anchor,
  );
  anchor.click();
  anchor.remove();
}

export function releaseExport(
  result: ExportResult,
): void {
  URL.revokeObjectURL(
    result.url,
  );
}

export default ExportEngine;