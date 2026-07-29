"use client";

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type StudioAssetType =
  | "image"
  | "video"
  | "audio"
  | "svg"
  | "json"
  | "font"
  | "document"
  | "unknown";

export type StudioAsset = {
  id: string;
  name: string;
  type: StudioAssetType;
  url: string;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  favourite?: boolean;
  metadata?: Record<string, unknown>;
};

export type AssetLibraryUpload = {
  id: string;
  file: File;
  progress: number;
  status:
    | "queued"
    | "uploading"
    | "completed"
    | "error"
    | "cancelled";
  error?: string | null;
};

export type AssetLibraryProps = {
  assets: StudioAsset[];
  selectedAssetIds?: string[];
  disabled?: boolean;
  className?: string;
  acceptedFileTypes?: string;
  maxFileSizeBytes?: number;
  allowMultiple?: boolean;
  onUploadFiles?: (
    files: File[],
    onProgress: (
      file: File,
      progress: number,
    ) => void,
  ) => Promise<StudioAsset[] | void>;
  onSelectionChange?: (
    selectedAssetIds: string[],
  ) => void;
  onInsertAsset?: (
    asset: StudioAsset,
  ) => void;
  onRenameAsset?: (
    assetId: string,
    name: string,
  ) => void;
  onDeleteAssets?: (
    assetIds: string[],
  ) => void;
  onToggleFavourite?: (
    assetId: string,
    favourite: boolean,
  ) => void;
  onRefresh?: () => void | Promise<void>;
};

type ViewMode =
  | "grid"
  | "list";

type SortMode =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "size-desc";

type FilterMode =
  | "all"
  | StudioAssetType
  | "favourites";

const DEFAULT_ACCEPTED_FILE_TYPES =
  "image/*,video/*,audio/*,.svg,.json,.lottie,.woff,.woff2,.ttf,.otf,.pdf";

const DEFAULT_MAX_FILE_SIZE =
  250 * 1024 * 1024;

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

