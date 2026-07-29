import type {
  StudioActions,
  StudioCommand,
  StudioCommandContext,
  StudioPanelId,
  StudioState,
  StudioTool,
} from "./StudioProvider";

export type StudioShortcutPlatform = "mac" | "windows" | "linux" | "unknown";

export type StudioShortcutScope =
  | "global"
  | "canvas"
  | "timeline"
  | "inspector"
  | "assets"
  | "recording"
  | "voice-over"
  | "render"
  | "text-editing"
  | "modal";

export type StudioShortcutCategory =
  | "file"
  | "edit"
  | "selection"
  | "playback"
  | "timeline"
  | "view"
  | "tools"
  | "panels"
  | "assets"
  | "recording"
  | "voice-over"
  | "render"
  | "project"
  | "navigation";

export type StudioShortcutContext = {
  scope: StudioShortcutScope;
  state: StudioState;
  actions: StudioActions;
  event?: KeyboardEvent;
  platform: StudioShortcutPlatform;
};

export type StudioShortcutBinding = {
  key: string;
  code?: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
  mod?: boolean;
  allowInInput?: boolean;
  allowRepeat?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
};

export type StudioShortcutDefinition = {
  id: string;
  label: string;
  description: string;
  category: StudioShortcutCategory;
  scope: StudioShortcutScope | StudioShortcutScope[];
  bindings: StudioShortcutBinding[];
  commandId?: string;
  hidden?: boolean;
  enabled?: (context: StudioShortcutContext) => boolean;
  execute?: (
    context: StudioShortcutContext,
  ) => void | Promise<void>;
};

export type StudioShortcutConflict = {
  signature: string;
  shortcuts: StudioShortcutDefinition[];
};

export type StudioShortcutOverrides = Record<
  string,
  StudioShortcutBinding[] | null
>;

export type StudioShortcutRegistryOptions = {
  platform?: StudioShortcutPlatform;
  overrides?: StudioShortcutOverrides;
  includeHidden?: boolean;
};

const PANEL_IDS: StudioPanelId[] = [
  "assets",
  "timeline",
  "inspector",
  "history",
  "renderQueue",
  "keyframes",
  "curves",
  "voiceOver",
  "recording",
];

const TOOL_IDS: StudioTool[] = [
  "select",
  "hand",
  "text",
  "shape",
  "image",
  "video",
  "audio",
  "crop",
  "record",
];

function normaliseKey(value: string): string {
  const lower = value.toLowerCase();

  if (lower === " ") return "space";
  if (lower === "escape") return "esc";
  if (lower === "arrowleft") return "left";
  if (lower === "arrowright") return "right";
  if (lower === "arrowup") return "up";
  if (lower === "arrowdown") return "down";
  if (lower === "delete") return "delete";
  if (lower === "backspace") return "backspace";
  if (lower === "enter") return "enter";
  if (lower === "tab") return "tab";

  return lower;
}

function detectPlatform(): StudioShortcutPlatform {
  if (typeof navigator === "undefined") return "unknown";

  const value = `${navigator.platform} ${navigator.userAgent}`.toLowerCase();

  if (value.includes("mac")) return "mac";
  if (value.includes("win")) return "windows";
  if (value.includes("linux")) return "linux";

  return "unknown";
}

function modifierMatches(
  expected: boolean | undefined,
  actual: boolean,
): boolean {
  return expected === undefined ? !actual : expected === actual;
}

function bindingMatchesEvent(
  binding: StudioShortcutBinding,
  event: KeyboardEvent,
  platform: StudioShortcutPlatform,
): boolean {
  const keyMatches =
    normaliseKey(binding.key) === normaliseKey(event.key) ||
    (binding.code !== undefined && binding.code === event.code);

  if (!keyMatches) return false;

  const expectedCtrl = binding.mod
    ? platform === "mac"
      ? false
      : true
    : binding.ctrl;
  const expectedMeta = binding.mod
    ? platform === "mac"
      ? true
      : false
    : binding.meta;

  return (
    modifierMatches(expectedCtrl, event.ctrlKey) &&
    modifierMatches(expectedMeta, event.metaKey) &&
    modifierMatches(binding.alt, event.altKey) &&
    modifierMatches(binding.shift, event.shiftKey)
  );
}

