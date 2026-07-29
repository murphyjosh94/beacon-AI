"use client";

import { BezierTuple } from "./BezierMath";

export type CurvePreset = {
  id: string;
  name: string;
  description: string;
  value: BezierTuple;
};

export const CURVE_PRESETS: CurvePreset[] = [
  {
    id: "linear",
    name: "Linear",
    description: "Constant rate from start to finish.",
    value: [0, 0, 1, 1],
  },
  {
    id: "ease",
    name: "Ease",
    description: "A natural general-purpose transition.",
    value: [0.25, 0.1, 0.25, 1],
  },
  {
    id: "ease-in",
    name: "Ease in",
    description: "Starts slowly, then accelerates.",
    value: [0.42, 0, 1, 1],
  },
  {
    id: "ease-out",
    name: "Ease out",
    description: "Starts quickly, then decelerates.",
    value: [0, 0, 0.58, 1],
  },
  {
    id: "ease-in-out",
    name: "Ease in out",
    description: "Smooth acceleration and deceleration.",
    value: [0.42, 0, 0.58, 1],
  },
  {
    id: "sharp",
    name: "Sharp",
    description: "Fast, responsive motion.",
    value: [0.4, 0, 0.2, 1],
  },
  {
    id: "soft",
    name: "Soft",
    description: "Gentle and premium-feeling movement.",
    value: [0.16, 1, 0.3, 1],
  },
  {
    id: "anticipate",
    name: "Anticipate",
    description: "Briefly resists before accelerating.",
    value: [0.36, 0, 0.66, -0.56],
  },
];

export function findMatchingPreset(
  value: BezierTuple,
  tolerance = 0.001,
): CurvePreset | null {
  return (
    CURVE_PRESETS.find((preset) =>
      preset.value.every(
        (component, index) => Math.abs(component - value[index]) <= tolerance,
      ),
    ) ?? null
  );
}