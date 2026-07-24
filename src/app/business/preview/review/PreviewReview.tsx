"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type PackageId = "starter" | "business" | "premium";
type ReviewDecision = "changes" | "approved" | null;

type BriefData = {
  businessName: string;
  businessType: string;
  businessDescription: string;
  yearsTrading: string;
  serviceArea: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  primaryColour: string;
  secondaryColour: string;
  styleDirection: string;
  services: string;
  idealCustomer: string;
  keyMessage: string;
  callToAction: string;
  socialLinks: string;
  packageId: PackageId;
  chatbot: boolean;
  onlineShop: boolean;
  membershipArea: boolean;
  notes: string;
  submittedAt?: string;
};

type ReviewData = {
  decision: ReviewDecision;
  overallFeedback: string;
  contentChanges: string;
  designChanges: string;
  featureChanges: string;
  contactChanges: string;
  approvedAt?: string;
  submittedAt?: string;
};

const BRIEF_STORAGE_KEY = "beacon-business-website-brief";
const REVIEW_STORAGE_KEY = "beacon-business-preview-review";

const packages = {
  starter: {
    name: "Starter Website",
    price: 150,
  },
  business: {
    name: "Business Website",
    price: 350,
  },
  premium: {
    name: "Premium Website",
    price: 600,
  },
} satisfies Record<
  PackageId,
  {
    name: string;
    price: number;
  }
>;

const modules = [
  {
    key: "chatbot" as const,
    name: "AI Chatbot",
    price: 50,
  },
  {
    key: "onlineShop" as const,
    name: "Online Shop",
    price: 50,
  },
  {
    key: "membershipArea" as const,
    name: "Membership Area",
    price: 37.5,
  },
];

