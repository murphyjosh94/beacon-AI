import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MotionAssetType = "image" | "video" | "audio" | "logo";

type MotionAsset = {
  id: string;
  name: string;
  type: MotionAssetType;
  url: string;
  sizeBytes?: number;
  mimeType?: string;
  createdAt?: string;
};

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const ASSET_PREFIX = "motion/assets/";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
]);

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function sanitiseFileName(fileName: string) {
  const extensionIndex = fileName.lastIndexOf(".");
  const baseName =
    extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;

  const sanitisedBaseName = baseName
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return sanitisedBaseName || "asset";
}

function inferAssetType(file: File, requestedType: FormDataEntryValue | null) {
  if (
    requestedType === "image" ||
    requestedType === "video" ||
    requestedType === "audio" ||
    requestedType === "logo"
  ) {
    return requestedType;
  }

  const lowerName = file.name.toLowerCase();

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  if (
    lowerName.includes("logo") ||
    lowerName.includes("brandmark") ||
    file.type === "image/svg+xml"
  ) {
    return "logo";
  }

  return "image";
}

function createAssetId() {
  return crypto.randomUUID();
}

function createBlobPath(
  id: string,
  file: File,
  assetType: MotionAssetType,
) {
  const extension =
    EXTENSION_BY_MIME_TYPE[file.type] ??
    file.name.split(".").pop()?.toLowerCase() ??
    "bin";

  const safeName = sanitiseFileName(file.name);

  return `${ASSET_PREFIX}${assetType}/${id}-${safeName}.${extension}`;
}

function fileNameFromPathname(pathname: string) {
  const finalSegment = pathname.split("/").pop() ?? "asset";
  const nameWithoutExtension = finalSegment.replace(/\.[^.]+$/, "");
  const nameWithoutId = nameWithoutExtension.replace(
    /^[0-9a-f-]{36}-/i,
    "",
  );

  return nameWithoutId.replace(/-/g, " ");
}

function assetTypeFromPathname(pathname: string): MotionAssetType {
  const segment = pathname
    .replace(ASSET_PREFIX, "")
    .split("/")[0];

  if (
    segment === "image" ||
    segment === "video" ||
    segment === "audio" ||
    segment === "logo"
  ) {
    return segment;
  }

  return "image";
}

function assetIdFromPathname(pathname: string) {
  const finalSegment = pathname.split("/").pop() ?? "";
  const match = finalSegment.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-/i,
  );

  return match?.[1] ?? pathname;
}

export async function GET() {
  try {
    const result = await list({
      prefix: ASSET_PREFIX,
      limit: 1000,
    });

    const assets: MotionAsset[] = result.blobs
      .map((blob) => ({
        id: assetIdFromPathname(blob.pathname),
        name: fileNameFromPathname(blob.pathname),
        type: assetTypeFromPathname(blob.pathname),
        url: blob.url,
        sizeBytes: blob.size,
        createdAt: blob.uploadedAt.toISOString(),
      }))
      .sort((first, second) => {
        const firstDate = first.createdAt
          ? new Date(first.createdAt).getTime()
          : 0;
        const secondDate = second.createdAt
          ? new Date(second.createdAt).getTime()
          : 0;

        return secondDate - firstDate;
      });

    return NextResponse.json(
      {
        assets,
        hasMore: result.hasMore,
        cursor: result.cursor ?? null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[motion-assets:get]", error);

    return jsonError(
      "The media library could not be loaded. Check the Blob store connection.",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");

    if (!contentType?.includes("multipart/form-data")) {
      return jsonError(
        "Expected a multipart form upload containing a file.",
        415,
      );
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return jsonError("No valid file was supplied.", 400);
    }

    if (fileEntry.size <= 0) {
      return jsonError("The selected file is empty.", 400);
    }

    if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
      return jsonError(
        "The selected file exceeds the 100MB upload limit.",
        413,
      );
    }

    if (!ALLOWED_MIME_TYPES.has(fileEntry.type)) {
      return jsonError(
        "Unsupported file type. Upload PNG, JPG, WEBP, SVG, MP4, WEBM, MP3, WAV, OGG or M4A files.",
        415,
      );
    }

    const assetType = inferAssetType(fileEntry, formData.get("type"));
    const id = createAssetId();
    const pathname = createBlobPath(id, fileEntry, assetType);

    const blob = await put(pathname, fileEntry, {
      access: "private",
      addRandomSuffix: false,
      contentType: fileEntry.type,
    });

    const asset: MotionAsset = {
      id,
      name: fileEntry.name,
      type: assetType,
      url: blob.url,
      sizeBytes: fileEntry.size,
      mimeType: fileEntry.type,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        asset,
        id: asset.id,
        url: asset.url,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[motion-assets:post]", error);

    const message =
      error instanceof Error ? error.message.toLowerCase() : "";

    if (
      message.includes("token") ||
      message.includes("blob_read_write_token")
    ) {
      return jsonError(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.",
        500,
      );
    }

    if (
      message.includes("access") &&
      (message.includes("private") || message.includes("public"))
    ) {
      return jsonError(
        "This route requires a public Vercel Blob store so editor previews can load uploaded media directly.",
        500,
      );
    }

    return jsonError(
      "The file could not be uploaded. Please try again.",
      500,
    );
  }
}