"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";

type VehicleSummary = {
  id: string;
  nickname: string | null;
  make: string;
  model: string;
  year: number;
  engine: string;
  registration: string | null;
  isDefault: boolean;
};

type VehiclesResponse = {
  success: boolean;
  data?: {
    vehicles: VehicleSummary[];
    total: number;
    defaultVehicleId: string | null;
  };
  error?: {
    code: string;
    message: string;
  };
};

type VehicleGarageState = {
  loading: boolean;
  failed: boolean;
  total: number;
  defaultVehicle: VehicleSummary | null;
};

const quickActions = [
  {
    title: "Ask Beacon",
    description:
      "Start a new personalised search.",
    href: "/",
    icon: "✨",
  },
  {
    title: "Saved Recommendations",
    description:
      "Return to products, getaways and experiences you liked.",
    href: "/my-beacon#saved",
    icon: "🔖",
  },
  {
    title: "Price & Holiday Alerts",
    description:
      "Track changes and receive better-match notifications.",
    href: "/my-beacon#alerts",
    icon: "🔔",
  },
  {
    title: "My Preferences",
    description:
      "Help Beacon understand what matters to you.",
    href: "/my-beacon#preferences",
    icon: "⚙️",
  },
];

const profileAreas = [
  {
    title: "Family Profile",
    description:
      "Store household needs, children’s ages, accessibility requirements and shared preferences.",
    status: "Not set up",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    title: "Travel Profile",
    description:
      "Save preferred airports, destinations, budgets, board options and accommodation requirements.",
    status: "Not set up",
    icon: "✈️",
  },
  {
    title: "Pet Profiles",
    description:
      "Save pet type, age, size, dietary needs and product preferences.",
    status: "Not set up",
    icon: "🐾",
  },
];