const initialReview: ReviewData = {
  decision: null,
  overallFeedback: "",
  contentChanges: "",
  designChanges: "",
  featureChanges: "",
  contactChanges: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function ReviewTextArea({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: keyof ReviewData;
  label: string;
  value: string;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="block">
      <span className="font-extrabold text-slate-900">{label}</span>

      <textarea
        id={id}
        name={id}
        rows={5}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

export default function PreviewReview() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [review, setReview] = useState<ReviewData>(initialReview);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedBrief = window.localStorage.getItem(BRIEF_STORAGE_KEY);
    const savedReview = window.localStorage.getItem(REVIEW_STORAGE_KEY);

    if (savedBrief) {
      try {
        setBrief(JSON.parse(savedBrief) as BriefData);
      } catch {
        window.localStorage.removeItem(BRIEF_STORAGE_KEY);
      }
    }

    if (savedReview) {
      try {
        const parsed = JSON.parse(savedReview) as ReviewData;
        setReview({
          ...initialReview,
          ...parsed,
        });
        setSubmitted(Boolean(parsed.submittedAt));
      } catch {
        window.localStorage.removeItem(REVIEW_STORAGE_KEY);
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(review));
    setSaved(true);

    const timer = window.setTimeout(() => {
      setSaved(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [review, loaded]);

  const selectedModules = useMemo(() => {
    if (!brief) {
      return [];
    }

    return modules.filter((module) => brief[module.key]);
  }, [brief]);

  const estimatedTotal = useMemo(() => {
    if (!brief) {
      return 0;
    }

    return (
      packages[brief.packageId].price +
      selectedModules.reduce((sum, module) => sum + module.price, 0)
    );
  }, [brief, selectedModules]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    setReview((current) => ({
      ...current,
      [name]: value,
      submittedAt: undefined,
      approvedAt: undefined,
    }));

    setSubmitted(false);
    setError("");
  };

  const selectDecision = (decision: Exclude<ReviewDecision, null>) => {
    setReview((current) => ({
      ...current,
      decision,
      submittedAt: undefined,
      approvedAt: undefined,
    }));

    setSubmitted(false);
    setError("");
  };

  const submitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!review.decision) {
      setError("Choose whether you approve the preview or want changes.");
      return;
    }

    if (
      review.decision === "changes" &&
      !review.overallFeedback.trim() &&
      !review.contentChanges.trim() &&
      !review.designChanges.trim() &&
      !review.featureChanges.trim() &&
      !review.contactChanges.trim()
    ) {
      setError("Add at least one change request before submitting.");
      return;
    }

    const submittedAt = new Date().toISOString();

    const completedReview: ReviewData = {
      ...review,
      submittedAt,
      approvedAt: review.decision === "approved" ? submittedAt : undefined,
    };

    setReview(completedReview);
    window.localStorage.setItem(
      REVIEW_STORAGE_KEY,
      JSON.stringify(completedReview)
    );
    setSubmitted(true);
    setError("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetReview = () => {
    setReview(initialReview);
    setSubmitted(false);
    setError("");
    window.localStorage.removeItem(REVIEW_STORAGE_KEY);
  };

  if (!loaded) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl animate-pulse rounded-[2rem] bg-white p-10 shadow-xl">
          <div className="h-8 w-56 rounded bg-slate-200" />
          <div className="mt-6 h-72 rounded-[2rem] bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!brief) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-2xl">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 text-3xl">
            📝
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-blue-900">
            Preview Review
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Your website brief is required first.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Create your business website brief and review the interactive
            preview before approving the design or requesting changes.
          </p>

          <Link
            href="/business/website"
            className="mt-8 inline-flex rounded-2xl bg-blue-950 px-8 py-4 font-extrabold text-white transition hover:bg-blue-900"
          >
            Create my website brief
          </Link>
        </div>
      </section>
    );
  }

  if (submitted) {
    const approved = review.decision === "approved";

    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-2xl sm:p-12">
          <span
            className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black text-white ${
              approved ? "bg-emerald-600" : "bg-blue-950"
            }`}
          >
            {approved ? "✓" : "↻"}
          </span>

          <p
            className={`mt-6 text-sm font-extrabold uppercase tracking-[0.3em] ${
              approved ? "text-emerald-700" : "text-blue-900"
            }`}
          >
            {approved ? "Preview Approved" : "Changes Submitted"}
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            {approved
              ? "Your website direction is approved."
              : "Your requested changes have been saved."}
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {approved
              ? "The next stage is confirming the final scope and moving to secure payment before the professional build begins."
              : "Your feedback is ready for the next preview revision. No payment is required while the design direction is still being reviewed."}
          </p>

          <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-slate-50 p-6 text-left">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <span className="font-bold text-slate-600">Business</span>
              <span className="font-black text-slate-950">
                {brief.businessName}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-4">
              <span className="font-bold text-slate-600">Package</span>
              <span className="font-black text-slate-950">
                {packages[brief.packageId].name}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <span className="font-bold text-slate-600">
                Estimated configuration
              </span>
              <span className="text-2xl font-black text-blue-950">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900"
            >
              Return to dashboard
            </Link>

            <Link
              href="/business/preview"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-7 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
            >
              View preview
            </Link>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="rounded-2xl border border-slate-300 px-7 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
            >
              Edit review
            </button>
          </div>

          <button
            type="button"
            onClick={resetReview}
            className="mt-5 text-sm font-bold text-slate-500 underline underline-offset-4 transition hover:text-slate-900"
          >
            Clear this review
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
            Preview Review
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Approve the direction or tell us what should change.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
            Review the interactive preview carefully. Your feedback becomes the
            clear instruction for the next website revision.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/business/preview"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-extrabold text-blue-950 transition hover:bg-blue-50"
            >
              Open website preview
            </Link>

            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-extrabold text-white transition hover:bg-white/20"
            >
              Business dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <form
          onSubmit={submitReview}
          className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_350px]"
        >
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                  Your Decision
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Is the preview ready to move forward?
                </h2>
              </div>

              <span className="text-sm font-bold text-emerald-700">
                {saved ? "Review saved" : "Saved locally"}
              </span>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <button
                type="button"
                onClick={() => selectDecision("approved")}
                className={`rounded-[2rem] border p-6 text-left transition ${
                  review.decision === "approved"
                    ? "border-emerald-600 bg-emerald-50 shadow-lg"
                    : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-white"
                }`}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-xl font-black text-white">
                  ✓
                </span>

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  Approve the direction
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  I am happy with the overall design, structure and direction
                  and want to move toward final scope and payment.
                </p>
              </button>

              <button
                type="button"
                onClick={() => selectDecision("changes")}
                className={`rounded-[2rem] border p-6 text-left transition ${
                  review.decision === "changes"
                    ? "border-blue-700 bg-blue-50 shadow-lg"
                    : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-white"
                }`}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-950 text-xl font-black text-white">
                  ↻
                </span>

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  Request changes
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  I want to adjust parts of the content, design, features or
                  contact information before approving the preview.
                </p>
              </button>
            </div>

            {error ? (
              <p className="mt-5 rounded-2xl bg-rose-50 px-5 py-4 font-semibold text-rose-800">
                {error}
              </p>
            ) : null}

            {review.decision === "changes" ? (
              <div className="mt-10 space-y-7 border-t border-slate-200 pt-8">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                    Change Request
                  </p>

                  <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Tell us exactly what should be different.
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    Clear, specific feedback helps Beacon produce a stronger
                    revision without unnecessary delays.
                  </p>
                </div>

                <ReviewTextArea
                  id="overallFeedback"
                  label="Overall feedback"
                  value={review.overallFeedback}
                  onChange={handleChange}
                  placeholder="Describe your overall impression and the most important change."
                />

                <ReviewTextArea
                  id="contentChanges"
                  label="Content changes"
                  value={review.contentChanges}
                  onChange={handleChange}
                  placeholder="List wording, services, headings or information that should be added, removed or rewritten."
                />

                <ReviewTextArea
                  id="designChanges"
                  label="Design changes"
                  value={review.designChanges}
                  onChange={handleChange}
                  placeholder="Describe changes to colours, spacing, layout, style or the overall visual direction."
                />

                <ReviewTextArea
                  id="featureChanges"
                  label="Feature changes"
                  value={review.featureChanges}
                  onChange={handleChange}
                  placeholder="Describe forms, galleries, booking tools, shop features or other functionality you want adjusted."
                />

                <ReviewTextArea
                  id="contactChanges"
                  label="Contact and business detail changes"
                  value={review.contactChanges}
                  onChange={handleChange}
                  placeholder="Correct any telephone numbers, email addresses, service areas, opening hours or business details."
                />
              </div>
            ) : null}

            {review.decision === "approved" ? (
              <div className="mt-10 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
                <p className="font-black text-emerald-900">
                  Approval confirms the design direction—not a payment.
                </p>

                <p className="mt-3 leading-7 text-emerald-800">
                  Beacon will confirm the final scope, package and price before
                  asking you to complete a secure payment.
                </p>
              </div>
            ) : null}

            <div className="mt-10 border-t border-slate-200 pt-6">
              <button
                type="submit"
                className="w-full rounded-2xl bg-blue-950 px-7 py-4 text-lg font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-900"
              >
                {review.decision === "approved"
                  ? "Approve website direction"
                  : review.decision === "changes"
                    ? "Submit change request"
                    : "Choose a decision"}
              </button>
            </div>
          </div>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl lg:sticky lg:top-6">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Project Summary
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              {brief.businessName}
            </h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">
                  Website package
                </p>

                <p className="mt-1 font-black text-slate-950">
                  {packages[brief.packageId].name}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">
                  Optional modules
                </p>

                <p className="mt-1 font-black text-slate-950">
                  {selectedModules.length
                    ? selectedModules.map((module) => module.name).join(", ")
                    : "None selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-blue-950 p-5 text-white">
                <p className="text-sm font-bold text-blue-200">
                  Estimated configuration
                </p>

                <p className="mt-2 text-3xl font-black">
                  {formatCurrency(estimatedTotal)}
                </p>

                <p className="mt-2 text-xs leading-5 text-blue-200">
                  Final scope and price are confirmed before payment.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-semibold leading-6 text-blue-950">
              Preview review data is currently saved on this device. The
              database stage will connect it to the customer account.
            </div>
          </aside>
        </form>
      </section>
    </>
  );
}