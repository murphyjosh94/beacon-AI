"use client";

import Link from "next/link";
import MotionPlayer from "../_components/MotionPlayer";
import {
  BeamSweep,
  between,
  CinematicBackground,
  easeOutCubic,
  EndCard,
  FadeSlide,
  FloatingParticles,
  Glow,
  lerp,
  progressBetween,
  ScaleIn,
  Typewriter,
} from "../_components/MotionPrimitives";

const DURATION_MS = 15_000;

const brief =
  "Create a modern website for a trusted roofing company in Cardiff.";

const buildSteps = [
  {
    label: "Business profile",
    detail: "Roofing services · Cardiff",
    startMs: 4_100,
  },
  {
    label: "Brand direction",
    detail: "Professional · Trusted · Local",
    startMs: 4_550,
  },
  {
    label: "Website structure",
    detail: "Home · Services · Reviews · Contact",
    startMs: 5_000,
  },
  {
    label: "Mobile optimisation",
    detail: "Responsive layout prepared",
    startMs: 5_450,
  },
];

const analytics = [
  {
    label: "Website visits",
    value: "1,284",
    change: "+18%",
  },
  {
    label: "Quote requests",
    value: "42",
    change: "+12%",
  },
  {
    label: "Call clicks",
    value: "67",
    change: "+23%",
  },
];

function BeaconMark() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/35 bg-slate-950/70 shadow-[0_0_70px_rgba(246,196,83,0.2)] backdrop-blur-xl">
      <div className="absolute inset-2 rounded-full border border-blue-300/15" />

      <svg
        aria-hidden="true"
        className="relative h-12 w-12"
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
          fill="url(#businessTowerGradient)"
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
            id="businessTowerGradient"
            x1="22"
            x2="42"
            y1="25"
            y2="54"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#155EEF" />
            <stop offset="1" stopColor="#071B3D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function IntroScene({ currentTimeMs }: { currentTimeMs: number }) {
  if (!between(currentTimeMs, 0, 2_500)) {
    return null;
  }

  const logoProgress = easeOutCubic(
    progressBetween(currentTimeMs, 150, 850),
  );

  const titleProgress = easeOutCubic(
    progressBetween(currentTimeMs, 500, 1_250),
  );

  const subtitleProgress = easeOutCubic(
    progressBetween(currentTimeMs, 850, 1_550),
  );

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={2_500}
      startMs={0}
    >
      <FloatingParticles
        currentTimeMs={currentTimeMs}
        endMs={2_500}
        startMs={0}
      >
        <span />
      </FloatingParticles>

      <Glow
        currentTimeMs={currentTimeMs}
        endMs={2_500}
        intensity={0.9}
        size={500}
        startMs={0}
        x="50%"
        y="30%"
      />

      <BeamSweep
        currentTimeMs={currentTimeMs}
        endMs={1_800}
        opacity={0.7}
        startMs={250}
        width={28}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center text-white">
        <div
          style={{
            opacity: logoProgress,
            transform: `translateY(${lerp(
              28,
              0,
              logoProgress,
            )}px) scale(${lerp(0.8, 1, logoProgress)})`,
          }}
        >
          <BeaconMark />
        </div>

        <div
          className="mt-7 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.28em] text-amber-200 backdrop-blur-xl"
          style={{
            opacity: titleProgress,
            transform: `translateY(${lerp(
              18,
              0,
              titleProgress,
            )}px)`,
          }}
        >
          Beacon Motion
        </div>

        <h1
          className="mt-5 text-4xl font-black tracking-[-0.055em] sm:text-5xl"
          style={{
            opacity: titleProgress,
            transform: `translateY(${lerp(
              22,
              0,
              titleProgress,
            )}px)`,
          }}
        >
          Beacon Business
        </h1>

        <p
          className="mt-4 max-w-sm text-lg font-bold leading-7 text-slate-200"
          style={{
            opacity: subtitleProgress,
            transform: `translateY(${lerp(
              18,
              0,
              subtitleProgress,
            )}px)`,
          }}
        >
          Websites and business support powered by AI.
        </p>
      </div>
    </CinematicBackground>
  );
}

