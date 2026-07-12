import Navbar from "@/components/Navbar";
import BeaconFooter from "@/components/BeaconFooter";
import { PartnerRegistry } from "@/lib/partners/PartnerRegistry";
import type {
  BeaconPartner,
  PartnerStatus,
} from "@/lib/partners/registry";

const statusLabels: Record<PartnerStatus, string> = {
  researching: "Researching",
  applied: "Applied",
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  paused: "Paused",
};

const statusStyles: Record<PartnerStatus, string> = {
  researching: "bg-slate-100 text-slate-700",
  applied: "bg-blue-100 text-blue-900",
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
  paused: "bg-purple-100 text-purple-900",
};

function PartnerCard({ partner }: { partner: BeaconPartner }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
            {partner.network}
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            {partner.name}
          </h2>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-wide ${statusStyles[partner.status]}`}
        >
          {statusLabels[partner.status]}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {partner.categories.map((category) => (
          <span
            key={category}
            className="rounded-full bg-blue-50 px-3 py-2 text-sm font-bold capitalize text-blue-900"
          >
            {category}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Product Feed
          </p>

          <p className="mt-2 font-black text-slate-950">
            {partner.productFeedAvailable ? "Available" : "Not confirmed"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            API
          </p>

          <p className="mt-2 font-black text-slate-950">
            {partner.apiAvailable ? "Available" : "Not confirmed"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Deep Links
          </p>

          <p className="mt-2 font-black text-slate-950">
            {partner.deepLinksAvailable ? "Available" : "Not confirmed"}
          </p>
        </div>
      </div>

      {partner.notes && (
        <p className="mt-6 leading-7 text-slate-600">
          {partner.notes}
        </p>
      )}
    </article>
  );
}

export default function PartnersPage() {
  const partners = PartnerRegistry.findAll();

  const approvedCount = PartnerRegistry.findApproved().length;
  const pendingCount =
    PartnerRegistry.findByStatus("pending").length;
  const researchingCount =
    PartnerRegistry.findByStatus("researching").length;

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="bg-blue-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
            Beacon Partner Hub
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight">
            Partner Registry
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
            Track Beacon&apos;s affiliate applications, data access and
            integration readiness in one place.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-wide text-blue-200">
                Approved
              </p>
              <p className="mt-2 text-4xl font-black">{approvedCount}</p>
            </div>

            <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-wide text-blue-200">
                Pending
              </p>
              <p className="mt-2 text-4xl font-black">{pendingCount}</p>
            </div>

            <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-wide text-blue-200">
                Researching
              </p>
              <p className="mt-2 text-4xl font-black">
                {researchingCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}