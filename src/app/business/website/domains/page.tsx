"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type VerificationStatus =
  | "pending"
  | "verifying"
  | "verified"
  | "failed"
  | "disconnected";

type SslStatus =
  | "pending"
  | "provisioning"
  | "active"
  | "failed"
  | "not_applicable";

type DomainType = "custom" | "temporary";

type DomainRecord = {
  id: string;
  websiteId: string;
  domain: string;
  domainType: DomainType;
  isPrimary: boolean;
  verificationStatus: VerificationStatus;
  sslStatus: SslStatus;
  dnsRecord: {
    type: "CNAME" | "A" | "TXT";
    name: string;
    value: string;
  };
  verificationAttempts: number;
  lastVerificationError: string | null;
  lastVerifiedAt: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiConfiguration = {
  temporaryDomainSuffix: string;
  customDomainCnameTarget: string;
  customDomainApexIp: string;
};

type DomainListResponse = {
  ok: boolean;
  data?: {
    domains: DomainRecord[];
    configuration: ApiConfiguration;
  };
  error?: string;
  details?: unknown;
};

type DomainMutationResponse = {
  ok: boolean;
  data?: {
    domain?: DomainRecord;
    domains?: DomainRecord[];
    message?: string;
    nextStep?: string;
    verification?: {
      verified: boolean;
      message: string;
      discoveredValues: string[];
    };
    deletedDomainId?: string;
  };
  error?: string;
  details?: unknown;
};

type StoredPublishedWebsite = {
  id?: string;
  publishedWebsiteId?: string;
  websiteId?: string;
  domain?: string;
  data?: {
    id?: string;
    publishedWebsiteId?: string;
    websiteId?: string;
  };
};

const PUBLISHED_WEBSITE_STORAGE_KEYS = [
  "beacon-business-published-website",
  "beacon-business-publish-result",
  "beacon-business-generated-website",
];

function readWebsiteIdFromStorage() {
  if (typeof window === "undefined") {
    return "";
  }

  for (const key of PUBLISHED_WEBSITE_STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as StoredPublishedWebsite;

      const id =
        parsed.publishedWebsiteId ??
        parsed.websiteId ??
        parsed.id ??
        parsed.data?.publishedWebsiteId ??
        parsed.data?.websiteId ??
        parsed.data?.id;

      if (typeof id === "string" && id.trim()) {
        return id.trim();
      }
    } catch {
      continue;
    }
  }

  return "";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status: VerificationStatus) {
  switch (status) {
    case "pending":
      return "Awaiting DNS";
    case "verifying":
      return "Checking DNS";
    case "verified":
      return "Verified";
    case "failed":
      return "Needs attention";
    case "disconnected":
      return "Disconnected";
  }
}

function getSslLabel(status: SslStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "provisioning":
      return "Provisioning";
    case "active":
      return "Active";
    case "failed":
      return "Failed";
    case "not_applicable":
      return "Not applicable";
  }
}

function statusClasses(status: VerificationStatus) {
  if (status === "verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (status === "disconnected") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  if (status === "verifying") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function sslClasses(status: SslStatus) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (status === "not_applicable") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-800";
}

function normaliseDomainInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error("The server returned an empty response.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      onClick={copyValue}
      type="button"
    >
      {copied ? "Copied" : `Copy ${label}`}
    </button>
  );
}

