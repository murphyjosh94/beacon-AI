"use client";

import {
  DEFAULT_BEZIER,
  Keyframe,
  KeyframeInterpolation,
} from "./KeyframeUtils";

export type InterpolationPanelProps = {
  selectedKeyframes: Keyframe[];
  disabled?: boolean;
  className?: string;
  onChange: (updates: Keyframe[]) => void;
};

const OPTIONS: {
  value: KeyframeInterpolation;
  label: string;
  description: string;
}[] = [
  {
    value: "linear",
    label: "Linear",
    description: "Constant speed between values.",
  },
  {
    value: "ease-in",
    label: "Ease in",
    description: "Starts slowly and accelerates.",
  },
  {
    value: "ease-out",
    label: "Ease out",
    description: "Starts quickly and slows down.",
  },
  {
    value: "ease-in-out",
    label: "Ease in out",
    description: "Smooth acceleration and deceleration.",
  },
  {
    value: "hold",
    label: "Hold",
    description: "Keeps the current value until the next keyframe.",
  },
  {
    value: "bezier",
    label: "Bezier",
    description: "Custom cubic Bezier interpolation.",
  },
];

export default function InterpolationPanel({
  selectedKeyframes,
  disabled = false,
  className = "",
  onChange,
}: InterpolationPanelProps) {
  const commonInterpolation =
    selectedKeyframes.length > 0 &&
    selectedKeyframes.every(
      (item) =>
        item.interpolation === selectedKeyframes[0].interpolation,
    )
      ? selectedKeyframes[0].interpolation
      : null;

  const commonBezier =
    selectedKeyframes.length > 0
      ? selectedKeyframes[0].bezier ?? DEFAULT_BEZIER
      : DEFAULT_BEZIER;

  const applyInterpolation = (value: KeyframeInterpolation) => {
    onChange(
      selectedKeyframes.map((keyframe) => ({
        ...keyframe,
        interpolation: value,
        bezier:
          value === "bezier"
            ? keyframe.bezier ?? DEFAULT_BEZIER
            : keyframe.bezier,
      })),
    );
  };

  const updateBezier = (index: number, value: number) => {
    onChange(
      selectedKeyframes.map((keyframe) => {
        const bezier = [
          ...(keyframe.bezier ?? DEFAULT_BEZIER),
        ] as [number, number, number, number];

        bezier[index] = Math.min(Math.max(value, 0), 1);

        return {
          ...keyframe,
          interpolation: "bezier",
          bezier,
        };
      }),
    );
  };

  return (
    <aside
      className={`rounded-xl border border-white/10 bg-slate-900/70 p-4 ${className}`}
      aria-label="Interpolation settings"
    >
      <div>
        <h3 className="text-sm font-semibold text-white">Interpolation</h3>
        <p className="mt-1 text-xs text-slate-500">
          {selectedKeyframes.length === 0
            ? "Select one or more keyframes."
            : `${selectedKeyframes.length} keyframe${
                selectedKeyframes.length === 1 ? "" : "s"
              } selected`}
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        {OPTIONS.map((option) => {
          const active = commonInterpolation === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled || selectedKeyframes.length === 0}
              onClick={() => applyInterpolation(option.value)}
              className={`rounded-lg border p-3 text-left transition ${
                active
                  ? "border-cyan-400/30 bg-cyan-400/10"
                  : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <span className="block text-xs font-semibold text-slate-100">
                {option.label}
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {commonInterpolation === "bezier" ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <h4 className="text-xs font-semibold text-white">Bezier handles</h4>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {["X1", "Y1", "X2", "Y2"].map((label, index) => (
              <label key={label} className="text-[11px] text-slate-500">
                {label}
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={commonBezier[index]}
                  disabled={disabled}
                  onChange={(event) =>
                    updateBezier(index, Number(event.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}