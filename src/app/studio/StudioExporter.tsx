"use client";

import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createStudioRenderJob,
  type StudioRenderJob,
  type StudioSnapshot,
  useStudio,
} from "./StudioProvider";

export type StudioExportFormat = "mp4" | "webm" | "gif" | "png-sequence";
export type StudioExportResolution =
  | "720p"
  | "1080p"
  | "1440p"
  | "4k"
  | "custom";
export type StudioExportQuality =
  | "draft"
  | "standard"
  | "high"
  | "maximum";
export type StudioExportRange = "project" | "work-area" | "selection";
export type StudioExportBackground = "project" | "transparent";
export type StudioExportStatus =
  | "idle"
  | "validating"
  | "queued"
  | "preparing"
  | "rendering"
  | "completed"
  | "failed"
  | "cancelled";

export type StudioExportSettings = {
  name: string;
  format: StudioExportFormat;
  resolution: StudioExportResolution;
  width: number;
  height: number;
  frameRate: number;
  quality: StudioExportQuality;
  videoBitrateMbps: number;
  audioBitrateKbps: number;
  includeAudio: boolean;
  background: StudioExportBackground;
  range: StudioExportRange;
  rangeStartMs: number;
  rangeEndMs: number;
  loopGif: boolean;
  gifColours: number;
  pngScale: number;
};

export type StudioExportProgress = {
  status: StudioExportStatus;
  progress: number;
  frame: number;
  totalFrames: number;
  elapsedMs: number;
  estimatedRemainingMs: number | null;
  outputUrl?: string;
  outputSizeBytes?: number;
  error?: string;
};

export type StudioExportRequest = {
  id: string;
  projectId: string;
  projectName: string;
  snapshot: StudioSnapshot;
  settings: StudioExportSettings;
  createdAt: string;
};

export type StudioExportResult = {
  requestId: string;
  outputUrl: string;
  outputSizeBytes?: number;
  mimeType: string;
  fileName: string;
  completedAt: string;
};

export type StudioExporterProps = {
  className?: string;
  disabled?: boolean;
  compact?: boolean;
  footer?: ReactNode;
  defaultFormat?: StudioExportFormat;
  defaultResolution?: StudioExportResolution;
  defaultQuality?: StudioExportQuality;
  onExport?: (
    request: StudioExportRequest,
    controls: {
      signal: AbortSignal;
      onProgress: (progress: Partial<StudioExportProgress>) => void;
    },
  ) => Promise<StudioExportResult>;
  onQueued?: (job: StudioRenderJob) => void;
  onCompleted?: (
    result: StudioExportResult,
    request: StudioExportRequest,
  ) => void;
  onFailed?: (error: Error, request: StudioExportRequest) => void;
};

type ResolutionPreset = {
  width: number;
  height: number;
};

type QualityPreset = {
  videoBitrateMbps: number;
  audioBitrateKbps: number;
};

const RESOLUTION_PRESETS: Record<
  Exclude<StudioExportResolution, "custom">,
  ResolutionPreset
> = {
  "720p": {
    width: 1280,
    height: 720,
  },
  "1080p": {
    width: 1920,
    height: 1080,
  },
  "1440p": {
    width: 2560,
    height: 1440,
  },
  "4k": {
    width: 3840,
    height: 2160,
  },
};

const QUALITY_PRESETS: Record<StudioExportQuality, QualityPreset> = {
  draft: {
    videoBitrateMbps: 3,
    audioBitrateKbps: 128,
  },
  standard: {
    videoBitrateMbps: 8,
    audioBitrateKbps: 192,
  },
  high: {
    videoBitrateMbps: 16,
    audioBitrateKbps: 256,
  },
  maximum: {
    videoBitrateMbps: 30,
    audioBitrateKbps: 320,
  },
};

