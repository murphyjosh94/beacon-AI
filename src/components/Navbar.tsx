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
      <div className="bg-slate-950 px-6 py-2 text-center text-sm font-semibold text-white">
        Trusted guidance • Personal recommendations • Smarter choices
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-6">
          <Link
            href="/"
            aria-label="Beacon AI home"
            className="flex min-w-0 items-center gap-4"
          >
            <div className="relative h-20 w-20 shrink-0">
              <Image
                src="/images/logo.svg"
                alt="Beacon AI lighthouse logo"
                fill
                priority
                className="object-contain"
                sizes="80px"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-3xl font-black tracking-tight text-slate-950">
                Beacon AI
              </p>

              <p className="hidden truncate text-base font-semibold text-slate-500 sm:block">
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

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/signin"
              className="hidden rounded-xl px-4 py-3 font-extrabold text-blue-950 transition hover:bg-blue-50 sm:inline-flex"
            >
              Log In
            </Link>

            <Link
              href="/membership"
              className="rounded-xl bg-blue-900 px-5 py-3 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
            >
              Join Beacon+
            </Link>
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden"
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