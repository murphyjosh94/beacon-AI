"use client";

import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

export type RenderFormat =
  | "mp4"
  | "webm"
  | "gif";

export type RenderResolution =
  | "720p"
  | "1080p"
  | "1440p"
  | "4k"
  | "custom";

export type RenderJobStatus =
  | "queued"
  | "preparing"
  | "rendering"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type RenderJob = {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  format: RenderFormat;
  resolution: RenderResolution;
  width: number;
  height: number;
  fps: number;
  quality: number;
  status: RenderJobStatus;
  progress: number;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  etaSeconds?: number | null;
  outputUrl?: string | null;
  outputSizeBytes?: number | null;
  thumbnailUrl?: string | null;
  error?: string | null;
  metadata?: Record<string, unknown>;
};

export type RenderPreset = {
  id: string;
  label: string;
  description: string;
  format: RenderFormat;
  resolution: RenderResolution;
  width: number;
  height: number;
  fps: number;
  quality: number;
};

export type RenderQueueProps = {
  jobs: RenderJob[];
  disabled?: boolean;
  className?: string;
  maxConcurrentJobs?: number;
  defaultProjectId?: string;
  defaultProjectName?: string;
  onCreateJob?: (
    job: Omit<
      RenderJob,
      | "id"
      | "status"
      | "progress"
      | "createdAt"
    >,
  ) => Promise<RenderJob | void> | RenderJob | void;
  onPauseJob?: (
    jobId: string,
  ) => Promise<void> | void;
  onResumeJob?: (
    jobId: string,
  ) => Promise<void> | void;
  onCancelJob?: (
    jobId: string,
  ) => Promise<void> | void;
  onRetryJob?: (
    jobId: string,
  ) => Promise<RenderJob | void> | RenderJob | void;
  onDeleteJob?: (
    jobId: string,
  ) => Promise<void> | void;
  onClearCompleted?: () => Promise<void> | void;
  onReorderJobs?: (
    orderedJobIds: string[],
  ) => Promise<void> | void;
  onDownloadJob?: (
    job: RenderJob,
  ) => Promise<void> | void;
};

type QueueFilter =
  | "all"
  | "active"
  | "completed"
  | "failed";

type QueueSort =
  | "queue"
  | "newest"
  | "oldest"
  | "name";

const PRESETS: RenderPreset[] = [
  {
    id: "web-720",
    label: "HD 720p",
    description:
      "Fast export for previews and web sharing.",
    format: "mp4",
    resolution: "720p",
    width: 1280,
    height: 720,
    fps: 30,
    quality: 72,
  },
  {
    id: "web-1080",
    label: "Full HD 1080p",
    description:
      "Balanced quality for most exports.",
    format: "mp4",
    resolution: "1080p",
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 82,
  },
  {
    id: "high-1440",
    label: "QHD 1440p",
    description:
      "High-detail export for larger displays.",
    format: "mp4",
    resolution: "1440p",
    width: 2560,
    height: 1440,
    fps: 30,
    quality: 88,
  },
  {
    id: "ultra-4k",
    label: "Ultra HD 4K",
    description:
      "Maximum detail with longer render time.",
    format: "mp4",
    resolution: "4k",
    width: 3840,
    height: 2160,
    fps: 30,
    quality: 92,
  },
  {
    id: "transparent-webm",
    label: "WebM",
    description:
      "Efficient web video export.",
    format: "webm",
    resolution: "1080p",
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 82,
  },
  {
    id: "animated-gif",
    label: "Animated GIF",
    description:
      "Short looping preview with smaller dimensions.",
    format: "gif",
    resolution: "720p",
    width: 1280,
    height: 720,
    fps: 15,
    quality: 70,
  },
];

const ACTIVE_STATUSES: RenderJobStatus[] = [
  "queued",
  "preparing",
  "rendering",
  "paused",
];

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}

