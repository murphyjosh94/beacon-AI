"use client";

import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type HistoryEntryKind =
  | "initial"
  | "edit"
  | "create"
  | "delete"
  | "move"
  | "resize"
  | "rename"
  | "settings"
  | "asset"
  | "render"
  | "custom";

export type HistoryEntry<TState> = {
  id: string;
  label: string;
  kind: HistoryEntryKind;
  state: TState;
  createdAt: string;
  description?: string | null;
  groupId?: string | null;
  metadata?: Record<string, unknown>;
};

export type HistoryExport<TState> = {
  version: 1;
  exportedAt: string;
  currentIndex: number;
  entries: HistoryEntry<TState>[];
};

export type HistoryManagerProps<TState> = {
  entries: HistoryEntry<TState>[];
  currentIndex: number;
  disabled?: boolean;
  className?: string;
  title?: string;
  maxEntries?: number;
  debug?: boolean;
  showToolbar?: boolean;
  showSearch?: boolean;
  showDetails?: boolean;
  emptyState?: ReactNode;
  onUndo?: () => void | Promise<void>;
  onRedo?: () => void | Promise<void>;
  onJumpTo?: (
    index: number,
    entry: HistoryEntry<TState>,
  ) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
  onDeleteEntry?: (
    entryId: string,
  ) => void | Promise<void>;
  onExport?: (
    payload: HistoryExport<TState>,
  ) => void | Promise<void>;
  onImport?: (
    payload: HistoryExport<TState>,
  ) => void | Promise<void>;
  serializeState?: (
    state: TState,
  ) => string;
};

type FilterMode =
  | "all"
  | "past"
  | "current"
  | "future";

function createId(
  prefix: string,
): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ).format(date);
}

function formatRelativeTime(
  value: string,
): string {
  const date = new Date(value);
  const timestamp =
    date.getTime();

  if (
    Number.isNaN(timestamp)
  ) {
    return "Unknown";
  }

  const difference =
    Date.now() - timestamp;
  const absolute =
    Math.abs(difference);

  if (absolute < 10_000) {
    return "Just now";
  }

  const formatter =
    new Intl.RelativeTimeFormat(
      "en-GB",
      {
        numeric: "auto",
      },
    );

  if (absolute < 60_000) {
    return formatter.format(
      -Math.round(
        difference / 1000,
      ),
      "second",
    );
  }

  if (absolute < 3_600_000) {
    return formatter.format(
      -Math.round(
        difference / 60_000,
      ),
      "minute",
    );
  }

  if (absolute < 86_400_000) {
    return formatter.format(
      -Math.round(
        difference / 3_600_000,
      ),
      "hour",
    );
  }

  return formatter.format(
    -Math.round(
      difference / 86_400_000,
    ),
    "day",
  );
}

function kindGlyph(
  kind: HistoryEntryKind,
): string {
  switch (kind) {
    case "initial":
      return "◎";
    case "create":
      return "+";
    case "delete":
      return "−";
    case "move":
      return "↔";
    case "resize":
      return "↕";
    case "rename":
      return "✎";
    case "settings":
      return "⚙";
    case "asset":
      return "▧";
    case "render":
      return "▶";
    case "edit":
      return "◆";
    case "custom":
    default:
      return "•";
  }
}

