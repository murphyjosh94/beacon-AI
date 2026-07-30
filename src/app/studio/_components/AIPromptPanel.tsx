"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  generateIntoStudio,
  type StudioGenerationResult,
} from "../_engine/GenerationEngine";

import {
  STUDIO_CAMPAIGN_FORMAT_GROUPS,
  STUDIO_OUTPUT_FORMATS,
  getPrimaryStudioFormat,
  type StudioGenerationBrief,
  type StudioOutputFormatId,
  type StudioQuality,
  type StudioTone,
} from "../_engine/PromptBuilder";

import { useStudio } from "../StudioProvider";

const TONE_OPTIONS: StudioTone[] = [
  "professional",
  "friendly",
  "bold",
  "calm",
  "playful",
  "luxury",
  "informative",
  "persuasive",
];

const QUALITY_OPTIONS: Array<{
  value: StudioQuality;
  label: string;
}> = [
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "standard",
    label: "Standard",
  },
  {
    value: "high",
    label: "High",
  },
  {
    value: "maximum",
    label: "Maximum",
  },
];

const DURATION_OPTIONS = [
  {
    value: 5_000,
    label: "5 seconds",
  },
  {
    value: 10_000,
    label: "10 seconds",
  },
  {
    value: 15_000,
    label: "15 seconds",
  },
  {
    value: 30_000,
    label: "30 seconds",
  },
  {
    value: 60_000,
    label: "1 minute",
  },
  {
    value: 180_000,
    label: "3 minutes",
  },
  {
    value: 300_000,
    label: "5 minutes",
  },
];

const DEFAULT_FORMATS: StudioOutputFormatId[] = [
  "instagram-reel",
  "facebook-reel",
  "tiktok",
];

function splitColours(
  value: string,
): string[] {
  return value
    .split(",")
    .map((colour) =>
      colour.trim(),
    )
    .filter(Boolean)
    .slice(0, 12);
}

function formatSceneCount(
  result: StudioGenerationResult | null,
): string | null {
  if (!result) {
    return null;
  }

  const variantCount =
    result.variants.length;

  const sceneCount =
    result.primaryVariant.scenes.length;

  const variantLabel =
    variantCount === 1
      ? "format"
      : "formats";

  const sceneLabel =
    sceneCount === 1
      ? "scene"
      : "scenes";

  return `${variantCount} ${variantLabel} and ${sceneCount} ${sceneLabel} created`;
}

function formatLabel(
  value: string,
): string {
  return value
    .charAt(0)
    .toUpperCase() +
    value.slice(1);
}