function DomainCard({
  domain,
  busyAction,
  onAction,
}: {
  domain: DomainRecord;
  busyAction: string;
  onAction: (
    action:
      | "verify"
      | "make_primary"
      | "disconnect"
      | "reconnect"
      | "refresh_ssl"
      | "delete",
    domain: DomainRecord,
  ) => Promise<void>;
}) {
  const isBusy = busyAction.startsWith(`${domain.id}:`);
  const actionName = isBusy
    ? busyAction.split(":")[1] ?? ""
    : "";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5 sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-all text-xl font-black text-slate-950">
                {domain.domain}
              </h2>

              {domain.isPrimary ? (
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-extrabold text-white">
                  Primary
                </span>
              ) : null}

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
                {domain.domainType === "temporary"
                  ? "Beacon domain"
                  : "Custom domain"}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Added {formatDate(domain.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusClasses(
                domain.verificationStatus,
              )}`}
            >
              {getStatusLabel(domain.verificationStatus)}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-extrabold ${sslClasses(
                domain.sslStatus,
              )}`}
            >
              SSL: {getSslLabel(domain.sslStatus)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:px-7 lg:grid-cols-[1fr_auto]">
        <div>
          {domain.domainType === "custom" &&
          domain.verificationStatus !== "verified" &&
          domain.verificationStatus !== "disconnected" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-black text-amber-950">
                Add this DNS record
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-900/80">
                Sign in to the company where this domain is registered,
                open its DNS settings and add the record below.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-amber-200 bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Type
                  </p>
                  <p className="mt-2 break-all font-black text-slate-950">
                    {domain.dnsRecord.type}
                  </p>
                  <div className="mt-3">
                    <CopyButton
                      label="type"
                      value={domain.dnsRecord.type}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Name
                  </p>
                  <p className="mt-2 break-all font-black text-slate-950">
                    {domain.dnsRecord.name}
                  </p>
                  <div className="mt-3">
                    <CopyButton
                      label="name"
                      value={domain.dnsRecord.name}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Value
                  </p>
                  <p className="mt-2 break-all font-black text-slate-950">
                    {domain.dnsRecord.value}
                  </p>
                  <div className="mt-3">
                    <CopyButton
                      label="value"
                      value={domain.dnsRecord.value}
                    />
                  </div>
                </div>
              </div>

              {domain.lastVerificationError ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-800">
                  Last check: {domain.lastVerificationError}
                </div>
              ) : null}
            </div>
          ) : null}

          {domain.verificationStatus === "verified" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-black text-emerald-950">
                Domain connected
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                This domain is verified and can serve the published
                website.
              </p>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-extrabold text-emerald-900">
                    Verified
                  </dt>
                  <dd className="mt-1 text-emerald-900/80">
                    {formatDate(domain.lastVerifiedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="font-extrabold text-emerald-900">
                    Connected
                  </dt>
                  <dd className="mt-1 text-emerald-900/80">
                    {formatDate(domain.connectedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {domain.verificationStatus === "disconnected" ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-black text-slate-950">
                Domain disconnected
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This domain no longer serves the website. Reconnect it
                before attempting verification again.
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-extrabold text-slate-950">
                Verification checks
              </p>
              <p className="mt-1">{domain.verificationAttempts}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-extrabold text-slate-950">
                SSL state
              </p>
              <p className="mt-1">{getSslLabel(domain.sslStatus)}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-extrabold text-slate-950">
                Last updated
              </p>
              <p className="mt-1">{formatDate(domain.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex min-w-48 flex-col gap-3">
          {domain.domainType === "custom" &&
          domain.verificationStatus !== "verified" &&
          domain.verificationStatus !== "disconnected" ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => onAction("verify", domain)}
              type="button"
            >
              {actionName === "verify"
                ? "Checking DNS…"
                : "Verify domain"}
            </button>
          ) : null}

          {domain.verificationStatus === "verified" &&
          !domain.isPrimary ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => onAction("make_primary", domain)}
              type="button"
            >
              {actionName === "make_primary"
                ? "Updating…"
                : "Make primary"}
            </button>
          ) : null}

          {domain.verificationStatus === "verified" &&
          domain.sslStatus !== "active" ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-extrabold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => onAction("refresh_ssl", domain)}
              type="button"
            >
              {actionName === "refresh_ssl"
                ? "Refreshing…"
                : "Refresh SSL"}
            </button>
          ) : null}

          {domain.domainType === "custom" &&
          domain.verificationStatus !== "disconnected" ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => onAction("disconnect", domain)}
              type="button"
            >
              {actionName === "disconnect"
                ? "Disconnecting…"
                : "Disconnect"}
            </button>
          ) : null}

          {domain.verificationStatus === "disconnected" ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => onAction("reconnect", domain)}
              type="button"
            >
              {actionName === "reconnect"
                ? "Reconnecting…"
                : "Reconnect"}
            </button>
          ) : null}

          <a
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
            href={`https://${domain.domain}`}
            rel="noreferrer"
            target="_blank"
          >
            Open domain
          </a>

          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            onClick={() => onAction("delete", domain)}
            type="button"
          >
            {actionName === "delete" ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function WebsiteDomainsPage() {
  const [websiteId, setWebsiteId] = useState("");
  const [manualWebsiteId, setManualWebsiteId] = useState("");
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [configuration, setConfiguration] =
    useState<ApiConfiguration | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [makePrimary, setMakePrimary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [creatingTemporary, setCreatingTemporary] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const primaryDomain = useMemo(
    () => domains.find((domain) => domain.isPrimary) ?? null,
    [domains],
  );

  const loadDomains = useCallback(async (id: string) => {
    if (!id) {
      setDomains([]);
      setConfiguration(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/business/website/domains?websiteId=${encodeURIComponent(
          id,
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const result = await readJson<DomainListResponse>(response);

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(
          result.error || "Unable to load website domains.",
        );
      }

      setDomains(result.data.domains);
      setConfiguration(result.data.configuration);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load website domains.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedWebsiteId = readWebsiteIdFromStorage();

    setWebsiteId(storedWebsiteId);
    setManualWebsiteId(storedWebsiteId);

    void loadDomains(storedWebsiteId);
  }, [loadDomains]);

  async function createDomain(
    domainType: DomainType,
    domain?: string,
  ) {
    if (!websiteId) {
      setError(
        "A published website ID is required before domains can be managed.",
      );
      return;
    }

    const isTemporary = domainType === "temporary";

    if (isTemporary) {
      setCreatingTemporary(true);
    } else {
      setCreatingCustom(true);
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/business/website/domains",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            websiteId,
            domainType,
            domain:
              domainType === "custom"
                ? normaliseDomainInput(domain ?? "")
                : undefined,
            makePrimary,
          }),
        },
      );

      const result =
        await readJson<DomainMutationResponse>(response);

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to add the domain.");
      }

      setNotice(
        result.data?.nextStep ||
          result.data?.message ||
          "The domain has been added.",
      );
      setCustomDomain("");
      setMakePrimary(false);
      await loadDomains(websiteId);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to add the domain.",
      );
    } finally {
      setCreatingCustom(false);
      setCreatingTemporary(false);
    }
  }

  async function submitCustomDomain(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const domain = normaliseDomainInput(customDomain);

    if (!domain) {
      setError("Enter the custom domain you want to connect.");
      return;
    }

    await createDomain("custom", domain);
  }

  async function handleAction(
    action:
      | "verify"
      | "make_primary"
      | "disconnect"
      | "reconnect"
      | "refresh_ssl"
      | "delete",
    domain: DomainRecord,
  ) {
    if (
      action === "delete" &&
      !window.confirm(
        `Remove ${domain.domain} from this website? This cannot be undone.`,
      )
    ) {
      return;
    }

    if (
      action === "disconnect" &&
      !window.confirm(
        `Disconnect ${domain.domain}? Visitors will no longer reach this website through that domain.`,
      )
    ) {
      return;
    }

    setBusyAction(`${domain.id}:${action}`);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/business/website/domains",
        {
          method: action === "delete" ? "DELETE" : "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domainId: domain.id,
            ...(action === "delete" ? {} : { action }),
          }),
        },
      );

      const result =
        await readJson<DomainMutationResponse>(response);

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Unable to update the domain.",
        );
      }

      const verificationMessage =
        result.data?.verification?.message;

      setNotice(
        verificationMessage ||
          result.data?.message ||
          "The domain has been updated.",
      );

      await loadDomains(websiteId);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update the domain.",
      );
    } finally {
      setBusyAction("");
    }
  }

  function useManualWebsiteId(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = manualWebsiteId.trim();

    if (!id) {
      setError("Enter the published website ID.");
      return;
    }

    setWebsiteId(id);
    setNotice("");
    setError("");

    window.localStorage.setItem(
      "beacon-business-published-website",
      JSON.stringify({ id }),
    );

    void loadDomains(id);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
              Beacon Business
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Website domains
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Give the published website a temporary Beacon address or
              connect a customer-owned domain.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
              href="/business/website"
            >
              Website dashboard
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800"
              href="/business/dashboard"
            >
              Business dashboard
            </Link>
          </div>
        </div>

        {notice ? (
          <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold leading-6 text-emerald-800">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mt-7 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 font-bold leading-6 text-rose-800">
            {error}
          </div>
        ) : null}

        {!websiteId ? (
          <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-amber-950">
              Published website not found
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-amber-900/80">
              Domain management starts after a website has been
              published. Beacon normally loads the published website ID
              automatically. You can enter it below when testing.
            </p>

            <form
              className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row"
              onSubmit={useManualWebsiteId}
            >
              <input
                className="min-h-12 flex-1 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
                onChange={(event) =>
                  setManualWebsiteId(event.target.value)
                }
                placeholder="Published website UUID"
                value={manualWebsiteId}
              />
              <button
                className="min-h-12 rounded-xl bg-amber-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-amber-800"
                type="submit"
              >
                Load website
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">
                  Fastest option
                </p>
                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  Create a Beacon domain
                </h2>
                <p className="mt-3 leading-7 text-slate-600">
                  Create an instant temporary address while the
                  customer prepares or purchases their own domain.
                </p>

                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <p className="text-sm font-extrabold text-blue-950">
                    Example
                  </p>
                  <p className="mt-2 break-all font-black text-blue-900">
                    business-name.
                    {configuration?.temporaryDomainSuffix ||
                      "beaconbusiness.site"}
                  </p>
                </div>

                <button
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={creatingTemporary}
                  onClick={() => createDomain("temporary")}
                  type="button"
                >
                  {creatingTemporary
                    ? "Creating domain…"
                    : "Create temporary domain"}
                </button>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Customer domain
                </p>
                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  Connect a custom domain
                </h2>
                <p className="mt-3 leading-7 text-slate-600">
                  Enter the domain without <strong>https://</strong> or
                  a page path. Beacon will provide the required DNS
                  record.
                </p>

                <form className="mt-6" onSubmit={submitCustomDomain}>
                  <label
                    className="text-sm font-extrabold text-slate-800"
                    htmlFor="custom-domain"
                  >
                    Domain
                  </label>
                  <input
                    autoCapitalize="none"
                    autoComplete="url"
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    id="custom-domain"
                    onChange={(event) =>
                      setCustomDomain(event.target.value)
                    }
                    placeholder="www.customerbusiness.co.uk"
                    spellCheck={false}
                    value={customDomain}
                  />

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      checked={makePrimary}
                      className="mt-1 h-4 w-4"
                      onChange={(event) =>
                        setMakePrimary(event.target.checked)
                      }
                      type="checkbox"
                    />
                    <span>
                      <span className="block text-sm font-extrabold text-slate-950">
                        Make primary when verified
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        Use this as the website's main public domain
                        once DNS verification succeeds.
                      </span>
                    </span>
                  </label>

                  <button
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={creatingCustom}
                    type="submit"
                  >
                    {creatingCustom
                      ? "Adding domain…"
                      : "Add custom domain"}
                  </button>
                </form>
              </article>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
                    Current website
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Domain overview
                  </h2>
                </div>

                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                  onClick={() => loadDomains(websiteId)}
                  type="button"
                >
                  {loading ? "Refreshing…" : "Refresh domains"}
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-extrabold text-slate-500">
                    Total domains
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {domains.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-extrabold text-slate-500">
                    Verified
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {
                      domains.filter(
                        (domain) =>
                          domain.verificationStatus === "verified",
                      ).length
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-extrabold text-slate-500">
                    Primary domain
                  </p>
                  <p className="mt-2 break-all text-lg font-black text-slate-950">
                    {primaryDomain?.domain || "Not selected"}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-5">
                <h2 className="text-2xl font-black text-slate-950">
                  Connected domains
                </h2>
                <p className="mt-2 leading-7 text-slate-600">
                  DNS changes can take several hours to appear,
                  depending on the customer's domain provider.
                </p>
              </div>

              {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <p className="font-extrabold text-slate-700">
                    Loading domains…
                  </p>
                </div>
              ) : domains.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">
                    No domains added yet
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                    Create a temporary Beacon address or connect a
                    customer-owned domain using the options above.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {domains.map((domain) => (
                    <DomainCard
                      busyAction={busyAction}
                      domain={domain}
                      key={domain.id}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-blue-950">
                Before customer launch
              </h2>
              <div className="mt-5 grid gap-4 text-sm leading-6 text-blue-900/85 md:grid-cols-3">
                <div className="rounded-2xl border border-blue-200 bg-white/70 p-5">
                  <p className="font-extrabold text-blue-950">
                    1. Confirm hosting target
                  </p>
                  <p className="mt-2">
                    Confirm the A and CNAME values against the live
                    Vercel project.
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-white/70 p-5">
                  <p className="font-extrabold text-blue-950">
                    2. Add domain to Vercel
                  </p>
                  <p className="mt-2">
                    Customer domains must also be registered against
                    the Vercel project before certificates can issue.
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-white/70 p-5">
                  <p className="font-extrabold text-blue-950">
                    3. Confirm SSL
                  </p>
                  <p className="mt-2">
                    Only mark a custom domain fully live once HTTPS is
                    active and the published site opens correctly.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}