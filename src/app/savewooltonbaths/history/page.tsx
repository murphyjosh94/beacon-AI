import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bath,
  BookOpen,
  Building2,
  CalendarDays,
  Heart,
  Landmark,
  Medal,
  Music2,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";

export const metadata = {
  title: "Our History | Save Woolton Baths",
  description:
    "Explore more than 130 years of Woolton Baths history, from its Victorian beginnings and community use to John Lennon, Paul McCartney, Olympic swimmer Steve Parry and the campaign to bring the Grade II listed building back to life.",
};

type TimelineEntry = {
  year: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
};

const timeline: TimelineEntry[] = [
  {
    year: "1891",
    eyebrow: "The Beginning",
    title: "A gift to the people of Woolton",
    description:
      "Local philanthropist Holbrook Gaskell JP offered to provide public baths for Woolton, on the condition that the local authority would maintain them. His vision was unusually progressive for its time: the baths were intended for both sexes and all classes, bringing bathing and sanitary facilities within reach of the local working population.",
    icon: Heart,
  },
  {
    year: "1891–1893",
    eyebrow: "Designed & Built",
    title: "Woolton Baths takes shape",
    description:
      "The building was designed by Manchester architects Horton & Bridgford. Isaac Dilworth of Wavertree acted as contractor, while Bradford & Co of Manchester and Salford undertook the engineering work. Construction cost approximately £3,300 — a substantial investment in public health and community life.",
    icon: Building2,
  },
  {
    year: "June 1893",
    eyebrow: "Opening",
    title: "The doors open",
    description:
      "Woolton Baths opened in June 1893. The original complex included six private baths, a footbath, plunge pool, swimming pool and laundry. The main swimming pool measured approximately 60 feet by 25 feet and would go on to serve generations of local families.",
    icon: Waves,
  },
  {
    year: "1893",
    eyebrow: "Community Sport",
    title: "Woolton Swimming Club",
    description:
      "Woolton Swimming Club was established soon after the baths opened. Until the building's closure, it was one of the oldest swimming clubs still operating from its original home — creating a sporting tradition stretching across generations.",
    icon: Medal,
  },
  {
    year: "1899",
    eyebrow: "Growing Demand",
    title: "Winter opening begins",
    description:
      "The baths had originally closed during the winter months. By 1899, demand for the facility saw Saturday winter opening introduced, beginning an important evolution in how the building served the wider community.",
    icon: CalendarDays,
  },
  {
    year: "1910",
    eyebrow: "More Than A Pool",
    title: "The pool becomes a community space",
    description:
      "A decision was taken to floor over the swimming pool during winter so that the pool hall could host social and community activities. More than a century ago, Woolton Baths was already demonstrating that the building could serve Woolton both as a swimming facility and as a flexible community venue.",
    icon: Users,
  },
  {
    year: "1913",
    eyebrow: "Liverpool",
    title: "Woolton becomes part of the city",
    description:
      "Following Woolton's incorporation into Liverpool, responsibility for Woolton Baths transferred from the local Woolton administration to Liverpool. The baths continued their role as an important public facility for the growing city.",
    icon: Landmark,
  },
  {
    year: "20th Century",
    eyebrow: "Changing Times",
    title: "War, adaptation and survival",
    description:
      "The baths closed during both World Wars but survived. In 1935 the original rounded ends of the swimming pool were squared off to better accommodate swimmers. The building continued to evolve while retaining much of its distinctive Victorian character.",
    icon: ShieldCheck,
  },
];

const heritageFeatures = [
  "Baroque Revival sandstone entrance façade",
  "Historic wrought-iron and timber roof structure",
  "Historic pool tilework",
  "Original ladder entrances and pool details",
  "Cast-iron grab rails",
  "Historic gallery overlooking the pool hall",
];

