import "server-only";

import {
  GeneralAnswerError,
} from "@/services/openai/GeneralAnswerProvider";

export type BeaconEngineErrorCode =
  | "missing_query"
  | "invalid_search"
  | "validation_failed"
  | "missing_destination"
  | "provider_unavailable"
  | "authentication_failed"
  | "billing_required"
  | "rate_limited"
  | "invalid_response"
  | "internal_error";

export class BeaconEngineError extends Error {
  public readonly code:
    BeaconEngineErrorCode;

  public readonly status:
    number;

  public readonly issues?:
    unknown[];

  constructor(
    message: string,
    options: {
      code:
        BeaconEngineErrorCode;

      status:
        number;

      issues?:
        unknown[];
    }
  ) {
    super(message);

    this.name =
      "BeaconEngineError";

    this.code =
      options.code;

    this.status =
      options.status;

    this.issues =
      options.issues;
  }
}

export function createMissingQueryError(): BeaconEngineError {
  return new BeaconEngineError(
    "Please enter something for Beacon to help with.",
    {
      code:
        "missing_query",

      status: 400,
    }
  );
}

export function createInvalidSearchError(
  error: unknown
): BeaconEngineError {
  return new BeaconEngineError(
    error instanceof Error
      ? error.message
      : "Beacon could not understand this request.",
    {
      code:
        "invalid_search",

      status: 400,
    }
  );
}

export function createMissingDestinationError(
  message:
    string =
      "Which destination or area would you like Beacon to search?"
): BeaconEngineError {
  return new BeaconEngineError(
    message,
    {
      code:
        "missing_destination",

      status: 400,
    }
  );
}

export function createProviderUnavailableError(
  message: string
): BeaconEngineError {
  return new BeaconEngineError(
    message,
    {
      code:
        "provider_unavailable",

      status: 503,
    }
  );
}

export function createValidationError(
  message: string,
  issues?: unknown[]
): BeaconEngineError {
  return new BeaconEngineError(
    message,
    {
      code:
        "validation_failed",

      status: 400,

      issues,
    }
  );
}

export function mapGeneralAnswerError(
  error: GeneralAnswerError
): BeaconEngineError {
  switch (error.code) {
    case "authentication_failed":
      return new BeaconEngineError(
        error.message,
        {
          code:
            "authentication_failed",

          status: 401,
        }
      );

    case "rate_limited":
      return new BeaconEngineError(
        error.message,
        {
          code:
            "rate_limited",

          status: 429,
        }
      );

    case "billing_required":
      return new BeaconEngineError(
        error.message,
        {
          code:
            "billing_required",

          status: 503,
        }
      );

    case "invalid_response":
      return new BeaconEngineError(
        error.message,
        {
          code:
            "invalid_response",

          status: 502,
        }
      );

    default:
      return new BeaconEngineError(
        error.message,
        {
          code:
            "provider_unavailable",

          status: 503,
        }
      );
  }
}

export function isProviderUnavailableError(
  error: unknown
): boolean {
  return (
    error instanceof
      BeaconEngineError &&
    error.code ===
      "provider_unavailable"
  );
}