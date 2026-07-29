"use client";

import {
  KeyboardEvent,
  useMemo,
  useState,
} from "react";

import {
  BezierTuple,
  bezierToCss,
  DEFAULT_BEZIER,
  sanitiseBezier,
} from "./BezierMath";
import CurveCanvas from "./CurveCanvas";
import {
  CURVE_PRESETS,
  findMatchingPreset,
} from "./CurvePresets";

export type AnimationCurveEditorProps = {
  value?: BezierTuple;
  disabled?: boolean;
  className?: string;
  title?: string;
  description?: string;
  showSamples?: boolean;
  onChange?: (value: BezierTuple) => void;
  onCommit?: (
    value: BezierTuple,
    context: {
      label: string;
      previous: BezierTuple;
      next: BezierTuple;
    },
  ) => void;
};

function tuplesEqual(a: BezierTuple, b: BezierTuple): boolean {
  return a.every((value, index) => value === b[index]);
}

export default function AnimationCurveEditor({
  value = DEFAULT_BEZIER,
  disabled = false,
  className = "",
  title = "Animation curve",
  description = "Shape acceleration and deceleration with cubic Bezier handles.",
  showSamples = false,
  onChange,
  onCommit,
}: AnimationCurveEditorProps) {
  const [localValue, setLocalValue] = useState<BezierTuple>(
    sanitiseBezier(value),
  );
  const [previewing, setPreviewing] = useState(false);
  const [commitStart, setCommitStart] = useState<BezierTuple>(
    sanitiseBezier(value),
  );

  const matchingPreset = useMemo(
    () => findMatchingPreset(localValue),
    [localValue],
  );

  const updateValue = (next: BezierTuple) => {
    const sanitised = sanitiseBezier(next);
    setLocalValue(sanitised);
    onChange?.(sanitised);
  };

  const commit = (next: BezierTuple, label: string) => {
    if (!tuplesEqual(commitStart, next)) {
      onCommit?.(next, {
        label,
        previous: commitStart,
        next,
      });
    }

    setCommitStart(next);
  };

  const updateComponent = (index: number, raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;

    const next = [...localValue] as BezierTuple;
    next[index] = parsed;
    updateValue(next);
  };

  const applyPreset = (presetValue: BezierTuple, presetName: string) => {
    const previous = localValue;
    updateValue(presetValue);
    setCommitStart(presetValue);

    onCommit?.(presetValue, {
      label: `Apply ${presetName} curve`,
      previous,
      next: presetValue,
    });
  };

  const reset = () => {
    const previous = localValue;
    updateValue(DEFAULT_BEZIER);
    setCommitStart(DEFAULT_BEZIER);

    onCommit?.(DEFAULT_BEZIER, {
      label: "Reset animation curve",
      previous,
      next: DEFAULT_BEZIER,
    });
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;

    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT"
    ) {
      return;
    }

    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      reset();
    }

    if (event.key === " ") {
      event.preventDefault();
      setPreviewing((current) => !current);
    }
  };

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyboard}
      aria-label="Beacon Studio animation curve editor"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/95 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewing((current) => !current)}
            disabled={disabled}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-40"
          >
            {previewing ? "Stop preview" : "Preview"}
          </button>

          <button
            type="button"
            onClick={reset}
            disabled={disabled}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="grid min-h-[36rem] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="border-b border-white/10 p-4 xl:border-b-0 xl:border-r">
          <CurveCanvas
            value={localValue}
            disabled={disabled}
            showSamples={showSamples}
            onChange={updateValue}
            onChangeEnd={(next) => commit(next, "Edit animation curve")}
          />

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-white">
                  Motion preview
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  {matchingPreset?.name ?? "Custom curve"}
                </p>
              </div>

              <code className="rounded bg-slate-950 px-2 py-1 text-[10px] text-cyan-200">
                {bezierToCss(localValue)}
              </code>
            </div>

            <div className="mt-5 h-14 overflow-hidden rounded-lg border border-white/10 bg-slate-950 p-2">
              <div
                className={`h-10 w-10 rounded-lg border border-cyan-300/30 bg-cyan-400/20 ${
                  previewing ? "translate-x-[calc(100%-2.5rem)]" : "translate-x-0"
                }`}
                style={{
                  transitionProperty: "transform",
                  transitionDuration: "1200ms",
                  transitionTimingFunction: bezierToCss(localValue),
                }}
              />
            </div>
          </div>
        </div>

        <aside className="bg-slate-900/45 p-4">
          <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-white">Control points</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["X1", "Y1", "X2", "Y2"].map((label, index) => (
                <label key={label} className="text-[11px] text-slate-500">
                  {label}
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={Number(localValue[index].toFixed(3))}
                    disabled={disabled}
                    onFocus={() => setCommitStart(localValue)}
                    onBlur={() => commit(localValue, "Edit curve control point")}
                    onChange={(event) =>
                      updateComponent(index, event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-40"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-white">Presets</h3>
            <div className="mt-4 grid gap-2">
              {CURVE_PRESETS.map((preset) => {
                const active = matchingPreset?.id === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => applyPreset(preset.value, preset.name)}
                    className={`rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-cyan-400/30 bg-cyan-400/10"
                        : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
                    } disabled:opacity-40`}
                  >
                    <span className="block text-xs font-semibold text-slate-100">
                      {preset.name}
                    </span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3 text-[11px] text-slate-500">
        <span>
          Drag either control handle or edit the values directly.
        </span>
        <span>Space: preview · R: reset</span>
      </footer>
    </section>
  );
}