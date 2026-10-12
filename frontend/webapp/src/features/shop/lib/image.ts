/**
 * Storefront image src. Same-origin and relative URLs (admin-uploaded media on
 * the files host is proxied elsewhere) pass through untouched; known external
 * stock-photo hosts are routed through the same-origin proxy so the customer's
 * browser never has to reach them directly. See `app/api/shop/img/route.ts`.
 */
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";

const PROXY_HOSTS = new Set(["images.unsplash.com", "plus.unsplash.com", "res.cloudinary.com"]);

export function shopImageSrc(url: string | null | undefined): string {
  const raw = (url ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("/") || raw.startsWith("data:")) return raw;
  try {
    const u = new URL(raw);
    if (u.protocol === "https:" && PROXY_HOSTS.has(u.hostname)) {
      return `/api/shop/img?u=${encodeURIComponent(raw)}`;
    }
  } catch {
    // The admin media picker stores paths relative to the files server
    // (e.g. "Categories/services/x.webp"); make them absolute like the rest of the site.
    return resolveMediaUrl(raw);
  }
  return raw;
}