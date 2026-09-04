import Link from "next/link";
import {
  ArrowRight,
  BadgePoundSterling,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Construction,
  DoorOpen,
  Droplets,
  Hammer,
  HandHeart,
  HeartHandshake,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  Wrench,
} from "lucide-react";

const restorationPhases = [
  {
    number: "01",
    title: "Secure & Protect",
    subtitle: "Surveys, roof repairs and weatherproofing",
    description:
      "The first priority is protecting the building. We intend to commission appropriate structural and heritage surveys, assess the roof structure and complete the essential repairs required to make Woolton Baths secure and weatherproof.",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Open the Doors",
    subtitle: "Temporary community use and early revenue",
    description:
      "Once the building is safe and suitable for limited occupation, we plan to introduce appropriate temporary community uses, events and activities. This creates a route to generating early income while the wider restoration continues.",
    icon: DoorOpen,
  },
  {
    number: "03",
    title: "Restore the Facilities",
    subtitle: "Reception, changing rooms and internal spaces",
    description:
      "The next phase focuses on the areas people will use every day: reception, changing facilities, toilets and supporting internal spaces, restoring them sympathetically for modern community use.",
    icon: Building2,
  },
  {
    number: "04",
    title: "Rebuild the Infrastructure",
    subtitle: "Plant room, heating, filtration and services",
    description:
      "Swimming pools depend on major mechanical and electrical infrastructure. We intend to rebuild the plant room and install suitable pumps, filtration, heating, controls and building services in a cost-conscious phased programme.",
    icon: Wrench,
  },
  {
    number: "05",
    title: "Bring Back the Water",
    subtitle: "Pool restoration, commissioning and reopening",
    description:
      "The final major phase is the restoration of the pool basin and associated systems, followed by testing, commissioning and the moment the campaign is ultimately working towards: swimming returning to Woolton Baths.",
    icon: Droplets,
  },
];

const supportTypes = [
  "Local residents and community supporters",
  "Plumbers, electricians and mechanical trades",
  "Roofers, builders, plasterers and joiners",
  "Structural and heritage professionals",
  "Pool engineers and leisure-sector specialists",
  "Materials manufacturers and suppliers",
  "Businesses and corporate sponsors",
  "Universities, colleges and student programmes",
];

const currentPhotos = [
  {
    src: "/savewooltonbaths/current-exterior.jpg",
    alt: "Current exterior of Woolton Baths",
    title: "The Building Today",
    text: "The historic exterior of Woolton Baths after more than a decade without public swimming.",
  },
  {
    src: "/savewooltonbaths/current-pool-hall.jpg",
    alt: "Current pool hall inside Woolton Baths",
    title: "The Pool Hall",
    text: "The heart of the building and the space we ultimately want to return to community swimming.",
  },
  {
    src: "/savewooltonbaths/current-interior.jpg",
    alt: "Current interior of Woolton Baths",
    title: "Inside Woolton Baths",
    text: "Years of closure have left a significant restoration challenge, but also an opportunity to preserve something irreplaceable.",
  },
];

const visionPhotos = [
  {
    src: "/savewooltonbaths/vision-exterior.jpg",
    alt: "Concept visualisation of restored Woolton Baths exterior",
    title: "A Restored Entrance",
    text: "A welcoming historic community facility brought back into active use.",
  },
  {
    src: "/savewooltonbaths/vision-pool-hall.jpg",
    alt: "Concept visualisation of restored Woolton Baths swimming pool",
    title: "Swimming Returns",
    text: "Our long-term ambition is simple: bring the water, swimmers and community life back.",
  },
  {
    src: "/savewooltonbaths/vision-community-space.jpg",
    alt: "Concept visualisation of community use inside Woolton Baths",
    title: "More Than a Swimming Pool",
    text: "Community events and suitable dry uses can help the building generate income during its phased restoration.",
  },
];

