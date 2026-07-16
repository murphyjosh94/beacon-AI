import Image from "next/image";
import Link from "next/link";

const navigation = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Shopping",
    href: "/#shopping",
  },
  {
    label: "Getaways",
    href: "/#getaways",
  },
  {
    label: "Entertainment",
    href: "/#entertainment",
  },
  {
    label: "Membership",
    href: "/membership",
  },
];

export default function Navbar() {
  return (
    <>
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-semibold leading-5 text-white sm:px-6 sm:text-sm">
        Trusted guidance • Personal recommendations • Smarter choices
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
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/signin"
              className="hidden rounded-xl px-4 py-3 font-extrabold text-blue-950 transition hover:bg-blue-50 sm:inline-flex"
            >
              Sign In
            </Link>

            <Link
              href="/membership"
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl bg-blue-900 px-3 py-2 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800 sm:px-5 sm:py-3 sm:text-base"
            >
              <span className="sm:hidden">
                Join+
              </span>

              <span className="hidden sm:inline">
                Join Beacon+
              </span>
            </Link>
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}