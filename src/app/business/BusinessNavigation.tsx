"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BusinessNavigationItem = {
  href: string;
  label: string;
};

const navigationItems: BusinessNavigationItem[] = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/customers", label: "Customers" },
  { href: "/business/quotes", label: "Quotes" },
  { href: "/business/jobs", label: "Jobs" },
  { href: "/business/website", label: "Website Builder" },
  { href: "/business/brand-kit", label: "Brand Kit" },
  { href: "/business/templates", label: "Templates" },
  { href: "/business/analytics", label: "Analytics" },
  { href: "/business/memberships", label: "Membership" },
];

const workspaceRoutes = navigationItems.map((item) => item.href);

function isActivePath(pathname: string, href: string) {
  if (href === "/business/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BusinessNavigation() {
  const pathname = usePathname();

  const shouldShowNavigation = workspaceRoutes.some((route) =>
    isActivePath(pathname, route),
  );

  if (!shouldShowNavigation) {
    return null;
  }

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link
            className="text-lg font-black tracking-tight text-blue-950 transition hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
            href="/business/dashboard"
          >
            Beacon Business
          </Link>

          <Link
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100"
            href="/my-beacon"
          >
            My Beacon
          </Link>
        </div>

        <nav
          aria-label="Business navigation"
          className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          <div className="flex min-w-max gap-2">
            {navigationItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-4 py-2 text-sm font-extrabold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                    active
                      ? "bg-blue-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-blue-950"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}