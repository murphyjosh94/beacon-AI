import "server-only";

export type BeaconPrimaryIntent =
  | "shopping"
  | "travel"
  | "automotive"
  | "local"
  | "entertainment"
  | "general";

export type BeaconCapability =
  | "product_search"
  | "vehicle_parts"
  | "vehicle_accessories"
  | "vehicle_search"
  | "hotel_discovery"
  | "hotel_availability"
  | "package_holiday"
  | "flights"
  | "flight_and_hotel"
  | "travel_ideas"
  | "restaurants"
  | "activities"
  | "local_services"
  | "places"
  | "weekend_plan"
  | "tickets"
  | "events"
  | "experiences"
  | "sports_travel"
  | "general_answer";

export type BeaconIntentScore = {
  intent: BeaconPrimaryIntent;
  score: number;
  matchedSignals: string[];
};

export type BeaconAssumption = {
  key: string;
  value: string;
  reason: string;
};

export type BeaconDetectedDetails = {
  destination?: string;
  departureLocation?: string;

  exactDatesProvided: boolean;
  monthProvided: boolean;
  durationProvided: boolean;

  budgetProvided: boolean;
  travellerDetailsProvided: boolean;

  vehicleDetailsProvided: boolean;
  productDetailsProvided: boolean;

  flightRequested: boolean;
  hotelRequested: boolean;
  packageRequested: boolean;

  localRequest: boolean;
  questionRequest: boolean;
};

export type BeaconIntentDecision = {
  query: string;

  primaryIntent: BeaconPrimaryIntent;
  secondaryIntent?: BeaconPrimaryIntent;

  capability: BeaconCapability;

  confidence: number;

  scores: BeaconIntentScore[];

  assumptions: BeaconAssumption[];

  shouldSearchImmediately: boolean;
  shouldAskFollowUp: boolean;

  followUpQuestion?: string;

  detected: BeaconDetectedDetails;
};

type IntentSignalDefinition = {
  intent: BeaconPrimaryIntent;
  weight: number;
  terms: string[];
};

type ScoredIntent = {
  score: number;
  matchedSignals: Set<string>;
};

const INTENT_ORDER: BeaconPrimaryIntent[] = [
  "automotive",
  "travel",
  "shopping",
  "local",
  "entertainment",
  "general",
];

