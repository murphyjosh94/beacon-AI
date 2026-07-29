"use client";

import {
  ChangeEvent,
  CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  TimelineKeyframe,
  TimelineTrack,
  TimelineTrackType,
} from "./Timeline";

export type InspectorProject = {
  id: string;
  name: string;
  description?: string;
  durationMs: number;
  previewUrl?: string;
};

export type InspectorSelection = {
  track: TimelineTrack | null;
  keyframe: TimelineKeyframe | null;
};

export type InspectorProps = {
  project?: InspectorProject | null;
  selection: InspectorSelection;
  disabled?: boolean;
  className?: string;
  onProjectChange?: (
    project: InspectorProject,
  ) => void;
  onTrackChange?: (
    track: TimelineTrack,
  ) => void;
  onKeyframeChange?: (
    trackId: string,
    keyframe: TimelineKeyframe,
  ) => void;
  onDeleteTrack?: (
    trackId: string,
  ) => void;
  onDeleteKeyframe?: (
    trackId: string,
    keyframeId: string,
  ) => void;
  onDuplicateKeyframe?: (
    trackId: string,
    keyframeId: string,
  ) => void;
  onPreviewKeyframe?: (
    trackId: string,
    keyframe: TimelineKeyframe,
  ) => void;
};

type InspectorTab =
  | "selection"
  | "project";

type ValidationState = {
  selectorMessage: string | null;
  selectorValid: boolean;
  timingMessage: string | null;
};

const TRACK_TYPES: {
  value: TimelineTrackType;
  label: string;
}[] = [
  {
    value: "camera",
    label: "Camera",
  },
  {
    value: "text",
    label: "Text",
  },
  {
    value: "image",
    label: "Image",
  },
  {
    value: "video",
    label: "Video",
  },
  {
    value: "audio",
    label: "Audio",
  },
  {
    value: "effect",
    label: "Effect",
  },
  {
    value: "interaction",
    label: "Interaction",
  },
];

