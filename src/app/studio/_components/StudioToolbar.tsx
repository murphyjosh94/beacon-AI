"use client";

import { useMemo } from "react";

import {
  type StudioPanelId,
  useStudio,
} from "../StudioProvider";

export type StudioToolbarProps = {
  disabled?: boolean;
  className?: string;
  onOpenCampaign?: () => void;
  onOpenImages?: () => void;
  onOpenVideo?: () => void;
  onOpenMusic?: () => void;
  onOpenBrand?: () => void;
  onOpenUpload?: () => void;
};

type EditorToolDefinition = {
  id: "select" | "hand" | "text" | "shape" | "record";
  label: string;
  title: string;
};

const EDITOR_TOOLS: EditorToolDefinition[] = [
  {
    id: "select",
    label: "Select",
    title: "Select and move canvas items",
  },
  {
    id: "hand",
    label: "Hand",
    title: "Pan around the canvas",
  },
  {
    id: "text",
    label: "Text",
    title: "Add or edit text",
  },
  {
    id: "shape",
    label: "Shape",
    title: "Add a shape",
  },
  {
    id: "record",
    label: "Capture",
    title: "Record screen, camera or microphone",
  },
];

type CreationAction = {
  id:
    | "campaign"
    | "images"
    | "video"
    | "voice"
    | "music"
    | "brand"
    | "assets"
    | "upload";
  label: string;
  icon: string;
  title: string;
  prominent?: boolean;
};

const CREATION_ACTIONS: CreationAction[] = [
  {
    id: "campaign",
    label: "Campaign",
    icon: "✨",
    title: "Create a complete AI campaign",
    prominent: true,
  },
  {
    id: "images",
    label: "Images",
    icon: "▧",
    title: "Create or add images",
  },
  {
    id: "video",
    label: "Video",
    icon: "▶",
    title: "Create or add video",
  },
  {
    id: "voice",
    label: "Voice",
    icon: "◉",
    title: "Create or add voice-over",
  },
  {
    id: "music",
    label: "Music",
    icon: "♫",
    title: "Create or add music",
  },
  {
    id: "brand",
    label: "Brand",
    icon: "◆",
    title: "Open brand settings",
  },
  {
    id: "assets",
    label: "Assets",
    icon: "▦",
    title: "Open the asset library",
  },
  {
    id: "upload",
    label: "Upload",
    icon: "↑",
    title: "Upload media",
  },
];

function ToolbarButton({
  active = false,
  disabled = false,
  title,
  onClick,
  children,
  prominent = false,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  prominent?: boolean;
}) {
  const className = prominent
    ? active
      ? "border-amber-300/40 bg-amber-300/20 text-amber-100"
      : "border-amber-300/30 bg-amber-300/10 text-amber-200 hover:bg-amber-300/20"
    : active
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
      : "border-transparent text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-white";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition ${className} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div
      aria-hidden="true"
      className="mx-1 h-5 w-px shrink-0 bg-white/10"
    />
  );
}

