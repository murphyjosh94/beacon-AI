"use client";

import {
  Check,
  Clock3,
  Coins,
  FileOutput,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";

import {
  STUDIO_QUALITY_LABELS,
  type StudioQuality,
  type StudioToolOption,
} from "@/app/studio/_components/StudioCreateTypes";
import type {
  StudioPlannerDeliverable,
  StudioPlannerPlan,
} from "@/app/studio/_components/StudioPlanner";

type StudioGenerationReviewProps = {
  open: boolean;
  plan: StudioPlannerPlan;
  tool: StudioToolOption;
  quality: StudioQuality;
  isGenerating: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

function formatDuration(
  durationSeconds: number | undefined,
): string | null {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return null;
  }

  if (durationSeconds < 60) {
    return `${Math.round(durationSeconds)} seconds`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.round(durationSeconds % 60);

  if (seconds === 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${minutes}m ${seconds}s`;
}

function formatOutputName(value: string): string {
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        `${word.charAt(0).toUpperCase()}${word.slice(1)}`,
    )
    .join(" ");
}

export default function StudioGenerationReview({
  open,
  plan,
  tool,
  quality,
  isGenerating,
  error = null,
  onClose,
  onConfirm,
}: StudioGenerationReviewProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-generation-review-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isGenerating
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-[0_35px_120px_rgba(0,0,0,0.6)]">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-5 py-5 backdrop-blur-xl sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.14em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Final review
              </div>

              <h2
                id="studio-generation-review-title"
                className="mt-4 text-3xl font-black tracking-tight text-white"
              >
                Confirm the creative plan
              </h2>

              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-400">
                Check the production route, deliverables and estimated
                credit cost before Beacon begins.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              aria-label="Close generation review"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
              Creative plan
            </p>

            <h3 className="mt-2 text-2xl font-black text-white">
              {plan.title}
            </h3>

            <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-300">
              {plan.summary}
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">
                Production route
              </p>

              <p className="mt-2 font-black text-white">
                {tool.name}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">
                Quality
              </p>

              <p className="mt-2 font-black text-white">
                {STUDIO_QUALITY_LABELS[quality]}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">
                Deliverables
              </p>

              <p className="mt-2 font-black text-white">
                {plan.deliverables.length}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-amber-200/70">
                Estimated cost
              </p>

              <p className="mt-2 font-black text-amber-200">
                {plan.estimatedCredits.toLocaleString("en-GB")} Credits
              </p>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <FileOutput className="h-5 w-5 text-cyan-200" />

              <h3 className="text-lg font-black text-white">
                Planned deliverables
              </h3>
            </div>

            <div className="mt-5 space-y-3">
              {plan.deliverables.map(
                (deliverable: StudioPlannerDeliverable) => {
                  const duration = formatDuration(
                    deliverable.durationSeconds,
                  );

                  return (
                    <div
                      key={deliverable.id}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-200">
                        <Check className="h-3.5 w-3.5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-white">
                              {deliverable.name}
                            </p>

                            <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                              {deliverable.description}
                            </p>
                          </div>

                          {deliverable.quantity > 1 ? (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                              ×{deliverable.quantity}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                            {deliverable.aspectRatio}
                          </span>

                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                            {formatOutputName(deliverable.format)}
                          </span>

                          {duration ? (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                              {duration}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/[0.06] p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-blue-950">
                <Coins className="h-5 w-5" />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Estimated credit cost
                </p>

                <p className="mt-1 text-xl font-black text-white">
                  {plan.estimatedCredits.toLocaleString("en-GB")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-100">
                <Clock3 className="h-5 w-5" />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Estimated production
                </p>

                <p className="mt-1 text-xl font-black text-white">
                  {plan.estimatedDuration}
                </p>
              </div>
            </div>
          </section>

          {plan.warnings.length > 0 ? (
            <section className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-5">
              <p className="font-black text-amber-100">
                Planning notes
              </p>

              <div className="mt-3 space-y-2">
                {plan.warnings.map(
                  (warning: string, index: number) => (
                    <p
                      key={`${index}-${warning}`}
                      className="text-sm font-semibold leading-6 text-slate-300"
                    >
                      {warning}
                    </p>
                  ),
                )}
              </div>
            </section>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-[1.5rem] border border-red-300/20 bg-red-400/10 p-5 text-sm font-bold leading-6 text-red-100"
            >
              {error}
            </div>
          ) : null}

          <section className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="font-black text-amber-100">
              Credits remain protected
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
              The generation API confirms the live cost and available
              balance. Credits are deducted only after a successful
              generation. Failed generations do not consume Studio
              Credits.
            </p>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Return to plan
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isGenerating}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-7 py-3 text-sm font-black text-white shadow-[0_16px_45px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creating preview…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Confirm{" "}
                  {plan.estimatedCredits.toLocaleString("en-GB")} Credits
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}