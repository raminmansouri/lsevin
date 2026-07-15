import type { MediaItem } from "./types";

export function parseCommaSeparatedIds(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

// Most CRUD forms store resolved media URLs, but some (e.g. forms with a media_id FK column)
// need the media_library id instead. `valueField` selects which; it defaults to "fileUrl" so
// existing inputs keep their behavior. References resolve back via getMediaByReferences either way.
export function toCommaSeparatedIds(
  items: Array<Pick<MediaItem, "id" | "fileUrl">>,
  valueField: "id" | "fileUrl" = "fileUrl"
): string {
  return items
    .map((item) => (valueField === "id" ? item.id || item.fileUrl : item.fileUrl || item.id))
    .filter(Boolean)
    .join(",");
}

export function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

export function formatBytes(bytes?: number | null): string {
  const safe = bytes ?? 0;
  if (safe < 1024) return `${safe} B`;
  if (safe < 1024 * 1024) return `${(safe / 1024).toFixed(1)} KB`;
  if (safe < 1024 * 1024 * 1024) return `${(safe / (1024 * 1024)).toFixed(1)} MB`;
  return `${(safe / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function truncateMiddle(value: string, keep = 12): string {
  if (!value) return value;
  if (value.length <= keep * 2) return value;
  return `${value.slice(0, keep)}...${value.slice(-keep)}`;
}

export function isImage(item: Pick<MediaItem, "mediaType" | "mimeType">) {
  return item.mediaType === "image" || item.mimeType?.startsWith("image/");
}

export function isVideo(item: Pick<MediaItem, "mediaType" | "mimeType">) {
  return item.mediaType === "video" || item.mimeType?.startsWith("video/");
}
