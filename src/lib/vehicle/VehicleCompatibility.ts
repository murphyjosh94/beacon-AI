export type VehiclePartIntent = {
  automotive: boolean;

  model?: string;
  year?: number;

  engine?: string;
  engineCapacity?: string;
  engineCode?: string;

  partType?: string;

  requiredTerms: string[];
};

export type VehicleCompatibilityStatus =
  | "compatible"
  | "incompatible"
  | "uncertain"
  | "not_automotive";

export type VehicleCompatibilityResult = {
  status: VehicleCompatibilityStatus;

  compatible: boolean;

  score: number;

  matchedTerms: string[];
  missingTerms: string[];
  conflictingTerms: string[];

  reason: string;
};

const AUTOMOTIVE_PART_TERMS = [
  "alternator",
  "battery",
  "brake disc",
  "brake discs",
  "brake pad",
  "brake pads",
  "clutch",
  "coil spring",
  "control arm",
  "diesel injector",
  "fuel injector",
  "fuel injectors",
  "glow plug",
  "glow plugs",
  "injector",
  "injectors",
  "oil filter",
  "air filter",
  "fuel filter",
  "pollen filter",
  "radiator",
  "shock absorber",
  "shock absorbers",
  "starter motor",
  "suspension",
  "thermostat",
  "timing belt",
  "timing chain",
  "turbo",
  "turbocharger",
  "water pump",
  "wheel bearing",
  "wiper blade",
  "wiper blades",
];

const PART_ALIASES: Record<string, string[]> = {
  injector: [
    "injector",
    "injectors",
    "fuel injector",
    "fuel injectors",
    "diesel injector",
    "diesel injectors",
  ],

  turbo: [
    "turbo",
    "turbocharger",
    "turbo charger",
  ],

  "brake pads": [
    "brake pad",
    "brake pads",
    "front pads",
    "rear pads",
  ],

  "brake discs": [
    "brake disc",
    "brake discs",
    "brake rotor",
    "brake rotors",
  ],

  battery: [
    "battery",
    "car battery",
    "starter battery",
  ],

  alternator: [
    "alternator",
  ],

  "starter motor": [
    "starter motor",
    "starter",
  ],

  "glow plugs": [
    "glow plug",
    "glow plugs",
  ],

  "oil filter": [
    "oil filter",
  ],

  "air filter": [
    "air filter",
  ],

  "fuel filter": [
    "fuel filter",
  ],

  "wiper blades": [
    "wiper blade",
    "wiper blades",
    "windscreen wiper",
    "windscreen wipers",
  ],

  suspension: [
    "suspension",
    "shock absorber",
    "shock absorbers",
    "coil spring",
    "coil springs",
    "control arm",
    "control arms",
  ],
};

const MODEL_ALIASES: Record<string, string[]> = {
  l322: [
    "l322",
    "range rover l322",
    "range rover vogue l322",
  ],

  l405: [
    "l405",
    "range rover l405",
  ],

  l319: [
    "l319",
    "discovery 3",
    "discovery 4",
  ],

  l494: [
    "l494",
    "range rover sport l494",
  ],

  l320: [
    "l320",
    "range rover sport l320",
  ],
};

const ENGINE_FAMILIES: Record<string, string[]> = {
  "3.6 tdv8": [
    "3.6 tdv8",
    "3.6tdv8",
    "3.6 td v8",
    "3.6 diesel v8",
  ],

  "4.4 tdv8": [
    "4.4 tdv8",
    "4.4tdv8",
    "4.4 td v8",
    "4.4 diesel v8",
  ],

  "3.0 td6": [
    "3.0 td6",
    "3.0td6",
    "td6",
  ],

  "3.0 sdv6": [
    "3.0 sdv6",
    "3.0sdv6",
    "sdv6",
  ],

  "2.7 tdv6": [
    "2.7 tdv6",
    "2.7tdv6",
    "tdv6",
  ],

  "3.0 tdv6": [
    "3.0 tdv6",
    "3.0tdv6",
  ],

  "4.2 v8": [
    "4.2 v8",
    "4.2v8",
  ],

  "4.4 v8": [
    "4.4 v8",
    "4.4v8",
  ],

  "5.0 v8": [
    "5.0 v8",
    "5.0v8",
  ],
};

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/(\d)\.(\d)/g, "$1.$2")
    .replace(/[^\p{L}\p{N}.\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map(normaliseText)
        .filter(Boolean)
    )
  );
}

