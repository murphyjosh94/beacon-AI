"use client";

import {
  Check,
  Copy,
  Download,
  FileText,
  ImageIcon,
  Info,
  PackageOpen,
  Palette,
  Pencil,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { StudioAsset } from "./AssetBrowser";

export type AssetPreviewProps = {
  asset: StudioAsset | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (asset: StudioAsset) => void | Promise<void>;
  onRename?: (asset: StudioAsset) => void | Promise<void>;
};

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

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatAssetType(type: StudioAsset["type"]): string {
  switch (type) {
    case "brand-kit":
      return "Brand kit";

    case "image":
      return "Image";

    case "video":
      return "Video";

    case "logo":
      return "Logo";

    default:
      return "File";
  }
}

function AssetTypeIcon({
  type,
  className = "h-8 w-8",
}: {
  type: StudioAsset["type"];
  className?: string;
}) {
  switch (type) {
    case "image":
      return <ImageIcon aria-hidden="true" className={className} />;

    case "video":
      return <Video aria-hidden="true" className={className} />;

    case "logo":
      return <Palette aria-hidden="true" className={className} />;

    case "brand-kit":
      return <PackageOpen aria-hidden="true" className={className} />;

    default:
      return <FileText aria-hidden="true" className={className} />;
  }
}

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 border-b border-white/5 py-2.5 last:border-b-0">
      <dt className="text-slate-400">{label}</dt>

      <dd
        className="min-w-0 break-words text-right font-medium text-slate-200"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

export default function AssetPreview({
  asset,
  open,
  onClose,
  onDelete,
  onRename,
}: AssetPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [actionPending, setActionPending] = useState<
    "delete" | "rename" | null
  >(null);

  const closePreview = useCallback(() => {
    if (actionPending) {
      return;
    }

    onClose();
  }, [actionPending, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePreview, open]);

  useEffect(() => {
    setCopied(false);
    setCopyError(null);
    setImageFailed(false);
    setActionPending(null);
  }, [asset?.id, open]);

  if (!open || !asset) {
    return null;
  }

  const activeAsset: StudioAsset = asset;

  const downloadUrl =
    activeAsset.downloadUrl ??
    `/api/studio/assets/${activeAsset.id}/download`;

  const imageUrl = activeAsset.thumbnailUrl ?? downloadUrl;

  async function handleCopyAssetId(): Promise<void> {
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(activeAsset.id);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
      setCopyError("Unable to copy the asset ID.");
    }
  }

  async function handleRename(): Promise<void> {
    if (!onRename || actionPending) {
      return;
    }

    setActionPending("rename");

    try {
      await onRename(activeAsset);
    } finally {
      setActionPending(null);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!onDelete || actionPending) {
      return;
    }

    const confirmed = window.confirm(
      `Delete “${activeAsset.name}”? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setActionPending("delete");

    try {
      await onDelete(activeAsset);
    } finally {
      setActionPending(null);
    }
  }

  const isImageAsset =
    activeAsset.type === "image" || activeAsset.type === "logo";

  const isVideoAsset = activeAsset.type === "video";

  return (
    <div
      aria-labelledby="asset-preview-title"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePreview();
        }
      }}
      role="dialog"
    >
      <div className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl shadow-black/50 sm:max-h-[calc(100vh-3rem)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-300">
                <AssetTypeIcon
                  className="h-5 w-5"
                  type={activeAsset.type}
                />
              </span>

              <div className="min-w-0">
                <h2
                  className="truncate text-xl font-semibold text-white sm:text-2xl"
                  id="asset-preview-title"
                  title={activeAsset.name}
                >
                  {activeAsset.name}
                </h2>

                <p className="mt-0.5 text-sm text-slate-400">
                  {formatAssetType(activeAsset.type)}
                </p>
              </div>
            </div>
          </div>

          <button
            aria-label="Close asset preview"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(actionPending)}
            onClick={closePreview}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_380px]">
            <main className="flex min-h-[360px] items-center justify-center bg-slate-900/80 p-5 sm:min-h-[520px] sm:p-8">
              {isImageAsset && imageUrl && !imageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={activeAsset.name}
                  className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-2xl shadow-black/30"
                  onError={() => setImageFailed(true)}
                  src={imageUrl}
                />
              ) : isVideoAsset ? (
                <video
                  className="max-h-[70vh] max-w-full rounded-xl bg-black shadow-2xl shadow-black/30"
                  controls
                  playsInline
                  preload="metadata"
                >
                  <source
                    src={downloadUrl}
                    type={activeAsset.mimeType || undefined}
                  />

                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="max-w-sm text-center">
                  <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-slate-300">
                    <AssetTypeIcon
                      className="h-10 w-10"
                      type={activeAsset.type}
                    />
                  </span>

                  <h3 className="mt-5 text-lg font-semibold text-white">
                    Preview unavailable
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    This file type cannot be previewed here. Download the asset
                    to open it on your device.
                  </p>
                </div>
              )}
            </main>

            <aside className="border-t border-white/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                  <Info
                    aria-hidden="true"
                    className="h-4 w-4 text-amber-300"
                  />

                  Metadata
                </h3>

                <dl className="mt-4 text-sm">
                  <MetadataRow
                    label="Type"
                    value={formatAssetType(activeAsset.type)}
                  />

                  <MetadataRow
                    label="Size"
                    value={formatBytes(activeAsset.sizeBytes)}
                  />

                  <MetadataRow
                    label="MIME"
                    value={activeAsset.mimeType || "Unknown"}
                  />

                  <MetadataRow
                    label="Extension"
                    value={activeAsset.extension || "Unknown"}
                  />

                  <MetadataRow
                    label="Project"
                    value={activeAsset.projectName ?? "—"}
                  />

                  <MetadataRow
                    label="Collection"
                    value={activeAsset.collection ?? "—"}
                  />

                  <MetadataRow
                    label="Created"
                    value={formatDate(activeAsset.createdAt)}
                  />
                </dl>
              </section>

              <section className="mt-7 space-y-3">
                <a
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                  download
                  href={downloadUrl}
                >
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download
                </a>

                {onRename ? (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={Boolean(actionPending)}
                    onClick={handleRename}
                    type="button"
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />

                    {actionPending === "rename"
                      ? "Opening rename…"
                      : "Rename asset"}
                  </button>
                ) : null}

                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={Boolean(actionPending)}
                  onClick={handleCopyAssetId}
                  type="button"
                >
                  {copied ? (
                    <Check
                      aria-hidden="true"
                      className="h-4 w-4 text-emerald-300"
                    />
                  ) : (
                    <Copy aria-hidden="true" className="h-4 w-4" />
                  )}

                  {copied ? "Asset ID copied" : "Copy asset ID"}
                </button>

                {copyError ? (
                  <p
                    className="text-center text-xs text-red-300"
                    role="alert"
                  >
                    {copyError}
                  </p>
                ) : null}

                {onDelete ? (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-3 font-medium text-red-300 transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={Boolean(actionPending)}
                    onClick={handleDelete}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />

                    {actionPending === "delete"
                      ? "Deleting asset…"
                      : "Delete asset"}
                  </button>
                ) : null}
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}