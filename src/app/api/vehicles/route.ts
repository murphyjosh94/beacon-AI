import { randomUUID } from "crypto";

import { headers } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  and,
  asc,
  eq,
  ne,
} from "drizzle-orm";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";

import {
  user,
  userVehicleProfile,
} from "@/lib/database/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VehicleFuelType =
  | "petrol"
  | "diesel"
  | "hybrid"
  | "plug_in_hybrid"
  | "electric"
  | "lpg"
  | "hydrogen"
  | "other"
  | "unknown";

type VehicleTransmissionType =
  | "manual"
  | "automatic"
  | "semi_automatic"
  | "cvt"
  | "single_speed"
  | "other"
  | "unknown";

type CreateVehicleRequestBody = {
  nickname?: unknown;
  make?: unknown;
  model?: unknown;
  generation?: unknown;
  year?: unknown;
  engine?: unknown;
  engineCode?: unknown;
  fuelType?: unknown;
  transmission?: unknown;
  variant?: unknown;
  bodyStyle?: unknown;
  registration?: unknown;
  vin?: unknown;
  tyreSizeFront?: unknown;
  tyreSizeRear?: unknown;
  oilGrade?: unknown;
  batterySpecification?: unknown;
  notes?: unknown;
  isDefault?: unknown;
  metadata?: unknown;
};

type UpdateVehicleRequestBody =
  CreateVehicleRequestBody & {
    id?: unknown;
    isActive?: unknown;
    expectedUpdatedAt?: unknown;
  };

type DeleteVehicleRequestBody = {
  id?: unknown;
  expectedUpdatedAt?: unknown;
};

type AuthenticatedAccount = {
  id: string;
};

type VehicleRow =
  typeof userVehicleProfile.$inferSelect;

type VehicleInsert =
  typeof userVehicleProfile.$inferInsert;

type VehicleMetadata =
  NonNullable<VehicleRow["metadata"]>;

type FieldErrors =
  Record<string, string>;

type DvlaVehicleResponse = {
  registrationNumber?: string;
  taxStatus?: string;
  taxDueDate?: string;
  artEndDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  make?: string;
  monthOfFirstDvlaRegistration?: string;
  monthOfFirstRegistration?: string;
  yearOfManufacture?: number;
  engineCapacity?: number;
  co2Emissions?: number;
  fuelType?: string;
  markedForExport?: boolean;
  colour?: string;
  typeApproval?: string;
  wheelplan?: string;
  revenueWeight?: number;
  realDrivingEmissions?: string;
  dateOfLastV5CIssued?: string;
  euroStatus?: string;
  automatedVehicle?: boolean;
};

type DvlaErrorResponse = {
  errors?: Array<{
    status?: string;
    code?: string;
    title?: string;
    detail?: string;
  }>;
};

type NhtsaVinResponse = {
  Count?: number;
  Message?: string;
  SearchCriteria?: string;
  Results?: Array<{
    Make?: string;
    Model?: string;
    ModelYear?: string;
    Trim?: string;
    Series?: string;
    BodyClass?: string;
    VehicleType?: string;
    FuelTypePrimary?: string;
    FuelTypeSecondary?: string;
    EngineModel?: string;
    EngineConfiguration?: string;
    EngineCylinders?: string;
    DisplacementL?: string;
    TransmissionStyle?: string;
    TransmissionSpeeds?: string;
    DriveType?: string;
    PlantCountry?: string;
    Manufacturer?: string;
    ErrorCode?: string;
    ErrorText?: string;
  }>;
};

type VehicleInput = {
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
  tyreSizeFront: string | null;
  tyreSizeRear: string | null;
  oilGrade: string | null;
  batterySpecification: string | null;
  notes: string | null;
  metadata: VehicleMetadata;
};

const CURRENT_YEAR =
  new Date().getFullYear();

const MINIMUM_VEHICLE_YEAR = 1886;

const MAXIMUM_VEHICLE_YEAR =
  CURRENT_YEAR + 2;

const MAXIMUM_VEHICLES = 20;

const DVLA_VES_ENDPOINT =
  "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

const NHTSA_VIN_ENDPOINT =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";

const FUEL_TYPES =
  new Set<VehicleFuelType>([
    "petrol",
    "diesel",
    "hybrid",
    "plug_in_hybrid",
    "electric",
    "lpg",
    "hydrogen",
    "other",
    "unknown",
  ]);

const TRANSMISSION_TYPES =
  new Set<VehicleTransmissionType>([
    "manual",
    "automatic",
    "semi_automatic",
    "cvt",
    "single_speed",
    "other",
    "unknown",
  ]);

function createErrorResponse(
  code: string,
  message: string,
  status: number,
  fieldErrors?: FieldErrors,
  details?: Record<
    string,
    unknown
  >
) {
  return NextResponse.json(
    {
      success: false,

      error: {
        code,
        message,

        ...(fieldErrors &&
        Object.keys(fieldErrors)
          .length > 0
          ? {
              fields:
                fieldErrors,
            }
          : {}),

        ...(details
          ? {
              details,
            }
          : {}),
      },
    },
    {
      status,
    }
  );
}

