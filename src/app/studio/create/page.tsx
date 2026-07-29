import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create with Beacon Studio | AI Creative Workspace",
  description:
    "Build images, logos, brand kits, presentations, documents, social content, campaigns and AI videos with live Studio Credit estimates.",
};

const tools = [
  {
    id: "images",
    name: "AI Images",
    icon: "✦",
    description: "Product imagery, campaign visuals and original artwork.",
    baseCost: "From 10 credits",
  },
  {
    id: "logos",
    name: "Logos",
    icon: "◉",
    description: "Professional logo concepts and brand marks.",
    baseCost: "From 40 credits",
  },
  {
    id: "brand-kits",
    name: "Brand Kits",
    icon: "◆",
    description: "Logos, colours, typography and brand direction.",
    baseCost: "From 150 credits",
  },
  {
    id: "social",
    name: "Social Graphics",
    icon: "◎",
    description: "Platform-ready posts, stories and campaign graphics.",
    baseCost: "From 20 credits",
  },
  {
    id: "presentations",
    name: "Presentations",
    icon: "▤",
    description: "Structured, polished slide decks from your brief.",
    baseCost: "From 80 credits",
  },
  {
    id: "documents",
    name: "Documents",
    icon: "▧",
    description: "Reports, proposals, guides and business documents.",
    baseCost: "From 30 credits",
  },
  {
    id: "campaigns",
    name: "Campaigns",
    icon: "↗",
    description: "Coordinated assets for launches and promotions.",
    baseCost: "From 300 credits",
  },
  {
    id: "video",
    name: "AI Video",
    icon: "▶",
    description: "Promotional clips, reels, adverts and explainers.",
    baseCost: "From 300 credits",
  },
] as const;

const recentGenerations = [
  {
    name: "Summer Product Hero",
    tool: "AI Image",
    created: "29 Jul 2026",
    credits: "18",
    status: "Complete",
  },
  {
    name: "Beacon Partner Deck",
    tool: "Presentation",
    created: "28 Jul 2026",
    credits: "96",
    status: "Complete",
  },
  {
    name: "Launch Reel",
    tool: "AI Video",
    created: "28 Jul 2026",
    credits: "420",
    status: "Processing",
  },
] as const;

const qualityOptions = [
  {
    name: "Standard",
    description: "Fastest generation and lowest credit use.",
    estimate: "10 credits",
  },
  {
    name: "High",
    description: "Improved detail for polished commercial assets.",
    estimate: "18 credits",
  },
  {
    name: "Ultra",
    description: "Maximum detail for premium, high-resolution work.",
    estimate: "32 credits",
  },
] as const;

const projectOptions = [
  "Beacon AI",
  "Beacon Business",
  "Beacon Studio",
  "New client project",
] as const;

