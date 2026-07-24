"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ProjectStatus =
  | "payment_received"
  | "awaiting_content"
  | "design"
  | "development"
  | "quality_assurance"
  | "client_review"
  | "domain_connection"
  | "live";

type MessageAuthor = "client" | "beacon";

type VerifiedOrder = {
  sessionId: string;
  paymentStatus: string;
  customerEmail: string;
  customerName: string;
  businessName: string;
  packageId: string;
  packageName: string;
  modules: string[];
  amountTotal: number;
  currency: string;
  createdAt: string;
};

type ProjectAsset = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  status: "received";
  pathname?: string;
  url?: string;
  downloadUrl?: string;
};

type ProjectMessage = {
  id: string;
  author: MessageAuthor;
  body: string;
  createdAt: string;
};

type RevisionRequest = {
  id: string;
  category: "content" | "design" | "feature";
  details: string;
  createdAt: string;
  status: "submitted";
};

type ProjectState = {
  projectId: string;
  status: ProjectStatus;
  createdAt: string;
  estimatedLaunch: string;
  assets: ProjectAsset[];
  messages: ProjectMessage[];
  revisions: RevisionRequest[];
};

type AssetUploadResponse = {
  asset?: {
    name: string;
    pathname: string;
    url: string;
    downloadUrl?: string;
    contentType?: string;
    size: number;
    uploadedAt: string;
    status: "received";
  };
  error?: string;
};

type AssetDeleteResponse = {
  deleted?: boolean;
  error?: string;
};

const ORDER_STORAGE_KEY = "beacon-business-paid-order";
const PROJECT_STORAGE_KEY = "beacon-business-project";

const statusSteps: Array<{
  id: ProjectStatus;
  title: string;
  description: string;
}> = [
  {
    id: "payment_received",
    title: "Payment received",
    description: "Your secure Stripe payment has been verified.",
  },
  {
    id: "awaiting_content",
    title: "Awaiting content",
    description: "Logos, images and final business content are being collected.",
  },
  {
    id: "design",
    title: "Design in progress",
    description: "The approved direction is being developed into final layouts.",
  },
  {
    id: "development",
    title: "Development",
    description: "The production website is being built and configured.",
  },
  {
    id: "quality_assurance",
    title: "Internal quality assurance",
    description: "Forms, links, mobile layouts and core functionality are tested.",
  },
  {
    id: "client_review",
    title: "Client review",
    description: "The completed build is available for your final review.",
  },
  {
    id: "domain_connection",
    title: "Domain connection",
    description: "Domain, DNS and SSL configuration are completed.",
  },
  {
    id: "live",
    title: "Website live",
    description: "Your completed website is published.",
  },
];

const launchChecks = [
  "Mobile layout tested",
  "Desktop layout tested",
  "SEO structure completed",
  "Contact forms tested",
  "Analytics installed",
  "Domain connected",
  "SSL active",
  "Website live",
];

