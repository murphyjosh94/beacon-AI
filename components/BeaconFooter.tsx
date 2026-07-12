import Link from "next/link";

export default function BeaconFooter() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid gap-12 md:grid-cols-4">

          <div>
            <h3 className="text-2xl font-black">
              🗼 Beacon AI
            </h3>

            <p className="mt-4 text-slate-300 leading-7">
              Your Personal AI Shopper.
              Intelligent recommendations.
              Trusted partners.
              Better decisions.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg">
              Discover
            </h4>

            <ul className="mt-4 space-y-3 text-slate-300">

              <li>
                <Link href="/">
                  Home
                </Link>
              </li>

              <li>
                <Link href="/membership">
                  Beacon+
                </Link>
              </li>

              <li>
                <Link href="/login">
                  Log In
                </Link>
              </li>

            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg">
              Coming Soon
            </h4>

            <ul className="mt-4 space-y-3 text-slate-300">

              <li>🛍 Beacon Shopping</li>

              <li>✈ Beacon Getaways</li>

              <li>🎟 Beacon Entertainment</li>

              <li>🚗 Beacon Automotive</li>

            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg">
              Legal
            </h4>

            <ul className="mt-4 space-y-3 text-slate-300">

              <li>Privacy Policy</li>

              <li>Terms & Conditions</li>

              <li>Cookie Policy</li>

              <li>Affiliate Disclosure</li>

            </ul>
          </div>

        </div>

        <div className="mt-16 border-t border-slate-800 pt-8 text-center text-sm text-slate-400">

          © {new Date().getFullYear()} Beacon AI

          <br />

          Trusted guidance • Personal recommendations • Smarter choices

        </div>

      </div>
    </footer>
  );
}