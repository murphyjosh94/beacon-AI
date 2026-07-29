import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Beacon Studio Memberships | Choose Your Creative Plan",
  description:
    "Compare Beacon Studio Free, Pro, Business and Enterprise memberships, monthly Studio Credits and included creative tools.",
};

const plans = [
  {
    name: "Studio Free",
    price: "£0.00",
    cadence: "forever",
    credits: "10 Studio Credits",
    description:
      "Explore Beacon Studio and create occasional assets before moving to a paid membership.",
    audience: "Ideal for first-time users and light personal use.",
    featured: false,
    href: "/studio/dashboard",
    cta: "Start Free",
    features: [
      "10 complimentary Studio Credits",
      "Access to selected Studio tools",
      "Personal project workspace",
      "Live rendering cost preview",
      "Upgrade at any time",
    ],
  },
  {
    name: "Studio Pro",
    price: "£19.99",
    cadence: "per month",
    credits: "300 Studio Credits",
    description:
      "A flexible creative membership for freelancers, creators and personal brands.",
    audience: "Ideal for regular individual content creation.",
    featured: true,
    href: "/studio/dashboard",
    cta: "Choose Studio Pro",
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
    description:
      "Built for growing businesses producing regular marketing, branding and customer content.",
    audience: "Ideal for businesses and small marketing teams.",
    featured: false,
    href: "/studio/dashboard",
    cta: "Choose Studio Business",
    features: [
      "800 Studio Credits each month",
      "Everything in Studio Pro",
      "Business-use licensing",
      "Higher-volume creative workflows",
      "Shared brand asset preparation",
      "Priority support",
    ],
  },
  {
    name: "Studio Enterprise",
    price: "£99.99",
    cadence: "per month",
    credits: "2,500 Studio Credits",
    description:
      "Advanced creative capacity, team controls and support for agencies and organisations.",
    audience: "Ideal for agencies, teams and multiple brands.",
    featured: false,
    href: "/studio/dashboard",
    cta: "Explore Enterprise",
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

const comparisonRows = [
  {
    feature: "Monthly Studio Credits",
    free: "10",
    pro: "300",
    business: "800",
    enterprise: "2,500",
  },
  {
    feature: "Selected Studio tools",
    free: true,
    pro: true,
    business: true,
    enterprise: true,
  },
  {
    feature: "All standard Studio tools",
    free: false,
    pro: true,
    business: true,
    enterprise: true,
  },
  {
    feature: "Commercial use",
    free: false,
    pro: true,
    business: true,
    enterprise: true,
  },
  {
    feature: "Priority generation",
    free: false,
    pro: true,
    business: true,
    enterprise: true,
  },
  {
    feature: "Brand and project storage",
    free: "Basic",
    pro: "Included",
    business: "Expanded",
    enterprise: "Advanced",
  },
  {
    feature: "Shared brand libraries",
    free: false,
    pro: false,
    business: "Prepared assets",
    enterprise: true,
  },
  {
    feature: "Team workspaces",
    free: false,
    pro: false,
    business: false,
    enterprise: true,
  },
  {
    feature: "Approval workflows",
    free: false,
    pro: false,
    business: false,
    enterprise: true,
  },
  {
    feature: "White-label exports",
    free: false,
    pro: false,
    business: false,
    enterprise: true,
  },
  {
    feature: "Support",
    free: "Standard",
    pro: "Standard",
    business: "Priority",
    enterprise: "Dedicated",
  },
  {
    feature: "API access",
    free: false,
    pro: false,
    business: false,
    enterprise: "Coming soon",
  },
] as const;

const useCases = [
  {
    title: "Studio Free",
    icon: "✦",
    description:
      "A simple way to learn the Studio workflow and create occasional assets.",
    items: [
      "First-time Studio users",
      "Personal experiments",
      "Occasional graphics",
      "Trying AI creative tools",
    ],
  },
  {
    title: "Studio Pro",
    icon: "🎨",
    description:
      "For people creating content regularly for audiences, clients or personal brands.",
    items: [
      "Freelancers",
      "Content creators",
      "Designers",
      "Personal brands",
    ],
  },
  {
    title: "Studio Business",
    icon: "🏢",
    description:
      "For businesses that need reliable marketing and brand content throughout the month.",
    items: [
      "Small businesses",
      "Marketing teams",
      "Website owners",
      "Growing online brands",
    ],
  },
  {
    title: "Studio Enterprise",
    icon: "🏛",
    description:
      "For organisations managing multiple users, brands and higher production volumes.",
    items: [
      "Creative agencies",
      "Larger organisations",
      "Multi-brand teams",
      "High-volume production",
    ],
  },
] as const;

const membershipBenefits = [
  {
    title: "Better monthly value",
    description:
      "Membership credits are designed for regular use and provide stronger value than relying only on one-off top-ups.",
  },
  {
    title: "Priority access",
    description:
      "Eligible paid plans receive priority generation access during periods of higher platform demand.",
  },
  {
    title: "Creative continuity",
    description:
      "Keep your projects, brand assets and workflows organised inside one dedicated Studio workspace.",
  },
  {
    title: "Ongoing improvements",
    description:
      "Memberships support continued investment in new AI models, faster rendering and better creative tools.",
  },
  {
    title: "Flexible top-ups",
    description:
      "Purchase extra Studio Credits whenever a campaign or project requires more capacity.",
  },
  {
    title: "Transparent rendering",
    description:
      "The current Studio Credit cost is shown before every generation, so you remain in control.",
  },
] as const;

const enterpriseServices = [
  "Dedicated onboarding",
  "Team workspace setup",
  "Shared brand library configuration",
  "Approval workflow support",
  "Priority rendering access",
  "Custom Studio Credit packages",
  "White-label output options",
  "API planning and integration support",
  "Dedicated account management",
  "Early access to selected features",
] as const;

const faqs = [
  {
    question: "Can I upgrade my Studio membership at any time?",
    answer:
      "Yes. You can move to a higher Studio membership when your creative workload grows. Your account will display the available upgrade options before you confirm any change.",
  },
  {
    question: "Can I cancel whenever I want?",
    answer:
      "Paid Studio memberships are designed to be flexible. Cancellation terms will be shown clearly during checkout and inside your billing area.",
  },
  {
    question: "What happens to unused membership credits?",
    answer:
      "Monthly membership credits refresh according to the membership terms shown at checkout. Purchased Studio Credit packs are separate and do not expire while your Beacon account remains active.",
  },
  {
    question: "Do purchased Studio Credits expire?",
    answer:
      "Purchased Studio Credit packs do not expire while your Beacon account remains active.",
  },
  {
    question: "Can Beacon Business credits be combined with a Studio membership?",
    answer:
      "Yes. Eligible Beacon Business members can use their included Studio allowance and may also hold a dedicated Studio membership or purchase additional credits.",
  },
  {
    question: "Are Studio rendering costs fixed?",
    answer:
      "No. Rendering costs can vary daily because provider pricing, GPU availability, selected models, resolution, duration, complexity and operating costs can change. The live cost is always shown before generation.",
  },
  {
    question: "When are Studio Credits deducted?",
    answer:
      "Credits are deducted only after you review the displayed cost and confirm the generation.",
  },
] as const;

function ComparisonValue({
  value,
}: {
  value: string | boolean;
}) {
  if (value === true) {
    return (
      <span
        aria-label="Included"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700"
      >
        ✓
      </span>
    );
  }

  if (value === false) {
    return (
      <span
        aria-label="Not included"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-400"
      >
        —
      </span>
    );
  }

  return <span className="font-bold text-slate-700">{value}</span>;
}

export default function StudioMembershipsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.30),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.18),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent"
        />

        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-sm font-extrabold text-blue-100">
              <span aria-hidden="true">✦</span>
              <span>Beacon Studio Memberships</span>
            </div>

            <h1 className="mt-7 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
              Choose the membership that matches your creative workflow.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-300 sm:text-xl">
              Start free, move into regular creative production or support an
              entire team with higher monthly Studio Credit allowances and more
              advanced tools.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/studio/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-6 py-3 font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Start Free
              </Link>

              <Link
                href="/studio/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              Studio Plans
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              One Studio membership for every stage.
            </h2>
            <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
              Every paid plan includes monthly Studio Credits, transparent
              rendering costs and access to a dedicated creative workspace.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[1.75rem] border p-6 shadow-sm ${
                  plan.featured
                    ? "border-blue-700 bg-blue-950 text-white shadow-xl"
                    : "border-slate-200 bg-white text-slate-950"
                }`}
              >
                {plan.featured ? (
                  <span className="absolute right-5 top-5 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-blue-950">
                    Most Popular
                  </span>
                ) : null}

                <div>
                  <p
                    className={`text-sm font-black uppercase tracking-[0.18em] ${
                      plan.featured ? "text-blue-200" : "text-blue-700"
                    }`}
                  >
                    {plan.name}
                  </p>

                  <div className="mt-5">
                    <span className="text-4xl font-black tracking-tight">
                      {plan.price}
                    </span>
                    <span
                      className={`ml-2 text-sm font-bold ${
                        plan.featured ? "text-blue-200" : "text-slate-500"
                      }`}
                    >
                      {plan.cadence}
                    </span>
                  </div>

                  <p
                    className={`mt-4 text-lg font-black ${
                      plan.featured ? "text-amber-300" : "text-blue-950"
                    }`}
                  >
                    {plan.credits}
                  </p>

                  <p
                    className={`mt-4 leading-7 ${
                      plan.featured ? "text-blue-100/85" : "text-slate-600"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <p
                    className={`mt-4 text-sm font-bold ${
                      plan.featured ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {plan.audience}
                  </p>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm font-semibold leading-6"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          plan.featured
                            ? "bg-amber-300 text-blue-950"
                            : "bg-blue-100 text-blue-950"
                        }`}
                      >
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-center font-black transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    plan.featured
                      ? "bg-amber-300 text-blue-950 hover:bg-amber-200 focus-visible:ring-amber-300 focus-visible:ring-offset-blue-950"
                      : "bg-blue-950 text-white hover:bg-blue-900 focus-visible:ring-blue-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100 text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              Membership Comparison
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Compare every plan in one place.
            </h2>
          </div>

          <div className="mt-12 overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[980px] w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-5 text-left text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                    Feature
                  </th>
                  <th className="px-5 py-5 text-center font-black text-slate-950">
                    Free
                  </th>
                  <th className="bg-blue-50 px-5 py-5 text-center font-black text-blue-950">
                    Pro
                  </th>
                  <th className="px-5 py-5 text-center font-black text-slate-950">
                    Business
                  </th>
                  <th className="px-5 py-5 text-center font-black text-slate-950">
                    Enterprise
                  </th>
                </tr>
              </thead>

              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-slate-200 last:border-b-0"
                  >
                    <th className="px-5 py-4 text-left text-sm font-black text-slate-700">
                      {row.feature}
                    </th>
                    <td className="px-5 py-4 text-center">
                      <ComparisonValue value={row.free} />
                    </td>
                    <td className="bg-blue-50/60 px-5 py-4 text-center">
                      <ComparisonValue value={row.pro} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <ComparisonValue value={row.business} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <ComparisonValue value={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              Find Your Fit
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Which Studio membership is right for you?
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {useCases.map((useCase) => (
              <article
                key={useCase.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7"
              >
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-950 text-xl"
                  >
                    {useCase.icon}
                  </span>
                  <h3 className="text-2xl font-black text-slate-950">
                    {useCase.title}
                  </h3>
                </div>

                <p className="mt-5 leading-7 text-slate-600">
                  {useCase.description}
                </p>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {useCase.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 font-bold text-slate-700"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-950"
                      >
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">
                Beacon Business Members
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Already a Beacon Business member?
              </h2>
              <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-blue-100/80">
                Eligible Beacon Business memberships already include a limited
                Studio Credit allowance each month, giving you built-in access
                to occasional marketing and creative tools.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-200">
                    Beacon Business
                  </p>
                  <p className="mt-3 text-2xl font-black text-amber-300">
                    50 Studio Credits
                  </p>
                  <p className="mt-2 text-sm font-semibold text-blue-100/70">
                    Included each month
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-200">
                    Beacon Business Pro
                  </p>
                  <p className="mt-3 text-2xl font-black text-amber-300">
                    150 Studio Credits
                  </p>
                  <p className="mt-2 text-sm font-semibold text-blue-100/70">
                    Included each month
                  </p>
                </div>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-amber-300/25 bg-amber-300/10 p-7 sm:p-9">
              <h3 className="text-2xl font-black">
                Upgrade only when your creative workload grows.
              </h3>
              <p className="mt-4 leading-8 text-blue-100/80">
                Your included Business allowance is ideal for occasional social
                graphics, promotional images, documents, presentations and
                branding updates. A dedicated Studio membership is available
                when you need more capacity.
              </p>

              <Link
                href="/business/memberships"
                className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-6 py-3 font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
              >
                View Business Memberships
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              Membership Benefits
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              More than a monthly credit allowance.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {membershipBenefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 font-black text-blue-950"
                >
                  ✓
                </span>
                <h3 className="mt-5 text-xl font-black text-slate-950">
                  {benefit.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
                Enterprise Support
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Built for teams, agencies and larger organisations.
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                Studio Enterprise combines higher creative capacity with team
                controls, onboarding and direct account support.
              </p>

              <Link
                href="/studio/dashboard"
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-950 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Explore Enterprise
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {enterpriseServices.map((service) => (
                <div
                  key={service}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-black text-blue-950"
                  >
                    ✓
                  </span>
                  <span className="font-bold text-slate-700">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="rounded-[1.75rem] border border-amber-300/25 bg-amber-300/10 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-xl font-black text-slate-950"
              >
                !
              </span>

              <div>
                <h2 className="text-2xl font-black">
                  Rendering costs can vary daily
                </h2>
                <p className="mt-3 leading-7 text-slate-200">
                  Studio Credit costs are dynamic because AI provider pricing,
                  GPU availability, selected models, resolution, duration,
                  complexity, licensing and operating costs can change.
                </p>
                <p className="mt-3 font-bold leading-7 text-amber-100">
                  Beacon Studio displays the current cost before every
                  generation, and no credits are deducted until you confirm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">
              Frequently Asked Questions
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Clear answers before you choose.
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 open:bg-white open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-slate-950">
                  <span>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className="text-xl text-blue-800 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-20 text-slate-950 sm:pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-blue-950 px-6 py-12 text-center shadow-2xl sm:px-10 lg:px-16 lg:py-16">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">
              Ready to Create?
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
              Start free today and upgrade when your creative needs grow.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-blue-100/80">
              Choose the membership that gives you the right balance of
              flexibility, capacity and creative control.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/studio/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-6 py-3 font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
              >
                Start Free
              </Link>

              <Link
                href="/studio/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
              >
                Upgrade to Studio Pro
              </Link>

              <Link
                href="/studio/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-300/10 px-6 py-3 font-black text-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
              >
                Contact Enterprise
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}