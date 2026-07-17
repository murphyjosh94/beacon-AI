import "server-only";

import {
  calculateRecommendationScore,
} from "@/lib/recommendations/RecommendationScore";

import {
  requestSerpApi,
} from "@/services/shopping/SerpApiClient";

import type {
  Recommendation,
  RecommendationPrice,
  SearchIntent,
} from "@/lib/recommendations/RecommendationTypes";

type FlightTripType =
  | "round_trip"
  | "one_way";

type FlightTravelClass =
  | "economy"
  | "premium_economy"
  | "business"
  | "first";

type FlightAirport = {
  name?: string;
  id?: string;
  time?: string;
};

type FlightSegment = {
  departure_airport?: FlightAirport;
  arrival_airport?: FlightAirport;

  duration?: number;

  airplane?: string;
  airline?: string;
  airline_logo?: string;

  travel_class?: string;
  flight_number?: string;
  legroom?: string;

  ticket_also_sold_by?: string[];

  extensions?: string[];

  overnight?: boolean;
};

type FlightLayover = {
  duration?: number;
  name?: string;
  id?: string;
  overnight?: boolean;
};

type FlightCarbonEmissions = {
  this_flight?: number;
  typical_for_this_route?: number;
  difference_percent?: number;
};

type GoogleFlightResult = {
  flights?: FlightSegment[];
  layovers?: FlightLayover[];

  total_duration?: number;

  carbon_emissions?:
    FlightCarbonEmissions;

  price?: number;
  type?: string;

  airline_logo?: string;

  extensions?: string[];

  departure_token?: string;
  booking_token?: string;
};

type GoogleFlightsSearchMetadata = {
  id?: string;
  status?: string;
  google_flights_url?: string;
};

type GoogleFlightsPriceInsights = {
  lowest_price?: number;
  price_level?: string;
  typical_price_range?: number[];
};

type GoogleFlightsResponse = {
  search_metadata?:
    GoogleFlightsSearchMetadata;

  best_flights?:
    GoogleFlightResult[];

  other_flights?:
    GoogleFlightResult[];

  price_insights?:
    GoogleFlightsPriceInsights;

  error?: string;
};

type FlightAutocompleteAirport = {
  name?: string;
  id?: string;
  city?: string;
  city_id?: string;
  distance?: string;
};

type FlightAutocompleteSuggestion = {
  position?: number;
  name?: string;
  type?: string;
  description?: string;
  id?: string;
  airports?:
    FlightAutocompleteAirport[];
};

type FlightAutocompleteResponse = {
  suggestions?:
    FlightAutocompleteSuggestion[];

  error?: string;
};

export type FlightSearchOptions = {
  limit?: number;

  departureLocation?: string;
  destination?: string;

  outboundDate?: string;
  returnDate?: string;

  tripType?: FlightTripType;
  travelClass?:
    FlightTravelClass;

  adults?: number;
  children?: number;

  maximumPrice?: number;

  maximumStops?: 0 | 1 | 2;
  preferredAirlines?: string[];
  excludedAirlines?: string[];
};

const DEFAULT_LIMIT = 20;
const MAXIMUM_RESULTS = 40;

const IATA_CODE_PATTERN =
  /^[A-Z0-9]{3}$/;

function clamp(
  value: number,
  minimum = 0,
  maximum = 100
): number {
  if (
    !Number.isFinite(value)
  ) {
    return minimum;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      value
    )
  );
}

function normaliseText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(
      /[^\p{L}\p{N}\s'-]/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function readPositiveInteger(
  value: number | undefined,
  fallback: number
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.floor(value)
  );
}