function createSuccessResponse(
  data: Record<
    string,
    unknown
  >,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status,
    }
  );
}

async function readRequestBody<T>(
  request: Request
): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function readString(
  value: unknown,
  maximumLength: number
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function readOptionalString(
  value: unknown,
  maximumLength: number
): string | null {
  const cleaned =
    readString(
      value,
      maximumLength
    );

  return cleaned || null;
}

function readBoolean(
  value: unknown,
  fallback: boolean
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function readVehicleYear(
  value: unknown
): number | null {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value ===
          "string"
        ? Number(
            value.trim()
          )
        : Number.NaN;

  if (
    !Number.isInteger(
      numericValue
    ) ||
    numericValue <
      MINIMUM_VEHICLE_YEAR ||
    numericValue >
      MAXIMUM_VEHICLE_YEAR
  ) {
    return null;
  }

  return numericValue;
}

function readFuelType(
  value: unknown
): VehicleFuelType {
  if (
    typeof value ===
      "string" &&
    FUEL_TYPES.has(
      value as VehicleFuelType
    )
  ) {
    return value as VehicleFuelType;
  }

  return "unknown";
}

function readTransmission(
  value: unknown
): VehicleTransmissionType {
  if (
    typeof value ===
      "string" &&
    TRANSMISSION_TYPES.has(
      value as VehicleTransmissionType
    )
  ) {
    return value as VehicleTransmissionType;
  }

  return "unknown";
}

function readMetadata(
  value: unknown
): VehicleMetadata {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return {} as VehicleMetadata;
  }

  const metadata: Record<
    string,
    string | number | boolean | null
  > = {};

  for (const [
    key,
    entry,
  ] of Object.entries(value)) {
    if (
      entry === null ||
      typeof entry ===
        "string" ||
      typeof entry ===
        "number" ||
      typeof entry ===
        "boolean"
    ) {
      metadata[key] =
        entry;
    }
  }

  return metadata as VehicleMetadata;
}

function normaliseRegistration(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        ""
      )
      .slice(0, 12);

  return cleaned || null;
}

function normaliseVin(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value
      .toUpperCase()
      .replace(
        /[^A-HJ-NPR-Z0-9]/g,
        ""
      )
      .slice(0, 17);

  return cleaned || null;
}

function readExpectedDate(
  value: unknown
): Date | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function datesMatch(
  left: Date | string,
  right: Date
): boolean {
  return (
    new Date(left).getTime() ===
    right.getTime()
  );
}

function mapDvlaFuelType(
  value?: string
): VehicleFuelType {
  const normalised =
    value
      ?.trim()
      .toLowerCase();

  if (!normalised) {
    return "unknown";
  }

  if (
    normalised.includes(
      "electric"
    )
  ) {
    return "electric";
  }

  if (
    normalised.includes(
      "plug"
    ) &&
    normalised.includes(
      "hybrid"
    )
  ) {
    return "plug_in_hybrid";
  }

  if (
    normalised.includes(
      "hybrid"
    )
  ) {
    return "hybrid";
  }

  if (
    normalised.includes(
      "diesel"
    )
  ) {
    return "diesel";
  }

  if (
    normalised.includes(
      "petrol"
    ) ||
    normalised.includes(
      "gasoline"
    )
  ) {
    return "petrol";
  }

  if (
    normalised.includes(
      "lpg"
    )
  ) {
    return "lpg";
  }

  if (
    normalised.includes(
      "hydrogen"
    )
  ) {
    return "hydrogen";
  }

  return "other";
}

function mapNhtsaFuelType(
  primary?: string,
  secondary?: string
): VehicleFuelType {
  const combined =
    `${primary ?? ""} ${secondary ?? ""}`
      .toLowerCase();

  if (
    combined.includes(
      "plug-in"
    ) ||
    combined.includes(
      "plug in"
    )
  ) {
    return "plug_in_hybrid";
  }

  if (
    combined.includes(
      "electric"
    ) &&
    combined.includes(
      "gasoline"
    )
  ) {
    return "hybrid";
  }

  if (
    combined.includes(
      "electric"
    )
  ) {
    return "electric";
  }

  if (
    combined.includes(
      "diesel"
    )
  ) {
    return "diesel";
  }

  if (
    combined.includes(
      "gasoline"
    ) ||
    combined.includes(
      "petrol"
    )
  ) {
    return "petrol";
  }

  if (
    combined.includes(
      "hydrogen"
    )
  ) {
    return "hydrogen";
  }

  if (
    combined.includes(
      "lpg"
    ) ||
    combined.includes(
      "propane"
    )
  ) {
    return "lpg";
  }

  return combined.trim()
    ? "other"
    : "unknown";
}

