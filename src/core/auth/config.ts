import "server-only";

export const PORTAL_SESSION_COOKIE = "lsevin_provider_session";
export const PORTAL_SSO_STATE_COOKIE = "lsevin_provider_sso_state";
export const PORTAL_SSO_RETURN_COOKIE = "lsevin_provider_sso_return";
export const PORTAL_SESSION_TTL_SECONDS = 15 * 60;
export const PORTAL_SSO_TOKEN_TTL_SECONDS = 90;

export function providerPortalOrigin() {
  return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").origin;
}

export function appmainOrigin() {
  return new URL(process.env.LSEVIN_APPMAIN_URL || "https://appmain.lsevin.com").origin;
}

export function ssoSecret() {
  const secret = process.env.LSEVIN_PROVIDER_SSO_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("LSEVIN_PROVIDER_SSO_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export function sharedCookieDomain() {
  const configured = process.env.LSEVIN_SHARED_COOKIE_DOMAIN?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? ".lsevin.com" : undefined;
}

export function secureCookies() {
  return process.env.NODE_ENV === "production";
}

export function safeLocalReturnTo(value?: string | null) {
  const target = String(value || "/dashboard").trim();
  if (!target.startsWith("/") || target.startsWith("//") || target.includes("\\")) return "/dashboard";
  try {
    const parsed = new URL(target, providerPortalOrigin());
    return parsed.origin === providerPortalOrigin() ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
