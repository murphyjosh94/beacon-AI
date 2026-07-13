import type { SearchIntent } from "@/lib/recommendations/RecommendationTypes";

export type SearchValidationIssue = {
  field: keyof SearchIntent | "query";
  message: string;
};

export type SearchValidationResult = {
  valid: boolean;
  issues: SearchValidationIssue[];
};

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 500;
const MAX_BUDGET = 10_000_000;
const MAX_TRAVELLERS = 50;

function hasUsefulSearchInformation(
  intent: SearchIntent
): boolean {
  return (
    intent.category !== "unknown" ||
    intent.keywords.length > 0 ||
    intent.budgetMin !== undefined ||
    intent.budgetMax !== undefined ||
    Boolean(intent.destination) ||
    intent.preferences.length > 0
  );
}

export function validateSearchIntent(
  intent: SearchIntent
): SearchValidationResult {
  const issues: SearchValidationIssue[] = [];
  const query = intent.rawQuery.trim();

  if (!query) {
    issues.push({
      field: "query",
      message: "Please enter something for Beacon to search for.",
    });
  } else if (query.length < MIN_QUERY_LENGTH) {
    issues.push({
      field: "query",
      message: "Please provide a little more detail about what you need.",
    });
  } else if (query.length > MAX_QUERY_LENGTH) {
    issues.push({
      field: "query",
      message: `Searches must be ${MAX_QUERY_LENGTH} characters or fewer.`,
    });
  }

  if (!hasUsefulSearchInformation(intent)) {
    issues.push({
      field: "query",
      message:
        "Beacon could not understand this request. Try including a product, destination, service, budget or preference.",
    });
  }

  if (
    intent.budgetMin !== undefined &&
    (!Number.isFinite(intent.budgetMin) ||
      intent.budgetMin < 0)
  ) {
    issues.push({
      field: "budgetMin",
      message:
        "The minimum budget must be a valid positive amount.",
    });
  }

  if (
    intent.budgetMax !== undefined &&
    (!Number.isFinite(intent.budgetMax) ||
      intent.budgetMax <= 0)
  ) {
    issues.push({
      field: "budgetMax",
      message:
        "The maximum budget must be greater than zero.",
    });
  }

  if (
    intent.budgetMin !== undefined &&
    intent.budgetMax !== undefined &&
    intent.budgetMin > intent.budgetMax
  ) {
    issues.push({
      field: "budgetMin",
      message:
        "The minimum budget cannot be higher than the maximum budget.",
    });
  }

  if (
    (intent.budgetMin !== undefined &&
      intent.budgetMin > MAX_BUDGET) ||
    (intent.budgetMax !== undefined &&
      intent.budgetMax > MAX_BUDGET)
  ) {
    issues.push({
      field: "budgetMax",
      message:
        "The entered budget is too high to process reliably.",
    });
  }

  if (intent.category === "holiday") {
    if (
      intent.travellers &&
      intent.travellers.adults < 1
    ) {
      issues.push({
        field: "travellers",
        message:
          "A holiday search must include at least one adult.",
      });
    }

    if (
      intent.travellers &&
      (
        intent.travellers.adults < 0 ||
        intent.travellers.children < 0 ||
        intent.travellers.adults +
          intent.travellers.children >
          MAX_TRAVELLERS
      )
    ) {
      issues.push({
        field: "travellers",
        message:
          "Please enter a valid number of travellers.",
      });
    }

    if (
      intent.startDate &&
      Number.isNaN(
        new Date(intent.startDate).getTime()
      )
    ) {
      issues.push({
        field: "startDate",
        message:
          "The holiday start date is invalid.",
      });
    }

    if (
      intent.endDate &&
      Number.isNaN(
        new Date(intent.endDate).getTime()
      )
    ) {
      issues.push({
        field: "endDate",
        message:
          "The holiday end date is invalid.",
      });
    }

    if (
      intent.startDate &&
      intent.endDate &&
      new Date(intent.startDate) >
        new Date(intent.endDate)
    ) {
      issues.push({
        field: "endDate",
        message:
          "The return date must be after the departure date.",
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function assertValidSearchIntent(
  intent: SearchIntent
): void {
  const result = validateSearchIntent(intent);

  if (!result.valid) {
    throw new Error(
      result.issues[0]?.message ??
        "The search is invalid."
    );
  }
}