const ACTION_TYPES = [
  {
    value: "scroll",
    label: "Scroll",
  },
  {
    value: "highlight",
    label: "Highlight",
  },
  {
    value: "click",
    label: "Click",
  },
  {
    value: "type",
    label: "Type text",
  },
  {
    value: "wait",
    label: "Wait",
  },
  {
    value: "zoom",
    label: "Zoom",
  },
  {
    value: "pan",
    label: "Pan",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

const PRESET_COLOURS = [
  "#22d3ee",
  "#38bdf8",
  "#818cf8",
  "#a78bfa",
  "#e879f9",
  "#fb7185",
  "#f59e0b",
  "#34d399",
];

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}

function safeNumber(
  value: string,
  fallback: number,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function formatMilliseconds(
  milliseconds: number,
) {
  const safe = Math.max(
    0,
    Math.round(milliseconds),
  );
  const minutes = Math.floor(
    safe / 60_000,
  );
  const seconds = Math.floor(
    (safe % 60_000) / 1000,
  );
  const millisecondsRemainder =
    safe % 1000;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}.${millisecondsRemainder
    .toString()
    .padStart(3, "0")}`;
}

function validateSelector(
  selector?: string,
): {
  valid: boolean;
  message: string | null;
} {
  const trimmed =
    selector?.trim() ?? "";

  if (!trimmed) {
    return {
      valid: true,
      message: null,
    };
  }

  if (
    typeof document ===
    "undefined"
  ) {
    return {
      valid: true,
      message: null,
    };
  }

  try {
    document.querySelector(trimmed);

    return {
      valid: true,
      message: null,
    };
  } catch {
    return {
      valid: false,
      message:
        "This is not a valid CSS selector.",
    };
  }
}

function normaliseTrack(
  track: TimelineTrack,
): TimelineTrack {
  return {
    ...track,
    name:
      track.name.trim() ||
      "Untitled track",
    colour:
      track.colour ??
      PRESET_COLOURS[0],
    keyframes:
      track.keyframes ?? [],
  };
}

function normaliseKeyframe(
  keyframe: TimelineKeyframe,
  projectDurationMs: number,
): TimelineKeyframe {
  const durationMs = clamp(
    Math.round(
      keyframe.durationMs ?? 500,
    ),
    100,
    Math.max(
      100,
      projectDurationMs,
    ),
  );

  const timeMs = clamp(
    Math.round(keyframe.timeMs),
    0,
    Math.max(
      0,
      projectDurationMs -
        durationMs,
    ),
  );

  return {
    ...keyframe,
    label:
      keyframe.label?.trim() ||
      "Untitled action",
    timeMs,
    durationMs,
  };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/10 px-4 py-5 last:border-b-0">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

        {description ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <label className="text-xs font-medium text-slate-300">
        {children}
      </label>

      {hint ? (
        <span className="text-[10px] text-slate-600">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

const inputClassName =
  "w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50";

const buttonClassName =
  "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";

export default function Inspector({
  project = null,
  selection,
  disabled = false,
  className = "",
  onProjectChange,
  onTrackChange,
  onKeyframeChange,
  onDeleteTrack,
  onDeleteKeyframe,
  onDuplicateKeyframe,
  onPreviewKeyframe,
}: InspectorProps) {
  const [activeTab, setActiveTab] =
    useState<InspectorTab>(
      selection.keyframe ||
        selection.track
        ? "selection"
        : "project",
    );
  const [localProject, setLocalProject] =
    useState(project);
  const [localTrack, setLocalTrack] =
    useState(
      selection.track
        ? normaliseTrack(
            selection.track,
          )
        : null,
    );
  const [
    localKeyframe,
    setLocalKeyframe,
  ] = useState(
    selection.keyframe
      ? normaliseKeyframe(
          selection.keyframe,
          project?.durationMs ??
            10_000,
        )
      : null,
  );

  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  useEffect(() => {
    setLocalTrack(
      selection.track
        ? normaliseTrack(
            selection.track,
          )
        : null,
    );
  }, [selection.track]);

  useEffect(() => {
    setLocalKeyframe(
      selection.keyframe
        ? normaliseKeyframe(
            selection.keyframe,
            project?.durationMs ??
              10_000,
          )
        : null,
    );
  }, [
    project?.durationMs,
    selection.keyframe,
  ]);

  useEffect(() => {
    if (
      selection.track ||
      selection.keyframe
    ) {
      setActiveTab("selection");
    }
  }, [
    selection.keyframe,
    selection.track,
  ]);

  const validation =
    useMemo<ValidationState>(() => {
      const selector =
        validateSelector(
          localKeyframe?.selector,
        );

      let timingMessage:
        | string
        | null = null;

      if (
        localKeyframe &&
        project
      ) {
        const endMs =
          localKeyframe.timeMs +
          (localKeyframe.durationMs ??
            0);

        if (
          endMs >
          project.durationMs
        ) {
          timingMessage =
            "This action extends beyond the project duration.";
        }
      }

      return {
        selectorMessage:
          selector.message,
        selectorValid:
          selector.valid,
        timingMessage,
      };
    }, [
      localKeyframe,
      project,
    ]);

  const projectDurationMs =
    Math.max(
      1000,
      localProject?.durationMs ??
        project?.durationMs ??
        10_000,
    );

  const commitProject = (
    nextProject: InspectorProject,
  ) => {
    setLocalProject(nextProject);
    onProjectChange?.(
      nextProject,
    );
  };

  const commitTrack = (
    nextTrack: TimelineTrack,
  ) => {
    const normalised =
      normaliseTrack(nextTrack);

    setLocalTrack(normalised);
    onTrackChange?.(normalised);
  };

  const commitKeyframe = (
    nextKeyframe: TimelineKeyframe,
  ) => {
    if (!localTrack) {
      return;
    }

    const normalised =
      normaliseKeyframe(
        nextKeyframe,
        projectDurationMs,
      );

    setLocalKeyframe(normalised);
    onKeyframeChange?.(
      localTrack.id,
      normalised,
    );
  };

  const updateProjectField = <
    Key extends keyof InspectorProject,
  >(
    key: Key,
    value: InspectorProject[Key],
  ) => {
    if (!localProject) {
      return;
    }

    commitProject({
      ...localProject,
      [key]: value,
    });
  };

  const updateTrackField = <
    Key extends keyof TimelineTrack,
  >(
    key: Key,
    value: TimelineTrack[Key],
  ) => {
    if (!localTrack) {
      return;
    }

    commitTrack({
      ...localTrack,
      [key]: value,
    });
  };

  const updateKeyframeField = <
    Key extends keyof TimelineKeyframe,
  >(
    key: Key,
    value: TimelineKeyframe[Key],
  ) => {
    if (!localKeyframe) {
      return;
    }

    commitKeyframe({
      ...localKeyframe,
      [key]: value,
    });
  };

  const handleMetadataChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    if (!localKeyframe) {
      return;
    }

    const value =
      event.target.value;

    if (!value.trim()) {
      updateKeyframeField(
        "metadata",
        {},
      );
      return;
    }

    try {
      const parsed = JSON.parse(
        value,
      ) as unknown;

      if (
        parsed &&
        typeof parsed ===
          "object" &&
        !Array.isArray(parsed)
      ) {
        updateKeyframeField(
          "metadata",
          parsed as Record<
            string,
            unknown
          >,
        );
      }
    } catch {
      // Keep the text area editable without
      // committing invalid JSON.
    }
  };

  const metadataValue =
    localKeyframe?.metadata
      ? JSON.stringify(
          localKeyframe.metadata,
          null,
          2,
        )
      : "";

  const style: CSSProperties = {
    minWidth: 0,
  };

  return (
    <aside
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      style={style}
      aria-label="Beacon Studio inspector"
    >
      <header className="border-b border-white/10 bg-slate-900/95">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Inspector
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Edit the current selection.
            </p>
          </div>

          {localKeyframe &&
          localTrack &&
          onPreviewKeyframe ? (
            <button
              type="button"
              onClick={() =>
                onPreviewKeyframe(
                  localTrack.id,
                  localKeyframe,
                )
              }
              disabled={
                disabled ||
                !validation.selectorValid
              }
              className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Preview
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 border-t border-white/10">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "selection",
              )
            }
            className={`px-3 py-2.5 text-xs font-semibold transition ${
              activeTab ===
              "selection"
                ? "border-b-2 border-cyan-400 bg-cyan-400/5 text-cyan-100"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            }`}
          >
            Selection
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "project",
              )
            }
            className={`px-3 py-2.5 text-xs font-semibold transition ${
              activeTab ===
              "project"
                ? "border-b-2 border-cyan-400 bg-cyan-400/5 text-cyan-100"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            }`}
          >
            Project
          </button>
        </div>
      </header>

      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
        {activeTab ===
        "project" ? (
          localProject ? (
            <>
              <Section
                title="Project details"
                description="The title and description shown in the Studio dashboard."
              >
                <div>
                  <FieldLabel>
                    Project name
                  </FieldLabel>
                  <input
                    type="text"
                    value={
                      localProject.name
                    }
                    maxLength={120}
                    disabled={disabled}
                    onChange={(
                      event,
                    ) =>
                      updateProjectField(
                        "name",
                        event.target
                          .value,
                      )
                    }
                    className={
                      inputClassName
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Description
                  </FieldLabel>
                  <textarea
                    value={
                      localProject.description ??
                      ""
                    }
                    rows={4}
                    maxLength={500}
                    disabled={disabled}
                    onChange={(
                      event,
                    ) =>
                      updateProjectField(
                        "description",
                        event.target
                          .value,
                      )
                    }
                    className={
                      inputClassName
                    }
                  />
                </div>
              </Section>

              <Section
                title="Timeline"
                description="Set the total project duration."
              >
                <div>
                  <FieldLabel
                    hint={formatMilliseconds(
                      localProject.durationMs,
                    )}
                  >
                    Duration
                  </FieldLabel>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={1000}
                      max={
                        86_400_000
                      }
                      step={100}
                      value={
                        localProject.durationMs
                      }
                      disabled={
                        disabled
                      }
                      onChange={(
                        event,
                      ) =>
                        updateProjectField(
                          "durationMs",
                          clamp(
                            Math.round(
                              safeNumber(
                                event
                                  .target
                                  .value,
                                localProject.durationMs,
                              ),
                            ),
                            1000,
                            86_400_000,
                          ),
                        )
                      }
                      className={
                        inputClassName
                      }
                    />

                    <select
                      value={
                        localProject.durationMs
                      }
                      disabled={
                        disabled
                      }
                      onChange={(
                        event,
                      ) =>
                        updateProjectField(
                          "durationMs",
                          Number(
                            event
                              .target
                              .value,
                          ),
                        )
                      }
                      className={
                        inputClassName
                      }
                    >
                      <option
                        value={5000}
                      >
                        5 seconds
                      </option>
                      <option
                        value={10000}
                      >
                        10 seconds
                      </option>
                      <option
                        value={15000}
                      >
                        15 seconds
                      </option>
                      <option
                        value={30000}
                      >
                        30 seconds
                      </option>
                      <option
                        value={60000}
                      >
                        1 minute
                      </option>
                      <option
                        value={
                          localProject.durationMs
                        }
                      >
                        Custom
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel>
                    Preview URL
                  </FieldLabel>
                  <input
                    type="url"
                    value={
                      localProject.previewUrl ??
                      ""
                    }
                    placeholder="https://example.com"
                    disabled={disabled}
                    onChange={(
                      event,
                    ) =>
                      updateProjectField(
                        "previewUrl",
                        event.target
                          .value,
                      )
                    }
                    className={
                      inputClassName
                    }
                  />
                </div>
              </Section>
            </>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-medium text-slate-300">
                No project loaded
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Load a Studio project to
                edit its properties.
              </p>
            </div>
          )
        ) : localTrack ? (
          <>
            <Section
              title="Track"
              description="Controls that apply to the entire selected track."
            >
              <div>
                <FieldLabel>
                  Track name
                </FieldLabel>
                <input
                  type="text"
                  value={
                    localTrack.name
                  }
                  maxLength={100}
                  disabled={disabled}
                  onChange={(
                    event,
                  ) =>
                    updateTrackField(
                      "name",
                      event.target
                        .value,
                    )
                  }
                  className={
                    inputClassName
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Track type
                </FieldLabel>
                <select
                  value={
                    localTrack.type
                  }
                  disabled={disabled}
                  onChange={(
                    event,
                  ) =>
                    updateTrackField(
                      "type",
                      event.target
                        .value,
                    )
                  }
                  className={
                    inputClassName
                  }
                >
                  {TRACK_TYPES.map(
                    (type) => (
                      <option
                        key={
                          type.value
                        }
                        value={
                          type.value
                        }
                      >
                        {type.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <FieldLabel>
                  Track colour
                </FieldLabel>

                <div className="flex flex-wrap gap-2">
                  {PRESET_COLOURS.map(
                    (colour) => (
                      <button
                        key={colour}
                        type="button"
                        disabled={
                          disabled
                        }
                        onClick={() =>
                          updateTrackField(
                            "colour",
                            colour,
                          )
                        }
                        className={`h-7 w-7 rounded-full border-2 transition ${
                          localTrack.colour ===
                          colour
                            ? "scale-110 border-white"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{
                          backgroundColor:
                            colour,
                        }}
                        aria-label={`Use ${colour}`}
                      />
                    ),
                  )}

                  <input
                    type="color"
                    value={
                      localTrack.colour ??
                      PRESET_COLOURS[0]
                    }
                    disabled={disabled}
                    onChange={(
                      event,
                    ) =>
                      updateTrackField(
                        "colour",
                        event.target
                          .value,
                      )
                    }
                    className="h-7 w-9 cursor-pointer rounded border border-white/10 bg-slate-950 p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Custom track colour"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    key: "muted" as const,
                    label: "Muted",
                  },
                  {
                    key: "locked" as const,
                    label: "Locked",
                  },
                  {
                    key: "hidden" as const,
                    label: "Hidden",
                  },
                ].map(
                  ({
                    key,
                    label,
                  }) => (
                    <button
                      key={key}
                      type="button"
                      disabled={
                        disabled
                      }
                      onClick={() =>
                        updateTrackField(
                          key,
                          !localTrack[
                            key
                          ],
                        )
                      }
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                        localTrack[key]
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </Section>

            {localKeyframe ? (
              <>
                <Section
                  title="Action"
                  description="Edit the selected timeline action."
                >
                  <div>
                    <FieldLabel>
                      Label
                    </FieldLabel>
                    <input
                      type="text"
                      value={
                        localKeyframe.label ??
                        ""
                      }
                      maxLength={120}
                      disabled={
                        disabled
                      }
                      onChange={(
                        event,
                      ) =>
                        updateKeyframeField(
                          "label",
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClassName
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Action type
                    </FieldLabel>
                    <select
                      value={
                        localKeyframe.action ??
                        "custom"
                      }
                      disabled={
                        disabled
                      }
                      onChange={(
                        event,
                      ) =>
                        updateKeyframeField(
                          "action",
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClassName
                      }
                    >
                      {ACTION_TYPES.map(
                        (action) => (
                          <option
                            key={
                              action.value
                            }
                            value={
                              action.value
                            }
                          >
                            {
                              action.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5">
                    <span>
                      <span className="block text-xs font-medium text-slate-300">
                        Disabled
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-600">
                        Skip this action
                        during playback.
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={
                        localKeyframe.disabled ??
                        false
                      }
                      disabled={
                        disabled
                      }
                      onChange={(
                        event,
                      ) =>
                        updateKeyframeField(
                          "disabled",
                          event.target
                            .checked,
                        )
                      }
                      className="h-4 w-4 accent-cyan-400"
                    />
                  </label>
                </Section>

                <Section
                  title="Timing"
                  description="Position and length on the project timeline."
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>
                        Start
                      </FieldLabel>
                      <input
                        type="number"
                        min={0}
                        max={
                          projectDurationMs
                        }
                        step={100}
                        value={
                          localKeyframe.timeMs
                        }
                        disabled={
                          disabled
                        }
                        onChange={(
                          event,
                        ) =>
                          updateKeyframeField(
                            "timeMs",
                            safeNumber(
                              event
                                .target
                                .value,
                              localKeyframe.timeMs,
                            ),
                          )
                        }
                        className={
                          inputClassName
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel>
                        Duration
                      </FieldLabel>
                      <input
                        type="number"
                        min={100}
                        max={
                          projectDurationMs
                        }
                        step={100}
                        value={
                          localKeyframe.durationMs ??
                          500
                        }
                        disabled={
                          disabled
                        }
                        onChange={(
                          event,
                        ) =>
                          updateKeyframeField(
                            "durationMs",
                            safeNumber(
                              event
                                .target
                                .value,
                              localKeyframe.durationMs ??
                                500,
                            ),
                          )
                        }
                        className={
                          inputClassName
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
                    Starts at{" "}
                    <span className="font-medium text-slate-300">
                      {formatMilliseconds(
                        localKeyframe.timeMs,
                      )}
                    </span>{" "}
                    and ends at{" "}
                    <span className="font-medium text-slate-300">
                      {formatMilliseconds(
                        localKeyframe.timeMs +
                          (localKeyframe.durationMs ??
                            0),
                      )}
                    </span>
                    .
                  </div>

                  {validation.timingMessage ? (
                    <p className="text-xs text-amber-300">
                      {
                        validation.timingMessage
                      }
                    </p>
                  ) : null}
                </Section>

                <Section
                  title="Target"
                  description="Choose the website element this action controls."
                >
                  <div>
                    <FieldLabel hint="CSS selector">
                      Selector
                    </FieldLabel>
                    <input
                      type="text"
                      value={
                        localKeyframe.selector ??
                        ""
                      }
                      placeholder="#hero, .buy-button, [data-studio-id='header']"
                      disabled={
                        disabled
                      }
                      onChange={(
                        event,
                      ) =>
                        updateKeyframeField(
                          "selector",
                          event.target
                            .value,
                        )
                      }
                      className={`${inputClassName} ${
                        validation.selectorValid
                          ? ""
                          : "border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/10"
                      }`}
                    />

                    {validation.selectorMessage ? (
                      <p className="mt-1.5 text-xs text-rose-300">
                        {
                          validation.selectorMessage
                        }
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] leading-4 text-slate-600">
                        Use a stable ID or
                        data attribute where
                        possible.
                      </p>
                    )}
                  </div>

                  <div>
                    <FieldLabel>
                      Value or text
                    </FieldLabel>
                    <textarea
                      value={
                        typeof localKeyframe.value ===
                        "string"
                          ? localKeyframe.value
                          : localKeyframe.value ==
                              null
                            ? ""
                            : String(
                                localKeyframe.value,
                              )
                      }
                      rows={4}
                      maxLength={5000}
                      disabled={
                        disabled
                      }
                      placeholder="Text to type, zoom level, scroll amount, or custom value"
                      onChange={(
                        event,
                      ) =>
                        updateKeyframeField(
                          "value",
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClassName
                      }
                    />
                  </div>
                </Section>

                <Section
                  title="Advanced"
                  description="Optional data for custom playback actions."
                >
                  <div>
                    <FieldLabel hint="JSON object">
                      Metadata
                    </FieldLabel>
                    <textarea
                      key={
                        localKeyframe.id
                      }
                      defaultValue={
                        metadataValue
                      }
                      rows={7}
                      spellCheck={false}
                      disabled={
                        disabled
                      }
                      placeholder={'{\n  "easing": "ease-out"\n}'}
                      onBlur={
                        handleMetadataChange
                      }
                      className={`${inputClassName} font-mono text-xs`}
                    />
                    <p className="mt-1.5 text-[11px] leading-4 text-slate-600">
                      Invalid JSON is not
                      saved.
                    </p>
                  </div>
                </Section>

                <Section title="Actions">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={
                        disabled ||
                        !onDuplicateKeyframe
                      }
                      onClick={() =>
                        onDuplicateKeyframe?.(
                          localTrack.id,
                          localKeyframe.id,
                        )
                      }
                      className={
                        buttonClassName
                      }
                    >
                      Duplicate
                    </button>

                    <button
                      type="button"
                      disabled={
                        disabled ||
                        !onDeleteKeyframe
                      }
                      onClick={() =>
                        onDeleteKeyframe?.(
                          localTrack.id,
                          localKeyframe.id,
                        )
                      }
                      className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete action
                    </button>
                  </div>
                </Section>
              </>
            ) : (
              <div className="border-b border-white/10 px-6 py-10 text-center">
                <p className="text-sm font-medium text-slate-300">
                  Track selected
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Select an action in the
                  timeline to edit its
                  timing and behaviour.
                </p>
              </div>
            )}

            {onDeleteTrack ? (
              <Section title="Track actions">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onDeleteTrack(
                      localTrack.id,
                    )
                  }
                  className="w-full rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete track
                </button>
              </Section>
            ) : null}
          </>
        ) : (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg text-slate-600">
              ◇
            </div>
            <p className="mt-4 text-sm font-medium text-slate-300">
              Nothing selected
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Select a track or action in
              the timeline to edit its
              properties.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}