const INTENT_SIGNALS: IntentSignalDefinition[] = [
  {
    intent: "shopping",
    weight: 22,
    terms: [
      "buy",
      "find me",
      "show me",
      "recommend",
      "best",
      "cheapest",
      "deal",
      "deals",
      "offer",
      "offers",
      "price",
      "prices",
      "product",
      "products",
      "shop",
      "shopping",
      "compare",
      "where can i get",
      "where can i buy",
    ],
  },
  {
    intent: "shopping",
    weight: 34,
    terms: [
      "television",
      "tv",
      "laptop",
      "computer",
      "desktop",
      "phone",
      "smartphone",
      "tablet",
      "vacuum",
      "headphones",
      "speaker",
      "camera",
      "watch",
      "smartwatch",
      "clothes",
      "dress",
      "suit",
      "shirt",
      "shoes",
      "trainers",
      "perfume",
      "aftershave",
      "furniture",
      "mattress",
      "appliance",
      "washing machine",
      "fridge",
      "freezer",
      "bulb",
      "light bulb",
      "charger",
      "charging cable",
      "garden furniture",
      "lawn mower",
      "tool",
      "tools",
    ],
  },

  {
    intent: "automotive",
    weight: 48,
    terms: [
      "car part",
      "car parts",
      "injector",
      "injectors",
      "fuel injector",
      "brake pads",
      "brake discs",
      "brake caliper",
      "alternator",
      "starter motor",
      "turbo",
      "turbocharger",
      "oil filter",
      "air filter",
      "fuel filter",
      "car battery",
      "suspension",
      "shock absorber",
      "wheel bearing",
      "clutch",
      "timing belt",
      "timing chain",
      "wiper blade",
      "engine oil",
      "spark plug",
      "glow plug",
      "exhaust",
      "dpf",
      "egr valve",
    ],
  },
  {
    intent: "automotive",
    weight: 38,
    terms: [
      "range rover",
      "land rover",
      "l322",
      "l320",
      "l405",
      "l494",
      "tdv8",
      "tdv6",
      "sdv6",
      "sdv8",
      "td6",
      "vehicle",
      "engine",
      "diesel",
      "petrol",
      "hybrid",
      "ev charger",
      "electric car charger",
      "type 2 charging cable",
    ],
  },
  {
    intent: "automotive",
    weight: 42,
    terms: [
      "car for sale",
      "cars for sale",
      "used car",
      "new car",
      "buy a car",
      "luxury car",
      "family car",
      "electric car",
      "electric vehicle",
      "suv",
      "saloon",
      "hatchback",
      "van for sale",
    ],
  },

  {
    intent: "travel",
    weight: 40,
    terms: [
      "holiday",
      "holidays",
      "getaway",
      "getaways",
      "staycation",
      "staycations",
      "city break",
      "weekend break",
      "short break",
      "trip",
      "travel",
      "vacation",
      "all inclusive",
      "package holiday",
      "package holidays",
      "resort",
      "villa",
      "cottage",
      "caravan",
      "lodge",
    ],
  },
  {
    intent: "travel",
    weight: 42,
    terms: [
      "hotel",
      "hotels",
      "accommodation",
      "aparthotel",
      "hostel",
      "bed and breakfast",
      "b&b",
      "room",
      "rooms",
      "place to stay",
      "places to stay",
      "where to stay",
      "stay near",
      "beachfront hotel",
      "spa hotel",
      "luxury hotel",
    ],
  },
  {
    intent: "travel",
    weight: 48,
    terms: [
      "flight",
      "flights",
      "fly from",
      "flying from",
      "airport",
      "airline",
      "return flight",
      "one way flight",
      "direct flight",
      "flight and hotel",
      "hotel and flight",
      "flights included",
      "including flights",
    ],
  },

  {
    intent: "local",
    weight: 38,
    terms: [
      "near me",
      "nearby",
      "in my area",
      "local",
      "closest",
      "around me",
      "within walking distance",
      "open now",
      "this weekend near",
    ],
  },
  {
    intent: "local",
    weight: 42,
    terms: [
      "restaurant",
      "restaurants",
      "cafe",
      "cafes",
      "coffee shop",
      "pub",
      "pubs",
      "bar",
      "bars",
      "takeaway",
      "food near",
      "eat in",
      "dinner in",
      "lunch in",
      "breakfast in",
    ],
  },
  {
    intent: "local",
    weight: 38,
    terms: [
      "things to do in",
      "what to do in",
      "weekend in",
      "day out in",
      "ideas in",
      "attractions in",
      "activities in",
      "places to visit in",
    ],
  },
  {
    intent: "local",
    weight: 36,
    terms: [
      "plumber",
      "electrician",
      "mechanic",
      "garage",
      "hairdresser",
      "barber",
      "cleaner",
      "builder",
      "dentist",
      "accountant",
      "local service",
      "local services",
    ],
  },

  {
    intent: "entertainment",
    weight: 42,
    terms: [
      "event",
      "events",
      "concert",
      "concerts",
      "gig",
      "gigs",
      "festival",
      "festivals",
      "theatre",
      "theater",
      "show",
      "shows",
      "west end",
      "cinema",
      "comedy",
      "night out",
      "nightlife",
    ],
  },
  {
    intent: "entertainment",
    weight: 46,
    terms: [
      "ticket",
      "tickets",
      "match ticket",
      "match tickets",
      "football tickets",
      "hospitality",
      "sports hospitality",
      "premier league",
      "champions league",
      "formula 1",
      "f1",
      "rugby",
      "boxing",
      "sports travel",
    ],
  },
  {
    intent: "entertainment",
    weight: 38,
    terms: [
      "experience",
      "experiences",
      "birthday experience",
      "gift experience",
      "family day out",
      "theme park",
      "water park",
      "festival",
      "attraction",
      "attractions",
      "museum",
      "escape room",
      "activity",
      "activities",
    ],
  },

  {
    intent: "general",
    weight: 28,
    terms: [
      "what is",
      "what are",
      "why is",
      "why does",
      "how does",
      "how do",
      "explain",
      "tell me about",
      "summarise",
      "summarize",
      "compare the difference",
      "definition",
      "meaning of",
      "help me understand",
    ],
  },
  {
    intent: "general",
    weight: 24,
    terms: [
      "write",
      "rewrite",
      "draft",
      "email",
      "letter",
      "essay",
      "message",
      "calculate",
      "translate",
      "proofread",
      "plan my day",
      "give me advice",
    ],
  },
];

