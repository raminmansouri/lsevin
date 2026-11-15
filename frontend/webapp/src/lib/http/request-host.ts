import "server-only";

import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";

import { normalizeHost } from "./host";

export { normalizeHost };

/**
 * The public domain the current request arrived on, for settings that differ per domain
 * (Enamad seal, Zibal merchant token). lsevincare.com and appmain.lsevin.com are served by
 * the same pods, so this can only come from the request, never from the build.
 *
 * A Host header is client-controlled: callers must only use the result to look up a value
 * the admin configured for that exact host, never trust it on its own.
 */

/** Like normalizeHost, but keeps localhost/IPs for local development and tests. */
function requestHostname(value: string | null | undefined): string | null {
  const host = normalizeHost(value);
  if (host) return host;
  if (process.env.NODE_ENV === "production") return null;
  const raw = String(value ?? "").trim().toLowerCase().split(",")[0]!.trim().replace(/:\d+$/, "");
  return raw === "localhost" || /^\d+(\.\d+){3}$/.test(raw) ? raw : null;
}

/** The request's public host (x-forwarded-host first: B and A sit behind Caddy/Cloudflare/Arvan). */
export async function currentRequestHost(): Promise<string | null> {
  try {
    const h = await headers();
    return requestHostname(h.get("x-forwarded-host")) ?? requestHostname(h.get("host"));
  } catch (error) {
    // Next's own signals (dynamic rendering, postpone) must reach Next.
    unstable_rethrow(error);
    // Outside a request (build, background job): there is no domain to decide by.
    return null;
  }
}

/**
 * Origin of the current request ("https://lsevin.ir"). HTTPS in production regardless of what
 * the proxy forwards; plain http only for local hosts in development.
 */
export async function currentRequestOrigin(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = String(h.get("x-forwarded-host") || h.get("host") || "").split(",")[0]!.trim().toLowerCase();
    // Build the origin only from a header that is exactly host[:port]; keep "www." as the
    // visitor typed it (sessions are host cookies).
    const match = /^([a-z0-9.-]+)(:\d{1,5})?$/.exec(forwarded);
    if (!match || !requestHostname(match[1])) return null;
    if (process.env.NODE_ENV === "production") {
      return normalizeHost(match[1]) ? `https://${match[1]}` : null;
    }
    const proto = (h.get("x-forwarded-proto") || "").split(",")[0]!.trim();
    return `${proto === "https" ? "https" : "http"}://${match[1]}${match[2] ?? ""}`;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