export default function StudioCreatePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(245,158,11,0.16),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
        />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-sm font-extrabold text-blue-100">
                <span aria-hidden="true">✦</span>
                <span>Beacon Studio Create</span>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                Create with Beacon Studio.
              </h1>

              <p className="mt-4 max-w-3xl text-lg font-medium leading-8 text-slate-300">
                Choose a creative tool, build your brief and review the live
                Studio Credit cost before anything is generated.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/studio/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-black text-white transition hover:bg-white/10"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/studio/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 font-black text-blue-950 transition hover:bg-amber-200"
              >
                Buy Credits
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Studio Credits
                </p>
                <p className="mt-2 text-2xl font-black text-blue-950">487</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Membership
                </p>
                <p className="mt-2 text-2xl font-black text-blue-950">
                  Studio Business
                </p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Queue Priority
                </p>
                <p className="mt-2 text-2xl font-black text-blue-950">
                  Priority
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-blue-950 px-6 py-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-200">
              Current Selection
            </p>
            <p className="mt-2 text-xl font-black text-amber-300">AI Images</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
            Choose a Tool
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            What would you like to create?
          </h2>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool, index) => (
            <Link
              key={tool.id}
              href={`/studio/create?tool=${tool.id}`}
              className={`group rounded-[1.5rem] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                index === 0
                  ? "border-blue-800 bg-blue-950 text-white"
                  : "border-slate-200 bg-white text-slate-950 hover:border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  aria-hidden="true"
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black ${
                    index === 0
                      ? "bg-amber-300 text-blue-950"
                      : "bg-blue-100 text-blue-950"
                  }`}
                >
                  {tool.icon}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    index === 0
                      ? "bg-white/10 text-blue-100"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tool.baseCost}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black">{tool.name}</h3>
              <p
                className={`mt-3 leading-7 ${
                  index === 0 ? "text-blue-100/80" : "text-slate-600"
                }`}
              >
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-8">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                  Creative Brief
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Tell Beacon what you need.
                </h2>
                <p className="mt-3 leading-7 text-slate-600">
                  The more context you provide, the stronger and more consistent
                  the result will be.
                </p>
              </div>

              <div className="mt-7 grid gap-5">
                <label className="grid gap-2">
                  <span className="font-black text-slate-800">
                    Project title
                  </span>
                  <input
                    type="text"
                    name="title"
                    placeholder="Example: Summer product launch hero image"
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-black text-slate-800">
                    Describe what you want to create
                  </span>
                  <textarea
                    name="description"
                    rows={7}
                    placeholder="Describe the subject, layout, setting, purpose and any important details..."
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-black text-slate-800">
                      Target audience
                    </span>
                    <input
                      type="text"
                      name="audience"
                      placeholder="Example: UK small business owners"
                      className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="font-black text-slate-800">
                      Creative style
                    </span>
                    <select
                      name="style"
                      defaultValue="premium"
                      className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="premium">Premium and polished</option>
                      <option value="minimal">Minimal and modern</option>
                      <option value="bold">Bold and energetic</option>
                      <option value="corporate">Professional and corporate</option>
                      <option value="editorial">Editorial</option>
                      <option value="cinematic">Cinematic</option>
                      <option value="friendly">Friendly and approachable</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-black text-slate-800">Tone</span>
                    <select
                      name="tone"
                      defaultValue="confident"
                      className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="confident">Confident</option>
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="luxury">Luxury</option>
                      <option value="playful">Playful</option>
                      <option value="calm">Calm</option>
                      <option value="technical">Technical</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="font-black text-slate-800">
                      Preferred colours
                    </span>
                    <input
                      type="text"
                      name="colours"
                      placeholder="Example: Beacon blue, gold and white"
                      className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="font-black text-slate-800">
                    Reference links
                  </span>
                  <input
                    type="url"
                    name="reference"
                    placeholder="Paste a website, product or visual reference URL"
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-black text-slate-800">
                    Additional notes
                  </span>
                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Include anything Beacon must avoid, preserve or prioritise..."
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium leading-7 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                  Generation Settings
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Choose your quality and output.
                </h2>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {qualityOptions.map((option, index) => (
                  <label
                    key={option.name}
                    className={`cursor-pointer rounded-2xl border p-5 ${
                      index === 1
                        ? "border-blue-800 bg-blue-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="quality"
                      value={option.name.toLowerCase()}
                      defaultChecked={index === 1}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-black text-slate-950">
                        {option.name}
                      </span>
                      <span className="text-xs font-black text-blue-800">
                        {option.estimate}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                      {option.description}
                    </p>
                  </label>
                ))}
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-2">
                  <span className="font-black text-slate-800">Aspect ratio</span>
                  <select
                    name="aspectRatio"
                    defaultValue="1:1"
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="1:1">Square · 1:1</option>
                    <option value="4:5">Portrait · 4:5</option>
                    <option value="9:16">Story · 9:16</option>
                    <option value="16:9">Landscape · 16:9</option>
                    <option value="3:2">Wide · 3:2</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="font-black text-slate-800">Resolution</span>
                  <select
                    name="resolution"
                    defaultValue="2048"
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="1024">1024 px</option>
                    <option value="2048">2048 px</option>
                    <option value="4096">4096 px</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="font-black text-slate-800">Outputs</span>
                  <select
                    name="outputs"
                    defaultValue="1"
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="1">1 output</option>
                    <option value="2">2 outputs</option>
                    <option value="4">4 outputs</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="font-black text-slate-800">AI model</span>
                  <select
                    name="model"
                    defaultValue="auto"
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="auto">Beacon Auto Select</option>
                    <option value="image-standard">Studio Image Standard</option>
                    <option value="image-premium">Studio Image Premium</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                  Brand and Project
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Keep this generation organised.
                </h2>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="font-black text-slate-800">
                    Saved brand kit
                  </span>
                  <select
                    name="brandKit"
                    defaultValue="beacon"
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="none">Do not use a brand kit</option>
                    <option value="beacon">Beacon Master Brand</option>
                    <option value="beacon-business">Beacon Business</option>
                    <option value="beacon-studio">Beacon Studio</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="font-black text-slate-800">Save to project</span>
                  <select
                    name="project"
                    defaultValue="Beacon Studio"
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  >
                    {projectOptions.map((project) => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <input
                  type="checkbox"
                  name="saveToLibrary"
                  defaultChecked
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span>
                  <span className="block font-black text-slate-900">
                    Save to Project Library
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-6 text-slate-600">
                    Keep the generation, settings and prompt available for later
                    editing or duplication.
                  </span>
                </span>
              </label>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[1.75rem] bg-blue-950 p-7 text-white shadow-xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">
                Estimated Rendering Cost
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="font-semibold text-blue-100/70">Tool</span>
                  <span className="font-black">AI Images</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="font-semibold text-blue-100/70">Quality</span>
                  <span className="font-black">High</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="font-semibold text-blue-100/70">
                    Resolution
                  </span>
                  <span className="font-black">2048 px</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="font-semibold text-blue-100/70">Outputs</span>
                  <span className="font-black">1</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-blue-100/70">
                    Estimated total
                  </span>
                  <span className="text-3xl font-black text-amber-300">
                    18 Credits
                  </span>
                </div>
              </div>

              <p className="mt-6 text-sm font-semibold leading-6 text-blue-100/70">
                This is an estimate. The final Studio Credit cost is calculated
                live and shown before generation.
              </p>

              <button
                type="button"
                className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-amber-300 px-6 py-4 text-lg font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
              >
                Generate with Beacon Studio
              </button>

              <p className="mt-4 text-center text-xs font-bold leading-5 text-blue-100/60">
                No credits are deducted until the final live cost is displayed
                and confirmed.
              </p>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Queue Status
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-600">
                    Current position
                  </span>
                  <span className="font-black text-slate-950">Ready</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-600">
                    Estimated wait
                  </span>
                  <span className="font-black text-slate-950">Under 1 minute</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-600">Priority</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                    Priority
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-amber-300/40 bg-amber-50 p-6">
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-300 font-black text-slate-950"
                >
                  !
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-800">
                    Before You Generate
                  </p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">
                    You stay in control of every render.
                  </h2>
                </div>
              </div>

              <ul className="mt-5 space-y-3 text-sm font-bold leading-6 text-slate-700">
                {[
                  "Rendering costs can vary daily.",
                  "The final cost is always shown before generation.",
                  "Credits are deducted only after confirmation.",
                  "Higher quality and longer outputs require more credits.",
                  "Premium models may use additional credits.",
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
            </section>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Generation History
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Your latest Studio renders.
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
            <table className="min-w-[820px] w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Generation
                  </th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Tool
                  </th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Created
                  </th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Credits
                  </th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Status
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentGenerations.map((generation) => (
                  <tr
                    key={generation.name}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-3 py-4 font-black text-slate-900">
                      {generation.name}
                    </td>
                    <td className="px-3 py-4 font-semibold text-slate-600">
                      {generation.tool}
                    </td>
                    <td className="px-3 py-4 font-semibold text-slate-600">
                      {generation.created}
                    </td>
                    <td className="px-3 py-4 font-semibold text-slate-600">
                      {generation.credits}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          generation.status === "Complete"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {generation.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="rounded-xl bg-blue-950 px-3 py-2 text-sm font-black text-white transition hover:bg-blue-900"
                        >
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}