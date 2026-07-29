"use client";

export type BezierTuple = [number, number, number, number];

export type Point = {
  x: number;
  y: number;
};

export const DEFAULT_BEZIER: BezierTuple = [0.25, 0.1, 0.25, 1];

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(Math.max(value, min), max);
}

export function cubicBezierPoint(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x:
      uuu * p0.x +
      3 * uu * t * p1.x +
      3 * u * tt * p2.x +
      ttt * p3.x,
    y:
      uuu * p0.y +
      3 * uu * t * p1.y +
      3 * u * tt * p2.y +
      ttt * p3.y,
  };
}

export function evaluateBezier(tuple: BezierTuple, t: number): Point {
  return cubicBezierPoint(
    clamp(t),
    { x: 0, y: 0 },
    { x: tuple[0], y: tuple[1] },
    { x: tuple[2], y: tuple[3] },
    { x: 1, y: 1 },
  );
}

export function sampleBezier(
  tuple: BezierTuple,
  sampleCount = 80,
): Point[] {
  const count = Math.max(2, Math.floor(sampleCount));
  return Array.from({ length: count + 1 }, (_, index) =>
    evaluateBezier(tuple, index / count),
  );
}

export function tupleToSvgPath(
  tuple: BezierTuple,
  width: number,
  height: number,
  padding: number,
): string {
  const innerWidth = Math.max(1, width - padding * 2);
  const innerHeight = Math.max(1, height - padding * 2);

  const toX = (value: number) => padding + value * innerWidth;
  const toY = (value: number) => height - padding - value * innerHeight;

  return [
    `M ${toX(0)} ${toY(0)}`,
    `C ${toX(tuple[0])} ${toY(tuple[1])},`,
    `${toX(tuple[2])} ${toY(tuple[3])},`,
    `${toX(1)} ${toY(1)}`,
  ].join(" ");
}

export function bezierHandlesToScreen(
  tuple: BezierTuple,
  width: number,
  height: number,
  padding: number,
): [Point, Point] {
  const innerWidth = Math.max(1, width - padding * 2);
  const innerHeight = Math.max(1, height - padding * 2);

  return [
    {
      x: padding + tuple[0] * innerWidth,
      y: height - padding - tuple[1] * innerHeight,
    },
    {
      x: padding + tuple[2] * innerWidth,
      y: height - padding - tuple[3] * innerHeight,
    },
  ];
}

export function screenToBezierPoint(
  point: Point,
  width: number,
  height: number,
  padding: number,
): Point {
  const innerWidth = Math.max(1, width - padding * 2);
  const innerHeight = Math.max(1, height - padding * 2);

  return {
    x: clamp((point.x - padding) / innerWidth),
    y: clamp((height - padding - point.y) / innerHeight),
  };
}

export function sanitiseBezier(tuple: BezierTuple): BezierTuple {
  return [
    clamp(tuple[0]),
    clamp(tuple[1]),
    clamp(tuple[2]),
    clamp(tuple[3]),
  ];
}

export function bezierToCss(tuple: BezierTuple): string {
  return `cubic-bezier(${tuple.map((value) => Number(value.toFixed(3))).join(", ")})`;
}