import Link from "next/link";
import {
  ArrowRight,
  BadgePoundSterling,
  Building2,
  CheckCircle2,
  Clock3,
  Construction,
  Droplets,
  ExternalLink,
  Hammer,
  HeartHandshake,
  Landmark,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
} from "lucide-react";

const firstRoundUses = [
  {
    title: "Structural & heritage surveys",
    description:
      "Professional assessment of the building, roof structure and priority repair areas before major works begin.",
    icon: Landmark,
  },
  {
    title: "Roof repairs",
    description:
      "Priority repair work required to protect vulnerable areas of the historic roof and prevent further deterioration.",
    icon: Construction,
  },
  {
    title: "Weatherproofing",
    description:
      "Securing the building envelope so the wider phased restoration can progress from a protected and stable shell.",
    icon: ShieldCheck,
  },
  {
    title: "Essential materials",
    description:
      "Initial raw materials such as suitable timber, slate, lime mortar and other approved restoration materials.",
    icon: PackageOpen,
  },
];

const phases = [
  {
    number: "01",
    title: "Protect the Building",
    description:
      "Surveys, roof repairs and weatherproofing.",
    active: true,
  },
  {
    number: "02",
    title: "Dry Reopening",
    description:
      "Suitable temporary community use and events.",
    active: false,
  },
  {
    number: "03",
    title: "Internal Fit-Out",
    description:
      "Reception, changing facilities and internal spaces.",
    active: false,
  },
  {
    number: "04",
    title: "Plant & Services",
    description:
      "Heating, filtration, pumps and mechanical systems.",
    active: false,
  },
  {
    number: "05",
    title: "Bring Back the Water",
    description:
      "Pool restoration, commissioning and full reopening.",
    active: false,
  },
];

