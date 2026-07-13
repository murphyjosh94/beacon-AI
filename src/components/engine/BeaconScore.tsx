type BeaconScoreProps = {
  score: number;
};

export default function BeaconScore({ score }: BeaconScoreProps) {
  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <div className="shrink-0 rounded-2xl bg-blue-950 px-5 py-4 text-center text-white shadow-lg">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-200">
        Beacon Score
      </p>

      <p className="mt-1 text-3xl font-black">{safeScore}</p>

      <p className="mt-1 text-xs font-semibold text-blue-200">out of 100</p>
    </div>
  );
}