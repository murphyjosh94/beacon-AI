import Link from "next/link";
import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";

const freeFeatures = [
  "5 personalised searches each day",
  "Five recommendations per search",
  "Basic Beacon Score",
  "Browse Shopping, Getaways and Entertainment",
  "Save up to 5 favourites",
];

const plusFeatures = [
  "Unlimited personalised searches",
  "Advanced Beacon Score explanations",
  "Unlimited saved favourites",
  "Saved comparisons",
  "Price tracking",
  "Holiday and getaway alerts",
  "Personal wishlists",
  "Family profiles",
  "Travel preferences",
  "Vehicle garage",
  "Pet profiles",
  "Shopping history",
  "Maintenance reminders",
  "Early access to new Beacon tools",
];

export default function MembershipPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-24 text-white">
        <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.32em] text-blue-200">
            Beacon Membership
          </p>

          <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-6xl">
            A personal shopper that gets better with you.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
            Use Beacon free for everyday recommendations, or join Beacon+ to
            unlock unlimited research, personalised profiles, saved
            comparisons, alerts and long-term shopping memory.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
            <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-slate-500">
              Beacon Free
            </p>

            <div className="mt-5 flex items-end gap-2">
              <p className="text-5xl font-black text-slate-950">£0</p>
              <p className="pb-1 font-semibold text-slate-500">forever</p>
            </div>

            <p className="mt-5 leading-7 text-slate-600">
              Start using Beacon as your personal AI shopper with no payment
              details required.
            </p>

            <ul className="mt-8 space-y-4">
              {freeFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 font-semibold text-slate-700"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-900">
                    ✓
                  </span>

                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signin"
              className="mt-10 inline-flex w-full items-center justify-center rounded-2xl border-2 border-blue-900 px-6 py-4 text-lg font-extrabold text-blue-900 transition hover:bg-blue-50"
            >
              Create Free Account
            </Link>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] bg-blue-950 p-8 text-white shadow-2xl sm:p-10">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-yellow-300/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-200">
                  Beacon+
                </p>

                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold text-blue-100 backdrop-blur">
                  Most Personal
                </span>
              </div>

              <div className="mt-5 flex items-end gap-2">
                <p className="text-5xl font-black">Coming Soon</p>
              </div>

              <p className="mt-5 leading-7 text-blue-100">
                Beacon+ remembers your preferences, plans around your household
                and watches for better options even when you are not searching.
              </p>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {plusFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 font-semibold text-blue-50"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-black">
                      ✓
                    </span>

                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signin"
                className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 text-lg font-extrabold text-blue-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Join the Beacon+ Waitlist
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
              Why Beacon+
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              You are not paying for affiliate links.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              You are paying for convenience, memory and better decisions.
              Beacon+ learns what matters to you so every future recommendation
              becomes faster and more relevant.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl bg-slate-50 p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                Remember
              </p>

              <h3 className="mt-3 text-2xl font-black text-slate-950">
                Your preferences stay with you.
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                Beacon can remember preferred airports, favourite retailers,
                household needs, budgets, vehicles, pets and more.
              </p>
            </article>

            <article className="rounded-3xl bg-slate-50 p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                Watch
              </p>

              <h3 className="mt-3 text-2xl font-black text-slate-950">
                Let Beacon monitor the market.
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                Track prices, save searches and receive alerts when a stronger
                product, holiday or experience becomes available.
              </p>
            </article>

            <article className="rounded-3xl bg-slate-50 p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                Decide
              </p>

              <h3 className="mt-3 text-2xl font-black text-slate-950">
                Compare with confidence.
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                Save recommendation sets and compare the strongest options
                without repeating the same research every time.
              </p>
            </article>
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}