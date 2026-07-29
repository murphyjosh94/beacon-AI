"use client";

import Link from "next/link";
import MotionPlayer from "../_components/MotionPlayer";
import {
  BeamSweep,
  between,
  CinematicBackground,
  easeOutCubic,
  easeOutQuart,
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

const SEARCH_QUERY =
  "Find me reliable wireless headphones under £100 with great battery life.";

type Recommendation = {
  name: string;
  merchant: string;
  price: string;
  score: number;
  reason: string;
  sponsored?: boolean;
};

const recommendations: Recommendation[] = [
  {
    name: "SoundCore Life Q30",
    merchant: "Amazon",
    price: "£79.99",
    score: 94,
    reason: "Strong battery life, comfort and value.",
    sponsored: true,
  },
  {
    name: "Sony WH-CH720N",
    merchant: "Currys",
    price: "£89.00",
    score: 91,
    reason: "Lightweight design with effective noise cancelling.",
  },
  {
    name: "JBL Tune 770NC",
    merchant: "Argos",
    price: "£69.99",
    score: 89,
    reason: "Long battery life with balanced everyday sound.",
  },
];

function BeaconMark({
  size = "large",
}: {
  size?: "small" | "large";
}) {
  const wrapperSize = size === "large" ? "h-20 w-20" : "h-10 w-10";
  const iconSize = size === "large" ? "h-12 w-12" : "h-6 w-6";

  return (
    <div
      className={`relative flex ${wrapperSize} items-center justify-center rounded-full border border-amber-300/35 bg-slate-950/70 shadow-[0_0_70px_rgba(246,196,83,0.2)] backdrop-blur-xl`}
    >
      <div className="absolute inset-[10%] rounded-full border border-blue-300/15" />

      <svg
        aria-hidden="true"
        className={`relative ${iconSize}`}
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
          fill="url(#beaconAiTowerGradient)"
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
            id="beaconAiTowerGradient"
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

function IntroScene({
  currentTimeMs,
}: {
  currentTimeMs: number;
}) {
  if (!between(currentTimeMs, 0, 2_450)) {
    return null;
  }

  const logoProgress = easeOutCubic(
    progressBetween(currentTimeMs, 150, 850),
  );

  const titleProgress = easeOutQuart(
    progressBetween(currentTimeMs, 500, 1_250),
  );

  const copyProgress = easeOutCubic(
    progressBetween(currentTimeMs, 850, 1_600),
  );

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={2_450}
      startMs={0}
    >
      <FloatingParticles
        currentTimeMs={currentTimeMs}
        endMs={2_450}
        startMs={0}
      >
        <span />
      </FloatingParticles>

      <Glow
        currentTimeMs={currentTimeMs}
        endMs={2_450}
        intensity={0.95}
        size={520}
        startMs={0}
        x="50%"
        y="30%"
      />

      <BeamSweep
        currentTimeMs={currentTimeMs}
        endMs={1_850}
        opacity={0.72}
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
          Beacon AI
        </h1>

        <p
          className="mt-4 max-w-sm text-lg font-bold leading-7 text-slate-200"
          style={{
            opacity: copyProgress,
            transform: `translateY(${lerp(
              18,
              0,
              copyProgress,
            )}px)`,
          }}
        >
          Smarter recommendations for shopping, travel, entertainment and
          vehicles.
        </p>
      </div>
    </CinematicBackground>
  );
}

function SearchScene({
  currentTimeMs,
}: {
  currentTimeMs: number;
}) {
  if (!between(currentTimeMs, 2_050, 4_750)) {
    return null;
  }

  const buttonProgress = easeOutCubic(
    progressBetween(currentTimeMs, 3_750, 4_250),
  );

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={4_750}
      startMs={2_050}
    >
      <Glow
        currentTimeMs={currentTimeMs}
        endMs={4_750}
        intensity={0.7}
        size={460}
        startMs={2_050}
        x="50%"
        y="42%"
      />

      <div className="relative z-10 flex h-full flex-col justify-center px-6 text-white sm:px-8">
        <FadeSlide
          className="mx-auto w-full max-w-md"
          currentTimeMs={currentTimeMs}
          endMs={4_750}
          startMs={2_200}
        >
          <div className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-slate-950/76 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <BeaconMark size="small" />

                <div>
                  <p className="text-sm font-black text-white">
                    Ask Beacon
                  </p>

                  <p className="text-[0.62rem] font-bold text-emerald-300">
                    Ready to research
                  </p>
                </div>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.58rem] font-black uppercase tracking-[0.13em] text-slate-300">
                Shopping
              </div>
            </div>

            <div className="p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                What are you looking for?
              </p>

              <div className="mt-4 min-h-36 rounded-2xl border border-blue-300/20 bg-white/[0.045] p-4 shadow-inner">
                <Typewriter
                  characterDelayMs={23}
                  className="text-base font-bold leading-7 text-white"
                  currentTimeMs={currentTimeMs}
                  startMs={2_550}
                  text={SEARCH_QUERY}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Under £100", "Long battery", "Trusted sellers"].map(
                  (filter, index) => {
                    const filterProgress = easeOutCubic(
                      progressBetween(
                        currentTimeMs,
                        3_250 + index * 120,
                        3_750 + index * 120,
                      ),
                    );

                    return (
                      <span
                        key={filter}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[0.6rem] font-black text-slate-300"
                        style={{
                          opacity: filterProgress,
                          transform: `translateY(${lerp(
                            12,
                            0,
                            filterProgress,
                          )}px)`,
                        }}
                      >
                        {filter}
                      </span>
                    );
                  },
                )}
              </div>

              <div
                className="mt-5 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-blue-500 to-cyan-400 px-5 py-3 text-sm font-black text-white shadow-[0_12px_35px_rgba(37,99,235,0.35)]"
                style={{
                  opacity: buttonProgress,
                  transform: `scale(${lerp(
                    0.94,
                    1,
                    buttonProgress,
                  )})`,
                }}
              >
                Find my best options
              </div>
            </div>
          </div>
        </FadeSlide>
      </div>
    </CinematicBackground>
  );
}

