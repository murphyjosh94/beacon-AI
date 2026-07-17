"use client";

import {
  useRouter,
} from "next/navigation";

import {
  FormEvent,
  useState,
} from "react";

import GeneralAnswerCard from "@/components/engine/GeneralAnswerCard";
import VehicleIdentifierModal from "@/components/VehicleIdentifierModal";

import {
  appendVehicleContext,
  assessVehicleSearch,
  createVehicleLabel,
  type VehicleSearchDetails,
} from "@/lib/vehicles/VehicleSearchContext";

import type {
  BeaconApiResponse,
  BeaconResponse,
} from "@/services/response/BeaconResponse";

const exampleSearches = [
  "Weekend in Manchester with live music",
  "Best cordless vacuum for pet hair",
  "Luxury holiday to Dubai including flights",
  "Energy-saving light bulbs for my kitchen",
  "Injectors for an L322 3.6 TDV8",
  "Explain how APR works",
];

type SaveState =
  | "idle"
  | "saving"
  | "saved"
  | "error";

type VehicleProfile = {
  id: string;
  nickname: string | null;
  make: string;
  model: string;
  generation: string | null;
  year: number;
  engine: string;
  engineCode: string | null;
  fuelType: string;
  transmission: string;
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
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

type VehiclesApiResponse = {
  success: boolean;

  data?: {
    vehicles: VehicleProfile[];
    total: number;
    defaultVehicleId: string | null;
  };

  error?: {
    code?: string;
    message?: string;
  };
};

type CreateVehicleApiResponse = {
  success: boolean;

  data?: {
    vehicle: VehicleProfile;
    created: boolean;
  };

  error?: {
    code?: string;
    message?: string;
  };
};

type PendingVehicleSearch = {
  originalQuery: string;
};

function getScoreLabel(
  score: number
): string {
  if (score >= 90) {
    return "Exceptional";
  }

  if (score >= 80) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Very Good";
  }

  if (score >= 60) {
    return "Good";
  }

  if (score >= 50) {
    return "Fair";
  }

  return "Limited Match";
}

function readApiError(
  response: BeaconApiResponse
): string {
  if (!response.success) {
    return response.error.message;
  }

  return "Beacon could not complete this request.";
}

function readVehicleApiError(
  response:
    | VehiclesApiResponse
    | CreateVehicleApiResponse,
  fallback: string
): string {
  return (
    response.error?.message ??
    fallback
  );
}

function getEmptyResultsMessage(
  source: BeaconResponse["source"]
): string {
  if (
    source === "hotel" ||
    source === "flight"
  ) {
    return (
      "Try broadening the destination, budget, preferred area, " +
      "travel style or dates. Dates are optional for discovery searches."
    );
  }

  if (source === "shopping") {
    return (
      "Try broadening the budget, brand, size, colour, retailer " +
      "or product features you are willing to consider."
    );
  }

  return (
    "Try broadening your request or describing the kind of result " +
    "you would find most useful."
  );
}

function getResultIcon(
  category: string
): string {
  if (category === "holiday") {
    return "🏨";
  }

  if (category === "experience") {
    return "🎟️";
  }

  if (category === "service") {
    return "🧭";
  }

  if (
    category === "vehicle_parts" ||
    category === "automotive"
  ) {
    return "🚘";
  }

  return "🛍️";
}

function getSaveCategory(
  result: BeaconResponse
): string {
  if (
    result.responseType ===
    "recommendations"
  ) {
    return result.intent.category;
  }

  return "general";
}

function createSaveName(
  query: string
): string {
  const cleaned =
    query
      .replace(/\s+/g, " ")
      .trim();

  if (cleaned.length <= 70) {
    return cleaned;
  }

  return `${cleaned.slice(
    0,
    67
  )}...`;
}

function toVehicleSearchDetails(
  vehicle: VehicleProfile
): VehicleSearchDetails {
  return {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    engine: vehicle.engine,
  };
}

function getPreferredVehicle(
  vehicles: VehicleProfile[],
  defaultVehicleId: string | null
): VehicleProfile | null {
  if (defaultVehicleId) {
    const defaultVehicle =
      vehicles.find(
        (vehicle) =>
          vehicle.id ===
          defaultVehicleId
      );

    if (defaultVehicle) {
      return defaultVehicle;
    }
  }

  return (
    vehicles.find(
      (vehicle) =>
        vehicle.isDefault
    ) ??
    vehicles[0] ??
    null
  );
}

