import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Beacon Studio Pricing | Memberships & Studio Credits",
  description:
    "Compare Beacon Studio memberships, purchase Studio Credits and understand how AI rendering costs work before you generate.",
};

const memberships = [
  {
    name: "Studio Free",
    price: "£0.00",
    cadence: "forever",
    credits: "10 Studio Credits",
    audience: "Explore Beacon Studio",
    description:
      "A simple way to experience Beacon Studio before choosing a paid plan.",
    featured: false,
    cta: "Start Free",
    href: "/studio/dashboard",
    features: [
      "10 complimentary Studio Credits",
      "Access to selected Studio tools",
      "View rendering costs before generation",
      "Personal project workspace",
      "Upgrade at any time",
    ],
  },
  {
    name: "Studio Pro",
    price: "£19.99",
    cadence: "per month",
    credits: "300 Studio Credits",
    audience: "Freelancers & creators",
    description:
      "For regular content creation, personal brands and independent professionals.",
    featured: true,
    cta: "Choose Studio Pro",
    href: "/studio/memberships",
    features: [
      "300 Studio Credits each month",
      "Access to all standard Studio tools",
      "Commercial-use outputs",
      "Priority generation access",
      "Brand and project storage",
      "Purchase additional credits",
    ],
  },
  {
    name: "Studio Business",
    price: "£39.99",
    cadence: "per month",
    credits: "800 Studio Credits",
    audience: "Small & growing businesses",
    description:
      "For businesses producing regular marketing, branding and customer content.",
    featured: false,
    cta: "Choose Studio Business",
    href: "/studio/memberships",
    features: [
      "800 Studio Credits each month",
      "Everything in Studio Pro",
      "Shared brand asset preparation",
      "Higher-volume creative workflows",
      "Priority support",
      "Business-use licensing",
    ],
  },
  {
    name: "Studio Enterprise",
    price: "£99.99",
    cadence: "per month",
    credits: "2,500 Studio Credits",
    audience: "Agencies & organisations",
    description:
      "For teams, agencies and organisations managing larger creative workloads.",
    featured: false,
    cta: "Explore Enterprise",
    href: "/studio/memberships",
    features: [
      "2,500 Studio Credits each month",
      "Everything in Studio Business",
      "Team workspaces",
      "Shared brand libraries",
      "Approval workflows",
      "Priority rendering queue",
      "White-label exports",
      "Dedicated account support",
    ],
  },
] as const;

const creditPacks = [
  { credits: "100 Credits", price: "£10.00", note: "Occasional extra generations" },
  { credits: "300 Credits", price: "£27.00", note: "Flexible top-up for creators" },
  { credits: "750 Credits", price: "£60.00", note: "Better value for regular use" },
  { credits: "1,500 Credits", price: "£110.00", note: "Built for active businesses" },
  { credits: "3,000 Credits", price: "£200.00", note: "Best value for heavy use" },
] as const;

const renderingCosts = [
  ["Background removal", "5 Credits"],
  ["AI image", "10 Credits"],
  ["Social media graphic", "20 Credits"],
  ["Document generator", "30 Credits"],
  ["Logo generator", "40 Credits"],
  ["Presentation builder", "80 Credits"],
  ["Complete brand kit", "150 Credits"],
  ["Website hero asset pack", "200 Credits"],
  ["Marketing campaign pack", "300 Credits"],
  ["Short AI video", "300–600 Credits"],
  ["Long AI video", "800–1,500 Credits"],
] as const;

const businessCredits = [
  { plan: "Beacon Business", credits: "50 Studio Credits" },
  { plan: "Beacon Business Pro", credits: "150 Studio Credits" },
] as const;

const enterpriseFeatures = [
  "Team workspaces",
  "Shared brand libraries",
  "Brand asset management",
  "Approval workflows",
  "Priority rendering queue",
  "Premium AI models",
  "White-label downloads",
  "API access when available",
  "Advanced analytics",
  "Priority support",
  "Dedicated account management",
  "Custom credit packages",
  "Early access to new features",
] as const;

