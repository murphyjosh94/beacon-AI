"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type JobStatus =
  | "enquiry"
  | "quoted"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

type JobPriority = "low" | "normal" | "high" | "urgent";

type JobRecord = {
  id: string;
  jobNumber: string;
  title: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  status: JobStatus;
  priority: JobPriority;
  scheduledDate: string;
  scheduledTime: string;
  estimatedHours: number;
  assignedTo: string;
  description: string;
  internalNotes: string;
  quotedValue: number;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

const JOBS_STORAGE_KEY = "beacon-business-jobs";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: JobStatus) {
  switch (status) {
    case "enquiry":
      return "Enquiry";
    case "quoted":
      return "Quoted";
    case "scheduled":
      return "Scheduled";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

function priorityLabel(priority: JobPriority) {
  switch (priority) {
    case "low":
      return "Low";
    case "normal":
      return "Normal";
    case "high":
      return "High";
    case "urgent":
      return "Urgent";
  }
}

function statusClasses(status: JobStatus) {
  switch (status) {
    case "enquiry":
      return "bg-slate-200 text-slate-700";
    case "quoted":
      return "bg-indigo-100 text-indigo-800";
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-amber-100 text-amber-900";
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
  }
}

function priorityClasses(priority: JobPriority) {
  switch (priority) {
    case "low":
      return "bg-slate-100 text-slate-700";
    case "normal":
      return "bg-blue-50 text-blue-800";
    case "high":
      return "bg-amber-100 text-amber-900";
    case "urgent":
      return "bg-rose-100 text-rose-800";
  }
}

function parseStoredJobs(raw: string | null): JobRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((job): job is JobRecord => {
      if (!job || typeof job !== "object") {
        return false;
      }

      const candidate = job as Partial<JobRecord>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.jobNumber === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.status === "string" &&
        typeof candidate.priority === "string"
      );
    });
  } catch {
    return [];
  }
}

