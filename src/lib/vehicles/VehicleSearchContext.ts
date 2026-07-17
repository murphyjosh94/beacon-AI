export type VehicleSearchDetails = {
  make: string;
  model: string;
  year: number;
  engine: string;
};

export type VehicleSearchAssessment = {
  isVehiclePartsSearch: boolean;
  hasVehicleContext: boolean;
  shouldRequestVehicle: boolean;
  detectedPartTerms: string[];
  detectedVehicleTerms: string[];
};

const VEHICLE_PART_TERMS = [
  "air filter",
  "alternator",
  "battery",
  "brake caliper",
  "brake disc",
  "brake discs",
  "brake pad",
  "brake pads",
  "cabin filter",
  "clutch",
  "coil pack",
  "dpf",
  "egr",
  "egr valve",
  "engine oil",
  "exhaust",
  "fuel filter",
  "fuel injector",
  "fuel injectors",
  "glow plug",
  "glow plugs",
  "injector",
  "injectors",
  "oil filter",
  "part",
  "parts",
  "shock absorber",
  "spark plug",
  "spark plugs",
  "starter motor",
  "suspension",
  "timing belt",
  "timing chain",
  "turbo",
  "turbocharger",
  "water pump",
  "wheel bearing",
  "wiper blade",
  "wiper blades",
];

const VEHICLE_MAKE_TERMS = [
  "alfa romeo",
  "audi",
  "bmw",
  "citroen",
  "dacia",
  "fiat",
  "ford",
  "honda",
  "hyundai",
  "jaguar",
  "jeep",
  "kia",
  "land rover",
  "lexus",
  "mazda",
  "mercedes",
  "mercedes-benz",
  "mini",
  "mitsubishi",
  "nissan",
  "peugeot",
  "porsche",
  "range rover",
  "renault",
  "seat",
  "skoda",
  "subaru",
  "suzuki",
  "tesla",
  "toyota",
  "vauxhall",
  "volkswagen",
  "volvo",
];

const PLATFORM_AND_ENGINE_PATTERNS = [
  /\bl\d{3}\b/i,
  /\bg\d{2}\b/i,
  /\bf\d{2}\b/i,
  /\be\d{2}\b/i,
  /\bw\d{3}\b/i,
  /\bmk\s?\d+\b/i,

  /\b\d\.\d\s*(?:tdv8|tdv6|sdv6|sdv8|td6|tdi|tsi|hdi|dci|cdti|ecoboost|litre|liter|l)\b/i,

  /\b(?:tdv8|tdv6|sdv6|sdv8|td6|tdi|tsi|hdi|dci|cdti|ecoboost)\b/i,
];

function normaliseText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(
      /[^\p{L}\p{N}.'\s-]/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function unique(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values.filter(Boolean)
    )
  );
}

function findTerms(
  query: string,
  terms: string[]
): string[] {
  return terms.filter(
    (term) =>
      query.includes(term)
  );
}

function containsVehicleYear(
  query: string
): boolean {
  const years =
    query.match(
      /\b(?:18|19|20)\d{2}\b/g
    );

  if (!years) {
    return false;
  }

  const currentYear =
    new Date().getFullYear();

  return years.some(
    (value) => {
      const year =
        Number(value);

      return (
        year >= 1886 &&
        year <= currentYear + 2
      );
    }
  );
}

function containsPlatformOrEngine(
  query: string
): boolean {
  return PLATFORM_AND_ENGINE_PATTERNS.some(
    (pattern) =>
      pattern.test(query)
  );
}

function containsLikelyModel(
  query: string,
  vehicleMakeMatches: string[]
): boolean {
  if (
    vehicleMakeMatches.length === 0
  ) {
    return false;
  }

  /*
   * A make plus another meaningful vehicle token is
   * normally sufficient to avoid interrupting the user.
   *
   * Examples:
   * Range Rover L322
   * BMW 320d
   * Ford Focus
   */
  const words =
    query
      .split(" ")
      .filter(
        (word) =>
          word.length >= 2
      );

  return words.length >= 3;
}

export function assessVehicleSearch(
  rawQuery: string
): VehicleSearchAssessment {
  const query =
    normaliseText(
      rawQuery
    );

  const detectedPartTerms =
    unique(
      findTerms(
        query,
        VEHICLE_PART_TERMS
      )
    );

  const detectedVehicleTerms =
    unique([
      ...findTerms(
        query,
        VEHICLE_MAKE_TERMS
      ),

      ...(containsVehicleYear(
        query
      )
        ? ["vehicle year"]
        : []),

      ...(containsPlatformOrEngine(
        query
      )
        ? [
            "platform or engine",
          ]
        : []),
    ]);

  const isVehiclePartsSearch =
    detectedPartTerms.length > 0;

  const makeMatches =
    findTerms(
      query,
      VEHICLE_MAKE_TERMS
    );

  const hasVehicleContext =
    Boolean(
      makeMatches.length > 0 &&
      (
        containsPlatformOrEngine(
          query
        ) ||
        containsVehicleYear(
          query
        ) ||
        containsLikelyModel(
          query,
          makeMatches
        )
      )
    );

  return {
    isVehiclePartsSearch,

    hasVehicleContext,

    shouldRequestVehicle:
      isVehiclePartsSearch &&
      !hasVehicleContext,

    detectedPartTerms,

    detectedVehicleTerms,
  };
}

export function appendVehicleContext(
  rawQuery: string,
  vehicle: VehicleSearchDetails
): string {
  const query =
    rawQuery
      .replace(/\s+/g, " ")
      .trim();

  const vehicleDescription = [
    vehicle.year,
    vehicle.make,
    vehicle.model,
    vehicle.engine,
  ]
    .map(String)
    .map(
      (value) =>
        value.trim()
    )
    .filter(Boolean)
    .join(" ");

  return [
    query,
    `Vehicle: ${vehicleDescription}.`,
    "Only return parts compatible with this exact model, year and engine.",
    "Reject listings for conflicting engines, generations or vehicles.",
    "Retailer compatibility must still be confirmed before purchase.",
  ].join(" ");
}

export function createVehicleLabel(
  vehicle: VehicleSearchDetails
): string {
  return [
    vehicle.year,
    vehicle.make,
    vehicle.model,
    vehicle.engine,
  ]
    .map(String)
    .map(
      (value) =>
        value.trim()
    )
    .filter(Boolean)
    .join(" ");
}