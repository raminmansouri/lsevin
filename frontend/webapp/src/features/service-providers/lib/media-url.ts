import { env } from "@/config/env/client";

const ABSOLUTE_OR_BROWSER_URL = /^(https?:)?\/\//i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

export function resolveMediaUrl(value?: string | null): string {
  const src = String(value || "").trim();
  if (!src) return "";
  if (
    ABSOLUTE_OR_BROWSER_URL.test(src) ||
    src.startsWith("/") ||
    src.startsWith("blob:") ||
    src.startsWith("data:")
  ) {
    return src;
  }

  const baseUrl = String(env.NEXT_PUBLIC_FILES_URL || "").replace(/\/+$/, "");
  // Never hand back a bare relative path: on /fa/products/x it resolves to
  // /fa/products/Categories/..., which is a 404.
  return baseUrl ? `${baseUrl}/${src.replace(/^\/+/, "")}` : `/files/${src.replace(/^\/+/, "")}`;
}

export function isVideoMedia(mediaType?: string | null, url?: string | null): boolean {
  const kind = String(mediaType || "").trim().toLowerCase();
  if (kind === "video" || kind.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.test(String(url || ""));
}