const MONTH_TERMS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "jan",
  "feb",
  "mar",
  "apr",
  "jun",
  "jul",
  "aug",
  "sep",
  "sept",
  "oct",
  "nov",
  "dec",
];

const HOTEL_TERMS = [
  "hotel",
  "hotels",
  "campsite",
  "accommodation",
  "aparthotel",
  "hostel",
  "airb&b",
    "bed and breakfast",
  "room",
  "rooms",
  "place to stay",
  "places to stay",
  "where to stay",
  "resort",
  "villa",
  "cottage",
  "lodge",
];

const FLIGHT_TERMS = [
  "flight",
  "flights",
  "fly from",
  "flying from",
  "airline",
  "return flight",
  "one way flight",
  "direct flight",
  "flights included",
  "including flights",
];

const PACKAGE_TERMS = [
  "package holiday",
  "package holidays",
  "flight and hotel",
  "hotel and flight",
  "all inclusive",
  "flights included",
  "including flights",
  "package deal",
];

const VEHICLE_PART_TERMS = [
  "injector",
  "injectors",
  "brake",
  "alternator",
  "starter motor",
  "turbo",
  "filter",
  "battery",
  "suspension",
  "shock absorber",
  "wheel bearing",
  "clutch",
  "timing belt",
  "timing chain",
  "wiper",
  "spark plug",
  "glow plug",
  "exhaust",
  "dpf",
  "egr",
];

const VEHICLE_SEARCH_TERMS = [
  "car for sale",
  "cars for sale",
  "used car",
  "new car",
  "buy a car",
  "luxury car",
  "family car",
  "electric car",
  "electric vehicle",
  "suv",
  "hatchback",
  "saloon",
  "van for sale",
];

const VEHICLE_ACCESSORY_TERMS = [
  "ev charger",
  "charging cable",
  "car charger",
  "roof rack",
  "roof box",
  "car mat",
  "car mats",
  "seat cover",
  "dash cam",
  "phone holder",
  "car accessory",
  "car accessories",
];

const QUESTION_STARTERS = [
  "what",
  "why",
  "how",
  "when",
  "where",
  "who",
  "which",
  "can",
  "could",
  "should",
  "would",
  "is",
  "are",
  "do",
  "does",
  "explain",
  "tell",
];

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}£€$.'\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(value))
  );
}

