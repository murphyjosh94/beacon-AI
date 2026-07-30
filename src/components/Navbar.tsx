"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth/AuthClient";

type NavigationItem = {
  href: string;
  label: string;
};

const personalNavigation: readonly NavigationItem[] = [
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
];

const businessNavigation: readonly NavigationItem[] = [
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
];

const studioNavigation: readonly NavigationItem[] = [
  {
    label: "Create",
    href: "/studio",
  },
  {
    label: "Pricing",
    href: "/studio/pricing",
  },
];

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

type BrandProps = {
  href: string;
  name: string;
  description: string;
  ariaLabel: string;
  imageAlt: string;
};

function Brand({
  href,
  name,
  description,
  ariaLabel,
  imageAlt,
}: BrandProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="flex min-w-0 shrink-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-4 sm:gap-4"
    >
      <div className="relative h-12 w-12 shrink-0 sm:h-16 sm:w-16">
        <Image
          src="/images/logo.svg"
          alt={imageAlt}
          fill
          priority
          className="object-contain"
          sizes="(max-width: 640px) 48px, 64px"
        />
      </div>

      <div className="min-w-0">
        <p className="whitespace-nowrap text-xl font-black tracking-tight text-slate-950 sm:text-2xl xl:text-[1.7rem]">
          {name}
        </p>

        <p className="hidden whitespace-nowrap text-sm font-semibold text-slate-500 sm:block">
          {description}
        </p>
      </div>
    </Link>
  );
}

type NavigationLinksProps = {
  pathname: string;
  items: readonly NavigationItem[];
  activeClassName: string;
  inactiveClassName: string;
  focusClassName: string;
};

