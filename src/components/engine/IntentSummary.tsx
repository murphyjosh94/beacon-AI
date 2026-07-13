import type { BeaconIntent } from "@/lib/types";

type IntentSummaryProps = {
  intent: BeaconIntent;
};

function formatValue(value: string | number | undefined) {
  if (value === undefined || value === "") {
    return null;
  }

  return String(value);
}

export default function IntentSummary({
  intent,
}: IntentSummaryProps) {
  const details = [
    {
      label: "Category",
      value:
        intent.category.charAt(0).toUpperCase() +
        intent.category.slice(1),
    },
    {
      label: "Budget",
      value: intent.budget
        ? `Up to £${intent.budget.toLocaleString("en-GB")}`
        : undefined,
    },
    {
      label: "Destination",
      value: intent.destination,
    },
    {
      label: "Departing from",
      value: intent.departingFrom,
    },
    {
      label: "Adults",
      value: intent.adults,
    },
    {
      label: "Children",
      value: intent.children,
    },
    {
      label: "Dates",
      value:
        intent.dates && intent.dates.length > 0
          ? intent.dates.join(", ")
          : undefined,
    },
    {
      label: "Brands",
      value:
        intent.brands && intent.brands.length > 0
          ? intent.brands.join(", ")
          : undefined,
    },
  ].filter((item) => formatValue(item.value) !== null);

  return (
    <section className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6 text-left shadow-lg sm:p-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-800">
        Beacon understood
      </p>

      <h2 className="mt-3 text-2xl font-black text-slate-950">
        Here is what we are searching for.
      </h2>

      {details.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="rounded-2xl border border-blue-100 bg-white p-4"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                {detail.label}
              </p>

              <p className="mt-2 font-black text-slate-950">
                {formatValue(detail.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {intent.preferences.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Preferences
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {intent.preferences.map((preference) => (
              <span
                key={preference}
                className="rounded-full bg-blue-900 px-4 py-2 text-sm font-extrabold text-white"
              >
                {preference}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-sm leading-6 text-slate-600">
        Beacon will use these details to rank suitable options. You will be
        able to edit or refine them in the next version of the engine.
      </p>
    </section>
  );
}