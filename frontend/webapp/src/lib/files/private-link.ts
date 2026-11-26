import "server-only";

import { createHmac } from "node:crypto";

/**
 * Private files (patients' medical documents and consultation photos) are stored under
 * `Private/`. The API's /files route never serves them to the public; it only answers a
 * short-lived link signed with FILES_PRIVATE_LINK_SECRET, which the API checks with the same
 * secret (FileUploadOptions__PrivateLinkSecret). Sign only after your own permission check,
 * and only on the server: the secret never reaches the browser.
 */
export const PRIVATE_FILE_PREFIX = "Private/";

/** Longest a link may live; the API refuses anything over 15 minutes. */
const DEFAULT_TTL_SECONDS = 120;

function filesBase(): string | null {
  const base = process.env.NEXT_PUBLIC_FILES_URL?.trim().replace(/\/+$/, "");
  return base || null;
}

/** The stored path relative to the files host, or null when it is not on that host. */
export function toStoredRelativePath(fileUrl: string | null | undefined): string | null {
  const trimmed = String(fileUrl ?? "").trim();
  if (!trimmed) return null;
  let path = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    const base = filesBase();
    if (!base) return null;
    try {
      const url = new URL(trimmed);
      const baseUrl = new URL(`${base}/`);
      if (url.origin !== baseUrl.origin || !url.pathname.startsWith(baseUrl.pathname)) return null;
      path = decodeURIComponent(url.pathname.slice(baseUrl.pathname.length));
    } catch {
      return null;
    }
  }
  path = path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^files\//, "");
  if (!path || path.split("/").some((segment) => segment === "..")) return null;
  return path;
}

export function isPrivateFilePath(fileUrl: string | null | undefined): boolean {
  return toStoredRelativePath(fileUrl)?.startsWith(PRIVATE_FILE_PREFIX) ?? false;
}

/**
 * A URL the server can fetch the stored bytes from: public files as they are, private
 * files with a fresh signature. Null when the file is not on the files host, or is private
 * and no secret is configured.
 */
export function storedFileFetchUrl(fileUrl: string | null | undefined, ttlSeconds = DEFAULT_TTL_SECONDS): URL | null {
  const base = filesBase();
  const path = toStoredRelativePath(fileUrl);
  if (!base || !path) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`${base}/${encoded}`);
  if (!path.startsWith(PRIVATE_FILE_PREFIX)) return url;

  const secret = process.env.FILES_PRIVATE_LINK_SECRET?.trim();
  if (!secret) return null;
  const exp = String(Math.floor(Date.now() / 1000) + Math.min(Math.max(ttlSeconds, 10), 900));
  const sig = createHmac("sha256", secret).update(`${path}\n${exp}`).digest("base64url");
  url.searchParams.set("exp", exp);
  url.searchParams.set("sig", sig);
  return url;
}

/** Streams a stored file back to the browser without ever exposing its storage URL. */
export async function proxyStoredFile(
  fileUrl: string,
  opts: { mimeType?: string | null; fileName?: string | null }
): Promise<Response> {
  const source = storedFileFetchUrl(fileUrl);
  if (!source) return new Response(null, { status: 404 });
  let upstream: Response;
  try {
    upstream = await fetch(source, { cache: "no-store", redirect: "error" });
  } catch {
    return new Response(null, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
  }
  const name = opts.fileName || "file";
  const fallback = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const headers = new Headers({
    "Content-Type": opts.mimeType || upstream.headers.get("content-type") || "application/octet-stream",
    "Content-Disposition": `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);
  return new Response(upstream.body, { status: 200, headers });
}