export default function AIPromptPanel() {
  const { state, actions } =
    useStudio();

  const abortControllerRef =
    useRef<AbortController | null>(
      null,
    );

  const [prompt, setPrompt] =
    useState("");

  const [selectedFormats, setSelectedFormats] =
    useState<StudioOutputFormatId[]>(
      DEFAULT_FORMATS,
    );

  const [audience, setAudience] =
    useState("");

  const [tone, setTone] =
    useState<StudioTone>(
      "professional",
    );

  const [style, setStyle] =
    useState("");

  const [colours, setColours] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [durationMs, setDurationMs] =
    useState(15_000);

  const [quality, setQuality] =
    useState<StudioQuality>(
      "high",
    );

  const [outputCount, setOutputCount] =
    useState(1);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [result, setResult] =
    useState<StudioGenerationResult | null>(
      null,
    );

  const selectedFormatDetails =
    useMemo(
      () =>
        selectedFormats.map(
          (formatId) =>
            STUDIO_OUTPUT_FORMATS[
              formatId
            ],
        ),
      [selectedFormats],
    );

  const hasVideoFormat =
    selectedFormatDetails.some(
      (format) =>
        format.kind === "video",
    );

  const primaryFormat =
    useMemo(
      () =>
        getPrimaryStudioFormat(
          selectedFormats,
        ),
      [selectedFormats],
    );

  const canGenerate =
    prompt.trim().length >= 3 &&
    selectedFormats.length > 0 &&
    !isGenerating;

  const toggleFormat =
    useCallback(
      (
        formatId:
          StudioOutputFormatId,
      ) => {
        setSelectedFormats(
          (current) => {
            if (
              current.includes(
                formatId,
              )
            ) {
              if (
                current.length === 1
              ) {
                return current;
              }

              return current.filter(
                (id) =>
                  id !== formatId,
              );
            }

            return [
              ...current,
              formatId,
            ];
          },
        );

        setError(null);
        setResult(null);
      },
      [],
    );

  const selectFormatGroup =
    useCallback(
      (
        formats:
          StudioOutputFormatId[],
      ) => {
        setSelectedFormats(
          (current) =>
            Array.from(
              new Set([
                ...current,
                ...formats,
              ]),
            ),
        );

        setError(null);
        setResult(null);
      },
      [],
    );

  const clearFormatGroup =
    useCallback(
      (
        formats:
          StudioOutputFormatId[],
      ) => {
        setSelectedFormats(
          (current) => {
            const remaining =
              current.filter(
                (formatId) =>
                  !formats.includes(
                    formatId,
                  ),
              );

            return remaining.length > 0
              ? remaining
              : current;
          },
        );

        setError(null);
        setResult(null);
      },
      [],
    );

  const handleCancel =
    useCallback(() => {
      abortControllerRef.current?.abort();

      abortControllerRef.current =
        null;

      setIsGenerating(false);
    }, []);

  const handleSubmit =
    useCallback(
      async (
        event: FormEvent<HTMLFormElement>,
      ) => {
        event.preventDefault();

        const trimmedPrompt =
          prompt.trim();

        if (
          trimmedPrompt.length < 3
        ) {
          setError(
            "Describe what you would like Beacon Studio to create.",
          );

          return;
        }

        if (
          selectedFormats.length ===
          0
        ) {
          setError(
            "Select at least one output format.",
          );

          return;
        }

        abortControllerRef.current?.abort();

        const controller =
          new AbortController();

        abortControllerRef.current =
          controller;

        setIsGenerating(true);
        setError(null);
        setResult(null);

        const brief: StudioGenerationBrief =
          {
            prompt:
              trimmedPrompt,

            formats:
              selectedFormats,

            audience:
              audience.trim() ||
              undefined,

            tone,

            style:
              style.trim() ||
              undefined,

            colours:
              splitColours(
                colours,
              ),

            notes:
              notes.trim() ||
              undefined,

            durationMs:
              hasVideoFormat
                ? durationMs
                : 5_000,

            quality,

            outputCount,
          };

        try {
          const generationResult =
            await generateIntoStudio(
              {
                brief,

                project:
                  state.project,

                actions,

                preferredFormat:
                  primaryFormat.id,

                signal:
                  controller.signal,
              },
            );

          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          setResult(
            generationResult,
          );
        } catch (
          generationError
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          setError(
            generationError instanceof
              Error
              ? generationError.message
              : "Beacon Studio could not generate this campaign.",
          );
        } finally {
          if (
            abortControllerRef.current ===
            controller
          ) {
            abortControllerRef.current =
              null;

            setIsGenerating(false);
          }
        }
      },
      [
        actions,
        audience,
        colours,
        durationMs,
        hasVideoFormat,
        notes,
        outputCount,
        primaryFormat.id,
        prompt,
        quality,
        selectedFormats,
        state.project,
        style,
        tone,
      ],
    );

  return (
    <section
      aria-labelledby="studio-ai-heading"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-black/20"
    >
      <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              Beacon Studio AI
            </p>

            <h2
              id="studio-ai-heading"
              className="mt-2 text-xl font-semibold text-white"
            >
              Create one campaign for
              multiple platforms
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Describe your campaign once,
              choose every format you need,
              and Beacon Studio will create
              linked platform-ready versions.
            </p>
          </div>

          <div className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
            Multi-format AI
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="space-y-7 px-5 py-6 sm:px-6">
          <div>
            <label
              htmlFor="studio-ai-prompt"
              className="text-sm font-semibold text-white"
            >
              Describe your campaign
            </label>

            <textarea
              id="studio-ai-prompt"
              value={prompt}
              onChange={(event) => {
                setPrompt(
                  event.target.value,
                );

                setError(null);
              }}
              rows={6}
              maxLength={6000}
              placeholder="For example: Promote Beacon Business website packages to local tradespeople. Focus on professional websites, affordable monthly support and a clear call to action."
              className="mt-3 w-full resize-y rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
              <span>
                Beacon will reuse the core
                message across every selected
                format.
              </span>

              <span>
                {prompt.length}/6000
              </span>
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-white">
              Select output formats
            </legend>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Choose one or several. Each
              version will be adapted for its
              own dimensions and platform.
            </p>

            <div className="mt-5 space-y-6">
              {STUDIO_CAMPAIGN_FORMAT_GROUPS.map(
                (group) => {
                  const selectedCount =
                    group.formats.filter(
                      (formatId) =>
                        selectedFormats.includes(
                          formatId,
                        ),
                    ).length;

                  const allSelected =
                    selectedCount ===
                    group.formats.length;

                  return (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            {group.label}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {selectedCount} of{" "}
                            {
                              group.formats
                                .length
                            }{" "}
                            selected
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (
                              allSelected
                            ) {
                              clearFormatGroup(
                                group.formats,
                              );
                            } else {
                              selectFormatGroup(
                                group.formats,
                              );
                            }
                          }}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                        >
                          {allSelected
                            ? "Clear group"
                            : "Select all"}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {group.formats.map(
                          (formatId) => {
                            const format =
                              STUDIO_OUTPUT_FORMATS[
                                formatId
                              ];

                            const selected =
                              selectedFormats.includes(
                                formatId,
                              );

                            return (
                              <button
                                key={
                                  format.id
                                }
                                type="button"
                                aria-pressed={
                                  selected
                                }
                                onClick={() =>
                                  toggleFormat(
                                    format.id,
                                  )
                                }
                                className={[
                                  "rounded-xl border px-4 py-3 text-left transition",
                                  selected
                                    ? "border-amber-400 bg-amber-400/10 text-white"
                                    : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900",
                                ].join(
                                  " ",
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <span className="block text-sm font-semibold">
                                      {
                                        format.label
                                      }
                                    </span>

                                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                                      {
                                        format.description
                                      }
                                    </span>
                                  </div>

                                  <span className="shrink-0 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-400">
                                    {
                                      format.aspectRatio
                                    }
                                  </span>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                                  <span>
                                    {
                                      format.width
                                    }
                                    ×
                                    {
                                      format.height
                                    }
                                  </span>

                                  <span>
                                    •
                                  </span>

                                  <span>
                                    {formatLabel(
                                      format.kind,
                                    )}
                                  </span>
                                </div>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </fieldset>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  Selected campaign outputs
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Primary editor canvas:{" "}
                  {primaryFormat.label}
                </p>
              </div>

              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {selectedFormats.length}{" "}
                {selectedFormats.length ===
                1
                  ? "format"
                  : "formats"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedFormatDetails.map(
                (format) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() =>
                      toggleFormat(
                        format.id,
                      )
                    }
                    className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 transition hover:border-red-400/60 hover:text-red-200"
                    title={`Remove ${format.label}`}
                  >
                    {format.label} ×
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="studio-ai-audience"
                className="text-sm font-semibold text-white"
              >
                Target audience
              </label>

              <input
                id="studio-ai-audience"
                type="text"
                value={audience}
                onChange={(event) =>
                  setAudience(
                    event.target.value,
                  )
                }
                placeholder="Local families, tradespeople, business owners..."
                className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label
                htmlFor="studio-ai-tone"
                className="text-sm font-semibold text-white"
              >
                Tone
              </label>

              <select
                id="studio-ai-tone"
                value={tone}
                onChange={(event) =>
                  setTone(
                    event.target
                      .value as StudioTone,
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              >
                {TONE_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {formatLabel(
                        option,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="studio-ai-style"
              className="text-sm font-semibold text-white"
            >
              Creative style
            </label>

            <input
              id="studio-ai-style"
              type="text"
              value={style}
              onChange={(event) =>
                setStyle(
                  event.target.value,
                )
              }
              placeholder="Premium cinematic, clean corporate, playful social..."
              className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div>
            <label
              htmlFor="studio-ai-colours"
              className="text-sm font-semibold text-white"
            >
              Brand colours
            </label>

            <input
              id="studio-ai-colours"
              type="text"
              value={colours}
              onChange={(event) =>
                setColours(
                  event.target.value,
                )
              }
              placeholder="Beacon blue, gold, white"
              className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />

            <p className="mt-2 text-xs text-slate-500">
              Separate multiple colours with
              commas.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label
                htmlFor="studio-ai-duration"
                className="text-sm font-semibold text-white"
              >
                Video duration
              </label>

              <select
                id="studio-ai-duration"
                value={durationMs}
                disabled={
                  !hasVideoFormat
                }
                onChange={(event) =>
                  setDurationMs(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {DURATION_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="studio-ai-quality"
                className="text-sm font-semibold text-white"
              >
                Planning quality
              </label>

              <select
                id="studio-ai-quality"
                value={quality}
                onChange={(event) =>
                  setQuality(
                    event.target
                      .value as StudioQuality,
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              >
                {QUALITY_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="studio-ai-output-count"
                className="text-sm font-semibold text-white"
              >
                Campaign variations
              </label>

              <select
                id="studio-ai-output-count"
                value={outputCount}
                onChange={(event) =>
                  setOutputCount(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              >
                <option value={1}>
                  1 campaign concept
                </option>

                <option value={2}>
                  2 campaign concepts
                </option>

                <option value={3}>
                  3 campaign concepts
                </option>

                <option value={4}>
                  4 campaign concepts
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="studio-ai-notes"
              className="text-sm font-semibold text-white"
            >
              Additional instructions
            </label>

            <textarea
              id="studio-ai-notes"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              rows={3}
              maxLength={2000}
              placeholder="Include a specific offer, wording, logo position, call to action or important detail."
              className="mt-3 w-full resize-y rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
            >
              {error}
            </div>
          ) : null}

          {result ? (
            <div
              role="status"
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4"
            >
              <p className="text-sm font-semibold text-emerald-200">
                Campaign added to the editor
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-100/80">
                {formatSceneCount(
                  result,
                )}
                . The primary format is open
                in the editor and all linked
                variants are stored with the
                project.
              </p>
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 border-t border-slate-800 bg-slate-950/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            {isGenerating ? (
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
              >
                Cancel
              </button>
            ) : null}

            <button
              type="submit"
              disabled={!canGenerate}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"
                  />

                  Creating campaign…
                </>
              ) : (
                `Generate ${selectedFormats.length} ${
                  selectedFormats.length ===
                  1
                    ? "format"
                    : "formats"
                }`
              )}
            </button>
          </div>

          <p className="mt-3 text-center text-xs leading-5 text-slate-500">
            Beacon creates one shared campaign
            and adapts each version for its
            selected platform and dimensions.
          </p>
        </div>
      </form>
    </section>
  );
}