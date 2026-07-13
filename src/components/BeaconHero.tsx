import BeaconSearch from "@/components/BeaconSearch";

export default function BeaconHero() {
  return (
    <section className="relative isolate min-h-[760px] overflow-hidden bg-slate-950 text-white">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/media/posters/beacon-hero.png"
        className="absolute inset-0 -z-30 h-full w-full object-cover"
      >
        <source src="/media/hero/beacon-hero-v1.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 -z-20 bg-slate-950/25" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-slate-950/10 via-slate-950/40 to-slate-950/88" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/20" />

      <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-center px-6 py-20">
        <div className="ml-auto w-full max-w-3xl text-right">
          <p className="text-sm font-extrabold uppercase tracking-[0.35em] text-blue-100">
            Welcome to Beacon AI
          </p>

          <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight text-white drop-shadow-2xl sm:text-6xl xl:text-7xl">
            Your Personal
            <br />
            AI Shopper
          </h1>

          <p className="ml-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-blue-50 drop-shadow">
            Tell Beacon what you need. We research trusted partners, compare
            the strongest options and bring you five recommendations tailored
            to your budget, preferences and priorities.
          </p>

          <div className="mt-10">
            <BeaconSearch />
          </div>

          <div className="ml-auto mt-8 grid max-w-2xl gap-3 text-sm font-bold text-blue-50 sm:grid-cols-2">
            <span>✓ Five carefully selected options</span>
            <span>✓ Clear Beacon Score explanations</span>
            <span>✓ Trusted partner recommendations</span>
            <span>✓ No overwhelming result pages</span>
          </div>
        </div>
      </div>
    </section>
  );
}