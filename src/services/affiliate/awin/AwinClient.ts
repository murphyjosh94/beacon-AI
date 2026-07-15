import "server-only";

const AWIN_API_BASE_URL = "https://api.awin.com";

export type AwinRequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export type AwinQueryValue =
  | string
  | number
  | boolean
  | undefined;

export type AwinQueryParameters = Record<
  string,
  AwinQueryValue
>;

export type AwinRequestOptions = {
  method?: AwinRequestMethod;
  query?: AwinQueryParameters;
  body?: unknown;
  signal?: AbortSignal;
};

export class AwinApiError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly responseBody?: unknown;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      responseBody?: unknown;
    } = {}
  ) {
    super(message);

    this.name = "AwinApiError";
    this.status = options.status;
    this.code = options.code;
    this.responseBody = options.responseBody;
  }
}

function getRequiredEnvironmentVariable(
  name: string
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new AwinApiError(
      `${name} is missing. Add it to .env.local and the Vercel production environment.`,
      {
        code: "missing_configuration",
      }
    );
  }

  return value;
}

export function getAwinPublisherId(): number {
  const value =
    getRequiredEnvironmentVariable(
      "AWIN_PUBLISHER_ID"
    );

  const publisherId = Number(value);

  if (
    !Number.isInteger(publisherId) ||
    publisherId <= 0
  ) {
    throw new AwinApiError(
      "AWIN_PUBLISHER_ID must be a valid positive number.",
      {
        code: "invalid_configuration",
      }
    );
  }

  return publisherId;
}

function getAwinApiToken(): string {
  return getRequiredEnvironmentVariable(
    "AWIN_API_TOKEN"
  );
}

function createRequestUrl(
  path: string,
  query: AwinQueryParameters = {}
): URL {
  const normalisedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  const url = new URL(
    normalisedPath,
    AWIN_API_BASE_URL
  );

  for (const [key, value] of Object.entries(
    query
  )) {
    if (value === undefined) {
      continue;
    }

    url.searchParams.set(
      key,
      String(value)
    );
  }

  return url;
}

async function readResponseBody(
  response: Response
): Promise<unknown> {
  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();

  return text || null;
}

function readErrorMessage(
  body: unknown,
  status: number
): string {
  if (
    typeof body === "object" &&
    body !== null
  ) {
    if (
      "message" in body &&
      typeof body.message === "string"
    ) {
      return body.message;
    }

    if (
      "description" in body &&
      typeof body.description === "string"
    ) {
      return body.description;
    }

    if (
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  }

  if (
    typeof body === "string" &&
    body.trim()
  ) {
    return body.trim();
  }

  return `Awin returned HTTP ${status}.`;
}

export async function requestAwin<T>(
  path: string,
  options: AwinRequestOptions = {}
): Promise<T> {
  const method =
    options.method ?? "GET";

  const url = createRequestUrl(
    path,
    options.query
  );

  const headers =
    new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${getAwinApiToken()}`,
    });

  let body: string | undefined;

  if (
    options.body !== undefined
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );

    body = JSON.stringify(
      options.body
    );
  }

  let response: Response;

  try {
    response = await fetch(
      url,
      {
        method,
        headers,
        body,
        signal:
          options.signal,
        cache: "no-store",
      }
    );
  } catch (error) {
    throw new AwinApiError(
      error instanceof Error
        ? `Beacon could not connect to Awin: ${error.message}`
        : "Beacon could not connect to Awin.",
      {
        code: "network_error",
      }
    );
  }

  const responseBody =
    await readResponseBody(
      response
    );

  if (!response.ok) {
    throw new AwinApiError(
      readErrorMessage(
        responseBody,
        response.status
      ),
      {
        status:
          response.status,
        code:
          response.status === 401
            ? "authentication_failed"
            : response.status === 403
              ? "access_denied"
              : response.status === 429
                ? "rate_limited"
                : "api_error",
        responseBody,
      }
    );
  }

  return responseBody as T;
}