function NavigationLinks({
  pathname,
  items,
  activeClassName,
  inactiveClassName,
  focusClassName,
}: NavigationLinksProps) {
  return (
    <>
      {items.map((item) => {
        const active = isActiveRoute(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${focusClassName} ${
              active ? activeClassName : inactiveClassName
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const isStudioRoute = pathname.startsWith("/studio");
  const isBusinessRoute = pathname.startsWith("/business");
  const isSignedIn = Boolean(session?.user);
  const isAdmin = readUserRole(session?.user) === "admin";

  const accountHref = isSignedIn ? "/dashboard" : "/signin";
  const accountLabel = isSignedIn ? "Dashboard" : "Sign In";

  const primaryHref = isSignedIn ? "/dashboard" : "/membership";
  const primaryLabel = isSignedIn ? "My Account" : "Join Beacon+";

  if (isStudioRoute) {
    return (
      <div className="sticky top-0 z-50">
        <div className="bg-slate-950 px-4 py-2 text-center text-xs font-semibold leading-5 text-white sm:px-6 sm:text-sm">
          Create with AI
          <span aria-hidden="true" className="mx-2 text-violet-300">
            •
          </span>
          Build your content
          <span aria-hidden="true" className="mx-2 text-violet-300">
            •
          </span>
          Grow your audience
        </div>

        <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1800px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="mr-auto">
              <Brand
                href="/studio"
                name="Beacon Studio"
                description="AI Content Creation"
                ariaLabel="Beacon Studio home"
                imageAlt="Beacon Studio lighthouse logo"
              />
            </div>

            <nav
              aria-label="Beacon Studio navigation"
              className="hidden shrink-0 items-center gap-1 lg:flex"
            >
              <NavigationLinks
                pathname={pathname}
                items={studioNavigation}
                activeClassName="bg-violet-950 text-white"
                inactiveClassName="text-slate-700 hover:bg-violet-50 hover:text-violet-950"
                focusClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
              />
            </nav>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <Link
                href="/business"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Business
              </Link>

              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl bg-slate-950 px-4 py-2 text-sm font-extrabold text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
              >
                Personal
              </Link>
            </div>
          </div>

          <nav
            aria-label="Beacon Studio mobile navigation"
            className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden"
          >
            <NavigationLinks
              pathname={pathname}
              items={studioNavigation}
              activeClassName="bg-violet-950 text-white"
              inactiveClassName="text-slate-700 hover:bg-violet-50 hover:text-violet-950"
              focusClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700"
            />

            <Link
              href="/business"
              className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-extrabold text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              Business
            </Link>

            <Link
              href="/"
              className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-extrabold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
            >
              Personal
            </Link>
          </nav>
        </header>
      </div>
    );
  }

  if (isBusinessRoute) {
    return (
      <div className="sticky top-0 z-50">
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

        <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1800px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="mr-auto">
              <Brand
                href="/business"
                name="Beacon Business"
                description="Your Business Operating System"
                ariaLabel="Beacon Business home"
                imageAlt="Beacon Business lighthouse logo"
              />
            </div>

            <div
              aria-label="Switch between Beacon Business and Beacon Studio"
              className="hidden shrink-0 items-center rounded-xl border border-slate-200 bg-slate-100 p-1 lg:flex"
            >
              <Link
                href="/business"
                aria-current={pathname === "/business" ? "page" : undefined}
                className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Business
              </Link>

              <Link
                href="/studio"
                className="rounded-lg px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-white hover:text-violet-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
              >
                Studio
              </Link>
            </div>

            <nav
              aria-label="Beacon Business navigation"
              className="hidden shrink-0 items-center gap-1 xl:flex"
            >
              <NavigationLinks
                pathname={pathname}
                items={businessNavigation}
                activeClassName="bg-blue-950 text-white"
                inactiveClassName="text-slate-700 hover:bg-blue-50 hover:text-blue-950"
                focusClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              />
            </nav>

            <Link
              href="/"
              className="hidden min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:inline-flex"
            >
              Beacon AI
            </Link>
          </div>

          <nav
            aria-label="Beacon Business mobile navigation"
            className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 xl:hidden"
          >
            <Link
              href="/business"
              aria-current={pathname === "/business" ? "page" : undefined}
              className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                pathname === "/business"
                  ? "bg-blue-950 text-white"
                  : "text-blue-950 hover:bg-blue-50"
              }`}
            >
              Business
            </Link>

            <Link
              href="/studio"
              className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-extrabold text-violet-900 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700"
            >
              Studio
            </Link>

            <NavigationLinks
              pathname={pathname}
              items={businessNavigation}
              activeClassName="bg-blue-950 text-white"
              inactiveClassName="text-slate-700 hover:bg-blue-50 hover:text-blue-950"
              focusClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            />

            <Link
              href="/"
              className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-extrabold text-amber-800 transition hover:bg-amber-50 hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              Beacon AI
            </Link>
          </nav>
        </header>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50">
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

      <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1800px] items-center gap-3 px-4 py-3 sm:px-6 lg:gap-4 lg:px-8">
          <div className="mr-auto shrink-0">
            <Brand
              href="/"
              name="Beacon AI"
              description="Your Personal AI Shopper"
              ariaLabel="Beacon AI home"
              imageAlt="Beacon AI lighthouse logo"
            />
          </div>

          <div
            aria-label="Switch between Beacon Personal and Beacon Business"
            className="hidden shrink-0 items-center rounded-xl border border-slate-200 bg-slate-100 p-1 lg:flex"
          >
            <Link
              href="/"
              aria-current="page"
              className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Personal
            </Link>

            <Link
              href="/business"
              className="rounded-lg px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-white hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Business
            </Link>
          </div>

          <nav
            aria-label="Main navigation"
            className="hidden shrink-0 items-center gap-1 xl:flex"
          >
            <NavigationLinks
              pathname={pathname}
              items={personalNavigation}
              activeClassName="bg-blue-50 text-blue-950"
              inactiveClassName="text-slate-700 hover:bg-blue-50 hover:text-blue-950"
              focusClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            />
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl bg-amber-600 px-4 py-2 text-sm font-extrabold text-white shadow-lg transition hover:bg-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
              >
                <span className="sm:hidden">Admin</span>
                <span className="hidden sm:inline">Admin Console</span>
              </Link>
            ) : (
              <>
                <Link
                  href={accountHref}
                  aria-disabled={isPending}
                  className={`hidden whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-extrabold text-blue-950 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 2xl:inline-flex ${
                    isPending ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  {isPending ? "Loading..." : accountLabel}
                </Link>

                <Link
                  href={primaryHref}
                  aria-disabled={isPending}
                  className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl bg-blue-900 px-4 py-2 text-sm font-extrabold text-white shadow-lg transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${
                    isPending ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <span className="sm:hidden">
                    {isPending
                      ? "Account"
                      : isSignedIn
                        ? "Dashboard"
                        : "Beacon+"}
                  </span>

                  <span className="hidden sm:inline">
                    {isPending ? "Loading..." : primaryLabel}
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 xl:hidden"
        >
          <Link
            href="/"
            aria-current="page"
            className="whitespace-nowrap rounded-xl bg-blue-950 px-3 py-2.5 text-sm font-extrabold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            Personal
          </Link>

          <Link
            href="/business"
            className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-extrabold text-amber-800 transition hover:bg-amber-50 hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
          >
            Business
          </Link>

          <NavigationLinks
            pathname={pathname}
            items={personalNavigation}
            activeClassName="bg-blue-50 text-blue-950"
            inactiveClassName="text-slate-700 hover:bg-blue-50 hover:text-blue-950"
            focusClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          />

          {!isAdmin ? (
            <Link
              href={accountHref}
              aria-disabled={isPending}
              className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-extrabold text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                isPending ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {isPending ? "Account" : accountLabel}
            </Link>
          ) : null}
        </nav>
      </header>
    </div>
  );
}