"use client";

import {
  PointerEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BezierTuple,
  bezierHandlesToScreen,
  sampleBezier,
  tupleToSvgPath,
} from "./BezierMath";
import { CurveInteractionController, CurveHandle } from "./CurveInteraction";
import CurveGrid from "./CurveGrid";

export type CurveCanvasProps = {
  value: BezierTuple;
  width?: number;
  height?: number;
  padding?: number;
  disabled?: boolean;
  showSamples?: boolean;
  onChange: (value: BezierTuple) => void;
  onChangeEnd?: (value: BezierTuple) => void;
};

export default function CurveCanvas({
  value,
  width = 560,
  height = 360,
  padding = 36,
  disabled = false,
  showSamples = false,
  onChange,
  onChangeEnd,
}: CurveCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const interactionRef = useRef(new CurveInteractionController());
  const [activeHandle, setActiveHandle] = useState<CurveHandle | null>(null);

  const path = useMemo(
    () => tupleToSvgPath(value, width, height, padding),
    [height, padding, value, width],
  );

  const [handleOne, handleTwo] = useMemo(
    () => bezierHandlesToScreen(value, width, height, padding),
    [height, padding, value, width],
  );

  const samples = useMemo(
    () => (showSamples ? sampleBezier(value, 24) : []),
    [showSamples, value],
  );

  const startDrag = (
    event: PointerEvent<SVGCircleElement>,
    handle: CurveHandle,
  ) => {
    if (disabled) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current.start(handle, event.pointerId, value);
    setActiveHandle(handle);
  };

  const moveDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (!interactionRef.current.isDragging() || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const next = interactionRef.current.update(
      {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      },
      width,
      height,
      padding,
    );

    if (next) {
      onChange(next);
    }
  };

  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (!interactionRef.current.isDragging()) return;

    const pointerId = interactionRef.current.getPointerId();
    interactionRef.current.finish();
    setActiveHandle(null);

    if (
      pointerId !== null &&
      event.currentTarget.hasPointerCapture(pointerId)
    ) {
      event.currentTarget.releasePointerCapture(pointerId);
    }

    onChangeEnd?.(value);
  };

  const endpointStart = {
    x: padding,
    y: height - padding,
  };
  const endpointEnd = {
    x: width - padding,
    y: padding,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full touch-none select-none"
        role="img"
        aria-label="Animation cubic Bezier curve editor"
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <CurveGrid
          width={width}
          height={height}
          padding={padding}
          divisions={4}
        />

        <line
          x1={endpointStart.x}
          y1={endpointStart.y}
          x2={handleOne.x}
          y2={handleOne.y}
          stroke="rgba(103,232,249,0.45)"
          strokeWidth="1.5"
        />
        <line
          x1={endpointEnd.x}
          y1={endpointEnd.y}
          x2={handleTwo.x}
          y2={handleTwo.y}
          stroke="rgba(103,232,249,0.45)"
          strokeWidth="1.5"
        />

        <path
          d={path}
          fill="none"
          stroke="rgb(103,232,249)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {samples.map((sample, index) => (
          <circle
            key={index}
            cx={padding + sample.x * (width - padding * 2)}
            cy={height - padding - sample.y * (height - padding * 2)}
            r="1.8"
            fill="rgba(255,255,255,0.55)"
          />
        ))}

        {[handleOne, handleTwo].map((handle, index) => (
          <circle
            key={index}
            cx={handle.x}
            cy={handle.y}
            r={activeHandle === index ? 9 : 7}
            fill={activeHandle === index ? "rgb(34,211,238)" : "rgb(15,23,42)"}
            stroke="rgb(165,243,252)"
            strokeWidth="2"
            className={disabled ? "cursor-not-allowed" : "cursor-grab"}
            onPointerDown={(event) =>
              startDrag(event, index as CurveHandle)
            }
          />
        ))}

        <circle
          cx={endpointStart.x}
          cy={endpointStart.y}
          r="4"
          fill="rgb(148,163,184)"
        />
        <circle
          cx={endpointEnd.x}
          cy={endpointEnd.y}
          r="4"
          fill="rgb(148,163,184)"
        />
      </svg>
    </div>
  );
}