function createNewJob(sequence: number): JobRecord {
  const now = new Date().toISOString();

  return {
    id: createId("job"),
    jobNumber: `BJ-${new Date().getFullYear()}-${String(sequence).padStart(
      4,
      "0",
    )}`,
    title: "",
    customerName: "",
    customerCompany: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    status: "enquiry",
    priority: "normal",
    scheduledDate: "",
    scheduledTime: "09:00",
    estimatedHours: 1,
    assignedTo: "",
    description: "",
    internalNotes: "",
    quotedValue: 0,
    invoiceNumber: "",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}

export default function BusinessJobsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [activeJob, setActiveJob] = useState<JobRecord | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | JobPriority
  >("all");
  const [loaded, setLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = parseStoredJobs(
      window.localStorage.getItem(JOBS_STORAGE_KEY),
    );

    setJobs(stored);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    window.localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs, loaded]);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timer = window.setTimeout(() => setSavedMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  const statistics = useMemo(() => {
    const scheduled = jobs.filter((job) => job.status === "scheduled").length;
    const inProgress = jobs.filter(
      (job) => job.status === "in_progress",
    ).length;
    const completed = jobs.filter((job) => job.status === "completed").length;
    const pipelineValue = jobs
      .filter((job) => job.status !== "cancelled")
      .reduce((sum, job) => sum + job.quotedValue, 0);

    return {
      total: jobs.length,
      scheduled,
      inProgress,
      completed,
      pipelineValue,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        [
          job.jobNumber,
          job.title,
          job.customerName,
          job.customerCompany,
          job.customerEmail,
          job.customerPhone,
          job.address,
          job.assignedTo,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || job.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [jobs, priorityFilter, search, statusFilter]);

  const upcomingJobs = useMemo(
    () =>
      [...jobs]
        .filter(
          (job) =>
            job.scheduledDate &&
            job.status !== "completed" &&
            job.status !== "cancelled",
        )
        .sort((a, b) =>
          `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(
            `${b.scheduledDate}T${b.scheduledTime}`,
          ),
        )
        .slice(0, 5),
    [jobs],
  );

  function startNewJob() {
    setActiveJob(createNewJob(jobs.length + 1));
    setSavedMessage(null);
  }

  function updateActiveJob(updater: (job: JobRecord) => JobRecord) {
    setActiveJob((current) => {
      if (!current) {
        return current;
      }

      return updater({
        ...current,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  function saveJob() {
    if (!activeJob) {
      return;
    }

    const normalisedJob: JobRecord = {
      ...activeJob,
      jobNumber: activeJob.jobNumber.trim(),
      title: activeJob.title.trim(),
      customerName: activeJob.customerName.trim(),
      customerCompany: activeJob.customerCompany.trim(),
      customerEmail: activeJob.customerEmail.trim(),
      customerPhone: activeJob.customerPhone.trim(),
      address: activeJob.address.trim(),
      assignedTo: activeJob.assignedTo.trim(),
      description: activeJob.description.trim(),
      internalNotes: activeJob.internalNotes.trim(),
      invoiceNumber: activeJob.invoiceNumber.trim(),
      estimatedHours: Math.max(0, Number(activeJob.estimatedHours) || 0),
      quotedValue: Math.max(0, Number(activeJob.quotedValue) || 0),
      completedAt:
        activeJob.status === "completed"
          ? activeJob.completedAt || new Date().toISOString()
          : null,
      updatedAt: new Date().toISOString(),
    };

    setJobs((current) => {
      const exists = current.some((job) => job.id === normalisedJob.id);

      if (exists) {
        return current.map((job) =>
          job.id === normalisedJob.id ? normalisedJob : job,
        );
      }

      return [normalisedJob, ...current];
    });

    setActiveJob(normalisedJob);
    setSavedMessage("Job saved successfully.");
  }

  function deleteJob(id: string) {
    setJobs((current) => current.filter((job) => job.id !== id));

    if (activeJob?.id === id) {
      setActiveJob(null);
    }
  }

  function duplicateJob(job: JobRecord) {
    const now = new Date().toISOString();

    setActiveJob({
      ...job,
      id: createId("job"),
      jobNumber: `BJ-${new Date().getFullYear()}-${String(
        jobs.length + 1,
      ).padStart(4, "0")}`,
      title: job.title ? `${job.title} Copy` : "",
      status: "enquiry",
      scheduledDate: "",
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  function markInProgress() {
    updateActiveJob((job) => ({
      ...job,
      status: "in_progress",
    }));
  }

  function markCompleted() {
    updateActiveJob((job) => ({
      ...job,
      status: "completed",
      completedAt: new Date().toISOString(),
    }));
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-12 w-72 rounded bg-slate-200" />
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-16 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-blue-200">
                Beacon Jobs
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Manage work from enquiry to completion.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
                Schedule jobs, assign work, track progress and keep every
                customer project moving.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/business/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-extrabold text-white transition hover:bg-white/20"
              >
                Back to Dashboard
              </Link>

              <button
                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 font-extrabold text-slate-950 transition hover:bg-amber-300"
                onClick={startNewJob}
                type="button"
              >
                + New Job
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Total Jobs
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.total}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Scheduled
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.scheduled}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                In Progress
              </p>
              <p className="mt-3 text-3xl font-black">
                {statistics.inProgress}
              </p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Completed
              </p>
              <p className="mt-3 text-3xl font-black">{statistics.completed}</p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                Pipeline Value
              </p>
              <p className="mt-3 text-3xl font-black">
                {formatCurrency(statistics.pipelineValue)}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          {activeJob ? (
            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.8fr]">
              <section className="space-y-6">
                <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                        Job Record
                      </p>
                      <h2 className="mt-3 text-3xl font-black">
                        {activeJob.title || activeJob.jobNumber}
                      </h2>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <select
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            status: event.target.value as JobStatus,
                          }))
                        }
                        value={activeJob.status}
                      >
                        <option value="enquiry">Enquiry</option>
                        <option value="quoted">Quoted</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <select
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            priority: event.target.value as JobPriority,
                          }))
                        }
                        value={activeJob.priority}
                      >
                        <option value="low">Low priority</option>
                        <option value="normal">Normal priority</option>
                        <option value="high">High priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Job number
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            jobNumber: event.target.value,
                          }))
                        }
                        value={activeJob.jobNumber}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Job title
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            title: event.target.value,
                          }))
                        }
                        placeholder="e.g. Kitchen installation"
                        value={activeJob.title}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Customer name
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            customerName: event.target.value,
                          }))
                        }
                        value={activeJob.customerName}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Company
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            customerCompany: event.target.value,
                          }))
                        }
                        value={activeJob.customerCompany}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Customer email
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            customerEmail: event.target.value,
                          }))
                        }
                        type="email"
                        value={activeJob.customerEmail}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Customer telephone
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            customerPhone: event.target.value,
                          }))
                        }
                        type="tel"
                        value={activeJob.customerPhone}
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Job address
                      </span>
                      <textarea
                        className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            address: event.target.value,
                          }))
                        }
                        value={activeJob.address}
                      />
                    </label>
                  </div>
                </article>

                <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                    Scheduling
                  </p>
                  <h2 className="mt-3 text-3xl font-black">
                    Plan when and who.
                  </h2>

                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Scheduled date
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        min={todayIso()}
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            scheduledDate: event.target.value,
                            status:
                              event.target.value && job.status === "enquiry"
                                ? "scheduled"
                                : job.status,
                          }))
                        }
                        type="date"
                        value={activeJob.scheduledDate}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Start time
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            scheduledTime: event.target.value,
                          }))
                        }
                        type="time"
                        value={activeJob.scheduledTime}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Estimated hours
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        min="0"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            estimatedHours: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          }))
                        }
                        step="0.5"
                        type="number"
                        value={activeJob.estimatedHours}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Assigned to
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            assignedTo: event.target.value,
                          }))
                        }
                        placeholder="Team member or contractor"
                        value={activeJob.assignedTo}
                      />
                    </label>
                  </div>
                </article>

                <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                    Job Information
                  </p>

                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Quoted value
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        min="0"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            quotedValue: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          }))
                        }
                        step="0.01"
                        type="number"
                        value={activeJob.quotedValue}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">
                        Linked invoice number
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            invoiceNumber: event.target.value,
                          }))
                        }
                        placeholder="e.g. BI-2026-0001"
                        value={activeJob.invoiceNumber}
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Job description
                      </span>
                      <textarea
                        className="min-h-36 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Describe the work, requirements and expected outcome."
                        value={activeJob.description}
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Internal notes
                      </span>
                      <textarea
                        className="min-h-32 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateActiveJob((job) => ({
                            ...job,
                            internalNotes: event.target.value,
                          }))
                        }
                        placeholder="Private notes for your business or team."
                        value={activeJob.internalNotes}
                      />
                    </label>
                  </div>
                </article>

                <article className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:flex-row">
                  <button
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
                    onClick={saveJob}
                    type="button"
                  >
                    Save Job
                  </button>

                  <button
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-4 font-extrabold text-amber-900 transition hover:bg-amber-100"
                    onClick={markInProgress}
                    type="button"
                  >
                    Start Job
                  </button>

                  <button
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-6 py-4 font-extrabold text-emerald-900 transition hover:bg-emerald-100"
                    onClick={markCompleted}
                    type="button"
                  >
                    Mark Complete
                  </button>
                </article>

                {savedMessage ? (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">
                    {savedMessage}
                  </p>
                ) : null}
              </section>

              <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl xl:sticky xl:top-6">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Job Summary
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-extrabold ${statusClasses(
                      activeJob.status,
                    )}`}
                  >
                    {statusLabel(activeJob.status)}
                  </span>
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-extrabold ${priorityClasses(
                      activeJob.priority,
                    )}`}
                  >
                    {priorityLabel(activeJob.priority)}
                  </span>
                </div>

                <h2 className="mt-6 text-3xl font-black">
                  {activeJob.title || "Untitled job"}
                </h2>
                <p className="mt-2 font-bold text-blue-950">
                  {activeJob.jobNumber}
                </p>

                <div className="mt-8 space-y-5 border-t border-slate-200 pt-6">
                  <div>
                    <p className="text-sm font-bold text-slate-500">Customer</p>
                    <p className="mt-1 font-black">
                      {activeJob.customerName ||
                        activeJob.customerCompany ||
                        "Not selected"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-500">Schedule</p>
                    <p className="mt-1 font-black">
                      {formatDate(activeJob.scheduledDate)}
                      {activeJob.scheduledDate
                        ? ` at ${activeJob.scheduledTime}`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Assigned to
                    </p>
                    <p className="mt-1 font-black">
                      {activeJob.assignedTo || "Unassigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Estimated time
                    </p>
                    <p className="mt-1 font-black">
                      {activeJob.estimatedHours} hour
                      {activeJob.estimatedHours === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Quoted value
                    </p>
                    <p className="mt-1 text-2xl font-black text-blue-950">
                      {formatCurrency(activeJob.quotedValue)}
                    </p>
                  </div>

                  {activeJob.invoiceNumber ? (
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Linked invoice
                      </p>
                      <p className="mt-1 font-black">
                        {activeJob.invoiceNumber}
                      </p>
                    </div>
                  ) : null}

                  {activeJob.status === "completed" ? (
                    <div className="rounded-2xl bg-emerald-100 p-4">
                      <p className="font-black text-emerald-800">
                        Completed {formatDate(activeJob.completedAt)}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-8 grid gap-3">
                  <button
                    className="cursor-not-allowed rounded-2xl bg-slate-200 px-5 py-3 font-extrabold text-slate-500"
                    disabled
                    type="button"
                  >
                    Create Invoice from Job
                  </button>
                  <button
                    className="rounded-2xl border-2 border-slate-300 px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-950"
                    onClick={() => setActiveJob(null)}
                    type="button"
                  >
                    Back to Jobs
                  </button>
                </div>
              </aside>
            </div>
          ) : (
            <div className="grid gap-8 xl:grid-cols-[1fr_0.72fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                      Job Board
                    </p>
                    <h2 className="mt-3 text-3xl font-black">
                      Track every active job.
                    </h2>
                  </div>

                  <button
                    className="rounded-2xl bg-blue-950 px-5 py-3 font-extrabold text-white transition hover:bg-blue-900"
                    onClick={startNewJob}
                    type="button"
                  >
                    + Add Job
                  </button>
                </div>

                <div className="mt-7 grid gap-4 md:grid-cols-[1fr_170px_170px]">
                  <input
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search job, customer, address or assignee"
                    value={search}
                  />

                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "all" | JobStatus)
                    }
                    value={statusFilter}
                  >
                    <option value="all">All statuses</option>
                    <option value="enquiry">Enquiry</option>
                    <option value="quoted">Quoted</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) =>
                      setPriorityFilter(
                        event.target.value as "all" | JobPriority,
                      )
                    }
                    value={priorityFilter}
                  >
                    <option value="all">All priorities</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="mt-6 space-y-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <article
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                        key={job.id}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg font-black">
                                {job.title || job.jobNumber}
                              </h3>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusClasses(
                                  job.status,
                                )}`}
                              >
                                {statusLabel(job.status)}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${priorityClasses(
                                  job.priority,
                                )}`}
                              >
                                {priorityLabel(job.priority)}
                              </span>
                            </div>

                            <p className="mt-2 font-bold text-blue-950">
                              {job.jobNumber}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              {job.customerName ||
                                job.customerCompany ||
                                "No customer"}{" "}
                              · {formatDate(job.scheduledDate)}
                              {job.scheduledDate
                                ? ` at ${job.scheduledTime}`
                                : ""}
                            </p>
                          </div>

                          <p className="text-xl font-black text-blue-950">
                            {formatCurrency(job.quotedValue)}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            className="rounded-xl bg-blue-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-blue-900"
                            onClick={() => setActiveJob(job)}
                            type="button"
                          >
                            Open
                          </button>

                          <button
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
                            onClick={() => duplicateJob(job)}
                            type="button"
                          >
                            Duplicate
                          </button>

                          <button
                            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
                            onClick={() => deleteJob(job.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
                      <p className="font-black text-slate-950">
                        No jobs found.
                      </p>
                      <p className="mt-2 text-slate-600">
                        Add your first job or change the search filters.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <aside className="space-y-6">
                <section className="rounded-[2rem] border border-blue-200 bg-blue-950 p-8 text-white shadow-2xl">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl"
                  >
                    🛠️
                  </span>

                  <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.25em] text-blue-200">
                    Beacon Job Manager
                  </p>

                  <h2 className="mt-4 text-4xl font-black tracking-tight">
                    Keep work moving from start to finish.
                  </h2>

                  <p className="mt-5 text-lg leading-8 text-blue-100">
                    Organise enquiries, scheduled work, active jobs and
                    completed projects from one clear workspace.
                  </p>

                  <button
                    className="mt-8 inline-flex rounded-2xl bg-amber-400 px-7 py-4 text-lg font-extrabold text-slate-950 transition hover:bg-amber-300"
                    onClick={startNewJob}
                    type="button"
                  >
                    Create New Job
                  </button>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                    Upcoming Jobs
                  </p>

                  <div className="mt-5 space-y-4">
                    {upcomingJobs.length > 0 ? (
                      upcomingJobs.map((job) => (
                        <button
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                          key={job.id}
                          onClick={() => setActiveJob(job)}
                          type="button"
                        >
                          <p className="font-black">
                            {job.title || job.jobNumber}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatDate(job.scheduledDate)} at{" "}
                            {job.scheduledTime}
                          </p>
                          <p className="mt-1 text-sm font-bold text-blue-950">
                            {job.customerName ||
                              job.customerCompany ||
                              "No customer"}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-slate-50 px-5 py-6 text-center text-slate-600">
                        No upcoming jobs scheduled.
                      </p>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}