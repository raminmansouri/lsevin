import { canSavePublicPage } from "./public-snapshot";

export const APPLICATION_CACHE = "lsevin-pwa-application-v2";
const UI_REVISION = "application-ui-3";

/** Fetch a guest document, including Next's bootstrap, rather than stripping its UI. */
export async function saveApplicationPage(
  pathname: string,
  signal: AbortSignal
) {
  if (!canSavePublicPage(pathname)) return;
  const previous = await (await caches.open(APPLICATION_CACHE)).match(pathname);
  if (
    previous &&
    previous.headers.get("X-Lsevin-Ui-Revision") === UI_REVISION &&
    Date.now() - Number(previous.headers.get("X-Lsevin-Saved-At")) <
      5 * 60 * 1000
  )
    return;
  const response = await fetch(pathname, {
    credentials: "omit",
    cache: "no-store",
    signal,
    headers: { "X-Lsevin-Public-Snapshot": "1" },
  });
  if (
    !response.ok ||
    response.redirected ||
    !response.headers.get("content-type")?.includes("text/html")
  )
    return;
  const html = await response.text();
  if (
    signal.aborted ||
    new TextEncoder().encode(html).length > 4 * 1024 * 1024 ||
    !html.includes("</html>")
  )
    return;
  const template = document.createElement("template");
  template.innerHTML = html;
  await cacheDocumentAssets(template.content, signal);
  if (signal.aborted) return;
  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("X-Lsevin-Saved-At", String(Date.now()));
  headers.set("X-Lsevin-Ui-Revision", UI_REVISION);
  headers.set("Cache-Control", "no-store");
  const cache = await caches.open(APPLICATION_CACHE);
  await cache.put(pathname, new Response(html, { headers }));
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - 24)).map((key) => cache.delete(key))
  );
  const imageCache = await caches.open("lsevin-pwa-images-v2");
  const images = new Set<string>();
  template.content.querySelectorAll("img[src]").forEach((node) => {
    const src = node.getAttribute("src");
    if (src) {
      const url = new URL(src, location.origin);
      if (/^https?:$/.test(url.protocol)) images.add(url.href);
    }
    for (const source of (node.getAttribute("srcset") || "").split(",")) {
      const value = source.trim().split(/\s+/)[0];
      if (value) {
        const url = new URL(value, location.origin);
        if (/^https?:$/.test(url.protocol)) images.add(url.href);
      }
    }
  });
  // Only image URLs present in the independently fetched guest document qualify.
  // Batches avoid saturating a mobile connection with a large provider listing.
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  const conservative =
    connection?.saveData ||
    /^(slow-)?2g$/.test(connection?.effectiveType || "");
  const list = [...images].slice(0, conservative ? 8 : 64);
  for (let offset = 0; offset < list.length; offset += 4) {
    await Promise.all(
      list.slice(offset, offset + 4).map(async (url) => {
        try {
          if (await imageCache.match(url)) return;
          const response = await fetch(url, {
            credentials: "omit",
            mode: "no-cors",
            signal,
          });
          if (
            response.type === "opaque" ||
            (response.ok &&
              (await response.clone().arrayBuffer()).byteLength <=
                2 * 1024 * 1024)
          )
            await imageCache.put(url, response);
        } catch {
          /* Missing photos retain the application's existing fallback. */
        }
      })
    );
  }
  const imageKeys = await imageCache.keys();
  await Promise.all(
    imageKeys
      .slice(0, Math.max(0, imageKeys.length - 96))
      .map((key) => imageCache.delete(key))
  );
  if (signal.aborted) return;
}

export async function cacheDocumentAssets(
  content: ParentNode,
  signal: AbortSignal
) {
  // Complete the document's local bootstrap before making it available offline.
  const assets = new Set<string>();
  content
    .querySelectorAll("script[src],link[rel=stylesheet],link[rel=preload]")
    .forEach((node) => {
      const value = node.getAttribute("src") || node.getAttribute("href");
      if (!value) return;
      const url = new URL(value, location.origin);
      if (
        url.origin === location.origin &&
        url.pathname.startsWith("/_next/static/")
      )
        assets.add(url.href);
    });
  await Promise.all(
    [...assets].map(async (url) => {
      const assetCache = await caches.open("lsevin-pwa-assets-v2");
      const asset =
        (await assetCache.match(url)) ||
        (await fetch(url, { credentials: "omit", signal }));
      if (!asset.ok) throw new Error("IncompleteApplicationAssets");
      const bytes = await asset.clone().arrayBuffer();
      if (
        bytes.byteLength > 4 * 1024 * 1024 ||
        /private|no-store/i.test(asset.headers.get("cache-control") || "")
      )
        throw new Error("UncacheableApplicationAsset");
      await (await caches.open("lsevin-pwa-assets-v2")).put(url, asset.clone());
      if (url.includes(".css")) {
        const css = await asset.text();
        await Promise.all(
          [...css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)].map(
            async (match) => {
              // CSS escapes or percent-encodes an SVG fragment. It names a local paint
              // server, not a file to fetch; URL parsing treats the slash as a
              // directory separator and would otherwise request /%23clip.
              const value = match[1].replace(/\\+#/g, "#");
              if (/^(?:#|%23)/i.test(value)) return;
              const font = new URL(value, url);
              if (
                font.origin === location.origin &&
                font.pathname.startsWith("/_next/static/")
              ) {
                if (await assetCache.match(font.href)) return;
                const result = await fetch(font, {
                  credentials: "omit",
                  signal,
                });
                if (!result.ok) throw new Error("IncompleteApplicationFont");
                await result.clone().arrayBuffer();
                await (
                  await caches.open("lsevin-pwa-assets-v2")
                ).put(font.href, result);
              }
            }
          )
        );
      }
    })
  );
}