function includesPhrase(
  text: string,
  phrase: string
): boolean {
  const normalisedPhrase =
    normaliseText(phrase);

  return Boolean(
    normalisedPhrase &&
      text.includes(normalisedPhrase)
  );
}

function findPartType(
  query: string
): string | undefined {
  const normalised =
    normaliseText(query);

  for (const [
    canonicalPart,
    aliases,
  ] of Object.entries(PART_ALIASES)) {
    if (
      aliases.some((alias) =>
        includesPhrase(
          normalised,
          alias
        )
      )
    ) {
      return canonicalPart;
    }
  }

  const genericPart =
    AUTOMOTIVE_PART_TERMS.find(
      (term) =>
        includesPhrase(
          normalised,
          term
        )
    );

  return genericPart;
}

function findModel(
  query: string
): string | undefined {
  const normalised =
    normaliseText(query);

  for (const [
    canonicalModel,
    aliases,
  ] of Object.entries(MODEL_ALIASES)) {
    if (
      aliases.some((alias) =>
        includesPhrase(
          normalised,
          alias
        )
      )
    ) {
      return canonicalModel;
    }
  }

  const platformMatch =
    normalised.match(
      /\b(?:l|e|f|x|w)\d{3}\b/i
    );

  return platformMatch?.[0]
    ?.toLowerCase();
}

function findYear(
  query: string
): number | undefined {
  const matches = Array.from(
    query.matchAll(
      /\b(19\d{2}|20\d{2})\b/g
    )
  );

  if (matches.length === 0) {
    return undefined;
  }

  const year = Number(
    matches[0][1]
  );

  return Number.isInteger(year)
    ? year
    : undefined;
}

function findEngine(
  query: string
): string | undefined {
  const normalised =
    normaliseText(query);

  for (const [
    canonicalEngine,
    aliases,
  ] of Object.entries(
    ENGINE_FAMILIES
  )) {
    if (
      aliases.some((alias) =>
        includesPhrase(
          normalised,
          alias
        )
      )
    ) {
      return canonicalEngine;
    }
  }

  return undefined;
}

function findEngineCapacity(
  query: string
): string | undefined {
  const match =
    normaliseText(query).match(
      /\b(\d\.\d)\s*(?:l|litre|liter)?\b/
    );

  return match?.[1];
}

function findEngineCode(
  query: string
): string | undefined {
  const normalised =
    normaliseText(query);

  const knownCodeMatch =
    normalised.match(
      /\b(?:tdv8|tdv6|sdv6|sdv8|td6|td5|d4d|tddi|tdci|hdi|cdi|tsi|tfsi)\b/i
    );

  return knownCodeMatch?.[0]
    ?.toLowerCase();
}

function looksAutomotive(
  query: string
): boolean {
  const normalised =
    normaliseText(query);

  return Boolean(
    findPartType(normalised) ||
      findModel(normalised) ||
      findEngine(normalised) ||
      /\bcar parts?\b/.test(
        normalised
      )
  );
}

function getAliases(
  dictionary: Record<
    string,
    string[]
  >,
  canonicalValue: string
): string[] {
  return unique([
    canonicalValue,
    ...(dictionary[
      canonicalValue
    ] ?? []),
  ]);
}

function containsAny(
  text: string,
  values: string[]
): boolean {
  return values.some((value) =>
    includesPhrase(text, value)
  );
}

function findConflictingModel(
  productText: string,
  requiredModel: string
): string | undefined {
  for (const [
    candidateModel,
    aliases,
  ] of Object.entries(
    MODEL_ALIASES
  )) {
    if (
      candidateModel ===
      requiredModel
    ) {
      continue;
    }

    if (
      containsAny(
        productText,
        aliases
      )
    ) {
      return candidateModel;
    }
  }

  return undefined;
}