function mapNhtsaTransmission(
  value?: string
): VehicleTransmissionType {
  const normalised =
    value
      ?.trim()
      .toLowerCase();

  if (!normalised) {
    return "unknown";
  }

  if (
    normalised.includes(
      "cvt"
    ) ||
    normalised.includes(
      "continuously variable"
    )
  ) {
    return "cvt";
  }

  if (
    normalised.includes(
      "manual"
    )
  ) {
    return "manual";
  }

  if (
    normalised.includes(
      "automatic"
    )
  ) {
    return "automatic";
  }

  if (
    normalised.includes(
      "single"
    )
  ) {
    return "single_speed";
  }

  return "other";
}

function buildEngineDescription(
  values: {
    engineModel?: string;
    displacementL?: string;
    engineCylinders?: string;
    engineConfiguration?: string;
  }
): string {
  const items = [
    values.displacementL
      ? `${values.displacementL}L`
      : null,

    values.engineConfiguration ||
      null,

    values.engineCylinders
      ? `${values.engineCylinders} cylinder`
      : null,

    values.engineModel ||
      null,
  ].filter(
    (
      item
    ): item is string =>
      Boolean(item)
  );

  return items.join(" ");
}

function buildInput(
  body:
    | CreateVehicleRequestBody
    | UpdateVehicleRequestBody,
  existing?: VehicleRow
): {
  input: VehicleInput;
  fieldErrors: FieldErrors;
} {
  const make =
    body.make === undefined &&
    existing
      ? existing.make
      : readString(
          body.make,
          80
        );

  const model =
    body.model === undefined &&
    existing
      ? existing.model
      : readString(
          body.model,
          120
        );

  const year =
    body.year === undefined &&
    existing
      ? existing.year
      : readVehicleYear(
          body.year
        );

  const engine =
    body.engine === undefined &&
    existing
      ? existing.engine
      : readString(
          body.engine,
          120
        );

  const fieldErrors:
    FieldErrors = {};

  if (!make) {
    fieldErrors.make =
      "Please enter the vehicle manufacturer.";
  }

  if (!model) {
    fieldErrors.model =
      "Please enter the vehicle model.";
  }

  if (!year) {
    fieldErrors.year =
      `Enter a year between ${MINIMUM_VEHICLE_YEAR} and ${MAXIMUM_VEHICLE_YEAR}.`;
  }

  if (!engine) {
    fieldErrors.engine =
      "Please enter the vehicle engine.";
  }

  const registration =
    body.registration ===
      undefined &&
    existing
      ? existing.registration
      : normaliseRegistration(
          body.registration
        );

  const vin =
    body.vin === undefined &&
    existing
      ? existing.vin
      : normaliseVin(
          body.vin
        );

  if (
    body.vin !== undefined &&
    vin &&
    vin.length !== 17
  ) {
    fieldErrors.vin =
      "Enter a complete 17-character VIN.";
  }

  return {
    fieldErrors,

    input: {
      nickname:
        body.nickname ===
          undefined &&
        existing
          ? existing.nickname
          : readOptionalString(
              body.nickname,
              80
            ),

      make,
      model,

      generation:
        body.generation ===
          undefined &&
        existing
          ? existing.generation
          : readOptionalString(
              body.generation,
              80
            ),

      year:
        year ??
        MINIMUM_VEHICLE_YEAR,

      engine,

      engineCode:
        body.engineCode ===
          undefined &&
        existing
          ? existing.engineCode
          : readOptionalString(
              body.engineCode,
              80
            ),

      fuelType:
        body.fuelType ===
          undefined &&
        existing
          ? existing.fuelType as VehicleFuelType
          : readFuelType(
              body.fuelType
            ),

      transmission:
        body.transmission ===
          undefined &&
        existing
          ? existing.transmission as VehicleTransmissionType
          : readTransmission(
              body.transmission
            ),

      variant:
        body.variant ===
          undefined &&
        existing
          ? existing.variant
          : readOptionalString(
              body.variant,
              120
            ),

      bodyStyle:
        body.bodyStyle ===
          undefined &&
        existing
          ? existing.bodyStyle
          : readOptionalString(
              body.bodyStyle,
              80
            ),

      registration,
      vin,

      tyreSizeFront:
        body.tyreSizeFront ===
          undefined &&
        existing
          ? existing.tyreSizeFront
          : readOptionalString(
              body.tyreSizeFront,
              60
            ),

      tyreSizeRear:
        body.tyreSizeRear ===
          undefined &&
        existing
          ? existing.tyreSizeRear
          : readOptionalString(
              body.tyreSizeRear,
              60
            ),

      oilGrade:
        body.oilGrade ===
          undefined &&
        existing
          ? existing.oilGrade
          : readOptionalString(
              body.oilGrade,
              80
            ),

      batterySpecification:
        body.batterySpecification ===
          undefined &&
        existing
          ? existing.batterySpecification
          : readOptionalString(
              body.batterySpecification,
              160
            ),

      notes:
        body.notes ===
          undefined &&
        existing
          ? existing.notes
          : readOptionalString(
              body.notes,
              2_000
            ),

      metadata:
        body.metadata ===
          undefined &&
        existing
          ? readMetadata(
              existing.metadata
            )
          : readMetadata(
              body.metadata
            ),
    },
  };
}

