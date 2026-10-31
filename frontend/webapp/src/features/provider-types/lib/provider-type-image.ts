import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Provider type images are stored either as a media_library id or as a stored
 * file path (e.g. "uploads/abc.jpg"). Relative paths must be prefixed with
 * NEXT_PUBLIC_FILES_URL, otherwise the browser resolves them against the
 * current page (/fa/admin/...) and the image breaks. A bare media id that the
 * DB join could not resolve is not a usable URL, so it is ignored.
 */
export function resolveProviderTypeImageUrl(providerType: {
  imagePreviewUrl?: string | null;
  imageUrl?: string | null;
}): string {
  for (const candidate of [providerType.imagePreviewUrl, providerType.imageUrl]) {
    const value = String(candidate || "").trim();
    if (!value || UUID_RE.test(value)) continue;
    return resolveMediaUrl(value);
  }
  return "";
}
