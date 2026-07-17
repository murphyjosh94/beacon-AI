"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import VehicleIdentifierModal, {
  VehicleFuelType,
  VehicleIdentifierValue,
  VehicleTransmissionType,
} from "@/components/VehicleIdentifierModal";

type Vehicle = {
  id: string;
  nickname: string | null;
  make: string;
  model: string;
  generation: string | null;
  year: number;
  engine: string;
  engineCode: string | null;
  fuelType: VehicleFuelType;
  transmission: VehicleTransmissionType;
  variant: string | null;
  bodyStyle: string | null;
  registration: string | null;
  vin: string | null;
  isDefault: boolean;
  isActive: boolean;
  tyreSizeFront: string | null;
  tyreSizeRear: string | null;
  oilGrade: string | null;
  batterySpecification: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type VehiclesResponse = {
  success: boolean;
  data?: {
    vehicles: Vehicle[];
    total: number;
    defaultVehicleId: string | null;
  };
  error?: {
    code: string;
    message: string;
  };
};

type VehicleMutationResponse = {
  success: boolean;
  data?: {
    vehicle?: Vehicle;
    created?: boolean;
    updated?: boolean;
    deleted?: boolean;
    vehicleId?: string;
  };
  error?: {
    code: string;
    message: string;
  };
};

function getVehicleTitle(
  vehicle: Vehicle
): string {
  if (vehicle.nickname) {
    return vehicle.nickname;
  }

  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

function formatOptionLabel(
  value: string
): string {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function getErrorMessage(
  payload:
    | VehicleMutationResponse
    | VehiclesResponse,
  fallback: string
): string {
  return payload.error?.message ?? fallback;
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

function vehicleToIdentifierValue(
  vehicle: Vehicle
): VehicleIdentifierValue {
  return {
    nickname:
      vehicle.nickname ?? undefined,

    make:
      vehicle.make,

    model:
      vehicle.model,

    generation:
      vehicle.generation ?? undefined,

    year:
      vehicle.year,

    engine:
      vehicle.engine,

    engineCode:
      vehicle.engineCode ?? undefined,

    fuelType:
      vehicle.fuelType,

    transmission:
      vehicle.transmission,

    variant:
      vehicle.variant ?? undefined,

    bodyStyle:
      vehicle.bodyStyle ?? undefined,

    registration:
      vehicle.registration ?? undefined,

    vin:
      vehicle.vin ?? undefined,

    tyreSizeFront:
      vehicle.tyreSizeFront ?? undefined,

    tyreSizeRear:
      vehicle.tyreSizeRear ?? undefined,

    oilGrade:
      vehicle.oilGrade ?? undefined,

    batterySpecification:
      vehicle.batterySpecification ??
      undefined,

    notes:
      vehicle.notes ?? undefined,

    isDefault:
      vehicle.isDefault,
  };
}

export default function MyVehiclesPage() {
  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    actionVehicleId,
    setActionVehicleId,
  ] = useState<string | null>(
    null
  );

  const [error, setError] =
    useState<string | null>(null);

  const [notice, setNotice] =
    useState<string | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    editingVehicle,
    setEditingVehicle,
  ] = useState<Vehicle | null>(
    null
  );

  const [
    deleteVehicle,
    setDeleteVehicle,
  ] = useState<Vehicle | null>(
    null
  );

  const defaultVehicle =
    useMemo(
      () =>
        vehicles.find(
          (vehicle) =>
            vehicle.isDefault
        ) ?? null,
      [vehicles]
    );

  const loadVehicles =
    useCallback(async () => {
      setLoading(true);
      setError(null);

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
            payload
              ? getErrorMessage(
                  payload,
                  "Beacon could not load your saved vehicles."
                )
              : "Beacon could not load your saved vehicles."
          );
        }

        setVehicles(
          payload.data.vehicles
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Beacon could not load your saved vehicles."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          setNotice(null);
        },
        5000
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [notice]);

  function openAddModal() {
    setEditingVehicle(null);
    setError(null);
    setNotice(null);
    setModalOpen(true);
  }

  function openEditModal(
    vehicle: Vehicle
  ) {
    setEditingVehicle(vehicle);
    setError(null);
    setNotice(null);
    setModalOpen(true);
  }

  function closeVehicleModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingVehicle(null);
  }

  async function saveVehicle(
    vehicle:
      VehicleIdentifierValue
  ) {
    setSaving(true);
    setError(null);
    setNotice(null);

    const requestBody = {
      ...(editingVehicle
        ? {
            id:
              editingVehicle.id,
          }
        : {}),

      nickname:
        vehicle.nickname,

      make:
        vehicle.make,

      model:
        vehicle.model,

      generation:
        vehicle.generation,

      year:
        vehicle.year,

      engine:
        vehicle.engine,

      engineCode:
        vehicle.engineCode,

      fuelType:
        vehicle.fuelType ??
        "unknown",

      transmission:
        vehicle.transmission ??
        "unknown",

      variant:
        vehicle.variant,

      bodyStyle:
        vehicle.bodyStyle,

      registration:
        vehicle.registration,

      vin:
        vehicle.vin,

      tyreSizeFront:
        vehicle.tyreSizeFront,

      tyreSizeRear:
        vehicle.tyreSizeRear,

      oilGrade:
        vehicle.oilGrade,

      batterySpecification:
        vehicle.batterySpecification,

      notes:
        vehicle.notes,

      isDefault:
        editingVehicle
          ? vehicle.isDefault ??
            false
          : vehicles.length === 0
            ? true
            : vehicle.isDefault ??
              false,
    };

    try {
      const response =
        await fetch(
          "/api/vehicles",
          {
            method:
              editingVehicle
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody
              ),
          }
        );

      const payload =
        await readJsonResponse<VehicleMutationResponse>(
          response
        );

      if (
        !response.ok ||
        !payload?.success ||
        !payload.data?.vehicle
      ) {
        throw new Error(
          payload
            ? getErrorMessage(
                payload,
                editingVehicle
                  ? "Beacon could not update this vehicle."
                  : "Beacon could not save this vehicle."
              )
            : editingVehicle
              ? "Beacon could not update this vehicle."
              : "Beacon could not save this vehicle."
        );
      }

      const wasEditing =
        Boolean(editingVehicle);

      setModalOpen(false);
      setEditingVehicle(null);

      await loadVehicles();

      setNotice(
        wasEditing
          ? "Vehicle updated successfully."
          : "Vehicle added to your garage."
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not save this vehicle."
      );

      setModalOpen(false);
      setEditingVehicle(null);
    } finally {
      setSaving(false);
    }
  }

  async function setDefaultVehicle(
    vehicle: Vehicle
  ) {
    if (
      vehicle.isDefault ||
      actionVehicleId
    ) {
      return;
    }

    setActionVehicleId(
      vehicle.id
    );

    setError(null);
    setNotice(null);

    try {
      const response =
        await fetch(
          "/api/vehicles",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  vehicle.id,

                isDefault:
                  true,
              }),
          }
        );

      const payload =
        await readJsonResponse<VehicleMutationResponse>(
          response
        );

      if (
        !response.ok ||
        !payload?.success
      ) {
        throw new Error(
          payload
            ? getErrorMessage(
                payload,
                "Beacon could not change your default vehicle."
              )
            : "Beacon could not change your default vehicle."
        );
      }

      await loadVehicles();

      setNotice(
        `${getVehicleTitle(vehicle)} is now Beacon's default vehicle.`
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not change your default vehicle."
      );
    } finally {
      setActionVehicleId(null);
    }
  }

  async function confirmDeleteVehicle() {
    if (
      !deleteVehicle ||
      actionVehicleId
    ) {
      return;
    }

    const vehicle =
      deleteVehicle;

    setActionVehicleId(
      vehicle.id
    );

    setError(null);
    setNotice(null);

    try {
      const response =
        await fetch(
          "/api/vehicles",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  vehicle.id,
              }),
          }
        );

      const payload =
        await readJsonResponse<VehicleMutationResponse>(
          response
        );

      if (
        !response.ok ||
        !payload?.success
      ) {
        throw new Error(
          payload
            ? getErrorMessage(
                payload,
                "Beacon could not remove this vehicle."
              )
            : "Beacon could not remove this vehicle."
        );
      }

      setDeleteVehicle(null);

      await loadVehicles();

      setNotice(
        `${getVehicleTitle(vehicle)} was removed from your garage.`
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not remove this vehicle."
      );
    } finally {
      setActionVehicleId(null);
    }
  }

  const initialModalVehicle =
    editingVehicle
      ? vehicleToIdentifierValue(
          editingVehicle
        )
      : {
          isDefault:
            vehicles.length === 0,
        };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-16 text-white sm:py-20">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/my-beacon"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-blue-200 transition hover:text-white"
          >
            <span aria-hidden="true">
              ←
            </span>

            Back to My Beacon
          </Link>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-200">
                Vehicle Garage
              </p>

              <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
                My Vehicles
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                Save your vehicles so Beacon can identify compatible parts,
                accessories and maintenance products.
              </p>
            </div>

            <button
              type="button"
              onClick={
                openAddModal
              }
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-white px-7 py-4 text-lg font-extrabold text-blue-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <span
                className="mr-2"
                aria-hidden="true"
              >
                +
              </span>

              Add Vehicle
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          {notice ? (
            <div
              role="status"
              className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-900"
            >
              {notice}
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="mb-8 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="font-bold">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  void loadVehicles();
                }}
                className="shrink-0 rounded-xl border border-red-300 bg-white px-4 py-2 font-extrabold transition hover:bg-red-100"
              >
                Try Again
              </button>
            </div>
          ) : null}

          {loading ? (
            <VehicleLoadingState />
          ) : vehicles.length ===
            0 ? (
            <EmptyVehicleState
              onAdd={
                openAddModal
              }
            />
          ) : (
            <>
              <DefaultVehicleSummary
                vehicle={
                  defaultVehicle
                }
              />

              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-900">
                    Saved Vehicles
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                    Your garage
                  </h2>

                  <p className="mt-3 text-slate-600">
                    {vehicles.length}{" "}
                    {vehicles.length ===
                    1
                      ? "vehicle"
                      : "vehicles"}{" "}
                    saved
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    openAddModal
                  }
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-6 py-3 font-extrabold text-white transition hover:bg-blue-800"
                >
                  Add Another Vehicle
                </button>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {vehicles.map(
                  (vehicle) => (
                    <VehicleCard
                      key={
                        vehicle.id
                      }
                      vehicle={
                        vehicle
                      }
                      busy={
                        actionVehicleId ===
                        vehicle.id
                      }
                      onEdit={() => {
                        openEditModal(
                          vehicle
                        );
                      }}
                      onSetDefault={() => {
                        void setDefaultVehicle(
                          vehicle
                        );
                      }}
                      onDelete={() => {
                        setDeleteVehicle(
                          vehicle
                        );
                      }}
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <BeaconFooter />

      <VehicleIdentifierModal
        open={modalOpen}
        loading={saving}
        mode="full"
        title={
          editingVehicle
            ? "Update your vehicle"
            : "Tell Beacon about your vehicle"
        }
        description={
          editingVehicle
            ? "Update the details Beacon uses for compatibility checks."
            : "Add as much information as you know. Make, model, year and engine are required."
        }
        submitLabel={
          editingVehicle
            ? "Save Changes"
            : "Add Vehicle"
        }
        initialVehicle={
          initialModalVehicle
        }
        showDefaultOption
        onCancel={
          closeVehicleModal
        }
        onContinue={(vehicle) => {
          void saveVehicle(
            vehicle
          );
        }}
      />

      {deleteVehicle ? (
        <DeleteVehicleModal
          vehicle={
            deleteVehicle
          }
          deleting={
            actionVehicleId ===
            deleteVehicle.id
          }
          onCancel={() => {
            if (!actionVehicleId) {
              setDeleteVehicle(
                null
              );
            }
          }}
          onConfirm={() => {
            void confirmDeleteVehicle();
          }}
        />
      ) : null}
    </main>
  );
}

function DefaultVehicleSummary({
  vehicle,
}: {
  vehicle: Vehicle | null;
}) {
  if (!vehicle) {
    return (
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-lg sm:p-10">
        <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-amber-800">
          Compatibility Vehicle
        </p>

        <h2 className="mt-3 text-3xl font-black text-slate-950">
          No default vehicle selected
        </h2>

        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          Choose a default vehicle so Beacon knows which vehicle to use for
          compatibility checks.
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-blue-950 p-8 text-white shadow-xl sm:p-10">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-200">
              Beacon Compatibility Vehicle
            </p>

            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-200">
              Default
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black">
            {getVehicleTitle(
              vehicle
            )}
          </h2>

          <p className="mt-3 text-lg text-blue-100">
            {vehicle.year}{" "}
            {vehicle.make}{" "}
            {vehicle.model}
            {vehicle.variant
              ? ` ${vehicle.variant}`
              : ""}
          </p>

          <p className="mt-2 text-blue-200">
            {vehicle.engine}
          </p>
        </div>

        <div className="max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
          <p className="font-extrabold">
            Beacon will use this vehicle
          </p>

          <p className="mt-2 leading-7 text-blue-100">
            Parts and accessory searches will use these details when checking
            compatibility.
          </p>
        </div>
      </div>
    </section>
  );
}

function VehicleCard({
  vehicle,
  busy,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  vehicle: Vehicle;
  busy: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const detailItems = [
    vehicle.registration
      ? {
          label:
            "Registration",

          value:
            vehicle.registration,
        }
      : null,

    vehicle.fuelType !==
    "unknown"
      ? {
          label:
            "Fuel",

          value:
            formatOptionLabel(
              vehicle.fuelType
            ),
        }
      : null,

    vehicle.transmission !==
    "unknown"
      ? {
          label:
            "Transmission",

          value:
            formatOptionLabel(
              vehicle.transmission
            ),
        }
      : null,

    vehicle.bodyStyle
      ? {
          label:
            "Body",

          value:
            vehicle.bodyStyle,
        }
      : null,

    vehicle.engineCode
      ? {
          label:
            "Engine code",

          value:
            vehicle.engineCode,
        }
      : null,

    vehicle.tyreSizeFront
      ? {
          label:
            "Front tyres",

          value:
            vehicle.tyreSizeFront,
        }
      : null,

    vehicle.tyreSizeRear
      ? {
          label:
            "Rear tyres",

          value:
            vehicle.tyreSizeRear,
        }
      : null,

    vehicle.oilGrade
      ? {
          label:
            "Oil grade",

          value:
            vehicle.oilGrade,
        }
      : null,
  ].filter(
    (
      item
    ): item is {
      label: string;
      value: string;
    } => Boolean(item)
  );

  return (
    <article
      className={`rounded-3xl border bg-white p-7 shadow-lg transition ${
        vehicle.isDefault
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-slate-200 hover:border-blue-200 hover:shadow-xl"
      }`}
    >
      <div className="flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            🚗
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-2xl font-black text-slate-950">
              {getVehicleTitle(
                vehicle
              )}
            </h3>

            <p className="mt-1 text-slate-600">
              {vehicle.year}{" "}
              {vehicle.make}{" "}
              {vehicle.model}
            </p>
          </div>
        </div>

        {vehicle.isDefault ? (
          <span className="shrink-0 rounded-full bg-blue-100 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-blue-900">
            Beacon uses this
          </span>
        ) : null}
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
          Engine
        </p>

        <p className="mt-2 font-black text-slate-950">
          {vehicle.engine}
        </p>

        {vehicle.generation ||
        vehicle.variant ? (
          <p className="mt-2 text-sm text-slate-600">
            {[
              vehicle.generation,
              vehicle.variant,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </div>

      {detailItems.length >
      0 ? (
        <dl className="mt-6 grid grid-cols-2 gap-4">
          {detailItems.map(
            (item) => (
              <div
                key={`${vehicle.id}-${item.label}`}
              >
                <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  {item.label}
                </dt>

                <dd className="mt-1 break-words font-bold text-slate-900">
                  {item.value}
                </dd>
              </div>
            )
          )}
        </dl>
      ) : null}

      {vehicle.notes ? (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Notes
          </p>

          <p className="mt-2 line-clamp-3 leading-7 text-slate-600">
            {vehicle.notes}
          </p>
        </div>
      ) : null}

      <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
        {!vehicle.isDefault ? (
          <button
            type="button"
            disabled={busy}
            onClick={
              onSetDefault
            }
            className="rounded-xl bg-blue-900 px-4 py-3 font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? "Updating..."
              : "Use for Compatibility"}
          </button>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={
            onEdit
          }
          className="rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-extrabold text-slate-800 transition hover:border-blue-400 hover:text-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Edit
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={
            onDelete
          }
          className="rounded-xl border-2 border-red-200 bg-white px-4 py-3 font-extrabold text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function EmptyVehicleState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <section className="rounded-[2rem] border-2 border-dashed border-slate-300 bg-white p-10 text-center shadow-lg sm:p-16">
      <p className="text-6xl">
        🚗
      </p>

      <h2 className="mt-6 text-3xl font-black text-slate-950">
        Your garage is empty
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
        Add your first vehicle and Beacon will use it to make more accurate
        parts and accessory recommendations.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-8 inline-flex rounded-2xl bg-blue-900 px-7 py-4 text-lg font-extrabold text-white transition hover:bg-blue-800"
      >
        Add Your First Vehicle
      </button>
    </section>
  );
}

function VehicleLoadingState() {
  return (
    <div className="space-y-8">
      <div className="h-56 animate-pulse rounded-[2rem] bg-slate-200" />

      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map(
          (item) => (
            <div
              key={item}
              className="h-96 animate-pulse rounded-3xl bg-slate-200"
            />
          )
        )}
      </div>
    </div>
  );
}

function DeleteVehicleModal({
  vehicle,
  deleting,
  onCancel,
  onConfirm,
}: {
  vehicle: Vehicle;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-vehicle-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-6"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-3xl">
          🗑️
        </div>

        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-red-700">
          Delete Vehicle
        </p>

        <h2
          id="delete-vehicle-title"
          className="mt-3 text-3xl font-black text-slate-950"
        >
          Remove{" "}
          {getVehicleTitle(
            vehicle
          )}
          ?
        </h2>

        <p className="mt-4 leading-7 text-slate-600">
          This vehicle will be permanently removed from your garage.
          {vehicle.isDefault
            ? " Beacon will automatically choose another saved vehicle as your default."
            : ""}
        </p>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={deleting}
            onClick={
              onCancel
            }
            className="rounded-xl border-2 border-slate-300 px-5 py-3 font-extrabold text-slate-800 transition hover:border-slate-400 disabled:opacity-50"
          >
            Keep Vehicle
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={
              onConfirm
            }
            className="rounded-xl bg-red-700 px-6 py-3 font-extrabold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting
              ? "Deleting..."
              : "Delete Vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
}