function isValidIsoDate(
  value: string | undefined
): value is string {
  if (!value) {
    return false;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`
    );

  return (
    !Number.isNaN(
      date.getTime()
    ) &&
    date
      .toISOString()
      .slice(0, 10) ===
      value
  );
}

function createStableId(
  suppliedValue: string | undefined,
  fallback: string
): string {
  const base =
    suppliedValue?.trim() ||
    fallback.trim();

  return normaliseText(base)
    .replace(/\s+/g, "-")
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(0, 100);
}

function createPrice(
  amount: number | undefined
): RecommendationPrice | undefined {
  if (
    amount === undefined ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return undefined;
  }

  return {
    amount,
    currency: "GBP",

    display:
      new Intl.NumberFormat(
        "en-GB",
        {
          style: "currency",
          currency: "GBP",
          maximumFractionDigits: 0,
        }
      ).format(amount),
  };
}

function uniqueStrings(
  values:
    Array<
      string | undefined
    >,
  limit: number
): string[] {
  const unique =
    new Set<string>();

  for (const value of values) {
    const cleaned =
      value?.trim();

    if (cleaned) {
      unique.add(cleaned);
    }

    if (
      unique.size >= limit
    ) {
      break;
    }
  }

  return Array.from(
    unique
  );
}

function removeDuplicates<T>(
  items: T[],
  getKey:
    (item: T) => string
): T[] {
  const seen =
    new Set<string>();

  const unique: T[] = [];

  for (const item of items) {
    const key =
      normaliseText(
        getKey(item)
      );

    if (
      !key ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}

function formatDuration(
  minutes: number | undefined
): string | undefined {
  if (
    minutes === undefined ||
    !Number.isFinite(minutes) ||
    minutes < 0
  ) {
    return undefined;
  }

  const totalMinutes =
    Math.round(minutes);

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const remainingMinutes =
    totalMinutes % 60;

  if (
    hours === 0
  ) {
    return `${remainingMinutes} min`;
  }

  if (
    remainingMinutes === 0
  ) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function formatFlightTime(
  value: string | undefined
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const match =
    value.trim().match(
      /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/
    );

  if (!match) {
    return value.trim();
  }

  const date =
    new Date(
      `${match[1]}T${match[2]}:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value.trim();
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}

function getTripType(
  options:
    FlightSearchOptions,
  returnDate: string | undefined
): FlightTripType {
  if (
    options.tripType
  ) {
    return options.tripType;
  }

  return returnDate
    ? "round_trip"
    : "one_way";
}

function getTravelClassCode(
  value:
    FlightTravelClass | undefined
): number {
  switch (value) {
    case "premium_economy":
      return 2;

    case "business":
      return 3;

    case "first":
      return 4;

    default:
      return 1;
  }
}

function getStopsCode(
  maximumStops:
    FlightSearchOptions["maximumStops"]
): number | undefined {
  if (
    maximumStops === undefined
  ) {
    return undefined;
  }

  if (
    maximumStops === 0
  ) {
    return 1;
  }

  if (
    maximumStops === 1
  ) {
    return 2;
  }

  return 3;
}

function getStopCount(
  result:
    GoogleFlightResult
): number {
  const segmentCount =
    result.flights?.length ??
    0;

  if (
    segmentCount === 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    segmentCount - 1
  );
}

function formatStops(
  result:
    GoogleFlightResult
): string {
  const stops =
    getStopCount(result);

  if (
    stops === 0
  ) {
    return "Direct";
  }

  if (
    stops === 1
  ) {
    return "1 stop";
  }

  return `${stops} stops`;
}

function getAirlineNames(
  result:
    GoogleFlightResult
): string[] {
  return uniqueStrings(
    result.flights?.map(
      (flight) =>
        flight.airline
    ) ?? [],
    5
  );
}

function getFlightNumbers(
  result:
    GoogleFlightResult
): string[] {
  return uniqueStrings(
    result.flights?.map(
      (flight) =>
        flight.flight_number
    ) ?? [],
    8
  );
}

function getFirstSegment(
  result:
    GoogleFlightResult
): FlightSegment | undefined {
  return result.flights?.[0];
}

function getLastSegment(
  result:
    GoogleFlightResult
): FlightSegment | undefined {
  const flights =
    result.flights ?? [];

  return flights[
    flights.length - 1
  ];
}

function getImageUrl(
  result:
    GoogleFlightResult
): string | undefined {
  return (
    result.airline_logo?.trim() ||
    result.flights
      ?.find(
        (flight) =>
          flight.airline_logo
            ?.trim()
      )
      ?.airline_logo
      ?.trim() ||
    undefined
  );
}

function buildFlightTitle(
  result:
    GoogleFlightResult
): string {
  const airlines =
    getAirlineNames(result);

  const firstSegment =
    getFirstSegment(result);

  const lastSegment =
    getLastSegment(result);

  const route = [
    firstSegment
      ?.departure_airport
      ?.id,
    lastSegment
      ?.arrival_airport
      ?.id,
  ]
    .filter(Boolean)
    .join(" → ");

  const airlineLabel =
    airlines.length > 0
      ? airlines.join(" + ")
      : "Flight option";

  return route
    ? `${airlineLabel}: ${route}`
    : airlineLabel;
}

function buildFlightDescription(
  result:
    GoogleFlightResult
): string {
  const firstSegment =
    getFirstSegment(result);

  const lastSegment =
    getLastSegment(result);

  const departureTime =
    formatFlightTime(
      firstSegment
        ?.departure_airport
        ?.time
    );

  const arrivalTime =
    formatFlightTime(
      lastSegment
        ?.arrival_airport
        ?.time
    );

  const duration =
    formatDuration(
      result.total_duration
    );

  const items =
    uniqueStrings(
      [
        departureTime &&
        arrivalTime
          ? `${departureTime} to ${arrivalTime}`
          : departureTime
            ? `Departs ${departureTime}`
            : undefined,

        duration
          ? `${duration} total journey`
          : undefined,

        formatStops(result),

        result.type,
      ],
      4
    );

  if (
    items.length === 0
  ) {
    return "This itinerary appears in the live Google Flights results.";
  }

  return `${items.join(
    ". "
  )}.`;
}

function calculatePriceValue(
  price: number | undefined,
  maximumBudget:
    number | undefined,
  lowestPrice:
    number | undefined
): number {
  if (
    price === undefined
  ) {
    return 45;
  }

  if (
    maximumBudget !== undefined &&
    maximumBudget > 0
  ) {
    if (
      price > maximumBudget
    ) {
      return 0;
    }

    const ratio =
      price /
      maximumBudget;

    if (
      ratio <= 0.6
    ) {
      return 96;
    }

    if (
      ratio <= 0.8
    ) {
      return 86;
    }

    return 72;
  }

  if (
    lowestPrice !== undefined &&
    lowestPrice > 0
  ) {
    const ratio =
      price /
      lowestPrice;

    if (
      ratio <= 1.05
    ) {
      return 94;
    }

    if (
      ratio <= 1.2
    ) {
      return 82;
    }

    if (
      ratio <= 1.5
    ) {
      return 68;
    }

    return 55;
  }

  return 68;
}

function calculateDurationQuality(
  duration:
    number | undefined,
  shortestDuration:
    number | undefined,
  stops: number
): number {
  let score = 68;

  if (
    duration !== undefined &&
    shortestDuration !==
      undefined &&
    shortestDuration > 0
  ) {
    const ratio =
      duration /
      shortestDuration;

    if (
      ratio <= 1.05
    ) {
      score += 20;
    } else if (
      ratio <= 1.2
    ) {
      score += 12;
    } else if (
      ratio <= 1.5
    ) {
      score += 5;
    } else {
      score -= 8;
    }
  }

  if (
    stops === 0
  ) {
    score += 12;
  } else if (
    stops === 1
  ) {
    score += 4;
  } else {
    score -=
      Math.min(
        20,
        stops * 5
      );
  }

  return clamp(score);
}

function calculateTrust(
  result:
    GoogleFlightResult
): number {
  let trust = 45;

  if (
    result.booking_token
  ) {
    trust += 18;
  }

  if (
    result.departure_token
  ) {
    trust += 10;
  }

  if (
    typeof result.price ===
    "number"
  ) {
    trust += 12;
  }

  if (
    result.flights?.length
  ) {
    trust += 10;
  }

  if (
    getFlightNumbers(result)
      .length > 0
  ) {
    trust += 5;
  }

  if (
    getImageUrl(result)
  ) {
    trust += 4;
  }

  return clamp(trust);
}

function createCarbonHighlight(
  result:
    GoogleFlightResult
): string | undefined {
  const difference =
    result
      .carbon_emissions
      ?.difference_percent;

  if (
    typeof difference !==
      "number" ||
    !Number.isFinite(
      difference
    )
  ) {
    return undefined;
  }

  if (
    difference === 0
  ) {
    return "Typical emissions for this route";
  }

  const absoluteDifference =
    Math.abs(
      Math.round(difference)
    );

  return difference < 0
    ? `${absoluteDifference}% lower emissions than typical`
    : `${absoluteDifference}% higher emissions than typical`;
}

function buildHighlights(
  result:
    GoogleFlightResult
): string[] {
  const firstSegment =
    getFirstSegment(result);

  const lastSegment =
    getLastSegment(result);

  const route = [
    firstSegment
      ?.departure_airport
      ?.id,
    lastSegment
      ?.arrival_airport
      ?.id,
  ]
    .filter(Boolean)
    .join(" to ");

  const duration =
    formatDuration(
      result.total_duration
    );

  return uniqueStrings(
    [
      route || undefined,
      formatStops(result),
      duration,
      createCarbonHighlight(
        result
      ),
      ...(
        result.extensions ??
        []
      ),
    ],
    4
  );
}

function buildWarnings(
  result:
    GoogleFlightResult
): string[] {
  const warnings: string[] =
    [];

  if (
    !result.booking_token
  ) {
    warnings.push(
      "A direct booking option has not yet been retrieved for this itinerary."
    );
  }

  if (
    result.flights?.some(
      (flight) =>
        flight.overnight
    ) ||
    result.layovers?.some(
      (layover) =>
        layover.overnight
    )
  ) {
    warnings.push(
      "This itinerary includes overnight travel or an overnight connection."
    );
  }

  if (
    getStopCount(result) > 1
  ) {
    warnings.push(
      "This itinerary includes multiple connections."
    );
  }

  return warnings.slice(
    0,
    2
  );
}

function mapFlightResult(
  result:
    GoogleFlightResult,
  intent:
    SearchIntent,
  index: number,
  options:
    FlightSearchOptions,
  googleFlightsUrl:
    string | undefined,
  lowestPrice:
    number | undefined,
  shortestDuration:
    number | undefined
): Recommendation | null {
  const firstSegment =
    getFirstSegment(result);

  const lastSegment =
    getLastSegment(result);

  if (
    !firstSegment ||
    !lastSegment
  ) {
    return null;
  }

  const title =
    buildFlightTitle(
      result
    );

  const stops =
    getStopCount(result);

  const relevance =
    options.maximumStops !==
      undefined &&
    stops >
      options.maximumStops
      ? 20
      : 88;

  const value =
    calculatePriceValue(
      result.price,
      options.maximumPrice ??
        intent.budgetMax,
      lowestPrice
    );

  const quality =
    calculateDurationQuality(
      result.total_duration,
      shortestDuration,
      stops
    );

  const trust =
    calculateTrust(result);

  const airlines =
    getAirlineNames(result);

  const flightNumbers =
    getFlightNumbers(result);

  const departureAirport =
    firstSegment
      .departure_airport;

  const arrivalAirport =
    lastSegment
      .arrival_airport;

  return {
    id:
      createStableId(
        result.booking_token ||
        result.departure_token,
        [
          title,
          flightNumbers.join("-"),
          result.price,
          index,
        ].join("-")
      ),

    category: "holiday",
    source: "travel",

    title,

    description:
      buildFlightDescription(
        result
      ),

    reason:
      "Selected from live Google Flights results after comparing price, journey duration, stops and itinerary quality.",

    url:
      googleFlightsUrl?.trim() ||
      "",

    imageUrl:
      getImageUrl(result),

    merchant:
      airlines.length > 0
        ? airlines.join(", ")
        : "Google Flights",

    price:
      createPrice(
        result.price
      ),

    score:
      calculateRecommendationScore({
        relevance,
        value,
        quality,
        trust,
      }),

    highlights:
      buildHighlights(
        result
      ),

    warnings:
      buildWarnings(
        result
      ),

    metadata: {
      provider: "serpapi",
      searchEngine:
        "google_flights",

      resultType:
        result.type ??
        null,

      departureAirport:
        departureAirport?.id ??
        null,

      departureAirportName:
        departureAirport?.name ??
        null,

      departureTime:
        departureAirport?.time ??
        null,

      arrivalAirport:
        arrivalAirport?.id ??
        null,

      arrivalAirportName:
        arrivalAirport?.name ??
        null,

      arrivalTime:
        arrivalAirport?.time ??
        null,

      totalDurationMinutes:
        result.total_duration ??
        null,

      stopCount:
        stops,

      airlines:
        airlines.join(", ") ||
        null,

      flightNumbers:
        flightNumbers.join(", ") ||
        null,

      bookingToken:
        result.booking_token ??
        null,

      departureToken:
        result.departure_token ??
        null,

      carbonDifferencePercent:
        result
          .carbon_emissions
          ?.difference_percent ??
        null,
    },
  };
}

function isIataCode(
  value: string
): boolean {
  return IATA_CODE_PATTERN.test(
    value
      .trim()
      .toUpperCase()
  );
}

function scoreSuggestion(
  suggestion:
    FlightAutocompleteSuggestion,
  query: string
): number {
  const normalisedQuery =
    normaliseText(query);

  const suggestionName =
    normaliseText(
      suggestion.name ??
      ""
    );

  let score = 0;

  if (
    suggestionName ===
    normalisedQuery
  ) {
    score += 100;
  } else if (
    suggestionName.startsWith(
      normalisedQuery
    )
  ) {
    score += 80;
  } else if (
    suggestionName.includes(
      normalisedQuery
    )
  ) {
    score += 60;
  }

  if (
    suggestion.type ===
    "city"
  ) {
    score += 20;
  }

  if (
    suggestion.airports
      ?.length
  ) {
    score += 15;
  }

  score -=
    suggestion.position ??
    0;

  return score;
}

async function resolveFlightLocationId(
  value: string,
  label: string
): Promise<string> {
  const cleaned =
    value.trim();

  if (!cleaned) {
    throw new Error(
      `Please include a ${label}.`
    );
  }

  const upper =
    cleaned.toUpperCase();

  if (
    isIataCode(upper)
  ) {
    return upper;
  }

  if (
    cleaned.startsWith("/m/") ||
    cleaned.startsWith("/g/")
  ) {
    return cleaned;
  }

  const response =
    await requestSerpApi<FlightAutocompleteResponse>(
      {
        engine:
          "google_flights_autocomplete",

        q:
          cleaned,

        gl: "uk",
        hl: "en",

        exclude_regions:
          true,
      }
    );

  const suggestion =
    [...(
      response.suggestions ??
      []
    )]
      .sort(
        (left, right) =>
          scoreSuggestion(
            right,
            cleaned
          ) -
          scoreSuggestion(
            left,
            cleaned
          )
      )[0];

  const locationId =
    suggestion?.id?.trim();

  if (locationId) {
    return locationId;
  }

  const airportId =
    suggestion
      ?.airports
      ?.[0]
      ?.id
      ?.trim();

  if (airportId) {
    return airportId;
  }

  throw new Error(
    `Beacon could not resolve the ${label} "${cleaned}" to a flight location. Try using a city or three-letter airport code.`
  );
}

function getDepartureLocation(
  intent:
    SearchIntent,
  options:
    FlightSearchOptions
): string | undefined {
  return (
    options
      .departureLocation
      ?.trim() ||
    intent.location?.trim() ||
    undefined
  );
}

function getDestination(
  intent:
    SearchIntent,
  options:
    FlightSearchOptions
): string | undefined {
  return (
    options.destination?.trim() ||
    intent.destination?.trim() ||
    undefined
  );
}

function validateDates(
  outboundDate:
    string | undefined,
  returnDate:
    string | undefined,
  tripType:
    FlightTripType
): void {
  if (
    !isValidIsoDate(
      outboundDate
    )
  ) {
    throw new Error(
      "Please include a valid outbound flight date in YYYY-MM-DD format."
    );
  }

  if (
    tripType ===
      "round_trip" &&
    !isValidIsoDate(
      returnDate
    )
  ) {
    throw new Error(
      "Please include a valid return flight date in YYYY-MM-DD format."
    );
  }

  if (
    tripType ===
      "round_trip" &&
    returnDate &&
    outboundDate &&
    returnDate <
      outboundDate
  ) {
    throw new Error(
      "The return date must be on or after the outbound date."
    );
  }
}

function buildAirlineFilter(
  airlines:
    string[] | undefined
): string | undefined {
  const cleaned =
    uniqueStrings(
      airlines ?? [],
      20
    )
      .map(
        (airline) =>
          airline
            .toUpperCase()
            .replace(
              /[^A-Z0-9_]/g,
              ""
            )
      )
      .filter(Boolean);

  return cleaned.length > 0
    ? cleaned.join(",")
    : undefined;
}

export async function searchFlights(
  intent: SearchIntent,
  options:
    FlightSearchOptions = {}
): Promise<Recommendation[]> {
  const departureLocation =
    getDepartureLocation(
      intent,
      options
    );

  const destination =
    getDestination(
      intent,
      options
    );

  if (!departureLocation) {
    throw new Error(
      "Please include a departure city or airport for your flight search."
    );
  }

  if (!destination) {
    throw new Error(
      "Please include a destination city or airport for your flight search."
    );
  }

  const outboundDate =
    options.outboundDate ??
    intent.startDate;

  const returnDate =
    options.returnDate ??
    intent.endDate;

  const tripType =
    getTripType(
      options,
      returnDate
    );

  validateDates(
    outboundDate,
    returnDate,
    tripType
  );

  const [
    departureId,
    arrivalId,
  ] =
    await Promise.all([
      resolveFlightLocationId(
        departureLocation,
        "departure location"
      ),

      resolveFlightLocationId(
        destination,
        "destination"
      ),
    ]);

  const adults =
    Math.max(
      1,
      readPositiveInteger(
        options.adults ??
        intent.travellers
          ?.adults,
        1
      )
    );

  const children =
    readPositiveInteger(
      options.children ??
      intent.travellers
        ?.children,
      0
    );

  const requestedLimit =
    clamp(
      Math.floor(
        options.limit ??
        DEFAULT_LIMIT
      ),
      1,
      MAXIMUM_RESULTS
    );

  const response =
    await requestSerpApi<GoogleFlightsResponse>(
      {
        engine:
          "google_flights",

        departure_id:
          departureId,

        arrival_id:
          arrivalId,

        outbound_date:
          outboundDate,

        return_date:
          tripType ===
            "round_trip"
            ? returnDate
            : undefined,

        type:
          tripType ===
            "round_trip"
            ? 1
            : 2,

        travel_class:
          getTravelClassCode(
            options.travelClass
          ),

        adults,
        children,

        stops:
          getStopsCode(
            options.maximumStops
          ),

        include_airlines:
          buildAirlineFilter(
            options.preferredAirlines
          ),

        exclude_airlines:
          buildAirlineFilter(
            options.excludedAirlines
          ),

        currency: "GBP",
        gl: "uk",
        hl: "en",

        show_hidden:
          true,
      }
    );

  const results =
    removeDuplicates(
      [
        ...(
          response.best_flights ??
          []
        ),

        ...(
          response.other_flights ??
          []
        ),
      ],
      (result) =>
        [
          result.booking_token,
          result.departure_token,
          getFlightNumbers(
            result
          ).join("-"),
          result.price,
          result.total_duration,
        ]
          .filter(
            (value) =>
              value !==
              undefined &&
              value !==
              ""
          )
          .join("|")
    );

  const maximumPrice =
    options.maximumPrice ??
    intent.budgetMax;

  const filteredResults =
    results
      .filter(
        (result) => {
          if (
            maximumPrice ===
              undefined ||
            result.price ===
              undefined
          ) {
            return true;
          }

          return (
            result.price <=
            maximumPrice
          );
        }
      )
      .filter(
        (result) => {
          if (
            options.maximumStops ===
            undefined
          ) {
            return true;
          }

          return (
            getStopCount(
              result
            ) <=
            options.maximumStops
          );
        }
      )
      .slice(
        0,
        requestedLimit
      );

  const prices =
    filteredResults
      .map(
        (result) =>
          result.price
      )
      .filter(
        (
          value
        ): value is number =>
          typeof value ===
            "number" &&
          Number.isFinite(value)
      );

  const durations =
    filteredResults
      .map(
        (result) =>
          result.total_duration
      )
      .filter(
        (
          value
        ): value is number =>
          typeof value ===
            "number" &&
          Number.isFinite(value)
      );

  const lowestPrice =
    response.price_insights
      ?.lowest_price ??
    (
      prices.length > 0
        ? Math.min(
            ...prices
          )
        : undefined
    );

  const shortestDuration =
    durations.length > 0
      ? Math.min(
          ...durations
        )
      : undefined;

  return filteredResults
    .map(
      (
        result,
        index
      ) =>
        mapFlightResult(
          result,
          intent,
          index,
          options,
          response
            .search_metadata
            ?.google_flights_url,
          lowestPrice,
          shortestDuration
        )
    )
    .filter(
      (
        recommendation
      ): recommendation is Recommendation =>
        recommendation !==
        null
    );
}