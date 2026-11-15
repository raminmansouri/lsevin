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
 *   https://<own host>/files/...  -> the same file on the site origin
 *   https://... (other hosts)    -> unchanged
 *   /files/..., /pwa/... (path)   -> on the site origin
 *   Categories/... (storage key)  -> <site origin>/files/<key>
 *
 * Our own files host (appmain.lsevin.com) is not the public domain: sitemap
 * and structured-data images there pointed Google at another host (found
 * 2026-11-15 in the image sitemap).
 */
function ownMediaHosts(): Set<string> {
  const hosts = new Set<string>(["appmain.lsevin.com"]);
  for (const value of [process.env.NEXT_PUBLIC_FILES_URL, process.env.NEXT_PUBLIC_URL]) {
    try {
      if (value) hosts.add(new URL(value).hostname);
    } catch {
      // ignore a malformed env value
    }
  }
  return hosts;
}

export function publicMediaUrl(src: string | null | undefined): string | undefined {
  const value = src?.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (ownMediaHosts().has(url.hostname) && url.pathname.startsWith("/files/")) {
        return new URL(url.pathname + url.search, seoOrigin()).toString();
      }
    } catch {
      return undefined;
    }
    return value;
  }
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
