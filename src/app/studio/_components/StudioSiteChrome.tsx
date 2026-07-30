"use client";

import {
  BriefcaseBusiness,
  Home,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
} from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useState,
} from "react";

type StudioNavigationItem = {
  label: string;
  href: string;
  icon: typeof Home;
};

const STUDIO_NAVIGATION: StudioNavigationItem[] = [
  {
    label: "Home",
    href: "/studio",
    icon: Home,
  },
  {
    label: "Studio dashboard",
    href: "/studio/dashboard",
    icon: Sparkles,
  },
  {
    label: "Memberships",
    href: "/studio/memberships",
    icon: BriefcaseBusiness,
  },
  {
    label: "Pricing",
    href: "/studio/pricing",
    icon: BriefcaseBusiness,
  },
];

function isActiveRoute(
  pathname: string,
  href: string,
): boolean {
  if (href === "/studio") {
    return pathname === "/studio";
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

function StudioBrand() {
  return (
    <Link
      aria-label="Beacon Studio home"
      className="group inline-flex min-w-0 items-center gap-3"
      href="/studio"
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-br from-blue-700 via-blue-950 to-slate-950 shadow-[0_12px_35px_rgba(37,99,235,0.3)]">
        <span className="absolute inset-1 rounded-xl border border-white/10" />
        <Sparkles className="relative h-5 w-5 text-amber-200 transition duration-200 group-hover:scale-110" />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-base font-black tracking-[0.08em] text-white sm:text-lg">
          BEACON STUDIO
        </span>

        <span className="block truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-cyan-200/80 sm:text-[0.68rem]">
          Create. Refine. Bring ideas to life.
        </span>
      </span>
    </Link>
  );
}

function StudioSiteHeader() {
  const pathname =
    usePathname();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(
      false,
    );
  }, [
    pathname,
  ]);

  return (
    <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#050b18]/95 text-white shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <StudioBrand />

        <nav
          aria-label="Beacon Studio navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {STUDIO_NAVIGATION.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                isActiveRoute(
                  pathname,
                  item.href,
                );

              return (
                <Link
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-black transition ${
                    active
                      ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                      : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  }`}
                  href={
                    item.href
                  }
                  key={
                    item.href
                  }
                >
                  <Icon className="h-4 w-4" />
                  {
                    item.label
                  }
                </Link>
              );
            },
          )}
        </nav>

        <button
          aria-expanded={
            mobileMenuOpen
          }
          aria-label={
            mobileMenuOpen
              ? "Close Studio navigation"
              : "Open Studio navigation"
          }
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-cyan-300/25 hover:bg-cyan-300/10 lg:hidden"
          onClick={() =>
            setMobileMenuOpen(
              (current) =>
                !current,
            )
          }
          type="button"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileMenuOpen ? (
        <nav
          aria-label="Beacon Studio mobile navigation"
          className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-6 lg:hidden"
        >
          <div className="mx-auto grid w-full max-w-[1500px] gap-2">
            {STUDIO_NAVIGATION.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  isActiveRoute(
                    pathname,
                    item.href,
                  );

                return (
                  <Link
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-sm font-black transition ${
                      active
                        ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                    href={
                      item.href
                    }
                    key={
                      item.href
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {
                      item.label
                    }
                  </Link>
                );
              },
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function StudioSiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#030712] text-white">
      <div className="mx-auto grid w-full max-w-[1500px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.25fr_1fr] lg:px-8">
        <div>
          <StudioBrand />

          <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-500">
            Turn ideas, scripts and business briefs into polished marketing
            content, social posts, graphics, voice, video and reusable creative
            assets.
          </p>
        </div>

        <div className="md:justify-self-end">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Studio navigation
          </p>

          <nav
            aria-label="Beacon Studio footer navigation"
            className="mt-4 flex flex-wrap gap-x-5 gap-y-3"
          >
            {STUDIO_NAVIGATION.map(
              (item) => (
                <Link
                  className="text-sm font-bold text-slate-400 transition hover:text-cyan-200"
                  href={
                    item.href
                  }
                  key={
                    item.href
                  }
                >
                  {
                    item.label
                  }
                </Link>
              ),
            )}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-2 px-4 py-5 text-xs font-semibold text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>
            ©{" "}
            {
              new Date().getFullYear()
            }{" "}
            Beacon Studio.
          </span>

          <span>
            Built by Beacon AI. Designed to make creation clearer.
          </span>
        </div>
      </div>
    </footer>
  );
}

export type StudioSiteChromeProps = {
  children: ReactNode;
};

export default function StudioSiteChrome({
  children,
}: StudioSiteChromeProps) {
  const pathname =
    usePathname();

  const isEditorRoute =
    pathname.startsWith(
      "/studio/editor/",
    );

  return (
    <div className="min-h-screen bg-[#050b18]">
      <StudioSiteHeader />

      <div className="min-h-[calc(100vh-74px)]">
        {children}
      </div>

      {!isEditorRoute ? (
        <StudioSiteFooter />
      ) : null}
    </div>
  );
}