async function getAuthenticatedAccount(): Promise<
  AuthenticatedAccount | null
> {
  const session =
    await auth.api.getSession({
      headers:
        await headers(),
    });

  if (!session?.user) {
    return null;
  }

  const accounts =
    await database
      .select({
        id:
          user.id,
      })
      .from(user)
      .where(
        eq(
          user.id,
          session.user.id
        )
      )
      .limit(1);

  return accounts[0] ?? null;
}

function mapVehicleResponse(
  vehicle: VehicleRow
) {
  return {
    id:
      vehicle.id,

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
      vehicle.fuelType,

    transmission:
      vehicle.transmission,

    variant:
      vehicle.variant,

    bodyStyle:
      vehicle.bodyStyle,

    registration:
      vehicle.registration,

    vin:
      vehicle.vin,

    isDefault:
      vehicle.isDefault,

    isActive:
      vehicle.isActive,

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

    metadata:
      vehicle.metadata,

    createdAt:
      vehicle.createdAt,

    updatedAt:
      vehicle.updatedAt,
  };
}

async function getUserVehicles(
  userId: string,
  includeInactive = false
) {
  const vehicles =
    await database
      .select()
      .from(
        userVehicleProfile
      )
      .where(
        includeInactive
          ? eq(
              userVehicleProfile.userId,
              userId
            )
          : and(
              eq(
                userVehicleProfile.userId,
                userId
              ),

              eq(
                userVehicleProfile.isActive,
                true
              )
            )
      )
      .orderBy(
        asc(
          userVehicleProfile.createdAt
        )
      );

  return vehicles.sort(
    (
      left,
      right
    ) =>
      Number(
        right.isDefault
      ) -
      Number(
        left.isDefault
      )
  );
}

async function clearOtherDefaultVehicles(
  userId: string,
  excludedVehicleId?: string
): Promise<void> {
  await database
    .update(
      userVehicleProfile
    )
    .set({
      isDefault: false,

      updatedAt:
        new Date(),
    })
    .where(
      excludedVehicleId
        ? and(
            eq(
              userVehicleProfile.userId,
              userId
            ),

            ne(
              userVehicleProfile.id,
              excludedVehicleId
            )
          )
        : eq(
            userVehicleProfile.userId,
            userId
          )
    );
}

async function ensureActiveDefaultVehicle(
  userId: string
): Promise<void> {
  const activeVehicles =
    await getUserVehicles(
      userId
    );

  if (
    activeVehicles.length ===
    0
  ) {
    return;
  }

  const currentDefault =
    activeVehicles.find(
      (vehicle) =>
        vehicle.isDefault
    );

  if (currentDefault) {
    return;
  }

  const nextVehicle =
    activeVehicles[0];

  await database
    .update(
      userVehicleProfile
    )
    .set({
      isDefault: true,

      updatedAt:
        new Date(),
    })
    .where(
      and(
        eq(
          userVehicleProfile.id,
          nextVehicle.id
        ),

        eq(
          userVehicleProfile.userId,
          userId
        )
      )
    );
}

function findDuplicateVehicle(
  vehicles: VehicleRow[],
  input: VehicleInput,
  excludedVehicleId?: string
) {
  return vehicles.find(
    (vehicle) => {
      if (
        vehicle.id ===
        excludedVehicleId
      ) {
        return false;
      }

      if (
        input.registration &&
        vehicle.registration ===
          input.registration
      ) {
        return true;
      }

      if (
        input.vin &&
        vehicle.vin ===
          input.vin
      ) {
        return true;
      }

      return (
        vehicle.make
          .trim()
          .toLowerCase() ===
          input.make
            .trim()
            .toLowerCase() &&
        vehicle.model
          .trim()
          .toLowerCase() ===
          input.model
            .trim()
            .toLowerCase() &&
        vehicle.year ===
          input.year &&
        vehicle.engine
          .trim()
          .toLowerCase() ===
          input.engine
            .trim()
            .toLowerCase()
      );
    }
  );
}

