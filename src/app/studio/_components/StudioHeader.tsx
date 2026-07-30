"use client";

import Link from "next/link";
import {
  type DragEvent,
  useMemo,
  useState,
} from "react";

import {
  type StudioPanelId,
  type StudioSnapshot,
  useStudio,
} from "../StudioProvider";

export type StudioPanelDefinition = {
  id: StudioPanelId;
  label: string;
  shortLabel: string;
  dock: "left" | "right" | "bottom" | "centre";
};

export const STUDIO_PANEL_DEFINITIONS: StudioPanelDefinition[] = [
  {
    id: "assets",
    label: "Assets",
    shortLabel: "Assets",
    dock: "left",
  },
  {
    id: "inspector",
    label: "Inspector",
    shortLabel: "Inspect",
    dock: "right",
  },
  {
    id: "timeline",
    label: "Timeline",
    shortLabel: "Timeline",
    dock: "bottom",
  },
  {
    id: "history",
    label: "History",
    shortLabel: "History",
    dock: "right",
  },
  {
    id: "renderQueue",
    label: "Render queue",
    shortLabel: "Render",
    dock: "right",
  },
  {
    id: "keyframes",
    label: "Keyframes",
    shortLabel: "Keys",
    dock: "bottom",
  },
  {
    id: "curves",
    label: "Animation curves",
    shortLabel: "Curves",
    dock: "right",
  },
  {
    id: "voiceOver",
    label: "Voice-over",
    shortLabel: "Voice",
    dock: "centre",
  },
  {
    id: "recording",
    label: "Media capture",
    shortLabel: "Capture",
    dock: "centre",
  },
];

export type StudioHeaderProps = {
  disabled?: boolean;
  onExit?: () => void;
  onPublish?: (
    snapshot: StudioSnapshot,
  ) => Promise<void> | void;
  onOpenMobilePanels?: () => void;
  onPanelDragStart?: (
    panelId: StudioPanelId,
  ) => void;
  onPanelDragEnd?: () => void;
  className?: string;
};

function formatTime(
  timeMs: number,
): string {
  const safeTimeMs = Math.max(
    0,
    Math.round(timeMs),
  );

  const hours = Math.floor(
    safeTimeMs / 3_600_000,
  );

  const minutes = Math.floor(
    (safeTimeMs % 3_600_000) /
      60_000,
  );

  const seconds = Math.floor(
    (safeTimeMs % 60_000) /
      1_000,
  );

  const frames = Math.floor(
    (safeTimeMs % 1_000) /
      (1_000 / 30),
  );

  return `${hours
    .toString()
    .padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}:${frames
    .toString()
    .padStart(2, "0")}`;
}

function createSnapshot(
  state: ReturnType<
    typeof useStudio
  >["state"],
): StudioSnapshot {
  return {
    project: state.project,
    timeline: state.timeline,
    assets: state.assets,
    selection: state.selection,
    guides: state.guides,
    preferences: state.preferences,
    panels: state.panels,
    renderQueue:
      state.renderQueue,
    activeTool: state.activeTool,
  };
}

export default function StudioHeader({
  disabled = false,
  onExit,
  onPublish,
  onOpenMobilePanels,
  onPanelDragStart,
  onPanelDragEnd,
  className = "",
}: StudioHeaderProps) {
  const { state, actions } =
    useStudio();

  const [publishing, setPublishing] =
    useState(false);

  const formattedPlayhead =
    useMemo(
      () =>
        formatTime(
          state.timeline
            .playheadMs,
        ),
      [
        state.timeline
          .playheadMs,
      ],
    );

  const publish =
    async (): Promise<void> => {
      if (
        !onPublish ||
        publishing
      ) {
        return;
      }

      setPublishing(true);

      try {
        await onPublish(
          createSnapshot(state),
        );
      } finally {
        setPublishing(false);
      }
    };

  const handlePanelDragStart = (
    event: DragEvent<HTMLButtonElement>,
    panelId: StudioPanelId,
  ): void => {
    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      panelId,
    );

    onPanelDragStart?.(
      panelId,
    );
  };

  return (
    <header
      className={`flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-3 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Back
          </button>
        ) : null}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 font-semibold text-cyan-100">
          B
        </div>

        <div className="min-w-0">
          <input
            value={
              state.project.name
            }
            disabled={disabled}
            onChange={(
              event,
            ) =>
              actions.updateProject(
                {
                  name: event
                    .target
                    .value,
                },
                undefined,
              )
            }
            onBlur={() =>
              actions.updateProject(
                {
                  name:
                    state.project.name.trim() ||
                    "Untitled project",
                },
                "Rename project",
              )
            }
            className="block w-full min-w-0 truncate border-0 bg-transparent p-0 text-sm font-semibold text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Project name"
          />

          <p className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
            <span>
              {state.saving
                ? "Saving…"
                : state.dirty
                  ? "Unsaved changes"
                  : state.lastSavedAt
                    ? "Saved"
                    : "Ready"}
            </span>

            <span aria-hidden="true">
              •
            </span>

            <span>
              {formattedPlayhead}
            </span>
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <Link
          href="/studio/create"
          className="shrink-0 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-300/20"
        >
          ✨ New campaign
        </Link>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            actions.setActiveTool(
              "text",
            );

            actions.setPanelVisible(
              "inspector",
              true,
            );

            actions.setActivePanel(
              "inspector",
            );
          }}
          className="rounded-lg px-2.5 py-2 text-[11px] text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Script
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            actions.setPanelVisible(
              "voiceOver",
              true,
            );

            actions.setActivePanel(
              "voiceOver",
            );
          }}
          className="rounded-lg px-2.5 py-2 text-[11px] text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Voice
        </button>

        {STUDIO_PANEL_DEFINITIONS.map(
          (panel) => {
            const visible =
              state.panels.visible[
                panel.id
              ];

            return (
              <button
                key={panel.id}
                type="button"
                draggable={
                  !disabled
                }
                onDragStart={(
                  event,
                ) =>
                  handlePanelDragStart(
                    event,
                    panel.id,
                  )
                }
                onDragEnd={() =>
                  onPanelDragEnd?.()
                }
                onClick={() => {
                  const nextVisible =
                    !visible;

                  actions.setPanelVisible(
                    panel.id,
                    nextVisible,
                  );

                  if (
                    nextVisible
                  ) {
                    actions.setActivePanel(
                      panel.id,
                    );
                  }
                }}
                disabled={
                  disabled
                }
                className={`rounded-lg px-2.5 py-2 text-[11px] transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  visible
                    ? "bg-cyan-400/10 text-cyan-100"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                }`}
                title={`Toggle ${panel.label}`}
              >
                {
                  panel.shortLabel
                }
              </button>
            );
          },
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={
            disabled ||
            !state.history
              .undoStack.length
          }
          onClick={actions.undo}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          title="Undo"
          aria-label="Undo"
        >
          ↶
        </button>

        <button
          type="button"
          disabled={
            disabled ||
            !state.history
              .redoStack.length
          }
          onClick={actions.redo}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          title="Redo"
          aria-label="Redo"
        >
          ↷
        </button>

        <button
          type="button"
          disabled={
            disabled ||
            !onPublish ||
            publishing
          }
          onClick={() =>
            void publish()
          }
          className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {publishing
            ? "Preparing export…"
            : "Export"}
        </button>

        <button
          type="button"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          onClick={
            onOpenMobilePanels
          }
        >
          Panels
        </button>
      </div>
    </header>
  );
}