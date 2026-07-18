"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

export type VehicleFuelType =
  | "petrol"
  | "diesel"
  | "hybrid"
  | "plug_in_hybrid"
  | "electric"
  | "lpg"
  | "hydrogen"
  | "other"
  | "unknown";

export type VehicleTransmissionType =
  | "manual"
  | "automatic"
  | "semi_automatic"
  | "cvt"
  | "single_speed"
  | "other"
  | "unknown";

export type VehicleIdentifierValue = {
  nickname?: string;
  make: string;
  model: string;
  generation?: string;
  year: number;
  engine: string;
  engineCode?: string;
  fuelType?: VehicleFuelType;
  transmission?: VehicleTransmissionType;
  variant?: string;
  bodyStyle?: string;
  registration?: string;
  vin?: string;
  tyreSizeFront?: string;
  tyreSizeRear?: string;
  oilGrade?: string;
  batterySpecification?: string;
  notes?: string;
  isDefault?: boolean;
};

type VehicleFormState = {
  nickname: string;
  make: string;
  model: string;
  generation: string;
  year: string;
  engine: string;
  engineCode: string;
  fuelType: VehicleFuelType;
  transmission: VehicleTransmissionType;
  variant: string;
  bodyStyle: string;
  registration: string;
  vin: string;
  tyreSizeFront: string;
  tyreSizeRear: string;
  oilGrade: string;
  batterySpecification: string;
  notes: string;
  isDefault: boolean;
};

type Props = {
  open: boolean;
  loading?: boolean;
  mode?: "quick" | "full";
  title?: string;
  description?: string;
  submitLabel?: string;
  initialVehicle?: Partial<VehicleIdentifierValue> | null;
  showDefaultOption?: boolean;
  onCancel: () => void;
  onContinue: (
    vehicle: VehicleIdentifierValue
  ) => void;
};

const CURRENT_YEAR =
  new Date().getFullYear();

const EMPTY_FORM: VehicleFormState = {
  nickname: "",
  make: "",
  model: "",
  generation: "",
  year: "",
  engine: "",
  engineCode: "",
  fuelType: "unknown",
  transmission: "unknown",
  variant: "",
  bodyStyle: "",
  registration: "",
  vin: "",
  tyreSizeFront: "",
  tyreSizeRear: "",
  oilGrade: "",
  batterySpecification: "",
  notes: "",
  isDefault: false,
};

const FUEL_OPTIONS: Array<{
  value: VehicleFuelType;
  label: string;
}> = [
  {
    value: "unknown",
    label: "Not specified",
  },
  {
    value: "petrol",
    label: "Petrol",
  },
  {
    value: "diesel",
    label: "Diesel",
  },
  {
    value: "hybrid",
    label: "Hybrid",
  },
  {
    value: "plug_in_hybrid",
    label: "Plug-in hybrid",
  },
  {
    value: "electric",
    label: "Electric",
  },
  {
    value: "lpg",
    label: "LPG",
  },
  {
    value: "hydrogen",
    label: "Hydrogen",
  },
  {
    value: "other",
    label: "Other",
  },
];

const TRANSMISSION_OPTIONS: Array<{
  value: VehicleTransmissionType;
  label: string;
}> = [
  {
    value: "unknown",
    label: "Not specified",
  },
  {
    value: "manual",
    label: "Manual",
  },
  {
    value: "automatic",
    label: "Automatic",
  },
  {
    value: "semi_automatic",
    label: "Semi-automatic",
  },
  {
    value: "cvt",
    label: "CVT",
  },
  {
    value: "single_speed",
    label: "Single speed",
  },
  {
    value: "other",
    label: "Other",
  },
];

function createFormState(
  vehicle?: Partial<VehicleIdentifierValue> | null
): VehicleFormState {
  if (!vehicle) {
    return EMPTY_FORM;
  }

  return {
    nickname:
      vehicle.nickname ?? "",

    make:
      vehicle.make ?? "",

    model:
      vehicle.model ?? "",

    generation:
      vehicle.generation ?? "",

    year:
      vehicle.year
        ? String(vehicle.year)
        : "",

    engine:
      vehicle.engine ?? "",

    engineCode:
      vehicle.engineCode ?? "",

    fuelType:
      vehicle.fuelType ?? "unknown",

    transmission:
      vehicle.transmission ?? "unknown",

    variant:
      vehicle.variant ?? "",

    bodyStyle:
      vehicle.bodyStyle ?? "",

    registration:
      vehicle.registration ?? "",

    vin:
      vehicle.vin ?? "",

    tyreSizeFront:
      vehicle.tyreSizeFront ?? "",

    tyreSizeRear:
      vehicle.tyreSizeRear ?? "",

    oilGrade:
      vehicle.oilGrade ?? "",

    batterySpecification:
      vehicle.batterySpecification ?? "",

    notes:
      vehicle.notes ?? "",

    isDefault:
      vehicle.isDefault ?? false,
  };
}

function cleanOptionalValue(
  value: string
): string | undefined {
  const cleaned =
    value.trim();

  return cleaned || undefined;
}