function getVehicleTitle(
  vehicle: VehicleSummary
): string {
  if (vehicle.nickname) {
    return vehicle.nickname;
  }

  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

async function readJsonResponse<T>(
  response: Response
): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default function MyBeaconPage() {
  const [
    vehicleGarage,
    setVehicleGarage,
  ] = useState<VehicleGarageState>({
    loading: true,
    failed: false,
    total: 0,
    defaultVehicle: null,
  });

  const loadVehicleGarage =
    useCallback(async () => {
      setVehicleGarage(
        (current) => ({
          ...current,
          loading: true,
          failed: false,
        })
      );

      try {
        const response =
          await fetch(
            "/api/vehicles",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const payload =
          await readJsonResponse<VehiclesResponse>(
            response
          );

        if (
          !response.ok ||
          !payload?.success ||
          !payload.data
        ) {
          throw new Error(
            payload?.error?.message ??
              "Beacon could not load your vehicle garage."
          );
        }

        const defaultVehicle =
          payload.data.vehicles.find(
            (vehicle) =>
              vehicle.isDefault
          ) ??
          payload.data.vehicles.find(
            (vehicle) =>
              vehicle.id ===
              payload.data
                ?.defaultVehicleId
          ) ??
          null;

        setVehicleGarage({
          loading: false,
          failed: false,
          total:
            payload.data.total,
          defaultVehicle,
        });
      } catch {
        setVehicleGarage({
          loading: false,
          failed: true,
          total: 0,
          defaultVehicle: null,
        });
      }
    }, []);

  useEffect(() => {
    void loadVehicleGarage();
  }, [loadVehicleGarage]);

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-20 text-white">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
            My Beacon
          </p>

          <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
                Your personal shopping space.
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                Save recommendations, manage preferences and help Beacon make
                every future search more relevant to you.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-white px-7 py-4 text-lg font-extrabold text-blue-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Ask Beacon
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-white p-7 shadow-lg">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">
                Membership
              </p>

              <p className="mt-3 text-3xl font-black text-slate-950">
                Beacon Free
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Five searches available each day.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-lg">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">
                Searches Today
              </p>

              <p className="mt-3 text-3xl font-black text-slate-950">
                0 / 5
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Your daily allowance resets automatically.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-lg">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">
                Saved Items
              </p>

              <p className="mt-3 text-3xl font-black text-slate-950">
                0
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Recommendations you save will appear here.
              </p>
            </div>

            <div className="rounded-3xl bg-blue-950 p-7 text-white shadow-xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-200">
                Beacon+
              </p>

              <p className="mt-3 text-3xl font-black">
                Coming Soon
              </p>

              <Link
                href="/membership"
                className="mt-4 inline-flex font-extrabold text-blue-100 underline decoration-blue-300 underline-offset-4"
              >
                Explore membership
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-900">
              Quick Actions
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              What would you like to do?
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map(
              (action) => (
                <Link
                  key={
                    action.title
                  }
                  href={
                    action.href
                  }
                  className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-lg transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                >
                  <span className="text-4xl">
                    {action.icon}
                  </span>

                  <h3 className="mt-5 text-xl font-black text-slate-950">
                    {action.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {action.description}
                  </p>

                  <p className="mt-5 font-extrabold text-blue-900">
                    Open →
                  </p>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      <section
        id="saved"
        className="scroll-mt-32 bg-white px-6 py-16"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-900">
            Saved Recommendations
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Keep the strongest options together.
          </h2>

          <div className="mt-8 rounded-[2rem] border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <p className="text-5xl">
              🔖
            </p>

            <h3 className="mt-5 text-2xl font-black text-slate-950">
              Nothing saved yet
            </h3>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
              When Beacon recommends something worth remembering, save it here
              so you can compare it later.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-2xl bg-blue-900 px-6 py-3 font-extrabold text-white transition hover:bg-blue-800"
            >
              Start a Search
            </Link>
          </div>
        </div>
      </section>

      <section
        id="alerts"
        className="scroll-mt-32 px-6 py-16"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-900">
            Alerts
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Let Beacon keep watch.
          </h2>

          <div className="mt-8 rounded-[2rem] bg-blue-950 p-8 text-white shadow-xl sm:p-10">
            <h3 className="text-3xl font-black">
              Price and holiday alerts are coming with Beacon+.
            </h3>

            <p className="mt-4 max-w-3xl leading-8 text-blue-100">
              Save a search and Beacon will monitor trusted partners for price
              drops, better matches and new availability.
            </p>

            <Link
              href="/membership"
              className="mt-7 inline-flex rounded-2xl bg-white px-6 py-3 font-extrabold text-blue-950"
            >
              View Beacon+
            </Link>
          </div>
        </div>
      </section>

      <section
        id="preferences"
        className="scroll-mt-32 bg-white px-6 py-16"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-900">
            Personalisation
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Help Beacon understand your world.
          </h2>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            These profiles will allow Beacon to make recommendations without
            asking you the same questions repeatedly.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {profileAreas.map(
              (area) => (
                <article
                  key={
                    area.title
                  }
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-7"
                >
                  <div className="flex items-start justify-between gap-5">
                    <span className="text-4xl">
                      {area.icon}
                    </span>

                    <span className="rounded-full bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-500 shadow-sm">
                      {area.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-slate-950">
                    {area.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {area.description}
                  </p>

                  <button
                    type="button"
                    className="mt-6 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
                  >
                    Set Up Later
                  </button>
                </article>
              )
            )}

            <VehicleGarageCard
              state={
                vehicleGarage
              }
              onRetry={() => {
                void loadVehicleGarage();
              }}
            />
          </div>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}

function VehicleGarageCard({
  state,
  onRetry,
}: {
  state: VehicleGarageState;
  onRetry: () => void;
}) {
  if (state.loading) {
    return (
      <article
        aria-busy="true"
        className="rounded-3xl border border-blue-200 bg-blue-50 p-7"
      >
        <div className="flex items-start justify-between gap-5">
          <span className="text-4xl">
            🚗
          </span>

          <span className="h-8 w-24 animate-pulse rounded-full bg-blue-100" />
        </div>

        <div className="mt-5 h-8 w-48 animate-pulse rounded-lg bg-blue-100" />

        <div className="mt-4 h-5 w-full animate-pulse rounded bg-blue-100" />

        <div className="mt-2 h-5 w-4/5 animate-pulse rounded bg-blue-100" />

        <div className="mt-7 h-12 w-40 animate-pulse rounded-xl bg-blue-100" />
      </article>
    );
  }

  if (state.failed) {
    return (
      <article className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
        <div className="flex items-start justify-between gap-5">
          <span className="text-4xl">
            🚗
          </span>

          <span className="rounded-full bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-amber-700 shadow-sm">
            Unavailable
          </span>
        </div>

        <h3 className="mt-5 text-2xl font-black text-slate-950">
          Vehicle Garage
        </h3>

        <p className="mt-3 leading-7 text-slate-600">
          Beacon could not load your garage summary, but your saved vehicles
          can still be managed from the garage page.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/my-beacon/vehicles"
            className="rounded-xl bg-blue-900 px-5 py-3 font-extrabold text-white transition hover:bg-blue-800"
          >
            Open Garage
          </Link>

          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950"
          >
            Retry
          </button>
        </div>
      </article>
    );
  }

  if (
    state.total === 0
  ) {
    return (
      <article className="rounded-3xl border border-blue-200 bg-blue-50 p-7">
        <div className="flex items-start justify-between gap-5">
          <span className="text-4xl">
            🚗
          </span>

          <span className="rounded-full bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-blue-800 shadow-sm">
            No vehicles
          </span>
        </div>

        <h3 className="mt-5 text-2xl font-black text-slate-950">
          Vehicle Garage
        </h3>

        <p className="mt-3 leading-7 text-slate-600">
          Set up your first vehicle so Beacon can check parts, accessories and
          maintenance products for compatibility.
        </p>

        <Link
          href="/my-beacon/vehicles"
          className="mt-6 inline-flex rounded-xl bg-blue-900 px-5 py-3 font-extrabold text-white transition hover:bg-blue-800"
        >
          Set Up Your First Vehicle
        </Link>
      </article>
    );
  }

  return (
    <article className="rounded-3xl border border-blue-300 bg-gradient-to-br from-blue-950 to-slate-950 p-7 text-white shadow-xl">
      <div className="flex items-start justify-between gap-5">
        <span className="text-4xl">
          🚗
        </span>

        <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-blue-100">
          {state.total}{" "}
          {state.total === 1
            ? "vehicle"
            : "vehicles"}
        </span>
      </div>

      <h3 className="mt-5 text-2xl font-black">
        Vehicle Garage
      </h3>

      {state.defaultVehicle ? (
        <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-200">
            Beacon uses this vehicle
          </p>

          <p className="mt-2 text-xl font-black">
            {getVehicleTitle(
              state.defaultVehicle
            )}
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-100">
            {state.defaultVehicle.year}{" "}
            {state.defaultVehicle.make}{" "}
            {state.defaultVehicle.model}
          </p>

          <p className="mt-1 text-sm text-blue-200">
            {state.defaultVehicle.engine}
            {state.defaultVehicle.registration
              ? ` · ${state.defaultVehicle.registration}`
              : ""}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5">
          <p className="font-extrabold text-amber-100">
            No default vehicle selected
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-100">
            Choose which saved vehicle Beacon should use for compatibility
            checks.
          </p>
        </div>
      )}

      <Link
        href="/my-beacon/vehicles"
        className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-extrabold text-blue-950 transition hover:bg-blue-50"
      >
        Manage Vehicles
      </Link>
    </article>
  );
}