export default function BeaconSearch() {
  const router = useRouter();
  const [query, setQuery] =
    useState("");

  const [
    submittedQuery,
    setSubmittedQuery,
  ] = useState("");

  const [result, setResult] =
    useState<BeaconResponse | null>(
      null
    );

  const [
    isResearching,
    setIsResearching,
  ] = useState(false);

  const [
    isVehicleModalOpen,
    setIsVehicleModalOpen,
  ] = useState(false);

  const [
    isSavingVehicle,
    setIsSavingVehicle,
  ] = useState(false);

  const [
    pendingVehicleSearch,
    setPendingVehicleSearch,
  ] =
    useState<PendingVehicleSearch | null>(
      null
    );

  const [
    activeVehicle,
    setActiveVehicle,
  ] =
    useState<VehicleProfile | null>(
      null
    );

  const [
    vehicleContextLabel,
    setVehicleContextLabel,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [saveState, setSaveState] =
    useState<SaveState>("idle");

  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  function resetSearchFeedback() {
    setResult(null);
    setError("");
    setSaveState("idle");
    setSaveMessage("");
    setVehicleContextLabel("");
  }

  function chooseExample(
    example: string
  ) {
    setQuery(example);
    resetSearchFeedback();
  }

  async function runBeaconSearch(
    displayQuery: string,
    researchQuery: string,
    vehicle?: VehicleSearchDetails
  ) {
    setError("");
    setResult(null);
    setSubmittedQuery(displayQuery);
    setSaveState("idle");
    setSaveMessage("");
    setIsResearching(true);

    if (vehicle) {
      setVehicleContextLabel(
        createVehicleLabel(vehicle)
      );
    } else {
      setVehicleContextLabel("");
    }

    try {
      const response =
        await fetch(
          "/api/recommendations",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                query: researchQuery,
                displayQuery,
              }),
          }
        );

      const data =
        (await response.json()) as BeaconApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          readApiError(data)
        );
      }

      if (
        data.publicPath &&
        data.data.responseType ===
          "recommendations"
      ) {
        router.push(data.publicPath);
        return;
      }

      setResult(data.data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not complete this request."
      );
    } finally {
      setIsResearching(false);
    }
  }

  async function loadSavedVehicle(): Promise<VehicleProfile | null> {
    try {
      const response =
        await fetch(
          "/api/vehicles",
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",
            },

            cache: "no-store",
          }
        );

      const data =
        (await response.json()) as VehiclesApiResponse;

      if (response.status === 401) {
        return null;
      }

      if (
        !response.ok ||
        !data.success ||
        !data.data
      ) {
        throw new Error(
          readVehicleApiError(
            data,
            "Beacon could not load your saved vehicles."
          )
        );
      }

      const preferredVehicle =
        getPreferredVehicle(
          data.data.vehicles,
          data.data.defaultVehicleId
        );

      setActiveVehicle(
        preferredVehicle
      );

      return preferredVehicle;
    } catch (caughtError) {
      console.error(
        "Beacon could not load a saved vehicle:",
        caughtError
      );

      return null;
    }
  }

  async function beginSearch(
    value: string
  ) {
    const assessment =
      assessVehicleSearch(value);

    if (
      !assessment.shouldRequestVehicle
    ) {
      await runBeaconSearch(
        value,
        value
      );

      return;
    }

    const savedVehicle =
      activeVehicle ??
      (await loadSavedVehicle());

    if (savedVehicle) {
      const vehicleDetails =
        toVehicleSearchDetails(
          savedVehicle
        );

      await runBeaconSearch(
        value,
        appendVehicleContext(
          value,
          vehicleDetails
        ),
        vehicleDetails
      );

      return;
    }

    setPendingVehicleSearch({
      originalQuery: value,
    });

    setSubmittedQuery(value);
    setResult(null);
    setError("");
    setSaveState("idle");
    setSaveMessage("");
    setVehicleContextLabel("");
    setIsVehicleModalOpen(true);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const value =
      query.trim();

    if (
      !value ||
      isResearching ||
      isSavingVehicle
    ) {
      return;
    }

    await beginSearch(value);
  }

  function handleVehicleModalCancel() {
    if (isSavingVehicle) {
      return;
    }

    setIsVehicleModalOpen(false);
    setPendingVehicleSearch(null);

    setError(
      "Beacon needs your vehicle make, model, year and engine before it can safely recommend compatible parts."
    );
  }

  async function handleVehicleContinue(
    vehicle: VehicleSearchDetails
  ) {
    const pendingSearch =
      pendingVehicleSearch;

    if (
      !pendingSearch ||
      isSavingVehicle
    ) {
      return;
    }

    setIsSavingVehicle(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/vehicles",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nickname:
                  `${vehicle.make} ${vehicle.model}`,

                make:
                  vehicle.make,

                model:
                  vehicle.model,

                year:
                  vehicle.year,

                engine:
                  vehicle.engine,

                fuelType:
                  "unknown",

                transmission:
                  "unknown",

                isDefault:
                  true,
              }),
          }
        );

      const data =
        (await response.json()) as CreateVehicleApiResponse;

      if (
        response.status === 401
      ) {
        setIsVehicleModalOpen(
          false
        );

        setPendingVehicleSearch(
          null
        );

        const researchQuery =
          appendVehicleContext(
            pendingSearch.originalQuery,
            vehicle
          );

        await runBeaconSearch(
          pendingSearch.originalQuery,
          researchQuery,
          vehicle
        );

        return;
      }

      if (
        !response.ok ||
        !data.success ||
        !data.data?.vehicle
      ) {
        throw new Error(
          readVehicleApiError(
            data,
            "Beacon could not save this vehicle."
          )
        );
      }

      setActiveVehicle(
        data.data.vehicle
      );

      setIsVehicleModalOpen(
        false
      );

      setPendingVehicleSearch(
        null
      );

      const researchQuery =
        appendVehicleContext(
          pendingSearch.originalQuery,
          vehicle
        );

      await runBeaconSearch(
        pendingSearch.originalQuery,
        researchQuery,
        vehicle
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not save this vehicle."
      );
    } finally {
      setIsSavingVehicle(false);
    }
  }

  async function handleSaveSearch() {
    if (
      !result ||
      !submittedQuery ||
      saveState === "saving"
    ) {
      return;
    }

    setSaveState("saving");
    setSaveMessage("");

    try {
      const response =
        await fetch(
          "/api/saved-searches",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  createSaveName(
                    submittedQuery
                  ),

                query:
                  submittedQuery,

                category:
                  getSaveCategory(
                    result
                  ),

                searchParameters: {
                  responseType:
                    result.responseType,

                  source:
                    result.source,

                  vehicle:
                    vehicleContextLabel ||
                    null,
                },
              }),
          }
        );

      const data =
        (await response.json()) as {
          success: boolean;

          error?: {
            message?: string;
          };
        };

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error?.message ??
            "Beacon could not save this search."
        );
      }

      setSaveState("saved");

      setSaveMessage(
        "Saved to My Beacon."
      );
    } catch (caughtError) {
      setSaveState("error");

      setSaveMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Beacon could not save this search."
      );
    }
  }

  return (
    <>
      <VehicleIdentifierModal
        open={isVehicleModalOpen}
        loading={isSavingVehicle}
        onCancel={
          handleVehicleModalCancel
        }
        onContinue={
          handleVehicleContinue
        }
      />

      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-blue-100">
            One intelligent search
          </p>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            What can Beacon help you find or understand?
          </h2>

          <p className="mx-auto mt-3 max-w-3xl leading-7 text-blue-100">
            Search for products, cars, parts, hotels,
            holidays, flights, local experiences or ask
            an everyday question.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/30 bg-white/95 p-3 shadow-2xl backdrop-blur-xl"
        >
          <label
            htmlFor="beacon-search"
            className="sr-only"
          >
            What can Beacon help you with?
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <textarea
              id="beacon-search"
              value={query}
              onChange={(event) => {
                setQuery(
                  event.target.value
                );

                setSaveState("idle");
                setSaveMessage("");
              }}
              placeholder="Try: Weekend in Manchester, best TV under £800, or explain APR..."
              rows={2}
              className="min-h-24 flex-1 resize-none rounded-2xl border-2 border-slate-300 bg-white px-5 py-4 text-lg font-medium text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="submit"
              disabled={
                isResearching ||
                isSavingVehicle ||
                query.trim().length === 0
              }
              className="rounded-2xl bg-blue-900 px-8 py-4 text-lg font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResearching
                ? "Researching..."
                : isSavingVehicle
                  ? "Saving vehicle..."
                  : "Ask Beacon"}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {exampleSearches.map(
            (example) => (
              <button
                key={example}
                type="button"
                onClick={() =>
                  chooseExample(
                    example
                  )
                }
                disabled={
                  isResearching ||
                  isSavingVehicle
                }
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-blue-50 backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {example}
              </button>
            )
          )}
        </div>

        <p className="mt-4 text-center text-sm font-semibold text-blue-50">
          Five free personalised searches each day.
          Beacon automatically selects the right research
          capability.
        </p>

        {vehicleContextLabel &&
          isResearching && (
            <div className="mx-auto mt-5 flex max-w-3xl items-center justify-center">
              <div className="rounded-full border border-emerald-200/30 bg-emerald-950/50 px-5 py-2 text-center text-sm font-extrabold text-emerald-100 backdrop-blur">
                Checking compatibility for{" "}
                {vehicleContextLabel}
              </div>
            </div>
          )}

        {isResearching && (
          <div
            aria-live="polite"
            className="mt-8 rounded-3xl border border-white/20 bg-slate-950/75 p-6 text-left shadow-2xl backdrop-blur-xl"
          >
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-200">
              Beacon is working
            </p>

            <div className="mt-5 space-y-3">
              {[
                "Understanding your request",
                vehicleContextLabel
                  ? `Checking compatibility for ${vehicleContextLabel}`
                  : "Selecting the right Beacon capability",
                "Searching suitable live sources where needed",
                "Removing weak or conflicting results",
                "Preparing the strongest response",
              ].map((step) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white"
                >
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-300" />

                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-left shadow-xl"
          >
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-amber-800">
              Beacon AI
            </p>

            <p className="mt-3 text-lg font-bold text-slate-900">
              {error}
            </p>

            <p className="mt-3 leading-7 text-slate-600">
              Beacon should proceed using sensible
              assumptions whenever possible. When one
              essential detail is genuinely missing, it
              will ask a single focused question.
            </p>
          </div>
        )}

        {result &&
          !isResearching &&
          vehicleContextLabel && (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left shadow-lg">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">
                Vehicle compatibility
              </p>

              <p className="mt-2 font-bold text-emerald-950">
                Results were researched for{" "}
                {vehicleContextLabel}.
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Always confirm the registration, VIN,
                engine code or retailer fitment check
                before ordering a vehicle part.
              </p>
            </div>
          )}

        {result &&
          !isResearching && (
            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/20 bg-slate-950/70 p-4 text-left text-white backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-extrabold">
                  Search complete
                </p>

                <p className="mt-1 text-sm text-blue-100">
                  Save this request to revisit it from
                  My Beacon.
                </p>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <button
                  type="button"
                  onClick={
                    handleSaveSearch
                  }
                  disabled={
                    saveState ===
                      "saving" ||
                    saveState ===
                      "saved"
                  }
                  className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-950 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saveState === "saving"
                    ? "Saving..."
                    : saveState === "saved"
                      ? "Saved ✓"
                      : "Save Search"}
                </button>

                {saveMessage && (
                  <p
                    role={
                      saveState === "error"
                        ? "alert"
                        : undefined
                    }
                    className={`text-sm font-semibold ${
                      saveState === "error"
                        ? "text-amber-200"
                        : "text-blue-100"
                    }`}
                  >
                    {saveMessage}
                  </p>
                )}
              </div>
            </div>
          )}

        {result &&
          !isResearching &&
          result.responseType ===
            "general_answer" && (
            <GeneralAnswerCard
              query={result.query}
              answer={result.answer}
              usedWebSearch={
                result.usedWebSearch
              }
              generatedAt={
                result.generatedAt
              }
            />
          )}

        {result &&
          !isResearching &&
          result.responseType ===
            "recommendations" && (
            <section className="mt-10 text-left">
              <div className="rounded-3xl border border-white/20 bg-slate-950/80 p-6 text-white shadow-2xl backdrop-blur-xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-200">
                      Beacon Results
                    </p>

                    <h2 className="mt-3 text-2xl font-extrabold">
                      {result.recommendations
                        .length === 1
                        ? "One carefully selected option"
                        : `${result.recommendations.length} carefully selected options`}
                    </h2>
                  </div>

                  <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-100">
                    {result.liveData
                      ? "Live data"
                      : "Beacon research"}
                  </div>
                </div>

                <p className="mt-4 leading-7 text-blue-50">
                  {result.aiSummary ||
                    result.summary}
                </p>
              </div>

              {result.recommendations
                .length === 0 ? (
                <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-xl">
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    No suitable options found
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {getEmptyResultsMessage(
                      result.source
                    )}
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-6">
                  {result.recommendations.map(
                    (
                      recommendation,
                      index
                    ) => (
                      <article
                        key={
                          recommendation.id
                        }
                        className="overflow-hidden rounded-3xl bg-white shadow-2xl"
                      >
                        <div className="grid md:grid-cols-[220px_1fr]">
                          <div className="flex min-h-52 items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-6">
                            {recommendation.imageUrl ? (
                              <img
                                src={
                                  recommendation.imageUrl
                                }
                                alt={
                                  recommendation.title
                                }
                                className="max-h-48 w-full object-contain"
                              />
                            ) : (
                              <div className="text-center">
                                <div className="text-5xl">
                                  {getResultIcon(
                                    recommendation.category
                                  )}
                                </div>

                                <p className="mt-3 text-sm font-bold text-slate-500">
                                  Beacon recommendation
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="p-6 sm:p-8">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-800">
                                  Option{" "}
                                  {index + 1}
                                </p>

                                <h3 className="mt-2 text-2xl font-extrabold text-slate-950">
                                  {
                                    recommendation.title
                                  }
                                </h3>

                                {recommendation.merchant && (
                                  <p className="mt-2 font-semibold text-slate-500">
                                    {
                                      recommendation.merchant
                                    }
                                  </p>
                                )}
                              </div>

                              <div className="rounded-2xl bg-blue-950 px-5 py-4 text-center text-white">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                                  Beacon Score
                                </p>

                                <p className="mt-1 text-3xl font-black">
                                  {Math.round(
                                    recommendation
                                      .score
                                      .overall
                                  )}
                                </p>

                                <p className="text-xs font-bold text-blue-100">
                                  {getScoreLabel(
                                    recommendation
                                      .score
                                      .overall
                                  )}
                                </p>
                              </div>
                            </div>

                            {recommendation.price && (
                              <p className="mt-5 text-2xl font-extrabold text-blue-900">
                                {
                                  recommendation
                                    .price
                                    .display
                                }
                              </p>
                            )}

                            <p className="mt-5 leading-7 text-slate-600">
                              {
                                recommendation.description
                              }
                            </p>

                            <div className="mt-5 rounded-2xl bg-blue-50 p-5">
                              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-900">
                                Why Beacon selected it
                              </p>

                              <p className="mt-2 leading-7 text-slate-700">
                                {
                                  recommendation.reason
                                }
                              </p>
                            </div>

                            {recommendation.highlights
                              .length > 0 && (
                              <div className="mt-5">
                                <p className="font-extrabold text-slate-900">
                                  Highlights
                                </p>

                                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {recommendation.highlights.map(
                                    (
                                      highlight
                                    ) => (
                                      <li
                                        key={
                                          highlight
                                        }
                                        className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                                      >
                                        ✓{" "}
                                        {
                                          highlight
                                        }
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                            {recommendation.warnings &&
                              recommendation.warnings
                                .length > 0 && (
                                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                  <p className="font-extrabold text-amber-900">
                                    Check before deciding
                                  </p>

                                  <ul className="mt-2 space-y-2 text-sm text-amber-900">
                                    {recommendation.warnings.map(
                                      (
                                        warning
                                      ) => (
                                        <li
                                          key={
                                            warning
                                          }
                                        >
                                          •{" "}
                                          {
                                            warning
                                          }
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}

                            {recommendation.url ? (
                              <a
                                href={
                                  recommendation.url
                                }
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="mt-6 inline-flex rounded-xl bg-blue-900 px-6 py-3 font-extrabold text-white transition hover:bg-blue-800"
                              >
                                View Option
                              </a>
                            ) : (
                              <p className="mt-6 text-sm font-semibold text-slate-500">
                                A direct destination
                                link was not supplied
                                for this result.
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          )}
      </div>
    </>
  );
}