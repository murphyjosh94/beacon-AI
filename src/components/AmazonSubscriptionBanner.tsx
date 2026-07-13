const amazonSubscriptionUrl =
  process.env.NEXT_PUBLIC_AMAZON_SUBSCRIPTION_URL?.trim();

export default function AmazonSubscriptionBanner() {
  if (!amazonSubscriptionUrl) {
    return null;
  }

  return (
    <aside
      aria-label="Sponsored Amazon subscription offer"
      className="border-y border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-6 py-4"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-800">
            Sponsored
          </p>

          <p className="mt-1 text-lg font-black text-slate-950">
            Explore Amazon Music Unlimited
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Discover millions of songs and check whether you are eligible for a
            free trial. Offer terms and eligibility are controlled by Amazon.
          </p>
        </div>

        <a
          href={amazonSubscriptionUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="shrink-0 rounded-xl bg-slate-950 px-6 py-3 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          View Amazon Offer
        </a>
      </div>
    </aside>
  );
}