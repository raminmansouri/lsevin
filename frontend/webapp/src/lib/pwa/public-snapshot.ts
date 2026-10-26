// Only these guest pages can be saved. Never include account routes here.
const locale = "(?:en|fa|tr|es|ar|ku|de|fr|ru|tg|zh)";
const publicPage = new RegExp(
  `^/${locale}(?:/?|/service-providers/[a-zA-Z0-9-]+|/type/[a-zA-Z0-9-]+|/n/app/mobile/(?:home|providers|explore|categories|featured|search|search-results|provider/[a-zA-Z0-9-]+|specialist/[a-zA-Z0-9-]+|service/[a-zA-Z0-9-]+))/?$`
);
export const PUBLIC_PAGE_CACHE = "lsevin-pwa-pages-v1";
export const PUBLIC_PAGE_TTL = 24 * 60 * 60 * 1000;

export function canSavePublicPage(pathname: string) {
  return publicPage.test(pathname);
}

export function extractPublicPage(html: string, pathname: string) {
  // Template contents stay disconnected and cannot load images/iframes or run
  // scripts. Persist only text, never this parsed DOM or its serialized HTML.
  const template = document.createElement("template");
  template.innerHTML = html;
  const title = template.content.querySelector("title")?.textContent;
  // Next streams completed Suspense segments outside main. Include their guest
  // text without executing the scripts that move those segments into place.
  const content = template.content;
  content
    .querySelectorAll(
      "script,style,template,noscript,nav,header,footer,aside,form,button,input,select,textarea,svg,title,meta,link,img,iframe,object,embed,audio,video,source"
    )
    .forEach((node) => node.remove());
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  const blocks: string[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const value = node.textContent?.trim();
    if (value) blocks.push(value);
  }
  const text = blocks
    .join("\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim()
    .slice(0, 16000);
  return {
    pathname,
    title: (title || "LSevin").slice(0, 200),
    text,
    savedAt: Date.now(),
  };
}

export async function savePublicPage(pathname: string, signal: AbortSignal) {
  if (!canSavePublicPage(pathname)) return;
  const cache = await caches.open(PUBLIC_PAGE_CACHE);
  const previous = await cache.match(pathname);
  if (previous && Date.now() - (await previous.json()).savedAt < 30 * 60 * 1000)
    return;
  // Signed-in HTML can contain serialized access/refresh tokens even on public
  // pages. Fetch a separate guest view and persist only extracted reading text.
  const response = await fetch(pathname, {
    credentials: "omit",
    cache: "no-store",
    signal,
  });
  if (
    !response.ok ||
    response.redirected ||
    !response.headers.get("content-type")?.includes("text/html")
  )
    return;
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let html = "";
  let bytes = 0;
  let partial = false;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      const value = chunk.value.subarray(0, 2 * 1024 * 1024 - bytes);
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (bytes >= 2 * 1024 * 1024) {
        partial = true;
        await reader.cancel();
        break;
      }
    }
    html += decoder.decode();
  } catch {
    // Keep useful reading text on a slow/broken body, but not when deliberately
    // cancelled by navigation/unmount. Incomplete pages are explicitly marked.
    if (signal.aborted && signal.reason?.name !== "TimeoutError") return;
    partial = true;
  } finally {
    reader.releaseLock();
  }
  const snapshot = { ...extractPublicPage(html, pathname), partial };
  if (!snapshot.text) return;
  await cache.put(
    pathname,
    new Response(JSON.stringify(snapshot), {
      headers: { "Content-Type": "application/json" },
    })
  );
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - 36)).map((key) => cache.delete(key))
  );
}
