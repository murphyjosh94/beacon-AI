import "server-only";

const SERPAPI_BASE_URL = "https://serpapi.com/search.json";

export type SerpApiParameterValue =
  | string
  | number
  | boolean
  | undefined;

export type SerpApiParameters = Record<
  string,
  SerpApiParameterValue
>;

export class SerpApiError extends Error {
  public readonly status?: number;
  public readonly responseBody?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      responseBody?: unknown;
    }
  ) {
    super(message);

    this.name = "SerpApiError";
    this.status = options?.status;
    this.responseBody = options?.responseBody;
  }
}

function getSerpApiKey(): string {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();

  if (!apiKey) {
    throw new SerpApiError(
      "SERPAPI_API_KEY is missing. Add it to .env.local and to the Vercel production environment."
    );
  }

  return apiKey;
}

function buildSearchUrl(
  parameters: SerpApiParameters
): URL {
  const url = new URL(SERPAPI_BASE_URL);

  url.searchParams.set(
    "api_key",
    getSerpApiKey()
  );

  for (const [key, value] of Object.entries(
    parameters
  )) {
    if (value === undefined) {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
}

async function readResponseBody(
  response: Response
): Promise<unknown> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function getSerpApiMessage(
  body: unknown
): string | undefined {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

  return undefined;
}

export async function requestSerpApi<T>(
  parameters: SerpApiParameters
): Promise<T> {
  const url = buildSearchUrl(parameters);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new SerpApiError(
      error instanceof Error
        ? `Beacon could not connect to SerpApi: ${error.message}`
        : "Beacon could not connect to SerpApi."
    );
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new SerpApiError(
      getSerpApiMessage(body) ??
        `SerpApi returned HTTP ${response.status}.`,
      {
        status: response.status,
        responseBody: body,
      }
    );
  }

  const apiError = getSerpApiMessage(body);

  if (apiError) {
    throw new SerpApiError(apiError, {
      status: response.status,
      responseBody: body,
    });
  }

  return body as T;
}