function createBinding(
  key: string,
  options: Omit<StudioShortcutBinding, "key"> = {},
): StudioShortcutBinding {
  return {
    key,
    preventDefault: true,
    ...options,
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;

  if (!element) return false;

  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT" ||
    element.isContentEditable
  );
}

function hasSelectedClips(state: StudioState): boolean {
  return state.selection.clipIds.length > 0;
}

function hasClipboard(state: StudioState): boolean {
  return state.clipboard.clips.length > 0;
}

function frameDuration(state: StudioState): number {
  return 1000 / Math.max(1, state.project.frameRate);
}

function seekByFrames(
  context: StudioShortcutContext,
  frames: number,
): void {
  context.actions.seek(
    context.state.timeline.playheadMs +
      frameDuration(context.state) * frames,
  );
}

function moveSelectedClips(
  context: StudioShortcutContext,
  deltaMs: number,
): void {
  for (const clipId of context.state.selection.clipIds) {
    const found = context.state.timeline.tracks
      .flatMap((track) => track.clips)
      .find((clip) => clip.id === clipId);

    if (!found) continue;

    context.actions.updateClip(
      clipId,
      {
        startMs: Math.max(0, found.startMs + deltaMs),
      },
      "Nudge clips",
    );
  }
}

function resizeSelectedClips(
  context: StudioShortcutContext,
  deltaMs: number,
  edge: "start" | "end",
): void {
  for (const clipId of context.state.selection.clipIds) {
    const found = context.state.timeline.tracks
      .flatMap((track) => track.clips)
      .find((clip) => clip.id === clipId);

    if (!found) continue;

    if (edge === "start") {
      const nextStart = Math.max(0, found.startMs + deltaMs);
      const delta = nextStart - found.startMs;

      context.actions.updateClip(
        clipId,
        {
          startMs: nextStart,
          durationMs: Math.max(1, found.durationMs - delta),
          trimStartMs: Math.max(0, found.trimStartMs + delta),
        },
        "Trim clip start",
      );
      continue;
    }

    context.actions.updateClip(
      clipId,
      {
        durationMs: Math.max(1, found.durationMs + deltaMs),
      },
      "Trim clip end",
    );
  }
}

function togglePanel(
  context: StudioShortcutContext,
  panel: StudioPanelId,
): void {
  const visible = context.state.panels.visible[panel];
  context.actions.setPanelVisible(panel, !visible);

  if (!visible) {
    context.actions.setActivePanel(panel);
  }
}

function setTool(
  context: StudioShortcutContext,
  tool: StudioTool,
): void {
  context.actions.setActiveTool(tool);

  if (tool === "record") {
    context.actions.setActivePanel("recording");
  }
}

function createPanelShortcut(
  id: string,
  label: string,
  panel: StudioPanelId,
  binding: StudioShortcutBinding,
): StudioShortcutDefinition {
  return {
    id,
    label,
    description: `Show or hide the ${label.toLowerCase()} panel.`,
    category: "panels",
    scope: "global",
    bindings: [binding],
    execute: (context) => togglePanel(context, panel),
  };
}

function createToolShortcut(
  tool: StudioTool,
  label: string,
  key: string,
): StudioShortcutDefinition {
  return {
    id: `studio.tool.${tool}`,
    label: `${label} tool`,
    description: `Activate the ${label.toLowerCase()} tool.`,
    category: "tools",
    scope: ["global", "canvas", "timeline"],
    bindings: [createBinding(key)],
    execute: (context) => setTool(context, tool),
  };
}