function filterVehicles(
  vehicles: VehicleRow[],
  query: string,
  defaultOnly: boolean
) {
  const normalisedQuery =
    query
      .trim()
      .toLowerCase();

  return vehicles.filter(
    (vehicle) => {
      if (
        defaultOnly &&
        !vehicle.isDefault
      ) {
        return false;
      }

      if (!normalisedQuery) {
        return true;
      }

      const searchableText =
        [
          vehicle.nickname,
          vehicle.make,
          vehicle.model,
          vehicle.generation,
          vehicle.engine,
          vehicle.engineCode,
          vehicle.variant,
          vehicle.bodyStyle,
          vehicle.registration,
          vehicle.vin,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

      return searchableText.includes(
        normalisedQuery
      );
    }
  );
}

async function lookupDvlaVehicle(
  registration: string
) {
  const apiKey =
    process.env
      .DVLA_VES_API_KEY;

  if (!apiKey) {
    return createErrorResponse(
      "dvla_not_configured",
      "DVLA vehicle lookup is not configured.",
      503
    );
  }

  const response =
    await fetch(
      DVLA_VES_ENDPOINT,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          "x-api-key":
            apiKey,

          "X-Correlation-Id":
            randomUUID(),
        },

        body:
          JSON.stringify({
            registrationNumber:
              registration,
          }),

        cache: "no-store",
      }
    );

  const payload =
    await readExternalJson<
      | DvlaVehicleResponse
      | DvlaErrorResponse
    >(response);

  if (
    !response.ok
  ) {
    const errorPayload =
      payload as DvlaErrorResponse | null;

    const externalError =
      errorPayload?.errors?.[0];

    if (
      response.status ===
      404
    ) {
      return createErrorResponse(
        "vehicle_lookup_not_found",
        "DVLA could not find a vehicle with that registration.",
        404
      );
    }

    return createErrorResponse(
      "dvla_lookup_failed",
      externalError?.detail ??
        externalError?.title ??
        "DVLA could not complete this registration lookup.",
      response.status >= 500
        ? 503
        : 400,
      undefined,
      {
        provider:
          "dvla",

        providerCode:
          externalError?.code ??
          null,
      }
    );
  }

  const vehicle =
    payload as DvlaVehicleResponse;

  const engine =
    vehicle.engineCapacity
      ? `${(
          vehicle.engineCapacity /
          1000
        ).toFixed(1)}L`
      : "";

  return createSuccessResponse({
    lookupType:
      "registration",

    provider:
      "dvla",

    vehicle: {
      registration:
        normaliseRegistration(
          vehicle.registrationNumber ??
            registration
        ),

      make:
        readString(
          vehicle.make,
          80
        ),

      model: "",

      year:
        vehicle.yearOfManufacture ??
        null,

      engine,

      fuelType:
        mapDvlaFuelType(
          vehicle.fuelType
        ),

      transmission:
        "unknown",

      bodyStyle: null,

      variant: null,

      metadata: {
        source:
          "dvla-ves",

        lookedUpAt:
          new Date().toISOString(),

        taxStatus:
          vehicle.taxStatus ??
          null,

        taxDueDate:
          vehicle.taxDueDate ??
          null,

        motStatus:
          vehicle.motStatus ??
          null,

        motExpiryDate:
          vehicle.motExpiryDate ??
          null,

        engineCapacity:
          vehicle.engineCapacity ??
          null,

        co2Emissions:
          vehicle.co2Emissions ??
          null,

        colour:
          vehicle.colour ??
          null,

        typeApproval:
          vehicle.typeApproval ??
          null,

        wheelplan:
          vehicle.wheelplan ??
          null,

        revenueWeight:
          vehicle.revenueWeight ??
          null,

        euroStatus:
          vehicle.euroStatus ??
          null,

        markedForExport:
          vehicle.markedForExport ??
          null,

        automatedVehicle:
          vehicle.automatedVehicle ??
          null,

        monthOfFirstRegistration:
          vehicle.monthOfFirstRegistration ??
          null,

        monthOfFirstDvlaRegistration:
          vehicle.monthOfFirstDvlaRegistration ??
          null,

        dateOfLastV5CIssued:
          vehicle.dateOfLastV5CIssued ??
          null,
      },
    },
  });
}

