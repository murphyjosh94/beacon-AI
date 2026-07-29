import {
  del,
  list,
  put,
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

type StudioAsset = {
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

type StudioAssetMetadata = StudioAsset & {
  version: 1;
};

type UpdateStudioAssetBody = {
  name?: unknown;
  type?: unknown;
  projectId?: unknown;
  projectName?: unknown;
  collection?: unknown;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ASSET_PREFIX = "studio/assets/";
const METADATA_FILE_NAME = "metadata.json";

const VALID_ASSET_TYPES = new Set<StudioAssetType>([
  "image",
  "video",
  "logo",
  "document",
  "presentation",
  "brand-kit",
  "website",
  "social",
  "campaign",
  "other",
]);

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

function sanitiseName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalised = value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s._()-]/gu, "")
    .slice(0, 120);

  return normalised || null;
}

function sanitiseOptionalText(
  value: unknown,
  maxLength: number,
): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalised = value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

  return normalised || null;
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
    message.includes("blob_read_write_token")
  );
}

function clientAsset(
  asset: StudioAssetMetadata,
): StudioAsset {
  return {
    ...asset,
    thumbnailUrl: null,
    downloadUrl:
      `/api/studio/assets/${encodeURIComponent(asset.id)}/download`,
  };
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
  const response = await fetch(blob.url, {
    cache: "no-store",
    headers: process.env.BLOB_READ_WRITE_TOKEN
      ? {
          Authorization:
            `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        }
      : undefined,
  });

  if (!response.ok) {
    console.error(
      "[studio-assets:id:metadata-fetch]",
      blob.pathname,
      response.status,
    );
    return null;
  }

  const data: unknown = await response.json();

  return isStudioAssetMetadata(data)
    ? data
    : null;
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

    return NextResponse.json(
      {
        asset: clientAsset(asset),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[studio-assets:id:get]",
      error,
    );

    if (isBlobConfigurationError(error)) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The Studio asset could not be loaded.",
      500,
    );
  }
}

export async function PUT(
  request: Request,
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

    let body: UpdateStudioAssetBody;

    try {
      body =
        (await request.json()) as UpdateStudioAssetBody;
    } catch {
      return jsonError(
        "The update request must contain valid JSON.",
        400,
      );
    }

    const current =
      await getAssetMetadata(id);

    if (!current) {
      return jsonError(
        "The Studio asset could not be found.",
        404,
      );
    }

    let nextName = current.name;
    let nextType = current.type;
    let nextProjectId = current.projectId ?? null;
    let nextProjectName = current.projectName ?? null;
    let nextCollection = current.collection ?? null;

    if ("name" in body) {
      const name = sanitiseName(body.name);

      if (!name) {
        return jsonError(
          "Asset name must contain at least one valid character.",
          400,
        );
      }

      nextName = name;
    }

    if ("type" in body) {
      if (
        typeof body.type !== "string" ||
        !VALID_ASSET_TYPES.has(
          body.type as StudioAssetType,
        )
      ) {
        return jsonError(
          "The selected Studio asset type is invalid.",
          400,
        );
      }

      nextType =
        body.type as StudioAssetType;
    }

    if ("projectId" in body) {
      if (
        body.projectId !== null &&
        typeof body.projectId !== "string"
      ) {
        return jsonError(
          "projectId must be a string or null.",
          400,
        );
      }

      nextProjectId =
        sanitiseOptionalText(
          body.projectId,
          100,
        );
    }

    if ("projectName" in body) {
      if (
        body.projectName !== null &&
        typeof body.projectName !== "string"
      ) {
        return jsonError(
          "projectName must be a string or null.",
          400,
        );
      }

      nextProjectName =
        sanitiseOptionalText(
          body.projectName,
          120,
        );
    }

    if ("collection" in body) {
      if (
        body.collection !== null &&
        typeof body.collection !== "string"
      ) {
        return jsonError(
          "collection must be a string or null.",
          400,
        );
      }

      nextCollection =
        sanitiseOptionalText(
          body.collection,
          100,
        );
    }

    const updated: StudioAssetMetadata = {
      ...current,
      name: nextName,
      type: nextType,
      projectId: nextProjectId,
      projectName: nextProjectName,
      collection: nextCollection,
      updatedAt: new Date().toISOString(),
    };

    await put(
      `${ASSET_PREFIX}${id}/${METADATA_FILE_NAME}`,
      JSON.stringify(updated, null, 2),
      {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
      },
    );

    return NextResponse.json(
      {
        asset: clientAsset(updated),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[studio-assets:id:put]",
      error,
    );

    if (isBlobConfigurationError(error)) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The Studio asset could not be updated.",
      500,
    );
  }
}

export async function DELETE(
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

    const asset =
      await getAssetMetadata(id);

    if (!asset) {
      return jsonError(
        "The Studio asset could not be found.",
        404,
      );
    }

    const folderPrefix =
      `${ASSET_PREFIX}${id}/`;

    const result = await list({
      prefix: folderPrefix,
      limit: 1_000,
    });

    const urls = result.blobs.map(
      (blob) => blob.url,
    );

    if (urls.length > 0) {
      await del(urls);
    }

    return NextResponse.json(
      {
        success: true,
        deletedId: id,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[studio-assets:id:delete]",
      error,
    );

    if (isBlobConfigurationError(error)) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The Studio asset could not be deleted.",
      500,
    );
  }
}