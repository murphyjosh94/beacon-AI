"use client";

export type CurveGridProps = {
  width: number;
  height: number;
  padding: number;
  divisions?: number;
  showLabels?: boolean;
};

export default function CurveGrid({
  width,
  height,
  padding,
  divisions = 4,
  showLabels = true,
}: CurveGridProps) {
  const count = Math.max(2, Math.floor(divisions));
  const innerWidth = Math.max(1, width - padding * 2);
  const innerHeight = Math.max(1, height - padding * 2);

  const lines = Array.from({ length: count + 1 }, (_, index) => index / count);

  return (
    <g aria-hidden="true">
      <rect
        x={padding}
        y={padding}
        width={innerWidth}
        height={innerHeight}
        fill="rgba(255,255,255,0.01)"
        stroke="rgba(255,255,255,0.12)"
      />

      {lines.map((ratio) => {
        const x = padding + ratio * innerWidth;
        const y = padding + ratio * innerHeight;

        return (
          <g key={ratio}>
            <line
              x1={x}
              x2={x}
              y1={padding}
              y2={height - padding}
              stroke="rgba(255,255,255,0.06)"
            />
            <line
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
            />
          </g>
        );
      })}

      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={padding}
        stroke="rgba(255,255,255,0.13)"
        strokeDasharray="4 5"
      />

      {showLabels ? (
        <>
          <text
            x={padding}
            y={height - 6}
            fill="rgba(148,163,184,0.75)"
            fontSize="10"
          >
            0
          </text>
          <text
            x={width - padding}
            y={height - 6}
            fill="rgba(148,163,184,0.75)"
            fontSize="10"
            textAnchor="end"
          >
            1
          </text>
          <text
            x={8}
            y={padding + 4}
            fill="rgba(148,163,184,0.75)"
            fontSize="10"
          >
            1
          </text>
        </>
      ) : null}
    </g>
  );
}