export default function WooltonBathsHistoryPage() {
  return (
    <main className="overflow-hidden bg-[#071522] text-white">
      {/* ============================================================ */}
      {/* HERO */}
      {/* ============================================================ */}

      <section className="relative min-h-[680px] overflow-hidden">
        <Image
          src="/savewooltonbaths/exterior.jpg"
          alt="The historic exterior of Woolton Baths"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#06121D] via-[#06121D]/85 to-[#06121D]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071522] via-transparent to-[#06121D]/20" />

        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-6 py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-[#E6C75A] backdrop-blur">
              <BookOpen className="h-4 w-4" />
              1893 — Today
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
              More Than
              <span className="block text-[#D4AF37]">
                130 Years
              </span>
              of Woolton History.
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl sm:leading-9">
              Woolton Baths is more than an old swimming pool. It is a building
              created for ordinary people, a place where generations learned to
              swim, communities gathered and part of Liverpool&apos;s cultural
              and sporting history was written.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#timeline"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#D4AF37] px-6 text-sm font-black text-black transition hover:bg-[#E6C75A]"
              >
                Explore the story
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="/savewooltonbaths/support"
                className="inline-flex min-h-12 items-center rounded-full border border-white/25 bg-black/20 px-6 text-sm font-black text-white backdrop-blur transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                Help write the next chapter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* INTRODUCTION */}
      {/* ============================================================ */}

      <section className="border-y border-white/10 bg-[#0A1B2B]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              A Woolton Landmark
            </p>

            <p className="mt-3 text-6xl font-black text-white sm:text-7xl">
              1893
            </p>

            <p className="mt-2 text-lg font-bold text-slate-400">
              The year Woolton Baths opened
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">
              Built for the community from the very beginning.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              Woolton Baths was born from an act of civic generosity. Holbrook
              Gaskell wanted local people to have access to bathing and swimming
              facilities regardless of class or sex. That principle — creating
              something valuable and accessible for the whole community — sits
              at the heart of what we want Woolton Baths to become again.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TIMELINE */}
      {/* ============================================================ */}

      <section
        id="timeline"
        className="relative px-6 py-24"
      >
        <div className="absolute left-0 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#D4AF37]/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              The Story
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              From Victorian public baths to a Liverpool landmark.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Every generation has added another chapter to the story of this
              building.
            </p>
          </div>

          <div className="relative mt-16">
            <div className="absolute bottom-0 left-[27px] top-0 w-px bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/40 to-transparent md:left-1/2" />

            <div className="space-y-10">
              {timeline.map((entry, index) => {
                const Icon = entry.icon;
                const isRight = index % 2 !== 0;

                return (
                  <article
                    key={`${entry.year}-${entry.title}`}
                    className="relative grid gap-8 pl-20 md:grid-cols-2 md:pl-0"
                  >
                    <div
                      className={`${
                        isRight
                          ? "md:col-start-2 md:pl-14"
                          : "md:pr-14 md:text-right"
                      }`}
                    >
                      <div className="rounded-3xl border border-white/10 bg-[#0A1B2B] p-7 shadow-2xl shadow-black/10 sm:p-8">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                          {entry.eyebrow}
                        </p>

                        <p className="mt-3 text-3xl font-black text-white">
                          {entry.year}
                        </p>

                        <h3 className="mt-3 text-2xl font-black text-white">
                          {entry.title}
                        </h3>

                        <p className="mt-4 leading-7 text-slate-400">
                          {entry.description}
                        </p>
                      </div>
                    </div>

                    <div className="absolute left-0 top-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#071522] bg-[#D4AF37] text-black shadow-lg md:left-1/2 md:-translate-x-1/2">
                      <Icon className="h-6 w-6" />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 1910 / TODAY CONNECTION */}
      {/* ============================================================ */}

      <section className="border-y border-[#D4AF37]/20 bg-[#D4AF37] text-black">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em]">
                1910 → Today
              </p>

              <p className="mt-4 text-7xl font-black tracking-tight">
                116
              </p>

              <p className="text-lg font-black">
                years apart. The same principle.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-black leading-tight sm:text-5xl">
                Our plan has historical precedent.
              </h2>

              <p className="mt-6 text-lg font-semibold leading-8 text-black/75">
                In 1910, the swimming pool was floored over during winter so
                Woolton Baths could host social and community activities.
                Today, our phased restoration proposes using the building in a
                remarkably similar way while the expensive swimming
                infrastructure is restored.
              </p>

              <p className="mt-6 text-xl font-black leading-8">
                We are not inventing a new purpose for Woolton Baths. We are
                reviving one it has served for more than a century.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BEATLES */}
      {/* ============================================================ */}

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 rounded-full bg-[#D4AF37]/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                <Music2 className="h-4 w-4" />
                Liverpool Music History
              </div>

              <h2 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
                Before the world knew their names, they were local lads at
                Woolton Baths.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                John Lennon and Paul McCartney are both part of the story of
                Woolton Baths. Historic England records that John Lennon learned
                to swim here and identifies Sir Paul McCartney among the
                building&apos;s users.
              </p>

              <p className="mt-5 text-lg leading-8 text-slate-300">
                Long before The Beatles changed popular music forever, this was
                one of the ordinary community places woven into their Liverpool
                childhoods.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#D4AF37]/25 bg-[#0A1B2B] p-8 sm:p-10">
              <Music2 className="h-10 w-10 text-[#D4AF37]" />

              <p className="mt-7 text-sm font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                John Lennon
              </p>

              <p className="mt-3 text-2xl font-black">
                Learned to swim at Woolton Baths.
              </p>

              <div className="my-8 h-px bg-white/10" />

              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                Paul McCartney
              </p>

              <p className="mt-3 text-2xl font-black">
                Swam here as a young Liverpool boy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MCCARTNEY STORY */}
      {/* ============================================================ */}

      <section className="bg-[#0A1B2B] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div className="flex justify-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#071522] shadow-2xl">
                <div className="text-center">
                  <Waves className="mx-auto h-12 w-12 text-[#D4AF37]" />

                  <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                    A Family Story
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
                The McCartney Brothers
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight">
                The day Paul pulled his younger brother from the water.
              </h2>

              <div className="mt-7 border-l-4 border-[#D4AF37] pl-6">
                <Quote className="h-8 w-8 text-[#D4AF37]" />

                <p className="mt-4 text-lg leading-8 text-slate-300">
                  In a 1965 magazine profile, Mike McCartney recalled getting
                  out of his depth while swimming at Woolton Baths when he was
                  still unable to swim properly. According to Mike&apos;s
                  recollection, his older brother Paul pulled him from the
                  water.
                </p>
              </div>

              <p className="mt-7 leading-8 text-slate-400">
                Mike remembered Paul treating the incident characteristically
                casually afterwards, joking that it had allowed him to practise
                his lifesaving lessons.
              </p>

              <p className="mt-5 text-sm leading-7 text-slate-500">
                This story is presented as Mike McCartney&apos;s recollection,
                originally published in a 1965 profile of Paul McCartney.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STEVE PARRY */}
      {/* ============================================================ */}

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#102B40] to-[#071522]">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex min-h-[380px] items-center justify-center bg-[#D4AF37] p-10 text-black">
                <div className="text-center">
                  <Medal className="mx-auto h-20 w-20" />

                  <p className="mt-6 text-sm font-black uppercase tracking-[0.25em]">
                    Athens 2004
                  </p>

                  <p className="mt-3 text-6xl font-black">
                    Bronze
                  </p>

                  <p className="mt-2 text-lg font-black">
                    200m Butterfly
                  </p>
                </div>
              </div>

              <div className="p-8 sm:p-12 lg:p-16">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
                  From Woolton to the Olympics
                </p>

                <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                  Steve Parry learned to swim here.
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-300">
                  After nearly drowning as a child, Liverpool-born Steve Parry
                  was encouraged to learn to swim. He learned at Woolton
                  Swimming Baths.
                </p>

                <p className="mt-5 text-lg leading-8 text-slate-300">
                  That young swimmer would eventually become a double Olympian
                  and win a bronze medal for Great Britain in the 200 metre
                  butterfly at the Athens Olympic Games in 2004.
                </p>

                <p className="mt-7 text-xl font-black leading-8 text-white">
                  A community pool can be where an extraordinary journey
                  begins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CLOSURE */}
      {/* ============================================================ */}

      <section className="relative overflow-hidden bg-[#040B12] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              October 2010
            </p>

            <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
              After 117 years, the doors closed.
            </h2>

            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-400">
              Woolton Baths closed to the public in October 2010. A building
              created to serve its community suddenly fell silent — but its
              story did not end there.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <HistoryStat
              value="117"
              label="Years serving the community before closure"
            />

            <HistoryStat
              value="1893"
              label="The year the baths first opened"
            />

            <HistoryStat
              value="2010"
              label="The year the doors closed"
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* GRADE II */}
      {/* ============================================================ */}

      <section className="bg-[#F1EEE5] px-6 py-24 text-[#10202A]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#102532] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                <Landmark className="h-4 w-4" />
                Grade II Listed
              </div>

              <h2 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
                Recognised as nationally important.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-700">
                In 2012, Woolton Baths was granted Grade II listed status,
                formally recognising the architectural and historic importance
                of the building.
              </p>

              <p className="mt-5 leading-8 text-slate-600">
                The designation protects much more than a façade. Significant
                surviving elements of the pool hall and wider building form
                part of its special historic character.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {heritageFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-4 rounded-2xl border border-[#102532]/10 bg-white p-5 shadow-sm"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#9A7A18]" />

                  <p className="font-bold leading-6">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TODAY */}
      {/* ============================================================ */}

      <section className="relative overflow-hidden px-6 py-28">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/5 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[#D4AF37]" />

          <p className="mt-6 text-sm font-black uppercase tracking-[0.3em] text-[#D4AF37]">
            The Next Chapter
          </p>

          <h2 className="mt-5 text-5xl font-black leading-tight sm:text-6xl">
            History brought us here.
            <span className="block text-[#D4AF37]">
              Now we have to protect its future.
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-300">
            Our ambition is to secure Woolton Baths through a Community Asset
            Transfer, restore the building in achievable phases and ultimately
            return swimming to this historic pool while once again creating a
            place the wider community can use and enjoy.
          </p>

          <p className="mx-auto mt-6 max-w-3xl text-xl font-black leading-9 text-white">
            The building has survived Victorian Liverpool, two World Wars,
            generations of swimmers and more than a decade of closure.
            We believe its next chapter should belong to the community.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/savewooltonbaths/support"
              className="inline-flex min-h-13 items-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-black text-black transition hover:bg-[#E6C75A]"
            >
              Register Your Support
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/savewooltonbaths"
              className="inline-flex min-h-13 items-center rounded-full border border-white/20 px-7 py-3.5 text-sm font-black text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              See Our Restoration Plan
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SOURCES */}
      {/* ============================================================ */}

      <section className="border-t border-white/10 bg-[#040B12] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
            Historical Sources
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-500">
            Historical information on this page has been compiled from sources
            including the Historic England National Heritage List entry for
            Woolton Baths, historical material published by The Woolton
            Society, Liverpool John Moores University&apos;s record of Olympic
            swimmer Steve Parry, and contemporary published recollections of
            the McCartney family.
          </p>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            Where personal memories are included, they are presented as the
            recollections of the people concerned rather than as independently
            verified events.
          </p>
        </div>
      </section>
    </main>
  );
}

function HistoryStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-7 text-center">
      <p className="text-4xl font-black text-[#D4AF37]">
        {value}
      </p>

      <p className="mt-3 text-sm font-bold leading-6 text-slate-400">
        {label}
      </p>
    </article>
  );
}