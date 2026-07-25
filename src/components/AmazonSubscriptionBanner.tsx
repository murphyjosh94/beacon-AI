const amazonSubscriptionUrl =
  process.env.NEXT_PUBLIC_AMAZON_SUBSCRIPTION_URL?.trim() ||
  "https://amzn.to/4gWANVu";

export default function AmazonSubscriptionBanner() {
  return (
    <aside
      aria-label="Sponsored Amazon subscription offer"
      className="border-y border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-4 py-4 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-amber-900">
              Sponsored
            </span>

            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Amazon partner offer
            </span>
          </div>

          <p className="mt-3 text-lg font-black text-slate-950 sm:text-xl">
            Explore Amazon Music Unlimited
          </p>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Discover millions of songs and check whether you are eligible for a
            free trial. Availability, eligibility and offer terms are set by
            Amazon.
          </p>
        </div>

        <a
          href={amazonSubscriptionUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label="View the sponsored Amazon Music Unlimited offer"
          className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-300 sm:w-auto"
        >
          View Amazon Offer
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </a>
      </div>
    </aside>
  );
}