async function lookupVin(
  vin: string,
  modelYear?: number | null
) {
  const query =
    new URLSearchParams({
      format: "json",
    });

  if (modelYear) {
    query.set(
      "modelyear",
      String(modelYear)
    );
  }

  const response =
    await fetch(
      `${NHTSA_VIN_ENDPOINT}/${encodeURIComponent(vin)}?${query.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const payload =
    await readExternalJson<NhtsaVinResponse>(
      response
    );

  if (
    !response.ok ||
    !payload
  ) {
    return createErrorResponse(
      "vin_lookup_failed",
      "Beacon could not decode that VIN.",
      503
    );
  }

  const result =
    payload.Results?.[0];

  if (!result) {
    return createErrorResponse(
      "vin_lookup_not_found",
      "No vehicle information was returned for that VIN.",
      404
    );
  }

  const errorCode =
    result.ErrorCode
      ?.split(",")
      .map((value) =>
        value.trim()
      )
      .filter(Boolean) ??
    [];

  const hasUsefulData =
    Boolean(
      result.Make ||
        result.Model ||
        result.ModelYear
    );

  if (
    !hasUsefulData ||
    errorCode.includes("1")
  ) {
    return createErrorResponse(
      "vin_lookup_not_found",
      result.ErrorText ||
        "The VIN could not be decoded.",
      404
    );
  }

  const parsedYear =
    readVehicleYear(
      result.ModelYear
    );

  return createSuccessResponse({
    lookupType:
      "vin",

    provider:
      "nhtsa-vpic",

    vehicle: {
      vin,

      make:
        readString(
          result.Make,
          80
        ),

      model:
        readString(
          result.Model,
          120
        ),

      year:
        parsedYear,

      engine:
        buildEngineDescription({
          engineModel:
            result.EngineModel,

          displacementL:
            result.DisplacementL,

          engineCylinders:
            result.EngineCylinders,

          engineConfiguration:
            result.EngineConfiguration,
        }),

      engineCode:
        readOptionalString(
          result.EngineModel,
          80
        ),

      fuelType:
        mapNhtsaFuelType(
          result.FuelTypePrimary,
          result.FuelTypeSecondary
        ),

      transmission:
        mapNhtsaTransmission(
          result.TransmissionStyle
        ),

      variant:
        readOptionalString(
          result.Trim,
          120
        ),

      generation:
        readOptionalString(
          result.Series,
          80
        ),

      bodyStyle:
        readOptionalString(
          result.BodyClass,
          80
        ),

      metadata: {
        source:
          "nhtsa-vpic",

        lookedUpAt:
          new Date().toISOString(),

        manufacturer:
          result.Manufacturer ??
          null,

        vehicleType:
          result.VehicleType ??
          null,

        driveType:
          result.DriveType ??
          null,

        transmissionSpeeds:
          result.TransmissionSpeeds ??
          null,

        plantCountry:
          result.PlantCountry ??
          null,

        decoderMessage:
          payload.Message ??
          null,

        decoderError:
          result.ErrorText ??
          null,
      },
    },
  });
}

async function readExternalJson<T>(
  response: Response
): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const account =
      await getAuthenticatedAccount();

    if (!account) {
      return createErrorResponse(
        "authentication_required",
        "Please sign in to view your saved vehicles.",
        401
      );
    }

    const lookupType =
      request.nextUrl.searchParams
        .get("lookup")
        ?.trim()
        .toLowerCase();

    if (
      lookupType ===
      "registration"
    ) {
      const registration =
        normaliseRegistration(
          request.nextUrl.searchParams.get(
            "registration"
          )
        );

      if (!registration) {
        return createErrorResponse(
          "invalid_registration",
          "Enter a valid vehicle registration.",
          400,
          {
            registration:
              "A registration number is required.",
          }
        );
      }

      return lookupDvlaVehicle(
        registration
      );
    }

    if (
      lookupType === "vin"
    ) {
      const vin =
        normaliseVin(
          request.nextUrl.searchParams.get(
            "vin"
          )
        );

      if (
        !vin ||
        vin.length !== 17
      ) {
        return createErrorResponse(
          "invalid_vin",
          "Enter a complete 17-character VIN.",
          400,
          {
            vin:
              "A valid 17-character VIN is required.",
          }
        );
      }

      const modelYear =
        readVehicleYear(
          request.nextUrl.searchParams.get(
            "year"
          )
        );

      return lookupVin(
        vin,
        modelYear
      );
    }

    if (
      lookupType &&
      lookupType !==
        "registration" &&
      lookupType !== "vin"
    ) {
      return createErrorResponse(
        "unsupported_lookup",
        "The requested vehicle lookup type is not supported.",
        400
      );
    }

    const includeInactive =
      request.nextUrl.searchParams.get(
        "includeInactive"
      ) === "true";

    const defaultOnly =
      request.nextUrl.searchParams.get(
        "defaultOnly"
      ) === "true";

    const query =
      readString(
        request.nextUrl.searchParams.get(
          "q"
        ),
        200
      );

    const vehicles =
      await getUserVehicles(
        account.id,
        includeInactive
      );

    const filteredVehicles =
      filterVehicles(
        vehicles,
        query,
        defaultOnly
      );

    return createSuccessResponse({
      vehicles:
        filteredVehicles.map(
          mapVehicleResponse
        ),

      total:
        filteredVehicles.length,

      unfilteredTotal:
        vehicles.length,

      defaultVehicleId:
        vehicles.find(
          (vehicle) =>
            vehicle.isDefault &&
            vehicle.isActive
        )?.id ?? null,

      filters: {
        query:
          query || null,

        includeInactive,
        defaultOnly,
      },
    });
  } catch (error) {
    console.error(
      "Beacon could not load vehicle profiles:",
      error
    );

    return createErrorResponse(
      "vehicles_unavailable",
      "Beacon could not load your saved vehicles.",
      500
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const account =
      await getAuthenticatedAccount();

    if (!account) {
      return createErrorResponse(
        "authentication_required",
        "Please sign in before saving a vehicle.",
        401
      );
    }

    const body =
      await readRequestBody<CreateVehicleRequestBody>(
        request
      );

    if (!body) {
      return createErrorResponse(
        "invalid_request",
        "Beacon could not read this vehicle request.",
        400
      );
    }

    const {
      input,
      fieldErrors,
    } = buildInput(body);

    if (
      Object.keys(fieldErrors)
        .length > 0
    ) {
      return createErrorResponse(
        "invalid_vehicle_details",
        "Check the highlighted vehicle details.",
        400,
        fieldErrors
      );
    }

    const existingVehicles =
      await getUserVehicles(
        account.id,
        true
      );

    const activeVehicles =
      existingVehicles.filter(
        (vehicle) =>
          vehicle.isActive
      );

    if (
      activeVehicles.length >=
      MAXIMUM_VEHICLES
    ) {
      return createErrorResponse(
        "vehicle_limit_reached",
        `You can save up to ${MAXIMUM_VEHICLES} active vehicles.`,
        409
      );
    }

    const duplicate =
      findDuplicateVehicle(
        activeVehicles,
        input
      );

    if (duplicate) {
      return createErrorResponse(
        "duplicate_vehicle",
        "This vehicle is already saved in your garage.",
        409,
        {
          vehicle:
            "A matching active vehicle already exists.",
        },
        {
          existingVehicleId:
            duplicate.id,
        }
      );
    }

    const requestedDefault =
      readBoolean(
        body.isDefault,
        false
      );

    const shouldBeDefault =
      requestedDefault ||
      activeVehicles.length ===
        0 ||
      !activeVehicles.some(
        (vehicle) =>
          vehicle.isDefault
      );

    if (shouldBeDefault) {
      await clearOtherDefaultVehicles(
        account.id
      );
    }

    const now =
      new Date();

    const insertValues: VehicleInsert = {
      userId:
        account.id,

      ...input,

      isDefault:
        shouldBeDefault,

      isActive: true,

      createdAt: now,
      updatedAt: now,
    };

    const createdVehicles =
      await database
        .insert(
          userVehicleProfile
        )
        .values(
          insertValues
        )
        .returning();

    const createdVehicle =
      createdVehicles[0];

    if (!createdVehicle) {
      throw new Error(
        "The vehicle was not returned after creation."
      );
    }

    return createSuccessResponse(
      {
        vehicle:
          mapVehicleResponse(
            createdVehicle
          ),

        created: true,

        audit: {
          action:
            "vehicle.created",

          vehicleId:
            createdVehicle.id,

          occurredAt:
            now.toISOString(),
        },
      },
      201
    );
  } catch (error) {
    console.error(
      "Beacon could not create the vehicle profile:",
      error
    );

    return createErrorResponse(
      "vehicle_create_failed",
      "Beacon could not save this vehicle.",
      500
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const account =
      await getAuthenticatedAccount();

    if (!account) {
      return createErrorResponse(
        "authentication_required",
        "Please sign in before updating a vehicle.",
        401
      );
    }

    const body =
      await readRequestBody<UpdateVehicleRequestBody>(
        request
      );

    if (!body) {
      return createErrorResponse(
        "invalid_request",
        "Beacon could not read this vehicle update.",
        400
      );
    }

    const vehicleId =
      readString(
        body.id,
        100
      );

    if (!vehicleId) {
      return createErrorResponse(
        "missing_vehicle_id",
        "A vehicle ID is required.",
        400,
        {
          id:
            "A vehicle ID is required.",
        }
      );
    }

    const existingVehicles =
      await database
        .select()
        .from(
          userVehicleProfile
        )
        .where(
          and(
            eq(
              userVehicleProfile.id,
              vehicleId
            ),

            eq(
              userVehicleProfile.userId,
              account.id
            )
          )
        )
        .limit(1);

    const existingVehicle =
      existingVehicles[0];

    if (!existingVehicle) {
      return createErrorResponse(
        "vehicle_not_found",
        "That vehicle could not be found.",
        404
      );
    }

    if (
      body.expectedUpdatedAt !==
      undefined
    ) {
      const expectedUpdatedAt =
        readExpectedDate(
          body.expectedUpdatedAt
        );

      if (!expectedUpdatedAt) {
        return createErrorResponse(
          "invalid_update_version",
          "The supplied vehicle version is invalid.",
          400,
          {
            expectedUpdatedAt:
              "Enter a valid ISO date.",
          }
        );
      }

      if (
        !datesMatch(
          existingVehicle.updatedAt,
          expectedUpdatedAt
        )
      ) {
        return createErrorResponse(
          "vehicle_update_conflict",
          "This vehicle was changed elsewhere. Reload it before saving again.",
          409,
          undefined,
          {
            currentUpdatedAt:
              new Date(
                existingVehicle.updatedAt
              ).toISOString(),
          }
        );
      }
    }

    const {
      input,
      fieldErrors,
    } = buildInput(
      body,
      existingVehicle
    );

    if (
      Object.keys(fieldErrors)
        .length > 0
    ) {
      return createErrorResponse(
        "invalid_vehicle_details",
        "Check the highlighted vehicle details.",
        400,
        fieldErrors
      );
    }

    const allVehicles =
      await getUserVehicles(
        account.id,
        true
      );

    const duplicate =
      findDuplicateVehicle(
        allVehicles.filter(
          (vehicle) =>
            vehicle.isActive
        ),
        input,
        vehicleId
      );

    if (duplicate) {
      return createErrorResponse(
        "duplicate_vehicle",
        "Another saved vehicle already uses these details.",
        409,
        {
          vehicle:
            "A matching active vehicle already exists.",
        },
        {
          existingVehicleId:
            duplicate.id,
        }
      );
    }

    const requestedActive =
      body.isActive ===
      undefined
        ? existingVehicle.isActive
        : readBoolean(
            body.isActive,
            existingVehicle.isActive
          );

    const requestedDefault =
      body.isDefault ===
      undefined
        ? existingVehicle.isDefault
        : readBoolean(
            body.isDefault,
            existingVehicle.isDefault
          );

    if (
      requestedDefault &&
      !requestedActive
    ) {
      return createErrorResponse(
        "default_vehicle_must_be_active",
        "The default vehicle must remain active.",
        400,
        {
          isActive:
            "An inactive vehicle cannot be the default.",
        }
      );
    }

    if (requestedDefault) {
      await clearOtherDefaultVehicles(
        account.id,
        vehicleId
      );
    }

    const now =
      new Date();

    const updateValues: Partial<VehicleInsert> = {
      ...input,

      isDefault:
        requestedDefault,

      isActive:
        requestedActive,

      updatedAt: now,
    };

    const updatedVehicles =
      await database
        .update(
          userVehicleProfile
        )
        .set(
          updateValues
        )
        .where(
          and(
            eq(
              userVehicleProfile.id,
              vehicleId
            ),

            eq(
              userVehicleProfile.userId,
              account.id
            )
          )
        )
        .returning();

    const updatedVehicle =
      updatedVehicles[0];

    if (!updatedVehicle) {
      return createErrorResponse(
        "vehicle_update_failed",
        "Beacon could not update that vehicle.",
        500
      );
    }

    if (
      existingVehicle.isDefault &&
      (!updatedVehicle.isDefault ||
        !updatedVehicle.isActive)
    ) {
      await ensureActiveDefaultVehicle(
        account.id
      );
    }

    return createSuccessResponse({
      vehicle:
        mapVehicleResponse(
          updatedVehicle
        ),

      updated: true,

      audit: {
        action:
          "vehicle.updated",

        vehicleId:
          updatedVehicle.id,

        occurredAt:
          now.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Beacon could not update the vehicle profile:",
      error
    );

    return createErrorResponse(
      "vehicle_update_failed",
      "Beacon could not update this vehicle.",
      500
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const account =
      await getAuthenticatedAccount();

    if (!account) {
      return createErrorResponse(
        "authentication_required",
        "Please sign in before removing a vehicle.",
        401
      );
    }

    let body =
      await readRequestBody<DeleteVehicleRequestBody>(
        request
      );

    if (!body) {
      const requestUrl =
        new URL(
          request.url
        );

      body = {
        id:
          requestUrl.searchParams.get(
            "id"
          ),

        expectedUpdatedAt:
          requestUrl.searchParams.get(
            "expectedUpdatedAt"
          ),
      };
    }

    const vehicleId =
      readString(
        body.id,
        100
      );

    if (!vehicleId) {
      return createErrorResponse(
        "missing_vehicle_id",
        "A vehicle ID is required.",
        400,
        {
          id:
            "A vehicle ID is required.",
        }
      );
    }

    const existingVehicles =
      await database
        .select()
        .from(
          userVehicleProfile
        )
        .where(
          and(
            eq(
              userVehicleProfile.id,
              vehicleId
            ),

            eq(
              userVehicleProfile.userId,
              account.id
            )
          )
        )
        .limit(1);

    const existingVehicle =
      existingVehicles[0];

    if (!existingVehicle) {
      return createErrorResponse(
        "vehicle_not_found",
        "That vehicle could not be found.",
        404
      );
    }

    if (
      body.expectedUpdatedAt !==
      undefined &&
      body.expectedUpdatedAt !==
        null
    ) {
      const expectedUpdatedAt =
        readExpectedDate(
          body.expectedUpdatedAt
        );

      if (!expectedUpdatedAt) {
        return createErrorResponse(
          "invalid_update_version",
          "The supplied vehicle version is invalid.",
          400
        );
      }

      if (
        !datesMatch(
          existingVehicle.updatedAt,
          expectedUpdatedAt
        )
      ) {
        return createErrorResponse(
          "vehicle_delete_conflict",
          "This vehicle was changed elsewhere. Reload the garage before deleting it.",
          409,
          undefined,
          {
            currentUpdatedAt:
              new Date(
                existingVehicle.updatedAt
              ).toISOString(),
          }
        );
      }
    }

    await database
      .delete(
        userVehicleProfile
      )
      .where(
        and(
          eq(
            userVehicleProfile.id,
            vehicleId
          ),

          eq(
            userVehicleProfile.userId,
            account.id
          )
        )
      );

    if (
      existingVehicle.isDefault
    ) {
      await ensureActiveDefaultVehicle(
        account.id
      );
    }

    const occurredAt =
      new Date();

    return createSuccessResponse({
      deleted: true,

      vehicleId,

      audit: {
        action:
          "vehicle.deleted",

        vehicleId,

        occurredAt:
          occurredAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Beacon could not delete the vehicle profile:",
      error
    );

    return createErrorResponse(
      "vehicle_delete_failed",
      "Beacon could not remove this vehicle.",
      500
    );
  }
}