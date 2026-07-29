import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Beacon Studio Dashboard | Creative Workspace",
  description:
    "Manage Studio Credits, launch AI creative tools, review recent projects and organise brand assets from your Beacon Studio dashboard.",
};

const overviewCards = [
  {
    label: "Studio Credits",
    value: "487",
    detail: "Available balance",
    href: "/studio/pricing",
    action: "Buy credits",
  },
  {
    label: "Membership",
    value: "Studio Business",
    detail: "800 credits included monthly",
    href: "/studio/memberships",
    action: "Manage plan",
  },
  {
    label: "AI Generations",
    value: "42",
    detail: "Created this month",
    href: "#recent-projects",
    action: "View projects",
  },
  {
    label: "Projects",
    value: "18",
    detail: "Saved in your workspace",
    href: "#recent-projects",
    action: "Open library",
  },
] as const;

const quickCreateTools = [
  {
    title: "AI Images",
    description:
      "Generate polished product images, campaign visuals and custom creative assets.",
    icon: "✦",
    cost: "From 10 credits",
    href: "/studio/dashboard?tool=images",
  },
  {
    title: "Logo Generator",
    description:
      "Create professional logo concepts for businesses, brands and new ideas.",
    icon: "◉",
    cost: "From 40 credits",
    href: "/studio/dashboard?tool=logos",
  },
  {
    title: "Brand Kits",
    description:
      "Build a complete visual identity including logos, colours and brand direction.",
    icon: "◆",
    cost: "From 150 credits",
    href: "/studio/dashboard?tool=brand-kits",
  },
  {
    title: "Presentations",
    description:
      "Turn ideas, briefs and documents into structured presentation decks.",
    icon: "▤",
    cost: "From 80 credits",
    href: "/studio/dashboard?tool=presentations",
  },
  {
    title: "Documents",
    description:
      "Create polished proposals, reports, guides and business documents.",
    icon: "▧",
    cost: "From 30 credits",
    href: "/studio/dashboard?tool=documents",
  },
  {
    title: "Social Posts",
    description:
      "Generate ready-to-publish graphics for social media campaigns.",
    icon: "◎",
    cost: "From 20 credits",
    href: "/studio/dashboard?tool=social",
  },
  {
    title: "Campaign Builder",
    description:
      "Create coordinated marketing assets for launches, offers and promotions.",
    icon: "↗",
    cost: "From 300 credits",
    href: "/studio/dashboard?tool=campaigns",
  },
  {
    title: "AI Video",
    description:
      "Create short promotional videos, reels, product clips and explainers.",
    icon: "▶",
    cost: "From 300 credits",
    href: "/studio/dashboard?tool=video",
  },
] as const;

const recentProjects = [
  {
    name: "Summer Campaign Hero",
    type: "AI Image",
    date: "29 Jul 2026",
    credits: "18 credits",
    status: "Complete",
  },
  {
    name: "Beacon Partner Presentation",
    type: "Presentation",
    date: "28 Jul 2026",
    credits: "96 credits",
    status: "Complete",
  },
  {
    name: "Local Business Brand Kit",
    type: "Brand Kit",
    date: "27 Jul 2026",
    credits: "165 credits",
    status: "Complete",
  },
  {
    name: "Launch Reel Concept",
    type: "AI Video",
    date: "26 Jul 2026",
    credits: "420 credits",
    status: "Processing",
  },
] as const;

const brandAssets = [
  {
    title: "Logos",
    count: "12 assets",
    description: "Primary marks, icons and approved logo variants.",
  },
  {
    title: "Colour Palettes",
    count: "6 palettes",
    description: "Saved brand colours for consistent creative work.",
  },
  {
    title: "Typography",
    count: "4 systems",
    description: "Approved heading, body and display font pairings.",
  },
  {
    title: "Brand Guidelines",
    count: "3 guides",
    description: "Reference documents for tone, layout and visual usage.",
  },
] as const;

const usageStats = [
  {
    label: "Credits used",
    value: "313",
    detail: "of 800 monthly credits",
    progress: "39%",
  },
  {
    label: "Images created",
    value: "28",
    detail: "this month",
    progress: "70%",
  },
  {
    label: "Videos created",
    value: "3",
    detail: "this month",
    progress: "30%",
  },
  {
    label: "Documents created",
    value: "11",
    detail: "this month",
    progress: "55%",
  },
] as const;