export default function SaveWooltonBathsDonatePage() {
  return (
    <>
      {/* ================================================================ */}
      {/* HERO */}
      {/* ================================================================ */}

      <section className="relative overflow-hidden bg-[#071522]">
        <div className="absolute -left-32 top-16 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                <BadgePoundSterling className="h-4 w-4" />
                Crowdfunding
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                Help fund the
                <span className="block text-[#D4AF37]">
                  first stage of restoration.
                </span>
              </h1>

              <p className="mt-7 max-w-3xl text-lg leading-9 text-slate-300 md:text-xl">
                Our current initial funding estimate is approximately{" "}
                <strong className="text-white">£125,000</strong>. The final funding
                requirement will be confirmed and announced once the necessary
                building surveys, structural assessments and professional reports
                have been completed.
              </p>

              <div className="mt-8 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-5">
                <p className="font-black text-[#E6C75A]">
                  Important: approximately £125,000 is our current initial funding estimate.
                </p>

                <p className="mt-2 leading-7 text-slate-300">
                  It is not a confirmed final restoration cost. The final amount will be
                  announced once the necessary surveys and professional reports
                  are complete. Donated labour, materials, equipment and other
                  in-kind support may reduce the amount of funding ultimately required.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#D4AF37]/25 bg-[#0B1D2B] p-8 md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
                Initial Funding Estimate
              </p>

              <p className="mt-4 text-6xl font-black text-white md:text-7xl">
                Approx. £125,000
              </p>

              <p className="mt-4 text-lg font-bold leading-8 text-slate-300">
                Phase 1 seed funding for surveys, roof repairs,
                weatherproofing and essential restoration materials.
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-[#D4AF37]" />

                  <p className="font-black text-white">
                    Crowdfunding launching soon
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Donations are not yet open. This page will connect directly
                  to the official Crowdfunder campaign once the first funding
                  round launches.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* COMING SOON */}
      {/* ================================================================ */}

      <section className="bg-[#D4AF37] text-black">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <Sparkles className="mt-1 h-7 w-7 shrink-0" />

              <div>
                <p className="text-xl font-black">
                  Official Crowdfunder campaign coming soon
                </p>

                <p className="mt-1 font-semibold">
                  We are preparing the first funding round before public
                  donations open.
                </p>
              </div>
            </div>

            <div
              aria-disabled="true"
              className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-black/15 px-6 py-3 font-black opacity-75"
            >
              Donate via Crowdfunder
              <ExternalLink className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* INITIAL FUNDING ESTIMATE */}
      {/* ================================================================ */}

      <section className="bg-[#F2EFE7] text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Target className="h-10 w-10 text-[#8D7425]" />

              <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[#8D7425]">
                Round One
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Why approximately £125,000?
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-700">
                The first funding round is designed to deal with the most
                urgent priority: protecting the building itself.
              </p>

              <p className="mt-5 text-lg leading-8 text-slate-700">
                Before reception areas, pool systems or changing rooms can be
                restored, Woolton Baths needs a secure, weatherproof shell and
                an accurate professional understanding of its condition.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {firstRoundUses.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102532] text-[#D4AF37]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-5 text-xl font-black">
                      {item.title}
                    </h3>

                    <p className="mt-3 leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* NOT THE TOTAL */}
      {/* ================================================================ */}

      <section className="bg-[#0A1B2B]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <BadgePoundSterling className="mx-auto h-11 w-11 text-[#D4AF37]" />

            <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              A Phased Funding Model
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              The final funding requirement is still to be confirmed.
            </h2>

            <p className="mt-7 text-lg leading-9 text-slate-300">
              The current figure of approximately £125,000 is an initial estimate. The
              final amount will be announced once the necessary building surveys,
              structural assessments and professional reports have been completed.
              Our partnership work may also reduce the amount ultimately required
              through donated labour, materials, equipment and professional support.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-5">
            {phases.map((phase) => (
              <article
                key={phase.number}
                className={`rounded-3xl border p-6 ${
                  phase.active
                    ? "border-[#D4AF37]/50 bg-[#D4AF37]/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <p
                  className={`text-3xl font-black ${
                    phase.active ? "text-[#D4AF37]" : "text-slate-600"
                  }`}
                >
                  {phase.number}
                </p>

                <h3 className="mt-5 text-lg font-black text-white">
                  {phase.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {phase.description}
                </p>

                {phase.active && (
                  <span className="mt-5 inline-flex rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-black uppercase tracking-wider text-black">
                    First Round
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* HOW FUTURE PHASES ARE FUNDED */}
      {/* ================================================================ */}

      <section className="bg-white text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <HeartHandshake className="h-10 w-10 text-[#8D7425]" />

              <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[#8D7425]">
                Beyond Round One
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Future phases will use more than crowdfunding.
              </h2>

              <p className="mt-7 text-lg leading-9 text-slate-700">
                The wider restoration strategy combines future fundraising with
                donated professional labour, materials, equipment, supplier
                partnerships, grants, sponsorship and revenue generated by the
                building as it begins to reopen.
              </p>

              <p className="mt-5 text-lg leading-9 text-slate-700">
                This mixed approach is central to the project. We do not believe
                the community should be expected to fund every element of the
                eventual restoration purely through individual donations.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Crowdfunding rounds",
                  icon: BadgePoundSterling,
                },
                {
                  label: "Donated skilled labour",
                  icon: Hammer,
                },
                {
                  label: "Materials & equipment",
                  icon: Wrench,
                },
                {
                  label: "Business sponsorship",
                  icon: Building2,
                },
                {
                  label: "Grants & funding",
                  icon: Target,
                },
                {
                  label: "Reinvested project income",
                  icon: Droplets,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-[#F8F7F3] p-5"
                  >
                    <Icon className="h-6 w-6 shrink-0 text-[#8D7425]" />

                    <p className="font-black leading-7">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TRANSPARENCY */}
      {/* ================================================================ */}

      <section className="bg-[#ECE8DD] text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <ShieldCheck className="h-10 w-10 text-[#8D7425]" />

              <h2 className="mt-5 text-3xl font-black">
                Funding transparency
              </h2>
            </div>

            <div>
              <p className="text-lg leading-9 text-slate-700">
                As the project develops, we intend to make the purpose of each
                funding round clear so supporters can understand what stage of
                the restoration they are helping to deliver.
              </p>

              <div className="mt-7 space-y-4">
                {[
                  "Approximately £125,000 will be identified publicly as the current initial funding estimate, not a confirmed final requirement.",
                  "Later fundraising will be separated into future restoration phases where practical.",
                  "Major donated materials, equipment and professional support can be recorded alongside financial contributions.",
                  "Campaign funds will not be used to pay Beacon AI for development or hosting of this website.",
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#8D7425]" />
                    <p className="font-semibold leading-7 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FUTURE CROWDFUNDER COUNTER */}
      {/* ================================================================ */}

      <section className="bg-[#071522]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="rounded-[2rem] border border-white/10 bg-[#0B1D2B] p-8 md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">
                  Live Campaign Tracker
                </p>

                <h2 className="mt-4 text-4xl font-black text-white">
                  Live donations will appear here when Round One launches.
                </h2>

                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                  Once the official Crowdfunder campaign is live, this page is
                  intended to show the current amount raised and provide a
                  direct route to the official donation page.
                </p>
              </div>

              <div className="rounded-3xl border border-[#D4AF37]/25 bg-[#071522] p-7">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                      Initial Funding Estimate
                    </p>

                    <p className="mt-2 text-4xl font-black text-white">
                      Approx. £125,000
                    </p>
                  </div>

                  <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">
                    Coming Soon
                  </p>
                </div>

                <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-0 rounded-full bg-[#D4AF37]" />
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-400">
                  The live total will begin when public crowdfunding opens.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SUPPORT INSTEAD */}
      {/* ================================================================ */}

      <section className="bg-[#D4AF37] text-black">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:py-20">
          <Users className="mx-auto h-10 w-10" />

          <h2 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
            Want to help before crowdfunding opens?
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-8">
            You can already register your support, offer skilled labour,
            materials, equipment, sponsorship, funding opportunities or
            professional advice.
          </p>

          <Link
            href="/savewooltonbaths/support"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#071522] px-7 py-3 font-black text-white transition hover:bg-black"
          >
            Register Your Support
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}