function detectAssetType(
  file: File,
): StudioAssetType {
  if (
    file.type.startsWith("image/svg") ||
    file.name
      .toLowerCase()
      .endsWith(".svg")
  ) {
    return "svg";
  }

  if (
    file.type.startsWith("image/")
  ) {
    return "image";
  }

  if (
    file.type.startsWith("video/")
  ) {
    return "video";
  }

  if (
    file.type.startsWith("audio/")
  ) {
    return "audio";
  }

  if (
    file.type.includes("json") ||
    file.name
      .toLowerCase()
      .endsWith(".json") ||
    file.name
      .toLowerCase()
      .endsWith(".lottie")
  ) {
    return "json";
  }

  if (
    /\.(woff2?|ttf|otf)$/i.test(
      file.name,
    )
  ) {
    return "font";
  }

  if (
    file.type ===
      "application/pdf" ||
    file.type.startsWith(
      "text/",
    )
  ) {
    return "document";
  }

  return "unknown";
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
  let unitIndex = 0;

  while (
    size >= 1024 &&
    unitIndex <
      units.length - 1
  ) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(
    size >= 100 ? 0 : 1,
  )} ${units[unitIndex]}`;
}

function formatDuration(
  milliseconds?: number | null,
): string | null {
  if (
    typeof milliseconds !==
      "number" ||
    !Number.isFinite(
      milliseconds,
    ) ||
    milliseconds < 0
  ) {
    return null;
  }

  const totalSeconds =
    Math.round(
      milliseconds / 1000,
    );
  const minutes = Math.floor(
    totalSeconds / 60,
  );
  const seconds =
    totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function assetGlyph(
  type: StudioAssetType,
): string {
  switch (type) {
    case "image":
      return "▧";
    case "video":
      return "▶";
    case "audio":
      return "♪";
    case "svg":
      return "◇";
    case "json":
      return "{}";
    case "font":
      return "Aa";
    case "document":
      return "▤";
    default:
      return "?";
  }
}

function canPreviewAsImage(
  asset: StudioAsset,
): boolean {
  return (
    asset.type === "image" ||
    asset.type === "svg"
  );
}

function normaliseSearch(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

function revokeObjectUrls(
  urls: string[],
): void {
  urls.forEach((url) => {
    try {
      URL.revokeObjectURL(
        url,
      );
    } catch {
      // URL may already have been released.
    }
  });
}

export default function AssetLibrary({
  assets,
  selectedAssetIds:
    controlledSelectedAssetIds = [],
  disabled = false,
  className = "",
  acceptedFileTypes =
    DEFAULT_ACCEPTED_FILE_TYPES,
  maxFileSizeBytes =
    DEFAULT_MAX_FILE_SIZE,
  allowMultiple = true,
  onUploadFiles,
  onSelectionChange,
  onInsertAsset,
  onRenameAsset,
  onDeleteAssets,
  onToggleFavourite,
  onRefresh,
}: AssetLibraryProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );
  const previewUrlsRef =
    useRef<string[]>([]);

  const [search, setSearch] =
    useState("");
  const [filter, setFilter] =
    useState<FilterMode>("all");
  const [sort, setSort] =
    useState<SortMode>("newest");
  const [viewMode, setViewMode] =
    useState<ViewMode>("grid");
  const [isDraggingOver, setIsDraggingOver] =
    useState(false);
  const [selectedAssetIds, setSelectedAssetIds] =
    useState<string[]>(
      controlledSelectedAssetIds,
    );
  const [uploads, setUploads] =
    useState<
      AssetLibraryUpload[]
    >([]);
  const [localAssets, setLocalAssets] =
    useState<StudioAsset[]>(
      assets,
    );
  const [renameAssetId, setRenameAssetId] =
    useState<string | null>(
      null,
    );
  const [renameValue, setRenameValue] =
    useState("");
  const [errorMessage, setErrorMessage] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    setLocalAssets(assets);
  }, [assets]);

  useEffect(() => {
    setSelectedAssetIds(
      controlledSelectedAssetIds,
    );
  }, [
    controlledSelectedAssetIds,
  ]);

  useEffect(() => {
    return () => {
      revokeObjectUrls(
        previewUrlsRef.current,
      );
    };
  }, []);

  const filteredAssets =
    useMemo(() => {
      const query =
        normaliseSearch(search);

      const next =
        localAssets.filter(
          (asset) => {
            if (
              filter ===
                "favourites" &&
              !asset.favourite
            ) {
              return false;
            }

            if (
              filter !== "all" &&
              filter !==
                "favourites" &&
              asset.type !== filter
            ) {
              return false;
            }

            if (
              query &&
              !asset.name
                .toLowerCase()
                .includes(query)
            ) {
              return false;
            }

            return true;
          },
        );

      return [...next].sort(
        (first, second) => {
          switch (sort) {
            case "oldest":
              return (
                new Date(
                  first.createdAt ??
                    0,
                ).getTime() -
                new Date(
                  second.createdAt ??
                    0,
                ).getTime()
              );
            case "name-asc":
              return first.name.localeCompare(
                second.name,
              );
            case "name-desc":
              return second.name.localeCompare(
                first.name,
              );
            case "size-desc":
              return (
                (second.sizeBytes ??
                  0) -
                (first.sizeBytes ??
                  0)
              );
            case "newest":
            default:
              return (
                new Date(
                  second.createdAt ??
                    0,
                ).getTime() -
                new Date(
                  first.createdAt ??
                    0,
                ).getTime()
              );
          }
        },
      );
    }, [
      filter,
      localAssets,
      search,
      sort,
    ]);

  const selectedAssets =
    useMemo(
      () =>
        localAssets.filter(
          (asset) =>
            selectedAssetIds.includes(
              asset.id,
            ),
        ),
      [
        localAssets,
        selectedAssetIds,
      ],
    );

  const emitSelection = (
    nextIds: string[],
  ) => {
    setSelectedAssetIds(
      nextIds,
    );
    onSelectionChange?.(
      nextIds,
    );
  };

  const handleAssetSelection = (
    asset: StudioAsset,
    event:
      | React.MouseEvent
      | React.KeyboardEvent,
  ) => {
    const additive =
      event.ctrlKey ||
      event.metaKey;
    const range =
      event.shiftKey;

    if (range) {
      const visibleIds =
        filteredAssets.map(
          (item) => item.id,
        );
      const lastId =
        selectedAssetIds[
          selectedAssetIds.length -
            1
        ];
      const startIndex =
        visibleIds.indexOf(lastId);
      const endIndex =
        visibleIds.indexOf(
          asset.id,
        );

      if (
        startIndex >= 0 &&
        endIndex >= 0
      ) {
        const from = Math.min(
          startIndex,
          endIndex,
        );
        const to = Math.max(
          startIndex,
          endIndex,
        );

        emitSelection(
          Array.from(
            new Set([
              ...selectedAssetIds,
              ...visibleIds.slice(
                from,
                to + 1,
              ),
            ]),
          ),
        );
        return;
      }
    }

    if (additive) {
      emitSelection(
        selectedAssetIds.includes(
          asset.id,
        )
          ? selectedAssetIds.filter(
              (id) =>
                id !== asset.id,
            )
          : [
              ...selectedAssetIds,
              asset.id,
            ],
      );
      return;
    }

    emitSelection([
      asset.id,
    ]);
  };

  const validateFiles = (
    incomingFiles: File[],
  ): File[] => {
    const valid: File[] = [];
    const errors: string[] = [];

    incomingFiles.forEach(
      (file) => {
        if (
          file.size >
          maxFileSizeBytes
        ) {
          errors.push(
            `${file.name} exceeds ${formatFileSize(
              maxFileSizeBytes,
            )}.`,
          );
          return;
        }

        valid.push(file);
      },
    );

    setErrorMessage(
      errors.length > 0
        ? errors.join(" ")
        : null,
    );

    return allowMultiple
      ? valid
      : valid.slice(0, 1);
  };

  const createLocalPreviewAssets = (
    files: File[],
  ): StudioAsset[] =>
    files.map((file) => {
      const url =
        URL.createObjectURL(
          file,
        );

      previewUrlsRef.current.push(
        url,
      );

      return {
        id: createId(
          "local-asset",
        ),
        name: file.name,
        type: detectAssetType(
          file,
        ),
        url,
        thumbnailUrl: url,
        mimeType: file.type,
        sizeBytes: file.size,
        createdAt:
          new Date().toISOString(),
        updatedAt:
          new Date().toISOString(),
        metadata: {
          localPreview: true,
        },
      };
    });

  const uploadFiles = async (
    incomingFiles: File[],
  ) => {
    if (
      disabled ||
      incomingFiles.length === 0
    ) {
      return;
    }

    const files =
      validateFiles(
        incomingFiles,
      );

    if (
      files.length === 0
    ) {
      return;
    }

    const newUploads =
      files.map(
        (
          file,
        ): AssetLibraryUpload => ({
          id: createId(
            "upload",
          ),
          file,
          progress: 0,
          status:
            onUploadFiles
              ? "queued"
              : "completed",
          error: null,
        }),
      );

    setUploads((current) => [
      ...newUploads,
      ...current,
    ]);

    if (!onUploadFiles) {
      const previews =
        createLocalPreviewAssets(
          files,
        );

      setLocalAssets(
        (current) => [
          ...previews,
          ...current,
        ],
      );

      emitSelection(
        previews.map(
          (asset) =>
            asset.id,
        ),
      );

      return;
    }

    setUploads((current) =>
      current.map((upload) =>
        newUploads.some(
          (item) =>
            item.id ===
            upload.id,
        )
          ? {
              ...upload,
              status:
                "uploading",
            }
          : upload,
      ),
    );

    try {
      const uploadedAssets =
        await onUploadFiles(
          files,
          (
            file,
            progress,
          ) => {
            setUploads(
              (current) =>
                current.map(
                  (upload) =>
                    upload.file ===
                    file
                      ? {
                          ...upload,
                          status:
                            "uploading",
                          progress:
                            Math.min(
                              Math.max(
                                progress,
                                0,
                              ),
                              100,
                            ),
                        }
                      : upload,
                ),
            );
          },
        );

      setUploads((current) =>
        current.map((upload) =>
          files.includes(
            upload.file,
          )
            ? {
                ...upload,
                status:
                  "completed",
                progress: 100,
              }
            : upload,
        ),
      );

      if (
        uploadedAssets &&
        uploadedAssets.length >
          0
      ) {
        setLocalAssets(
          (current) => {
            const existingIds =
              new Set(
                current.map(
                  (asset) =>
                    asset.id,
                ),
              );

            return [
              ...uploadedAssets.filter(
                (asset) =>
                  !existingIds.has(
                    asset.id,
                  ),
              ),
              ...current,
            ];
          },
        );

        emitSelection(
          uploadedAssets.map(
            (asset) =>
              asset.id,
          ),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The upload failed.";

      setUploads((current) =>
        current.map((upload) =>
          files.includes(
            upload.file,
          )
            ? {
                ...upload,
                status: "error",
                error: message,
              }
            : upload,
        ),
      );

      setErrorMessage(message);
    }
  };

  const handleFileInput = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files =
      Array.from(
        event.target.files ??
          [],
      );

    void uploadFiles(files);
    event.target.value = "";
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    setIsDraggingOver(false);

    void uploadFiles(
      Array.from(
        event.dataTransfer.files,
      ),
    );
  };

  const beginRename = (
    asset: StudioAsset,
  ) => {
    setRenameAssetId(
      asset.id,
    );
    setRenameValue(
      asset.name,
    );
  };

  const commitRename = () => {
    if (!renameAssetId) {
      return;
    }

    const name =
      renameValue
        .trim()
        .slice(0, 160);

    if (name) {
      setLocalAssets(
        (current) =>
          current.map(
            (asset) =>
              asset.id ===
              renameAssetId
                ? {
                    ...asset,
                    name,
                    updatedAt:
                      new Date().toISOString(),
                  }
                : asset,
          ),
      );

      onRenameAsset?.(
        renameAssetId,
        name,
      );
    }

    setRenameAssetId(null);
    setRenameValue("");
  };

  const deleteSelectedAssets =
    () => {
      if (
        selectedAssetIds.length ===
          0 ||
        disabled
      ) {
        return;
      }

      onDeleteAssets?.(
        selectedAssetIds,
      );

      if (!onDeleteAssets) {
        setLocalAssets(
          (current) =>
            current.filter(
              (asset) =>
                !selectedAssetIds.includes(
                  asset.id,
                ),
            ),
        );
      }

      emitSelection([]);
    };

  const handleLibraryKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    const target =
      event.target as HTMLElement;

    if (
      target.tagName ===
        "INPUT" ||
      target.tagName ===
        "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    if (
      event.key === "Delete" ||
      event.key === "Backspace"
    ) {
      event.preventDefault();
      deleteSelectedAssets();
    }

    if (
      (event.ctrlKey ||
        event.metaKey) &&
      event.key.toLowerCase() ===
        "a"
    ) {
      event.preventDefault();
      emitSelection(
        filteredAssets.map(
          (asset) =>
            asset.id,
        ),
      );
    }

    if (
      event.key === "Escape"
    ) {
      emitSelection([]);
    }
  };

  const activeAsset =
    selectedAssets.length === 1
      ? selectedAssets[0]
      : null;

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      aria-label="Beacon Studio asset library"
      tabIndex={0}
      onKeyDown={
        handleLibraryKeyDown
      }
    >
      <header className="border-b border-white/10 bg-slate-900/95">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Asset library
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Upload and reuse media
              across the project.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                void onRefresh?.()
              }
              disabled={
                disabled ||
                !onRefresh
              }
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
              }
              disabled={disabled}
              className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Upload assets
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple={
                allowMultiple
              }
              accept={
                acceptedFileTypes
              }
              onChange={
                handleFileInput
              }
              className="hidden"
            />
          </div>
        </div>

        <div className="grid gap-2 border-t border-white/10 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search assets"
            className="min-w-0 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
          />

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target
                  .value as FilterMode,
              )
            }
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-400/60"
            aria-label="Filter assets"
          >
            <option value="all">
              All assets
            </option>
            <option value="favourites">
              Favourites
            </option>
            <option value="image">
              Images
            </option>
            <option value="video">
              Videos
            </option>
            <option value="audio">
              Audio
            </option>
            <option value="svg">
              SVG
            </option>
            <option value="json">
              JSON / Lottie
            </option>
            <option value="font">
              Fonts
            </option>
            <option value="document">
              Documents
            </option>
            <option value="unknown">
              Other
            </option>
          </select>

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target
                  .value as SortMode,
              )
            }
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-400/60"
            aria-label="Sort assets"
          >
            <option value="newest">
              Newest
            </option>
            <option value="oldest">
              Oldest
            </option>
            <option value="name-asc">
              Name A–Z
            </option>
            <option value="name-desc">
              Name Z–A
            </option>
            <option value="size-desc">
              Largest
            </option>
          </select>

          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() =>
                setViewMode("grid")
              }
              className={`px-3 py-2 text-xs transition ${
                viewMode === "grid"
                  ? "bg-cyan-400/10 text-cyan-100"
                  : "bg-white/5 text-slate-500 hover:bg-white/10"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() =>
                setViewMode("list")
              }
              className={`px-3 py-2 text-xs transition ${
                viewMode === "list"
                  ? "bg-cyan-400/10 text-cyan-100"
                  : "bg-white/5 text-slate-500 hover:bg-white/10"
              }`}
            >
              List
            </button>
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
            className="shrink-0 text-rose-300 hover:text-white"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      ) : null}

      {uploads.length > 0 ? (
        <div className="border-b border-white/10 bg-slate-900/50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Uploads
            </span>
            <button
              type="button"
              onClick={() =>
                setUploads(
                  (current) =>
                    current.filter(
                      (upload) =>
                        upload.status !==
                          "completed" &&
                        upload.status !==
                          "cancelled",
                    ),
                )
              }
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Clear completed
            </button>
          </div>

          <div className="space-y-2">
            {uploads
              .slice(0, 5)
              .map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="min-w-0 truncate text-slate-300">
                      {
                        upload.file
                          .name
                      }
                    </span>
                    <span className="shrink-0 capitalize text-slate-500">
                      {
                        upload.status
                      }
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        upload.status ===
                        "error"
                          ? "bg-rose-400"
                          : "bg-cyan-400"
                      }`}
                      style={{
                        width: `${upload.progress}%`,
                      }}
                    />
                  </div>

                  {upload.error ? (
                    <p className="mt-1.5 text-[10px] text-rose-300">
                      {
                        upload.error
                      }
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        </div>
      ) : null}

      <div
        className={`relative min-h-80 transition ${
          isDraggingOver
            ? "bg-cyan-400/[0.045]"
            : ""
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDraggingOver(
              true,
            );
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={(event) => {
          if (
            event.currentTarget ===
            event.target
          ) {
            setIsDraggingOver(
              false,
            );
          }
        }}
        onDrop={handleDrop}
      >
        {isDraggingOver ? (
          <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400/50 bg-slate-950/90">
            <div className="text-center">
              <div className="text-3xl text-cyan-300">
                ↓
              </div>
              <p className="mt-2 text-sm font-semibold text-cyan-100">
                Drop files to upload
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Maximum{" "}
                {formatFileSize(
                  maxFileSizeBytes,
                )}{" "}
                per file
              </p>
            </div>
          </div>
        ) : null}

        {filteredAssets.length >
        0 ? (
          viewMode ===
          "grid" ? (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredAssets.map(
                (asset) => {
                  const selected =
                    selectedAssetIds.includes(
                      asset.id,
                    );
                  const duration =
                    formatDuration(
                      asset.durationMs,
                    );

                  return (
                    <article
                      key={
                        asset.id
                      }
                      role="button"
                      tabIndex={0}
                      aria-selected={
                        selected
                      }
                      onClick={(
                        event,
                      ) =>
                        handleAssetSelection(
                          asset,
                          event,
                        )
                      }
                      onDoubleClick={() =>
                        onInsertAsset?.(
                          asset,
                        )
                      }
                      onKeyDown={(
                        event,
                      ) => {
                        if (
                          event.key ===
                            "Enter" ||
                          event.key ===
                            " "
                        ) {
                          event.preventDefault();
                          handleAssetSelection(
                            asset,
                            event,
                          );
                        }
                      }}
                      className={`group overflow-hidden rounded-xl border outline-none transition ${
                        selected
                          ? "border-cyan-300 bg-cyan-400/10 ring-2 ring-cyan-400/20"
                          : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]"
                      }`}
                    >
                      <div className="relative aspect-video overflow-hidden bg-slate-900">
                        {canPreviewAsImage(
                          asset,
                        ) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              asset.thumbnailUrl ??
                              asset.url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : asset.type ===
                          "video" ? (
                          <video
                            src={
                              asset.url
                            }
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-2xl font-bold text-slate-600">
                            {assetGlyph(
                              asset.type,
                            )}
                          </div>
                        )}

                        {duration ? (
                          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] tabular-nums text-white">
                            {
                              duration
                            }
                          </span>
                        ) : null}

                        <button
                          type="button"
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation();
                            const favourite =
                              !asset.favourite;

                            setLocalAssets(
                              (
                                current,
                              ) =>
                                current.map(
                                  (
                                    item,
                                  ) =>
                                    item.id ===
                                    asset.id
                                      ? {
                                          ...item,
                                          favourite,
                                        }
                                      : item,
                                ),
                            );

                            onToggleFavourite?.(
                              asset.id,
                              favourite,
                            );
                          }}
                          className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-sm backdrop-blur transition ${
                            asset.favourite
                              ? "text-amber-300"
                              : "text-white/60 opacity-0 group-hover:opacity-100"
                          }`}
                          aria-label={
                            asset.favourite
                              ? "Remove from favourites"
                              : "Add to favourites"
                          }
                        >
                          ★
                        </button>
                      </div>

                      <div className="p-2.5">
                        {renameAssetId ===
                        asset.id ? (
                          <input
                            autoFocus
                            value={
                              renameValue
                            }
                            onChange={(
                              event,
                            ) =>
                              setRenameValue(
                                event
                                  .target
                                  .value,
                              )
                            }
                            onBlur={
                              commitRename
                            }
                            onKeyDown={(
                              event,
                            ) => {
                              if (
                                event.key ===
                                "Enter"
                              ) {
                                commitRename();
                              }

                              if (
                                event.key ===
                                "Escape"
                              ) {
                                setRenameAssetId(
                                  null,
                                );
                              }
                            }}
                            className="w-full rounded border border-cyan-400/50 bg-slate-950 px-2 py-1 text-xs text-white outline-none"
                          />
                        ) : (
                          <button
                            type="button"
                            onDoubleClick={(
                              event,
                            ) => {
                              event.stopPropagation();
                              beginRename(
                                asset,
                              );
                            }}
                            className="block w-full truncate text-left text-xs font-medium text-slate-200"
                            title={
                              asset.name
                            }
                          >
                            {
                              asset.name
                            }
                          </button>
                        )}

                        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-slate-600">
                          <span>
                            {
                              asset.type
                            }
                          </span>
                          <span>
                            {formatFileSize(
                              asset.sizeBytes,
                            )}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredAssets.map(
                (asset) => {
                  const selected =
                    selectedAssetIds.includes(
                      asset.id,
                    );

                  return (
                    <div
                      key={
                        asset.id
                      }
                      role="button"
                      tabIndex={0}
                      onClick={(
                        event,
                      ) =>
                        handleAssetSelection(
                          asset,
                          event,
                        )
                      }
                      onDoubleClick={() =>
                        onInsertAsset?.(
                          asset,
                        )
                      }
                      className={`grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 outline-none transition ${
                        selected
                          ? "bg-cyan-400/10"
                          : "hover:bg-white/[0.035]"
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-900 text-sm font-bold text-slate-500">
                        {canPreviewAsImage(
                          asset,
                        ) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              asset.thumbnailUrl ??
                              asset.url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          assetGlyph(
                            asset.type,
                          )
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {
                            asset.name
                          }
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                          {asset.type} ·{" "}
                          {formatFileSize(
                            asset.sizeBytes,
                          )}{" "}
                          ·{" "}
                          {formatDate(
                            asset.updatedAt ??
                              asset.createdAt,
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation();
                            beginRename(
                              asset,
                            );
                          }}
                          className="rounded-md px-2 py-1 text-[11px] text-slate-500 hover:bg-white/5 hover:text-slate-300"
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          disabled={
                            !onInsertAsset
                          }
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation();
                            onInsertAsset?.(
                              asset,
                            );
                          }}
                          className="rounded-md px-2 py-1 text-[11px] text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-40"
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )
        ) : (
          <div className="flex min-h-80 items-center justify-center px-6 py-14 text-center">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl text-slate-600">
                +
              </div>
              <p className="mt-4 text-sm font-medium text-slate-300">
                {localAssets.length ===
                0
                  ? "No assets yet"
                  : "No matching assets"}
              </p>
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
                {localAssets.length ===
                0
                  ? "Upload images, video, audio, SVG, JSON or font files to begin."
                  : "Try changing the search or filter options."}
              </p>

              {localAssets.length ===
              0 ? (
                <button
                  type="button"
                  onClick={() =>
                    inputRef.current?.click()
                  }
                  disabled={
                    disabled
                  }
                  className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-40"
                >
                  Choose files
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            {selectedAssetIds.length >
            0
              ? `${selectedAssetIds.length} selected`
              : `${filteredAssets.length} asset${
                  filteredAssets.length ===
                  1
                    ? ""
                    : "s"
                }`}
          </p>

          {activeAsset ? (
            <p className="mt-0.5 truncate text-[10px] text-slate-600">
              {activeAsset.width &&
              activeAsset.height
                ? `${activeAsset.width} × ${activeAsset.height} · `
                : ""}
              {formatFileSize(
                activeAsset.sizeBytes,
              )}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={
              disabled ||
              selectedAssetIds.length ===
                0 ||
              !onDeleteAssets
            }
            onClick={
              deleteSelectedAssets
            }
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>

          <button
            type="button"
            disabled={
              disabled ||
              selectedAssets.length !==
                1 ||
              !onInsertAsset
            }
            onClick={() => {
              if (activeAsset) {
                onInsertAsset?.(
                  activeAsset,
                );
              }
            }}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Insert asset
          </button>
        </div>
      </footer>
    </section>
  );
}