function formatFileSize(
  value?: number | null,
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return "Unknown size";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const units = [
    "KB",
    "MB",
    "GB",
    "TB",
  ];
  let size = value / 1024;
  let index = 0;

  while (
    size >= 1024 &&
    index < units.length - 1
  ) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(
    size >= 100 ? 0 : 1,
  )} ${units[index]}`;
}

function formatDuration(
  milliseconds?: number | null,
): string {
  if (
    typeof milliseconds !== "number" ||
    !Number.isFinite(milliseconds) ||
    milliseconds < 0
  ) {
    return "—";
  }

  const totalSeconds =
    Math.round(milliseconds / 1000);
  const hours = Math.floor(
    totalSeconds / 3600,
  );
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  );
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatEta(
  seconds?: number | null,
): string {
  if (
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "Calculating…";
  }

  if (seconds < 60) {
    return `${Math.ceil(seconds)}s remaining`;
  }

  const minutes = Math.floor(
    seconds / 60,
  );
  const remainder = Math.ceil(
    seconds % 60,
  );

  if (minutes < 60) {
    return `${minutes}m ${remainder}s remaining`;
  }

  const hours = Math.floor(
    minutes / 60,
  );
  const mins = minutes % 60;

  return `${hours}h ${mins}m remaining`;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function statusLabel(
  status: RenderJobStatus,
): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "preparing":
      return "Preparing";
    case "rendering":
      return "Rendering";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function statusClassName(
  status: RenderJobStatus,
): string {
  switch (status) {
    case "completed":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
    case "failed":
      return "border-rose-400/20 bg-rose-500/10 text-rose-100";
    case "cancelled":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
    case "paused":
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
    case "rendering":
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
    case "preparing":
      return "border-violet-400/20 bg-violet-500/10 text-violet-100";
    case "queued":
    default:
      return "border-sky-400/20 bg-sky-500/10 text-sky-100";
  }
}

function estimateOutputSize(
  width: number,
  height: number,
  fps: number,
  quality: number,
  durationMs?: number | null,
  format: RenderFormat = "mp4",
): number | null {
  if (
    typeof durationMs !== "number" ||
    durationMs <= 0
  ) {
    return null;
  }

  const durationSeconds =
    durationMs / 1000;
  const pixels =
    width * height;
  const qualityFactor =
    clamp(quality, 1, 100) / 100;
  const formatFactor =
    format === "gif"
      ? 2.3
      : format === "webm"
        ? 0.75
        : 1;

  const bitsPerSecond =
    pixels *
    fps *
    0.07 *
    qualityFactor *
    formatFactor;

  return Math.round(
    (bitsPerSecond *
      durationSeconds) /
      8,
  );
}

function getHardwareMessage(): string {
  if (
    typeof navigator === "undefined"
  ) {
    return "Hardware detection unavailable";
  }

  const cores =
    navigator.hardwareConcurrency;

  if (
    typeof cores !== "number"
  ) {
    return "Hardware detection unavailable";
  }

  if (cores >= 12) {
    return `${cores} logical cores detected · excellent for local rendering`;
  }

  if (cores >= 8) {
    return `${cores} logical cores detected · suitable for local rendering`;
  }

  if (cores >= 4) {
    return `${cores} logical cores detected · exports may take longer`;
  }

  return `${cores} logical cores detected · cloud rendering recommended`;
}

export default function RenderQueue({
  jobs,
  disabled = false,
  className = "",
  maxConcurrentJobs = 2,
  defaultProjectId = "",
  defaultProjectName = "Untitled project",
  onCreateJob,
  onPauseJob,
  onResumeJob,
  onCancelJob,
  onRetryJob,
  onDeleteJob,
  onClearCompleted,
  onReorderJobs,
  onDownloadJob,
}: RenderQueueProps) {
  const [localJobs, setLocalJobs] =
    useState<RenderJob[]>(jobs);
  const [filter, setFilter] =
    useState<QueueFilter>("all");
  const [sort, setSort] =
    useState<QueueSort>("queue");
  const [selectedJobId, setSelectedJobId] =
    useState<string | null>(
      jobs[0]?.id ?? null,
    );
  const [showCreatePanel, setShowCreatePanel] =
    useState(false);
  const [selectedPresetId, setSelectedPresetId] =
    useState(PRESETS[1].id);
  const [jobName, setJobName] =
    useState("Beacon Studio export");
  const [projectDurationMs, setProjectDurationMs] =
    useState(10_000);
  const [customWidth, setCustomWidth] =
    useState(1920);
  const [customHeight, setCustomHeight] =
    useState(1080);
  const [customFps, setCustomFps] =
    useState(30);
  const [customQuality, setCustomQuality] =
    useState(82);
  const [customFormat, setCustomFormat] =
    useState<RenderFormat>("mp4");
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    setLocalJobs(jobs);

    if (
      selectedJobId &&
      !jobs.some(
        (job) =>
          job.id === selectedJobId,
      )
    ) {
      setSelectedJobId(
        jobs[0]?.id ?? null,
      );
    }
  }, [jobs, selectedJobId]);

  const selectedPreset =
    useMemo(
      () =>
        PRESETS.find(
          (preset) =>
            preset.id ===
            selectedPresetId,
        ) ?? PRESETS[1],
      [selectedPresetId],
    );

  useEffect(() => {
    setCustomWidth(
      selectedPreset.width,
    );
    setCustomHeight(
      selectedPreset.height,
    );
    setCustomFps(
      selectedPreset.fps,
    );
    setCustomQuality(
      selectedPreset.quality,
    );
    setCustomFormat(
      selectedPreset.format,
    );
  }, [selectedPreset]);

  const visibleJobs = useMemo(() => {
    const filtered =
      localJobs.filter((job) => {
        if (filter === "active") {
          return ACTIVE_STATUSES.includes(
            job.status,
          );
        }

        if (
          filter === "completed"
        ) {
          return (
            job.status === "completed"
          );
        }

        if (filter === "failed") {
          return (
            job.status === "failed"
          );
        }

        return true;
      });

    if (sort === "queue") {
      return filtered;
    }

    return [...filtered].sort(
      (first, second) => {
        if (sort === "newest") {
          return (
            new Date(
              second.createdAt,
            ).getTime() -
            new Date(
              first.createdAt,
            ).getTime()
          );
        }

        if (sort === "oldest") {
          return (
            new Date(
              first.createdAt,
            ).getTime() -
            new Date(
              second.createdAt,
            ).getTime()
          );
        }

        return first.name.localeCompare(
          second.name,
        );
      },
    );
  }, [filter, localJobs, sort]);

  const selectedJob =
    useMemo(
      () =>
        localJobs.find(
          (job) =>
            job.id === selectedJobId,
        ) ?? null,
      [localJobs, selectedJobId],
    );

  const activeCount =
    localJobs.filter((job) =>
      ["preparing", "rendering"].includes(
        job.status,
      ),
    ).length;

  const queuedCount =
    localJobs.filter(
      (job) =>
        job.status === "queued",
    ).length;

  const completedCount =
    localJobs.filter(
      (job) =>
        job.status === "completed",
    ).length;

  const estimatedSize =
    estimateOutputSize(
      customWidth,
      customHeight,
      customFps,
      customQuality,
      projectDurationMs,
      customFormat,
    );

  const mutateJob = (
    jobId: string,
    updater: (
      job: RenderJob,
    ) => RenderJob,
  ) => {
    setLocalJobs((current) =>
      current.map((job) =>
        job.id === jobId
          ? updater(job)
          : job,
      ),
    );
  };

  const handleCreateJob =
    async () => {
      if (
        disabled ||
        isSubmitting
      ) {
        return;
      }

      const trimmedName =
        jobName.trim();

      if (!trimmedName) {
        setErrorMessage(
          "Enter a name for the render.",
        );
        return;
      }

      const draft: Omit<
        RenderJob,
        | "id"
        | "status"
        | "progress"
        | "createdAt"
      > = {
        projectId:
          defaultProjectId,
        projectName:
          defaultProjectName,
        name: trimmedName,
        format: customFormat,
        resolution:
          selectedPreset.resolution,
        width: clamp(
          Math.round(customWidth),
          64,
          7680,
        ),
        height: clamp(
          Math.round(customHeight),
          64,
          4320,
        ),
        fps: clamp(
          Math.round(customFps),
          1,
          120,
        ),
        quality: clamp(
          Math.round(customQuality),
          1,
          100,
        ),
        durationMs:
          projectDurationMs,
        etaSeconds: null,
        outputUrl: null,
        outputSizeBytes: null,
        thumbnailUrl: null,
        error: null,
        startedAt: null,
        completedAt: null,
        metadata: {
          presetId:
            selectedPreset.id,
        },
      };

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const created =
          await onCreateJob?.(
            draft,
          );

        const nextJob: RenderJob =
          created ?? {
            ...draft,
            id: createId(),
            status: "queued",
            progress: 0,
            createdAt:
              new Date().toISOString(),
          };

        setLocalJobs((current) => [
          ...current,
          nextJob,
        ]);
        setSelectedJobId(
          nextJob.id,
        );
        setShowCreatePanel(false);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not add the render job.",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const runJobAction = async (
    job: RenderJob,
    action:
      | "pause"
      | "resume"
      | "cancel"
      | "retry"
      | "delete",
  ) => {
    if (disabled) {
      return;
    }

    setErrorMessage(null);

    try {
      if (action === "pause") {
        mutateJob(job.id, (item) => ({
          ...item,
          status: "paused",
        }));
        await onPauseJob?.(job.id);
      }

      if (action === "resume") {
        mutateJob(job.id, (item) => ({
          ...item,
          status: "queued",
        }));
        await onResumeJob?.(job.id);
      }

      if (action === "cancel") {
        mutateJob(job.id, (item) => ({
          ...item,
          status: "cancelled",
        }));
        await onCancelJob?.(job.id);
      }

      if (action === "retry") {
        const replacement =
          await onRetryJob?.(
            job.id,
          );

        if (replacement) {
          setLocalJobs((current) =>
            current.map((item) =>
              item.id === job.id
                ? replacement
                : item,
            ),
          );
          setSelectedJobId(
            replacement.id,
          );
        } else {
          mutateJob(job.id, (item) => ({
            ...item,
            status: "queued",
            progress: 0,
            error: null,
            startedAt: null,
            completedAt: null,
            outputUrl: null,
          }));
        }
      }

      if (action === "delete") {
        await onDeleteJob?.(job.id);

        setLocalJobs((current) =>
          current.filter(
            (item) =>
              item.id !== job.id,
          ),
        );

        if (
          selectedJobId === job.id
        ) {
          setSelectedJobId(null);
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The render action failed.",
      );
      setLocalJobs(jobs);
    }
  };

  const moveJob = (
    jobId: string,
    direction: -1 | 1,
  ) => {
    const currentIndex =
      localJobs.findIndex(
        (job) =>
          job.id === jobId,
      );

    if (currentIndex < 0) {
      return;
    }

    const nextIndex =
      currentIndex + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= localJobs.length
    ) {
      return;
    }

    const next = [...localJobs];
    const [job] = next.splice(
      currentIndex,
      1,
    );

    next.splice(
      nextIndex,
      0,
      job,
    );

    setLocalJobs(next);
    void onReorderJobs?.(
      next.map((item) => item.id),
    );
  };

  const clearCompleted =
    async () => {
      try {
        await onClearCompleted?.();

        setLocalJobs((current) =>
          current.filter(
            (job) =>
              job.status !==
              "completed",
          ),
        );

        if (
          selectedJob?.status ===
          "completed"
        ) {
          setSelectedJobId(null);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not clear completed renders.",
        );
      }
    };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLElement>,
  ) => {
    const target =
      event.target as HTMLElement;

    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT"
    ) {
      return;
    }

    if (
      event.key === "Delete" &&
      selectedJob
    ) {
      event.preventDefault();
      void runJobAction(
        selectedJob,
        "delete",
      );
    }

    if (
      event.key === "Escape"
    ) {
      setSelectedJobId(null);
      setShowCreatePanel(false);
    }
  };

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      aria-label="Beacon Studio render queue"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <header className="border-b border-white/10 bg-slate-900/95">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Render queue
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Export videos and manage render progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowCreatePanel(
                (current) => !current,
              )
            }
            disabled={disabled}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {showCreatePanel
              ? "Close export setup"
              : "New export"}
          </button>
        </div>

        <div className="grid grid-cols-3 border-t border-white/10 text-center">
          <div className="px-3 py-3">
            <p className="text-lg font-semibold text-white">
              {activeCount}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-600">
              Active
            </p>
          </div>

          <div className="border-x border-white/10 px-3 py-3">
            <p className="text-lg font-semibold text-white">
              {queuedCount}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-600">
              Queued
            </p>
          </div>

          <div className="px-3 py-3">
            <p className="text-lg font-semibold text-white">
              {completedCount}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-600">
              Completed
            </p>
          </div>
        </div>
      </header>

      {errorMessage ? (
        <div className="flex items-start justify-between gap-3 border-b border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
          <span>
            {errorMessage}
          </span>
          <button
            type="button"
            onClick={() =>
              setErrorMessage(null)
            }
            className="shrink-0 text-rose-200 hover:text-white"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      ) : null}

      {showCreatePanel ? (
        <div className="border-b border-white/10 bg-slate-900/55 p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Export name
                </label>
                <input
                  type="text"
                  value={jobName}
                  maxLength={160}
                  disabled={
                    disabled ||
                    isSubmitting
                  }
                  onChange={(event) =>
                    setJobName(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PRESETS.map(
                  (preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setSelectedPresetId(
                          preset.id,
                        )
                      }
                      disabled={
                        disabled ||
                        isSubmitting
                      }
                      className={`rounded-xl border p-3 text-left transition ${
                        selectedPresetId ===
                        preset.id
                          ? "border-cyan-300 bg-cyan-400/10 ring-2 ring-cyan-400/15"
                          : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">
                          {preset.label}
                        </span>
                        <span className="rounded border border-white/10 bg-slate-950 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-500">
                          {preset.format}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] leading-4 text-slate-500">
                        {preset.description}
                      </p>

                      <p className="mt-2 text-[10px] text-slate-600">
                        {preset.width} ×{" "}
                        {preset.height} ·{" "}
                        {preset.fps} fps
                      </p>
                    </button>
                  ),
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                    Format
                  </label>
                  <select
                    value={customFormat}
                    disabled={
                      disabled ||
                      isSubmitting
                    }
                    onChange={(event) =>
                      setCustomFormat(
                        event.target
                          .value as RenderFormat,
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                  >
                    <option value="mp4">
                      MP4
                    </option>
                    <option value="webm">
                      WebM
                    </option>
                    <option value="gif">
                      GIF
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                    Width
                  </label>
                  <input
                    type="number"
                    min={64}
                    max={7680}
                    value={customWidth}
                    disabled={
                      disabled ||
                      isSubmitting
                    }
                    onChange={(event) =>
                      setCustomWidth(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                    Height
                  </label>
                  <input
                    type="number"
                    min={64}
                    max={4320}
                    value={customHeight}
                    disabled={
                      disabled ||
                      isSubmitting
                    }
                    onChange={(event) =>
                      setCustomHeight(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                    FPS
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={customFps}
                    disabled={
                      disabled ||
                      isSubmitting
                    }
                    onChange={(event) =>
                      setCustomFps(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                    Quality
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={customQuality}
                    disabled={
                      disabled ||
                      isSubmitting
                    }
                    onChange={(event) =>
                      setCustomQuality(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                  />
                </div>
              </div>
            </div>

            <aside className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <h3 className="text-xs font-semibold text-white">
                Export summary
              </h3>

              <dl className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">
                    Resolution
                  </dt>
                  <dd className="text-slate-200">
                    {customWidth} ×{" "}
                    {customHeight}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">
                    Frame rate
                  </dt>
                  <dd className="text-slate-200">
                    {customFps} fps
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">
                    Duration
                  </dt>
                  <dd className="text-slate-200">
                    {formatDuration(
                      projectDurationMs,
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">
                    Estimated size
                  </dt>
                  <dd className="text-slate-200">
                    {formatFileSize(
                      estimatedSize,
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.025] p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-600">
                  Hardware
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">
                  {getHardwareMessage()}
                </p>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                  Project duration (ms)
                </label>
                <input
                  type="number"
                  min={100}
                  max={86_400_000}
                  value={projectDurationMs}
                  disabled={
                    disabled ||
                    isSubmitting
                  }
                  onChange={(event) =>
                    setProjectDurationMs(
                      clamp(
                        Number(
                          event.target.value,
                        ),
                        100,
                        86_400_000,
                      ),
                    )
                  }
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleCreateJob()
                }
                disabled={
                  disabled ||
                  isSubmitting ||
                  !jobName.trim()
                }
                className="mt-4 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting
                  ? "Adding export…"
                  : "Add to render queue"}
              </button>
            </aside>
          </div>
        </div>
      ) : null}

      <div className="grid min-h-[34rem] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 border-b border-white/10 xl:border-b-0 xl:border-r">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  "all",
                  "active",
                  "completed",
                  "failed",
                ] as QueueFilter[]
              ).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setFilter(item)
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                    filter === item
                      ? "bg-cyan-400/10 text-cyan-100"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target
                      .value as QueueSort,
                  )
                }
                className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-400/60"
              >
                <option value="queue">
                  Queue order
                </option>
                <option value="newest">
                  Newest
                </option>
                <option value="oldest">
                  Oldest
                </option>
                <option value="name">
                  Name
                </option>
              </select>

              <button
                type="button"
                onClick={() =>
                  void clearCompleted()
                }
                disabled={
                  disabled ||
                  completedCount === 0
                }
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear completed
              </button>
            </div>
          </div>

          {visibleJobs.length > 0 ? (
            <div className="divide-y divide-white/5">
              {visibleJobs.map(
                (job, index) => {
                  const selected =
                    selectedJobId ===
                    job.id;
                  const isActive =
                    ACTIVE_STATUSES.includes(
                      job.status,
                    );

                  return (
                    <article
                      key={job.id}
                      className={`grid cursor-pointer grid-cols-[48px_minmax(0,1fr)_auto] gap-3 px-4 py-4 transition ${
                        selected
                          ? "bg-cyan-400/[0.075]"
                          : "hover:bg-white/[0.03]"
                      }`}
                      onClick={() =>
                        setSelectedJobId(
                          job.id,
                        )
                      }
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-900 text-xs font-semibold uppercase text-slate-500">
                        {job.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              job.thumbnailUrl
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          job.format
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-medium text-slate-100">
                            {job.name}
                          </h3>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClassName(
                              job.status,
                            )}`}
                          >
                            {statusLabel(
                              job.status,
                            )}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-[11px] text-slate-600">
                          {job.projectName} ·{" "}
                          {job.width} ×{" "}
                          {job.height} ·{" "}
                          {job.fps} fps ·{" "}
                          {job.format.toUpperCase()}
                        </p>

                        {isActive ? (
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between gap-3 text-[10px]">
                              <span className="text-slate-500">
                                {job.status ===
                                "paused"
                                  ? "Paused"
                                  : formatEta(
                                      job.etaSeconds,
                                    )}
                              </span>
                              <span className="tabular-nums text-slate-400">
                                {Math.round(
                                  clamp(
                                    job.progress,
                                    0,
                                    100,
                                  ),
                                )}
                                %
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  job.status ===
                                  "paused"
                                    ? "bg-amber-400"
                                    : "bg-cyan-400"
                                }`}
                                style={{
                                  width: `${clamp(
                                    job.progress,
                                    0,
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : job.error ? (
                          <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-rose-300">
                            {job.error}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-start gap-1">
                        <button
                          type="button"
                          disabled={
                            disabled ||
                            index === 0 ||
                            sort !== "queue"
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            moveJob(job.id, -1);
                          }}
                          className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:opacity-30"
                          aria-label="Move render up"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            disabled ||
                            index ===
                              visibleJobs.length -
                                1 ||
                            sort !== "queue"
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            moveJob(job.id, 1);
                          }}
                          className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:opacity-30"
                          aria-label="Move render down"
                        >
                          ↓
                        </button>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="flex min-h-[28rem] items-center justify-center px-6 py-14 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-slate-600">
                  ▶
                </div>
                <p className="mt-4 text-sm font-medium text-slate-300">
                  No render jobs
                </p>
                <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
                  Create an export to add it to the queue.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setShowCreatePanel(true)
                  }
                  disabled={disabled}
                  className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-40"
                >
                  New export
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="bg-slate-900/45">
          {selectedJob ? (
            <div>
              <div className="border-b border-white/10 p-4">
                <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                  {selectedJob.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        selectedJob.thumbnailUrl
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl font-bold uppercase text-slate-700">
                      {selectedJob.format}
                    </div>
                  )}
                </div>

                <h3 className="mt-4 text-sm font-semibold text-white">
                  {selectedJob.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedJob.projectName}
                </p>
              </div>

              <div className="border-b border-white/10 p-4">
                <h4 className="text-xs font-semibold text-white">
                  Render details
                </h4>

                <dl className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">
                      Status
                    </dt>
                    <dd>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${statusClassName(
                          selectedJob.status,
                        )}`}
                      >
                        {statusLabel(
                          selectedJob.status,
                        )}
                      </span>
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">
                      Resolution
                    </dt>
                    <dd className="text-slate-200">
                      {selectedJob.width} ×{" "}
                      {selectedJob.height}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">
                      Format
                    </dt>
                    <dd className="uppercase text-slate-200">
                      {selectedJob.format}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">
                      Frame rate
                    </dt>
                    <dd className="text-slate-200">
                      {selectedJob.fps} fps
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">
                      Duration
                    </dt>
                    <dd className="text-slate-200">
                      {formatDuration(
                        selectedJob.durationMs,
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">
                      Output size
                    </dt>
                    <dd className="text-slate-200">
                      {formatFileSize(
                        selectedJob.outputSizeBytes,
                      )}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">
                      Created
                    </dt>
                    <dd className="text-right text-slate-200">
                      {formatDate(
                        selectedJob.createdAt,
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-2 p-4">
                {selectedJob.status ===
                "rendering" ? (
                  <button
                    type="button"
                    onClick={() =>
                      void runJobAction(
                        selectedJob,
                        "pause",
                      )
                    }
                    disabled={
                      disabled ||
                      !onPauseJob
                    }
                    className="w-full rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-40"
                  >
                    Pause render
                  </button>
                ) : null}

                {selectedJob.status ===
                "paused" ? (
                  <button
                    type="button"
                    onClick={() =>
                      void runJobAction(
                        selectedJob,
                        "resume",
                      )
                    }
                    disabled={
                      disabled ||
                      !onResumeJob
                    }
                    className="w-full rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-40"
                  >
                    Resume render
                  </button>
                ) : null}

                {[
                  "queued",
                  "preparing",
                  "rendering",
                  "paused",
                ].includes(
                  selectedJob.status,
                ) ? (
                  <button
                    type="button"
                    onClick={() =>
                      void runJobAction(
                        selectedJob,
                        "cancel",
                      )
                    }
                    disabled={
                      disabled ||
                      !onCancelJob
                    }
                    className="w-full rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-40"
                  >
                    Cancel render
                  </button>
                ) : null}

                {selectedJob.status ===
                  "failed" ||
                selectedJob.status ===
                  "cancelled" ? (
                  <button
                    type="button"
                    onClick={() =>
                      void runJobAction(
                        selectedJob,
                        "retry",
                      )
                    }
                    disabled={
                      disabled ||
                      !onRetryJob
                    }
                    className="w-full rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-40"
                  >
                    Retry render
                  </button>
                ) : null}

                {selectedJob.status ===
                  "completed" &&
                selectedJob.outputUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onDownloadJob) {
                        void onDownloadJob(
                          selectedJob,
                        );
                        return;
                      }

                      window.open(
                        selectedJob.outputUrl ??
                          "",
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    disabled={disabled}
                    className="w-full rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-40"
                  >
                    Download export
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    void runJobAction(
                      selectedJob,
                      "delete",
                    )
                  }
                  disabled={
                    disabled ||
                    !onDeleteJob
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-40"
                >
                  Delete from queue
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[34rem] items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm font-medium text-slate-300">
                  No render selected
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Select a render job to view its details and controls.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3 text-[11px] text-slate-500">
        <span>
          Maximum concurrent renders:{" "}
          <strong className="font-medium text-slate-300">
            {maxConcurrentJobs}
          </strong>
        </span>
        <span>
          {localJobs.length} total job
          {localJobs.length === 1
            ? ""
            : "s"}
        </span>
      </footer>
    </section>
  );
}