function PromptScene({ currentTimeMs }: { currentTimeMs: number }) {
  if (!between(currentTimeMs, 2_100, 4_650)) {
    return null;
  }

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={4_650}
      startMs={2_100}
    >
      <Glow
        currentTimeMs={currentTimeMs}
        endMs={4_650}
        intensity={0.7}
        size={460}
        startMs={2_100}
        x="50%"
        y="42%"
      />

      <div className="relative z-10 flex h-full flex-col justify-center px-6 text-white sm:px-8">
        <FadeSlide
          className="mx-auto w-full max-w-md"
          currentTimeMs={currentTimeMs}
          endMs={4_650}
          startMs={2_250}
        >
          <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/72 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                  Website Builder
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Describe the business you want to build for.
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-500/10">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 5h16v14H4z" />
                  <path d="M4 9h16" />
                  <path d="M8 14h3" />
                  <path d="M8 17h7" />
                </svg>
              </div>
            </div>

            <div className="mt-5 min-h-32 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <Typewriter
                characterDelayMs={28}
                className="text-base font-bold leading-7 text-white"
                currentTimeMs={currentTimeMs}
                startMs={2_650}
                text={brief}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                AI ready
              </div>

              <div className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 text-xs font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)]">
                Generate website
              </div>
            </div>
          </div>
        </FadeSlide>
      </div>
    </CinematicBackground>
  );
}

