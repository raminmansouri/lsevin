import type { NextRequest } from "next/server";

const DEFAULT_PUBLIC_ORIGIN = "https://appmain.lsevin.com";
const INTERNAL_HOSTS = new Set(["0.0.0.0", "127.0.0.1", "localhost", "::1", "[::1]"]);

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

function normalizedConfiguredOrigin(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (process.env.NODE_ENV === "production" && INTERNAL_HOSTS.has(url.hostname.toLowerCase())) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function forwardedOrigin(request: NextRequest) {
  const host = firstHeaderValue(request.headers.get("x-forwarded-host")) || firstHeaderValue(request.headers.get("host"));
  if (!host) return null;

  const hostname = host.replace(/^\[/, "").replace(/\](:\d+)?$/, "").split(":")[0]?.toLowerCase() || "";
  if (process.env.NODE_ENV === "production" && INTERNAL_HOSTS.has(hostname)) return null;

  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol = forwardedProto === "http" || forwardedProto === "https"
    ? forwardedProto
    : process.env.NODE_ENV === "production"
      ? "https"
      : request.nextUrl.protocol.replace(":", "") || "http";

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

export function publicAppOrigin(request: NextRequest) {
  const configured = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.AUTH_URL,
  ]
    .map(normalizedConfiguredOrigin)
    .find(Boolean);

  if (configured) return configured;

  const forwarded = forwardedOrigin(request);
  if (forwarded) return forwarded;

  const requestOrigin = normalizedConfiguredOrigin(request.nextUrl.origin);
  if (requestOrigin) return requestOrigin;

  return DEFAULT_PUBLIC_ORIGIN;
}

export function publicAppUrl(request: NextRequest, pathOrUrl: string | URL) {
  return new URL(pathOrUrl.toString(), publicAppOrigin(request));
}