const featuredTools = [
  {
    badge: "New",
    title: "Website Hero Pack",
    description:
      "Generate a complete set of coordinated hero assets for a website launch.",
    href: "/studio/dashboard?tool=hero-pack",
  },
  {
    badge: "Improved",
    title: "Presentation Builder",
    description:
      "Create clearer layouts, stronger structure and more polished visual storytelling.",
    href: "/studio/dashboard?tool=presentations",
  },
  {
    badge: "Coming Soon",
    title: "Shared Team Workspace",
    description:
      "Invite collaborators, manage approvals and organise creative assets together.",
    href: "/studio/memberships",
  },
] as const;

const guides = [
  {
    title: "Getting Started with Studio",
    description:
      "Learn how credits, projects and generation approvals work.",
  },
  {
    title: "Writing Better Creative Prompts",
    description:
      "Use clear goals, style direction and audience context for stronger results.",
  },
  {
    title: "Building a Consistent Brand Kit",
    description:
      "Create reusable brand assets that stay consistent across every campaign.",
  },
  {
    title: "Planning AI Video Content",
    description:
      "Understand duration, scenes, quality settings and credit usage before rendering.",
  },
] as const;

function ProgressBar({ value }: { value: string }) {
  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-blue-950"
        style={{ width: value }}
      />
    </div>
  );
}

