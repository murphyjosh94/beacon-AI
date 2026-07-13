import Navbar from "@/components/Navbar";
import BeaconHero from "@/components/BeaconHero";
import BeaconFooter from "@/components/BeaconFooter";
import AmazonSubscriptionBanner from "@/components/AmazonSubscriptionBanner";

const categories = [
  {
    id: "shopping",
    eyebrow: "Beacon Shopping",
    title: "Find the right product",
    description:
      "Tell Beacon what matters to you and receive five carefully selected products that match your budget, needs and preferences.",
    examples: [
      "Best 55-inch TV under £800",
      "Quiet cordless vacuum for pet hair",
      "Laptop for university and light gaming",
    ],
  },
  {
    id: "getaways",
    eyebrow: "Beacon Getaways",
    title: "Plan the right break",
    description:
      "From UK staycations to holidays abroad, Beacon helps narrow hundreds of options into five clear recommendations.",
    examples: [
      "Family beach holiday under £2,500",
      "Dog-friendly cottage in Cornwall",
      "Weekend break for two in Edinburgh",
    ],
  },
  {
    id: "entertainment",
    eyebrow: "Beacon Entertainment",
    title: "Discover something memorable",
    description:
      "Find events, attractions and experiences matched to your location, interests, dates and budget.",
    examples: [
      "Family day out near Manchester",
      "West End show and hotel package",
      "Birthday experience for two",
    ],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

<AmazonSubscriptionBanner />

      <BeaconHero />

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
              How Beacon Helps
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Five strong choices. Not five hundred results.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Beacon learns what matters to you, compares suitable options and
              explains why each recommendation deserves your attention.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.id}
                id={category.id}
                className="scroll-mt-32 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl"
              >
                <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-900">
                  {category.eyebrow}
                </p>

                <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {category.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {category.description}
                </p>

                <div className="mt-6 space-y-3">
                  {category.examples.map((example) => (
                    <div
                      key={example}
                      className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-700"
                    >
                      “{example}”
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-950 px-6 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
              The Beacon Difference
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Recommendations built around you.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              Beacon is not designed to overwhelm you with sponsored listings.
              It is designed to understand your request, compare trusted
              options and explain the five strongest matches in plain English.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Personalised recommendations",
              "Clear Beacon Score",
              "Trusted partner links",
              "Transparent sponsored labels",
              "Saved preferences",
              "Price and holiday alerts",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/15 bg-white/10 p-5 font-bold backdrop-blur"
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 text-center shadow-2xl sm:p-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
            Beacon+
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Your personal shopper gets better with you.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Save preferences, track prices, create family profiles, remember
            your vehicles and pets, and receive personalised alerts when better
            options appear.
          </p>

          <a
            href="/membership"
            className="mt-8 inline-flex rounded-2xl bg-blue-900 px-8 py-4 text-lg font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-800"
          >
            Explore Beacon+
          </a>
        </div>
      </section>

      <BeaconFooter />
   </main>
  );
}