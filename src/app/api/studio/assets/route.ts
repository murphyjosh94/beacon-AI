import {
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

const ASSET_PREFIX = "studio/assets/";
const METADATA_FILE_NAME = "metadata.json";
const DEFAULT_STORAGE_LIMIT_BYTES = 8 * 1024 ** 3;
const MAX_UPLOAD_BYTES = 20 * 1024 ** 2;
const MAX_ASSETS = 5_000;

const ALLOWED_MIME_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "application/rtf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([
  "avif",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
  "mp4",
  "mov",
  "webm",
  "pdf",
  "rtf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "txt",
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

function sanitiseFileName(value: string): string {
  const withoutExtension = value.replace(/\.[^/.]+$/, "");

  return (
    withoutExtension
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\s._()-]/gu, "")
      .slice(0, 120) || "Studio Asset"
  );
}

function sanitisePathSegment(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "asset"
  );
}

function sanitiseOptionalText(
  value: FormDataEntryValue | null,
  maxLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalised = value.trim().replace(/\s+/g, " ");

  return normalised
    ? normalised.slice(0, maxLength)
    : null;
}

function fileExtension(fileName: string): string {
  const extension = fileName
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase();

  return extension && /^[a-z0-9]+$/.test(extension)
    ? extension
    : "file";
}

function inferAssetType(
  mimeType: string,
  extension: string,
  requestedType: string | null,
): StudioAssetType {
  const validTypes = new Set<StudioAssetType>([
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

  if (
    requestedType &&
    validTypes.has(requestedType as StudioAssetType)
  ) {
    return requestedType as StudioAssetType;
  }

  if (mimeType.startsWith("image/")) {
    return extension === "svg"
      ? "logo"
      : "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (
    ["ppt", "pptx", "key"].includes(extension)
  ) {
    return "presentation";
  }

  if (
    mimeType === "application/pdf" ||
    ["doc", "docx", "rtf", "txt"].includes(extension)
  ) {
    return "document";
  }

  return "other";
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

async function listAllMetadataBlobs(): Promise<
  ListBlobResultBlob[]
> {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      prefix: ASSET_PREFIX,
      cursor,
      limit: 1_000,
    });

    blobs.push(
      ...result.blobs.filter((blob) =>
        blob.pathname.endsWith(
          `/${METADATA_FILE_NAME}`,
        ),
      ),
    );

    cursor = result.hasMore
      ? result.cursor
      : undefined;
  } while (
    cursor &&
    blobs.length < MAX_ASSETS
  );

  return blobs.slice(0, MAX_ASSETS);
}

async function readMetadataBlob(
  blob: ListBlobResultBlob,
): Promise<StudioAssetMetadata | null> {
  try {
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
        "[studio-assets:metadata-fetch]",
        blob.pathname,
        response.status,
      );
      return null;
    }

    const data: unknown = await response.json();

    return isStudioAssetMetadata(data)
      ? data
      : null;
  } catch (error) {
    console.error(
      "[studio-assets:metadata-read]",
      blob.pathname,
      error,
    );
    return null;
  }
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

