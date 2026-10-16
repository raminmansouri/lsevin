/**
 * Storefront image src. Same-origin and relative URLs, and files on our own files
 * host, pass through untouched. Every other http(s) image (stock-photo hosts, or any
 * URL an admin pasted into a product gallery) is routed through the same-origin
 * proxy, so the customer's browser never has to reach a third-party host directly.
 * See `app/api/shop/img/route.ts`.
 */
import { env } from "@/config/env/client";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";

function ownHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const value of [env.NEXT_PUBLIC_FILES_URL, env.NEXT_PUBLIC_URL]) {
    try {
      if (value) hosts.add(new URL(value).hostname);
    } catch {
      // ignore a malformed env value
    }
  }
  return hosts;
}

export function shopImageSrc(url: string | null | undefined): string {
  const raw = (url ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("/") || raw.startsWith("data:")) return raw;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    // The admin media picker stores paths relative to the files server
    // (e.g. "Categories/services/x.webp"); make them absolute like the rest of the site.
    return resolveMediaUrl(raw);
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return raw;
  if (ownHosts().has(u.hostname)) return raw;
  // Images added to a product by URL used to load straight from their own host and
  // often showed nothing: hosts that block hotlinking, plain-http URLs (the edge CSP
  // upgrades them to https), or hosts customers can't reach.
  return `/api/shop/img?u=${encodeURIComponent(raw)}`;
}
