"use client";

import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import type {
  StudioToolId,
  StudioToolOption,
} from "@/app/studio/_components/StudioCreateTypes";

type StudioRequestProps = {
  prompt: string;
  selectedTool: StudioToolId;
  selectedToolDetails: StudioToolOption;
  showAdvanced: boolean;
  disabled?: boolean;
  onPromptChange: (
    prompt: string,
  ) => void;
  onAdvancedToggle: () => void;
  onContinue: () => void;
};

export default function StudioRequest({
  prompt,
  selectedTool,
  selectedToolDetails,
  showAdvanced,
  disabled = false,
  onPromptChange,
  onAdvancedToggle,
  onContinue,
}: StudioRequestProps) {
  const promptLength =
    prompt.trim().length;

  const canContinue =
    promptLength >= 10 && !disabled;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
      <div className="border-b border-white/10 bg-gradient-to-r from-blue-600/15 via-transparent to-cyan-400/10 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.14em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Creative request
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Describe the result you need
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-400">
              Explain what you want to create,
              who it is for and where it will
              be used. Beacon will prepare the
              production plan.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">
              Production route
            </p>

            <p className="mt-1 text-sm font-black text-cyan-100">
              {selectedTool === "custom"
                ? "Chosen by Beacon"
                : selectedToolDetails.name}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <label
          htmlFor="studio-creative-request"
          className="sr-only"
        >
          Describe what you would like Beacon
          Studio to create
        </label>

        <div className="rounded-[1.6rem] border border-white/10 bg-[#060d1c] p-3 transition focus-within:border-cyan-300/30 focus-within:ring-4 focus-within:ring-cyan-300/5">
          <textarea
            id="studio-creative-request"
            value={prompt}
            onChange={(event) =>
              onPromptChange(
                event.target.value,
              )
            }
            disabled={disabled}
            rows={9}
            placeholder={
              selectedToolDetails.promptExample
            }
            className="min-h-52 w-full resize-none bg-transparent px-3 py-3 text-base font-semibold leading-8 text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
          />

          <div className="flex flex-col gap-3 border-t border-white/10 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <WandSparkles className="h-4 w-4 text-cyan-200" />

              <span>
                Include your audience, purpose,
                platform and preferred style
                when relevant.
              </span>
            </div>

            <span
              className={`text-xs font-black ${
                promptLength >= 10
                  ? "text-emerald-300"
                  : "text-slate-600"
              }`}
            >
              {promptLength.toLocaleString(
                "en-GB",
              )}{" "}
              characters
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onAdvancedToggle}
            disabled={disabled}
            aria-expanded={showAdvanced}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}

            {showAdvanced
              ? "Hide optional settings"
              : "Add optional details"}
          </button>

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-7 py-3 text-sm font-black text-white shadow-[0_16px_45px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(37,99,235,0.38)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          >
            Prepare creative plan
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {promptLength > 0 &&
        promptLength < 10 ? (
          <p
            role="alert"
            className="mt-3 text-right text-xs font-bold text-amber-200"
          >
            Add a little more detail so Beacon
            can understand the request.
          </p>
        ) : null}
      </div>
    </section>
  );
}