"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DemoCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
  category: "Beacon AI" | "Beacon Business";
  duration: string;
  ready: boolean;
};

const demos: DemoCard[] = [
  {
    title: "Beacon AI Launch Reel",
    description: "Natural-language search, trusted recommendations and the Beacon AI end card.",
    href: "/demo/beacon-ai",
    icon: "✨",
    category: "Beacon AI",
    duration: "15 seconds",
    ready: true,
  },
  {
    title: "Beacon Business Launch Reel",
    description: "A scripted website build and AI quote sequence with the Beacon Business end card.",
    href: "/demo/beacon-business",
    icon: "🏢",
    category: "Beacon Business",
    duration: "15 seconds",
    ready: true,
  },
  {
    title: "Shopping",
    description: "Search, compare and reveal five trusted shopping recommendations.",
    href: "/demo/shopping",
    icon: "🛍️",
    category: "Beacon AI",
    duration: "15 seconds",
    ready: false,
  },
  {
    title: "Travel",
    description: "Turn a holiday request into a clear shortlist of suitable options.",
    href: "/demo/travel",
    icon: "✈️",
    category: "Beacon AI",
    duration: "15 seconds",
    ready: false,
  },
  {
    title: "Vehicle Parts",
    description: "Use a saved vehicle profile to locate compatible parts.",
    href: "/demo/vehicle",
    icon: "🚗",
    category: "Beacon AI",
    duration: "15 seconds",
    ready: false,
  },
  {
    title: "AI Quote",
    description: "Generate a polished customer quotation from a short job description.",
    href: "/demo/quote",
    icon: "📋",
    category: "Beacon Business",
    duration: "15 seconds",
    ready: false,
  },
];

export default function DemoDashboard() {
  const [filter, setFilter] = useState<"All" | DemoCard["category"]>("All");
  const visibleDemos = useMemo(
    () => (filter === "All" ? demos : demos.filter((demo) => demo.category === filter)),
    [filter],
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-5 py-16 sm:px-8 lg:px-12">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.34),transparent_36%),radial-gradient(circle_at_82%_8%,rgba(245,158,11,0.18),transparent_32%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-300">Internal production tool</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Beacon Motion</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">Scripted product demonstrations for reels, launch videos, walkthroughs and future Beacon Studios exports.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Production format</p>
              <p className="mt-2 text-2xl font-black">1080 × 1920 · 9:16</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">Autoplay · Restart · Full-screen ready</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {(["All", "Beacon AI", "Beacon Business"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full px-5 py-3 text-sm font-extrabold transition ${filter === option ? "bg-amber-300 text-blue-950" : "border border-white/15 bg-white/5 text-white hover:bg-white/10"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleDemos.map((demo) => (
            <article key={demo.title} className="group flex min-h-80 flex-col rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-blue-400/40">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900 text-2xl shadow-lg">{demo.icon}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${demo.ready ? "bg-emerald-400/15 text-emerald-200" : "bg-slate-700 text-slate-300"}`}>
                  {demo.ready ? "Ready" : "Planned"}
                </span>
              </div>
              <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-blue-300">{demo.category}</p>
              <h2 className="mt-2 text-2xl font-black">{demo.title}</h2>
              <p className="mt-4 flex-1 leading-7 text-slate-300">{demo.description}</p>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <span className="text-sm font-bold text-slate-400">{demo.duration}</span>
                {demo.ready ? (
                  <Link href={demo.href} className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-950 transition hover:bg-amber-200">Open reel</Link>
                ) : (
                  <span className="rounded-xl border border-white/10 px-5 py-3 text-sm font-extrabold text-slate-500">Coming next</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