export const DEFAULT_STUDIO_SHORTCUTS: StudioShortcutDefinition[] = [
  {
    id: "studio.file.save",
    label: "Save project",
    description: "Save the current Beacon Studio project.",
    category: "file",
    scope: "global",
    bindings: [createBinding("s", { mod: true })],
    commandId: "studio.save",
  },
  {
    id: "studio.file.save-as",
    label: "Save as",
    description: "Create a saved copy of the current project.",
    category: "file",
    scope: "global",
    bindings: [createBinding("s", { mod: true, shift: true })],
  },
  {
    id: "studio.file.export",
    label: "Open exporter",
    description: "Open the Studio export panel.",
    category: "render",
    scope: "global",
    bindings: [createBinding("e", { mod: true, shift: true })],
    execute: (context) => context.actions.setActivePanel("renderQueue"),
  },
  {
    id: "studio.file.render-queue",
    label: "Open render queue",
    description: "Open the render queue panel.",
    category: "render",
    scope: "global",
    bindings: [createBinding("r", { mod: true, alt: true })],
    execute: (context) => context.actions.setActivePanel("renderQueue"),
  },
  {
    id: "studio.edit.undo",
    label: "Undo",
    description: "Undo the most recent edit.",
    category: "edit",
    scope: "global",
    bindings: [createBinding("z", { mod: true })],
    commandId: "studio.undo",
  },
  {
    id: "studio.edit.redo",
    label: "Redo",
    description: "Redo the most recently undone edit.",
    category: "edit",
    scope: "global",
    bindings: [
      createBinding("z", { mod: true, shift: true }),
      createBinding("y", { ctrl: true }),
    ],
    commandId: "studio.redo",
  },
  {
    id: "studio.edit.copy",
    label: "Copy",
    description: "Copy the selected timeline clips.",
    category: "edit",
    scope: ["global", "timeline", "canvas"],
    bindings: [createBinding("c", { mod: true })],
    commandId: "studio.copy",
    enabled: ({ state }) => hasSelectedClips(state),
  },
  {
    id: "studio.edit.cut",
    label: "Cut",
    description: "Cut the selected timeline clips.",
    category: "edit",
    scope: ["global", "timeline", "canvas"],
    bindings: [createBinding("x", { mod: true })],
    commandId: "studio.cut",
    enabled: ({ state }) => hasSelectedClips(state),
  },
  {
    id: "studio.edit.paste",
    label: "Paste",
    description: "Paste copied clips at the playhead.",
    category: "edit",
    scope: ["global", "timeline", "canvas"],
    bindings: [createBinding("v", { mod: true })],
    commandId: "studio.paste",
    enabled: ({ state }) => hasClipboard(state),
  },
  {
    id: "studio.edit.duplicate",
    label: "Duplicate",
    description: "Duplicate selected timeline clips.",
    category: "edit",
    scope: ["timeline", "canvas", "global"],
    bindings: [createBinding("d", { mod: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) => {
      context.state.selection.clipIds.forEach((clipId, index) => {
        context.actions.duplicateClip(
          clipId,
          250 * (index + 1),
          "Duplicate clips",
        );
      });
    },
  },
  {
    id: "studio.edit.delete",
    label: "Delete selection",
    description: "Delete selected clips.",
    category: "edit",
    scope: ["timeline", "canvas", "global"],
    bindings: [
      createBinding("delete"),
      createBinding("backspace"),
    ],
    commandId: "studio.delete",
    enabled: ({ state }) => hasSelectedClips(state),
  },
  {
    id: "studio.edit.split",
    label: "Split at playhead",
    description: "Split selected clips at the current playhead.",
    category: "timeline",
    scope: ["timeline", "global"],
    bindings: [createBinding("k", { mod: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) => {
      context.state.selection.clipIds.forEach((clipId) => {
        context.actions.splitClip(
          clipId,
          context.state.timeline.playheadMs,
          "Split clip",
        );
      });
    },
  },
  {
    id: "studio.selection.select-all",
    label: "Select all clips",
    description: "Select every clip on the timeline.",
    category: "selection",
    scope: ["timeline", "global"],
    bindings: [createBinding("a", { mod: true })],
    execute: (context) => {
      const clips = context.state.timeline.tracks.flatMap(
        (track) => track.clips,
      );

      context.actions.setSelection({
        ...context.state.selection,
        clipIds: clips.map((clip) => clip.id),
        primaryClipId: clips[0]?.id ?? null,
      });
    },
  },
  {
    id: "studio.selection.deselect",
    label: "Deselect",
    description: "Clear the current Studio selection.",
    category: "selection",
    scope: "global",
    bindings: [createBinding("esc")],
    execute: ({ actions }) => actions.clearSelection(),
  },
  {
    id: "studio.selection.next",
    label: "Select next clip",
    description: "Select the next clip in timeline order.",
    category: "selection",
    scope: "timeline",
    bindings: [createBinding("tab")],
    execute: (context) => {
      const clips = context.state.timeline.tracks
        .flatMap((track) => track.clips)
        .sort((a, b) => a.startMs - b.startMs);

      if (!clips.length) return;

      const currentIndex = clips.findIndex(
        (clip) =>
          clip.id === context.state.selection.primaryClipId,
      );
      const next = clips[(currentIndex + 1 + clips.length) % clips.length];

      context.actions.selectClip(next.id);
    },
  },
  {
    id: "studio.selection.previous",
    label: "Select previous clip",
    description: "Select the previous clip in timeline order.",
    category: "selection",
    scope: "timeline",
    bindings: [createBinding("tab", { shift: true })],
    execute: (context) => {
      const clips = context.state.timeline.tracks
        .flatMap((track) => track.clips)
        .sort((a, b) => a.startMs - b.startMs);

      if (!clips.length) return;

      const currentIndex = clips.findIndex(
        (clip) =>
          clip.id === context.state.selection.primaryClipId,
      );
      const previous =
        clips[
          (currentIndex - 1 + clips.length) % clips.length
        ];

      context.actions.selectClip(previous.id);
    },
  },
  {
    id: "studio.playback.toggle",
    label: "Play or pause",
    description: "Toggle timeline playback.",
    category: "playback",
    scope: ["global", "timeline", "canvas"],
    bindings: [createBinding("space")],
    commandId: "studio.playback.toggle",
  },
  {
    id: "studio.playback.stop",
    label: "Stop playback",
    description: "Pause playback and return to the start.",
    category: "playback",
    scope: ["global", "timeline"],
    bindings: [createBinding("space", { shift: true })],
    execute: ({ actions }) => {
      actions.pause();
      actions.seek(0);
    },
  },
  {
    id: "studio.playback.go-start",
    label: "Go to project start",
    description: "Move the playhead to the project start.",
    category: "navigation",
    scope: ["global", "timeline"],
    bindings: [createBinding("home")],
    execute: ({ actions }) => actions.seek(0),
  },
  {
    id: "studio.playback.go-end",
    label: "Go to project end",
    description: "Move the playhead to the project end.",
    category: "navigation",
    scope: ["global", "timeline"],
    bindings: [createBinding("end")],
    execute: ({ state, actions }) =>
      actions.seek(state.timeline.durationMs),
  },
  {
    id: "studio.playback.frame-back",
    label: "Previous frame",
    description: "Move the playhead back by one frame.",
    category: "navigation",
    scope: ["timeline", "global"],
    bindings: [createBinding("left")],
    execute: (context) => seekByFrames(context, -1),
  },
  {
    id: "studio.playback.frame-forward",
    label: "Next frame",
    description: "Move the playhead forward by one frame.",
    category: "navigation",
    scope: ["timeline", "global"],
    bindings: [createBinding("right")],
    execute: (context) => seekByFrames(context, 1),
  },
  {
    id: "studio.playback.ten-frames-back",
    label: "Back ten frames",
    description: "Move the playhead back by ten frames.",
    category: "navigation",
    scope: ["timeline", "global"],
    bindings: [createBinding("left", { shift: true })],
    execute: (context) => seekByFrames(context, -10),
  },
  {
    id: "studio.playback.ten-frames-forward",
    label: "Forward ten frames",
    description: "Move the playhead forward by ten frames.",
    category: "navigation",
    scope: ["timeline", "global"],
    bindings: [createBinding("right", { shift: true })],
    execute: (context) => seekByFrames(context, 10),
  },
  {
    id: "studio.playback.second-back",
    label: "Back one second",
    description: "Move the playhead back by one second.",
    category: "navigation",
    scope: ["timeline", "global"],
    bindings: [createBinding("left", { alt: true })],
    execute: ({ state, actions }) =>
      actions.seek(state.timeline.playheadMs - 1000),
  },
  {
    id: "studio.playback.second-forward",
    label: "Forward one second",
    description: "Move the playhead forward by one second.",
    category: "navigation",
    scope: ["timeline", "global"],
    bindings: [createBinding("right", { alt: true })],
    execute: ({ state, actions }) =>
      actions.seek(state.timeline.playheadMs + 1000),
  },
  {
    id: "studio.playback.loop",
    label: "Toggle loop playback",
    description: "Enable or disable looping.",
    category: "playback",
    scope: ["timeline", "global"],
    bindings: [createBinding("l")],
    execute: ({ state, actions }) =>
      actions.setLooping(!state.playback.isLooping),
  },
  {
    id: "studio.timeline.set-in",
    label: "Set in point",
    description: "Set the timeline work-area start.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding("i")],
    execute: ({ state, actions }) =>
      actions.updateTimeline(
        {
          inPointMs: state.timeline.playheadMs,
        },
        "Set in point",
      ),
  },
  {
    id: "studio.timeline.set-out",
    label: "Set out point",
    description: "Set the timeline work-area end.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding("o")],
    execute: ({ state, actions }) =>
      actions.updateTimeline(
        {
          outPointMs: state.timeline.playheadMs,
        },
        "Set out point",
      ),
  },
  {
    id: "studio.timeline.clear-in-out",
    label: "Clear in and out points",
    description: "Clear the timeline work area.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding("x", { alt: true })],
    execute: ({ actions }) =>
      actions.updateTimeline(
        {
          inPointMs: undefined,
          outPointMs: undefined,
        },
        "Clear work area",
      ),
  },
  {
    id: "studio.timeline.nudge-left",
    label: "Nudge clips left",
    description: "Move selected clips one frame left.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding(",", { alt: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) =>
      moveSelectedClips(context, -frameDuration(context.state)),
  },
  {
    id: "studio.timeline.nudge-right",
    label: "Nudge clips right",
    description: "Move selected clips one frame right.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding(".", { alt: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) =>
      moveSelectedClips(context, frameDuration(context.state)),
  },
  {
    id: "studio.timeline.nudge-left-large",
    label: "Nudge clips left ten frames",
    description: "Move selected clips ten frames left.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding(",", { alt: true, shift: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) =>
      moveSelectedClips(
        context,
        -frameDuration(context.state) * 10,
      ),
  },
  {
    id: "studio.timeline.nudge-right-large",
    label: "Nudge clips right ten frames",
    description: "Move selected clips ten frames right.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding(".", { alt: true, shift: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) =>
      moveSelectedClips(
        context,
        frameDuration(context.state) * 10,
      ),
  },
  {
    id: "studio.timeline.trim-start-left",
    label: "Trim start left",
    description: "Extend the selected clip start by one frame.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding("[", { alt: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) =>
      resizeSelectedClips(
        context,
        -frameDuration(context.state),
        "start",
      ),
  },
  {
    id: "studio.timeline.trim-start-right",
    label: "Trim start right",
    description: "Shorten the selected clip start by one frame.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding("]", { alt: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) =>
      resizeSelectedClips(
        context,
        frameDuration(context.state),
        "start",
      ),
  },
  {
    id: "studio.timeline.trim-end-left",
    label: "Trim end left",
    description: "Shorten the selected clip end by one frame.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding("[", { alt: true, shift: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) =>
      resizeSelectedClips(
        context,
        -frameDuration(context.state),
        "end",
      ),
  },
  {
    id: "studio.timeline.trim-end-right",
    label: "Trim end right",
    description: "Extend the selected clip end by one frame.",
    category: "timeline",
    scope: "timeline",
    bindings: [createBinding("]", { alt: true, shift: true })],
    enabled: ({ state }) => hasSelectedClips(state),
    execute: (context) =>
      resizeSelectedClips(
        context,
        frameDuration(context.state),
        "end",
      ),
  },
  {
    id: "studio.timeline.snapping",
    label: "Toggle snapping",
    description: "Enable or disable timeline snapping.",
    category: "timeline",
    scope: ["timeline", "global"],
    bindings: [createBinding("s", { alt: true })],
    execute: ({ state, actions }) =>
      actions.setSnapping(!state.timeline.snappingEnabled),
  },
  {
    id: "studio.view.zoom-in",
    label: "Zoom in",
    description: "Increase timeline zoom.",
    category: "view",
    scope: ["timeline", "global"],
    bindings: [
      createBinding("+", { mod: true }),
      createBinding("=", { mod: true }),
    ],
    execute: ({ state, actions }) =>
      actions.setTimelineZoom(state.timeline.zoom * 1.2),
  },
  {
    id: "studio.view.zoom-out",
    label: "Zoom out",
    description: "Decrease timeline zoom.",
    category: "view",
    scope: ["timeline", "global"],
    bindings: [createBinding("-", { mod: true })],
    execute: ({ state, actions }) =>
      actions.setTimelineZoom(state.timeline.zoom / 1.2),
  },
  {
    id: "studio.view.zoom-reset",
    label: "Reset zoom",
    description: "Reset timeline zoom to 100%.",
    category: "view",
    scope: ["timeline", "global"],
    bindings: [createBinding("0", { mod: true })],
    execute: ({ actions }) => actions.setTimelineZoom(1),
  },
  {
    id: "studio.view.grid",
    label: "Toggle grid",
    description: "Show or hide the canvas grid.",
    category: "view",
    scope: ["canvas", "global"],
    bindings: [createBinding("g", { mod: true, shift: true })],
    execute: ({ state, actions }) =>
      actions.updatePreferences({
        showGrid: !state.preferences.showGrid,
      }),
  },
  {
    id: "studio.view.guides",
    label: "Toggle guides",
    description: "Show or hide canvas guides.",
    category: "view",
    scope: ["canvas", "global"],
    bindings: [createBinding(";", { mod: true })],
    execute: ({ state, actions }) =>
      actions.updatePreferences({
        showGuides: !state.preferences.showGuides,
      }),
  },
  {
    id: "studio.view.safe-area",
    label: "Toggle safe area",
    description: "Show or hide the canvas safe area.",
    category: "view",
    scope: ["canvas", "global"],
    bindings: [createBinding("'", { mod: true })],
    execute: ({ state, actions }) =>
      actions.updatePreferences({
        showSafeArea: !state.preferences.showSafeArea,
      }),
  },
  createToolShortcut("select", "Select", "v"),
  createToolShortcut("hand", "Hand", "h"),
  createToolShortcut("text", "Text", "t"),
  createToolShortcut("shape", "Shape", "u"),
  createToolShortcut("image", "Image", "g"),
  createToolShortcut("video", "Video", "b"),
  createToolShortcut("audio", "Audio", "a"),
  createToolShortcut("crop", "Crop", "c"),
  createToolShortcut("record", "Record", "r"),
  createPanelShortcut(
    "studio.panel.assets",
    "Assets",
    "assets",
    createBinding("1", { mod: true }),
  ),
  createPanelShortcut(
    "studio.panel.timeline",
    "Timeline",
    "timeline",
    createBinding("2", { mod: true }),
  ),
  createPanelShortcut(
    "studio.panel.inspector",
    "Inspector",
    "inspector",
    createBinding("3", { mod: true }),
  ),
  createPanelShortcut(
    "studio.panel.history",
    "History",
    "history",
    createBinding("4", { mod: true }),
  ),
  createPanelShortcut(
    "studio.panel.render-queue",
    "Render queue",
    "renderQueue",
    createBinding("5", { mod: true }),
  ),
  createPanelShortcut(
    "studio.panel.keyframes",
    "Keyframes",
    "keyframes",
    createBinding("6", { mod: true }),
  ),
  createPanelShortcut(
    "studio.panel.curves",
    "Curves",
    "curves",
    createBinding("7", { mod: true }),
  ),
  createPanelShortcut(
    "studio.panel.voice-over",
    "Voice-over",
    "voiceOver",
    createBinding("8", { mod: true }),
  ),
  createPanelShortcut(
    "studio.panel.recording",
    "Recording",
    "recording",
    createBinding("9", { mod: true }),
  ),
  {
    id: "studio.recording.open",
    label: "Open recording",
    description: "Open the recording panel.",
    category: "recording",
    scope: "global",
    bindings: [createBinding("r", { mod: true, shift: true })],
    execute: ({ actions }) => actions.setActivePanel("recording"),
  },
  {
    id: "studio.voice-over.open",
    label: "Open voice-over",
    description: "Open the voice-over panel.",
    category: "voice-over",
    scope: "global",
    bindings: [createBinding("v", { mod: true, shift: true })],
    execute: ({ actions }) => actions.setActivePanel("voiceOver"),
  },
  {
    id: "studio.assets.open",
    label: "Open asset library",
    description: "Open the asset library.",
    category: "assets",
    scope: "global",
    bindings: [createBinding("a", { mod: true, shift: true })],
    execute: ({ actions }) => actions.setActivePanel("assets"),
  },
  {
    id: "studio.project.preferences",
    label: "Project settings",
    description: "Open the inspector for project settings.",
    category: "project",
    scope: "global",
    bindings: [createBinding(",", { mod: true })],
    execute: ({ actions }) => actions.setActivePanel("inspector"),
  },
  {
    id: "studio.project.command-palette",
    label: "Command palette",
    description: "Open the Beacon Studio command palette.",
    category: "navigation",
    scope: "global",
    bindings: [
      createBinding("k", { mod: true, shift: true }),
      createBinding("p", { mod: true, shift: true }),
    ],
  },
];

export function createStudioShortcutRegistry(
  options: StudioShortcutRegistryOptions = {},
): StudioShortcutDefinition[] {
  const overrides = options.overrides ?? {};

  return DEFAULT_STUDIO_SHORTCUTS.filter(
    (shortcut) => options.includeHidden || !shortcut.hidden,
  ).map((shortcut) => {
    const override = overrides[shortcut.id];

    if (override === null) {
      return {
        ...shortcut,
        bindings: [],
      };
    }

    if (override) {
      return {
        ...shortcut,
        bindings: override,
      };
    }

    return {
      ...shortcut,
      bindings: shortcut.bindings.map((binding) => ({
        ...binding,
      })),
    };
  });
}

export function shortcutSignature(
  binding: StudioShortcutBinding,
  platform: StudioShortcutPlatform = detectPlatform(),
): string {
  const parts: string[] = [];

  if (binding.mod) {
    parts.push(platform === "mac" ? "meta" : "ctrl");
  } else {
    if (binding.ctrl) parts.push("ctrl");
    if (binding.meta) parts.push("meta");
  }

  if (binding.alt) parts.push("alt");
  if (binding.shift) parts.push("shift");

  parts.push(normaliseKey(binding.key));

  return parts.join("+");
}

export function findShortcutConflicts(
  shortcuts: StudioShortcutDefinition[],
  platform: StudioShortcutPlatform = detectPlatform(),
): StudioShortcutConflict[] {
  const map = new Map<string, StudioShortcutDefinition[]>();

  for (const shortcut of shortcuts) {
    for (const binding of shortcut.bindings) {
      const signature = shortcutSignature(binding, platform);
      const existing = map.get(signature) ?? [];
      existing.push(shortcut);
      map.set(signature, existing);
    }
  }

  return [...map.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([signature, items]) => ({
      signature,
      shortcuts: items,
    }));
}

export function formatStudioShortcut(
  binding: StudioShortcutBinding,
  platform: StudioShortcutPlatform = detectPlatform(),
): string {
  const parts: string[] = [];

  if (binding.mod) {
    parts.push(platform === "mac" ? "⌘" : "Ctrl");
  } else {
    if (binding.ctrl) parts.push("Ctrl");
    if (binding.meta) parts.push("⌘");
  }

  if (binding.alt) parts.push(platform === "mac" ? "⌥" : "Alt");
  if (binding.shift) parts.push(platform === "mac" ? "⇧" : "Shift");

  const key = normaliseKey(binding.key);
  const labels: Record<string, string> = {
    space: "Space",
    esc: "Esc",
    left: "←",
    right: "→",
    up: "↑",
    down: "↓",
    delete: "Delete",
    backspace: "Backspace",
    enter: "Enter",
    tab: "Tab",
    home: "Home",
    end: "End",
  };

  parts.push(labels[key] ?? key.toUpperCase());

  return parts.join(platform === "mac" ? "" : "+");
}

export function findMatchingStudioShortcut(
  event: KeyboardEvent,
  shortcuts: StudioShortcutDefinition[],
  context: Omit<StudioShortcutContext, "event" | "platform">,
  platform: StudioShortcutPlatform = detectPlatform(),
): StudioShortcutDefinition | null {
  const editable = isEditableTarget(event.target);

  for (const shortcut of shortcuts) {
    const scopes = Array.isArray(shortcut.scope)
      ? shortcut.scope
      : [shortcut.scope];

    if (
      !scopes.includes("global") &&
      !scopes.includes(context.scope)
    ) {
      continue;
    }

    for (const binding of shortcut.bindings) {
      if (editable && !binding.allowInInput) continue;
      if (event.repeat && !binding.allowRepeat) continue;

      if (bindingMatchesEvent(binding, event, platform)) {
        return shortcut;
      }
    }
  }

  return null;
}

export async function executeStudioShortcut(
  shortcut: StudioShortcutDefinition,
  context: StudioShortcutContext,
): Promise<boolean> {
  if (shortcut.enabled && !shortcut.enabled(context)) {
    return false;
  }

  if (shortcut.commandId) {
    await context.actions.executeCommand(shortcut.commandId);
    return true;
  }

  if (shortcut.execute) {
    await shortcut.execute(context);
    return true;
  }

  return false;
}

export function createStudioShortcutHandler(
  getContext: () => Omit<
    StudioShortcutContext,
    "event" | "platform"
  >,
  options: StudioShortcutRegistryOptions = {},
): (event: KeyboardEvent) => void {
  const platform = options.platform ?? detectPlatform();
  const shortcuts = createStudioShortcutRegistry(options);

  return (event: KeyboardEvent) => {
    const baseContext = getContext();
    const shortcut = findMatchingStudioShortcut(
      event,
      shortcuts,
      baseContext,
      platform,
    );

    if (!shortcut) return;

    const binding = shortcut.bindings.find((candidate) =>
      bindingMatchesEvent(candidate, event, platform),
    );

    if (!binding) return;

    if (binding.preventDefault !== false) {
      event.preventDefault();
    }

    if (binding.stopPropagation) {
      event.stopPropagation();
    }

    void executeStudioShortcut(shortcut, {
      ...baseContext,
      event,
      platform,
    });
  };
}

export function registerStudioShortcutCommands(
  actions: StudioActions,
  shortcuts: StudioShortcutDefinition[] = DEFAULT_STUDIO_SHORTCUTS,
): () => void {
  const cleanups: Array<() => void> = [];

  for (const shortcut of shortcuts) {
    if (!shortcut.execute || shortcut.commandId) continue;

    const command: StudioCommand = {
      id: shortcut.id,
      label: shortcut.label,
      shortcut: shortcut.bindings[0]
        ? formatStudioShortcut(shortcut.bindings[0])
        : undefined,
      enabled: (context: StudioCommandContext) =>
        shortcut.enabled
          ? shortcut.enabled({
              scope: "global",
              state: context.state,
              actions: context.actions,
              platform: detectPlatform(),
            })
          : true,
      execute: (context: StudioCommandContext) =>
        shortcut.execute?.({
          scope: "global",
          state: context.state,
          actions: context.actions,
          platform: detectPlatform(),
        }),
    };

    cleanups.push(actions.registerCommand(command));
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

export function getStudioShortcutById(
  id: string,
  shortcuts: StudioShortcutDefinition[] = DEFAULT_STUDIO_SHORTCUTS,
): StudioShortcutDefinition | null {
  return shortcuts.find((shortcut) => shortcut.id === id) ?? null;
}

export function getStudioShortcutsByCategory(
  category: StudioShortcutCategory,
  shortcuts: StudioShortcutDefinition[] = DEFAULT_STUDIO_SHORTCUTS,
): StudioShortcutDefinition[] {
  return shortcuts.filter(
    (shortcut) => shortcut.category === category,
  );
}

export function getStudioShortcutsByScope(
  scope: StudioShortcutScope,
  shortcuts: StudioShortcutDefinition[] = DEFAULT_STUDIO_SHORTCUTS,
): StudioShortcutDefinition[] {
  return shortcuts.filter((shortcut) => {
    const scopes = Array.isArray(shortcut.scope)
      ? shortcut.scope
      : [shortcut.scope];

    return scopes.includes("global") || scopes.includes(scope);
  });
}

export function createStudioShortcutOverride(
  shortcutId: string,
  bindings: StudioShortcutBinding[] | null,
): StudioShortcutOverrides {
  return {
    [shortcutId]: bindings,
  };
}

export function mergeStudioShortcutOverrides(
  ...overrides: StudioShortcutOverrides[]
): StudioShortcutOverrides {
  return Object.assign({}, ...overrides);
}

export function isStudioPanelId(value: string): value is StudioPanelId {
  return PANEL_IDS.includes(value as StudioPanelId);
}

export function isStudioTool(value: string): value is StudioTool {
  return TOOL_IDS.includes(value as StudioTool);
}

export function getCurrentStudioPlatform(): StudioShortcutPlatform {
  return detectPlatform();
}