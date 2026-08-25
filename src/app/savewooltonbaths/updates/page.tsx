import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  FileText,
  HandCoins,
  Landmark,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Project Updates | Save Woolton Baths",
  description:
    "Follow the progress of the Save Woolton Baths campaign, including meetings, spending records, public events and restoration progress.",
};

type UpdateSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  emptyTitle: string;
  emptyDescription: string;
};

export default function SaveWooltonBathsUpdatesPage() {
  return (
    <main className="bg-[#071522] text-white">
      {/* ============================================================ */}
      {/* HERO */}
      {/* ============================================================ */}

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
              <ShieldCheck className="h-4 w-4" />
              Project Transparency
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
              Follow the progress.
              <span className="block text-[#D4AF37]">
                See where the project stands.
              </span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-9 text-slate-300 md:text-xl">
              This page will provide a public record of significant meetings,
              campaign spending, public events and visible restoration progress
              as the Save Woolton Baths project develops.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">
              We want supporters to be able to see what is happening, where
              money is being spent and what progress has been made — not simply
              be told that work is taking place.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRINCIPLE */}
      {/* ============================================================ */}

      <section className="bg-[#D4AF37] text-black">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[0.6fr_1.4fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em]">
                Our Approach
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Transparency from the start.
              </h2>
            </div>

            <p className="text-lg font-semibold leading-8 text-black/75">
              The project is still at an early stage, so there are currently no
              formal updates to publish. As meetings take place, funding is
              received and work begins, this page will become the public record
              of the campaign&apos;s progress.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MEETING BREAKDOWNS */}
      {/* ============================================================ */}

      <UpdateSection
        eyebrow="Governance & Discussions"
        title="Meeting Breakdowns"
        description="Key meetings with Liverpool City Council, councillors, heritage professionals, universities, sponsors and other relevant organisations will be summarised here where appropriate."
        icon={Landmark}
        emptyTitle="No meeting updates yet"
        emptyDescription="Meeting summaries will appear here once formal project discussions and relevant meetings have taken place."
      />

      {/* ============================================================ */}
      {/* FUNDS SPENT */}
      {/* ============================================================ */}

      <section className="border-y border-white/10 bg-[#0A1B2B]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-black">
                <ReceiptText className="h-6 w-6" />
              </div>

              <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-[#D4AF37]">
                Financial Transparency
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Proof of Funds Spent
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                Once crowdfunding or other campaign funds begin to be spent,
                this section will record significant expenditure and supporting
                evidence where appropriate.
              </p>

              <div className="mt-7 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5">
                <div className="flex items-start gap-3">
                  <HandCoins className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />

                  <p className="text-sm leading-7 text-slate-300">
                    The campaign website itself has been designed, developed and
                    hosted free of charge by Beacon AI, so campaign funds are not
                    being used for website development or hosting.
                  </p>
                </div>
              </div>
            </div>

            <EmptyUpdateCard
              icon={ReceiptText}
              title="No spending updates yet"
              description="No campaign expenditure has been published yet. Future records may include invoices, receipts, materials purchased and other documented project costs."
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PUBLIC MEETINGS & EVENTS */}
      {/* ============================================================ */}

      <UpdateSection
        eyebrow="Community Engagement"
        title="Public Meetings & Events"
        description="Community meetings, fundraising events, open days, volunteer sessions and other public campaign activity will be listed here."
        icon={Users}
        emptyTitle="No public events announced yet"
        emptyDescription="Dates, venues and event details will appear here when the first public meetings or campaign events are confirmed."
      />

      {/* ============================================================ */}
      {/* PROGRESS IMAGES */}
      {/* ============================================================ */}

      <section className="border-y border-white/10 bg-[#0A1B2B]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-black">
              <Camera className="h-6 w-6" />
            </div>

            <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-[#D4AF37]">
              Visual Record
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Progress Images
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Once access and works begin, we intend to create a photographic
              record of the building&apos;s condition and restoration progress.
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-dashed border-white/15 bg-[#071522] p-8 text-center md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-[#D4AF37]">
              <Camera className="h-8 w-8" />
            </div>

            <h3 className="mt-6 text-2xl font-black">
              No progress images yet
            </h3>

            <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-400">
              Before-and-after images, site visits, surveys, structural work,
              weatherproofing and restoration milestones will be added here as
              the project progresses.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FUTURE UPDATE TYPES */}
      {/* ============================================================ */}

      <section className="bg-[#F2EFE7] text-[#10202A]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#8D7425]">
                What Will Be Published
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight">
                A public record of progress.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-700">
                As the campaign develops, this page can become a central place
                for supporters to follow what has happened and what comes next.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Landmark,
                  title: "Council & stakeholder meetings",
                  description:
                    "Relevant meeting outcomes and agreed next steps.",
                },
                {
                  icon: ReceiptText,
                  title: "Campaign expenditure",
                  description:
                    "Significant spending and supporting financial evidence.",
                },
                {
                  icon: CalendarDays,
                  title: "Public events",
                  description:
                    "Meetings, open days, fundraising and volunteer events.",
                },
                {
                  icon: Camera,
                  title: "Progress photography",
                  description:
                    "A visual record of condition, works and restoration.",
                },
                {
                  icon: FileText,
                  title: "Reports & surveys",
                  description:
                    "Important findings from professional reports where they can be published.",
                },
                {
                  icon: Megaphone,
                  title: "Campaign milestones",
                  description:
                    "Major decisions, funding rounds and project achievements.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <Icon className="h-6 w-6 text-[#8D7425]" />

                    <h3 className="mt-4 text-lg font-black">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CURRENT STATUS */}
      {/* ============================================================ */}

      <section className="bg-[#071522]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="rounded-[2rem] border border-[#D4AF37]/25 bg-[#0A1B2B] p-8 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">
                  Current Position
                </p>

                <h2 className="mt-4 text-3xl font-black">
                  No formal project updates yet.
                </h2>
              </div>

              <div>
                <p className="leading-8 text-slate-300">
                  The campaign is currently focused on establishing support,
                  engaging with relevant parties and developing the proposal.
                  Significant developments will be documented here once they can
                  be publicly confirmed.
                </p>

                <div className="mt-6 flex items-center gap-3 text-sm font-bold text-[#D4AF37]">
                  <CheckCircle2 className="h-5 w-5" />
                  Last status: Campaign preparation stage
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA */}
      {/* ============================================================ */}

      <section className="bg-[#D4AF37] text-black">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:py-20">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Want to be part of the progress?
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-8">
            Register your support, volunteer your skills, offer materials,
            sponsorship or professional assistance and help us build the next
            chapter of Woolton Baths.
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
    </main>
  );
}

function UpdateSection({
  eyebrow,
  title,
  description,
  icon: Icon,
  emptyTitle,
  emptyDescription,
}: UpdateSectionProps) {
  return (
    <section className="bg-[#071522]">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-black">
              <Icon className="h-6 w-6" />
            </div>

            <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-[#D4AF37]">
              {eyebrow}
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              {title}
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              {description}
            </p>
          </div>

          <EmptyUpdateCard
            icon={Icon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      </div>
    </section>
  );
}

function EmptyUpdateCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-[#0A1B2B] p-8 text-center">
      <div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-[#D4AF37]">
          <Icon className="h-8 w-8" />
        </div>

        <h3 className="mt-6 text-2xl font-black text-white">
          {title}
        </h3>

        <p className="mx-auto mt-4 max-w-xl leading-8 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}