function findConflictingEngine(
  productText: string,
  requiredEngine: string
): string | undefined {
  for (const [
    candidateEngine,
    aliases,
  ] of Object.entries(
    ENGINE_FAMILIES
  )) {
    if (
      candidateEngine ===
      requiredEngine
    ) {
      continue;
    }

    if (
      containsAny(
        productText,
        aliases
      )
    ) {
      return candidateEngine;
    }
  }

  return undefined;
}

function findConflictingCapacity(
  productText: string,
  requiredCapacity: string
): string | undefined {
  const capacities = Array.from(
    productText.matchAll(
      /\b(\d\.\d)\s*(?:l|litre|liter)?\b/g
    )
  ).map((match) => match[1]);

  return capacities.find(
    (capacity) =>
      capacity !== requiredCapacity
  );
}

function yearConflicts(
  productText: string,
  requiredYear: number
): boolean {
  const productYears =
    Array.from(
      productText.matchAll(
        /\b(19\d{2}|20\d{2})\b/g
      )
    ).map((match) =>
      Number(match[1])
    );

  if (productYears.length === 0) {
    return false;
  }

  if (
    productYears.includes(
      requiredYear
    )
  ) {
    return false;
  }

  const rangeMatch =
    productText.match(
      /\b(19\d{2}|20\d{2})\s*(?:-|to)\s*(19\d{2}|20\d{2})\b/
    );

  if (rangeMatch) {
    const start =
      Number(rangeMatch[1]);

    const end =
      Number(rangeMatch[2]);

    return !(
      requiredYear >= start &&
      requiredYear <= end
    );
  }

  return true;
}

export function parseVehiclePartIntent(
  query: string
): VehiclePartIntent {
  const partType =
    findPartType(query);

  const model =
    findModel(query);

  const year =
    findYear(query);

  const engine =
    findEngine(query);

  const engineCapacity =
    findEngineCapacity(query);

  const engineCode =
    findEngineCode(query);

  const requiredTerms = unique([
    ...(partType
      ? getAliases(
          PART_ALIASES,
          partType
        )
      : []),

    ...(model
      ? getAliases(
          MODEL_ALIASES,
          model
        )
      : []),

    ...(engine
      ? getAliases(
          ENGINE_FAMILIES,
          engine
        )
      : []),

    engineCapacity ?? "",
    engineCode ?? "",
    year ? String(year) : "",
  ]);

  return {
    automotive:
      looksAutomotive(query),

    model,
    year,

    engine,
    engineCapacity,
    engineCode,

    partType,

    requiredTerms,
  };
}