export default function VehicleIdentifierModal({
  open,
  loading = false,
  mode = "quick",
  title,
  description,
  submitLabel,
  initialVehicle = null,
  showDefaultOption = false,
  onCancel,
  onContinue,
}: Props) {
  const [form, setForm] =
    useState<VehicleFormState>(
      createFormState(
        initialVehicle
      )
    );

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    queueMicrotask(() => {
      setForm(
        createFormState(
          initialVehicle
        )
      );

      setError(null);
    });
  }, [
    open,
    initialVehicle,
  ]);

  if (!open) {
    return null;
  }

  const fullMode =
    mode === "full";

  function updateForm<
    Key extends keyof VehicleFormState
  >(
    key: Key,
    value: VehicleFormState[Key]
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    if (error) {
      setError(null);
    }
  }

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const make =
      form.make.trim();

    const model =
      form.model.trim();

    const engine =
      form.engine.trim();

    const parsedYear =
      Number(form.year);

    if (
      !make ||
      !model ||
      !engine
    ) {
      setError(
        "Make, model and engine are required."
      );

      return;
    }

    if (
      !Number.isInteger(
        parsedYear
      ) ||
      parsedYear < 1886 ||
      parsedYear >
        CURRENT_YEAR + 2
    ) {
      setError(
        `Enter a valid vehicle year between 1886 and ${CURRENT_YEAR + 2}.`
      );

      return;
    }

    onContinue({
      nickname:
        cleanOptionalValue(
          form.nickname
        ),

      make,
      model,

      generation:
        cleanOptionalValue(
          form.generation
        ),

      year:
        parsedYear,

      engine,

      engineCode:
        cleanOptionalValue(
          form.engineCode
        ),

      fuelType:
        form.fuelType,

      transmission:
        form.transmission,

      variant:
        cleanOptionalValue(
          form.variant
        ),

      bodyStyle:
        cleanOptionalValue(
          form.bodyStyle
        ),

      registration:
        cleanOptionalValue(
          form.registration
        ),

      vin:
        cleanOptionalValue(
          form.vin
        ),

      tyreSizeFront:
        cleanOptionalValue(
          form.tyreSizeFront
        ),

      tyreSizeRear:
        cleanOptionalValue(
          form.tyreSizeRear
        ),

      oilGrade:
        cleanOptionalValue(
          form.oilGrade
        ),

      batterySpecification:
        cleanOptionalValue(
          form.batterySpecification
        ),

      notes:
        cleanOptionalValue(
          form.notes
        ),

      isDefault:
        form.isDefault,
    });
  }

  const modalTitle =
    title ??
    (fullMode
      ? "Tell Beacon about your vehicle"
      : "Tell Beacon about your vehicle");

  const modalDescription =
    description ??
    (fullMode
      ? "Add as much information as you know. Make, model, year and engine are required."
      : "Beacon needs your vehicle details to avoid recommending incompatible parts.");

  const buttonLabel =
    submitLabel ??
    (fullMode
      ? "Save Vehicle"
      : "Continue");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-identifier-title"
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4 sm:p-6"
    >
      <div className="flex min-h-full items-start justify-center py-4 sm:items-center">
        <form
          onSubmit={submit}
          className={`w-full rounded-[2rem] bg-white shadow-2xl ${
            fullMode
              ? "max-w-4xl"
              : "max-w-lg"
          }`}
        >
          <div className="flex items-start justify-between gap-5 border-b border-slate-200 p-6 sm:p-8">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                Vehicle Required
              </p>

              <h2
                id="vehicle-identifier-title"
                className="mt-3 text-3xl font-black text-slate-950"
              >
                {modalTitle}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {modalDescription}
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              aria-label="Close vehicle form"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <div
            className={`p-6 sm:p-8 ${
              fullMode
                ? "max-h-[70vh] overflow-y-auto"
                : ""
            }`}
          >
            {error ? (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-900"
              >
                {error}
              </div>
            ) : null}

            <div
              className={
                fullMode
                  ? "grid gap-5 sm:grid-cols-2"
                  : "space-y-4"
              }
            >
              {fullMode ? (
                <>
                  <VehicleInput
                    label="Nickname"
                    value={form.nickname}
                    placeholder="e.g. Family car"
                    onChange={(value) => {
                      updateForm(
                        "nickname",
                        value
                      );
                    }}
                  />

                  <VehicleInput
                    label="Registration"
                    value={form.registration}
                    placeholder="e.g. AB12 CDE"
                    uppercase
                    onChange={(value) => {
                      updateForm(
                        "registration",
                        value
                      );
                    }}
                  />
                </>
              ) : null}

              <VehicleInput
                label="Make"
                value={form.make}
                placeholder="e.g. Land Rover"
                required
                autoFocus
                onChange={(value) => {
                  updateForm(
                    "make",
                    value
                  );
                }}
              />

              <VehicleInput
                label="Model"
                value={form.model}
                placeholder="e.g. Range Rover Sport"
                required
                onChange={(value) => {
                  updateForm(
                    "model",
                    value
                  );
                }}
              />

              <VehicleInput
                label="Year"
                value={form.year}
                placeholder="e.g. 2012"
                type="number"
                min={1886}
                max={CURRENT_YEAR + 2}
                required
                onChange={(value) => {
                  updateForm(
                    "year",
                    value
                  );
                }}
              />

              <VehicleInput
                label="Engine"
                value={form.engine}
                placeholder="e.g. 3.6 TDV8"
                required
                onChange={(value) => {
                  updateForm(
                    "engine",
                    value
                  );
                }}
              />

              {fullMode ? (
                <>
                  <VehicleInput
                    label="Generation"
                    value={form.generation}
                    placeholder="e.g. L320"
                    onChange={(value) => {
                      updateForm(
                        "generation",
                        value
                      );
                    }}
                  />

                  <VehicleInput
                    label="Engine code"
                    value={form.engineCode}
                    placeholder="e.g. 368DT"
                    onChange={(value) => {
                      updateForm(
                        "engineCode",
                        value
                      );
                    }}
                  />

                  <VehicleInput
                    label="Variant or trim"
                    value={form.variant}
                    placeholder="e.g. HSE"
                    onChange={(value) => {
                      updateForm(
                        "variant",
                        value
                      );
                    }}
                  />

                  <VehicleInput
                    label="Body style"
                    value={form.bodyStyle}
                    placeholder="e.g. SUV"
                    onChange={(value) => {
                      updateForm(
                        "bodyStyle",
                        value
                      );
                    }}
                  />

                  <VehicleSelect
                    label="Fuel type"
                    value={form.fuelType}
                    options={FUEL_OPTIONS}
                    onChange={(value) => {
                      updateForm(
                        "fuelType",
                        value as VehicleFuelType
                      );
                    }}
                  />

                  <VehicleSelect
                    label="Transmission"
                    value={form.transmission}
                    options={
                      TRANSMISSION_OPTIONS
                    }
                    onChange={(value) => {
                      updateForm(
                        "transmission",
                        value as VehicleTransmissionType
                      );
                    }}
                  />

                  <VehicleInput
                    label="VIN"
                    value={form.vin}
                    placeholder="17-character VIN"
                    uppercase
                    maxLength={17}
                    onChange={(value) => {
                      updateForm(
                        "vin",
                        value
                      );
                    }}
                  />

                  <VehicleInput
                    label="Oil grade"
                    value={form.oilGrade}
                    placeholder="e.g. 5W-30"
                    onChange={(value) => {
                      updateForm(
                        "oilGrade",
                        value
                      );
                    }}
                  />

                  <VehicleInput
                    label="Front tyre size"
                    value={form.tyreSizeFront}
                    placeholder="e.g. 275/40 R20"
                    onChange={(value) => {
                      updateForm(
                        "tyreSizeFront",
                        value
                      );
                    }}
                  />

                  <VehicleInput
                    label="Rear tyre size"
                    value={form.tyreSizeRear}
                    placeholder="e.g. 275/40 R20"
                    onChange={(value) => {
                      updateForm(
                        "tyreSizeRear",
                        value
                      );
                    }}
                  />

                  <div className="sm:col-span-2">
                    <VehicleInput
                      label="Battery specification"
                      value={
                        form.batterySpecification
                      }
                      placeholder="e.g. 019 AGM, 95Ah, 850A"
                      onChange={(value) => {
                        updateForm(
                          "batterySpecification",
                          value
                        );
                      }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="text-sm font-extrabold text-slate-800">
                        Notes
                      </span>

                      <textarea
                        value={form.notes}
                        rows={4}
                        maxLength={2000}
                        placeholder="Service history, modifications or other useful information"
                        onChange={(event) => {
                          updateForm(
                            "notes",
                            event.target.value
                          );
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </div>

            {fullMode &&
            showDefaultOption ? (
              <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) => {
                    updateForm(
                      "isDefault",
                      event.target.checked
                    );
                  }}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-900"
                />

                <span>
                  <span className="block font-extrabold text-blue-950">
                    Use this vehicle for compatibility checks
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-blue-800">
                    Beacon will make this your default vehicle for relevant
                    parts and accessory searches.
                  </span>
                </span>
              </label>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-6 sm:flex-row sm:justify-end sm:p-8">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="rounded-xl border-2 border-slate-300 px-5 py-3 font-extrabold text-slate-800 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-900 px-6 py-3 font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VehicleInput({
  label,
  value,
  placeholder,
  type = "text",
  required = false,
  uppercase = false,
  autoFocus = false,
  min,
  max,
  maxLength,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "number";
  required?: boolean;
  uppercase?: boolean;
  autoFocus?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-slate-800">
        {label}

        {required ? (
          <span className="text-red-600">
            {" "}
            *
          </span>
        ) : null}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        autoFocus={autoFocus}
        min={min}
        max={max}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(
            event.target.value
          );
        }}
        className={`mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${
          uppercase
            ? "uppercase"
            : ""
        }`}
      />
    </label>
  );
}

function VehicleSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-slate-800">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value
          );
        }}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}