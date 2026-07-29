"use client";

import {
  type CSSProperties,
  type ReactNode,
  useMemo,
} from "react";

export const BEACON_MOTION = {
  colours: {
    navy: "#020617",
    deepBlue: "#071B3D",
    blue: "#155EEF",
    brightBlue: "#38BDF8",
    cyan: "#67E8F9",
    gold: "#F6C453",
    warmGold: "#FBBF24",
    white: "#F8FAFC",
    slate: "#94A3B8",
  },
  easing: {
    smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
    cinematic: "cubic-bezier(0.16, 1, 0.3, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

export type MotionPrimitiveProps = {
  currentTimeMs: number;
  startMs?: number;
  endMs?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export type TypewriterProps = {
  currentTimeMs: number;
  startMs?: number;
  endMs?: number;
  text: string;
  className?: string;
  cursor?: boolean;
  cursorClassName?: string;
  characterDelayMs?: number;
  showFullTextAfterEnd?: boolean;
  style?: CSSProperties;
};

export type EndCardProps = {
  currentTimeMs: number;
  startMs?: number;
  endMs?: number;
  brand?: string;
  headline?: string;
  subheading?: string;
  website?: string;
  badge?: string;
  className?: string;
  logo?: ReactNode;
};

export type GlowProps = {
  currentTimeMs: number;
  startMs?: number;
  endMs?: number;
  className?: string;
  intensity?: number;
  size?: number;
  x?: string;
  y?: string;
};

export type BeamSweepProps = {
  currentTimeMs: number;
  startMs?: number;
  endMs?: number;
  className?: string;
  angle?: number;
  width?: number;
  opacity?: number;
};

export function clamp(
  value: number,
  minimum = 0,
  maximum = 1,
) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function lerp(
  start: number,
  end: number,
  progress: number,
) {
  return start + (end - start) * clamp(progress);
}

export function inverseLerp(
  start: number,
  end: number,
  value: number,
) {
  if (start === end) {
    return value >= end ? 1 : 0;
  }

  return clamp((value - start) / (end - start));
}

export function between(
  currentTimeMs: number,
  startMs: number,
  endMs: number,
) {
  return currentTimeMs >= startMs && currentTimeMs <= endMs;
}

export function progressBetween(
  currentTimeMs: number,
  startMs: number,
  endMs: number,
) {
  return inverseLerp(startMs, endMs, currentTimeMs);
}

export function easeInOut(progress: number) {
  const value = clamp(progress);

  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - clamp(progress), 3);
}

export function easeOutQuart(progress: number) {
  return 1 - Math.pow(1 - clamp(progress), 4);
}

export function easeOutQuint(progress: number) {
  return 1 - Math.pow(1 - clamp(progress), 5);
}

export function easeInCubic(progress: number) {
  return Math.pow(clamp(progress), 3);
}

export function smoothStep(progress: number) {
  const value = clamp(progress);

  return value * value * (3 - 2 * value);
}

export function fadeWindow(
  currentTimeMs: number,
  startMs: number,
  endMs: number,
  fadeInMs = 400,
  fadeOutMs = 400,
) {
  if (!between(currentTimeMs, startMs, endMs)) {
    return 0;
  }

  const fadeInProgress = inverseLerp(
    startMs,
    Math.min(startMs + fadeInMs, endMs),
    currentTimeMs,
  );

  const fadeOutProgress = 1 - inverseLerp(
    Math.max(startMs, endMs - fadeOutMs),
    endMs,
    currentTimeMs,
  );

  return clamp(Math.min(fadeInProgress, fadeOutProgress));
}

export function mapRange(
  value: number,
  inputStart: number,
  inputEnd: number,
  outputStart: number,
  outputEnd: number,
) {
  return lerp(
    outputStart,
    outputEnd,
    inverseLerp(inputStart, inputEnd, value),
  );
}

export function staggerDelay(
  index: number,
  baseDelayMs = 100,
  initialDelayMs = 0,
) {
  return initialDelayMs + index * baseDelayMs;
}

function getVisibilityStyle(
  currentTimeMs: number,
  startMs: number,
  endMs: number,
  fadeInMs: number,
  fadeOutMs: number,
) {
  const opacity = fadeWindow(
    currentTimeMs,
    startMs,
    endMs,
    fadeInMs,
    fadeOutMs,
  );

  return {
    opacity,
    visibility:
      opacity <= 0
        ? ("hidden" as const)
        : ("visible" as const),
    pointerEvents:
      opacity <= 0
        ? ("none" as const)
        : ("auto" as const),
  };
}

export function FadeIn({
  currentTimeMs,
  startMs = 0,
  endMs = Number.POSITIVE_INFINITY,
  children,
  className = "",
  style,
}: MotionPrimitiveProps) {
  const finiteEnd = Number.isFinite(endMs)
    ? endMs
    : currentTimeMs + 1;

  const progress = easeOutCubic(
    progressBetween(
      currentTimeMs,
      startMs,
      Math.min(startMs + 500, finiteEnd),
    ),
  );

  const visible =
    currentTimeMs >= startMs &&
    currentTimeMs <= endMs;

  return (
    <div
      className={className}
      style={{
        opacity: visible ? progress : 0,
        visibility: visible ? "visible" : "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FadeOut({
  currentTimeMs,
  startMs = 0,
  endMs = Number.POSITIVE_INFINITY,
  children,
  className = "",
  style,
}: MotionPrimitiveProps) {
  const fadeStart = Number.isFinite(endMs)
    ? Math.max(startMs, endMs - 500)
    : Number.POSITIVE_INFINITY;

  const opacity = Number.isFinite(endMs)
    ? 1 - easeInCubic(
        progressBetween(
          currentTimeMs,
          fadeStart,
          endMs,
        ),
      )
    : 1;

  const visible =
    currentTimeMs >= startMs &&
    currentTimeMs <= endMs;

  return (
    <div
      className={className}
      style={{
        opacity: visible ? opacity : 0,
        visibility: visible ? "visible" : "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FadeSlide({
  currentTimeMs,
  startMs = 0,
  endMs = Number.POSITIVE_INFINITY,
  children,
  className = "",
  style,
}: MotionPrimitiveProps) {
  const finiteEnd = Number.isFinite(endMs)
    ? endMs
    : currentTimeMs + 1;

  const enterProgress = easeOutQuart(
    progressBetween(
      currentTimeMs,
      startMs,
      Math.min(startMs + 650, finiteEnd),
    ),
  );

  const exitStart = Number.isFinite(endMs)
    ? Math.max(startMs, endMs - 450)
    : Number.POSITIVE_INFINITY;

  const exitProgress = Number.isFinite(endMs)
    ? easeInCubic(
        progressBetween(
          currentTimeMs,
          exitStart,
          endMs,
        ),
      )
    : 0;

  const visible =
    currentTimeMs >= startMs &&
    currentTimeMs <= endMs;

  const opacity = clamp(
    enterProgress * (1 - exitProgress),
  );

  const translateY =
    lerp(34, 0, enterProgress) -
    lerp(0, 18, exitProgress);

  const scale =
    lerp(0.97, 1, enterProgress) -
    lerp(0, 0.015, exitProgress);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? opacity : 0,
        transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
        transformOrigin: "center",
        visibility: visible ? "visible" : "hidden",
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ScaleIn({
  currentTimeMs,
  startMs = 0,
  endMs = Number.POSITIVE_INFINITY,
  children,
  className = "",
  style,
}: MotionPrimitiveProps) {
  const finiteEnd = Number.isFinite(endMs)
    ? endMs
    : currentTimeMs + 1;

  const enterProgress = easeOutQuint(
    progressBetween(
      currentTimeMs,
      startMs,
      Math.min(startMs + 550, finiteEnd),
    ),
  );

  const exitProgress = Number.isFinite(endMs)
    ? easeInCubic(
        progressBetween(
          currentTimeMs,
          Math.max(startMs, endMs - 400),
          endMs,
        ),
      )
    : 0;

  const visible =
    currentTimeMs >= startMs &&
    currentTimeMs <= endMs;

  const opacity = clamp(
    enterProgress * (1 - exitProgress),
  );

  const scale =
    lerp(0.82, 1, enterProgress) -
    lerp(0, 0.04, exitProgress);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? opacity : 0,
        transform: `scale(${scale})`,
        transformOrigin: "center",
        visibility: visible ? "visible" : "hidden",
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Typewriter({
  currentTimeMs,
  startMs = 0,
  endMs,
  text,
  className = "",
  cursor = true,
  cursorClassName = "",
  characterDelayMs = 38,
  showFullTextAfterEnd = true,
  style,
}: TypewriterProps) {
  const safeCharacterDelay = Math.max(
    characterDelayMs,
    1,
  );

  const typingDuration =
    text.length * safeCharacterDelay;

  const typingEnd =
    endMs ?? startMs + typingDuration;

  const elapsed = Math.max(
    0,
    currentTimeMs - startMs,
  );

  const typedCharacterCount = clamp(
    Math.floor(elapsed / safeCharacterDelay),
    0,
    text.length,
  );

  const isBeforeStart = currentTimeMs < startMs;
  const isAfterEnd = currentTimeMs > typingEnd;

  const visibleText = isBeforeStart
    ? ""
    : isAfterEnd && showFullTextAfterEnd
      ? text
      : text.slice(0, typedCharacterCount);

  const cursorVisible =
    cursor &&
    !isBeforeStart &&
    (!isAfterEnd || showFullTextAfterEnd);

  const cursorOpacity =
    Math.floor(currentTimeMs / 450) % 2 === 0
      ? 1
      : 0.2;

  return (
    <span
      aria-label={text}
      className={className}
      style={style}
    >
      <span aria-hidden="true">{visibleText}</span>

      {cursorVisible && (
        <span
          aria-hidden="true"
          className={`ml-0.5 inline-block h-[1em] w-[0.08em] translate-y-[0.08em] rounded-full bg-current ${cursorClassName}`}
          style={{
            opacity: cursorOpacity,
          }}
        />
      )}
    </span>
  );
}

export function Glow({
  currentTimeMs,
  startMs = 0,
  endMs = Number.POSITIVE_INFINITY,
  className = "",
  intensity = 1,
  size = 420,
  x = "50%",
  y = "38%",
}: GlowProps) {
  const finiteEnd = Number.isFinite(endMs)
    ? endMs
    : currentTimeMs + 1;

  const pulse =
    0.72 +
    Math.sin(currentTimeMs / 700) * 0.12;

  const visibility = getVisibilityStyle(
    currentTimeMs,
    startMs,
    finiteEnd,
    700,
    700,
  );

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background:
          "radial-gradient(circle, rgba(56,189,248,0.34) 0%, rgba(21,94,239,0.18) 38%, rgba(2,6,23,0) 74%)",
        transform: `translate(-50%, -50%) scale(${pulse})`,
        opacity:
          Number(visibility.opacity) *
          intensity *
          pulse,
        visibility: visibility.visibility,
        willChange: "opacity, transform",
      }}
    />
  );
}

export function BeamSweep({
  currentTimeMs,
  startMs = 0,
  endMs = Number.POSITIVE_INFINITY,
  className = "",
  angle = -18,
  width = 32,
  opacity = 0.5,
}: BeamSweepProps) {
  const finiteEnd = Number.isFinite(endMs)
    ? endMs
    : currentTimeMs + 1;

  const sweepProgress = easeInOut(
    progressBetween(
      currentTimeMs,
      startMs,
      finiteEnd,
    ),
  );

  const visibility = getVisibilityStyle(
    currentTimeMs,
    startMs,
    finiteEnd,
    250,
    350,
  );

  const left = lerp(-45, 125, sweepProgress);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-[-25%] z-20 blur-xl ${className}`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        background:
          "linear-gradient(90deg, transparent 0%, rgba(246,196,83,0.06) 12%, rgba(255,255,255,0.38) 48%, rgba(246,196,83,0.12) 70%, transparent 100%)",
        opacity:
          Number(visibility.opacity) *
          opacity,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "center",
        visibility: visibility.visibility,
        willChange: "left, opacity, transform",
      }}
    />
  );
}

export function CinematicBackground({
  currentTimeMs,
  startMs = 0,
  endMs = Number.POSITIVE_INFINITY,
  children,
  className = "",
  style,
}: MotionPrimitiveProps) {
  const finiteEnd = Number.isFinite(endMs)
    ? endMs
    : currentTimeMs + 1;

  const visibility = getVisibilityStyle(
    currentTimeMs,
    startMs,
    finiteEnd,
    500,
    500,
  );

  const driftX =
    Math.sin(currentTimeMs / 4200) * 1.6;

  const driftY =
    Math.cos(currentTimeMs / 5100) * 1.2;

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-slate-950 ${className}`}
      style={{
        ...visibility,
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-[-8%]"
        style={{
          background:
            "radial-gradient(circle at 50% 18%, rgba(37,99,235,0.28), transparent 38%), radial-gradient(circle at 14% 72%, rgba(56,189,248,0.15), transparent 34%), radial-gradient(circle at 88% 62%, rgba(246,196,83,0.11), transparent 32%), linear-gradient(180deg, #071B3D 0%, #020617 58%, #01030A 100%)",
          transform: `translate3d(${driftX}%, ${driftY}%, 0) scale(1.05)`,
          willChange: "transform",
        }}
      />

      <Glow
        currentTimeMs={currentTimeMs}
        endMs={finiteEnd}
        intensity={0.8}
        size={520}
        startMs={startMs}
        x="50%"
        y="26%"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage:
            "linear-gradient(to bottom, black, transparent 82%)",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.05) 0%, rgba(2,6,23,0.28) 72%, rgba(2,6,23,0.65) 100%)",
        }}
      />

      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}

export function FloatingParticles({
  currentTimeMs,
  startMs = 0,
  endMs = Number.POSITIVE_INFINITY,
  className = "",
  style,
}: MotionPrimitiveProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        left: (index * 37) % 100,
        top: (index * 53) % 100,
        size: 1 + (index % 3),
        speed: 1800 + (index % 5) * 420,
        offset: index * 290,
        opacity: 0.18 + (index % 4) * 0.07,
      })),
    [],
  );

  const visible =
    currentTimeMs >= startMs &&
    currentTimeMs <= endMs;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        visibility: visible
          ? "visible"
          : "hidden",
        ...style,
      }}
    >
      {particles.map((particle) => {
        const cycle =
          ((currentTimeMs + particle.offset) %
            particle.speed) /
          particle.speed;

        const translateY = lerp(
          18,
          -28,
          cycle,
        );

        const translateX =
          Math.sin(
            (currentTimeMs + particle.offset) /
              900,
          ) * 8;

        const particleOpacity =
          Math.sin(cycle * Math.PI) *
          particle.opacity;

        return (
          <span
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              opacity: particleOpacity,
              transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
              boxShadow:
                particle.size > 1
                  ? "0 0 12px rgba(103,232,249,0.6)"
                  : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function LighthouseMark() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-amber-300/35 bg-slate-950/65 shadow-[0_0_80px_rgba(246,196,83,0.18)] backdrop-blur-xl">
      <div className="absolute inset-2 rounded-full border border-blue-300/15" />

      <svg
        aria-hidden="true"
        className="relative h-14 w-14"
        fill="none"
        viewBox="0 0 64 64"
      >
        <path
          d="M24 54h16"
          stroke="#F6C453"
          strokeLinecap="round"
          strokeWidth="3"
        />

        <path
          d="m27 24 2-7h6l2 7"
          stroke="#F6C453"
          strokeLinejoin="round"
          strokeWidth="3"
        />

        <path
          d="M26 25h12l4 29H22l4-29Z"
          fill="url(#towerGradient)"
          stroke="#F6C453"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />

        <path
          d="M24 25h16"
          stroke="#F6C453"
          strokeLinecap="round"
          strokeWidth="3"
        />

        <path
          d="M29 17h6"
          stroke="#F6C453"
          strokeLinecap="round"
          strokeWidth="3"
        />

        <path
          d="M28 32h8M26.5 42h11"
          stroke="#38BDF8"
          strokeLinecap="round"
          strokeWidth="2"
        />

        <path
          d="M15 20 3 16M49 20l12-4"
          stroke="#F8FAFC"
          strokeLinecap="round"
          strokeWidth="3"
        />

        <defs>
          <linearGradient
            id="towerGradient"
            x1="22"
            x2="42"
            y1="25"
            y2="54"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#155EEF" />
            <stop
              offset="1"
              stopColor="#071B3D"
            />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function EndCard({
  currentTimeMs,
  startMs = 0,
  endMs = Number.POSITIVE_INFINITY,
  brand = "BEACON AI",
  headline = "Find better choices with AI.",
  subheading = "Shopping, travel, vehicles and business support in one intelligent platform.",
  website = "beacon-ai.co.uk",
  badge = "Powered by Beacon",
  className = "",
  logo,
}: EndCardProps) {
  const finiteEnd = Number.isFinite(endMs)
    ? endMs
    : currentTimeMs + 1;

  const overallOpacity = fadeWindow(
    currentTimeMs,
    startMs,
    finiteEnd,
    550,
    400,
  );

  const logoProgress = easeOutQuint(
    progressBetween(
      currentTimeMs,
      startMs,
      startMs + 650,
    ),
  );

  const titleProgress = easeOutQuart(
    progressBetween(
      currentTimeMs,
      startMs + 220,
      startMs + 900,
    ),
  );

  const bodyProgress = easeOutCubic(
    progressBetween(
      currentTimeMs,
      startMs + 420,
      startMs + 1100,
    ),
  );

  const websiteProgress = easeOutCubic(
    progressBetween(
      currentTimeMs,
      startMs + 650,
      startMs + 1250,
    ),
  );

  if (!between(currentTimeMs, startMs, finiteEnd)) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-slate-950 text-white ${className}`}
      style={{
        opacity: overallOpacity,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 28%, rgba(37,99,235,0.32), transparent 38%), radial-gradient(circle at 50% 80%, rgba(246,196,83,0.12), transparent 34%), linear-gradient(180deg, #071B3D 0%, #020617 68%, #01030A 100%)",
        }}
      />

      <Glow
        currentTimeMs={currentTimeMs}
        endMs={finiteEnd}
        intensity={0.82}
        size={560}
        startMs={startMs}
        x="50%"
        y="30%"
      />

      <FloatingParticles
        currentTimeMs={currentTimeMs}
        endMs={finiteEnd}
        startMs={startMs}
      >
        <span />
      </FloatingParticles>

      <BeamSweep
        currentTimeMs={currentTimeMs}
        endMs={Math.min(
          finiteEnd,
          startMs + 1350,
        )}
        opacity={0.72}
        startMs={startMs + 100}
        width={28}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
        <div
          style={{
            opacity: logoProgress,
            transform: `translate3d(0, ${lerp(
              28,
              0,
              logoProgress,
            )}px, 0) scale(${lerp(
              0.78,
              1,
              logoProgress,
            )})`,
          }}
        >
          {logo ?? <LighthouseMark />}
        </div>

        <div
          className="mt-7 inline-flex items-center rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.28em] text-amber-200 backdrop-blur-xl"
          style={{
            opacity: titleProgress,
            transform: `translateY(${lerp(
              18,
              0,
              titleProgress,
            )}px)`,
          }}
        >
          {badge}
        </div>

        <h1
          className="mt-5 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl"
          style={{
            opacity: titleProgress,
            transform: `translateY(${lerp(
              22,
              0,
              titleProgress,
            )}px)`,
          }}
        >
          {brand}
        </h1>

        <p
          className="mt-4 max-w-md text-xl font-extrabold tracking-tight text-slate-100 sm:text-2xl"
          style={{
            opacity: bodyProgress,
            transform: `translateY(${lerp(
              20,
              0,
              bodyProgress,
            )}px)`,
          }}
        >
          {headline}
        </p>

        <p
          className="mt-3 max-w-sm text-sm font-semibold leading-6 text-slate-300 sm:text-base"
          style={{
            opacity: bodyProgress,
            transform: `translateY(${lerp(
              16,
              0,
              bodyProgress,
            )}px)`,
          }}
        >
          {subheading}
        </p>

        <div
          className="mt-8 overflow-hidden rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-black tracking-[0.08em] text-white shadow-2xl backdrop-blur-xl"
          style={{
            opacity: websiteProgress,
            transform: `translateY(${lerp(
              18,
              0,
              websiteProgress,
            )}px) scale(${lerp(
              0.96,
              1,
              websiteProgress,
            )})`,
          }}
        >
          {website}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(246,196,83,0.8), transparent)",
        }}
      />
    </div>
  );
}