function unique(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function containsPhrase(
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

function containsAny(
  text: string,
  terms: string[]
): boolean {
  return terms.some((term) =>
    containsPhrase(text, term)
  );
}

function countMatchingTerms(
  text: string,
  terms: string[]
): string[] {
  return terms.filter((term) =>
    containsPhrase(text, term)
  );
}

function createEmptyScores(): Record<
  BeaconPrimaryIntent,
  ScoredIntent
> {
  return {
    shopping: {
      score: 0,
      matchedSignals: new Set<string>(),
    },

    travel: {
      score: 0,
      matchedSignals: new Set<string>(),
    },

    automotive: {
      score: 0,
      matchedSignals: new Set<string>(),
    },

    local: {
      score: 0,
      matchedSignals: new Set<string>(),
    },

    entertainment: {
      score: 0,
      matchedSignals: new Set<string>(),
    },

    general: {
      score: 0,
      matchedSignals: new Set<string>(),
    },
  };
}

function scoreSignals(
  query: string
): Record<
  BeaconPrimaryIntent,
  ScoredIntent
> {
  const scores =
    createEmptyScores();

  for (const definition of INTENT_SIGNALS) {
    const matches =
      countMatchingTerms(
        query,
        definition.terms
      );

    if (matches.length === 0) {
      continue;
    }

    const initialWeight =
      definition.weight;

    const additionalWeight =
      Math.min(
        (matches.length - 1) * 7,
        21
      );

    scores[
      definition.intent
    ].score +=
      initialWeight +
      additionalWeight;

    for (const match of matches) {
      scores[
        definition.intent
      ].matchedSignals.add(match);
    }
  }

  return scores;
}

function applyContextualScores(
  query: string,
  scores: Record<
    BeaconPrimaryIntent,
    ScoredIntent
  >
): void {
  if (
    /\bunder\s*[£$€]\s*\d+/i.test(query) ||
    /\b[£$€]\s*\d+/i.test(query)
  ) {
    scores.shopping.score += 10;
    scores.shopping.matchedSignals.add(
      "explicit price"
    );
  }

  if (
    /\b(?:19|20)\d{2}\b/.test(query) &&
    containsAny(
      query,
      VEHICLE_PART_TERMS
    )
  ) {
    scores.automotive.score += 18;
    scores.automotive.matchedSignals.add(
      "vehicle year"
    );
  }

  if (
    /\b[a-z]\d{3}\b/i.test(query) ||
    /\b\d\.\d\s*(?:tdv8|tdv6|sdv6|sdv8|td6|litre|liter|l)\b/i.test(
      query
    )
  ) {
    scores.automotive.score += 25;
    scores.automotive.matchedSignals.add(
      "vehicle platform or engine"
    );
  }

  if (
    /\b\d+\s*(?:night|nights|day|days|week|weeks)\b/i.test(
      query
    )
  ) {
    scores.travel.score += 18;
    scores.travel.matchedSignals.add(
      "trip duration"
    );
  }

  if (
    containsAny(query, MONTH_TERMS)
  ) {
    scores.travel.score += 10;
    scores.travel.matchedSignals.add(
      "travel month"
    );
  }

  if (
    /\b(?:adult|adults|child|children|family|couple|couples)\b/i.test(
      query
    )
  ) {
    scores.travel.score += 9;
    scores.travel.matchedSignals.add(
      "traveller details"
    );
  }

  if (
    /\bweekend\s+(?:in|at|near)\b/i.test(
      query
    )
  ) {
    scores.local.score += 30;
    scores.travel.score += 20;

    scores.local.matchedSignals.add(
      "weekend location request"
    );

    scores.travel.matchedSignals.add(
      "weekend trip"
    );
  }

  if (
    /\b(?:tonight|today|tomorrow|this weekend)\b/i.test(
      query
    ) &&
    containsAny(query, [
      "event",
      "show",
      "concert",
      "gig",
      "things to do",
      "activity",
      "activities",
    ])
  ) {
    scores.entertainment.score += 20;
    scores.local.score += 12;

    scores.entertainment.matchedSignals.add(
      "time-sensitive entertainment"
    );
  }

  const firstWord =
    query.split(" ")[0] ?? "";

  if (
    QUESTION_STARTERS.includes(firstWord)
  ) {
    scores.general.score += 18;
    scores.general.matchedSignals.add(
      "question wording"
    );
  }

  if (query.endsWith("?")) {
    scores.general.score += 7;
    scores.general.matchedSignals.add(
      "question mark"
    );
  }
}

function convertScores(
  scores: Record<
    BeaconPrimaryIntent,
    ScoredIntent
  >
): BeaconIntentScore[] {
  return INTENT_ORDER.map(
    (intent) => ({
      intent,

      score:
        clampScore(
          scores[intent].score
        ),

      matchedSignals:
        Array.from(
          scores[intent]
            .matchedSignals
        ),
    })
  ).sort(
    (left, right) => {
      if (
        right.score !==
        left.score
      ) {
        return (
          right.score -
          left.score
        );
      }

      return (
        INTENT_ORDER.indexOf(
          left.intent
        ) -
        INTENT_ORDER.indexOf(
          right.intent
        )
      );
    }
  );
}

function detectExactDates(
  query: string
): boolean {
  const numericDate =
    /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/;

  const namedDate =
    new RegExp(
      String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTH_TERMS.join(
        "|"
      )})(?:\s+\d{4})?\b`,
      "i"
    );

  const dateRange =
    /\b(?:from\s+)?\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+(?:to|until|-)\s+\d{1,2}(?:st|nd|rd|th)?\s+\w+/i;

  return (
    numericDate.test(query) ||
    namedDate.test(query) ||
    dateRange.test(query)
  );
}

function detectMonth(
  query: string
): boolean {
  return containsAny(
    query,
    MONTH_TERMS
  );
}

function detectDuration(
  query: string
): boolean {
  return /\b\d+\s*(?:night|nights|day|days|week|weeks)\b/i.test(
    query
  );
}

function detectBudget(
  query: string
): boolean {
  return Boolean(
    /\b(?:under|below|up to|around|about|max|maximum|budget)\s*[£$€]?\s*\d+/i.test(
      query
    ) ||
      /[£$€]\s*\d+/i.test(
        query
      )
  );
}

function detectTravellers(
  query: string
): boolean {
  return /\b(?:adult|adults|child|children|infant|infants|family|families|couple|couples|solo|group|groups|people|person)\b/i.test(
    query
  );
}

function detectVehicleDetails(
  query: string
): boolean {
  return Boolean(
    /\b[a-z]\d{3}\b/i.test(
      query
    ) ||
      /\b\d\.\d\s*(?:tdv8|tdv6|sdv6|sdv8|td6|litre|liter|l)\b/i.test(
        query
      ) ||
      /\b(?:range rover|land rover|bmw|audi|mercedes|ford|vauxhall|volkswagen|toyota|nissan|honda|kia|hyundai|tesla)\b/i.test(
        query
      )
  );
}

function detectProductDetails(
  query: string
): boolean {
  return Boolean(
    detectBudget(query) ||
      /\b(?:small|medium|large|xl|xxl|\d+\s*(?:inch|inches|cm|mm))\b/i.test(
        query
      ) ||
      /\b(?:black|white|blue|navy|red|green|silver|grey|gray|gold|pink|brown)\b/i.test(
        query
      ) ||
      /\b(?:cordless|wired|wireless|smart|portable|luxury|premium|budget|quiet|lightweight)\b/i.test(
        query
      )
  );
}

function detectDestination(
  query: string
): string | undefined {
  const patterns = [
    /\b(?:hotel|hotels|holiday|holidays|weekend|break|stay|staycation|trip|things to do|what to do|restaurant|restaurants|events?)\s+(?:in|at|near)\s+([a-z][a-z\s'-]{2,50})/i,

    /\b(?:to|in)\s+([a-z][a-z\s'-]{2,50})(?:\s+(?:for|with|under|near|from|next|this|in)\b|$)/i,
  ];

  for (const pattern of patterns) {
    const match =
      query.match(pattern);

    const value =
      match?.[1]
        ?.replace(
          /\b(?:for|with|under|near|from|next|this|including)\b.*$/i,
          ""
        )
        .trim();

    if (
      value &&
      value.length >= 2
    ) {
      return value;
    }
  }

  return undefined;
}

function detectDepartureLocation(
  query: string
): string | undefined {
  const match =
    query.match(
      /\b(?:fly|flying|flight|flights|departing|departure)\s+from\s+([a-z][a-z\s'-]{2,50})/i
    );

  return match?.[1]
    ?.replace(
      /\b(?:to|for|with|on|in)\b.*$/i,
      ""
    )
    .trim();
}

function detectDetails(
  query: string
): BeaconDetectedDetails {
  return {
    destination:
      detectDestination(query),

    departureLocation:
      detectDepartureLocation(
        query
      ),

    exactDatesProvided:
      detectExactDates(query),

    monthProvided:
      detectMonth(query),

    durationProvided:
      detectDuration(query),

    budgetProvided:
      detectBudget(query),

    travellerDetailsProvided:
      detectTravellers(query),

    vehicleDetailsProvided:
      detectVehicleDetails(query),

    productDetailsProvided:
      detectProductDetails(query),

    flightRequested:
      containsAny(
        query,
        FLIGHT_TERMS
      ),

    hotelRequested:
      containsAny(
        query,
        HOTEL_TERMS
      ),

    packageRequested:
      containsAny(
        query,
        PACKAGE_TERMS
      ),

    localRequest:
      containsAny(query, [
        "near me",
        "nearby",
        "local",
        "in my area",
        "things to do in",
        "weekend in",
        "day out in",
      ]),

    questionRequest:
      QUESTION_STARTERS.includes(
        query.split(" ")[0] ?? ""
      ) || query.endsWith("?"),
  };
}

function determineCapability(
  primaryIntent: BeaconPrimaryIntent,
  query: string,
  detected: BeaconDetectedDetails
): BeaconCapability {
  if (
    primaryIntent ===
    "automotive"
  ) {
    if (
      containsAny(
        query,
        VEHICLE_PART_TERMS
      )
    ) {
      return "vehicle_parts";
    }

    if (
      containsAny(
        query,
        VEHICLE_SEARCH_TERMS
      )
    ) {
      return "vehicle_search";
    }

    if (
      containsAny(
        query,
        VEHICLE_ACCESSORY_TERMS
      )
    ) {
      return "vehicle_accessories";
    }

    return "product_search";
  }

  if (
    primaryIntent === "travel"
  ) {
    if (
      detected.packageRequested
    ) {
      return "package_holiday";
    }

    if (
      detected.flightRequested &&
      detected.hotelRequested
    ) {
      return "flight_and_hotel";
    }

    if (
      detected.flightRequested
    ) {
      return "flights";
    }

    if (
      detected.hotelRequested &&
      detected.exactDatesProvided
    ) {
      return "hotel_availability";
    }

    if (
      detected.hotelRequested ||
      detected.destination
    ) {
      return "hotel_discovery";
    }

    return "travel_ideas";
  }

  if (
    primaryIntent === "local"
  ) {
    if (
      containsAny(query, [
        "restaurant",
        "restaurants",
        "cafe",
        "pub",
        "bar",
        "takeaway",
        "food",
        "dinner",
        "lunch",
        "breakfast",
      ])
    ) {
      return "restaurants";
    }

    if (
      containsAny(query, [
        "weekend in",
        "weekend at",
        "weekend near",
      ])
    ) {
      return "weekend_plan";
    }

    if (
      containsAny(query, [
        "plumber",
        "electrician",
        "mechanic",
        "garage",
        "hairdresser",
        "barber",
        "cleaner",
        "builder",
        "dentist",
        "accountant",
      ])
    ) {
      return "local_services";
    }

    if (
      containsAny(query, [
        "things to do",
        "what to do",
        "activity",
        "activities",
        "day out",
        "attraction",
        "attractions",
      ])
    ) {
      return "activities";
    }

    return "places";
  }

  if (
    primaryIntent ===
    "entertainment"
  ) {
    if (
      containsAny(query, [
        "football",
        "premier league",
        "champions league",
        "formula 1",
        "f1",
        "rugby",
        "sports hospitality",
      ])
    ) {
      return "sports_travel";
    }

    if (
      containsAny(query, [
        "ticket",
        "tickets",
      ])
    ) {
      return "tickets";
    }

    if (
      containsAny(query, [
        "event",
        "events",
        "concert",
        "gig",
        "festival",
        "show",
        "theatre",
        "theater",
      ])
    ) {
      return "events";
    }

    return "experiences";
  }

  if (
    primaryIntent === "shopping"
  ) {
    return "product_search";
  }

  return "general_answer";
}

function createAssumptions(
  primaryIntent: BeaconPrimaryIntent,
  capability: BeaconCapability,
  detected: BeaconDetectedDetails
): BeaconAssumption[] {
  const assumptions: BeaconAssumption[] =
    [];

  if (
    primaryIntent === "shopping" ||
    primaryIntent ===
      "automotive"
  ) {
    if (
      !detected.budgetProvided
    ) {
      assumptions.push({
        key: "budget",
        value: "balanced value range",
        reason:
          "No budget was supplied, so Beacon will compare sensible value, mid-range and premium options.",
      });
    }

    if (
      !detected.productDetailsProvided
    ) {
      assumptions.push({
        key: "preferences",
        value: "broad suitable options",
        reason:
          "Beacon will search broadly and rank the strongest matches before asking for optional refinements.",
      });
    }
  }

  if (
    primaryIntent === "travel" ||
    primaryIntent === "local"
  ) {
    if (
      !detected.exactDatesProvided &&
      !detected.monthProvided
    ) {
      assumptions.push({
        key: "dates",
        value: "flexible",
        reason:
          "No dates were supplied, so Beacon will focus on discovery rather than date-specific availability.",
      });
    }

    if (
      !detected.budgetProvided
    ) {
      assumptions.push({
        key: "budget",
        value: "balanced range",
        reason:
          "Beacon will include a useful spread of value and higher-quality options.",
      });
    }

    if (
      !detected.travellerDetailsProvided
    ) {
      assumptions.push({
        key: "travellers",
        value: "general suitability",
        reason:
          "Beacon will return broadly suitable recommendations that can be refined later.",
      });
    }
  }

  if (
    capability === "flights" ||
    capability ===
      "flight_and_hotel" ||
    capability ===
      "package_holiday"
  ) {
    if (
      !detected.departureLocation
    ) {
      assumptions.push({
        key: "departure",
        value: "UK departure options",
        reason:
          "No departure airport was supplied, so Beacon will consider common UK departure options.",
      });
    }
  }

  if (
    capability === "weekend_plan"
  ) {
    assumptions.push({
      key: "planStyle",
      value: "balanced weekend",
      reason:
        "Beacon will include a mix of accommodation, food, daytime activities and evening entertainment.",
    });
  }

  return assumptions;
}

function calculateConfidence(
  primaryScore: number,
  secondaryScore: number,
  query: string,
  detected: BeaconDetectedDetails
): number {
  const scoreGap =
    Math.max(
      0,
      primaryScore -
        secondaryScore
    );

  let confidence =
    primaryScore * 0.72 +
    Math.min(scoreGap, 30) *
      0.65;

  if (
    query.split(" ").length >= 4
  ) {
    confidence += 6;
  }

  if (
    detected.destination ||
    detected.vehicleDetailsProvided ||
    detected.productDetailsProvided ||
    detected.flightRequested ||
    detected.hotelRequested
  ) {
    confidence += 8;
  }

  if (primaryScore === 0) {
    confidence = 45;
  }

  return clampScore(
    Math.max(
      35,
      confidence
    )
  );
}

function createFollowUpQuestion(
  capability: BeaconCapability,
  detected: BeaconDetectedDetails
): string | undefined {
  if (
    capability === "flights" &&
    !detected.destination
  ) {
    return "Where would you like to fly to?";
  }

  if (
    capability ===
      "flight_and_hotel" &&
    !detected.destination
  ) {
    return "Which destination would you like Beacon to search?";
  }

  if (
    capability ===
      "hotel_discovery" &&
    !detected.destination
  ) {
    return "Which destination or area would you like to stay in?";
  }

  if (
    capability ===
      "hotel_availability" &&
    !detected.destination
  ) {
    return "Which destination or area would you like to stay in?";
  }

  if (
    capability ===
      "vehicle_parts" &&
    !detected.vehicleDetailsProvided
  ) {
    return "Which vehicle model and engine is the part for?";
  }

  return undefined;
}

export function detectBeaconIntent(
  rawQuery: string
): BeaconIntentDecision {
  const query =
    normaliseText(rawQuery);

  if (!query) {
    return {
      query: "",

      primaryIntent:
        "general",

      capability:
        "general_answer",

      confidence: 0,

      scores:
        INTENT_ORDER.map(
          (intent) => ({
            intent,
            score: 0,
            matchedSignals: [],
          })
        ),

      assumptions: [],

      shouldSearchImmediately:
        false,

      shouldAskFollowUp:
        true,

      followUpQuestion:
        "What would you like Beacon to help you find or understand?",

      detected: {
        exactDatesProvided:
          false,

        monthProvided:
          false,

        durationProvided:
          false,

        budgetProvided:
          false,

        travellerDetailsProvided:
          false,

        vehicleDetailsProvided:
          false,

        productDetailsProvided:
          false,

        flightRequested:
          false,

        hotelRequested:
          false,

        packageRequested:
          false,

        localRequest:
          false,

        questionRequest:
          false,
      },
    };
  }

  const scored =
    scoreSignals(query);

  applyContextualScores(
    query,
    scored
  );

  const scores =
    convertScores(scored);

  const primary =
    scores[0];

  const secondary =
    scores[1];

  const primaryIntent =
    primary?.score
      ? primary.intent
      : "general";

  const secondaryIntent =
    secondary?.score &&
    secondary.score >= 30
      ? secondary.intent
      : undefined;

  const detected =
    detectDetails(query);

  const capability =
    determineCapability(
      primaryIntent,
      query,
      detected
    );

  const confidence =
    calculateConfidence(
      primary?.score ?? 0,
      secondary?.score ?? 0,
      query,
      detected
    );

  const followUpQuestion =
    createFollowUpQuestion(
      capability,
      detected
    );

  const genuinelyBlocked =
    Boolean(
      followUpQuestion &&
      confidence < 65
    );

  const assumptions =
    createAssumptions(
      primaryIntent,
      capability,
      detected
    );

  return {
    query,

    primaryIntent,

    secondaryIntent,

    capability,

    confidence,

    scores,

    assumptions,

    shouldSearchImmediately:
      !genuinelyBlocked,

    shouldAskFollowUp:
      genuinelyBlocked,

    followUpQuestion:
      genuinelyBlocked
        ? followUpQuestion
        : undefined,

    detected,
  };
}

export function isRecommendationIntent(
  decision: BeaconIntentDecision
): boolean {
  return (
    decision.primaryIntent !==
    "general"
  );
}

export function shouldUseGeneralAnswer(
  decision: BeaconIntentDecision
): boolean {
  return (
    decision.capability ===
    "general_answer"
  );
}