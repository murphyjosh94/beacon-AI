import {
  get,
  list,
  type ListBlobResultBlob,
} from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudioAssetType =
  | "image"
  | "video"
  | "logo"
  | "document"
  | "presentation"
  | "brand-kit"
  | "website"
  | "social"
  | "campaign"
  | "other";

type StudioAssetMetadata = {
  version: 1;
  id: string;
  name: string;
  type: StudioAssetType;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  thumbnailUrl?: string | null;
  downloadUrl?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  collection?: string | null;
  createdAt: string;
  updatedAt: string;
  storagePath: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ASSET_PREFIX = "studio/assets/";
const METADATA_FILE_NAME = "metadata.json";

function jsonError(
  message: string,
  status: number,
): Response {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isValidAssetId(value: string): boolean {
  return /^[a-zA-Z0-9_-]{8,100}$/.test(value);
}

function isStudioAssetMetadata(
  value: unknown,
): value is StudioAssetMetadata {
  if (!value || typeof value !== "object") {
    return false;
  }

  const asset = value as Partial<StudioAssetMetadata>;

  return (
    asset.version === 1 &&
    typeof asset.id === "string" &&
    typeof asset.name === "string" &&
    typeof asset.type === "string" &&
    typeof asset.mimeType === "string" &&
    typeof asset.extension === "string" &&
    typeof asset.sizeBytes === "number" &&
    typeof asset.createdAt === "string" &&
    typeof asset.updatedAt === "string" &&
    typeof asset.storagePath === "string"
  );
}

function isBlobConfigurationError(
  error: unknown,
): boolean {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : "";

  return (
    message.includes("token") ||
    message.includes("blob_read_write_token") ||
    message.includes("not authenticated") ||
    message.includes("access denied")
  );
}

function safeDownloadName(
  name: string,
  extension: string,
): string {
  const safeName =
    name
      .trim()
      .replace(/[\r\n"]/g, "")
      .replace(/[\\/<>:*?|]/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 120) || "studio-asset";

  const safeExtension =
    extension
      .trim()
      .replace(/^\./, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

  if (!safeExtension) {
    return safeName;
  }

  const existingExtension =
    safeName.split(".").pop()?.toLowerCase();

  return existingExtension === safeExtension
    ? safeName
    : `${safeName}.${safeExtension}`;
}

function encodeContentDispositionFilename(
  filename: string,
): string {
  const asciiFallback = filename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");

  const encodedFilename = encodeURIComponent(filename)
    .replace(/['()]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    .replace(/\*/g, "%2A");

  return (
    `attachment; filename="${asciiFallback}"; ` +
    `filename*=UTF-8''${encodedFilename}`
  );
}

async function findMetadataBlob(
  id: string,
): Promise<ListBlobResultBlob | null> {
  const pathname =
    `${ASSET_PREFIX}${id}/${METADATA_FILE_NAME}`;

  const result = await list({
    prefix: pathname,
    limit: 10,
  });

  return (
    result.blobs.find(
      (blob) => blob.pathname === pathname,
    ) ?? null
  );
}

async function readMetadataBlob(
  blob: ListBlobResultBlob,
): Promise<StudioAssetMetadata | null> {
  const result = await get(blob.pathname, {
    access: "private",
  });

  if (!result) {
    return null;
  }

  if (!result.stream) {
    return null;
  }

  try {
    const data: unknown = await new Response(
      result.stream,
    ).json();

    return isStudioAssetMetadata(data)
      ? data
      : null;
  } catch (error) {
    console.error(
      "[studio-assets:download:metadata-parse]",
      blob.pathname,
      error,
    );

    return null;
  }
}

async function getAssetMetadata(
  id: string,
): Promise<StudioAssetMetadata | null> {
  const metadataBlob =
    await findMetadataBlob(id);

  if (!metadataBlob) {
    return null;
  }

  return readMetadataBlob(metadataBlob);
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { id } = await context.params;

    if (!isValidAssetId(id)) {
      return jsonError(
        "The Studio asset ID is invalid.",
        400,
      );
    }

    const asset = await getAssetMetadata(id);

    if (!asset) {
      return jsonError(
        "The Studio asset could not be found.",
        404,
      );
    }

    const blob = await get(asset.storagePath, {
      access: "private",
    });

    if (!blob) {
      return jsonError(
        "The stored Studio asset file could not be found.",
        404,
      );
    }

    if (!blob.stream) {
      return jsonError(
        "The Studio asset file returned no content.",
        502,
      );
    }

    const filename = safeDownloadName(
      asset.name,
      asset.extension,
    );

    const responseHeaders = new Headers();

    responseHeaders.set(
      "Content-Type",
      blob.headers.get("content-type") ||
        asset.mimeType ||
        "application/octet-stream",
    );

    responseHeaders.set(
      "Content-Disposition",
      encodeContentDispositionFilename(filename),
    );

    responseHeaders.set(
      "Cache-Control",
      "private, no-store, max-age=0",
    );

    responseHeaders.set(
      "X-Content-Type-Options",
      "nosniff",
    );

    responseHeaders.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive",
    );

    const contentLength =
      blob.headers.get("content-length");

    if (contentLength) {
      responseHeaders.set(
        "Content-Length",
        contentLength,
      );
    } else if (
      Number.isFinite(asset.sizeBytes) &&
      asset.sizeBytes >= 0
    ) {
      responseHeaders.set(
        "Content-Length",
        String(asset.sizeBytes),
      );
    }

    const etag = blob.headers.get("etag");

    if (etag) {
      responseHeaders.set("ETag", etag);
    }

    const lastModified =
      blob.headers.get("last-modified");

    if (lastModified) {
      responseHeaders.set(
        "Last-Modified",
        lastModified,
      );
    }

    return new Response(blob.stream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(
      "[studio-assets:download:get]",
      error,
    );

    if (isBlobConfigurationError(error)) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The Studio asset could not be downloaded.",
      500,
    );
  }
}