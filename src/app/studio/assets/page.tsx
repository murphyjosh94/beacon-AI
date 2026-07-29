import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  FolderOpen,
  LayoutDashboard,
  PackageOpen,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import AssetManager from "../_components/AssetManager";

export const metadata: Metadata = {
  title: "Asset Library | Beacon Studio",
  description:
    "Upload, organise, preview and reuse files across your Beacon Studio projects.",
};

type StudioNavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  active?: boolean;
};

const studioNavigation: StudioNavigationItem[] = [
  {
    href: "/studio/dashboard",
    label: "Dashboard",
    description: "Studio overview",
    icon: LayoutDashboard,
  },
  {
    href: "/studio/projects",
    label: "Projects",
    description: "Manage your work",
    icon: FolderOpen,
  },
  {
    href: "/studio/assets",
    label: "Assets",
    description: "Files and media",
    icon: PackageOpen,
    active: true,
  },
  {
    href: "/studio/create",
    label: "Create",
    description: "Start something new",
    icon: WandSparkles,
  },
];

export default function StudioAssetsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-amber-300/[0.05] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[520px] rounded-full bg-blue-500/[0.04] blur-3xl" />
      </div>

      <header className="relative border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Link
                href="/studio"
                aria-label="Return to Beacon Studio"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                  <Sparkles className="h-4 w-4" />
                  Beacon Studio
                </div>

                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                  Asset Library
                </h1>
              </div>
            </div>

            <Link
              href="/studio/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <WandSparkles className="h-4 w-4" />
              Create project
            </Link>
          </div>

          <nav
            aria-label="Studio navigation"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {studioNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.active === true;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex min-w-[154px] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-amber-300/30 bg-amber-300/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-amber-300 text-slate-950"
                        : "bg-white/5 text-slate-400 transition group-hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {item.label}
                    </span>

                    <span
                      className={`mt-0.5 block truncate text-xs ${
                        isActive ? "text-amber-100/70" : "text-slate-500"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="relative px-5 py-6 sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_38%)]" />

            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                  <PackageOpen className="h-4 w-4" />
                  Central asset storage
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Everything you create, in one place
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                  Upload images, videos, logos, documents, presentations and
                  campaign files. Preview and organise them before reusing them
                  across Beacon Studio projects.
                </p>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3">
                <FeatureStat value="10" label="Asset types" />
                <FeatureStat value="Live" label="File previews" />
                <FeatureStat
                  value="Secure"
                  label="Private storage"
                  className="col-span-2 sm:col-span-1"
                />
              </div>
            </div>
          </div>
        </section>

        <AssetManager
          title="Manage Studio assets"
          description="Search, upload, select, preview, rename, organise and delete assets from your Beacon Studio library."
          allowUpload
          allowDelete
          allowRename
          allowCollections
          className="pb-12"
        />
      </div>
    </main>
  );
}

function FeatureStat({
  value,
  label,
  className = "",
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`min-w-[120px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-center backdrop-blur ${className}`}
    >
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}