const FORMAT_MIME_TYPES: Record<StudioExportFormat, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  gif: "image/gif",
  "png-sequence": "application/zip",
};

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function formatDuration(durationMs: number): string {
  const safe = Math.max(0, Math.floor(durationMs));
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(sizeBytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = sizeBytes / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : value >= 10 ? 1 : 2)} ${
    units[exponent]
  }`;
}

function sanitiseFileName(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return cleaned || "Beacon Studio export";
}

function extensionForFormat(format: StudioExportFormat): string {
  if (format === "png-sequence") return "zip";
  return format;
}

function snapshotFromStudio(
  state: ReturnType<typeof useStudio>["state"],
): StudioSnapshot {
  return {
    project: state.project,
    timeline: state.timeline,
    assets: state.assets,
    selection: state.selection,
    guides: state.guides,
    preferences: state.preferences,
    panels: state.panels,
    renderQueue: state.renderQueue,
    activeTool: state.activeTool,
  };
}

function estimateOutputSize(
  settings: StudioExportSettings,
  durationMs: number,
): number {
  const durationSeconds = Math.max(0, durationMs / 1000);

  if (settings.format === "gif") {
    const pixels = settings.width * settings.height;
    const colourFactor = settings.gifColours / 256;
    return Math.round(
      pixels *
        Math.max(1, settings.frameRate) *
        durationSeconds *
        0.08 *
        colourFactor,
    );
  }

  if (settings.format === "png-sequence") {
    const frameCount = Math.ceil(
      durationSeconds * Math.max(1, settings.frameRate),
    );
    return Math.round(
      settings.width *
        settings.height *
        4 *
        frameCount *
        0.2 *
        settings.pngScale,
    );
  }

  const videoBits =
    settings.videoBitrateMbps * 1_000_000 * durationSeconds;
  const audioBits = settings.includeAudio
    ? settings.audioBitrateKbps * 1_000 * durationSeconds
    : 0;

  return Math.round((videoBits + audioBits) / 8);
}

function estimateRenderTime(
  settings: StudioExportSettings,
  durationMs: number,
): number {
  const durationSeconds = Math.max(1, durationMs / 1000);
  const pixelRatio =
    (settings.width * settings.height) / (1920 * 1080);
  const qualityFactor =
    settings.quality === "draft"
      ? 0.55
      : settings.quality === "standard"
        ? 0.85
        : settings.quality === "high"
          ? 1.25
          : 1.8;
  const formatFactor =
    settings.format === "gif"
      ? 2
      : settings.format === "png-sequence"
        ? 1.6
        : 1;
  const frameRateFactor = settings.frameRate / 30;

  return Math.round(
    durationSeconds *
      pixelRatio *
      qualityFactor *
      formatFactor *
      frameRateFactor *
      1000,
  );
}

function createDefaultSettings(
  projectName: string,
  width: number,
  height: number,
  frameRate: number,
  durationMs: number,
  format: StudioExportFormat,
  resolution: StudioExportResolution,
  quality: StudioExportQuality,
): StudioExportSettings {
  const qualityPreset = QUALITY_PRESETS[quality];
  const resolutionPreset =
    resolution === "custom"
      ? { width, height }
      : RESOLUTION_PRESETS[resolution];

  return {
    name: projectName,
    format,
    resolution,
    width: resolutionPreset.width,
    height: resolutionPreset.height,
    frameRate,
    quality,
    videoBitrateMbps: qualityPreset.videoBitrateMbps,
    audioBitrateKbps: qualityPreset.audioBitrateKbps,
    includeAudio: true,
    background: "project",
    range: "project",
    rangeStartMs: 0,
    rangeEndMs: durationMs,
    loopGif: true,
    gifColours: 256,
    pngScale: 1,
  };
}

function createRenderJobFromRequest(
  request: StudioExportRequest,
): StudioRenderJob {
  return createStudioRenderJob({
    id: request.id,
    projectId: request.projectId,
    name: `${request.settings.name}.${extensionForFormat(
      request.settings.format,
    )}`,
    status: "queued",
    format: request.settings.format,
    width: request.settings.width,
    height: request.settings.height,
    frameRate: request.settings.frameRate,
    quality: request.settings.quality,
    progress: 0,
    createdAt: request.createdAt,
  });
}

function createUnavailableRendererError(): Error {
  return new Error(
    "No renderer is connected. Pass an onExport handler that sends the Studio snapshot to your browser, server or cloud rendering pipeline.",
  );
}

export default function StudioExporter({
  className = "",
  disabled = false,
  compact = false,
  footer,
  defaultFormat = "mp4",
  defaultResolution = "1080p",
  defaultQuality = "high",
  onExport,
  onQueued,
  onCompleted,
  onFailed,
}: StudioExporterProps) {
  const { state, actions } = useStudio();

  const [settings, setSettings] = useState<StudioExportSettings>(() =>
    createDefaultSettings(
      state.project.name,
      state.project.width,
      state.project.height,
      state.project.frameRate,
      state.timeline.durationMs,
      defaultFormat,
      defaultResolution,
      defaultQuality,
    ),
  );

  const [progress, setProgress] = useState<StudioExportProgress>({
    status: "idle",
    progress: 0,
    frame: 0,
    totalFrames: 0,
    elapsedMs: 0,
    estimatedRemainingMs: null,
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<StudioExportResult | null>(
    null,
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const activeRequestRef = useRef<StudioExportRequest | null>(null);

  const selectedClipRange = useMemo(() => {
    const selected = new Set(state.selection.clipIds);
    const clips = state.timeline.tracks.flatMap((track) =>
      track.clips.filter((clip) => selected.has(clip.id)),
    );

    if (!clips.length) return null;

    return {
      startMs: Math.min(...clips.map((clip) => clip.startMs)),
      endMs: Math.max(
        ...clips.map((clip) => clip.startMs + clip.durationMs),
      ),
    };
  }, [state.selection.clipIds, state.timeline.tracks]);

  const workAreaRange = useMemo(
    () => ({
      startMs: state.timeline.inPointMs ?? 0,
      endMs:
        state.timeline.outPointMs ?? state.timeline.durationMs,
    }),
    [
      state.timeline.durationMs,
      state.timeline.inPointMs,
      state.timeline.outPointMs,
    ],
  );

  const effectiveRange = useMemo(() => {
    if (settings.range === "selection" && selectedClipRange) {
      return selectedClipRange;
    }

    if (settings.range === "work-area") {
      return workAreaRange;
    }

    return {
      startMs: settings.rangeStartMs,
      endMs: settings.rangeEndMs,
    };
  }, [
    selectedClipRange,
    settings.range,
    settings.rangeEndMs,
    settings.rangeStartMs,
    workAreaRange,
  ]);

  const exportDurationMs = Math.max(
    0,
    effectiveRange.endMs - effectiveRange.startMs,
  );

  const estimatedSizeBytes = useMemo(
    () => estimateOutputSize(settings, exportDurationMs),
    [exportDurationMs, settings],
  );

  const estimatedRenderMs = useMemo(
    () => estimateRenderTime(settings, exportDurationMs),
    [exportDurationMs, settings],
  );

  const totalFrames = useMemo(
    () =>
      Math.ceil(
        (exportDurationMs / 1000) * Math.max(1, settings.frameRate),
      ),
    [exportDurationMs, settings.frameRate],
  );

  const isBusy =
    progress.status === "validating" ||
    progress.status === "queued" ||
    progress.status === "preparing" ||
    progress.status === "rendering";

  const updateSettings = useCallback(
    (patch: Partial<StudioExportSettings>) => {
      setSettings((current) => ({
        ...current,
        ...patch,
      }));
    },
    [],
  );

  const clearElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current !== null) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearElapsedTimer();
      abortControllerRef.current?.abort();
    };
  }, [clearElapsedTimer]);

  useEffect(() => {
    setSettings((current) => ({
      ...current,
      name:
        current.name === "" ||
        current.name === state.project.name
          ? state.project.name
          : current.name,
      rangeEndMs:
        current.range === "project"
          ? state.timeline.durationMs
          : current.rangeEndMs,
    }));
  }, [state.project.name, state.timeline.durationMs]);

  const applyResolution = (
    resolution: StudioExportResolution,
  ) => {
    if (resolution === "custom") {
      updateSettings({
        resolution,
      });
      return;
    }

    const preset = RESOLUTION_PRESETS[resolution];

    updateSettings({
      resolution,
      width: preset.width,
      height: preset.height,
    });
  };

  const applyQuality = (quality: StudioExportQuality) => {
    const preset = QUALITY_PRESETS[quality];

    updateSettings({
      quality,
      videoBitrateMbps: preset.videoBitrateMbps,
      audioBitrateKbps: preset.audioBitrateKbps,
    });
  };

  const applyRange = (range: StudioExportRange) => {
    if (range === "selection" && selectedClipRange) {
      updateSettings({
        range,
        rangeStartMs: selectedClipRange.startMs,
        rangeEndMs: selectedClipRange.endMs,
      });
      return;
    }

    if (range === "work-area") {
      updateSettings({
        range,
        rangeStartMs: workAreaRange.startMs,
        rangeEndMs: workAreaRange.endMs,
      });
      return;
    }

    updateSettings({
      range,
      rangeStartMs: 0,
      rangeEndMs: state.timeline.durationMs,
    });
  };

  const validate = (): string[] => {
    const errors: string[] = [];

    if (!settings.name.trim()) {
      errors.push("Enter a file name.");
    }

    if (
      !Number.isFinite(settings.width) ||
      settings.width < 16 ||
      settings.width > 7680
    ) {
      errors.push("Width must be between 16 and 7680 pixels.");
    }

    if (
      !Number.isFinite(settings.height) ||
      settings.height < 16 ||
      settings.height > 4320
    ) {
      errors.push("Height must be between 16 and 4320 pixels.");
    }

    if (
      !Number.isFinite(settings.frameRate) ||
      settings.frameRate < 1 ||
      settings.frameRate > 120
    ) {
      errors.push("Frame rate must be between 1 and 120 fps.");
    }

    if (exportDurationMs <= 0) {
      errors.push("The selected export range has no duration.");
    }

    if (
      settings.range === "selection" &&
      !selectedClipRange
    ) {
      errors.push("Select at least one timeline clip to export a selection.");
    }

    if (
      settings.background === "transparent" &&
      settings.format === "mp4"
    ) {
      errors.push(
        "MP4 does not support transparent output. Choose WebM, GIF or PNG sequence.",
      );
    }

    if (
      settings.format === "gif" &&
      settings.frameRate > 30
    ) {
      errors.push("GIF exports are limited to 30 fps.");
    }

    return errors;
  };

  const startElapsedTimer = () => {
    startedAtRef.current = Date.now();
    clearElapsedTimer();

    elapsedTimerRef.current = window.setInterval(() => {
      const startedAt = startedAtRef.current;
      if (!startedAt) return;

      setProgress((current) => {
        const elapsedMs = Date.now() - startedAt;
        const ratio = clamp(current.progress, 0, 1);
        const estimatedRemainingMs =
          ratio > 0 && ratio < 1
            ? Math.max(
                0,
                Math.round((elapsedMs / ratio) * (1 - ratio)),
              )
            : current.estimatedRemainingMs;

        return {
          ...current,
          elapsedMs,
          estimatedRemainingMs,
        };
      });
    }, 250);
  };

  const handleExport = async () => {
    if (disabled || isBusy) return;

    setLastResult(null);
    setProgress({
      status: "validating",
      progress: 0,
      frame: 0,
      totalFrames,
      elapsedMs: 0,
      estimatedRemainingMs: estimatedRenderMs,
    });

    const errors = validate();
    setValidationErrors(errors);

    if (errors.length) {
      setProgress((current) => ({
        ...current,
        status: "failed",
        error: errors[0],
      }));
      return;
    }

    const resolvedSettings: StudioExportSettings = {
      ...settings,
      name: sanitiseFileName(settings.name),
      rangeStartMs: effectiveRange.startMs,
      rangeEndMs: effectiveRange.endMs,
    };

    const request: StudioExportRequest = {
      id: createId("studio_export"),
      projectId: state.project.id,
      projectName: state.project.name,
      snapshot: snapshotFromStudio(state),
      settings: resolvedSettings,
      createdAt: new Date().toISOString(),
    };

    activeRequestRef.current = request;

    const job = createRenderJobFromRequest(request);
    actions.enqueueRender(job);
    onQueued?.(job);

    setProgress({
      status: "queued",
      progress: 0,
      frame: 0,
      totalFrames,
      elapsedMs: 0,
      estimatedRemainingMs: estimatedRenderMs,
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;
    startElapsedTimer();

    try {
      setProgress((current) => ({
        ...current,
        status: "preparing",
      }));

      actions.updateRenderJob(job.id, {
        status: "preparing",
        startedAt: new Date().toISOString(),
      });

      if (!onExport) {
        throw createUnavailableRendererError();
      }

      const result = await onExport(request, {
        signal: controller.signal,
        onProgress: (next) => {
          setProgress((current) => {
            const nextProgress = clamp(
              next.progress ?? current.progress,
              0,
              1,
            );
            const frame =
              next.frame ??
              Math.round(nextProgress * current.totalFrames);

            return {
              ...current,
              ...next,
              status: next.status ?? "rendering",
              progress: nextProgress,
              frame,
            };
          });

          actions.updateRenderJob(job.id, {
            status:
              next.status === "preparing"
                ? "preparing"
                : next.status === "failed"
                  ? "failed"
                  : next.status === "cancelled"
                    ? "cancelled"
                    : "rendering",
            progress: clamp(next.progress ?? 0, 0, 1),
            error: next.error,
          });
        },
      });

      clearElapsedTimer();

      setLastResult(result);
      setProgress((current) => ({
        ...current,
        status: "completed",
        progress: 1,
        frame: current.totalFrames,
        estimatedRemainingMs: 0,
        outputUrl: result.outputUrl,
        outputSizeBytes: result.outputSizeBytes,
      }));

      actions.updateRenderJob(job.id, {
        status: "completed",
        progress: 1,
        completedAt: result.completedAt,
        outputUrl: result.outputUrl,
      });

      onCompleted?.(result, request);
    } catch (error) {
      clearElapsedTimer();

      const aborted =
        controller.signal.aborted ||
        (error instanceof DOMException &&
          error.name === "AbortError");

      if (aborted) {
        setProgress((current) => ({
          ...current,
          status: "cancelled",
          error: undefined,
        }));

        actions.updateRenderJob(job.id, {
          status: "cancelled",
          completedAt: new Date().toISOString(),
        });

        return;
      }

      const resolvedError =
        error instanceof Error
          ? error
          : new Error("The Studio export failed.");

      setProgress((current) => ({
        ...current,
        status: "failed",
        error: resolvedError.message,
      }));

      actions.updateRenderJob(job.id, {
        status: "failed",
        error: resolvedError.message,
        completedAt: new Date().toISOString(),
      });

      onFailed?.(resolvedError, request);
    } finally {
      abortControllerRef.current = null;
      activeRequestRef.current = null;
      startedAtRef.current = null;
    }
  };

  const cancelExport = () => {
    abortControllerRef.current?.abort();
  };

  const retryExport = () => {
    setValidationErrors([]);
    setProgress({
      status: "idle",
      progress: 0,
      frame: 0,
      totalFrames,
      elapsedMs: 0,
      estimatedRemainingMs: estimatedRenderMs,
    });

    void handleExport();
  };

  const downloadResult = () => {
    if (!lastResult) return;

    const anchor = document.createElement("a");
    anchor.href = lastResult.outputUrl;
    anchor.download = lastResult.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleNumberInput =
    (
      key:
        | "width"
        | "height"
        | "frameRate"
        | "videoBitrateMbps"
        | "audioBitrateKbps"
        | "gifColours"
        | "pngScale",
    ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);

      updateSettings({
        [key]: Number.isFinite(value) ? value : 0,
      } as Partial<StudioExportSettings>);
    };

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      aria-label="Beacon Studio exporter"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/95 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Studio exporter
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Configure the output and send this project to the rendering queue.
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
            progress.status === "completed"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : progress.status === "failed"
                ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                : isBusy
                  ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-400"
          }`}
        >
          {progress.status === "idle"
            ? "Ready"
            : progress.status === "validating"
              ? "Validating"
              : progress.status === "queued"
                ? "Queued"
                : progress.status === "preparing"
                  ? "Preparing"
                  : progress.status === "rendering"
                    ? "Rendering"
                    : progress.status === "completed"
                      ? "Completed"
                      : progress.status === "cancelled"
                        ? "Cancelled"
                        : "Failed"}
        </span>
      </header>

      <div
        className={`grid ${
          compact
            ? "grid-cols-1"
            : "lg:grid-cols-[minmax(0,1fr)_340px]"
        }`}
      >
        <div className="space-y-4 border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
          <section className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
            <h3 className="text-sm font-semibold text-white">
              Output
            </h3>

            <label className="mt-4 block text-[11px] text-slate-500">
              File name
              <input
                value={settings.name}
                disabled={disabled || isBusy}
                onChange={(event) =>
                  updateSettings({
                    name: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
              />
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-[11px] text-slate-500">
                Format
                <select
                  value={settings.format}
                  disabled={disabled || isBusy}
                  onChange={(event) =>
                    updateSettings({
                      format: event.target.value as StudioExportFormat,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                  <option value="gif">GIF</option>
                  <option value="png-sequence">PNG sequence</option>
                </select>
              </label>

              <label className="block text-[11px] text-slate-500">
                Resolution
                <select
                  value={settings.resolution}
                  disabled={disabled || isBusy}
                  onChange={(event) =>
                    applyResolution(
                      event.target.value as StudioExportResolution,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="1440p">1440p</option>
                  <option value="4k">4K</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-[11px] text-slate-500">
                Width
                <input
                  type="number"
                  min={16}
                  max={7680}
                  value={settings.width}
                  disabled={disabled || isBusy}
                  onChange={(event) => {
                    handleNumberInput("width")(event);
                    updateSettings({
                      resolution: "custom",
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                />
              </label>

              <label className="block text-[11px] text-slate-500">
                Height
                <input
                  type="number"
                  min={16}
                  max={4320}
                  value={settings.height}
                  disabled={disabled || isBusy}
                  onChange={(event) => {
                    handleNumberInput("height")(event);
                    updateSettings({
                      resolution: "custom",
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-[11px] text-slate-500">
                Frame rate
                <select
                  value={settings.frameRate}
                  disabled={disabled || isBusy}
                  onChange={(event) =>
                    updateSettings({
                      frameRate: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                >
                  <option value={24}>24 fps</option>
                  <option value={25}>25 fps</option>
                  <option value={30}>30 fps</option>
                  <option value={50}>50 fps</option>
                  <option value={60}>60 fps</option>
                </select>
              </label>

              <label className="block text-[11px] text-slate-500">
                Quality
                <select
                  value={settings.quality}
                  disabled={disabled || isBusy}
                  onChange={(event) =>
                    applyQuality(
                      event.target.value as StudioExportQuality,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                >
                  <option value="draft">Draft</option>
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="maximum">Maximum</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
            <h3 className="text-sm font-semibold text-white">
              Export range
            </h3>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["project", "Entire project"],
                  ["work-area", "Work area"],
                  ["selection", "Selection"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  disabled={
                    disabled ||
                    isBusy ||
                    (value === "selection" && !selectedClipRange)
                  }
                  onClick={() => applyRange(value)}
                  className={`rounded-lg border px-3 py-2 text-xs transition disabled:opacity-35 ${
                    settings.range === value
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-[11px] text-slate-500">
                Start (ms)
                <input
                  type="number"
                  min={0}
                  value={effectiveRange.startMs}
                  disabled={
                    disabled ||
                    isBusy ||
                    settings.range !== "project"
                  }
                  onChange={(event) =>
                    updateSettings({
                      rangeStartMs: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                />
              </label>

              <label className="block text-[11px] text-slate-500">
                End (ms)
                <input
                  type="number"
                  min={0}
                  value={effectiveRange.endMs}
                  disabled={
                    disabled ||
                    isBusy ||
                    settings.range !== "project"
                  }
                  onChange={(event) =>
                    updateSettings({
                      rangeEndMs: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">
                Advanced settings
              </h3>
              <button
                type="button"
                onClick={() => setAdvancedOpen((current) => !current)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
              >
                {advancedOpen ? "Hide" : "Show"}
              </button>
            </div>

            {advancedOpen ? (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-[11px] text-slate-500">
                    Video bitrate (Mbps)
                    <input
                      type="number"
                      min={0.5}
                      max={200}
                      step={0.5}
                      value={settings.videoBitrateMbps}
                      disabled={disabled || isBusy}
                      onChange={handleNumberInput("videoBitrateMbps")}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                    />
                  </label>

                  <label className="block text-[11px] text-slate-500">
                    Audio bitrate (Kbps)
                    <input
                      type="number"
                      min={64}
                      max={512}
                      step={32}
                      value={settings.audioBitrateKbps}
                      disabled={
                        disabled ||
                        isBusy ||
                        !settings.includeAudio
                      }
                      onChange={handleNumberInput("audioBitrateKbps")}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                    />
                  </label>
                </div>

                <label className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                  <span>Include project audio</span>
                  <input
                    type="checkbox"
                    checked={settings.includeAudio}
                    disabled={
                      disabled ||
                      isBusy ||
                      settings.format === "gif" ||
                      settings.format === "png-sequence"
                    }
                    onChange={(event) =>
                      updateSettings({
                        includeAudio: event.target.checked,
                      })
                    }
                    className="accent-cyan-400"
                  />
                </label>

                <label className="block text-[11px] text-slate-500">
                  Background
                  <select
                    value={settings.background}
                    disabled={disabled || isBusy}
                    onChange={(event) =>
                      updateSettings({
                        background: event.target
                          .value as StudioExportBackground,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                  >
                    <option value="project">Project background</option>
                    <option value="transparent">
                      Transparent background
                    </option>
                  </select>
                </label>

                {settings.format === "gif" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-[11px] text-slate-500">
                      GIF colours
                      <select
                        value={settings.gifColours}
                        disabled={disabled || isBusy}
                        onChange={(event) =>
                          updateSettings({
                            gifColours: Number(event.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value={64}>64</option>
                        <option value={128}>128</option>
                        <option value={256}>256</option>
                      </select>
                    </label>

                    <label className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                      <span>Loop animation</span>
                      <input
                        type="checkbox"
                        checked={settings.loopGif}
                        disabled={disabled || isBusy}
                        onChange={(event) =>
                          updateSettings({
                            loopGif: event.target.checked,
                          })
                        }
                        className="accent-cyan-400"
                      />
                    </label>
                  </div>
                ) : null}

                {settings.format === "png-sequence" ? (
                  <label className="block text-[11px] text-slate-500">
                    PNG scale
                    <select
                      value={settings.pngScale}
                      disabled={disabled || isBusy}
                      onChange={(event) =>
                        updateSettings({
                          pngScale: Number(event.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value={0.5}>0.5×</option>
                      <option value={1}>1×</option>
                      <option value={2}>2×</option>
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}
          </section>

          {validationErrors.length ? (
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4">
              <h3 className="text-xs font-semibold text-rose-100">
                Fix these export settings
              </h3>
              <div className="mt-2 space-y-1 text-xs text-rose-200">
                {validationErrors.map((error) => (
                  <p key={error}>• {error}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 bg-slate-900/45 p-4">
          <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-white">
              Export summary
            </h3>

            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Output</dt>
                <dd className="text-right text-slate-200">
                  {settings.width} × {settings.height}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Duration</dt>
                <dd className="text-right text-slate-200">
                  {formatDuration(exportDurationMs)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Frames</dt>
                <dd className="text-right text-slate-200">
                  {totalFrames.toLocaleString("en-GB")}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Estimated size</dt>
                <dd className="text-right text-slate-200">
                  {formatFileSize(estimatedSizeBytes)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Estimated render</dt>
                <dd className="text-right text-slate-200">
                  {formatDuration(estimatedRenderMs)}
                </dd>
              </div>
            </dl>
          </section>

          {progress.status !== "idle" ? (
            <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">
                  Render progress
                </h3>
                <span className="font-mono text-xs text-cyan-100">
                  {Math.round(progress.progress * 100)}%
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-[width] duration-200"
                  style={{
                    width: `${clamp(progress.progress, 0, 1) * 100}%`,
                  }}
                />
              </div>

              <dl className="mt-4 space-y-2 text-[11px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Frame</dt>
                  <dd className="text-slate-300">
                    {progress.frame.toLocaleString("en-GB")} /{" "}
                    {progress.totalFrames.toLocaleString("en-GB")}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Elapsed</dt>
                  <dd className="text-slate-300">
                    {formatDuration(progress.elapsedMs)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Remaining</dt>
                  <dd className="text-slate-300">
                    {progress.estimatedRemainingMs === null
                      ? "Calculating"
                      : formatDuration(progress.estimatedRemainingMs)}
                  </dd>
                </div>
              </dl>

              {progress.error ? (
                <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs leading-5 text-rose-200">
                  {progress.error}
                </p>
              ) : null}
            </section>
          ) : null}

          <div className="space-y-2">
            {!isBusy &&
            progress.status !== "completed" ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => void handleExport()}
                className="w-full rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add export to queue
              </button>
            ) : null}

            {isBusy ? (
              <button
                type="button"
                onClick={cancelExport}
                className="w-full rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
              >
                Cancel export
              </button>
            ) : null}

            {progress.status === "failed" ? (
              <button
                type="button"
                onClick={retryExport}
                className="w-full rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-300/20"
              >
                Retry export
              </button>
            ) : null}

            {progress.status === "completed" && lastResult ? (
              <>
                <button
                  type="button"
                  onClick={downloadResult}
                  className="w-full rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20"
                >
                  Download export
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLastResult(null);
                    setProgress({
                      status: "idle",
                      progress: 0,
                      frame: 0,
                      totalFrames,
                      elapsedMs: 0,
                      estimatedRemainingMs: estimatedRenderMs,
                    });
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 hover:bg-white/10"
                >
                  Create another export
                </button>
              </>
            ) : null}
          </div>

          {footer}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3 text-[11px] text-slate-500">
        <span>
          {settings.format.toUpperCase()} · {settings.frameRate} fps ·{" "}
          {settings.quality}
        </span>
        <span>
          Renderer: {onExport ? "connected" : "not connected"}
        </span>
      </footer>
    </section>
  );
}