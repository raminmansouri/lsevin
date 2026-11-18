/**
 * Link and embed rules. Editors never paste HTML: a link is checked here, an embed is
 * stored as {provider, videoId} and turned into an iframe URL only by this module.
 */

import { safeHref, type LinkTarget } from "@/lib/safe-href";

export { safeHref };
export type { LinkTarget };

export const EMBED_PROVIDERS = ["youtube", "aparat", "vimeo"] as const;
export type EmbedProvider = (typeof EMBED_PROVIDERS)[number];

const EMBED_ID: Record<EmbedProvider, RegExp> = {
  youtube: /^[A-Za-z0-9_-]{11}$/u,
  vimeo: /^\d{6,12}$/u,
  aparat: /^[A-Za-z0-9]{3,16}$/u,
};

export const isEmbedId = (provider: EmbedProvider, id: string) => EMBED_ID[provider].test(id);

/** Iframe source for an allow-listed provider; null when the id is not a valid id. */
export function embedSrc(provider: EmbedProvider, id: string): string | null {
  if (!isEmbedId(provider, id)) return null;
  switch (provider) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${id}`;
    case "vimeo":
      return `https://player.vimeo.com/video/${id}`;
    case "aparat":
      return `https://www.aparat.com/video/video/embed/videohash/${id}/vt/frame`;
  }
}

/** Extracts {provider, videoId} from a pasted watch/share URL, or a bare id with a chosen provider. */
export function parseEmbedInput(input: string, fallbackProvider?: EmbedProvider): { provider: EmbedProvider; videoId: string } | null {
  const value = input.trim();
  if (!value) return null;
  let url: URL | null = null;
  try {
    url = new URL(value);
  } catch {
    url = null;
  }
  if (!url) {
    if (fallbackProvider && isEmbedId(fallbackProvider, value)) return { provider: fallbackProvider, videoId: value };
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./u, "").toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" && parts[0] && isEmbedId("youtube", parts[0])) return { provider: "youtube", videoId: parts[0] };
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && isEmbedId("youtube", v)) return { provider: "youtube", videoId: v };
    const idx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "live");
    if (idx >= 0 && parts[idx + 1] && isEmbedId("youtube", parts[idx + 1])) return { provider: "youtube", videoId: parts[idx + 1] };
    return null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = parts.find((p) => /^\d{6,12}$/u.test(p));
    return id ? { provider: "vimeo", videoId: id } : null;
  }
  if (host === "aparat.com") {
    // https://www.aparat.com/v/AbC12  or  /video/video/embed/videohash/AbC12/vt/frame
    const hashIdx = parts.indexOf("videohash");
    const id = hashIdx >= 0 ? parts[hashIdx + 1] : parts[0] === "v" ? parts[1] : undefined;
    return id && isEmbedId("aparat", id) ? { provider: "aparat", videoId: id } : null;
  }
  return null;
}

/** Watch-page URL for a provider/id (used as `url` in VideoObject schema and as a noscript link). */
export function embedWatchUrl(provider: EmbedProvider, id: string): string | null {
  if (!isEmbedId(provider, id)) return null;
  switch (provider) {
    case "youtube":
      return `https://www.youtube.com/watch?v=${id}`;
    case "vimeo":
      return `https://vimeo.com/${id}`;
    case "aparat":
      return `https://www.aparat.com/v/${id}`;
  }
}