export default function StudioDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(245,158,11,0.16),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent"
        />

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-sm font-extrabold text-blue-100">
                <span aria-hidden="true">✦</span>
                <span>Beacon Studio Dashboard</span>
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                Good afternoon, Josh.
              </h1>

              <p className="mt-4 max-w-3xl text-lg font-medium leading-8 text-slate-300">
                Welcome back to your creative workspace. Choose a tool, continue
                a project or review your current Studio Credit usage.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/studio/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Buy Credits
              </Link>
              <Link
                href="/studio/memberships"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Upgrade Membership
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-4 text-3xl font-black tracking-tight text-blue-950">
                {card.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {card.detail}
              </p>
              <Link
                href={card.href}
                className="mt-5 inline-flex font-black text-blue-800 transition hover:text-blue-950"
              >
                {card.action}
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
              Quick Create
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Start a new creative project.
            </h2>
          </div>
          <Link
            href="/studio/pricing"
            className="font-black text-blue-800 transition hover:text-blue-950"
          >
            View rendering costs →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {quickCreateTools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-950 text-xl font-black text-white transition group-hover:bg-blue-800"
              >
                {tool.icon}
              </span>
              <h3 className="mt-5 text-xl font-black text-slate-950">
                {tool.title}
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                {tool.description}
              </p>
              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-sm font-black text-amber-700">
                  {tool.cost}
                </span>
                <span
                  aria-hidden="true"
                  className="font-black text-blue-900 transition group-hover:translate-x-1"
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="recent-projects"
        className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8"
      >
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                  Recent Projects
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Continue where you left off.
                </h2>
              </div>
              <Link
                href="/studio/dashboard"
                className="font-black text-blue-800 transition hover:text-blue-950"
              >
                View all projects →
              </Link>
            </div>

            <div className="mt-7 overflow-x-auto">
              <table className="min-w-[720px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      Project
                    </th>
                    <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      Type
                    </th>
                    <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      Date
                    </th>
                    <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      Credits
                    </th>
                    <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((project) => (
                    <tr
                      key={project.name}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-3 py-4 font-black text-slate-900">
                        {project.name}
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-600">
                        {project.type}
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-600">
                        {project.date}
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-600">
                        {project.credits}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            project.status === "Complete"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-[1.75rem] bg-blue-950 p-7 text-white shadow-xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">
              Current Balance
            </p>
            <p className="mt-4 text-5xl font-black tracking-tight">
              487 Credits
            </p>
            <p className="mt-3 leading-7 text-blue-100/80">
              Your Studio Business membership includes 800 credits each month.
              You have used 313 credits in the current cycle.
            </p>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[39%] rounded-full bg-amber-300" />
            </div>
            <div className="mt-3 flex justify-between text-sm font-bold text-blue-100/70">
              <span>313 used</span>
              <span>487 remaining</span>
            </div>

            <div className="mt-7 grid gap-3">
              <Link
                href="/studio/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200"
              >
                Buy Studio Credits
              </Link>
              <Link
                href="/studio/memberships"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-black text-white transition hover:bg-white/10"
              >
                Manage Membership
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
            Brand Assets
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Keep your creative identity organised.
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {brandAssets.map((asset) => (
            <article
              key={asset.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-black">{asset.title}</h3>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-950">
                  {asset.count}
                </span>
              </div>
              <p className="mt-4 leading-7 text-slate-600">
                {asset.description}
              </p>
              <Link
                href="/studio/dashboard"
                className="mt-5 inline-flex font-black text-blue-800 transition hover:text-blue-950"
              >
                Open assets →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">
                AI Video
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Turn ideas into short-form video content.
              </h2>
              <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-slate-300">
                Create product videos, social reels, advertisements, explainers
                and campaign clips with live Studio Credit pricing before every
                render.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {[
                  "Short videos",
                  "Product clips",
                  "Social reels",
                  "Advertisements",
                  "Explainer videos",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <Link
                href="/studio/dashboard?tool=video"
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-6 py-3 font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200"
              >
                Create AI Video
              </Link>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-200">
                Typical Credit Range
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-black">Short AI Video</p>
                  <p className="mt-2 text-2xl font-black text-amber-300">
                    300–600 Credits
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-black">Long AI Video</p>
                  <p className="mt-2 text-2xl font-black text-amber-300">
                    800–1,500 Credits
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm font-semibold leading-6 text-slate-300">
                Final cost depends on duration, resolution, model choice,
                complexity and live rendering conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Usage
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Your activity this month.
              </h2>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {usageStats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-blue-950">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {stat.detail}
                  </p>
                  <ProgressBar value={stat.progress} />
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-amber-300/40 bg-amber-50 p-7">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-xl font-black text-slate-950"
              >
                !
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-800">
                  Live Rendering Costs
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Rendering costs can vary daily.
                </h2>
              </div>
            </div>

            <p className="mt-5 leading-7 text-slate-700">
              Studio Credit costs are calculated live and may change because AI
              provider pricing, GPU availability, model selection, resolution,
              duration and generation complexity can vary.
            </p>

            <ul className="mt-5 space-y-3 text-sm font-bold text-slate-700">
              {[
                "The exact credit cost is shown before generation.",
                "No credits are deducted until you confirm.",
                "You can change settings before accepting the final cost.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-black text-slate-950"
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/studio/pricing"
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-blue-950 px-5 py-3 font-black text-white transition hover:bg-blue-900"
            >
              Review Studio Pricing
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
            Featured Tools
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Discover what is new in Studio.
          </h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <article
              key={tool.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-950">
                {tool.badge}
              </span>
              <h3 className="mt-5 text-xl font-black">{tool.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">
                {tool.description}
              </p>
              <Link
                href={tool.href}
                className="mt-5 inline-flex font-black text-blue-800 transition hover:text-blue-950"
              >
                Explore tool →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Studio Guides
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Helpful ways to get better results.
            </h2>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {guides.map((guide) => (
              <article
                key={guide.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="text-lg font-black">{guide.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {guide.description}
                </p>
                <Link
                  href="/studio/dashboard"
                  className="mt-4 inline-flex font-black text-blue-800 transition hover:text-blue-950"
                >
                  Read guide →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <div className="overflow-hidden rounded-[2rem] bg-blue-950 px-6 py-12 text-center text-white shadow-2xl sm:px-10 lg:px-16 lg:py-16">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">
            Ready to Create?
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Choose a tool and let Beacon Studio do the hard work.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-blue-100/80">
            Build polished creative assets, review every cost before rendering
            and keep your projects organised in one workspace.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/studio/dashboard?tool=images"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-6 py-3 font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200"
            >
              Create an AI Image
            </Link>
            <Link
              href="/studio/pricing"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              View Studio Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}