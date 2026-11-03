/**
 * Media references stored on tours, destinations and landing modules.
 *
 * Three forms are accepted:
 *  - an absolute https URL (provider-hosted media),
 *  - a site-root path ("/images/tours/kish-beach.webp", files shipped with the app),
 *  - a media-library path ("Categories/services/<id>.webp"), exactly as the platform's
 *    media library stores it. It is resolved against each site's files host only when
 *    displayed, so the same row works on both sites (Iran and global) — storing the
 *    resolved URL baked one site's host into data replicated to the other.
 */

const MAX = 1000;
const LIBRARY_PATH_RE = /^[A-Za-z0-9][A-Za-z0-9._\-/ ]*$/;

/** True for a reference the tours tables may store. */
export function isMediaRef(value: string): boolean {
  const v = value.trim();
  // Spaces are allowed (library file names); other whitespace, quotes, markup and backslashes are not.
  if (!v || v.length > MAX || /[\t\n\r\f\v<>"'\\]/.test(v)) return false;
  if (v.startsWith("https://")) return v.length > "https://".length && !/[\s<>"']/.test(v);
  if (v.startsWith("/")) return !v.startsWith("//") && !v.includes("..");
  // Library path: no scheme, no parent segments, no empty segments.
  return LIBRARY_PATH_RE.test(v) && !v.includes("..") && !v.includes("//") && !v.includes(":");
}

/**
 * The media-library form of a stored reference: an absolute URL on a files host
 * ("https://<host>/files/<path>") becomes "<path>"; anything else is returned as is.
 */
export function toLibraryPath(value: string, filesBase?: string | null): string {
  const v = value.trim();
  const base = (filesBase ?? "").replace(/\/+$/, "");
  if (base && v.startsWith(`${base}/`)) return v.slice(base.length + 1);
  const m = /^https?:\/\/[^/]+\/files\/(.+)$/i.exec(v);
  return m ? m[1] : v;
}
