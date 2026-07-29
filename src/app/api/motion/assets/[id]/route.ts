import { del, head } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREFIX = "motion/assets/";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function blobUrlFromId(id: string) {
  const store = process.env.NEXT_PUBLIC_BLOB_STORE_PUBLIC_URL;
  if (!store) {
    throw new Error(
      "NEXT_PUBLIC_BLOB_STORE_PUBLIC_URL is not configured.",
    );
  }

  return `${store.replace(/\/$/, "")}/${PREFIX}${id}`;
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return jsonError("Missing asset id.", 400);
    }

    const url = blobUrlFromId(id);

    try {
      await head(url);
    } catch {
      return jsonError("Asset not found.", 404);
    }

    await del(url);

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error("[motion-assets:delete]", error);

    const message =
      error instanceof Error ? error.message : "Unable to delete asset.";

    return jsonError(message, 500);
  }
}