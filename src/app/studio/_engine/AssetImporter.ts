import type { StudioAsset, StudioAssetKind } from "../StudioProvider";

export type GeneratedAssetDescriptor = {
  id?: string;
  name: string;
  kind: StudioAssetKind;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeUrl(value: string): string {
  const trimmed = value.trim();

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  throw new Error(`Unsupported Studio asset URL: ${trimmed || "(empty)"}`);
}

export function importGeneratedAsset(
  descriptor: GeneratedAssetDescriptor,
  projectId: string,
): StudioAsset {
  const now = new Date().toISOString();

  return {
    id: descriptor.id?.trim() || createId("asset"),
    projectId,
    name: descriptor.name.trim() || "Generated Studio asset",
    kind: descriptor.kind,
    url: safeUrl(descriptor.url),
    thumbnailUrl: descriptor.thumbnailUrl
      ? safeUrl(descriptor.thumbnailUrl)
      : undefined,
    mimeType: descriptor.mimeType,
    sizeBytes: descriptor.sizeBytes,
    width: descriptor.width,
    height: descriptor.height,
    durationMs: descriptor.durationMs,
    createdAt: now,
    updatedAt: now,
    status: "ready",
    metadata: {
      generated: true,
      ...(descriptor.metadata ?? {}),
    },
  };
}

export function importGeneratedAssets(
  descriptors: GeneratedAssetDescriptor[],
  projectId: string,
): StudioAsset[] {
  return descriptors.map((descriptor) =>
    importGeneratedAsset(descriptor, projectId),
  );
}