const faqs = [
  {
    question: "How do Studio Credits work?",
    answer:
      "Every Studio tool has a credit cost based on the computing resources, AI model and generation settings required. Beacon displays the current cost before you confirm a generation.",
  },
  {
    question: "Do rendering costs stay the same?",
    answer:
      "No. Rendering costs can vary daily because AI provider pricing, GPU availability, model selection, resolution, duration and other operating costs can change.",
  },
  {
    question: "When are credits deducted?",
    answer:
      "Credits are only deducted after you review the displayed price and confirm the generation.",
  },
  {
    question: "Do purchased credits expire?",
    answer:
      "Purchased Studio Credit packs do not expire while your Beacon account remains active. Membership credits refresh according to the applicable membership terms.",
  },
  {
    question: "Can Beacon Business members use Studio?",
    answer:
      "Yes. Eligible Beacon Business memberships include a limited monthly Studio Credit allowance for marketing and creative use.",
  },
  {
    question: "Can I upgrade or buy more credits?",
    answer:
      "Yes. You can move to a higher Studio membership or purchase additional Studio Credits whenever you need more capacity.",
  },
] as const;

export default function StudioPricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(245,158,11,0.17),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-sm font-extrabold text-blue-100">
              <span aria-hidden="true">✦</span>
              <span>Beacon Studio Pricing</span>
            </div>
            <h1 className="mt-7 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">Flexible pricing for the way you create.</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-300 sm:text-xl">
              Choose a Studio membership, use the credits included with Beacon Business or purchase additional Studio Credits whenever you need them.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/studio/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-6 py-3 font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Open Studio</Link>
              <Link href="/studio/memberships" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">Compare Memberships</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">Studio Memberships</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Start small and scale when your creative needs grow.</h2>
            <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Every paid plan includes monthly Studio Credits and access to Beacon Studio&apos;s wider creative workspace.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {memberships.map((membership) => (
              <article key={membership.name} className={`relative flex h-full flex-col rounded-[1.75rem] border p-6 shadow-sm ${membership.featured ? "border-blue-700 bg-blue-950 text-white shadow-xl" : "border-slate-200 bg-white text-slate-950"}`}>
                {membership.featured ? <span className="absolute right-5 top-5 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-blue-950">Most Popular</span> : null}
                <div>
                  <p className={`text-sm font-black uppercase tracking-[0.18em] ${membership.featured ? "text-blue-200" : "text-blue-700"}`}>{membership.name}</p>
                  <div className="mt-5"><span className="text-4xl font-black tracking-tight">{membership.price}</span><span className={`ml-2 text-sm font-bold ${membership.featured ? "text-blue-200" : "text-slate-500"}`}>{membership.cadence}</span></div>
                  <p className={`mt-4 text-lg font-black ${membership.featured ? "text-amber-300" : "text-blue-950"}`}>{membership.credits}</p>
                  <p className={`mt-2 text-sm font-bold ${membership.featured ? "text-blue-100" : "text-slate-500"}`}>{membership.audience}</p>
                  <p className={`mt-4 leading-7 ${membership.featured ? "text-blue-100/80" : "text-slate-600"}`}>{membership.description}</p>
                </div>
                <ul className="mt-6 space-y-3">
                  {membership.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm font-semibold leading-6">
                      <span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${membership.featured ? "bg-amber-300 text-blue-950" : "bg-blue-100 text-blue-950"}`}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={membership.href} className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-center font-black transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${membership.featured ? "bg-amber-300 text-blue-950 hover:bg-amber-200 focus-visible:ring-amber-300 focus-visible:ring-offset-blue-950" : "bg-blue-950 text-white hover:bg-blue-900 focus-visible:ring-blue-700"}`}>{membership.cta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100 text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">Studio Credit Packs</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Add credits whenever you need more.</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Purchased Studio Credits do not expire while your Beacon account remains active. Larger packs provide better overall value.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {creditPacks.map((pack) => (
                <article key={pack.credits} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-5">
                    <div><p className="text-xl font-black text-slate-950">{pack.credits}</p><p className="mt-2 text-sm font-semibold text-slate-500">{pack.note}</p></div>
                    <p className="text-2xl font-black text-blue-950">{pack.price}</p>
                  </div>
                  <Link href="/studio/memberships" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-black text-blue-950 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Buy Credits</Link>
                </article>
              ))}
              <article className="rounded-[1.5rem] border border-blue-900 bg-blue-950 p-6 text-white shadow-lg sm:col-span-2">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">Need a custom amount?</p>
                <h3 className="mt-3 text-2xl font-black">Enterprise and agency credit packages</h3>
                <p className="mt-3 leading-7 text-blue-100/80">Higher-volume organisations can request custom credit bundles, onboarding and account support.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">Included with Beacon Business</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Your business membership includes Studio access.</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Eligible Beacon Business members receive a limited monthly Studio Credit allowance for marketing and creative work.</p>
              <div className="mt-8 space-y-4">
                {businessCredits.map((item) => (
                  <div key={item.plan} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-black text-slate-950">{item.plan}</p>
                    <p className="font-black text-blue-950">{item.credits}</p>
                  </div>
                ))}
              </div>
            </div>
            <aside className="rounded-[2rem] bg-blue-950 p-7 text-white shadow-xl sm:p-9">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Built-in marketing support</p>
              <h3 className="mt-4 text-3xl font-black tracking-tight">Create occasional assets without needing a separate Studio plan.</h3>
              <p className="mt-5 leading-8 text-blue-100/80">Business credits are designed for social graphics, promotional images, documents, presentations and branding updates. Larger workloads can be supported through a dedicated Studio membership or additional credit packs.</p>
              <Link href="/business/memberships" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-6 py-3 font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950">View Business Memberships</Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">Typical Rendering Costs</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Know the cost before you generate.</h2>
            <p className="mt-5 text-lg font-medium leading-8 text-slate-300">The figures below are examples of typical Studio Credit usage. The live cost shown before generation is always the price that applies.</p>
          </div>
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/10 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-300 sm:px-7"><span>Studio Tool</span><span>Typical Cost</span></div>
            {renderingCosts.map(([tool, cost]) => (
              <div key={tool} className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/10 px-5 py-4 last:border-b-0 sm:px-7">
                <span className="font-bold text-white">{tool}</span>
                <span className="text-right font-black text-amber-300">{cost}</span>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-4xl rounded-[1.75rem] border border-amber-300/30 bg-amber-300/10 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-xl font-black text-slate-950">!</span>
              <div>
                <h3 className="text-xl font-black text-white">Rendering costs can vary daily</h3>
                <p className="mt-3 leading-7 text-slate-200">AI generation prices are dynamic. The same type of render may require a different number of Studio Credits on different days because provider pricing, GPU availability, selected models, resolution, duration, complexity, licensing and platform operating costs can change.</p>
                <p className="mt-3 font-bold leading-7 text-amber-100">Beacon Studio always displays the current credit cost before generation begins, and no credits are deducted until you confirm.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">Enterprise</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">More control for teams and larger organisations.</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Studio Enterprise adds higher capacity, team tools and support for businesses managing ongoing creative production.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {enterpriseFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-950">✓</span>
                  <span className="font-bold text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">Frequently Asked Questions</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Clear answers before you choose.</h2>
          </div>
          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-slate-950"><span>{faq.question}</span><span aria-hidden="true" className="text-xl text-blue-800 transition group-open:rotate-45">+</span></summary>
                <p className="mt-4 max-w-3xl leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-20 text-slate-950 sm:pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-blue-950 px-6 py-12 text-center shadow-2xl sm:px-10 lg:px-16 lg:py-16">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">Fair. Transparent. Sustainable.</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">Create with confidence and review every cost before you render.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-blue-100/80">Start free, choose a membership or use the Studio Credits included with your Beacon Business plan.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/studio/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-6 py-3 font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950">Start Free</Link>
              <Link href="/studio/memberships" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950">Choose a Membership</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}