export function checkVehicleCompatibility(
  productText: string,
  intent: VehiclePartIntent
): VehicleCompatibilityResult {
  if (!intent.automotive) {
    return {
      status:
        "not_automotive",

      compatible: true,
      score: 100,

      matchedTerms: [],
      missingTerms: [],
      conflictingTerms: [],

      reason:
        "This is not an automotive compatibility search.",
    };
  }

  const searchableText =
    normaliseText(productText);

  const matchedTerms: string[] =
    [];

  const missingTerms: string[] =
    [];

  const conflictingTerms: string[] =
    [];

  if (intent.partType) {
    const aliases =
      getAliases(
        PART_ALIASES,
        intent.partType
      );

    if (
      containsAny(
        searchableText,
        aliases
      )
    ) {
      matchedTerms.push(
        intent.partType
      );
    } else {
      missingTerms.push(
        intent.partType
      );
    }
  }

  if (intent.model) {
    const aliases =
      getAliases(
        MODEL_ALIASES,
        intent.model
      );

    if (
      containsAny(
        searchableText,
        aliases
      )
    ) {
      matchedTerms.push(
        intent.model
      );
    } else {
      missingTerms.push(
        intent.model
      );
    }

    const conflict =
      findConflictingModel(
        searchableText,
        intent.model
      );

    if (conflict) {
      conflictingTerms.push(
        `model:${conflict}`
      );
    }
  }

  if (intent.engine) {
    const aliases =
      getAliases(
        ENGINE_FAMILIES,
        intent.engine
      );

    if (
      containsAny(
        searchableText,
        aliases
      )
    ) {
      matchedTerms.push(
        intent.engine
      );
    } else {
      missingTerms.push(
        intent.engine
      );
    }

    const conflict =
      findConflictingEngine(
        searchableText,
        intent.engine
      );

    if (conflict) {
      conflictingTerms.push(
        `engine:${conflict}`
      );
    }
  } else {
    if (
      intent.engineCapacity &&
      searchableText.includes(
        intent.engineCapacity
      )
    ) {
      matchedTerms.push(
        intent.engineCapacity
      );
    }

    if (
      intent.engineCode &&
      searchableText.includes(
        intent.engineCode
      )
    ) {
      matchedTerms.push(
        intent.engineCode
      );
    }
  }

  if (intent.engineCapacity) {
    const conflictingCapacity =
      findConflictingCapacity(
        searchableText,
        intent.engineCapacity
      );

    if (
      conflictingCapacity
    ) {
      conflictingTerms.push(
        `capacity:${conflictingCapacity}`
      );
    }
  }

  if (
    intent.year &&
    yearConflicts(
      searchableText,
      intent.year
    )
  ) {
    conflictingTerms.push(
      `year:${intent.year}`
    );
  } else if (
    intent.year &&
    searchableText.includes(
      String(intent.year)
    )
  ) {
    matchedTerms.push(
      String(intent.year)
    );
  }

  const hardRequiredTerms = [
    intent.partType,
    intent.model,
    intent.engine,
  ].filter(
    (
      value
    ): value is string =>
      Boolean(value)
  );

  const hardMissing =
    hardRequiredTerms.filter(
      (value) =>
        missingTerms.includes(
          value
        )
    );

  if (
    conflictingTerms.length > 0
  ) {
    return {
      status:
        "incompatible",

      compatible: false,
      score: 0,

      matchedTerms:
        unique(matchedTerms),

      missingTerms:
        unique(missingTerms),

      conflictingTerms:
        unique(
          conflictingTerms
        ),

      reason:
        "The product contains vehicle or engine details that conflict with the requested fitment.",
    };
  }

  if (
    hardMissing.length > 0
  ) {
    return {
      status:
        "incompatible",

      compatible: false,
      score: 0,

      matchedTerms:
        unique(matchedTerms),

      missingTerms:
        unique(missingTerms),

      conflictingTerms: [],

      reason:
        "The product does not confirm the required model, engine or part type.",
    };
  }

  const expectedMatchCount =
    hardRequiredTerms.length;

  const confirmedMatches =
    hardRequiredTerms.filter(
      (value) =>
        matchedTerms.includes(
          value
        )
    ).length;

  const matchRatio =
    expectedMatchCount > 0
      ? confirmedMatches /
        expectedMatchCount
      : 1;

  const score =
    Math.round(
      60 + matchRatio * 40
    );

  return {
    status:
      matchRatio === 1
        ? "compatible"
        : "uncertain",

    compatible:
      matchRatio === 1,

    score,

    matchedTerms:
      unique(matchedTerms),

    missingTerms:
      unique(missingTerms),

    conflictingTerms: [],

    reason:
      matchRatio === 1
        ? "The product confirms the requested part type, vehicle model and engine details."
        : "The product may be relevant, but it does not confirm every requested fitment detail.",
  };
}

export function filterCompatibleVehicleProducts<
  T
>(
  results: T[],
  query: string,
  getSearchableText: (
    result: T
  ) => string
): T[] {
  const vehicleIntent =
    parseVehiclePartIntent(
      query
    );

  if (
    !vehicleIntent.automotive
  ) {
    return results;
  }

  return results.filter(
    (result) => {
      const compatibility =
        checkVehicleCompatibility(
          getSearchableText(
            result
          ),
          vehicleIntent
        );

      return (
        compatibility.status ===
        "compatible"
      );
    }
  );
}