const statusLabels: Record<ProjectStatus, string> = {
  payment_received: "Payment received",
  awaiting_content: "Awaiting content",
  design: "Design in progress",
  development: "Development",
  quality_assurance: "Quality assurance",
  client_review: "Client review",
  domain_connection: "Domain connection",
  live: "Website live",
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatCurrency(amountInMinorUnits: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInMinorUnits / 100);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildProject(order: VerifiedOrder): ProjectState {
  const created = new Date(order.createdAt);
  const launch = new Date(
    Number.isNaN(created.getTime()) ? Date.now() : created.getTime()
  );

  launch.setDate(launch.getDate() + 28);

  return {
    projectId: `BB-${order.sessionId.slice(-10).toUpperCase()}`,
    status: "awaiting_content",
    createdAt: order.createdAt,
    estimatedLaunch: launch.toISOString(),
    assets: [],
    messages: [
      {
        id: createId("message"),
        author: "beacon",
        body:
          "Your payment has been confirmed and your Beacon Business project portal is now active. Upload your logo, business images and any supporting documents when ready.",
        createdAt: new Date().toISOString(),
      },
    ],
    revisions: [],
  };
}

export default function ProjectPortal() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [order, setOrder] = useState<VerifiedOrder | null>(null);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [revisionCategory, setRevisionCategory] =
    useState<RevisionRequest["category"]>("content");
  const [revisionDetails, setRevisionDetails] = useState("");
  const [notice, setNotice] = useState("");
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  useEffect(() => {
    const savedOrder = window.localStorage.getItem(ORDER_STORAGE_KEY);

    if (!savedOrder) {
      setLoaded(true);
      return;
    }

    try {
      const parsedOrder = JSON.parse(savedOrder) as VerifiedOrder;
      setOrder(parsedOrder);

      const savedProject = window.localStorage.getItem(PROJECT_STORAGE_KEY);

      if (savedProject) {
        try {
          const parsedProject = JSON.parse(savedProject) as ProjectState;
          setProject(parsedProject);
        } catch {
          const newProject = buildProject(parsedOrder);
          setProject(newProject);
          window.localStorage.setItem(
            PROJECT_STORAGE_KEY,
            JSON.stringify(newProject)
          );
        }
      } else {
        const newProject = buildProject(parsedOrder);
        setProject(newProject);
        window.localStorage.setItem(
          PROJECT_STORAGE_KEY,
          JSON.stringify(newProject)
        );
      }
    } catch {
      window.localStorage.removeItem(ORDER_STORAGE_KEY);
    }

    setLoaded(true);
  }, []);

  const saveProject = (nextProject: ProjectState) => {
    setProject(nextProject);
    window.localStorage.setItem(
      PROJECT_STORAGE_KEY,
      JSON.stringify(nextProject)
    );
  };

  const currentStatusIndex = useMemo(() => {
    if (!project) {
      return 0;
    }

    return statusSteps.findIndex((step) => step.id === project.status);
  }, [project]);

  const progressPercentage = useMemo(() => {
    if (!project) {
      return 0;
    }

    return Math.round(
      ((currentStatusIndex + 1) / statusSteps.length) * 100
    );
  }, [currentStatusIndex, project]);

  const completedLaunchChecks = useMemo(() => {
    if (!project) {
      return 0;
    }

    const completionByStatus: Record<ProjectStatus, number> = {
      payment_received: 0,
      awaiting_content: 0,
      design: 0,
      development: 1,
      quality_assurance: 4,
      client_review: 5,
      domain_connection: 7,
      live: 8,
    };

    return completionByStatus[project.status];
  }, [project]);

  const handleAssetUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    if (!project || uploadingAssets) {
      return;
    }

    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const maximumFileSize = 4 * 1024 * 1024;
    const oversizedFiles = files.filter(
      (file) => file.size > maximumFileSize
    );
    const validFiles = files.filter(
      (file) => file.size > 0 && file.size <= maximumFileSize
    );

    if (!validFiles.length) {
      setNotice("Each project file must be no larger than 4 MB.");
      return;
    }

    setUploadingAssets(true);
    setNotice(
      `Uploading ${validFiles.length} ${
        validFiles.length === 1 ? "file" : "files"
      } securely…`
    );

    const uploadedAssets: ProjectAsset[] = [];
    const failedFiles: string[] = [];

    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append("projectId", project.projectId);
        formData.append("file", file);

        const response = await fetch("/api/business/project/assets", {
          method: "POST",
          body: formData,
        });

        const result = (await response.json()) as AssetUploadResponse;

        if (!response.ok || !result.asset) {
          throw new Error(result.error || `Unable to upload ${file.name}.`);
        }

        uploadedAssets.push({
          id: result.asset.pathname || createId("asset"),
          name: result.asset.name,
          type: result.asset.contentType || file.type || "Unknown file type",
          size: result.asset.size,
          uploadedAt: result.asset.uploadedAt,
          status: "received",
          pathname: result.asset.pathname,
          url: result.asset.url,
          downloadUrl: result.asset.downloadUrl,
        });
      } catch (error) {
        console.error("Beacon Business project asset upload failed:", error);
        failedFiles.push(file.name);
      }
    }

    if (uploadedAssets.length) {
      saveProject({
        ...project,
        assets: [...uploadedAssets, ...project.assets],
      });
    }

    const messages: string[] = [];

    if (uploadedAssets.length) {
      messages.push(
        `${uploadedAssets.length} ${
          uploadedAssets.length === 1 ? "file was" : "files were"
        } uploaded securely.`
      );
    }

    if (oversizedFiles.length) {
      messages.push(
        `${oversizedFiles.length} ${
          oversizedFiles.length === 1 ? "file was" : "files were"
        } skipped because the 4 MB limit was exceeded.`
      );
    }

    if (failedFiles.length) {
      messages.push(
        `Unable to upload: ${failedFiles.join(", ")}. Please try again.`
      );
    }

    setNotice(messages.join(" "));
    setUploadingAssets(false);
  };

  const removeAsset = async (assetId: string) => {
    if (!project || deletingAssetId) {
      return;
    }

    const asset = project.assets.find((item) => item.id === assetId);

    if (!asset) {
      return;
    }

    if (!asset.url) {
      saveProject({
        ...project,
        assets: project.assets.filter((item) => item.id !== assetId),
      });

      setNotice(
        "The older local asset record was removed. No stored file was deleted."
      );
      return;
    }

    setDeletingAssetId(assetId);
    setNotice(`Removing ${asset.name}…`);

    try {
      const response = await fetch("/api/business/project/assets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.projectId,
          url: asset.url,
        }),
      });

      const result = (await response.json()) as AssetDeleteResponse;

      if (!response.ok || !result.deleted) {
        throw new Error(result.error || "Unable to remove the project asset.");
      }

      saveProject({
        ...project,
        assets: project.assets.filter((item) => item.id !== assetId),
      });

      setNotice(`${asset.name} was removed securely.`);
    } catch (error) {
      console.error("Beacon Business project asset deletion failed:", error);
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to remove the project asset."
      );
    } finally {
      setDeletingAssetId(null);
    }
  };

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!project) {
      return;
    }

    const body = messageText.trim();

    if (!body) {
      setNotice("Enter a message before sending.");
      return;
    }

    const message: ProjectMessage = {
      id: createId("message"),
      author: "client",
      body,
      createdAt: new Date().toISOString(),
    };

    saveProject({
      ...project,
      messages: [...project.messages, message],
    });

    setMessageText("");
    setNotice("Your message has been added to the project.");
  };

  const submitRevision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!project) {
      return;
    }

    const details = revisionDetails.trim();

    if (!details) {
      setNotice("Describe the requested change before submitting.");
      return;
    }

    const revision: RevisionRequest = {
      id: createId("revision"),
      category: revisionCategory,
      details,
      createdAt: new Date().toISOString(),
      status: "submitted",
    };

    saveProject({
      ...project,
      revisions: [revision, ...project.revisions],
    });

    setRevisionDetails("");
    setNotice("Revision request submitted successfully.");
  };

  if (!loaded) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl animate-pulse rounded-[2rem] bg-white p-10 shadow-xl">
          <div className="h-8 w-52 rounded bg-slate-200" />
          <div className="mt-6 h-96 rounded-[2rem] bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!order || !project) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-amber-200 bg-white p-10 text-center shadow-2xl">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-3xl font-black text-white">
            !
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-amber-700">
            Active Project Required
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Your project portal activates after payment.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Complete the approved Beacon Business website checkout before a
            project record can be created.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/business/checkout"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-950 px-8 py-4 font-extrabold text-white transition hover:bg-blue-900"
            >
              Open checkout
            </Link>

            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-8 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
            >
              Business dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const projectLive = project.status === "live";
  const domainConnected =
    project.status === "domain_connection" || project.status === "live";

  return (
    <>
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
                Beacon Business Project Portal
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                {order.businessName}
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
                Track your website build, provide project assets, send
                messages and review every stage through to launch.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Project
                </p>
                <p className="mt-2 font-black">{project.projectId}</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Status
                </p>
                <p className="mt-2 font-black">
                  {statusLabels[project.status]}
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Estimated launch
                </p>
                <p className="mt-2 font-black">
                  {formatDate(project.estimatedLaunch)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between gap-4 text-sm font-bold">
              <span>Project progress</span>
              <span>{progressPercentage}%</span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          {notice ? (
            <div className="mb-8 flex items-start justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="font-semibold text-blue-950">{notice}</p>
              <button
                type="button"
                onClick={() => setNotice("")}
                className="font-black text-blue-950"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          ) : null}

          <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
            <div className="space-y-8">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
                <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                  Project Timeline
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Every stage remains visible.
                </h2>

                <div className="mt-8 space-y-3">
                  {statusSteps.map((step, index) => {
                    const complete = index < currentStatusIndex;
                    const current = index === currentStatusIndex;

                    return (
                      <div
                        key={step.id}
                        className={`flex gap-4 rounded-2xl border p-5 ${
                          complete
                            ? "border-emerald-200 bg-emerald-50"
                            : current
                              ? "border-amber-200 bg-amber-50"
                              : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <span
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black ${
                            complete
                              ? "bg-emerald-600 text-white"
                              : current
                                ? "bg-amber-500 text-white"
                                : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {complete ? "✓" : current ? "•" : index + 1}
                        </span>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-950">
                              {step.title}
                            </h3>

                            {current ? (
                              <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-900">
                                Current
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-2 leading-7 text-slate-600">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                      Project Assets
                    </p>

                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                      Upload your logo, images and documents.
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAssets}
                    className="rounded-2xl bg-blue-950 px-6 py-3 font-extrabold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {uploadingAssets ? "Uploading…" : "Add files"}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.doc,.docx,.txt"
                  onChange={handleAssetUpload}
                  className="hidden"
                />

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Accepted formats: PNG, JPG, WEBP, SVG, PDF, DOC, DOCX and TXT.
                  Maximum size: 4 MB per file. Files are stored securely in
                  your Beacon Business project.
                </p>

                {project.assets.length ? (
                  <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200">
                    <div className="hidden grid-cols-[1fr_130px_150px_100px] gap-4 bg-slate-100 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-600 md:grid">
                      <span>File</span>
                      <span>Size</span>
                      <span>Uploaded</span>
                      <span>Status</span>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {project.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="grid gap-3 px-5 py-5 md:grid-cols-[1fr_130px_150px_100px] md:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-950">
                              {asset.name}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {asset.type}
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-slate-700">
                            {formatFileSize(asset.size)}
                          </p>

                          <p className="text-sm font-semibold text-slate-700">
                            {formatDateTime(asset.uploadedAt)}
                          </p>

                          <div className="flex items-center justify-between gap-3 md:block">
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                              Received
                            </span>

                            <button
                              type="button"
                              onClick={() => void removeAsset(asset.id)}
                              disabled={deletingAssetId !== null}
                              className="text-xs font-bold text-rose-700 underline underline-offset-4 disabled:cursor-not-allowed disabled:text-slate-400 md:mt-2 md:block"
                            >
                              {deletingAssetId === asset.id
                                ? "Removing…"
                                : "Remove"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="font-black text-slate-950">
                      No project assets added yet.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Add your logo, photographs, documents and brand materials
                      when they are ready.
                    </p>
                  </div>
                )}
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
                <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                  Project Messages
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Keep project communication together.
                </h2>

                <div className="mt-7 max-h-[500px] space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-5">
                  {project.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.author === "client"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-5 py-4 ${
                          message.author === "client"
                            ? "bg-blue-950 text-white"
                            : "border border-slate-200 bg-white text-slate-800"
                        }`}
                      >
                        <p className="text-xs font-extrabold uppercase tracking-wide opacity-70">
                          {message.author === "client" ? "You" : "Beacon"}
                        </p>

                        <p className="mt-2 whitespace-pre-wrap leading-7">
                          {message.body}
                        </p>

                        <p className="mt-3 text-xs opacity-65">
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendMessage} className="mt-6">
                  <label
                    htmlFor="project-message"
                    className="text-sm font-extrabold text-slate-800"
                  >
                    New message
                  </label>

                  <textarea
                    id="project-message"
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    rows={5}
                    maxLength={2000}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Add a project question or update."
                  />

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold text-slate-500">
                      {messageText.length}/2000 characters
                    </p>

                    <button
                      type="submit"
                      className="rounded-2xl bg-blue-950 px-6 py-3 font-extrabold text-white transition hover:bg-blue-900"
                    >
                      Send message
                    </button>
                  </div>
                </form>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
                <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-900">
                  Revision Requests
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Submit structured changes.
                </h2>

                <form
                  onSubmit={submitRevision}
                  className="mt-7 rounded-2xl bg-slate-50 p-5"
                >
                  <label
                    htmlFor="revision-category"
                    className="text-sm font-extrabold text-slate-800"
                  >
                    Change category
                  </label>

                  <select
                    id="revision-category"
                    value={revisionCategory}
                    onChange={(event) =>
                      setRevisionCategory(
                        event.target.value as RevisionRequest["category"]
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="content">Content change</option>
                    <option value="design">Design change</option>
                    <option value="feature">Feature request</option>
                  </select>

                  <label
                    htmlFor="revision-details"
                    className="mt-5 block text-sm font-extrabold text-slate-800"
                  >
                    Requested change
                  </label>

                  <textarea
                    id="revision-details"
                    value={revisionDetails}
                    onChange={(event) =>
                      setRevisionDetails(event.target.value)
                    }
                    rows={6}
                    maxLength={2500}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Describe exactly what should change and where it appears."
                  />

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold text-slate-500">
                      {revisionDetails.length}/2500 characters
                    </p>

                    <button
                      type="submit"
                      className="rounded-2xl bg-blue-950 px-6 py-3 font-extrabold text-white transition hover:bg-blue-900"
                    >
                      Submit request
                    </button>
                  </div>
                </form>

                {project.revisions.length ? (
                  <div className="mt-7 space-y-4">
                    {project.revisions.map((revision) => (
                      <div
                        key={revision.id}
                        className="rounded-2xl border border-slate-200 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-900">
                            {revision.category}
                          </span>

                          <span className="text-xs font-semibold text-slate-500">
                            {formatDateTime(revision.createdAt)}
                          </span>
                        </div>

                        <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
                          {revision.details}
                        </p>

                        <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-amber-700">
                          Submitted
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            </div>

            <aside className="space-y-8">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Project Information
                </p>

                <dl className="mt-6 space-y-4">
                  <div className="border-b border-slate-200 pb-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Package
                    </dt>
                    <dd className="mt-2 font-black text-slate-950">
                      {order.packageName}
                    </dd>
                  </div>

                  <div className="border-b border-slate-200 pb-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Modules
                    </dt>
                    <dd className="mt-2 font-black text-slate-950">
                      {order.modules.length
                        ? order.modules.join(", ")
                        : "No optional modules"}
                    </dd>
                  </div>

                  <div className="border-b border-slate-200 pb-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Order date
                    </dt>
                    <dd className="mt-2 font-black text-slate-950">
                      {formatDate(order.createdAt)}
                    </dd>
                  </div>

                  <div className="border-b border-slate-200 pb-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Amount paid
                    </dt>
                    <dd className="mt-2 text-2xl font-black text-emerald-700">
                      {formatCurrency(order.amountTotal, order.currency)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Payment status
                    </dt>
                    <dd className="mt-2">
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-800">
                        {order.paymentStatus}
                      </span>
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Website Preview
                </p>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  Review the latest approved direction.
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  The working preview remains available throughout the project.
                </p>

                <Link
                  href="/business/preview"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-950 px-6 py-4 font-extrabold text-white transition hover:bg-blue-900"
                >
                  View latest preview
                </Link>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Domain & Hosting
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    {
                      label: "Domain connected",
                      active: domainConnected,
                    },
                    {
                      label: "SSL active",
                      active: domainConnected,
                    },
                    {
                      label: "Hosting active",
                      active: projectLive,
                    },
                    {
                      label: "DNS verified",
                      active: domainConnected,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <span className="font-bold text-slate-700">
                        {item.label}
                      </span>

                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                          item.active
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {item.active ? "✓" : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Launch Checklist
                </p>

                <div className="mt-6 space-y-3">
                  {launchChecks.map((check, index) => {
                    const complete = index < completedLaunchChecks;

                    return (
                      <div
                        key={check}
                        className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <span
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                            complete
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {complete ? "✓" : "—"}
                        </span>

                        <span className="font-bold text-slate-700">{check}</span>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                  Invoice
                </p>

                <div className="mt-5 rounded-2xl bg-emerald-50 p-5">
                  <p className="font-black text-emerald-900">Paid</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Invoice reference: {project.projectId}
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-5 w-full cursor-not-allowed rounded-2xl bg-slate-200 px-6 py-4 font-extrabold text-slate-500"
                >
                  PDF invoice generation pending
                </button>
              </article>

              {projectLive ? (
                <article className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-7 shadow-xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-700">
                    Final Delivery
                  </p>

                  <h2 className="mt-3 text-2xl font-black tracking-tight text-emerald-950">
                    Website launched.
                  </h2>

                  <p className="mt-3 leading-7 text-emerald-900">
                    Your handover information and ongoing support options are
                    now available.
                  </p>
                </article>
              ) : null}

              <Link
                href="/business/dashboard"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950"
              >
                Return to dashboard
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}