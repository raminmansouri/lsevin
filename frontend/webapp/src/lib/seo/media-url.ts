import { seoOrigin } from "./origin";

/**
 * The public URL of a stored image, for structured data and og:image.
 *
 * Media is stored as a key ("Categories/services/<id>.webp") and served by the
 * API under /files on every public host. Resolving a bare key against the site
 * root gave https://lsevincare.com/Categories/... which is a 404 (found
 * 2026-11-15 on provider, specialist and product pages); Google ignores image
 * properties that are not crawlable.
 *
 *   https://... (absolute)       -> unchanged
 *   /files/..., /pwa/... (path)   -> on the site origin
 *   Categories/... (storage key)  -> <site origin>/files/<key>
 */
export function publicMediaUrl(src: string | null | undefined): string | undefined {
  const value = src?.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("data:") || value.startsWith("blob:")) return undefined;
  const origin = seoOrigin();
  try {
    if (value.startsWith("/")) return new URL(value, origin).toString();
    const key = value.replace(/\\/g, "/").replace(/^files\//i, "");
    return new URL(`/files/${key.split("/").map(encodeURIComponent).join("/")}`, origin).toString();
  } catch {
    return undefined;
  }
}
