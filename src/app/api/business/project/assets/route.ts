import { del, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const allowedExtensions = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "pdf",
  "doc",
  "docx",
  "txt",
]);

type DeleteRequest = {
  url?: unknown;
  projectId?: unknown;
};

function cleanProjectId(value: FormDataEntryValue | unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const projectId = value.trim().toUpperCase();

  if (!/^BB-[A-Z0-9-]{6,40}$/.test(projectId)) {
    return "";
  }

  return projectId;
}

function cleanFileName(value: string) {
  const normalised = value
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120);

  return normalised || "project-file";
}

function getExtension(fileName: string) {
  const extension = fileName.split(".").pop();

  return extension ? extension.toLowerCase() : "";
}

function isAllowedFile(file: File) {
  const extension = getExtension(file.name);

  return (
    allowedExtensions.has(extension) &&
    (allowedMimeTypes.has(file.type) || file.type === "")
  );
}

function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }

  return token;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectId = cleanProjectId(formData.get("projectId"));
    const fileEntry = formData.get("file");

    if (!projectId) {
      return NextResponse.json(
        {
          error: "A valid Beacon Business project reference is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        {
          error: "Choose a file to upload.",
        },
        {
          status: 400,
        }
      );
    }

    if (!fileEntry.name || fileEntry.size <= 0) {
      return NextResponse.json(
        {
          error: "The selected file is empty or invalid.",
        },
        {
          status: 400,
        }
      );
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Each project file must be no larger than 4 MB.",
        },
        {
          status: 413,
        }
      );
    }

    if (!isAllowedFile(fileEntry)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Upload PNG, JPG, WEBP, SVG, PDF, DOC, DOCX or TXT files.",
        },
        {
          status: 415,
        }
      );
    }

    const safeFileName = cleanFileName(fileEntry.name);
    const pathname = `beacon-business/projects/${projectId}/${safeFileName}`;

    const blob = await put(pathname, fileEntry, {
      access: "private",
      addRandomSuffix: true,
      token: getBlobToken(),
      contentType: fileEntry.type || undefined,
    });

    return NextResponse.json(
      {
        asset: {
          name: fileEntry.name,
          pathname: blob.pathname,
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          contentType: blob.contentType,
          size: fileEntry.size,
          uploadedAt: new Date().toISOString(),
          status: "received",
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Beacon Business asset upload error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the project asset.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as DeleteRequest;
    const projectId = cleanProjectId(body.projectId);

    if (!projectId) {
      return NextResponse.json(
        {
          error: "A valid Beacon Business project reference is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (typeof body.url !== "string" || !body.url.trim()) {
      return NextResponse.json(
        {
          error: "A valid stored asset URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    const assetUrl = body.url.trim();

    if (!assetUrl.includes(`/projects/${projectId}/`)) {
      return NextResponse.json(
        {
          error: "This asset does not belong to the supplied project.",
        },
        {
          status: 403,
        }
      );
    }

    await del(assetUrl, {
      token: getBlobToken(),
    });

    return NextResponse.json({
      deleted: true,
    });
  } catch (error) {
    console.error("Beacon Business asset deletion error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete the project asset.",
      },
      {
        status: 500,
      }
    );
  }
}