function BuildScene({ currentTimeMs }: { currentTimeMs: number }) {
  if (!between(currentTimeMs, 3_900, 6_650)) {
    return null;
  }

  const overallProgress = progressBetween(
    currentTimeMs,
    4_050,
    6_150,
  );

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={6_650}
      startMs={3_900}
    >
      <div className="relative z-10 flex h-full flex-col justify-center px-6 text-white sm:px-8">
        <FadeSlide
          className="mx-auto w-full max-w-md"
          currentTimeMs={currentTimeMs}
          endMs={6_650}
          startMs={4_000}
        >
          <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/76 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                  Beacon is building
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Creating your website
                </h2>
              </div>

              <div className="relative h-12 w-12 rounded-full border-4 border-white/10">
                <div
                  className="absolute inset-[-4px] rounded-full border-4 border-transparent border-t-amber-300"
                  style={{
                    transform: `rotate(${overallProgress * 720}deg)`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {buildSteps.map((step) => {
                const stepProgress = easeOutCubic(
                  progressBetween(
                    currentTimeMs,
                    step.startMs,
                    step.startMs + 450,
                  ),
                );

                return (
                  <div
                    key={step.label}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3.5"
                    style={{
                      opacity: stepProgress,
                      transform: `translateX(${lerp(
                        26,
                        0,
                        stepProgress,
                      )}px)`,
                    }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {step.label}
                      </p>

                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-black text-slate-400">
                <span>Website progress</span>
                <span>{Math.round(overallProgress * 100)}%</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-amber-300"
                  style={{
                    width: `${overallProgress * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </FadeSlide>
      </div>
    </CinematicBackground>
  );
}

function WebsitePreviewScene({
  currentTimeMs,
}: {
  currentTimeMs: number;
}) {
  if (!between(currentTimeMs, 6_100, 10_150)) {
    return null;
  }

  const pageProgress = easeOutCubic(
    progressBetween(currentTimeMs, 6_250, 7_000),
  );

  const serviceProgress = easeOutCubic(
    progressBetween(currentTimeMs, 7_050, 7_800),
  );

  const reviewProgress = easeOutCubic(
    progressBetween(currentTimeMs, 7_650, 8_400),
  );

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={10_150}
      startMs={6_100}
    >
      <BeamSweep
        currentTimeMs={currentTimeMs}
        endMs={7_600}
        opacity={0.45}
        startMs={6_250}
        width={24}
      />

      <div className="relative z-10 flex h-full items-center justify-center px-4 py-8 text-white">
        <ScaleIn
          className="w-full max-w-md"
          currentTimeMs={currentTimeMs}
          endMs={10_150}
          startMs={6_200}
        >
          <div
            className="overflow-hidden rounded-[1.6rem] border border-white/15 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
            style={{
              opacity: pageProgress,
              transform: `translateY(${lerp(
                26,
                0,
                pageProgress,
              )}px)`,
            }}
          >
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              <div className="ml-2 flex-1 rounded-full bg-white px-3 py-1.5 text-center text-[0.6rem] font-bold text-slate-500">
                cardiffroofing.co.uk
              </div>
            </div>

            <div className="bg-[#071B3D] px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-black tracking-tight">
                    Cardiff Roofing
                  </p>

                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-amber-300">
                    Trusted local specialists
                  </p>
                </div>

                <div className="rounded-full bg-amber-300 px-3 py-2 text-[0.62rem] font-black text-slate-950">
                  Get a quote
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-950 px-5 py-8 text-white">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, transparent 46%, rgba(255,255,255,0.16) 47%, rgba(255,255,255,0.16) 53%, transparent 54%)",
                  backgroundSize: "38px 38px",
                }}
              />

              <div className="relative z-10">
                <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.58rem] font-black uppercase tracking-[0.14em] backdrop-blur">
                  Roofing across Cardiff
                </div>

                <h2 className="mt-4 max-w-xs text-3xl font-black leading-[1.03] tracking-[-0.05em]">
                  Reliable roofing built to last.
                </h2>

                <p className="mt-3 max-w-xs text-xs font-semibold leading-5 text-slate-200">
                  Repairs, replacements and emergency call-outs from a local
                  team you can trust.
                </p>

                <div className="mt-5 flex gap-2">
                  <div className="rounded-full bg-amber-300 px-4 py-2.5 text-[0.62rem] font-black text-slate-950">
                    Request a quote
                  </div>

                  <div className="rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-[0.62rem] font-black backdrop-blur">
                    View services
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white px-5 py-5 text-slate-950">
              <div
                className="grid grid-cols-3 gap-2"
                style={{
                  opacity: serviceProgress,
                  transform: `translateY(${lerp(
                    18,
                    0,
                    serviceProgress,
                  )}px)`,
                }}
              >
                {["Roof Repairs", "New Roofs", "Emergency Help"].map(
                  (service) => (
                    <div
                      key={service}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"
                    >
                      <div className="mx-auto h-7 w-7 rounded-full bg-blue-100" />
                      <p className="mt-2 text-[0.58rem] font-black">
                        {service}
                      </p>
                    </div>
                  ),
                )}
              </div>

              <div
                className="mt-4 rounded-xl bg-slate-950 p-4 text-white"
                style={{
                  opacity: reviewProgress,
                  transform: `translateY(${lerp(
                    18,
                    0,
                    reviewProgress,
                  )}px)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.15em] text-amber-300">
                      Customer rating
                    </p>

                    <p className="mt-1 text-lg font-black">
                      4.9 / 5
                    </p>
                  </div>

                  <div className="text-sm tracking-[0.1em] text-amber-300">
                    ★★★★★
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScaleIn>
      </div>
    </CinematicBackground>
  );
}

function BrandKitScene({ currentTimeMs }: { currentTimeMs: number }) {
  if (!between(currentTimeMs, 9_500, 12_000)) {
    return null;
  }

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={12_000}
      startMs={9_500}
    >
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-white sm:px-8">
        <FadeSlide
          className="w-full max-w-md"
          currentTimeMs={currentTimeMs}
          endMs={12_000}
          startMs={9_650}
        >
          <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/78 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                  Brand Kit
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  One identity. Everywhere.
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                  Beacon keeps the business consistent across its website,
                  documents and social content.
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                  <path d="M12 3a9 9 0 1 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h2a7 7 0 0 0 7-7c0-2.2-4-4-9-4Z" />
                </svg>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-slate-400">
                  Logo
                </p>

                <div className="mt-4 flex h-28 items-center justify-center rounded-xl bg-white">
                  <div className="text-center text-slate-950">
                    <div className="mx-auto h-10 w-10 rounded-full bg-[#071B3D]" />
                    <p className="mt-2 text-sm font-black">
                      Cardiff Roofing
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-slate-400">
                    Colours
                  </p>

                  <div className="mt-3 flex gap-2">
                    {["#071B3D", "#F6C453", "#F8FAFC"].map(
                      (colour) => (
                        <span
                          key={colour}
                          className="h-9 flex-1 rounded-xl border border-white/10"
                          style={{ backgroundColor: colour }}
                        />
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-slate-400">
                    Typography
                  </p>

                  <p className="mt-3 text-lg font-black tracking-tight">
                    Professional
                  </p>

                  <p className="text-xs font-semibold text-slate-400">
                    Clear and dependable
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {["Social posts", "Website assets", "Documents"].map(
                (asset) => (
                  <div
                    key={asset}
                    className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-3 text-center text-[0.6rem] font-black text-slate-200"
                  >
                    {asset}
                  </div>
                ),
              )}
            </div>
          </div>
        </FadeSlide>
      </div>
    </CinematicBackground>
  );
}

function AnalyticsScene({ currentTimeMs }: { currentTimeMs: number }) {
  if (!between(currentTimeMs, 11_250, 13_500)) {
    return null;
  }

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={13_500}
      startMs={11_250}
    >
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-white sm:px-8">
        <FadeSlide
          className="w-full max-w-md"
          currentTimeMs={currentTimeMs}
          endMs={13_500}
          startMs={11_400}
        >
          <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/78 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                  Business Analytics
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  See what is working
                </h2>
              </div>

              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[0.6rem] font-black uppercase tracking-[0.12em] text-emerald-200">
                Live
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {analytics.map((metric, index) => {
                const metricProgress = easeOutCubic(
                  progressBetween(
                    currentTimeMs,
                    11_650 + index * 150,
                    12_250 + index * 150,
                  ),
                );

                return (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"
                    style={{
                      opacity: metricProgress,
                      transform: `translateY(${lerp(
                        18,
                        0,
                        metricProgress,
                      )}px)`,
                    }}
                  >
                    <p className="text-[0.55rem] font-bold leading-4 text-slate-400">
                      {metric.label}
                    </p>

                    <p className="mt-2 text-lg font-black">
                      {metric.value}
                    </p>

                    <p className="mt-1 text-[0.58rem] font-black text-emerald-300">
                      {metric.change}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-white">
                  Enquiries this month
                </p>

                <p className="text-[0.6rem] font-bold text-slate-400">
                  Last 30 days
                </p>
              </div>

              <div className="mt-5 flex h-32 items-end gap-2">
                {[38, 55, 44, 72, 62, 86, 78, 96].map(
                  (height, index) => {
                    const barProgress = easeOutCubic(
                      progressBetween(
                        currentTimeMs,
                        11_900 + index * 80,
                        12_450 + index * 80,
                      ),
                    );

                    return (
                      <div
                        key={`${height}-${index}`}
                        className="flex h-full flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-300"
                          style={{
                            height: `${height * barProgress}%`,
                          }}
                        />
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-300/15 text-amber-200">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v18" />
                  <path d="m17 8-5-5-5 5" />
                  <path d="m17 16-5 5-5-5" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-black text-white">
                  Performance improving
                </p>

                <p className="mt-0.5 text-[0.62rem] font-semibold text-slate-400">
                  Quote requests increased this month.
                </p>
              </div>
            </div>
          </div>
        </FadeSlide>
      </div>
    </CinematicBackground>
  );
}

function BusinessMotionReel({
  currentTimeMs,
}: {
  currentTimeMs: number;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <IntroScene currentTimeMs={currentTimeMs} />
      <PromptScene currentTimeMs={currentTimeMs} />
      <BuildScene currentTimeMs={currentTimeMs} />
      <WebsitePreviewScene currentTimeMs={currentTimeMs} />
      <BrandKitScene currentTimeMs={currentTimeMs} />
      <AnalyticsScene currentTimeMs={currentTimeMs} />

      <EndCard
        badge="Websites and business support"
        brand="BEACON BUSINESS"
        currentTimeMs={currentTimeMs}
        endMs={DURATION_MS}
        headline="Build your business with confidence."
        startMs={13_000}
        subheading="Professional websites, branding, AI tools and ongoing support in one intelligent platform."
        website="beacon-ai.co.uk/business"
      />
    </div>
  );
}

export default function BeaconBusinessDemoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_36%),linear-gradient(180deg,#020617_0%,#071126_50%,#020617_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-200">
              Beacon Motion
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Beacon Business launch reel
            </h1>

            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-400">
              A cinematic product demonstration showing how Beacon can turn a
              simple business brief into a professional website, brand system
              and measurable growth platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:border-white/20 hover:bg-white/10"
              href="/demo"
            >
              Back to Motion
            </Link>

            <Link
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-3 text-sm font-black text-white shadow-[0_12px_35px_rgba(37,99,235,0.3)] transition hover:scale-[1.02]"
              href="/business"
            >
              Open Beacon Business
            </Link>
          </div>
        </div>

        <MotionPlayer
          aspectRatio="9:16"
          autoPlay
          durationMs={DURATION_MS}
          loop
          subtitle="Beacon Business · 15-second vertical reel"
          title="Beacon Business Launch"
        >
          {(currentTimeMs) => (
            <BusinessMotionReel currentTimeMs={currentTimeMs} />
          )}
        </MotionPlayer>
      </div>
    </main>
  );
}