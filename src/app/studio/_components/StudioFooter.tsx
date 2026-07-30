"use client";

import { useStudio } from "../StudioProvider";

export type StudioFooterProps = {
  resizing?: boolean;
  statusMessage?: string;
  className?: string;
};

export default function StudioFooter({
  resizing = false,
  statusMessage,
  className = "",
}: StudioFooterProps) {
  const { state } = useStudio();

  const studioStatus =
    statusMessage ??
    (state.error
      ? state.error
      : resizing
        ? "Resizing panel"
        : state.saving
          ? "Saving project…"
          : state.dirty
            ? "Unsaved changes"
            : "Beacon Studio ready");

  return (
    <footer
      className={`flex h-7 shrink-0 items-center justify-between gap-4 border-t border-white/10 bg-slate-900 px-3 text-[10px] text-slate-500 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0">
          {state.timeline.tracks.length}{" "}
          {state.timeline.tracks.length === 1
            ? "track"
            : "tracks"}
        </span>

        <span aria-hidden="true">·</span>

        <span className="shrink-0">
          {state.assets.length}{" "}
          {state.assets.length === 1
            ? "asset"
            : "assets"}
        </span>

        <span aria-hidden="true">·</span>

        <span className="shrink-0">
          {state.project.frameRate} fps
        </span>

        <span
          aria-hidden="true"
          className="hidden sm:inline"
        >
          ·
        </span>

        <span className="hidden truncate sm:inline">
          {state.project.width} ×{" "}
          {state.project.height}
        </span>
      </div>

      <div
        className={`min-w-0 truncate text-right ${
          state.error
            ? "text-rose-300"
            : state.dirty
              ? "text-amber-300"
              : state.saving
                ? "text-cyan-300"
                : "text-slate-500"
        }`}
        role={state.error ? "alert" : "status"}
        aria-live="polite"
      >
        {studioStatus}
      </div>
    </footer>
  );
}