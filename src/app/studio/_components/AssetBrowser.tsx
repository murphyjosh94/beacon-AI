"use client";

import {
  Check,
  ChevronDown,
  File,
  FileImage,
  FileText,
  Grid2X2,
  ImageIcon,
  LayoutList,
  Loader2,
  PackageOpen,
  Palette,
  Presentation,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

export type StudioAssetType =
  | "image"
  | "video"
  | "logo"
  | "document"
  | "presentation"
  | "brand-kit"
  | "website"
  | "social"
  | "campaign"
  | "other";

export type StudioAsset = {
  id: string;
  name: string;
  type: StudioAssetType;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  thumbnailUrl?: string | null;
  downloadUrl?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  collection?: string | null;
  createdAt: string;
  updatedAt: string;
  storagePath?: string;
};

export type AssetBrowserProps = {
  mode?: "single" | "multiple";
  acceptedTypes?: StudioAssetType[];
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  maxSelections?: number;
  projectId?: string;
  projectName?: string;
  collection?: string;
  allowUpload?: boolean;
  showCollections?: boolean;
  showViewToggle?: boolean;
  compact?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onSelectionChange?: (assets: StudioAsset[]) => void;
  onAssetDoubleClick?: (asset: StudioAsset) => void;
  onUploadComplete?: (assets: StudioAsset[]) => void;
};

type StudioAssetsResponse = {
  assets?: unknown[];
  collections?: unknown[];
  error?: string;
};

type UploadAssetResponse = {
  asset?: unknown;
  error?: string;
};

type ViewMode = "grid" | "list";
type AssetFilter = "all" | StudioAssetType;

const FILTERS: ReadonlyArray<{
  value: AssetFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "logo", label: "Logos" },
  { value: "document", label: "Documents" },
  { value: "presentation", label: "Presentations" },
  { value: "brand-kit", label: "Brand kits" },
  { value: "website", label: "Websites" },
  { value: "social", label: "Social" },
  { value: "campaign", label: "Campaigns" },
  { value: "other", label: "Other" },
];

function isStudioAssetType(value: unknown): value is StudioAssetType {
  return (
    value === "image" ||
    value === "video" ||
    value === "logo" ||
    value === "document" ||
    value === "presentation" ||
    value === "brand-kit" ||
    value === "website" ||
    value === "social" ||
    value === "campaign" ||
    value === "other"
  );
}

