"use client";

import {
  ArrowLeft,
  FolderOpen,
  HardDrive,
  ImageIcon,
  Library,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import AssetBrowser, {
  type StudioAsset,
} from "../_components/AssetBrowser";
import AssetPreview from "../_components/AssetPreview";

type DeleteResponse = {
  success?: boolean;
  error?: string;
};

export default function StudioMediaPage() {
  const [selectedAssets, setSelectedAssets] = useState<StudioAsset[]>([]);
  const [previewAsset, setPreviewAsset] = useState<StudioAsset | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSizeBytes = useMemo(
    () =>
      selectedAssets.reduce(
        (total, asset) => total + asset.sizeBytes,
        0,
      ),
    [selectedAssets],
  );

  const imageCount = useMemo(
    () =>
      selectedAssets.filter(
        (asset) =>
          asset.type === "image" ||
          asset.type === "logo",
      ).length,
    [selectedAssets],
  );

  const videoCount = useMemo(
    () =>
      selectedAssets.filter(
        (asset) => asset.type === "video",
      ).length,
    [selectedAssets],
  );

  const refreshBrowser = useCallback(() => {
    setSelectedAssets([]);
    setPreviewAsset(null);
    setRefreshKey((current) => current + 1);
  }, []);

  async function deleteAsset(asset: StudioAsset) {
    const confirmed = window.confirm(
      `Delete "${asset.name}" permanently? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(asset.id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/studio/assets/${encodeURIComponent(asset.id)}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json()) as DeleteResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "The asset could not be deleted.",
        );
      }

      setMessage(`"${asset.name}" was deleted.`);
      refreshBrowser();
    } catch (deleteError) {
      console.error("[studio-media:delete]", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The asset could not be deleted.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteSelectedAssets() {
    if (selectedAssets.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedAssets.length} selected ${
        selectedAssets.length === 1 ? "asset" : "assets"
      } permanently? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId("bulk");
    setError(null);
    setMessage(null);

    try {
      const results = await Promise.allSettled(
        selectedAssets.map(async (asset) => {
          const response = await fetch(
            `/api/studio/assets/${encodeURIComponent(asset.id)}`,
            {
              method: "DELETE",
            },
          );

          const data = (await response.json()) as DeleteResponse;

          if (!response.ok) {
            throw new Error(
              data.error || `${asset.name} could not be deleted.`,
            );
          }

          return asset;
        }),
      );

      const failed = results.filter(
        (result) => result.status === "rejected",
      );

      if (failed.length > 0) {
        throw new Error(
          `${failed.length} ${
            failed.length === 1 ? "asset" : "assets"
          } could not be deleted.`,
        );
      }

      setMessage(
        `${selectedAssets.length} ${
          selectedAssets.length === 1 ? "asset was" : "assets were"
        } deleted.`,
      );

      refreshBrowser();
    } catch (deleteError) {
      console.error("[studio-media:bulk-delete]", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The selected assets could not be deleted.",
      );

      refreshBrowser();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studio
          </Link>

          <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                Beacon Studio
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Media Manager
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                Upload, organise, preview and reuse every creative asset across
                your Beacon Studio projects.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={refreshBrowser}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              <Link
                href="/studio/assets"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                <Library className="h-4 w-4" />
                Open Asset Library
              </Link>
            </div>
          </div>
        </header>

        {(message || error) && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              error
                ? "border-red-400/20 bg-red-400/10 text-red-100"
                : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FolderOpen}
            label="Selected assets"
            value={selectedAssets.length.toString()}
          />
          <StatCard
            icon={ImageIcon}
            label="Selected images"
            value={imageCount.toString()}
          />
          <StatCard
            icon={Video}
            label="Selected videos"
            value={videoCount.toString()}
          />
          <StatCard
            icon={HardDrive}
            label="Selected size"
            value={formatBytes(selectedSizeBytes)}
          />
        </section>

        {selectedAssets.length > 0 && (
          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                {selectedAssets.length}{" "}
                {selectedAssets.length === 1 ? "asset" : "assets"} selected
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Double-click an asset to preview it, or remove selected assets
                from your library.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void deleteSelectedAssets()}
              disabled={deletingId === "bulk"}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingId === "bulk" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete selected
            </button>
          </section>
        )}

        <AssetBrowser
          key={refreshKey}
          mode="multiple"
          allowUpload
          showCollections
          showViewToggle
          onSelectionChange={setSelectedAssets}
          onAssetDoubleClick={setPreviewAsset}
          onUploadComplete={(assets) => {
            setMessage(
              `${assets.length} ${
                assets.length === 1 ? "asset was" : "assets were"
              } uploaded.`,
            );
            setError(null);
          }}
        />

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <FeatureCard
            icon={Upload}
            title="Upload once"
            description="Store files centrally and reuse them in every Studio editor."
          />
          <FeatureCard
            icon={Library}
            title="Organise projects"
            description="Group media by collection, project and creative type."
          />
          <FeatureCard
            icon={Sparkles}
            title="Create faster"
            description="Choose existing assets without uploading the same files again."
          />
        </section>
      </div>

      <AssetPreview
        asset={previewAsset}
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        onDelete={(asset) => void deleteAsset(asset)}
      />

      {deletingId &&
      deletingId !== "bulk" ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-slate-900 px-6 py-5 text-center shadow-2xl">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-amber-300" />
            <p className="mt-3 text-sm text-slate-300">
              Deleting asset…
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Library;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Library;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <Icon className="h-5 w-5 text-amber-200" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
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

  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${
    units[index]
  }`;
}