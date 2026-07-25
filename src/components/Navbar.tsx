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
    label: "Business Home",
    href: "/business",
  },
  {
    label: "Dashboard",
    href: "/business/dashboard",
  },
  {
    label: "Website Builder",
    href: "/business/website",
  },
  {
    label: "Templates",
    href: "/business/templates",
  },
  {
    label: "Memberships",
    href: "/business/memberships",
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

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type ModeToggleProps = {
  isBusinessRoute: boolean;
  compact?: boolean;
};

function ModeToggle({
  isBusinessRoute,
  compact = false,
}: ModeToggleProps) {
  return (
    <div
      aria-label="Choose Beacon mode"
      className={`grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-inner ${
        compact ? "min-w-[210px]" : "min-w-[250px]"
      }`}
    >
      <Link
        href="/"
        aria-current={!isBusinessRoute ? "page" : undefined}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${
          compact ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
        } ${
          !isBusinessRoute
            ? "bg-white text-blue-950 shadow-sm"
            : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
        }`}
      >
        <span aria-hidden="true">👤</span>
        <span>Personal</span>
      </Link>

      <Link
        href="/business"
        aria-current={isBusinessRoute ? "page" : undefined}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${
          compact ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"
        } ${
          isBusinessRoute
            ? "bg-blue-950 text-white shadow-sm"
            : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
        }`}
      >
        <span aria-hidden="true">🏢</span>
        <span>Business</span>
      </Link>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const isBusinessRoute = pathname.startsWith("/business");
  const navigation = isBusinessRoute
    ? businessNavigation
    : personalNavigation;

  const isSignedIn = Boolean(session?.user);
  const isAdmin = readUserRole(session?.user) === "admin";

  const accountHref = isAdmin
    ? "/admin"
    : isSignedIn
      ? isBusinessRoute
        ? "/business/dashboard"
        : "/dashboard"
      : "/signin";

  const accountLabel = isAdmin
    ? "Admin"
    : isSignedIn
      ? isBusinessRoute
        ? "Business Dashboard"
        : "Dashboard"
      : "Sign In";

  const primaryHref = isAdmin
    ? "/admin"
    : isSignedIn
      ? isBusinessRoute
        ? "/business/dashboard"
        : "/dashboard"
      : isBusinessRoute
        ? "/business/memberships"
        : "/membership";

  const primaryLabel = isAdmin
    ? "Admin Console"
    : isSignedIn
      ? isBusinessRoute
        ? "Open Business"
        : "My Account"
      : isBusinessRoute
        ? "Start Beacon Business"
        : "Join Beacon+";

  const announcement = isBusinessRoute
    ? "Professional tools to help your business grow."
    : "Trusted AI recommendations for everyday decisions.";

  const strapline = isBusinessRoute
    ? "Your Business Operating Platform"
    : "Your Personal AI Shopper";

  return (
    <>
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-semibold leading-5 text-white sm:px-6 sm:text-sm">
        {announcement}
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-4">
          <Link
            href={isBusinessRoute ? "/business" : "/"}
            aria-label={isBusinessRoute ? "Beacon Business home" : "Beacon home"}
            className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4"
          >
            <div className="relative h-12 w-12 shrink-0 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
              <Image
                src="/images/logo.svg"
                alt="Beacon lighthouse logo"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 640px) 48px, (max-width: 1024px) 64px, 80px"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-tight text-slate-950 min-[390px]:text-2xl lg:text-3xl">
                Beacon
              </p>

              <p className="hidden truncate text-sm font-semibold text-slate-500 sm:block lg:text-base">
                {strapline}
              </p>
            </div>
          </Link>

          <div className="hidden xl:block">
            <ModeToggle isBusinessRoute={isBusinessRoute} />
          </div>

          <nav
            aria-label={
              isBusinessRoute
                ? "Beacon Business navigation"
                : "Beacon personal navigation"
            }
            className="hidden items-center gap-1 lg:flex"
          >
            {navigation.map((item) => {
              const active = isActiveRoute(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-3 py-3 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${
                    active
                      ? isBusinessRoute
                        ? "bg-blue-950 text-white"
                        : "bg-blue-100 text-blue-950"
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
                className="rounded-xl px-3 py-3 font-extrabold text-amber-700 transition hover:bg-amber-50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
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
              className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-3 py-2 text-sm font-extrabold shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-5 sm:py-3 sm:text-base ${
                isAdmin
                  ? "bg-amber-600 text-white hover:bg-amber-500 focus-visible:ring-amber-600"
                  : isBusinessRoute
                    ? "bg-amber-300 text-blue-950 hover:bg-amber-200 focus-visible:ring-amber-500"
                    : "bg-blue-900 text-white hover:bg-blue-800 focus-visible:ring-blue-700"
              } ${isPending ? "pointer-events-none opacity-50" : ""}`}
            >
              <span className="sm:hidden">
                {isPending
                  ? "Account"
                  : isAdmin
                    ? "Admin"
                    : isSignedIn
                      ? isBusinessRoute
                        ? "Business"
                        : "Dashboard"
                      : isBusinessRoute
                        ? "Start"
                        : "Beacon+"}
              </span>

              <span className="hidden sm:inline">
                {isPending ? "Loading..." : primaryLabel}
              </span>
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-100 px-3 py-2 xl:hidden">
          <div className="mx-auto flex max-w-7xl justify-center">
            <ModeToggle
              isBusinessRoute={isBusinessRoute}
              compact
            />
          </div>
        </div>

        <nav
          aria-label={
            isBusinessRoute
              ? "Beacon Business mobile navigation"
              : "Beacon personal mobile navigation"
          }
          className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden"
        >
          {navigation.map((item) => {
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                  active
                    ? isBusinessRoute
                      ? "bg-blue-950 text-white"
                      : "bg-blue-100 text-blue-950"
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