function kindClassName(
  kind: HistoryEntryKind,
): string {
  switch (kind) {
    case "delete":
      return "border-rose-400/20 bg-rose-500/10 text-rose-100";
    case "create":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
    case "move":
    case "resize":
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
    case "rename":
      return "border-violet-400/20 bg-violet-500/10 text-violet-100";
    case "settings":
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
    case "asset":
      return "border-sky-400/20 bg-sky-500/10 text-sky-100";
    case "render":
      return "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100";
    case "initial":
      return "border-slate-400/20 bg-slate-500/10 text-slate-200";
    case "edit":
    case "custom":
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

function downloadJson(
  filename: string,
  data: unknown,
): void {
  const blob = new Blob(
    [
      JSON.stringify(
        data,
        null,
        2,
      ),
    ],
    {
      type: "application/json",
    },
  );

  const url =
    URL.createObjectURL(blob);
  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();

  URL.revokeObjectURL(url);
}

function safeSerialise(
  value: unknown,
): string {
  try {
    return JSON.stringify(
      value,
      null,
      2,
    );
  } catch {
    return "State could not be serialised.";
  }
}

export default function HistoryManager<
  TState,
>({
  entries,
  currentIndex,
  disabled = false,
  className = "",
  title = "History",
  maxEntries = 100,
  debug = false,
  showToolbar = true,
  showSearch = true,
  showDetails = true,
  emptyState,
  onUndo,
  onRedo,
  onJumpTo,
  onClear,
  onDeleteEntry,
  onExport,
  onImport,
  serializeState,
}: HistoryManagerProps<TState>) {
  const importInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [search, setSearch] =
    useState("");
  const [filter, setFilter] =
    useState<FilterMode>("all");
  const [selectedEntryId, setSelectedEntryId] =
    useState<string | null>(
      entries[currentIndex]?.id ??
        null,
    );
  const [isBusy, setIsBusy] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(
      null,
    );
  const [showRawState, setShowRawState] =
    useState(false);

  const boundedCurrentIndex =
    entries.length === 0
      ? -1
      : Math.min(
          Math.max(
            currentIndex,
            0,
          ),
          entries.length - 1,
        );

  useEffect(() => {
    const currentEntry =
      entries[
        boundedCurrentIndex
      ];

    if (currentEntry) {
      setSelectedEntryId(
        currentEntry.id,
      );
      return;
    }

    if (
      selectedEntryId &&
      !entries.some(
        (entry) =>
          entry.id ===
          selectedEntryId,
      )
    ) {
      setSelectedEntryId(
        entries[0]?.id ??
          null,
      );
    }
  }, [
    boundedCurrentIndex,
    entries,
    selectedEntryId,
  ]);

  const canUndo =
    !disabled &&
    boundedCurrentIndex > 0 &&
    Boolean(onUndo);
  const canRedo =
    !disabled &&
    boundedCurrentIndex >= 0 &&
    boundedCurrentIndex <
      entries.length - 1 &&
    Boolean(onRedo);

  const visibleEntries =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return entries
        .map(
          (
            entry,
            index,
          ) => ({
            entry,
            index,
          }),
        )
        .filter(
          ({
            entry,
            index,
          }) => {
            if (
              filter === "past" &&
              index >=
                boundedCurrentIndex
            ) {
              return false;
            }

            if (
              filter ===
                "current" &&
              index !==
                boundedCurrentIndex
            ) {
              return false;
            }

            if (
              filter ===
                "future" &&
              index <=
                boundedCurrentIndex
            ) {
              return false;
            }

            if (
              query &&
              ![
                entry.label,
                entry.description ??
                  "",
                entry.kind,
              ]
                .join(" ")
                .toLowerCase()
                .includes(query)
            ) {
              return false;
            }

            return true;
          },
        )
        .reverse();
    }, [
      boundedCurrentIndex,
      entries,
      filter,
      search,
    ]);

  const selectedEntry =
    useMemo(
      () =>
        entries.find(
          (entry) =>
            entry.id ===
            selectedEntryId,
        ) ?? null,
      [
        entries,
        selectedEntryId,
      ],
    );

  const selectedIndex =
    selectedEntry
      ? entries.findIndex(
          (entry) =>
            entry.id ===
            selectedEntry.id,
        )
      : -1;

  const runAction = async (
    action:
      | "undo"
      | "redo"
      | "clear"
      | "jump"
      | "delete",
    entry?: HistoryEntry<TState>,
    index?: number,
  ) => {
    if (
      disabled ||
      isBusy
    ) {
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);

    try {
      if (action === "undo") {
        await onUndo?.();
      }

      if (action === "redo") {
        await onRedo?.();
      }

      if (action === "clear") {
        await onClear?.();
      }

      if (
        action === "jump" &&
        entry &&
        typeof index ===
          "number"
      ) {
        await onJumpTo?.(
          index,
          entry,
        );
        setSelectedEntryId(
          entry.id,
        );
      }

      if (
        action === "delete" &&
        entry
      ) {
        await onDeleteEntry?.(
          entry.id,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The history action failed.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const exportHistory =
    async () => {
      const payload: HistoryExport<TState> =
        {
          version: 1,
          exportedAt:
            new Date().toISOString(),
          currentIndex:
            boundedCurrentIndex,
          entries,
        };

      try {
        if (onExport) {
          await onExport(
            payload,
          );
          return;
        }

        downloadJson(
          `beacon-studio-history-${new Date()
            .toISOString()
            .replace(
              /[:.]/g,
              "-",
            )}.json`,
          payload,
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not export history.",
        );
      }
    };

  const importHistory =
    async (
      file: File,
    ) => {
      try {
        const text =
          await file.text();
        const parsed =
          JSON.parse(
            text,
          ) as Partial<
            HistoryExport<TState>
          >;

        if (
          parsed.version !== 1 ||
          !Array.isArray(
            parsed.entries,
          ) ||
          typeof parsed.currentIndex !==
            "number"
        ) {
          throw new Error(
            "This is not a valid Beacon Studio history file.",
          );
        }

        const payload =
          parsed as HistoryExport<TState>;

        await onImport?.(
          payload,
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not import history.",
        );
      }
    };

  const handleKeyboard =
    (
      event: KeyboardEvent<HTMLElement>,
    ) => {
      const target =
        event.target as HTMLElement;

      if (
        target.tagName ===
          "INPUT" ||
        target.tagName ===
          "TEXTAREA" ||
        target.tagName ===
          "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const modifier =
        event.metaKey ||
        event.ctrlKey;
      const key =
        event.key.toLowerCase();

      if (
        modifier &&
        key === "z" &&
        event.shiftKey
      ) {
        event.preventDefault();

        if (canRedo) {
          void runAction(
            "redo",
          );
        }

        return;
      }

      if (
        modifier &&
        key === "z"
      ) {
        event.preventDefault();

        if (canUndo) {
          void runAction(
            "undo",
          );
        }

        return;
      }

      if (
        modifier &&
        key === "y"
      ) {
        event.preventDefault();

        if (canRedo) {
          void runAction(
            "redo",
          );
        }

        return;
      }

      if (
        event.key ===
        "Escape"
      ) {
        setSelectedEntryId(
          entries[
            boundedCurrentIndex
          ]?.id ?? null,
        );
      }
    };

  const rawState =
    selectedEntry
      ? serializeState
        ? serializeState(
            selectedEntry.state,
          )
        : safeSerialise(
            selectedEntry.state,
          )
      : "";

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      aria-label="Beacon Studio history manager"
      tabIndex={0}
      onKeyDown={
        handleKeyboard
      }
    >
      <header className="border-b border-white/10 bg-slate-900/95">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Review, undo and restore editor changes.
            </p>
          </div>

          {showToolbar ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void runAction(
                    "undo",
                  )
                }
                disabled={
                  !canUndo ||
                  isBusy
                }
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                title="Undo (Ctrl/Cmd + Z)"
              >
                ↶ Undo
              </button>

              <button
                type="button"
                onClick={() =>
                  void runAction(
                    "redo",
                  )
                }
                disabled={
                  !canRedo ||
                  isBusy
                }
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                title="Redo (Ctrl/Cmd + Shift + Z)"
              >
                ↷ Redo
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 border-t border-white/10 text-center">
          <div className="px-3 py-3">
            <p className="text-lg font-semibold text-white">
              {Math.max(
                boundedCurrentIndex,
                0,
              )}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-600">
              Undo steps
            </p>
          </div>

          <div className="border-x border-white/10 px-3 py-3">
            <p className="text-lg font-semibold text-white">
              {entries.length}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-600">
              Entries
            </p>
          </div>

          <div className="px-3 py-3">
            <p className="text-lg font-semibold text-white">
              {boundedCurrentIndex >=
              0
                ? Math.max(
                    entries.length -
                      boundedCurrentIndex -
                      1,
                    0,
                  )
                : 0}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-600">
              Redo steps
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
              setErrorMessage(
                null,
              )
            }
            className="shrink-0 text-rose-200 hover:text-white"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="grid min-h-[34rem] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 border-b border-white/10 xl:border-b-0 xl:border-r">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  "all",
                  "past",
                  "current",
                  "future",
                ] as FilterMode[]
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

            {showSearch ? (
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search history"
                className="min-w-0 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
              />
            ) : null}
          </div>

          {visibleEntries.length >
          0 ? (
            <div className="divide-y divide-white/5">
              {visibleEntries.map(
                ({
                  entry,
                  index,
                }) => {
                  const isCurrent =
                    index ===
                    boundedCurrentIndex;
                  const isFuture =
                    index >
                    boundedCurrentIndex;
                  const selected =
                    selectedEntryId ===
                    entry.id;

                  return (
                    <article
                      key={
                        entry.id
                      }
                      className={`grid cursor-pointer grid-cols-[36px_minmax(0,1fr)_auto] gap-3 px-4 py-4 transition ${
                        selected
                          ? "bg-cyan-400/[0.075]"
                          : "hover:bg-white/[0.03]"
                      } ${
                        isFuture
                          ? "opacity-55"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedEntryId(
                          entry.id,
                        )
                      }
                      onDoubleClick={() =>
                        void runAction(
                          "jump",
                          entry,
                          index,
                        )
                      }
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold ${kindClassName(
                          entry.kind,
                        )}`}
                      >
                        {kindGlyph(
                          entry.kind,
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-medium text-slate-100">
                            {
                              entry.label
                            }
                          </h3>

                          {isCurrent ? (
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-100">
                              Current
                            </span>
                          ) : null}

                          {entry.groupId ? (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
                              Grouped
                            </span>
                          ) : null}
                        </div>

                        {entry.description ? (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
                            {
                              entry.description
                            }
                          </p>
                        ) : null}

                        <p className="mt-1 text-[10px] text-slate-600">
                          {formatRelativeTime(
                            entry.createdAt,
                          )}
                        </p>
                      </div>

                      <div className="flex items-start gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void runAction(
                              "jump",
                              entry,
                              index,
                            );
                          }}
                          disabled={
                            disabled ||
                            isBusy ||
                            !onJumpTo ||
                            isCurrent
                          }
                          className="rounded-md px-2 py-1 text-[11px] text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          Restore
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void runAction(
                              "delete",
                              entry,
                            );
                          }}
                          disabled={
                            disabled ||
                            isBusy ||
                            !onDeleteEntry ||
                            isCurrent
                          }
                          className="rounded-md px-2 py-1 text-[11px] text-slate-500 transition hover:bg-white/5 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label="Delete history entry"
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="flex min-h-[28rem] items-center justify-center px-6 py-14 text-center">
              {emptyState ?? (
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl text-slate-600">
                    ↶
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-300">
                    {entries.length ===
                    0
                      ? "No history yet"
                      : "No matching history"}
                  </p>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
                    {entries.length ===
                    0
                      ? "Changes will appear here as the project is edited."
                      : "Try changing the search or filter."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {showDetails ? (
          <aside className="bg-slate-900/45">
            {selectedEntry ? (
              <div>
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-base font-semibold ${kindClassName(
                        selectedEntry.kind,
                      )}`}
                    >
                      {kindGlyph(
                        selectedEntry.kind,
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white">
                        {
                          selectedEntry.label
                        }
                      </h3>
                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {
                          selectedEntry.kind
                        }
                      </p>
                    </div>
                  </div>

                  {selectedEntry.description ? (
                    <p className="mt-4 text-xs leading-5 text-slate-400">
                      {
                        selectedEntry.description
                      }
                    </p>
                  ) : null}
                </div>

                <div className="border-b border-white/10 p-4">
                  <h4 className="text-xs font-semibold text-white">
                    Entry details
                  </h4>

                  <dl className="mt-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-slate-500">
                        Position
                      </dt>
                      <dd className="text-right text-slate-200">
                        {selectedIndex +
                          1}{" "}
                        of{" "}
                        {entries.length}
                      </dd>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-slate-500">
                        Created
                      </dt>
                      <dd className="max-w-[180px] text-right text-slate-200">
                        {formatDateTime(
                          selectedEntry.createdAt,
                        )}
                      </dd>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-slate-500">
                        Entry ID
                      </dt>
                      <dd className="max-w-[180px] truncate text-right font-mono text-[10px] text-slate-400">
                        {
                          selectedEntry.id
                        }
                      </dd>
                    </div>

                    {selectedEntry.groupId ? (
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-500">
                          Group
                        </dt>
                        <dd className="max-w-[180px] truncate text-right font-mono text-[10px] text-slate-400">
                          {
                            selectedEntry.groupId
                          }
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                {debug ? (
                  <div className="border-b border-white/10 p-4">
                    <button
                      type="button"
                      onClick={() =>
                        setShowRawState(
                          (current) =>
                            !current,
                        )
                      }
                      className="flex w-full items-center justify-between text-left text-xs font-semibold text-white"
                    >
                      <span>
                        Raw state
                      </span>
                      <span className="text-slate-500">
                        {showRawState
                          ? "−"
                          : "+"}
                      </span>
                    </button>

                    {showRawState ? (
                      <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-white/10 bg-slate-950 p-3 text-[10px] leading-4 text-slate-400">
                        {rawState}
                      </pre>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2 p-4">
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "jump",
                        selectedEntry,
                        selectedIndex,
                      )
                    }
                    disabled={
                      disabled ||
                      isBusy ||
                      !onJumpTo ||
                      selectedIndex ===
                        boundedCurrentIndex
                    }
                    className="w-full rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Restore this state
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "delete",
                        selectedEntry,
                      )
                    }
                    disabled={
                      disabled ||
                      isBusy ||
                      !onDeleteEntry ||
                      selectedIndex ===
                        boundedCurrentIndex
                    }
                    className="w-full rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete entry
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[34rem] items-center justify-center px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    No history entry selected
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Select an entry to inspect or restore it.
                  </p>
                </div>
              </div>
            )}
          </aside>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3">
        <div className="text-[11px] text-slate-500">
          {entries.length} of{" "}
          {maxEntries} history entries
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file =
                event.target
                  .files?.[0];

              if (file) {
                void importHistory(
                  file,
                );
              }

              event.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() =>
              importInputRef.current?.click()
            }
            disabled={
              disabled ||
              isBusy ||
              !onImport
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Import
          </button>

          <button
            type="button"
            onClick={() =>
              void exportHistory()
            }
            disabled={
              disabled ||
              isBusy ||
              entries.length ===
                0
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export
          </button>

          <button
            type="button"
            onClick={() =>
              void runAction(
                "clear",
              )
            }
            disabled={
              disabled ||
              isBusy ||
              entries.length ===
                0 ||
              !onClear
            }
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear history
          </button>
        </div>
      </footer>
    </section>
  );
}

export function createHistoryEntry<TState>({
  label,
  state,
  kind = "edit",
  description = null,
  groupId = null,
  metadata,
}: {
  label: string;
  state: TState;
  kind?: HistoryEntryKind;
  description?: string | null;
  groupId?: string | null;
  metadata?: Record<string, unknown>;
}): HistoryEntry<TState> {
  return {
    id: createId("history"),
    label,
    kind,
    state,
    createdAt:
      new Date().toISOString(),
    description,
    groupId,
    metadata,
  };
}

export function trimHistory<TState>(
  entries: HistoryEntry<TState>[],
  maximumEntries: number,
): HistoryEntry<TState>[] {
  const limit = Math.max(
    1,
    Math.floor(maximumEntries),
  );

  if (
    entries.length <= limit
  ) {
    return entries;
  }

  return entries.slice(
    entries.length - limit,
  );
}