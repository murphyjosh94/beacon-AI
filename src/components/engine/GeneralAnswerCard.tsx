type GeneralAnswerCardProps = {
  query: string;
  answer: string;
  usedWebSearch?: boolean;
  generatedAt?: string;
};

function formatGeneratedTime(value?: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderAnswerParagraphs(answer: string) {
  return answer
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p
        key={`${paragraph.slice(0, 40)}-${index}`}
        className="leading-8 text-slate-700"
      >
        {paragraph}
      </p>
    ));
}

export default function GeneralAnswerCard({
  query,
  answer,
  usedWebSearch = false,
  generatedAt,
}: GeneralAnswerCardProps) {
  const formattedTime = formatGeneratedTime(generatedAt);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-left shadow-2xl">
      <div className="bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-200">
              Beacon Answer
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Here&apos;s what I found
            </h2>
          </div>

          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-100 backdrop-blur">
            {usedWebSearch ? "Live web research" : "Beacon knowledge"}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-200">
            Your request
          </p>

          <p className="mt-2 font-semibold leading-7 text-white">
            “{query}”
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="space-y-5">
          {renderAnswerParagraphs(answer)}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 text-sm text-slate-500">
          <p>
            Beacon may use live web research where current information is
            important.
          </p>

          {formattedTime && (
            <p className="font-semibold">
              Generated {formattedTime}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-2xl bg-blue-50 p-4">
          <p className="text-sm leading-6 text-blue-950">
            Beacon can help explain, compare, plan and research, but it cannot
            complete purchases, bookings or professional decisions on your
            behalf.
          </p>
        </div>
      </div>
    </section>
  );
}