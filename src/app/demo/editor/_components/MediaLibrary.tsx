"use client";

import {
  FileAudio,
  FileImage,
  FileVideo,
  ImagePlus,
  Loader2,
  Music2,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from "react";

export type MotionAssetType = "image" | "video" | "audio" | "logo";

export type MotionAsset = {
  id: string;
  name: string;
  type: MotionAssetType;
  url: string;
  sizeBytes?: number;
  mimeType?: string;
  createdAt?: string;
};

type AssetFilter = "all" | MotionAssetType;

type MediaLibraryProps = {
  assets: MotionAsset[];
  selectedAssetId?: string | null;
  uploadEndpoint?: string;
  maxFileSizeMb?: number;
  onAssetsChange: (assets: MotionAsset[]) => void;
  onSelectAsset?: (asset: MotionAsset) => void;
  onClose?: () => void;
};

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
];

const FILTERS: Array<{ id: AssetFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "logo", label: "Logos" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
];

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${
    units[unitIndex]
  }`;
}

function inferAssetType(file: File): MotionAssetType {
  const lowerName = file.name.toLowerCase();

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  if (
    lowerName.includes("logo") ||
    lowerName.endsWith(".svg") ||
    lowerName.includes("brandmark")
  ) {
    return "logo";
  }

  return "image";
}

function getAssetIcon(type: MotionAssetType) {
  if (type === "video") {
    return FileVideo;
  }

  if (type === "audio") {
    return FileAudio;
  }

  return FileImage;
}

function AssetPreview({ asset }: { asset: MotionAsset }) {
  if (asset.type === "image" || asset.type === "logo") {
    return (
      <img
        alt={asset.name}
        className="h-full w-full object-cover"
        loading="lazy"
        src={asset.url}
      />
    );
  }

  if (asset.type === "video") {
    return (
      <video
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
        src={asset.url}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.2),transparent_65%)]">
      <Music2 className="h-9 w-9 text-cyan-200" />
    </div>
  );
}

export default function MediaLibrary({
  assets,
  selectedAssetId,
  uploadEndpoint = "/api/motion/assets",
  maxFileSizeMb = 100,
  onAssetsChange,
  onSelectAsset,
  onClose,
}: MediaLibraryProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesFilter = filter === "all" || asset.type === filter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        asset.name.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [assets, filter, search]);

  const validateFiles = (files: File[]) => {
    const maxBytes = maxFileSizeMb * 1024 * 1024;

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error(
          `${file.name} is not supported. Upload PNG, JPG, WEBP, SVG, MP4, WEBM, MP3, WAV, OGG or M4A files.`,
        );
      }

      if (file.size > maxBytes) {
        throw new Error(
          `${file.name} is larger than the ${maxFileSizeMb}MB upload limit.`,
        );
      }
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setError(null);

    try {
      validateFiles(files);
      setIsUploading(true);
      setUploadProgress(8);

      const uploadedAssets: MotionAsset[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const formData = new FormData();

        formData.append("file", file);
        formData.append("type", inferAssetType(file));

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;

          throw new Error(
            payload?.error ?? `Upload failed for ${file.name}.`,
          );
        }

        const payload = (await response.json()) as {
          asset?: MotionAsset;
          url?: string;
          id?: string;
        };

        const asset: MotionAsset = payload.asset ?? {
          id: payload.id ?? crypto.randomUUID(),
          name: file.name,
          type: inferAssetType(file),
          url: payload.url ?? "",
          sizeBytes: file.size,
          mimeType: file.type,
          createdAt: new Date().toISOString(),
        };

        if (!asset.url) {
          throw new Error(`Upload completed but no asset URL was returned for ${file.name}.`);
        }

        uploadedAssets.push(asset);

        setUploadProgress(
          Math.round(((index + 1) / files.length) * 100),
        );
      }

      onAssetsChange([...uploadedAssets, ...assets]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The selected files could not be uploaded.",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void uploadFiles(Array.from(event.target.files ?? []));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const removeAsset = async (asset: MotionAsset) => {
    setError(null);

    try {
      const response = await fetch(
        `${uploadEndpoint}/${encodeURIComponent(asset.id)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok && response.status !== 404) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(payload?.error ?? `Could not delete ${asset.name}.`);
      }

      onAssetsChange(assets.filter((item) => item.id !== asset.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The asset could not be deleted.",
      );
    }
  };

  const handleAssetKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    asset: MotionAsset,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectAsset?.(asset);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/92 text-white shadow-[0_25px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
          <ImagePlus className="h-5 w-5 text-cyan-200" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-black">Media library</h2>
          <p className="truncate text-xs font-semibold text-slate-500">
            Upload and reuse project assets
          </p>
        </div>

        {onClose && (
          <button
            aria-label="Close media library"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="border-b border-white/10 p-4 sm:p-5">
        <div
          className={`relative flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition ${
            isDragging
              ? "border-cyan-300/45 bg-cyan-300/10"
              : "border-white/15 bg-white/[0.025] hover:border-white/25"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();

            if (event.currentTarget === event.target) {
              setIsDragging(false);
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
              <p className="mt-3 text-sm font-black">Uploading assets</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {uploadProgress}% complete
              </p>
              <div className="mt-4 h-1.5 w-full max-w-52 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-[width]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <UploadCloud className="h-7 w-7 text-cyan-200" />
              <p className="mt-3 text-sm font-black">Drop media here</p>
              <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-slate-500">
                Images, logos, video and audio up to {maxFileSizeMb}MB per file.
              </p>

              <button
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition hover:scale-[1.02]"
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Choose files
              </button>
            </>
          )}

          <input
            ref={inputRef}
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            disabled={isUploading}
            multiple
            onChange={handleInputChange}
            type="file"
          />
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-300/15 bg-red-400/[0.07] px-3 py-2.5 text-xs font-semibold leading-5 text-red-200">
            {error}
          </div>
        )}
      </div>

      <div className="border-b border-white/10 p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.035] py-3 pl-10 pr-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/25"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assets"
            value={search}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              className={`rounded-full px-3 py-2 text-[0.65rem] font-black transition ${
                filter === item.id
                  ? "bg-blue-500 text-white"
                  : "border border-white/10 bg-white/[0.035] text-slate-400 hover:text-white"
              }`}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
            {filteredAssets.map((asset) => {
              const Icon = getAssetIcon(asset.type);
              const selected = asset.id === selectedAssetId;

              return (
                <article
                  key={asset.id}
                  className={`group overflow-hidden rounded-2xl border transition ${
                    selected
                      ? "border-blue-300/40 bg-blue-500/10"
                      : "border-white/10 bg-white/[0.025] hover:border-white/20"
                  }`}
                >
                  <button
                    className="block w-full text-left"
                    onClick={() => onSelectAsset?.(asset)}
                    onKeyDown={(event) => handleAssetKeyDown(event, asset)}
                    type="button"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-900">
                      <AssetPreview asset={asset} />

                      <div className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/80 px-2 py-1 text-[0.52rem] font-black uppercase tracking-[0.08em] text-slate-200 backdrop-blur-xl">
                        <Icon className="h-3 w-3" />
                        {asset.type}
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="truncate text-xs font-black text-white">
                        {asset.name}
                      </p>
                      <p className="mt-1 text-[0.58rem] font-bold text-slate-500">
                        {formatBytes(asset.sizeBytes)}
                      </p>
                    </div>
                  </button>

                  <div className="border-t border-white/10 p-2">
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-[0.6rem] font-black text-slate-500 transition hover:bg-red-400/10 hover:text-red-200"
                      onClick={() => void removeAsset(asset)}
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
            <FileImage className="h-8 w-8 text-slate-700" />
            <p className="mt-3 text-sm font-black text-slate-300">
              No matching assets
            </p>
            <p className="mt-1 max-w-xs text-xs font-semibold leading-5 text-slate-600">
              Upload a file or adjust the current search and filter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}