function ResearchScene({
  currentTimeMs,
}: {
  currentTimeMs: number;
}) {
  if (!between(currentTimeMs, 4_250, 6_650)) {
    return null;
  }

  const overallProgress = progressBetween(
    currentTimeMs,
    4_450,
    6_150,
  );

  const researchSteps = [
    {
      label: "Understanding your request",
      startMs: 4_500,
    },
    {
      label: "Comparing approved merchants",
      startMs: 4_900,
    },
    {
      label: "Checking price and suitability",
      startMs: 5_300,
    },
    {
      label: "Ranking the strongest choices",
      startMs: 5_700,
    },
  ];

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={6_650}
      startMs={4_250}
    >
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-white sm:px-8">
        <FadeSlide
          className="w-full max-w-md"
          currentTimeMs={currentTimeMs}
          endMs={6_650}
          startMs={4_350}
        >
          <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/78 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                  Beacon Research
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Comparing suitable options
                </h2>
              </div>

              <div className="relative h-12 w-12 shrink-0 rounded-full border-4 border-white/10">
                <div
                  className="absolute inset-[-4px] rounded-full border-4 border-transparent border-t-amber-300"
                  style={{
                    transform: `rotate(${overallProgress * 720}deg)`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {researchSteps.map((step) => {
                const progress = easeOutCubic(
                  progressBetween(
                    currentTimeMs,
                    step.startMs,
                    step.startMs + 400,
                  ),
                );

                return (
                  <div
                    key={step.label}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3.5"
                    style={{
                      opacity: progress,
                      transform: `translateX(${lerp(
                        24,
                        0,
                        progress,
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

                    <p className="text-sm font-black text-white">
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-black text-slate-400">
                <span>Research progress</span>
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

function ProductVisual({
  index,
}: {
  index: number;
}) {
  const gradients = [
    "from-slate-900 via-blue-950 to-slate-950",
    "from-slate-800 via-slate-900 to-blue-950",
    "from-blue-950 via-slate-900 to-slate-950",
  ];

  return (
    <div
      className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[index]}`}
    >
      <div className="absolute h-14 w-14 rounded-full border-[7px] border-slate-300/80" />

      <div className="absolute left-[18px] h-10 w-4 rounded-full bg-slate-200 shadow-lg" />

      <div className="absolute right-[18px] h-10 w-4 rounded-full bg-slate-200 shadow-lg" />

      <div className="absolute top-[17px] h-10 w-12 rounded-t-full border-[5px] border-b-0 border-slate-300/80" />
    </div>
  );
}

function RecommendationCard({
  currentTimeMs,
  recommendation,
  index,
}: {
  currentTimeMs: number;
  recommendation: Recommendation;
  index: number;
}) {
  const startMs = 6_450 + index * 380;

  const cardProgress = easeOutQuart(
    progressBetween(currentTimeMs, startMs, startMs + 650),
  );

  const scoreProgress = easeOutCubic(
    progressBetween(currentTimeMs, startMs + 250, startMs + 900),
  );

  return (
    <div
      className="relative rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-3.5 shadow-xl backdrop-blur-xl"
      style={{
        opacity: cardProgress,
        transform: `translateY(${lerp(
          34,
          0,
          cardProgress,
        )}px) scale(${lerp(0.96, 1, cardProgress)})`,
      }}
    >
      {recommendation.sponsored && (
        <div className="absolute right-3 top-3 z-10 rounded-full border border-amber-300/25 bg-amber-300/15 px-2.5 py-1 text-[0.48rem] font-black uppercase tracking-[0.12em] text-amber-200 backdrop-blur-xl">
          Sponsored
        </div>
      )}

      <div className="flex gap-3">
        <ProductVisual index={index} />

        <div className="min-w-0 flex-1">
          <p className="pr-14 text-xs font-bold text-cyan-200">
            {recommendation.merchant}
          </p>

          <h3 className="mt-1 text-base font-black leading-5 text-white">
            {recommendation.name}
          </h3>

          <p className="mt-1 text-lg font-black text-amber-200">
            {recommendation.price}
          </p>

          <p className="mt-2 text-[0.62rem] font-semibold leading-4 text-slate-400">
            {recommendation.reason}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-950">
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 40 40"
            >
              <circle
                cx="20"
                cy="20"
                fill="none"
                r="16"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />

              <circle
                cx="20"
                cy="20"
                fill="none"
                r="16"
                stroke="#34D399"
                strokeDasharray="100.53"
                strokeDashoffset={
                  100.53 -
                  100.53 *
                    ((recommendation.score / 100) * scoreProgress)
                }
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>

            <span className="relative text-[0.58rem] font-black text-white">
              {Math.round(recommendation.score * scoreProgress)}
            </span>
          </div>

          <div>
            <p className="text-[0.54rem] font-black uppercase tracking-[0.12em] text-slate-400">
              Trust score
            </p>

            <p className="text-[0.62rem] font-bold text-emerald-300">
              Strong match
            </p>
          </div>
        </div>

        <div className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-[0.58rem] font-black text-white">
          View offer
        </div>
      </div>
    </div>
  );
}

function ResultsScene({
  currentTimeMs,
}: {
  currentTimeMs: number;
}) {
  if (!between(currentTimeMs, 6_050, 10_650)) {
    return null;
  }

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={10_650}
      startMs={6_050}
    >
      <BeamSweep
        currentTimeMs={currentTimeMs}
        endMs={7_500}
        opacity={0.42}
        startMs={6_150}
        width={24}
      />

      <div className="relative z-10 h-full overflow-hidden px-5 py-7 text-white">
        <FadeSlide
          currentTimeMs={currentTimeMs}
          endMs={10_650}
          startMs={6_100}
        >
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  Beacon recommendations
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Best matches found
                </h2>
              </div>

              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[0.58rem] font-black uppercase tracking-[0.12em] text-emerald-200">
                3 results
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={recommendation.name}
                  currentTimeMs={currentTimeMs}
                  index={index}
                  recommendation={recommendation}
                />
              ))}
            </div>
          </div>
        </FadeSlide>
      </div>
    </CinematicBackground>
  );
}

function TrustScene({
  currentTimeMs,
}: {
  currentTimeMs: number;
}) {
  if (!between(currentTimeMs, 9_950, 13_350)) {
    return null;
  }

  const scoreProgress = easeOutCubic(
    progressBetween(currentTimeMs, 10_400, 11_450),
  );

  const checks = [
    "Approved merchant",
    "Price checked",
    "Suitability reviewed",
    "Clear sponsored label",
  ];

  return (
    <CinematicBackground
      currentTimeMs={currentTimeMs}
      endMs={13_350}
      startMs={9_950}
    >
      <Glow
        currentTimeMs={currentTimeMs}
        endMs={13_350}
        intensity={0.7}
        size={500}
        startMs={9_950}
        x="50%"
        y="36%"
      />

      <div className="relative z-10 flex h-full items-center justify-center px-6 text-white sm:px-8">
        <ScaleIn
          className="w-full max-w-md"
          currentTimeMs={currentTimeMs}
          endMs={13_350}
          startMs={10_050}
        >
          <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/78 p-5 text-center shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
              Beacon Trust Score
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Confidence before you click
            </h2>

            <div className="relative mx-auto mt-7 flex h-40 w-40 items-center justify-center rounded-full bg-slate-950 shadow-[0_0_80px_rgba(52,211,153,0.15)]">
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full -rotate-90"
                viewBox="0 0 160 160"
              >
                <circle
                  cx="80"
                  cy="80"
                  fill="none"
                  r="66"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="10"
                />

                <circle
                  cx="80"
                  cy="80"
                  fill="none"
                  r="66"
                  stroke="url(#trustScoreGradient)"
                  strokeDasharray="414.69"
                  strokeDashoffset={
                    414.69 - 414.69 * (0.94 * scoreProgress)
                  }
                  strokeLinecap="round"
                  strokeWidth="10"
                />

                <defs>
                  <linearGradient
                    id="trustScoreGradient"
                    x1="20"
                    x2="140"
                    y1="20"
                    y2="140"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#38BDF8" />
                    <stop offset="0.55" stopColor="#34D399" />
                    <stop offset="1" stopColor="#F6C453" />
                  </linearGradient>
                </defs>
              </svg>

              <div>
                <p className="text-5xl font-black tracking-[-0.06em]">
                  {Math.round(94 * scoreProgress)}
                </p>

                <p className="mt-1 text-[0.6rem] font-black uppercase tracking-[0.14em] text-emerald-300">
                  Excellent match
                </p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 text-left">
              {checks.map((check, index) => {
                const progress = easeOutCubic(
                  progressBetween(
                    currentTimeMs,
                    10_900 + index * 140,
                    11_450 + index * 140,
                  ),
                );

                return (
                  <div
                    key={check}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] p-3"
                    style={{
                      opacity: progress,
                      transform: `translateY(${lerp(
                        14,
                        0,
                        progress,
                      )}px)`,
                    }}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
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

                    <p className="text-[0.6rem] font-black text-slate-200">
                      {check}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </ScaleIn>
      </div>
    </CinematicBackground>
  );
}

function BeaconAiMotionReel({
  currentTimeMs,
}: {
  currentTimeMs: number;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <IntroScene currentTimeMs={currentTimeMs} />
      <SearchScene currentTimeMs={currentTimeMs} />
      <ResearchScene currentTimeMs={currentTimeMs} />
      <ResultsScene currentTimeMs={currentTimeMs} />
      <TrustScene currentTimeMs={currentTimeMs} />

      <EndCard
        badge="AI-powered recommendations"
        brand="BEACON AI"
        currentTimeMs={currentTimeMs}
        endMs={DURATION_MS}
        headline="Search smarter. Choose with confidence."
        startMs={13_000}
        subheading="Shopping, travel, entertainment and vehicle recommendations researched around what matters to you."
        website="beacon-ai.co.uk"
      />
    </div>
  );
}

export default function BeaconAiDemoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_36%),linear-gradient(180deg,#020617_0%,#071126_50%,#020617_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-200">
              Beacon Motion
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Beacon AI launch reel
            </h1>

            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-400">
              A cinematic demonstration of Beacon researching products,
              comparing trusted merchants and presenting clear recommendations
              with transparent trust scoring.
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
              href="/personal"
            >
              Open Beacon AI
            </Link>
          </div>
        </div>

        <MotionPlayer
          aspectRatio="9:16"
          autoPlay
          durationMs={DURATION_MS}
          loop
          subtitle="Beacon AI · 15-second vertical reel"
          title="Beacon AI Launch"
        >
          {(currentTimeMs) => (
            <BeaconAiMotionReel currentTimeMs={currentTimeMs} />
          )}
        </MotionPlayer>
      </div>
    </main>
  );
}