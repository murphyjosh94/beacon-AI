"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth/AuthClient";

const personalNavigation = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "My Beacon",
    href: "/my-beacon",
  },
  {
    label: "Membership",
    href: "/membership",
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
] as const;

const businessNavigation = [
  {
    label: "Dashboard",
    href: "/business/dashboard",
  },
  {
    label: "Memberships",
    href: "/business/memberships",
  },
  {
    label: "Account",
    href: "/business/account",
  },
] as const;

function readUserRole(user: unknown): string | null {
  if (
    !user ||
    typeof user !== "object" ||
    !("role" in user) ||
    typeof user.role !== "string"
  ) {
    return null;
  }

  return user.role;
}

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const isBusinessRoute = pathname.startsWith("/business");
  const isSignedIn = Boolean(session?.user);
  const isAdmin = readUserRole(session?.user) === "admin";

  const accountHref = isAdmin
    ? "/admin"
    : isSignedIn
      ? "/dashboard"
      : "/signin";

  const accountLabel = isAdmin
    ? "Admin"
    : isSignedIn
      ? "Dashboard"
      : "Sign In";

  const primaryHref = isAdmin
    ? "/admin"
    : isSignedIn
      ? "/dashboard"
      : "/membership";

  const primaryLabel = isAdmin
    ? "Admin Console"
    : isSignedIn
      ? "My Account"
      : "Join Beacon+";

  if (isBusinessRoute) {
    return (
      <>
        <div className="bg-slate-950 px-4 py-2 text-center text-xs font-semibold leading-5 text-white sm:px-6 sm:text-sm">
          Build your business
          <span aria-hidden="true" className="mx-2 text-amber-300">
            •
          </span>
          Manage your customers
          <span aria-hidden="true" className="mx-2 text-amber-300">
            •
          </span>
          Grow with Beacon
        </div>

        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-4">
            <Link
              href="/business/dashboard"
              aria-label="Beacon Business dashboard"
              className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4"
            >
              <div className="relative h-12 w-12 shrink-0 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
                <Image
                  src="/images/logo.svg"
                  alt="Beacon Business lighthouse logo"
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 640px) 48px, (max-width: 1024px) 64px, 80px"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xl font-black tracking-tight text-slate-950 min-[390px]:text-2xl lg:text-3xl">
                  Beacon Business
                </p>

                <p className="hidden truncate text-sm font-semibold text-slate-500 sm:block lg:text-base">
                  Your Business Operating System
                </p>
              </div>
            </Link>

            <nav
              aria-label="Beacon Business navigation"
              className="hidden items-center gap-1 lg:flex"
            >
              {businessNavigation.map((item) => {
                const active = isActiveRoute(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-xl px-4 py-3 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${
                      active
                        ? "bg-blue-950 text-white"
                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-950"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:px-5 sm:py-3 sm:text-base"
              >
                <span className="sm:hidden">Personal</span>
                <span className="hidden sm:inline">Exit to Beacon AI</span>
              </Link>
            </div>
          </div>

          <nav
            aria-label="Beacon Business mobile navigation"
            className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden"
          >
            {businessNavigation.map((item) => {
              const active = isActiveRoute(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                    active
                      ? "bg-blue-950 text-white"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-extrabold text-amber-800 transition hover:bg-amber-50 hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              Exit to Beacon AI
            </Link>
          </nav>
        </header>
      </>
    );
  }

  return (
    <>
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-semibold leading-5 text-white sm:px-6 sm:text-sm">
        Trusted guidance
        <span aria-hidden="true" className="mx-2 text-blue-300">
          •
        </span>
        Personal recommendations
        <span aria-hidden="true" className="mx-2 text-blue-300">
          •
        </span>
        Smarter choices
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-4">
          <Link
            href="/"
            aria-label="Beacon AI home"
            className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4"
          >
            <div className="relative h-12 w-12 shrink-0 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
              <Image
                src="/images/logo.svg"
                alt="Beacon AI lighthouse logo"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 640px) 48px, (max-width: 1024px) 64px, 80px"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-tight text-slate-950 min-[390px]:text-2xl lg:text-3xl">
                Beacon AI
              </p>

              <p className="hidden truncate text-sm font-semibold text-slate-500 sm:block lg:text-base">
                Your Personal AI Shopper
              </p>
            </div>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {personalNavigation.map((item) => {
              const active = isActiveRoute(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-4 py-3 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${
                    active
                      ? "bg-blue-950 text-white"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-xl px-4 py-3 font-extrabold text-amber-700 transition hover:bg-amber-50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
              >
                Admin
              </Link>
            ) : null}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href={accountHref}
              aria-disabled={isPending}
              className={`hidden rounded-xl px-4 py-3 font-extrabold text-blue-950 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:inline-flex ${
                isPending ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {isPending ? "Loading..." : accountLabel}
            </Link>

            <Link
              href={primaryHref}
              aria-disabled={isPending}
              className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-3 py-2 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-5 sm:py-3 sm:text-base ${
                isAdmin
                  ? "bg-amber-600 hover:bg-amber-500 focus-visible:ring-amber-600"
                  : "bg-blue-900 hover:bg-blue-800 focus-visible:ring-blue-700"
              } ${isPending ? "pointer-events-none opacity-50" : ""}`}
            >
              <span className="sm:hidden">
                {isPending
                  ? "Account"
                  : isAdmin
                    ? "Admin"
                    : isSignedIn
                      ? "Dashboard"
                      : "Beacon+"}
              </span>

              <span className="hidden sm:inline">
                {isPending ? "Loading..." : primaryLabel}
              </span>
            </Link>
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden"
        >
          {personalNavigation.map((item) => {
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                  active
                    ? "bg-blue-950 text-white"
                    : "text-slate-700 hover:bg-blue-50 hover:text-blue-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {isAdmin ? (
            <Link
              href="/admin"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-extrabold text-amber-700 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              Admin
            </Link>
          ) : null}

          <Link
            href={accountHref}
            aria-disabled={isPending}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-extrabold text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
              isPending ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {isPending ? "Account" : accountLabel}
          </Link>
        </nav>
      </header>
    </>
  );
}