"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Download,
  LoaderCircle,
  Save,
} from "lucide-react";

export type ToolbarSaveStatus =
  | "idle"
  | "loading"
  | "creating"
  | "saving"
  | "saved"
  | "error";

type ToolbarProps = {
  projectName: string;
  saveStatus: ToolbarSaveStatus;
  isDirty: boolean;
  onSave: () => Promise<unknown>;
  onExport?: () => void;
  backHref?: string;
};

function getSaveLabel(
  status: ToolbarSaveStatus,
  isDirty: boolean,
) {
  if (status === "loading") {
    return "Loading";
  }

  if (status === "creating") {
    return "Creating";
  }

  if (status === "saving") {
    return "Saving";
  }

  if (status === "error") {
    return "Save failed";
  }

  if (isDirty) {
    return "Save changes";
  }

  return "Saved";
}

export function BeaconMark() {
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/25 bg-slate-950/85 shadow-[0_0_35px_rgba(246,196,83,0.12)]">
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 64 64"
      >
        <path
          d="M24 54h16"
          stroke="#F6C453"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="m27 24 2-7h6l2 7"
          stroke="#F6C453"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path
          d="M26 25h12l4 29H22l4-29Z"
          fill="#155EEF"
          stroke="#F6C453"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        <path
          d="M24 25h16M29 17h6"
          stroke="#F6C453"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M28 32h8M26.5 42h11"
          stroke="#38BDF8"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M15 20 3 16M49 20l12-4"
          stroke="#F8FAFC"
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

export default function Toolbar({
  projectName,
  saveStatus,
  isDirty,
  onSave,
  onExport,
  backHref = "/demo",
}: ToolbarProps) {
  const busy =
    saveStatus === "loading" ||
    saveStatus === "creating" ||
    saveStatus === "saving";

  const saveLabel = getSaveLabel(saveStatus, isDirty);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          aria-label="Back to demo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          href={backHref}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <BeaconMark />

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">
            Beacon Motion Editor
          </p>
          <p className="truncate text-xs font-semibold text-slate-500">
            {projectName}
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              saveStatus === "error"
                ? "border-red-300/20 bg-red-400/10 text-red-100 hover:bg-red-400/15"
                : "border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
            disabled={busy || (!isDirty && saveStatus !== "error")}
            onClick={() => void onSave()}
            type="button"
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveLabel}
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!onExport}
            onClick={onExport}
            type="button"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>
    </header>
  );
}