"use client";

import {
  Check,
  ChevronDown,
  File,
  FileImage,
  FileText,
  Film,
  Folder,
  Grid2X2,
  ImageIcon,
  LayoutList,
  Loader2,
  PackageOpen,
  Palette,
  Presentation,
  Search,
  Sparkles,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
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

type StudioAssetsResponse = {
  assets?: StudioAsset[];
  collections?: string[];
  error?: string;
};

type AssetPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (assets: StudioAsset[]) => void;
  mode?: "single" | "multiple";
  acceptedTypes?: StudioAssetType[];
  initialSelectedIds?: string[];
  title?: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  collection?: string;
  maxSelections?: number;
};

type ViewMode = "grid" | "list";

const FILTERS: Array<{
  value: "all" | StudioAssetType;
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

function isStudioAsset(value: unknown): value is StudioAsset {
  if (!value || typeof value !== "object") {
    return false;
  }

  const asset = value as Partial<StudioAsset>;

  return (
    typeof asset.id === "string" &&
    typeof asset.name === "string" &&
    typeof asset.type === "string" &&
    typeof asset.mimeType === "string" &&
    typeof asset.extension === "string" &&
    typeof asset.sizeBytes === "number" &&
    typeof asset.createdAt === "string" &&
    typeof asset.updatedAt === "string"
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
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
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs)) {
    return "";
  }

  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function inferAssetType(file: globalThis.File): StudioAssetType {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (file.type.startsWith("image/")) {
    return extension === "svg" ? "logo" : "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (["ppt", "pptx", "key"].includes(extension)) {
    return "presentation";
  }

  if (
    file.type === "application/pdf" ||
    ["doc", "docx", "rtf", "txt"].includes(extension)
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

export default function AssetPicker({
  open,
  onClose,
  onSelect,
  mode = "single",
  acceptedTypes,
  initialSelectedIds = [],
  title = "Choose Studio assets",
  description = "Select existing assets or upload new files.",
  projectId,
  projectName,
  collection,
  maxSelections,
}: AssetPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [assets, setAssets] = useState<StudioAsset[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | StudioAssetType>("all");
  const [activeCollection, setActiveCollection] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedFilterOptions = useMemo(() => {
    if (!acceptedTypes || acceptedTypes.length === 0) {
      return FILTERS;
    }

    return FILTERS.filter(
      (item) => item.value === "all" || acceptedTypes.includes(item.value),
    );
  }, [acceptedTypes]);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/studio/assets", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as StudioAssetsResponse;

      if (!response.ok) {
        throw new Error(data.error || "The asset library could not be loaded.");
      }

      setAssets(
        Array.isArray(data.assets) ? data.assets.filter(isStudioAsset) : [],
      );
      setCollections(
        Array.isArray(data.collections)
          ? data.collections.filter((item): item is string => typeof item === "string")
          : [],
      );
    } catch (loadError) {
      console.error("[asset-picker:load]", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The asset library could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIds(new Set(initialSelectedIds));
    setQuery("");
    setFilter("all");
    setActiveCollection("all");
    setError(null);
    void loadAssets();
  }, [initialSelectedIds, loadAssets, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const filteredAssets = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesAcceptedType =
        !acceptedTypes ||
        acceptedTypes.length === 0 ||
        acceptedTypes.includes(asset.type);

      const matchesFilter = filter === "all" || asset.type === filter;
      const matchesCollection =
        activeCollection === "all" || asset.collection === activeCollection;

      const searchable = [
        asset.name,
        asset.extension,
        asset.projectName ?? "",
        asset.collection ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalisedQuery.length === 0 || searchable.includes(normalisedQuery);

      return (
        matchesAcceptedType &&
        matchesFilter &&
        matchesCollection &&
        matchesSearch
      );
    });
  }, [acceptedTypes, activeCollection, assets, filter, query]);

  const selectedAssets = useMemo(
    () => assets.filter((asset) => selectedIds.has(asset.id)),
    [assets, selectedIds],
  );

  function closePicker() {
    if (!uploading) {
      onClose();
    }
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
    }

    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey) &&
      selectedAssets.length > 0
    ) {
      event.preventDefault();
      confirmSelection();
    }
  }

  function toggleAsset(asset: StudioAsset) {
    setError(null);

    if (mode === "single") {
      setSelectedIds(new Set([asset.id]));
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(asset.id)) {
        next.delete(asset.id);
        return next;
      }

      if (
        typeof maxSelections === "number" &&
        maxSelections > 0 &&
        next.size >= maxSelections
      ) {
        setError(`You can select up to ${maxSelections} assets.`);
        return current;
      }

      next.add(asset.id);
      return next;
    });
  }

  function confirmSelection() {
    if (selectedAssets.length === 0) {
      setError("Choose at least one asset.");
      return;
    }

    onSelect(mode === "single" ? [selectedAssets[0]] : selectedAssets);
    onClose();
  }

  async function uploadFiles(files: globalThis.File[]) {
    if (files.length === 0 || uploading) {
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
          throw new Error(`${file.name} is not supported in this picker.`);
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

        const data = (await response.json()) as {
          asset?: StudioAsset;
          error?: string;
        };

        if (!response.ok || !data.asset || !isStudioAsset(data.asset)) {
          throw new Error(data.error || `${file.name} could not be uploaded.`);
        }

        uploadedAssets.push(data.asset);
      }

      setAssets((current) => [...uploadedAssets, ...current]);

      if (mode === "single" && uploadedAssets[0]) {
        setSelectedIds(new Set([uploadedAssets[0].id]));
      } else {
        setSelectedIds((current) => {
          const next = new Set(current);
          uploadedAssets.forEach((asset) => next.add(asset.id));
          return next;
        });
      }
    } catch (uploadError) {
      console.error("[asset-picker:upload]", uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "One or more files could not be uploaded.",
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    void uploadFiles(Array.from(event.target.files ?? []));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePicker();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-picker-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl outline-none"
      >
        <header className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-amber-200">
              <Sparkles className="h-4 w-4" />
              Beacon Studio
            </div>
            <h2
              id="asset-picker-title"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              {title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={closePicker}
            className="inline-flex h-10 w-10 items-center justify-center self-end rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white sm:self-auto"
            aria-label="Close asset picker"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-white/10 bg-white/[0.02] p-4 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Collections
            </p>

            <div className="mt-3 space-y-1">
              <button
                type="button"
                onClick={() => setActiveCollection("all")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  activeCollection === "all"
                    ? "bg-amber-300/10 text-amber-100"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <PackageOpen className="h-4 w-4" />
                All assets
              </button>

              {collections.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveCollection(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    activeCollection === item
                      ? "bg-amber-300/10 text-amber-100"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Folder className="h-4 w-4" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>

            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget === event.target) {
                  setDragging(false);
                }
              }}
              onDrop={handleDrop}
              className={`mt-6 rounded-2xl border border-dashed p-4 text-center transition ${
                dragging
                  ? "border-amber-300 bg-amber-300/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {uploading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-300" />
              ) : (
                <Upload className="mx-auto h-6 w-6 text-slate-400" />
              )}

              <p className="mt-3 text-sm font-semibold">
                {uploading ? "Uploading…" : "Upload files"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Drop files here or choose them from your device.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Choose files
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple={mode === "multiple"}
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="border-b border-white/10 p-4 sm:p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search assets, projects or collections..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={filter}
                      onChange={(event) =>
                        setFilter(event.target.value as "all" | StudioAssetType)
                      }
                      className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2.5 pl-3 pr-9 text-sm outline-none transition focus:border-amber-300/40"
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
                    onClick={() => setViewMode("grid")}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                      viewMode === "grid"
                        ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                      viewMode === "list"
                        ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                    aria-label="List view"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {error ? (
                <div className="mt-3 flex items-start justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
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

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {loading ? (
                <div className="flex min-h-[360px] items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-300" />
                    <p className="mt-3 text-sm text-slate-400">
                      Loading Studio assets…
                    </p>
                  </div>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                  <div className="max-w-sm">
                    <PackageOpen className="mx-auto h-10 w-10 text-slate-600" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No matching assets
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Upload a new file or clear the current filters.
                    </p>
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredAssets.map((asset) => (
                    <AssetGridItem
                      key={asset.id}
                      asset={asset}
                      selected={selectedIds.has(asset.id)}
                      onSelect={() => toggleAsset(asset)}
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
                        selected={selectedIds.has(asset.id)}
                        onSelect={() => toggleAsset(asset)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-slate-400">
            {selectedAssets.length === 0
              ? "No assets selected"
              : `${selectedAssets.length} ${
                  selectedAssets.length === 1 ? "asset" : "assets"
                } selected`}
            {mode === "multiple" && maxSelections
              ? ` · Maximum ${maxSelections}`
              : ""}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closePicker}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmSelection}
              disabled={selectedAssets.length === 0}
              className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use selected
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function AssetGridItem({
  asset,
  selected,
  onSelect,
}: {
  asset: StudioAsset;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = assetIcon(asset.type);

  return (
    <button
      type="button"
      onClick={onSelect}
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
            alt=""
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

        {asset.durationMs ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
            {formatDuration(asset.durationMs)}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="truncate text-sm font-semibold">{asset.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {asset.extension} · {formatBytes(asset.sizeBytes)}
        </p>
        <p className="mt-3 truncate text-xs text-slate-500">
          {asset.collection || asset.projectName || formatDate(asset.createdAt)}
        </p>
      </div>
    </button>
  );
}

function AssetListItem({
  asset,
  selected,
  onSelect,
}: {
  asset: StudioAsset;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = assetIcon(asset.type);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid w-full grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-4 p-4 text-left transition ${
        selected ? "bg-amber-300/5" : "bg-white/[0.02] hover:bg-white/[0.04]"
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
          {asset.extension} · {formatBytes(asset.sizeBytes)} ·{" "}
          {asset.projectName || asset.collection || formatDate(asset.createdAt)}
        </span>
      </span>
    </button>
  );
}