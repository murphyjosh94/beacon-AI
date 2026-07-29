"use client";

import {
  AlertTriangle,
  Check,
  FolderPlus,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AssetBrowser, {
  type StudioAsset,
  type StudioAssetType,
} from "./AssetBrowser";
import AssetPicker from "./AssetPicker";
import AssetPreview from "./AssetPreview";

export type AssetManagerProps = {
  projectId?: string;
  projectName?: string;
  collection?: string;
  acceptedTypes?: StudioAssetType[];
  className?: string;
  title?: string;
  description?: string;
  allowUpload?: boolean;
  allowDelete?: boolean;
  allowRename?: boolean;
  allowCollections?: boolean;
  compact?: boolean;
  onAssetSelected?: (asset: StudioAsset) => void;
  onAssetsChanged?: () => void;
};

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

type RenameFormState = {
  open: boolean;
  asset: StudioAsset | null;
  name: string;
  collection: string;
};

type DeleteState = {
  open: boolean;
  asset: StudioAsset | null;
};

type ApiAssetResponse = {
  asset?: StudioAsset;
  error?: string;
};

type ApiErrorResponse = {
  error?: string;
};

const EMPTY_RENAME_FORM: RenameFormState = {
  open: false,
  asset: null,
  name: "",
  collection: "",
};

const EMPTY_DELETE_STATE: DeleteState = {
  open: false,
  asset: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

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

function normaliseName(value: string): string {
  return value
    .trim()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .slice(0, 160);
}

function normaliseCollection(value: string): string {
  return value
    .trim()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .slice(0, 80);
}

export default function AssetManager({
  projectId,
  projectName,
  collection,
  acceptedTypes,
  className = "",
  title = "Asset Manager",
  description = "Upload, organise, preview and reuse files across Beacon Studio.",
  allowUpload = true,
  allowDelete = true,
  allowRename = true,
  allowCollections = true,
  compact = false,
  onAssetSelected,
  onAssetsChanged,
}: AssetManagerProps) {
  const noticeTimeoutRef = useRef<number | null>(null);

  const [browserKey, setBrowserKey] = useState(0);
  const [selectedAssets, setSelectedAssets] = useState<StudioAsset[]>([]);
  const [previewAsset, setPreviewAsset] = useState<StudioAsset | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [renameForm, setRenameForm] =
    useState<RenameFormState>(EMPTY_RENAME_FORM);

  const [deleteState, setDeleteState] =
    useState<DeleteState>(EMPTY_DELETE_STATE);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current !== null) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  const selectedAsset = selectedAssets[0] ?? null;

  const selectedSummary = useMemo(() => {
    if (selectedAssets.length === 0) {
      return "No asset selected";
    }

    if (selectedAssets.length === 1) {
      return selectedAssets[0]?.name ?? "1 asset selected";
    }

    return `${selectedAssets.length} assets selected`;
  }, [selectedAssets]);

  const showNotice = useCallback(
    (type: "success" | "error", message: string) => {
      setNotice({ type, message });

      if (noticeTimeoutRef.current !== null) {
        window.clearTimeout(noticeTimeoutRef.current);
      }

      noticeTimeoutRef.current = window.setTimeout(() => {
        setNotice(null);
        noticeTimeoutRef.current = null;
      }, 5000);
    },
    [],
  );

  const refreshAssets = useCallback(
    (clearSelection = true) => {
      setBrowserKey((current) => current + 1);

      if (clearSelection) {
        setSelectedAssets([]);
        setPreviewAsset(null);
      }

      onAssetsChanged?.();
    },
    [onAssetsChanged],
  );

  function handleSelectionChange(assets: StudioAsset[]): void {
    setSelectedAssets(assets);

    const firstAsset = assets[0];

    if (firstAsset) {
      onAssetSelected?.(firstAsset);
    }
  }

  function openPreview(asset: StudioAsset): void {
    setPreviewAsset(asset);
  }

  function openRename(asset: StudioAsset): void {
    if (!allowRename || busy) {
      return;
    }

    setRenameForm({
      open: true,
      asset,
      name: asset.name,
      collection: asset.collection ?? "",
    });
  }

  function closeRename(): void {
    if (busy) {
      return;
    }

    setRenameForm(EMPTY_RENAME_FORM);
  }

  async function submitRename(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const currentAsset = renameForm.asset;

    if (!currentAsset || busy) {
      return;
    }

    const name = normaliseName(renameForm.name);
    const nextCollection = normaliseCollection(renameForm.collection);

    if (!name) {
      showNotice("error", "Enter a valid asset name.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `/api/studio/assets/${encodeURIComponent(currentAsset.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            collection: allowCollections
              ? nextCollection || null
              : currentAsset.collection ?? null,
          }),
        },
      );

      const data = (await response.json()) as ApiAssetResponse;

      if (!response.ok) {
        throw new Error(data.error || "The asset could not be updated.");
      }

      if (!data.asset || !isStudioAsset(data.asset)) {
        throw new Error("The server returned an invalid asset response.");
      }

      const updatedAsset: StudioAsset = data.asset;

      setSelectedAssets((current) =>
        current.map((asset) =>
          asset.id === updatedAsset.id ? updatedAsset : asset,
        ),
      );

      setPreviewAsset((current) =>
        current?.id === updatedAsset.id ? updatedAsset : current,
      );

      setRenameForm(EMPTY_RENAME_FORM);
      showNotice("success", "Asset updated successfully.");
      refreshAssets(false);
      onAssetSelected?.(updatedAsset);
    } catch (error) {
      console.error("[asset-manager:update]", error);

      showNotice(
        "error",
        getErrorMessage(error, "The asset could not be updated."),
      );
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(asset: StudioAsset): void {
    if (!allowDelete || busy) {
      return;
    }

    setDeleteState({
      open: true,
      asset,
    });
  }

  function closeDelete(): void {
    if (busy) {
      return;
    }

    setDeleteState(EMPTY_DELETE_STATE);
  }

  async function confirmDelete(): Promise<void> {
    const currentAsset = deleteState.asset;

    if (!currentAsset || busy) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `/api/studio/assets/${encodeURIComponent(currentAsset.id)}`,
        {
          method: "DELETE",
        },
      );

      let data: ApiErrorResponse = {};

      try {
        data = (await response.json()) as ApiErrorResponse;
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || "The asset could not be deleted.");
      }

      setDeleteState(EMPTY_DELETE_STATE);

      setSelectedAssets((current) =>
        current.filter((asset) => asset.id !== currentAsset.id),
      );

      setPreviewAsset((current) =>
        current?.id === currentAsset.id ? null : current,
      );

      showNotice("success", "Asset deleted successfully.");
      refreshAssets(false);
    } catch (error) {
      console.error("[asset-manager:delete]", error);

      showNotice(
        "error",
        getErrorMessage(error, "The asset could not be deleted."),
      );
    } finally {
      setBusy(false);
    }
  }

  function handlePickerSelection(assets: StudioAsset[]): void {
    setPickerOpen(false);
    setSelectedAssets(assets);

    const firstAsset = assets[0];

    if (firstAsset) {
      setPreviewAsset(firstAsset);
      onAssetSelected?.(firstAsset);
    }
  }

  function handleUploadComplete(uploadedAssets: StudioAsset[]): void {
    const firstAsset = uploadedAssets[0];

    if (firstAsset) {
      setSelectedAssets([firstAsset]);
      onAssetSelected?.(firstAsset);

      showNotice(
        "success",
        uploadedAssets.length === 1
          ? "Asset uploaded successfully."
          : `${uploadedAssets.length} assets uploaded successfully.`,
      );
    }

    onAssetsChanged?.();
  }

  return (
    <section className={`space-y-5 text-white ${className}`}>
      <header className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_34%)]" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                <Sparkles className="h-4 w-4" />
                Beacon Studio
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                {description}
              </p>

              {projectName ? (
                <p className="mt-3 text-sm text-slate-500">
                  Project:{" "}
                  <span className="font-medium text-slate-300">
                    {projectName}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => refreshAssets()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Choose asset
              </button>

              {allowUpload ? (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Upload asset
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="truncate text-sm text-slate-400">{selectedSummary}</p>

          {selectedAsset ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openPreview(selectedAsset)}
                disabled={busy}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Preview
              </button>

              {allowRename ? (
                <button
                  type="button"
                  onClick={() => openRename(selectedAsset)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit details
                </button>
              ) : null}

              {allowDelete ? (
                <button
                  type="button"
                  onClick={() => requestDelete(selectedAsset)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {notice ? (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/20 bg-red-400/10 text-red-100"
          }`}
        >
          <div className="flex items-start gap-3">
            {notice.type === "success" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <span>{notice.message}</span>
          </div>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            className="opacity-70 transition hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <AssetBrowser
        key={browserKey}
        mode="single"
        acceptedTypes={acceptedTypes}
        selectedIds={selectedAssets.map((asset) => asset.id)}
        projectId={projectId}
        projectName={projectName}
        collection={collection}
        allowUpload={allowUpload}
        showCollections={allowCollections}
        compact={compact}
        onSelectionChange={handleSelectionChange}
        onAssetDoubleClick={openPreview}
        onUploadComplete={handleUploadComplete}
      />

      <AssetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelection}
        mode="single"
        acceptedTypes={acceptedTypes}
        initialSelectedIds={selectedAssets.map((asset) => asset.id)}
        title="Choose a Studio asset"
        description="Select an existing asset or upload a new file."
        projectId={projectId}
        projectName={projectName}
        collection={collection}
      />

      <AssetPreview
        asset={previewAsset}
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        onRename={allowRename ? openRename : undefined}
        onDelete={allowDelete ? requestDelete : undefined}
      />

      {renameForm.open && renameForm.asset ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRename();
            }
          }}
        >
          <form
            onSubmit={submitRename}
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <div className="flex items-center gap-2 text-sm text-amber-200">
                  <Pencil className="h-4 w-4" />
                  Asset details
                </div>

                <h2 className="mt-2 text-2xl font-semibold">Edit asset</h2>
              </div>

              <button
                type="button"
                onClick={closeRename}
                disabled={busy}
                aria-label="Close asset editor"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-5 p-6">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">
                  Asset name
                </span>

                <input
                  autoFocus
                  value={renameForm.name}
                  onChange={(event) =>
                    setRenameForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  maxLength={160}
                  required
                  disabled={busy}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              {allowCollections ? (
                <label className="block">
                  <span className="text-sm font-medium text-slate-200">
                    Collection
                  </span>

                  <div className="relative mt-2">
                    <FolderPlus className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      value={renameForm.collection}
                      onChange={(event) =>
                        setRenameForm((current) => ({
                          ...current,
                          collection: event.target.value,
                        }))
                      }
                      maxLength={80}
                      placeholder="Optional collection name"
                      disabled={busy}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </label>
              ) : null}
            </div>

            <footer className="flex justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4">
              <button
                type="button"
                onClick={closeRename}
                disabled={busy}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save changes
              </button>
            </footer>
          </form>
        </div>
      ) : null}

      {deleteState.open && deleteState.asset ? (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDelete();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-asset-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-red-400/20 bg-slate-950 shadow-2xl"
          >
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <h2
                id="delete-asset-title"
                className="mt-5 text-2xl font-semibold"
              >
                Delete asset?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                <span className="font-medium text-slate-200">
                  {deleteState.asset.name}
                </span>{" "}
                will be permanently removed from your Studio asset library.
                This action cannot be undone.
              </p>
            </div>

            <footer className="flex justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4">
              <button
                type="button"
                onClick={closeDelete}
                disabled={busy}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep asset
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete permanently
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </section>
  );
}