export default function SaveWooltonBathsPage() {
  return (
    <>
      {/* ================================================================ */}
      {/* HERO */}
      {/* ================================================================ */}

      <section className="relative overflow-hidden bg-[#06121D]">
        <div className="absolute inset-0">
          <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-cyan-400/5 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-36">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#E6C65C]">
              <MapPin className="h-4 w-4" />
              Woolton · Liverpool
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
              16 years closed.
              <span className="mt-3 block text-[#D4AF37]">
                It&apos;s time to bring Woolton Baths back.
              </span>
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl md:leading-9">
              We are building a community-led plan to secure the historic Grade
              II listed Woolton Baths through a Community Asset Transfer from
              Liverpool City Council, restore it in achievable phases and
              return this important building to active community use.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/savewooltonbaths/support"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3 font-bold text-black transition hover:bg-[#E6C75A]"
              >
                Register Your Support
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/savewooltonbaths/donate"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 font-bold text-white transition hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10"
              >
                Crowdfunding
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#D4AF37]" />
                Grade II listed
              </span>

              <span className="inline-flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-[#D4AF37]" />
                Closed since 2010
              </span>

              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-[#D4AF37]" />
                Community-led
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A1B2B] shadow-2xl">
              <img
                src="/savewooltonbaths/current-exterior.jpg"
                alt="Woolton Baths exterior in its current condition"
                className="aspect-[4/5] w-full object-cover"
              />

              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-[#06121D]/90 p-5 backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                  Our mission
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  Protect the building. Reopen the doors. Bring back the water.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PURPOSE */}
      {/* ================================================================ */}

      <section className="border-y border-white/10 bg-[#081824]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                Our Proposal
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
                Community ownership with a practical restoration plan.
              </h2>
            </div>

            <div className="space-y-6 text-lg leading-9 text-slate-300">
              <p>
                Woolton Baths has been closed to the public since 2010. Our aim
                is not simply to campaign for somebody else to save it. We want
                to create a viable community organisation capable of taking
                responsibility for the building and bringing it back into use.
              </p>

              <p>
                We intend to seek a{" "}
                <strong className="text-white">
                  Community Asset Transfer lease from Liverpool City Council
                </strong>{" "}
                and establish an appropriate non-charitable social-enterprise
                structure with community benefit at its core.
              </p>

              <p>
                Rather than attempting to fund every element of the restoration
                at once, the project is designed around a phased programme. The
                building can first be protected, then progressively reopened
                and used to generate revenue while the expensive swimming-pool
                infrastructure is restored.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CURRENT CONDITION */}
      {/* ================================================================ */}

      <section className="bg-[#F2EFE7] text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#8D7425]">
              Woolton Baths Today
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              This is the building we want to save.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-700">
              These photographs document the current condition of Woolton Baths.
              They are also the starting point for the restoration vision we
              want the community to help deliver.
            </p>
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-3">
            {currentPhotos.map((photo) => (
              <article
                key={photo.src}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="aspect-[4/3] w-full object-cover"
                />

                <div className="p-6">
                  <h3 className="text-xl font-black">{photo.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{photo.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* VISION */}
      {/* ================================================================ */}

      <section className="bg-[#071522]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
                <Sparkles className="h-4 w-4" />
                Our Vision
              </div>

              <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
                Not just what Woolton Baths was.
                <span className="block text-[#D4AF37]">
                  What it could become again.
                </span>
              </h2>
            </div>

            <p className="text-lg leading-8 text-slate-300">
              Our concept imagery helps communicate the direction of the
              campaign: restore the building&apos;s character, reopen it to the
              community and ultimately return the pool to active use.
            </p>
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-3">
            {visionPhotos.map((photo) => (
              <article
                key={photo.src}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B1C2B]"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="aspect-[4/3] w-full object-cover"
                />

                <div className="p-6">
                  <h3 className="text-xl font-black text-white">
                    {photo.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-400">{photo.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/8 p-5 text-sm leading-7 text-slate-300">
            <strong className="text-[#E8CB69]">Concept visualisations:</strong>{" "}
            Proposed restoration imagery is illustrative and is intended to
            communicate the campaign&apos;s vision. Final designs will be
            subject to professional surveys, heritage requirements, statutory
            approvals, technical specifications and consultation.
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FIVE PHASES */}
      {/* ================================================================ */}

      <section className="bg-white text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#8D7425]">
              The Restoration Roadmap
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Five phases. One clear destination.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Bringing Woolton Baths back cannot happen overnight. Our plan
              breaks a significant heritage restoration into practical,
              achievable stages.
            </p>
          </div>

          <div className="mt-16 space-y-6">
            {restorationPhases.map((phase, index) => {
              const Icon = phase.icon;

              return (
                <article
                  key={phase.number}
                  className="grid overflow-hidden rounded-3xl border border-slate-200 bg-[#F8F7F3] md:grid-cols-[150px_1fr]"
                >
                  <div className="flex items-center justify-between bg-[#0B1A26] p-7 text-white md:flex-col md:items-start md:justify-center">
                    <span className="text-5xl font-black text-[#D4AF37]">
                      {phase.number}
                    </span>
                    <Icon className="h-8 w-8 text-[#D4AF37]" />
                  </div>

                  <div className="p-7 md:p-9">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-black">{phase.title}</h3>

                      {index === 0 && (
                        <span className="rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#725D18]">
                          First Priority
                        </span>
                      )}
                    </div>

                    <p className="mt-2 font-bold text-[#8D7425]">
                      {phase.subtitle}
                    </p>

                    <p className="mt-5 max-w-4xl leading-8 text-slate-600">
                      {phase.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TRADE-LED MODEL */}
      {/* ================================================================ */}

      <section className="bg-[#0A1B2B]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37] text-black">
              <Hammer className="h-7 w-7" />
            </div>

            <p className="mt-7 text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              Trade Led · Community Powered
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              We want to build differently.
            </h2>

            <div className="mt-7 space-y-5 text-lg leading-8 text-slate-300">
              <p>
                A major part of the proposal is to build a coalition of skilled
                local tradespeople and professionals prepared to contribute
                labour, experience, advice or materials to the restoration.
              </p>

              <p>
                By combining professional volunteer support with supplier
                partnerships, donated materials, recovered equipment and
                carefully targeted fundraising, we believe the project can
                reduce the cost of restoration dramatically compared with a
                conventional fully outsourced programme.
              </p>

              <p>
                Any projected savings remain estimates until detailed surveys,
                specifications and cost plans are complete. The principle,
                however, is straightforward:{" "}
                <strong className="text-white">
                  use the skills already present within our community.
                </strong>
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {supportTypes.map((support) => (
              <div
                key={support}
                className="flex min-h-28 items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37]" />
                <p className="font-semibold leading-7 text-slate-200">
                  {support}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* DRY REOPENING */}
      {/* ================================================================ */}

      <section className="bg-[#ECE8DD] text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="rounded-[2rem] bg-[#102532] p-9 text-white md:p-12">
              <DoorOpen className="h-10 w-10 text-[#D4AF37]" />

              <p className="mt-7 text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
                Phase 2
              </p>

              <h3 className="mt-3 text-3xl font-black">
                The Dry Reopening
              </h3>

              <p className="mt-5 leading-8 text-slate-300">
                Restoring the swimming pool infrastructure is likely to be one
                of the most expensive stages. Our proposal therefore considers
                suitable temporary community uses before the water returns.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">
                The building should not need to stay closed while every phase is
                funded.
              </h2>

              <p className="mt-7 text-lg leading-9 text-slate-700">
                Once safely weatherproofed and suitable for occupation, parts of
                Woolton Baths could potentially support community events,
                activities and other appropriate temporary uses, subject to the
                necessary approvals.
              </p>

              <p className="mt-5 text-lg leading-9 text-slate-700">
                This allows the building to start serving Woolton again while
                also creating an early revenue stream. The intention is for
                income generated by the project to be reinvested into the next
                stages of restoration, particularly the costly mechanical plant
                required to operate the swimming pool.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* INITIAL FUNDING ESTIMATE */}
      {/* ================================================================ */}

      <section className="relative overflow-hidden bg-[#07131D]">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="overflow-hidden rounded-[2.25rem] border border-[#D4AF37]/25 bg-[#0B1D2B]">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
              <div className="flex flex-col justify-center bg-[#D4AF37] p-9 text-black md:p-12">
                <BadgePoundSterling className="h-12 w-12" />

                <p className="mt-7 text-sm font-black uppercase tracking-[0.2em]">
                  Initial Funding Estimate
                </p>

                <p className="mt-3 text-6xl font-black md:text-7xl">
                  Approx. £125,000
                </p>

                <p className="mt-4 text-lg font-bold leading-8">
                  Our current working estimate for the first major stage of
                  protecting and weatherproofing Woolton Baths.
                </p>
              </div>

              <div className="p-9 md:p-12">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
                  Protect the building first
                </p>

                <h2 className="mt-4 text-4xl font-black text-white">
                  Our first crowdfunding campaign will focus on Phase 1.
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-300">
                  We are preparing a city-wide crowdfunding campaign around an
                  initial working estimate of approximately £125,000. This is not
                  a confirmed final funding requirement, and this first funding
                  round is not intended to pay for the entire restoration.
                </p>

                <p className="mt-5 text-lg leading-8 text-slate-300">
                  The final amount will be confirmed and announced once the
                  necessary building surveys, structural assessments and
                  professional reports have been completed. In the meantime, we
                  are actively working to reduce the amount of funding required
                  through donated materials, equipment, professional services
                  and other in-kind support.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {["Roof materials", "Timber", "Slate", "Lime mortar", "Structural works"].map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"
                      >
                        {item}
                      </span>
                    ),
                  )}
                </div>

                <Link
                  href="/savewooltonbaths/donate"
                  className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 font-black text-black transition hover:bg-[#E6C75A]"
                >
                  View Crowdfunding Page
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* COMMUNITY ASSET TRANSFER */}
      {/* ================================================================ */}

      <section className="bg-white text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Landmark className="h-10 w-10 text-[#96791F]" />

              <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[#8D7425]">
                Community Asset Transfer
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                A long-term future for Woolton Baths.
              </h2>

              <p className="mt-7 text-lg leading-9 text-slate-700">
                We intend to seek a Community Asset Transfer arrangement with
                Liverpool City Council that enables an appropriate
                community-focused organisation to take responsibility for the
                building and its restoration.
              </p>
            </div>

            <div className="space-y-5">
              {[
                "Secure a long-term Community Asset Transfer arrangement.",
                "Establish an appropriate community-focused social-enterprise structure.",
                "Protect the future use and community benefit of the building.",
                "Reinvest operating revenue into restoration and long-term sustainability.",
                "Work with elected representatives, professionals, suppliers and residents.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-[#F8F7F3] p-5"
                >
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#96791F]" />
                  <p className="font-semibold leading-7">{item}</p>
                </div>
              ))}

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
                <strong>Campaign status:</strong> The Community Asset Transfer,
                detailed restoration proposals and associated arrangements are
                being pursued and developed. They should not be interpreted as
                having already received formal approval from Liverpool City
                Council.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SUPPORT CTA */}
      {/* ================================================================ */}

      <section className="bg-[#0A1A27]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="text-center">
            <HandHeart className="mx-auto h-12 w-12 text-[#D4AF37]" />

            <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              Get Involved
            </p>

            <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
              You don&apos;t have to donate money to help save Woolton Baths.
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Support can mean giving your time, professional skills, materials,
              equipment, advice, sponsorship, funding or simply adding your
              voice to the campaign.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <Link
              href="/savewooltonbaths/support"
              className="group rounded-[2rem] border border-[#D4AF37]/30 bg-[#D4AF37] p-8 text-black transition hover:-translate-y-1"
            >
              <HeartHandshake className="h-10 w-10" />

              <h3 className="mt-8 text-3xl font-black">
                Register Your Support
              </h3>

              <p className="mt-4 max-w-xl leading-8">
                Volunteer, pledge professional labour, offer materials, discuss
                sponsorship or funding, provide technical advice or simply tell
                us that you support bringing Woolton Baths back.
              </p>

              <span className="mt-8 inline-flex items-center gap-2 font-black">
                Support the campaign
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/savewooltonbaths/donate"
              className="group rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white transition hover:-translate-y-1 hover:border-[#D4AF37]/40"
            >
              <BadgePoundSterling className="h-10 w-10 text-[#D4AF37]" />

              <h3 className="mt-8 text-3xl font-black">
                Crowdfunding Coming Soon
              </h3>

              <p className="mt-4 max-w-xl leading-8 text-slate-300">
                Our Phase 1 crowdfunding campaign is being prepared around an
                initial estimate of approximately £125,000. The final funding
                requirement will be confirmed once the necessary surveys and
                professional reports have been completed.
              </p>

              <span className="mt-8 inline-flex items-center gap-2 font-black text-[#D4AF37]">
                View campaign information
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FINAL STATEMENT */}
      {/* ================================================================ */}

      <section className="relative overflow-hidden bg-[#D4AF37] text-black">
        <div className="absolute right-[-5rem] top-[-7rem] opacity-10">
          <Waves className="h-80 w-80" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center md:py-24">
          <Construction className="mx-auto h-11 w-11" />

          <h2 className="mt-7 text-4xl font-black tracking-tight md:text-6xl">
            Protect it. Restore it.
            <span className="block">Bring the water back.</span>
          </h2>

          <p className="mx-auto mt-7 max-w-3xl text-lg font-semibold leading-9">
            Woolton Baths has already spent 16 years behind closed doors. We
            believe a community-led, trade-powered restoration can give this
            historic building a future.
          </p>

          <Link
            href="/savewooltonbaths/support"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#07131D] px-8 py-4 font-black text-white transition hover:bg-black"
          >
            Join Save Woolton Baths
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}