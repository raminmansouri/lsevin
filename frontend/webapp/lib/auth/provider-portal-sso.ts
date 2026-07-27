import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const LSEVIN_PROVIDER_SSO_COOKIE = "lsevin_provider_sso";
export const LSEVIN_SHARED_LOCALE_COOKIE = "LSEVIN_LOCALE";
export const LSEVIN_PROVIDER_SSO_MAX_AGE = 60 * 60 * 24 * 30;
export const LSEVIN_PROVIDER_BRIDGE_MAX_AGE = 90;

const SSO_VERSION = 2;
const SSO_ISSUER = "lsevin-main-platform";
const SSO_AUDIENCE = "lsevin-providers-portal-bridge";
const CLOCK_SKEW_SECONDS = 30;

type ProviderBridgePayload = {
  v: number;
  sub: string;
  returnTo: string;
  locale?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

function secret() {
  return process.env.LSEVIN_SSO_SECRET?.trim() || process.env.AUTH_SECRET?.trim() || "";
}

export function isProviderPortalSsoConfigured() {
  return Boolean(secret());
}

function decode(value: string) {
  return Buffer.from(value, "base64url");
}

export function createProviderPortalBridgeToken(userId: string, returnTo: string, locale?: string) {
  const currentSecret = secret();
  if (!currentSecret) throw new Error("LSEVIN_SSO_SECRET or AUTH_SECRET is required for provider portal SSO.");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    v: SSO_VERSION,
    sub: userId,
    returnTo,
    locale,
    iat: now,
    exp: now + LSEVIN_PROVIDER_BRIDGE_MAX_AGE,
    iss: SSO_ISSUER,
    aud: SSO_AUDIENCE,
  } satisfies ProviderBridgePayload), "utf8").toString("base64url");
  const signature = createHmac("sha256", currentSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyProviderPortalBridgeToken(token?: string | null): ProviderBridgePayload | null {
  const currentSecret = secret();
  const normalized = String(token || "").trim();
  if (!currentSecret || !normalized || normalized.length > 8192) return null;

  const [encodedPayload, encodedSignature, extra] = normalized.split(".");
  if (!encodedPayload || !encodedSignature || extra) return null;

  const expected = createHmac("sha256", currentSecret).update(encodedPayload).digest();
  let actual: Buffer;
  try { actual = decode(encodedSignature); } catch { return null; }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  let payload: ProviderBridgePayload;
  try { payload = JSON.parse(decode(encodedPayload).toString("utf8")) as ProviderBridgePayload; } catch { return null; }
  const now = Math.floor(Date.now() / 1000);
  if (
    payload.v !== SSO_VERSION ||
    payload.iss !== SSO_ISSUER ||
    payload.aud !== SSO_AUDIENCE ||
    typeof payload.sub !== "string" ||
    typeof payload.returnTo !== "string" ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number" ||
    payload.iat > now + CLOCK_SKEW_SECONDS ||
    payload.exp <= now ||
    payload.exp - payload.iat > LSEVIN_PROVIDER_BRIDGE_MAX_AGE + CLOCK_SKEW_SECONDS
  ) return null;
  return payload;
}

// Kept for logout compatibility with Batch 10's shared-domain cookie.
export function lsevinSharedCookieDomain(hostname: string) {
  const configured = process.env.LSEVIN_COOKIE_DOMAIN?.trim();
  if (configured) return configured;
  const host = hostname.toLowerCase();
  if (host === "lsevin.com" || host.endsWith(".lsevin.com")) return ".lsevin.com";
  return undefined;
}
