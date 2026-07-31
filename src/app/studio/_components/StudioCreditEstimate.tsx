"use client";

import {
  Clock3,
  Coins,
  Layers3,
  Sparkles,
} from "lucide-react";

import {
  STUDIO_QUALITY_LABELS,
  type StudioAspectRatio,
  type StudioOutputCount,
  type StudioQuality,
  type StudioToolOption,
} from "@/app/studio/_components/StudioCreateTypes";

type StudioCreditEstimateProps = {
  tool: StudioToolOption;
  quality: StudioQuality;
  aspectRatio: StudioAspectRatio;
  outputCount: StudioOutputCount;
  durationSeconds: number;
  estimatedCredits: number;
  estimatedWait: string;
  isVideo: boolean;
  promptReady: boolean;
  isProcessing?: boolean;
  error?: string | null;
  onReview: () => void;
};

function formatDuration(durationSeconds: number): string {
  if (durationSeconds < 60) {
    return `${durationSeconds} seconds`;
  }

  const minutes = durationSeconds / 60;

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export default function StudioCreditEstimate({
  tool,
  quality,
  aspectRatio,
  outputCount,
  durationSeconds,
  estimatedCredits,
  estimatedWait,
  isVideo,
  promptReady,
  isProcessing = false,
  error = null,
  onReview,
}: StudioCreditEstimateProps) {
  return (
    <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
      <section className="overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-slate-950 text-white shadow-[0_30px_100px_rgba(0,0,0,0.3)]">
        <div className="border-b border-white/10 bg-gradient-to-br from-blue-600/25 via-transparent to-cyan-400/10 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-blue-950">
              <Coins className="h-5 w-5" />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">
                Estimated cost
              </p>

              <p className="mt-1 text-sm font-bold text-slate-300">
                Confirmed before generation
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-5">
            <div>
              <p className="text-4xl font-black tracking-tight text-white">
                {estimatedCredits.toLocaleString("en-GB")}
              </p>

              <p className="mt-1 text-sm font-black text-cyan-100">
                Studio Credits
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-slate-300">
              Estimate
            </span>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <span className="font-semibold text-slate-400">
              Creative route
            </span>

            <span className="text-right font-black text-white">
              {tool.name}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <span className="font-semibold text-slate-400">
              Quality
            </span>

            <span className="font-black text-white">
              {STUDIO_QUALITY_LABELS[quality]}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <span className="font-semibold text-slate-400">
              Format
            </span>

            <span className="font-black text-white">
              {aspectRatio}
            </span>
          </div>

          {isVideo ? (
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <span className="font-semibold text-slate-400">
                Duration
              </span>

              <span className="font-black text-white">
                {formatDuration(durationSeconds)}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-400">
              Outputs
            </span>

            <span className="font-black text-white">
              {outputCount}
            </span>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100"
            >
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onReview}
            disabled={!promptReady || isProcessing}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 px-6 py-4 text-base font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          >
            <Sparkles className="h-5 w-5" />

            {isProcessing
              ? "Preparing generation…"
              : "Review creative plan"}
          </button>

          <p className="text-center text-xs font-bold leading-5 text-slate-500">
            No credits are deducted until the final live
            amount is shown and confirmed.
          </p>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
            <Clock3 className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
              Production time
            </p>

            <p className="mt-1 font-black text-white">
              {estimatedWait}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="font-semibold text-slate-400">
            Queue status
          </span>

          <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
            Ready
          </span>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-amber-300/20 bg-amber-300/10 p-6">
        <div className="flex items-center gap-3">
          <Layers3 className="h-5 w-5 text-amber-300" />

          <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-200">
            Before generation
          </p>
        </div>

        <ul className="mt-5 space-y-3 text-sm font-bold leading-6 text-slate-300">
          {[
            "Beacon prepares a creative plan before rendering.",
            "You can review the output type and settings.",
            "The final live credit cost is confirmed first.",
            "Failed generations do not consume credits.",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-3"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-black text-blue-950"
              >
                ✓
              </span>

              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}