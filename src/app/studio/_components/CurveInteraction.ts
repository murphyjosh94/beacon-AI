"use client";

import {
  BezierTuple,
  Point,
  sanitiseBezier,
  screenToBezierPoint,
} from "./BezierMath";

export type CurveHandle = 0 | 1;

export type CurveDragStart = {
  handle: CurveHandle;
  pointerId: number;
  startTuple: BezierTuple;
};

export class CurveInteractionController {
  private drag: CurveDragStart | null = null;

  start(handle: CurveHandle, pointerId: number, tuple: BezierTuple): void {
    this.drag = {
      handle,
      pointerId,
      startTuple: [...tuple] as BezierTuple,
    };
  }

  isDragging(): boolean {
    return this.drag !== null;
  }

  getPointerId(): number | null {
    return this.drag?.pointerId ?? null;
  }

  update(
    point: Point,
    width: number,
    height: number,
    padding: number,
  ): BezierTuple | null {
    if (!this.drag) return null;

    const normalised = screenToBezierPoint(point, width, height, padding);
    const next = [...this.drag.startTuple] as BezierTuple;

    if (this.drag.handle === 0) {
      next[0] = normalised.x;
      next[1] = normalised.y;
    } else {
      next[2] = normalised.x;
      next[3] = normalised.y;
    }

    return sanitiseBezier(next);
  }

  finish(): void {
    this.drag = null;
  }

  cancel(): BezierTuple | null {
    const original = this.drag?.startTuple ?? null;
    this.drag = null;
    return original ? ([...original] as BezierTuple) : null;
  }
}