export async function GET(
  request: Request,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query =
      url.searchParams
        .get("query")
        ?.trim()
        .toLowerCase() ?? "";

    const type =
      url.searchParams.get("type");
    const collection =
      url.searchParams.get("collection");

    const metadataBlobs =
      await listAllMetadataBlobs();

    const metadata = (
      await Promise.all(
        metadataBlobs.map(readMetadataBlob),
      )
    ).filter(
      (
        asset,
      ): asset is StudioAssetMetadata =>
        asset !== null,
    );

    const assets = metadata
      .filter((asset) => {
        const matchesType =
          !type ||
          type === "all" ||
          asset.type === type;

        const matchesCollection =
          !collection ||
          asset.collection === collection;

        const searchable = [
          asset.name,
          asset.extension,
          asset.projectName ?? "",
          asset.collection ?? "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery =
          !query ||
          searchable.includes(query);

        return (
          matchesType &&
          matchesCollection &&
          matchesQuery
        );
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .map(clientAsset);

    const usedBytes = metadata.reduce(
      (total, asset) =>
        total + asset.sizeBytes,
      0,
    );

    const collections = Array.from(
      new Set(
        metadata
          .map((asset) => asset.collection)
          .filter(
            (
              value,
            ): value is string =>
              typeof value === "string" &&
              value.length > 0,
          ),
      ),
    ).sort((first, second) =>
      first.localeCompare(second),
    );

    return NextResponse.json(
      {
        assets,
        storage: {
          usedBytes,
          limitBytes:
            DEFAULT_STORAGE_LIMIT_BYTES,
        },
        collections,
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
      "[studio-assets:get]",
      error,
    );

    if (
      isBlobConfigurationError(error)
    ) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The Studio asset library could not be loaded.",
      500,
    );
  }
}

export async function POST(
  request: Request,
): Promise<Response> {
  try {
    const contentType =
      request.headers.get("content-type");

    if (
      !contentType?.includes(
        "multipart/form-data",
      )
    ) {
      return jsonError(
        "Expected a multipart/form-data request.",
        415,
      );
    }

    let formData: FormData;

    try {
      formData =
        await request.formData();
    } catch {
      return jsonError(
        "The upload request could not be read.",
        400,
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError(
        "Choose a file to upload.",
        400,
      );
    }

    if (file.size <= 0) {
      return jsonError(
        "The selected file is empty.",
        400,
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError(
        `The selected file exceeds the ${MAX_UPLOAD_BYTES / 1024 ** 2} MB upload limit.`,
        413,
      );
    }

    const extension =
      fileExtension(file.name);

    if (
      !ALLOWED_MIME_TYPES.has(file.type) &&
      !ALLOWED_EXTENSIONS.has(extension)
    ) {
      return jsonError(
        "This file type is not supported by Beacon Studio.",
        415,
      );
    }

    const now =
      new Date().toISOString();
    const id =
      crypto.randomUUID();

    const requestedType =
      sanitiseOptionalText(
        formData.get("type"),
        30,
      );

    const projectId =
      sanitiseOptionalText(
        formData.get("projectId"),
        100,
      );

    const projectName =
      sanitiseOptionalText(
        formData.get("projectName"),
        120,
      );

    const collection =
      sanitiseOptionalText(
        formData.get("collection"),
        100,
      );

    const type = inferAssetType(
      file.type,
      extension,
      requestedType,
    );

    const safeBaseName =
      sanitisePathSegment(
        sanitiseFileName(file.name),
      );

    const storagePath =
      `${ASSET_PREFIX}${id}/${safeBaseName}.${extension}`;

    await put(
      storagePath,
      file,
      {
        access: "private",
        addRandomSuffix: false,
        contentType:
          file.type ||
          "application/octet-stream",
      },
    );

    const metadata: StudioAssetMetadata = {
      version: 1,
      id,
      name: sanitiseFileName(file.name),
      type,
      mimeType:
        file.type ||
        "application/octet-stream",
      extension:
        extension.toUpperCase(),
      sizeBytes: file.size,
      width: null,
      height: null,
      durationMs: null,
      thumbnailUrl: null,
      downloadUrl: null,
      projectId,
      projectName,
      collection,
      createdAt: now,
      updatedAt: now,
      storagePath,
    };

    await put(
      `${ASSET_PREFIX}${id}/${METADATA_FILE_NAME}`,
      JSON.stringify(metadata, null, 2),
      {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
      },
    );

    return NextResponse.json(
      {
        asset: clientAsset(metadata),
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          Location:
            `/api/studio/assets/${id}`,
        },
      },
    );
  } catch (error) {
    console.error(
      "[studio-assets:post]",
      error,
    );

    if (
      isBlobConfigurationError(error)
    ) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    return jsonError(
      "The Studio asset could not be uploaded.",
      500,
    );
  }
}