export default function StudioToolbar({
  disabled = false,
  className = "",
  onOpenCampaign,
  onOpenImages,
  onOpenVideo,
  onOpenMusic,
  onOpenBrand,
  onOpenUpload,
}: StudioToolbarProps) {
  const { state, actions } = useStudio();

  const playheadAtStart = state.timeline.playheadMs <= 0;
  const playheadAtEnd =
    state.timeline.playheadMs >= state.timeline.durationMs;

  const creationHandlers = useMemo(
    () => ({
      campaign: () => {
        onOpenCampaign?.();
      },
      images: () => {
        if (onOpenImages) {
          onOpenImages();
          return;
        }

        actions.setPanelVisible("assets", true);
        actions.setActivePanel("assets");
      },
      video: () => {
        if (onOpenVideo) {
          onOpenVideo();
          return;
        }

        actions.setPanelVisible("assets", true);
        actions.setActivePanel("assets");
      },
      voice: () => {
        actions.setPanelVisible("voiceOver", true);
        actions.setActivePanel("voiceOver");
      },
      music: () => {
        if (onOpenMusic) {
          onOpenMusic();
          return;
        }

        actions.setPanelVisible("assets", true);
        actions.setActivePanel("assets");
      },
      brand: () => {
        if (onOpenBrand) {
          onOpenBrand();
          return;
        }

        actions.setPanelVisible("inspector", true);
        actions.setActivePanel("inspector");
      },
      assets: () => {
        actions.setPanelVisible("assets", true);
        actions.setActivePanel("assets");
      },
      upload: () => {
        if (onOpenUpload) {
          onOpenUpload();
          return;
        }

        actions.setPanelVisible("assets", true);
        actions.setActivePanel("assets");
      },
    }),
    [
      actions,
      onOpenBrand,
      onOpenCampaign,
      onOpenImages,
      onOpenMusic,
      onOpenUpload,
      onOpenVideo,
    ],
  );

  const openPanel = (panelId: StudioPanelId): void => {
    actions.setPanelVisible(panelId, true);
    actions.setActivePanel(panelId);
  };

  const selectEditorTool = (
    tool: EditorToolDefinition["id"],
  ): void => {
    if (disabled) {
      return;
    }

    actions.setActiveTool(tool);

    if (tool === "record") {
      openPanel("recording");
      return;
    }

    if (tool === "text" || tool === "shape") {
      openPanel("inspector");
    }
  };

  const handleCreationAction = (
    actionId: CreationAction["id"],
  ): void => {
    if (disabled) {
      return;
    }

    creationHandlers[actionId]();
  };

  return (
    <div
      className={`flex h-12 shrink-0 items-center gap-2 overflow-hidden border-b border-white/10 bg-slate-950 px-3 ${className}`}
      aria-label="Studio toolbar"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="mr-1 hidden shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 xl:inline">
          Create
        </span>

        {CREATION_ACTIONS.map((action) => (
          <ToolbarButton
            key={action.id}
            disabled={disabled}
            title={action.title}
            prominent={action.prominent}
            onClick={() => handleCreationAction(action.id)}
          >
            <span aria-hidden="true">{action.icon}</span>
            <span>{action.label}</span>
          </ToolbarButton>
        ))}

        <Divider />

        <span className="mr-1 hidden shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 xl:inline">
          Edit
        </span>

        {EDITOR_TOOLS.map((tool) => (
          <ToolbarButton
            key={tool.id}
            active={state.activeTool === tool.id}
            disabled={disabled}
            title={tool.title}
            onClick={() => selectEditorTool(tool.id)}
          >
            {tool.label}
          </ToolbarButton>
        ))}
      </div>

      <div className="hidden shrink-0 items-center gap-1 2xl:flex">
        <ToolbarButton
          active={state.timeline.snappingEnabled}
          disabled={disabled}
          title={
            state.timeline.snappingEnabled
              ? "Disable timeline snapping"
              : "Enable timeline snapping"
          }
          onClick={() =>
            actions.setSnapping(!state.timeline.snappingEnabled)
          }
        >
          Snap
        </ToolbarButton>

        <ToolbarButton
          active={state.preferences.showGrid}
          disabled={disabled}
          title={
            state.preferences.showGrid
              ? "Hide canvas grid"
              : "Show canvas grid"
          }
          onClick={() =>
            actions.updatePreferences({
              showGrid: !state.preferences.showGrid,
            })
          }
        >
          Grid
        </ToolbarButton>

        <ToolbarButton
          active={state.preferences.showSafeArea}
          disabled={disabled}
          title={
            state.preferences.showSafeArea
              ? "Hide safe area"
              : "Show safe area"
          }
          onClick={() =>
            actions.updatePreferences({
              showSafeArea: !state.preferences.showSafeArea,
            })
          }
        >
          Safe area
        </ToolbarButton>
      </div>

      <Divider />

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={disabled || playheadAtStart}
          onClick={() => actions.seek(0)}
          title="Go to beginning"
          aria-label="Go to beginning"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          |◀
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={actions.togglePlayback}
          title={state.playback.isPlaying ? "Pause" : "Play"}
          aria-label={state.playback.isPlaying ? "Pause" : "Play"}
          className="flex h-8 w-10 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-sm text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.playback.isPlaying ? "Ⅱ" : "▶"}
        </button>

        <button
          type="button"
          disabled={disabled || playheadAtEnd}
          onClick={() => actions.seek(state.timeline.durationMs)}
          title="Go to end"
          aria-label="Go to end"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          ▶|
        </button>
      </div>
    </div>
  );
}