function isStudioAsset(value: unknown): value is StudioAsset {
  if (!value || typeof value !== "object") {
    return false;
  }

  const asset = value as Partial<StudioAsset>;

  return (
    typeof asset.id === "string" &&
    asset.id.length > 0 &&
    typeof asset.name === "string" &&
    isStudioAssetType(asset.type) &&
    typeof asset.mimeType === "string" &&
    typeof asset.extension === "string" &&
    typeof asset.sizeBytes === "number" &&
    Number.isFinite(asset.sizeBytes) &&
    typeof asset.createdAt === "string" &&
    typeof asset.updatedAt === "string"
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDuration(durationMs?: number | null): string {
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    durationMs < 0
  ) {
    return "";
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function inferAssetType(file: globalThis.File): StudioAssetType {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (file.type.startsWith("image/")) {
    return extension === "svg" ? "logo" : "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (["ppt", "pptx", "key", "odp"].includes(extension)) {
    return "presentation";
  }

  if (
    file.type === "application/pdf" ||
    file.type.startsWith("text/") ||
    ["doc", "docx", "rtf", "txt", "odt"].includes(extension)
  ) {
    return "document";
  }

  return "other";
}

function assetIcon(type: StudioAssetType) {
  switch (type) {
    case "image":
      return ImageIcon;

    case "video":
      return Video;

    case "logo":
      return Palette;

    case "document":
      return FileText;

    case "presentation":
      return Presentation;

    case "brand-kit":
      return PackageOpen;

    case "website":
      return Sparkles;

    case "social":
      return FileImage;

    case "campaign":
      return Sparkles;

    default:
      return File;
  }
}

export default function AssetBrowser({
  mode = "single",
  acceptedTypes,
  selectedIds,
  defaultSelectedIds,
  maxSelections,
  projectId,
  projectName,
  collection,
  allowUpload = true,
  showCollections = true,
  showViewToggle = true,
  compact = false,
  className = "",
  emptyTitle = "No matching assets",
  emptyDescription = "Upload a new file or clear the current filters.",
  onSelectionChange,
  onAssetDoubleClick,
  onUploadComplete,
}: AssetBrowserProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialSelectionRef = useRef<Set<string>>(
    new Set(defaultSelectedIds ?? []),
  );

  const [assets, setAssets] = useState<StudioAsset[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectionRef.current),
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [activeCollection, setActiveCollection] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controlledSelection = selectedIds !== undefined;

  const effectiveSelectedIds = useMemo(() => {
    if (controlledSelection) {
      return new Set(selectedIds);
    }

    return internalSelectedIds;
  }, [controlledSelection, internalSelectedIds, selectedIds]);

  const allowedFilterOptions = useMemo(() => {
    if (!acceptedTypes || acceptedTypes.length === 0) {
      return FILTERS;
    }

    return FILTERS.filter(
      (item) =>
        item.value === "all" ||
        acceptedTypes.includes(item.value as StudioAssetType),
    );
  }, [acceptedTypes]);

  const loadAssets = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/studio/assets", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as StudioAssetsResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "The Studio asset library could not be loaded.",
        );
      }

      const validAssets = Array.isArray(data.assets)
        ? data.assets.filter(isStudioAsset)
        : [];

      const validCollections = Array.isArray(data.collections)
        ? data.collections
            .filter(
              (item): item is string =>
                typeof item === "string" && item.trim().length > 0,
            )
            .map((item) => item.trim())
        : [];

      setAssets(validAssets);
      setCollections(Array.from(new Set(validCollections)).sort());
    } catch (loadError) {
      console.error("[asset-browser:load]", loadError);

      setError(
        getErrorMessage(
          loadError,
          "The Studio asset library could not be loaded.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useState(() => {
    void loadAssets();
    return undefined;
  });

  const filteredAssets = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesAcceptedType =
        !acceptedTypes ||
        acceptedTypes.length === 0 ||
        acceptedTypes.includes(asset.type);

      const matchesFilter = filter === "all" || asset.type === filter;

      const matchesCollection =
        activeCollection === "all" ||
        asset.collection === activeCollection;

      const searchableText = [
        asset.name,
        asset.extension,
        asset.mimeType,
        asset.projectName ?? "",
        asset.collection ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalisedQuery.length === 0 ||
        searchableText.includes(normalisedQuery);

      return (
        matchesAcceptedType &&
        matchesFilter &&
        matchesCollection &&
        matchesSearch
      );
    });
  }, [acceptedTypes, activeCollection, assets, filter, query]);

  const selectedAssets = useMemo(
    () =>
      assets.filter((asset) => effectiveSelectedIds.has(asset.id)),
    [assets, effectiveSelectedIds],
  );

  function commitSelection(nextIds: Set<string>): void {
    if (!controlledSelection) {
      setInternalSelectedIds(new Set(nextIds));
    }

    const nextAssets = assets.filter((asset) => nextIds.has(asset.id));
    onSelectionChange?.(nextAssets);
  }

  function toggleAsset(asset: StudioAsset): void {
    setError(null);

    if (mode === "single") {
      const alreadySelected =
        effectiveSelectedIds.size === 1 &&
        effectiveSelectedIds.has(asset.id);

      commitSelection(alreadySelected ? new Set() : new Set([asset.id]));
      return;
    }

    const nextIds = new Set(effectiveSelectedIds);

    if (nextIds.has(asset.id)) {
      nextIds.delete(asset.id);
      commitSelection(nextIds);
      return;
    }

    if (
      typeof maxSelections === "number" &&
      maxSelections > 0 &&
      nextIds.size >= maxSelections
    ) {
      setError(`You can select up to ${maxSelections} assets.`);
      return;
    }

    nextIds.add(asset.id);
    commitSelection(nextIds);
  }

  async function uploadFiles(files: globalThis.File[]): Promise<void> {
    if (!allowUpload || files.length === 0 || uploading) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedAssets: StudioAsset[] = [];

      for (const file of files) {
        const inferredType = inferAssetType(file);

        if (
          acceptedTypes &&
          acceptedTypes.length > 0 &&
          !acceptedTypes.includes(inferredType)
        ) {
          throw new Error(`${file.name} is not supported here.`);
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", inferredType);

        if (projectId) {
          formData.append("projectId", projectId);
        }

        if (projectName) {
          formData.append("projectName", projectName);
        }

        if (collection) {
          formData.append("collection", collection);
        }

        const response = await fetch("/api/studio/assets", {
          method: "POST",
          body: formData,
        });

        const data = (await response.json()) as UploadAssetResponse;

        if (!response.ok) {
          throw new Error(
            data.error || `${file.name} could not be uploaded.`,
          );
        }

        if (!isStudioAsset(data.asset)) {
          throw new Error(
            `The server returned an invalid response for ${file.name}.`,
          );
        }

        uploadedAssets.push(data.asset);
      }

      if (uploadedAssets.length === 0) {
        return;
      }

      setAssets((current) => {
        const uploadedIds = new Set(uploadedAssets.map((asset) => asset.id));

        return [
          ...uploadedAssets,
          ...current.filter((asset) => !uploadedIds.has(asset.id)),
        ];
      });

      let nextIds: Set<string>;

      if (mode === "single") {
        nextIds = new Set([uploadedAssets[0].id]);
      } else {
        nextIds = new Set(effectiveSelectedIds);

        for (const asset of uploadedAssets) {
          if (
            typeof maxSelections === "number" &&
            maxSelections > 0 &&
            nextIds.size >= maxSelections
          ) {
            break;
          }

          nextIds.add(asset.id);
        }
      }

      if (!controlledSelection) {
        setInternalSelectedIds(new Set(nextIds));
      }

      const existingSelectedAssets = assets.filter((asset) =>
        nextIds.has(asset.id),
      );

      const newlySelectedAssets = uploadedAssets.filter((asset) =>
        nextIds.has(asset.id),
      );

      const combinedSelection = [
        ...newlySelectedAssets,
        ...existingSelectedAssets.filter(
          (asset) =>
            !newlySelectedAssets.some(
              (uploadedAsset) => uploadedAsset.id === asset.id,
            ),
        ),
      ];

      onSelectionChange?.(combinedSelection);
      onUploadComplete?.(uploadedAssets);
    } catch (uploadError) {
      console.error("[asset-browser:upload]", uploadError);

      setError(
        getErrorMessage(
          uploadError,
          "One or more files could not be uploaded.",
        ),
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileInput(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    void uploadFiles(Array.from(event.target.files ?? []));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);

    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white ${className}`}
    >
      <div className="border-b border-white/10 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets, projects or collections..."
              aria-label="Search Studio assets"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={filter}
                onChange={(event) => {
                  const nextValue = event.target.value;

                  if (
                    nextValue === "all" ||
                    isStudioAssetType(nextValue)
                  ) {
                    setFilter(nextValue);
                  }
                }}
                aria-label="Filter assets by type"
                className="appearance-none rounded-xl border border-white/10 bg-slate-900 py-2.5 pl-3 pr-9 text-sm text-white outline-none transition focus:border-amber-300/40"
              >
                {allowedFilterOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>

            <button
              type="button"
              onClick={() => void loadAssets()}
              disabled={loading || uploading}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Refresh assets"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            {showViewToggle ? (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    viewMode === "grid"
                      ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-label="Grid view"
                >
                  <Grid2X2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    viewMode === "list"
                      ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-label="List view"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </>
            ) : null}

            {allowUpload ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}

                  {uploading ? "Uploading…" : "Upload"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={mode === "multiple"}
                  className="hidden"
                  onChange={handleFileInput}
                />
              </>
            ) : null}
          </div>
        </div>

        {showCollections && collections.length > 0 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCollection("all")}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activeCollection === "all"
                  ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              All collections
            </button>

            {collections.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveCollection(item)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  activeCollection === item
                    ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-200 transition hover:text-white"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        onDragEnter={(event) => {
          if (!allowUpload) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (!allowUpload) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
        }}
        onDragLeave={(event) => {
          if (!allowUpload) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          const relatedTarget = event.relatedTarget;

          if (
            !relatedTarget ||
            !(relatedTarget instanceof Node) ||
            !event.currentTarget.contains(relatedTarget)
          ) {
            setDragging(false);
          }
        }}
        onDrop={allowUpload ? handleDrop : undefined}
        className={`relative ${compact ? "p-3" : "p-4 sm:p-5"} ${
          dragging ? "bg-amber-300/5" : ""
        }`}
      >
        {dragging ? (
          <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-slate-950/90">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-amber-300" />
              <p className="mt-3 text-sm font-semibold">
                Drop files to upload
              </p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-300" />
              <p className="mt-3 text-sm text-slate-400">
                Loading Studio assets…
              </p>
            </div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <div className="max-w-sm">
              <PackageOpen className="mx-auto h-10 w-10 text-slate-600" />

              <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {emptyDescription}
              </p>

              {allowUpload ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  Upload asset
                </button>
              ) : null}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div
            className={`grid gap-4 ${
              compact
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            }`}
          >
            {filteredAssets.map((asset) => (
              <AssetGridItem
                key={asset.id}
                asset={asset}
                selected={effectiveSelectedIds.has(asset.id)}
                onSelect={() => toggleAsset(asset)}
                onDoubleClick={() => onAssetDoubleClick?.(asset)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="divide-y divide-white/10">
              {filteredAssets.map((asset) => (
                <AssetListItem
                  key={asset.id}
                  asset={asset}
                  selected={effectiveSelectedIds.has(asset.id)}
                  onSelect={() => toggleAsset(asset)}
                  onDoubleClick={() => onAssetDoubleClick?.(asset)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-slate-400 sm:px-5">
        <span>
          {filteredAssets.length}{" "}
          {filteredAssets.length === 1 ? "asset" : "assets"}
        </span>

        <span>
          {selectedAssets.length === 0
            ? "No assets selected"
            : `${selectedAssets.length} selected`}

          {mode === "multiple" &&
          typeof maxSelections === "number" &&
          maxSelections > 0
            ? ` · Maximum ${maxSelections}`
            : ""}
        </span>
      </footer>
    </section>
  );
}

function AssetGridItem({
  asset,
  selected,
  onSelect,
  onDoubleClick,
}: {
  asset: StudioAsset;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}) {
  const Icon = assetIcon(asset.type);
  const duration = formatDuration(asset.durationMs);

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      aria-pressed={selected}
      className={`group overflow-hidden rounded-2xl border text-left transition ${
        selected
          ? "border-amber-300/60 bg-amber-300/5 ring-2 ring-amber-300/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
        {asset.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.thumbnailUrl}
            alt={asset.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08),transparent_58%)]">
            <Icon className="h-12 w-12 text-amber-200/80" />
          </div>
        )}

        <span
          className={`absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-md border backdrop-blur ${
            selected
              ? "border-amber-300 bg-amber-300 text-slate-950"
              : "border-white/20 bg-black/30 text-transparent"
          }`}
        >
          <Check className="h-4 w-4" />
        </span>

        {duration ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
            {duration}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="truncate text-sm font-semibold">{asset.name}</p>

        <p className="mt-1 text-xs text-slate-500">
          {asset.extension || "file"} · {formatBytes(asset.sizeBytes)}
        </p>

        <p className="mt-3 truncate text-xs text-slate-500">
          {asset.collection ||
            asset.projectName ||
            formatDate(asset.createdAt)}
        </p>
      </div>
    </button>
  );
}

function AssetListItem({
  asset,
  selected,
  onSelect,
  onDoubleClick,
}: {
  asset: StudioAsset;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}) {
  const Icon = assetIcon(asset.type);

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      aria-pressed={selected}
      className={`grid w-full grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-4 p-4 text-left transition ${
        selected
          ? "bg-amber-300/5"
          : "bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border ${
          selected
            ? "border-amber-300 bg-amber-300 text-slate-950"
            : "border-white/20 text-transparent"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>

      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
        <Icon className="h-5 w-5 text-amber-200" />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">
          {asset.name}
        </span>

        <span className="mt-1 block truncate text-xs text-slate-500">
          {asset.extension || "file"} · {formatBytes(asset.sizeBytes)} ·{" "}
          {asset.projectName ||
            asset.collection ||
            formatDate(asset.createdAt)}
        </span>
      </span>
    </button>
  );
}